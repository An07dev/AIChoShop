import "dotenv/config";
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log("Đảm bảo khóa học mẫu tồn tại mà không xóa dữ liệu hiện có...");
  const courseTitle = "Masterclass Ứng Dụng AI Vào Bán Hàng Đa Nền Tảng";
  let course = await prisma.course.findFirst({ where: { title: courseTitle } });
  if (!course) course = await prisma.course.create({ data: {
      title: courseTitle,
      description: "Huấn luyện Seller sử dụng toàn bộ hệ sinh thái AI (ChatGPT, Sinh ảnh, Giọng nói, Avatar ảo) thay thế 1 team In-house 5 người trên Shopee, TikTok, FB.",
      status: "DRAFT",
    } });

  const lessonsData = [
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

  const existing = new Set((await prisma.lesson.findMany({ where: { courseId: course.id }, select: { title: true } })).map(item => item.title.trim().toLowerCase()));
  console.log("Bổ sung các bài mẫu còn thiếu ở trạng thái nháp...");
  for (let i = 0; i < lessonsData.length; i++) {
    if (existing.has(lessonsData[i].title.trim().toLowerCase())) continue;
    await prisma.lesson.create({
      data: {
        title: lessonsData[i].title,
        content: null,
        videoUrl: null,
        isVIP: lessonsData[i].isVIP,
        status: "DRAFT",
        order: i + 1,
        courseId: course.id,
      }
    });
  }

  console.log("Seed an toàn hoàn tất. Không có dữ liệu nào bị xóa.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
