import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/auth/audit";
import { validateVipPlan } from "./vip-plan-validation";
import type { Prisma } from "@prisma/client";
async function lock(tx: Prisma.TransactionClient) { await tx.$executeRaw `SELECT pg_advisory_xact_lock(hashtext('admin:vip-plans'))`; }
export async function writeVipPlan(actorId: string, id: string | null, input: unknown, expected?: {
    field: "active" | "isPopular";
    value: boolean;
}) {
    return prisma.$transaction(async (tx) => {
        await lock(tx);
        const existing = id ? await tx.vipPlan.findUnique({ where: { id } }) : undefined;
        if (id && !existing)
            throw Error("Không tìm thấy gói VIP.");
        if (expected && existing && existing[expected.field] !== expected.value)
            throw Error("Gói đã thay đổi. Hãy tải lại trước khi thao tác.");
        const data = validateVipPlan(input, existing ?? undefined);
        const duplicate = await tx.vipPlan.findUnique({ where: { slug: data.slug } });
        if (duplicate && duplicate.id !== id)
            throw Error("Mã gói đã được sử dụng. Hãy chọn mã khác.");
        if (data.isPopular) {
            const others = await tx.vipPlan.findMany({ where: { isPopular: true, ...(id && { NOT: { id } }) }, select: { id: true } });
            for (const other of others) {
                await tx.vipPlan.update({ where: { id: other.id }, data: { isPopular: false } });
                await audit(tx, actorId, "VIP_PLAN_UPDATED", other.id, { isPopular: false });
            }
        }
        const result = id ? await tx.vipPlan.update({ where: { id }, data }) : await tx.vipPlan.create({ data });
        await audit(tx, actorId, id ? "VIP_PLAN_UPDATED" : "VIP_PLAN_CREATED", result.id, { price: result.price, durationDays: result.durationDays, active: result.active, isPopular: result.isPopular });
        return result;
    });
}
export async function removeVipPlan(actorId: string, id: string) {
    return prisma.$transaction(async (tx) => { await lock(tx); if (await tx.transaction.count({ where: { planId: id } }))
        throw Error("Gói đã có giao dịch. Hãy ngừng bán để giữ dữ liệu đối soát."); const result = await tx.vipPlan.delete({ where: { id } }); await audit(tx, actorId, "VIP_PLAN_DELETED", id); return result; });
}
