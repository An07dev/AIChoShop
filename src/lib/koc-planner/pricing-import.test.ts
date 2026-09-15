import test from "node:test";
import assert from "node:assert/strict";
import { extractAccountPricingSnapshots, inspectPricingSnapshotVersion } from "./pricing-import.ts";
import type { PricingCalculationSnapshot } from "../pricing/storage.ts";

const snapshot = {
  id: "price-1", createdAt: "2026-09-01T00:00:00.000Z", productName: "Áo mẫu",
  feeVersion: "fee-v1", input: { platform: "tiktok" }, result: {},
} as PricingCalculationSnapshot;

test("không đọc snapshot khi API chưa xác nhận phiên đăng nhập", () => {
  assert.deepEqual(extractAccountPricingSnapshots({ isLogged: false, recentActivities: [{ input: { snapshot } }] }), []);
});

test("chỉ nhận snapshot TikTok hợp lệ và loại bản trùng", () => {
  const shopee = { ...snapshot, id: "price-2", input: { ...snapshot.input, platform: "shopee" as const } };
  const invalid = { id: "missing-data" };
  const result = extractAccountPricingSnapshots({ isLogged: true, recentActivities: [
    { input: { snapshot } }, { input: { snapshot } }, { input: { snapshot: shopee } }, { input: { snapshot: invalid } },
  ] });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "price-1");
});

test("cảnh báo snapshot quá 90 ngày hoặc khác phiên bản phí", () => {
  const current = inspectPricingSnapshotVersion(snapshot, "fee-v1", new Date("2026-09-15T00:00:00.000Z"));
  const old = inspectPricingSnapshotVersion(snapshot, "fee-v2", new Date("2026-12-15T00:00:00.000Z"));
  assert.equal(current.requiresReview, false);
  assert.equal(old.staleByAge, true);
  assert.equal(old.versionChanged, true);
  assert.equal(old.requiresReview, true);
});
