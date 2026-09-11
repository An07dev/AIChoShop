import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import ProfileClient from "./ProfileClient";

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

  // Thống kê tổng số bài học và khóa học của hệ thống
  const [totalCourses, totalLessons] = await Promise.all([
    prisma.course.count(),
    prisma.lesson.count(),
  ]);

  const serializedUser = {
    id: user.id,
    email: user.email,
    name: user.name || "Thành viên",
    phone: user.phone || "",
    role: user.role,
    isVIP: user.isVIP,
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
    />
  );
}
