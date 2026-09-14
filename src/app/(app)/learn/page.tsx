
import { isVipActive } from "@/lib/vip-expiration";
import { prisma } from "@/lib/prisma";
import LearnClient, { type Module } from "./LearnClient";
import { getSessionUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LearnPage({
  searchParams,
}: {
  searchParams?: Promise<{ lessonId?: string; courseId?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialLessonId = resolvedParams?.lessonId;
  let targetCourseId = resolvedParams?.courseId;

  // 1. Nếu có initialLessonId mà chưa có targetCourseId, tự động truy vấn tìm courseId của bài học đó
  if (initialLessonId && !targetCourseId) {
    const targetLesson = await prisma.lesson.findUnique({
      where: { id: initialLessonId },
      select: { courseId: true },
    });
    if (targetLesson?.courseId) {
      targetCourseId = targetLesson.courseId;
    }
  }

  // 2. Fetch user to check VIP status and completion progress

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

  // 3. Lấy tất cả khóa học để hỗ trợ chuyển đổi khóa học
  const allCourses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      _count: { select: { lessons: true } },
      lessons: {
        select: { id: true },
        orderBy: { order: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // 4. Fetch course data and lessons
  let course = null;
  if (targetCourseId) {
    course = await prisma.course.findUnique({
      where: { id: targetCourseId },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    });
  }

  if (!course) {
    course = await prisma.course.findFirst({
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    });
  }

  if (!course) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-200">
        Chưa có khóa học nào trong hệ thống. Quản trị viên hãy tạo khóa học trong trang Admin!
      </div>
    );
  }

  // Group lessons by explicit moduleName field
  const modulesMap = new Map<string, Module>();

  course.lessons.forEach((lesson) => {
    const moduleTitle = lesson.moduleName?.trim() || "Phần 1";

    if (!modulesMap.has(moduleTitle)) {
      modulesMap.set(moduleTitle, {
        moduleTitle,
        lessons: [],
      });
    }

    modulesMap.get(moduleTitle)!.lessons.push({
      id: lesson.id,
      title: lesson.title,
      fullTitle: lesson.title,
      moduleName: moduleTitle,
      content: !lesson.isVIP || isUserVIP ? lesson.content : null,
      videoUrl: !lesson.isVIP || isUserVIP ? lesson.videoUrl : null,
      order: lesson.order,
      isVIP: lesson.isVIP,
    });
  });


  const modules = Array.from(modulesMap.values());

  console.log("=== [SERVER LOG] /learn Page Data ===");
  console.log("Course:", course.title);
  console.log("Total Lessons in DB:", course.lessons.length);
  console.log("Is VIP:", isUserVIP, "| Is Logged:", isLogged);
  console.log("Completed Lessons Count:", completedLessonIds.length);
  console.log("=====================================");

  const coursesList = allCourses.map((c) => ({
    id: c.id,
    title: c.title,
    lessonsCount: c._count.lessons,
    firstLessonId: c.lessons[0]?.id || "",
  }));

  return (
    <LearnClient
      modules={modules}
      isUserVIP={isUserVIP}
      isLogged={isLogged}
      initialCompletedLessonIds={completedLessonIds}
      courseTitle={course.title}
      currentCourseId={course.id}
      courses={coursesList}
      initialLessonId={initialLessonId}
    />
  );
}

