import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import ProfileClient from "./ProfileClient";
import { getActiveVipPlans } from "@/lib/vip-plans-server";
import { getSePayConfig, syncUserVipExpiration } from "@/lib/sepay-server";
import { computeVipDaysLeft } from "@/lib/vip-expiration";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hồ Sơ & Gói VIP | AIChoShop",
  description: "Quản lý thông tin tài khoản, nâng cấp thành viên VIP PRO và theo dõi lộ trình học tập tại AIChoShop.",
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: token },
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
      updatedAt: true,
      userCredit: {
        select: { balance: true },
      },
      progress: {
        where: { completed: true },
        select: {
          lessonId: true,
          updatedAt: true,
          lesson: {
            select: {
              title: true,
              course: { select: { title: true } },
            },
          },
        },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          amount: true,
          status: true,
          type: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user || user.isLocked) {
    redirect("/login");
  }

  // Tự động kiểm tra và hạ cấp nếu đã hết hạn VIP
  const syncedUser = await syncUserVipExpiration({
    id: user.id,
    isVIP: user.isVIP,
    vipExpiresAt: user.vipExpiresAt,
  });

  // Thống kê tổng số bài học, khóa học, danh sách gói VIP và cấu hình SePay từ database
  const [totalCourses, totalLessons, vipPlans, sePayConfig] = await Promise.all([
    prisma.course.count(),
    prisma.lesson.count(),
    getActiveVipPlans(),
    getSePayConfig(),
  ]);

  const serializedUser = {
    id: user.id,
    email: user.email,
    name: user.name || "Thành viên",
    phone: user.phone || "",
    role: user.role,
    isVIP: syncedUser.isVIP,
    vipExpiresAt: syncedUser.vipExpiresAt ? syncedUser.vipExpiresAt.toISOString() : null,
    vipDaysLeft: computeVipDaysLeft(syncedUser.vipExpiresAt),
    createdAt: user.createdAt.toISOString(),
    creditBalance: user.userCredit?.balance || 0,
    completedLessons: user.progress.map((p) => ({
      lessonId: p.lessonId,
      lessonTitle: p.lesson.title,
      courseTitle: p.lesson.course.title,
      completedAt: p.updatedAt.toISOString(),
    })),
    transactions: user.transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      status: t.status,
      type: t.type,
      createdAt: t.createdAt.toISOString(),
    })),
  };

  return (
    <ProfileClient
      user={serializedUser}
      totalCourses={totalCourses}
      totalLessons={totalLessons}
      vipPlans={JSON.parse(JSON.stringify(vipPlans))}
      sePayConfig={{
        bankName: sePayConfig.bankName,
        accountNumber: sePayConfig.accountNumber,
        accountHolder: sePayConfig.accountHolder,
        syntaxPrefix: sePayConfig.syntaxPrefix,
      }}
    />
  );
}
