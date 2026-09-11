"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Bật / Tắt trạng thái VIP của bài học (1-click)
export async function toggleLessonVip(lessonId: string, newVipStatus: boolean) {
  try {
    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: { isVIP: newVipStatus },
    });
    revalidatePath("/admin/lessons");
    revalidatePath("/learn");
    revalidatePath("/courses");
    return { success: true, isVIP: updated.isVIP };
  } catch (error) {
    console.error("Error toggling Lesson VIP:", error);
    return { success: false, error: "Không thể cập nhật trạng thái VIP của bài học" };
  }
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
}) {
  const { title, moduleName = "Phần 1", content, videoUrl, isVIP = false } = data;

  if (!title || !title.trim()) {
    return { success: false, error: "Vui lòng nhập tên bài học" };
  }

  try {
    // 1. Đảm bảo có Course
    let courseId = data.courseId;
    if (!courseId) {
      let defaultCourse = await prisma.course.findFirst();
      if (!defaultCourse) {
        defaultCourse = await prisma.course.create({
          data: {
            title: "Masterclass Ứng Dụng AI Vào Bán Hàng Đa Nền Tảng",
            description: "Khóa học thực chiến giúp bạn gia tăng doanh số và tối ưu vận hành bằng AI",
          },
        });
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

    const newLesson = await prisma.lesson.create({
      data: {
        courseId,
        title: title.trim(),
        moduleName: moduleName?.trim() || "Phần 1",
        content: content?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
        order,
        isVIP: Boolean(isVIP),
      },
    });

    revalidatePath("/admin/lessons");
    revalidatePath("/learn");
    revalidatePath("/courses");
    return { success: true, lesson: newLesson };
  } catch (error) {
    console.error("Error creating lesson:", error);
    return { success: false, error: "Lỗi hệ thống khi tạo bài học mới" };
  }
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
  }
) {
  const { title, moduleName, content, videoUrl, isVIP, order, courseId } = data;

  if (!title || !title.trim()) {
    return { success: false, error: "Vui lòng nhập tên bài học" };
  }

  try {
    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: title.trim(),
        ...(moduleName ? { moduleName: moduleName.trim() } : {}),
        content: content !== undefined ? content?.trim() || null : undefined,
        videoUrl: videoUrl !== undefined ? videoUrl?.trim() || null : undefined,
        ...(order !== undefined && !isNaN(Number(order)) ? { order: Number(order) } : {}),
        ...(isVIP !== undefined ? { isVIP: Boolean(isVIP) } : {}),
        ...(courseId ? { courseId } : {}),
      },
    });

    revalidatePath("/admin/lessons");
    revalidatePath("/learn");
    revalidatePath("/courses");
    return { success: true, lesson: updated };
  } catch (error) {
    console.error("Error updating lesson:", error);
    return { success: false, error: "Lỗi khi cập nhật bài học" };
  }
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
  try {
    let course = await prisma.course.findFirst();
    if (!course) {
      course = await prisma.course.create({
        data: {
          title: "Masterclass Ứng Dụng AI Vào Bán Hàng Đa Nền Tảng",
          description: "Huấn luyện Seller sử dụng toàn bộ hệ sinh thái AI thay thế 1 team In-house 5 người trên Shopee, TikTok, FB.",
        },
      });
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
        await prisma.lesson.update({
          where: { id: match.id },
          data: { order: i + 1, moduleName },
        });
      } else {
        // Tạo lại bài học bị xóa
        await prisma.lesson.create({
          data: {
            courseId: course.id,
            title: def.title,
            moduleName,
            content: `Nội dung hướng dẫn chi tiết của ${def.title}. Học viên sử dụng các công cụ AI tương ứng để thực hành.`,
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            isVIP: def.isVIP,
            order: i + 1,
          },
        });
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
}

// Xóa bài học
export async function deleteLesson(lessonId: string) {
  try {
    await prisma.$transaction([
      prisma.progress.deleteMany({ where: { lessonId } }),
      prisma.lesson.delete({ where: { id: lessonId } }),
    ]);

    revalidatePath("/admin/lessons");
    revalidatePath("/learn");
    revalidatePath("/courses");
    return { success: true };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return { success: false, error: "Không thể xóa bài học này" };
  }
}

// Tạo khóa học mới
export async function createCourse(data: { title: string; description?: string }) {
  const { title, description } = data;
  if (!title || !title.trim()) {
    return { success: false, error: "Vui lòng nhập tên khóa học" };
  }

  try {
    const newCourse = await prisma.course.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
      },
    });

    revalidatePath("/admin/lessons");
    revalidatePath("/courses");
    revalidatePath("/learn");
    return { success: true, course: newCourse };
  } catch (error) {
    console.error("Error creating course:", error);
    return { success: false, error: "Lỗi hệ thống khi tạo khóa học mới" };
  }
}


