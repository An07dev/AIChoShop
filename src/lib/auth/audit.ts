import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Call inside the same transaction as the mutation. No passwords, tokens,
// email addresses or API credentials belong in audit details.
export async function audit(tx: Prisma.TransactionClient, actorId: string, action: string, targetId: string, details?: Record<string, boolean | number | null>) {
  await tx.adminAuditLog.create({ data: { actorId, action, targetId, details: details ? JSON.stringify(details) : null } });
}

export async function auditedUserUpdate(actorId: string, userId: string, action: string, data: Prisma.UserUpdateInput) {
  return prisma.$transaction(async tx => {
    const user = await tx.user.update({ where: { id: userId }, data });
    await audit(tx, actorId, action, userId, { isVIP: user.isVIP, dailyFreeLimit: user.dailyFreeLimit });
    return user;
  });
}
