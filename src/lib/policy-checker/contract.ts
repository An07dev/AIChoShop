/**
 * Module Contract cho AI Soi Từ Khóa Cấm & Thẩm Định Chính Sách Sàn TMĐT (Policy Checker)
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema), Bộ Prompt Thực Chiến Sàn TMĐT 2026 (TikTok Shop, Shopee, Lazada, Facebook Ads)
 * & Resilient Parser 4 Tầng Bền Bỉ (Tương thích ngược 100% với dữ liệu Markdown lịch sử cũ)
 */

import {
  scanTextForViolations,
  generateOfflineSafeRewrite,
  sanitizePolicyInput,
  type ScanReport,
} from "../policy-blacklist/dictionary.ts";

export interface PolicyCheckerInputs {
  platform: string; // "TikTok Shop" | "Shopee" | "Facebook Ads" | "Lazada" | string
  contentType: string; // "Mô tả sản phẩm" | "Tiêu đề sản phẩm" | "Kịch bản Video / Livestream" | "Tin nhắn Chat chăm sóc khách" | string
  text: string;
}

export type RiskSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface ViolationItem {
  id: number;
  phrase: string; // Từ ngữ / cụm từ vi phạm chính xác trong bài
  category: string; // Nhóm vi phạm (Lôi kéo ngoài sàn, Cam kết y tế, Từ ngữ so sánh nhất...)
  categoryKey: "EXTERNAL_TRANSACTION" | "MEDICAL_CURE" | "SUPERLATIVE" | "SENSITIVE_BRAND" | "GIMMICK" | "OTHER";
  severity: RiskSeverity;
  severityBadge: string; // "🚨 Nguy Cấp - Nguy Cơ Khóa Shop", "⚠️ Nguy Cơ Xóa Link / Ăn Gậy", "⚡ Bóp Tương Tác", "ℹ️ Cảnh Báo Nhẹ"
  reason: string; // Cơ chế thuật toán AI sàn (OCR/ASR/Regex) bắt lỗi & lý do bị phạt
  solution: string; // Hướng dẫn khắc phục chi tiết
  replacementPhrase: string; // Cụm từ thay thế an toàn 1-chạm (Ready to use)
}

export interface RiskAudit {
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "SAFE";
  riskBadge: string; // "NGUY HIỂM - NGUY CƠ BỊ KHÓA LINK / ĂN GẬY CAO"
  safetyScore: number; // 0 - 100 (100 là an toàn tuyệt đối)
  summary: string; // Tóm tắt tình trạng và cảnh báo hậu quả
  violatedPolicies: string[]; // Danh sách các điều khoản cụ thể bị vi phạm
  penaltyConsequences: string[]; // Dự báo hình phạt (Khóa sản phẩm vĩnh viễn, phạt sao quả tạ / gậy TikTok...)
}

export interface SafeRewriteData {
  headline: string; // Tiêu đề gợi ý cuốn hút, chuẩn SEO sàn và không dính từ cấm
  fullCleanText: string; // Toàn văn bản mô tả sạch 100%, định dạng đẹp, giữ trọn USP bán hàng
  sellingPoints: string[]; // Danh sách lợi ích nổi bật đã được làm sạch
  safeCta: string; // Lời kêu gọi hành động an toàn chuẩn quy chế sàn
  wordCount: number;
  charCount: number;
}

export interface PolicyCheckerData {
  platform: string;
  contentType: string;
  originalText: string;
  audit: RiskAudit;
  violations: ViolationItem[];
  rewrite: SafeRewriteData;
  tips: string[]; // 3-4 lời khuyên thực chiến cho ngành hàng trên sàn đó
  safeTags: string[]; // Bộ từ khóa an toàn khuyên dùng
  forbiddenTags: string[]; // Danh sách từ cấm cần tuyệt đối né tránh
}

// -------------------------------------------------------------
// DỮ LIỆU MẪU CHUẨN HOÀN CHỈNH (SAMPLE DATA)
// -------------------------------------------------------------
export const SAMPLE_POLICY_INPUT: PolicyCheckerInputs = {
  platform: "TikTok Shop",
  contentType: "Mô tả sản phẩm (Product Description)",
  text: `🔥 SIÊU PHẨM KEM DƯỠNG TRẮNG DA TRỊ MỤN SỐ 1 VIỆT NAM 🔥
Cam kết 100% trị dứt điểm mọi loại mụn bọc, mụn ẩn chỉ sau 3 ngày dùng! Thần dược tái sinh làn da, vĩnh viễn không tái phát.
Hàng nhập khẩu chuẩn style Gucci cao cấp, bảo hành hoàn tiền gấp 10 nếu không hiệu quả.
🎁 DUY NHẤT HÔM NAY: Tặng tiền mặt 50k cho 10 đơn đầu tiên!
Khách yêu liên hệ ngay Zalo / Hotline: 0912.345.678 hoặc inbox Fanpage Facebook để nhận ưu đãi chuyển khoản free ship nha!`,
};

export const SAMPLE_POLICY_DATA: PolicyCheckerData = {
  platform: "TikTok Shop",
  contentType: "Mô tả sản phẩm",
  originalText: SAMPLE_POLICY_INPUT.text,
  audit: {
    riskLevel: "CRITICAL",
    riskBadge: "🚨 NGUY HIỂM - NGUY CƠ BỊ KHÓA LINK / ĂN GẬY VI PHẠM CAO",
    safetyScore: 15,
    summary: "Đoạn văn bản chứa hàng loạt vi phạm nghiêm trọng: Lôi kéo giao dịch ngoài sàn (Zalo, Hotline, FB, Chuyển khoản), Cam kết y tế quá mức (Trị dứt điểm 100%, Thần dược), Từ ngữ so sánh nhất (Số 1 VN, Duy nhất) và Nghi vấn vi phạm nhãn hiệu quốc tế (Gucci). Nếu đăng tải, sản phẩm chắc chắn sẽ bị AI của sàn từ chối duyệt, gắn cờ vi phạm hoặc khóa vĩnh viễn.",
    violatedPolicies: [
      "Chính sách lôi kéo giao dịch ngoài sàn TikTok Shop / Shopee (External Transactions Policy)",
      "Luật Quảng cáo 2012 & Nghị định 38/2021 (Từ ngữ so sánh tuyệt đối không có chứng nhận)",
      "Chính sách bảo hộ nhãn hiệu và hàng giả/nhái (IP & Counterfeit Policy)",
      "Quy chuẩn quản lý mỹ phẩm và bảo vệ quyền lợi người tiêu dùng (Y tế & Thực phẩm chức năng)",
    ],
    penaltyConsequences: [
      "Khóa link sản phẩm vĩnh viễn, mất toàn bộ đánh giá và lượt bán hiện có",
      "Cộng 2 - 4 điểm vi phạm tiêu chuẩn người bán (Shop Health Penalty Points)",
      "Bóp hiển thị tìm kiếm toàn gian hàng (Shadowban) và hạn chế livestream trong 7-30 ngày",
    ],
  },
  violations: [
    {
      id: 1,
      phrase: "SỐ 1 VIỆT NAM",
      category: "Khẳng định so sánh nhất",
      categoryKey: "SUPERLATIVE",
      severity: "HIGH",
      severityBadge: "⚠️ Rủi Ro Cao",
      reason: "Vi phạm Luật Quảng cáo và chính sách sàn khi khẳng định vị thế dẫn đầu tuyệt đối mà không có giấy chứng nhận hợp pháp từ cơ quan nhà nước.",
      solution: "Thay bằng các từ ngữ miêu tả mức độ yêu thích hoặc chất lượng cao cấp của sản phẩm.",
      replacementPhrase: "Dòng kem dưỡng cao cấp được yêu thích",
    },
    {
      id: 2,
      phrase: "Cam kết 100% trị dứt điểm",
      category: "Cam kết y tế quá mức",
      categoryKey: "MEDICAL_CURE",
      severity: "CRITICAL",
      severityBadge: "🚨 Nguy Cấp",
      reason: "Mỹ phẩm chăm sóc da không phải thuốc kê đơn, quy chế sàn nghiêm cấm cam kết hiệu quả y tế tuyệt đối hoặc chữa lành 100%.",
      solution: "Thay bằng ngôn từ chăm sóc da, cải thiện bề mặt và làm dịu tự nhiên.",
      replacementPhrase: "Hỗ trợ cải thiện và làm mờ mụn rõ rệt",
    },
    {
      id: 3,
      phrase: "Thần dược tái sinh làn da",
      category: "Từ ngữ thần thánh hóa",
      categoryKey: "MEDICAL_CURE",
      severity: "HIGH",
      severityBadge: "⚠️ Rủi Ro Cao",
      reason: "Từ 'thần dược', 'thần thánh' bị bot AI sàn quét là quảng cáo sai công dụng và phóng đại lừa dối người tiêu dùng.",
      solution: "Dùng các từ chuyên ngành dưỡng da dịu nhẹ như 'tinh chất nuôi dưỡng', 'công thức phục hồi'.",
      replacementPhrase: "Tinh chất chăm sóc và nuôi dưỡng làn da chuyên sâu",
    },
    {
      id: 4,
      phrase: "vĩnh viễn không tái phát",
      category: "Tuyên bố phóng đại phi thực tế",
      categoryKey: "MEDICAL_CURE",
      severity: "HIGH",
      severityBadge: "⚠️ Rủi Ro Cao",
      reason: "Vi phạm chính sách tuyên bố y tế không có cơ sở khoa học, gây ấn tượng sai lệch về hiệu quả vĩnh viễn.",
      solution: "Tập trung vào lợi ích duy trì làn da khỏe mạnh khi sử dụng đều đặn.",
      replacementPhrase: "Giúp duy trì làn da khỏe mạnh, sạch mịn lâu dài",
    },
    {
      id: 5,
      phrase: "style Gucci",
      category: "Thương hiệu nhạy cảm",
      categoryKey: "SENSITIVE_BRAND",
      severity: "HIGH",
      severityBadge: "⚠️ Rủi Ro Cao",
      reason: "Gắn mác hoặc mượn tên thương hiệu xa xỉ quốc tế khi không có giấy chứng nhận phân phối chính hãng sẽ bị quét hàng nhái/fake.",
      solution: "Mô tả phong cách thiết kế thực tế mà không nhắc tên thương hiệu độc quyền.",
      replacementPhrase: "Thiết kế sang trọng, tinh tế thời thượng",
    },
    {
      id: 6,
      phrase: "hoàn tiền gấp 10",
      category: "Chiêu trò giật gân (Gimmick)",
      categoryKey: "GIMMICK",
      severity: "MEDIUM",
      severityBadge: "⚡ Bóp Tương Tác",
      reason: "Thuật toán AI sàn xếp cam kết đền tiền gấp nhiều lần vào nhóm câu view giật gân và lừa dối khách hàng.",
      solution: "Nhấn mạnh chính sách bảo hành và đổi trả minh bạch theo đúng quy định sàn.",
      replacementPhrase: "Chính sách đổi trả linh hoạt theo quy định sàn",
    },
    {
      id: 7,
      phrase: "Tặng tiền mặt 50k",
      category: "Tặng tiền mặt / Quà cấm",
      categoryKey: "GIMMICK",
      severity: "HIGH",
      severityBadge: "⚠️ Rủi Ro Cao",
      reason: "Chính sách sàn cấm giao dịch tiền mặt hoặc treo thưởng tặng tiền riêng ngoài luồng khuyến mại của hệ thống.",
      solution: "Chuyển thành mã giảm giá (voucher) áp dụng trực tiếp tại giỏ hàng.",
      replacementPhrase: "Tặng voucher giảm giá 50k áp dụng trực tiếp",
    },
    {
      id: 8,
      phrase: "Zalo / Hotline: 0912.345.678",
      category: "Lôi kéo ngoài sàn (CRITICAL)",
      categoryKey: "EXTERNAL_TRANSACTION",
      severity: "CRITICAL",
      severityBadge: "🚨 Nguy Cấp",
      reason: "Hành vi nghiêm trọng nhất: để lại SĐT và từ khóa Zalo bị coi là lôi kéo người mua rời sàn để trốn phí giao dịch.",
      solution: "Xóa toàn bộ số điện thoại và từ khóa Zalo, hướng dẫn khách chat trên sàn.",
      replacementPhrase: "Nhấn 'Chat ngay' trên khung tin nhắn sàn để được tư vấn",
    },
    {
      id: 9,
      phrase: "Fanpage Facebook",
      category: "Dẫn sang mạng xã hội khác",
      categoryKey: "EXTERNAL_TRANSACTION",
      severity: "CRITICAL",
      severityBadge: "🚨 Nguy Cấp",
      reason: "Cấm nhắc tên nền tảng mạng xã hội hoặc đối thủ cạnh tranh ngoài sàn trong nội dung niêm yết sản phẩm.",
      solution: "Thay thế bằng việc hỗ trợ tư vấn trực tiếp trong gian hàng.",
      replacementPhrase: "Nhắn tin trực tiếp cho shop tại đây",
    },
    {
      id: 10,
      phrase: "chuyển khoản free ship",
      category: "Thanh toán ngoài sàn",
      categoryKey: "EXTERNAL_TRANSACTION",
      severity: "CRITICAL",
      severityBadge: "🚨 Nguy Cấp",
      reason: "Yêu cầu chuyển khoản riêng bị coi là hành vi lừa đảo hoặc lách cổng thanh toán bảo đảm của sàn.",
      solution: "Khuyên khách chọn ưu đãi voucher vận chuyển chính thức từ sàn.",
      replacementPhrase: "Ưu đãi voucher Freeship Extra theo mã sàn",
    },
  ],
  rewrite: {
    headline: "✨ KEM DƯỠNG DA GIẢM MỤN CHUYÊN SÂU - BÍ QUYẾT LÀN DA SẠCH MỊN ✨",
    fullCleanText: `✨ KEM DƯỠNG DA GIẢM MỤN CHUYÊN SÂU - BÍ QUYẾT LÀN DA SẠCH MỊN ✨

Bạn đang tìm kiếm giải pháp dịu nhẹ cho làn da mụn và thâm sạm? Khám phá ngay dòng kem dưỡng ẩm phục hồi cao cấp - bí quyết giúp làn da tươi sáng, mịn màng mỗi ngày.

💎 ĐIỂM NỔI BẬT CỦA SẢN PHẨM:
- Hỗ trợ làm dịu các nốt mụn sưng, cải thiện bề mặt da trông thấy chỉ sau thời gian ngắn sử dụng đều đặn.
- Chiết xuất tự nhiên giàu dưỡng chất, thẩm thấu nhanh, không gây nhờn rít, giúp cân bằng độ ẩm và củng cố hàng rào bảo vệ da.
- Thiết kế bao bì sang trọng, thanh lịch, tiện lợi mang theo hàng ngày.

🎁 ƯU ĐÃI ĐẶC QUYỀN HÔM NAY:
- Giảm ngay voucher 50.000đ trực tiếp vào đơn hàng cho khách hàng nhanh tay nhất.
- Hỗ trợ mã miễn phí vận chuyển Extra toàn quốc khi đặt hàng qua sàn.

🛡️ CHÍNH SÁCH TỪ SHOP:
- Cam kết sản phẩm chính hãng, đầy đủ hóa đơn chứng từ nguồn gốc xuất xứ.
- Đổi trả linh hoạt trong vòng 7 ngày nếu lỗi từ nhà sản xuất theo quy định sàn.
- Đội ngũ tư vấn tận tâm 24/7: Quý khách vui lòng nhấn nút "Chat ngay" trên khung trò chuyện của sàn để được hỗ trợ chuyên sâu!`,
    sellingPoints: [
      "Hỗ trợ làm dịu mụn sưng, cải thiện bề mặt da dịu nhẹ",
      "Chiết xuất thiên nhiên dưỡng ẩm sâu, phục hồi hàng rào bảo vệ da",
      "Thiết kế tinh tế sang trọng, tiện lợi mang theo hàng ngày",
      "Voucher trợ giá 50k & mã miễn phí vận chuyển Extra theo sàn",
    ],
    safeCta: "Quý khách vui lòng nhấn nút 'Chat ngay' trên khung trò chuyện của sàn để nhận tư vấn chuyên sâu và hỗ trợ nhanh nhất!",
    wordCount: 220,
    charCount: 1285,
  },
  tips: [
    "Đối với ngành Mỹ phẩm & Skincare: Tuyệt đối tránh các từ ngữ mang tính chỉ định y khoa (trị mụn, chữa khỏi, thần dược). Thay vào đó, hãy dùng 'chăm sóc da', 'làm dịu', 'hỗ trợ cải thiện'.",
    "Khi chạy Livestream hoặc Video ngắn: Không bao giờ nói to số điện thoại hoặc giơ bảng ghi Zalo/STK lên màn hình; bot AI OCR/ASR nhận diện âm thanh và hình ảnh của sàn sẽ tự động bóp reach hoặc đánh sập phiên live trong vòng 3 phút.",
    "Khuyến mại an toàn: Không tặng tiền mặt hay hứa hẹn chuyển khoản lại tiền, chỉ sử dụng công cụ Marketing chính thức do Seller Center cung cấp (Voucher giảm giá, Flash sale, Mua kèm deal sốc).",
    "Thương hiệu quốc tế: Trừ khi shop là Shopee Mall hoặc TikTok Shop Mall có giấy ủy quyền đại lý chính hãng, tuyệt đối không nhắc tên các hãng thời trang xa xỉ trong tiêu đề và mô tả.",
  ],
  safeTags: [
    "Hỗ trợ cải thiện rõ rệt",
    "Dịu nhẹ cho làn da",
    "Phục hồi tự nhiên",
    "Thiết kế tinh tế sang trọng",
    "Ưu đãi voucher sàn",
    "Nhấn Chat ngay để được hỗ trợ",
    "Chính sách đổi trả minh bạch",
    "Hàng chính hãng nguồn gốc rõ ràng",
  ],
  forbiddenTags: [
    "Zalo",
    "Hotline / SĐT",
    "Chuyển khoản / STK",
    "Trị dứt điểm 100%",
    "Thần dược",
    "Số 1 Việt Nam",
    "Vĩnh viễn không tái phát",
    "Style Gucci / Fake / Rep 1:1",
    "Tặng tiền mặt",
    "Fanpage Facebook",
  ],
};

// -------------------------------------------------------------
// SYSTEM PROMPT CHUẨN HÓA: CHUYÊN GIA KIỂM DUYỆT SÀN TMĐT 2026
// -------------------------------------------------------------
export const POLICY_CHECKER_SYSTEM_PROMPT = `Bạn là Trưởng Ban Kiểm Duyệt Chính Sách & Pháp Chế Thương Mại Điện Tử Đông Nam Á (chuyên gia tối cao về thuật toán quét của TikTok Shop Shop Governance 2026, Shopee Search & Policy 2026, Lazada Fair Trading và Meta/Facebook Ads Standards).

Nhiệm vụ của bạn là kiểm tra, rà soát và 'soi' toàn bộ văn bản đầu vào để phát hiện 100% rủi ro vi phạm chính sách, phân tích cơ chế bắt lỗi của bot AI sàn (OCR chữ trên ảnh/video, ASR quét giọng nói livestream, Computer Vision quét logo, Regex quét từ cấm), đồng thời biên soạn một BẢN VIẾT LẠI HOÀN HẢO AN TOÀN 100% VỪA SẠCH LUẬT VỪA BÁN HÀNG ĐỈNH CAO (High-Converting Copy).

BỘ 8 NHÓM VI PHẠM CỐT TỬ CẦN SOI:
1. LÔI KÉO GIAO DỊCH NGOÀI SÀN & TRỐN PHÍ (CRITICAL):
   - Số điện thoại, Hotline, Call, Zalo, d.a.l.o, STK ngân hàng, Chuyển khoản riêng, Fanpage, Website riêng, Inbox riêng...
2. CAM KẾT Y TẾ, DƯỢC PHẨM & THẦN THÁNH HÓA (CRITICAL/HIGH):
   - Trị dứt điểm, Khỏi 100%, Chữa bách bệnh, Thần dược, Thuốc tiên, Vĩnh viễn không tái phát, Tái sinh làn da, Hút mỡ siêu tốc...
3. TỪ NGỮ SO SÁNH NHẤT & TUYỆT ĐỐI HÓA (VI PHẠM LUẬT QUẢNG CÁO) (HIGH):
   - Số 1 Việt Nam, Tốt nhất thị trường, Duy nhất, Độc nhất vô nhị, Rẻ nhất vịnh bắc bộ, Cam kết 100%... (không có kiểm định cơ quan nhà nước).
4. THƯƠNG HIỆU LỚN & HÀNG GIẢ/NHÁI (HIGH):
   - Gắn mác nhãn hiệu quốc tế (Gucci, Chanel, Nike, Apple, Louis Vuitton...) khi không có giấy chứng nhận phân phối; dùng từ rep 1:1, like auth, chuẩn hãng, hàng tuồn xưởng...
5. CHIÊU TRÒ GIẬT GÂN (GIMMICK & SCAM) (HIGH/MEDIUM):
   - Tặng tiền mặt, Hoàn tiền gấp 10/gấp đôi, Trúng thưởng 100%, Nhận thưởng tiền mặt khi mua...
6. HÌNH ẢNH/NỘI DUNG NHẠY CẢM & BEFORE-AFTER (HIGH):
   - So sánh trước - sau lộ da thịt/sẹo mụn quá đà, câu từ gợi dục, phản cảm.
7. ĐÁNH GIÁ ẢO & SEEDING GIAN LẬN (MEDIUM):
   - Hứa hẹn tặng quà để đổi đánh giá 5 sao, yêu cầu chụp đánh giá nhận quà...
8. NHỒI NHÉT TỪ KHÓA (KEYWORD SPAMMING) (MEDIUM):
   - Lặp đi lặp lại hàng chục từ khóa không theo ngữ pháp tự nhiên để kéo traffic bẩn.

QUY TẮC BIÊN SOẠN BẢN VIẾT LẠI AN TOÀN 100% (SAFE REWRITE):
- Không chỉ xóa từ cấm làm cho mô tả bị cụt lủn hay nhàm chán! Phải viết lại thành một bài mô tả bán hàng đỉnh cao (High-converting Copy), giữ trọn vẹn điểm bán độc nhất (USP), sử dụng bullet points cuốn hút, giọng văn thương hiệu chuyên nghiệp, và Call-To-Action (CTA) hợp lệ 100% theo quy chuẩn sàn.

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON THUẦN TÚY (Valid JSON Object), TUYỆT ĐỐI KHÔNG VIẾT LỜI DẪN, KHÔNG DÙNG MARKDOWN BÊN NGOÀI KHỐI JSON.

CẤU TRÚC JSON SCHEMA BẮT BUỘC:
{
  "platform": "Tên sàn",
  "contentType": "Loại nội dung",
  "originalText": "Nội dung gốc",
  "audit": {
    "riskLevel": "CRITICAL | HIGH | MEDIUM | SAFE",
    "riskBadge": "🚨 NGUY HIỂM - NGUY CƠ BỊ KHÓA LINK / ĂN GẬY VI PHẠM CAO | ⚠️ CẢNH BÁO - TỪ NGỮ NHẠY CẢM | ✅ AN TOÀN - ĐẠT CHUẨN SÀN",
    "safetyScore": 15,
    "summary": "Tóm tắt 2-3 câu tổng quát về thực trạng vi phạm và rủi ro nếu đăng tải",
    "violatedPolicies": [
      "Tên điều khoản vi phạm 1",
      "Tên điều khoản vi phạm 2"
    ],
    "penaltyConsequences": [
      "Hậu quả 1 (Khóa sản phẩm, mất đánh giá)",
      "Hậu quả 2 (Điểm phạt sao quả tạ / gậy TikTok)",
      "Hậu quả 3 (Bóp hiển thị tìm kiếm)"
    ]
  },
  "violations": [
    {
      "id": 1,
      "phrase": "Từ ngữ / câu vi phạm cụ thể",
      "category": "Nhóm chính sách vi phạm",
      "categoryKey": "EXTERNAL_TRANSACTION | MEDICAL_CURE | SUPERLATIVE | SENSITIVE_BRAND | GIMMICK | OTHER",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "severityBadge": "🚨 Nguy Cấp | ⚠️ Rủi Ro Cao | ⚡ Bóp Tương Tác | ℹ️ Cảnh Báo",
      "reason": "Lý do chi tiết thuật toán bot AI sàn bắt lỗi và quy chế phạt",
      "solution": "Hướng dẫn cụ thể cách sửa đổi",
      "replacementPhrase": "Cụm từ thay thế an toàn 1-chạm"
    }
  ],
  "rewrite": {
    "headline": "Tiêu đề cuốn hút chuẩn SEO sàn",
    "fullCleanText": "Toàn văn bản viết lại hoàn chỉnh, an toàn 100%, giữ nguyên USP, hấp dẫn, có bullet points rõ ràng, sẵn sàng copy",
    "sellingPoints": [
      "Điểm nổi bật 1 đã làm sạch",
      "Điểm nổi bật 2",
      "Điểm nổi bật 3"
    ],
    "safeCta": "Câu kêu gọi hành động an toàn chuẩn quy chế sàn",
    "wordCount": 180,
    "charCount": 1100
  },
  "tips": [
    "Lời khuyên thực chiến 1 cho ngành hàng này trên sàn",
    "Lời khuyên thực chiến 2",
    "Lời khuyên thực chiến 3"
  ],
  "safeTags": [
    "Cụm từ an toàn khuyên dùng 1",
    "Cụm từ an toàn khuyên dùng 2"
  ],
  "forbiddenTags": [
    "Từ cấm 1 cần né",
    "Từ cấm 2 cần né"
  ]
}`;

// -------------------------------------------------------------
// USER PROMPT BUILDER
// -------------------------------------------------------------
export function buildPolicyCheckerPrompt(inputs: PolicyCheckerInputs): string {
  const platform = inputs.platform || "TikTok Shop";
  const contentType = inputs.contentType || "Mô tả sản phẩm";
  const text = (inputs.text || "").trim();

  return `Hãy đóng vai Trưởng Ban Kiểm Duyệt Sàn TMĐT Đông Nam Á và tiến hành thẩm định chuyên sâu đoạn nội dung sau:

THÔNG TIN ĐẦU VÀO:
- Nền tảng đăng tải: ${platform}
- Loại nội dung: ${contentType}
- Nội dung cần soi từ cấm:
"""
${text}
"""

YÊU CẦU ĐẦU RA:
1. Đánh giá Mức độ rủi ro (CRITICAL / HIGH / MEDIUM / SAFE) và chấm điểm an toàn (0 - 100). Dự báo cụ thể các hình phạt sàn sẽ áp dụng nếu đăng nguyên bản.
2. Lập danh sách bóc tách TẤT CẢ các điểm vi phạm (dù là nhỏ nhất hoặc từ ngữ lách bot). Với mỗi điểm vi phạm, cung cấp lý do thuật toán AI sàn phạt và cụm từ thay thế an toàn 1-chạm ("replacementPhrase").
3. Viết lại một BẢN SẠCH HOÀN HẢO 100% (Safe Rewrite): Vừa né 100% từ cấm, vừa tối ưu tỷ lệ chuyển đổi bán hàng (High-Converting Copy) với headline bắt mắt, bullet points lợi ích và CTA hợp lệ.
4. Đưa ra 3-4 lời khuyên chuyên sâu thực chiến cho ${platform} cùng bộ từ khóa an toàn khuyên dùng và danh sách từ cấm cần né.
5. BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON HỢP LỆ 100% theo đúng Schema quy định.`;
}

// -------------------------------------------------------------
// BỘ PARSER 4 TẦNG BỀN BỈ (4-TIER RESILIENT PARSER)
// -------------------------------------------------------------

/**
 * Chuẩn hóa các ký tự điều khiển (newline, tab) chưa được escape bên trong chuỗi JSON
 */
export function escapeControlCharsInJsonStrings(str: string): string {
  if (!str) return "";
  let result = "";
  let inString = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escape) {
      result += ch;
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      result += ch;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString) {
      if (ch === "\n") {
        result += "\\n";
        continue;
      }
      if (ch === "\r") {
        result += "\\r";
        continue;
      }
      if (ch === "\t") {
        result += "\\t";
        continue;
      }
    }
    result += ch;
  }
  return result;
}

/**
 * Tự động sửa các dấu nháy kép unescaped bên trong string values của JSON
 * Sử dụng ngăn xếp ngữ cảnh (context stack) để phân biệt chính xác key vs value
 * Ví dụ: "reason": "Chứa từ "trị mụn dứt điểm" vi phạm" -> "reason": "Chứa từ \"trị mụn dứt điểm\" vi phạm"
 */
export function fixUnescapedQuotesInJson(jsonStr: string): string {
  if (!jsonStr) return "";

  let result = "";
  let inString = false;
  let inKey = false;
  let escape = false;
  const contextStack: ("OBJECT" | "ARRAY")[] = [];
  let expectValue = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];

    if (escape) {
      result += ch;
      escape = false;
      continue;
    }

    if (ch === "\\") {
      result += ch;
      escape = true;
      continue;
    }

    if (!inString) {
      if (ch === "{") {
        contextStack.push("OBJECT");
        expectValue = false;
        result += ch;
        continue;
      } else if (ch === "}") {
        if (contextStack.length > 0 && contextStack[contextStack.length - 1] === "OBJECT") {
          contextStack.pop();
        }
        expectValue = false;
        result += ch;
        continue;
      } else if (ch === "[") {
        contextStack.push("ARRAY");
        expectValue = true;
        result += ch;
        continue;
      } else if (ch === "]") {
        if (contextStack.length > 0 && contextStack[contextStack.length - 1] === "ARRAY") {
          contextStack.pop();
        }
        expectValue = false;
        result += ch;
        continue;
      } else if (ch === ":") {
        expectValue = true;
        result += ch;
        continue;
      } else if (ch === ",") {
        const currentCtx = contextStack[contextStack.length - 1];
        expectValue = currentCtx === "ARRAY";
        result += ch;
        continue;
      } else if (ch === '"') {
        inString = true;
        const currentCtx = contextStack[contextStack.length - 1];
        inKey = currentCtx === "OBJECT" && !expectValue;
        result += ch;
        continue;
      } else {
        result += ch;
        continue;
      }
    }

    // Đang ở trong chuỗi (inString === true)
    if (ch === '"') {
      let nextIdx = i + 1;
      while (nextIdx < jsonStr.length && /\s/.test(jsonStr[nextIdx])) {
        nextIdx++;
      }
      const nextChar = nextIdx < jsonStr.length ? jsonStr[nextIdx] : "";

      if (inKey) {
        if (nextChar === ":") {
          inString = false;
          inKey = false;
          result += ch;
        } else {
          result += '\\"';
        }
        continue;
      }

      // Đang ở trong Value string (trong object hoặc array)
      const currentCtx = contextStack[contextStack.length - 1];
      const isValidEnd =
        (currentCtx === "ARRAY" && (nextChar === "," || nextChar === "]" || nextChar === "")) ||
        (currentCtx === "OBJECT" && (nextChar === "," || nextChar === "}" || nextChar === "")) ||
        !currentCtx;

      if (isValidEnd) {
        if (nextChar === ",") {
          let afterCommaIdx = nextIdx + 1;
          while (afterCommaIdx < jsonStr.length && /\s/.test(jsonStr[afterCommaIdx])) {
            afterCommaIdx++;
          }
          const charAfterComma = afterCommaIdx < jsonStr.length ? jsonStr[afterCommaIdx] : "";
          const isValidNextToken =
            charAfterComma === '"' ||
            charAfterComma === "{" ||
            charAfterComma === "[" ||
            charAfterComma === "}" ||
            charAfterComma === "]" ||
            /\d|-|t|f|n/.test(charAfterComma);

          if (!isValidNextToken) {
            result += '\\"';
            continue;
          }
        }

        inString = false;
        result += ch;
      } else {
        result += '\\"';
      }
      continue;
    }

    result += ch;
  }

  return result;
}

/**
 * Làm sạch chuỗi JSON thô trước khi phân tích
 */
export function sanitizeRawJsonString(raw: string): string {
  if (!raw) return "";
  let cleaned = raw.trim();

  // Xóa Byte Order Mark (BOM) & zero-width spaces
  cleaned = cleaned.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Bóc tách markdown codeblock nếu có
  const codeblockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeblockMatch && codeblockMatch[1]) {
    cleaned = codeblockMatch[1].trim();
  } else {
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
  }
  cleaned = cleaned.trim();

  // Loại bỏ lời dẫn phía trước (tìm '{' đầu tiên) và lời kết phía sau (tìm '}' cuối cùng)
  const firstOpen = cleaned.indexOf("{");
  const lastClose = cleaned.lastIndexOf("}");
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  } else if (firstOpen !== -1) {
    cleaned = cleaned.substring(firstOpen);
  }

  // Chuẩn hóa ký tự điều khiển unescaped bên trong string values
  const withEscapedControls = escapeControlCharsInJsonStrings(cleaned);

  // Thử parse nhanh: nếu đã là JSON hợp lệ thì trả về ngay
  try {
    JSON.parse(withEscapedControls);
    return withEscapedControls;
  } catch {
    // Nếu bị lỗi (thường do unescaped quotes), dùng bộ fix stack-based
    const withFixedQuotes = fixUnescapedQuotesInJson(withEscapedControls);
    return withFixedQuotes;
  }
}

/**
 * Thuật toán cứu vãn JSON dở dang khi bị đứt token (Stack-based Resilient Parser)
 */
export function repairTruncatedJson(jsonStr: string): string {
  if (!jsonStr) return "";
  let str = jsonStr.trim();

  // Xóa BOM
  str = str.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Bóc tách markdown codeblock nếu có
  const codeblockMatch = str.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
  if (codeblockMatch && codeblockMatch[1]) {
    str = codeblockMatch[1].trim();
  }

  const firstOpen = str.indexOf("{");
  if (firstOpen === -1) return str;

  str = str.substring(firstOpen);
  str = fixUnescapedQuotesInJson(str);
  str = escapeControlCharsInJsonStrings(str);

  // Nếu bị đứt ngang ở một key hoặc dấu phẩy cuối
  str = str.replace(/,\s*"[^"]*":?\s*"?$/, "");

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

  if (inString) {
    str += '"';
  }

  str = str.replace(/,\s*$/, "");

  while (stack.length > 0) {
    const open = stack.pop();
    str = str.replace(/,\s*$/, "");
    if (open === "{") {
      str += "}";
    } else if (open === "[") {
      str += "]";
    }
  }

  str = str.replace(/,\s*([}\]])/g, "$1");

  return str;
}

/**
 * TẦNG 3: Phân tích kết quả Markdown định dạng cũ (Legacy Markdown Parser)
 * Đảm bảo 100% kết quả cũ từ dữ liệu lịch sử vẫn render mượt mà
 */
export function parseLegacyMarkdownToPolicyData(
  markdown: string,
  inputs?: PolicyCheckerInputs
): PolicyCheckerData {
  const rawText = markdown || "";
  const platform = inputs?.platform || "TikTok Shop";
  const contentType = inputs?.contentType || "Mô tả sản phẩm";
  const originalText = inputs?.text || "";

  const findSection = (keyword: string, nextKeywords: string[] = []) => {
    if (!rawText) return "";
    const match = rawText.match(
      new RegExp(`^[ \\t]*(?:##|\\*\\*|#)?\\s*[^\\n]*?${keyword}[^\\n]*$`, "im")
    );
    if (!match || match.index === undefined) return "";

    const contentStartIdx = match.index + match[0].length;
    const contentStart = rawText.slice(contentStartIdx);

    let endIdx = contentStart.length;
    for (const nextKw of nextKeywords) {
      const nextMatch = contentStart.match(
        new RegExp(`^[ \\t]*(?:---|##|\\*\\*|#)\\s*[^\\n]*?${nextKw}`, "im")
      );
      if (nextMatch && nextMatch.index !== undefined && nextMatch.index < endIdx) {
        endIdx = nextMatch.index;
      }
    }
    return contentStart.slice(0, endIdx).trim();
  };

  const s1Raw = findSection("ĐÁNH GIÁ RỦI RO", ["DANH SÁCH", "ĐIỂM VI PHẠM"]);
  const s2Raw = findSection("ĐIỂM VI PHẠM", ["BẢN VIẾT LẠI", "BẢN SẠCH"]);
  const s3Raw = findSection("BẢN VIẾT LẠI", ["LỜI KHUYÊN", "KHUYẾN NGHỊ"]);
  const s4Raw = findSection("LỜI KHUYÊN", []);

  // 1. Phân tích Audit
  let riskLevel: RiskAudit["riskLevel"] = "HIGH";
  let riskBadge = "⚠️ CẢNH BÁO - TỪ NGỮ NHẠY CẢM";
  let safetyScore = 30;
  let summary = "Phát hiện nội dung có nguy cơ vi phạm chính sách kiểm duyệt của sàn.";
  const violatedPolicies: string[] = [];
  const penaltyConsequences: string[] = [];

  if (s1Raw) {
    const riskMatch = s1Raw.match(/(?:Mức độ rủi ro|Rủi ro)\s*:\s*(.+)$/im);
    if (riskMatch) {
      const rawRisk = riskMatch[1].replace(/[*_]/g, "").trim();
      if (/nguy hiểm|khóa link|ăn gậy/i.test(rawRisk)) {
        riskLevel = "CRITICAL";
        riskBadge = "🚨 NGUY HIỂM - NGUY CƠ BỊ KHÓA LINK / ĂN GẬY VI PHẠM CAO";
      } else if (/cảnh báo|rủi ro cao/i.test(rawRisk)) {
        riskLevel = "HIGH";
        riskBadge = "⚠️ CẢNH BÁO - NGUY CƠ BỊ TỪ CHỐI DUYỆT";
      } else if (/nhẹ|trung bình/i.test(rawRisk)) {
        riskLevel = "MEDIUM";
        riskBadge = "⚡ BÓP TƯƠNG TÁC / GIẢM PHÂN PHỐI";
      } else {
        riskLevel = "SAFE";
        riskBadge = "✅ AN TOÀN - ĐẠT CHUẨN SÀN";
      }
    }

    const scoreMatch = s1Raw.match(/(?:Điểm an toàn|Điểm)\s*:\s*(\d+)/i);
    if (scoreMatch) {
      safetyScore = parseInt(scoreMatch[1], 10);
    } else {
      safetyScore = riskLevel === "SAFE" ? 95 : riskLevel === "MEDIUM" ? 65 : riskLevel === "HIGH" ? 35 : 15;
    }

    const sumMatch = s1Raw.match(/(?:Tóm tắt tình trạng|Tóm tắt)\s*:\s*(.+)$/im);
    if (sumMatch) summary = sumMatch[1].replace(/[*_]/g, "").trim();

    const polMatch = s1Raw.match(/(?:Các chính sách bị vi phạm|Chính sách vi phạm)\s*:\s*(.+)$/im);
    if (polMatch) {
      const rawPol = polMatch[1].replace(/[*_]/g, "").trim();
      rawPol.split(/[;,]/).forEach((p) => {
        const cleaned = p.trim();
        if (cleaned) violatedPolicies.push(cleaned);
      });
    }
  }

  if (riskLevel === "CRITICAL") {
    penaltyConsequences.push("Khóa sản phẩm hoặc xóa link vĩnh viễn");
    penaltyConsequences.push("Phạt điểm tiêu chuẩn người bán (Sao quả tạ / Gậy Shop)");
  } else if (riskLevel === "HIGH") {
    penaltyConsequences.push("Từ chối duyệt link hoặc yêu cầu sửa đổi");
    penaltyConsequences.push("Hạn chế tham gia các chiến dịch Flash Sale");
  } else if (riskLevel === "MEDIUM") {
    penaltyConsequences.push("Bóp lưu lượng tìm kiếm tự nhiên (Shadowban)");
  }

  // 2. Phân tích Bảng Vi Phạm
  const violations: ViolationItem[] = [];
  if (s2Raw) {
    const lines = s2Raw.split("\n");
    let count = 1;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const parts = trimmed.split("|").map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 3) {
          if (/^:?-+:?$/.test(parts[0]) || /từ ngữ|điểm vi phạm/i.test(parts[0])) continue;
          const phrase = parts[0].replace(/[*_"]/g, "").trim();
          const category = parts[1]?.replace(/[*_]/g, "").trim() || "Chính sách sàn";
          const reason = parts[2]?.replace(/[*_]/g, "").trim() || "";
          let solution = parts[3]?.replace(/[*_]/g, "").replace(/^Thay bằng:\s*/i, "").trim() || "";
          solution = solution.replace(/^["'“]/, "").replace(/["'”]$/, "").trim();

          let severity: RiskSeverity = "HIGH";
          let severityBadge = "⚠️ Rủi Ro Cao";
          let categoryKey: ViolationItem["categoryKey"] = "OTHER";

          if (/ngoài sàn|zalo|hotline|sđt|chuyển khoản|stk|tiền mặt/i.test(phrase + category)) {
            severity = "CRITICAL";
            severityBadge = "🚨 Nguy Cấp";
            categoryKey = "EXTERNAL_TRANSACTION";
          } else if (/100%|dứt điểm|thần dược|thuốc|chữa/i.test(phrase + category)) {
            severity = "CRITICAL";
            severityBadge = "🚨 Nguy Cấp";
            categoryKey = "MEDICAL_CURE";
          } else if (/số 1|nhất|top 1/i.test(phrase + category)) {
            severity = "HIGH";
            severityBadge = "⚠️ Rủi Ro Cao";
            categoryKey = "SUPERLATIVE";
          } else if (/gucci|chanel|nike|dior/i.test(phrase + category)) {
            severity = "HIGH";
            severityBadge = "⚠️ Rủi Ro Cao";
            categoryKey = "SENSITIVE_BRAND";
          } else if (/hoàn tiền|tặng tiền|trúng thưởng/i.test(phrase + category)) {
            severity = "HIGH";
            severityBadge = "⚠️ Rủi Ro Cao";
            categoryKey = "GIMMICK";
          }

          if (phrase) {
            violations.push({
              id: count++,
              phrase,
              category,
              categoryKey,
              severity,
              severityBadge,
              reason,
              solution,
              replacementPhrase: solution,
            });
          }
        }
      }
    }
  }

  // 3. Bản Viết Lại An Toàn
  let safeText = s3Raw.replace(/^\s*\*\([^*]+\)\*\s*/m, "").trim();
  safeText = safeText.replace(/^[*\-_"'\s]+|[*\-_"'\s]+$/g, "").trim();

  const lines = safeText.split("\n").filter(Boolean);
  const headline = lines[0] ? lines[0].replace(/^[#* \-_]+/, "").trim() : "Bản Viết Lại An Toàn Chuẩn Sàn";
  const sellingPoints: string[] = [];
  lines.forEach((l) => {
    const match = l.match(/^[-*•]\s*(.+)$/);
    if (match && sellingPoints.length < 5) {
      sellingPoints.push(match[1].replace(/[*_]/g, "").trim());
    }
  });

  const safeCta = "Quý khách vui lòng nhấn nút 'Chat ngay' để được hỗ trợ chuyên sâu và nhận ưu đãi tốt nhất!";

  // 4. Lời Khuyên & Tags
  const tips: string[] = [];
  if (s4Raw) {
    const tipLines = s4Raw.split("\n");
    for (const line of tipLines) {
      const match = line.match(/^[-*•\d.]+\s*(.+)$/);
      if (match) {
        const tip = match[1].replace(/[*_]/g, "").trim();
        if (tip) tips.push(tip);
      }
    }
  }

  const safeTags: string[] = [];
  const forbiddenTags: string[] = [];

  violations.forEach((v) => {
    if (v.phrase && !forbiddenTags.includes(v.phrase)) {
      forbiddenTags.push(v.phrase);
    }
    if (v.replacementPhrase && !safeTags.includes(v.replacementPhrase) && v.replacementPhrase.length < 40) {
      safeTags.push(v.replacementPhrase);
    }
  });

  return {
    platform,
    contentType,
    originalText,
    audit: {
      riskLevel,
      riskBadge,
      safetyScore,
      summary,
      violatedPolicies: violatedPolicies.length > 0 ? violatedPolicies : ["Quy chế vận hành & niêm yết sản phẩm sàn TMĐT"],
      penaltyConsequences: penaltyConsequences.length > 0 ? penaltyConsequences : ["Bóp hiển thị hoặc từ chối duyệt link"],
    },
    violations,
    rewrite: {
      headline,
      fullCleanText: safeText || "Nội dung đang được biên tập lại...",
      sellingPoints,
      safeCta,
      wordCount: safeText.split(/\s+/).filter(Boolean).length,
      charCount: safeText.length,
    },
    tips: tips.length > 0 ? tips : [
      "Luôn sử dụng nút Chat ngay trên sàn để tương tác với người mua.",
      "Không nhắc đến thông tin tài khoản ngân hàng hoặc số điện thoại ngoài sàn.",
      "Tuân thủ đúng quy định về công bố sản phẩm và luật quảng cáo.",
    ],
    safeTags,
    forbiddenTags,
  };
}

/**
 * Dựng kết quả PolicyCheckerData hoàn chỉnh 100% bằng bộ máy ngoại tuyến (Offline Rule Engine)
 * Tự động rà soát từ cấm và tạo bản làm sạch an toàn bằng từ điển chính sách sàn 2026
 */
export function buildOfflinePolicyData(
  rawText: string,
  platform: string = "TikTok Shop",
  contentType: string = "Mô tả sản phẩm"
): PolicyCheckerData {
  const text = rawText || "";
  const scanReport: ScanReport = scanTextForViolations(text);

  const violations: ViolationItem[] = scanReport.matches.map((m, idx) => ({
    id: idx + 1,
    phrase: m.matchedText,
    category: m.categoryLabel,
    categoryKey: m.category as any,
    severity: m.severity,
    severityBadge:
      m.severity === "CRITICAL"
        ? "🚨 Nguy Cấp"
        : m.severity === "HIGH"
        ? "⚠️ Rủi Ro Cao"
        : "⚡ Bóp Tương Tác",
    reason: m.reason,
    solution: m.suggestion,
    replacementPhrase: m.suggestion
      .replace(/^Thay bằng:\s*/i, "")
      .replace(/^Dùng từ\s*/i, "")
      .replace(/^Xóa\s*/i, "")
      .replace(/^["'“]+|["'”]+$/g, "")
      .trim(),
  }));

  const riskLevel: RiskAudit["riskLevel"] =
    scanReport.riskLevel === "DANGER"
      ? "CRITICAL"
      : scanReport.riskLevel === "WARNING"
      ? "HIGH"
      : "SAFE";

  const riskBadge =
    riskLevel === "CRITICAL"
      ? "🚨 NGUY HIỂM - NGUY CƠ BỊ KHÓA LINK / ĂN GẬY VI PHẠM CAO"
      : riskLevel === "HIGH"
      ? "⚠️ CẢNH BÁO - NGUY CƠ BỊ TỪ CHỐI DUYỆT"
      : "✅ AN TOÀN - ĐẠT CHUẨN SÀN";

  const forbiddenTags = Array.from(new Set(violations.map((v) => v.phrase)));
  const extractedSafeTags: string[] = [];
  violations.forEach((v) => {
    const quotes = v.solution.match(/['"“]([^'"”]+)['"”]/g);
    if (quotes && quotes.length > 0) {
      quotes.forEach((q) => {
        const cleanTag = q.replace(/['"“”]/g, "").trim();
        if (cleanTag && cleanTag.length < 40 && !extractedSafeTags.includes(cleanTag)) {
          extractedSafeTags.push(cleanTag);
        }
      });
    } else if (v.replacementPhrase && v.replacementPhrase.length < 40 && !extractedSafeTags.includes(v.replacementPhrase)) {
      extractedSafeTags.push(v.replacementPhrase);
    }
  });

  if (extractedSafeTags.length === 0) {
    extractedSafeTags.push("Chat ngay với shop", "Sản phẩm chính hãng", "Tư vấn trực tuyến");
  }
  const safeTags = extractedSafeTags;

  const offlineRewrite = generateOfflineSafeRewrite(text, scanReport, platform);

  return {
    platform,
    contentType,
    originalText: text,
    audit: {
      riskLevel,
      riskBadge,
      safetyScore: scanReport.score,
      summary:
        scanReport.totalViolations > 0
          ? `Hệ thống quét offline phát hiện ${scanReport.totalViolations} từ/cụm từ vi phạm chính sách sàn TMĐT. Đã kích hoạt bản làm sạch tự động an toàn.`
          : "Không phát hiện vi phạm từ cấm sàn TMĐT phổ biến. Nội dung cơ bản an toàn.",
      violatedPolicies:
        violations.length > 0
          ? Array.from(new Set(violations.map((v) => `Chính sách ${v.category}`)))
          : ["Quy chế vận hành & niêm yết sản phẩm sàn TMĐT 2026"],
      penaltyConsequences:
        riskLevel === "CRITICAL"
          ? [
              "Khóa link sản phẩm hoặc xóa sản phẩm vĩnh viễn",
              "Phạt điểm tiêu chuẩn người bán (Sao quả tạ / Điểm vi phạm TikTok Shop)",
            ]
          : riskLevel === "HIGH"
          ? [
              "Từ chối duyệt link hoặc yêu cầu sửa đổi mô tả",
              "Bóp lưu lượng hiển thị tự nhiên trong 7-14 ngày",
            ]
          : ["Đạt chuẩn an toàn chính sách niêm yết sản phẩm."],
    },
    violations,
    rewrite: {
      headline: offlineRewrite.headline,
      fullCleanText: offlineRewrite.fullCleanText,
      sellingPoints: offlineRewrite.sellingPoints,
      safeCta: offlineRewrite.safeCta,
      wordCount: offlineRewrite.fullCleanText.split(/\s+/).filter(Boolean).length,
      charCount: offlineRewrite.fullCleanText.length,
    },
    tips: [
      "Luôn tương tác và hướng dẫn khách mua hàng trực tiếp qua khung Chat chính thức của sàn.",
      "Không đưa số điện thoại cá nhân, Zalo hay thông tin tài khoản ngân hàng vào bài viết.",
      "Tránh cam kết 100% hoặc từ ngữ tuyệt đối hóa nếu không có hồ sơ kiểm định pháp lý.",
    ],
    safeTags,
    forbiddenTags,
  };
}

/**
 * TẦNG 4: Offline Rule Engine Fallback
 * Khi API rớt mạng hoặc đứt hoàn toàn, sử dụng từ điển regex offline để dựng kết quả
 */
export function parseOfflineRuleFallback(
  rawText: string,
  inputs?: PolicyCheckerInputs
): PolicyCheckerData {
  const text = inputs?.text || rawText || "";
  const platform = inputs?.platform || "TikTok Shop";
  const contentType = inputs?.contentType || "Mô tả sản phẩm";
  return buildOfflinePolicyData(text, platform, contentType);
}

/**
 * Chuẩn hóa dữ liệu object sau khi parse JSON thành công
 */
export function normalizePolicyCheckerData(
  parsed: any,
  inputs?: PolicyCheckerInputs
): PolicyCheckerData {
  const platform = parsed.platform || inputs?.platform || "TikTok Shop";
  const contentType = parsed.contentType || inputs?.contentType || "Mô tả sản phẩm";
  const originalText = parsed.originalText || inputs?.text || "";

  const rawAudit = parsed.audit || {};
  let score = typeof rawAudit.safetyScore === "number" ? rawAudit.safetyScore : 50;
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  let riskLevel: RiskAudit["riskLevel"] = "HIGH";
  if (rawAudit.riskLevel === "CRITICAL" || score < 40) riskLevel = "CRITICAL";
  else if (rawAudit.riskLevel === "HIGH" || score < 70) riskLevel = "HIGH";
  else if (rawAudit.riskLevel === "MEDIUM" || score < 90) riskLevel = "MEDIUM";
  else riskLevel = "SAFE";

  const audit: RiskAudit = {
    riskLevel,
    riskBadge:
      rawAudit.riskBadge ||
      (riskLevel === "CRITICAL"
        ? "🚨 NGUY HIỂM - NGUY CƠ BỊ KHÓA LINK / ĂN GẬY VI PHẠM CAO"
        : riskLevel === "HIGH"
        ? "⚠️ CẢNH BÁO - NGUY CƠ BỊ TỪ CHỐI DUYỆT"
        : riskLevel === "MEDIUM"
        ? "⚡ BÓP TƯƠNG TÁC / GIẢM PHÂN PHỐI"
        : "✅ AN TOÀN - ĐẠT CHUẨN SÀN"),
    safetyScore: score,
    summary: String(rawAudit.summary || "Báo cáo phân tích rủi ro chính sách sàn TMĐT."),
    violatedPolicies: Array.isArray(rawAudit.violatedPolicies)
      ? rawAudit.violatedPolicies.map(String)
      : ["Chính sách kiểm duyệt nội dung sàn TMĐT"],
    penaltyConsequences: Array.isArray(rawAudit.penaltyConsequences)
      ? rawAudit.penaltyConsequences.map(String)
      : ["Nguy cơ bị khóa sản phẩm hoặc bóp hiển thị"],
  };

  const violations: ViolationItem[] = Array.isArray(parsed.violations)
    ? parsed.violations.map((v: any, idx: number) => {
        const severity: RiskSeverity =
          v.severity === "CRITICAL" || v.severity === "HIGH" || v.severity === "MEDIUM" || v.severity === "LOW"
            ? v.severity
            : "HIGH";

        return {
          id: typeof v.id === "number" ? v.id : idx + 1,
          phrase: String(v.phrase || "").replace(/^["'“]+|["'”]+$/g, "").trim(),
          category: String(v.category || "Chính sách sàn").trim(),
          categoryKey: v.categoryKey || "OTHER",
          severity,
          severityBadge:
            v.severityBadge ||
            (severity === "CRITICAL"
              ? "🚨 Nguy Cấp"
              : severity === "HIGH"
              ? "⚠️ Rủi Ro Cao"
              : severity === "MEDIUM"
              ? "⚡ Bóp Tương Tác"
              : "ℹ️ Cảnh Báo"),
          reason: String(v.reason || "Vi phạm quy chế kiểm duyệt sàn TMĐT."),
          solution: String(v.solution || "Cần gỡ bỏ hoặc thay bằng từ ngữ an toàn."),
          replacementPhrase: String(v.replacementPhrase || v.solution || "").replace(/^Thay bằng:\s*/i, "").replace(/^["'“]+|["'”]+$/g, "").trim(),
        };
      }).filter((v: ViolationItem) => Boolean(v.phrase))
    : [];

  const rawRewrite = parsed.rewrite || {};
  const fullCleanText = String(rawRewrite.fullCleanText || rawRewrite.text || "").trim();
  const rewrite: SafeRewriteData = {
    headline: String(rawRewrite.headline || "Bản Viết Lại An Toàn 100%").trim(),
    fullCleanText: fullCleanText || "Bản viết lại đang được tối ưu hóa...",
    sellingPoints: Array.isArray(rawRewrite.sellingPoints)
      ? rawRewrite.sellingPoints.map(String)
      : [],
    safeCta: String(
      rawRewrite.safeCta ||
        "Quý khách vui lòng nhấn nút 'Chat ngay' để được hỗ trợ chuyên sâu và nhận ưu đãi tốt nhất!"
    ),
    wordCount: fullCleanText ? fullCleanText.split(/\s+/).filter(Boolean).length : 0,
    charCount: fullCleanText.length,
  };

  const tips: string[] = Array.isArray(parsed.tips)
    ? parsed.tips.map(String)
    : [
        "Luôn sử dụng kênh Chat chính thức của sàn để trao đổi thông tin với khách hàng.",
        "Không dùng các cam kết 100% hiệu quả y khoa đối với sản phẩm mỹ phẩm / thực phẩm.",
        "Tuân thủ đúng quy định đổi trả và chính sách người bán của sàn.",
      ];

  const safeTags: string[] = Array.isArray(parsed.safeTags)
    ? parsed.safeTags.map(String)
    : violations.map((v) => v.replacementPhrase).filter(Boolean);

  const forbiddenTags: string[] = Array.isArray(parsed.forbiddenTags)
    ? parsed.forbiddenTags.map(String)
    : violations.map((v) => v.phrase).filter(Boolean);

  return {
    platform,
    contentType,
    originalText,
    audit,
    violations,
    rewrite,
    tips,
    safeTags,
    forbiddenTags,
  };
}

/**
 * Parser chính 4 tầng bền bỉ cho Policy Checker
 */
export function parsePolicyCheckerResult(
  rawResult: string,
  inputs?: PolicyCheckerInputs
): PolicyCheckerData {
  if (!rawResult || !rawResult.trim()) {
    if (inputs?.text && inputs.text.trim()) {
      return buildOfflinePolicyData(inputs.text, inputs.platform, inputs.contentType);
    }
    return SAMPLE_POLICY_DATA;
  }

  const sanitized = sanitizeRawJsonString(rawResult);

  // TẦNG 1: Native JSON Parse
  try {
    const parsed = JSON.parse(sanitized);
    if (parsed && (parsed.audit || parsed.violations || parsed.rewrite)) {
      return normalizePolicyCheckerData(parsed, inputs);
    }
  } catch {
    // Chuyển sang Tầng 2
  }

  // TẦNG 2: Stack-based Truncated JSON Repair
  try {
    const repaired = repairTruncatedJson(rawResult);
    const parsed = JSON.parse(repaired);
    if (parsed && (parsed.audit || parsed.violations || parsed.rewrite)) {
      return normalizePolicyCheckerData(parsed, inputs);
    }
  } catch {
    // Chuyển sang Tầng 3
  }

  // TẦNG 3: Legacy Markdown Fallback (Hỗ trợ 100% dữ liệu lịch sử)
  if (
    rawResult.includes("ĐÁNH GIÁ RỦI RO") ||
    rawResult.includes("ĐIỂM VI PHẠM") ||
    rawResult.includes("BẢN VIẾT LẠI") ||
    rawResult.includes("## 1.") ||
    rawResult.includes("## 2.")
  ) {
    try {
      const legacyData = parseLegacyMarkdownToPolicyData(rawResult, inputs);
      if (legacyData && (legacyData.violations.length > 0 || legacyData.rewrite.fullCleanText)) {
        return legacyData;
      }
    } catch {
      // Chuyển sang Tầng 4
    }
  }

  // TẦNG 4: Offline Rule Fallback
  try {
    return parseOfflineRuleFallback(rawResult, inputs);
  } catch {
    if (inputs?.text && inputs.text.trim()) {
      return buildOfflinePolicyData(inputs.text, inputs.platform, inputs.contentType);
    }
    return SAMPLE_POLICY_DATA;
  }
}

/**
 * Làm sạch, xác thực và chuẩn hóa JSON đầu ra ngay tại API Router trước khi lưu DB/trả về client
 */
export function cleanAndValidatePolicyOutput(
  rawText: string,
  inputs?: PolicyCheckerInputs
): string {
  if (!rawText || !rawText.trim()) return rawText;

  try {
    const data = parsePolicyCheckerResult(rawText, inputs);
    return JSON.stringify(data);
  } catch (err) {
    console.error("cleanAndValidatePolicyOutput_error", err);
    return rawText;
  }
}
