"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { getAiUnitEconomics, AiUnitEconomicsData } from "@/lib/ai-economics";
import { prisma } from "@/lib/prisma";

export async function fetchAiEconomicsAction(
  timeframe: "7d" | "30d" | "all" = "30d"
): Promise<{ success: boolean; data?: AiUnitEconomicsData; error?: string }> {
  try {
    await requireAdmin("fetchAiEconomicsAction");
    const data = await getAiUnitEconomics(timeframe);
    return { success: true, data };
  } catch (error: any) {
    console.error("Lỗi khi lấy dữ liệu Unit Economics:", error);
    return {
      success: false,
      error: error.message || "Không thể tải báo cáo chi phí AI.",
    };
  }
}

export async function clearAiUsageLogsAction(
  scope: "all" | "7d" | "30d_older" = "all"
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    await requireAdmin("clearAiUsageLogsAction");
    const now = new Date();
    let deletedCount = 0;

    if (scope === "all") {
      const res = await prisma.$executeRaw`DELETE FROM "AiUsageLog"`;
      deletedCount = Number(res);
      // Dọn dẹp cả bản ghi SeoRun thành công / thất bại cũ
      await prisma.$executeRaw`DELETE FROM "SeoRun" WHERE status = 'failed' OR status = 'success'`;
    } else if (scope === "7d") {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const res = await prisma.$executeRaw`DELETE FROM "AiUsageLog" WHERE "createdAt" >= ${cutoff}`;
      deletedCount = Number(res);
    } else if (scope === "30d_older") {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const res = await prisma.$executeRaw`DELETE FROM "AiUsageLog" WHERE "createdAt" < ${cutoff}`;
      deletedCount = Number(res);
    }

    revalidatePath("/admin/ai-costs");
    return { success: true, count: deletedCount };
  } catch (error: any) {
    console.error("Lỗi khi xóa dữ liệu nhật ký sử dụng AI:", error);
    return {
      success: false,
      error: error.message || "Không thể xóa dữ liệu nhật ký sử dụng AI.",
    };
  }
}
