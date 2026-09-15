import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { isVipActive } from "./vip-expiration";
import { SeoError } from "./seo/contract";

export const AI_TOOLS = [
  "seo-optimizer",
  "script-writer",
  "appeal-generator",
  "ad-copy",
  "review-replier",
  "chat-broadcast",
  "title-spinner",
  "video-repurposer",
  "koc-planner",
  "vision-listing",
  "policy-checker",
];
export function vnDayStart(now = new Date()) {
  return new Date(Math.floor((now.getTime() + 25_200_000) / 86_400_000) * 86_400_000 - 25_200_000);
}
function configuredLimit(key: string, fallback: number) {
  const value = process.env[key];
  if (value === undefined || value === "") return fallback;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`Invalid ${key}`);
  return number;
}

// SeoRun is the durable generation ledger for every AI tool. No database lock is
// held while waiting for a provider. An expired lease cannot commit a result.
export async function reserveAi(userId: string | null, guestSubject?: string) {
  if (process.env.AI_ENABLED === "false") throw new SeoError("AI_DISABLED", "Dịch vụ AI đang tạm dừng.", 503);
  const id = randomUUID();
  const subject = userId ? `user:${userId}` : guestSubject;
  if (!subject) throw new SeoError("LOGIN_REQUIRED", "Vui lòng đăng nhập để sử dụng công cụ.", 401);
  await prisma.$transaction(async tx => {
    // A single short lock makes the global spending guard safe across instances.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(71420931)`;
    const now = new Date();
    const day = vnDayStart(now);
    const alive = new Date(now.getTime() - 150_000);
    const attempts = await tx.seoRun.count({ where: { createdAt: { gte: day }, id: { startsWith: "ai_" } } });
    if (attempts >= configuredLimit("AI_GLOBAL_DAILY_ATTEMPTS", 5000)) throw new SeoError("AI_BUSY", "Hệ thống đã đạt giới hạn xử lý hôm nay. Vui lòng thử lại ngày mai.", 429);
    if (await tx.seoRun.count({ where: { subject, id: { startsWith: "ai_" }, status: "pending", createdAt: { gt: alive } } })) {
      throw new SeoError("REQUEST_IN_PROGRESS", "Một yêu cầu AI đang xử lý. Vui lòng chờ kết quả.", 429);
    }
    if (userId) {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.isLocked) throw new SeoError("LOGIN_REQUIRED", "Phiên đăng nhập không hợp lệ.", 401);
      const limit = isVipActive(user) ? configuredLimit("AI_VIP_DAILY_LIMIT", 200) : user.dailyFreeLimit;
      const count = await tx.aiUsageLog.count({ where: { userId, tool: { in: AI_TOOLS }, createdAt: { gte: day } } });
      if (count >= limit) throw new SeoError("DAILY_LIMIT_EXCEEDED", `Bạn đã dùng hết ${limit} kết quả AI hôm nay. Vui lòng quay lại ngày mai.`, 429);
    }
    await tx.seoRun.create({ data: { id: `ai_${id}`, subject, status: "pending" } });
  });
  return `ai_${id}`;
}

export async function completeAi(id: string, data: { userId: string | null; tool: string; output: string; model: string; inputTokens: number; outputTokens: number }, finalize?: (tx: Prisma.TransactionClient) => Promise<unknown>) {
  return prisma.$transaction(async tx => {
    const result = await tx.seoRun.updateMany({ where: { id, status: "pending", createdAt: { gt: new Date(Date.now() - 150_000) } }, data: { status: "success", model: data.model, inputTokens: data.inputTokens, outputTokens: data.outputTokens } });
    if (result.count !== 1) throw new SeoError("REQUEST_EXPIRED", "Yêu cầu đã hết thời gian xử lý. Vui lòng thử lại.", 409);
    if (data.userId) await tx.aiUsageLog.create({ data: { userId: data.userId, tool: data.tool, toolName: data.tool, action: `Tạo nội dung: ${data.tool}`, output: data.output } });
    if (finalize) await finalize(tx);
  });
}
export async function releaseAi(id: string) {
  await prisma.seoRun.updateMany({ where: { id, status: "pending" }, data: { status: "failed" } });
}
