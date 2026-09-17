import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { UsersManager } from "@/components/admin/UsersManager";
import { computeVipDaysLeft, isVipActive } from "@/lib/vip-expiration";
import { getActiveVipPlans } from "@/lib/vip-plans-server";
import { AI_TOOLS, getStartOfTodayVn } from "@/lib/ai-usage";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Quản Lý Người Dùng & Học Viên",
  description: "Quản lý tài khoản học viên, quyền VIP và hạn mức AI.",
};

export default async function AdminUsers() {
  await requireAdmin();
  const [users, vipPlans, setting, usage] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, name: true, phone: true, role: true,
        isVIP: true, vipExpiresAt: true, dailyFreeLimit: true,
        isLocked: true, createdAt: true, userCredit: { select: { balance: true } },
      },
    }),
    getActiveVipPlans(),
    prisma.systemSetting.findUnique({ where: { id: "default" }, select: { defaultDailyFreeLimit: true } }),
    prisma.aiUsageLog.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: getStartOfTodayVn() }, tool: { in: AI_TOOLS } },
      _count: { id: true },
    }),
  ]);
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
  return <UsersManager initialUsers={serializedUsers} initialPlans={vipPlans} initialGlobalFreeLimit={setting?.defaultDailyFreeLimit ?? 12} />;
}
