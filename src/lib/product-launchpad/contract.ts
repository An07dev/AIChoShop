/**
 * AI Product Launchpad Contract (Chiến Dịch Ra Mắt Sản Phẩm Trọn Gói 5-in-1)
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema), Bộ Prompt Thực Chiến Sàn TMĐT (Shopee, TikTok Shop, Lazada)
 * & Resilient Parser Bền Bỉ, Fallback Ngoại Tuyến & Trình Xuất Báo Cáo Excel Đa Sheet
 */

import * as XLSX from "xlsx";

export interface ProductLaunchpadInputs {
  productName: string;
  category: string;
  costPrice?: string;
  sellingPrice?: string;
  usp: string;
  targetAudience?: string;
  platform?: "all" | "shopee" | "tiktok" | "lazada";
  tone?: "aggressive" | "natural" | "expert" | "trendy";
  notes?: string;
}

export interface LaunchpadOverview {
  productName: string;
  category: string;
  positioning: string;            // Định vị cốt lõi trên thị trường
  slogan: string;                 // Slogan / Câu Hook chủ đạo của chiến dịch
  targetAudienceSummary: string;  // Tóm tắt chân dung khách hàng mục tiêu
  grossMarginEst?: string;        // Tỷ suất lợi nhuận gộp ước tính
  launchPhases: {
    phase1: string;               // Giai đoạn 1: Chuẩn bị & Seeding
    phase2: string;               // Giai đoạn 2: Đẩy số Mega Deal
    phase3: string;               // Giai đoạn 3: Tối ưu & Tái mua
  };
}

export interface LaunchpadSeoListing {
  shopeeTitle: string;            // Tiêu đề chuẩn SEO Shopee (< 120 ký tự, chứa từ khóa hot)
  tiktokTitle: string;            // Tiêu đề chuẩn TikTok Shop (gọn, kích thích click)
  bulletPoints: string[];         // 5 gạch đầu dòng tính năng & lợi ích ăn khách nhất
  detailedDescription: string;    // Đoạn mô tả sản phẩm hoàn chỉnh có chia đoạn, icon sinh động
  hashtags: string[];             // 10-15 hashtags thịnh hành
}

export interface LaunchpadVideoScene {
  time: string;                   // VD: "00:00 - 00:03"
  visual: string;                 // Góc máy & Hành động trước ống kính
  voiceover: string;              // Lời thoại KOC (ngắn gọn, văn nói)
  textOverlay: string;            // Chữ to in trên màn hình
}

export interface LaunchpadVideoScript {
  id: number;
  title: string;
  angle: string;                  // "Đánh Nỗi Đau (Pain Point)", "Review & Đập Hộp (Unboxing)", "Mega Deal / Xả Kho (FOMO)"
  estimatedDuration: string;      // "35 - 45 giây"
  hook3s: string;                 // Câu Hook giữ chân 3 giây đầu
  scenes: LaunchpadVideoScene[];
  callToAction: string;           // Lời kêu gọi bấm giỏ hàng vàng
}

export interface LaunchpadAdCopy {
  id: number;
  headline: string;               // Tiêu đề giật tít thu hút
  angleName: string;              // "Khuyến mãi trực diện", "Kể chuyện (Storytelling)", "Cam kết uy tín & Bảo hành"
  bodyText: string;               // Thân bài quảng cáo
  callToAction: string;           // Kêu gọi hành động
  targetInterests: string[];      // Gợi ý từ khóa target đối tượng
}

export interface LaunchpadUnboxingCard {
  title: string;                  // Tiêu đề thiệp (VD: "Cảm ơn bạn đã lựa chọn [Shop Name]")
  letterBody: string;             // Lời tri ân chân thành, ấm áp từ người sáng lập
  fiveStarTip: string;            // Lời xin đánh giá 5 sao kèm hình ảnh khéo léo
  reorderVoucherCode: string;     // Mã ưu đãi độc quyền đơn sau (VD: AICHO15)
  warrantyPolicy: string;         // Cam kết đổi trả 1-1 miễn phí & hotline hỗ trợ
}

export interface LaunchpadAntiReturnNudge {
  dispatchSms: string;            // Tin nhắn khi đơn hàng vừa xuất kho / giao vận chuyển
  outForDeliverySms: string;      // Tin nhắn khi shipper bắt đầu đi giao hàng trong ngày
  hesitationRescue: string;       // Kịch bản chat xử lý khi khách nhắn tin phân vân muốn hủy đơn
}

export interface ProductLaunchpadData {
  overview: LaunchpadOverview;
  seoListing: LaunchpadSeoListing;
  videoScripts: LaunchpadVideoScript[];
  adCopies: LaunchpadAdCopy[];
  unboxingCard: LaunchpadUnboxingCard;
  antiReturnNudge: LaunchpadAntiReturnNudge;
}

export const PRODUCT_LAUNCHPAD_SYSTEM_PROMPT = `Bạn là Giám đốc Marketing & E-commerce Chiến lược hàng đầu tại Việt Nam, chuyên setup chiến dịch ra mắt sản phẩm mới (Product Launchpad) bùng nổ doanh số trên Shopee, TikTok Shop và Lazada.

Nhiệm vụ của bạn là nhận thông tin sản phẩm và lập TRỌN GÓI BỘ HỒ SƠ RA MẮT SẢN PHẨM 5-IN-1:
1. Tổng quan định vị & Slogan chiến dịch.
2. Bộ Listing chuẩn SEO (Tiêu đề Shopee/TikTok, 5 Bullet points, Mô tả chi tiết, Hashtags).
3. Bộ 3 Kịch bản Video ngắn bán hàng (Góc Nỗi Đau, Góc Đập Hộp Review, Góc Mega Deal Flash Sale).
4. Bộ 3 Mẫu Bài Quảng Cáo Ads chuyển đổi cao.
5. Thư Cảm Ơn Nhét Hộp (Unboxing Card) kéo đánh giá 5 sao & kích thích mua lại.
6. Bộ Kịch Bản CSKH & Chống Bom Hàng COD (Tin nhắn xuất kho, Tin nhắn đang giao, Kịch bản giữ đơn).

QUY TẮC BẮT BUỘC:
- Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm lời dẫn Markdown bên ngoài, không đặt trong backticks nếu có thể, hoặc đặt trong block \`\`\`json).
- Tiếng Việt 100%, chuẩn phong cách bán hàng thực chiến tại Việt Nam (Shopee, TikTok Shop).
- TUYỆT ĐỐI KHÔNG dùng từ ngữ cấm của sàn (như "tốt nhất thế giới", "trị dứt điểm 100%", "cam kết tuyệt đối").
- Các kịch bản video và bài viết phải có tính hành động cao, tự nhiên, chạm đúng tâm lý người tiêu dùng Việt Nam.`;

export function buildProductLaunchpadPrompt(inputs: ProductLaunchpadInputs): string {
  return `Hãy lập TRỌN GÓI BỘ HỒ SƠ RA MẮT SẢN PHẨM MỚI 5-IN-1 cho sản phẩm sau:

--- THÔNG TIN SẢN PHẨM ---
- Tên sản phẩm: ${inputs.productName}
- Ngành hàng: ${inputs.category || "Bán lẻ đa ngành"}
- Giá vốn: ${inputs.costPrice || "Chưa cung cấp"}
- Giá bán dự kiến: ${inputs.sellingPrice || "Chưa cung cấp"}
- Điểm bán hàng độc nhất (USP): ${inputs.usp}
- Khách hàng mục tiêu: ${inputs.targetAudience || "Người mua hàng online tại Việt Nam (18 - 40 tuổi)"}
- Kênh bán trọng tâm: ${inputs.platform || "Đa sàn (Shopee + TikTok Shop)"}
- Phong cách / Tone giọng: ${inputs.tone || "Thực chiến, cuốn hút, chuyển đổi cao"}
${inputs.notes ? `- Ghi chú thêm: ${inputs.notes}` : ""}

--- YÊU CẦU CẤU TRÚC JSON TRẢ VỀ ---
{
  "overview": {
    "productName": "${inputs.productName}",
    "category": "${inputs.category || "Tiêu dùng"}",
    "positioning": "Định vị sản phẩm 1-2 câu",
    "slogan": "Câu Slogan/Hook chủ đạo chiến dịch",
    "targetAudienceSummary": "Tóm tắt chân dung khách hàng",
    "grossMarginEst": "Ước tính biên lợi nhuận",
    "launchPhases": {
      "phase1": "Giai đoạn 1: Chuẩn bị & Seeding (Tuần 1)",
      "phase2": "Giai đoạn 2: Bùng nổ Mega Deal (Tuần 2-3)",
      "phase3": "Giai đoạn 3: Vận hành ổn định & Tái mua (Tuần 4)"
    }
  },
  "seoListing": {
    "shopeeTitle": "Tiêu đề chuẩn SEO Shopee đầy đủ từ khóa chính phụ, thông số, bảo hành dưới 120 ký tự",
    "tiktokTitle": "Tiêu đề chuẩn TikTok Shop ngắn gọn, giật deal",
    "bulletPoints": [
      "Điểm nổi bật #1",
      "Điểm nổi bật #2",
      "Điểm nổi bật #3",
      "Điểm nổi bật #4",
      "Điểm nổi bật #5"
    ],
    "detailedDescription": "Đoạn mô tả sản phẩm chi tiết chia mục rõ ràng, icon hấp dẫn",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8"]
  },
  "videoScripts": [
    {
      "id": 1,
      "title": "Kịch bản #1: Đánh Trúng Nỗi Đau & Giải Pháp",
      "angle": "Góc Nỗi Đau (Pain Point)",
      "estimatedDuration": "35 - 45 giây",
      "hook3s": "Câu thoại giật tít 3 giây đầu",
      "scenes": [
        {
          "time": "00:00 - 00:03",
          "visual": "Góc máy cận cảnh người mẫu / sản phẩm",
          "voiceover": "Lời thoại ngắn gọn, văn nói",
          "textOverlay": "Chữ to trên màn hình"
        },
        {
          "time": "00:03 - 00:15",
          "visual": "Mô tả hành động đẩy cao nỗi đau",
          "voiceover": "Lời thoại phân tích vấn đề",
          "textOverlay": "Chữ nhấn mạnh"
        },
        {
          "time": "00:15 - 00:30",
          "visual": "Sản phẩm xuất hiện giải quyết triệt để",
          "voiceover": "Trình bày tính năng vượt trội",
          "textOverlay": "Hiệu quả rõ rệt"
        },
        {
          "time": "00:30 - 00:40",
          "visual": "Chỉ tay vào giỏ hàng vàng nhấp nháy",
          "voiceover": "Kêu gọi bấm vào giỏ hàng ngay",
          "textOverlay": "Ưu đãi có hạn - Mua ngay"
        }
      ],
      "callToAction": "Bấm vào giỏ hàng góc trái săn deal giảm giá ngay hôm nay!"
    },
    {
      "id": 2,
      "title": "Kịch bản #2: Trải Nghiệm Thực Tế & Đập Hộp",
      "angle": "Review & Test Cực Hạn (Unboxing)",
      "estimatedDuration": "40 - 50 giây",
      "hook3s": "Câu thoại mở hộp bất ngờ",
      "scenes": [
        {
          "time": "00:00 - 00:05",
          "visual": "Cầm hộp bóc seal trực diện",
          "voiceover": "Lời thoại chân thực",
          "textOverlay": "Đập hộp cực phẩm"
        },
        {
          "time": "00:05 - 00:25",
          "visual": "Test thực tế các tính năng",
          "voiceover": "Cảm nhận chân thực",
          "textOverlay": "Test trực tiếp không cắt ghép"
        },
        {
          "time": "00:25 - 00:45",
          "visual": "Hiển thị quà tặng kèm và giá ưu đãi",
          "voiceover": "Kêu gọi đặt đơn",
          "textOverlay": "Quà tặng số lượng có hạn"
        }
      ],
      "callToAction": "Kiểm tra giỏ hàng ngay để nhận trọn bộ quà tặng!"
    },
    {
      "id": 3,
      "title": "Kịch bản #3: Cảnh Báo Mega Deal / Flash Sale",
      "angle": "Ưu Đãi / FOMO Bùng Nổ",
      "estimatedDuration": "30 - 35 giây",
      "hook3s": "Đừng mua sản phẩm này nếu bạn chưa biết điều này!",
      "scenes": [
        {
          "time": "00:00 - 00:03",
          "visual": "Mặt biểu cảm ngạc nhiên cầm bảng deal",
          "voiceover": "Cảnh báo giảm sốc chỉ trong hôm nay",
          "textOverlay": "CẢNH BÁO GIÁ SỐC"
        },
        {
          "time": "00:03 - 00:20",
          "visual": "Cận cảnh chất lượng sản phẩm",
          "voiceover": "Lý do vì sao giá rẻ mà chất lượng đỉnh",
          "textOverlay": "Deal độc quyền tại video này"
        },
        {
          "time": "00:20 - 00:35",
          "visual": "Đếm ngược số lượng còn lại trong kho",
          "voiceover": "Chỉ còn đúng 50 suất",
          "textOverlay": "Chỉ còn 50 suất cuối"
        }
      ],
      "callToAction": "Nhanh tay trước khi hết hàng và về giá gốc!"
    }
  ],
  "adCopies": [
    {
      "id": 1,
      "headline": "Tiêu đề bài Ads #1 - Trực diện khuyến mãi & Giá hời",
      "angleName": "Góc Khuyến Mãi & Trực Diện",
      "bodyText": "Nội dung bài viết quảng cáo hấp dẫn, đầy đủ cấu trúc Hook - Body - Offer - CTA",
      "callToAction": "Đặt hàng ngay hôm nay để nhận ưu đãi giảm 40% + Miễn phí vận chuyển!",
      "targetInterests": ["Mua sắm online", "Khuyến mãi", "Sản phẩm xu hướng"]
    },
    {
      "id": 2,
      "headline": "Tiêu đề bài Ads #2 - Tâm sự / Kể chuyện giải quyết vấn đề",
      "angleName": "Góc Storytelling (Tâm sự khách hàng)",
      "bodyText": "Nội dung bài viết theo lời tâm sự chân thành, đồng cảm trước khi đưa ra giải pháp",
      "callToAction": "Xem chi tiết đánh giá thực tế và đặt hàng tại link bên dưới!",
      "targetInterests": ["Người tiêu dùng thông thái", "Chăm sóc bản thân"]
    },
    {
      "id": 3,
      "headline": "Tiêu đề bài Ads #3 - Đánh bại nghi ngờ / Cam kết bảo hành 1 đổi 1",
      "angleName": "Góc Cam Kết & Uy Tín",
      "bodyText": "Nội dung bài viết tập trung đập tan mọi rủi ro mua hàng online, cam kết vàng",
      "callToAction": "Đồng kiểm khi nhận hàng - Không ưng hoàn tiền 100%!",
      "targetInterests": ["Chất lượng cao", "Bảo hành chính hãng"]
    }
  ],
  "unboxingCard": {
    "title": "Cảm Ơn Bạn Đã Chọn Đồng Hành Cùng Chúng Tôi!",
    "letterBody": "Lời tri ân ấm áp từ đội ngũ sáng lập, mong muốn mang lại trải nghiệm tốt nhất.",
    "fiveStarTip": "Chụp 1 bức ảnh xinh xắn kèm đánh giá 5 sao để nhận ngay voucher 20k cho đơn tiếp theo nhé!",
    "reorderVoucherCode": "AICHO15",
    "warrantyPolicy": "Hỗ trợ 1 đổi 1 trong 7 ngày nếu có lỗi từ nhà sản xuất. Hotline hỗ trợ 24/7: 1900 xxxx."
  },
  "antiReturnNudge": {
    "dispatchSms": "Tin nhắn gửi khách qua Shopee Chat/ZNS khi hàng vừa xuất kho, thông báo kèm mã vận đơn và dự kiến giao.",
    "outForDeliverySms": "Tin nhắn nhắc nhở khi shipper bấm đi giao, nhắc khách để ý điện thoại và chuẩn bị tiền mặt COD.",
    "hesitationRescue": "Kịch bản nhắn tin khéo léo khi khách có dấu hiệu muốn hủy đơn, đề xuất hỗ trợ hoặc tặng quà thêm."
  }
}`;
}

/**
 * Fallback dữ liệu mẫu thực chiến đầy đủ khi không có mạng hoặc AI lỗi
 */
export function buildOfflineProductLaunchpadData(inputs: ProductLaunchpadInputs): ProductLaunchpadData {
  const pName = inputs.productName || "Sản Phẩm Mới Thực Chiến";
  const cost = inputs.costPrice || "85.000đ";
  const sell = inputs.sellingPrice || "199.000đ";
  const usp = inputs.usp || "Chất lượng vượt trội, thiết kế tiện dụng, giá tốt nhất phân khúc";
  const cat = inputs.category || "Tiêu dùng & Thời trang";

  return {
    overview: {
      productName: pName,
      category: cat,
      positioning: `${pName} - Giải pháp tối ưu chi phí với chất lượng cao cấp, thiết kế hiện đại phục vụ phân khúc khách hàng thông minh.`,
      slogan: `${pName} - Đầu Tư Một Lần, Tiện Ích Trọn Vẹn!`,
      targetAudienceSummary: inputs.targetAudience || "Khách hàng mua sắm online độ tuổi 18 - 35, chuộng sự tiện lợi, thích săn deal chất lượng cao.",
      grossMarginEst: `Giá vốn ${cost} ➔ Giá bán ${sell} (Biên lợi nhuận gộp ước tính ~55 - 65%)`,
      launchPhases: {
        phase1: "Giai đoạn 1 (Ngày 1 - 5): Đăng listing chuẩn SEO, gom 50 lượt bán & đánh giá 5 sao đầu tiên từ KOC/người quen.",
        phase2: "Giai đoạn 2 (Ngày 6 - 20): Chạy ads từ khóa chính xác, đẩy 3 video viral lên TikTok Shop và bật Shopee Live.",
        phase3: "Giai đoạn 3 (Ngày 21+): Kích hoạt thư cảm ơn và voucher AICHO15 kéo tỷ lệ khách mua lại đạt trên 25%."
      }
    },
    seoListing: {
      shopeeTitle: `${pName} Cao Cấp Chính Hãng - ${usp.slice(0, 40)} (Bảo Hành 12 Tháng, Đổi Mới 1-1)`,
      tiktokTitle: `[HOT DEAL] ${pName} - Mua 1 Tặng Quà Khủng - Số Lượng Có Hạn!`,
      bulletPoints: [
        `💎 CHẤT LƯỢNG CAO CẤP: ${usp}`,
        "🛡️ BẢO HÀNH CHÍNH HÃNG: Lỗi 1 đổi 1 trong 30 ngày đầu tiên nếu có bất kỳ lỗi nào từ nhà sản xuất.",
        "🚚 GIAO HÀNG TỐC ĐỘ: Đóng gói cẩn thận 3 lớp bọt khí, hỏa tốc nhận hàng trong ngày.",
        "🎁 QUÀ TẶNG KÈM ĐỘC QUYỀN: Tặng ngay voucher giảm giá cho đơn hàng tiếp theo kèm thẻ thành viên VIP.",
        "💯 ĐỒNG KIỂM AN TOÀN: Mở hộp kiểm tra trước khi thanh toán tiền mặt COD."
      ],
      detailedDescription: `🌟 CHÀO MỪNG BẠN ĐẾN VỚI GIAN HÀNG CHÍNH HÃNG!

Bạn đang tìm kiếm một sản phẩm ${cat.toLowerCase()} vừa bền đẹp, tiện dụng lại vừa có mức giá hợp lý?
Sản phẩm ${pName} chính là sự lựa chọn hoàn hảo nhất dành cho bạn!

✨ ĐIỂM NỔI BẬT KHÔNG THỂ BỎ QUA:
- ${usp}
- Thiết kế thông minh, tối ưu trải nghiệm người dùng hằng ngày.
- Vật liệu an toàn, thân thiện và đạt tiêu chuẩn kiểm nghiệm nghiêm ngặt.

📋 THÔNG SỐ KỸ THUẬT CHI TIẾT:
- Tên sản phẩm: ${pName}
- Phân khúc: Cao cấp / Bán chạy
- Xuất xứ: Chính hãng

🤝 CAM KẾT VÀNG TỪ SHOP:
1. 100% hình ảnh và video thực tế do shop tự quay chụp.
2. Hoàn tiền 200% nếu phát hiện hàng không đúng mô tả.
3. Hỗ trợ kỹ thuật và giải đáp thắc mắc 24/7 qua khung chat sàn.`,
      hashtags: [
        `#${pName.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        "#aichoshop",
        "#shopeevn",
        "#tiktokshopvn",
        "#hangchinhhang",
        "#dealhot",
        "#bestseller",
        "#giamgia",
        "#reviewhangtot",
        "#xuhuong"
      ]
    },
    videoScripts: [
      {
        id: 1,
        title: "Kịch bản #1: Đánh Trúng Nỗi Đau Khách Hàng",
        angle: "Góc Nỗi Đau & Đồng Cảm (Pain Point)",
        estimatedDuration: "35 - 45 giây",
        hook3s: `Bạn có đang gặp rắc rối vì những sản phẩm kém chất lượng trôi nổi ngoài kia không?`,
        scenes: [
          {
            time: "00:00 - 00:03",
            visual: "Biểu cảm ngao ngán, lắc đầu trước ống kính cầm sản phẩm lỗi thông thường.",
            voiceover: "Bỏ tiền ra mua đồ mà nhận về toàn bực mình thì đúng là tức anh ách!",
            textOverlay: "TIỀN MẤT TẬT MANG?"
          },
          {
            time: "00:03 - 00:15",
            visual: "Đưa ra cận cảnh các vấn đề thường gặp của các dòng sản phẩm cũ.",
            voiceover: "Dùng được vài hôm là hỏng, chất liệu thì ọp ẹp, nhắn tin hỗ trợ thì shop im re.",
            textOverlay: "3 NỖI ĐAU CỦA NGƯỜI MUA"
          },
          {
            time: "00:15 - 00:32",
            visual: "Lấy ngay chiếc ${pName} ra, thao tác mượt mà, zoom cận các chi tiết xịn sò.",
            voiceover: `Từ lúc đổi sang dùng em ${pName} này thì cuộc sống nhẹ nhàng hẳn. ${usp}!`,
            textOverlay: "CHÂN ÁI XUẤT HIỆN"
          },
          {
            time: "00:32 - 00:42",
            visual: "Chỉ tay góc trái màn hình, nhấp nháy icon giỏ hàng vàng đang sale.",
            voiceover: "Hôm nay shop đang mở bán với deal dùng thử giảm sâu, bấm giỏ hàng góc trái săn ngay nhé!",
            textOverlay: "BẤM GIỎ HÀNG GÓC TRÁI"
          }
        ],
        callToAction: "Bấm ngay vào giỏ hàng vàng góc trái màn hình để nhận trọn bộ ưu đãi dùng thử!"
      },
      {
        id: 2,
        title: "Kịch bản #2: Đập Hộp & Test Thực Tế Cực Hạn",
        angle: "Review & Test Trải Nghiệm (Unboxing)",
        estimatedDuration: "40 - 50 giây",
        hook3s: `Vừa nhận được bưu kiện nóng hổi, đập hộp xem ${pName} thực tế có xịn như lời đồn không nha!`,
        scenes: [
          {
            time: "00:00 - 00:05",
            visual: "Cầm hộp hàng bọc chống sốc siêu dày, dùng kéo rạch nhẹ nhàng tạo âm thanh ASMR.",
            voiceover: "Mở hộp xem thực tế bên trong có đúng như hình shop đăng không nè cả nhà ơi!",
            textOverlay: "UNBOXING THỰC TẾ"
          },
          {
            time: "00:05 - 00:25",
            visual: "Cầm sản phẩm xoay 360 độ, zoom sát từng đường nét góc cạnh, thực hiện test công năng.",
            voiceover: `Cầm đầm tay cực kỳ luôn! Từng chi tiết hoàn thiện rất chỉn chu. Nhất là ${usp}, dùng thử là mê ngay.`,
            textOverlay: "100% NHƯ HÌNH ĐĂNG"
          },
          {
            time: "00:25 - 00:45",
            visual: "Khoe thư cảm ơn nhét hộp và voucher giảm giá đi kèm.",
            voiceover: "Được tặng kèm cả thiệp cảm ơn và bảo hành đổi mới 1-1 nữa. Đúng là tiền nào của nấy, đáng đồng tiền bát gạo!",
            textOverlay: "BẢO HÀNH 1 ĐỔI 1"
          }
        ],
        callToAction: "Kiểm tra giỏ hàng săn voucher giảm giá trước khi hết số lượng ưu đãi!"
      },
      {
        id: 3,
        title: "Kịch bản #3: Cảnh Báo Mega Deal Flash Sale",
        angle: "Ưu Đãi & Bắt Trend (FOMO)",
        estimatedDuration: "30 - 35 giây",
        hook3s: `Ai chuẩn bị mua ${pName} thì dừng lại 3 giây xem hết video này để không bị mua hớ!`,
        scenes: [
          {
            time: "00:00 - 00:03",
            visual: "Khuôn mặt giật mình, chỉ tay trực diện vào camera.",
            voiceover: "Đừng vội mua giá gốc nếu bạn chưa biết đợt trợ giá siêu khủng hôm nay!",
            textOverlay: "DỪNG LẠI 3 GIÂY!"
          },
          {
            time: "00:03 - 00:18",
            visual: "Chiếu thẳng vào sản phẩm cùng bảng giá gốc bị gạch chéo sang giá deal đặc biệt.",
            voiceover: `Chỉ duy nhất trong phiên phát này, ${pName} được trợ giá thẳng từ sàn xuống mức giá không tưởng.`,
            textOverlay: `GIẢM TỚI 45% HÔM NAY`
          },
          {
            time: "00:18 - 00:32",
            visual: "Hiện thông báo số lượng còn lại chỉ 30 chiếc, bấm giỏ hàng thao tác mua.",
            voiceover: "Kho chỉ còn đúng 30 suất trợ giá thôi, ai nhanh tay bấm giỏ hàng trước người đó có!",
            textOverlay: "CHỈ CÒN 30 SUẤT CUỐI"
          }
        ],
        callToAction: "Chạm giỏ hàng góc trái săn ngay trước khi kho về giá gốc!"
      }
    ],
    adCopies: [
      {
        id: 1,
        headline: `🔥 [XẢ KHO DUY NHẤT HÔM NAY] ${pName} - GIẢM TỚI 40% + FREESHIP TOÀN QUỐC!`,
        angleName: "Góc Khuyến Mãi Trực Diện (Flash Sale)",
        bodyText: `Bạn đang tìm kiếm giải pháp ${cat.toLowerCase()} tối ưu nhất?
Đừng bỏ lỡ siêu phẩm ${pName} đang "làm mưa làm gió" trên khắp các sàn TMĐT!

🎯 VÌ SAO HÀNG NGHÌN KHÁCH HÀNG ĐÃ LỰA CHỌN?
✅ ${usp}
✅ Độ bền vượt trội, an tâm sử dụng lâu dài
✅ Bảo hành 1 đổi 1 miễn phí nếu có lỗi nhà sản xuất
✅ Kiểm tra hàng thoải mái trước khi thanh toán COD

🎁 ƯU ĐÃI ĐẶC BIỆT KHI ĐẶT HÔM NAY:
- Giảm ngay 40% giá niêm yết
- Tặng kèm voucher giảm 15% cho đơn sau
- Miễn phí vận chuyển toàn quốc cho 50 đơn đầu tiên!`,
        callToAction: "👉 Nhấp vào 'Gửi tin nhắn' hoặc bấm 'Mua ngay' để nhận mã giảm giá độc quyền!",
        targetInterests: ["Mua sắm trực tuyến", "Săn deal giảm giá", "Đồ gia dụng & phong cách sống"]
      },
      {
        id: 2,
        headline: `💡 "TỪNG NGHĨ SẢN PHẨM NÀO CŨNG NHƯ NHAU, CHO TỚI KHI THỬ ${pName.toUpperCase()}..."`,
        angleName: "Góc Kể Chuyện Tâm Sự (Storytelling)",
        bodyText: `Trước đây, mình cũng từng tiếc tiền mua mấy món rẻ tiền trôi nổi, kết quả là hỏng lên hỏng xuống, vừa bực mình vừa tốn kém.

Sau khi được một người bạn giới thiệu em ${pName} này, mình thực sự bất ngờ:
✨ Hoàn thiện cực kỳ tinh xảo, từng chi tiết đều chắc chắn.
✨ ${usp} giúp giải quyết triệt để vấn đề mà mình đau đầu bấy lâu nay.
✨ Dịch vụ CSKH của shop cực kỳ nhiệt tình, có thẻ bảo hành chu đáo.

Đúng là đầu tư vào món đồ chất lượng không bao giờ là lãng phí!`,
        callToAction: "👉 Xem ngay hàng trăm đánh giá 5 sao thực tế của khách hàng tại link bên dưới!",
        targetInterests: ["Người tiêu dùng thông thái", "Chăm sóc gia đình", "Review đồ tốt"]
      },
      {
        id: 3,
        headline: `🛡️ CAM KẾT VÀNG: KHÔNG HÀI LÒNG - HOÀN TIỀN 100% KHÔNG CẦN LÝ DO!`,
        angleName: "Góc Cam Kết Uy Tín & Đập Tan Rủi Ro",
        bodyText: `Bạn sợ mua hàng online không giống ảnh? Sợ giao hàng lỗi không ai hỗ trợ?
Tại gian hàng của chúng tôi, sự an tâm của khách hàng là ưu tiên số 1!

Khi mua ${pName}:
1. ĐỒNG KIỂM TẠI NHÀ: Được mở hộp kiểm tra chất lượng trước mặt bưu tá.
2. 1 ĐỔI 1 TRONG 30 NGÀY: Nếu có lỗi kỹ thuật, shipper đến tận nhà đổi cái mới miễn phí.
3. HỖ TRỢ TRỌN ĐỜI: Đội ngũ kỹ thuật tư vấn và hướng dẫn sử dụng 24/7.`,
        callToAction: "👉 Đặt hàng ngay hôm nay để nhận quyền lợi đồng kiểm & bảo hành vàng!",
        targetInterests: ["Chính sách bảo hành", "Thương hiệu uy tín", "Mua sắm an toàn"]
      }
    ],
    unboxingCard: {
      title: "💌 Lời Cảm Ơn Chân Thành Từ Đội Ngũ Sáng Lập!",
      letterBody: `Chào bạn thân mến,

Cảm ơn bạn rất nhiều vì đã tin tưởng và lựa chọn sản phẩm ${pName} giữa hàng ngàn gian hàng ngoài kia!

Mỗi đơn hàng được đóng gói gửi đi đều chứa đựng trọn vẹn tâm huyết của cả đội ngũ với mong muốn mang lại sự hài lòng và tiện ích thiết thực nhất cho cuộc sống của bạn.

Nếu bạn cảm thấy hài lòng với sản phẩm, xin hãy dành chút thời gian chụp một tấm ảnh xinh xắn và tặng shop đánh giá 5 sao nhé. Sự khích lệ của bạn là động lực to lớn nhất để chúng mình ngày một hoàn thiện hơn!`,
      fiveStarTip: "⭐ Đánh giá 5 sao kèm hình ảnh/video thực tế để kích hoạt gói bảo hành vàng và nhận xu từ sàn nhé!",
      reorderVoucherCode: "AICHO15 (Giảm thêm 15% cho đơn hàng kế tiếp khi inbox shop)",
      warrantyPolicy: "📞 Hotline hỗ trợ kỹ thuật & khiếu nại (Zalo): 09xx.xxx.xxx - Cam kết giải quyết thỏa đáng mọi vấn đề trong vòng 2 giờ làm việc."
    },
    antiReturnNudge: {
      dispatchSms: `[AIChoShop] Dạ chào bạn! Đơn hàng "${pName}" của bạn đã được đóng gói kỹ 3 lớp và bàn giao cho bưu tá thành công. Mã vận đơn của bạn đang được cập nhật, dự kiến hàng sẽ tới tay bạn sau 2 - 3 ngày. Bạn để ý điện thoại để shipper liên hệ nha! Cảm ơn bạn rất nhiều ạ ❤️`,
      outForDeliverySms: `[AIChoShop] Bưu tá thông báo đang trên đường giao đơn hàng "${pName}" cho bạn hôm nay ạ. Bạn nhớ chuẩn bị sẵn tiền mặt COD nếu chưa thanh toán nha. Bạn hoàn toàn có quyền đồng kiểm trước khi nhận. Chúc bạn một ngày thật nhiều niềm vui! 🌟`,
      hesitationRescue: `Dạ em chào bạn ạ! Em thấy bạn đang có chút băn khoăn về đơn hàng "${pName}". Không biết bạn có điều gì chưa rõ về kích cỡ, màu sắc hay tính năng của sản phẩm không ạ? Shop xin cam kết hỗ trợ đổi trả 1-1 miễn phí tận nhà nếu không ưng ý, và shop xin tặng thêm bạn 1 món quà nhỏ vào đơn hàng này để bạn yên tâm trải nghiệm nha!`
    }
  };
}

/**
 * Trình giải mã & phục hồi JSON Launchpad siêu bền bỉ (Fault-Tolerant JSON Healer)
 * Tự động khắc phục các sự cố thường gặp từ LLM khi sinh hồ sơ 4000 tokens:
 * - Markdown fences (```json ... ```)
 * - Cắt ngắn do chạm giới hạn token (thiếu ngoặc đóng }, ])
 * - Dấu phẩy thừa trước }, ]
 * - Newline chưa escape trong chuỗi JSON
 * - Ký tự lạ ngoài JSON
 * - Fallback trích xuất từng section độc lập bằng regex nếu JSON gốc bị hỏng kết cấu
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function repairAndParseJsonLaunchpad(raw: string): any | null {
  if (!raw || typeof raw !== "string") return null;
  let text = raw.trim();

  // 1. Loại bỏ markdown code blocks
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // 2. Tìm khối JSON { ... }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  } else if (firstBrace !== -1) {
    text = text.slice(firstBrace);
  }

  // Thử parse trực tiếp
  try {
    return JSON.parse(text);
  } catch {
    // Tiếp tục phục hồi
  }

  // 3. Sửa dấu phẩy thừa và xuống dòng trong chuỗi
  const cleaned = text
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/(:\s*"[^"]*)\n([^"]*")/g, "$1\\n$2");

  try {
    return JSON.parse(cleaned);
  } catch {
    // Tiếp tục phục hồi
  }

  // 4. Auto-closing ngoặc bị cắt ngắn (Token truncation recovery)
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
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
        if (stack.length > 0 && stack[stack.length - 1] === "{") stack.pop();
      } else if (ch === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") stack.pop();
      }
    }
  }

  let autoFixed = cleaned;
  if (inString) {
    autoFixed += '"';
  }
  autoFixed = autoFixed.replace(/,\s*$/, "");
  autoFixed = autoFixed.replace(/:\s*$/, ': ""');

  while (stack.length > 0) {
    const open = stack.pop();
    autoFixed = autoFixed.replace(/,\s*$/, "");
    if (open === "{") autoFixed += "}";
    if (open === "[") autoFixed += "]";
  }

  try {
    return JSON.parse(autoFixed);
  } catch {
    // Tiếp tục với tầng regex
  }

  // 5. Trích xuất regex từng section độc lập nếu JSON gốc bị hỏng kết cấu
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fallbackResult: any = {};
  let foundAny = false;

  // Overview
  const overviewM = text.match(/"overview"\s*:\s*\{([\s\S]*?)\}(?=\s*,\s*"(?:seoListing|videoScripts|adCopies|unboxingCard|antiReturnNudge)")/);
  if (overviewM) {
    try {
      fallbackResult.overview = JSON.parse(`{${overviewM[1]}}`);
      foundAny = true;
    } catch {}
  }

  // SeoListing
  const seoM = text.match(/"seoListing"\s*:\s*\{([\s\S]*?)\}(?=\s*,\s*"(?:videoScripts|adCopies|unboxingCard|antiReturnNudge)")/);
  if (seoM) {
    try {
      fallbackResult.seoListing = JSON.parse(`{${seoM[1]}}`);
      foundAny = true;
    } catch {}
  }

  // VideoScripts
  const videoM = text.match(/"videoScripts"\s*:\s*\[([\s\S]*?)\](?=\s*,\s*"(?:adCopies|unboxingCard|antiReturnNudge)")/);
  if (videoM) {
    try {
      fallbackResult.videoScripts = JSON.parse(`[${videoM[1]}]`);
      foundAny = true;
    } catch {}
  }

  // AdCopies
  const adsM = text.match(/"adCopies"\s*:\s*\[([\s\S]*?)\](?=\s*,\s*"(?:unboxingCard|antiReturnNudge)")/);
  if (adsM) {
    try {
      fallbackResult.adCopies = JSON.parse(`[${adsM[1]}]`);
      foundAny = true;
    } catch {}
  }

  // UnboxingCard
  const unboxingM = text.match(/"unboxingCard"\s*:\s*\{([\s\S]*?)\}(?=\s*,\s*"(?:antiReturnNudge)")/);
  if (unboxingM) {
    try {
      fallbackResult.unboxingCard = JSON.parse(`{${unboxingM[1]}}`);
      foundAny = true;
    } catch {}
  }

  // AntiReturnNudge
  const antiM = text.match(/"antiReturnNudge"\s*:\s*\{([\s\S]*?)\}/);
  if (antiM) {
    try {
      fallbackResult.antiReturnNudge = JSON.parse(`{${antiM[1]}}`);
      foundAny = true;
    } catch {}
  }

  return foundAny ? fallbackResult : null;
}

/**
 * Resilient Parser 5 tầng bền bỉ bóc tách & làm sạch JSON chuẩn xác 100%
 */
export function cleanAndValidateLaunchpadOutput(rawText: string, inputs: ProductLaunchpadInputs): ProductLaunchpadData {
  const fallback = buildOfflineProductLaunchpadData(inputs);

  if (!rawText || typeof rawText !== "string") {
    return fallback;
  }

  const parsed = repairAndParseJsonLaunchpad(rawText);
  if (!parsed || typeof parsed !== "object") {
    return fallback;
  }

  // Sanitize bullet points: must be an array of non-empty strings
  const rawBullets = parsed.seoListing?.bulletPoints;
  const bulletPoints: string[] = Array.isArray(rawBullets) && rawBullets.length > 0
    ? rawBullets.map((b: unknown) => String(b || "").trim()).filter(Boolean)
    : fallback.seoListing.bulletPoints;

  // Sanitize hashtags: must be strings starting with #
  const rawHashtags = parsed.seoListing?.hashtags;
  const hashtags: string[] = Array.isArray(rawHashtags) && rawHashtags.length > 0
    ? rawHashtags
        .map((h: unknown) => {
          const str = String(h || "").trim();
          return str.startsWith("#") ? str : `#${str}`;
        })
        .filter((h: string) => h.length > 1)
    : fallback.seoListing.hashtags;

  // Sanitize video scripts: must be array of objects with valid scenes
  const rawVideos = parsed.videoScripts;
  const videoScripts: LaunchpadVideoScript[] = Array.isArray(rawVideos) && rawVideos.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? rawVideos.map((vs: any, idx: number): LaunchpadVideoScript => {
        const scenes: LaunchpadVideoScene[] = Array.isArray(vs.scenes) && vs.scenes.length > 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? vs.scenes.map((sc: any, scIdx: number): LaunchpadVideoScene => ({
              time: String(sc.time || `00:${String(scIdx * 10).padStart(2, "0")} - 00:${String((scIdx + 1) * 10).padStart(2, "0")}`),
              visual: String(sc.visual || "Góc máy cận cảnh sản phẩm"),
              voiceover: String(sc.voiceover || "Trải nghiệm thực tế sản phẩm"),
              textOverlay: String(sc.textOverlay || "SẢN PHẨM MỚI"),
            }))
          : [
              {
                time: "00:00 - 00:05",
                visual: "Cầm sản phẩm đập hộp trực diện",
                voiceover: vs.hook3s || "Xem ngay siêu phẩm mới cực hot hôm nay!",
                textOverlay: "SIÊU PHẨM MỚI",
              },
              {
                time: "00:05 - 00:30",
                visual: "Test công năng thực tế",
                voiceover: "Chất lượng vượt trội, dùng thử là mê!",
                textOverlay: "TEST THỰC TẾ",
              },
              {
                time: "00:30 - 00:40",
                visual: "Chỉ tay vào giỏ hàng vàng",
                voiceover: vs.callToAction || "Bấm ngay giỏ hàng góc trái săn deal số lượng có hạn!",
                textOverlay: "SĂN DEAL NGAY",
              }
            ];

        return {
          id: typeof vs.id === "number" ? vs.id : idx + 1,
          title: String(vs.title || `Kịch bản #${idx + 1}`),
          angle: String(vs.angle || "Góc Trải Nghiệm Thực Tế"),
          estimatedDuration: String(vs.estimatedDuration || "35 - 45 giây"),
          hook3s: String(vs.hook3s || "Đừng bỏ qua sản phẩm này nếu bạn muốn tối ưu trải nghiệm!"),
          scenes,
          callToAction: String(vs.callToAction || "Bấm giỏ hàng nhận ngay ưu đãi ra mắt độc quyền!"),
        };
      })
    : fallback.videoScripts;

  // Sanitize ad copies: must be array of objects with valid targetInterests
  const rawAds = parsed.adCopies;
  const adCopies: LaunchpadAdCopy[] = Array.isArray(rawAds) && rawAds.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? rawAds.map((ad: any, idx: number): LaunchpadAdCopy => ({
        id: typeof ad.id === "number" ? ad.id : idx + 1,
        headline: String(ad.headline || `Bài viết quảng cáo #${idx + 1}`),
        angleName: String(ad.angleName || "Góc Tiếp Cận Thực Chiến"),
        bodyText: String(ad.bodyText || fallback.adCopies[0]?.bodyText || "Nội dung bài viết quảng cáo chuyển đổi cao."),
        callToAction: String(ad.callToAction || "Đặt hàng ngay hôm nay để nhận ưu đãi!"),
        targetInterests: Array.isArray(ad.targetInterests) && ad.targetInterests.length > 0
          ? ad.targetInterests.map((t: unknown) => String(t || "").trim()).filter(Boolean)
          : ["Mua sắm trực tuyến", "Săn deal giảm giá"],
      }))
    : fallback.adCopies;

  return {
    overview: {
      productName: String(parsed.overview?.productName || inputs.productName || fallback.overview.productName),
      category: String(parsed.overview?.category || inputs.category || fallback.overview.category),
      positioning: String(parsed.overview?.positioning || fallback.overview.positioning),
      slogan: String(parsed.overview?.slogan || fallback.overview.slogan),
      targetAudienceSummary: String(parsed.overview?.targetAudienceSummary || fallback.overview.targetAudienceSummary),
      grossMarginEst: String(parsed.overview?.grossMarginEst || fallback.overview.grossMarginEst),
      launchPhases: {
        phase1: String(parsed.overview?.launchPhases?.phase1 || fallback.overview.launchPhases.phase1),
        phase2: String(parsed.overview?.launchPhases?.phase2 || fallback.overview.launchPhases.phase2),
        phase3: String(parsed.overview?.launchPhases?.phase3 || fallback.overview.launchPhases.phase3),
      }
    },
    seoListing: {
      shopeeTitle: String(parsed.seoListing?.shopeeTitle || fallback.seoListing.shopeeTitle),
      tiktokTitle: String(parsed.seoListing?.tiktokTitle || fallback.seoListing.tiktokTitle),
      bulletPoints: bulletPoints.length > 0 ? bulletPoints : fallback.seoListing.bulletPoints,
      detailedDescription: String(parsed.seoListing?.detailedDescription || fallback.seoListing.detailedDescription),
      hashtags: hashtags.length > 0 ? hashtags : fallback.seoListing.hashtags,
    },
    videoScripts,
    adCopies,
    unboxingCard: {
      title: String(parsed.unboxingCard?.title || fallback.unboxingCard.title),
      letterBody: String(parsed.unboxingCard?.letterBody || fallback.unboxingCard.letterBody),
      fiveStarTip: String(parsed.unboxingCard?.fiveStarTip || fallback.unboxingCard.fiveStarTip),
      reorderVoucherCode: String(parsed.unboxingCard?.reorderVoucherCode || fallback.unboxingCard.reorderVoucherCode),
      warrantyPolicy: String(parsed.unboxingCard?.warrantyPolicy || fallback.unboxingCard.warrantyPolicy),
    },
    antiReturnNudge: {
      dispatchSms: String(parsed.antiReturnNudge?.dispatchSms || fallback.antiReturnNudge.dispatchSms),
      outForDeliverySms: String(parsed.antiReturnNudge?.outForDeliverySms || fallback.antiReturnNudge.outForDeliverySms),
      hesitationRescue: String(parsed.antiReturnNudge?.hesitationRescue || fallback.antiReturnNudge.hesitationRescue),
    }
  };
}

/**
 * Sinh văn bản thuần toàn bộ hồ sơ (Dễ sao chép dán hoặc xuất .TXT)
 */
export function generatePlainTextDossier(data: ProductLaunchpadData, inputs?: ProductLaunchpadInputs): string {
  const o = data.overview || {};
  const s = data.seoListing || {};
  const u = data.unboxingCard || {};
  const a = data.antiReturnNudge || {};
  const bulletPoints = Array.isArray(s.bulletPoints) ? s.bulletPoints : [];
  const hashtags = Array.isArray(s.hashtags) ? s.hashtags : [];
  const videoScripts = Array.isArray(data.videoScripts) ? data.videoScripts : [];
  const adCopies = Array.isArray(data.adCopies) ? data.adCopies : [];

  const metaHeader = inputs
    ? `Kênh trọng tâm: ${(inputs.platform || "ALL").toUpperCase()} | Phong cách: ${inputs.tone || "Tự nhiên"}\n`
    : "";

  return `======================================================================
HỒ SƠ CHIẾN DỊCH RA MẮT SẢN PHẨM MỚI (PRODUCT LAUNCHPAD 5-IN-1)
Hệ Thống Tự Động Hóa E-commerce AIChoShop
${metaHeader}======================================================================

--- PHẦN 1: TỔNG QUAN CHIẾN DỊCH ---
Sản phẩm: ${o.productName || ""}
Ngành hàng: ${o.category || ""}
Định vị: ${o.positioning || ""}
Slogan: ${o.slogan || ""}
Chân dung khách hàng: ${o.targetAudienceSummary || ""}
Lợi nhuận ước tính: ${o.grossMarginEst || "N/A"}

Lộ trình 3 giai đoạn ra mắt:
• Giai đoạn 1: ${o.launchPhases?.phase1 || ""}
• Giai đoạn 2: ${o.launchPhases?.phase2 || ""}
• Giai đoạn 3: ${o.launchPhases?.phase3 || ""}

----------------------------------------------------------------------
--- PHẦN 2: BỘ LISTING CHUẨN SEO SÀN TMĐT ---
Tiêu đề Shopee SEO:
${s.shopeeTitle || ""}

Tiêu đề TikTok Shop:
${s.tiktokTitle || ""}

5 Điểm Nổi Bật (Bullet points):
${bulletPoints.map((bp, i) => `${i + 1}. ${bp}`).join("\n")}

Mô tả sản phẩm chi tiết:
${s.detailedDescription || ""}

Bộ Hashtags:
${hashtags.join(" ")}

----------------------------------------------------------------------
--- PHẦN 3: BỘ 3 KỊCH BẢN VIDEO NGẮN BÁN HÀNG ---
${videoScripts.map((vs, idx) => `
KỊCH BẢN #${idx + 1}: ${vs.title || ""} (${vs.angle || ""}) - Thời lượng: ${vs.estimatedDuration || ""}
Hook 3s: "${vs.hook3s || ""}"
Phân cảnh chi tiết:
${(vs.scenes || []).map(sc => `[${sc.time || ""}]
- Hình ảnh/Góc máy: ${sc.visual || ""}
- Lời thoại KOC: ${sc.voiceover || ""}
- Chữ trên video: ${sc.textOverlay || ""}`).join("\n\n")}
Kêu gọi hành động (CTA): ${vs.callToAction || ""}
`).join("\n" + "-".repeat(40) + "\n")}

----------------------------------------------------------------------
--- PHẦN 4: BỘ 3 MẪU BÀI VIẾT QUẢNG CÁO (AD COPY) ---
${adCopies.map((ad, idx) => `
MẪU ADS #${idx + 1}: ${ad.headline || ""}
Góc tiếp cận: ${ad.angleName || ""}
Nội dung:
${ad.bodyText || ""}
Kêu gọi hành động: ${ad.callToAction || ""}
Gợi ý Target sở thích: ${(ad.targetInterests || []).join(", ")}
`).join("\n" + "-".repeat(40) + "\n")}

----------------------------------------------------------------------
--- PHẦN 5: THƯ CẢM ƠN KHÁCH HÀNG NHÉT HỘP (UNBOXING CARD) ---
Tiêu đề: ${u.title || ""}
Lời tri ân:
${u.letterBody || ""}

Lời kêu gọi 5 sao: ${u.fiveStarTip || ""}
Mã Voucher tái mua hàng: ${u.reorderVoucherCode || ""}
Chính sách bảo hành & CSKH: ${u.warrantyPolicy || ""}

----------------------------------------------------------------------
--- PHẦN 6: KỊCH BẢN CSKH & CHỐNG BOM HÀNG COD ---
1. Tin nhắn khi đơn hàng vừa xuất kho:
${a.dispatchSms || ""}

2. Tin nhắn khi bưu tá đang đi giao hàng:
${a.outForDeliverySms || ""}

3. Kịch bản cứu đơn khi khách nhắn tin phân vân muốn hủy:
${a.hesitationRescue || ""}

======================================================================
Xuất bản tự động bởi AIChoShop Launchpad - Đồng hành cùng Seller Việt
`;
}

/**
 * Xuất file Excel đa sheet chuyên nghiệp (.xlsx) có bẫy lỗi và làm sạch tên file an toàn
 */
export function exportLaunchpadToExcel(data: ProductLaunchpadData, inputs: ProductLaunchpadInputs): boolean {
  try {
    const wb = XLSX.utils.book_new();

    const o = data.overview || {};
    const s = data.seoListing || {};
    const u = data.unboxingCard || {};
    const a = data.antiReturnNudge || {};
    const bulletPoints = Array.isArray(s.bulletPoints) ? s.bulletPoints : [];
    const hashtags = Array.isArray(s.hashtags) ? s.hashtags : [];
    const videoScripts = Array.isArray(data.videoScripts) ? data.videoScripts : [];
    const adCopies = Array.isArray(data.adCopies) ? data.adCopies : [];

    // Sheet 1: Tổng quan chiến dịch
    const overviewRows = [
      { "Hạng Mục": "Tên sản phẩm", "Chi Tiết": o.productName || "" },
      { "Hạng Mục": "Ngành hàng", "Chi Tiết": o.category || "" },
      { "Hạng Mục": "Định vị sản phẩm", "Chi Tiết": o.positioning || "" },
      { "Hạng Mục": "Slogan chiến dịch", "Chi Tiết": o.slogan || "" },
      { "Hạng Mục": "Khách hàng mục tiêu", "Chi Tiết": o.targetAudienceSummary || "" },
      { "Hạng Mục": "Ước tính biên lợi nhuận", "Chi Tiết": o.grossMarginEst || "" },
      { "Hạng Mục": "Lộ trình: Giai đoạn 1", "Chi Tiết": o.launchPhases?.phase1 || "" },
      { "Hạng Mục": "Lộ trình: Giai đoạn 2", "Chi Tiết": o.launchPhases?.phase2 || "" },
      { "Hạng Mục": "Lộ trình: Giai đoạn 3", "Chi Tiết": o.launchPhases?.phase3 || "" },
    ];
    const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
    wsOverview["!cols"] = [{ wch: 25 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsOverview, "1. Tổng Quan");

    // Sheet 2: Listing SEO
    const seoRows = [
      { "Hạng Mục": "Tiêu đề Shopee SEO", "Nội Dung": s.shopeeTitle || "" },
      { "Hạng Mục": "Tiêu đề TikTok Shop", "Nội Dung": s.tiktokTitle || "" },
      ...bulletPoints.map((bp, i) => ({
        "Hạng Mục": `Điểm nổi bật #${i + 1}`,
        "Nội Dung": bp,
      })),
      { "Hạng Mục": "Mô tả sản phẩm chi tiết", "Nội Dung": s.detailedDescription || "" },
      { "Hạng Mục": "Bộ Hashtags", "Nội Dung": hashtags.join(" ") },
    ];
    const wsSeo = XLSX.utils.json_to_sheet(seoRows);
    wsSeo["!cols"] = [{ wch: 25 }, { wch: 90 }];
    XLSX.utils.book_append_sheet(wb, wsSeo, "2. Listing SEO");

    // Sheet 3: Kịch bản video
    const videoRows: Array<Record<string, string>> = [];
    videoScripts.forEach((vs, idx) => {
      const scenes = Array.isArray(vs.scenes) ? vs.scenes : [];
      scenes.forEach((sc, scIdx) => {
        videoRows.push({
          "Kịch Bản": `#${idx + 1}: ${vs.title || ""}`,
          "Góc Quay": vs.angle || "",
          "Thời Lượng": sc.time || "",
          "Hình Ảnh / Góc Máy": sc.visual || "",
          "Lời Thoại KOC": sc.voiceover || "",
          "Chữ Trên Màn Hình": sc.textOverlay || "",
          "Kêu Gọi Hành Động": scIdx === scenes.length - 1 ? (vs.callToAction || "") : "",
        });
      });
    });
    const wsVideo = XLSX.utils.json_to_sheet(videoRows.length > 0 ? videoRows : [{ "Kịch Bản": "Chưa có dữ liệu" }]);
    wsVideo["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 45 }, { wch: 25 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsVideo, "3. Video Scripts");

    // Sheet 4: Mẫu bài Ads
    const adRows = adCopies.map((ad, idx) => ({
      "STT": `Ads #${idx + 1}`,
      "Tiêu Đề Bài Viết": ad.headline || "",
      "Góc Tiếp Cận": ad.angleName || "",
      "Nội Dung Quảng Cáo": ad.bodyText || "",
      "Kêu Gọi Hành Động (CTA)": ad.callToAction || "",
      "Gợi Ý Target": Array.isArray(ad.targetInterests) ? ad.targetInterests.join(", ") : "",
    }));
    const wsAds = XLSX.utils.json_to_sheet(adRows.length > 0 ? adRows : [{ "STT": "Chưa có dữ liệu" }]);
    wsAds["!cols"] = [{ wch: 10 }, { wch: 35 }, { wch: 25 }, { wch: 70 }, { wch: 35 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsAds, "4. Mẫu Ads");

    // Sheet 5: Thư cảm ơn & Chống bom COD
    const unboxingRows = [
      { "Kênh / Loại": "Thư cảm ơn", "Hạng Mục": "Tiêu đề thiệp", "Nội Dung": u.title || "" },
      { "Kênh / Loại": "Thư cảm ơn", "Hạng Mục": "Nội dung thư tri ân", "Nội Dung": u.letterBody || "" },
      { "Kênh / Loại": "Thư cảm ơn", "Hạng Mục": "Mẹo kéo review 5 sao", "Nội Dung": u.fiveStarTip || "" },
      { "Kênh / Loại": "Thư cảm ơn", "Hạng Mục": "Mã Voucher tái mua", "Nội Dung": u.reorderVoucherCode || "" },
      { "Kênh / Loại": "Thư cảm ơn", "Hạng Mục": "Chính sách đổi trả & CSKH", "Nội Dung": u.warrantyPolicy || "" },
      { "Kênh / Loại": "Chống bom COD", "Hạng Mục": "Tin nhắn xuất kho", "Nội Dung": a.dispatchSms || "" },
      { "Kênh / Loại": "Chống bom COD", "Hạng Mục": "Tin nhắn đang giao", "Nội Dung": a.outForDeliverySms || "" },
      { "Kênh / Loại": "Chống bom COD", "Hạng Mục": "Kịch bản cứu đơn hủy", "Nội Dung": a.hesitationRescue || "" },
    ];
    const wsUnboxing = XLSX.utils.json_to_sheet(unboxingRows);
    wsUnboxing["!cols"] = [{ wch: 18 }, { wch: 25 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsUnboxing, "5. Thư Cảm Ơn & COD");

    // Tên file an toàn tuyệt đối không chứa ký tự cấm hệ điều hành
    const cleanProductName = (inputs.productName || "Product")
      .trim()
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 30);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `AIChoShop_Launchpad_${cleanProductName}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
    return true;
  } catch (err) {
    console.error("[exportLaunchpadToExcel] Lỗi xuất file Excel:", err);
    return false;
  }
}

/**
 * 3 Mẫu Preset ăn khách theo từng ngành hàng chính
 */
export const SAMPLE_LAUNCHPAD_PRESETS: Array<{
  id: string;
  label: string;
  icon: string;
  data: ProductLaunchpadInputs;
}> = [
  {
    id: "cosmetics",
    label: "Mỹ Phẩm & Skincare",
    icon: "💄",
    data: {
      productName: "Kem Chống Nắng Kiềm Dầu SPF50+ Nâng Tone Tự Nhiên La Roche",
      category: "Mỹ phẩm & Chăm sóc da",
      costPrice: "85.000đ",
      sellingPrice: "219.000đ",
      usp: "Màng lọc quang phổ rộng bảo vệ da 12h, kiềm dầu khô thoáng không bết rít, nâng tone tự nhiên không để lại vệt trắng, kháng nước cực tốt khi đi bơi hoặc đổ mồ hôi.",
      targetAudience: "Học sinh, sinh viên, dân văn phòng 18 - 35 tuổi thường xuyên tiếp xúc ánh nắng, màn hình máy tính, da dầu mụn nhạy cảm.",
      platform: "all",
      tone: "natural",
      notes: "Tập trung vào yếu tố kiềm dầu và không để vệt trắng khi ra mồ hôi."
    }
  },
  {
    id: "fashion",
    label: "Thời Trang & Thể Thao",
    icon: "👕",
    data: {
      productName: "Áo Polo Nam Thể Thao Co Giãn 4 Chiều Chống Nhăn Form Slimfit",
      category: "Thời trang nam",
      costPrice: "55.000đ",
      sellingPrice: "149.000đ",
      usp: "Chất vải cá sấu mè kim cương thoáng khí tổ ong, co giãn 4 chiều vận động thoải mái, giặt máy không xù lông không bai dão, form slimfit tôn dáng che bụng bia.",
      targetAudience: "Nam giới 20 - 45 tuổi đi làm công sở, chơi thể thao (golf, pickleball, tennis) hoặc đi cà phê dạo phố.",
      platform: "shopee",
      tone: "aggressive",
      notes: "Đánh mạnh vào bảo hành 1 đổi 1 và giặt máy vô tư không nhăn."
    }
  },
  {
    id: "home",
    label: "Gia Dụng & Bếp",
    icon: "🍳",
    data: {
      productName: "Nồi Chiên Không Dầu Hơi Nước 2 Trong 1 Dung Tích 8L Lock&Care",
      category: "Gia dụng nhà bếp",
      costPrice: "650.000đ",
      sellingPrice: "1.490.000đ",
      usp: "Công nghệ chiên hơi nước Steam Active giữ thịt mọng nước không bị khô xác, giảm 90% lượng mỡ thừa, dung tích 8L nướng nguyên con gà 3kg, lòng nồi chống dính ceramic an toàn chuẩn FDA.",
      targetAudience: "Chị em nội trợ, các mẹ trẻ bận rộn 25 - 45 tuổi muốn nấu ăn nhanh chóng, heo-thì, bảo vệ sức khỏe cả nhà.",
      platform: "tiktok",
      tone: "expert",
      notes: "Tặng kèm sách 50 công thức nấu ăn độc quyền và kẹp gắp thực phẩm."
    }
  }
];
