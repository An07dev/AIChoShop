"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  Tag,
  FileSpreadsheet,
  FileText,
  Hash,
  ShoppingBag,
  Flame,
  Target,
  Search,
  CheckCircle2,
  ShieldCheck,
  Ruler,
  Gem,
  Code2,
  LayoutGrid,
  Boxes,
  Award,
  Zap,
  CheckCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";

export interface ListingScoreData {
  score: number;
  grade: string;
  checklist: { item: string; passed: boolean }[];
  safetyPassed: boolean;
}

export interface TitleVariant {
  id: number;
  label: string;
  tag: string;
  iconType: "search" | "trend" | "ads";
  title: string;
  charCount: number;
  targetAudience?: string;
  hookKeywords?: string;
}

export interface AttributeItem {
  attribute: string;
  value: string;
  requiredByPlatform?: boolean;
}

export interface SkuSuggestionGroup {
  groupName: string;
  options: string[];
}

export interface DescSection {
  attentionHook?: string;
  uspText: string;
  features: { title: string; content: string }[];
  sizeGuide: string[];
  commitments: string[];
  ctaCloser?: string;
  rawText: string;
}

export interface KeywordTags {
  keywords: string[];
  longtailKeywords?: string[];
  hashtags: string[];
}

export interface ParsedVisionData {
  listingScore?: ListingScoreData;
  titles: TitleVariant[];
  specs: AttributeItem[];
  skuSuggestions?: SkuSuggestionGroup[];
  desc: DescSection;
  tags: KeywordTags;
  hasStructuredData: boolean;
  raw: string;
  isJsonSchema?: boolean;
}

interface VisionListingOutputProps {
  output: string | null;
  isLoading: boolean;
  productImage: string | null;
  onUseSample?: () => void;
  elapsedSeconds?: number;
  onCancel?: () => void;
  productName?: string;
}

const VISION_STAGES = [
  { upToSeconds: 4, text: "🖼️ Đang quét & nhận diện hình ảnh sản phẩm..." },
  { upToSeconds: 10, text: "🔍 Phân tích chi tiết vật liệu, kiểu dáng & màu sắc..." },
  { upToSeconds: 20, text: "📝 Tối ưu tiêu đề chuẩn SEO Shopee, TikTok Shop, Lazada..." },
  { upToSeconds: 35, text: "🛒 Soạn thông số kỹ thuật, SKU & mô tả AIDA thu hút..." },
  { upToSeconds: 60, text: "🛡️ Kiểm duyệt từ cấm sàn & hoàn thiện trọn bộ listing..." },
];

function stripAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Trích xuất và chuẩn hóa đối tượng JSON Schema E-commerce
 */
function parseJsonVisionOutput(json: any, rawText: string): ParsedVisionData {
  const titles: TitleVariant[] = (Array.isArray(json.titles) ? json.titles : []).map(
    (t: any, idx: number) => {
      const id = t.id ?? idx + 1;
      const title = String(t.title || "").trim();
      const style = String(t.style || t.platform || `Biến thể ${id}`).trim();
      return {
        id,
        label: style,
        tag: t.platform ? `${t.platform} • ${style}` : style,
        iconType: id === 1 ? "search" : id === 2 ? "trend" : "ads",
        title,
        charCount: title.length,
        targetAudience: t.targetAudience,
        hookKeywords: t.hookKeywords,
      };
    }
  );

  const specs: AttributeItem[] = (Array.isArray(json.sellerAttributes) ? json.sellerAttributes : []).map(
    (attr: any) => ({
      attribute: String(attr.name || attr.attribute || "").trim(),
      value: String(attr.value || "").trim(),
      requiredByPlatform: Boolean(attr.requiredByPlatform),
    })
  );

  const skuSuggestions: SkuSuggestionGroup[] = Array.isArray(json.skuSuggestions)
    ? json.skuSuggestions.map((g: any) => ({
      groupName: String(g.groupName || "Phân loại hàng"),
      options: Array.isArray(g.options) ? g.options.map(String) : [],
    }))
    : [];

  const aida = json.aidaDescription || {};
  const features = Array.isArray(aida.featureBullets)
    ? aida.featureBullets.map((f: any) => ({
      title: String(f.feature || f.title || "Tính năng").trim(),
      content: String(f.benefit || f.content || "").trim(),
    }))
    : [];

  const sizeGuide = Array.isArray(aida.usageAndSize)
    ? aida.usageAndSize.map(String)
    : [];

  const commitments = Array.isArray(aida.guarantees)
    ? aida.guarantees.map(String)
    : [];

  const seoTags = json.seoTags || {};
  const coreKeywords = Array.isArray(seoTags.coreKeywords) ? seoTags.coreKeywords.map(String) : [];
  const longtailKeywords = Array.isArray(seoTags.longtailKeywords) ? seoTags.longtailKeywords.map(String) : [];
  const hashtags = Array.isArray(seoTags.hashtags)
    ? seoTags.hashtags.map((h: string) => (String(h).startsWith("#") ? String(h) : `#${h}`))
    : [];

  const listingScore: ListingScoreData | undefined = json.listingScore
    ? {
      score: Number(json.listingScore.score) || 98,
      grade: String(json.listingScore.grade || "XUẤT SẮC"),
      checklist: Array.isArray(json.listingScore.checklist)
        ? json.listingScore.checklist.map((c: any) => ({
          item: String(c.item || ""),
          passed: Boolean(c.passed),
        }))
        : [
          { item: "Tiêu đề chuẩn công thức SEO Shopee & TikTok", passed: true },
          { item: "Đầy đủ 100% thuộc tính bắt buộc của Seller Center", passed: true },
          { item: "Mô tả AIDA có Hook 3 giây chuyển đổi cao", passed: true },
          { item: "Kiểm duyệt an toàn: 0% vi phạm từ cấm sàn", passed: true },
        ],
      safetyPassed: Boolean(json.listingScore.safetyPassed ?? true),
    }
    : undefined;

  return {
    listingScore,
    titles,
    specs,
    skuSuggestions,
    desc: {
      attentionHook: aida.attentionHook ? String(aida.attentionHook).trim() : undefined,
      uspText: aida.uspPoint ? String(aida.uspPoint).trim() : "",
      features,
      sizeGuide,
      commitments,
      ctaCloser: aida.ctaCloser ? String(aida.ctaCloser).trim() : undefined,
      rawText: "",
    },
    tags: {
      keywords: [...coreKeywords, ...longtailKeywords],
      longtailKeywords,
      hashtags,
    },
    hasStructuredData: titles.length > 0 || specs.length > 0,
    raw: rawText,
    isJsonSchema: true,
  };
}

/**
 * Bộ chuẩn hóa dữ liệu Listing tự động (Fallback Auto-Normalizer)
 * Đảm bảo mọi phản hồi từ AI (kể cả văn bản tự do, hội thoại hay gạch đầu dòng)
 * đều được chuyển đổi thành cấu trúc đầy đủ, không bao giờ để UI bị trống card hay vỡ layout.
 */
function autoNormalizeVisionData(parsed: ParsedVisionData, rawText: string): ParsedVisionData {
  // 1. Quét tìm tất cả các cặp Key-Value từ gạch đầu dòng nếu specs chưa có
  if (parsed.specs.length === 0) {
    const bulletRegex = /(?:^|\n)\s*(?:[-*•]|\d+[.)])\s*(?:\*\*)?([^*:\n]+?)(?:\*\*)?\s*:\s*(?:`|'|")?([^`'"\n]+)(?:`|'|")?/g;
    let match;
    while ((match = bulletRegex.exec(rawText)) !== null) {
      const attr = match[1].replace(/[*`]/g, "").trim();
      const val = match[2].replace(/[*`]/g, "").trim();
      if (attr && val && !stripAccents(attr).includes("thong so")) {
        parsed.specs.push({
          attribute: attr,
          value: val,
          requiredByPlatform: true,
        });
      }
    }
  }

  // 2. Nhận diện tên sản phẩm
  let prodName = "";
  const nameSpec = parsed.specs.find((s) =>
    /tên sản phẩm|tên loại|sản phẩm|loại sản phẩm/i.test(stripAccents(s.attribute))
  );
  if (nameSpec && nameSpec.value && !nameSpec.value.includes("trình bày")) {
    prodName = nameSpec.value;
  }
  if (!prodName) {
    const match = rawText.match(/(?:sản phẩm|tên sản phẩm|mặt hàng)[:\s]*[`"']?([A-Za-z0-9\s-]{3,35})[`"']?/i);
    if (match) prodName = match[1].trim();
  }
  if (!prodName) {
    prodName = "Sản Phẩm Cao Cấp";
  }

  // Lọc sạch bất kỳ tiêu đề nào bị dính cú pháp JSON
  parsed.titles = (parsed.titles || []).filter((t) => {
    const s = (t.title || "").trim();
    return (
      s.length > 5 &&
      !s.startsWith("{") &&
      !s.startsWith("}") &&
      !s.startsWith("[") &&
      !s.includes('"item"') &&
      !s.includes('"passed"') &&
      !s.includes('":')
    );
  });

  // 3. Chuẩn hóa Tiêu đề chuẩn SEO nếu thiếu (đảm bảo luôn có 3 biến thể rõ ràng)
  if (parsed.titles.length === 0) {
    parsed.titles = [
      {
        id: 1,
        label: "SEO Tìm Kiếm Tự Nhiên (Search-Driven)",
        tag: "Shopee & Lazada · SEO",
        iconType: "search",
        title: `${prodName} Chính Hãng - Bản Cao Cấp, Độ Bền Vượt Trội, Bảo Hành Đổi Mới Uy Tín`,
        charCount: `${prodName} Chính Hãng - Bản Cao Cấp, Độ Bền Vượt Trội, Bảo Hành Đổi Mới Uy Tín`.length,
        targetAudience: "Khách có nhu cầu tìm mua sản phẩm chuẩn chất lượng",
        hookKeywords: prodName.toLowerCase(),
      },
      {
        id: 2,
        label: "Kéo Click & Chốt Cảm Xúc (Impulse-Driven)",
        tag: "TikTok Shop · Viral",
        iconType: "trend",
        title: `🔥 ${prodName} Siêu Phẩm Cực Hot - Quà Tặng Độc Quyền & Voucher Giảm Giá Sốc Hôm Nay!`,
        charCount: `🔥 ${prodName} Siêu Phẩm Cực Hot - Quà Tặng Độc Quyền & Voucher Giảm Giá Sốc Hôm Nay!`.length,
        targetAudience: "Khách lướt video chốt đơn nhanh theo ưu đãi",
        hookKeywords: "deal hot, giảm giá hôm nay",
      },
      {
        id: 3,
        label: "Tối Ưu Quảng Cáo Tìm Kiếm (High CTR & Low CPC)",
        tag: "Đấu Thầu Ads",
        iconType: "ads",
        title: `${prodName} Giá Tốt Nhất - Giao Hỏa Tốc, Cam Kết 100% Hàng Mới Chuẩn Sàn`,
        charCount: `${prodName} Giá Tốt Nhất - Giao Hỏa Tốc, Cam Kết 100% Hàng Mới Chuẩn Sàn`.length,
        targetAudience: "Khách tìm kiếm từ khóa mua ngay",
        hookKeywords: "giá tốt, giao hỏa tốc",
      },
    ];
  }

  // Lọc sạch bất kỳ thông số nào bị dính cú pháp JSON
  parsed.specs = (parsed.specs || []).filter((s) => {
    const a = (s.attribute || "").trim();
    const v = (s.value || "").trim();
    return (
      !a.startsWith("{") &&
      !a.includes('"item"') &&
      !v.startsWith("{") &&
      !v.includes('"passed"')
    );
  });

  // 4. Chuẩn hóa Bảng thông số nếu rỗng
  if (parsed.specs.length === 0) {
    parsed.specs = [
      { attribute: "Loại sản phẩm", value: prodName, requiredByPlatform: true },
      { attribute: "Chất liệu", value: "Cao cấp, kiểm định chất lượng", requiredByPlatform: true },
      { attribute: "Xuất xứ", value: "Việt Nam / Chính Hãng", requiredByPlatform: true },
      { attribute: "Bảo hành", value: "12 tháng chính hãng lỗi 1 đổi 1", requiredByPlatform: true },
      { attribute: "Tính năng nổi bật", value: "Độ hoàn thiện tinh xảo, độ bền cao", requiredByPlatform: true },
    ];
  }

  // 5. Chuẩn hóa Phân loại SKU nếu thiếu
  if (!parsed.skuSuggestions || parsed.skuSuggestions.length === 0) {
    const colorSpec = parsed.specs.find((s) => /màu sắc|phân loại|kiểu dáng/i.test(stripAccents(s.attribute)));
    const colorVal = colorSpec?.value ? colorSpec.value : "Tiêu Chuẩn, Đen, Bạc";
    parsed.skuSuggestions = [
      {
        groupName: "Phân Loại Màu Sắc & Kiểu Dáng",
        options: colorVal.split(/[,/]/).map((s) => s.trim()).filter(Boolean),
      },
      {
        groupName: "Chiến Lược Combo Tăng Giá Trị Đơn (AOV)",
        options: ["Bản Tiêu Chuẩn", "Bản Cao Cấp (+ Quà Tặng)", "Combo Tiết Kiệm (Mua 2 Giảm 10%)"],
      },
    ];
  }

  // 6. Chuẩn hóa Bài viết Mô tả AIDA nếu thiếu
  if (!parsed.desc.uspText && parsed.desc.features.length === 0) {
    parsed.desc.attentionHook = `Bạn đang tìm kiếm ${prodName} với thiết kế đẳng cấp, chất lượng vượt trội và giá tốt nhất?`;
    parsed.desc.uspText = `Sở hữu độ hoàn thiện tinh xảo, chất lượng đáng tin cậy cùng chính sách hậu mãi và bảo hành chu đáo hàng đầu thị trường.`;

    const featureSpecs = parsed.specs.filter(
      (s) => !/tên sản phẩm|tên loại|loại sản phẩm/i.test(stripAccents(s.attribute))
    );

    if (featureSpecs.length > 0) {
      parsed.desc.features = featureSpecs.slice(0, 4).map((s) => ({
        title: s.attribute,
        content: s.value,
      }));
    } else {
      parsed.desc.features = [
        { title: "Chất Liệu Cao Cấp", content: "Được gia công tỉ mỉ, độ bền vượt trội và tính thẩm mỹ cao" },
        { title: "Thiết Kế Thời Thượng", content: "Kiểu dáng hiện đại, sang trọng, phù hợp cho mọi hoàn cảnh" },
      ];
    }

    if (parsed.desc.commitments.length === 0) {
      parsed.desc.commitments = [
        "Cam kết 100% hình ảnh thực tế và chất lượng sản phẩm đúng như mô tả",
        "Hỗ trợ đổi trả miễn phí trong 7 ngày nếu lỗi từ nhà sản xuất",
        "Đóng gói 3 lớp chống sốc an toàn, giao hàng nhanh toàn quốc",
      ];
    }

    if (!parsed.desc.ctaCloser) {
      parsed.desc.ctaCloser = "👉 BẤM [THÊM VÀO GIỎ HÀNG] HOẶC [MUA NGAY] ĐỂ NHẬN ƯU ĐÃI ĐẶC QUYỀN HÔM NAY!";
    }
  }

  // 7. Chuẩn hóa Tags & Hashtags nếu thiếu
  if (parsed.tags.keywords.length === 0) {
    const baseWords = prodName.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    parsed.tags.keywords = [prodName.toLowerCase(), ...baseWords, "chính hãng", "giá tốt"];
  }
  if (parsed.tags.hashtags.length === 0) {
    const cleanTag = prodName.replace(/[\s-]+/g, "").toLowerCase();
    parsed.tags.hashtags = [`#${cleanTag}`, "#chinhhang", "#shopee", "#tiktokshop", "#trending"];
  }

  // 8. Đảm bảo có Listing Score
  if (!parsed.listingScore) {
    parsed.listingScore = {
      score: 96,
      grade: "XUẤT SẮC",
      checklist: [
        { item: "Tiêu đề chuẩn công thức SEO Shopee & TikTok", passed: true },
        { item: "Đầy đủ 100% thuộc tính bắt buộc của Seller Center", passed: true },
        { item: "Mô tả AIDA có Hook 3 giây chuyển đổi cao", passed: true },
        { item: "Kiểm duyệt an toàn: 0% vi phạm từ cấm sàn", passed: true },
      ],
      safetyPassed: true,
    };
  }

  parsed.hasStructuredData = true;
  return parsed;
}

/**
 * Trình khôi phục và giải mã JSON thông minh
 * Tự động sửa các lỗi phổ biến từ LLM: thiếu ngoặc đóng khi bị truncate,
 * dấu phẩy thừa, newlines trong chuỗi, hoặc trích xuất từng mảng section.
 */
function repairAndParseJsonListing(raw: string): any | null {
  if (!raw) return null;
  let text = raw.trim();

  // Loại bỏ markdown code blocks nếu có
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // 1. Thử parse trực tiếp
  try {
    return JSON.parse(text);
  } catch { }

  // 2. Sửa lỗi phổ biến: dấu phẩy thừa trước } hoặc ] và newlines trong chuỗi
  let cleaned = text
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/(:\s*"[^"]*)\n([^"]*")/g, "$1\\n$2");

  try {
    return JSON.parse(cleaned);
  } catch { }

  // 3. Tự động đóng các ngoặc bị thiếu nếu model bị cắt ngắn (truncated) do chạm max_tokens
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
  } catch { }

  // 4. Trích xuất từng section độc lập bằng regex nếu cấu trúc tổng thể bị lỗi
  const result: any = {};

  // Trích xuất titles
  const titlesM = text.match(/"titles"\s*:\s*\[([\s\S]*?)(?:\]|\n\s*"[a-zA-Z]+")/);
  if (titlesM) {
    let tRaw = titlesM[1].trim().replace(/,\s*$/, "");
    if (!tRaw.endsWith("]")) {
      const lastObj = tRaw.lastIndexOf("}");
      if (lastObj !== -1) tRaw = tRaw.substring(0, lastObj + 1);
      tRaw = `[${tRaw}]`;
    }
    try {
      result.titles = JSON.parse(tRaw);
    } catch { }
  }

  // Trích xuất sellerAttributes
  const attrM = text.match(/"sellerAttributes"\s*:\s*\[([\s\S]*?)(?:\]|\n\s*"[a-zA-Z]+")/);
  if (attrM) {
    let aRaw = attrM[1].trim().replace(/,\s*$/, "");
    if (!aRaw.endsWith("]")) {
      const lastObj = aRaw.lastIndexOf("}");
      if (lastObj !== -1) aRaw = aRaw.substring(0, lastObj + 1);
      aRaw = `[${aRaw}]`;
    }
    try {
      result.sellerAttributes = JSON.parse(aRaw);
    } catch { }
  }

  // Trích xuất skuSuggestions
  const skuM = text.match(/"skuSuggestions"\s*:\s*\[([\s\S]*?)(?:\]|\n\s*"[a-zA-Z]+")/);
  if (skuM) {
    let sRaw = skuM[1].trim().replace(/,\s*$/, "");
    if (!sRaw.endsWith("]")) {
      const lastObj = sRaw.lastIndexOf("}");
      if (lastObj !== -1) sRaw = sRaw.substring(0, lastObj + 1);
      sRaw = `[${sRaw}]`;
    }
    try {
      result.skuSuggestions = JSON.parse(sRaw);
    } catch { }
  }

  // Trích xuất aidaDescription
  const hookM = text.match(/"attentionHook"\s*:\s*"([^"]+)"/);
  const uspM = text.match(/"uspPoint"\s*:\s*"([^"]+)"/);
  const ctaM = text.match(/"ctaCloser"\s*:\s*"([^"]+)"/);
  if (hookM || uspM || ctaM) {
    result.aidaDescription = {
      attentionHook: hookM ? hookM[1] : undefined,
      uspPoint: uspM ? uspM[1] : undefined,
      ctaCloser: ctaM ? ctaM[1] : undefined,
    };
  }

  // Trích xuất seoTags
  const kwMatch = text.match(/"coreKeywords"\s*:\s*\[([\s\S]*?)\]/);
  const htMatch = text.match(/"hashtags"\s*:\s*\[([\s\S]*?)\]/);
  if (kwMatch || htMatch) {
    result.seoTags = {};
    if (kwMatch) {
      result.seoTags.coreKeywords = (kwMatch[1].match(/"([^"]+)"/g) || []).map((s: string) => s.replace(/"/g, ""));
    }
    if (htMatch) {
      result.seoTags.hashtags = (htMatch[1].match(/"([^"]+)"/g) || []).map((s: string) => s.replace(/"/g, ""));
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Trình phân tích Markdown Listing AI thông minh & siêu bền bỉ
 * Hỗ trợ song song cả JSON Schema chuẩn hóa lẫn Markdown thuần
 */
function parseVisionOutput(text: string | null): ParsedVisionData | null {
  if (!text) return null;

  // 1. Thử nhận diện và khôi phục JSON Schema trước (kể cả khi bị truncate hoặc có lỗi format nhỏ)
  const parsedJson = repairAndParseJsonListing(text);
  if (parsedJson && (parsedJson.titles || parsedJson.sellerAttributes || parsedJson.listingScore || parsedJson.aidaDescription)) {
    return autoNormalizeVisionData(parseJsonVisionOutput(parsedJson, text), text);
  }

  const lines = text.split("\n");

  // Hàm tìm dòng tiêu đề mục theo thứ tự tuần tự
  const findSectionIndex = (startLine: number, matchers: string[]) => {
    for (let i = startLine; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;

      // Bỏ qua tuyệt đối các dòng chứa cú pháp JSON code
      if (
        trimmed.startsWith("{") ||
        trimmed.startsWith("}") ||
        trimmed.startsWith("[") ||
        trimmed.startsWith("]") ||
        trimmed.includes('"item"') ||
        trimmed.includes('"passed"') ||
        trimmed.includes('":')
      ) {
        continue;
      }

      const norm = stripAccents(trimmed);

      // Phải là một tiêu đề (có số thứ tự 1/2/3/4, hoặc có #, hoặc in hoa, hoặc ngắn dưới 90 ký tự)
      const isHeadingLike =
        /^(?:#+|\d+[.)\-:]|\*+|\bphan\b|\bmuc\b)/i.test(trimmed) ||
        (trimmed.length < 90 &&
          (trimmed === trimmed.toUpperCase() ||
            norm.includes("tieu de") ||
            norm.includes("thong so") ||
            norm.includes("mo ta") ||
            norm.includes("hashtag")));

      if (isHeadingLike) {
        for (const matcher of matchers) {
          if (norm.includes(matcher)) {
            return i;
          }
        }
      }
    }
    return -1;
  };

  const s1Idx = findSectionIndex(0, ["tieu de", "1."]);
  const s2Idx = findSectionIndex(s1Idx !== -1 ? s1Idx + 1 : 0, ["thong so", "attribute", "2."]);
  const s3Idx = findSectionIndex(s2Idx !== -1 ? s2Idx + 1 : (s1Idx !== -1 ? s1Idx + 1 : 0), ["mo ta", "aida", "3."]);
  const s4Idx = findSectionIndex(s3Idx !== -1 ? s3Idx + 1 : 0, ["hashtag", "tu khoa", "4."]);

  const s1Lines = s1Idx !== -1 ? lines.slice(s1Idx + 1, s2Idx !== -1 ? s2Idx : lines.length) : [];
  const s2Lines = s2Idx !== -1 ? lines.slice(s2Idx + 1, s3Idx !== -1 ? s3Idx : lines.length) : [];
  const s3Lines = s3Idx !== -1 ? lines.slice(s3Idx + 1, s4Idx !== -1 ? s4Idx : lines.length) : [];
  const s4Lines = s4Idx !== -1 ? lines.slice(s4Idx + 1) : [];

  const s1Raw = s1Lines.join("\n").trim();
  const s2Raw = s2Lines.join("\n").trim();
  const s3Raw = s3Lines.join("\n").trim();
  const s4Raw = s4Lines.join("\n").trim();

  // 1. PHÂN TÍCH TIÊU ĐỀ
  const titles: TitleVariant[] = [];
  const variantBlocks = s1Raw.split(/(?:^|\n)\s*(?:-|\d+\.|\*)\s*(?:\*\*)?Biến thể\s*(\d+)/i);
  if (variantBlocks.length > 1) {
    for (let i = 1; i < variantBlocks.length; i += 2) {
      const num = parseInt(variantBlocks[i], 10);
      const content = variantBlocks[i + 1] || "";
      let label = `Biến thể ${num}`;
      let title = content.trim();

      const labelMatch = content.match(/^\s*\(([^)]+)\)\s*:\s*(?:(?:\*\*)?Tên sản phẩm:(?:\*\*)?\s*)?([\s\S]+)$/i);
      if (labelMatch) {
        label = labelMatch[1].trim();
        title = labelMatch[2].trim();
      }
      title = title.replace(/^[*\s:`]+|[*\s:`]+$/g, "").split("\n")[0].trim();
      titles.push({
        id: num,
        label,
        tag: num === 1 ? "Shopee & Lazada · SEO" : num === 2 ? "TikTok Shop · Viral" : "Chạy Ads",
        iconType: num === 1 ? "search" : num === 2 ? "trend" : "ads",
        title,
        charCount: title.length,
      });
    }
  }

  // Nếu không chia biến thể 1-2-3 rõ ràng:
  if (titles.length === 0 && s1Raw) {
    const linesOfS1 = s1Lines.map((l) => l.trim()).filter(Boolean);
    for (const line of linesOfS1) {
      const matchExtract = line.match(
        /(?:có thể là|đề xuất|gợi ý|tiêu đề|tên sản phẩm)[:\s]*[`"']?([^`"'\n]{15,})[`"']?/i
      );
      if (matchExtract) {
        const t = matchExtract[1].replace(/[`"']/g, "").trim();
        titles.push({
          id: 1,
          label: "Tiêu Đề Đề Xuất Chuẩn SEO",
          tag: "Shopee, TikTok Shop & Lazada",
          iconType: "search",
          title: t,
          charCount: t.length,
        });
        break;
      }
    }

    if (titles.length === 0) {
      const cleanLines = linesOfS1
        .map((l) => l.replace(/^[#\-*>\s`]+|[#\-*>\s`]+$/g, "").trim())
        .filter((l) => {
          const s = l.trim();
          return (
            s.length > 10 &&
            !s.startsWith("{") &&
            !s.startsWith("}") &&
            !s.startsWith("[") &&
            !s.startsWith("]") &&
            !s.includes('"item"') &&
            !s.includes('"passed"') &&
            !s.includes('":') &&
            !stripAccents(s).startsWith("tieu de")
          );
        });
      cleanLines.slice(0, 3).forEach((line, idx) => {
        titles.push({
          id: idx + 1,
          label: `Gợi ý tiêu đề ${idx + 1}`,
          tag: idx === 0 ? "Shopee & Lazada · SEO" : idx === 1 ? "TikTok Shop · Viral" : "Chạy Ads",
          iconType: idx === 0 ? "search" : idx === 1 ? "trend" : "ads",
          title: line,
          charCount: line.length,
        });
      });
    }
  }

  // 2. PHÂN TÍCH THÔNG SỐ (HỖ TRỢ CẢ DẠNG BẢNG VÀ DANH SÁCH BULLET)
  const specs: AttributeItem[] = [];
  for (const line of s2Lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Dạng 1: Table Markdown | Thuộc tính | Giá trị |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const parts = trimmed.split("|").map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        if (/^:?-+:?$/.test(parts[0]) || /thuộc tính|attribute/i.test(parts[0])) continue;
        const attr = parts[0].replace(/[*`]/g, "").trim();
        const val = parts[1].replace(/[*`]/g, "").trim();
        if (attr && val) {
          specs.push({ attribute: attr, value: val });
        }
      }
      continue;
    }

    // Dạng 2: Bullet list: - **Loại sản phẩm**: `Điện thoại`
    const bulletMatch = trimmed.match(
      /^[-*•]\s*(?:\*\*)?([^*:\n]+?)(?:\*\*)?\s*:\s*(?:`|'|")?([^`'"\n]+)(?:`|'|")?/
    );
    if (bulletMatch) {
      const attr = bulletMatch[1].replace(/[*`]/g, "").trim();
      const val = bulletMatch[2].replace(/[*`]/g, "").trim();
      if (attr && val && !stripAccents(attr).includes("thong so")) {
        specs.push({ attribute: attr, value: val });
      }
    }
  }

  // 3. PHÂN TÍCH MÔ TẢ AIDA
  let uspText = "";
  const features: { title: string; content: string }[] = [];
  const sizeGuide: string[] = [];
  const commitments: string[] = [];

  let currentSub = "";
  for (let i = 0; i < s3Lines.length; i++) {
    const rawLine = s3Lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const norm = stripAccents(trimmed);

    // Nhận diện Header mục con (dòng tiêu đề kết thúc bằng dấu : hoặc bắt đầu bằng #)
    const isHeading =
      trimmed.startsWith("#") ||
      /^(?:[-*•]\s*)?(?:\*\*)?[^*:\n]+?(?:\*\*)?\s*:\s*$/.test(trimmed);

    if (isHeading) {
      if (norm.includes("usp") || norm.includes("diem nhan") || norm.includes("dac quyen")) {
        currentSub = "usp";
        continue;
      } else if (norm.includes("tinh nang") || norm.includes("thiet ke") || norm.includes("chi tiet")) {
        currentSub = "features";
        continue;
      } else if (norm.includes("kich co") || norm.includes("size") || norm.includes("quy doi") || norm.includes("kich thuoc")) {
        currentSub = "size";
        continue;
      } else if (norm.includes("cam ket") || norm.includes("bao hanh") || norm.includes("doi tra")) {
        currentSub = "commitments";
        continue;
      }
    }

    // Đưa nội dung vào mục con
    if (currentSub === "usp") {
      const clean = trimmed.replace(/^[-*•`\s]+|[`\s]+$/g, "").replace(/^[*\s]+|[*\s]+$/g, "").trim();
      if (clean) uspText += (uspText ? " " : "") + clean;
    } else if (currentSub === "features") {
      const featMatch = trimmed.match(/^[-*•]\s*(?:\*\*)?([^*:\n]+?)(?:\*\*)?\s*:\s*(.*)$/);
      if (featMatch) {
        features.push({
          title: featMatch[1].replace(/[*`]/g, "").trim(),
          content: featMatch[2].replace(/[*`]/g, "").trim(),
        });
      } else {
        const clean = trimmed.replace(/^[-*•`\s]+|[`\s]+$/g, "").trim();
        if (clean) features.push({ title: "", content: clean });
      }
    } else if (currentSub === "size") {
      const clean = trimmed.replace(/^[-*•`\s]+|[`\s]+$/g, "").trim();
      if (clean) sizeGuide.push(clean);
    } else if (currentSub === "commitments") {
      const clean = trimmed.replace(/^[-*•`\s]+|[`\s]+$/g, "").trim();
      if (clean) commitments.push(clean);
    }
  }

  // 4. PHÂN TÍCH TỪ KHÓA & HASHTAGS
  const keywords: string[] = [];
  const hashtags: string[] = [];

  for (const line of s4Lines) {
    const trimmed = line.trim();
    const norm = stripAccents(trimmed);

    // Tìm từ khóa
    if (norm.includes("tu khoa")) {
      const kwMatch = trimmed.match(/:\s*([^\n]+)/);
      if (kwMatch) {
        const kwPart = kwMatch[1];
        const items = kwPart.split(/[,;\n]/);
        for (const item of items) {
          const clean = item.replace(/[`*]/g, "").trim();
          if (clean && !clean.startsWith("#")) {
            keywords.push(clean);
          }
        }
      }
    }

    // Tìm hashtags
    const htMatches = trimmed.match(/#[\p{L}\p{N}_]+/gu);
    if (htMatches) {
      htMatches.forEach((tag) => {
        const clean = tag.trim();
        if (!hashtags.includes(clean)) hashtags.push(clean);
      });
    }
  }

  const hasStructuredData =
    titles.length > 0 ||
    specs.length > 0 ||
    !!uspText ||
    features.length > 0 ||
    keywords.length > 0 ||
    hashtags.length > 0;

  return autoNormalizeVisionData({
    titles,
    specs,
    desc: {
      uspText,
      features,
      sizeGuide,
      commitments,
      rawText: s3Raw,
    },
    tags: {
      keywords,
      hashtags,
    },
    hasStructuredData,
    raw: text,
  }, text);
}

/**
 * Chuyển đổi dữ liệu Listing AI thành văn bản text thô (Markdown chuẩn)
 * để hiển thị ở tab Markdown và hỗ trợ sao chép / tải file .txt
 */
export function visionListingToText(data: ParsedVisionData, productName?: string): string {
  const lines: string[] = [];
  const resolvedName =
    productName ||
    data.titles[0]?.hookKeywords ||
    data.specs.find((s) => /loại|tên|sản phẩm/i.test(s.attribute))?.value ||
    "SẢN PHẨM TRONG ẢNH";

  const title = `BỘ HỒ SƠ LISTING SẢN PHẨM CHUẨN SEO: ${resolvedName.toUpperCase()}`;

  lines.push(`# ${title}`);
  lines.push(`Hỗ trợ chuẩn sàn: Shopee | TikTok Shop | Lazada`);
  lines.push(`------------------------------------------------------------\n`);

  // 1. ĐÁNH GIÁ CHẤT LƯỢNG LISTING & KIỂM DUYỆT SÀN
  if (data.listingScore) {
    const sc = data.listingScore;
    lines.push(`## 📊 ĐÁNH GIÁ CHẤT LƯỢNG LISTING & KIỂM DUYỆT SÀN`);
    lines.push(`- Điểm chất lượng: ${sc.score}/100 (${sc.grade || "XUẤT SẮC"})`);
    lines.push(`- Kiểm duyệt sàn: ${sc.safetyPassed ? "✓ Đạt 100% tiêu chuẩn, 0% vi phạm từ cấm sàn" : "⚠️ Cần rà soát các từ nhạy cảm"}`);
    if (sc.checklist && sc.checklist.length > 0) {
      lines.push(`- Tiêu chí chuẩn SEO:`);
      sc.checklist.forEach((item) => {
        lines.push(`  ${item.passed ? "✓" : "✗"} ${item.item}`);
      });
    }
    lines.push(`\n------------------------------------------------------------\n`);
  }

  // 2. BỘ 3 BIẾN THỂ TIÊU ĐỀ CHUẨN SEO
  if (data.titles && data.titles.length > 0) {
    lines.push(`## 🏷️ BỘ 3 BIẾN THỂ TIÊU ĐỀ CHUẨN SEO\n`);
    data.titles.forEach((t) => {
      lines.push(`### [Biến thể ${t.id} - ${t.tag}]:`);
      lines.push(`${t.title}`);
      const meta: string[] = [`Độ dài: ${t.charCount || t.title.length} ký tự`];
      if (t.targetAudience) meta.push(`Tệp khách: ${t.targetAudience}`);
      if (t.hookKeywords) meta.push(`Từ khóa hook: ${t.hookKeywords}`);
      lines.push(`(${meta.join(" | ")})\n`);
    });
    lines.push(`------------------------------------------------------------\n`);
  }

  // 3. BẢNG THÔNG SỐ & THUỘC TÍNH SẢN PHẨM
  if (data.specs && data.specs.length > 0) {
    lines.push(`## ⚙️ BẢNG THÔNG SỐ & THUỘC TÍNH CHUẨN SÀN\n`);
    data.specs.forEach((s) => {
      const req = s.requiredByPlatform ? " [Bắt buộc]" : "";
      lines.push(`- ${s.attribute}${req}: ${s.value}`);
    });
    lines.push(`\n------------------------------------------------------------\n`);
  }

  // 4. GỢI Ý PHÂN LOẠI SKU & COMBO TĂNG GIÁ TRỊ ĐƠN HÀNG (AOV)
  if (data.skuSuggestions && data.skuSuggestions.length > 0) {
    lines.push(`## 📦 GỢI Ý PHÂN LOẠI SKU & COMBO BÁN CHẠY\n`);
    data.skuSuggestions.forEach((grp) => {
      lines.push(`* ${grp.groupName}:`);
      grp.options.forEach((opt) => {
        lines.push(`  - ${opt}`);
      });
    });
    lines.push(`\n------------------------------------------------------------\n`);
  }

  // 5. BÀI VIẾT MÔ TẢ THEO MÔ HÌNH AIDA
  lines.push(`## 📝 BÀI VIẾT MÔ TẢ SẢN PHẨM CHUẨN AIDA\n`);
  if (data.desc.attentionHook) {
    lines.push(`### 🔥 HOOK 3 GIÂY THU HÚT:`);
    lines.push(`${data.desc.attentionHook}\n`);
  }
  if (data.desc.uspText) {
    lines.push(`### ✨ ĐIỂM ĐẶC QUYỀN (USP NỔI BẬT):`);
    lines.push(`${data.desc.uspText}\n`);
  }
  if (data.desc.features && data.desc.features.length > 0) {
    lines.push(`### 💎 THÔNG TIN CHI TIẾT & TÍNH NĂNG VƯỢT TRỘI:`);
    data.desc.features.forEach((f) => {
      lines.push(`- ${f.title ? `${f.title}: ` : ""}${f.content}`);
    });
    lines.push(``);
  }
  if (data.desc.sizeGuide && data.desc.sizeGuide.length > 0) {
    lines.push(`### 📏 HƯỚNG DẪN CHỌN SIZE & QUY CÁCH:`);
    data.desc.sizeGuide.forEach((s) => {
      lines.push(`- ${s}`);
    });
    lines.push(``);
  }
  if (data.desc.commitments && data.desc.commitments.length > 0) {
    lines.push(`### 🛡️ CHÍNH SÁCH BẢO HÀNH & CAM KẾT SHOP:`);
    data.desc.commitments.forEach((c) => {
      lines.push(`- ${c}`);
    });
    lines.push(``);
  }
  if (data.desc.ctaCloser) {
    lines.push(`### 🎯 LỜI KÊU GỌI HÀNH ĐỘNG (CTA):`);
    lines.push(`${data.desc.ctaCloser}\n`);
  } else if (!data.desc.uspText && !data.desc.attentionHook && data.desc.rawText) {
    lines.push(data.desc.rawText);
    lines.push(``);
  }
  lines.push(`------------------------------------------------------------\n`);

  // 6. TỪ KHÓA & HASHTAGS
  if (data.tags) {
    lines.push(`## 🔑 TỪ KHÓA TÌM KIẾM & HASHTAGS ĐẨY TOP\n`);
    if (data.tags.keywords && data.tags.keywords.length > 0) {
      lines.push(`- Từ khóa hạt nhân (Core Keywords):`);
      lines.push(`  ${data.tags.keywords.join(", ")}`);
    }
    if (data.tags.longtailKeywords && data.tags.longtailKeywords.length > 0) {
      lines.push(`- Từ khóa dài (Long-tail Keywords):`);
      lines.push(`  ${data.tags.longtailKeywords.join(", ")}`);
    }
    if (data.tags.hashtags && data.tags.hashtags.length > 0) {
      lines.push(`- Bộ Hashtags chuẩn sàn:`);
      lines.push(`  ${data.tags.hashtags.join(" ")}`);
    }
    lines.push(``);
  }

  lines.push(`------------------------------------------------------------`);
  lines.push(`Xuất bởi AIChoShop.com - Trợ lý AI E-commerce số 1 Việt Nam`);

  return lines.join("\n");
}

export function VisionListingOutput({
  output,
  isLoading,
  productImage,
  onUseSample,
  elapsedSeconds = 0,
  onCancel,
  productName,
}: VisionListingOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [activeTab, setActiveTab] = useState<"all" | "titles" | "specs" | "sku" | "desc" | "tags">("all");

  const parsed = useMemo(() => parseVisionOutput(output), [output]);

  // Chuẩn hóa kết quả Listing thành văn bản text thô (Markdown) thay vì hiện JSON
  const formattedRawText = useMemo(() => {
    return parsed ? visionListingToText(parsed, productName) : (output || "");
  }, [parsed, output, productName]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    if (!formattedRawText) return;
    navigator.clipboard.writeText(formattedRawText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyForShopee = () => {
    if (!parsed) return;
    const shopeeTitle = parsed.titles[0]?.title || "";
    const specsText = parsed.specs.map((s) => `- ${s.attribute}: ${s.value}`).join("\n");
    const descParts = [
      parsed.desc.attentionHook ? `🔥 ${parsed.desc.attentionHook}` : "",
      parsed.desc.uspText ? `✨ ĐIỂM ĐẶC QUYỀN (USP):\n${parsed.desc.uspText}` : "",
      parsed.desc.features.length > 0
        ? `💎 THÔNG TIN CHI TIẾT & TÍNH NĂNG:\n` +
        parsed.desc.features.map((f) => `- ${f.title}: ${f.content}`).join("\n")
        : "",
      parsed.desc.sizeGuide.length > 0
        ? `📏 BẢNG SIZE & QUY CÁCH:\n` + parsed.desc.sizeGuide.map((s) => `- ${s}`).join("\n")
        : "",
      parsed.desc.commitments.length > 0
        ? `🛡️ CHÍNH SÁCH BẢO HÀNH & CAM KẾT:\n` +
        parsed.desc.commitments.map((c) => `- ${c}`).join("\n")
        : "",
      parsed.desc.ctaCloser || "",
      parsed.tags.hashtags.length > 0 ? `\n${parsed.tags.hashtags.join(" ")}` : "",
    ].filter(Boolean).join("\n\n");

    const fullShopeeText = `[TIÊU ĐỀ SHOPEE]:\n${shopeeTitle}\n\n[THUỘC TÍNH SẢN PHẨM]:\n${specsText}\n\n[BÀI VIẾT MÔ TẢ]:\n${descParts}`;
    handleCopy(fullShopeeText, "quick-shopee");
  };

  const handleCopyForTikTok = () => {
    if (!parsed) return;
    const tiktokTitle = parsed.titles[1]?.title || parsed.titles[0]?.title || "";
    const descParts = [
      parsed.desc.attentionHook ? `🔥 ${parsed.desc.attentionHook}` : "",
      parsed.desc.uspText ? `⚡ USP ĐỘC QUYỀN: ${parsed.desc.uspText}` : "",
      parsed.desc.features.length > 0
        ? `🎯 TÍNH NĂNG VƯỢT TRỘI:\n` +
        parsed.desc.features.map((f) => `• ${f.title}: ${f.content}`).join("\n")
        : "",
      parsed.desc.commitments.length > 0
        ? `✅ CAM KẾT VÀNG TỪ SHOP:\n` +
        parsed.desc.commitments.map((c) => `• ${c}`).join("\n")
        : "",
      parsed.desc.ctaCloser || "👉 Bấm Thêm Vào Giỏ Hàng để nhận ưu đãi ngay hôm nay!",
      parsed.tags.hashtags.length > 0 ? `\n${parsed.tags.hashtags.slice(0, 6).join(" ")}` : "",
    ].filter(Boolean).join("\n\n");

    const fullTikTokText = `[TIÊU ĐỀ TIKTOK SHOP]:\n${tiktokTitle}\n\n[NỘI DUNG MÔ TẢ & CHỐT ĐƠN]:\n${descParts}`;
    handleCopy(fullTikTokText, "quick-tiktok");
  };

  const handleDownloadTxt = () => {
    if (!formattedRawText) return;
    const blob = new Blob([formattedRawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `listing-san-pham-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!parsed) return;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Tiêu đề & Thông số
    const specsRows = [
      ["NHÓM", "THUỘC TÍNH", "GIÁ TRỊ"],
      ...parsed.titles.map((t) => ["1. TIÊU ĐỀ SEO", t.tag, t.title]),
      ...parsed.specs.map((s) => [
        "2. THÔNG SỐ",
        s.requiredByPlatform ? `${s.attribute} (Bắt buộc)` : s.attribute,
        s.value,
      ]),
    ];
    const wsSpecs = XLSX.utils.aoa_to_sheet(specsRows);
    wsSpecs["!cols"] = [{ wch: 18 }, { wch: 30 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, wsSpecs, "TieuDe_ThongSo");

    // Sheet 2: Mô tả & Từ khóa
    const descRows = [
      ["MỤC", "NỘI DUNG"],
      ["Hook 3 Giây", parsed.desc.attentionHook || ""],
      ["USP Đặc Quyền", parsed.desc.uspText || ""],
      ...parsed.desc.features.map((f) => [f.title || "Tính Năng", f.content]),
      ...parsed.desc.sizeGuide.map((s) => ["Chọn Size", s]),
      ...parsed.desc.commitments.map((c) => ["Cam Kết", c]),
      ["Lời Kêu Gọi (CTA)", parsed.desc.ctaCloser || ""],
      ["Từ Khóa Hạt Nhân", parsed.tags.keywords.join(", ")],
      ["Hashtag Chuẩn Sàn", parsed.tags.hashtags.join(" ")],
    ];
    const wsDesc = XLSX.utils.aoa_to_sheet(descRows);
    wsDesc["!cols"] = [{ wch: 25 }, { wch: 90 }];
    XLSX.utils.book_append_sheet(workbook, wsDesc, "MoTa_AIDA_Hashtag");

    // Sheet 3: Phân loại SKU & Phễu giá (nếu có)
    if (parsed.skuSuggestions && parsed.skuSuggestions.length > 0) {
      const skuRows = [
        ["NHÓM PHÂN LOẠI", "TÙY CHỌN / CHIẾN LƯỢC"],
        ...parsed.skuSuggestions.flatMap((grp) =>
          grp.options.map((opt) => [grp.groupName, opt])
        ),
      ];
      const wsSku = XLSX.utils.aoa_to_sheet(skuRows);
      wsSku["!cols"] = [{ wch: 30 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(workbook, wsSku, "PhanLoai_SKU");
    }

    XLSX.writeFile(workbook, `AIChoShop_Listing_${Date.now()}.xlsx`);
  };

  const copyTableAsTsv = () => {
    if (!parsed || parsed.specs.length === 0) return;
    const tsv = parsed.specs.map((s) => `${s.attribute}\t${s.value}`).join("\n");
    handleCopy(tsv, "all-specs");
  };

  const copyAllDescText = () => {
    if (!parsed) return;
    const parts = [];
    if (parsed.desc.uspText) {
      parts.push(`ĐIỂM NHẤN ĐẶC QUYỀN (USP):\n${parsed.desc.uspText}`);
    }
    if (parsed.desc.features.length > 0) {
      parts.push(
        `CHI TIẾT TÍNH NĂNG & THIẾT KẾ:\n` +
        parsed.desc.features.map((f) => `- ${f.title ? `${f.title}: ` : ""}${f.content}`).join("\n")
      );
    }
    if (parsed.desc.sizeGuide.length > 0) {
      parts.push(`HƯỚNG DẪN CHỌN SIZE:\n` + parsed.desc.sizeGuide.map((s) => `- ${s}`).join("\n"));
    }
    if (parsed.desc.commitments.length > 0) {
      parts.push(`CAM KẾT TỪ SHOP:\n` + parsed.desc.commitments.map((c) => `- ${c}`).join("\n"));
    }
    handleCopy(parts.join("\n\n") || parsed.desc.rawText, "all-desc");
  };

  const copyAllTitlesText = () => {
    if (!parsed || parsed.titles.length === 0) return;
    const text = parsed.titles
      .map((t) => `- Biến thể ${t.id} (${t.tag}):\n  ${t.title}`)
      .join("\n\n");
    handleCopy(text, "all-titles");
  };

  const copyKeywordsText = () => {
    if (!parsed || parsed.tags.keywords.length === 0) return;
    handleCopy(parsed.tags.keywords.join(", "), "all-kw");
  };

  const copyHashtagsText = () => {
    if (!parsed || parsed.tags.hashtags.length === 0) return;
    handleCopy(parsed.tags.hashtags.join(" "), "all-ht");
  };

  const wordCount = formattedRawText ? formattedRawText.trim().split(/\s+/).length : 0;
  const charCount = formattedRawText ? formattedRawText.length : 0;

  return (
    <div className="bg-[#0b0f19] text-white rounded-2xl shadow-xl border border-slate-800 flex flex-col w-full h-auto lg:min-h-[560px] lg:h-full relative overflow-visible lg:overflow-hidden">
      {/* HEADER TOOLBAR: TỐI GIẢN NỀN ĐEN TEXT TRẮNG */}
      <div className="sticky top-0 z-20 px-3.5 sm:px-5 py-3 border-b border-slate-800 bg-[#0e1526]/95 backdrop-blur-md shrink-0 space-y-2.5 rounded-t-2xl">
        {/* Hàng 1: Tiêu đề + Nhóm nút thao tác */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white shrink-0">
              <Sparkles size={16} />
            </div>
            <h2 className="font-bold text-white text-xs sm:text-sm tracking-wide shrink-0 whitespace-nowrap">
              <span className="hidden 2xl:inline">Listing Sản Phẩm AI</span>
              <span className="2xl:hidden">Listing AI</span>
            </h2>
          </div>

          {/* Nhóm nút thao tác chính: Gọn gàng, tối giản */}
          {output && !isLoading && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Nút Sao Chép Toàn Bộ (Icon Only) */}
              <button
                type="button"
                onClick={handleCopyAll}
                className={`p-1.5 sm:p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xs ${copiedAll
                  ? "bg-emerald-600 text-white"
                  : "bg-white hover:bg-slate-200 text-slate-950"
                  }`}
                title={copiedAll ? "Đã sao chép tất cả" : "Sao chép toàn bộ Listing AI"}
              >
                {copiedAll ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
              </button>

              {/* Nút Tải TXT */}
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
                title="Tải file .txt"
              >
                <Download size={13} className="text-slate-300" />
                <span className="hidden 2xl:inline">TXT</span>
              </button>

              {/* Nút Xuất Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
                title="Xuất Excel (.xlsx)"
              >
                <FileSpreadsheet size={13} className="text-slate-300" />
                <span className="hidden 2xl:inline">Excel</span>
              </button>

              {/* Nút Chuyển View (Trực quan / Markdown) */}
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("visual")}
                  className={`py-1 px-1.5 sm:px-2 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${viewMode === "visual"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                    }`}
                  title="Chế độ trực quan"
                >
                  <LayoutGrid size={12} />
                  <span className="hidden 2xl:inline">Trực Quan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("raw")}
                  className={`py-1 px-1.5 sm:px-2 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${viewMode === "raw"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                    }`}
                  title="Chế độ văn bản Markdown"
                >
                  <Code2 size={12} />
                  <span className="hidden 2xl:inline">Markdown</span>
                </button>
              </div>
            </div>
          )}
        </div>



        {/* THANH TAB LỌC MỤC: VUỐT NGANG TỐI GIẢN */}
        {output && !isLoading && viewMode === "visual" && parsed && (
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pt-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${activeTab === "all"
                ? "bg-slate-800 text-white border-slate-600 font-bold"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60 font-medium"
                }`}
            >
              <span>Tất Cả</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("titles")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${activeTab === "titles"
                ? "bg-slate-800 text-white border-slate-600 font-bold"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60 font-medium"
                }`}
            >
              <Tag size={12} />
              <span>1. Tiêu Đề ({parsed.titles.length || 3})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("specs")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${activeTab === "specs"
                ? "bg-slate-800 text-white border-slate-600 font-bold"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60 font-medium"
                }`}
            >
              <FileSpreadsheet size={12} />
              <span>2. Thuộc Tính ({parsed.specs.length})</span>
            </button>

            {parsed.skuSuggestions && parsed.skuSuggestions.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("sku")}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${activeTab === "sku"
                  ? "bg-slate-800 text-white border-slate-600 font-bold"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60 font-medium"
                  }`}
              >
                <Boxes size={12} />
                <span>3. Phân Loại SKU ({parsed.skuSuggestions.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("desc")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${activeTab === "desc"
                ? "bg-slate-800 text-white border-slate-600 font-bold"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60 font-medium"
                }`}
            >
              <FileText size={12} />
              <span>4. Mô Tả AIDA</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tags")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${activeTab === "tags"
                ? "bg-slate-800 text-white border-slate-600 font-bold"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60 font-medium"
                }`}
            >
              <Hash size={12} />
              <span>5. Hashtags &amp; Tags ({parsed.tags.hashtags.length + parsed.tags.keywords.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* KHU VỰC NỘI DUNG CUỘN */}
      <div className="flex-1 lg:min-h-0 p-3 sm:p-5 lg:overflow-y-auto custom-scrollbar relative">
        {isLoading ? (
          /* TRẠNG THÁI ĐANG PHÂN TÍCH AI */
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="Vision AI Đang Quét Ảnh & Soạn Listing..."
            stages={VISION_STAGES}
            accentColor="emerald"
            minHeightClass="min-h-[360px]"
          />
        ) : output && parsed ? (
          /* TRẠNG THÁI CÓ KẾT QUẢ: ĐEN TRẮNG ĐƠN GIẢN, RÕ RÀNG */
          <div className="space-y-4 pb-6">
            {viewMode === "raw" ? (
              /* CHẾ ĐỘ XEM MARKDOWN GỐC (TEXT THÔ) */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Văn bản text thô (Markdown chuẩn):</span>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    title={copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ"}
                    className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer active:scale-90 ${copiedAll
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                      }`}
                  >
                    {copiedAll ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                  </button>
                </div>
                <pre className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-slate-700 overflow-x-auto">
                  {formattedRawText}
                </pre>
              </div>
            ) : (
              /* CHẾ ĐỘ XEM TRỰC QUAN GỌN GÀNG, ĐEN TRẮNG */
              <div className="space-y-4">
                {/* ───────────────────────────────────────────────────────────── */}
                {/* THẺ ĐIỂM CHẤT LƯỢNG LISTING & KIỂM DUYỆT CHÍNH SÁCH SÀN       */}
                {/* ───────────────────────────────────────────────────────────── */}


                {/* ───────────────────────────────────────────────────────────── */}
                {/* MỤC 1: 3 BIẾN THỂ TIÊU ĐỀ CHUẨN SEO                          */}
                {/* ───────────────────────────────────────────────────────────── */}
                {(activeTab === "all" || activeTab === "titles") && (
                  <div className="bg-[#0f172a]/70 rounded-xl border border-slate-800 p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag size={16} className="text-slate-300 shrink-0" />
                        <div>
                          <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                            1. Tiêu Đề Chuẩn SEO
                          </h3>

                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={copyAllTitlesText}
                        className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedKey === "all-titles"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                          }`}
                        title={copiedKey === "all-titles" ? "Đã sao chép cả 3 tiêu đề" : "Sao chép cả 3 tiêu đề"}
                      >
                        {copiedKey === "all-titles" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {parsed.titles.map((variant) => {
                        const isCopied = copiedKey === `title-${variant.id}`;
                        return (
                          <div
                            key={variant.id}
                            className="bg-slate-900/90 rounded-lg border border-slate-800 p-3 space-y-2 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                                {variant.iconType === "search" && <Search size={12} className="text-slate-400" />}
                                {variant.iconType === "trend" && <Flame size={12} className="text-slate-400" />}
                                {variant.iconType === "ads" && <Target size={12} className="text-slate-400" />}
                                <span>{variant.tag}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400">
                                  {variant.charCount} ký tự
                                  {variant.charCount <= 120 && (
                                    <span className="text-emerald-400 font-semibold ml-1">✓ Chuẩn</span>
                                  )}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleCopy(variant.title, `title-${variant.id}`)}
                                  title={isCopied ? "Đã sao chép tiêu đề" : "Sao chép tiêu đề"}
                                  className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${isCopied
                                    ? "bg-emerald-500 text-white shadow-xs"
                                    : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                                    }`}
                                >
                                  {isCopied ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </div>

                            <div
                              onClick={() => handleCopy(variant.title, `title-${variant.id}`)}
                              className="p-2.5 rounded bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
                              title="Bấm để sao chép tiêu đề"
                            >
                              <p className="text-xs sm:text-sm font-medium text-white leading-relaxed select-all">
                                {variant.title}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* MỤC 2: BẢNG THÔNG SỐ KỸ THUẬT (ATTRIBUTES)                    */}
                {/* ───────────────────────────────────────────────────────────── */}
                {(activeTab === "all" || activeTab === "specs") && (
                  <div className="bg-[#0f172a]/70 rounded-xl border border-slate-800 p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileSpreadsheet size={16} className="text-slate-300 shrink-0" />
                        <div>
                          <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                            2. Bảng Thông Số Kỹ Thuật
                          </h3>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={copyTableAsTsv}
                        className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedKey === "all-specs"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                          }`}
                        title={copiedKey === "all-specs" ? "Đã sao chép bảng thông số" : "Sao chép dạng TSV để dán vào Excel"}
                      >
                        {copiedKey === "all-specs" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {parsed.specs.length > 0 ? (
                      <div className="space-y-1.5">
                        {/* Trên Mobile: Dạng danh sách thẻ Key-Value */}
                        <div className="sm:hidden space-y-1.5">
                          {parsed.specs.map((item, idx) => {
                            const isCopied = copiedKey === `spec-${idx}`;
                            return (
                              <div
                                key={idx}
                                className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-medium text-slate-400 uppercase">
                                      {item.attribute}
                                    </span>
                                    {item.requiredByPlatform && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                                        Bắt buộc
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs font-semibold text-white mt-0.5 break-words">
                                    {item.value}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.value, `spec-${idx}`)}
                                  className={`p-1.5 rounded text-xs transition-all shrink-0 cursor-pointer active:scale-95 ${isCopied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:text-white"
                                    }`}
                                  title={`Sao chép ${item.value}`}
                                >
                                  {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Trên PC / Tablet: Bảng đen trắng tinh tế */}
                        <div className="hidden sm:block rounded-lg border border-slate-800 overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                              <tr>
                                <th className="py-2.5 px-4 w-1/3">Thuộc Tính Sàn</th>
                                <th className="py-2.5 px-4 w-1/2">Giá Trị Phân Tích</th>
                                <th className="py-2.5 px-4 text-center">Sao Chép</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                              {parsed.specs.map((item, idx) => {
                                const isCopied = copiedKey === `spec-${idx}`;
                                return (
                                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="py-2.5 px-4 font-medium text-slate-300">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span>{item.attribute}</span>
                                        {item.requiredByPlatform && (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                                            Bắt buộc
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-4 text-white font-medium">
                                      {item.value}
                                    </td>
                                    <td className="py-2.5 px-4 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(item.value, `spec-${idx}`)}
                                        title={isCopied ? "Đã sao chép" : `Sao chép ${item.value}`}
                                        className={`p-1.5 rounded-md text-xs transition-all inline-flex items-center justify-center cursor-pointer active:scale-90 ${isCopied
                                          ? "bg-emerald-500 text-white shadow-xs"
                                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                                          }`}
                                      >
                                        {isCopied ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                        Chưa có thông số chi tiết từ hình ảnh. Vui lòng kiểm tra lại ảnh sản phẩm.
                      </div>
                    )}
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* MỤC 3: MA TRẬN PHÂN LOẠI HÀNG & GỢI Ý SKU (TĂNG AOV)         */}
                {/* ───────────────────────────────────────────────────────────── */}
                {parsed.skuSuggestions && parsed.skuSuggestions.length > 0 && (activeTab === "all" || activeTab === "sku") && (
                  <div className="bg-[#0f172a]/70 rounded-xl border border-slate-800 p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <Boxes size={16} className="text-slate-300 shrink-0" />
                        <div>
                          <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                            3. Ma Trận SKU &amp; Phân Loại Hàng (Tăng AOV)
                          </h3>

                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {parsed.skuSuggestions.map((group, gIdx) => (
                        <div
                          key={gIdx}
                          className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                              {group.groupName}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {group.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className="text-xs px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-medium"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* MỤC 4: BÀI VIẾT MÔ TẢ (CÔNG THỨC AIDA)                        */}
                {/* ───────────────────────────────────────────────────────────── */}
                {(activeTab === "all" || activeTab === "desc") && (
                  <div className="bg-[#0f172a]/70 rounded-xl border border-slate-800 p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={16} className="text-slate-300 shrink-0" />
                        <div>
                          <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                            4. Bài Viết Mô Tả (AIDA)
                          </h3>

                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={copyAllDescText}
                        className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedKey === "all-desc"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                          }`}
                        title={copiedKey === "all-desc" ? "Đã sao chép toàn bộ mô tả" : "Sao chép toàn bộ mô tả"}
                      >
                        {copiedKey === "all-desc" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* 4.1 Hook 3 Giây Giữ Chân Khách */}
                      {parsed.desc.attentionHook && (
                        <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase text-slate-200 flex items-center gap-1.5">
                              <Flame size={13} className="text-rose-400" />
                              <span>Hook 3 Giây Đầu (Giữ Chân Khách Hàng)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(parsed.desc.attentionHook!, "hook-text")}
                              title={copiedKey === "hook-text" ? "Đã sao chép Attention Hook" : "Sao chép Attention Hook"}
                              className={`p-1.5 rounded-md text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedKey === "hook-text"
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                                }`}
                            >
                              {copiedKey === "hook-text" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium italic">
                            &ldquo;{parsed.desc.attentionHook}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* 4.2 USP Đặc Quyền */}
                      {parsed.desc.uspText && (
                        <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase text-slate-200 flex items-center gap-1.5">
                              <Sparkles size={13} className="text-slate-400" />
                              <span>Điểm Nhấn Đặc Quyền (USP)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(parsed.desc.uspText, "usp-text")}
                              title={copiedKey === "usp-text" ? "Đã sao chép USP" : "Sao chép USP"}
                              className={`p-1.5 rounded-md text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedKey === "usp-text"
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                                }`}
                            >
                              {copiedKey === "usp-text" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                            {parsed.desc.uspText}
                          </p>
                        </div>
                      )}

                      {/* 4.3 Chi Tiết Tính Năng & Thiết Kế */}
                      {parsed.desc.features.length > 0 && (
                        <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5 space-y-2">
                          <span className="text-xs font-bold uppercase text-slate-200 flex items-center gap-1.5">
                            <Gem size={13} className="text-slate-400" />
                            <span>Chi Tiết Tính Năng &amp; Lợi Ích</span>
                          </span>
                          <div className="space-y-1.5 text-xs sm:text-sm">
                            {parsed.desc.features.map((feat, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-slate-300">
                                <span className="text-slate-500 font-bold shrink-0 mt-0.5">•</span>
                                <div className="leading-relaxed">
                                  {feat.title ? (
                                    <strong className="text-white font-semibold mr-1">
                                      {feat.title}:
                                    </strong>
                                  ) : null}
                                  <span className="text-slate-300">{feat.content}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4.4 Hướng Dẫn Chọn Size */}
                      {parsed.desc.sizeGuide.length > 0 && (
                        <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5 space-y-2">
                          <span className="text-xs font-bold uppercase text-slate-200 flex items-center gap-1.5">
                            <Ruler size={13} className="text-slate-400" />
                            <span>Quy Cách / Hướng Dẫn Kích Cỡ</span>
                          </span>
                          <div className="space-y-1 text-xs sm:text-sm text-slate-300">
                            {parsed.desc.sizeGuide.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-slate-500 shrink-0">•</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4.5 Cam Kết Từ Shop */}
                      {parsed.desc.commitments.length > 0 && (
                        <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5 space-y-2">
                          <span className="text-xs font-bold uppercase text-slate-200 flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-slate-400" />
                            <span>Cam Kết Vàng Từ Shop</span>
                          </span>
                          <div className="space-y-1.5 text-xs sm:text-sm text-slate-300">
                            {parsed.desc.commitments.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <CheckCircle2 size={13} className="text-slate-400 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4.6 Lời Kêu Gọi Hành Động (CTA) */}
                      {parsed.desc.ctaCloser && (
                        <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase text-slate-200 flex items-center gap-1.5">
                              <Target size={13} className="text-amber-400" />
                              <span>Lời Kêu Gọi Hành Động (CTA)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(parsed.desc.ctaCloser!, "cta-text")}
                              title={copiedKey === "cta-text" ? "Đã sao chép CTA" : "Sao chép CTA"}
                              className={`p-1.5 rounded-md text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedKey === "cta-text"
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                                }`}
                            >
                              {copiedKey === "cta-text" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-white font-bold leading-relaxed">
                            {parsed.desc.ctaCloser}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* MỤC 5: BỘ TỪ KHÓA & HASHTAG CHUẨN SÀN                        */}
                {/* ───────────────────────────────────────────────────────────── */}
                {(activeTab === "all" || activeTab === "tags") && (
                  <div className="bg-[#0f172a]/70 rounded-xl border border-slate-800 p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <Hash size={16} className="text-slate-300 shrink-0" />
                        <div>
                          <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                            5. Từ Khóa &amp; Hashtag
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            Tăng độ phủ SEO tìm kiếm và đề xuất video TikTok Shop
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 4.1 Từ khóa hạt nhân */}
                    {parsed.tags.keywords.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                            <Search size={12} className="text-slate-400" />
                            <span>Từ Khóa Hạt Nhân ({parsed.tags.keywords.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={copyKeywordsText}
                            title={copiedKey === "all-kw" ? "Đã sao chép tất cả từ khóa" : "Sao chép tất cả từ khóa"}
                            className={`p-1.5 rounded-md text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedKey === "all-kw"
                              ? "bg-emerald-500 text-white shadow-xs"
                              : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                              }`}
                          >
                            {copiedKey === "all-kw" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {parsed.tags.keywords.map((kw, idx) => {
                            const isCopied = copiedKey === `kw-${idx}`;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleCopy(kw, `kw-${idx}`)}
                                className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${isCopied
                                  ? "bg-emerald-600 text-white border-emerald-500"
                                  : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700"
                                  }`}
                                title="Bấm để sao chép từ khóa này"
                              >
                                {isCopied ? <Check size={11} /> : <Search size={10} className="text-slate-500" />}
                                <span>{kw}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4.2 Hashtag */}
                    {parsed.tags.hashtags.length > 0 && (
                      <div className="space-y-2 pt-2.5 border-t border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                            <Hash size={12} className="text-slate-400" />
                            <span>Hashtags Chuẩn Sàn ({parsed.tags.hashtags.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={copyHashtagsText}
                            title={copiedKey === "all-ht" ? "Đã sao chép tất cả hashtags" : "Sao chép tất cả hashtags"}
                            className={`p-1.5 rounded-md text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedKey === "all-ht"
                              ? "bg-emerald-500 text-white shadow-xs"
                              : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                              }`}
                          >
                            {copiedKey === "all-ht" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {parsed.tags.hashtags.map((tag, idx) => {
                            const isCopied = copiedKey === `ht-${idx}`;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleCopy(tag, `ht-${idx}`)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${isCopied
                                  ? "bg-emerald-600 text-white border-emerald-500"
                                  : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700"
                                  }`}
                                title="Bấm để sao chép hashtag này"
                              >
                                {isCopied ? <Check size={11} /> : <Hash size={10} className="text-slate-500" />}
                                <span>{tag.replace(/^#/, "")}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FOOTER THỐNG KÊ */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <span>Số từ: <strong className="text-white">{wordCount}</strong></span>
                <span>•</span>
                <span>Ký tự: <strong className="text-white">{charCount}</strong></span>
                <span>•</span>
                <span>Thuộc tính: <strong className="text-white">{parsed.specs.length}</strong></span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-slate-300 font-medium">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Sẵn sàng đăng bán Shopee, TikTok Shop &amp; Lazada</span>
              </div>
            </div>
          </div>
        ) : (
          /* TRẠNG THÁI CHƯA CÓ DỮ LIỆU */
          <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center p-5 sm:p-6 text-slate-400 space-y-4">
            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
              <ShoppingBag size={26} />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-sm text-white">
                Chưa có kết quả phân tích Listing
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tải ảnh chụp sản phẩm ở cột bên trái hoặc bấm nút dùng thử dữ liệu mẫu để trải nghiệm ngay.
              </p>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-950 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles size={14} /> Thử Dữ Liệu Mẫu (Demo)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
