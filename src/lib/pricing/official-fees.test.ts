import test from "node:test";
import assert from "node:assert/strict";
import { FEE_DATA_VERSION, getAvailablePrograms, getFeeProfile, OFFICIAL_CATEGORIES, SOURCES } from "./registry.ts";

test("bộ biểu phí tích hợp có nguồn, phiên bản và dữ liệu hợp lệ", () => {
  assert.equal(FEE_DATA_VERSION, "2026-09-15");
  assert.equal(OFFICIAL_CATEGORIES.length, 3696);
  assert.equal(OFFICIAL_CATEGORIES.filter((row) => row.platform === "shopee").length, 1656);
  assert.equal(OFFICIAL_CATEGORIES.filter((row) => row.platform === "tiktok").length, 2040);
  assert.ok(Object.values(SOURCES).every((url) => url.startsWith("https://")));
  assert.equal(new Set(OFFICIAL_CATEGORIES.map((row) => row.id)).size, OFFICIAL_CATEGORIES.length);
  assert.ok(OFFICIAL_CATEGORIES.every((row) => [row.marketplaceRate, row.mallRate]
    .every((rate) => rate === null || (Number.isFinite(rate) && rate >= 0 && rate <= 100))));
});

test("mẫu phí ngành khớp bảng chính thức của Shopee và TikTok Shop", () => {
  const find = (platform: "shopee" | "tiktok", level3: string) =>
    OFFICIAL_CATEGORIES.find((row) => row.platform === platform && row.level3 === level3);
  assert.deepEqual(
    [find("shopee", "USB & OTG")?.marketplaceRate, find("shopee", "USB & OTG")?.mallRate],
    [9, 14.5],
  );
  assert.deepEqual(
    [find("shopee", "CPU - Bộ Vi Xử Lý")?.marketplaceRate, find("shopee", "CPU - Bộ Vi Xử Lý")?.mallRate],
    [7.5, 8.3],
  );
  assert.deepEqual(
    [find("tiktok", "Cooling Pads")?.marketplaceRate, find("tiktok", "Cooling Pads")?.mallRate],
    [7.5, 12.5],
  );
  assert.deepEqual(
    [find("tiktok", "Processors")?.marketplaceRate, find("tiktok", "Processors")?.mallRate],
    [7.5, 8.3],
  );
});

test("phí nền tảng và chương trình chỉ áp dụng đúng phạm vi", () => {
  const shopee = getFeeProfile("shopee", "marketplace", "shopee-64");
  const tiktok = getFeeProfile("tiktok", "marketplace", "tiktok-e629d438d811");
  assert.deepEqual([shopee.transactionRate, shopee.orderProcessingFee], [6, 0]);
  assert.deepEqual([tiktok.transactionRate, tiktok.orderProcessingFee], [6, 3000]);
  assert.deepEqual(getAvailablePrograms("shopee", "marketplace"), []);
  assert.deepEqual(getAvailablePrograms("shopee", "mall").map((item) => item.id), ["shopee_freeship"]);
  assert.deepEqual(getAvailablePrograms("tiktok", "marketplace").map((item) => item.id), ["tiktok_vxp"]);
});
