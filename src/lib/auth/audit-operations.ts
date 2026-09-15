import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "./audit";

// Only explicitly allowlisted scalar fields can enter an audit snapshot.
const fields = ["isVIP", "isLocked", "active", "isPopular", "price", "originalPrice", "durationDays", "order", "dailyFreeLimit", "defaultDailyFreeLimit", "isOpenAiActive", "autoActivate", "commissionRate", "transactionRate", "orderProcessingFee"];
export async function auditedWrite<T>(actorId: string, action: string, work: (tx: Prisma.TransactionClient) => Promise<T>, targetId = "default") {
  return prisma.$transaction(async tx => {
    const result = await work(tx);
    const row = result && typeof result === "object" ? result as Record<string, unknown> : {};
    const details: Record<string, boolean | number | null> = {};
    for (const key of fields) if (typeof row[key] === "boolean" || typeof row[key] === "number" || row[key] === null) details[key] = row[key] as boolean | number | null;
    await audit(tx, actorId, action, typeof row.id === "string" ? row.id : targetId, details);
    return result;
  });
}

// Failure logging must never turn an authorization denial into access, or mask
// the original error when the database itself is unavailable. Emit a signal then.
export async function securityEvent(actorId: string, action: string, targetId: string, details?: Record<string, boolean | number | null>) {
  try { await audit(prisma, actorId, action, targetId.slice(0, 180), details); }
  catch { console.error("security_audit_unavailable", { action }); }
}

export async function auditOutcome<T>(actorId: string, operation: string, work: () => Promise<T>) {
  try {
    const result = await work();
    const failed = result instanceof Response ? !result.ok : result && typeof result === "object" && "success" in result && result.success === false;
    if (failed) await securityEvent(actorId, "ADMIN_OPERATION_REJECTED", operation);
    return result;
  } catch (error) {
    await securityEvent(actorId, "ADMIN_OPERATION_FAILED", operation);
    throw error;
  }
}
