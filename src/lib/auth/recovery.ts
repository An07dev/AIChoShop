import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "./password";
import { recoveryMailConfig, sendRecoveryMail } from "./recovery-mail";
import { audit } from "./audit";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export async function requestRecovery(email: string) {
  recoveryMailConfig();
  const token = randomBytes(32).toString("hex");
  const request = await prisma.$transaction(async tx => {
    const users = await tx.user.findMany({ where: { email: { equals: email, mode: "insensitive" }, isLocked: false }, take: 2 });
    if (users.length !== 1) return null;
    const user = users[0];
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
    const current = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
    if (current.isLocked) return null;
    const existing = await tx.passwordReset.findFirst({ where: { userId: user.id, consumedAt: null, deliveryStatus: { in: ["PENDING", "SENT"] }, createdAt: { gt: new Date(Date.now() - 60000) } } });
    if (existing) return null;
    // An unauthenticated new request must not invalidate a link already in the mailbox.
    return tx.passwordReset.create({ data: { userId: user.id, tokenHash: digest(token), passwordVersion: digest(current.password), expiresAt: new Date(Date.now() + 15 * 60000) } });
  });
  if (!request) return;
  try {
    await sendRecoveryMail(email, token, request.id);
    await prisma.passwordReset.update({ where: { id: request.id }, data: { deliveryStatus: "SENT" } });
  } catch {
    await prisma.passwordReset.update({ where: { id: request.id }, data: { deliveryStatus: "FAILED" } });
    // Do not expose delivery outcomes as an account-existence oracle.
    console.error("password_recovery_delivery_failed", { requestId: request.id });
  }
}

export async function consumeRecovery(token: string, password: string) {
  if (!/^[a-f0-9]{64}$/.test(token) || typeof password !== "string" || password.length < 6 || password.length > 256) throw new Error("Link hoặc mật khẩu không hợp lệ.");
  const next = await hashPassword(password);
  await prisma.$transaction(async tx => {
    const request = await tx.passwordReset.findUnique({ where: { tokenHash: digest(token) } });
    if (!request) throw new Error("Link đã hết hạn hoặc đã sử dụng.");
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${request.userId} FOR UPDATE`;
    const current = await tx.passwordReset.findUniqueOrThrow({ where: { id: request.id } });
    const user = await tx.user.findUniqueOrThrow({ where: { id: request.userId } });
    if (current.tokenHash !== digest(token) || current.consumedAt || !current.expiresAt || current.expiresAt <= new Date() || current.passwordVersion !== digest(user.password) || user.isLocked) throw new Error("Link đã hết hạn hoặc đã sử dụng.");
    await tx.user.update({ where: { id: user.id }, data: { password: next } });
    await tx.passwordReset.updateMany({ where: { userId: user.id, consumedAt: null }, data: { consumedAt: new Date() } });
    await tx.seoSession.deleteMany({ where: { userId: user.id } });
    await audit(tx, user.id, "PASSWORD_RESET_COMPLETED", user.id);
  });
}
