"use server";

import { auditedWrite } from "@/lib/auth/audit-operations";
import { auditOutcome } from "@/lib/auth/audit-operations";
import { requireAdmin } from "@/lib/auth/session";

import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/auth/audit";
import { normalizeCourseInput, normalizeLessonInput, type LearningContentStatus, type LessonInput } from "@/lib/learning/policy";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { mediaName, privateMediaRoot } from "@/lib/media";

function refreshLearningPages() {
  revalidatePath("/admin/lessons");
  revalidatePath("/learn");
  revalidatePath("/courses");
}

async function assertCourseAndMedia(
  tx: Prisma.TransactionClient,
  courseId: string,
  mediaAssetId: string | null,
  videoUrl: string | null,
) {
  const course = await tx.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) throw new Error("Khóa học không tồn tại.");
  if (!mediaAssetId) return;
  const asset = await tx.mediaAsset.findUnique({ where: { id: mediaAssetId } });
  if (!asset || videoUrl !== `/api/media/${asset.filename}`) throw new Error("Tài sản video không tồn tại hoặc không khớp.");
}

// Bật / Tắt trạng thái VIP của bài học (1-click)
export async function toggleLessonVip(lessonId: string, newVipStatus: boolean) {
  const admin = await requireAdmin("toggleLessonVip");
  return auditOutcome(admin.id, "toggleLessonVip", async () => {
  try {
    const updated = await auditedWrite(admin.id, "LESSON_UPDATED", tx => tx.lesson.update({
      where: { id: lessonId },
      data: { isVIP: newVipStatus },
    }));
    revalidatePath("/admin/lessons");
    revalidatePath("/learn");
    revalidatePath("/courses");
    return { success: true, isVIP: updated.isVIP };
  } catch (error) {
    console.error("Error toggling Lesson VIP:", error);
    return { success: false, error: "Không thể cập nhật trạng thái VIP của bài học" };
  }

  });
}

// Thêm bài học mới
export async function createLesson(data: {
  courseId?: string;
  title: string;
  moduleName?: string;
  content?: string;
  videoUrl?: string;
  order?: number;
  isVIP?: boolean;
  status?: LearningContentStatus;
  durationSeconds?: number | null;
  mediaAssetId?: string | null;
}) {
  const admin = await requireAdmin("createLesson");
  return auditOutcome(admin.id, "createLesson", async () => {
  try {
    // 1. Đảm bảo có Course
    let courseId = data.courseId;
    if (!courseId) {
      let defaultCourse = await prisma.course.findFirst();
      if (!defaultCourse) {
        defaultCourse = await auditedWrite(admin.id, "COURSE_CREATED", tx => tx.course.create({
          data: {
            title: "Masterclass Ứng Dụng AI Vào Bán Hàng Đa Nền Tảng",
            description: "Khóa học thực chiến giúp bạn gia tăng doanh số và tối ưu vận hành bằng AI",
          },
        }));
      }
      courseId = defaultCourse.id;
    }

    // 2. Xác định số thứ tự (Order) nếu chưa có
    let order = Number(data.order);
    if (isNaN(order) || order <= 0) {
      const highestOrderLesson = await prisma.lesson.findFirst({
        where: { courseId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (highestOrderLesson?.order || 0) + 1;
    }
    const normalized = normalizeLessonInput({ ...data, courseId, order } as LessonInput);
    const newLesson = await prisma.$transaction(async tx => {
      await assertCourseAndMedia(tx, courseId!, normalized.mediaAssetId, normalized.videoUrl);
      await tx.lesson.updateMany({ where: { courseId, order: { gte: normalized.order } }, data: { order: { increment: 1 } } });
      const lesson = await tx.lesson.create({ data: { ...normalized, courseId: courseId! } });
      if (normalized.mediaAssetId) await tx.mediaAsset.update({ where: { id: normalized.mediaAssetId }, data: { status: "ATTACHED" } });
      await audit(tx, admin.id, "LESSON_CREATED", lesson.id, { isVIP: lesson.isVIP, order: lesson.order });
      return lesson;
    });

    refreshLearningPages();
    return { success: true, lesson: newLesson };
  } catch (error) {
    console.error("Error creating lesson:", error);
    return { success: false, error: error instanceof Error ? error.message : "Lỗi hệ thống khi tạo bài học mới" };
  }

  });
}

// Cập nhật thông tin bài học
export async function updateLesson(
  lessonId: string,
  data: {
    title: string;
    moduleName?: string;
    content?: string;
    videoUrl?: string;
    order?: number;
    isVIP?: boolean;
    courseId?: string;
    status?: LearningContentStatus;
    durationSeconds?: number | null;
    mediaAssetId?: string | null;
  }
) {
  const admin = await requireAdmin("updateLesson");
  return auditOutcome(admin.id, "updateLesson", async () => {
  try {
    const current = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!current) return { success: false, error: "Bài học không tồn tại." };
    const targetCourseId = data.courseId?.trim() || current.courseId;
    const normalized = normalizeLessonInput({
      title: data.title,
      moduleName: data.moduleName ?? current.moduleName,
      content: data.content,
      videoUrl: data.videoUrl,
      mediaAssetId: data.mediaAssetId,
      order: data.order ?? current.order,
      isVIP: data.isVIP ?? current.isVIP,
      status: data.status ?? current.status,
      durationSeconds: data.durationSeconds,
      courseId: targetCourseId,
    });
    const updated = await prisma.$transaction(async tx => {
      await assertCourseAndMedia(tx, targetCourseId, normalized.mediaAssetId, normalized.videoUrl);
      if (targetCourseId === current.courseId) {
        if (normalized.order < current.order) await tx.lesson.updateMany({ where: { courseId: current.courseId, id: { not: lessonId }, order: { gte: normalized.order, lt: current.order } }, data: { order: { increment: 1 } } });
        if (normalized.order > current.order) await tx.lesson.updateMany({ where: { courseId: current.courseId, id: { not: lessonId }, order: { gt: current.order, lte: normalized.order } }, data: { order: { decrement: 1 } } });
      } else {
        await tx.lesson.updateMany({ where: { courseId: current.courseId, order: { gt: current.order } }, data: { order: { decrement: 1 } } });
        await tx.lesson.updateMany({ where: { courseId: targetCourseId, order: { gte: normalized.order } }, data: { order: { increment: 1 } } });
      }
      const lesson = await tx.lesson.update({ where: { id: lessonId }, data: { ...normalized, courseId: targetCourseId } });
      if (normalized.mediaAssetId) await tx.mediaAsset.update({ where: { id: normalized.mediaAssetId }, data: { status: "ATTACHED" } });
      if (current.mediaAssetId && current.mediaAssetId !== normalized.mediaAssetId) {
        const uses = await tx.lesson.count({ where: { mediaAssetId: current.mediaAssetId, id: { not: lessonId } } });
        if (!uses) await tx.mediaAsset.update({ where: { id: current.mediaAssetId }, data: { status: "ORPHANED" } });
      }
      await audit(tx, admin.id, "LESSON_UPDATED", lesson.id, { isVIP: lesson.isVIP, order: lesson.order });
      return lesson;
    });

    refreshLearningPages();
    return { success: true, lesson: updated };
  } catch (error) {
    console.error("Error updating lesson:", error);
    return { success: false, error: error instanceof Error ? error.message : "Lỗi khi cập nhật bài học" };
  }

  });
}

// Danh sách 25 bài học mẫu chuẩn của Masterclass (biến nội bộ, không export)
const DEFAULT_LESSONS_DATA = [

  // PHẦN 1
  { title: "Phần 1 - Bài 1: Sự chuyển dịch quyền lực: Khi AI hiểu khách hàng hơn Seller", isVIP: false },
  { title: "Phần 1 - Bài 2: Dùng AI quét hàng ngàn Review tìm 'Huyệt tâm lý'", isVIP: true },
  { title: "Phần 1 - Bài 3: Phân tích Trend TikTok bằng AI để đón đầu sóng sản phẩm", isVIP: false },
  { title: "Phần 1 - Bài 4: Tự động hóa chiến lược Định Giá (Markup)", isVIP: true },

  // PHẦN 2
  { title: "Phần 2 - Bài 5: Định luật 'Ăn đề xuất' thuật toán Video", isVIP: false },
  { title: "Phần 2 - Bài 6: Công thức mồi câu (Hook) khiến khách không thể lướt qua", isVIP: true },
  { title: "Phần 2 - Bài 7: AI Voice & Clone Giọng nói truyền cảm không cần micro", isVIP: true },
  { title: "Phần 2 - Bài 8: Công nghệ AI Avatar: Sản xuất hàng chục video không cần diễn viên", isVIP: true },
  { title: "Phần 2 - Bài 9: Cấu trúc kịch bản Livestream giữ chân người xem", isVIP: false },

  // PHẦN 3
  { title: "Phần 3 - Bài 10: Tầm quan trọng của Visual trong tỷ lệ Click (CTR)", isVIP: false },
  { title: "Phần 3 - Bài 11: Midjourney/Stable Diffusion: Tạo ảnh chuẩn Studio", isVIP: true },
  { title: "Phần 3 - Bài 12: Tự động xóa nền, chèn phông, thêm bóng đổ siêu thực", isVIP: true },
  { title: "Phần 3 - Bài 13: Bản chất SEO: Máy học của Shopee đọc sản phẩm ra sao?", isVIP: false },
  { title: "Phần 3 - Bài 14: Xây dựng ma trận Tiêu Đề, Mô Tả chuẩn SEO bằng AI", isVIP: true },

  // PHẦN 4
  { title: "Phần 4 - Bài 15: Bức tranh tối ưu nhân sự: AI thay thế 3 nhân viên CSKH", isVIP: false },
  { title: "Phần 4 - Bài 16: Setup Chatbot AI 'Có não' chốt sale 24/7", isVIP: true },
  { title: "Phần 4 - Bài 17: 'Bẻ lái' đánh giá 1 sao: Viết phản hồi xoa dịu khách", isVIP: true },
  { title: "Phần 4 - Bài 18: Hiểu rõ nguyên tắc phạt/Khóa Shop của Bot sàn", isVIP: false },
  { title: "Phần 4 - Bài 19: Tool AI Kháng Nghị: Viết đơn tỷ lệ gỡ gậy 99%", isVIP: true },

  // PHẦN 5
  { title: "Phần 5 - Bài 20: Chạy Ads 'mù' và cái kết đốt tiền", isVIP: false },
  { title: "Phần 5 - Bài 21: A/B Testing thần tốc: Sinh hàng trăm biến thể Ad Copy", isVIP: true },
  { title: "Phần 5 - Bài 22: KOC/KOL Affiliate: Phễu phân phối quyền lực nhất", isVIP: false },
  { title: "Phần 5 - Bài 23: Quét và đánh giá tệp Follower của KOC: Né tệp rác ảo", isVIP: true },
  { title: "Phần 5 - Bài 24: Lên kế hoạch tài chính Book KOC tự động", isVIP: true },
  { title: "Phần 5 - Bài 25: Tổng kết khóa học & Trao chứng nhận", isVIP: false },
];

// Khôi phục lại các bài học đã xóa nhầm
export async function restoreDefaultLessons() {
  const admin = await requireAdmin("restoreDefaultLessons");
  return auditOutcome(admin.id, "restoreDefaultLessons", async () => {
  try {
    let course = await prisma.course.findFirst();
    if (!course) {
      course = await auditedWrite(admin.id, "COURSE_CREATED", tx => tx.course.create({
          data: {
            title: "Masterclass Ứng Dụng AI Vào Bán Hàng Đa Nền Tảng",
            description: "Huấn luyện Seller sử dụng toàn bộ hệ sinh thái AI thay thế 1 team In-house 5 người trên Shopee, TikTok, FB.",
            status: "DRAFT",
          },
      }));
    }

    const existingLessons = await prisma.lesson.findMany({
      where: { courseId: course.id },
      select: { id: true, title: true, order: true },
    });

    const existingMap = new Map(
      existingLessons.map((l) => [l.title.trim().toLowerCase(), l])
    );

    let restoredCount = 0;
    for (let i = 0; i < DEFAULT_LESSONS_DATA.length; i++) {
      const def = DEFAULT_LESSONS_DATA[i];
      const match = existingMap.get(def.title.trim().toLowerCase());

      const moduleName = def.title.match(/^(Phần \d+)/i)?.[1] || "Phần 1";

      if (match) {
        // Cập nhật lại số thứ tự và moduleName cho chuẩn xác
        await auditedWrite(admin.id, "LESSON_UPDATED", tx => tx.lesson.update({
          where: { id: match.id },
          data: { order: i + 1, moduleName },
        }));
      } else {
        // Tạo lại bài học bị xóa
        await auditedWrite(admin.id, "LESSON_CREATED", tx => tx.lesson.create({
          data: {
            courseId: course.id,
            title: def.title,
            moduleName,
            content: null,
            videoUrl: null,
            isVIP: def.isVIP,
            status: "DRAFT",
            order: i + 1,
          },
        }));
        restoredCount++;
      }
    }


    revalidatePath("/admin/lessons");
    revalidatePath("/learn");
    return { success: true, restoredCount };
  } catch (error) {
    console.error("Error restoring default lessons:", error);
    return { success: false, error: "Không thể khôi phục danh sách bài học" };
  }

  });
}

// Xóa bài học
export async function deleteLesson(lessonId: string) {
  const admin = await requireAdmin("deleteLesson");
  return auditOutcome(admin.id, "deleteLesson", async () => {
  try {
    await auditedWrite(admin.id, "LESSON_DELETED", async tx => {
      const lesson = await tx.lesson.findUnique({ where: { id: lessonId }, select: { courseId: true, order: true, mediaAssetId: true } });
      if (!lesson) throw new Error("Bài học không tồn tại.");
      await tx.progress.deleteMany({ where: { lessonId } });
      const deleted = await tx.lesson.delete({ where: { id: lessonId } });
      await tx.lesson.updateMany({ where: { courseId: lesson.courseId, order: { gt: lesson.order } }, data: { order: { decrement: 1 } } });
      if (lesson.mediaAssetId) {
        const uses = await tx.lesson.count({ where: { mediaAssetId: lesson.mediaAssetId } });
        if (!uses) await tx.mediaAsset.update({ where: { id: lesson.mediaAssetId }, data: { status: "ORPHANED" } });
      }
      return deleted;
    });

    revalidatePath("/admin/lessons");
    revalidatePath("/learn");
    revalidatePath("/courses");
    return { success: true };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return { success: false, error: "Không thể xóa bài học này" };
  }

  });
}

// Tạo khóa học mới
export async function createCourse(data: { title: string; description?: string; thumbnail?: string; status?: LearningContentStatus }) {
  const admin = await requireAdmin("createCourse");
  return auditOutcome(admin.id, "createCourse", async () => {
  try {
    const normalized = normalizeCourseInput(data);
    const newCourse = await auditedWrite(admin.id, "COURSE_CREATED", tx => tx.course.create({
      data: {
        ...normalized,
        publishedAt: normalized.status === "PUBLISHED" ? new Date() : null,
      },
    }));

    revalidatePath("/admin/lessons");
    revalidatePath("/courses");
    revalidatePath("/learn");
    return { success: true, course: newCourse };
  } catch (error) {
    console.error("Error creating course:", error);
    return { success: false, error: error instanceof Error ? error.message : "Lỗi hệ thống khi tạo khóa học mới" };
  }

  });
}

export async function updateCourse(courseId: string, data: { title: string; description?: string; thumbnail?: string; status?: LearningContentStatus }) {
  const admin = await requireAdmin("updateCourse");
  return auditOutcome(admin.id, "updateCourse", async () => {
    try {
      const normalized = normalizeCourseInput(data);
      const course = await auditedWrite(admin.id, "COURSE_UPDATED", tx => tx.course.update({
        where: { id: courseId },
        data: { ...normalized, publishedAt: normalized.status === "PUBLISHED" ? new Date() : null },
      }));
      refreshLearningPages();
      return { success: true, course };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Không thể cập nhật khóa học." };
    }
  });
}

export async function deleteCourse(courseId: string) {
  const admin = await requireAdmin("deleteCourse");
  return auditOutcome(admin.id, "deleteCourse", async () => {
    try {
      const count = await prisma.lesson.count({ where: { courseId } });
      if (count) return { success: false, error: `Khóa học còn ${count} bài. Hãy chuyển hoặc xóa các bài trước.` };
      await auditedWrite(admin.id, "COURSE_DELETED", tx => tx.course.delete({ where: { id: courseId } }));
      refreshLearningPages();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Không thể xóa khóa học." };
    }
  });
}

export async function setLessonStatus(lessonId: string, status: LearningContentStatus) {
  const admin = await requireAdmin("setLessonStatus");
  return auditOutcome(admin.id, "setLessonStatus", async () => {
    if (!(["DRAFT", "PUBLISHED", "HIDDEN"] as string[]).includes(status)) return { success: false, error: "Trạng thái không hợp lệ." };
    try {
      const lesson = await auditedWrite(admin.id, "LESSON_STATUS_CHANGED", tx => tx.lesson.update({ where: { id: lessonId }, data: { status } }));
      refreshLearningPages();
      return { success: true, status: lesson.status };
    } catch {
      return { success: false, error: "Không thể cập nhật trạng thái bài học." };
    }
  });
}

export async function cleanupOrphanMedia() {
  const admin = await requireAdmin("cleanupOrphanMedia");
  return auditOutcome(admin.id, "cleanupOrphanMedia", async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const assets = await prisma.mediaAsset.findMany({
      where: { status: { in: ["UPLOADED", "ORPHANED"] }, createdAt: { lt: cutoff }, lessons: { none: {} } },
      select: { id: true, filename: true },
      take: 100,
    });
    let removed = 0;
    for (const asset of assets) {
      if (!mediaName(asset.filename)) continue;
      try { await fs.unlink(path.join(privateMediaRoot(), asset.filename)); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") continue; }
      await prisma.$transaction(async tx => {
        const deleted = await tx.mediaAsset.deleteMany({ where: { id: asset.id, lessons: { none: {} } } });
        if (deleted.count) await audit(tx, admin.id, "VIDEO_ORPHAN_DELETED", asset.id);
        removed += deleted.count;
      });
    }
    return { success: true, removed };
  });
}
