
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { UsersManager } from "@/components/admin/UsersManager";
import { syncAllExpiredVipUsers } from "@/lib/sepay-server";
import { computeVipDaysLeft } from "@/lib/vip-expiration";
import { getActiveVipPlans } from "@/lib/vip-plans-server";
import { getStartOfTodayVn } from "@/lib/ai-usage";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quản Lý Người Dùng & Học Viên",
  description: "Quản lý danh sách tài khoản học viên, cấp quyền VIP, phân bổ lượt dùng AI và đổi mật khẩu người dùng.",
};

export default async function AdminUsers() {
  await requireAdmin();
  try {
    // Tự động kiểm tra và hạ cấp các tài khoản đã hết hạn VIP về FREE
    await syncAllExpiredVipUsers();

    const startOfToday = getStartOfTodayVn();

    const [users, vipPlans] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isVIP: true,
          vipExpiresAt: true,
          isLocked: true,
          createdAt: true,
          userCredit: {
            select: { balance: true },
          },
        },
      }),
      getActiveVipPlans(),
    ]);

    // Lấy định mức lượt Free mỗi ngày an toàn (tương thích cả khi client dev cache)
    const freeLimitsMap = new Map<string, number>();
    let globalDailyFreeLimit = 12;
    try {
      const [rawLimits, settingRows]: [any, any] = await Promise.all([
        (prisma as any).$queryRawUnsafe('SELECT id, "dailyFreeLimit" FROM "User"'),
        (prisma as any).$queryRawUnsafe(
          'SELECT "defaultDailyFreeLimit" FROM "SystemSetting" WHERE id = \'default\' LIMIT 1;'
        ),
      ]);

      if (Array.isArray(rawLimits)) {
        rawLimits.forEach((row) => {
          if (row.id) {
            freeLimitsMap.set(row.id, Number(row.dailyFreeLimit) || 12);
          }
        });
      }

      if (settingRows && settingRows[0]?.defaultDailyFreeLimit !== undefined) {
        globalDailyFreeLimit = Number(settingRows[0].defaultDailyFreeLimit) || 12;
      }
    } catch (err) {
      console.warn("Could not query dailyFreeLimit via raw SQL:", err);
    }

    const todayUsageMap = new Map<string, number>();
    try {
      if (typeof (prisma as any).aiUsageLog?.groupBy === "function") {
        const todayUsages = await (prisma as any).aiUsageLog.groupBy({
          by: ["userId"],
          where: { createdAt: { gte: startOfToday } },
          _count: { id: true },
        });
        todayUsages.forEach((u: any) => {
          todayUsageMap.set(u.userId, u._count?.id || 0);
        });
      } else {
        const rows: any = await prisma.$queryRawUnsafe(
          'SELECT "userId", COUNT(*)::int as count FROM "AiUsageLog" WHERE "createdAt" >= $1 GROUP BY "userId"',
          startOfToday
        );
        rows.forEach((r: any) => {
          todayUsageMap.set(r.userId, Number(r.count) || 0);
        });
      }
    } catch (err) {
      console.warn("Could not query aiUsageLog groupBy, trying raw SQL:", err);
      try {
        const rows: any = await prisma.$queryRawUnsafe(
          'SELECT "userId", COUNT(*)::int as count FROM "AiUsageLog" WHERE "createdAt" >= $1 GROUP BY "userId"',
          startOfToday
        );
        rows.forEach((r: any) => {
          todayUsageMap.set(r.userId, Number(r.count) || 0);
        });
      } catch (sqlErr) {
        console.warn("Could not query aiUsageLog via raw SQL:", sqlErr);
      }
    }

    const serializedUsers = users.map((u: any) => {
      const usedToday = todayUsageMap.get(u.id) || 0;
      const dailyLimit = freeLimitsMap.get(u.id) ?? u.dailyFreeLimit ?? globalDailyFreeLimit ?? 12;
      const remainingFree = u.isVIP ? null : Math.max(0, dailyLimit - usedToday);

      return {
        ...u,
        dailyFreeLimit: dailyLimit,
        remainingFree,
        usedToday,
        createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
        vipExpiresAt: u.vipExpiresAt ? u.vipExpiresAt.toISOString() : null,
        vipDaysLeft: computeVipDaysLeft(u.vipExpiresAt),
      };
    });

    return (
      <UsersManager
        initialUsers={serializedUsers}
        initialPlans={vipPlans}
        initialGlobalFreeLimit={globalDailyFreeLimit}
      />
    );
  } catch (error: any) {
    console.error("ADMIN USERS ERROR:", error);
    return (
      <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-200">
        <h2 className="text-xl font-bold mb-2">Error loading users:</h2>
        <pre className="text-sm whitespace-pre-wrap">{error?.stack || error?.message || String(error)}</pre>
      </div>
    );
  }
}

