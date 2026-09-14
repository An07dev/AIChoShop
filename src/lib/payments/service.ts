import { randomBytes } from "node:crypto";
import type { Prisma, Transaction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractPaymentCode, nextVipExpiry, normalizeAccount, paymentReviewReason, type BankEvent } from "./policy";

type PaymentConfig = { bankName: string; accountNumber: string; accountHolder: string; apiKey: string | null; autoActivate: boolean };
export type PaymentIntentView = {
  id: string; paymentCode: string; amount: number; planName: string; expiresAt: string;
  bankName: string; accountNumber: string; accountHolder: string;
};

function intentView(intent: Transaction): PaymentIntentView {
  if (!intent.paymentCode || !intent.expiresAt || !intent.planName || !intent.bankName || !intent.accountNumber || !intent.accountHolder) throw new Error("Yêu cầu thanh toán thiếu dữ liệu.");
  return { id: intent.id, paymentCode: intent.paymentCode, amount: intent.amount, planName: intent.planName,
    expiresAt: intent.expiresAt.toISOString(), bankName: intent.bankName, accountNumber: intent.accountNumber, accountHolder: intent.accountHolder };
}

export async function createPaymentIntent(userId: string, planId: string, config: PaymentConfig) {
  if (!config.apiKey?.trim() || !config.bankName.trim() || !config.accountHolder.trim() || !/^[A-Z0-9]{4,50}$/.test(normalizeAccount(config.accountNumber))) {
    throw new Error("Cổng thanh toán chưa được cấu hình đầy đủ. Vui lòng liên hệ hỗ trợ.");
  }
  if (typeof planId !== "string" || !planId || planId.length > 100) throw new Error("Gói thanh toán không hợp lệ.");
  return prisma.$transaction(async tx => {
    const users = await tx.$queryRaw<{ isLocked: boolean }[]>`SELECT "isLocked" FROM "User" WHERE id = ${userId} FOR UPDATE`;
    if (!users[0] || users[0].isLocked) throw new Error("Tài khoản không thể tạo thanh toán.");
    const plan = await tx.vipPlan.findUnique({ where: { id: planId } });
    if (!plan?.active || !Number.isSafeInteger(plan.price) || plan.price <= 0 || plan.price > 2147483647 || (plan.durationDays !== null && (!Number.isSafeInteger(plan.durationDays) || plan.durationDays < 0 || plan.durationDays > 36500))) throw new Error("Gói không còn bán hoặc có cấu hình không hợp lệ.");
    const now = new Date();
    // Reuse a still-payable snapshot for repeated clicks; changing plans creates a different code.
    const pending = await tx.transaction.findFirst({ where: { userId, planId, status: "PENDING", expiresAt: { gt: now }, paymentCode: { not: null }, amount: plan.price, durationDays: plan.durationDays,
      accountNumber: normalizeAccount(config.accountNumber), bankName: config.bankName.trim(), accountHolder: config.accountHolder.trim() }, orderBy: { createdAt: "desc" } });
    if (pending) return intentView(pending);
    const count = await tx.transaction.count({ where: { userId, createdAt: { gte: new Date(now.getTime() - 3600000) }, paymentCode: { not: null } } });
    if (count >= 10) throw new Error("Bạn đã tạo nhiều yêu cầu thanh toán. Vui lòng thử lại sau.");
    const intent = await tx.transaction.create({ data: {
      userId, amount: plan.price, status: "PENDING", type: "UPGRADE_VIP", planId: plan.id, planName: plan.name,
      durationDays: plan.durationDays, currency: "VND", paymentCode: `ACS${randomBytes(8).toString("hex").toUpperCase()}`,
      bankName: config.bankName.trim(), accountNumber: normalizeAccount(config.accountNumber), accountHolder: config.accountHolder.trim(),
      expiresAt: new Date(now.getTime() + 30 * 60000),
    } });
    return intentView(intent);
  });
}

async function lockIntent(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM "Transaction" WHERE id = ${id} FOR UPDATE`;
  return tx.transaction.findUnique({ where: { id } });
}

async function activate(tx: Prisma.TransactionClient, intent: Transaction, eventId: string, approvedBy: string | null, now: Date) {
  const users = await tx.$queryRaw<{ id: string; isVIP: boolean; vipExpiresAt: Date | null; isLocked: boolean }[]>`
    SELECT id, "isVIP", "vipExpiresAt", "isLocked" FROM "User" WHERE id = ${intent.userId} FOR UPDATE`;
  const user = users[0];
  if (!user || user.isLocked) return false;
  await tx.user.update({ where: { id: user.id }, data: { isVIP: true, vipExpiresAt: nextVipExpiry(user, intent.durationDays, now) } });
  await tx.transaction.update({ where: { id: intent.id }, data: { status: "SUCCESS", sepayId: eventId, paidAt: now, approvedBy } });
  await tx.paymentWebhookEvent.update({ where: { id: eventId }, data: { status: "APPLIED", reason: null, transactionId: intent.id, processedAt: now, approvedBy } });
  return true;
}

export async function processBankEvent(event: BankEvent, autoActivate: boolean) {
  return prisma.$transaction(async tx => {
    const inserted = await tx.paymentWebhookEvent.createMany({ data: [{ ...event, status: "RECEIVED" }], skipDuplicates: true });
    if (inserted.count === 0) {
      const previous = await tx.paymentWebhookEvent.findUniqueOrThrow({ where: { id: event.id } });
      if (previous.amount !== event.amount || previous.accountNumber !== event.accountNumber || previous.content !== event.content || previous.transferType !== event.transferType) throw new Error("EVENT_ID_CONFLICT");
      return { status: previous.status, duplicate: true };
    }
    const now = new Date();
    if (event.transferType === "out") {
      await tx.paymentWebhookEvent.update({ where: { id: event.id }, data: { status: "IGNORED", reason: "OUTGOING_TRANSFER", processedAt: now } });
      return { status: "IGNORED", duplicate: false };
    }
    const code = extractPaymentCode(event.content);
    const candidate = code ? await tx.transaction.findUnique({ where: { paymentCode: code } }) : null;
    const intent = candidate ? await lockIntent(tx, candidate.id) : null;
    let reason = intent ? paymentReviewReason(intent, event, now) : "UNKNOWN_PAYMENT_CODE";
    if (!reason && !autoActivate) reason = "AUTO_ACTIVATION_DISABLED";
    if (intent && !reason && await activate(tx, intent, event.id, null, now)) return { status: "APPLIED", duplicate: false };
    if (!reason) reason = "ACCOUNT_LOCKED";
    await tx.paymentWebhookEvent.update({ where: { id: event.id }, data: { status: "REVIEW", reason, transactionId: intent?.id ?? null, processedAt: now } });
    if (intent && ["PENDING", "EXPIRED"].includes(intent.status)) await tx.transaction.update({ where: { id: intent.id }, data: { status: "REVIEW" } });
    return { status: "REVIEW", duplicate: false };
  }, { maxWait: 5000, timeout: 15000 });
}

export async function approvePaymentIntent(intentId: string, adminId: string) {
  // Approval requires a durable authenticated bank event; a pending checkout alone is insufficient.
  const events = await prisma.paymentWebhookEvent.findMany({ where: { transactionId: intentId, status: "REVIEW" }, orderBy: { receivedAt: "asc" } });
  const snapshot = await prisma.transaction.findUnique({ where: { id: intentId } });
  if (!snapshot) throw new Error("Không tìm thấy yêu cầu thanh toán.");
  const event = events.find(item => item.transferType === "in" && !paymentReviewReason(snapshot, { ...item, transferType: "in" }, new Date(), true));
  if (!event) throw new Error("Chưa có giao dịch ngân hàng khớp mã, tài khoản và số tiền để duyệt.");
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "PaymentWebhookEvent" WHERE id = ${event.id} FOR UPDATE`;
    const currentEvent = await tx.paymentWebhookEvent.findUniqueOrThrow({ where: { id: event.id } });
    const intent = await lockIntent(tx, intentId);
    if (!intent || currentEvent.status !== "REVIEW" || paymentReviewReason(intent, { ...currentEvent, transferType: "in" }, new Date(), true)) throw new Error("Giao dịch đã thay đổi hoặc đã được xử lý.");
    if (!await activate(tx, intent, event.id, adminId, new Date())) throw new Error("Tài khoản đang bị khóa.");
  });
}

export async function cancelUnpaidIntent(intentId: string) {
  return prisma.$transaction(async tx => {
    const intent = await lockIntent(tx, intentId);
    if (!intent || intent.status !== "PENDING" || intent.paidAt || intent.sepayId || await tx.paymentWebhookEvent.count({ where: { transactionId: intentId } })) {
      throw new Error("Chỉ được hủy yêu cầu chưa nhận tiền. Giao dịch đã ghi nhận phải được giữ để đối soát.");
    }
    await tx.transaction.update({ where: { id: intentId }, data: { status: "CANCELLED" } });
  });
}
