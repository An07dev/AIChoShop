import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { LessonsManager } from "@/components/admin/LessonsManager";
import { CoursesManager } from "@/components/admin/CoursesManager";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { listQuery, pageWindow, type SearchValues } from "@/lib/admin/list-query";
import { AdminListControls } from "@/components/admin/AdminListControls";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
    title: "Nội Dung Khóa Học & Video Bài Giảng",
    description: "Quản lý bài giảng video, gắn link YouTube/Vimeo, tổ chức học phần và phân quyền học viên Free hoặc VIP.",
};

export default async function AdminLessons() {
  await requireAdmin();
  const [lessons, courses] = await Promise.all([
      prisma.lesson.findMany({
        orderBy: { order: "asc" },
        include: {
          course: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.course.findMany({
        select: { id: true, title: true, description: true, thumbnail: true, status: true, _count: { select: { lessons: true } } },
        orderBy: { createdAt: "asc" },
      }),
  ]);

  const serializedLessons = lessons.map((l) => ({
    ...l,
    createdAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
  }));
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <LessonsManager
        key={courses.map(course => `${course.id}:${course.title}`).join("|")}
        initialLessons={serializedLessons}
        courses={courses}
        coursesSlot={
          <CoursesManager
            key="courses-manager"
            courses={courses.map(course => ({ ...course, lessonsCount: course._count.lessons }))}
          />
        }
      />
    </div>
  );
}
