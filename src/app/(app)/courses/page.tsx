
import { isVipActive } from "@/lib/vip-expiration";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import CoursesClient from "./CoursesClient";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tất Cả Khóa Học & Video Bài Giảng | AIChoShop",
  description: "Trọn bộ khóa học và video bài giảng Masterclass ứng dụng AI vào bán hàng TMĐT Đa Nền Tảng (Shopee, TikTok Shop, Lazada).",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ module?: string; type?: string; q?: string; courseId?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialModule = resolvedParams?.module;
  const initialCourseId = resolvedParams?.courseId;

  const token = await getSessionUserId();

  let isUserVIP = false;
  let isLogged = false;
  let completedLessonIds: string[] = [];

  if (token) {
    const user = await prisma.user.findUnique({
      where: { id: token },
      select: { id: true, isVIP: true, vipExpiresAt: true, isLocked: true },
    });

    if (user && !user.isLocked) {
      isLogged = true;
      if (isVipActive(user)) isUserVIP = true;

      const userProgress = await prisma.progress.findMany({
        where: { userId: user.id, completed: true },
        select: { lessonId: true },
      });
      completedLessonIds = userProgress.map((p) => p.lessonId);
    }
  }

  // Lấy toàn bộ khóa học và các bài học tương ứng từ Database
  const rawCourses = await prisma.course.findMany({
    include: {
      lessons: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const serializedCourses = rawCourses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    lessons: c.lessons.map((l) => ({
      id: l.id,
      courseId: l.courseId,
      title: l.title,
      moduleName: l.moduleName?.trim() || "Phần 1",
      content: !l.isVIP || isUserVIP ? l.content : null,
      videoUrl: !l.isVIP || isUserVIP ? l.videoUrl : null,
      order: l.order,
      isVIP: l.isVIP,
    })),
  }));

  console.log("=== [SERVER LOG] /courses Page ===");
  console.log(`Loaded ${serializedCourses.length} courses with total ${serializedCourses.reduce((a, c) => a + c.lessons.length, 0)} lessons.`);
  console.log("==================================");

  return (
    <CoursesClient
      courses={serializedCourses}
      isUserVIP={isUserVIP}
      isLogged={isLogged}
      completedLessonIds={completedLessonIds}
      initialModule={initialModule}
      initialCourseId={initialCourseId}
    />
  );
}
