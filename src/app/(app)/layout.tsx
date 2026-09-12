import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get user from cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;
  let currentUser = null;
  if (token) {
    currentUser = await prisma.user.findUnique({
      where: { id: token },
      select: { id: true, name: true, email: true, isVIP: true }
    });
  }

  // Lấy danh sách các học phần thực tế và số lượng bài học từ Database
  const [rawLessons, rawCourses] = await Promise.all([
    prisma.lesson.findMany({
      select: { moduleName: true, order: true },
      orderBy: { order: "asc" },
    }),
    prisma.course.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: { lessons: true },
        },
        lessons: {
          select: { id: true },
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const moduleCountsMap = new Map<string, number>();
  rawLessons.forEach((l) => {
    const mod = l.moduleName?.trim() || "Phần 1";
    moduleCountsMap.set(mod, (moduleCountsMap.get(mod) || 0) + 1);
  });

  const dynamicModules = Array.from(moduleCountsMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  const coursesList = rawCourses.map((c) => ({
    id: c.id,
    title: c.title,
    lessonsCount: c._count.lessons,
    firstLessonId: c.lessons[0]?.id || "",
  }));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Sidebar user={currentUser} dynamicModules={dynamicModules} courses={coursesList} />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header user={currentUser} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col min-h-0 w-full">
            {children}
          </div>
          {/* <Footer /> */}
        </main>
      </div>
    </div>
  );
}
