"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function deleteHistoryItem(logId: string) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    if (!logId) {
      return { success: false, error: "Thiếu ID bản ghi" };
    }

    const item = await prisma.aiUsageLog.findFirst({
      where: { id: logId, userId },
      select: { id: true },
    });

    if (!item) {
      return { success: false, error: "Không tìm thấy bản ghi hoặc không có quyền xóa" };
    }

    await prisma.aiUsageLog.delete({
      where: { id: logId },
    });

    revalidatePath("/history");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi xóa bản ghi lịch sử:", error);
    return { success: false, error: "Không thể xóa bản ghi, vui lòng thử lại sau" };
  }
}

export async function clearAllUserHistory() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    const result = await prisma.aiUsageLog.deleteMany({
      where: { userId },
    });

    revalidatePath("/history");
    revalidatePath("/dashboard");
    return { success: true, count: result.count };
  } catch (error) {
    console.error("Lỗi khi xóa toàn bộ lịch sử:", error);
    return { success: false, error: "Không thể xóa lịch sử, vui lòng thử lại sau" };
  }
}
