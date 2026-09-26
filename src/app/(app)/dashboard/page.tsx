import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAiUsageStats } from "@/lib/ai-usage";
import { isVipActive } from "@/lib/vip-expiration";
import DashboardClient, { type ResumeLessonData } from "./DashboardClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tổng Quan Dashboard | AIChoShop",
  description: "Bảng điều khiển kinh doanh thực chiến, trung tâm công cụ AI và tiến độ khóa học Masterclass.",
};

export default async function DashboardPage() {
  const token = await getSessionUserId();

  if (!token) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: token },
    select: { id: true, name: true, email: true, isVIP: true, vipExpiresAt: true, isLocked: true },
  });

  if (!user || user.isLocked) {
    redirect("/login");
  }

  const isUserVIP = isVipActive(user);

  // 1. Lấy số liệu AI thực tế & Thống kê bài học chuẩn xác từ CSDL (chỉ tính bài và khóa học đã PUBLISHED)
  const [aiStats, totalLessons, completedLessonsCount] = await Promise.all([
    getAiUsageStats(user.id),
    prisma.lesson.count({
      where: {
        status: "PUBLISHED",
        course: { status: "PUBLISHED" },
      },
    }),
    prisma.progress.count({
      where: {
        userId: user.id,
        completed: true,
        lesson: {
          status: "PUBLISHED",
          course: { status: "PUBLISHED" },
        },
      },
    }),
  ]);

  // Tính % tiến độ học tập tổng quan
  const courseProgressPercent =
    totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

  // 2. Tìm bài học phù hợp để tiếp tục học (Smart Resume)
  // Ưu tiên 1: Bài học xem gần nhất nhưng chưa hoàn thành
  // Ưu tiên 2: Nếu bài gần nhất đã hoàn thành -> lấy bài kế tiếp chưa hoàn thành trong khóa đó
  // Ưu tiên 3: Nếu đã xong khóa đó -> lấy bài chưa hoàn thành bất kỳ trong các khóa đã phát hành
  // Ưu tiên 4: Nếu chưa học bài nào -> lấy bài đầu tiên của khóa học đầu tiên
  let resumeLesson: ResumeLessonData | null = null;

  const lastViewedProgress = await prisma.progress.findFirst({
    where: {
      userId: user.id,
      lesson: {
        status: "PUBLISHED",
        course: { status: "PUBLISHED" },
      },
    },
    orderBy: { lastViewedAt: "desc" },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          moduleName: true,
          order: true,
          isVIP: true,
          course: {
            select: { id: true, title: true },
          },
        },
      },
    },
  });

  if (lastViewedProgress) {
    if (!lastViewedProgress.completed) {
      resumeLesson = {
        id: lastViewedProgress.lesson.id,
        title: lastViewedProgress.lesson.title,
        moduleName: lastViewedProgress.lesson.moduleName,
        order: lastViewedProgress.lesson.order,
        isVIP: lastViewedProgress.lesson.isVIP,
        course: lastViewedProgress.lesson.course,
        label: "Tiếp tục bài đang dở",
        isResume: true,
      };
    } else {
      // Tìm bài tiếp theo trong cùng khóa
      const nextInCourse = await prisma.lesson.findFirst({
        where: {
          courseId: lastViewedProgress.lesson.course.id,
          status: "PUBLISHED",
          order: { gt: lastViewedProgress.lesson.order },
          progress: {
            none: {
              userId: user.id,
              completed: true,
            },
          },
        },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          moduleName: true,
          order: true,
          isVIP: true,
          course: {
            select: { id: true, title: true },
          },
        },
      });

      if (nextInCourse) {
        resumeLesson = {
          ...nextInCourse,
          label: "Bài học tiếp theo",
          isResume: false,
        };
      } else {
        // Tìm bài chưa học trong các khóa khác
        const anyUncompleted = await prisma.lesson.findFirst({
          where: {
            status: "PUBLISHED",
            course: { status: "PUBLISHED" },
            progress: {
              none: {
                userId: user.id,
                completed: true,
              },
            },
          },
          orderBy: [{ course: { createdAt: "asc" } }, { order: "asc" }],
          select: {
            id: true,
            title: true,
            moduleName: true,
            order: true,
            isVIP: true,
            course: {
              select: { id: true, title: true },
            },
          },
        });

        if (anyUncompleted) {
          resumeLesson = {
            ...anyUncompleted,
            label: "Bài học tiếp theo",
            isResume: false,
          };
        }
      }
    }
  }

  // Nếu người dùng chưa từng học bài nào, lấy bài số 1 của khóa đầu tiên
  if (!resumeLesson && totalLessons > 0 && completedLessonsCount < totalLessons) {
    const firstLesson = await prisma.lesson.findFirst({
      where: {
        status: "PUBLISHED",
        course: { status: "PUBLISHED" },
      },
      orderBy: [{ course: { createdAt: "asc" } }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        moduleName: true,
        order: true,
        isVIP: true,
        course: {
          select: { id: true, title: true },
        },
      },
    });

    if (firstLesson) {
      resumeLesson = {
        ...firstLesson,
        label: "Khởi động bài đầu tiên",
        isResume: false,
      };
    }
  }

  return (
    <DashboardClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        isVIP: isUserVIP,
      }}
      aiStats={aiStats}
      totalLessons={totalLessons}
      completedLessonsCount={completedLessonsCount}
      courseProgressPercent={courseProgressPercent}
      resumeLesson={resumeLesson}
    />
  );
}
