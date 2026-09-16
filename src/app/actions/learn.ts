"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { isVipActive } from "@/lib/vip-expiration";
import { revalidatePath } from "next/cache";
import { canAccessLesson, normalizePlaybackProgress } from "@/lib/learning/policy";

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

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { isVIP: true, status: true, course: { select: { status: true } } } });
    if (!lesson || !canAccessLesson({ courseStatus: lesson.course.status, lessonStatus: lesson.status, lessonIsVIP: lesson.isVIP, isVipActive: isVipActive(user) })) return { success: false, error: "Bạn chưa có quyền học bài này." };

    if (typeof completed !== "boolean") return { success: false, error: "Tiến độ không hợp lệ" };
    const now = new Date();
    await prisma.progress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId, completed, completedAt: completed ? now : null, lastViewedAt: now },
      update: { completed, completedAt: completed ? now : null, lastViewedAt: now },
    });

    revalidatePath("/learn");
    return { success: true, completed };
  } catch (error) {
    console.error("Error toggling lesson progress:", error);
    return { success: false, error: "Không thể cập nhật tiến độ học" };
  }
}

export async function saveLessonPlayback(lessonId: string, positionSeconds: number, durationSeconds?: number | null) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: "Vui lòng đăng nhập để lưu vị trí video." };
    const [user, lesson] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, isLocked: true, isVIP: true, vipExpiresAt: true } }),
      prisma.lesson.findUnique({ where: { id: lessonId }, select: { isVIP: true, status: true, course: { select: { status: true } } } }),
    ]);
    if (!user || user.isLocked || !lesson || !canAccessLesson({ courseStatus: lesson.course.status, lessonStatus: lesson.status, lessonIsVIP: lesson.isVIP, isVipActive: isVipActive(user) })) {
      return { success: false, error: "Bạn chưa có quyền học bài này." };
    }
    const progress = normalizePlaybackProgress(positionSeconds, durationSeconds);
    const now = new Date();
    await prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, ...progress, lastViewedAt: now },
      update: { ...progress, lastViewedAt: now },
    });
    return { success: true, ...progress };
  } catch {
    return { success: false, error: "Không thể lưu vị trí video." };
  }
}
