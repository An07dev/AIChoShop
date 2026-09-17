import { prisma } from "@/lib/prisma";
import { historyCutoff, serializeHistoryInput, sanitizeHistoryOutput, redactText } from "./policy";
import { audit } from "@/lib/auth/audit";
import type { AiUsageLog, Progress, Transaction, Prisma } from "@prisma/client";
export const ERASED_ACTION = "Nội dung lịch sử đã được xóa";
export async function expireHistoryContent(tx: Prisma.TransactionClient, now = new Date()) {
  return tx.aiUsageLog.updateMany({ where: { createdAt: { lt: historyCutoff(now) }, OR: [{ input: { not: null } }, { output: { not: null } }, { action: { not: ERASED_ACTION } }] }, data: { input: null, output: null, action: ERASED_ACTION } });
}
export async function eraseOwnHistory(userId: string) {
  return prisma.$transaction(async tx => {
    const result = await tx.aiUsageLog.updateMany({ where: { userId }, data: { input: null, output: null, action: ERASED_ACTION } });
    await audit(tx, userId, "PERSONAL_HISTORY_ERASED", userId, { count: result.count });
    return result.count;
  });
}
export async function cleanupPrivateContent(now = new Date(), actorId?: string) {
  return prisma.$transaction(async tx => {
    const history = await expireHistoryContent(tx, now);
    const sessions = await tx.seoSession.deleteMany({ where: { expiresAt: { lt: now } } });
    const resets = await tx.passwordReset.updateMany({ where: { expiresAt: { lt: now }, OR: [{ tokenHash: { not: null } }, { passwordVersion: { not: null } }] }, data: { tokenHash: null, passwordVersion: null } });
    const rateLimits = await tx.authRateLimit.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 86400000) } } });
    let cursor: string | undefined; let scrubbed = 0;
    do {
      const rows: Pick<AiUsageLog, "id" | "input" | "output" | "action">[] = await tx.aiUsageLog.findMany({ where: { createdAt: { gte: historyCutoff(now) } }, orderBy: { id: "asc" }, take: 200, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), select: { id: true, input: true, output: true, action: true } });
      for (const row of rows) {
        let parsed: unknown = row.input;
        if (row.input) { try { parsed = JSON.parse(row.input); } catch { /* Historical plain text */ } }
        const input = serializeHistoryInput(parsed), output = sanitizeHistoryOutput(row.output), action = redactText(row.action).slice(0, 300);
        if (input !== row.input || output !== row.output || action !== row.action) { await tx.aiUsageLog.update({ where: { id: row.id }, data: { input, output, action } }); scrubbed++; }
      }
      cursor = rows.length === 200 ? rows.at(-1)!.id : undefined;
    } while (cursor);
    const result = { history: history.count, sessions: sessions.count, resets: resets.count, rateLimits: rateLimits.count, scrubbed };
    if (actorId) await audit(tx, actorId, "PRIVACY_MAINTENANCE", "retention-90-days", result);
    return result;
  });
}
// NDJSON export uses bounded batches and an upper ID/time boundary. No password,
// session/reset token, provider credential, audit details or another user's data.
export async function* exportOwnData(userId: string): AsyncGenerator<unknown, void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, email: true, name: true, phone: true, role: true, isLocked: true, createdAt: true, dailyFreeLimit: true, isVIP: true, vipExpiresAt: true, userCredit: { select: { balance: true } } } });
  const exportedAt = new Date();
  yield { kind: "account", version: 1, exportedAt, user };
  let cursor: string | undefined;
  do {
    const rows: Pick<AiUsageLog, "id" | "tool" | "toolName" | "action" | "input" | "output" | "createdAt">[] = await prisma.aiUsageLog.findMany({ where: { userId, createdAt: { lte: exportedAt } }, orderBy: { id: "asc" }, take: 200, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), select: { id: true, tool: true, toolName: true, action: true, input: true, output: true, createdAt: true } });
    for (const row of rows) {
      let parsed: unknown = row.input;
      if (row.input) { try { parsed = JSON.parse(row.input); } catch { /* Historical plain text */ } }
      yield { kind: "history", ...row, action: redactText(row.action), input: serializeHistoryInput(parsed), output: sanitizeHistoryOutput(row.output), ...(row.createdAt < historyCutoff(exportedAt) ? { action: ERASED_ACTION, input: null, output: null } : {}) };
    }
    cursor = rows.length === 200 ? rows.at(-1)!.id : undefined;
  } while (cursor);
  cursor = undefined;
  do {
    const rows: Pick<Progress, "id" | "lessonId" | "completed" | "positionSeconds" | "lastViewedAt">[] = await prisma.progress.findMany({ where: { userId }, orderBy: { id: "asc" }, take: 200, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), select: { id: true, lessonId: true, completed: true, positionSeconds: true, lastViewedAt: true } });
    for (const row of rows) yield { kind: "progress", ...row };
    cursor = rows.length === 200 ? rows.at(-1)!.id : undefined;
  } while (cursor);
  cursor = undefined;
  do {
    const rows: Pick<Transaction, "id" | "amount" | "currency" | "status" | "type" | "planName" | "createdAt" | "paidAt">[] = await prisma.transaction.findMany({ where: { userId, createdAt: { lte: exportedAt } }, orderBy: { id: "asc" }, take: 200, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), select: { id: true, amount: true, currency: true, status: true, type: true, planName: true, createdAt: true, paidAt: true } });
    for (const row of rows) yield { kind: "payment", ...row };
    cursor = rows.length === 200 ? rows.at(-1)!.id : undefined;
  } while (cursor);
  yield { kind: "complete", version: 1, exportedAt };
}
