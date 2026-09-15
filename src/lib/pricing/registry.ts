import officialFeeData from "./data/official-fees.json" with { type: "json" };
import type { FeeProgram, OfficialFeeCategory, Platform, PlatformFeeProfile, ShopType } from "./types.ts";

export const FEE_DATA_VERSION = "2026-09-11";
export const SOURCES = {
  shopeeMarketplace: "https://mms.file.susercontent.com/api/v4/11195002/mms/vn-11195002-bmlg8-mo82ohg4qz2aff",
  shopeeMall: "https://mms.file.susercontent.com/api/v4/11195002/mms/vn-11195002-bmlg9-mo7yb9mp42rkab",
  tiktok: "https://seller-vn.tiktok.com/university/essay?knowledge_id=8858869405370113&lang=en",
  tiktokTransaction: "https://seller-vn.tiktok.com/university/essay?knowledge_id=753295858337537&lang=en",
  tiktokVxp: "https://seller-vn.tiktok.com/university/essay?knowledge_id=5776954021037841&lang=vi-VN",
  tax: "https://vanban.chinhphu.vn/?classid=1&docid=217111&orggroupid=2&pageid=27160",
} as const;

export const OFFICIAL_CATEGORIES = officialFeeData as OfficialFeeCategory[];

const rateFor = (category: OfficialFeeCategory, shopType: ShopType) =>
  shopType === "mall" ? category.mallRate : category.marketplaceRate;

export function getAvailableCategories(platform: Platform, shopType: ShopType) {
  if (platform === "external") return [{
    id: "external-direct", platform: "external" as const, industry: "Bán hàng trực tiếp",
    level1: "Đơn ngoài", level2: "Facebook, Website, YouTube", level3: "Bán trực tiếp",
    marketplaceRate: 0, mallRate: 0,
  }];
  return OFFICIAL_CATEGORIES.filter((category) =>
    category.platform === platform && rateFor(category, shopType) !== null,
  );
}

export function getDefaultCategoryId(platform: Platform, shopType: ShopType) {
  const categories = getAvailableCategories(platform, shopType);
  const preferred = platform === "shopee"
    ? categories.find((category) => category.level3.toLocaleLowerCase("vi").includes("áo polo"))
    : categories.find((category) => category.level3.toLowerCase().includes("polo shirt"));
  return (preferred ?? categories[0]).id;
}

export function getOfficialCategory(categoryId: string) {
  return OFFICIAL_CATEGORIES.find((category) => category.id === categoryId);
}

export function getCategoryLabel(category: OfficialFeeCategory) {
  return [category.level1, category.level2, category.level3]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(" → ");
}

function searchable(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function detectCategoryMatch(productName: string, platform: Platform, shopType: ShopType) {
  const query = searchable(productName.trim());
  if (query.length < 3) return null;
  const words = query.split(/\s+/).filter((word) => word.length > 1);
  let best: { category: OfficialFeeCategory; score: number } | null = null;
  for (const category of getAvailableCategories(platform, shopType)) {
    const level3 = searchable(category.level3);
    const fullPath = searchable(getCategoryLabel(category));
    let score = 0;
    const exactIndex = query.indexOf(level3);
    if (exactIndex >= 0 || level3.includes(query)) {
      score += 30 + Math.min(level3.length, query.length) + Math.max(0, 100 - Math.max(0, exactIndex) * 5);
    } else {
      for (let index = 0; index < words.length - 1; index += 1) {
        const phrase = `${words[index]} ${words[index + 1]}`;
        if (level3.includes(phrase)) score += Math.max(0, 100 - query.indexOf(phrase) * 5);
      }
    }
    score += words.filter((word) => fullPath.includes(word)).length * 30;
    if (score > (best?.score ?? 0)) best = { category, score };
  }
  if (!best || best.score < 60) return null;
  return { category: best.category, score: best.score, confidence: best.score >= 130 ? "high" as const : "medium" as const };
}

export function detectCategory(productName: string, platform: Platform, shopType: ShopType) {
  return detectCategoryMatch(productName, platform, shopType)?.category ?? null;
}

export const PROGRAMS: Record<Platform, FeeProgram[]> = {
  shopee: [
    { id: "shopee_freeship", name: "Freeship Xtra", rate: 6, cap: 50000, defaultEnabled: false, note: "Chỉ bật sau khi đối chiếu điều khoản chương trình trong Seller Center." },
    { id: "shopee_voucher", name: "Voucher Xtra", rate: 2, cap: 50000, defaultEnabled: false, note: "Chỉ bật khi sao kê của shop có khoản phí này." },
    { id: "shopee_content", name: "Content Xtra", rate: 3, cap: 50000, defaultEnabled: false, note: "Chỉ bật khi sao kê của shop có khoản phí này." },
  ],
  tiktok: [
    { id: "tiktok_sfp", name: "SFP/Freeship", rate: 4.5, cap: 40000, defaultEnabled: false, note: "Kiểm tra tỷ lệ theo hợp đồng của shop trước khi bật." },
    { id: "tiktok_vxp", name: "Voucher Extra cơ bản", rate: 5, cap: 50000, defaultEnabled: false, note: "Mức VXP cơ bản công bố ngày 21/08/2026; một số ngành bị hạn chế không áp dụng." },
  ],
  external: [],
};

export function getFeeProfile(platform: Platform, shopType: ShopType, categoryId: string): PlatformFeeProfile {
  if (platform === "external") return {
    platform, shopType, categoryId: "external-direct", commissionRate: 0,
    transactionRate: 0, orderProcessingFee: 0, effectiveFrom: FEE_DATA_VERSION,
    verifiedAt: FEE_DATA_VERSION, sourceName: "Chi phí do người bán cấu hình",
    sourceUrl: "", specificity: "exact",
    note: "Đơn ngoài không áp dụng phí sàn; chỉ tính các khoản người bán tự nhập.",
  };
  const selected = getOfficialCategory(categoryId);
  const category = selected?.platform === platform && rateFor(selected, shopType) !== null
    ? selected
    : getOfficialCategory(getDefaultCategoryId(platform, shopType))!;
  const commissionRate = rateFor(category, shopType)!;
  const isShopeeMall = platform === "shopee" && shopType === "mall";
  return {
    platform, shopType, categoryId: category.id, commissionRate,
    transactionRate: 6, orderProcessingFee: 3000,
    effectiveFrom: platform === "shopee"
      ? (isShopeeMall ? "2026-05-29" : "2026-05-23")
      : (shopType === "mall" ? "2026-08-03" : "2026-07-03"),
    verifiedAt: FEE_DATA_VERSION,
    sourceName: platform === "shopee"
      ? `Shopee ${isShopeeMall ? "Mall" : "shop thường"} - biểu phí ngành cấp 3`
      : "TikTok Shop - biểu phí ngành cấp 3 Marketplace/Mall",
    sourceUrl: platform === "shopee"
      ? (isShopeeMall ? SOURCES.shopeeMall : SOURCES.shopeeMarketplace)
      : SOURCES.tiktok,
    specificity: "exact",
    note: `Ngành cấp 3 chính thức: ${getCategoryLabel(category)}.`,
  };
}
