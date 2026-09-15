import officialFeeData from "./data/official-fees.json" with { type: "json" };
import type { FeeProgram, OfficialFeeCategory, Platform, PlatformFeeProfile, ShopType } from "./types.ts";

export const FEE_DATA_VERSION = "2026-09-15";
export const SOURCES = {
  shopeeMarketplace: "https://mms.file.susercontent.com/api/v4/11195002/mms/vn-11195002-bmlg8-mo82ohg4qz2aff",
  shopeeMall: "https://mms.file.susercontent.com/api/v4/11195002/mms/vn-11195002-bmlg9-mo7yb9mp42rkab",
  shopeeTerms: "https://help.shopee.vn/portal/4/article/77243",
  shopeeMallTerms: "https://help.shopee.vn/portal/4/article/77262",
  shopeeFreeship: "https://help.shopee.vn/portal/4/article/77263",
  tiktok: "https://seller-vn.tiktok.com/university/essay?knowledge_id=8858869405370113&lang=en",
  tiktokTransaction: "https://seller-vn.tiktok.com/university/essay?knowledge_id=753295858337537&lang=en",
  tiktokOrderProcessing: "https://seller-vn.tiktok.com/university/essay?knowledge_id=2968734088120080&lang=en",
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
    { id: "shopee_freeship", name: "Ưu đãi phí vận chuyển", rate: 6, cap: 50000, defaultEnabled: false, shopTypes: ["mall"], effectiveFrom: FEE_DATA_VERSION, verifiedAt: FEE_DATA_VERSION, sourceUrl: SOURCES.shopeeFreeship, note: "Chỉ dành cho Shopee Mall đủ điều kiện và đã tham gia; phí tính trên giá bán từng sản phẩm trước ưu đãi của sàn." },
  ],
  tiktok: [
    { id: "tiktok_vxp", name: "Voucher Extra cơ bản", rate: 5, cap: 50000, defaultEnabled: false, shopTypes: ["marketplace", "mall"], effectiveFrom: "2026-08-21", verifiedAt: FEE_DATA_VERSION, sourceUrl: SOURCES.tiktokVxp, note: "Chỉ bật khi shop đủ điều kiện và đã tham gia. Không áp dụng cho sữa công thức dưới 2 tuổi, vàng và sản phẩm bị quản lý khác." },
  ],
  external: [],
};

export function getAvailablePrograms(platform: Platform, shopType: ShopType) {
  return PROGRAMS[platform].filter((program) => program.shopTypes.includes(shopType));
}

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
    transactionRate: 6, orderProcessingFee: platform === "tiktok" ? 3000 : 0,
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
    note: platform === "shopee"
      ? `Ngành cấp 3 chính thức: ${getCategoryLabel(category)}. Shopee không công bố phí cố định theo đơn trong điều khoản hiện hành.`
      : `Ngành cấp 3 chính thức: ${getCategoryLabel(category)}. Phí 3.000đ áp dụng cho mỗi đơn giao thành công.`,
  };
}
