import { prisma } from "@/lib/prisma";
import { LessonsManager } from "@/components/admin/LessonsManager";

export const dynamic = "force-dynamic";

export default async function AdminLessons() {
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

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý Nội dung Khóa học & Video</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Quản lý bài giảng, gắn video YouTube/MP4, và phân quyền Video FREE hoặc VIP.
          </p>
        </div>

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

