import { prisma } from "@/lib/prisma";
import LearnClient from "./LearnClient";
import { cookies } from "next/headers";

export default async function LearnPage() {
  // 1. Fetch user to check VIP status
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;
  let isUserVIP = false;
  if (token) {
    const user = await prisma.user.findUnique({
      where: { id: token },
      select: { isVIP: true }
    });
    if (user?.isVIP) isUserVIP = true;
  } 

  // 2. Fetch course data and lessons
  const course = await prisma.course.findFirst({
    include: {
      lessons: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) {
    return <div className="p-8 text-center text-red-500">Chưa có khóa học nào trong hệ thống. Hãy chạy script seed!</div>;
  }

  // Group lessons by module (assuming title contains "Phần X")
  const modulesMap = new Map();

  course.lessons.forEach((lesson: { id: string; title: string; content: string | null; isVIP: boolean; order: number }) => {
    // Extract module name, e.g., "Phần 1" from "Phần 1 - Bài 1: ..."
    const moduleMatch = lesson.title.match(/^(Phần \d+)/);
    const moduleTitle = moduleMatch ? moduleMatch[1] : "Chung";

    // Clean up lesson title to remove "Phần X - " if needed
    const cleanTitle = lesson.title.replace(/^(Phần \d+ - )/, "");

    if (!modulesMap.has(moduleTitle)) {
      modulesMap.set(moduleTitle, {
        moduleTitle,
        lessons: [],
      });
    }

    modulesMap.get(moduleTitle).lessons.push({
      ...lesson,
      title: cleanTitle,
    });
  });

  const modules = Array.from(modulesMap.values());

  return <LearnClient modules={modules} isUserVIP={isUserVIP} />;
}
