import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export class AuthRateLimitError extends Error {
  constructor() { super("Bạn đã thử quá nhiều lần. Vui lòng chờ 15 phút rồi thử lại."); }
}

// Database counters are shared by every app instance. Do not trust arbitrary
// X-Forwarded-For headers or fall back to process-local counters on DB failure.
export async function limitAuthAttempts(action: "login" | "register", email: string) {
  const subject = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  const windowMs = 15 * 60 * 1000;
  const start = Math.floor(Date.now() / windowMs) * windowMs;
  const expiresAt = new Date(start + windowMs);
  const limits = [
    { key: `${action}:global:${start}`, max: action === "login" ? 300 : 60 },
    { key: `${action}:email:${subject}:${start}`, max: action === "login" ? 10 : 5 },
  ];
  await prisma.$transaction(async tx => {
    for (const limit of limits) {
      const rows = await tx.$queryRaw<{ attempts: number }[]>`
        INSERT INTO "AuthRateLimit" ("id", "attempts", "expiresAt") VALUES (${limit.key}, 1, ${expiresAt})
        ON CONFLICT ("id") DO UPDATE SET "attempts" = "AuthRateLimit"."attempts" + 1
        RETURNING "attempts"`;
      if (rows[0].attempts > limit.max) throw new AuthRateLimitError();
    }
    await tx.$executeRaw`DELETE FROM "AuthRateLimit" WHERE "expiresAt" < ${new Date(start - 86_400_000)}`;
  });
}
