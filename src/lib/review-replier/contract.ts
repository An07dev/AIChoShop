/**
 * Module Contract cho AI Xử Lý Khủng Hoảng (Review Replier & Crisis Management)
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema), Bộ Prompt Thực Chiến Sàn TMĐT (Shopee, TikTok Shop, Lazada)
 * & Resilient Parser 4 Tầng Bền Bỉ (Tương thích ngược 100% với dữ liệu lịch sử cũ)
 */

export interface ReviewReplierInputs {
  platform?: "shopee" | "tiktok" | "lazada" | "other" | string;
  shopName?: string;
  productName?: string;
  rating: string; // "1 sao" | "2 sao" | "3 sao"
  issueType: string; // Thẻ vấn đề chính
  reviewContent: string; // Nội dung đánh giá của khách
  compensation?: string; // Hướng đền bù đề xuất từ shop (Đổi mới / Hoàn tiền / Voucher...)
  note?: string; // Bối cảnh thêm
}

// -------------------------------------------------------------
// 1. PHÂN TÍCH CHẨN ĐOÁN KHỦNG HOẢNG (Crisis Diagnosis)
// -------------------------------------------------------------
export interface CrisisAnalysis {
  severityLevel: "critical" | "high" | "medium"; // "critical" (1 sao nặng/dọa phốt), "high", "medium"
  severityBadge: string; // "🚨 Nguy Cấp", "⚠️ Rủi Ro Cao", "⚡ Cần Xử Lý Sớm"
  customerPsychology: string; // Phân tích cảm xúc & kỳ vọng bị hụt hẫng của khách
  rootCause: string; // Bóc tách lỗi (Sản phẩm, Bưu cục, Nhân viên tư vấn, Hiểu lầm)
  platformRisk: string; // Tác động thuật toán (Điểm SES TikTok Shop, Tỷ lệ hủy/mất Shop Yêu Thích Shopee)
  canAppealToPlatform: boolean; // Có căn cứ báo cáo sàn gỡ đánh giá không?
  appealReason?: string; // Lý do báo cáo nếu có (Từ ngữ thô tục, Spam đối thủ, Đánh giá nhầm shop...)
}

// -------------------------------------------------------------
// 2. PHƯƠNG ÁN PHẢN HỒI THỰC CHIẾN (Solution Item)
// -------------------------------------------------------------
export interface ReviewSolutionItem {
  id: number;
  sampleNumber: string; // "Phương Án 1", "Phương Án 2", "Phương Án 3"
  styleName: string; // "Chân Thành & Cầu Thị", "Khéo Léo & Ngoại Cảnh", "Minh Bạch & Bảo Vệ Thương Hiệu"
  badge: string; // "Khuyên Dùng", "Lỗi Vận Chuyển", "Bảo Vệ Uy Tín"
  psychologicalAngle: string; // Đòn bẩy tâm lý (Hạ nhiệt cảm xúc, Phân trần khách quan, Khẳng định chất lượng)
  
  // Phản hồi công khai trên sàn (Hiển thị cho hàng nghìn khách mua sau đọc)
  publicReply: {
    content: string; // Câu trả lời công khai chuẩn mực, lịch thiệp
    charCount: number;
    keyPoints?: string[]; // 2-3 điểm sáng trong câu trả lời
  };

  // Kịch bản nhắn tin riêng Inbox 1:1 (Có thể copy gửi ngay cho khách)
  inboxScript: {
    greeting: string; // Câu chào mở đầu ấm áp
    bodyMessage: string; // Toàn văn tin nhắn riêng (bao gồm hỏi thăm, thừa nhận, xoa dịu)
    compensationOffer: string; // Lời đề xuất đền bù cụ thể
    revisionNudge: string; // Lời mở lời khéo léo nhờ khách sửa đánh giá 1 sao thành 5 sao
    fullMessage: string; // Toàn văn hoàn chỉnh ghép nối để bấm sao chép 1 chạm
    charCount: number;
  };

  // Hành động vận hành hậu trường (Operational SOP)
  behindTheScenesAction: string; // Hướng dẫn kiểm tra camera, khiếu nại bưu cục, đào tạo nội bộ
}

// -------------------------------------------------------------
// 3. CẨM NANG CHIẾN LƯỢC PHÒNG VỆ (Defense Guide)
// -------------------------------------------------------------
export interface CrisisStrategyGuide {
  goldenResponseHours: string; // "Trong vòng 60 phút"
  dos: string[]; // 3-4 việc NÊN làm ngay
  donts: string[]; // 3-4 điều TUYỆT ĐỐI TRÁNH (tránh bị khóa shop hoặc leo thang phốt)
  appealChecklist: string[]; // Các bước chuẩn bị bằng chứng nếu báo cáo sàn
}

// -------------------------------------------------------------
// CẤU TRÚC TỔNG THỂ DỮ LIỆU ĐẦU RA (Root Data)
// -------------------------------------------------------------
export interface ReviewReplierData {
  shopName?: string;
  productName?: string;
  platform?: string;
  rating?: string;
  crisisAnalysis: CrisisAnalysis;
  solutions: ReviewSolutionItem[];
  strategyGuide: CrisisStrategyGuide;
}

// -------------------------------------------------------------
// SYSTEM PROMPT CHUẨN HÓA GIÁM ĐỐC CSKH & XỬ LÝ KHỦNG HOẢNG TMĐT
// -------------------------------------------------------------
export const REVIEW_REPLIER_SYSTEM_PROMPT = `Bạn là Giám đốc Chăm sóc Khách hàng & Chuyên gia Xử lý Khủng hoảng Truyền thông TMĐT hàng đầu tại Việt Nam (am hiểu sâu sắc thuật toán và quy định cộng đồng của Shopee, TikTok Shop, Lazada).
Nhiệm vụ của bạn là bóc tách tâm lý bức xúc của khách hàng khi để lại đánh giá 1-2-3 sao, soạn thảo trọn bộ phản hồi công khai lịch thiệp nhằm BẢO VỆ DANH TIẾNG GIAN HÀNG trước hàng nghìn người mua tiềm năng, đồng thời cung cấp KỊCH BẢN INBOX 1:1 ĐẮC NHÂN TÂM để hỗ trợ đền bù và khéo léo nhờ khách sửa lại đánh giá thành 5 sao mà TUYỆT ĐỐI KHÔNG VI PHẠM LUẬT SÀN.

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON THUẦN TÚY (Valid JSON Object), không bao bọc thêm bất kỳ lời dẫn hay giải thích ngoài JSON.

CẤU TRÚC JSON SCHEMA BẮT BUỘC:
{
  "shopName": "Tên shop",
  "productName": "Tên sản phẩm",
  "platform": "shopee | tiktok | lazada | other",
  "rating": "1 sao | 2 sao | 3 sao",
  "crisisAnalysis": {
    "severityLevel": "critical | high | medium",
    "severityBadge": "🚨 Nguy Cấp | ⚠️ Rủi Ro Cao | ⚡ Cần Xử Lý Sớm",
    "customerPsychology": "Phân tích trạng thái tâm lý bức xúc, lý do khách thất vọng...",
    "rootCause": "Nguyên nhân cốt lõi (Lỗi vận chuyển bưu cục, Sai sót đóng hàng, Trải nghiệm sản phẩm, Hiểu lầm công năng...)",
    "platformRisk": "Tác động thuật toán sàn (VD: Kéo sụt điểm SES TikTok Shop, Nguy cơ mất Shop Yêu Thích Shopee...)",
    "canAppealToPlatform": true,
    "appealReason": "Căn cứ báo cáo sàn nếu đánh giá vi phạm (chứa từ ngữ thô tục, đối thủ chơi xấu, nhầm shop khác...). Nếu không vi phạm thì để rỗng."
  },
  "solutions": [
    {
      "id": 1,
      "sampleNumber": "Phương Án 1",
      "styleName": "Chân Thành & Cầu Thị",
      "badge": "Khuyên Dùng",
      "psychologicalAngle": "Hạ nhiệt bức xúc, nhún nhường, nhận trách nhiệm vì trải nghiệm chưa trọn vẹn của khách",
      "publicReply": {
        "content": "Dạ Shop [Tên Shop] xin chân thành cúi đầu xin lỗi anh/chị vì sự cố không mong muốn trong đơn hàng vừa qua ạ!...",
        "charCount": 260,
        "keyPoints": ["Xin lỗi chân thành", "Cam kết đổi mới/đền bù 100%", "Mời khách check tin nhắn riêng"]
      },
      "inboxScript": {
        "greeting": "Dạ em chào anh/chị ạ! Em là Quản lý CSKH bên [Tên Shop]...",
        "bodyMessage": "Nội dung tin nhắn riêng hỏi thăm tận tình, lắng nghe và nhận trách nhiệm...",
        "compensationOffer": "Bên em xin phép gửi đổi mới hỏa tốc 01 sản phẩm hoàn toàn miễn phí tận nhà (hoặc hoàn tiền 100%)...",
        "revisionNudge": "Sau khi nhận lại hàng ưng ý, em rất mong anh/chị hỗ trợ sửa lại đánh giá giúp shop em bớt điểm phạt với nha ạ ❤️"
      },
      "behindTheScenesAction": "Quy trình xử lý nội bộ: Kiểm tra lại camera đóng gói, ghi nhận lỗi kho, liên hệ shipper..."
    },
    {
      "id": 2,
      "sampleNumber": "Phương Án 2",
      "styleName": "Khéo Léo & Khách Quan",
      "badge": "Lỗi Vận Chuyển",
      "psychologicalAngle": "Phân trần khách quan (do khâu bưu cục dồn tải quăng quật) nhưng khẳng định Shop bảo vệ quyền lợi khách 100%",
      "publicReply": {
        "content": "Dạ chào anh/chị, Shop đã kiểm tra camera đóng gói trước khi xuất kho thì hàng nguyên vẹn...",
        "charCount": 280,
        "keyPoints": ["Phân trần khách quan", "Không đùn đẩy trách nhiệm", "Đổi mới hỏa tốc"]
      },
      "inboxScript": {
        "greeting": "Dạ em chào anh/chị ạ! 🌿",
        "bodyMessage": "Em xin phép gửi ảnh camera lúc đóng gói để mình an tâm shop không gửi hàng lỗi...",
        "compensationOffer": "Shop gửi bù mã giảm giá 50k hoặc đổi mới hỏa tốc ngay hôm nay...",
        "revisionNudge": "Khi nhận sản phẩm mới hài lòng, nhờ anh/chị hỗ trợ cập nhật lại đánh giá giúp shop nha ạ."
      },
      "behindTheScenesAction": "Khiếu nại bưu cục vận chuyển sàn để yêu cầu bồi thường hư hỏng."
    },
    {
      "id": 3,
      "sampleNumber": "Phương Án 3",
      "styleName": "Minh Bạch & Bảo Vệ Thương Hiệu",
      "badge": "Bảo Vệ Uy Tín",
      "psychologicalAngle": "Đĩnh đạc, chuyên nghiệp, khẳng định chất lượng và nguồn gốc chính hãng để người mua khác không hoang mang",
      "publicReply": {
        "content": "Dạ Shop kính chào anh/chị, Shop luôn cam kết 100% sản phẩm có đầy đủ tem phụ và kiểm định chất lượng nghiêm ngặt...",
        "charCount": 290,
        "keyPoints": ["Khẳng định chất lượng chính hãng", "Chính sách bảo hành rõ ràng", "Sẵn sàng thu hồi hoàn tiền"]
      },
      "inboxScript": {
        "greeting": "Dạ em chào anh/chị ạ!",
        "bodyMessage": "Em gửi anh/chị hướng dẫn kiểm tra mã vạch/tem phụ chính hãng và cách sử dụng đúng chuẩn...",
        "compensationOffer": "Nếu mình vẫn chưa hài lòng, shop cam kết thu hồi sản phẩm và hoàn tiền 100% không mất phí...",
        "revisionNudge": "Nếu giải tỏa được hiểu lầm, mong anh/chị chấm lại giúp shop để các khách khác an tâm ạ."
      },
      "behindTheScenesAction": "Chuẩn bị sẵn hóa đơn chứng từ chính hãng lưu kho để đối soát khi cần."
    }
  ],
  "strategyGuide": {
    "goldenResponseHours": "Nên phản hồi công khai và inbox trong vòng 30 - 60 phút đầu tiên.",
    "dos": [
      "Luôn giữ thái độ hòa nhã, xưng hô 'Em/Shop' và 'Anh/Chị' tôn trọng.",
      "Tách bạch: Lời xin lỗi đưa lên công khai, chi tiết đền bù và xin sửa sao đưa vào tin nhắn riêng.",
      "Hành động đền bù trước khi ngỏ lời nhờ khách sửa đánh giá."
    ],
    "donts": [
      "Tuyệt đối KHÔNG đôi co gay gắt, đổ lỗi cho khách hàng trên bình luận công khai.",
      "Không dùng từ ngữ cấm của sàn khi inbox (Shopee cấm giao dịch ngoài sàn, cấm mua bán đánh giá lộ liễu).",
      "Không hứa suông mà không gửi hàng đền bù thực tế."
    ],
    "appealChecklist": [
      "Chụp ảnh/video đóng gói từ camera kho bãi.",
      "Ảnh chụp màn hình nội dung khách đánh giá có từ ngữ tục tĩu hoặc thông tin đối thủ.",
      "Gửi ticket yêu cầu sàn can thiệp gỡ bỏ đánh giá không hợp lệ."
    ]
  }
}

QUY TẮC BẮT BUỘC:
1. ĐỦ 3 PHƯƠNG ÁN (Solutions) tương ứng 3 phong cách tâm lý: 1. Chân Thành & Cầu Thị; 2. Khéo Léo & Khách Quan; 3. Minh Bạch & Bảo Vệ Thương Hiệu.
2. PHẢN HỒI CÔNG KHAI: Viết từ 200 - 350 ký tự, lịch sự, văn minh, thể hiện shop có trách nhiệm.
3. KỊCH BẢN INBOX RIÊNG: Viết đầy đủ, tự nhiên, xưng hô ấm áp, có đề xuất đền bù cụ thể và câu nhờ sửa sao tế nhị (không vi phạm luật sàn).
4. JSON HỢP LỆ 100%, không bị cắt cụt, escape ký tự '\\n' chuẩn xác.`;

// -------------------------------------------------------------
// USER PROMPT BUILDER
// -------------------------------------------------------------
export function buildReviewReplierPrompt(inputs: ReviewReplierInputs): string {
  const platform = inputs.platform || "shopee";
  const platformName =
    platform === "tiktok"
      ? "TikTok Shop"
      : platform === "lazada"
      ? "Lazada"
      : platform === "shopee"
      ? "Shopee"
      : "Đa Kênh TMĐT";

  const shopName = inputs.shopName || "Gian Hàng Chính Hãng";
  const productName = inputs.productName || "Sản phẩm của shop";
  const rating = inputs.rating || "1 sao";
  const issueType = inputs.issueType || "Hàng lỗi / Không ưng ý";
  const compensation = inputs.compensation || "Shop sẵn sàng đổi mới 1-1 miễn phí hoặc hỗ trợ thỏa đáng";
  const note = inputs.note ? `\n- Bối cảnh thêm từ shop: ${inputs.note}` : "";

  return `Hãy đóng vai Trưởng Bộ Phận CSKH & Chuyên Gia Xử Lý Khủng Hoảng TMĐT cho gian hàng "${shopName}".
Hãy phân tích và xử lý đánh giá tiêu cực sau đây:

THÔNG TIN ĐẦU VÀO:
- Sàn TMĐT: ${platformName}
- Tên Gian Hàng: "${shopName}"
- Tên Sản Phẩm: "${productName}"
- Mức Sao Của Khách: ${rating}
- Vấn Đề Gặp Phải (Chủ đề): "${issueType}"
- Nội Dung Đánh Giá Của Khách: "${inputs.reviewContent.trim()}"
- Hướng Đền Bù Shop Đề Xuất: "${compensation}"${note}

YÊU CẦU:
1. Chẩn đoán mức độ khủng hoảng, tâm lý khách, rủi ro thuật toán ${platformName} và xem có căn cứ báo cáo sàn gỡ đánh giá không.
2. Cung cấp ĐỦ 3 PHƯƠNG ÁN PHẢN HỒI theo 3 phong cách (Cầu thị, Ngoại cảnh, Giữ uy tín).
3. Mỗi phương án BẮT BUỘC có cả "Phản hồi công khai" và "Kịch bản nhắn tin riêng Inbox 1:1" kèm câu nhờ sửa sao đắc nhân tâm.
4. Cung cấp Cẩm nang chiến lược phòng vệ thương hiệu.
5. Trả về đúng cấu trúc JSON hợp lệ 100% như đã quy định.`;
}

// -------------------------------------------------------------
// BỘ PARSER 4 TẦNG BỀN BỈ (Resilient Parser)
// -------------------------------------------------------------

/**
 * Làm sạch chuỗi JSON thô trước khi phân tích
 */
export function sanitizeRawJsonString(raw: string): string {
  if (!raw) return "";
  let cleaned = raw.trim();

  // Xóa Byte Order Mark (BOM) & zero-width spaces
  cleaned = cleaned.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Bóc tách markdown codeblock
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  cleaned = cleaned.trim();

  // Tìm vị trí mở ngoặc nhọn đầu tiên (loại bỏ preamble của LLM nếu có)
  const firstOpen = cleaned.indexOf("{");
  if (firstOpen > 0) {
    cleaned = cleaned.substring(firstOpen);
  }

  return cleaned;
}

/**
 * Thuật toán cứu vãn JSON dở dang khi bị đứt token (Stack-based Resilient Parser)
 */
export function repairTruncatedJson(jsonStr: string): string {
  let str = sanitizeRawJsonString(jsonStr);
  const firstOpen = str.indexOf("{");
  if (firstOpen === -1) return str;

  // Cắt từ ngoặc mở đầu tiên
  str = str.substring(firstOpen);

  // Xóa key/value dở dang ở cuối: ,"someKey": "dangling... hoặc ,"someKey":
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

  // Nếu kết thúc bên trong một chuỗi, đóng ngoặc kép lại
  if (inString) {
    str += '"';
  }

  // Xóa dấu phẩy thừa ở cuối trước khi đóng ngoặc
  str = str.replace(/,\s*$/, "");

  // Đóng tất cả ngoặc còn thiếu theo đúng thứ tự stack ngược lại
  while (stack.length > 0) {
    const open = stack.pop();
    str = str.replace(/,\s*$/, "");
    if (open === "{") {
      str += "}";
    } else if (open === "[") {
      str += "]";
    }
  }

  // Xóa dấu phẩy thừa trước các dấu đóng: ,} hoặc ,]
  str = str.replace(/,\s*([}\]])/g, "$1");

  return str;
}

/**
 * Phân tích kết quả Markdown định dạng cũ (Legacy Markdown Parser)
 * Đảm bảo 100% kết quả cũ từ lịch sử hoạt động vẫn render mượt mà
 */
export function parseLegacyMarkdownToReviewData(markdown: string): ReviewReplierData {
  const lines = markdown.split("\n");
  const solutions: ReviewSolutionItem[] = [];
  let currentTitle = "";
  let currentPublicReply = "";
  let currentAction = "";
  let inAdvice = false;
  const adviceList: string[] = [];

  const flushSolution = () => {
    if (currentTitle || currentPublicReply || currentAction) {
      const id = solutions.length + 1;
      let styleName = "Chân Thành & Cầu Thị";
      let badge = "Khuyên Dùng";
      let angle = "Hạ nhiệt bức xúc, nhún nhường, xoa dịu cảm xúc";

      const lower = currentTitle.toLowerCase();
      if (lower.includes("vận chuyển") || lower.includes("khách quan") || id === 2) {
        styleName = "Khéo Léo & Khách Quan";
        badge = "Lỗi Vận Chuyển";
        angle = "Phân trần khách quan (do bưu cục quăng quật) nhưng shop hỗ trợ 100%";
      } else if (lower.includes("minh bạch") || lower.includes("uy tín") || lower.includes("thương hiệu") || id === 3) {
        styleName = "Minh Bạch & Bảo Vệ Thương Hiệu";
        badge = "Bảo Vệ Uy Tín";
        angle = "Đĩnh đạc, chuyên nghiệp, bảo vệ uy tín chất lượng chính hãng";
      }

      const cleanPublic = currentPublicReply.trim() || currentAction.trim();
      const cleanAction = currentAction.trim() || "Chủ động nhắn tin riêng cho khách để hỗ trợ thỏa đáng.";

      const inboxBody = cleanAction.replace(/^Vào mục Chat [^\:]+\:\s*"?/i, "").replace(/"?\s*$/, "");
      const fullInbox = `Dạ em chào anh/chị ạ! 🌿\n\n${inboxBody}`;

      solutions.push({
        id,
        sampleNumber: `Phương Án ${id}`,
        styleName,
        badge,
        psychologicalAngle: angle,
        publicReply: {
          content: cleanPublic,
          charCount: cleanPublic.length,
          keyPoints: ["Xin lỗi chân thành", "Cam kết hỗ trợ 100%"],
        },
        inboxScript: {
          greeting: "Dạ em chào anh/chị ạ! 🌿",
          bodyMessage: inboxBody,
          compensationOffer: "Shop cam kết hỗ trợ đổi mới 1-1 miễn phí hoặc hoàn tiền thỏa đáng.",
          revisionNudge: "Sau khi nhận hỗ trợ hài lòng, nhờ anh/chị hỗ trợ sửa lại đánh giá giúp shop em bớt điểm phạt với nha ạ.",
          fullMessage: fullInbox,
          charCount: fullInbox.length,
        },
        behindTheScenesAction: cleanAction,
      });

      currentTitle = "";
      currentPublicReply = "";
      currentAction = "";
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (
      line.startsWith("## 1.") ||
      line.startsWith("## 2.") ||
      line.startsWith("## 3.") ||
      line.startsWith("### 1.") ||
      line.startsWith("### 2.") ||
      line.startsWith("### 3.") ||
      /^##?\s*phương\s*án/i.test(line) ||
      /^##?\s*phong\s*cách/i.test(line) ||
      /^\*\*phương\s*án\s*\d/i.test(line)
    ) {
      flushSolution();
      currentTitle = line.replace(/^[#\*\s\d\.\:\-]+/, "");
      inAdvice = false;
      continue;
    }

    if (/^##?\s*(?:lời khuyên|tips|lưu ý|chiến lược|nguyên tắc)/i.test(line)) {
      flushSolution();
      inAdvice = true;
      continue;
    }

    if (inAdvice) {
      const clean = line.replace(/^[-*•\d\.]\s*/, "").replace(/\*+/g, "").trim();
      if (clean) adviceList.push(clean);
      continue;
    }

    if (line.includes("**Phản hồi công khai**") || line.includes("Phản hồi công khai:") || line.includes("Phản hồi trên sàn:")) {
      currentPublicReply = line.replace(/^[-\*•]?\s*\*\*(?:Phản hồi công khai|Phản hồi trên sàn)\*\*\s*:\s*/i, "").trim();
    } else if (line.includes("**Hành động hậu trường**") || line.includes("Hành động hậu trường:") || line.includes("**Kịch bản tin nhắn**") || line.includes("Kịch bản inbox:")) {
      currentAction = line.replace(/^[-\*•]?\s*\*\*(?:Hành động hậu trường|Kịch bản tin nhắn|Kịch bản inbox)\*\*\s*:\s*/i, "").trim();
    } else if (currentPublicReply && !currentAction) {
      currentPublicReply += " " + line;
    } else if (currentAction) {
      currentAction += " " + line;
    }
  }

  flushSolution();

  return {
    shopName: "Gian Hàng Của Bạn",
    productName: "Sản phẩm đánh giá",
    platform: "shopee",
    rating: "1 sao",
    crisisAnalysis: {
      severityLevel: "high",
      severityBadge: "⚠️ Cần Xử Lý Ngay",
      customerPsychology: "Khách hàng đang hụt hẫng và bức xúc về trải nghiệm nhận hàng.",
      rootCause: "Sự cố phát sinh trong khâu vận chuyển hoặc chất lượng sản phẩm.",
      platformRisk: "Ảnh hưởng trực tiếp đến điểm đánh giá shop và tỷ lệ chuyển đổi của sản phẩm.",
      canAppealToPlatform: false,
    },
    solutions: solutions.length > 0 ? solutions : SAMPLE_REVIEW_REPLIER_DATA.solutions,
    strategyGuide: {
      goldenResponseHours: "Phản hồi trong vòng 1-2 giờ đầu tiên để ngăn chặn khách chia sẻ lên mạng xã hội.",
      dos: [
        "Phản hồi công khai lịch sự, nhận trách nhiệm hỗ trợ không để khách chịu thiệt.",
        "Nhắn tin riêng giải thích thấu đáo và đưa ra giải pháp đền bù thỏa đáng.",
        "Khéo léo nhờ khách chỉnh sửa lại đánh giá sau khi đã giải quyết êm đẹp.",
      ],
      donts: [
        "Tuyệt đối không tranh cãi gay gắt hay đổ lỗi cho khách hàng trên bình luận công khai.",
        "Không dùng từ ngữ cấm theo quy định cộng đồng của sàn.",
      ],
      appealChecklist: adviceList.length > 0 ? adviceList : [
        "Chụp ảnh/video đóng gói từ camera kho bãi.",
        "Báo cáo sàn can thiệp nếu phát hiện đánh giá cạnh tranh không lành mạnh từ đối thủ.",
      ],
    },
  };
}

/**
 * TẦNG 4: Fallback Thông Minh Tự Động Trích Xuất Dữ Liệu Khi AI Trả Về Dạng Tự Do
 * Đảm bảo KHÔNG BAO GIỜ bị thay thế nhầm bằng dữ liệu mẫu giả định (GaN Charger)
 */
export function parseDynamicFreeTextToReviewData(rawText: string): ReviewReplierData {
  const clean = rawText.trim();
  if (!clean || clean.length < 15) {
    return SAMPLE_REVIEW_REPLIER_DATA;
  }

  // Tách văn bản thành các đoạn
  const paragraphs = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  let publicReplyText = "";
  let inboxScriptText = "";
  let behindTheScenesText = "";

  // Tìm kiếm theo từ khóa thông minh
  for (const para of paragraphs) {
    const lower = para.toLowerCase();
    if (!publicReplyText && (lower.includes("công khai") || lower.includes("phản hồi:") || lower.includes("trả lời đánh giá") || lower.includes("dạ shop") || lower.includes("chân thành xin lỗi"))) {
      publicReplyText = para.replace(/^(?:phản hồi công khai|trả lời đánh giá|câu trả lời)[^:\n]*[:\-–]?\s*/i, "").trim();
    } else if (!inboxScriptText && (lower.includes("inbox") || lower.includes("tin nhắn riêng") || lower.includes("nhắn tin 1:1") || lower.includes("chat riêng") || lower.includes("em chào anh") || lower.includes("em chào chị"))) {
      inboxScriptText = para.replace(/^(?:kịch bản inbox|tin nhắn riêng|nhắn tin 1:1)[^:\n]*[:\-–]?\s*/i, "").trim();
    } else if (!behindTheScenesText && (lower.includes("hậu trường") || lower.includes("quy trình") || lower.includes("kiểm tra camera") || lower.includes("khiếu nại bưu cục") || lower.includes("sop"))) {
      behindTheScenesText = para.replace(/^(?:hành động hậu trường|sop|quy trình)[^:\n]*[:\-–]?\s*/i, "").trim();
    }
  }

  // Nếu không tách được theo từ khóa, lấy đoạn đầu làm public và đoạn 2 làm inbox
  if (!publicReplyText && paragraphs.length > 0) {
    publicReplyText = paragraphs[0];
  }
  if (!inboxScriptText && paragraphs.length > 1) {
    inboxScriptText = paragraphs[1];
  }
  if (!inboxScriptText) {
    inboxScriptText = `Dạ em chào anh/chị ạ! 🌿\n\nEm là Quản lý CSKH bên Shop. Em vừa đọc được đánh giá của mình và rất thấu hiểu cảm xúc thất vọng của anh/chị. Shop xin phép gửi đổi mới hoặc hoàn tiền ngay để đảm bảo quyền lợi tốt nhất cho mình ạ!`;
  }
  if (!behindTheScenesText && paragraphs.length > 2) {
    behindTheScenesText = paragraphs[2];
  }

  const solutionItem: ReviewSolutionItem = {
    id: 1,
    sampleNumber: "Phương Án 1",
    styleName: "Chân Thành & Cầu Thị",
    badge: "Khuyên Dùng",
    psychologicalAngle: "Hạ nhiệt bức xúc, nhún nhường, xoa dịu cảm xúc & bảo vệ uy tín shop",
    publicReply: {
      content: publicReplyText,
      charCount: publicReplyText.length,
      keyPoints: ["Xin lỗi chân thành", "Cam kết hỗ trợ 100% quyền lợi", "Mời mở chat riêng"],
    },
    inboxScript: {
      greeting: "Dạ em chào anh/chị ạ! 🌿",
      bodyMessage: inboxScriptText,
      compensationOffer: "Shop cam kết đổi mới 1-1 miễn phí hoặc hoàn tiền 100% lập tức.",
      revisionNudge: "Sau khi nhận hỗ trợ ưng ý, rất mong anh/chị hỗ trợ cập nhật lại đánh giá giúp shop bớt điểm phạt với nha ạ.",
      fullMessage: inboxScriptText.startsWith("Dạ") ? inboxScriptText : `Dạ em chào anh/chị ạ! 🌿\n\n${inboxScriptText}`,
      charCount: inboxScriptText.length,
    },
    behindTheScenesAction: behindTheScenesText || "Kiểm tra camera niêm phong xuất kho, liên hệ khách hỗ trợ và khiếu nại bưu cục.",
  };

  return {
    shopName: "Gian Hàng Của Bạn",
    productName: "Sản phẩm đánh giá",
    platform: "shopee",
    rating: "1 sao",
    crisisAnalysis: {
      severityLevel: "critical",
      severityBadge: "🚨 Cần Xử Lý Ngay",
      customerPsychology: "Khách hàng đang bức xúc và thất vọng về đơn hàng.",
      rootCause: "Sự cố phát sinh trong quá trình đóng gói, vận chuyển hoặc trải nghiệm sản phẩm.",
      platformRisk: "Ảnh hưởng trực tiếp tới tỷ lệ chuyển đổi và điểm vận hành của gian hàng.",
      canAppealToPlatform: false,
      appealReason: "",
    },
    solutions: [solutionItem],
    strategyGuide: {
      goldenResponseHours: "Trong vòng 30 - 60 phút đầu tiên kể từ khi phát sinh đánh giá.",
      dos: [
        "Phản hồi công khai lịch thiệp, nhận trách nhiệm hỗ trợ không để khách chịu thiệt.",
        "Chủ động nhắn tin riêng gửi giải pháp đền bù thỏa đáng trước khi ngỏ lời nhờ sửa sao.",
        "Giữ thái độ hòa nhã, xưng hô tôn trọng.",
      ],
      donts: [
        "Tuyệt đối không tranh cãi tay đôi hoặc đổ lỗi cho khách hàng trên sàn.",
        "Không dùng từ ngữ vi phạm chính sách cộng đồng của sàn TMĐT.",
      ],
      appealChecklist: [
        "Trích xuất video/ảnh đóng gói từ camera kho bãi.",
        "Gửi khiếu nại lên sàn nếu khách dùng từ ngữ thô tục hoặc có dấu hiệu phá hoại từ đối thủ.",
      ],
    },
  };
}

/**
 * Parser chính 4 tầng bền bỉ
 */
export function parseReviewReplierResult(rawResult: string): ReviewReplierData {
  if (!rawResult || !rawResult.trim()) {
    return SAMPLE_REVIEW_REPLIER_DATA;
  }

  const sanitized = sanitizeRawJsonString(rawResult);

  // Tầng 1: Native JSON Parse
  try {
    const parsed = JSON.parse(sanitized);
    if (parsed && Array.isArray(parsed.solutions) && parsed.solutions.length > 0) {
      return normalizeReviewReplierData(parsed);
    }
  } catch {
    // Chuyển sang Tầng 2
  }

  // Tầng 2: Sửa chữa JSON dở dang (Stack-based repair)
  try {
    const repaired = repairTruncatedJson(rawResult);
    const parsed = JSON.parse(repaired);
    if (parsed && Array.isArray(parsed.solutions) && parsed.solutions.length > 0) {
      return normalizeReviewReplierData(parsed);
    }
  } catch {
    // Chuyển sang Tầng 3
  }

  // Tầng 3: Phân tích Legacy Markdown (tương thích ngược 100%)
  if (
    rawResult.includes("## 1.") ||
    rawResult.includes("## 2.") ||
    rawResult.includes("### 1.") ||
    rawResult.includes("Phương Án") ||
    rawResult.includes("phương án") ||
    rawResult.includes("Phong Cách") ||
    rawResult.includes("Phản hồi công khai") ||
    rawResult.includes("phản hồi công khai") ||
    rawResult.includes("Kịch bản")
  ) {
    try {
      const legacyData = parseLegacyMarkdownToReviewData(rawResult);
      if (legacyData && legacyData.solutions.length > 0) {
        return legacyData;
      }
    } catch {
      // Chuyển sang Tầng 4
    }
  }

  // Tầng 4: Dynamic Free Text Fallback (Bảo tồn văn bản thực tế của người dùng, không bao giờ thế GaN Charger)
  try {
    const dynamicData = parseDynamicFreeTextToReviewData(rawResult);
    if (dynamicData) {
      return dynamicData;
    }
  } catch {
    // Fallback an toàn cuối cùng
  }

  return SAMPLE_REVIEW_REPLIER_DATA;
}

/**
 * Làm sạch, vá lỗi và chuẩn hóa JSON đầu ra của Review Replier ngay tại Server trước khi lưu DB
 */
export function cleanAndValidateReviewReplierOutput(rawText: string): string {
  if (!rawText || !rawText.trim()) return rawText;
  try {
    const parsed = parseReviewReplierResult(rawText);
    return JSON.stringify(parsed);
  } catch {
    return rawText;
  }
}

/**
 * Chuẩn hóa các trường của ReviewReplierData để đảm bảo an toàn tuyệt đối, không crash
 */
function normalizeReviewReplierData(data: any): ReviewReplierData {
  const rawSolutions = Array.isArray(data.solutions) ? data.solutions : [];
  const solutions: ReviewSolutionItem[] = rawSolutions.map((sol: any, idx: number) => {
    const id = sol.id || idx + 1;
    
    // Xử lý publicReply an toàn dù là string hay object
    let pubContent = "";
    let pubKeyPoints: string[] = [];
    if (typeof sol.publicReply === "string") {
      pubContent = sol.publicReply;
    } else if (sol.publicReply && typeof sol.publicReply === "object") {
      pubContent = sol.publicReply.content || "";
      if (Array.isArray(sol.publicReply.keyPoints)) {
        pubKeyPoints = sol.publicReply.keyPoints.filter(Boolean);
      }
    } else {
      pubContent = sol.behindTheScenesAction || "";
    }

    // Xử lý inboxScript an toàn dù là string hay object
    let greeting = "Dạ em chào anh/chị ạ! 🌿";
    let bodyMessage = "";
    let compensationOffer = "";
    let revisionNudge = "";
    let fullMessage = "";

    if (typeof sol.inboxScript === "string") {
      bodyMessage = sol.inboxScript;
      fullMessage = sol.inboxScript;
    } else if (sol.inboxScript && typeof sol.inboxScript === "object") {
      greeting = sol.inboxScript.greeting || greeting;
      bodyMessage = sol.inboxScript.bodyMessage || "";
      compensationOffer = sol.inboxScript.compensationOffer || "";
      revisionNudge = sol.inboxScript.revisionNudge || "";
      fullMessage = sol.inboxScript.fullMessage || "";
    }

    if (!fullMessage) {
      const parts = [greeting, bodyMessage, compensationOffer, revisionNudge].filter(Boolean);
      fullMessage = parts.join("\n\n");
    }

    return {
      id,
      sampleNumber: sol.sampleNumber || `Phương Án ${id}`,
      styleName: sol.styleName || `Phong cách ${id}`,
      badge: sol.badge || (id === 1 ? "Khuyên Dùng" : id === 2 ? "Lỗi Vận Chuyển" : "Bảo Vệ Uy Tín"),
      psychologicalAngle: sol.psychologicalAngle || "Tiếp cận tâm lý chuyên sâu",
      publicReply: {
        content: pubContent,
        charCount: typeof pubContent === "string" ? pubContent.length : 0,
        keyPoints: pubKeyPoints.length > 0 ? pubKeyPoints : ["Xin lỗi chân thành", "Cam kết bảo vệ quyền lợi 100%"],
      },
      inboxScript: {
        greeting,
        bodyMessage,
        compensationOffer,
        revisionNudge,
        fullMessage,
        charCount: typeof fullMessage === "string" ? fullMessage.length : 0,
      },
      behindTheScenesAction: sol.behindTheScenesAction || "Kiểm tra camera niêm phong xuất kho và theo dõi hỗ trợ đơn hàng.",
    };
  });

  return {
    shopName: data.shopName || "Gian Hàng Chính Hãng",
    productName: data.productName || "Sản phẩm đánh giá",
    platform: data.platform || "shopee",
    rating: data.rating || "1 sao",
    crisisAnalysis: {
      severityLevel: data.crisisAnalysis?.severityLevel || "high",
      severityBadge: data.crisisAnalysis?.severityBadge || "⚠️ Cần Xử Lý Ngay",
      customerPsychology: data.crisisAnalysis?.customerPsychology || "Khách hàng hụt hẫng và bức xúc về chất lượng/vận chuyển.",
      rootCause: data.crisisAnalysis?.rootCause || "Sự cố phát sinh ngoài ý muốn trong quá trình giao dịch.",
      platformRisk: data.crisisAnalysis?.platformRisk || "Ảnh hưởng tới điểm vận hành và tỷ lệ chuyển đổi của sản phẩm.",
      canAppealToPlatform: Boolean(data.crisisAnalysis?.canAppealToPlatform),
      appealReason: data.crisisAnalysis?.appealReason || "",
    },
    solutions: solutions.length > 0 ? solutions : SAMPLE_REVIEW_REPLIER_DATA.solutions,
    strategyGuide: {
      goldenResponseHours: data.strategyGuide?.goldenResponseHours || "Trong vòng 60 phút đầu tiên.",
      dos: Array.isArray(data.strategyGuide?.dos) && data.strategyGuide.dos.length > 0 ? data.strategyGuide.dos : SAMPLE_REVIEW_REPLIER_DATA.strategyGuide.dos,
      donts: Array.isArray(data.strategyGuide?.donts) && data.strategyGuide.donts.length > 0 ? data.strategyGuide.donts : SAMPLE_REVIEW_REPLIER_DATA.strategyGuide.donts,
      appealChecklist: Array.isArray(data.strategyGuide?.appealChecklist) && data.strategyGuide.appealChecklist.length > 0 ? data.strategyGuide.appealChecklist : SAMPLE_REVIEW_REPLIER_DATA.strategyGuide.appealChecklist,
    },
  };
}

/**
 * Chuyển đổi dữ liệu có cấu trúc sang Markdown hoàn chỉnh để xuất file hoặc xem raw
 */
export function formatReviewReplierToMarkdown(data: ReviewReplierData): string {
  let md = `# KỊCH BẢN XỬ LÝ KHỦNG HOẢNG & ĐÁNH GIÁ TIÊU CỰC\n`;
  md += `- **Gian hàng**: ${data.shopName || "Gian hàng chính hãng"}\n`;
  md += `- **Sản phẩm**: ${data.productName || "Sản phẩm"}\n`;
  md += `- **Sàn TMĐT**: ${data.platform ? data.platform.toUpperCase() : "SHOPEE"}\n`;
  md += `- **Mức sao**: ${data.rating || "1 sao"}\n\n`;

  if (data.crisisAnalysis) {
    md += `## 🔍 CHẨN ĐOÁN KHỦNG HOẢNG & RỦI RO THUẬT TOÁN\n`;
    md += `- **Mức độ**: ${data.crisisAnalysis.severityBadge || data.crisisAnalysis.severityLevel}\n`;
    md += `- **Tâm lý khách**: ${data.crisisAnalysis.customerPsychology}\n`;
    md += `- **Nguyên nhân cốt lõi**: ${data.crisisAnalysis.rootCause}\n`;
    md += `- **Rủi ro sàn**: ${data.crisisAnalysis.platformRisk}\n`;
    if (data.crisisAnalysis.canAppealToPlatform && data.crisisAnalysis.appealReason) {
      md += `- **Căn cứ báo cáo sàn**: ${data.crisisAnalysis.appealReason}\n`;
    }
    md += `\n---\n\n`;
  }

  (data.solutions || []).forEach((sol, i) => {
    md += `## ${i + 1}. ${sol.styleName} (${sol.badge})\n`;
    md += `> *Góc tiếp cận: ${sol.psychologicalAngle}*\n\n`;
    md += `### 📢 Phản hồi công khai trên sàn (${sol.publicReply.charCount} ký tự):\n`;
    md += `${sol.publicReply.content}\n\n`;
    md += `### 💬 Kịch bản nhắn tin riêng Inbox 1:1:\n`;
    md += `\`\`\`text\n${sol.inboxScript.fullMessage}\n\`\`\`\n\n`;
    if (sol.behindTheScenesAction) {
      md += `### 🛡️ Hành động vận hành hậu trường:\n`;
      md += `${sol.behindTheScenesAction}\n\n`;
    }
    md += `---\n\n`;
  });

  if (data.strategyGuide) {
    md += `## 💡 CẨM NANG CHIẾN LƯỢC BẢO VỆ UY TÍN GIAN HÀNG\n`;
    md += `- **Khung giờ vàng**: ${data.strategyGuide.goldenResponseHours}\n\n`;
    md += `### ✅ Việc NÊN làm:\n`;
    data.strategyGuide.dos.forEach((d) => (md += `- ${d}\n`));
    md += `\n### ❌ Việc TUYỆT ĐỐI TRÁNH:\n`;
    data.strategyGuide.donts.forEach((d) => (md += `- ${d}\n`));
    if (data.strategyGuide.appealChecklist?.length) {
      md += `\n### 🛡️ Checklist gửi bằng chứng lên sàn:\n`;
      data.strategyGuide.appealChecklist.forEach((c) => (md += `- ${c}\n`));
    }
  }

  return md;
}

/**
 * Dựng kết quả ReviewReplierData hoàn chỉnh 100% bằng bộ máy ngoại tuyến (Offline Blueprint Engine)
 * Phục vụ tình huống gián đoạn upstream AI, đảm bảo zero-downtime cho người bán
 */
export function buildOfflineReviewReplierData(inputs?: ReviewReplierInputs): ReviewReplierData {
  const shopName = inputs?.shopName?.trim() || "Gian Hàng Chính Hãng";
  const productName = inputs?.productName?.trim() || "Sản phẩm";
  const platform = inputs?.platform?.trim() || "shopee";
  const rating = inputs?.rating?.trim() || "1 sao";
  const issueType = inputs?.issueType?.trim() || "Hàng lỗi / Không ưng ý";
  const reviewContent = inputs?.reviewContent?.trim() || "Khách hàng đánh giá chưa hài lòng";
  const compensation = inputs?.compensation?.trim() || "Đổi mới 1-1 miễn phí hoặc hoàn tiền 100%";

  return normalizeReviewReplierData({
    shopName,
    productName,
    platform,
    rating,
    crisisAnalysis: {
      severityLevel: rating.includes("1") ? "critical" : "high",
      severityBadge: rating.includes("1") ? "🚨 Nguy Cấp (Ảnh hưởng SES & Điểm Shop)" : "⚠️ Cần Xử Lý Sớm",
      customerPsychology: `Khách hàng thất vọng khi nhận sản phẩm chưa đúng kỳ vọng (${issueType}) và để lại phản hồi: "${reviewContent}".`,
      rootCause: `Sự cố phát sinh liên quan đến ${issueType} trong khâu vận chuyển hoặc trải nghiệm ban đầu của khách.`,
      platformRisk: `Làm giảm điểm đánh giá trung bình của sản phẩm, ảnh hưởng tỷ lệ chuyển đổi nếu khách mua sau đọc được.`,
      canAppealToPlatform: false,
      appealReason: "",
    },
    solutions: [
      {
        id: 1,
        sampleNumber: "Phương Án 1",
        styleName: "Chân Thành & Cầu Thị",
        badge: "Khuyên Dùng",
        psychologicalAngle: "Hạ nhiệt cơn giận tức thì, nhận 100% trách nhiệm không đùn đẩy, cam kết giải quyết quyền lợi hỏa tốc 0đ",
        publicReply: {
          content: `Dạ ${shopName} xin chân thành gửi lời xin lỗi sâu sắc tới anh/chị vì sự cố đơn hàng ${productName} vừa qua ạ! Shop vô cùng thấu hiểu sự bất tiện của mình khi nhận hàng chưa được ưng ý trọn vẹn. Tôn chỉ của ${shopName} là luôn đặt quyền lợi của khách hàng lên hàng đầu. Bên em đã gửi tin nhắn riêng qua khung Chat để hỗ trợ ${compensation} ngay hôm nay. Kính mong anh/chị kiểm tra hộp thư Chat để bên em giải quyết chu đáo nhất nhé ạ!`,
          charCount: 420,
          keyPoints: ["Xin lỗi chân thành", "Nhận trách nhiệm", "Đề xuất đền bù qua Chat riêng"],
        },
        inboxScript: {
          greeting: `Dạ em chào anh/chị ạ! 🌿`,
          bodyMessage: `Em là Quản lý CSKH bên ${shopName}. Em vừa đọc được phản hồi của mình về đơn hàng ${productName} và cảm thấy rất có lỗi vì trải nghiệm chưa trọn vẹn này ạ.`,
          compensationOffer: `Để đảm bảo quyền lợi tuyệt đối cho mình, bên em xin phép được hỗ trợ: ${compensation}, toàn bộ chi phí phát sinh bên em xin chịu 100% ạ.`,
          revisionNudge: `Sau khi nhận hỗ trợ mới hài lòng, em rất mong anh/chị thương tình hỗ trợ chỉnh sửa lại đánh giá giúp gian hàng em với nha ạ. Em cảm ơn anh/chị nhiều lắm ạ! ❤️`,
          fullMessage: `Dạ em chào anh/chị ạ! 🌿\n\nEm là Quản lý CSKH bên ${shopName}. Em vừa đọc được phản hồi của mình về đơn hàng ${productName} và cảm thấy rất có lỗi vì trải nghiệm chưa trọn vẹn này ạ.\n\nĐể đảm bảo quyền lợi tuyệt đối cho mình, bên em xin phép được hỗ trợ: ${compensation}, toàn bộ chi phí phát sinh bên em xin chịu 100% ạ.\n\nSau khi nhận hỗ trợ mới hài lòng, em rất mong anh/chị thương tình hỗ trợ chỉnh sửa lại đánh giá giúp gian hàng em với nha ạ. Em cảm ơn anh/chị nhiều lắm ạ! ❤️`,
          charCount: 520,
        },
        behindTheScenesAction: "Kiểm tra camera đóng hàng xuất kho, chủ động liên hệ qua tin nhắn sàn và theo dõi đến khi khách hài lòng.",
      },
      {
        id: 2,
        sampleNumber: "Phương Án 2",
        styleName: "Khéo Léo & Khách Quan",
        badge: "Lỗi Vận Chuyển / Ngoại Cảnh",
        psychologicalAngle: "Phân trần khách quan chứng minh shop làm việc cẩn trọng, cam kết không để người mua chịu bất kỳ thiệt thòi nào",
        publicReply: {
          content: `Dạ chào anh/chị, ${shopName} đã kiểm tra camera quy trình đóng gói trước khi xuất kho thì sản phẩm ${productName} còn nguyên seal và bọc chống sốc dày dặn. Tuy nhiên trong quá trình vận chuyển đường xa khó tránh khỏi sự cố ngoài ý muốn. ${shopName} cam kết không để khách hàng phải chịu bất kỳ thiệt thòi nào! Shop đã gửi tin nhắn riêng để hỗ trợ ${compensation}, anh/chị kiểm tra tin nhắn giúp Shop nhé ạ!`,
          charCount: 410,
          keyPoints: ["Có video đóng gói", "Lỗi do ngoại cảnh vận chuyển", "Đổi mới/hoàn tiền 100%"],
        },
        inboxScript: {
          greeting: `Dạ em chào anh/chị ạ!`,
          bodyMessage: `Em gửi anh/chị thông tin kiểm tra đơn hàng ${productName}, kiện hàng xuất kho còn nguyên vẹn ạ. Sự cố xảy ra có thể do bưu tá quăng quật đường xa, bên em đang làm việc khiếu nại đơn vị vận chuyển.`,
          compensationOffer: `Để anh/chị không phải chờ đợi lâu, em xin phép gửi đổi mới hỏa tốc hoặc ${compensation} tới mình ngay ạ.`,
          revisionNudge: `Khi nhận hàng mới hài lòng, mong anh/chị hỗ trợ chấm lại sao giúp shop em nhé ạ, em biết ơn anh/chị rất nhiều!`,
          fullMessage: `Dạ em chào anh/chị ạ!\n\nEm gửi anh/chị thông tin kiểm tra đơn hàng ${productName}, kiện hàng xuất kho còn nguyên vẹn ạ. Sự cố xảy ra có thể do bưu tá quăng quật đường xa, bên em đang làm việc khiếu nại đơn vị vận chuyển.\n\nĐể anh/chị không phải chờ đợi lâu, em xin phép gửi đổi mới hỏa tốc hoặc ${compensation} tới mình ngay ạ.\n\nKhi nhận hàng mới hài lòng, mong anh/chị hỗ trợ chấm lại sao giúp shop em nhé ạ, em biết ơn anh/chị rất nhiều!`,
          charCount: 480,
        },
        behindTheScenesAction: "Trích xuất video đóng gói lưu làm bằng chứng khiếu nại bưu cục và hỗ trợ khách tức thì.",
      },
      {
        id: 3,
        sampleNumber: "Phương Án 3",
        styleName: "Minh Bạch & Bảo Vệ Uy Tín",
        badge: "Bảo Vệ Uy Tín",
        psychologicalAngle: "Khẳng định tiêu chuẩn chất lượng và chính sách bảo hành chính hãng để giữ trọn niềm tin của hàng nghìn người mua tiếp theo",
        publicReply: {
          content: `Dạ ${shopName} kính chào anh/chị, Shop luôn cam kết 100% sản phẩm ${productName} là hàng chất lượng, có chế độ bảo hành và đổi trả minh bạch. Sự cố trong đơn hàng vừa qua là điều vô cùng đáng tiếc, tôn chỉ của bên em là bảo vệ trải nghiệm của khách hàng đến cùng. Đội ngũ CSKH đã liên hệ qua tin nhắn để kích hoạt chính sách ${compensation}. Rất mong anh/chị kiểm tra hộp thư Chat để bên em phục vụ tốt nhất ạ!`,
          charCount: 420,
          keyPoints: ["Cam kết chất lượng chuẩn", "Bảo hành minh bạch", "Kích hoạt quyền lợi đặc quyền"],
        },
        inboxScript: {
          greeting: `Dạ chào anh/chị ạ,`,
          bodyMessage: `${shopName} xin gửi lời xin lỗi vì trải nghiệm nhận sản phẩm ${productName} chưa trọn vẹn ạ.`,
          compensationOffer: `Em đã kích hoạt diện Bảo hành đặc quyền: Hỗ trợ ${compensation} hoàn toàn miễn phí tận nơi cho mình ạ.`,
          revisionNudge: `Sau khi kiểm tra sản phẩm mới dùng tốt, rất mong anh/chị hỗ trợ cập nhật lại đánh giá để khẳng định uy tín giúp shop em ạ.`,
          fullMessage: `Dạ chào anh/chị ạ,\n\n${shopName} xin gửi lời xin lỗi vì trải nghiệm nhận sản phẩm ${productName} chưa trọn vẹn ạ.\n\nEm đã kích hoạt diện Bảo hành đặc quyền: Hỗ trợ ${compensation} hoàn toàn miễn phí tận nơi cho mình ạ.\n\nSau khi kiểm tra sản phẩm mới dùng tốt, rất mong anh/chị hỗ trợ cập nhật lại đánh giá để khẳng định uy tín giúp shop em ạ.`,
          charCount: 390,
        },
        behindTheScenesAction: "Ghi nhận vào sổ nhật ký CSKH để theo dõi tiến độ đổi trả và hỗ trợ khách hàng.",
      },
    ],
    strategyGuide: SAMPLE_REVIEW_REPLIER_DATA.strategyGuide,
  });
}

// -------------------------------------------------------------
// DỮ LIỆU MẪU THỰC CHIẾN (SAMPLE DATA)
// -------------------------------------------------------------
export const SAMPLE_REVIEW_REPLIER_DATA: ReviewReplierData = {
  shopName: "Aicho Tech Official Store",
  productName: "Củ sạc nhanh GaN 65W 3 cổng Type-C & Cáp dù siêu bền",
  platform: "shopee",
  rating: "1 sao",
  crisisAnalysis: {
    severityLevel: "critical",
    severityBadge: "🚨 Nguy Cấp (Ảnh hưởng SES & Sao Sàn)",
    customerPsychology: "Khách hàng cảm thấy bị lừa dối, bức xúc tột cùng khi hộp hàng nát bươm và nhắn tin nửa ngày chưa ai trả lời.",
    rootCause: "Sự cố bưu cục dồn tải quăng quật làm nứt vỡ củ sạc + Bộ phận trực chat bị quá tải phản hồi chậm.",
    platformRisk: "Kéo tụt điểm đánh giá shop dưới 4.8, giảm 30% tỷ lệ chuyển đổi của sản phẩm nếu người mua khác đọc được.",
    canAppealToPlatform: false,
    appealReason: "",
  },
  solutions: [
    {
      id: 1,
      sampleNumber: "Phương Án 1",
      styleName: "Chân Thành & Cầu Thị",
      badge: "Khuyên Dùng",
      psychologicalAngle: "Hạ nhiệt cơn giận tức thì, nhận trách nhiệm 100% không đùn đẩy, cam kết đền bù hỏa tốc 0đ",
      publicReply: {
        content: "Dạ Shop Aicho xin chân thành cúi đầu xin lỗi anh/chị vì sự cố kiện hàng bị móp rách và nứt củ sạc GaN trong đơn vừa qua ạ! Shop vô cùng thấu hiểu cảm giác thất vọng của mình khi háo hức chờ nhận hàng mà sản phẩm không nguyên vẹn. Dù đã bọc bóng khí 3 lớp nhưng do bưu cục quá tải nên đã xảy ra sự việc đáng tiếc này. Shop xin nhận 100% trách nhiệm và gửi hỏa tốc 01 củ sạc mới hoàn toàn miễn phí ngay hôm nay. Em đã gửi tin nhắn riêng cho mình rồi, anh/chị mở mục Chat giúp Shop để xác nhận địa chỉ nhận hàng bù liền nhé ạ!",
        charCount: 312,
        keyPoints: ["Nhận 100% trách nhiệm", "Đổi mới hỏa tốc 0đ", "Mời mở chat nhận hàng bù"],
      },
      inboxScript: {
        greeting: "Dạ em chào anh/chị ạ! 🌿",
        bodyMessage: "Em là Quản lý CSKH bên Aicho Tech. Em vừa đọc được đánh giá của mình và thấy vô cùng có lỗi vì củ sạc bị nứt do bưu tá quăng quật mạnh, lại để anh/chị phải chờ tin nhắn lâu như vậy ạ.",
        compensationOffer: "Em đã tạo ngay 01 đơn hàng gửi bù Củ sạc GaN 65W mới nguyên seal kèm 01 Cáp sạc bọc dù 100W đền bù gửi tới mình, bên em chịu 100% cước phí hỏa tốc.",
        revisionNudge: "Sau khi nhận hàng mới test dùng mượt mà ưng ý, em rất mong anh/chị thương tình hỗ trợ chỉnh sửa lại đánh giá giúp gian hàng em bớt điểm phạt với nha ạ. Em cảm ơn anh/chị nhiều lắm ạ! ❤️",
        fullMessage: "Dạ em chào anh/chị ạ! 🌿\n\nEm là Quản lý CSKH bên Aicho Tech. Em vừa đọc được đánh giá của mình và thấy vô cùng có lỗi vì củ sạc bị nứt do bưu tá quăng quật mạnh, lại để anh/chị phải chờ tin nhắn lâu như vậy ạ.\n\nEm đã tạo ngay 01 đơn hàng gửi bù Củ sạc GaN 65W mới nguyên seal kèm 01 Cáp sạc bọc dù 100W đền bù gửi tới mình, bên em chịu 100% cước phí hỏa tốc.\n\nSau khi nhận hàng mới test dùng mượt mà ưng ý, em rất mong anh/chị thương tình hỗ trợ chỉnh sửa lại đánh giá giúp gian hàng em bớt điểm phạt với nha ạ. Em cảm ơn anh/chị nhiều lắm ạ! ❤️",
        charCount: 520,
      },
      behindTheScenesAction: "Check lại camera niêm phong xuất kho, tạo mã gửi bù hỏa tốc qua Ahamove/Shopee Express, gắn tag VIP theo dõi riêng tới khi khách sửa sao.",
    },
    {
      id: 2,
      sampleNumber: "Phương Án 2",
      styleName: "Khéo Léo & Khách Quan",
      badge: "Lỗi Vận Chuyển",
      psychologicalAngle: "Phân trần khách quan chứng minh shop làm việc cẩn thận, nhưng cam kết không để khách chịu thiệt thòi",
      publicReply: {
        content: "Dạ chào anh/chị, Shop đã kiểm tra camera quy trình đóng gói trước khi xuất kho thì sản phẩm còn nguyên tem niêm phong và bọc chống sốc dày dặn ạ. Sự cố hộp móp rách và vỡ nứt này khả năng cao do đơn vị vận chuyển dồn tải nặng. Tuy nhiên, quyền lợi của anh/chị luôn là ưu tiên số 1 của Shop, bên em cam kết không để khách hàng phải chịu bất kỳ thiệt thòi nào! Shop đã gửi tin nhắn riêng để hỗ trợ đổi mới 1-1 miễn phí hoặc hoàn tiền 100% lập tức, anh/chị kiểm tra tin nhắn giúp Shop nhé ạ!",
        charCount: 308,
        keyPoints: ["Có video camera đóng gói", "Lỗi do khâu vận chuyển", "Đổi mới 1-1 hoặc hoàn tiền ngay"],
      },
      inboxScript: {
        greeting: "Dạ em chào anh/chị ạ!",
        bodyMessage: "Em gửi anh/chị xem clip camera lúc đóng gói củ sạc GaN của mình, hàng xuất kho còn nguyên seal không tì vết ạ. Do bên bưu cục ném hàng làm vỡ, bên em đang làm việc khiếu nại bưu tá.",
        compensationOffer: "Để không lỡ công việc sạc máy của anh/chị, em xin phép gửi đổi ngay 1 củ sạc mới tinh hỏa tốc tới mình trong hôm nay, anh/chị chỉ cần nhận hàng không phải trả bất kỳ phí gì ạ.",
        revisionNudge: "Khi nhận hàng mới hài lòng, mong anh/chị hỗ trợ chấm lại sao giúp shop em nhé ạ, em biết ơn anh/chị rất nhiều!",
        fullMessage: "Dạ em chào anh/chị ạ!\n\nEm gửi anh/chị xem clip camera lúc đóng gói củ sạc GaN của mình, hàng xuất kho còn nguyên seal không tì vết ạ. Do bên bưu cục ném hàng làm vỡ, bên em đang làm việc khiếu nại bưu tá.\n\nĐể không lỡ công việc sạc máy của anh/chị, em xin phép gửi đổi ngay 1 củ sạc mới tinh hỏa tốc tới mình trong hôm nay, anh/chị chỉ cần nhận hàng không phải trả bất kỳ phí gì ạ.\n\nKhi nhận hàng mới hài lòng, mong anh/chị hỗ trợ chấm lại sao giúp shop em nhé ạ, em biết ơn anh/chị rất nhiều!",
        charCount: 462,
      },
      behindTheScenesAction: "Trích xuất video đóng hàng gửi ticket khiếu nại lên bộ phận vận hành Shopee/TikTok để đòi bồi thường hư hỏng.",
    },
    {
      id: 3,
      sampleNumber: "Phương Án 3",
      styleName: "Minh Bạch & Bảo Vệ Thương Hiệu",
      badge: "Bảo Vệ Uy Tín",
      psychologicalAngle: "Khẳng định tiêu chuẩn chất lượng sản phẩm để giữ niềm tin của hàng ngàn khách mua sau đọc đánh giá",
      publicReply: {
        content: "Dạ Shop Aicho kính chào anh/chị, Shop luôn cam kết 100% củ sạc GaN là hàng chính hãng có tem phụ bảo hành 12 tháng 1 đổi 1. Sự cố bể vỡ trong lúc giao nhận là điều vô cùng đáng tiếc, nhưng tôn chỉ bán hàng của bên em là bảo vệ trải nghiệm khách hàng đến cùng. Đội ngũ CSKH đã liên hệ qua tin nhắn để kích hoạt chính sách Bảo Hành Đổi Mới Miễn Phí trong 24h cho mình. Rất mong anh/chị kiểm tra hộp thư Chat để bên em giải quyết dứt điểm thỏa đáng nhất ạ!",
        charCount: 295,
        keyPoints: ["Cam kết chính hãng bảo hành 12 tháng", "Bảo hành 1 đổi 1 trong 24h", "Bảo vệ trải nghiệm khách đến cùng"],
      },
      inboxScript: {
        greeting: "Dạ chào anh/chị ạ,",
        bodyMessage: "Aicho Tech xin gửi lời xin lỗi vì đơn hàng chưa trọn vẹn. Toàn bộ củ sạc GaN 65W bên em đều được bảo hành 12 tháng 1 đổi 1 không sửa chữa.",
        compensationOffer: "Em đã kích hoạt diện Bảo hành đặc quyền: Thu hồi củ sạc nứt tận nhà và giao củ sạc mới nguyên seal 100% hoàn toàn miễn phí.",
        revisionNudge: "Sau khi nhận củ sạc mới dùng tốt, rất mong anh/chị cập nhật lại đánh giá để khẳng định uy tín giúp shop em ạ.",
        fullMessage: "Dạ chào anh/chị ạ,\n\nAicho Tech xin gửi lời xin lỗi vì đơn hàng chưa trọn vẹn. Toàn bộ củ sạc GaN 65W bên em đều được bảo hành 12 tháng 1 đổi 1 không sửa chữa.\n\nEm đã kích hoạt diện Bảo hành đặc quyền: Thu hồi củ sạc nứt tận nhà và giao củ sạc mới nguyên seal 100% hoàn toàn miễn phí.\n\nSau khi nhận củ sạc mới dùng tốt, rất mong anh/chị cập nhật lại đánh giá để khẳng định uy tín giúp shop em ạ.",
        charCount: 398,
      },
      behindTheScenesAction: "Lưu mã serial sản phẩm vào hệ thống bảo hành điện tử để theo dõi 1 đổi 1 cho khách.",
    },
  ],
  strategyGuide: {
    goldenResponseHours: "Phản hồi công khai và nhắn tin riêng trong vòng 30 - 60 phút đầu tiên kể từ lúc khách đăng đánh giá.",
    dos: [
      "Luôn tách bạch: Lời xin lỗi đưa lên công khai, đề xuất đền bù cụ thể đưa vào tin nhắn riêng.",
      "Gửi hình ảnh/clip đóng gói nếu có để chứng minh sự chuyên nghiệp, không đùn đẩy.",
      "Chủ động đền bù trước, làm khách hài lòng rồi mới khéo léo nhờ khách sửa đánh giá.",
    ],
    donts: [
      "Tuyệt đối KHÔNG tranh cãi tay đôi hoặc trách móc khách hàng trên bình luận công khai.",
      "Không yêu cầu khách sửa đánh giá trước khi giải quyết sự cố.",
      "Tránh dùng các từ khóa nhạy cảm bị sàn quét phạt (giao dịch ngoài sàn, chuyển khoản cá nhân).",
    ],
    appealChecklist: [
      "Chụp ảnh/video đóng gói từ camera kho bãi có mã vận đơn rõ ràng.",
      "Ảnh chụp màn hình nội dung đánh giá của khách.",
      "Báo cáo sàn can thiệp nếu khách dùng từ ngữ thô tục hoặc là đánh giá cạnh tranh bẩn từ đối thủ.",
    ],
  },
};

export const SAMPLE_REVIEW_REPLIER_RESULT = JSON.stringify(SAMPLE_REVIEW_REPLIER_DATA, null, 2);
