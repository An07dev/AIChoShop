import { FEE_DATA_VERSION, getFeeProfile } from "./registry.ts";
import type { FeeOverrideRecord, Platform, ResolvedFeeProfile, ShopType } from "./types.ts";

const time = (value: string) => new Date(value).getTime();

export function selectFeeOverride(
  overrides: FeeOverrideRecord[], platform: Platform, shopType: ShopType,
  categoryId: string, at: Date = new Date(),
) {
  const current = at.getTime();
  return overrides
    .filter((item) => item.platform === platform && item.shopType === shopType && item.categoryId === categoryId)
    .filter((item) => time(item.effectiveFrom) <= current && (item.effectiveTo === null || time(item.effectiveTo) >= current))
    .sort((a, b) => time(b.effectiveFrom) - time(a.effectiveFrom) || b.id.localeCompare(a.id))[0] ?? null;
}

export function resolveFeeProfile(
  platform: Platform, shopType: ShopType, categoryId: string,
  overrides: FeeOverrideRecord[] = [], at: Date = new Date(),
): ResolvedFeeProfile {
  const base = getFeeProfile(platform, shopType, categoryId);
  const override = selectFeeOverride(overrides, platform, shopType, base.categoryId, at);
  if (!override) return { ...base, overrideId: null, dataVersion: FEE_DATA_VERSION };
  return {
    ...base,
    commissionRate: override.commissionRate ?? base.commissionRate,
    transactionRate: override.transactionRate ?? base.transactionRate,
    orderProcessingFee: override.orderProcessingFee ?? base.orderProcessingFee,
    effectiveFrom: override.effectiveFrom,
    effectiveTo: override.effectiveTo ?? undefined,
    sourceName: override.sourceName,
    sourceUrl: override.sourceUrl ?? "",
    note: override.note || `Ghi đè quản trị trên dữ liệu tích hợp ${FEE_DATA_VERSION}.`,
    overrideId: override.id,
    dataVersion: `admin:${override.id}`,
  };
}

export function isFeeProfileStale(profile: ResolvedFeeProfile, at: Date = new Date(), maxAgeDays = 90) {
  const reference = new Date(profile.overrideId ? profile.effectiveFrom : profile.verifiedAt).getTime();
  return !Number.isFinite(reference) || at.getTime() - reference > maxAgeDays * 86_400_000;
}
