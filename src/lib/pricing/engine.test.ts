import test from "node:test";
import assert from "node:assert/strict";
import { calculatePricing, evaluatePrice, solvePrice } from "./engine.ts";
import { detectCategory, getFeeProfile, OFFICIAL_CATEGORIES } from "./registry.ts";
import type { PricingInput } from "./types.ts";

const baseInput: PricingInput = {
  platform: "shopee", externalChannel: "facebook", shopType: "marketplace", categoryId: "shopee-416", quantity: 1,
  costPerUnit: 50_000, packagingCost: 0, handlingCost: 0, overheadCost: 0,
  sellerShippingCost: 0, buyerShippingFee: 0, platformDiscount: 0, sellerDiscountRate: 0,
  affiliateRate: 0, marketingMode: "fixed", marketingValue: 0,
  commissionOverride: 0, transactionOverride: 0, fixedFeeOverride: 0, enabledProgramIds: [],
  taxMode: "household_exempt", taxableRevenueShare: 0, manualRevenueTaxRate: 0, profitTaxRate: 0,
  cancellationRate: 0, cancellationCost: 0, deliveryFailureRate: 0, returnRate: 0,
  returnShippingCost: 0, nonRefundableReturnFee: 0, returnedInventoryRecoveryRate: 100, damageRate: 0,
};

test("tìm giá hòa vốn và giá mục tiêu sau bước làm tròn", () => {
  const result = calculatePricing(baseInput, "target", 0, { mode: "margin", value: 20, roundingStep: 1_000 });
  assert.equal(result.breakEvenPrice, 50_000);
  assert.equal(result.targetPrice, 63_000);
  assert.ok(result.evaluation.expectedMargin >= 20);
});

test("TikTok dùng hai cơ sở tính phí khác nhau", () => {
  const evaluation = evaluatePrice({ ...baseInput, platform: "tiktok", sellerDiscountRate: 10,
    platformDiscount: 5_000, buyerShippingFee: 5_000, commissionOverride: 15,
    transactionOverride: 6, fixedFeeOverride: 3_000 }, 100_000);
  assert.equal(evaluation.productRevenue, 90_000);
  assert.equal(evaluation.fees.find((fee) => fee.id === "commission")?.base, 90_000);
  assert.equal(evaluation.fees.find((fee) => fee.id === "transaction")?.base, 95_000);
  assert.equal(evaluation.fees.find((fee) => fee.id === "transaction")?.amount, 5_700);
});

test("hoa hồng KOC TikTok tính trên giá khách trả sau voucher", () => {
  const evaluation = evaluatePrice({ ...baseInput, platform: "tiktok", sellerDiscountRate: 10,
    platformDiscount: 5_000, affiliateRate: 10 }, 100_000);
  assert.equal(evaluation.affiliateCost, 8_500);
});

test("đơn ngoài chỉ tính các phí thanh toán, COD và xử lý do người bán nhập", () => {
  const evaluation = evaluatePrice({ ...baseInput, platform: "external",
    categoryId: "external-direct", commissionOverride: 2.5,
    transactionOverride: 1, fixedFeeOverride: 3_000 }, 100_000);
  assert.equal(evaluation.fees.find((fee) => fee.id === "commission")?.amount, 2_500);
  assert.equal(evaluation.fees.find((fee) => fee.id === "transaction")?.amount, 1_000);
  assert.equal(evaluation.platformFees, 6_500);
  assert.equal(evaluation.profitOnSuccess, 43_500);
});

test("phí chương trình không vượt mức trần", () => {
  const evaluation = evaluatePrice({ ...baseInput, enabledProgramIds: ["shopee_freeship"] }, 2_000_000);
  assert.equal(evaluation.fees.find((fee) => fee.id === "shopee_freeship")?.amount, 50_000);
});

test("giữ nguyên số âm khi giá bán gây lỗ", () => {
  const evaluation = evaluatePrice(baseInput, 10_000);
  assert.equal(evaluation.profitOnSuccess, -40_000);
  assert.equal(evaluation.expectedProfitPerOrder, -40_000);
});

test("xác suất các trạng thái đơn cộng thành 100%", () => {
  const evaluation = evaluatePrice({ ...baseInput, cancellationRate: 10, deliveryFailureRate: 20, returnRate: 25 }, 100_000);
  const sum = evaluation.weights.success + evaluation.weights.cancelled
    + evaluation.weights.deliveryFailed + evaluation.weights.returned;
  assert.ok(Math.abs(sum - 1) < 1e-10);
  assert.equal(evaluation.weights.cancelled, 0.1);
  assert.ok(Math.abs(evaluation.weights.deliveryFailed - 0.18) < 1e-10);
  assert.ok(Math.abs(evaluation.weights.returned - 0.18) < 1e-10);
  assert.ok(Math.abs(evaluation.weights.success - 0.54) < 1e-10);
});

test("giá do bộ giải trả về luôn đạt lợi nhuận cố định", () => {
  const input = { ...baseInput, commissionOverride: 16.5, transactionOverride: 6,
    fixedFeeOverride: 3_000, packagingCost: 5_000, marketingMode: "percent" as const,
    marketingValue: 10, returnRate: 12, deliveryFailureRate: 4, cancellationRate: 2,
    returnShippingCost: 25_000, returnedInventoryRecoveryRate: 95, damageRate: 5 };
  const price = solvePrice(input, { mode: "fixed", value: 20_000, roundingStep: 1_000 });
  assert.notEqual(price, null);
  assert.ok(evaluatePrice(input, price!).expectedProfitPerOrder >= 20_000);
  assert.ok(evaluatePrice(input, price! - 1_000).expectedProfitPerOrder < 20_000);
});

test("gợi ý phụ kiện ưu tiên hơn từ khóa điện thoại chung", () => {
  assert.match(detectCategory("Ốp lưng điện thoại iPhone", "shopee", "marketplace")?.level3 ?? "", /Ốp lưng/i);
  assert.equal(detectCategory("Điện thoại iPhone 17", "shopee", "marketplace")?.level3, "Điện thoại");
});

test("dùng đúng hoa hồng ngành cấp 3 chính thức", () => {
  assert.equal(getFeeProfile("shopee", "marketplace", "shopee-416").commissionRate, 16.5);
  assert.equal(getFeeProfile("shopee", "mall", "shopee-416").commissionRate, 19.1);
  const tiktokCase = OFFICIAL_CATEGORIES.find((category) =>
    category.platform === "tiktok" && category.level3 === "Cases, Screen Protectors & Stickers");
  assert.ok(tiktokCase);
  assert.equal(getFeeProfile("tiktok", "marketplace", tiktokCase.id).commissionRate, 13.5);
  assert.equal(getFeeProfile("tiktok", "mall", tiktokCase.id).commissionRate, 15.7);
});
