"use server";
import { requireAdmin } from "@/lib/auth/session";
import { auditOutcome } from "@/lib/auth/audit-operations";
import { audit } from "@/lib/auth/audit";
import { safeOperationMessage } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DEFAULT_VIP_PLANS } from "@/lib/vip-plans";
import { writeVipPlan, removeVipPlan } from "@/lib/admin/vip-plan-service";
function refresh() { for (const path of ["/admin/vip-plans", "/profile", "/"])
    revalidatePath(path); }
export async function getAdminVipPlans() { await requireAdmin("getAdminVipPlans"); return { success: true, data: await prisma.vipPlan.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }) }; }
export async function createVipPlan(data: unknown) { const admin = await requireAdmin("createVipPlan"); return auditOutcome(admin.id, "createVipPlan", async () => { try {
    const result = await writeVipPlan(admin.id, null, data);
    refresh();
    return { success: true, data: result };
}
catch (error) {
    return { success: false, error: safeOperationMessage(error, "Không tạo được gói VIP.") };
} }); }
export async function updateVipPlan(id: string, data: unknown) { const admin = await requireAdmin("updateVipPlan"); return auditOutcome(admin.id, "updateVipPlan", async () => { try {
    const result = await writeVipPlan(admin.id, id, data);
    refresh();
    return { success: true, data: result };
}
catch (error) {
    return { success: false, error: safeOperationMessage(error, "Không cập nhật được gói VIP.") };
} }); }
export async function toggleVipPlanActive(id: string, currentActive: boolean) { const admin = await requireAdmin("toggleVipPlanActive"); return auditOutcome(admin.id, "toggleVipPlanActive", async () => { try {
    if (typeof currentActive !== "boolean")
        throw Error("Trạng thái gói không hợp lệ.");
    const result = await writeVipPlan(admin.id, id, { active: !currentActive }, { field: "active", value: currentActive });
    refresh();
    return { success: true, active: result.active };
}
catch (error) {
    return { success: false, error: safeOperationMessage(error, "Không đổi được trạng thái gói.") };
} }); }
export async function toggleVipPlanPopular(id: string, currentPopular: boolean) { const admin = await requireAdmin("toggleVipPlanPopular"); return auditOutcome(admin.id, "toggleVipPlanPopular", async () => { try {
    if (typeof currentPopular !== "boolean")
        throw Error("Trạng thái gói không hợp lệ.");
    const result = await writeVipPlan(admin.id, id, { isPopular: !currentPopular }, { field: "isPopular", value: currentPopular });
    refresh();
    return { success: true, isPopular: result.isPopular };
}
catch (error) {
    return { success: false, error: safeOperationMessage(error, "Không đổi được nhãn gói.") };
} }); }
export async function deleteVipPlan(id: string) { const admin = await requireAdmin("deleteVipPlan"); return auditOutcome(admin.id, "deleteVipPlan", async () => { try {
    await removeVipPlan(admin.id, id);
    refresh();
    return { success: true, message: "Đã xóa gói chưa có giao dịch." };
}
catch (error) {
    return { success: false, error: safeOperationMessage(error, "Không xóa được gói VIP.") };
} }); }
export async function seedDefaultVipPlans() { const admin = await requireAdmin("seedDefaultVipPlans"); return auditOutcome(admin.id, "seedDefaultVipPlans", async () => { try {
    await prisma.$transaction(async (tx) => { await tx.$executeRaw `SELECT pg_advisory_xact_lock(hashtext('admin:vip-plans'))`; for (const plan of DEFAULT_VIP_PLANS) {
        if (await tx.vipPlan.findUnique({ where: { slug: plan.slug } }))
            continue;
        const isPopular = plan.isPopular && !(await tx.vipPlan.count({ where: { isPopular: true } }));
        const result = await tx.vipPlan.create({ data: { ...plan, isPopular } });
        await audit(tx, admin.id, "VIP_PLAN_SEEDED", result.id);
    } });
    refresh();
    return { success: true, message: "Đã bổ sung gói mẫu còn thiếu; giữ nguyên gói hiện có." };
}
catch (error) {
    return { success: false, error: safeOperationMessage(error, "Không bổ sung được gói mẫu.") };
} }); }
