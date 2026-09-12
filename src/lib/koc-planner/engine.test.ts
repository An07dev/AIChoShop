import test from "node:test";
import assert from "node:assert/strict";
import { calculateKocPlan } from "./engine.ts";
import type { KocPlanInput } from "./types.ts";

const input: KocPlanInput = {
  campaignName: "Kiểm thử", shopType: "marketplace", categoryId: "tiktok-468",
  totalBudget: 50_000_000, sampleCost: 100_000,
  sampleShippingCost: 30_000, castFee: 50_000, effectiveKocRate: 80,
  videosPerKoc: 3, organicOrdersPerEffectiveKoc: 10, averageSellingPrice: 500_000,
  sellerDiscountRate: 0, platformDiscount: 0, buyerShippingFee: 0,
  costPerSoldItem: 150_000, packagingCost: 0, handlingCost: 0, sellerShippingCost: 0,
  organicCommissionRate: 10, useAds: true,
  adsBudgetRate: 30, adsCostPerOrder: 100_000, adsCommissionRate: 7.5,
  includeTikTokFees: false, platformCommissionRate: 0, transactionFeeRate: 0,
  fixedOrderFee: 0, enabledProgramIds: [], taxRate: 1.5,
  cancellationRate: 0, cancellationCost: 0, deliveryFailureRate: 0, returnRate: 5,
  returnedInventoryRecoveryRate: 95, returnCostPerOrder: 25_000, nonRefundableReturnFee: 0, damageRate: 0,
  extraKocCostRate: 10, otherOperatingCost: 0,
};

test("phân bổ ngân sách và dự phóng đơn KOC không vượt ngân sách", () => {
  const result = calculateKocPlan(input);
  assert.equal(result.invitedKocs, 176);
  assert.equal(result.effectiveKocs, 140);
  assert.equal(result.videos, 420);
  assert.equal(result.organicOrders, 1400);
  assert.equal(result.adOrders, 150);
  assert.ok(result.sampleAndCastCost + result.extraKocCost + result.adSpend <= input.totalBudget);
});

test("ngân sách quảng cáo được tính theo phần trăm tổng ngân sách", () => {
  const result = calculateKocPlan({ ...input, totalBudget: 80_000_000, adsBudgetRate: 25 });
  assert.equal(result.adSpend, 20_000_000);
  assert.equal(result.adOrders, 200);
});

test("hoàn đơn làm giảm doanh thu ghi nhận và tạo chi phí hoàn", () => {
  const noReturns = calculateKocPlan({ ...input, returnRate: 0 });
  const withReturns = calculateKocPlan(input);
  assert.ok(withReturns.netRevenue < noReturns.netRevenue);
  assert.ok(withReturns.returnLoss > 0);
  assert.ok(withReturns.netProfit < noReturns.netProfit);
});

test("phí TikTok chỉ được tính khi người dùng bật", () => {
  const withoutFees = calculateKocPlan(input);
  const withFees = calculateKocPlan({ ...input, includeTikTokFees: true,
    platformCommissionRate: 15, transactionFeeRate: 6, fixedOrderFee: 3_000 });
  assert.equal(withoutFees.platformFees, 0);
  assert.ok(withFees.platformFees > 0);
  assert.ok(withFees.netProfit < withoutFees.netProfit);
});

test("đơn đã giao rồi hoàn vẫn giữ phí xử lý đơn TikTok", () => {
  const result = calculateKocPlan({ ...input, useAds: false, effectiveKocRate: 100,
    organicOrdersPerEffectiveKoc: 1, includeTikTokFees: true, platformCommissionRate: 0,
    transactionFeeRate: 0, fixedOrderFee: 3_000, taxRate: 0,
    cancellationRate: 0, deliveryFailureRate: 0, returnRate: 100 });
  assert.equal(result.successfulOrders, 0);
  assert.equal(result.platformFees, result.returnedOrders * 3_000);
});

test("tách giải ngân trước Affiliate và tiền ròng sau Affiliate, thuế", () => {
  const result = calculateKocPlan({ ...input, cancellationRate: 0, deliveryFailureRate: 0,
    returnRate: 0, includeTikTokFees: true, platformCommissionRate: 15,
    transactionFeeRate: 6, fixedOrderFee: 3_000 });
  assert.equal(result.expectedNetSettlement,
    result.expectedPayoutBeforeAffiliate - result.organicCommission - result.adsCommission - result.taxes);
});
