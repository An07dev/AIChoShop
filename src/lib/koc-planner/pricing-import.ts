import type { PricingCalculationSnapshot } from "../pricing/storage.ts";

export type PricingHistoryPayload = {
  isLogged?: boolean;
  recentActivities?: Array<{ input?: { snapshot?: unknown } }>;
};

function isPricingSnapshot(value: unknown): value is PricingCalculationSnapshot {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PricingCalculationSnapshot>;
  return typeof item.id === "string" && typeof item.createdAt === "string"
    && typeof item.productName === "string" && Boolean(item.input) && Boolean(item.result);
}

export function extractAccountPricingSnapshots(payload: PricingHistoryPayload) {
  if (!payload.isLogged) return [];
  const unique = new Map<string, PricingCalculationSnapshot>();
  for (const activity of payload.recentActivities ?? []) {
    const snapshot = activity.input?.snapshot;
    if (isPricingSnapshot(snapshot) && snapshot.input.platform === "tiktok") unique.set(snapshot.id, snapshot);
  }
  return [...unique.values()];
}

export function inspectPricingSnapshotVersion(
  snapshot: PricingCalculationSnapshot,
  currentFeeVersion: string,
  now: Date = new Date(),
) {
  const createdAt = new Date(snapshot.createdAt).getTime();
  const ageMs = now.getTime() - createdAt;
  const staleByAge = !Number.isFinite(ageMs) || ageMs < 0 || ageMs > 90 * 86_400_000;
  const sourceFeeVersion = snapshot.feeVersion ?? "legacy";
  return {
    sourceFeeVersion,
    staleByAge,
    versionChanged: sourceFeeVersion !== currentFeeVersion,
    requiresReview: staleByAge || sourceFeeVersion !== currentFeeVersion,
  };
}
