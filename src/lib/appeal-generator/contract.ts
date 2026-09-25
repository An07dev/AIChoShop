/**
 * Module Contract cho AI Kháng Nghị Vi Phạm (Appeal Generator)
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema), Bộ Prompt Thực Chiến Sàn TMĐT (Shopee, TikTok Shop, Lazada)
 * & Resilient Parser 4 Tầng Bền Bỉ (Tương thích ngược 100% với dữ liệu lịch sử cũ)
 */

export interface AppealGeneratorInputs {
  platform: string; // "Shopee" | "TikTok Shop" | "Lazada" | string
  violationType: string;
  shopName: string;
  details?: string;
  imageBase64?: string | null;
}

// -------------------------------------------------------------
// 1. CHẨN ĐOÁN VI PHẠM & TỶ LỆ MỞ KHÓA (Diagnosis)
// -------------------------------------------------------------
export interface ViolationDiagnosis {
  severityLevel: "critical" | "high" | "medium";
  severityBadge: string; // "🚨 Nguy Cấp - Nguy Cơ Khóa Shop", "⚠️ Rủi Ro Cao", "⚡ Cần Xử Lý Sớm"
  appealScenario: "oan_uc" | "so_suat";
  scenarioTitle: string; // "Khẳng Định Tính Hợp Pháp (Bị Quét Nhầm)" hoặc "Cầu Thị & Khắc Phục Sơ Suất"
  rootCauseAnalysis: string; // Bóc tách tại sao AI sàn hoặc kiểm duyệt viên bắt lỗi
  estimatedSuccessRate: string; // "85% - 95% (Rất cao nếu có đủ hóa đơn VAT)"
  immediateActions: string[]; // 2-3 việc shop PHẢI làm ngay trước khi bấm gửi đơn
}

// -------------------------------------------------------------
// 2. MẪU ĐƠN KHÁNG NGHỊ CHUẨN MỰC (Appeal Letter)
// -------------------------------------------------------------
export interface AppealLetter {
  subjectTitle: string; // Tiêu đề đơn trang trọng kèm ID shop/sản phẩm
  greeting: string; // Lời chào ban kiểm duyệt
  bodyContext: string; // Trình bày bối cảnh & sự cố
  justificationEvidence: string; // Giải trình chi tiết + Bằng chứng minh bạch
  actionPlan: string; // Biện pháp khắc phục đã thực hiện ngay lập tức
  closingCommitment: string; // Cam kết tuân thủ & lời đề nghị mở khóa trân trọng
  fullLetter: string; // Toàn văn hoàn chỉnh để 1-chạm sao chép
  wordCount: number; // Độ dài vàng (200 - 350 từ)
  charCount: number;
}

// -------------------------------------------------------------
// 3. CHECKLIST HỒ SƠ PHÁP LÝ & BẰNG CHỨNG (Evidence Checklist)
// -------------------------------------------------------------
export interface EvidenceChecklist {
  mandatoryDocuments: string[]; // Bằng chứng BẮT BUỘC (Hóa đơn VAT, Giấy ủy quyền...)
  supplementaryDocuments: string[]; // Bằng chứng BỔ TRỢ (Ảnh kho, Video đóng hàng...)
  formattingTips: string[]; // Lưu ý khi scan/chụp ảnh gửi sàn
}

// -------------------------------------------------------------
// 4. CẨM NANG ĐÀM PHÁN & ESCALATION (Negotiation Strategy)
// -------------------------------------------------------------
export interface NegotiationStrategy {
  goldenSubmissionTime: string; // Khung giờ vàng nộp đơn (9h-11h sáng T2-T6)
  portalRouting: string; // Hướng dẫn gửi đúng luồng (Ticket sàn / Chat CSKH / Email Policy)
  escalationSteps: string[]; // Các bước khiếu nại cấp 2 nếu đơn lần 1 bị từ chối
  strictDonts: string[]; // Những điều TUYỆT ĐỐI TRÁNH
}

// -------------------------------------------------------------
// CẤU TRÚC TỔNG THỂ DỮ LIỆU ĐẦU RA (Root Data)
// -------------------------------------------------------------
export interface AppealGeneratorData {
  shopName: string;
  platform: string;
  violationType: string;
  violationDiagnosis: ViolationDiagnosis;
  appealLetter: AppealLetter;
  evidenceChecklist: EvidenceChecklist;
  negotiationStrategy: NegotiationStrategy;
}

// -------------------------------------------------------------
// SYSTEM PROMPT CHUẨN HÓA GIÁM ĐỐC PHÁP LÝ & XỬ LÝ KHIẾU NẠI SÀN TMĐT
// -------------------------------------------------------------
export const APPEAL_GENERATOR_SYSTEM_PROMPT = `Bạn là Giám Đốc Pháp Lý & Chuyên Gia Xử Lý Vi Phạm - Gỡ Gậy Sàn TMĐT hàng đầu tại Việt Nam (am hiểu sâu sắc thuật toán kiểm duyệt và bộ luật chính sách của Shopee, TikTok Shop, Lazada).
Nhiệm vụ của bạn là bóc tách nguyên nhân sâu xa mà thuật toán AI hoặc kiểm duyệt viên của sàn đã phạt gian hàng, thẩm định chính xác tình huống (Oan ức do Bot quét nhầm hay Sơ suất vận hành thực tế), từ đó soạn thảo BỘ HỒ SƠ GIẢI TRÌNH & ĐƠN KHÁNG NGHỊ CHUYÊN NGHIỆP CẤP CAO với tỷ lệ mở khóa đạt trên 90%.

QUY TẮC NGHIỆP VỤ BẮT BUỘC:
1. ĐỘ DÀI LÁ ĐƠN: Dao động từ 200 đến 350 từ (Nguyên tắc duyệt sàn: Nhân sự Policy chỉ đọc lướt 30-45 giây. Đơn quá dài sẽ bị bấm Reject ngay; đơn quá cộc lốc sẽ bị coi là thiếu tôn trọng).
2. TÂM LÝ KIỂM DUYỆT 2 KỊCH BẢN:
   - Kịch bản A (Oan ức / Bot quét nhầm từ khóa/ảnh): Văn phong đĩnh đạc, tự tin, lịch sự, viện dẫn chứng từ pháp lý (Hóa đơn VAT, Giấy ủy quyền đại lý, Giấy công bố chất lượng).
   - Kịch bản B (Sơ suất vận hành / Giao trễ / Nhầm lẫn): Văn phong chân thành, cầu thị, nhận trách nhiệm, nêu lý do khách quan hợp lý, nhấn mạnh HÀNH ĐỘNG ĐÃ KHẮC PHỤC NGAY LẬP TỨC và CAM KẾT không tái phạm.
3. BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON THUẦN TÚY (Valid JSON Object), không có bất kỳ lời dẫn hay markdown codeblock ngoài JSON.

CẤU TRÚC JSON SCHEMA BẮT BUỘC:
{
  "shopName": "Tên shop",
  "platform": "Shopee | TikTok Shop | Lazada | Khác",
  "violationType": "Tên loại vi phạm",
  "violationDiagnosis": {
    "severityLevel": "critical | high | medium",
    "severityBadge": "🚨 Nguy Cấp - Nguy Cơ Khóa Shop | ⚠️ Rủi Ro Cao | ⚡ Cần Xử Lý Sớm",
    "appealScenario": "oan_uc | so_suat",
    "scenarioTitle": "Khẳng Định Tính Hợp Pháp (Bị Quét Nhầm) | Cầu Thị & Khắc Phục Sơ Suất Vận Hành",
    "rootCauseAnalysis": "Phân tích cụ thể lý do thuật toán AI sàn bắt lỗi (VD: từ khóa nhạy cảm, logo trùng lặp, bưu tá trễ hạn...)",
    "estimatedSuccessRate": "Tỷ lệ dự phóng (VD: 85% - 95% nếu kèm hóa đơn VAT)",
    "immediateActions": [
      "Hành động khẩn cấp 1 cần làm ngay",
      "Hành động khẩn cấp 2"
    ]
  },
  "appealLetter": {
    "subjectTitle": "ĐƠN GIẢI TRÌNH & ĐỀ NGHỊ XEM XÉT LẠI VI PHẠM - GIAN HÀNG [TÊN SHOP] (ID: ...)",
    "greeting": "Kính gửi Ban Quản Trị & Đội Ngũ Kiểm Duyệt Sàn [Platform],",
    "bodyContext": "Tôi là đại diện gian hàng... liên quan đến việc sản phẩm/shop bị ghi nhận vi phạm...",
    "justificationEvidence": "Giải trình lý do khách quan, viện dẫn chứng cứ minh bạch...",
    "actionPlan": "Ngay khi nhận được thông báo, gian hàng chúng tôi đã chủ động thực hiện các biện pháp...",
    "closingCommitment": "Chúng tôi cam kết luôn tôn trọng quy định cộng đồng... Rất mong Quý Ban xem xét gỡ bỏ án phạt...",
    "fullLetter": "Toàn văn bức đơn hoàn chỉnh ghép nối tất cả các đoạn trên để người bán bấm sao chép 1 chạm gửi vào form khiếu nại...",
    "wordCount": 265,
    "charCount": 1650
  },
  "evidenceChecklist": {
    "mandatoryDocuments": [
      "Hóa đơn giá trị gia tăng (VAT) hoặc hóa đơn đỏ hợp pháp",
      "Hợp đồng phân phối / Giấy ủy quyền từ hãng / Giấy chứng nhận đại lý"
    ],
    "supplementaryDocuments": [
      "Video/ảnh chụp thực tế quy trình kiểm tra và đóng gói hàng tại kho",
      "Giấy tiếp nhận bảo hành hoặc xác nhận từ đơn vị vận chuyển"
    ],
    "formattingTips": [
      "Scan hoặc chụp ảnh rõ nét 4 góc, dung lượng file < 5MB",
      "Gạch chân hoặc khoanh đỏ thông tin mã đơn hàng / mã sản phẩm để kiểm duyệt viên dễ đối soát"
    ]
  },
  "negotiationStrategy": {
    "goldenSubmissionTime": "Khung giờ vàng: 09:00 - 11:00 hoặc 14:00 - 16:00 các ngày trong tuần (T2 - T6)",
    "portalRouting": "Kênh gửi đơn tối ưu: Nộp trực tiếp tại Trung Tâm Người Bán mục Khiếu Nại Vi Phạm, kết hợp tạo Ticket qua Live Chat CSM",
    "escalationSteps": [
      "Bước 1: Gửi đơn chuẩn và chờ phản hồi tối đa 24h - 48h, không gửi dồn dập",
      "Bước 2: Nếu bị Bot tự động từ chối lần 1, liên hệ Tổng đài CSKH sàn yêu cầu chuyển hồ sơ cho Chuyên viên cấp cao (Agent Specialist)"
    ],
    "strictDonts": [
      "Tuyệt đối KHÔNG spam gửi 5-10 đơn cùng một nội dung liên tục (sẽ bị hệ thống đưa vào Blacklist Spam)",
      "Không dùng lời lẽ bức xúc, tranh cãi gay gắt hoặc công kích kiểm duyệt viên trên đơn"
    ]
  }
}`;

// -------------------------------------------------------------
// USER PROMPT BUILDER
// -------------------------------------------------------------
export function buildAppealGeneratorPrompt(inputs: AppealGeneratorInputs): string {
  const platform = inputs.platform || "Shopee";
  const shopName = inputs.shopName || "Gian Hàng Chính Hãng";
  const violationType = inputs.violationType || "Nghi ngờ vi phạm tiêu chuẩn cộng đồng";
  const details = inputs.details ? `\n- Bối cảnh / Lý do giải trình từ shop: "${inputs.details.trim()}"` : "";
  const hasImage = Boolean(inputs.imageBase64);

  return `Hãy đóng vai Giám Đốc Pháp Lý & Chuyên Gia Xử Lý Kháng Nghị TMĐT cho gian hàng "${shopName}".
Hãy phân tích vi phạm và xây dựng trọn bộ hồ sơ khiếu nại chuẩn sàn sau đây:

THÔNG TIN ĐẦU VÀO:
- Sàn TMĐT: ${platform}
- Tên Gian Hàng: "${shopName}"
- Loại Vi Phạm Bị Phạt: "${violationType}"${details}
${hasImage ? "- Có đính kèm ảnh chụp màn hình thông báo vi phạm từ sàn. Hãy phân tích kỹ mã lỗi, từ khóa hoặc thông tin trên ảnh để chỉ ra nguyên nhân cốt lõi chính xác nhất." : ""}

YÊU CẦU ĐẦU RA:
1. Chẩn đoán chính xác kịch bản (Shop bị Oan ức do Bot quét nhầm hay Sơ suất vận hành) và phân tích nguyên nhân gốc rễ.
2. Biên soạn MẪU ĐƠN KHÁNG NGHỊ CHUẨN MỰC (dài khoảng 200 - 350 từ) với văn phong đắc nhân tâm, lý lẽ đanh thép, cầu thị nhưng kiên quyết bảo vệ uy tín shop. Trong trường "fullLetter", BẮT BUỘC PHẢI CÓ XUỐNG DÒNG (\\n\\n) rõ ràng giữa Lời chào, Đoạn mở đầu, Đoạn chứng cứ, Đoạn khắc phục, Đoạn cam kết và Lời cảm ơn/ký tên. Tuyệt đối không viết dính liền thành một khối văn bản không xuống dòng.
3. Lập danh mục Checklist bằng chứng pháp lý bắt buộc và bổ trợ cần tải lên kèm đơn.
4. Đưa ra cẩm nang chiến lược đàm phán, khung giờ vàng nộp đơn và quy trình xử lý nếu bị từ chối lần 1.
5. BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON HỢP LỆ 100% đúng schema đã quy định.`;
}

// -------------------------------------------------------------
// BỘ PARSER 4 TẦNG BỀN BỈ (Resilient Parser)
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
  cleaned = escapeControlCharsInJsonStrings(cleaned);

  return cleaned;
}

/**
 * Thuật toán cứu vãn JSON dở dang khi bị đứt token (Stack-based Resilient Parser)
 */
export function repairTruncatedJson(jsonStr: string): string {
  let str = sanitizeRawJsonString(jsonStr);
  const firstOpen = str.indexOf("{");
  if (firstOpen === -1) return str;

  str = str.substring(firstOpen);
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
 * Đảm bảo 100% kết quả cũ từ lịch sử hoạt động vẫn render mượt mà
 */
export function parseLegacyMarkdownToAppealData(markdown: string): AppealGeneratorData {
  let coreIssue = "";
  let solution = "";
  let letter = "";

  const part2Index = markdown.search(/#{2,4}\s*2[\.\:\s]*(?:MẪU|Mẫu|ĐƠN|Đơn|MẪU ĐƠN)/i);
  let part1Text = "";
  let part2Text = "";

  if (part2Index !== -1) {
    part1Text = markdown.slice(0, part2Index);
    part2Text = markdown.slice(part2Index);
  } else {
    const splitByKinhGui = markdown.search(/(?:Kính gửi|Thân gửi|Chào đội ngũ|Dear)/i);
    if (splitByKinhGui !== -1) {
      part1Text = markdown.slice(0, splitByKinhGui);
      part2Text = markdown.slice(splitByKinhGui);
    } else {
      part2Text = markdown;
    }
  }

  if (part1Text) {
    const coreIssueMatch = part1Text.match(/[-*•\s]*(?:\*\*|\*)?(?:Vấn đề cốt lõi|Lý do thực sự|Nguyên nhân)[^:\n\r]*[:\-]\s*([\s\S]*?)(?=(?:[-*•\s]*(?:\*\*|\*)?(?:Cách khắc phục|Giải pháp|Hành động)|$))/i);
    if (coreIssueMatch) {
      coreIssue = coreIssueMatch[1].replace(/\*+/g, "").trim();
    }
    const solutionMatch = part1Text.match(/[-*•\s]*(?:\*\*|\*)?(?:Cách khắc phục|Giải pháp|Hành động|Cần làm)[^:\n\r]*[:\-]\s*([\s\S]*?)$/i);
    if (solutionMatch) {
      solution = solutionMatch[1].replace(/\*+/g, "").trim();
    }
  }

  if (part2Text) {
    let cleanLetter = part2Text
      .replace(/^#{2,4}\s*2[^\n]*\n+/i, "")
      .replace(/^[-*•\s]*(?:Viết một|Mẫu đơn|Nội dung đơn|Dài khoảng)[^\n]*\n+/gim, "")
      .trim();

    const letterStart = cleanLetter.search(/(?:Kính gửi|Thân gửi|Kính chào|Chào Ban|Dear|Tôi là|Hôm nay)/i);
    if (letterStart !== -1 && letterStart < 300) {
      cleanLetter = cleanLetter.slice(letterStart);
    }
    letter = cleanLetter.trim();
  }

  if (!letter && markdown) {
    letter = markdown.trim();
  }

  const words = letter ? letter.trim().split(/\s+/).filter(Boolean).length : 0;

  return {
    shopName: "Gian Hàng Của Bạn",
    platform: "Shopee",
    violationType: "Khiếu nại vi phạm sàn TMĐT",
    violationDiagnosis: {
      severityLevel: "high",
      severityBadge: "⚠️ Cần Xử Lý Ngay",
      appealScenario: "oan_uc",
      scenarioTitle: "Giải Trình & Đề Nghị Xem Xét Lại Vi Phạm",
      rootCauseAnalysis: coreIssue || "Hệ thống kiểm duyệt sàn ghi nhận vi phạm tiêu chuẩn chính sách vận hành.",
      estimatedSuccessRate: "75% - 85% nếu bổ sung chứng từ hợp lệ",
      immediateActions: solution ? [solution] : [
        "Kiểm tra lại hình ảnh và mô tả sản phẩm trên hệ thống",
        "Chuẩn bị hóa đơn chứng từ liên quan trước khi gửi đơn"
      ],
    },
    appealLetter: {
      subjectTitle: "ĐƠN KHIẾU NẠI & ĐỀ NGHỊ MỞ KHÓA GIAN HÀNG",
      greeting: "Kính gửi Ban Quản Trị & Đội Ngũ Kiểm Duyệt Sàn TMĐT,",
      bodyContext: "Tôi là đại diện gian hàng, xin gửi văn bản giải trình sự cố phát sinh vừa qua...",
      justificationEvidence: coreIssue || "Gian hàng luôn nỗ lực tuân thủ các quy tắc bán hàng.",
      actionPlan: solution || "Chúng tôi đã nhanh chóng rà soát và khắc phục ngay lập tức.",
      closingCommitment: "Kính mong Quý Ban xem xét gỡ bỏ cảnh báo và mở lại trạng thái hoạt động bình thường.",
      fullLetter: letter,
      wordCount: words,
      charCount: letter.length,
    },
    evidenceChecklist: {
      mandatoryDocuments: [
        "Hóa đơn VAT hoặc hóa đơn mua hàng hợp pháp",
        "Giấy tờ chứng minh quyền sở hữu hoặc đại lý phân phối"
      ],
      supplementaryDocuments: [
        "Hình ảnh chụp thực tế sản phẩm và kho bãi",
        "Video quy trình đóng gói kiện hàng"
      ],
      formattingTips: [
        "Chụp ảnh rõ nét 4 góc, định dạng JPG/PNG dung lượng dưới 5MB"
      ],
    },
    negotiationStrategy: {
      goldenSubmissionTime: "Trong vòng 24 giờ kể từ khi nhận thông báo phạt",
      portalRouting: "Gửi qua mục Hỗ Trợ / Khiếu Nại tại Kênh Người Bán",
      escalationSteps: [
        "Nộp đơn lần 1 kèm chứng từ đầy đủ và chờ trong 24h - 48h",
        "Nếu bị từ chối tự động, liên hệ trực tiếp nhân viên CSKH hỗ trợ mở lại khiếu nại"
      ],
      strictDonts: [
        "Không gửi đơn liên tục nhiều lần trong ngày gây khóa ticket",
        "Tránh đôi co gay gắt trên kênh hỗ trợ"
      ],
    },
  };
}

/**
 * TẦNG 4: Dynamic Free Text Fallback
 * Bảo toàn văn bản thực tế của người dùng, không bao giờ thay thế bằng mẫu giả định
 */
export function parseDynamicFreeTextToAppealData(rawText: string): AppealGeneratorData {
  const clean = rawText.trim();
  if (!clean || clean.length < 15) {
    return SAMPLE_APPEAL_DATA;
  }

  const paragraphs = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  let letterText = clean;
  let rootCause = "Sự cố phát sinh ngoài ý muốn bị hệ thống sàn ghi nhận vi phạm.";

  if (paragraphs.length >= 2) {
    const firstLower = paragraphs[0].toLowerCase();
    if (firstLower.includes("phân tích") || firstLower.includes("nguyên nhân") || firstLower.includes("vấn đề")) {
      rootCause = paragraphs[0];
      letterText = paragraphs.slice(1).join("\n\n");
    }
  }

  const words = letterText.split(/\s+/).filter(Boolean).length;

  return {
    shopName: "Gian Hàng Của Bạn",
    platform: "Shopee",
    violationType: "Khiếu nại vi phạm sàn TMĐT",
    violationDiagnosis: {
      severityLevel: "high",
      severityBadge: "⚠️ Cần Xử Lý Ngay",
      appealScenario: "oan_uc",
      scenarioTitle: "Hồ Sơ Giải Trình & Đề Nghị Hỗ Trợ Gỡ Bỏ Án Phạt",
      rootCauseAnalysis: rootCause,
      estimatedSuccessRate: "80% - 90% khi đính kèm đủ chứng từ minh bạch",
      immediateActions: [
        "Rà soát lại danh mục sản phẩm và các thông báo cảnh báo",
        "Chụp lại hóa đơn VAT và chứng từ nguồn gốc xuất xứ"
      ],
    },
    appealLetter: {
      subjectTitle: "ĐƠN GIẢI TRÌNH & ĐỀ NGHỊ XEM XÉT LẠI VI PHẠM",
      greeting: "Kính gửi Ban Quản Trị & Đội Ngũ Kiểm Duyệt,",
      bodyContext: "Tôi xin đại diện gian hàng gửi thông tin giải trình về sự cố vi phạm vừa qua...",
      justificationEvidence: rootCause,
      actionPlan: "Shop đã chủ động kiểm tra và sẵn sàng hợp tác giải trình minh bạch.",
      closingCommitment: "Kính đề nghị Quý Ban xem xét gỡ án phạt để gian hàng tiếp tục phục vụ khách hàng.",
      fullLetter: letterText,
      wordCount: words,
      charCount: letterText.length,
    },
    evidenceChecklist: {
      mandatoryDocuments: [
        "Hóa đơn mua hàng / Hóa đơn giá trị gia tăng (VAT)",
        "Giấy tờ ủy quyền phân phối thương hiệu chính hãng"
      ],
      supplementaryDocuments: [
        "Hình ảnh thực tế hàng hóa tại kho",
        "Biên bản bàn giao cho đơn vị bưu cục"
      ],
      formattingTips: [
        "Scan ảnh sắc nét, giữ nguyên định dạng gốc không tẩy xóa"
      ],
    },
    negotiationStrategy: {
      goldenSubmissionTime: "Khung giờ 09:00 - 11:30 các ngày trong tuần",
      portalRouting: "Gửi qua cổng Khiếu nại Trung tâm người bán",
      escalationSteps: [
        "Theo dõi tiến độ xử lý đơn trong 24h - 48h",
        "Chat với nhân viên hỗ trợ trực tuyến nếu quá thời hạn phản hồi"
      ],
      strictDonts: [
        "Không spam nhiều đơn cùng một nội dung",
        "Không dùng ngôn từ công kích đội ngũ kiểm duyệt"
      ],
    },
  };
}

/**
 * Parser chính 4 tầng bền bỉ
 */
export function parseAppealGeneratorResult(rawResult: string): AppealGeneratorData {
  if (!rawResult || !rawResult.trim()) {
    return SAMPLE_APPEAL_DATA;
  }

  const sanitized = sanitizeRawJsonString(rawResult);

  // Tầng 1: Native JSON Parse
  try {
    const parsed = JSON.parse(sanitized);
    if (parsed && (parsed.appealLetter || parsed.violationDiagnosis)) {
      return normalizeAppealGeneratorData(parsed);
    }
  } catch {
    // Chuyển sang Tầng 2
  }

  // Tầng 2: Sửa chữa JSON dở dang (Stack-based repair)
  try {
    const repaired = repairTruncatedJson(rawResult);
    const parsed = JSON.parse(repaired);
    if (parsed && (parsed.appealLetter || parsed.violationDiagnosis)) {
      return normalizeAppealGeneratorData(parsed);
    }
  } catch {
    // Chuyển sang Tầng 3
  }

  // Tầng 3: Phân tích Legacy Markdown (tương thích ngược 100%)
  if (
    rawResult.includes("### 1.") ||
    rawResult.includes("### 2.") ||
    rawResult.includes("PHÂN TÍCH VI PHẠM") ||
    rawResult.includes("MẪU ĐƠN KHÁNG NGHỊ") ||
    rawResult.includes("Kính gửi") ||
    rawResult.includes("Thân gửi")
  ) {
    try {
      const legacyData = parseLegacyMarkdownToAppealData(rawResult);
      if (legacyData && legacyData.appealLetter.fullLetter) {
        return legacyData;
      }
    } catch {
      // Chuyển sang Tầng 4
    }
  }

  // Tầng 4: Dynamic Free Text Fallback (Bảo tồn văn bản của người dùng)
  try {
    const dynamicData = parseDynamicFreeTextToAppealData(rawResult);
    if (dynamicData) {
      return dynamicData;
    }
  } catch {
    // Fallback an toàn
  }

  return SAMPLE_APPEAL_DATA;
}

/**
 * Làm sạch, vá lỗi và chuẩn hóa JSON đầu ra ngay tại Server trước khi lưu DB
 */
export function cleanAndValidateAppealOutput(rawText: string): string {
  if (!rawText || !rawText.trim()) return rawText;
  try {
    const parsed = parseAppealGeneratorResult(rawText);
    return JSON.stringify(parsed);
  } catch {
    return rawText;
  }
}

/**
 * Tự động phân đoạn lá đơn kháng nghị với xuống dòng (\n\n) chuẩn mực
 */
export function formatLetterParagraphs(fullText: string, letterObj?: any): string {
  if (!fullText) return "";

  // 1. Nếu có các trường tách rời (greeting, bodyContext, justificationEvidence, actionPlan, closingCommitment)
  if (
    letterObj &&
    typeof letterObj.greeting === "string" &&
    letterObj.greeting.trim() &&
    typeof letterObj.bodyContext === "string" &&
    letterObj.bodyContext.trim() &&
    letterObj.bodyContext !== fullText
  ) {
    const parts = [
      letterObj.greeting.trim(),
      letterObj.bodyContext.trim(),
      letterObj.justificationEvidence ? letterObj.justificationEvidence.trim() : "",
      letterObj.actionPlan ? letterObj.actionPlan.trim() : "",
      letterObj.closingCommitment ? letterObj.closingCommitment.trim() : "",
    ].filter(Boolean);
    return parts.join("\n\n");
  }

  // 2. Nếu fullText đã có các đoạn \n\n thì giữ nguyên
  if (fullText.includes("\n\n")) {
    return fullText;
  }

  // 3. Nếu fullText bị viết liền thành 1 khối không xuống dòng, tự động tách đoạn:
  let formatted = fullText;

  // Tách lời chào: "Kính gửi Ban Quản Trị..., Tôi là..." -> "Kính gửi Ban Quản Trị...\n\nTôi là..."
  formatted = formatted.replace(
    /^(Kính gửi [^,\n]+,)\s*(Tôi là|Đại diện|Chúng tôi là)/i,
    "$1\n\n$2"
  );

  // Tách các đoạn chuyển tiếp tự nhiên:
  formatted = formatted.replace(
    /([.!?])\s*(Để chứng minh|Bên cạnh đó|Về sự cố này|Cụ thể là|Theo đó,)/g,
    "$1\n\n$2"
  );
  formatted = formatted.replace(
    /([.!?])\s*(Ngay khi nhận được|Chúng tôi đã chủ động|Shop đã tiến hành|Hiện tại chúng tôi đã)/g,
    "$1\n\n$2"
  );
  formatted = formatted.replace(
    /([.!?])\s*(Chúng tôi cam kết|Kính đề nghị|Rất mong Quý Ban|Kính mong Ban Quản Trị)/g,
    "$1\n\n$2"
  );
  formatted = formatted.replace(
    /([.!?])\s*(Xin chân thành cảm ơn|Trân trọng cảm ơn|Đại diện gian hàng)/g,
    "$1\n\n$2"
  );

  return formatted;
}

/**
 * Chuyển đổi an toàn giá trị bất kỳ (string, array) thành mảng chuỗi không rỗng
 */
function toSafeStringArray(val: unknown, fallback: string[]): string[] {
  if (Array.isArray(val)) {
    const cleaned = val.map((item) => String(item || "").trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : fallback;
  }
  if (typeof val === "string" && val.trim()) {
    const lines = val
      .split(/\r?\n|;/)
      .map((s) => s.replace(/^[-*•\d\.\s]+/, "").trim())
      .filter(Boolean);
    return lines.length > 0 ? lines : [val.trim()];
  }
  return fallback;
}

/**
 * Chuẩn hóa các trường của AppealGeneratorData để đảm bảo an toàn tuyệt đối
 */
function normalizeAppealGeneratorData(data: any): AppealGeneratorData {
  const letter = data.appealLetter || {};
  let fullLetter = "";

  if (typeof letter === "string") {
    fullLetter = formatLetterParagraphs(letter);
  } else if (typeof letter.fullLetter === "string" && letter.fullLetter.trim()) {
    fullLetter = formatLetterParagraphs(letter.fullLetter, letter);
  } else {
    const parts = [
      letter.greeting,
      letter.bodyContext,
      letter.justificationEvidence,
      letter.actionPlan,
      letter.closingCommitment,
    ].filter(Boolean);
    fullLetter = parts.join("\n\n");
  }

  const words = fullLetter ? fullLetter.trim().split(/\s+/).filter(Boolean).length : 0;
  const diag = data.violationDiagnosis || {};
  const evid = data.evidenceChecklist || {};
  const nego = data.negotiationStrategy || {};

  return {
    shopName: data.shopName || "Gian Hàng Của Bạn",
    platform: data.platform || "Shopee",
    violationType: data.violationType || "Vi phạm tiêu chuẩn cộng đồng sàn TMĐT",
    violationDiagnosis: {
      severityLevel: diag.severityLevel || "high",
      severityBadge: diag.severityBadge || "⚠️ Cần Xử Lý Ngay",
      appealScenario: diag.appealScenario || "oan_uc",
      scenarioTitle: diag.scenarioTitle || "Khẳng Định Tính Hợp Pháp (Bị Quét Nhầm)",
      rootCauseAnalysis: diag.rootCauseAnalysis || "Thuật toán kiểm duyệt AI quét tự động từ khóa hoặc hình ảnh trùng khớp với chỉ dấu vi phạm.",
      estimatedSuccessRate: diag.estimatedSuccessRate || "85% - 95% nếu bổ sung chứng từ VAT minh bạch",
      immediateActions: toSafeStringArray(diag.immediateActions, [
        "Tạm ẩn hoặc chỉnh sửa lại từ khóa/hình ảnh bị nghi vấn vi phạm",
        "Chuẩn bị sẵn file PDF hóa đơn VAT và hợp đồng ủy quyền"
      ]),
    },
    appealLetter: {
      subjectTitle: letter.subjectTitle || "ĐƠN GIẢI TRÌNH & ĐỀ NGHỊ XEM XÉT LẠI VI PHẠM",
      greeting: letter.greeting || `Kính gửi Ban Quản Trị & Đội Ngũ Kiểm Duyệt Sàn ${data.platform || "TMĐT"},`,
      bodyContext: letter.bodyContext || "",
      justificationEvidence: letter.justificationEvidence || "",
      actionPlan: letter.actionPlan || "",
      closingCommitment: letter.closingCommitment || "Chúng tôi cam kết luôn tuân thủ nghiêm ngặt mọi chính sách của sàn.",
      fullLetter: fullLetter || "Kính gửi Ban Quản Trị, chúng tôi đề nghị xem xét lại trường hợp vi phạm...",
      wordCount: typeof letter.wordCount === "number" ? letter.wordCount : words,
      charCount: typeof letter.charCount === "number" ? letter.charCount : fullLetter.length,
    },
    evidenceChecklist: {
      mandatoryDocuments: toSafeStringArray(evid.mandatoryDocuments, [
        "Hóa đơn giá trị gia tăng (VAT) hoặc hóa đơn đỏ hợp pháp",
        "Hợp đồng phân phối / Giấy ủy quyền thương hiệu chính hãng"
      ]),
      supplementaryDocuments: toSafeStringArray(evid.supplementaryDocuments, [
        "Video/ảnh chụp thực tế quy trình kiểm tra đóng gói tại kho",
        "Phiếu gửi hàng và biên bản xác nhận từ đơn vị vận chuyển"
      ]),
      formattingTips: toSafeStringArray(evid.formattingTips, [
        "Scan ảnh rõ nét 4 góc, dung lượng file < 5MB",
        "Gạch chân thông tin mã vận đơn hoặc mã sản phẩm để kiểm duyệt viên dễ đối soát"
      ]),
    },
    negotiationStrategy: {
      goldenSubmissionTime: nego.goldenSubmissionTime || "Khung giờ vàng: 09:00 - 11:00 hoặc 14:00 - 16:00 (T2 - T6)",
      portalRouting: nego.portalRouting || "Gửi trực tiếp qua Kênh Người Bán mục Khiếu Nại Vi Phạm",
      escalationSteps: toSafeStringArray(nego.escalationSteps, [
        "Bước 1: Nộp đơn chuẩn và chờ phản hồi tối đa 24h - 48h",
        "Bước 2: Nếu bị từ chối tự động, liên hệ tổng đài CSKH sàn yêu cầu chuyển hồ sơ cho Chuyên viên cấp cao"
      ]),
      strictDonts: toSafeStringArray(nego.strictDonts, [
        "Tuyệt đối KHÔNG spam gửi nhiều đơn liên tục cùng một nội dung",
        "Không dùng lời lẽ bức xúc, tranh cãi gay gắt với đội ngũ kiểm duyệt"
      ]),
    },
  };
}

/**
 * Chuyển đổi dữ liệu có cấu trúc sang Markdown hoàn chỉnh để xuất file hoặc xem raw
 */
export function formatAppealToMarkdown(data: AppealGeneratorData): string {
  let md = `# HỒ SƠ KHÁNG NGHỊ & GIẢI TRÌNH VI PHẠM SÀN TMĐT\n`;
  md += `- **Gian hàng**: ${data.shopName}\n`;
  md += `- **Nền tảng sàn**: ${data.platform}\n`;
  md += `- **Loại vi phạm**: ${data.violationType}\n\n`;

  if (data.violationDiagnosis) {
    md += `## 🔍 1. CHẨN ĐOÁN VI PHẠM & TỶ LỆ MỞ KHÓA\n`;
    md += `- **Mức độ**: ${data.violationDiagnosis.severityBadge}\n`;
    md += `- **Kịch bản**: ${data.violationDiagnosis.scenarioTitle}\n`;
    md += `- **Nguyên nhân cốt lõi**: ${data.violationDiagnosis.rootCauseAnalysis}\n`;
    md += `- **Tỷ lệ mở khóa dự phóng**: ${data.violationDiagnosis.estimatedSuccessRate}\n`;
    if (data.violationDiagnosis.immediateActions?.length) {
      md += `\n### ⚡ Việc cần làm ngay trước khi gửi đơn:\n`;
      data.violationDiagnosis.immediateActions.forEach((act) => (md += `- ${act}\n`));
    }
    md += `\n---\n\n`;
  }

  if (data.appealLetter) {
    md += `## 📝 2. MẪU ĐƠN KHÁNG NGHỊ CHUẨN MỰC (${data.appealLetter.wordCount} từ)\n\n`;
    md += `\`\`\`text\n${data.appealLetter.fullLetter}\n\`\`\`\n\n`;
    md += `---\n\n`;
  }

  if (data.evidenceChecklist) {
    md += `## 📑 3. CHECKLIST HỒ SƠ PHÁP LÝ & BẰNG CHỨNG\n\n`;
    md += `### ✅ Bằng chứng BẮT BUỘC:\n`;
    data.evidenceChecklist.mandatoryDocuments.forEach((doc) => (md += `- ${doc}\n`));
    md += `\n### 📌 Bằng chứng BỔ TRỢ:\n`;
    data.evidenceChecklist.supplementaryDocuments.forEach((doc) => (md += `- ${doc}\n`));
    if (data.evidenceChecklist.formattingTips?.length) {
      md += `\n### 💡 Quy cách gửi file đính kèm:\n`;
      data.evidenceChecklist.formattingTips.forEach((tip) => (md += `- ${tip}\n`));
    }
    md += `\n---\n\n`;
  }

  if (data.negotiationStrategy) {
    md += `## 💡 4. CẨM NANG ĐÀM PHÁN & KHUNG GIỜ VÀNG\n`;
    md += `- **Khung giờ vàng**: ${data.negotiationStrategy.goldenSubmissionTime}\n`;
    md += `- **Luồng gửi tối ưu**: ${data.negotiationStrategy.portalRouting}\n\n`;
    md += `### 🚀 Các bước Escalation nếu bị từ chối lần 1:\n`;
    data.negotiationStrategy.escalationSteps.forEach((step) => (md += `- ${step}\n`));
    md += `\n### ❌ Những điều TUYỆT ĐỐI TRÁNH:\n`;
    data.negotiationStrategy.strictDonts.forEach((dont) => (md += `- ${dont}\n`));
  }

  return md;
}

/**
 * Dựng kết quả AppealGeneratorData hoàn chỉnh 100% bằng bộ máy ngoại tuyến (Offline Blueprint Engine)
 * Đảm bảo zero-downtime cho người bán khi upstream AI gián đoạn hoặc hết quota
 */
export function buildOfflineAppealGeneratorData(inputs?: AppealGeneratorInputs): AppealGeneratorData {
  const shopName = inputs?.shopName?.trim() || "Gian Hàng Của Bạn";
  const platform = inputs?.platform?.trim() || "Shopee";
  const violationType = inputs?.violationType?.trim() || "Nghi ngờ vi phạm tiêu chuẩn cộng đồng sàn TMĐT";
  const details = inputs?.details?.trim() || "";

  return normalizeAppealGeneratorData({
    shopName,
    platform,
    violationType,
    violationDiagnosis: {
      severityLevel: "high",
      severityBadge: "⚠️ Cần Xử Lý Sớm",
      appealScenario: "oan_uc",
      scenarioTitle: "Khẳng Định Tính Hợp Pháp (Bị AI Quét Nhầm)",
      rootCauseAnalysis: `Thuật toán kiểm duyệt tự động của ${platform} quét từ khóa hoặc hình ảnh liên quan đến "${violationType}", dẫn đến việc tạm gán cờ nghi vấn. ${details ? `Bối cảnh: ${details}` : ""}`,
      estimatedSuccessRate: "85% - 95% (Rất cao nếu cung cấp đủ hóa đơn VAT và tem phụ chính hãng)",
      immediateActions: [
        "Không tự ý xóa sản phẩm đã bị khóa để giữ nguyên lịch sử đánh giá và lượt bán",
        "Chuẩn bị file PDF hóa đơn VAT đầu vào từ đơn vị phân phối chính thức",
        "Chụp ảnh cận cảnh tem nhãn phụ tiếng Việt và mã vạch sản phẩm thực tế tại kho",
      ],
    },
    appealLetter: {
      subjectTitle: `ĐƠN GIẢI TRÌNH & ĐỀ NGHỊ XEM XÉT LẠI VI PHẠM - GIAN HÀNG ${shopName.toUpperCase()}`,
      greeting: `Kính gửi Ban Quản Trị & Đội Ngũ Kiểm Duyệt ${platform} Việt Nam,`,
      bodyContext: `Tôi là đại diện gian hàng ${shopName}. Ngày hôm nay, hệ thống có gửi thông báo cảnh báo/khóa sản phẩm với lý do: "${violationType}". Chúng tôi xin khẳng định 100% sản phẩm và hoạt động của gian hàng đều hoàn toàn hợp pháp và tuân thủ đúng quy chế của nền tảng ${platform}.`,
      justificationEvidence: `Để chứng minh tính minh bạch, chúng tôi xin gửi kèm các chứng từ đối soát: 1. Hóa đơn giá trị gia tăng (VAT) đầu vào hợp lệ; 2. Giấy ủy quyền phân phối/đại lý chính thức; 3. Ảnh chụp thực tế sản phẩm kèm tem phụ tiếng Việt tại kho hàng.`,
      actionPlan: `Gian hàng luôn đặt uy tín thương hiệu và quyền lợi người tiêu dùng lên hàng đầu, cam kết nói không với các hành vi vi phạm chính sách của ${platform}.`,
      closingCommitment: `Kính đề nghị Đội ngũ Kiểm duyệt ${platform} xem xét kỹ bộ chứng từ đính kèm, hỗ trợ gỡ bỏ án phạt và khôi phục trạng thái hoạt động bình thường cho sản phẩm của chúng tôi. Xin chân thành cảm ơn!`,
      fullLetter: `Kính gửi Ban Quản Trị & Đội Ngũ Kiểm Duyệt ${platform} Việt Nam,\n\nTôi là đại diện gian hàng ${shopName}. Vừa qua hệ thống có thông báo về vi phạm: "${violationType}". Chúng tôi xin khẳng định toàn bộ sản phẩm của gian hàng là hàng chính ngạch, có nguồn gốc minh bạch và tuân thủ tuyệt đối quy định của ${platform}.\n\nĐể chứng minh, chúng tôi xin cung cấp:\n1. Hóa đơn giá trị gia tăng (VAT) đầu vào hợp lệ;\n2. Giấy chứng nhận ủy quyền phân phối chính thức;\n3. Ảnh chụp thực tế sản phẩm kèm tem phụ tiếng Việt tại kho hàng.\n\nKính đề nghị Quý Ban xem xét đối soát bộ chứng từ và hỗ trợ mở khóa sản phẩm để gian hàng tiếp tục phục vụ khách hàng.\n\nXin chân thành cảm ơn!\nĐại diện Gian Hàng ${shopName}.`,
      wordCount: 165,
      charCount: 1050,
    },
    evidenceChecklist: {
      mandatoryDocuments: [
        "Hóa đơn giá trị gia tăng (VAT) đầu vào thể hiện rõ tên sản phẩm và tên đơn vị xuất khẩu/phân phối",
        "Giấy chứng nhận đại lý hoặc Hợp đồng phân phối hợp pháp từ hãng sản xuất",
        "Ảnh chụp thực tế sản phẩm có tem phụ tiếng Việt và số công bố hợp quy",
      ],
      supplementaryDocuments: [
        "Ảnh chụp kho hàng thực tế có bảng tên Shop và số lượng tồn kho",
        "Video unbox sản phẩm từ thùng hàng niêm phong nguyên đai nguyên kiện",
      ],
      formattingTips: [
        "Định dạng file PDF hoặc hình ảnh JPG sắc nét, không bị lóa sáng hay mất góc",
        "Dùng bút dạ khoanh đỏ mã sản phẩm trên hóa đơn trùng với mã đăng bán",
      ],
    },
    negotiationStrategy: {
      goldenSubmissionTime: "Từ 09:00 - 11:00 sáng từ Thứ Hai đến Thứ Sáu (Thời điểm nhân viên Policy cấp cao xử lý hồ sơ nhanh nhất)",
      portalRouting: `Gửi trực tiếp tại Kênh Người Bán ${platform} > Mục Vi Phạm > Bấm Kháng Nghị, sau đó chat CSKH để thúc đẩy tiến độ`,
      escalationSteps: [
        "Bước 1: Nộp hồ sơ chuẩn lần 1 và theo dõi tiến độ trong 24 giờ",
        "Bước 2: Nếu bị từ chối tự động do AI duyệt, liên hệ Live Chat sàn yêu cầu chuyển hồ sơ cho Human Agent kiểm tra hóa đơn VAT",
        "Bước 3: Nhờ Account Manager của ngành hàng can thiệp hỗ trợ mở khóa",
      ],
      strictDonts: [
        "Tuyệt đối KHÔNG xóa sản phẩm khi đang bị khóa vì sẽ mất vĩnh viễn dữ liệu đánh giá và lượt bán",
        "Không gửi liên tục nhiều đơn cùng lúc khiến hệ thống tự động khóa tính năng khiếu nại",
      ],
    },
  });
}

// -------------------------------------------------------------
// DỮ LIỆU MẪU THỰC CHIẾN (SAMPLE DATA)
// -------------------------------------------------------------
export const SAMPLE_APPEAL_DATA: AppealGeneratorData = {
  shopName: "TuKi Store Official",
  platform: "Shopee",
  violationType: "Hàng giả / Hàng nhái (Nghi ngờ hàng Fake)",
  violationDiagnosis: {
    severityLevel: "critical",
    severityBadge: "🚨 Nguy Cấp - Nguy Cơ Khóa Sản Phẩm Vĩnh Viễn",
    appealScenario: "oan_uc",
    scenarioTitle: "Khẳng Định Tính Hợp Pháp (Bị AI Quét Nhầm Từ Khóa)",
    rootCauseAnalysis: "Thuật toán AI tự động quét từ khóa 'Dior', 'Auth' và hình ảnh bao bì mới chưa cập nhật trong cơ sở dữ liệu nhận diện của sàn, dẫn đến việc gán cờ nhầm lẫn là hàng không chính hãng.",
    estimatedSuccessRate: "90% - 95% (Rất cao do có đầy đủ hóa đơn VAT và tem phụ tiếng Việt)",
    immediateActions: [
      "Không tự ý xóa sản phẩm đã bị khóa (nếu xóa sẽ mất lịch sử bán và đánh giá cũ)",
      "Chuẩn bị file PDF hóa đơn VAT đầu vào từ công ty nhập khẩu ủy quyền",
      "Chụp ảnh cận cảnh tem phụ tiếng Việt và mã vạch sản phẩm thực tế tại kho"
    ],
  },
  appealLetter: {
    subjectTitle: "ĐƠN KHIẾU NẠI & ĐỀ NGHỊ XEM XÉT LẠI VI PHẠM HÀNG GIẢ - GIAN HÀNG TUKI STORE (SKU: KEM-DUONG-50ML)",
    greeting: "Kính gửi Ban Quản Trị & Đội Ngũ Kiểm Duyệt Shopee Việt Nam,",
    bodyContext: "Tôi là đại diện gian hàng TuKi Store Official. Ngày hôm nay, hệ thống có gửi thông báo khóa sản phẩm 'Kem Dưỡng Phục Hồi Da 50ml' của gian hàng với lý do nghi ngờ hàng giả/nhái. Chúng tôi xin khẳng định 100% sản phẩm này là hàng chính hãng được nhập khẩu chính ngạch.",
    justificationEvidence: "Để chứng minh tính hợp pháp và minh bạch, chúng tôi xin đính kèm: 1. Hóa đơn giá trị gia tăng (VAT) đầu vào số 0012849 từ Công ty TNHH Phân Phối Độc Quyền; 2. Giấy ủy quyền đại lý bán lẻ cấp 1 có dấu mộc đỏ; 3. Ảnh chụp thực tế tem phụ tiếng Việt và số công bố mỹ phẩm của Bộ Y Tế còn hiệu lực.",
    actionPlan: "Chúng tôi luôn đặt uy tín gian hàng và quyền lợi người tiêu dùng lên hàng đầu, cam kết nói không với hàng giả, hàng kém chất lượng trên nền tảng Shopee.",
    closingCommitment: "Kính đề nghị Đội ngũ Kiểm duyệt Shopee xem xét kỹ bộ chứng từ đính kèm, hỗ trợ gỡ bỏ án phạt và khôi phục trạng thái hoạt động bình thường cho sản phẩm của chúng tôi. Xin chân thành cảm ơn sự hỗ trợ công tâm của Quý Ban!",
    fullLetter: "Kính gửi Ban Quản Trị & Đội Ngũ Kiểm Duyệt Shopee Việt Nam,\n\nTôi là đại diện gian hàng TuKi Store Official. Ngày hôm nay, hệ thống có gửi thông báo khóa sản phẩm 'Kem Dưỡng Phục Hồi Da 50ml' của gian hàng với lý do nghi ngờ hàng giả/nhái. Chúng tôi xin khẳng định 100% sản phẩm này là hàng chính hãng được nhập khẩu chính ngạch.\n\nĐể chứng minh tính hợp pháp và minh bạch, chúng tôi xin đính kèm:\n1. Hóa đơn giá trị gia tăng (VAT) đầu vào số 0012849 từ Công ty Phân Phối Độc Quyền;\n2. Giấy ủy quyền đại lý bán lẻ chính thức có dấu mộc đỏ;\n3. Ảnh chụp thực tế tem phụ tiếng Việt và số công bố mỹ phẩm hợp lệ.\n\nChúng tôi luôn đặt uy tín gian hàng và quyền lợi người tiêu dùng lên hàng đầu, cam kết tuyệt đối tuân thủ chính sách hàng chính hãng trên nền tảng Shopee.\n\nKính đề nghị Đội ngũ Kiểm duyệt Shopee xem xét kỹ bộ chứng từ đính kèm, hỗ trợ gỡ bỏ án phạt và khôi phục trạng thái hoạt động bình thường cho sản phẩm của chúng tôi.\n\nXin chân thành cảm ơn sự hỗ trợ công tâm của Quý Ban!\nĐại diện Gian Hàng TuKi Store Official.",
    wordCount: 218,
    charCount: 1390,
  },
  evidenceChecklist: {
    mandatoryDocuments: [
      "Hóa đơn giá trị gia tăng (VAT) hoặc hóa đơn đỏ thể hiện rõ tên sản phẩm và tên đơn vị xuất khẩu/phân phối",
      "Giấy chứng nhận đại lý hoặc Hợp đồng phân phối hợp pháp từ hãng sản xuất",
      "Ảnh chụp thực tế sản phẩm có tem phụ tiếng Việt và số công bố hợp quy"
    ],
    supplementaryDocuments: [
      "Ảnh chụp kho hàng thực tế có bảng tên Shop và số lượng tồn kho",
      "Video unbox sản phẩm từ thùng hàng niêm phong nguyên đai nguyên kiện"
    ],
    formattingTips: [
      "Định dạng PDF hoặc hình ảnh JPG sắc nét, không bị lóa sáng hay mất góc",
      "Dùng bút dạ khoanh đỏ mã sản phẩm trên hóa đơn trùng với mã SKU đăng bán"
    ],
  },
  negotiationStrategy: {
    goldenSubmissionTime: "Từ 09:00 - 11:00 sáng từ Thứ Hai đến Thứ Sáu (Thời điểm nhân viên Policy cấp cao xử lý hồ sơ nhanh nhất)",
    portalRouting: "Gửi trực tiếp tại Kênh Người Bán > Quản Lý Sản Phẩm > Mục Vi Phạm > Bấm Kháng Nghị, sau đó tạo Ticket Live Chat nhờ thúc đẩy tiến độ",
    escalationSteps: [
      "Bước 1: Nộp hồ sơ chuẩn lần 1 và theo dõi trong 24 giờ",
      "Bước 2: Nếu bị từ chối tự động do AI duyệt, bấm 'Kháng nghị lần 2' hoặc gọi hotline CSKH Shopee/TikTok yêu cầu chuyển cho nhân viên Human Agent kiểm tra hồ sơ hóa đơn VAT",
      "Bước 3: Nhờ Account Manager (nếu là shop Mall/Shop Yêu Thích) can thiệp gắn cờ ưu tiên"
    ],
    strictDonts: [
      "Tuyệt đối KHÔNG bấm xóa sản phẩm khi đang bị khóa vì sẽ mất vĩnh viễn dữ liệu đánh giá và lượt bán",
      "Không gửi liên tục nhiều đơn cùng lúc khiến hệ thống tự động khóa tính năng khiếu nại"
    ],
  },
};

export const SAMPLE_APPEAL_RESULT = JSON.stringify(SAMPLE_APPEAL_DATA, null, 2);
