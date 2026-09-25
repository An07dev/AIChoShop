import type { Prisma } from "@prisma/client";
import { randomUUID, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashToken, SEO_SESSION_COOKIE } from "./session";
import { SeoError } from "./contract";
import { reservePolicy, type UsageState } from "./usage-policy";

export async function seoIdentity() {
  const store = await cookies();
  const token = store.get(SEO_SESSION_COOKIE)?.value;
  if (token) {
    const users = await prisma.$queryRaw<{ id: string; isLocked: boolean }[]>`
      SELECT u."id", u."isLocked" FROM "SeoSession" s JOIN "User" u ON u."id" = s."userId"
      WHERE s."tokenHash" = ${hashToken(token)} AND s."expiresAt" > NOW()`;
    if (users[0]?.isLocked) throw new SeoError("ACCOUNT_LOCKED", "Tài khoản đang bị khóa. Vui lòng liên hệ hỗ trợ.", 403);
    if (users[0]) return { id: `user:${users[0].id}`, userId: users[0].id, anonymous: false };
  }
  let visitor = store.get("seo_visitor")?.value;
  const known = visitor && /^[a-f0-9]{64}$/.test(visitor)
    ? await prisma.$queryRaw<{ id: string }[]>`SELECT "id" FROM "SeoUsage" WHERE "id" = ${`anon:${hashToken(visitor)}`}` : [];
  if (!known.length) {
    visitor = randomBytes(32).toString("hex");
    await prisma.$executeRaw`INSERT INTO "SeoUsage" ("id") VALUES (${`anon:${hashToken(visitor)}`}) ON CONFLICT ("id") DO NOTHING`;
    store.set("seo_visitor", visitor, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 3600,
    });
  }
  return { id: `anon:${hashToken(visitor!)}`, anonymous: true };
}

export async function reserveSeo(identity: { id: string; anonymous: boolean }) {
  const runId = randomUUID();
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`INSERT INTO "SeoUsage" ("id") VALUES (${identity.id}) ON CONFLICT ("id") DO NOTHING`;
    const rows = await tx.$queryRaw<UsageState[]>`SELECT * FROM "SeoUsage" WHERE "id" = ${identity.id} FOR UPDATE`;
    const next = reservePolicy(rows[0], identity.anonymous, new Date());
    await tx.$executeRaw`UPDATE "SeoUsage" SET "attempts" = ${next.attempts}, "windowStart" = ${next.windowStart},
      "leaseId" = ${runId}, "leaseUntil" = ${next.leaseUntil}, "updatedAt" = NOW() WHERE "id" = ${identity.id}`;
    await tx.$executeRaw`INSERT INTO "SeoRun" ("id", "subject", "status") VALUES (${runId}, ${identity.id}, 'pending')`;
  });
  return runId;
}

export type RunMetrics = { model: string; provider: string; inputTokens: number; outputTokens: number; durationMs: number };
export async function finishSeo(subject: string, runId: string, success: boolean, metrics: RunMetrics, errorCode: string | null, transaction?: Prisma.TransactionClient) {
  const finish = async (tx: Prisma.TransactionClient) => {
    const rows = await tx.$queryRaw<{ successes: number }[]>`UPDATE "SeoUsage"
      SET "successes" = "successes" + ${success ? 1 : 0}, "leaseId" = NULL, "leaseUntil" = NULL, "updatedAt" = NOW()
      WHERE "id" = ${subject} AND "leaseId" = ${runId} RETURNING "successes"`;
    if (!rows[0]) throw new SeoError("REQUEST_EXPIRED", "Yêu cầu đã hết thời gian xử lý. Vui lòng thử lại.", 409);
    await tx.$executeRaw`UPDATE "SeoRun" SET "status" = ${success ? "success" : "failed"}, "model" = ${metrics.model},
      "provider" = ${metrics.provider}, "inputTokens" = ${metrics.inputTokens}, "outputTokens" = ${metrics.outputTokens},
      "durationMs" = ${metrics.durationMs}, "errorCode" = ${errorCode} WHERE "id" = ${runId}`;
    return rows[0].successes;
  };
  return transaction ? finish(transaction) : prisma.$transaction(finish);
}
