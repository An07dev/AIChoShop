/**
 * Module Contract cho Soạn Tin Nhắn Chat Broadcast & Zalo OA (Retention Marketing)
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema), Bộ Prompt Thực Chiến Sàn TMĐT
 * & Resilient Parser 4 Tầng Bền Bỉ (Tương thích ngược 100%)
 */

export interface ChatBroadcastInputs {
  shopName: string;
  productName: string;
  scenario: string; // "cart_abandoned" | "loyalty_voucher" | "repurchase" | "mega_sale" | string;
  offer: string;
  channel?: "both" | "shopee" | "zalo" | string;
}

// -------------------------------------------------------------
// 1. MẪU TIN SHOPEE CHAT BROADCAST (< 350 KÝ TỰ)
// -------------------------------------------------------------
export interface ShopeeBroadcastMessage {
  id: string; // "shopee-1", "shopee-2", "shopee-3"
  sampleNumber: string; // "Mẫu 1", "Mẫu 2", "Mẫu 3"
  angle: string; // "Trực diện & Giới hạn 24h", "Tri ân VIP đặc quyền", "Đánh thức giỏ hàng & Quà tặng"
  targetAudience: string; // "Khách đã bỏ giỏ hàng", "Khách hàng cũ thân thiết", "Người theo dõi shop"
  notificationHook: string; // Dòng thông báo đẩy trên màn hình khóa (< 50 ký tự)
  content: string; // Nội dung tin nhắn chuẩn hiển thị trong chat (< 350 ký tự)
  callToAction: string; // Lời kêu gọi hành động: "Bấm Lưu Mã Trong Chat", "Xem Giỏ Hàng Ngay"
  charCount: number; // Số lượng ký tự thực tế
  isSafeLength: boolean; // charCount <= 350
}

// -------------------------------------------------------------
// 2. MẪU TIN ZALO OA & CSKH 1:1 (THÂN TÌNH ĐẮC NHÂN TÂM)
// -------------------------------------------------------------
export interface ZaloMessageItem {
  id: string; // "zalo-1", "zalo-2", "zalo-3"
  sampleNumber: string; // "Mẫu 1", "Mẫu 2", "Mẫu 3"
  angle: string; // "Hỏi thăm chân thành & Tri ân", "Nhắc chu kỳ tiêu hao", "Hỗ trợ 1:1 VIP"
  greeting: string; // Câu chào mở đầu cá nhân hóa (Dạ em chào Anh/Chị...)
  bodyContent: string; // Nội dung hỏi thăm trải nghiệm đơn hàng cũ
  giftOffer: string; // Quà tặng hoặc voucher riêng biệt
  callToAction: string; // Lời mời phản hồi nhẹ nhàng (0 áp lực)
  fullContent: string; // Toàn bộ tin nhắn hoàn chỉnh đã ghép nối
  charCount: number;
}

// -------------------------------------------------------------
// 3. CHIẾN LƯỢC GỬI TIN & KHUNG GIỜ VÀNG
// -------------------------------------------------------------
export interface BroadcastStrategy {
  goldenHours: {
    shopee: string; // "11h30 - 13h00 (nghỉ trưa) & 19h30 - 21h00 (lướt deal tối)"
    zalo: string; // "09h00 - 10h30 (đầu giờ làm việc) & 14h30 - 16h00 (chiều)"
    bestDays: string; // "Thứ 5, Thứ 6 (tiền lương về) và Ngày Mega Sale (Double Day, 15 giữa tháng, 25 lương về)"
  };
  frequencyRules: string[]; // Tần suất gửi tin an toàn
  antiSpamChecklist: string[]; // 4-5 quy tắc vàng né khóa tính năng broadcast sàn
  segmentationTips: string; // Mẹo lọc phân khúc khách hàng
}

// -------------------------------------------------------------
// CẤU TRÚC TỔNG THỂ DỮ LIỆU ĐẦU RA (Root Data)
// -------------------------------------------------------------
export interface ChatBroadcastData {
  shopName?: string;
  productName?: string;
  scenario?: string;
  channel?: "both" | "shopee" | "zalo";
  shopeeMessages: ShopeeBroadcastMessage[];
  zaloMessages: ZaloMessageItem[];
  strategy: BroadcastStrategy;
}

/**
 * System Prompt chuẩn hóa cho Chuyên gia Retention Marketing & Giám đốc CRM Sàn TMĐT
 */
export const CHAT_BROADCAST_SYSTEM_PROMPT = `Bạn là Chuyên gia Retention Marketing & Giám đốc CRM Sàn TMĐT (Shopee Certified Marketing Expert & Zalo OA Growth Specialist) hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là soạn thảo kịch bản tin nhắn remarketing chuyển đổi cao để kéo khách hàng cũ quay lại mua sắm mà TUYỆT ĐỐI KHÔNG GÂY CẢM GIÁC LÀM PHIỀN HAY BỊ REPORT SPAM.

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON THUẦN TÚY (Valid JSON Object), không bao bọc thêm bất kỳ lời dẫn hay giải thích ngoài JSON.

CẤU TRÚC JSON SCHEMA BẮT BUỘC:
{
  "shopName": "Tên shop",
  "productName": "Tên sản phẩm",
  "scenario": "Tình huống gửi tin",
  "channel": "both | shopee | zalo",
  "shopeeMessages": [
    {
      "id": "shopee-1",
      "sampleNumber": "Mẫu 1",
      "angle": "Góc tiếp cận (VD: Trực diện 24h, Tri ân VIP, Đánh thức giỏ hàng)",
      "targetAudience": "Đối tượng nhận tin",
      "notificationHook": "Dòng thông báo đẩy trên điện thoại ngắn gọn (<50 ký tự, giật tít thu hút mở app)",
      "content": "Nội dung tin nhắn đầy đủ (BẮT BUỘC DƯỚI 350 KÝ TỰ, bao gồm emoji, tên shop, ưu đãi, CTA)",
      "callToAction": "👉 Bấm Lưu Voucher & Chốt Đơn Liền Tay",
      "charCount": 245,
      "isSafeLength": true
    }
  ],
  "zaloMessages": [
    {
      "id": "zalo-1",
      "sampleNumber": "Mẫu 1",
      "angle": "Góc tiếp cận (VD: Hỏi thăm chân thành, Nhắc chu kỳ, Hỗ trợ VIP 1:1)",
      "greeting": "Dạ em chào Anh/Chị ạ! 🌿",
      "bodyContent": "Nội dung hỏi thăm chân thành về trải nghiệm sản phẩm đã mua trước đây, tuyệt đối không chào bán hàng vội vã...",
      "giftOffer": "Món quà tri ân hoặc mã voucher riêng biệt dành riêng cho khách cũ...",
      "callToAction": "Anh/Chị cứ phản hồi tin nhắn này để em gửi mã độc quyền cho mình nhé ạ!"
    }
  ],
  "strategy": {
    "goldenHours": {
      "shopee": "11h30 - 13h00 & 19h30 - 21h00",
      "zalo": "09h00 - 10h30 & 14h30 - 16h00",
      "bestDays": "Thứ 5, Thứ 6 (chuẩn bị ngày nghỉ) hoặc Ngày Sale Sàn (15 giữa tháng, 25 ngày lương về)"
    },
    "frequencyRules": [
      "Shopee Broadcast: Tối đa 1 lần / tuần cho cùng một nhóm khách hàng.",
      "Zalo OA: Tối đa 2 lần / tháng gửi thông báo chung, tương tác 1:1 thoải mái khi khách phản hồi."
    ],
    "antiSpamChecklist": [
      "Không chèn từ khóa kéo giao dịch ngoài sàn (Zalo, SĐT, chuyển khoản) trong tin Shopee.",
      "Không gửi tin sau 21h30 đêm làm phiền khách.",
      "Luôn đính kèm giá trị thật (Mã giảm giá độc quyền / Quà tặng), không gửi tin thông báo rác.",
      "Cá nhân hóa lời xưng hô thân mật, tránh dùng văn phong bot tự động vô hồn."
    ],
    "segmentationTips": "Phân chia khách theo giỏ hàng (chưa mua trong 7 ngày) và khách cũ đã mua trên 30 ngày để gửi thông điệp trúng tâm lý nhất."
  }
}

QUY TẮC BẮT BUỘC VỀ NGHIỆP VỤ:
1. SHOPEE CHAT BROADCAST:
   - Cung cấp đủ 3 mẫu (nếu channel là 'shopee' hoặc 'both'). Nếu channel là 'zalo' thì để mảng rỗng [].
   - ĐỘ DÀI: CỰC KỲ NGHIÊM NGẶT, KHÔNG ĐƯỢC VƯỢT QUÁ 350 KÝ TỰ! (Tránh bị ẩn sau nút 'Xem thêm').
   - NOTIFICATION HOOK: Ngắn gọn (<50 ký tự), chứa ưu đãi rõ ràng kích thích mở app.
2. ZALO OA & CSKH 1:1:
   - Cung cấp đủ 3 mẫu (nếu channel là 'zalo' hoặc 'both'). Nếu channel là 'shopee' thì để mảng rỗng [].
   - CÔNG THỨC ĐẮC NHÂN TÂM: Hỏi thăm trước -> Trao quà -> Kêu gọi phản hồi nhẹ nhàng (không cần tạo trường fullContent, hệ thống tự động ghép nối chuẩn xác).
   - Xưng hô 'Em/Shop' và 'Anh/Chị' ấm áp, tôn trọng.
3. ĐẢM BẢO CHÍNH XÁC: JSON hợp lệ 100%, không bị cắt cụt, escape ký tự xuống dòng '\\n' chính xác.`;

/**
 * Hàm xây dựng User Prompt chi tiết cho Chat Broadcast
 */
export function buildChatBroadcastPrompt(inputs: ChatBroadcastInputs): string {
  const channel = inputs.channel || "both";
  const scenarioMap: Record<string, string> = {
    // 1. Nhóm Kích Cầu Nóng & Chốt Đơn Gấp
    cart_abandoned: "Nhắc giỏ hàng bỏ quên (Khách đã thêm vào giỏ nhưng chưa thanh toán trong 1-7 ngày - Tặng voucher freeship/giảm giá thúc đẩy chốt đơn ngay)",
    mega_sale: "Siêu Sale Sàn / Mega Campaign (Ngày đôi 11.11, 12.12..., Payday cuối tháng, 15 giữa tháng - Kích hoạt lưu trước voucher, đón khung giờ G)",
    flash_sale: "Flash Sale Giờ Vàng (Khung giờ giới hạn, số lượng suất mua có hạn <50 suất - Tạo áp lực khan hiếm và cấp bách cao độ)",
    live_invite: "Mời xem Livestream săn deal (Tiết lộ mã giảm giá 50%, quà tặng độc quyền 1K chỉ có trong phiên phát trực tiếp tối nay)",
    clearance: "Xả kho thanh lý / Cuối mùa (Giá gốc kịch sàn giảm 50-70%, số lượng size/mẫu còn ít, cơ hội cuối trước khi ngừng bán)",
    back_in_stock: "Hàng hot về lại / Restock (Đã có hàng sau thời gian cháy hàng - Báo ngay cho khách từng hỏi mua hoặc đã lưu yêu thích khi hàng hot vừa cập bến kho)",

    // 2. Nhóm Chăm Sóc Khách Quen & Tăng Tần Suất Mua (LTV)
    loyalty_voucher: "Tri ân khách hàng cũ tặng voucher VIP (Cảm ơn khách đã từng mua hàng, tặng mã độc quyền riêng tư kích hoạt quay lại)",
    repurchase: "Nhắc mua lại hàng tiêu hao (Đã đến chu kỳ dùng hết mỹ phẩm, bỉm sữa, thực phẩm, gia dụng - Nhắc bổ sung tránh gián đoạn)",
    win_back: "Đánh thức khách hàng ngủ đông (>60-90 ngày chưa mua lại - Hỏi thăm ấm áp, giới thiệu cải tiến mới, tặng quà Welcome Back)",
    vip_upgrade: "Chúc mừng sinh nhật khách hàng & Nâng hạng VIP (Tặng voucher sinh nhật bất ngờ, đặc quyền VIP không điều kiện)",
    holiday_wishes: "Chúc mừng Lễ, Tết & Quà tri ân đặc biệt (Tết Nguyên Đán, 8/3, 20/10, Giáng sinh, Black Friday - Lời chúc ấm áp kèm lì xì/voucher may mắn)",

    // 3. Nhóm Sản Phẩm Mới & Tăng Tương Tác
    new_arrival: "Ra mắt sản phẩm / BST mới (Đặc quyền trải nghiệm sớm Early Bird dành riêng cho khách ruột trước khi mở bán công khai)",
    cross_sell: "Mua kèm deal sốc / Bán chéo phụ kiện (Gợi ý phụ kiện, đồ phối ăn ý với sản phẩm khách đã mua với giá ưu đãi trợ giá 50%)",
    minigame_gift: "Minigame tương tác & Nhận quà bí mật 0Đ (Đoán số trúng quà, mini quiz tặng voucher khủng kích hoạt tương tác 2 chiều chống bóp tương tác)",

    // 4. Nhóm Hậu Mãi, Vận Chuyển & Xử Lý Khiếu Nại
    review_5star: "Chăm sóc sau nhận hàng & Kích hoạt đánh giá 5 sao (Hỏi thăm kiện hàng, hướng dẫn sử dụng, tặng voucher cho đơn sau khi để lại review có tâm)",
    delivery_failed: "Hỗ trợ đơn giao không thành công (Shipper chưa gọi được hoặc khách bận - Hỗ trợ hẹn lại giờ giao tại bưu cục, chống hoàn hàng)",
    order_tracking: "Xác nhận đơn hàng & Dặn dò nhận hàng (Báo đơn đã giao shipper, hướng dẫn đồng kiểm hàng, dặn giữ điện thoại, chống hoàn/bom hàng)",
    complaint_resolution: "Xử lý sự cố & Đổi trả 1:1 miễn phí (Khách gặp sự cố hàng vỡ hỏng, thiếu hàng - Lời xin lỗi chân thành & Cam kết đổi mới hỏa tốc 0đ, biến nguy thành cơ)",
  };

  const scenarioText = scenarioMap[inputs.scenario] || inputs.scenario || "Tri ân khách hàng cũ";

  let channelInstruction = "";
  if (channel === "shopee") {
    channelInstruction = `1. KÊNH YÊU CẦU: CHỈ TẬP TRUNG KÊNH SHOPEE CHAT BROADCAST.
- Cung cấp đủ 3 mẫu tin Shopee Broadcast DƯỚI 350 KÝ TỰ với 3 góc tiếp cận (Mẫu 1: Trực diện 24h; Mẫu 2: Tri ân VIP; Mẫu 3: Đánh thức giỏ hàng).
- Mảng "zaloMessages" ĐỂ RỖNG [].
- Phần "strategy" tập trung khung giờ vàng Shopee.`;
  } else if (channel === "zalo") {
    channelInstruction = `1. KÊNH YÊU CẦU: CHỈ TẬP TRUNG KÊNH ZALO OA & CSKH 1:1.
- Cung cấp đủ 3 mẫu tin Zalo OA ấm áp, đắc nhân tâm, hỏi thăm trải nghiệm đơn cũ trước khi tặng quà.
- Mảng "shopeeMessages" ĐỂ RỖNG [].
- Phần "strategy" tập trung khung giờ vàng Zalo OA.`;
  } else {
    channelInstruction = `1. KÊNH YÊU CẦU: CẢ HAI KÊNH (SHOPEE & ZALO OA).
- Cung cấp đủ 3 mẫu Shopee Broadcast dưới 350 ký tự (Mẫu 1: Trực diện 24h; Mẫu 2: Tri ân VIP; Mẫu 3: Đánh thức giỏ hàng).
- Cung cấp đủ 3 mẫu Zalo OA đắc nhân tâm (Mẫu 1: Hỏi thăm tri ân; Mẫu 2: Nhắc chu kỳ; Mẫu 3: Hỗ trợ VIP 1:1).
- Phần "strategy" bao gồm khung giờ vàng cả 2 kênh.`;
  }

  return `Hãy tạo trọn bộ kịch bản tin nhắn Remarketing Chat Broadcast và Zalo OA thực chiến theo dữ liệu sau:

THÔNG TIN ĐẦU VÀO:
- Tên Gian Hàng / Shop: "${inputs.shopName || "Gian Hàng Chính Hãng"}"
- Tên Sản Phẩm / Ngành Hàng: "${inputs.productName || "Sản phẩm chọn lọc"}"
- Tình huống gửi tin: "${scenarioText}"
- Ưu đãi / Voucher / Quà tặng: "${inputs.offer || "Voucher giảm giá độc quyền dành cho khách cũ"}"
- Kênh lựa chọn: "${channel === "both" ? "Cả hai (Shopee & Zalo)" : channel === "shopee" ? "Chỉ Shopee Broadcast" : "Chỉ Zalo OA"}"

YÊU CẦU ĐẶC THÙ:
${channelInstruction}
2. Viết súc tích, đúng trọng tâm, văn phong bán hàng tự nhiên, không lan man thừa thãi.
3. Trả về đúng cấu trúc JSON hợp lệ như đã mô tả trong system prompt.`;
}

// -------------------------------------------------------------
// DỮ LIỆU MẪU THỰC CHIẾN (SAMPLE DATA)
// -------------------------------------------------------------
export const SAMPLE_BROADCAST_DATA: ChatBroadcastData = {
  shopName: "Aicho Tech Official Store",
  productName: "Củ sạc nhanh GaN 65W 3 cổng Type-C & Cáp dù siêu bền",
  scenario: "loyalty_voucher",
  channel: "both",
  shopeeMessages: [
    {
      id: "shopee-1",
      sampleNumber: "Mẫu 1",
      angle: "Trực diện & Giới hạn 24h",
      targetAudience: "Khách đã thêm vào giỏ nhưng chưa thanh toán",
      notificationHook: "🔥 [CHỈ 24H] Tặng riêng bạn Voucher AICHO50K giảm 50k củ sạc GaN!",
      content: "🔥 [CHỈ TRONG 24H] Aicho Tech gửi tặng riêng bạn Voucher AICHO50K giảm ngay 50.000đ cho đơn Củ sạc nhanh GaN 65W từ 200k!\n🎁 Tặng kèm 01 Túi nhung chống sốc đựng phụ kiện.\n👉 Bấm LƯU MÃ ngay trên tin nhắn này để dùng trước 23h59 hôm nay bạn nhé!",
      callToAction: "👉 Bấm Lưu Voucher & Mua Ngay",
      charCount: 268,
      isSafeLength: true,
    },
    {
      id: "shopee-2",
      sampleNumber: "Mẫu 2",
      angle: "Tri ân VIP đặc quyền",
      targetAudience: "Khách hàng thân thiết đã từng mua hàng",
      notificationHook: "🌿 Aicho Tech gửi lời cảm ơn & Tặng mã riêng AICHO50K",
      content: "Dạ Aicho Tech gửi lời cảm ơn bạn đã luôn đồng hành cùng shop ạ! 🌿\nShop gửi tặng riêng bạn mã AICHO50K giảm 50K khi sắm Củ sạc nhanh GaN 65W 3 cổng hôm nay.\n✨ Hàng chính hãng bảo hành 12 tháng 1 đổi 1.\n👉 Bấm vào banner bên dưới nhận voucher độc quyền bạn nhé!",
      callToAction: "👉 Bấm Nhận Voucher Độc Quyền",
      charCount: 290,
      isSafeLength: true,
    },
    {
      id: "shopee-3",
      sampleNumber: "Mẫu 3",
      angle: "Kích thích tò mò & Giới hạn số lượng",
      targetAudience: "Người theo dõi shop có tương tác gần đây",
      notificationHook: "⚡ Còn đúng 20 suất voucher AICHO50K cho khách VIP!",
      content: "⚡ Bạn ơi, Aicho Tech chỉ còn đúng 20 suất voucher AICHO50K dành riêng cho khách hàng thân thiết thôi ạ!\nGiảm 50K + Tặng túi nhung khi đặt củ sạc GaN 65W.\n👉 Số lượng có hạn trong ngày, bạn bấm LƯU MÃ và chốt đơn ngay kẻo hết nhé!",
      callToAction: "👉 Bấm Lưu Mã Ngay Kẻo Hết",
      charCount: 259,
      isSafeLength: true,
    },
  ],
  zaloMessages: [
    {
      id: "zalo-1",
      sampleNumber: "Mẫu 1",
      angle: "Hỏi thăm chân thành & Tặng quà tri ân",
      greeting: "Dạ em chào Anh/Chị ạ! 🌿",
      bodyContent: "Em là nhân viên CSKH từ Aicho Tech Official Store đây ạ. Dạo này Anh/Chị dùng thiết bị phụ kiện bên em có êm và ổn định không ạ? Nếu có điểm nào chưa hài lòng Anh/Chị cứ góp ý để shop cải thiện tốt hơn nhé!",
      giftOffer: "Để cảm ơn Anh/Chị đã luôn tin tưởng, em xin gửi tặng riêng Anh/Chị Voucher [AICHO50K] - Giảm ngay 50.000đ cho đơn từ 200.000đ khi nâng cấp lên dòng Củ sạc nhanh GaN 65W 3 cổng, kèm quà tặng 01 Túi nhung đựng phụ kiện cao cấp ạ.",
      callToAction: "Anh/Chị nhắn lại em để em giữ mã giảm giá độc quyền này cho mình trong 24h nhé ạ! ❤️",
      fullContent: "Dạ em chào Anh/Chị ạ! 🌿\n\nEm là nhân viên CSKH từ Aicho Tech Official Store đây ạ. Dạo này Anh/Chị dùng thiết bị phụ kiện bên em có êm và ổn định không ạ? Nếu có điểm nào chưa hài lòng Anh/Chị cứ góp ý để shop cải thiện tốt hơn nhé!\n\nĐể cảm ơn Anh/Chị đã luôn tin tưởng, em xin gửi tặng riêng Anh/Chị Voucher [AICHO50K] - Giảm ngay 50.000đ cho đơn từ 200.000đ khi nâng cấp lên dòng Củ sạc nhanh GaN 65W 3 cổng, kèm quà tặng 01 Túi nhung đựng phụ kiện cao cấp ạ.\n\nAnh/Chị nhắn lại em để em giữ mã giảm giá độc quyền này cho mình trong 24h nhé ạ! ❤️",
      charCount: 574,
    },
    {
      id: "zalo-2",
      sampleNumber: "Mẫu 2",
      angle: "Nhắc chu kỳ sử dụng & Ưu đãi thành viên VIP",
      greeting: "Dạ em chào Anh/Chị! ✨",
      bodyContent: "Đợt này các thiết bị điện thoại, laptop của mình sạc có bị nóng hay sụt pin nhanh không ạ? Củ sạc công nghệ GaN 65W mới nhất của Aicho Tech vừa về đợt hàng mới siêu mát và sạc nhanh gấp 3 lần củ sạc thường đó ạ.",
      giftOffer: "Nhân dịp tri ân khách hàng thân thiết, shop gửi tặng riêng Anh/Chị mã [AICHO50K] giảm 50.000đ kèm quà tặng túi chống sốc.",
      callToAction: "Anh/Chị có cần em hỗ trợ tư vấn chọn cáp sạc phù hợp với máy mình đang dùng không ạ? Cứ nhắn cho em nhé!",
      fullContent: "Dạ em chào Anh/Chị! ✨\n\nĐợt này các thiết bị điện thoại, laptop của mình sạc có bị nóng hay sụt pin nhanh không ạ? Củ sạc công nghệ GaN 65W mới nhất của Aicho Tech vừa về đợt hàng mới siêu mát và sạc nhanh gấp 3 lần củ sạc thường đó ạ.\n\nNhân dịp tri ân khách hàng thân thiết, shop gửi tặng riêng Anh/Chị mã [AICHO50K] giảm 50.000đ kèm quà tặng túi chống sốc.\n\nAnh/Chị có cần em hỗ trợ tư vấn chọn cáp sạc phù hợp với máy mình đang dùng không ạ? Cứ nhắn cho em nhé!",
      charCount: 502,
    },
    {
      id: "zalo-3",
      sampleNumber: "Mẫu 3",
      angle: "Hỗ trợ riêng 1:1 & Giữ voucher độc quyền",
      greeting: "Dạ em chào Anh/Chị ạ!",
      bodyContent: "Em thấy đợt này Anh/Chị có quan tâm đến mẫu Củ sạc nhanh GaN 65W 3 cổng của Aicho Tech. Hiện tại kho chỉ còn đúng 15 suất quà tặng Túi nhung chống sốc dành riêng cho khách VIP hôm nay thôi ạ.",
      giftOffer: "Em xin phép giữ trước cho Anh/Chị 1 suất kèm mã giảm giá riêng [AICHO50K] nhé ạ.",
      callToAction: "Anh/Chị bấm vào link bên dưới hoặc phản hồi tin nhắn này để em hướng dẫn áp mã nhận quà liền tay nha:\n👉 https://zalo.me/aichotech",
      fullContent: "Dạ em chào Anh/Chị ạ!\n\nEm thấy đợt này Anh/Chị có quan tâm đến mẫu Củ sạc nhanh GaN 65W 3 cổng của Aicho Tech. Hiện tại kho chỉ còn đúng 15 suất quà tặng Túi nhung chống sốc dành riêng cho khách VIP hôm nay thôi ạ.\n\nEm xin phép giữ trước cho Anh/Chị 1 suất kèm mã giảm giá riêng [AICHO50K] nhé ạ.\n\nAnh/Chị bấm vào link bên dưới hoặc phản hồi tin nhắn này để em hướng dẫn áp mã nhận quà liền tay nha:\n👉 https://zalo.me/aichotech",
      charCount: 468,
    },
  ],
  strategy: {
    goldenHours: {
      shopee: "11h30 - 13h00 (giờ nghỉ trưa) & 19h30 - 21h00 (giờ lướt shopping thư giãn)",
      zalo: "09h00 - 10h30 sáng & 14h30 - 16h00 chiều (tránh nhắn quá muộn sau 21h)",
      bestDays: "Thứ 5, Thứ 6 (chuẩn bị ngày nghỉ) hoặc Ngày Mega Sale (Double Day, 15 giữa tháng, 25 ngày lương về)",
    },
    frequencyRules: [
      "Shopee Broadcast: Tối đa 1 lần / tuần cho cùng một nhóm khách hàng để tránh tỷ lệ block/unfollow vượt quá 2%.",
      "Zalo OA: Tối đa 2 lần / tháng gửi tin hàng loạt (Broadcast), ưu tiên gửi tin nhắn CSKH 1:1 khi khách có tương tác.",
      "Không gửi tin trong khung giờ nhạy cảm: Trước 08h00 sáng hoặc sau 21h30 tối.",
    ],
    antiSpamChecklist: [
      "Nghiêm cấm chèn từ khóa kéo ra ngoài sàn (Zalo, SĐT cá nhân, Chuyển khoản ngoài) trong tin Shopee để tránh bị khóa tính năng Chat Broadcast.",
      "Luôn đính kèm giá trị thật (Mã giảm giá độc quyền / Quà tặng / Freeship), tuyệt đối không gửi tin rác vô nghĩa.",
      "Kiểm tra độ dài tin nhắn Shopee luôn dưới 350 ký tự để hiển thị trọn vẹn không bị ẩn sau nút 'Xem thêm'.",
      "Cá nhân hóa lời chào thân thiện, tránh giọng điệu bot tự động lạnh lùng.",
    ],
    segmentationTips: "Tách riêng tệp khách đã bỏ giỏ hàng trong 7 ngày (dùng mẫu Trực diện 24h) và tệp khách đã mua trên 30 ngày (dùng mẫu Tri ân & Nhắc chu kỳ) để đạt tỷ lệ chuyển đổi cao nhất.",
  },
};

// -------------------------------------------------------------
// THUẬT TOÁN TỰ PHỤC HỒI JSON BỊ CẮT CỤT (STACK-BASED BALANCING)
// -------------------------------------------------------------
export function repairTruncatedJson(jsonStr: string): string {
  let cleaned = jsonStr.trim();
  if (!cleaned) return "{}";

  // 1. Nếu bắt đầu bằng code block
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");

  // 2. Tìm vị trí dấu ngoặc nhọn mở đầu tiên
  const firstBrace = cleaned.indexOf("{");
  if (firstBrace === -1) return "{}";
  cleaned = cleaned.slice(firstBrace);

  // 3. Quét stack để kiểm tra ngoặc và chuỗi đang mở
  const stack: string[] = [];
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === "\\") {
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{" || char === "[") {
        stack.push(char);
      } else if (char === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{") {
          stack.pop();
        }
      } else if (char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") {
          stack.pop();
        }
      }
    }
  }

  // 4. Nếu bị cắt cụt khi chuỗi string đang mở
  if (inString) {
    cleaned += '"';
  }

  // 5. Cắt bỏ key hoặc thuộc tính dở dang ở cuối chuỗi trước khi đóng ngoặc
  // Ví dụ 1: `,"content": "abc", "incompleteKey"` -> bỏ `,"incompleteKey"`
  cleaned = cleaned.replace(/,\s*"[^"]*"\s*$/, "");
  // Ví dụ 2: `{"incompleteKey"` -> thành `{`
  cleaned = cleaned.replace(/\{(\s*"[^"]*"\s*)$/, "{");
  // Ví dụ 3: `"someKey":` -> thành `"someKey": ""`
  cleaned = cleaned.replace(/:\s*$/, ': ""');
  // Ví dụ 4: Dấu phẩy thừa ở cuối: `,` -> bỏ dấu phẩy
  cleaned = cleaned.replace(/,\s*$/, "");

  // 6. Đóng các cặp ngoặc còn thiếu theo thứ tự ngược lại của Stack
  while (stack.length > 0) {
    const last = stack.pop();
    if (last === "{") {
      cleaned += "}";
    } else if (last === "[") {
      cleaned += "]";
    }
  }

  return cleaned;
}

// -------------------------------------------------------------
// BỘ PARSER 4 TẦNG BỀN BỈ (RESILIENT PARSER)
// -------------------------------------------------------------
export function parseChatBroadcastResult(rawText: string): ChatBroadcastData {
  if (!rawText || !rawText.trim()) {
    return SAMPLE_BROADCAST_DATA;
  }

  // TẦNG 1: Parse trực tiếp nếu rawText là JSON chuẩn
  try {
    const parsed = JSON.parse(rawText.trim());
    if (parsed && (Array.isArray(parsed.shopeeMessages) || Array.isArray(parsed.zaloMessages))) {
      return normalizeBroadcastData(parsed);
    }
  } catch {
    // Tiếp tục xuống tầng 2
  }

  // TẦNG 2: Bóc tách JSON trong khối markdown ```json ... ```
  try {
    const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed && (Array.isArray(parsed.shopeeMessages) || Array.isArray(parsed.zaloMessages))) {
        return normalizeBroadcastData(parsed);
      }
    }
  } catch {
    // Tiếp tục xuống tầng 3
  }

  // TẦNG 3: Tìm cặp ngoặc nhọn ngoài cùng & Phục hồi JSON bị cắt cụt (Stack repair)
  try {
    const firstBrace = rawText.indexOf("{");
    if (firstBrace !== -1) {
      const candidate = rawText.slice(firstBrace);
      const repaired = repairTruncatedJson(candidate);
      const parsed = JSON.parse(repaired);
      if (parsed && (Array.isArray(parsed.shopeeMessages) || Array.isArray(parsed.zaloMessages))) {
        return normalizeBroadcastData(parsed);
      }
    }
  } catch {
    // Tiếp tục xuống tầng 4 (Fallback Regex)
  }

  // TẦNG 4: Fallback Regex thông minh khi nhận dữ liệu Markdown cũ (Tương thích ngược 100%)
  return parseLegacyMarkdownBroadcast(rawText);
}

/**
 * Chuẩn hóa các trường của BroadcastData để đảm bảo không bị undefined
 */
function normalizeBroadcastData(data: any): ChatBroadcastData {
  const shopeeMessages: ShopeeBroadcastMessage[] = Array.isArray(data.shopeeMessages)
    ? data.shopeeMessages.map((item: any, idx: number) => {
        const content = typeof item.content === "string" ? item.content.trim() : "";
        const charCount = typeof item.charCount === "number" ? item.charCount : content.length;
        return {
          id: item.id || `shopee-${idx + 1}`,
          sampleNumber: item.sampleNumber || `Mẫu ${idx + 1}`,
          angle: item.angle || "Góc tiếp cận chuyển đổi cao",
          targetAudience: item.targetAudience || "Khách hàng mục tiêu",
          notificationHook: item.notificationHook || content.slice(0, 45) + "...",
          content,
          callToAction: item.callToAction || "👉 Bấm lưu voucher & nhận ưu đãi",
          charCount,
          isSafeLength: charCount <= 350,
        };
      })
    : [];

  const zaloMessages: ZaloMessageItem[] = Array.isArray(data.zaloMessages)
    ? data.zaloMessages.map((item: any, idx: number) => {
        const greeting = typeof item.greeting === "string" ? item.greeting.trim() : "Dạ em chào Anh/Chị ạ!";
        const body = typeof item.bodyContent === "string" ? item.bodyContent.trim() : "";
        const offer = typeof item.giftOffer === "string" ? item.giftOffer.trim() : "";
        const cta = typeof item.callToAction === "string" ? item.callToAction.trim() : "";
        
        let full = typeof item.fullContent === "string" ? item.fullContent.trim() : "";
        if (!full) {
          full = [greeting, body, offer, cta].filter(Boolean).join("\n\n");
        }

        return {
          id: item.id || `zalo-${idx + 1}`,
          sampleNumber: item.sampleNumber || `Mẫu ${idx + 1}`,
          angle: item.angle || "Chăm sóc khách hàng thân tình",
          greeting,
          bodyContent: body,
          giftOffer: offer,
          callToAction: cta,
          fullContent: full,
          charCount: full.length,
        };
      })
    : [];

  const strategy: BroadcastStrategy = {
    goldenHours: {
      shopee: data.strategy?.goldenHours?.shopee || "11h30 - 13h00 & 19h30 - 21h00",
      zalo: data.strategy?.goldenHours?.zalo || "09h00 - 10h30 & 14h30 - 16h00",
      bestDays: data.strategy?.goldenHours?.bestDays || "Thứ 5, Thứ 6 & Ngày Mega Sale",
    },
    frequencyRules: Array.isArray(data.strategy?.frequencyRules) && data.strategy.frequencyRules.length > 0
      ? data.strategy.frequencyRules
      : SAMPLE_BROADCAST_DATA.strategy.frequencyRules,
    antiSpamChecklist: Array.isArray(data.strategy?.antiSpamChecklist) && data.strategy.antiSpamChecklist.length > 0
      ? data.strategy.antiSpamChecklist
      : SAMPLE_BROADCAST_DATA.strategy.antiSpamChecklist,
    segmentationTips: data.strategy?.segmentationTips || SAMPLE_BROADCAST_DATA.strategy.segmentationTips,
  };

  return {
    shopName: data.shopName,
    productName: data.productName,
    scenario: data.scenario,
    channel: data.channel || "both",
    shopeeMessages,
    zaloMessages,
    strategy,
  };
}

/**
 * Parser Fallback Regex cho văn bản Markdown cũ
 */
function parseLegacyMarkdownBroadcast(text: string): ChatBroadcastData {
  const lines = text.split("\n");

  const findHeaderLineIdx = (keywords: string[]) => {
    let charOffset = 0;
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.startsWith("#")) {
        for (const kw of keywords) {
          if (trimmed.includes(kw.toLowerCase())) {
            return charOffset;
          }
        }
      }
      charOffset += line.length + 1;
    }
    return -1;
  };

  const shopeeIdx = findHeaderLineIdx(["shopee chat broadcast", "kịch bản shopee", "shopee"]);
  const zaloIdx = findHeaderLineIdx(["zalo oa", "kịch bản zalo", "zalo cá nhân", "zalo"]);
  const adviceIdx = findHeaderLineIdx(["lời khuyên", "khung giờ vàng", "lưu ý", "chuyên gia"]);

  const sections = [
    { type: "shopee", idx: shopeeIdx },
    { type: "zalo", idx: zaloIdx },
    { type: "advice", idx: adviceIdx },
  ]
    .filter((s) => s.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  let shopeeRaw = "";
  let zaloRaw = "";
  let adviceRaw = "";

  for (let i = 0; i < sections.length; i++) {
    const cur = sections[i];
    const nextIdx = i < sections.length - 1 ? sections[i + 1].idx : text.length;
    const content = text.slice(cur.idx, nextIdx).trim();
    if (cur.type === "shopee") shopeeRaw = content;
    if (cur.type === "zalo") zaloRaw = content;
    if (cur.type === "advice") adviceRaw = content;
  }

  const parseVariants = (raw: string) => {
    if (!raw) return [];
    const withoutHeader = raw.replace(/^##[^\n]*\n?/i, "").trim();
    const parts = withoutHeader.split(/(?=###\s+)/i);
    const items: Array<{ sampleNumber: string; angle: string; content: string }> = [];
    let count = 1;

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed || !trimmed.startsWith("###")) continue;

      const firstLineEnd = trimmed.indexOf("\n");
      const titleLine = firstLineEnd !== -1 ? trimmed.slice(0, firstLineEnd) : trimmed;
      const body = firstLineEnd !== -1 ? trimmed.slice(firstLineEnd).trim() : "";

      const cleanTitle = titleLine.replace(/^###\s*/, "").replace(/[:：]\s*$/, "").trim();
      const parenMatch = cleanTitle.match(/(.*?)\((.*?)\)/);
      const sampleNumber = parenMatch ? parenMatch[1].trim() : `Mẫu ${count++}`;
      const angle = parenMatch ? parenMatch[2].trim() : "Trực diện & Chuyển đổi";

      let cleanContent = body.trim().replace(/^\*\*/, "").replace(/\*\*$/, "").trim();
      if (cleanContent) {
        items.push({ sampleNumber, angle, content: cleanContent });
      }
    }
    return items;
  };

  const shopeeParsed = parseVariants(shopeeRaw);
  const zaloParsed = parseVariants(zaloRaw);

  const shopeeMessages: ShopeeBroadcastMessage[] = shopeeParsed.map((item, idx) => ({
    id: `shopee-${idx + 1}`,
    sampleNumber: item.sampleNumber,
    angle: item.angle,
    targetAudience: "Khách hàng quan tâm sản phẩm",
    notificationHook: item.content.slice(0, 45) + "...",
    content: item.content,
    callToAction: "👉 Bấm lưu voucher & mua ngay",
    charCount: item.content.length,
    isSafeLength: item.content.length <= 350,
  }));

  const zaloMessages: ZaloMessageItem[] = zaloParsed.map((item, idx) => ({
    id: `zalo-${idx + 1}`,
    sampleNumber: item.sampleNumber,
    angle: item.angle,
    greeting: "Dạ em chào Anh/Chị ạ!",
    bodyContent: item.content,
    giftOffer: "Voucher giảm giá độc quyền dành cho khách thân thiết",
    callToAction: "Anh/Chị nhắn lại shop để nhận ưu đãi nhé ạ!",
    fullContent: item.content,
    charCount: item.content.length,
  }));

  // Parse advice bullets
  const adviceBullets: string[] = [];
  if (adviceRaw) {
    const adviceLines = adviceRaw.split("\n");
    for (const l of adviceLines) {
      const trimmed = l.trim();
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const bulletText = trimmed.replace(/^[-*]\s*/, "").trim();
        if (bulletText) adviceBullets.push(bulletText);
      }
    }
  }

  return {
    channel: "both",
    shopeeMessages: shopeeMessages.length > 0 ? shopeeMessages : SAMPLE_BROADCAST_DATA.shopeeMessages,
    zaloMessages: zaloMessages.length > 0 ? zaloMessages : SAMPLE_BROADCAST_DATA.zaloMessages,
    strategy: {
      goldenHours: SAMPLE_BROADCAST_DATA.strategy.goldenHours,
      frequencyRules: adviceBullets.length > 0 ? adviceBullets : SAMPLE_BROADCAST_DATA.strategy.frequencyRules,
      antiSpamChecklist: SAMPLE_BROADCAST_DATA.strategy.antiSpamChecklist,
      segmentationTips: SAMPLE_BROADCAST_DATA.strategy.segmentationTips,
    },
  };
}

/**
 * Format dữ liệu thành văn bản Markdown chuẩn đẹp mắt, không dính ký tự JSON
 */
export function formatChatBroadcastMarkdownText(data: ChatBroadcastData): string {
  const parts: string[] = [];

  // 1. SHOPEE BROADCAST
  if (data.shopeeMessages && data.shopeeMessages.length > 0) {
    parts.push("## 💬 KỊCH BẢN SHOPEE CHAT BROADCAST (TỐI ƯU GIAO DIỆN CHAT SÀN < 350 KÝ TỰ)\n");
    data.shopeeMessages.forEach((item) => {
      parts.push(`### ${item.sampleNumber} (${item.angle}):`);
      parts.push(`🔔 **Thông báo đẩy (Notification Hook)**: ${item.notificationHook}`);
      parts.push(`🎯 **Tệp khách mục tiêu**: ${item.targetAudience}`);
      parts.push(`📝 **Nội dung tin nhắn** (${item.charCount} ký tự${item.isSafeLength ? " - ✓ Chuẩn sàn" : " - ⚠️ Vượt 350 kt"}):`);
      parts.push(item.content);
      parts.push(`🔘 **Nút hành động (CTA)**: ${item.callToAction}\n`);
    });
  }

  // 2. ZALO OA & CSKH 1:1
  if (data.zaloMessages && data.zaloMessages.length > 0) {
    parts.push("## 📱 KỊCH BẢN ZALO OA & ZALO CÁ NHÂN (CHĂM SÓC KHÁCH HÀNG THÂN THIẾT)\n");
    data.zaloMessages.forEach((item) => {
      parts.push(`### ${item.sampleNumber} (${item.angle}):`);
      parts.push(item.fullContent);
      parts.push("");
    });
  }

  // 3. CHIẾN LƯỢC & KHUNG GIỜ VÀNG
  if (data.strategy) {
    parts.push("## 💡 LỜI KHUYÊN & CHIẾN LƯỢC GỬI TIN HIỆU QUẢ TỪ CHUYÊN GIA CRM\n");
    parts.push("### ⏰ Khung Giờ Vàng Gửi Tin:");
    parts.push(`- **Shopee Broadcast**: ${data.strategy.goldenHours?.shopee || "11h30 - 13h00 & 19h30 - 21h00"}`);
    parts.push(`- **Zalo OA**: ${data.strategy.goldenHours?.zalo || "09h00 - 10h30 & 14h30 - 16h00"}`);
    parts.push(`- **Thời điểm tốt nhất**: ${data.strategy.goldenHours?.bestDays || "Thứ 5, Thứ 6 & Ngày Mega Sale"}\n`);

    if (data.strategy.frequencyRules && data.strategy.frequencyRules.length > 0) {
      parts.push("### 🛡️ Tần Suất Gửi Tin An Toàn:");
      data.strategy.frequencyRules.forEach((rule) => {
        parts.push(`- ${rule}`);
      });
      parts.push("");
    }

    if (data.strategy.antiSpamChecklist && data.strategy.antiSpamChecklist.length > 0) {
      parts.push("### 🚫 Checklist Tránh Bị Sàn Khóa Tính Năng Broadcast:");
      data.strategy.antiSpamChecklist.forEach((item) => {
        parts.push(`- ${item}`);
      });
      parts.push("");
    }

    if (data.strategy.segmentationTips) {
      parts.push(`### 🎯 Mẹo Lọc Tệp Khách Hàng:`);
      parts.push(`- ${data.strategy.segmentationTips}\n`);
    }
  }

  return parts.join("\n").trim();
}
