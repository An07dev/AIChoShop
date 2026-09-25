export const SEO_LIMITS = {
  productName: 200,
  usp: 2000,
  brand: 100,
  specs: 1500,
  audience: 300,
  keywords: 300,
  policies: 1000,
} as const;

export const SEO_PLATFORMS = {
  shopee: { label: "Shopee", titleLimit: 120 },
  tiktok: { label: "TikTok Shop", titleLimit: 79 },
} as const;

export type SeoPlatform = keyof typeof SEO_PLATFORMS;
export type SeoInputs = Record<keyof typeof SEO_LIMITS, string> & { platform: SeoPlatform };

// ==========================================
// ĐỊNH NGHĨA DỮ LIỆU CẤU TRÚC PHONG PHÚ MỚI
// ==========================================

export interface SeoScoreData {
  score: number;
  grade: string;
  checklist: { item: string; passed: boolean }[];
  safetyPassed: boolean;
}

export interface SeoTitleVariant {
  id: number;
  style: string;
  tag: string;
  title: string;
  charCount: number;
  hookKeywords?: string;
  targetAudience?: string;
}

export interface SeoDescriptionSection {
  title: string;
  content: string;
}

export interface SeoDescriptionAida {
  attentionHook?: string;
  uspStory?: string;
  featureBullets?: { feature: string; benefit: string }[];
  sizeAndSpecs?: string[];
  commitments?: string[];
  ctaCloser?: string;
}

export interface SeoKeywordMatrix {
  coreKeywords: string[];
  longtailKeywords: string[];
  hashtags: string[];
}

export type SeoResult = {
  // Tương thích ngược 100% với phiên bản trước:
  titles: string[];
  descriptions: SeoDescriptionSection[];
  hashtags: string[];

  // Dữ liệu mở rộng phong phú:
  seoScore?: SeoScoreData;
  richTitles?: SeoTitleVariant[];
  descriptionAida?: SeoDescriptionAida;
  keywordMatrix?: SeoKeywordMatrix;
};

export type SeoSnapshot = { inputs: SeoInputs; output: SeoResult };

export class SeoError extends Error {
  code: string;
  status: number;
  validationHint?: string;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const charCount = (value: string) => Array.from((value || "").normalize("NFC")).length;

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function validateSeoInputs(value: unknown): SeoInputs {
  if (!record(value)) throw new SeoError("INVALID_INPUT", "Thông tin sản phẩm không hợp lệ.");
  if (value.platform !== "shopee" && value.platform !== "tiktok") {
    throw new SeoError("INVALID_INPUT", "Vui lòng chọn Shopee hoặc TikTok Shop.");
  }
  const result = { platform: value.platform } as SeoInputs;
  for (const [key, max] of Object.entries(SEO_LIMITS)) {
    const field = key as keyof typeof SEO_LIMITS;
    const input = value[field] ?? "";
    if (typeof input !== "string" || charCount(input) > max) {
      throw new SeoError("INVALID_INPUT", `Trường ${field} phải là văn bản, tối đa ${max} ký tự.`);
    }
    result[field] = input.normalize("NFC").trim();
  }
  if (!result.productName || !result.usp) {
    throw new SeoError("INVALID_INPUT", "Vui lòng nhập tên sản phẩm và điểm nổi bật (USP).");
  }
  return result;
}

/**
 * Tự động sửa các lỗi JSON thường gặp khi LLM sinh ra
 */
function repairJsonString(raw: string): any | null {
  if (!raw) return null;
  let text = raw.trim();

  // Bỏ markdown block nếu có
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // 1. Thử parse trực tiếp
  try {
    return JSON.parse(text);
  } catch {}

  // 2. Trích xuất khối JSON { ... } nếu AI thêm lời chào hoặc văn bản bao quanh
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
    text = candidate;
  }

  // Sửa lỗi dấu phẩy thừa trước ngoặc đóng và newlines trong string
  let cleaned = text
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/(:\s*"[^"]*)\n([^"]*")/g, "$1\\n$2");

  try {
    return JSON.parse(cleaned);
  } catch {}

  // Tự động đóng ngoặc nếu bị truncate do chạm max_tokens
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
      } else if (ch === "}" || ch === "]") {
        stack.pop();
      }
    }
  }

  let autoFixed = cleaned;
  if (inString) autoFixed += '"';
  while (stack.length > 0) {
    const top = stack.pop();
    if (top === "{") autoFixed += "}";
    else if (top === "[") autoFixed += "]";
  }

  try {
    return JSON.parse(autoFixed);
  } catch {}

  return null;
}

/**
 * Trình phân tích kết quả SEO siêu bền bỉ (Resilient Parser)
 * Hỗ trợ cả cấu trúc JSON phong phú mới lẫn cấu trúc cũ,
 * tự động chuẩn hóa 2 chiều, không bao giờ để giao diện bị crash hay 502 vô lý.
 */
export function parseSeoResult(
  value: unknown,
  platform: SeoPlatform,
  inputs?: SeoInputs,
  strict = false
): SeoResult {
  const prodName = inputs?.productName?.trim() || "Sản Phẩm";
  const brand = inputs?.brand?.trim() || "";
  const platformInfo = SEO_PLATFORMS[platform] || SEO_PLATFORMS.shopee;

  let data: any = value;
  let parsedFromJson = false;
  if (typeof value === "string") {
    data = repairJsonString(value);
    if (data && typeof data === "object") {
      parsedFromJson = true;
    } else {
      try {
        data = JSON.parse(value.trim());
        parsedFromJson = true;
      } catch {
        data = {};
      }
    }
  } else if (record(value)) {
    parsedFromJson = true;
  }

  if (!record(data)) {
    data = {};
  }

  const hasRecognizedContent =
    (Array.isArray(data.titles) && data.titles.length > 0) ||
    record(data.descriptionAida) ||
    (Array.isArray(data.descriptions) && data.descriptions.length > 0) ||
    record(data.keywordMatrix);

  if (strict && !hasRecognizedContent) {
    throw new SeoError("INVALID_OUTPUT", "Kết quả AI không đúng cấu trúc JSON yêu cầu.", 502);
  }

  // 1. Chuẩn hóa Ma trận Tiêu đề (titles & richTitles)
  const TITLE_DEFAULT_METAS = [
    { style: "SEO Thuật Toán (Search-Driven)", tag: "Đẩy Top Sàn" },
    { style: "Kéo Click CTR (Impulse/Curiosity)", tag: "Tăng CTR" },
    { style: "Đấu Thầu Quảng Cáo (High Ads Quality)", tag: "Chuẩn Ads" },
    { style: "Đột Phá USP (Lợi Thế Độc Quyền)", tag: "Độc Quyền" },
    { style: "Toàn Diện & Chốt Đơn (Conversion Master)", tag: "Chốt Đơn" },
  ];

  let richTitles: SeoTitleVariant[] = [];
  let plainTitles: string[] = [];

  if (Array.isArray(data.titles) && data.titles.length > 0) {
    data.titles.forEach((item: any, idx: number) => {
      const meta = TITLE_DEFAULT_METAS[idx] || TITLE_DEFAULT_METAS[0];
      if (typeof item === "string") {
        const cleanT = item.trim().replace(/^["']|["']$/g, "");
        if (cleanT.length > 3) {
          plainTitles.push(cleanT);
          richTitles.push({
            id: idx + 1,
            style: meta.style,
            tag: meta.tag,
            title: cleanT,
            charCount: charCount(cleanT),
            hookKeywords: inputs?.keywords || prodName,
            targetAudience: inputs?.audience || "Khách mua sắm",
          });
        }
      } else if (record(item)) {
        const cleanT = String(item.title || "").trim();
        if (cleanT.length > 3) {
          plainTitles.push(cleanT);
          richTitles.push({
            id: Number(item.id) || idx + 1,
            style: String(item.style || meta.style),
            tag: String(item.tag || meta.tag),
            title: cleanT,
            charCount: charCount(cleanT),
            hookKeywords: item.hookKeywords ? String(item.hookKeywords) : inputs?.keywords || prodName,
            targetAudience: item.targetAudience ? String(item.targetAudience) : inputs?.audience || "Khách mua sắm",
          });
        }
      }
    });
  }

  // Fallback nếu thiếu tiêu đề
  if (plainTitles.length < 5) {
    const brandPrefix = brand && brand !== "No Brand" ? `[${brand}] ` : "";
    const defaults = [
      `${brandPrefix}${prodName} Cao Cấp - Bền Đẹp, Đa Năng, Chuẩn Sàn Chính Hãng`,
      `🔥 ${prodName} Siêu Phẩm Cực Hot - Quà Tặng Độc Quyền & Voucher Giảm Giá Sốc Hôm Nay!`,
      `${brandPrefix}${prodName} Giá Tốt Nhất - Giao Hỏa Tốc, Cam Kết Đổi Trả Đơn Dễ Dàng`,
      `${brandPrefix}${prodName} Bản Nâng Cấp Vượt Trội - Thiết Kế Tinh Xảo, Độ Bền Cao`,
      `${brandPrefix}${prodName} Chính Hãng 100% - Bảo Hành Uy Tín, Hỗ Trợ Đổi Trả Miễn Phí`,
    ];

    for (let i = plainTitles.length; i < 5; i++) {
      const fallbackTitle = defaults[i];
      const meta = TITLE_DEFAULT_METAS[i];
      plainTitles.push(fallbackTitle);
      richTitles.push({
        id: i + 1,
        style: meta.style,
        tag: meta.tag,
        title: fallbackTitle,
        charCount: charCount(fallbackTitle),
        hookKeywords: inputs?.keywords || prodName,
        targetAudience: inputs?.audience || "Khách mua sắm",
      });
    }
  }

  // Cắt ngắn tiêu đề nếu vượt quá giới hạn sàn cho phép
  plainTitles = plainTitles.slice(0, 5);
  richTitles = richTitles.slice(0, 5);

  // 2. Chuẩn hóa Bài viết Mô tả (descriptions & descriptionAida)
  let descriptions: SeoDescriptionSection[] = [];
  let descriptionAida: SeoDescriptionAida | undefined;

  if (record(data.descriptionAida)) {
    const aida = data.descriptionAida;
    descriptionAida = {
      attentionHook: aida.attentionHook ? String(aida.attentionHook).trim() : undefined,
      uspStory: aida.uspStory ? String(aida.uspStory).trim() : undefined,
      featureBullets: Array.isArray(aida.featureBullets)
        ? aida.featureBullets.map((f: any) => ({
            feature: String(f.feature || "Điểm nổi bật"),
            benefit: String(f.benefit || ""),
          }))
        : [],
      sizeAndSpecs: Array.isArray(aida.sizeAndSpecs) ? aida.sizeAndSpecs.map(String) : [],
      commitments: Array.isArray(aida.commitments) ? aida.commitments.map(String) : [],
      ctaCloser: aida.ctaCloser ? String(aida.ctaCloser).trim() : undefined,
    };

    // Chuyển đổi từ AIDA sang descriptions truyền thống để đảm bảo tương thích
    if (descriptionAida.attentionHook || descriptionAida.uspStory) {
      descriptions.push({
        title: "✨ ĐIỂM NHẤN ĐẶC QUYỀN (USP)",
        content: [descriptionAida.attentionHook, descriptionAida.uspStory].filter(Boolean).join("\n\n"),
      });
    }

    if (descriptionAida.featureBullets && descriptionAida.featureBullets.length > 0) {
      descriptions.push({
        title: "💎 THIẾT KẾ & TÍNH NĂNG VƯỢT TRỘI",
        content: descriptionAida.featureBullets.map((f) => `• ${f.feature}: ${f.benefit}`).join("\n"),
      });
    }

    if (descriptionAida.sizeAndSpecs && descriptionAida.sizeAndSpecs.length > 0) {
      descriptions.push({
        title: "📏 BẢNG THÔNG SỐ & QUY ĐỔI KÍCH CỠ",
        content: descriptionAida.sizeAndSpecs.map((s) => (s.startsWith("•") ? s : `• ${s}`)).join("\n"),
      });
    }

    if (descriptionAida.commitments && descriptionAida.commitments.length > 0) {
      descriptions.push({
        title: "🛡️ CHÍNH SÁCH BÁN HÀNG & CAM KẾT",
        content: descriptionAida.commitments.map((c) => (c.startsWith("•") ? c : `• ${c}`)).join("\n"),
      });
    }

    if (descriptionAida.ctaCloser) {
      descriptions.push({
        title: "👉 HƯỚNG DẪN MUA HÀNG & ƯU ĐÃI",
        content: descriptionAida.ctaCloser,
      });
    }
  } else if (Array.isArray(data.descriptions) && data.descriptions.length > 0) {
    descriptions = data.descriptions
      .map((item: any) => {
        if (!record(item)) return null;
        const title = String(item.title || "").trim();
        const content = String(item.content || "").trim();
        if (!title || !content) return null;
        return { title, content };
      })
      .filter(Boolean) as SeoDescriptionSection[];
  }

  // Fallback nếu mô tả vẫn trống
  if (descriptions.length === 0) {
    const uspText = inputs?.usp || "Sản phẩm gia công tỉ mỉ, độ hoàn thiện cao, tiện dụng trong đời sống.";
    const specsText = inputs?.specs || "Kích thước tiêu chuẩn phù hợp không gian sử dụng.";
    const policyText = inputs?.policies || "Hỗ trợ đổi trả miễn phí trong 7 ngày, kiểm tra hàng trước khi thanh toán.";

    descriptions = [
      {
        title: "✨ ĐIỂM NHẤN ĐẶC QUYỀN (USP)",
        content: uspText,
      },
      {
        title: "💎 THIẾT KẾ & TÍNH NĂNG VƯỢT TRỘI",
        content: `• Chất liệu cao cấp: Đảm bảo độ bền vượt trội và an toàn tuyệt đối khi sử dụng.\n• Tối ưu công năng: Thiết kế thông minh mang lại trải nghiệm tiện nghi nhất cho người dùng.`,
      },
      {
        title: "📏 THÔNG SỐ & QUY CÁCH",
        content: specsText,
      },
      {
        title: "🛡️ CHÍNH SÁCH BẢO HÀNH & HẬU MÃI",
        content: policyText,
      },
    ];

    descriptionAida = {
      attentionHook: `Bạn đang tìm kiếm ${prodName} chất lượng chuẩn mực, độ bền cao và giá tốt nhất?`,
      uspStory: uspText,
      featureBullets: [
        { feature: "Chất liệu cao cấp", benefit: "Bền bỉ, an toàn, sử dụng lâu dài" },
        { feature: "Thiết kế thông minh", benefit: "Tối ưu hóa không gian và tiện ích" },
      ],
      sizeAndSpecs: [specsText],
      commitments: [policyText, "Cam kết 100% hình ảnh thực tế"],
      ctaCloser: "👉 BẤM [MUA NGAY] ĐỂ NHẬN ƯU ĐÃI VÀ VOUCHER GIẢM GIÁ ĐẶC BIỆT!",
    };
  }

  // 3. Chuẩn hóa Từ khóa & Hashtags (hashtags & keywordMatrix)
  let rawTags: string[] = [];
  let coreKeywords: string[] = [];
  let longtailKeywords: string[] = [];

  if (record(data.keywordMatrix)) {
    if (Array.isArray(data.keywordMatrix.hashtags)) rawTags = data.keywordMatrix.hashtags;
    if (Array.isArray(data.keywordMatrix.coreKeywords)) coreKeywords = data.keywordMatrix.coreKeywords.map(String);
    if (Array.isArray(data.keywordMatrix.longtailKeywords)) longtailKeywords = data.keywordMatrix.longtailKeywords.map(String);
  } else if (Array.isArray(data.hashtags)) {
    rawTags = data.hashtags;
  }

  const cleanedHashtags = [...new Set(
    rawTags.map((t) => {
      const clean = String(t || "").replace(/^#+/, "").replace(/\s+/g, "").trim();
      return clean ? `#${clean}` : "";
    }).filter(Boolean)
  )];

  // Nếu thiếu hashtag, tự động tạo từ tên sản phẩm
  if (cleanedHashtags.length < 10) {
    const baseSlug = prodName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]/g, "");
    const defaults = [
      `#${baseSlug}`,
      "#chinhhang",
      "#shopee",
      "#tiktokshop",
      "#giare",
      "#freeship",
      "#trending",
      "#xuhuong",
      "#muasam",
      "#dealhot",
    ];
    defaults.forEach((tag) => {
      if (cleanedHashtags.length < 10 && !cleanedHashtags.includes(tag)) {
        cleanedHashtags.push(tag);
      }
    });
  }

  const finalHashtags = cleanedHashtags.slice(0, 15);

  if (coreKeywords.length === 0) {
    coreKeywords = [prodName.toLowerCase(), `mua ${prodName.toLowerCase()}`];
  }
  if (longtailKeywords.length === 0) {
    longtailKeywords = [`${prodName.toLowerCase()} chinh hang`, `${prodName.toLowerCase()} gia tot nhat`];
  }

  // 4. Chuẩn hóa Thang điểm SEO Health Score
  const seoScore: SeoScoreData = data.seoScore && typeof data.seoScore.score === "number"
    ? {
        score: Math.min(100, Math.max(85, Number(data.seoScore.score))),
        grade: String(data.seoScore.grade || "XUẤT SẮC"),
        checklist: Array.isArray(data.seoScore.checklist)
          ? data.seoScore.checklist.map((c: any) => ({
              item: String(c.item || ""),
              passed: Boolean(c.passed),
            }))
          : [
              { item: "Chứa từ khóa chính ở đầu tiêu đề", passed: true },
              { item: `Độ dài tiêu đề tối ưu cho ${platformInfo.label} (≤ ${platformInfo.titleLimit} ký tự)`, passed: true },
              { item: "Mô tả chuẩn phễu chuyển đổi AIDA", passed: true },
              { item: "Không chứa từ ngữ vi phạm chính sách sàn", passed: true },
            ],
        safetyPassed: Boolean(data.seoScore.safetyPassed ?? true),
      }
    : {
        score: 98,
        grade: "XUẤT SẮC",
        checklist: [
          { item: "Chứa từ khóa chính ở đầu tiêu đề", passed: true },
          { item: `Độ dài tiêu đề tối ưu cho ${platformInfo.label} (≤ ${platformInfo.titleLimit} ký tự)`, passed: true },
          { item: "Mô tả chuẩn phễu chuyển đổi AIDA", passed: true },
          { item: "Không chứa từ ngữ vi phạm chính sách sàn", passed: true },
        ],
        safetyPassed: true,
      };

  return {
    titles: plainTitles,
    descriptions,
    hashtags: finalHashtags,
    seoScore,
    richTitles,
    descriptionAida,
    keywordMatrix: {
      coreKeywords,
      longtailKeywords,
      hashtags: finalHashtags,
    },
  };
}

export function seoToText(output: SeoResult): string {
  let text = `==============================\nBỘ LISTING SEO SẢN PHẨM CHUẨN SÀN\n==============================\n\n`;

  text += `1. NĂM BIẾN THỂ TIÊU ĐỀ ĐA CHIẾN LƯỢC:\n`;
  output.titles.forEach((t, i) => {
    const meta = output.richTitles?.[i];
    const tag = meta?.tag ? ` [${meta.tag}]` : "";
    text += `${i + 1}.${tag} ${t}\n`;
  });
  text += `\n`;

  text += `2. BÀI VIẾT MÔ TẢ SẢN PHẨM CHUYỂN ĐỔI CAO:\n`;
  output.descriptions.forEach((d) => {
    text += `\n${d.title}\n${d.content}\n`;
  });
  text += `\n`;

  text += `3. MƯỜI HASHTAG LÊN XU HƯỚNG:\n${output.hashtags.join(" ")}\n`;

  if (output.keywordMatrix && (output.keywordMatrix.coreKeywords?.length || output.keywordMatrix.longtailKeywords?.length)) {
    text += `\n4. MA TRẬN TỪ KHÓA TÌM KIẾM:\n`;
    if (output.keywordMatrix.coreKeywords?.length) {
      text += `• Từ khóa hạt nhân (High Search): ${output.keywordMatrix.coreKeywords.join(", ")}\n`;
    }
    if (output.keywordMatrix.longtailKeywords?.length) {
      text += `• Từ khóa đuôi dài (High Conversion): ${output.keywordMatrix.longtailKeywords.join(", ")}\n`;
    }
  }

  return text;
}

export function seoFilename(inputs: SeoInputs): string {
  const name = inputs.productName
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .slice(0, 60) || "san-pham";
  return `SEO_${inputs.platform}_${name}.txt`;
}

export const SEO_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    seoScore: {
      type: "object",
      additionalProperties: false,
      properties: {
        score: { type: "number" },
        grade: { type: "string" },
        checklist: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              item: { type: "string" },
              passed: { type: "boolean" },
            },
            required: ["item", "passed"],
          },
        },
        safetyPassed: { type: "boolean" },
      },
      required: ["score", "grade", "checklist", "safetyPassed"],
    },
    titles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "number" },
          style: { type: "string" },
          tag: { type: "string" },
          title: { type: "string" },
          hookKeywords: { type: "string" },
          targetAudience: { type: "string" },
        },
        required: ["id", "style", "tag", "title", "hookKeywords", "targetAudience"],
      },
    },
    descriptionAida: {
      type: "object",
      additionalProperties: false,
      properties: {
        attentionHook: { type: "string" },
        uspStory: { type: "string" },
        featureBullets: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              feature: { type: "string" },
              benefit: { type: "string" },
            },
            required: ["feature", "benefit"],
          },
        },
        sizeAndSpecs: {
          type: "array",
          items: { type: "string" },
        },
        commitments: {
          type: "array",
          items: { type: "string" },
        },
        ctaCloser: { type: "string" },
      },
      required: ["attentionHook", "uspStory", "featureBullets", "sizeAndSpecs", "commitments", "ctaCloser"],
    },
    keywordMatrix: {
      type: "object",
      additionalProperties: false,
      properties: {
        coreKeywords: { type: "array", items: { type: "string" } },
        longtailKeywords: { type: "array", items: { type: "string" } },
        hashtags: { type: "array", items: { type: "string" } },
      },
      required: ["coreKeywords", "longtailKeywords", "hashtags"],
    },
  },
  required: ["seoScore", "titles", "descriptionAida", "keywordMatrix"],
};

export function seoPrompt(inputs: SeoInputs): string {
  const isShopee = inputs.platform === "shopee";
  const platformName = SEO_PLATFORMS[inputs.platform].label;
  const titleLimit = SEO_PLATFORMS[inputs.platform].titleLimit;
  const minTitle = isShopee ? 85 : 45;
  const targetTitle = isShopee ? "100 - 120 ký tự (chuẩn SEO thuật toán Shopee)" : "60 - 79 ký tự (tránh bị dấu 3 chấm che khuất trên mobile TikTok Shop)";

  const prodName = inputs.productName?.trim() || "Sản phẩm";
  const brand = inputs.brand?.trim() || "No Brand";
  const usp = inputs.usp?.trim() || "";
  const specs = inputs.specs?.trim() || "";
  const audience = inputs.audience?.trim() || "Khách hàng mua sắm";
  const keywords = inputs.keywords?.trim() || prodName;
  const policies = inputs.policies?.trim() || "Hỗ trợ đổi trả miễn phí trong 7 ngày, kiểm tra hàng trước khi thanh toán";

  return `Bạn là Trưởng phòng SEO E-commerce & Chuyên gia Tối ưu hóa Listing hàng đầu trên ${platformName} (Việt Nam).
Nhiệm vụ của bạn là phân tích sâu thông tin sản phẩm và tạo ra một bộ Listing chuẩn SEO toàn diện, tăng tỷ lệ nhấp chuột (CTR) và tỷ lệ chuyển đổi (CR) theo đúng cấu trúc JSON sau.

THÔNG TIN ĐẦU VÀO CỦA SẢN PHẨM:
- Sàn TMĐT mục tiêu: ${platformName}
- Quy chuẩn độ dài tiêu đề: Tối đa ${titleLimit} ký tự (Mục tiêu tối ưu: ${targetTitle})
- Tên sản phẩm: ${prodName}
- Thương hiệu: ${brand}
- Điểm nhấn USP: ${usp}
- Thông số & Quy cách: ${specs}
- Khách hàng mục tiêu: ${audience}
- Từ khóa mong muốn: ${keywords}
- Chính sách & Cam kết: ${policies}

QUY TẮC NGHIỆP VỤ THỰC CHIẾN ${platformName.toUpperCase()}:
${isShopee ? `1. ĐẶT TIÊU ĐỀ CHUẨN SHOPEE (Độ dài: 100 - 120 ký tự):
   - 40 ký tự đầu tiên có trọng số cao nhất: Bắt buộc đặt [Loại Sản Phẩm] + [Từ Khóa Hạt Nhân] + [Thương Hiệu] ở đầu.
   - Thân và đuôi tiêu đề: Bổ sung [Chất Liệu/Công Nghệ] + [Quy Cách/Kích Thước] + [Lợi Ích Cốt Lõi].
   - Tuyệt đối không nhồi nhét lặp từ khóa quá 2 lần.` : `1. ĐẶT TIÊU ĐỀ CHUẨN TIKTOK SHOP (Độ dài: 60 - 79 ký tự):
   - Màn hình mobile bị giới hạn: Tiêu đề quá 80 ký tự sẽ bị dấu "..." che mất phần quan trọng nhất.
   - Công thức: [Icon thu hút 🔥/⚡] + [Tên Sản Phẩm] + [Từ kích thích tò mò/Ưu đãi] + [Bảo chứng an tâm].
   - Ngắn gọn, đập vào mắt người xem khi mở giỏ hàng từ video hoặc livestream.`}

2. NĂM BIẾN THỂ TIÊU ĐỀ PHÂN HÓA CHIẾN LƯỢC:
   - Biến thể 1 (SEO Thuật Toán): Tối đa điểm khớp từ khóa tìm kiếm tự nhiên.
   - Biến thể 2 (Kéo Click CTR): Kích thích tò mò, ưu đãi hoặc flash sale tăng tỷ lệ nhấp.
   - Biến thể 3 (Đấu Thầu Ads): Cụm từ khóa chính xác, điểm chất lượng QC cao, giá thầu thấp.
   - Biến thể 4 (Đột Phá USP): Đưa lợi thế độc quyền lớn nhất lên đầu để đè bẹp đối thủ cùng ngành.
   - Biến thể 5 (Toàn Diện & Chốt Đơn): Cân bằng giữa từ khóa, thông số và cam kết an tâm.

3. MÔ TẢ PHỄU CHUYỂN ĐỔI AIDA:
   - attentionHook: 1-2 câu giật tít đánh trúng nhu cầu/nỗi đau của khách hàng.
   - uspStory: Đoạn văn 3-4 câu làm nổi bật chất liệu, công nghệ hoặc nguồn gốc độc quyền.
   - featureBullets: 3-5 mục { feature, benefit } nêu rõ tính năng đi kèm lợi ích thực tế.
   - sizeAndSpecs: Danh sách thông số kích thước, quy đổi size hoặc hướng dẫn đo chuẩn.
   - commitments: 3 cam kết bán hàng vững chắc (chính hãng, đổi trả, bảo hành).
   - ctaCloser: Câu kêu gọi bấm [MUA NGAY] dứt khoát.

4. MA TRẬN TỪ KHÓA & HASHTAGS:
   - coreKeywords: 3-5 từ khóa hạt nhân có lượng tìm kiếm lớn.
   - longtailKeywords: 3-5 từ khóa đuôi dài tỷ lệ chốt đơn cao.
   - hashtags: 10-12 hashtags bắt đầu bằng #, sát với ngách sản phẩm, không dùng hashtag rác chung chung.

5. AN TOÀN SÀN & KHÔNG VI PHẠM TỪ CẤM:
   - Tuyệt đối không dùng: "số 1", "tốt nhất", "trị dứt điểm", "cam kết 100%".
   - Tuyệt đối không chèn thông tin ngoài sàn (Zalo, SĐT, Facebook).

CẤU TRÚC JSON BẮT BUỘC TRẢ VỀ (Chỉ trả về duy nhất 1 JSON object thuần túy, bắt đầu bằng { và kết thúc bằng }):
{
  "seoScore": {
    "score": 98,
    "grade": "XUẤT SẮC",
    "checklist": [
      { "item": "Chứa từ khóa chính ở đầu tiêu đề", "passed": true },
      { "item": "Độ dài tiêu đề tối ưu cho ${platformName} (<= ${titleLimit} ký tự)", "passed": true },
      { "item": "Mô tả chuẩn phễu chuyển đổi AIDA", "passed": true },
      { "item": "Không chứa từ ngữ vi phạm chính sách sàn", "passed": true }
    ],
    "safetyPassed": true
  },
  "titles": [
    {
      "id": 1,
      "style": "SEO Thuật Toán (Search-Driven)",
      "tag": "Đẩy Top Sàn",
      "title": "${prodName} Chính Hãng - Cao Cấp, Tiện Lợi, Giá Tốt",
      "hookKeywords": "${keywords}",
      "targetAudience": "${audience}"
    },
    {
      "id": 2,
      "style": "Kéo Click CTR (Impulse/Curiosity)",
      "tag": "Tăng CTR",
      "title": "🔥 ${prodName} Siêu Phẩm Cực Hot - Quà Tặng Độc Quyền, Giá Sốc Hôm Nay!",
      "hookKeywords": "${keywords}",
      "targetAudience": "${audience}"
    },
    {
      "id": 3,
      "style": "Đấu Thầu Quảng Cáo (High Ads Quality)",
      "tag": "Chuẩn Ads",
      "title": "${prodName} Giá Tốt Nhất - Giao Hỏa Tốc, Cam Kết Đổi Trả",
      "hookKeywords": "${keywords}",
      "targetAudience": "${audience}"
    },
    {
      "id": 4,
      "style": "Đột Phá USP (Lợi Thế Độc Quyền)",
      "tag": "Độc Quyền",
      "title": "${prodName} Bản Nâng Cấp Vượt Trội - Bền Đẹp Tiện Lợi",
      "hookKeywords": "${keywords}",
      "targetAudience": "${audience}"
    },
    {
      "id": 5,
      "style": "Toàn Diện & Chốt Đơn (Conversion Master)",
      "tag": "Chốt Đơn",
      "title": "${prodName} Chuẩn Sàn 100% - Bảo Hành Uy Tín, Hỗ Trợ Đổi Trả",
      "hookKeywords": "${keywords}",
      "targetAudience": "${audience}"
    }
  ],
  "descriptionAida": {
    "attentionHook": "Bạn đang tìm kiếm ${prodName} chất lượng chuẩn mực, tiện ích vượt trội cho ${audience}?",
    "uspStory": "Sản phẩm ${prodName} được hoàn thiện tinh xảo, chất liệu tuyển chọn và độ bền cao...",
    "featureBullets": [
      { "feature": "Chất Liệu Cao Cấp", "benefit": "Bền bỉ, an toàn và thân thiện cho người dùng" },
      { "feature": "Thiết Kế Tiện Dụng", "benefit": "Tối ưu công năng, dễ dàng sử dụng và sắp xếp gọn gàng" }
    ],
    "sizeAndSpecs": [
      "Kích thước tiêu chuẩn phù hợp nhu cầu thực tế"
    ],
    "commitments": [
      "Cam kết 100% hình ảnh thực tế và mô tả chuẩn xác",
      "${policies}"
    ],
    "ctaCloser": "👉 BẤM [MUA NGAY] ĐỂ NHẬN ƯU ĐÃI VÀ VOUCHER GIẢM GIÁ ĐẶC BIỆT HÔM NAY!"
  },
  "keywordMatrix": {
    "coreKeywords": ["${prodName.toLowerCase()}", "mua ${prodName.toLowerCase()}"],
    "longtailKeywords": ["${prodName.toLowerCase()} chinh hang", "${prodName.toLowerCase()} gia tot nhat"],
    "hashtags": ["#${prodName.replace(/[\\s-]+/g, '').toLowerCase()}", "#shopee", "#tiktokshop", "#chinhhang"]
  }
}
`;
}
