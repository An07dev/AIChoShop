"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function toggleLessonProgress(lessonId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    if (!token) {
      return { success: false, error: "Vui lòng đăng nhập để lưu tiến độ" };
    }

    const user = await prisma.user.findUnique({
      where: { id: token },
      select: { id: true, isLocked: true },
    });

    if (!user || user.isLocked) {
      return { success: false, error: "Tài khoản không hợp lệ hoặc đã bị khóa" };
    }

    const existing = await prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
    });

    let newCompletedState = true;
    if (existing) {
      newCompletedState = !existing.completed;
      await prisma.progress.update({
        where: { id: existing.id },
        data: { completed: newCompletedState },
      });
    } else {
      await prisma.progress.create({
        data: {
          userId: user.id,
          lessonId,
          completed: true,
        },
      });
    }

    revalidatePath("/learn");
    return { success: true, completed: newCompletedState };
  } catch (error) {
    console.error("Error toggling lesson progress:", error);
    return { success: false, error: "Không thể cập nhật tiến độ học" };
  }
}
