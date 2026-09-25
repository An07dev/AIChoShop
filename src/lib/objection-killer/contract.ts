/**
 * Module Contract cho "Bẻ Gãy Lời Từ Chối & Trợ Lý Chốt Đơn 1-1" (Objection Killer)
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema)
 * Nâng Cấp Nghiệp Vụ & Bộ Kịch Bản Thực Chiến Sàn TMĐT (Shopee, TikTok Shop, Lazada, Fanpage, Zalo)
 * Giao Diện Dark Mode Tối Giản, Phản Ứng Nhanh, Nút Copy Cùng Hàng Tiêu Đề
 * Kèm Resilient Parser 4 Tầng Bền Bỉ & Offline Blueprint Generator (Zero-Fail).
 */

export interface ObjectionKillerInputs {
  productName: string;
  price?: string;
  customerObjection: string;
  flexibleOffer?: string;
}

// -------------------------------------------------------------
// 1. GIẢI MÃ TÂM LÝ ẨN (Psychology Analysis)
// -------------------------------------------------------------
export interface ObjectionPsychology {
  realFear: string;          // Nỗi sợ / rào cản tâm lý ngầm thực sự của khách
  staffMistake: string;      // Sai lầm chí mạng nhân viên trực chat thường mắc phải
  psychologyHook: string;    // Đòn bẩy tâm lý chủ đạo để hóa giải (Neo giá, Chuyển rủi ro, FOMO...)
}

// -------------------------------------------------------------
// 2. PHƯƠNG ÁN PHẢN HỒI BẺ GÃY TỪ CHỐI (Response Option)
// -------------------------------------------------------------
export interface ObjectionResponseOption {
  id: "option_value" | "option_urgency" | "option_zero_risk" | string;
  index: number;
  title: string;             // Tiêu đề chiến thuật (VD: Đánh Vào Giá Trị Vượt Trội)
  badge: string;             // Nhãn nổi bật ("Khuyên Dùng", "Chống Ghosting", "Cam Kết Thép")
  tone: string;              // Giọng điệu & sắc thái (Đồng cảm, Tạo áp lực tích cực, Tự tin)
  timing: string;            // Thời điểm kích hoạt / đối tượng áp dụng
  message: string;           // Mẫu tin nhắn trực chat thực chiến cực kỳ tự nhiên, ngắt dòng chuẩn sàn
  closingTactic: string;     // Phân tích chiến thuật & lý do câu này chốt đơn thành công
  charCount: number;         // Độ dài tin nhắn
}

// -------------------------------------------------------------
// 3. KỸ THUẬT CÂU HỎI MỞ CHỐNG GHOSTING (Open Questions)
// -------------------------------------------------------------
export interface OpenQuestionItem {
  id: string;
  index: number;
  title: string;             // Tên kỹ thuật câu hỏi (Chốt giả định, Hỗ trợ giao nhận...)
  question: string;          // Câu hỏi mở buộc khách phản hồi (không thể chỉ trả lời Có/Không)
  purpose: string;           // Tác dụng tâm lý ép khách tiếp tục hội thoại
}

// -------------------------------------------------------------
// 4. MÔ PHỎNG HỘI THOẠI TRỰC CHAT THỰC CHIẾN (Live Chat Scenario)
// -------------------------------------------------------------
export interface LiveChatScenario {
  platform: "Shopee Chat" | "TikTok Shop DM" | "Zalo / Fanpage" | string;
  customerMessage: string;
  recommendedReply: string;
  proTip: string;
}

// -------------------------------------------------------------
// 5. NGUYÊN TẮC VÀNG TRỰC CHAT SÀN (Golden Rules)
// -------------------------------------------------------------
export interface GoldenRuleItem {
  index: number;
  title: string;
  rule: string;
  impact: string;            // Đo lường kết quả: Tăng CR, Giảm tỷ lệ hủy, Tăng tốc độ rep...
}

// -------------------------------------------------------------
// DỮ LIỆU ĐẦU RA TỔNG THỂ (Root Contract Data)
// -------------------------------------------------------------
export interface ObjectionKillerData {
  productName: string;
  price: string;
  customerObjection: string;
  flexibleOffer: string;
  summary: string;
  psychology: ObjectionPsychology;
  responseOptions: ObjectionResponseOption[];
  openQuestions: OpenQuestionItem[];
  chatScenarios: LiveChatScenario[];
  goldenRules: GoldenRuleItem[];
}

// -------------------------------------------------------------
// SYSTEM PROMPT CHUYÊN GIA BÁN HÀNG & TRỰC CHAT SÀN TMĐT 2026
// -------------------------------------------------------------
export const OBJECTION_KILLER_SYSTEM_PROMPT = `Bạn là Chuyên Gia Huấn Luyện Trực Chat & Bậc Thầy Bẻ Gãy Lời Từ Chối (Live Chat Sales Closing Master) số 1 thị trường Thương Mại Điện Tử Việt Nam (chuyên sâu Shopee Chat, TikTok Shop DM, Lazada, Fanpage, Zalo OA).

VĂN PHONG VÀ BẢN SẮC TRỰC CHAT:
1. Bạn nắm thấu đáo tâm lý người mua hàng online Việt Nam: sợ đắt vô lý, sợ bị hớ khi thấy shop khác bán rẻ hơn, đòi suy nghĩ thêm vì chưa tin, sợ chất lượng không như hình quảng cáo, sợ phí ship đắt, tiếc tiền trước ngày có lương.
2. Tin nhắn phản hồi PHẢI tuyệt đối tự nhiên, xưng hô "Dạ em chào Anh/Chị", có emoji duyên dáng vừa phải, ngắt dòng thành các câu ngắn 1-2 dòng chuẩn thói quen đọc trên màn hình điện thoại di động (Mobile Chat UX).
3. Tuyệt đối KHÔNG viết văn phong lý thuyết sáo rỗng hoặc cãi tay đôi với khách. Luôn áp dụng nguyên tắc: "ĐỒNG CẢM TRƯỚC -> TÁI ĐỊNH VỊ GIÁ TRỊ -> TUNG DEAL HOẶC CAM KẾT KHÔNG RỦI RO -> KẾT THÚC BẰNG CÂU HỎI MỞ DẪN DẮT ĐẶT HÀNG".
4. Phải trả về JSON TUÂN THỦ CHÍNH XÁC SCHEMA bên dưới, không bao bọc thêm văn bản giải thích thừa ngoài JSON.`;

export function generateObjectionKillerUserPrompt(inputs: ObjectionKillerInputs): string {
  const productName = inputs.productName?.trim() || "Sản phẩm sàn TMĐT";
  const price = inputs.price?.trim() ? `${inputs.price.trim()}đ` : "Giá niêm yết";
  const customerObjection = inputs.customerObjection?.trim() || "Khách chê đắt hoặc đòi suy nghĩ thêm";
  const flexibleOffer = inputs.flexibleOffer?.trim() || "Voucher 30k, tặng kèm phụ kiện, bảo hành 1 đổi 1 tận nơi";

  return `Tình huống tư vấn bán hàng sàn TMĐT:
- Sản Phẩm: ${productName}
- Mức Giá: ${price}
- Lời Từ Chối Của Khách: "${customerObjection}"
- Ưu Đãi Shop Có Thể Hỗ Trợ: "${flexibleOffer}"

YÊU CẦU: Xây dựng bộ kịch bản bẻ gãy từ chối và chốt đơn 1-1 ngay trong phiên chat. Trả về ĐÚNG DUY NHẤT một JSON hợp lệ theo Schema sau:
{
  "summary": "1 câu tóm tắt chiến lược bẻ gãy lời từ chối cho ca này",
  "psychology": {
    "realFear": "Nỗi sợ ngầm thực sự khiến khách do dự (1-2 câu ngắn)",
    "staffMistake": "Sai lầm nhân viên tư vấn hay mắc phải",
    "psychologyHook": "Tên đòn bẩy tâm lý chủ đạo (Neo Giá Vượt Trội / FOMO / Đảo Ngược Rủi Ro)"
  },
  "responseOptions": [
    {
      "index": 1,
      "title": "Phương Án 1: Đánh Vào Giá Trị Vượt Trội",
      "badge": "Khuyên Dùng",
      "tone": "Đồng cảm, khẳng định chất lượng",
      "timing": "Khi khách so sánh giá rẻ hơn hoặc chê đắt",
      "message": "Tin nhắn mẫu 2-3 câu xưng hô Em - Anh/Chị, đồng cảm và chứng minh độ bền/chất lượng vượt trội kèm ưu đãi ${flexibleOffer}",
      "closingTactic": "Lý do câu này thuyết phục khách bẻ gãy đòn giá rẻ",
      "charCount": 180
    },
    {
      "index": 2,
      "title": "Phương Án 2: Tung Deal Khan Hiếm 15 Phút",
      "badge": "Chốt Nhanh",
      "tone": "Nhiệt tình, tạo đặc quyền giới hạn",
      "timing": "Khi khách đòi suy nghĩ thêm hoặc ngập ngừng",
      "message": "Tin nhắn mẫu 2-3 câu tung ưu đãi ${flexibleOffer} có thời hạn chỉ trong phiên chat / 15 phút tới",
      "closingTactic": "Kích hoạt hiệu ứng tâm lý sợ mất cơ hội",
      "charCount": 190
    },
    {
      "index": 3,
      "title": "Phương Án 3: Đảo Ngược Rủi Ro Tuyệt Đối",
      "badge": "Cam Kết Thép",
      "tone": "Tự tin, đảm bảo 100%",
      "timing": "Khi khách sợ hàng không giống ảnh hoặc sợ bị lừa",
      "message": "Tin nhắn mẫu 2-3 câu cam kết đồng kiểm khi nhận, 1 đổi 1 tận nơi miễn phí 100% nếu không ưng ý",
      "closingTactic": "Chuyển toàn bộ rủi ro sang phía shop",
      "charCount": 190
    }
  ],
  "openQuestions": [
    {
      "index": 1,
      "title": "Kỹ thuật Chốt Giả Định (Màu Sắc / Phân Loại)",
      "question": "Câu hỏi mở hướng khách chọn màu/size/combo thay vì suy nghĩ có mua hay không?",
      "purpose": "Định hướng khách chọn mẫu cụ thể"
    },
    {
      "index": 2,
      "title": "Kỹ thuật Hỗ Trợ Địa Chỉ & Thời Gian Nhận",
      "question": "Câu hỏi mở về địa chỉ hoặc thời gian nhận hàng thuận tiện?",
      "purpose": "Dẫn dắt khách sang bước nhận hàng hỏa tốc"
    }
  ]
}`;
}


// -------------------------------------------------------------
// OFFLINE BLUEPRINT GENERATOR (Deterministic Fallback)
// -------------------------------------------------------------
export function buildOfflineObjectionKillerData(inputs: ObjectionKillerInputs): ObjectionKillerData {
  const name = inputs.productName?.trim() || "Sản phẩm cao cấp";
  const price = inputs.price?.trim() ? `${inputs.price.trim()}đ` : "giá niêm yết";
  const objection = inputs.customerObjection?.trim() || "Khách chê đắt hoặc đòi suy nghĩ thêm";
  const offer = inputs.flexibleOffer?.trim() || "Tặng kèm quà đặc biệt + Miễn phí đổi hàng tận nhà trong 7 ngày";

  const lowerObj = objection.toLowerCase();
  const isPriceIssue = lowerObj.includes("đắt") || lowerObj.includes("tiền") || lowerObj.includes("rẻ hơn") || lowerObj.includes("giá");
  const isThinkIssue = lowerObj.includes("suy nghĩ") || lowerObj.includes("xem lại") || lowerObj.includes("để sau") || lowerObj.includes("hỏi lại");
  const isTrustIssue = lowerObj.includes("lừa") || lowerObj.includes("giống hình") || lowerObj.includes("chất lượng") || lowerObj.includes("hàng đểu") || lowerObj.includes("kém");
  const isShipIssue = lowerObj.includes("ship") || lowerObj.includes("phí vận chuyển") || lowerObj.includes("freeship");

  let fearVi = "Khách hàng sợ bị mua hớ giá đắt hơn shop khác hoặc sợ sản phẩm không tương xứng với số tiền bỏ ra.";
  let mistakeVi = "Vội vàng tranh cãi, chê shop khác bán đồ dởm hoặc hạ giá tức thì khiến khách càng nghi ngờ chất lượng.";
  let hookVi = "Đòn Bẩy Neo Giá Trị & Chia Nhỏ Chi Phí Trên Thời Gian Sử Dụng";

  if (isTrustIssue) {
    fearVi = "Khách hàng từng có trải nghiệm tồi tệ khi mua hàng online, sợ hàng nhận về không giống ảnh quảng cáo hoặc khó đổi trả.";
    mistakeVi = "Chỉ hứa miệng suông mà không đưa ra cam kết đồng kiểm hoặc bảo hiểm rủi ro tài chính cụ thể.";
    hookVi = "Đòn Bẩy Đảo Ngược Rủi Ro Tuyệt Đối (Zero-Risk Reversal)";
  } else if (isThinkIssue) {
    fearVi = "Khách vẫn còn phân vân giữa nhiều lựa chọn hoặc chưa cảm thấy cấp bách cần phải mua ngay bây giờ.";
    mistakeVi = "Nói 'Dạ vâng khi nào chị mua ủng hộ em' khiến đơn hàng nguội lạnh và trôi mất vĩnh viễn.";
    hookVi = "Đòn Bẩy Khan Hiếm Giới Hạn Phiên Chat (FOMO 15 Phút)";
  } else if (isShipIssue) {
    fearVi = "Khách hàng cảm thấy bị ức chế vì phí vận chuyển làm đội tổng chi phí đơn hàng lên cao.";
    mistakeVi = "Đổ lỗi cho đơn vị vận chuyển mà không đưa ra giải pháp gom đơn hoặc hỗ trợ mã giảm giá bù ship.";
    hookVi = "Đòn Bẩy Trợ Giá Vận Chuyển Linh Hoạt";
  }

  return {
    productName: name,
    price,
    customerObjection: objection,
    flexibleOffer: offer,
    summary: `Chiến thuật bẻ gãy từ chối '${objection}' cho ${name} kết hợp neo giá trị và ưu đãi ${offer}`,
    psychology: {
      realFear: fearVi,
      staffMistake: mistakeVi,
      psychologyHook: hookVi,
    },
    responseOptions: [
      {
        id: "option_value",
        index: 1,
        title: "Phương Án 1: Đánh Vào Giá Trị Vượt Trội (Value Anchor)",
        badge: "Khuyên Dùng - Tỉ Lệ Chốt Cao",
        tone: "Đồng cảm sâu sắc, khẳng định chất lượng vượt trội",
        timing: "Áp dụng ngay khi khách chê đắt hoặc so sánh giá với shop khác",
        message: `Dạ em hoàn toàn hiểu tâm lý cân nhắc giá của Anh/Chị ạ! Đúng là trên sàn có nhiều shop bán mức giá thấp hơn, nhưng dòng ${name} bên em dùng chất liệu loại 1 gia công cực kỳ bền chắc, xài êm hơn gấp đôi. Tính ra chênh nhau vài chục ngàn mà mình yên tâm dùng lâu dài, không lo hỏng vặt. Anh/Chị xem thử em gửi kèm ưu đãi riêng cho mình nha!`,
        closingTactic: "Thừa nhận sự tồn tại của hàng rẻ nhưng chuyển hướng khách sang độ bền và sự an tâm khi sử dụng.",
        charCount: 220,
      },
      {
        id: "option_urgency",
        index: 2,
        title: "Phương Án 2: Tung Deal Khan Hiếm 15 Phút (Urgency & FOMO)",
        badge: "Chốt Nhanh - Chống Do Dự",
        tone: "Nhiệt tình, trao đặc quyền VIP giới hạn",
        timing: "Áp dụng khi khách bảo để suy nghĩ thêm hoặc ngập ngừng",
        message: `Dạ Anh/Chị ơi, mẫu ${name} này bên em hiện tại số lượng trong kho còn rất ít. Nếu Anh/Chị ưng ý và chốt luôn trong phiên chat này, em xin phép hỗ trợ riêng cho Anh/Chị: ${offer}. Em xin giữ suất ưu đãi đặc quyền này cho mình trong 15 phút tới để kịp đóng gói gửi đi trong chuyến xe chiều nay nha!`,
        closingTactic: "Kích hoạt hiệu ứng tâm lý sợ đánh mất cơ hội nhận quà và hỗ trợ độc quyền.",
        charCount: 215,
      },
      {
        id: "option_zero_risk",
        index: 3,
        title: "Phương Án 3: Đảo Ngược Rủi Ro Tuyệt Đối (Zero-Risk Reversal)",
        badge: "Cam Kết Thép - Xóa Bỏ Hoài Nghi",
        tone: "Tự tin, đảm bảo không một chút rủi ro cho khách",
        timing: "Áp dụng khi khách sợ hàng không giống ảnh hoặc sợ bị lừa",
        message: `Dạ Anh/Chị cứ an tâm 100% nha! Khi nhận ${name}, bên em hỗ trợ kiểm tra hàng thoải mái trước khi thanh toán. Nếu sản phẩm không chuẩn như tư vấn hoặc Anh/Chị không ưng ý, bên em đổi mới tận nhà hoàn toàn miễn phí. Mọi rủi ro bên em chịu hết, Anh/Chị không phải lo bất kỳ điều gì đâu ạ!`,
        closingTactic: "Cam kết đồng kiểm và đổi mới tận nhà xóa tan rào cản phòng thủ cuối cùng của người mua.",
        charCount: 210,
      },
    ],
    openQuestions: [
      {
        id: "oq_1",
        index: 1,
        title: "Kỹ thuật Chốt Giả Định (Phân Loại & Màu Sắc)",
        question: `Dạ hiện tại dòng ${name} này đang có sẵn các phiên bản rất được chuộng, Anh/Chị đang thích tone màu/phân loại nào hơn để em kiểm tra kho giữ riêng cho mình ạ?`,
        purpose: "Định hướng khách hàng tập trung vào sở thích chọn mẫu thay vì suy nghĩ có mua hay không.",
      },
      {
        id: "oq_2",
        index: 2,
        title: "Kỹ thuật Giải Quyết Khâu Nhận Hàng (Thời Gian / Địa Chỉ)",
        question: `Dạ nếu chốt đơn bây giờ bên em kịp lên vận đơn giao sớm cho Anh/Chị. Anh/Chị thường tiện nhận hàng vào giờ hành chính tại cơ quan hay nhận tại nhà để em ghi chú cho shipper ạ?`,
        purpose: "Dẫn dắt thẳng vào hành động nhận hàng, tạo cảm giác đơn hàng đã sẵn sàng xuất kho.",
      },
      {
        id: "oq_3",
        index: 3,
        title: "Kỹ thuật Khơi Gợi Nhu Cầu Thực",
        question: `Dạ em hỏi nhỏ xíu, ngoài phần mức giá thì về tính năng hoặc cách sử dụng của ${name}, Anh/Chị còn điều gì muốn em giải đáp thêm để mình yên tâm nhất không ạ?`,
        purpose: "Khai thác rào cản tâm lý thực sự còn sót lại của khách để tiếp tục tư vấn.",
      },
    ],
    chatScenarios: [
      {
        platform: "Shopee Chat",
        customerMessage: `Shop ơi mẫu ${name} này giá hơi cao, để mình xem lại đã nha.`,
        recommendedReply: `Dạ em hiểu Anh/Chị đang cân nhắc ạ! Nhưng mẫu ${name} bên em bảo hành 1 đổi 1 tận nơi, dùng bền bỉ lắm ạ. Đặc biệt em gửi riêng mã voucher 30k nếu mình đặt trong hôm nay nha!`,
        proTip: "Gửi kèm 1 ảnh chụp cận cảnh chi tiết sắc nét của sản phẩm để chứng minh sự vượt trội.",
      },
      {
        platform: "TikTok Shop DM",
        customerMessage: "Chất lượng có đúng như trên video không shop?",
        recommendedReply: "Dạ cam kết chuẩn từng chi tiết như trên video luôn ạ! Bên em cho kiểm hàng thoải mái khi shipper tới, không ưng em nhận lại ngay không tốn 1 đồng phí nào của Anh/Chị ạ!",
        proTip: "Bấm ngay nút đính kèm sản phẩm trong khung chat TikTok Shop để khách nhấp mua nhanh.",
      },
    ],
    goldenRules: [
      {
        index: 1,
        title: "Tốc Độ Phản Hồi Dưới 60 Giây",
        rule: "Khách hàng chat sàn thường gửi câu hỏi cho 3 shop cùng lúc. Shop nào trả lời đầu tiên và đồng cảm khéo léo sẽ giành được 75% cơ hội chốt đơn.",
        impact: "Giữ trọn vẹn điểm tỷ lệ phản hồi chat của sàn và tối đa hóa chuyển đổi.",
      },
      {
        index: 2,
        title: "Không Bao Giờ Tranh Cãi Hay Phủ Định",
        rule: "Tuyệt đối không nói 'Khách nhầm rồi' hay 'Shop kia bán đồ đểu'. Hãy nói: 'Dạ em hiểu vì sao Anh/Chị băn khoăn... Và điểm khác biệt lớn nhất của bên em là...'",
        impact: "Làm khách cảm thấy được lắng nghe, tháo bỏ trạng thái phòng thủ.",
      },
      {
        index: 3,
        title: "Tuyệt Đối Không Để Tin Nhắn Kết Thúc Cụt",
        rule: "Mọi tin nhắn kết thúc bằng dấu chấm đều dễ bị ghosting. Hãy luôn kết thúc bằng một câu hỏi mở lịch sự hoặc câu hỏi lựa chọn A / B.",
        impact: "Duy trì mạch đàm thoại liên tục cho đến khi khách đồng ý đặt hàng.",
      },
      {
        index: 4,
        title: "Luôn Kèm Ưu Đãi Có Hạn (Scarcity)",
        rule: "Ưu đãi không có hạn chót là ưu đãi vô giá trị. Luôn gắn ưu đãi với điều kiện: 'Chỉ áp dụng trong phiên chat này' hoặc 'Giữ trong 15 phút'.",
        impact: "Ngăn chặn thói quen trì hoãn, đẩy nhanh quyết định chốt đơn trong 3 phút.",
      },
    ],
  };
}

// -------------------------------------------------------------
// 4-TIER RESILIENT PARSER (Bền Bỉ Tuyệt Đối)
// -------------------------------------------------------------
export function parseObjectionKillerOutput(raw: string, inputs: ObjectionKillerInputs): ObjectionKillerData {
  const fallback = buildOfflineObjectionKillerData(inputs);
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return fallback;
  }

  const cleanText = raw.trim();

  // TẦNG 1: DIRECT JSON PARSE
  try {
    const parsed = JSON.parse(cleanText);
    if (parsed && typeof parsed === "object" && (parsed.responseOptions || parsed.psychology)) {
      return normalizeParsedData(parsed, inputs, fallback);
    }
  } catch {}

  // TẦNG 2: CODE BLOCK HOẶC EMBEDDED JSON REGEX
  const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i) || cleanText.match(/(\{[\s\S]*"responseOptions"[\s\S]*\})/i);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed && typeof parsed === "object") {
        return normalizeParsedData(parsed, inputs, fallback);
      }
    } catch {}
  }

  // TẦNG 3: LEGACY MARKDOWN REGEX PARSER (Hỗ trợ định dạng cũ)
  const legacyData = parseLegacyMarkdown(cleanText, inputs, fallback);
  if (legacyData && legacyData.responseOptions && legacyData.responseOptions.length > 0) {
    return legacyData;
  }

  // TẦNG 4: DETERMINISTIC BLUEPRINT FALLBACK
  return fallback;
}

function normalizeParsedData(data: any, inputs: ObjectionKillerInputs, blueprint: ObjectionKillerData): ObjectionKillerData {
  const responseOptions: ObjectionResponseOption[] = Array.isArray(data.responseOptions)
    ? data.responseOptions.map((opt: any, idx: number) => {
        const bp = blueprint.responseOptions[idx] || blueprint.responseOptions[0];
        const msg = (opt.message || bp.message).replace(/^```markdown\s*/i, "").replace(/```$/i, "").trim();
        return {
          id: opt.id || bp.id || `option_${idx + 1}`,
          index: typeof opt.index === "number" ? opt.index : idx + 1,
          title: opt.title?.trim() || bp.title,
          badge: opt.badge?.trim() || bp.badge,
          tone: opt.tone?.trim() || bp.tone,
          timing: opt.timing?.trim() || bp.timing,
          message: msg,
          closingTactic: opt.closingTactic?.trim() || bp.closingTactic,
          charCount: typeof opt.charCount === "number" ? opt.charCount : msg.length,
        };
      })
    : blueprint.responseOptions;

  const openQuestions: OpenQuestionItem[] = Array.isArray(data.openQuestions)
    ? data.openQuestions.map((q: any, idx: number) => {
        const bp = blueprint.openQuestions[idx] || blueprint.openQuestions[0];
        const qText = (q.question || bp.question).replace(/^```markdown\s*/i, "").replace(/```$/i, "").trim();
        return {
          id: q.id || bp.id || `oq_${idx + 1}`,
          index: typeof q.index === "number" ? q.index : idx + 1,
          title: q.title?.trim() || bp.title,
          question: qText,
          purpose: q.purpose?.trim() || bp.purpose,
        };
      })
    : blueprint.openQuestions;

  const goldenRules: GoldenRuleItem[] = Array.isArray(data.goldenRules)
    ? data.goldenRules.map((gr: any, idx: number) => {
        const bp = blueprint.goldenRules[idx] || blueprint.goldenRules[0];
        return {
          index: typeof gr.index === "number" ? gr.index : idx + 1,
          title: gr.title?.trim() || bp.title,
          rule: gr.rule?.trim() || bp.rule,
          impact: gr.impact?.trim() || bp.impact,
        };
      })
    : blueprint.goldenRules;

  const chatScenarios: LiveChatScenario[] = Array.isArray(data.chatScenarios)
    ? data.chatScenarios.map((cs: any, idx: number) => {
        const bp = blueprint.chatScenarios[idx] || blueprint.chatScenarios[0];
        return {
          platform: cs.platform?.trim() || bp.platform,
          customerMessage: cs.customerMessage?.trim() || bp.customerMessage,
          recommendedReply: cs.recommendedReply?.trim() || bp.recommendedReply,
          proTip: cs.proTip?.trim() || bp.proTip,
        };
      })
    : blueprint.chatScenarios;

  return {
    productName: data.productName?.trim() || inputs.productName || blueprint.productName,
    price: data.price?.trim() || inputs.price || blueprint.price,
    customerObjection: data.customerObjection?.trim() || inputs.customerObjection || blueprint.customerObjection,
    flexibleOffer: data.flexibleOffer?.trim() || inputs.flexibleOffer || blueprint.flexibleOffer,
    summary: data.summary?.trim() || blueprint.summary,
    psychology: {
      realFear: data.psychology?.realFear?.trim() || blueprint.psychology.realFear,
      staffMistake: data.psychology?.staffMistake?.trim() || blueprint.psychology.staffMistake,
      psychologyHook: data.psychology?.psychologyHook?.trim() || blueprint.psychology.psychologyHook,
    },
    responseOptions: responseOptions.length > 0 ? responseOptions : blueprint.responseOptions,
    openQuestions: openQuestions.length > 0 ? openQuestions : blueprint.openQuestions,
    chatScenarios: chatScenarios.length > 0 ? chatScenarios : blueprint.chatScenarios,
    goldenRules: goldenRules.length > 0 ? goldenRules : blueprint.goldenRules,
  };
}

function parseLegacyMarkdown(text: string, inputs: ObjectionKillerInputs, blueprint: ObjectionKillerData): ObjectionKillerData | null {
  try {
    let realFear = "";
    let staffMistake = "";
    const fearMatch = text.match(/Nỗi sợ(?: thực sự)?(?: của khách)?:?\s*\*?\*?([^\n]+)/i);
    if (fearMatch) realFear = fearMatch[1].replace(/^\*\*|\*\*$/g, "").trim();

    const mistakeMatch = text.match(/Sai lầm(?: nhân viên)?:?\s*\*?\*?([^\n]+)/i);
    if (mistakeMatch) staffMistake = mistakeMatch[1].replace(/^\*\*|\*\*$/g, "").trim();

    const options: ObjectionResponseOption[] = [];
    const optRegex = /###\s*(?:💎|⚡|🛡️)?\s*Phương Án\s*(\d+)[:\s]+([^\n]+)([\s\S]*?)(?=(?:###\s*(?:💎|⚡|🛡️)?\s*Phương Án|\n---\n|##\s*3|$))/gi;
    let optMatch: RegExpExecArray | null;

    while ((optMatch = optRegex.exec(text)) !== null) {
      const idx = parseInt(optMatch[1], 10) || options.length + 1;
      const title = optMatch[2]?.trim() || `Phương Án ${idx}`;
      const block = optMatch[3] || "";

      let msg = "";
      const codeMatch = block.match(/```(?:markdown)?\s*([\s\S]*?)```/i);
      if (codeMatch) {
        msg = codeMatch[1].trim();
      } else {
        const msgMatch = block.match(/Mẫu tin nhắn:?\s*(?:["“']|```)?([\s\S]*?)(?:["”']|```|\n\s*-|\n\s*###|$)/i);
        if (msgMatch) msg = msgMatch[1].trim();
      }

      let timing = "";
      const timingMatch = block.match(/Thời điểm(?: áp dụng)?:?\s*([^\n]+)/i);
      if (timingMatch) timing = timingMatch[1].replace(/^\*\*|\*\*$/g, "").trim();

      if (msg) {
        const bp = blueprint.responseOptions[idx - 1] || blueprint.responseOptions[0];
        options.push({
          id: bp.id || `legacy_opt_${idx}`,
          index: idx,
          title,
          badge: bp.badge || "Kịch Bản Thực Chiến",
          tone: bp.tone || "Đồng cảm, chốt đơn linh hoạt",
          timing: timing || bp.timing,
          message: msg,
          closingTactic: bp.closingTactic,
          charCount: msg.length,
        });
      }
    }

    if (options.length === 0) return null;

    return {
      productName: inputs.productName || blueprint.productName,
      price: inputs.price || blueprint.price,
      customerObjection: inputs.customerObjection || blueprint.customerObjection,
      flexibleOffer: inputs.flexibleOffer || blueprint.flexibleOffer,
      summary: blueprint.summary,
      psychology: {
        realFear: realFear || blueprint.psychology.realFear,
        staffMistake: staffMistake || blueprint.psychology.staffMistake,
        psychologyHook: blueprint.psychology.psychologyHook,
      },
      responseOptions: options,
      openQuestions: blueprint.openQuestions,
      chatScenarios: blueprint.chatScenarios,
      goldenRules: blueprint.goldenRules,
    };
  } catch {
    return null;
  }
}

export function cleanAndValidateObjectionKillerOutput(raw: string, inputs: ObjectionKillerInputs): string {
  const parsed = parseObjectionKillerOutput(raw, inputs);
  return JSON.stringify(parsed);
}
