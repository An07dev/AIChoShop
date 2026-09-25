/**
 * AI Biến Video Thành 5 Kênh Contract - Omnichannel Content Repurposer
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema), Bộ Prompt Thực Chiến Sàn TMĐT
 * & Resilient Parser 4 Tầng Bền Bỉ (Tương thích ngược 100%)
 */

export interface VideoRepurposerInputs {
  productName: string;
  videoScript: string;
  brandTone?: "friendly" | "gen_z" | "expert" | string;
  callToAction?: string;
  promotionOffer?: string;
}

// -------------------------------------------------------------
// 1. KÊNH 1: BÀI ĐĂNG FACEBOOK GROUP (Seeding & Nuôi Tương Tác)
// -------------------------------------------------------------
export interface SeedingCommentItem {
  id: number;
  role: string; // VD: "Nick phụ hỏi link săn sale", "Chủ post rep giải đáp kèm link", "Khách feedback uy tín"
  comment: string;
}

export interface FbGroupPostData {
  headline: string;
  bodyText: string;
  discussionHook: string;
  seedingComments: SeedingCommentItem[];
  rawText?: string;
}

// -------------------------------------------------------------
// 2. KÊNH 2: BÀI ĐĂNG FANPAGE FACEBOOK (Tối Ưu Click & Inbox)
// -------------------------------------------------------------
export interface FanpagePostData {
  hookLine: string;
  bodyHighlights: string[];
  offerDetails: string;
  callToAction: string;
  hashtags: string[];
  rawText?: string;
}

// -------------------------------------------------------------
// 3. KÊNH 3: KỊCH BẢN CHUỖI 5 SLIDE CAROUSEL (Lemon8 / FB Album / Instagram / TikTok Photo)
// -------------------------------------------------------------
export interface CarouselSlideItem {
  slideNumber: number; // 1 đến 5
  slideType: "cover" | "pain_point" | "usp_solution" | "pro_tip" | "cta_save";
  typeLabel: string; // "Slide 1: Bìa Giật Tít (Hook)", "Slide 2: Nỗi Đau Thường Gặp", v.v.
  headline: string; // Chữ in to nổi bật đè lên ảnh (<15 từ)
  bodyContent: string; // Nội dung diễn giải ngắn gọn (<25 từ)
  visualDescription: string; // Gợi ý góc chụp, đồ họa hoặc biểu cảm KOC
}

export interface CarouselPostData {
  conceptTitle: string;
  targetPlatform: string; // "Lemon8 / TikTok Photo / Instagram / FB Album"
  slides: CarouselSlideItem[];
  caption: string;
  rawText?: string;
}

// -------------------------------------------------------------
// 4. KÊNH 4: BÀI VIẾT REVIEW CHUẨN SEO (Website / Blog Affiliate)
// -------------------------------------------------------------
export interface SeoBlogPostData {
  seoTitle: string;
  metaDescription: string;
  introduction: string;
  mainContent: string;
  pros: string[];
  cons: string[];
  verdict: string;
  ratingScore?: string; // "9.5/10"
  rawText?: string;
}

// -------------------------------------------------------------
// 5. KÊNH 5: TIN NHẮN ZALO OA / CHĂM SÓC KHÁCH HÀNG (Remarketing 0 đồng)
// -------------------------------------------------------------
export interface ZaloOaMessageData {
  customerGreeting: string;
  videoValueRecap: string;
  exclusiveDeal: string;
  ctaText: string;
  rawText?: string;
}

// -------------------------------------------------------------
// 6. KIỂM SOÁT CHÍNH SÁCH SÀN (Policy Compliance)
// -------------------------------------------------------------
export interface PolicyCompliance {
  safeScore: number; // 0 - 100
  bannedWordsAvoided: string[]; // Các từ nhạy cảm đã né tránh
  channelTips: string[]; // Lưu ý phân phối nội dung trên các kênh
}

// -------------------------------------------------------------
// CẤU TRÚC TỔNG THỂ DỮ LIỆU ĐẦU RA (Root Data)
// -------------------------------------------------------------
export interface VideoRepurposerData {
  productName?: string;
  fbGroupPost: FbGroupPostData;
  fanpagePost: FanpagePostData;
  carouselPost: CarouselPostData;
  seoBlogPost: SeoBlogPostData;
  zaloOaMessage: ZaloOaMessageData;
  policyCompliance: PolicyCompliance;
}

/**
 * System Prompt chuẩn hóa cho Giám Đốc Chiến Lược Nội Dung Đa Kênh (Omnichannel Performance Director)
 */
export const REPURPOSER_SYSTEM_PROMPT = `Bạn là Giám đốc Chiến lược Nội dung Đa Kênh (Omnichannel Performance Director) hàng đầu tại thị trường TMĐT Việt Nam.
Nhiệm vụ của bạn là nhận vào kịch bản/lời thoại của 1 video ngắn (TikTok/Reels/Shorts) và chuyển đổi thành 5 ĐỊNH DẠNG NỘI DUNG CHUYÊN BIỆT cho 5 kênh phân phối khác nhau.

QUY TẮC BẮT BUỘC:
1. BẮT BUỘC trả về định dạng JSON thuần túy (Valid JSON Object), không bao bọc thêm bất kỳ lời dẫn hay giải thích ngoài JSON.
2. 5 Kênh phải mang 5 giọng văn, mục tiêu và văn hóa nền tảng HOÀN TOÀN KHÁC NHAU, tuyệt đối không sao chép nguyên văn qua lại:
   - KÊNH 1 - FB Group Seeding: Tâm sự người dùng thật, kể câu chuyện trải nghiệm (Storytelling), né tránh tuyệt đối từ ngữ quảng cáo lộ liễu để qua mặt kiểm duyệt Admin. BẮT BUỘC có 'discussionHook' (câu hỏi gợi mở kết bài) và mảng 'seedingComments' gồm 3 kịch bản bình luận mồi (1 nick phụ hỏi link, 1 chủ post giải đáp kèm mã, 1 feedback trải nghiệm).
   - KÊNH 2 - Fanpage Facebook: Viết theo công thức AIDA/PAS tối ưu tỷ lệ click và nhắn tin (Click & Inbox). BẮT BUỘC có 'hookLine' (giật tít chạm nỗi đau), 'bodyHighlights' (3-4 gạch đầu dòng tính năng/lợi ích kèm emoji bắt mắt), 'offerDetails' (quà tặng/deal sốc) và 'callToAction' dứt khoát.
   - KÊNH 3 - Chuỗi 5 Slide Carousel (Lemon8 / TikTok Photo / Instagram): BẮT BUỘC có ĐỦ 5 SLIDE (slideNumber: 1, 2, 3, 4, 5).
     * Slide 1 (cover): Bìa giật tít dạng Bí quyết / Sai lầm / Tips
     * Slide 2 (pain_point): Nỗi đau hoặc ngộ nhận phổ biến
     * Slide 3 (usp_solution): Bóc tách giải pháp & công nghệ vượt trội
     * Slide 4 (pro_tip): Mẹo sử dụng thực tế độc quyền
     * Slide 5 (cta_save): Kêu gọi lưu bài viết & thả tim
     Mỗi slide PHẢI có 'headline' (<15 từ), 'bodyContent' (<25 từ) và 'visualDescription' (mô tả góc chụp/đồ họa thiết kế).
   - KÊNH 4 - Bài Viết Review Chuẩn SEO (Website / Blog Affiliate): Viết chuẩn SEO On-page với 'seoTitle' (50-65 ký tự), 'metaDescription' (150-160 ký tự), 'introduction', 'mainContent', mảng 'pros' (3-4 ưu điểm), mảng 'cons' (1-2 nhược điểm thực tế để tăng độ tin cậy) và 'verdict' (lời khuyên ai nên mua).
   - KÊNH 5 - Tin Nhắn Zalo OA CSKH: Dành cho tệp khách cũ/khách quan tâm để remarketing 0 đồng. Xưng hô thân mật Em - Anh/Chị, tóm tắt giá trị từ video, gửi deal/voucher bí mật có giới hạn giờ và CTA thúc giục nhận ưu đãi.
3. Kiểm soát chính sách (policyCompliance):
   - Đảm bảo KHÔNG sử dụng các từ cấm: 'cam kết 100%', 'trị dứt điểm', 'số 1 thị trường', 'rẻ nhất Việt Nam', 'vĩnh viễn'...
   - Ghi nhận các từ cấm đã né tránh vào 'bannedWordsAvoided' và lưu ý phân phối vào 'channelTips'.`;

/**
 * Xây dựng User Prompt với định dạng JSON Schema rõ ràng
 */
export function buildVideoRepurposerPrompt(inputs: VideoRepurposerInputs): string {
  const toneMap: Record<string, string> = {
    gen_z: "Hài hước, bắt trend, Gen Z năng động, từ ngữ viral tự nhiên",
    expert: "Chuyên gia uy tín, chuyên sâu, phân tích logic, khách quan và đáng tin cậy",
    friendly: "Tâm sự gần gũi, chân thật, như bạn thân chia sẻ trải nghiệm đời thường",
  };

  const toneText = toneMap[inputs.brandTone || "friendly"] || inputs.brandTone || "Tâm sự gần gũi";
  const ctaText = inputs.callToAction || "Bình luận nhận link / Nhắn tin nhận ưu đãi";
  const productName = inputs.productName || "Sản phẩm";
  const videoScript = inputs.videoScript || "";
  const promo = inputs.promotionOffer ? `\n- Chương trình ưu đãi kèm theo: ${inputs.promotionOffer}` : "";

  return `Hãy chuyển đổi kịch bản video sau đây thành 5 ĐỊNH DẠNG NỘI DUNG CHUYÊN BIỆT theo đúng định dạng JSON Schema quy định:

THÔNG TIN ĐẦU VÀO:
- Tên sản phẩm / thương hiệu: ${productName}
- Kịch bản / lời thoại video gốc:
"""
${videoScript}
"""
- Mục tiêu kêu gọi hành động (CTA): ${ctaText}
- Giọng điệu chủ đạo: ${toneText}${promo}

QUY TẮC ĐỘ DÀI & TỐI ƯU HIỆU NĂNG:
- Viết cô đọng, sắc bén, đánh trúng tâm lý, TUYỆT ĐỐI KHÔNG viết lan man hay lặp ý.
- FB Group: 100-150 từ tâm sự đời thực + 3 comment mồi ngắn gọn.
- Fanpage: 80-120 từ, 3 gạch đầu dòng USP nổi bật + CTA.
- Carousel 5 Slide: Mỗi slide BẮT BUỘC dưới 20 từ để vừa khung thiết kế ảnh.
- SEO Blog: 150-220 từ, tập trung vào bảng Pros & Cons và Lời khuyên ai nên mua.
- Zalo OA: 50-80 từ, ngắn gọn, thân tình, tặng deal riêng.

BẮT BUỘC TRẢ VỀ ĐÚNG CẤU TRÚC JSON SAU ĐÂY (Valid JSON Object):
{
  "productName": "${productName}",
  "fbGroupPost": {
    "headline": "Tiêu đề tâm sự tự nhiên, không giật tít bán hàng",
    "bodyText": "Nội dung chia sẻ trải nghiệm chân thật (100-150 từ)",
    "discussionHook": "Câu hỏi kết bài gợi mở thảo luận tự nhiên",
    "seedingComments": [
      { "id": 1, "role": "Nick phụ hỏi link săn sale", "comment": "Bình luận hỏi link ngắn gọn" },
      { "id": 2, "role": "Chủ post rep giải đáp kèm link", "comment": "Phản hồi kèm link ưu đãi" },
      { "id": 3, "role": "Khách feedback uy tín", "comment": "Kiểm chứng chất lượng thực tế" }
    ]
  },
  "fanpagePost": {
    "hookLine": "1-2 dòng giật tít cực mạnh chạm nỗi đau hoặc FOMO",
    "bodyHighlights": [
      "🔥 Điểm vượt trội 1 kèm số liệu",
      "⚡ Tiện ích độc quyền 2",
      "🛡️ Cam kết & bảo hành 3"
    ],
    "offerDetails": "Ưu đãi độc quyền hôm nay",
    "callToAction": "Kêu gọi nhắn tin / bình luận",
    "hashtags": ["#TenSanPham", "#Review", "#TikTokShop", "#ShopeeMall"]
  },
  "carouselPost": {
    "conceptTitle": "Chủ đề chuỗi ảnh (VD: 3 Lý Do & Bí Quyết...)",
    "targetPlatform": "Lemon8 / TikTok Photo / Instagram",
    "slides": [
      {
        "slideNumber": 1,
        "slideType": "cover",
        "typeLabel": "Slide 1: Bìa Giật Tít (Hook)",
        "headline": "TIÊU ĐỀ BÌA IN ĐẬM",
        "bodyContent": "Phụ đề kích thích lướt tiếp (<20 từ)",
        "visualDescription": "Mô tả ảnh bìa tương phản cao"
      },
      {
        "slideNumber": 2,
        "slideType": "pain_point",
        "typeLabel": "Slide 2: Nỗi Đau Phổ Biến",
        "headline": "SAI LẦM THƯỜNG GẶP",
        "bodyContent": "Nỗi đau thực tế (<20 từ)",
        "visualDescription": "Ảnh minh họa vấn đề"
      },
      {
        "slideNumber": 3,
        "slideType": "usp_solution",
        "typeLabel": "Slide 3: Giải Pháp Đột Phá",
        "headline": "CÔNG NGHỆ VƯỢT TRỘI",
        "bodyContent": "Giải pháp cốt lõi (<20 từ)",
        "visualDescription": "Ảnh cận cảnh tính năng sản phẩm"
      },
      {
        "slideNumber": 4,
        "slideType": "pro_tip",
        "typeLabel": "Slide 4: Mẹo Sử Dụng Thực Chiến",
        "headline": "MẸO TIẾT KIỆM THỜI GIAN",
        "bodyContent": "Bí quyết áp dụng ngay (<20 từ)",
        "visualDescription": "Ảnh hướng dẫn thao tác"
      },
      {
        "slideNumber": 5,
        "slideType": "cta_save",
        "typeLabel": "Slide 5: Kêu Gọi Lưu & Thả Tim",
        "headline": "LƯU LẠI ĐỂ SĂN SALE",
        "bodyContent": "Nhấn Thả tim ❤️ và Lưu bài 🔖 (<20 từ)",
        "visualDescription": "Đồ họa icon Trái tim + Nút Bookmark"
      }
    ],
    "caption": "Caption ngắn đăng kèm album ảnh"
  },
  "seoBlogPost": {
    "seoTitle": "[Review Thực Tế] Tên Sản Phẩm Có Tốt Không?",
    "metaDescription": "Đánh giá chi tiết ưu nhược điểm thực tế sau 30 ngày sử dụng.",
    "introduction": "Mở đầu lôi cuốn (2-3 câu)",
    "mainContent": "Phân tích trải nghiệm sử dụng thực tế (1-2 đoạn ngắn gọn)",
    "pros": ["Ưu điểm 1", "Ưu điểm 2", "Ưu điểm 3"],
    "cons": ["Nhược điểm 1", "Nhược điểm 2"],
    "verdict": "Lời khuyên tổng kết ai nên mua",
    "ratingScore": "9.4/10"
  },
  "zaloOaMessage": {
    "customerGreeting": "Lời chào thân tình Em - Anh/Chị",
    "videoValueRecap": "Tóm tắt 1-2 giá trị hữu ích từ video",
    "exclusiveDeal": "Mã giảm giá độc quyền có hạn",
    "ctaText": "Link nhận ưu đãi ngay"
  },
  "policyCompliance": {
    "safeScore": 96,
    "bannedWordsAvoided": ["cam kết 100%", "trị dứt điểm", "rẻ nhất thị trường"],
    "channelTips": [
      "FB Group: Ưu tiên dùng câu hỏi ở cuối bài để kéo bình luận tự nhiên.",
      "Fanpage: Ghim link ở dòng đầu tiên của bình luận để tránh bóp reach.",
      "Zalo OA: Khung giờ gửi tin tốt nhất là 11h45 hoặc 19h30."
    ]
  }
}`;
}

// -------------------------------------------------------------
// DỮ LIỆU MẪU CHUẨN THỰC CHIẾN (Dành cho Demo / Khởi tạo)
// -------------------------------------------------------------
export const SAMPLE_REPURPOSER_DATA: VideoRepurposerData = {
  productName: "Nồi Chiên Không Dầu Hơi Nước Lock&Care 7L",
  fbGroupPost: {
    headline: "Mọi người trong nhóm có ai từng mua nồi chiên về xong cất góc bếp như em không? 😭",
    bodyText: `Hồi trước hí hửng mua con nồi cơ 1 triệu mấy về nướng đùi gà với sườn, chiên xong thịt nó khô đét, xác như rơm, ăn nghẹn cả họng. Em nản quá quẳng xó cả nửa năm.

Đợt vừa rồi bà chị họ làm bên dinh dưỡng sang chơi, bả chỉ cho quả nồi chiên hơi nước 2 trong 1 Lock&Care 7L này. Ban đầu em cũng sợ bị lùa gà, nhưng bả bảo: "Mày nướng nhiệt 200 độ mà nó phun sương nano liên tục thì nước ngọt trong thịt sao bốc hơi được!".

Thế là em liều bấm bụng rước về. Thề với các bác hôm qua em nướng thử nguyên con gà ta 2.3kg:
- Bên ngoài: Da vàng ươm màu cánh gián, giòn rụm kêu rôm rốp.
- Bên trong: Xé ra khói nghi ngút, nước thịt ứa ra mọng sũng, mềm ngọt dã man!
- Rửa ráy: Lòng nồi Ceramic 5 lớp, nướng xong ngâm nước ấm tráng nhẹ là sạch bong, không phải cọ toát mồ hôi.`,
    discussionHook: "Có bác nào cũng đang xài dòng hơi nước này của Lock&Care chưa ạ? Cho em xin thêm vài công thức nướng thịt xiên với cá hồi với!",
    seedingComments: [
      {
        id: 1,
        role: "Nick phụ hỏi link săn sale",
        comment: "Bác mua ở đâu chính hãng đấy cho em xin link với, nhìn con gà mọng nước mê quá!",
      },
      {
        id: 2,
        role: "Chủ post rep giải đáp kèm link",
        comment: "Em đặt gian hàng Mall chính hãng này bác ơi: https://shopee.vn/lockcare-official (Đang có mã giảm 200k đấy ạ)",
      },
      {
        id: 3,
        role: "Khách feedback uy tín",
        comment: "Chuẩn luôn em cũng dùng con này 4 tháng nay rồi, nướng bánh mì hay làm sườn nướng mật ong đỉnh chóp!",
      },
    ],
  },
  fanpagePost: {
    hookLine: "🚨 CẢNH BÁO: ĐỪNG MUA NỒI CHIÊN KHÔNG DẦU TRUYỀN THỐNG NẾU BẠN CHƯA BIẾT ĐIỀU NÀY!",
    bodyHighlights: [
      "🔥 Công nghệ nướng kép Hydro-Air: Vừa đối lưu 200°C vừa phun sương nano, giúp da gà giòn rụm bên ngoài nhưng thịt bên trong mọng nước 100%.",
      "🍗 Dung tích khủng 7 Lít: Nướng vừa vặn nguyên con gà 2.5kg hoặc 2 miếng sườn tảng cho cả gia đình 4-6 người ăn thoải mái.",
      "✨ Lòng nồi Ceramic Nano 5 lớp: Chống dính tuyệt đối, không chứa PFOA độc hại, tráng nước ấm là sạch bong trong 10 giây.",
      "👆 8 Chế độ cài đặt sẵn 1 chạm: Chiên gà, nướng sườn, khoai tây, hấp bánh bao, rã đông... thao tác cực kỳ đơn giản.",
    ],
    offerDetails: "🎁 ƯU ĐÃI ĐẶC QUYỀN DUY NHẤT HÔM NAY: Giảm ngay 200.000đ + Tặng kèm khay hứng mỡ inox 304 & Sách 50 công thức món ngon trị giá 350.000đ. Miễn phí vận chuyển toàn quốc!",
    callToAction: "👇 Bấm vào nút 'GỬI TIN NHẮN' hoặc để lại bình luận 'NỒI CHIÊN' để nhận link ưu đãi chính hãng ngay hôm nay!",
    hashtags: ["#NoiChienKhongDau", "#NoiChienHoiNuoc", "#LockCare", "#MonNgonMoiNgay", "#GiaDungThongMinh"],
  },
  carouselPost: {
    conceptTitle: "3 LÝ DO NỒI CHIÊN THƯỜNG BỊ BỎ XÓ & VÌ SAO NÊN ĐỔI SANG NỒI CHIÊN HƠI NƯỚC?",
    targetPlatform: "Lemon8 / TikTok Photo / Instagram",
    slides: [
      {
        slideNumber: 1,
        slideType: "cover",
        typeLabel: "Slide 1: Bìa Giật Tít (Hook)",
        headline: "NỒI CHIÊN BỊ BỎ XÓ?",
        bodyContent: "3 Lý do khiến 90% gia đình chán nồi chiên truyền thống & Giải pháp mới!",
        visualDescription: "Ảnh cận cảnh đùi gà nướng vàng ươm mọng nước, chữ vàng tương phản trên nền tối sang trọng",
      },
      {
        slideNumber: 2,
        slideType: "pain_point",
        typeLabel: "Slide 2: Nỗi Đau Khách Hàng",
        headline: "THỊT KHÔ NHƯ RƠM",
        bodyContent: "Nhiệt nóng đối lưu thông thường rút cạn 90% độ ẩm, ăn xác và nghẹn họng.",
        visualDescription: "Ảnh so sánh miếng thịt nướng bị teo tóp, khô cứng ở nồi thường",
      },
      {
        slideNumber: 3,
        slideType: "usp_solution",
        typeLabel: "Slide 3: Giải Pháp Đột Phá",
        headline: "PHUN SƯƠNG NANO 200°C",
        bodyContent: "Công nghệ nướng hơi nước khóa trọn nước ngọt tự nhiên, vỏ giòn ruột mọng.",
        visualDescription: "Hình ảnh tia nước nano phun sương bao quanh thực phẩm trong lòng nồi",
      },
      {
        slideNumber: 4,
        slideType: "pro_tip",
        typeLabel: "Slide 4: Tiện Ích Độc Quyền",
        headline: "RỬA NỒI TRONG 10 GIÂY",
        bodyContent: "Lớp men gốm Ceramic không bám dính dầu mỡ cháy khét, xả nước là sạch.",
        visualDescription: "Ảnh tay cầm vòi xả nước, dầu mỡ trôi tuột khỏi lòng nồi cực kỳ sạch bóng",
      },
      {
        slideNumber: 5,
        slideType: "cta_save",
        typeLabel: "Slide 5: Kêu Gọi Lưu & Thả Tim",
        headline: "LƯU LẠI ĐỂ SĂN SALE",
        bodyContent: "Nhấn Thả tim ❤️ và Lưu bài viết 🔖 để mở ra xem công thức và mã giảm giá nhé!",
        visualDescription: "Đồ họa icon Heart + Bookmark màu hồng neon bắt mắt kèm hộp quà tặng",
      },
    ],
    caption: "Bí quyết nướng thịt ngoài giòn trong mọng nước chuẩn nhà hàng đây cả nhà ơi! Lưu ngay bài này lại nhé ✨",
  },
  seoBlogPost: {
    seoTitle: "[Review Thực Tế] Nồi Chiên Không Dầu Hơi Nước Lock&Care 7L Có Tốt Không? Có Đáng Tiền Không?",
    metaDescription: "Đánh giá chân thật ưu nhược điểm nồi chiên không dầu hơi nước Lock&Care 7L sau 30 ngày sử dụng thực tế. So sánh chi tiết với nồi chiên truyền thống.",
    introduction: "Khác với các dòng nồi chiên không dầu truyền thống thường làm thực phẩm bị khô cứng, dòng nồi chiên hơi nước 2 trong 1 Lock&Care 7L đang tạo nên cơn sốt nhờ khả năng vừa nướng giòn vừa giữ ẩm. Liệu đây có phải là món đồ gia dụng đáng đầu tư nhất năm nay?",
    mainContent: `1. Cơ chế hoạt động của công nghệ nướng hơi nước:
Sản phẩm tích hợp bình chứa nước tinh khiết và hệ thống bơm phun sương nano đối lưu trực tiếp vào khoang nướng 200°C. Cơ chế này giúp thực phẩm đạt độ giòn ở lớp vỏ bên ngoài nhưng vẫn giữ lại tới 95% độ ẩm tự nhiên bên trong.

2. Trải nghiệm thực tế khi nướng các món ăn:
- Nướng gà nguyên con: Da gà vàng ươm cánh gián, thịt bên trong mềm ngọt, không cần canh trở mặt.
- Nướng cá hồi & hải sản: Không bị khô xơ hay tanh, mỡ thừa chảy xuống khay hứng bên dưới.
- Hấp rau củ & rã đông: Tiện lợi, không làm biến tính thực phẩm như lò vi sóng.`,
    pros: [
      "Khả năng giữ ẩm vượt trội: Thịt nướng mềm ngọt, da giòn rụm chuẩn vị.",
      "Dung tích lớn 7L: Phù hợp cho gia đình từ 3 - 6 thành viên.",
      "Lòng nồi tráng men Ceramic 5 lớp: An toàn cho sức khỏe, cọ rửa cực kỳ dễ dàng.",
      "Giảm tới 90% lượng mỡ thừa: Tốt cho người ăn kiêng, tim mạch.",
    ],
    cons: [
      "Kích thước nồi tương đối lớn, cần bố trí góc bếp thông thoáng.",
      "Cần chú ý châm nước tinh khiết vào khay trước khi chọn chế độ nướng hơi nước.",
    ],
    verdict: "Lock&Care 7L là sự đầu tư cực kỳ xứng đáng cho các gia đình yêu thích món nướng nhưng ngại thịt bị khô hoặc nhà có trẻ nhỏ, người cao tuổi cần ăn mềm.",
    ratingScore: "9.4/10",
  },
  zaloOaMessage: {
    customerGreeting: "Dạ em chào Anh/Chị! 🌿",
    videoValueRecap: "Hôm nay Lock&Care có một bất ngờ nhỏ dành riêng cho khách hàng thân thiết. Em gửi Anh/Chị video thực tế nướng nguyên con gà da giòn mọng nước bằng chiếc Nồi Chiên Hơi Nước 7L đang cực hot bên em ạ.",
    exclusiveDeal: "🎁 Em xin gửi riêng Anh/Chị mã giảm giá độc quyền: [LOCKCARE200K] - Giảm ngay 200.000đ trực tiếp vào đơn hàng hôm nay, kèm quà tặng sách 50 công thức món ngon cho gia đình.",
    ctaText: "👉 Số lượng voucher ưu đãi có hạn trong 24h, Anh/Chị bấm vào link dưới đây để chọn màu và nhận ưu đãi nhé: https://lockcare.vn/deal-hoi-nuoc-7l\n(Nếu cần tư vấn thêm dung tích, Anh/Chị cứ nhắn lại cho em nhé ạ!)",
  },
  policyCompliance: {
    safeScore: 98,
    bannedWordsAvoided: [
      "cam kết 100%",
      "chữa dứt điểm",
      "rẻ nhất thị trường",
      "số 1 Việt Nam",
      "trị tận gốc",
    ],
    channelTips: [
      "Facebook Group: Ưu tiên dùng câu hỏi ở cuối bài để kéo lượng bình luận tự nhiên lên Top bảng tin.",
      "Fanpage: Đặt link mua hàng ở dòng đầu của bình luận ghim thay vì dán thẳng vào thân bài để tránh bóp tương tác.",
      "Lemon8 / TikTok: Sử dụng ảnh thật tự chụp thay vì ảnh mạng để tăng 300% lượt lưu (Bookmark).",
      "Zalo OA: Khung giờ gửi tin tốt nhất là 11h45 trưa hoặc 19h30 tối.",
    ],
  },
};

// -------------------------------------------------------------
// BỘ RESILIENT PARSER 4 TẦNG BỀN BỈ (Tương Thích Ngược 100%)
// -------------------------------------------------------------
export function parseVideoRepurposerResult(raw: string): VideoRepurposerData {
  if (!raw || typeof raw !== "string") {
    return SAMPLE_REPURPOSER_DATA;
  }

  const trimmed = raw.trim();

  // TẦNG 1: Thử parse trực tiếp nếu là JSON thuần túy
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (isValidRepurposerData(parsed)) {
        return normalizeRepurposerData(parsed);
      }
    } catch {
      // Tiếp tục xuống tầng dưới
    }
  }

  // TẦNG 2: Bóc tách JSON nằm trong markdown code block ```json ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (isValidRepurposerData(parsed)) {
        return normalizeRepurposerData(parsed);
      }
    } catch {
      // Tiếp tục xuống tầng dưới
    }
  }

  // TẦNG 3: Tìm chuỗi JSON lớn nhất, sửa lỗi cú pháp & Tự động cân bằng ngoặc (Auto-Repair Truncated JSON)
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonSub = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      // Sửa lỗi dấu phẩy thừa trước dấu đóng } hoặc ]
      const cleaned = jsonSub
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/[\u201C\u201D]/g, '"') // Sửa ngoặc kép cong
        .replace(/\t/g, " ");
      const parsed = JSON.parse(cleaned);
      if (isValidRepurposerData(parsed)) {
        return normalizeRepurposerData(parsed);
      }
    } catch {
      // Thử tiếp xuống bước cân bằng ngoặc bên dưới
    }
  }

  // TẦNG 3.5: Cứu chuỗi JSON bị ngắt giữa chừng (Truncated / Incomplete JSON) do trần token hoặc mạng rớt
  if (firstBrace !== -1) {
    try {
      const repaired = repairTruncatedJson(trimmed.substring(firstBrace));
      const parsed = JSON.parse(repaired);
      if (isValidRepurposerData(parsed)) {
        return normalizeRepurposerData(parsed);
      }
    } catch {
      // Tiếp tục xuống tầng 4
    }
  }

  // TẦNG 4: Fallback Regex thông minh khi nhận dữ liệu Markdown cũ
  return parseLegacyMarkdownToRepurposerData(raw);
}

/**
 * THUẬT TOÁN TỰ ĐỘNG CÂN BẰNG NGOẶC VÀ CỨU CHUỖI JSON BỊ NGẮT CỤT
 * Sử dụng Stack để theo dõi trạng thái ngoặc mở/đóng và chuỗi ký tự,
 * tự động đóng các ngoặc kép và ngoặc nhọn/vuông còn thiếu.
 */
export function repairTruncatedJson(rawJson: string): string {
  let str = rawJson.trim();
  const firstBrace = str.indexOf("{");
  if (firstBrace === -1) return str;
  str = str.substring(firstBrace);

  // Sửa ngoặc kép cong và khoảng trắng tab
  str = str.replace(/[\u201C\u201D]/g, '"').replace(/\t/g, " ");

  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === "{" || ch === "[") {
        stack.push(ch);
      } else if (ch === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{") {
          stack.pop();
        }
      } else if (ch === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") {
          stack.pop();
        }
      }
    }
  }

  // Nếu chuỗi kết thúc bên trong một string ("..."), đóng dấu ngoặc kép lại
  if (inString) {
    str += '"';
  }

  // Xóa dấu phẩy thừa ở cuối nếu có
  str = str.replace(/,\s*$/, "");

  // Đóng tất cả các ngoặc mở còn thiếu theo thứ tự ngược lại của Stack
  while (stack.length > 0) {
    const open = stack.pop();
    str = str.replace(/,\s*$/, "");
    if (open === "{") {
      str += "}";
    } else if (open === "[") {
      str += "]";
    }
  }

  // Sửa lỗi dấu phẩy thừa trước các dấu đóng
  str = str.replace(/,\s*([}\]])/g, "$1");

  return str;
}

/**
 * Kiểm tra tính hợp lệ tối thiểu của đối tượng VideoRepurposerData
 */
function isValidRepurposerData(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  return Boolean(
    obj.fbGroupPost ||
    obj.fanpagePost ||
    obj.carouselPost ||
    obj.seoBlogPost ||
    obj.zaloOaMessage
  );
}

/**
 * Chuẩn hóa dữ liệu đảm bảo không bao giờ bị undefined/null
 */
function normalizeRepurposerData(data: any): VideoRepurposerData {
  return {
    productName: data.productName || "Sản phẩm",
    fbGroupPost: {
      headline: data.fbGroupPost?.headline || "",
      bodyText: data.fbGroupPost?.bodyText || "",
      discussionHook: data.fbGroupPost?.discussionHook || "",
      seedingComments: Array.isArray(data.fbGroupPost?.seedingComments)
        ? data.fbGroupPost.seedingComments.map((c: any, idx: number) => ({
            id: c.id || idx + 1,
            role: c.role || "Bình luận mồi",
            comment: c.comment || String(c),
          }))
        : [],
    },
    fanpagePost: {
      hookLine: data.fanpagePost?.hookLine || "",
      bodyHighlights: Array.isArray(data.fanpagePost?.bodyHighlights)
        ? data.fanpagePost.bodyHighlights
        : [],
      offerDetails: data.fanpagePost?.offerDetails || "",
      callToAction: data.fanpagePost?.callToAction || "",
      hashtags: Array.isArray(data.fanpagePost?.hashtags) ? data.fanpagePost.hashtags : [],
    },
    carouselPost: {
      conceptTitle: data.carouselPost?.conceptTitle || "Kịch bản Chuỗi 5 Slide Ảnh",
      targetPlatform: data.carouselPost?.targetPlatform || "Lemon8 / TikTok Photo / Instagram",
      slides: Array.isArray(data.carouselPost?.slides)
        ? data.carouselPost.slides.map((s: any, idx: number) => ({
            slideNumber: s.slideNumber || idx + 1,
            slideType: s.slideType || (idx === 0 ? "cover" : idx === 4 ? "cta_save" : "usp_solution"),
            typeLabel: s.typeLabel || `Slide ${idx + 1}`,
            headline: s.headline || "",
            bodyContent: s.bodyContent || "",
            visualDescription: s.visualDescription || "",
          }))
        : [],
      caption: data.carouselPost?.caption || "",
    },
    seoBlogPost: {
      seoTitle: data.seoBlogPost?.seoTitle || "",
      metaDescription: data.seoBlogPost?.metaDescription || "",
      introduction: data.seoBlogPost?.introduction || "",
      mainContent: data.seoBlogPost?.mainContent || "",
      pros: Array.isArray(data.seoBlogPost?.pros) ? data.seoBlogPost.pros : [],
      cons: Array.isArray(data.seoBlogPost?.cons) ? data.seoBlogPost.cons : [],
      verdict: data.seoBlogPost?.verdict || "",
      ratingScore: data.seoBlogPost?.ratingScore || "9.0/10",
    },
    zaloOaMessage: {
      customerGreeting: data.zaloOaMessage?.customerGreeting || "",
      videoValueRecap: data.zaloOaMessage?.videoValueRecap || "",
      exclusiveDeal: data.zaloOaMessage?.exclusiveDeal || "",
      ctaText: data.zaloOaMessage?.ctaText || "",
    },
    policyCompliance: {
      safeScore: typeof data.policyCompliance?.safeScore === "number" ? data.policyCompliance.safeScore : 95,
      bannedWordsAvoided: Array.isArray(data.policyCompliance?.bannedWordsAvoided)
        ? data.policyCompliance.bannedWordsAvoided
        : [],
      channelTips: Array.isArray(data.policyCompliance?.channelTips)
        ? data.policyCompliance.channelTips
        : [],
    },
  };
}

/**
 * TẦNG 4: Fallback bóc tách Markdown cũ thành cấu trúc VideoRepurposerData
 */
function parseLegacyMarkdownToRepurposerData(raw: string): VideoRepurposerData {
  const patterns = [
    { key: "group", regex: /(?:^|\n)##?\s*.*(?:định\s*dạng\s*1|facebook\s*group|fb\s*group)/i },
    { key: "fanpage", regex: /(?:^|\n)##?\s*.*(?:định\s*dạng\s*2|fanpage)/i },
    { key: "carousel", regex: /(?:^|\n)##?\s*.*(?:định\s*dạng\s*3|carousel|chuỗi\s*ảnh)/i },
    { key: "blog", regex: /(?:^|\n)##?\s*.*(?:định\s*dạng\s*4|review\s*chuẩn\s*seo|bài\s*viết\s*review|website)/i },
    { key: "zalo", regex: /(?:^|\n)##?\s*.*(?:định\s*dạng\s*5|zalo\s*oa|tin\s*nhắn\s*zalo)/i },
  ];

  const matches = patterns.map((p) => {
    const match = raw.match(p.regex);
    return {
      key: p.key,
      index: match ? match.index! : -1,
    };
  });

  const cleanSectionContent = (chunk: string) => {
    return chunk
      .replace(/^[\s\n]*##?[^\n]+\n?/i, "")
      .replace(/^[\s\n]*---+[\s\n]*/gm, "")
      .trim();
  };

  const foundIndices = matches.filter((m) => m.index !== -1).sort((a, b) => a.index - b.index);
  const rawSections: Record<string, string> = { group: "", fanpage: "", carousel: "", blog: "", zalo: "" };

  if (foundIndices.length < 2) {
    rawSections.group = cleanSectionContent(raw);
  } else {
    for (let i = 0; i < foundIndices.length; i++) {
      const current = foundIndices[i];
      const nextIndex = i + 1 < foundIndices.length ? foundIndices[i + 1].index : raw.length;
      const rawChunk = raw.substring(current.index, nextIndex);
      rawSections[current.key] = cleanSectionContent(rawChunk);
    }
  }

  // Parse kịch bản bình luận mồi từ Group nếu có
  const commentMatch = rawSections.group.match(
    /(?:\n|^)(?:\*\(|\()?(?:bình\s*luận\s*mồi|gợi\s*ý\s*cmt|comment\s*mồi|bác\s*nào\s*lười\s*tìm\s*mã)[^:\n]*[:\-–]?\s*([\s\S]+?)(?:\)\*|\)$|$)/i
  );
  const seedingCommentText = commentMatch ? commentMatch[1].replace(/^\*\(/, "").replace(/\)\*$/, "").trim() : "";
  const groupBodyOnly = commentMatch ? rawSections.group.replace(commentMatch[0], "").trim() : rawSections.group;

  // Parse slides từ Carousel text
  const slideLines = rawSections.carousel.split("\n");
  const parsedSlides: CarouselSlideItem[] = [];
  let curSlideNum = 0;
  let curLabel = "";
  let curBuffer: string[] = [];

  const flushSlide = () => {
    if (curSlideNum > 0 && curBuffer.length > 0) {
      parsedSlides.push({
        slideNumber: curSlideNum,
        slideType: curSlideNum === 1 ? "cover" : curSlideNum === 5 ? "cta_save" : "usp_solution",
        typeLabel: curLabel || `Slide ${curSlideNum}`,
        headline: curLabel || `Slide ${curSlideNum}`,
        bodyContent: curBuffer.join(" ").trim(),
        visualDescription: "Thiết kế đồ họa trực quan phù hợp nội dung slide",
      });
    }
    curBuffer = [];
  };

  slideLines.forEach((line) => {
    const tr = line.trim();
    const match = tr.match(/^[-*•\s]*(?:Slide|Trang|Ảnh)\s*(\d+)[\s:()\-–]*(.*)/i);
    if (match) {
      flushSlide();
      curSlideNum = parseInt(match[1], 10);
      const rest = match[2].replace(/^[:\-–\s]+/, "");
      const labelMatch = rest.match(/^\(([^)]+)\)[:\s]*(.*)/);
      if (labelMatch) {
        curLabel = labelMatch[1].trim();
        if (labelMatch[2]) curBuffer.push(labelMatch[2]);
      } else {
        curLabel = curSlideNum === 1 ? "Bìa Giật Tít (Hook)" : curSlideNum === 5 ? "Kêu Gọi Lưu & Thả Tim" : `Slide ${curSlideNum}`;
        if (rest) curBuffer.push(rest);
      }
    } else if (curSlideNum > 0 && tr) {
      curBuffer.push(tr);
    }
  });
  flushSlide();

  return {
    productName: "Sản phẩm",
    fbGroupPost: {
      headline: groupBodyOnly.split("\n")[0]?.slice(0, 80) || "Tâm sự chia sẻ trải nghiệm",
      bodyText: groupBodyOnly,
      discussionHook: "Bác nào có kinh nghiệm chia sẻ thêm bên dưới nhé!",
      seedingComments: seedingCommentText
        ? [
            {
              id: 1,
              role: "Gợi ý bình luận mồi",
              comment: seedingCommentText,
            },
          ]
        : [],
      rawText: rawSections.group,
    },
    fanpagePost: {
      hookLine: rawSections.fanpage.split("\n")[0] || "",
      bodyHighlights: rawSections.fanpage
        .split("\n")
        .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•") || l.trim().startsWith("👉") || l.trim().startsWith("🔥"))
        .map((l) => l.replace(/^[-•👉🔥\s]+/, "").trim()),
      offerDetails: "Ưu đãi có hạn theo chương trình",
      callToAction: "Nhắn tin nhận ưu đãi ngay hôm nay",
      hashtags: (rawSections.fanpage.match(/#\w+/g) || ["#Review", "#Deal"]),
      rawText: rawSections.fanpage,
    },
    carouselPost: {
      conceptTitle: "Kịch bản Chuỗi 5 Slide Carousel",
      targetPlatform: "Lemon8 / TikTok Photo / Instagram",
      slides: parsedSlides.length > 0 ? parsedSlides : [
        {
          slideNumber: 1,
          slideType: "cover",
          typeLabel: "Slide 1: Bìa Giật Tít",
          headline: "Tiêu đề bìa",
          bodyContent: rawSections.carousel.slice(0, 100),
          visualDescription: "Ảnh bìa nổi bật",
        },
      ],
      caption: "Nhớ lưu bài viết để không bỏ lỡ mẹo hay nhé!",
      rawText: rawSections.carousel,
    },
    seoBlogPost: {
      seoTitle: rawSections.blog.split("\n")[0]?.replace(/^Tiêu đề[:\s]*/i, "") || "Bài Viết Review Chuẩn SEO",
      metaDescription: "Đánh giá chi tiết sản phẩm chuẩn SEO.",
      introduction: rawSections.blog.slice(0, 200),
      mainContent: rawSections.blog,
      pros: ["Chất lượng tốt", "Hiệu năng ổn định", "Độ bền cao"],
      cons: ["Giá thành tương đối"],
      verdict: "Sản phẩm đáng cân nhắc trong phân khúc.",
      ratingScore: "9.0/10",
      rawText: rawSections.blog,
    },
    zaloOaMessage: {
      customerGreeting: "Dạ em chào Anh/Chị!",
      videoValueRecap: rawSections.zalo.slice(0, 150),
      exclusiveDeal: "Mã giảm giá độc quyền dành riêng cho khách hàng thân thiết.",
      ctaText: "Bấm vào link để nhận ưu đãi ngay hôm nay.",
      rawText: rawSections.zalo,
    },
    policyCompliance: {
      safeScore: 92,
      bannedWordsAvoided: [],
      channelTips: ["Kiểm tra kỹ link và voucher trước khi gửi khách."],
    },
  };
}

/**
 * CHUYỂN ĐỔI DỮ LIỆU JSON SANG VĂN BẢN MARKDOWN THUẦN TÚY (CLEAN MARKDOWN)
 * Đảm bảo 100% không bao giờ hiển thị bất kỳ ký tự JSON nào khi người dùng xem chế độ Văn Bản.
 */
export function formatRepurposerMarkdownText(data: VideoRepurposerData): string {
  const parts: string[] = [];

  // KÊNH 1: FB GROUP
  parts.push(`## 👥 KÊNH 1: BÀI ĐĂNG FACEBOOK GROUP (Seeding / Tâm Sự Thực Tế)`);
  if (data.fbGroupPost.headline) {
    parts.push(`**${data.fbGroupPost.headline}**\n`);
  }
  parts.push(data.fbGroupPost.bodyText);
  if (data.fbGroupPost.discussionHook) {
    parts.push(`\n${data.fbGroupPost.discussionHook}`);
  }
  if (data.fbGroupPost.seedingComments && data.fbGroupPost.seedingComments.length > 0) {
    parts.push(`\n💬 **Gợi Ý Kịch Bản Bình Luận Mồi (Comment Seeding):**`);
    data.fbGroupPost.seedingComments.forEach((c) => {
      parts.push(`- [${c.role}]: "${c.comment}"`);
    });
  }

  parts.push(`\n---\n`);

  // KÊNH 2: FANPAGE
  parts.push(`## 📢 KÊNH 2: BÀI ĐĂNG FANPAGE FACEBOOK (Tối Ưu Click & Inbox)`);
  if (data.fanpagePost.hookLine) {
    parts.push(`**${data.fanpagePost.hookLine}**\n`);
  }
  if (data.fanpagePost.bodyHighlights && data.fanpagePost.bodyHighlights.length > 0) {
    data.fanpagePost.bodyHighlights.forEach((hl) => {
      parts.push(`- ${hl}`);
    });
    parts.push("");
  }
  if (data.fanpagePost.offerDetails) {
    parts.push(`🎁 **Ưu đãi:** ${data.fanpagePost.offerDetails}`);
  }
  if (data.fanpagePost.callToAction) {
    parts.push(`👉 **Kêu gọi hành động:** ${data.fanpagePost.callToAction}`);
  }
  if (data.fanpagePost.hashtags && data.fanpagePost.hashtags.length > 0) {
    parts.push(`\n${data.fanpagePost.hashtags.join(" ")}`);
  }

  parts.push(`\n---\n`);

  // KÊNH 3: CAROUSEL
  parts.push(`## 📸 KÊNH 3: KỊCH BẢN CHUỖI 5 SLIDE CAROUSEL (${data.carouselPost.targetPlatform || "Lemon8 / TikTok Photo / Instagram"})`);
  if (data.carouselPost.conceptTitle) {
    parts.push(`**Chủ đề:** ${data.carouselPost.conceptTitle}\n`);
  }
  if (data.carouselPost.slides && data.carouselPost.slides.length > 0) {
    data.carouselPost.slides.forEach((s) => {
      parts.push(`### ${s.typeLabel || `Slide ${s.slideNumber}`}`);
      parts.push(`- **Headline đè ảnh:** ${s.headline}`);
      parts.push(`- **Nội dung:** ${s.bodyContent}`);
      if (s.visualDescription) {
        parts.push(`- **Gợi ý hình ảnh / góc máy:** *${s.visualDescription}*`);
      }
      parts.push("");
    });
  }
  if (data.carouselPost.caption) {
    parts.push(`📝 **Caption đăng kèm:**\n${data.carouselPost.caption}`);
  }

  parts.push(`\n---\n`);

  // KÊNH 4: SEO BLOG
  parts.push(`## 📝 KÊNH 4: BÀI VIẾT REVIEW CHUẨN SEO (Website / Blog Affiliate)`);
  parts.push(`**Tiêu đề SEO:** ${data.seoBlogPost.seoTitle}`);
  parts.push(`**Meta Description:** ${data.seoBlogPost.metaDescription}\n`);
  if (data.seoBlogPost.introduction) {
    parts.push(`### 1. Đặt Vấn Đề\n${data.seoBlogPost.introduction}\n`);
  }
  if (data.seoBlogPost.mainContent) {
    parts.push(`### 2. Đánh Giá Trải Nghiệm Thực Tế\n${data.seoBlogPost.mainContent}\n`);
  }
  if (data.seoBlogPost.pros && data.seoBlogPost.pros.length > 0) {
    parts.push(`### 3. Ưu Điểm Nổi Bật (Pros):`);
    data.seoBlogPost.pros.forEach((p) => parts.push(`- ✅ ${p}`));
    parts.push("");
  }
  if (data.seoBlogPost.cons && data.seoBlogPost.cons.length > 0) {
    parts.push(`### 4. Nhược Điểm Cần Lưu Ý (Cons):`);
    data.seoBlogPost.cons.forEach((c) => parts.push(`- ⚠️ ${c}`));
    parts.push("");
  }
  if (data.seoBlogPost.verdict) {
    parts.push(`### 5. Lời Khuyên & Tổng Kết\n${data.seoBlogPost.verdict}`);
  }
  if (data.seoBlogPost.ratingScore) {
    parts.push(`\n⭐ **Điểm đánh giá chuyên gia:** ${data.seoBlogPost.ratingScore}`);
  }

  parts.push(`\n---\n`);

  // KÊNH 5: ZALO OA
  parts.push(`## 💬 KÊNH 5: TIN NHẮN ZALO OA / CHĂM SÓC KHÁCH HÀNG (Remarketing 0 đồng)`);
  if (data.zaloOaMessage.customerGreeting) {
    parts.push(data.zaloOaMessage.customerGreeting);
  }
  if (data.zaloOaMessage.videoValueRecap) {
    parts.push(`\n${data.zaloOaMessage.videoValueRecap}`);
  }
  if (data.zaloOaMessage.exclusiveDeal) {
    parts.push(`\n${data.zaloOaMessage.exclusiveDeal}`);
  }
  if (data.zaloOaMessage.ctaText) {
    parts.push(`\n${data.zaloOaMessage.ctaText}`);
  }

  return parts.join("\n");
}
