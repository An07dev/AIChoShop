"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { isVipActive } from "@/lib/vip-expiration";
import { revalidatePath } from "next/cache";

export async function toggleLessonProgress(lessonId: string, completed: boolean) {
  try {

    const token = await getSessionUserId();
    if (!token) {
      return { success: false, error: "Vui lòng đăng nhập để lưu tiến độ" };
    }

    const user = await prisma.user.findUnique({
      where: { id: token },
      select: { id: true, isLocked: true, isVIP: true, vipExpiresAt: true },
    });

    if (!user || user.isLocked) {
      return { success: false, error: "Tài khoản không hợp lệ hoặc đã bị khóa" };
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { isVIP: true } });
    if (!lesson || (lesson.isVIP && !isVipActive(user))) return { success: false, error: "Bạn chưa có quyền học bài này." };

    if (typeof completed !== "boolean") return { success: false, error: "Tiến độ không hợp lệ" };
    await prisma.progress.upsert({ where: { userId_lessonId: { userId: user.id, lessonId } }, create: { userId: user.id, lessonId, completed }, update: { completed } });

    revalidatePath("/learn");
    return { success: true, completed };
  } catch (error) {
    console.error("Error toggling lesson progress:", error);
    return { success: false, error: "Không thể cập nhật tiến độ học" };
  }
}
