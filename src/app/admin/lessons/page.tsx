
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { LessonsManager } from "@/components/admin/LessonsManager";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nội Dung Khóa Học & Video Bài Giảng",
  description: "Quản lý bài giảng video, gắn link YouTube/Vimeo, tổ chức học phần và phân quyền học viên Free hoặc VIP.",
};

export default async function AdminLessons() {
  await requireAdmin();
  try {
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
        select: { id: true, title: true },
      }),
    ]);

    const serializedLessons = lessons.map((l) => ({
      ...l,
      createdAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
    }));

    console.log("=== [SERVER LOG] /admin/lessons ===");
    console.log(`Loaded ${lessons.length} lessons from PostgreSQL DB.`);
    console.log(`Courses found: ${courses.map((c) => c.title).join(", ")}`);
    console.log("===================================");

    return (

      <div className="flex-1 flex flex-col min-h-0">
        <LessonsManager initialLessons={serializedLessons} courses={courses} />
      </div>
    );
  } catch (error: any) {
    console.error("ADMIN LESSONS ERROR:", error);
    return (
      <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-200">
        <h2 className="text-xl font-bold mb-2">Lỗi tải danh sách bài học:</h2>
        <pre className="text-sm whitespace-pre-wrap">{error?.stack || error?.message || String(error)}</pre>
      </div>
    );
  }
}

