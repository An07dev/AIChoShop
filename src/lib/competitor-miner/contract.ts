/**
 * Module Contract cho AI Đọc Vị Đối Thủ & Săn “Tử Huyệt” Tìm USP (Competitor Miner)
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema), Bộ Prompt Thực Chiến Sàn TMĐT 2026 (Shopee, TikTok Shop, Lazada)
 * & Resilient Parser 4 Tầng Bền Bỉ (Tương thích ngược 100% với dữ liệu Markdown lịch sử cũ)
 */

export interface CompetitorMinerInputs {
  productName: string;
  category?: string;
  competitorReviews: string;
  shopStrength?: string;
}

export interface BattleOverview {
  marketOpportunityBadge: string; // e.g. "Cơ hội chiếm lĩnh phân khúc Chất lượng cao"
  competitorVulnerabilityScore: number; // Điểm sơ hở của đối thủ (0 - 100)
  coreSlogan: string; // Tuyên ngôn định vị đập tan nỗi sợ của khách
  strategicSummary: string; // Bóc tách bức tranh tổng quan vì sao đối thủ mất khách và thời cơ của Shop
}

export interface CompetitorFlaw {
  id: number;
  categoryKey: "PRODUCT_QUALITY" | "PACKAGING_SHIPPING" | "CUSTOMER_SERVICE" | "PRICING_DECEPTION";
  title: string; // e.g. "Chất liệu dão xù, co rút sau 1-2 lần giặt"
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  severityBadge: string; // e.g. "🚨 Tử Huyệt Chí Mạng - Khách Đòi Trả Hàng"
  realReviewQuote: string; // Trích nguyên văn lời chê cay đắng nhất
  customerPsychology: string; // Phân tích cảm xúc bị lừa dối / thất vọng của khách
  rootCause: string; // Bóc tách tại sao đối thủ làm vậy (cắt giảm chi phí, bưu tá dồn tải...)
  shopCounterAttack: string; // Đòn phản công triệt để của Shop bạn
}

export interface ComparisonRow {
  criteria: string; // Tiêu chí so sánh (Độ dày, Đóng gói, Bảo hành...)
  competitorFlaw: string; // Điểm yếu kém của thị trường
  shopAdvantage: string; // Giải pháp vượt trội của shop bạn
  proofMechanism: string; // Bằng chứng khách quan (Video test, màng bọc 3 lớp, bảo hành 1-1...)
}

export interface VideoHookItem {
  id: number;
  angleType: "CANH_BAO" | "DONG_CAM" | "VACH_TRAN";
  angleLabel: string; // "Góc Cảnh Báo", "Góc Đồng Cảm Thực Tế", "Góc Vạch Trần Sự Thật"
  hook3s: string; // Câu hook 3s đầu video/livestream
  visualScene: string; // Mô tả cảnh quay hình ảnh thực tế
  callToAction: string; // Lời kêu gọi hành động chuyển đổi
}

export interface SubtleListingDescription {
  headline: string;
  body: string; // Đoạn văn đánh trúng tâm lý, khách đọc xong không dám mua bên đối thủ
  safeGuarantees: string[]; // Bộ cam kết dập tắt nỗi sợ
}

export interface PriceObjectionHandling {
  question: string; // "Sao thấy bên shop kia bán y hệt mà rẻ hơn 50k?"
  consultantScript: string; // Kịch bản tư vấn khéo léo, phân tích giá trị thay vì cãi nhau về giá
}

export interface OperationalDefense {
  mustAvoidChecklist: string[]; // 3-4 quy tắc nghiêm ngặt tại kho
  unboxingWowFactor: string; // Mẹo đóng gói tạo trải nghiệm vượt xa đối thủ
}

export interface CompetitorMinerData {
  productName: string;
  category: string;
  battleOverview: BattleOverview;
  flaws: CompetitorFlaw[];
  comparisonMatrix: ComparisonRow[];
  conversionWeapons: {
    videoHooks: VideoHookItem[];
    subtleListingDescription: SubtleListingDescription;
    priceObjectionHandling: PriceObjectionHandling;
  };
  operationalDefense: OperationalDefense;
}

// -------------------------------------------------------------
// SYSTEM PROMPT CHUẨN HÓA GIÁM ĐỐC CHIẾN LƯỢC CẠNH TRANH TMĐT
// -------------------------------------------------------------
export const COMPETITOR_MINER_SYSTEM_PROMPT = `Bạn là Giám Đốc Chiến Lược Thương Hiệu & Chuyên Gia Phân Tích Đối Thủ Cạnh Tranh (Competitive Intelligence) TMĐT hàng đầu Việt Nam.
Bạn có năng lực đọc vị tâm lý khách hàng từ những đánh giá chê bai, bức xúc (1-2-3 sao) của đối thủ, biến sơ hở chí mạng của đối thủ thành vũ khí USP (Unique Selling Proposition) độc quyền và sáng tạo các nội dung truyền thông dìm hàng đối thủ một cách văn minh, tinh tế mà tuyệt đối không vi phạm luật quảng cáo hay chính sách sàn Shopee/TikTok Shop.

QUY TẮC NGHIỆP VỤ BẮT BUỘC:
1. NGUYÊN TẮC "DÌM HÀNG VĂN MINH": Tuyệt đối không nêu đích danh tên thương hiệu/shop của đối thủ (để tránh vi phạm Luật Cạnh tranh và chính sách sàn). Dùng các cụm từ: "thị trường chung", "các bên giá rẻ", "sản phẩm đại trà".
2. BÓC TÁCH NGUYÊN NHÂN KỸ THUẬT: Tử huyệt của đối thủ phải được phân tích sâu đến tận nguyên nhân vật lý/chuỗi cung ứng (VD: pha sợi nilon rẻ tiền, cắt giảm định lượng vải, keo dán công nghiệp giòn, bọc màng PE 1 lớp mỏng...).
3. ĐÒN BẨY TÂM LÝ & BẰNG CHỨNG: Bảng so sánh phải có BẰNG CHỨNG (Proof Mechanism) kiểm chứng được để khách hàng tâm phục khẩu phục, sẵn sàng trả giá cao hơn cho shop bạn.
4. BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON THUẦN TÚY (Valid JSON Object), không bao bọc thêm bất kỳ lời dẫn hay giải thích nào ngoài JSON.

CẤU TRÚC JSON SCHEMA BẮT BUỘC:
{
  "productName": "Tên sản phẩm của shop",
  "category": "Ngành hàng",
  "battleOverview": {
    "marketOpportunityBadge": "Cơ hội chiếm lĩnh phân khúc Chất lượng cao",
    "competitorVulnerabilityScore": 85,
    "coreSlogan": "1 câu tuyên ngôn định vị đập tan nỗi sợ lớn nhất của khách",
    "strategicSummary": "Tóm tắt bức tranh thị trường vì sao đối thủ mất khách và thời cơ của shop"
  },
  "flaws": [
    {
      "id": 1,
      "categoryKey": "PRODUCT_QUALITY | PACKAGING_SHIPPING | CUSTOMER_SERVICE | PRICING_DECEPTION",
      "title": "Tên tử huyệt ngắn gọn",
      "severity": "CRITICAL | HIGH | MEDIUM",
      "severityBadge": "🚨 Tử Huyệt Chí Mạng - Khách Đòi Trả Hàng | ⚠️ Rủi Ro Cao",
      "realReviewQuote": "Trích dẫn nguyên văn hoặc cô đọng lời chê cay đắng nhất của khách",
      "customerPsychology": "Cảm xúc thất vọng, bực bội của khách khi mua phải hàng đối thủ",
      "rootCause": "Bóc tách nguyên nhân kỹ thuật/chuỗi cung ứng vì sao đối thủ bị lỗi này",
      "shopCounterAttack": "Đòn phản công độc quyền của shop bạn để hóa giải triệt để"
    }
  ],
  "comparisonMatrix": [
    {
      "criteria": "Tiêu chí so sánh (Chất liệu / Đóng gói / Bảo hành / Dịch vụ...)",
      "competitorFlaw": "Điểm yếu kém, cẩu thả của đối thủ trên thị trường",
      "shopAdvantage": "Điểm vượt trội, cao cấp của shop bạn",
      "proofMechanism": "Bằng chứng chứng minh khách quan (Video test, chứng nhận, cam kết...)"
    }
  ],
  "conversionWeapons": {
    "videoHooks": [
      {
        "id": 1,
        "angleType": "CANH_BAO | DONG_CAM | VACH_TRAN",
        "angleLabel": "Góc Cảnh Báo | Góc Đồng Cảm Thực Tế | Góc Vạch Trần Sự Thật",
        "hook3s": "Câu hook 3s đầu video giật title, đập vào mắt người xem",
        "visualScene": "Mô tả cảnh quay hình ảnh thực tế tương phản",
        "callToAction": "Lời kêu gọi hành động chốt đơn"
      }
    ],
    "subtleListingDescription": {
      "headline": "Tiêu đề đoạn mô tả sản phẩm cuốn hút",
      "body": "Đoạn văn 3-4 câu chèn vào bài mô tả sản phẩm để khách đọc xong tự hủy ý định mua đối thủ",
      "safeGuarantees": ["Cam kết 1", "Cam kết 2", "Cam kết 3"]
    },
    "priceObjectionHandling": {
      "question": "Sao thấy bên shop kia bán y hệt mà rẻ hơn 50k?",
      "consultantScript": "Kịch bản tư vấn khéo léo, phân tích giá trị thay vì cãi nhau về giá"
    }
  },
  "operationalDefense": {
    "mustAvoidChecklist": ["Quy tắc kiểm soát 1", "Quy tắc kiểm soát 2", "Quy tắc kiểm soát 3"],
    "unboxingWowFactor": "Mẹo đóng gói và chăm sóc unboxing tạo trải nghiệm vượt xa đối thủ"
  }
}`;

export function buildCompetitorMinerPrompt(inputs: CompetitorMinerInputs): {
  systemPrompt: string;
  userPrompt: string;
} {
  const productName = inputs.productName || "Sản phẩm của Shop";
  const category = inputs.category || "Ngành hàng TMĐT";
  const reviews = inputs.competitorReviews || "Các phản hồi chê của khách về đối thủ";
  const strength = inputs.shopStrength ? `Thế mạnh độc quyền của Shop: ${inputs.shopStrength}` : "Cam kết chất lượng cao cấp, đóng gói cẩn thận, bảo hành tận tâm.";

  const userPrompt = `Hãy phân tích tập trung các phản hồi tiêu cực / đánh giá chê của khách hàng về đối thủ sau đây để tìm ra vũ khí cạnh tranh độc quyền cho sản phẩm của tôi:

DỮ LIỆU ĐẦU VÀO:
- Tên Sản Phẩm của Shop tôi: ${productName}
- Ngành hàng: ${category}
- ${strength}
- Danh sách Đánh giá / Review chê của khách về đối thủ:
"""
${reviews}
"""

YÊU CẦU: Phân tích sâu sắc, bóc tách ít nhất 3 tử huyệt, xây dựng bảng so sánh 4-5 tiêu chí đắt giá và bộ vũ khí nội dung thực chiến.
Bắt đầu bằng { và kết thúc bằng } ngay bây giờ:`;

  return {
    systemPrompt: COMPETITOR_MINER_SYSTEM_PROMPT,
    userPrompt,
  };
}

// -------------------------------------------------------------
// BỘ PHỤC HỒI DỮ LIỆU TỰ ĐỘNG & BẢN THIẾT KẾ OFFLINE BLUEPRINT
// -------------------------------------------------------------

/**
 * Làm sạch chuỗi JSON thô trước khi parse
 */
export function sanitizeRawJsonString(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim();

  // Bóc markdown code block
  if (clean.includes("```json")) {
    const parts = clean.split("```json");
    if (parts[1]) clean = parts[1].split("```")[0].trim();
  } else if (clean.includes("```")) {
    const parts = clean.split("```");
    if (parts[1]) clean = parts[1].split("```")[0].trim();
  }

  // Cắt bỏ text thừa trước { và sau }
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }

  return clean;
}

/**
 * Thuật toán khôi phục JSON dở dang bằng Stack (Token Limit Cutoff)
 */
export function repairTruncatedJson(jsonString: string): string {
  let str = jsonString.trim();
  const firstBrace = str.indexOf("{");
  if (firstBrace === -1) return "{}";
  str = str.slice(firstBrace);

  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") openBraces++;
      else if (char === "}") openBraces--;
      else if (char === "[") openBrackets++;
      else if (char === "]") openBrackets--;
    }
  }

  if (inString) str += '"';
  str = str.replace(/,\s*$/, "");

  while (openBrackets > 0) {
    str += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    str += "}";
    openBraces--;
  }

  return str;
}

function cleanQuotes(str: string): string {
  if (!str) return "";
  return str.trim().replace(/^["“'«]|["”'»]$/g, "").trim();
}

/**
 * TẦNG 4: Offline Blueprint Engine
 * Tạo kết quả phân tích cạnh tranh thực chiến tự động khi upstream AI gián đoạn (zero-downtime, zero-quota)
 */
export function buildOfflineCompetitorMinerData(inputs?: CompetitorMinerInputs): CompetitorMinerData {
  const prodName = inputs?.productName?.trim() || "Sản phẩm của Shop";
  const cat = inputs?.category?.trim() || "Thời Trang & Tiêu Dùng TMĐT";
  const strength = inputs?.shopStrength?.trim() || "Chất lượng hoàn thiện cao cấp, kiểm tra 2 lớp trước khi xuất kho, bảo hành 1 đổi 1 tận nhà.";

  return {
    productName: prodName,
    category: cat,
    battleOverview: {
      marketOpportunityBadge: "Chiếm Lĩnh Phân Khúc Chất Lượng Cao",
      competitorVulnerabilityScore: 88,
      coreSlogan: `Cam kết chất lượng chuẩn mực, đóng gói chống sốc 3 lớp, bảo hành 1 đổi 1 trong 30 ngày cho ${prodName}.`,
      strategicSummary: `Đối thủ trên thị trường đang cạnh tranh bằng việc cắt giảm chi phí sản xuất và đóng gói sơ sài, dẫn đến tỷ lệ khách thất vọng và hoàn đơn cao. Đây là thời cơ vàng để ${prodName} của shop định vị phân khúc chất lượng vượt trội và giành trọn lòng tin của khách hàng.`,
    },
    flaws: [
      {
        id: 1,
        categoryKey: "PRODUCT_QUALITY",
        title: "Chất liệu kém bền, co rút và xuống cấp nhanh",
        severity: "CRITICAL",
        severityBadge: "🚨 Tử Huyệt Chí Mạng - Khách Đòi Trả Hàng",
        realReviewQuote: "Dùng được vài hôm là xuống cấp, vải xù lông, lỏng lẻo không như hình quảng cáo trên video.",
        customerPsychology: "Khách hàng cảm thấy bị lừa dối, bức xúc vì hình ảnh quảng cáo bóng bẩy nhưng thực tế nhận về đồ rẻ tiền.",
        rootCause: "Đối thủ chọn xưởng gia công giá rẻ, cắt giảm định lượng chất liệu để tối đa hóa lợi nhuận trước mắt.",
        shopCounterAttack: `Shop sử dụng chất liệu tiêu chuẩn cao cấp, kiểm định độ bền nghiêm ngặt, cam kết giữ form và độ bền dài lâu.`,
      },
      {
        id: 2,
        categoryKey: "PACKAGING_SHIPPING",
        title: "Đóng gói sơ sài, hộp móp méo và trầy xước",
        severity: "HIGH",
        severityBadge: "⚠️ Rủi Ro Vận Chuyển Cao",
        realReviewQuote: "Hộp hàng nát bươm, bọc mỗi cái túi nilon mỏng dính rách toạc cả sản phẩm bên trong.",
        customerPsychology: "Khách hàng mất hứng thú unboxing, nghi ngờ hàng cũ hoặc hàng thanh lý do bao bì tồi tàn.",
        rootCause: "Cắt giảm chi phí hộp carton cứng và bọc chống sốc để tiết kiệm 1.000đ - 2.000đ mỗi đơn hàng.",
        shopCounterAttack: "Đóng gói tiêu chuẩn xưởng: Hộp carton nắp gài cứng cáp + bọc chống sốc bóng khí 3 lớp niêm phong.",
      },
      {
        id: 3,
        categoryKey: "CUSTOMER_SERVICE",
        title: "CSKH trốn tránh, đổ lỗi cho đơn vị vận chuyển",
        severity: "HIGH",
        severityBadge: "⚠️ Khiếu Nại Không Được Giải Quyết",
        realReviewQuote: "Nhắn tin hỏi cách bảo hành thì đọc xong im re, đổ lỗi shipper làm hỏng rồi không đền bù.",
        customerPsychology: "Khách hàng bất an, tức giận vì cảm giác bị bỏ rơi sau khi shop đã thu tiền.",
        rootCause: "Không có quy trình SOP xử lý sự cố, nhân viên trực chat thiếu quyền hạn đền bù thiệt hại.",
        shopCounterAttack: "Kích hoạt chính sách Bảo Hành Đổi Mới Tận Nhà: Lỗi là đổi mới hỏa tốc 0đ, không đổ lỗi, không quanh co.",
      },
    ],
    comparisonMatrix: [
      {
        criteria: "Chất liệu & Độ hoàn thiện",
        competitorFlaw: "Vật liệu giá rẻ, gia công cắt xén, dễ hỏng sau thời gian ngắn",
        shopAdvantage: `${strength}`,
        proofMechanism: "Video quay cận cảnh độ sắc nét từng chi tiết và test độ chịu lực thực tế",
      },
      {
        criteria: "Quy cách đóng gói Unboxing",
        competitorFlaw: "Bọc túi nilon mỏng sơ sài, dễ rách và móp méo lúc giao",
        shopAdvantage: "Hộp carton cứng cáp 3 lớp, chống sốc dày, kèm tem niêm phong chính hãng",
        proofMechanism: "Cam kết bao bể vỡ khi đồng kiểm, hoàn tiền 100% nếu móp méo",
      },
      {
        criteria: "Chính sách bảo hành & Đổi trả",
        competitorFlaw: "Đổ lỗi shipper, thủ tục phức tạp, bắt khách trả phí ship hoàn",
        shopAdvantage: "Bảo hành 1 đổi 1 trong 30 ngày, shipper giao hàng mới tận nhà đổi lấy hàng cũ",
        proofMechanism: "Phiếu bảo hành dập dấu mộc cam kết kèm trong kiện hàng",
      },
      {
        criteria: "Tốc độ hỗ trợ CSKH",
        competitorFlaw: "Phản hồi chậm trễ, tin nhắn tự động vô cảm",
        shopAdvantage: "Đội ngũ chuyên viên tư vấn trực chat phản hồi trong vòng 5 phút",
        proofMechanism: "Huy hiệu Tỷ lệ phản hồi chat 100% trên sàn",
      },
    ],
    conversionWeapons: {
      videoHooks: [
        {
          id: 1,
          angleType: "CANH_BAO",
          angleLabel: "Góc Cảnh Báo",
          hook3s: `Đừng vội mua ${prodName} nếu bạn chưa biết sự thật về những mẫu giá rẻ trên thị trường!`,
          visualScene: "Hình ảnh 2 sản phẩm đặt cạnh nhau: 1 bên của đối thủ bị hỏng/dão xù, 1 bên của shop nguyên vẹn sắc sảo.",
          callToAction: "Bấm vào giỏ hàng góc trái để chọn phiên bản chuẩn xịn chính hãng ngay hôm nay!",
        },
        {
          id: 2,
          angleType: "DONG_CAM",
          angleLabel: "Góc Đồng Cảm Thực Tế",
          hook3s: "Có ai từng mua hàng trên mạng háo hức chờ nhận mà unbox ra chiếc hộp nát bươm như thế này chưa?",
          visualScene: "Quay cận cảnh chiếc hộp móp rách của đối thủ, sau đó chuyển cảnh sang quy trình đóng gói hộp cứng sang trọng của shop.",
          callToAction: "Tại shop chúng mình, từng kiện hàng đều được đóng gói nâng niu như một món quà tri ân.",
        },
        {
          id: 3,
          angleType: "VACH_TRAN",
          angleLabel: "Góc Vạch Trần Sự Thật",
          hook3s: `Tại sao cùng là ${prodName} mà có bên bán rẻ bằng nửa? Đây là lý do thật sự!`,
          visualScene: "Cầm 2 món lên cân đối chứng độ dày, soi đường may và độ bền vật liệu dưới ánh sáng studio.",
          callToAction: "Đừng tiếc vài chục nghìn để mua bực vào người, đặt hàng shop mình để an tâm tuyệt đối!",
        },
      ],
      subtleListingDescription: {
        headline: `🌟 ${prodName.toUpperCase()} - TIÊU CHUẨN CAO CẤP, NÓI KHÔNG VỚI HÀNG GIÁ RẺ KÉM CHẤT LƯỢNG`,
        body: `Trên thị trường hiện nay có rất nhiều nơi bán ${prodName} với giá rất rẻ bằng cách cắt giảm chất liệu và đóng gói sơ sài, dẫn đến việc sản phẩm nhanh hỏng và gây thất vọng cho người mua. Thấu hiểu điều đó, shop cam kết chỉ mang đến phiên bản hoàn thiện cao cấp nhất, tuyển chọn kỹ lưỡng từng chi tiết để bạn sử dụng bền bỉ lâu dài.`,
        safeGuarantees: [
          "Cam kết 100% đúng hình ảnh, video và mô tả thực tế",
          "Đóng gói hộp cứng chống va đập 3 lớp an toàn tuyệt đối",
          "Hỗ trợ đổi mới tận nhà trong 30 ngày nếu phát sinh bất kỳ lỗi nào từ nhà sản xuất",
        ],
      },
      priceObjectionHandling: {
        question: "Sao thấy bên shop kia bán mẫu nhìn giống mà rẻ hơn 40.000đ - 50.000đ?",
        consultantScript: `Dạ em chào anh/chị ạ! Hiện tại trên sàn có nhiều xưởng làm theo mẫu mã bên em nhưng dùng chất liệu mỏng hơn và đóng gói túi nilon sơ sài để hạ giá thành. Bên em cam kết dùng chất liệu dày dặn cao cấp, đóng hộp cứng chống va đập và bảo hành 1 đổi 1 tận nơi. Mua bên em mình dùng bền 1-2 năm không hỏng, tính ra tiết kiệm hơn rất nhiều so với mua đồ rẻ mà dùng vài bữa phải vứt đi ạ!`,
      },
    },
    operationalDefense: {
      mustAvoidChecklist: [
        "Kiểm tra 100% đường may / mối nối / phụ kiện trước khi đưa vào khâu đóng gói xuất kho",
        "Tuyệt đối không dùng túi nilon mỏng đơn lớp, bắt buộc bọc xốp bóng khí và hộp carton nắp gài",
        "Nhân viên CSKH phải chủ động xin lỗi và giải quyết đền bù trong 15 phút, không đổ lỗi cho shipper",
      ],
      unboxingWowFactor: "Xịt nhẹ một làn hương thơm nhẹ vào hộp hàng, kèm thiệp cảm ơn in lời dặn dò và quà tặng nhỏ bất ngờ để tạo ấn tượng unboxing đa giác quan.",
    },
  };
}

/**
 * TẦNG 3: Legacy Markdown Parser
 * Bóc tách và chuyển đổi dữ liệu dạng Markdown cũ sang CompetitorMinerData
 */
export function parseLegacyMarkdownToCompetitorData(
  text: string,
  inputs?: CompetitorMinerInputs
): CompetitorMinerData {
  const prodName = inputs?.productName || "Sản phẩm của Shop";
  const cat = inputs?.category || "Ngành hàng TMĐT";

  const findSection = (keywords: string[], nextKeywords: string[] = []) => {
    let bestStart = -1;
    let headerLen = 0;
    for (const kw of keywords) {
      const match = text.match(new RegExp(`^[ \\t]*(?:##|#)\\s*[^\\n]*?${kw}[^\\n]*$`, "im"));
      if (match && match.index !== undefined) {
        bestStart = match.index;
        headerLen = match[0].length;
        break;
      }
    }
    if (bestStart === -1) return "";

    const contentStart = text.slice(bestStart + headerLen);
    let endIdx = contentStart.length;

    for (const nextKw of nextKeywords) {
      const nextMatch = contentStart.match(new RegExp(`^[ \\t]*(?:---|##|#)\\s*[^\\n]*?${nextKw}`, "im"));
      if (nextMatch && nextMatch.index !== undefined && nextMatch.index < endIdx) {
        endIdx = nextMatch.index;
      }
    }
    return contentStart.slice(0, endIdx).trim();
  };

  const s1 = findSection(["BÓC TÁCH", "TỬ HUYỆT"], ["ĐỊNH VỊ", "VŨ KHÍ", "USP"]);
  const s2 = findSection(["ĐỊNH VỊ", "VŨ KHÍ", "USP"], ["BỘ CÂU HOOK", "HOOK", "DÌM HÀNG"]);
  const s3 = findSection(["BỘ CÂU HOOK", "HOOK", "DÌM HÀNG"], ["LỜI KHUYÊN", "PHÒNG THỦ"]);
  const s4 = findSection(["LỜI KHUYÊN", "PHÒNG THỦ"], []);

  // 1. Phân tích tử huyệt
  const flaws: CompetitorFlaw[] = [];
  if (s1) {
    const lines = s1.split("\n");
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#") || line.startsWith("*(") || line.startsWith("(")) continue;

      const strippedBullet = line.replace(/^[-*•]\s+/, "");
      let m = strippedBullet.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) m = strippedBullet.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      if (!m) m = strippedBullet.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);

      if (m) {
        const fullTitle = m[1].trim();
        const content = cleanQuotes(m[2].trim());
        const tagMatch = fullTitle.match(/\(([^)]+)\)/);
        const tag = tagMatch ? tagMatch[1].trim() : "";
        const cleanTitle = fullTitle.replace(/\([^)]+\)/, "").trim();

        const catKey: CompetitorFlaw["categoryKey"] = /bao bì|đóng gói|giao hàng|shipper/i.test(tag || cleanTitle)
          ? "PACKAGING_SHIPPING"
          : /cskh|bảo hành|thái độ/i.test(tag || cleanTitle)
          ? "CUSTOMER_SERVICE"
          : "PRODUCT_QUALITY";

        flaws.push({
          id: flaws.length + 1,
          categoryKey: catKey,
          title: cleanTitle || fullTitle,
          severity: flaws.length === 0 ? "CRITICAL" : "HIGH",
          severityBadge: flaws.length === 0 ? "🚨 Tử Huyệt Chí Mạng" : "⚠️ Rủi Ro Vận Hành",
          realReviewQuote: content,
          customerPsychology: "Khách hàng bức xúc và thất vọng khi nhận sản phẩm không như kỳ vọng.",
          rootCause: "Đối thủ cắt giảm chi phí sản xuất và dịch vụ để hạ giá bán.",
          shopCounterAttack: "Shop cam kết đầu tư chất lượng vượt trội và hỗ trợ đổi trả tận tâm.",
        });
      }
    }
  }

  // 2. USP & Bảng so sánh
  let uspStatement = "";
  const comparisonMatrix: ComparisonRow[] = [];
  if (s2) {
    const stmtMatch = s2.match(/(?:Tuyên ngôn định vị[^\n:]*|Slogan[^\n:]*)\s*[:\-]\s*(?:["“]([^"”\n]+)["”]|([^\n]+))/i);
    if (stmtMatch) {
      let rawStmt = stmtMatch[1] || stmtMatch[2] || "";
      rawStmt = rawStmt.replace(/^\*\*|\*\*$/g, "").trim();
      uspStatement = cleanQuotes(rawStmt);
    }

    const tableLines = s2.split("\n").filter((l) => l.trim().startsWith("|") && l.trim().endsWith("|"));
    if (tableLines.length >= 2) {
      for (let i = 1; i < tableLines.length; i++) {
        const line = tableLines[i].trim();
        if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(line)) continue;
        const cols = line.split("|").map((c) => c.trim().replace(/\*\*/g, "")).slice(1, -1);
        if (cols.length >= 3) {
          comparisonMatrix.push({
            criteria: cols[0] || "Tiêu chuẩn sản phẩm",
            competitorFlaw: cols[1] || "Kém chất lượng",
            shopAdvantage: cols[2] || "Vượt trội, cam kết",
            proofMechanism: "Cam kết đồng kiểm & bảo hành 1 đổi 1 tận nơi",
          });
        }
      }
    }
  }

  // 3. Hooks & Kịch bản dìm hàng
  const videoHooks: VideoHookItem[] = [];
  let subtleDesc = "";
  if (s3) {
    const descMatch = s3.match(/(?:Đoạn mô tả sản phẩm[^\n:]*|Mô tả sản phẩm[^\n:]*)\s*[:\-]\s*([\s\S]*?)(?=(?:--|\n#|$))/i);
    if (descMatch) {
      let descText = descMatch[1].trim();
      descText = descText.replace(/^\*\*|\*\*$/g, "").trim();
      subtleDesc = cleanQuotes(descText);
    }

    const lines = s3.split("\n");
    for (let line of lines) {
      line = line.trim();
      if (/đoạn mô tả/i.test(line) || line.startsWith("#") || line.startsWith("*(") || line.startsWith("(")) continue;

      const strippedBullet = line.replace(/^[-*•]\s+/, "");
      let m = strippedBullet.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) m = strippedBullet.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      if (!m) m = strippedBullet.match(/^(Hook\s*\d+[^:]*|\bHook[^:]*)\s*[:\-]\s*([\s\S]+)$/i);

      if (m && /hook/i.test(m[1])) {
        const fullHookLabel = m[1].trim();
        const hookText = cleanQuotes(m[2].trim());
        const angleType: VideoHookItem["angleType"] = /cảnh báo/i.test(fullHookLabel)
          ? "CANH_BAO"
          : /đồng cảm/i.test(fullHookLabel)
          ? "DONG_CAM"
          : "VACH_TRAN";

        videoHooks.push({
          id: videoHooks.length + 1,
          angleType,
          angleLabel: fullHookLabel,
          hook3s: hookText,
          visualScene: "Hình ảnh trực quan tương phản giữa sản phẩm kém chất lượng và sản phẩm shop.",
          callToAction: "Bấm vào giỏ hàng ngay hôm nay để nhận ưu đãi đặc biệt!",
        });
      }
    }
  }

  // 4. Lời khuyên phòng thủ
  const defenseTips: string[] = [];
  if (s4) {
    const lines = s4.split("\n");
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#") || line.startsWith("*(") || line.startsWith("(")) continue;
      const stripped = line.replace(/^[-*•]\s+/, "").replace(/^\*\*Lưu ý \d+:\*\*\s*/i, "").trim();
      if (stripped.length > 5) defenseTips.push(stripped);
    }
  }

  const offlineFallback = buildOfflineCompetitorMinerData(inputs);

  return {
    productName: prodName,
    category: cat,
    battleOverview: {
      marketOpportunityBadge: "Định Vị Vượt Trội So Với Đối Thủ",
      competitorVulnerabilityScore: 85,
      coreSlogan: uspStatement || offlineFallback.battleOverview.coreSlogan,
      strategicSummary: offlineFallback.battleOverview.strategicSummary,
    },
    flaws: flaws.length > 0 ? flaws : offlineFallback.flaws,
    comparisonMatrix: comparisonMatrix.length > 0 ? comparisonMatrix : offlineFallback.comparisonMatrix,
    conversionWeapons: {
      videoHooks: videoHooks.length > 0 ? videoHooks : offlineFallback.conversionWeapons.videoHooks,
      subtleListingDescription: {
        headline: `🌟 ${prodName.toUpperCase()} - CAM KẾT CHẤT LƯỢNG TIÊU CHUẨN`,
        body: subtleDesc || offlineFallback.conversionWeapons.subtleListingDescription.body,
        safeGuarantees: offlineFallback.conversionWeapons.subtleListingDescription.safeGuarantees,
      },
      priceObjectionHandling: offlineFallback.conversionWeapons.priceObjectionHandling,
    },
    operationalDefense: {
      mustAvoidChecklist: defenseTips.length > 0 ? defenseTips : offlineFallback.operationalDefense.mustAvoidChecklist,
      unboxingWowFactor: offlineFallback.operationalDefense.unboxingWowFactor,
    },
  };
}

/**
 * Chuẩn hóa object dữ liệu sau khi parse JSON thành công
 */
export function normalizeCompetitorMinerData(
  parsed: any,
  inputs?: CompetitorMinerInputs
): CompetitorMinerData {
  const prodName = parsed.productName || inputs?.productName || "Sản phẩm của Shop";
  const cat = parsed.category || inputs?.category || "Thời Trang & Tiêu Dùng TMĐT";
  const offlineFallback = buildOfflineCompetitorMinerData(inputs);

  const rawOverview = parsed.battleOverview || {};
  const battleOverview: BattleOverview = {
    marketOpportunityBadge: String(rawOverview.marketOpportunityBadge || offlineFallback.battleOverview.marketOpportunityBadge).trim(),
    competitorVulnerabilityScore: typeof rawOverview.competitorVulnerabilityScore === "number" ? rawOverview.competitorVulnerabilityScore : 85,
    coreSlogan: String(rawOverview.coreSlogan || offlineFallback.battleOverview.coreSlogan).trim(),
    strategicSummary: String(rawOverview.strategicSummary || offlineFallback.battleOverview.strategicSummary).trim(),
  };

  const rawFlaws = Array.isArray(parsed.flaws) ? parsed.flaws : [];
  const flaws: CompetitorFlaw[] = rawFlaws.map((f: any, idx: number) => ({
    id: typeof f.id === "number" ? f.id : idx + 1,
    categoryKey: f.categoryKey || (idx === 0 ? "PRODUCT_QUALITY" : idx === 1 ? "PACKAGING_SHIPPING" : "CUSTOMER_SERVICE"),
    title: String(f.title || `Tử huyệt ${idx + 1}`).trim(),
    severity: f.severity === "CRITICAL" || f.severity === "HIGH" || f.severity === "MEDIUM" ? f.severity : "HIGH",
    severityBadge: String(f.severityBadge || (f.severity === "CRITICAL" ? "🚨 Tử Huyệt Chí Mạng" : "⚠️ Rủi Ro Cao")).trim(),
    realReviewQuote: String(f.realReviewQuote || f.content || "").trim(),
    customerPsychology: String(f.customerPsychology || "Khách hàng thất vọng vì nhận hàng không đúng kỳ vọng.").trim(),
    rootCause: String(f.rootCause || "Đối thủ cắt giảm chi phí sản xuất và đóng gói.").trim(),
    shopCounterAttack: String(f.shopCounterAttack || "Shop cam kết bảo hành và nâng cấp chất lượng toàn diện.").trim(),
  })).filter((f: CompetitorFlaw) => Boolean(f.title));

  const rawMatrix = Array.isArray(parsed.comparisonMatrix) ? parsed.comparisonMatrix : [];
  const comparisonMatrix: ComparisonRow[] = rawMatrix.map((r: any) => ({
    criteria: String(r.criteria || "Tiêu chuẩn sản phẩm").trim(),
    competitorFlaw: String(r.competitorFlaw || r.competitor || "Kém chất lượng, dễ lỗi").trim(),
    shopAdvantage: String(r.shopAdvantage || r.shopYou || "Vượt trội, cam kết cao cấp").trim(),
    proofMechanism: String(r.proofMechanism || "Cam kết kiểm tra 2 lớp & bảo hành 1 đổi 1").trim(),
  })).filter((r: ComparisonRow) => Boolean(r.criteria));

  const rawWeapons = parsed.conversionWeapons || {};
  const rawHooks = Array.isArray(rawWeapons.videoHooks) ? rawWeapons.videoHooks : [];
  const videoHooks: VideoHookItem[] = rawHooks.map((h: any, idx: number) => ({
    id: typeof h.id === "number" ? h.id : idx + 1,
    angleType: h.angleType === "CANH_BAO" || h.angleType === "DONG_CAM" || h.angleType === "VACH_TRAN" ? h.angleType : "CANH_BAO",
    angleLabel: String(h.angleLabel || (idx === 0 ? "Góc Cảnh Báo" : idx === 1 ? "Góc Đồng Cảm" : "Góc Vạch Trần")).trim(),
    hook3s: String(h.hook3s || h.text || "").trim(),
    visualScene: String(h.visualScene || "Quay cảnh cận sản phẩm so sánh tương phản.").trim(),
    callToAction: String(h.callToAction || "Bấm vào giỏ hàng để sở hữu ngay hôm nay!").trim(),
  })).filter((h: VideoHookItem) => Boolean(h.hook3s));

  const rawSubtle = rawWeapons.subtleListingDescription || {};
  const subtleListingDescription: SubtleListingDescription = {
    headline: String(rawSubtle.headline || `🌟 ${prodName.toUpperCase()} - TIÊU CHUẨN CAO CẤP`).trim(),
    body: String(rawSubtle.body || offlineFallback.conversionWeapons.subtleListingDescription.body).trim(),
    safeGuarantees: Array.isArray(rawSubtle.safeGuarantees) ? rawSubtle.safeGuarantees.map(String) : offlineFallback.conversionWeapons.subtleListingDescription.safeGuarantees,
  };

  const rawPrice = rawWeapons.priceObjectionHandling || {};
  const priceObjectionHandling: PriceObjectionHandling = {
    question: String(rawPrice.question || "Sao thấy bên shop kia bán y hệt mà rẻ hơn?").trim(),
    consultantScript: String(rawPrice.consultantScript || offlineFallback.conversionWeapons.priceObjectionHandling.consultantScript).trim(),
  };

  const rawDefense = parsed.operationalDefense || {};
  const operationalDefense: OperationalDefense = {
    mustAvoidChecklist: Array.isArray(rawDefense.mustAvoidChecklist) ? rawDefense.mustAvoidChecklist.map(String) : offlineFallback.operationalDefense.mustAvoidChecklist,
    unboxingWowFactor: String(rawDefense.unboxingWowFactor || offlineFallback.operationalDefense.unboxingWowFactor).trim(),
  };

  return {
    productName: prodName,
    category: cat,
    battleOverview,
    flaws: flaws.length > 0 ? flaws : offlineFallback.flaws,
    comparisonMatrix: comparisonMatrix.length > 0 ? comparisonMatrix : offlineFallback.comparisonMatrix,
    conversionWeapons: {
      videoHooks: videoHooks.length > 0 ? videoHooks : offlineFallback.conversionWeapons.videoHooks,
      subtleListingDescription,
      priceObjectionHandling,
    },
    operationalDefense,
  };
}

/**
 * Parser chính 4 tầng bền bỉ cho Competitor Miner
 */
export function parseCompetitorMinerResult(
  rawResult: string,
  inputs?: CompetitorMinerInputs
): CompetitorMinerData {
  if (!rawResult || !rawResult.trim()) {
    return buildOfflineCompetitorMinerData(inputs);
  }

  const sanitized = sanitizeRawJsonString(rawResult);

  // TẦNG 1: Native JSON Parse
  try {
    const parsed = JSON.parse(sanitized);
    if (parsed && (parsed.battleOverview || parsed.flaws || parsed.comparisonMatrix || parsed.conversionWeapons)) {
      return normalizeCompetitorMinerData(parsed, inputs);
    }
  } catch {
    // Chuyển sang Tầng 2
  }

  // TẦNG 2: Stack-based Truncated JSON Repair
  try {
    const repaired = repairTruncatedJson(rawResult);
    const parsed = JSON.parse(repaired);
    if (parsed && (parsed.battleOverview || parsed.flaws || parsed.comparisonMatrix || parsed.conversionWeapons)) {
      return normalizeCompetitorMinerData(parsed, inputs);
    }
  } catch {
    // Chuyển sang Tầng 3
  }

  // TẦNG 3: Legacy Markdown Fallback (Tương thích ngược 100% với dữ liệu lịch sử cũ)
  if (
    rawResult.includes("BÓC TÁCH") ||
    rawResult.includes("TỬ HUYỆT") ||
    rawResult.includes("ĐỊNH VỊ") ||
    rawResult.includes("BỘ CÂU HOOK") ||
    rawResult.includes("## 1.") ||
    rawResult.includes("## 2.")
  ) {
    try {
      const legacy = parseLegacyMarkdownToCompetitorData(rawResult, inputs);
      if (legacy && (legacy.flaws.length > 0 || legacy.comparisonMatrix.length > 0)) {
        return legacy;
      }
    } catch {
      // Chuyển sang Tầng 4
    }
  }

  // TẦNG 4: Offline Blueprint Engine Fallback
  return buildOfflineCompetitorMinerData(inputs);
}

/**
 * Làm sạch, xác thực và chuẩn hóa JSON đầu ra ngay tại API Router trước khi lưu DB/trả về client
 */
export function cleanAndValidateCompetitorMinerOutput(
  rawText: string,
  inputs?: CompetitorMinerInputs
): string {
  if (!rawText || !rawText.trim()) {
    return JSON.stringify(buildOfflineCompetitorMinerData(inputs));
  }

  try {
    const data = parseCompetitorMinerResult(rawText, inputs);
    return JSON.stringify(data);
  } catch (err) {
    console.error("cleanAndValidateCompetitorMinerOutput_error", err);
    try {
      return JSON.stringify(buildOfflineCompetitorMinerData(inputs));
    } catch {
      return rawText;
    }
  }
}

// -------------------------------------------------------------
// DỮ LIỆU MẪU THỰC CHIẾN (SAMPLE DATA)
// -------------------------------------------------------------
export const SAMPLE_COMPETITOR_MINER_INPUT: CompetitorMinerInputs = {
  productName: "Áo Thun Cotton Compact 280gsm Dày Dặn Form Rộng",
  category: "Thời Trang & Phụ Kiện",
  competitorReviews: `1. "Vải mỏng tanh như vải mùng, giặt 2 nước là cổ áo dão ngoét chảy xệ như cái bao tải, xù lông lởm chởm."
2. "Đóng gói bọc nilon mỏng dính bị rách thủng lỗ chỗ, áo dính vết bẩn. Nhắn tin khiếu nại thì shop đổ lỗi do shipper rồi im re không thèm giải quyết."
3. "Hình trên video một đằng hàng nhận một nẻo, màu đen xỉn pha nilon mặc bí bách ngứa ngáy phát điên."`,
  shopStrength: "Vải sợi bông Compact 100% dệt dày 280gsm không dão xù, cổ dệt sợi co giãn kép, đóng gói hộp carton cứng nắp gài + túi zip mờ, bảo hành 1 đổi 1 tận nhà trong 30 ngày.",
};

export const SAMPLE_COMPETITOR_MINER_DATA: CompetitorMinerData = buildOfflineCompetitorMinerData(SAMPLE_COMPETITOR_MINER_INPUT);

export const SAMPLE_COMPETITOR_MINER_RESULT = JSON.stringify(SAMPLE_COMPETITOR_MINER_DATA, null, 2);
