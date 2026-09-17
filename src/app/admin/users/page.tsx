import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { UsersManager } from "@/components/admin/UsersManager";
import { computeVipDaysLeft, isVipActive } from "@/lib/vip-expiration";
import { getActiveVipPlans } from "@/lib/vip-plans-server";
import { AI_TOOLS, getStartOfTodayVn } from "@/lib/ai-usage";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { listQuery, pageWindow, type SearchValues } from "@/lib/admin/list-query";
import { AdminListControls } from "@/components/admin/AdminListControls";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
    title: "Quản Lý Người Dùng & Học Viên",
    description: "Quản lý tài khoản học viên, quyền VIP và hạn mức AI.",
};
export default async function AdminUsers({ searchParams }: {
    searchParams: Promise<SearchValues>;
}) {
    await requireAdmin();
    const values = await searchParams, query = listQuery(values), now = new Date();
    const activeVip: Prisma.UserWhereInput = { isVIP: true, OR: [{ vipExpiresAt: null }, { vipExpiresAt: { gt: now } }] };
    const vip = query.choice("vip", ["all", "vip", "free"], "all"), status = query.choice("status", ["all", "active", "locked"], "all");
    const where: Prisma.UserWhereInput = { AND: [...(query.q ? [{ OR: [{ email: { contains: query.q, mode: "insensitive" as const } }, { name: { contains: query.q, mode: "insensitive" as const } }, { phone: { contains: query.q } }] }] : []), ...(vip === "vip" ? [activeVip] : vip === "free" ? [{ NOT: activeVip }] : []), ...(status !== "all" ? [{ isLocked: status === "locked" }] : [])] };
    const window = pageWindow(await prisma.user.count({ where }), query.page, query.size);
    const sort = query.choice("sort", ["newest", "oldest", "email"], "newest");
    const [users, vipPlans, setting] = await Promise.all([
        prisma.user.findMany({
            where, skip: window.skip, take: window.size,
            orderBy: sort === "email" ? [{ email: "asc" }, { id: "asc" }] : [{ createdAt: sort === "oldest" ? "asc" : "desc" }, { id: "asc" }],
            select: {
                id: true, email: true, name: true, phone: true, role: true,
                isVIP: true, vipExpiresAt: true, dailyFreeLimit: true,
                isLocked: true, createdAt: true, userCredit: { select: { balance: true } },
            },
        }),
        getActiveVipPlans(),
        prisma.systemSetting.findUnique({ where: { id: "default" }, select: { defaultDailyFreeLimit: true } }),
    ]);
    const usage = await prisma.aiUsageLog.groupBy({
        by: ["userId"],
        where: { userId: { in: users.map(user => user.id) }, createdAt: { gte: getStartOfTodayVn() }, tool: { in: AI_TOOLS } },
        _count: { id: true },
    });
    const todayUsage = new Map(usage.map(row => [row.userId, row._count.id]));
    const serializedUsers = users.map(user => {
        const activeVip = isVipActive(user);
        const usedToday = todayUsage.get(user.id) ?? 0;
        return {
            ...user,
            isVIP: activeVip,
            usedToday,
            remainingFree: activeVip ? null : Math.max(0, user.dailyFreeLimit - usedToday),
            createdAt: user.createdAt.toISOString(),
            vipExpiresAt: user.vipExpiresAt?.toISOString() ?? null,
            vipDaysLeft: computeVipDaysLeft(user.vipExpiresAt),
        };
    });
    return <div className="space-y-4"><AdminListControls path="/admin/users" values={values} window={window} filters={[
            { name: "vip", label: "Quyền", options: [{ value: "all", label: "Tất cả" }, { value: "vip", label: "VIP còn hạn" }, { value: "free", label: "Free / VIP hết hạn" }] },
            { name: "status", label: "Tài khoản", options: [{ value: "all", label: "Tất cả" }, { value: "active", label: "Hoạt động" }, { value: "locked", label: "Đã khóa" }] },
            { name: "sort", label: "Sắp xếp", options: [{ value: "newest", label: "Mới nhất" }, { value: "oldest", label: "Cũ nhất" }, { value: "email", label: "Email A–Z" }] }
        ]}/><UsersManager initialUsers={serializedUsers} initialPlans={vipPlans} initialGlobalFreeLimit={setting?.defaultDailyFreeLimit ?? 12}/></div>;
}
