import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
// Call inside the same transaction as the mutation. No passwords, tokens,
// email addresses or API credentials belong in audit details.
export async function audit(tx: Prisma.TransactionClient, actorId: string, action: string, targetId: string, details?: Record<string, boolean | number | null>) {
    await tx.adminAuditLog.create({ data: { actorId, action, targetId, details: details ? JSON.stringify(details) : null } });
}
export async function auditedUserUpdate(actorId: string, userId: string, action: string, data: Prisma.UserUpdateInput) {
    return prisma.$transaction(async (tx) => {
        const before = action === "VIP_CHANGED" ? (await tx.$queryRaw<{
            isVIP: boolean;
            vipExpiresAt: Date | null;
        }[]> `SELECT "isVIP","vipExpiresAt" FROM "User" WHERE id=${userId} FOR UPDATE`)[0] : undefined;
        const user = await tx.user.update({ where: { id: userId }, data });
        if (before) {
            const now = new Date(), wasActive = before.isVIP && (!before.vipExpiresAt || before.vipExpiresAt > now), active = user.isVIP && (!user.vipExpiresAt || user.vipExpiresAt > now);
            const changed = before.isVIP !== user.isVIP || (before.vipExpiresAt?.getTime() ?? null) !== (user.vipExpiresAt?.getTime() ?? null);
            if (changed && (active || wasActive))
                await tx.vipGrantEvent.create({ data: { userId, source: "MANUAL", kind: active ? (wasActive ? "RENEWAL" : "NEW") : "REVOKED", actorId } });
        }
        await audit(tx, actorId, action, userId, { isVIP: user.isVIP, dailyFreeLimit: user.dailyFreeLimit });
        return user;
    });
}
