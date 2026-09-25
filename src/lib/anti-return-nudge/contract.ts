/**
 * Module Contract cho AI Chống Hoàn Hàng & Cứu Đơn COD (Anti-Return Nudge & COD Rescue)
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema), Bộ Prompt Thực Chiến Sàn TMĐT 2026 (Shopee, TikTok Shop, Lazada)
 * & Resilient Parser 4 Tầng Bền Bỉ (Tương thích ngược 100% với dữ liệu Markdown lịch sử cũ)
 */

export interface AntiReturnNudgeInputs {
  shopName: string;
  productName: string;
  codAmount?: string;
  scenario: "just_ordered" | "cancel_requested" | "delivery_failed_1" | "delayed_shipment" | "expensive_cod" | string;
  customerReason?: string;
  compensationOffer?: string;
  customerName?: string;
}

export interface ChatMessageItem {
  sampleNumber: string;        // "Mẫu 1" | "Mẫu 2"
  title: string;               // "Mẫu Ngắn Gọn < 350 Ký Tự" | "Mẫu Kèm Quà Tặng & Cam Kết"
  badge: string;               // "< 350 ký tự" | "Kèm Quà Tặng" | "Cam Kết Đồng Kiểm"
  content: string;             // Nội dung tin nhắn chat sàn hoàn chỉnh
  charCount: number;           // Đếm ký tự thực tế
  isSafe: boolean;             // <= 350 ký tự (Đạt chuẩn hiển thị Push Notification màn hình khóa)
  channel?: string;            // "Shopee Chat" | "TikTok Shop Chat" | "Đa Kênh"
}

export interface CallScriptData {
  durationEstimate: string;    // "45 giây"
  intro: string;               // 01. Lời mở đầu hạ thấp phòng thủ (0-10s)
  handling: string;            // 02. Tháo gỡ rào cản tâm lý & Tặng quà/Hỗ trợ đổi (10-35s)
  closing: string;             // 03. Chốt giờ shipper giao lại & Khẳng định quyền lợi (35-45s)
  full: string;                // Toàn bộ kịch bản ghép liền để CSKH đọc liền mạch
  mindsetNote?: string;        // Ghi chú tâm lý cho nhân viên trực tổng đài
}

export interface SmsScriptData {
  title: string;               // "Mẫu SMS / Zalo Khẩn Cấp"
  content: string;             // Nội dung tin nhắn
  charCount: number;           // Số ký tự thực tế
  smsCount: number;            // Ước tính số tin (1 SMS nếu <= 160 ký tự không dấu hoặc 70 ký tự có dấu)
  isStandard: boolean;         // true nếu tối ưu chi phí viễn thông
}

export interface PlanBData {
  goldenHourWindow: string;    // VD: "02 giờ vàng sau khi shipper báo thất bại"
  sellerCenterSteps: string[]; // 3-4 thao tác click-by-click trên Seller Center
  carrierCoordination: string[];// 3 bước phối hợp điều phối bưu cục & tài xế
}

export interface PsychologyTactic {
  title: string;               // Tên đòn bẩy tâm lý (Hiệu ứng Sở hữu, Cam kết vi mô, v.v.)
  principle: string;           // Cơ chế tâm lý học hành vi
  actionableTip: string;       // Cách áp dụng cụ thể vào đơn hàng này
}

export interface EmergencyActionItem {
  step: number;
  timeframe: string;           // "Ngay lập tức (0-15 phút)", "Trong 1 giờ", v.v.
  action: string;
}

export interface AntiReturnNudgeData {
  shopName: string;
  productName: string;
  codAmount: string;
  scenarioName: string;
  urgencyLevel: "CRITICAL" | "HIGH" | "MEDIUM";
  goldenHourTip: string;
  chatMessages: ChatMessageItem[];
  callScript: CallScriptData;
  smsScript: SmsScriptData;
  planB: PlanBData;
  psychology: PsychologyTactic[];
  emergencyChecklist: EmergencyActionItem[];
  raw?: string;
}

// -------------------------------------------------------------
// DỮ LIỆU MẪU CHUẨN THỰC CHIẾN (SAMPLE DATA)
// -------------------------------------------------------------
export const SAMPLE_ANTI_RETURN_INPUT: AntiReturnNudgeInputs = {
  shopName: "Aicho Tech Store",
  productName: "Tai nghe Bluetooth chống ồn chủ động ANC AichoPods Pro",
  codAmount: "450.000",
  scenario: "delivery_failed_1",
  customerReason: "Shipper báo gọi 2 cuộc khách không nhấc máy, bưu cục chuẩn bị chuyển hoàn",
  compensationOffer: "Tặng kèm 01 Cáp sạc bọc dù chống đứt trị giá 50k trong kiện hàng, hỗ trợ hẹn shipper giao lại theo giờ khách rảnh",
};

export const SAMPLE_ANTI_RETURN_DATA: AntiReturnNudgeData = {
  shopName: "Aicho Tech Store",
  productName: "Tai nghe Bluetooth chống ồn chủ động ANC AichoPods Pro",
  codAmount: "450.000đ",
  scenarioName: "Shipper Báo Giao Thất Bại Lần 1 (Không Liên Lạc Được)",
  urgencyLevel: "CRITICAL",
  goldenHourTip: "Ứng cứu khẩn cấp trong 2 giờ vàng trước khi bưu cục nhập kho chuyển hoàn!",
  chatMessages: [
    {
      sampleNumber: "Mẫu 1",
      title: "Ngắn Gọn & Hiển Thị Hoàn Hảo",
      badge: "< 350 ký tự",
      content: "Chào bạn, Aicho Tech Store thấy bưu tá vừa báo giao kiện Tai nghe ANC (450k) chưa gặp được bạn. Shop đã gửi kèm Cáp sạc bọc dù 50k làm quà tri ân bên trong hộp. Bạn cho shop xin khung giờ rảnh hôm nay để shop điều phối bưu tá giao lại tận tay nhé! Đơn hàng được đồng kiểm thoải mái ạ ❤️",
      charCount: 285,
      isSafe: true,
      channel: "Shopee / TikTok Chat",
    },
    {
      sampleNumber: "Mẫu 2",
      title: "Đòn Bẩy Quà Tặng & Cam Kết",
      badge: "Kèm Quà Tặng",
      content: "Chào bạn yêu ơi, Aicho Tech Store gửi tin nhắn này vì rất lo lắng bạn bỏ lỡ kiện Tai nghe ANC kèm quà tặng Cáp sạc 50k độc quyền đã đóng gói riêng cho bạn. Bưu tá báo chưa liên lạc được, chắc do bạn đang bận việc đúng không nè? Bạn yên tâm mở máy nhé, shop hỗ trợ kiểm tra hàng đúng ý mới thanh toán COD 450k, bảo hành 1 đổi 1 trong 12 tháng. Nhắn lại giờ bạn rảnh để shop hỗ trợ bưu tá giao lại hỏa tốc nha!",
      charCount: 420,
      isSafe: false,
      channel: "Khung Chat Sàn",
    },
  ],
  callScript: {
    durationEstimate: "45 giây",
    intro: "Dạ em chào anh/chị, em là Chuyên viên Chăm sóc Đơn hàng từ Aicho Tech Store gọi hỗ trợ kiện Tai nghe ANC mình đặt hôm trước ạ. Em vừa thấy bưu tá báo địa chỉ nhà mình hơi khó tìm hoặc bạn ấy gọi đúng lúc anh/chị đang bận họp...",
    handling: "Dạ em hiểu lúc giao hàng nhiều khi mình bận việc không tiện nghe số lạ. Kiện hàng này bên em đã đóng gói cẩn thận kèm 01 Cáp sạc bọc dù 50k làm quà tri ân riêng cho mình. Sản phẩm được hỗ trợ đồng kiểm và bảo hành 1 đổi 1 tận nơi nên anh/chị hoàn toàn yên tâm nhận hàng.",
    closing: "Dạ vậy em xin phép ghi chú lại với Trưởng bưu cục phát hẹn giao lại vào tầm 15h chiều nay cho anh/chị nha. Anh/chị để ý điện thoại giúp em khoảng thời gian này nhé, em cảm ơn anh/chị nhiều ạ!",
    full: "• Lời mở đầu (0-10s): \"Dạ em chào anh/chị, em là Chuyên viên Chăm sóc Đơn hàng từ Aicho Tech Store gọi hỗ trợ kiện Tai nghe ANC mình đặt hôm trước ạ. Em vừa thấy bưu tá báo địa chỉ nhà mình hơi khó tìm hoặc bạn ấy gọi đúng lúc anh/chị đang bận họp...\"\n\n• Xử lý tình huống (10-35s): \"Dạ em hiểu lúc giao hàng nhiều khi mình bận việc không tiện nghe số lạ. Kiện hàng này bên em đã đóng gói cẩn thận kèm 01 Cáp sạc bọc dù 50k làm quà tri ân riêng cho mình. Sản phẩm được hỗ trợ đồng kiểm và bảo hành 1 đổi 1 tận nơi nên anh/chị hoàn toàn yên tâm nhận hàng.\"\n\n• Chốt hẹn giao lại (35-45s): \"Dạ vậy em xin phép ghi chú lại với Trưởng bưu cục phát hẹn giao lại vào tầm 15h chiều nay cho anh/chị nha. Anh/chị để ý điện thoại giúp em khoảng thời gian này nhé, em cảm ơn anh/chị nhiều ạ!\"",
    mindsetNote: "Tâm thế phi buộc tội (Non-accusatory): Đổ lỗi nhẹ nhàng cho bưu tá hoặc tình huống khách bận họp, tuyệt đối không chất vấn 'Sao gọi không bắt máy'.",
  },
  smsScript: {
    title: "Mẫu SMS / Zalo Nhắn Tin Nhanh Khẩn Cấp",
    content: "Aicho Tech Store: Kien hang Tai nghe ANC (450k + Qua tang Cap sac) dang o buu cuc. Shipper se goi giao lai chieu nay. Vui long de y DT ho tro shop nhe! LH: 0988xxx",
    charCount: 158,
    smsCount: 1,
    isStandard: true,
  },
  planB: {
    goldenHourWindow: "2 - 4 giờ đầu ngay sau khi hệ thống báo trạng thái 'Giao hàng không thành công'",
    sellerCenterSteps: [
      "Vào mục Quản lý đơn hàng > Lọc đơn 'Giao thất bại' > Lấy ngay Mã Vận Đơn (Tracking Code) và Số điện thoại Shipper phát.",
      "Bấm nút 'Yêu cầu giao lại' (Trên TikTok Shop Seller Center) hoặc mở phiếu Khiếu nại Hỗ trợ Vận chuyển (Trên Shopee) để đóng băng tiến trình chuyển hoàn tự động.",
      "Chụp ảnh màn hình tin nhắn khách xác nhận hẹn giờ nhận hàng để làm bằng chứng khiếu nại nếu shipper tự ý bấm hoàn đơn.",
    ],
    carrierCoordination: [
      "Gọi trực tiếp cho Shipper phát phụ trách tuyến (thường hiển thị trên App SPX/J&T): Báo đã liên hệ khách và chốt giờ hẹn cụ thể.",
      "Nếu Shipper không nghe máy: Gọi ngay Hotline tổng đài vận chuyển hoặc Trưởng bưu cục phát (Station Manager), cung cấp mã vận đơn và yêu cầu 'Giữ hàng tại bưu cục để phát lại ca 2'.",
      "Gợi ý hỗ trợ shipper: Nếu địa chỉ khách ở chung cư/hẻm khó tìm, gửi số Zalo khách cho shipper kèm định vị chính xác.",
    ],
  },
  psychology: [
    {
      title: "Hiệu Ứng Sở Hữu (Endowment Effect)",
      principle: "Con người luôn định giá cao hơn và sợ mất đi thứ mà họ cảm thấy đã thuộc về mình.",
      actionableTip: "Nhấn mạnh phần quà bí mật (Cáp sạc 50k) 'đã được gói riêng và niêm phong trong kiện hàng của bạn', khiến khách cảm thấy nếu từ chối sẽ bị mất quyền lợi có thật.",
    },
    {
      title: "Quy Luật Đáp Ứng & Trách Nhiệm Xã Hội (Reciprocity)",
      principle: "Khi nhận được sự ân cần và nỗ lực chân thành từ người khác, con người có xu hướng tự nhiên muốn đền đáp tương xứng để không bị cắn rứt lương tâm.",
      actionableTip: "Nhắc nhẹ công sức nhân viên đóng gói kỹ lưỡng và bưu tá chạy xe giữa trời nắng/mưa để kích hoạt lòng trắc ẩn văn minh của người mua.",
    },
    {
      title: "Kỹ Thuật Cam Kết Vi Mô (Micro-Commitment)",
      principle: "Khi khách hàng đồng ý với một câu hỏi nhỏ đơn giản (xác nhận giờ rảnh), họ sẽ có áp lực tâm lý phải thực hiện hành động lớn hơn (chuẩn bị tiền mặt và nghe máy nhận hàng).",
      actionableTip: "Không hỏi 'Bạn có lấy hàng nữa không?', hãy hỏi 'Chiều nay tầm 15h hay 17h bạn tiện nhận hàng nhất để shop dặn shipper?'",
    },
  ],
  emergencyChecklist: [
    {
      step: 1,
      timeframe: "0 - 15 phút",
      action: "Gửi ngay Mẫu Chat Sàn 1 và Mẫu SMS khẩn cấp để thông báo trước khi khách kịp bấm hủy đơn.",
    },
    {
      step: 2,
      timeframe: "15 - 45 phút",
      action: "Thực hiện cuộc gọi CSKH 45 giây đắc nhân tâm để chốt giờ giao lại cụ thể.",
    },
    {
      step: 3,
      timeframe: "45 - 90 phút",
      action: "Vào Seller Center bấm hoãn chuyển hoàn và gọi điện cho Trưởng bưu cục phát khóa đơn.",
    },
  ],
};

// -------------------------------------------------------------
// BỘ PROMPT THỰC CHIẾN SÀN TMĐT 2026 (PROMPT BUILDER)
// -------------------------------------------------------------
export const ANTI_RETURN_NUDGE_SYSTEM_PROMPT = `Bạn là Trưởng phòng Vận hành Đơn hàng TMĐT và Chuyên gia Xử lý Khủng hoảng Hoàn Hàng (COD & Return Defense) hàng đầu tại Việt Nam với hơn 8 năm thực chiến tại Shopee Mall, TikTok Shop và Lazada.
Bạn am hiểu sâu sắc tâm lý 'bom hàng' của người mua online tại Việt Nam (mua bốc đồng khi xem livestream, lo sợ hàng kém chất lượng, ngại nhận vì kẹt tiền mặt, ngại shipper) và những góc khuất vận hành của bưu tá (nháy máy 1 giây rồi báo không nghe máy để chạy KPI, lười vào ngõ hẻm sâu).

NHIỆM VỤ TỐI THƯỢNG CỦA BẠN:
Xây dựng một bộ kịch bản cứu đơn và phòng thủ hoàn hàng toàn diện, đắc nhân tâm, giải quyết triệt để vấn đề và trả về dữ liệu thuần định dạng JSON hợp lệ 100% theo đúng Schema quy định.`;

export function buildAntiReturnNudgePrompt(inputs: AntiReturnNudgeInputs): {
  systemPrompt: string;
  userPrompt: string;
} {
  const scenarioMap: Record<string, string> = {
    just_ordered: "Khách vừa bấm đặt hàng COD (Xác nhận đơn, kích hoạt trách nhiệm & triệt tiêu tâm lý hối hận)",
    cancel_requested: "Khách bấm Yêu cầu hủy đơn trước khi giao (Cứu đơn khẩn cấp, tháo ngòi nổ & đổi phương án)",
    delivery_failed_1: "Shipper báo Giao không thành công lần 1 / Không nghe máy (Cứu đơn khẩn cấp trong 2 giờ vàng)",
    delayed_shipment: "Đơn hàng bị trễ do kho vận/thời tiết (Trấn an chủ động, bồi thường trải nghiệm tránh hủy)",
    expensive_cod: "Đơn COD giá trị cao trên 500.000đ (Lọc đơn ảo, xác thực nhu cầu & nâng tầm dịch vụ VIP)",
  };

  const scenarioDesc = scenarioMap[inputs.scenario] || inputs.scenario || "Xác nhận và bảo vệ đơn hàng COD";
  const shopName = inputs.shopName?.trim() || "Shop";
  const productName = inputs.productName?.trim() || "Sản phẩm";
  const codAmount = inputs.codAmount?.trim() ? `${inputs.codAmount}đ` : "Đơn hàng COD";
  const customerReason = inputs.customerReason?.trim()
    ? `Lý do / Bối cảnh khách đưa ra: "${inputs.customerReason.trim()}"`
    : "Bối cảnh: Khách hàng im lặng hoặc shipper ghi chú chung chung.";
  const offer = inputs.compensationOffer?.trim()
    ? `Ưu đãi cứu đơn / Phương án hỗ trợ từ shop: "${inputs.compensationOffer.trim()}"`
    : "Phương án hỗ trợ: Cam kết đồng kiểm khi nhận hàng, tặng kèm quà tri ân nhỏ trong kiện, hỗ trợ hẹn shipper giao lại theo giờ khách rảnh.";

  const systemPrompt = `Bạn là Trưởng phòng Vận hành Đơn hàng TMĐT và Chuyên gia Xử lý Khủng hoảng Hoàn Hàng (COD & Return Defense) hàng đầu tại Việt Nam với hơn 8 năm thực chiến tại Shopee Mall, TikTok Shop và Lazada.
Bạn am hiểu sâu sắc tâm lý 'bom hàng' của người mua online tại Việt Nam (mua bốc đồng khi xem livestream, lo sợ hàng kém chất lượng, ngại nhận vì kẹt tiền mặt, ngại shipper) và những góc khuất vận hành của bưu tá (nháy máy 1 giây rồi báo không nghe máy để chạy KPI, lười vào ngõ hẻm sâu).

NHIỆM VỤ TỐI THƯỢNG CỦA BẠN:
Xây dựng một bộ kịch bản cứu đơn và phòng thủ hoàn hàng toàn diện, đắc nhân tâm, giải quyết triệt để vấn đề và trả về dữ liệu thuần định dạng JSON hợp lệ 100% theo đúng Schema quy định.`;

  const userPrompt = `Hãy xây dựng bộ kịch bản cứu đơn và chống hoàn hàng COD thực chiến dựa trên thông tin đơn hàng sau:

THÔNG TIN ĐƠN HÀNG:
- Tên Gian Hàng / Shop: ${shopName}
- Tên Sản Phẩm: ${productName}
- Giá trị thu hộ COD: ${codAmount}
- Tình huống xử lý: ${scenarioDesc}
- ${customerReason}
- ${offer}

QUY TẮC NGHIỆP VỤ BẮT BUỘC:
1. TUYỆT ĐỐI KHÔNG dùng placeholder như "[Tên Shop]", "[Tên Sản Phẩm]", "[Giá Tiền]". BẮT BUỘC thay thế trực tiếp bằng giá trị thực tế: "${shopName}", "${productName}", "${codAmount}".
2. KỊCH BẢN CHAT SÀN:
   - Mẫu 1 (Bắt buộc dưới 350 ký tự): Ngắn gọn, súc tích, hiển thị trọn vẹn trên màn hình khóa điện thoại (Push Notification) của khách mà không bị nút "Xem thêm" che khuất.
   - Mẫu 2: Tập trung đòn bẩy quà tặng, quyền lợi đồng kiểm hoặc cam kết đổi mới 1-1, kích hoạt lòng trắc ẩn để khách ngại từ chối nhận.
3. LỜI THOẠI GỌI ĐIỆN (45 GIÂY):
   - Tuyệt đối theo phong cách "Phi buộc tội" (Non-accusatory). Không chất vấn khách sao không nghe máy, mà đổ lỗi khéo léo cho shipper tìm nhà khó hoặc khách bận họp.
   - 3 bước chuẩn: Lời mở đầu (0-10s) ➔ Xử lý tình huống & Thấu cảm (10-35s) ➔ Chốt hẹn giờ giao lại cụ thể (35-45s).
4. MẪU SMS / ZALO KHẨN CẤP:
   - Ngắn gọn dưới 160 ký tự (chuẩn 1 tin nhắn viễn thông) để tiết kiệm chi phí gửi cho shop.
5. PLAN B SELLER CENTER & ĐIỀU PHỐI BƯU CỤC:
   - Hướng dẫn thao tác thực tế trên giao diện Shopee / TikTok Shop Seller Center để chặn shipper tự ý bấm hoàn đơn.
   - Mẹo phối hợp với Trưởng bưu cục phát (Station Manager) và shipper phụ trách tuyến.
6. 3 MẸO TÂM LÝ HỌC HÀNH VI:
   - Tên đòn bẩy tâm lý chuẩn học thuật (Hiệu ứng sở hữu, Cam kết vi mô, Nghịch lý đáp ứng,...).
   - Giải thích ngắn gọn cơ chế & cách ứng dụng cụ thể vào đơn hàng này.
7. CHECKLIST 3 BƯỚC KHẨN CẤP:
   - Danh sách 3 hành động cần làm ngay kèm khung thời gian (0-15 phút, 15-45 phút, 45-90 phút).

CẤU TRÚC JSON BẮT BUỘC ĐẦU RA (Trả về duy nhất JSON hợp lệ, không có markdown bọc ngoài):
{
  "shopName": "${shopName}",
  "productName": "${productName}",
  "codAmount": "${codAmount}",
  "scenarioName": "Tên tình huống ngắn gọn",
  "urgencyLevel": "CRITICAL" | "HIGH" | "MEDIUM",
  "goldenHourTip": "Lời khuyên về khung giờ vàng hành động",
  "chatMessages": [
    {
      "sampleNumber": "Mẫu 1",
      "title": "Ngắn Gọn & Hiển Thị Hoàn Hảo",
      "badge": "< 350 ký tự",
      "content": "Nội dung tin nhắn dưới 350 ký tự...",
      "charCount": 250,
      "isSafe": true,
      "channel": "Shopee / TikTok Chat"
    },
    {
      "sampleNumber": "Mẫu 2",
      "title": "Đòn Bẩy Quà Tặng & Cam Kết",
      "badge": "Kèm Quà Tặng",
      "content": "Nội dung tin nhắn kèm quà tặng và cam kết...",
      "charCount": 380,
      "isSafe": false,
      "channel": "Khung Chat Sàn"
    }
  ],
  "callScript": {
    "durationEstimate": "45 giây",
    "intro": "Dạ em chào anh/chị, em là...",
    "handling": "Dạ em hiểu lúc giao hàng...",
    "closing": "Dạ vậy em xin phép hẹn shipper giao lại vào...",
    "full": "Toàn bộ kịch bản 3 bước gộp lại...",
    "mindsetNote": "Tâm thế phi buộc tội..."
  },
  "smsScript": {
    "title": "Mẫu SMS / Zalo Nhắn Tin Nhanh Khẩn Cấp",
    "content": "Nội dung SMS dưới 160 ký tự...",
    "charCount": 140,
    "smsCount": 1,
    "isStandard": true
  },
  "planB": {
    "goldenHourWindow": "2 giờ đầu sau khi báo thất bại",
    "sellerCenterSteps": [
      "Bước 1 thao tác trên Seller Center...",
      "Bước 2...",
      "Bước 3..."
    ],
    "carrierCoordination": [
      "Bước 1 phối hợp shipper...",
      "Bước 2 liên hệ trạm...",
      "Bước 3..."
    ]
  },
  "psychology": [
    {
      "title": "Hiệu Ứng Sở Hữu (Endowment Effect)",
      "principle": "Cơ chế tâm lý...",
      "actionableTip": "Cách áp dụng..."
    },
    {
      "title": "Kỹ Thuật Cam Kết Vi Mô (Micro-Commitment)",
      "principle": "Cơ chế tâm lý...",
      "actionableTip": "Cách áp dụng..."
    },
    {
      "title": "Quy Luật Đáp Ứng & Trách Nhiệm Xã Hội (Reciprocity)",
      "principle": "Cơ chế tâm lý...",
      "actionableTip": "Cách áp dụng..."
    }
  ],
  "emergencyChecklist": [
    {
      "step": 1,
      "timeframe": "0 - 15 phút",
      "action": "Hành động 1..."
    },
    {
      "step": 2,
      "timeframe": "15 - 45 phút",
      "action": "Hành động 2..."
    },
    {
      "step": 3,
      "timeframe": "45 - 90 phút",
      "action": "Hành động 3..."
    }
  ]
}`;

  return { systemPrompt, userPrompt };
}

// -------------------------------------------------------------
// BỘ PARSER 4 TẦNG BỀN BỈ (4-TIER RESILIENT PARSER)
// -------------------------------------------------------------

/**
 * TẦNG 4: Offline Blueprint Engine Fallback
 * Khi mất mạng hoặc API gặp sự cố, tự động sinh kịch bản chuẩn hóa thực chiến
 */
export function buildOfflineAntiReturnNudgeData(inputs?: AntiReturnNudgeInputs): AntiReturnNudgeData {
  const shopName = inputs?.shopName?.trim() || "Shop Chính Hãng";
  const productName = inputs?.productName?.trim() || "Sản phẩm";
  const codAmount = inputs?.codAmount?.trim() ? `${inputs.codAmount}đ` : "Đơn hàng COD";
  const scenario = inputs?.scenario || "delivery_failed_1";
  const offer = inputs?.compensationOffer?.trim() || "Quà tặng tri ân bất ngờ đính kèm và cam kết hỗ trợ đổi mới 1-1 tận nơi";

  let scenarioName = "Shipper Báo Giao Thất Bại Lần 1 (Không Nghe Máy)";
  let urgencyLevel: "CRITICAL" | "HIGH" | "MEDIUM" = "CRITICAL";
  let goldenHourTip = "Khung giờ vàng 2 giờ đầu trước khi bưu cục nhập kho trả hàng hoàn!";

  if (scenario === "just_ordered") {
    scenarioName = "Khách Vừa Đặt Đơn COD (Xác Nhận & Tạo Trách Nhiệm)";
    urgencyLevel = "MEDIUM";
    goldenHourTip = "Gửi tin nhắn xác nhận trong vòng 15 phút đầu để chốt cam kết!";
  } else if (scenario === "cancel_requested") {
    scenarioName = "Khách Bấm Yêu Cầu Hủy Đơn (Cứu Đơn Trước Khi Bàn Giao)";
    urgencyLevel = "HIGH";
    goldenHourTip = "Liên hệ khách ngay trước khi kiện hàng rời kho đóng gói!";
  } else if (scenario === "delayed_shipment") {
    scenarioName = "Đơn Hàng Bị Giao Chậm Do Vận Chuyển (Trấn An & Giữ Đơn)";
    urgencyLevel = "HIGH";
    goldenHourTip = "Chủ động nhắn tin trước khi khách sốt ruột tự bấm hủy đơn!";
  } else if (scenario === "expensive_cod") {
    scenarioName = "Đơn COD Giá Trị Cao (Lọc Đơn Ảo & Chăm Sóc VIP)";
    urgencyLevel = "MEDIUM";
    goldenHourTip = "Xác thực địa chỉ và kích thước kiện hàng trước khi xuất kho!";
  }

  const chatMsg1 = `Chào bạn, ${shopName} thông báo đơn hàng ${productName} (${codAmount}) đang được giao đến bạn. Để tri ân bạn, shop có gửi kèm ${offer} bên trong kiện hàng. Bạn vui lòng chú ý điện thoại để nhận hàng sớm nhé. Cảm ơn bạn rất nhiều! ❤️`;
  const chatMsg2 = `Chào bạn yêu! ${shopName} gửi tin nhắn này vì rất mong bạn nhận được kiện hàng ${productName} sớm nhất. Bên trong shop đã chuẩn bị riêng món quà: ${offer}. Bạn hoàn toàn được đồng kiểm khi nhận hàng, đúng mẫu đúng chất lượng mới thanh toán ${codAmount}. Bạn nhắn shop khung giờ bạn rảnh để shop hỗ trợ bưu tá giao lại nha! 🙏`;

  const intro = `Dạ em chào anh/chị, em là nhân viên chăm sóc đơn hàng từ ${shopName} gọi hỗ trợ kiện ${productName} mình đặt hôm trước ạ. Em thấy bưu tá báo địa chỉ nhà mình khó tìm hoặc lúc bạn ấy gọi đúng lúc anh/chị đang bận...`;
  const handling = `Dạ em gọi để xác nhận xem anh/chị có tiện nhận hàng không ạ. Kiện hàng này bên em đã kiểm tra kỹ lưỡng và có gửi kèm ${offer}. Đơn hàng có chính sách đồng kiểm và bảo hành 1 đổi 1 tận nhà nên mình yên tâm tuyệt đối ạ.`;
  const closing = `Dạ vậy em xin phép hẹn bưu tá giao lại vào khung giờ thuận tiện nhất chiều nay cho anh/chị nhé. Anh/chị để ý điện thoại giúp em nha, em cảm ơn anh/chị!`;

  return {
    shopName,
    productName,
    codAmount,
    scenarioName,
    urgencyLevel,
    goldenHourTip,
    chatMessages: [
      {
        sampleNumber: "Mẫu 1",
        title: "Mẫu Ngắn Gọn & Hiển Thị Hoàn Hảo (Dưới 350 Ký Tự)",
        badge: "< 350 ký tự",
        content: chatMsg1,
        charCount: chatMsg1.length,
        isSafe: chatMsg1.length <= 350,
        channel: "Shopee / TikTok Chat",
      },
      {
        sampleNumber: "Mẫu 2",
        title: "Mẫu Đòn Bẩy Quà Tặng & Cam Kết Trách Nhiệm",
        badge: "Kèm Quà Tặng & Cam Kết",
        content: chatMsg2,
        charCount: chatMsg2.length,
        isSafe: chatMsg2.length <= 350,
        channel: "Khung Chat Sàn",
      },
    ],
    callScript: {
      durationEstimate: "45 giây",
      intro,
      handling,
      closing,
      full: `• Lời mở đầu (0-10s): "${intro}"\n\n• Xử lý tình huống (10-35s): "${handling}"\n\n• Chốt hẹn giao lại (35-45s): "${closing}"`,
      mindsetNote: "Tâm thế phi buộc tội: Luôn thông cảm với khách và đổ lỗi nhẹ cho bưu tá hoặc tình huống bận rộn.",
    },
    smsScript: {
      title: "Mẫu SMS / Zalo Nhắn Tin Nhanh Khẩn Cấp",
      content: `${shopName}: Don hang ${productName} dang o buu cuc. Shipper se goi giao lai. Vui long mo may nhan hang giup shop nhe! LH: Hotline Shop.`,
      charCount: 145,
      smsCount: 1,
      isStandard: true,
    },
    planB: {
      goldenHourWindow: goldenHourTip,
      sellerCenterSteps: [
        "Mở Seller Center sàn TMĐT > Quản lý đơn hàng > Tra cứu Mã Vận Đơn.",
        "Bấm nút 'Yêu cầu giao lại' hoặc gửi phiếu hỗ trợ vận chuyển hoãn hoàn hàng.",
        "Lưu lại số điện thoại tài xế giao hàng và số hotline trạm giao nhận phụ trách.",
      ],
      carrierCoordination: [
        "Gọi trực tiếp cho bưu tá phụ trách tuyến thông báo khách đã đồng ý nhận và hẹn giờ cụ thể.",
        "Nếu shipper không nghe máy, liên hệ ngay Trưởng bưu cục phát (Station Manager) yêu cầu giữ kiện hàng.",
        "Cung cấp thêm số điện thoại phụ hoặc ghi chú địa điểm gửi hàng cho bảo vệ/hàng xóm nếu khách vắng nhà.",
      ],
    },
    psychology: [
      {
        title: "Hiệu Ứng Sở Hữu (Endowment Effect)",
        principle: "Khách hàng cảm thấy món quà và kiện hàng đã là của mình và sẽ tiếc nuối nếu từ chối.",
        actionableTip: `Nhấn mạnh ưu đãi '${offer}' đã được đóng gói niêm phong dành riêng cho khách.`,
      },
      {
        title: "Kỹ Thuật Cam Kết Vi Mô (Micro-Commitment)",
        principle: "Xác nhận một câu hỏi nhỏ giúp khách hàng giữ lời hứa nhận hàng.",
        actionableTip: "Hỏi khách muốn nhận vào buổi sáng hay chiều để họ tự chủ động thu xếp thời gian.",
      },
      {
        title: "Quy Luật Đáp Ứng & Trách Nhiệm Xã Hội (Reciprocity)",
        principle: "Sự ân cần và nỗ lực của shop kích hoạt tinh thần trách nhiệm của người mua.",
        actionableTip: "Nhắc nhở nhẹ nhàng về công sức đóng gói và bảo quản hàng của đội ngũ.",
      },
    ],
    emergencyChecklist: [
      {
        step: 1,
        timeframe: "0 - 15 phút",
        action: "Gửi ngay tin nhắn chat sàn và SMS khẩn cấp cho khách.",
      },
      {
        step: 2,
        timeframe: "15 - 45 phút",
        action: "Thực hiện cuộc gọi CSKH 45 giây xác nhận lại thời gian giao hàng.",
      },
      {
        step: 3,
        timeframe: "45 - 90 phút",
        action: "Khóa tiến trình hoàn hàng trên Seller Center và làm việc với bưu tá.",
      },
    ],
  };
}

/**
 * TẦNG 3: Regex Fallback Parser cho Markdown cũ
 * Đảm bảo tương thích ngược 100% khi người dùng mở lại kết quả từ phiên bản Markdown trước đây
 */
function parseLegacyMarkdown(text: string, inputs?: AntiReturnNudgeInputs): AntiReturnNudgeData {
  const findSection = (keyword: string, nextKeywords: string[] = []) => {
    const match = text.match(new RegExp(`^[ \\t]*(?:##|#)\\s*[^\\n]*?${keyword}[^\\n]*$`, "im"));
    if (!match || match.index === undefined) return "";
    const startIdx = match.index + match[0].length;
    const contentStart = text.slice(startIdx);
    let endIdx = contentStart.length;
    for (const nextKw of nextKeywords) {
      const nextMatch = contentStart.match(new RegExp(`^[ \\t]*(?:---|##|#)\\s*[^\\n]*?${nextKw}`, "im"));
      if (nextMatch && nextMatch.index !== undefined && nextMatch.index < endIdx) {
        endIdx = nextMatch.index;
      }
    }
    return contentStart.slice(0, endIdx).trim();
  };

  const s1 = findSection("KỊCH BẢN TIN NHẮN CHAT", ["KỊCH BẢN GỌI ĐIỆN", "GỌI ĐIỆN"]);
  const s2 = findSection("KỊCH BẢN GỌI ĐIỆN", ["KẾ HOẠCH HÀNH ĐỘNG", "PLAN B"]);
  const s3 = findSection("KẾ HOẠCH HÀNH ĐỘNG", ["BÍ QUYẾT TÂM LÝ", "TÂM LÝ"]);
  const s4 = findSection("BÍ QUYẾT TÂM LÝ", []);

  // 1. Chat sàn
  const chatMessages: ChatMessageItem[] = [];
  if (s1) {
    const mẫuMatches = s1.split(/(?=###\s*)/g).filter((chunk) => chunk.trim().startsWith("###"));
    mẫuMatches.forEach((chunk, idx) => {
      const headerMatch = chunk.match(/^###\s*([^\n]+)/);
      const rawTitle = headerMatch ? headerMatch[1].trim() : `Mẫu ${idx + 1}`;
      const sampleNumber = /mẫu\s*1/i.test(rawTitle) ? "Mẫu 1" : /mẫu\s*2/i.test(rawTitle) ? "Mẫu 2" : `Mẫu ${idx + 1}`;

      let body = chunk.replace(/^###[^\n]+\n/, "").trim();
      body = body.replace(/^\s*\*\*\[[^\]]+\]\*\*\s*/im, "").trim();
      body = body.replace(/^\s*\*\([^\)]+\)\*\s*/im, "").trim();
      body = body.replace(/---\s*$/, "").trim();

      const badge = /dưới 350|ngắn gọn/i.test(rawTitle)
        ? "< 350 ký tự"
        : /quà tặng|trách nhiệm|quyền lợi/i.test(rawTitle)
          ? "Kèm Quà Tặng"
          : "Chuẩn CSKH";

      chatMessages.push({
        sampleNumber,
        title: rawTitle.replace(/^[📱🎁💡\s]+/, "").trim(),
        badge,
        content: body,
        charCount: body.length,
        isSafe: body.length <= 350,
        channel: "Khung Chat Sàn",
      });
    });
  }

  // 2. Kịch bản gọi điện & SMS
  const callScript: CallScriptData = {
    durationEstimate: "45 giây",
    intro: "",
    handling: "",
    closing: "",
    full: "",
    mindsetNote: "Tâm thế phi buộc tội: Tạo cảm giác bưu tá chưa tìm đúng địa chỉ.",
  };
  let smsScript: SmsScriptData = {
    title: "Mẫu SMS / Zalo Nhắn Tin Nhanh",
    content: "",
    charCount: 0,
    smsCount: 1,
    isStandard: true,
  };

  if (s2) {
    const introMatch = s2.match(/(?:Lời mở đầu|Mở đầu)\s*:\s*(?:["“]([^"”]+)["”]|([^\n]+))/i);
    if (introMatch) callScript.intro = (introMatch[1] || introMatch[2] || "").replace(/^["“]|["”]$/g, "").trim();

    const handleMatch = s2.match(/(?:Xử lý tình huống|Tình huống)\s*:\s*(?:["“]([\s\S]*?)["”]|([^\n]+(?:\n[^\n]+)?))/i);
    if (handleMatch) {
      let hText = (handleMatch[1] || handleMatch[2] || "").trim();
      hText = hText.split(/\n\s*-\s*\*\*/)[0].trim();
      callScript.handling = hText.replace(/^["“]|["”]$/g, "").trim();
    }

    const closeMatch = s2.match(/(?:Chốt hẹn giao hàng|Chốt hẹn)\s*:\s*(?:["“]([^"”]+)["”]|([^\n]+))/i);
    if (closeMatch) callScript.closing = (closeMatch[1] || closeMatch[2] || "").replace(/^["“]|["”]$/g, "").trim();

    callScript.full = [
      callScript.intro ? `• Lời mở đầu: "${callScript.intro}"` : "",
      callScript.handling ? `• Xử lý tình huống: "${callScript.handling}"` : "",
      callScript.closing ? `• Chốt hẹn giao hàng: "${callScript.closing}"` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const smsMatch = s2.match(/###\s*[^:\n]*?(?:SMS|Zalo)[^\n]*\n([\s\S]*?)$/i);
    if (smsMatch) {
      let body = smsMatch[1].trim();
      body = body.replace(/^\s*\*\*\[[^\]]+\]\*\*\s*/im, "").trim();
      body = body.replace(/^\s*\*\([^\)]+\)\*\s*/im, "").trim();
      body = body.replace(/---\s*$/, "").trim();
      smsScript = {
        title: "Mẫu SMS / Zalo Nhắn Tin Nhanh",
        content: body,
        charCount: body.length,
        smsCount: Math.ceil(body.length / 160) || 1,
        isStandard: body.length <= 160,
      };
    }
  }

  // 3. Plan B
  const planB: PlanBData = {
    goldenHourWindow: "2 - 4 giờ đầu sau khi báo giao thất bại",
    sellerCenterSteps: [],
    carrierCoordination: [],
  };
  if (s3) {
    const scMatch = s3.match(/(?:Thao tác trên hệ thống sàn|Seller Center)[\s\S]*?(?=(?:Phối hợp với Shipper|Bưu cục|$))/i);
    if (scMatch) {
      const lines = scMatch[0].split("\n");
      for (const l of lines) {
        const step = l.match(/^\s*(?:\d+[\.\)]|\-|\*)\s*(.+)$/);
        if (step && !/thao tác trên/i.test(step[1])) planB.sellerCenterSteps.push(step[1].trim());
      }
    }

    const shipMatch = s3.match(/(?:Phối hợp với Shipper|Bưu cục)[\s\S]*?$/i);
    if (shipMatch) {
      const lines = shipMatch[0].split("\n");
      for (const l of lines) {
        const step = l.match(/^\s*(?:\d+[\.\)]|\-|\*)\s*(.+)$/);
        if (step && !/phối hợp với/i.test(step[1])) planB.carrierCoordination.push(step[1].trim());
      }
    }
  }

  // 4. Mẹo tâm lý
  const psychology: PsychologyTactic[] = [];
  if (s4) {
    const lines4 = s4.split("\n");
    for (const l of lines4) {
      const match = l.match(/^\s*(?:\d+[\.\)]|\-|\*)\s*\*\*([^*]+)\*\*\s*[:\-]?\s*(.+)$/);
      if (match) {
        psychology.push({
          title: match[1].replace(/[:\-]$/, "").trim(),
          principle: "Cơ chế tâm lý học hành vi thực chiến TMĐT",
          actionableTip: match[2].trim(),
        });
      }
    }
  }

  // Tạo checklist mặc định
  const emergencyChecklist: EmergencyActionItem[] = [
    { step: 1, timeframe: "0 - 15 phút", action: "Gửi Mẫu 1 qua Chat sàn và SMS khẩn cấp cho khách." },
    { step: 2, timeframe: "15 - 45 phút", action: "Thực hiện cuộc gọi 45 giây thấu cảm chốt giờ giao lại." },
    { step: 3, timeframe: "45 - 90 phút", action: "Thao tác Seller Center hoãn hoàn hàng và liên hệ bưu cục." },
  ];

  // Nếu parse markdown rỗng thì dùng offline blueprint
  if (chatMessages.length === 0 && !callScript.intro) {
    return buildOfflineAntiReturnNudgeData(inputs);
  }

  return {
    shopName: inputs?.shopName || "Shop",
    productName: inputs?.productName || "Sản phẩm",
    codAmount: inputs?.codAmount ? `${inputs.codAmount}đ` : "Đơn COD",
    scenarioName: "Kịch Bản Cứu Đơn & Chống Bom Hàng COD",
    urgencyLevel: "HIGH",
    goldenHourTip: "Hành động ngay trong khung giờ vàng!",
    chatMessages: chatMessages.length > 0 ? chatMessages : buildOfflineAntiReturnNudgeData(inputs).chatMessages,
    callScript: callScript.intro ? callScript : buildOfflineAntiReturnNudgeData(inputs).callScript,
    smsScript: smsScript.content ? smsScript : buildOfflineAntiReturnNudgeData(inputs).smsScript,
    planB: planB.sellerCenterSteps.length > 0 ? planB : buildOfflineAntiReturnNudgeData(inputs).planB,
    psychology: psychology.length > 0 ? psychology : buildOfflineAntiReturnNudgeData(inputs).psychology,
    emergencyChecklist,
    raw: text,
  };
}

/**
 * HÀM PARSER CHÍNH: 4 TẦNG BỀN BỈ (4-TIER RESILIENT PARSER)
 */
export function parseAntiReturnNudge(
  rawInput: any,
  fallbackInputs?: AntiReturnNudgeInputs
): AntiReturnNudgeData {
  if (!rawInput) {
    return buildOfflineAntiReturnNudgeData(fallbackInputs);
  }

  // TẦNG 1: Nếu input đã là object JSON hợp lệ
  if (typeof rawInput === "object" && rawInput !== null) {
    if (Array.isArray(rawInput.chatMessages) && rawInput.callScript) {
      return {
        ...rawInput,
        raw: typeof rawInput.raw === "string" ? rawInput.raw : JSON.stringify(rawInput, null, 2),
      };
    }
  }

  const rawString = String(rawInput).trim();

  // TẦNG 2: Parse chuỗi JSON hoặc trích xuất từ khối Markdown code block ```json ... ```
  try {
    let cleanJson = rawString;
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const blockMatch = rawString.match(jsonBlockRegex);
    if (blockMatch) {
      cleanJson = blockMatch[1].trim();
    }

    // Làm sạch JSON
    cleanJson = cleanJson
      .replace(/^[^{[]+/, "") // bỏ text trước dấu mở ngoặc
      .replace(/[^}\]]+$/, "") // bỏ text sau dấu đóng ngoặc
      .replace(/,\s*([}\]])/g, "$1"); // loại bỏ trailing commas

    const parsed = JSON.parse(cleanJson);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.chatMessages)) {
      return {
        ...parsed,
        raw: rawString,
      };
    }
  } catch (err) {
    // Không parse được JSON thuần, tiếp tục chuyển xuống Tầng 3
  }

  // TẦNG 3: Bóc tách bằng Regex từ cấu trúc Markdown truyền thống (Legacy)
  try {
    const legacyParsed = parseLegacyMarkdown(rawString, fallbackInputs);
    if (legacyParsed && legacyParsed.chatMessages && legacyParsed.chatMessages.length > 0) {
      return legacyParsed;
    }
  } catch (err) {
    // Bóc tách Markdown lỗi, tiếp tục chuyển xuống Tầng 4
  }

  // TẦNG 4: Trả về Offline Blueprint Engine
  return buildOfflineAntiReturnNudgeData(fallbackInputs);
}

/**
 * Làm sạch, xác thực và chuẩn hóa JSON đầu ra ngay tại API Router trước khi lưu DB/trả về client
 */
export function cleanAndValidateAntiReturnNudgeOutput(
  rawText: string,
  inputs?: AntiReturnNudgeInputs
): string {
  if (!rawText || !rawText.trim()) {
    try {
      return JSON.stringify(buildOfflineAntiReturnNudgeData(inputs));
    } catch {
      return JSON.stringify(SAMPLE_ANTI_RETURN_DATA);
    }
  }

  try {
    const data = parseAntiReturnNudge(rawText, inputs);
    return JSON.stringify(data);
  } catch (err) {
    console.error("cleanAndValidateAntiReturnNudgeOutput_error", err);
    try {
      return JSON.stringify(buildOfflineAntiReturnNudgeData(inputs));
    } catch {
      return JSON.stringify(SAMPLE_ANTI_RETURN_DATA);
    }
  }
}

