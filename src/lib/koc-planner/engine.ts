import { evaluatePrice } from "../pricing/engine.ts";
import type { PricingInput } from "../pricing/types.ts";
import type { KocPlanInput, KocPlanResult } from "./types.ts";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
const nonNegative = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);

function orderInput(input: KocPlanInput, affiliateRate: number): PricingInput {
  return {
    platform: "tiktok", externalChannel: "facebook", shopType: input.shopType,
    categoryId: input.categoryId, quantity: 1, costPerUnit: input.costPerSoldItem,
    packagingCost: input.packagingCost, handlingCost: input.handlingCost, overheadCost: 0,
    sellerShippingCost: input.sellerShippingCost, buyerShippingFee: input.buyerShippingFee,
    platformDiscount: input.platformDiscount, sellerDiscountRate: input.sellerDiscountRate,
    affiliateRate, marketingMode: "fixed", marketingValue: 0,
    commissionOverride: input.includeTikTokFees ? input.platformCommissionRate : 0,
    transactionOverride: input.includeTikTokFees ? input.transactionFeeRate : 0,
    fixedFeeOverride: input.includeTikTokFees ? input.fixedOrderFee : 0,
    enabledProgramIds: input.includeTikTokFees ? input.enabledProgramIds : [],
    taxMode: input.taxRate > 0 ? "manual" : "household_exempt", taxableRevenueShare: 0,
    manualRevenueTaxRate: input.taxRate, profitTaxRate: 0,
    cancellationRate: input.cancellationRate, cancellationCost: input.cancellationCost,
    deliveryFailureRate: input.deliveryFailureRate, returnRate: input.returnRate,
    returnShippingCost: input.returnCostPerOrder, nonRefundableReturnFee: input.nonRefundableReturnFee,
    returnedInventoryRecoveryRate: input.returnedInventoryRecoveryRate, damageRate: input.damageRate,
  };
}

export function calculateKocPlan(input: KocPlanInput): KocPlanResult {
  const totalBudget = nonNegative(input.totalBudget);
  const adSpend = input.useAds ? totalBudget * clamp(input.adsBudgetRate) / 100 : 0;
  const otherOperatingCost = Math.min(Math.max(0, totalBudget - adSpend), nonNegative(input.otherOperatingCost));
  const creatorBudget = Math.max(0, totalBudget - adSpend - otherOperatingCost);
  const costPerInvitedKoc = nonNegative(input.sampleCost) + nonNegative(input.sampleShippingCost) + nonNegative(input.castFee);
  const costPerInvitedKocWithReserve = costPerInvitedKoc * (1 + clamp(input.extraKocCostRate) / 100);
  const invitedKocs = costPerInvitedKocWithReserve > 0 ? Math.floor(creatorBudget / costPerInvitedKocWithReserve) : 0;
  const effectiveKocs = Math.floor(invitedKocs * clamp(input.effectiveKocRate) / 100);
  const videos = Math.floor(effectiveKocs * nonNegative(input.videosPerKoc));
  const organicOrders = effectiveKocs * nonNegative(input.organicOrdersPerEffectiveKoc);
  const adOrders = input.useAds && input.adsCostPerOrder > 0 ? adSpend / input.adsCostPerOrder : 0;
  const expectedOrders = organicOrders + adOrders;
  const organicUnit = evaluatePrice(orderInput(input, input.organicCommissionRate), input.averageSellingPrice);
  const adsUnit = evaluatePrice(orderInput(input, input.adsCommissionRate), input.averageSellingPrice);
  const successfulOrders = organicOrders * organicUnit.weights.success + adOrders * adsUnit.weights.success;
  const returnedOrders = organicOrders * organicUnit.weights.returned + adOrders * adsUnit.weights.returned;
  const sampleAndCastCost = invitedKocs * costPerInvitedKoc;
  const extraKocCost = sampleAndCastCost * clamp(input.extraKocCostRate) / 100;
  const campaignInvestment = sampleAndCastCost + adSpend + otherOperatingCost + extraKocCost;
  const scale = (organicValue: number, adsValue: number) => organicOrders * organicValue + adOrders * adsValue;
  const netRevenue = scale(organicUnit.expectedRevenuePerOrder, adsUnit.expectedRevenuePerOrder);
  const organicCommission = organicOrders * organicUnit.weights.success * organicUnit.affiliateCost;
  const adsCommission = adOrders * adsUnit.weights.success * adsUnit.affiliateCost;
  const organicOrderFee = organicUnit.fees.find((fee) => fee.id === "order")?.amount ?? 0;
  const adsOrderFee = adsUnit.fees.find((fee) => fee.id === "order")?.amount ?? 0;
  // Phí xử lý đơn vẫn bị giữ nếu đơn đã giao thành công rồi mới hoàn/trả.
  const returnedOrderFees = organicOrders * organicUnit.weights.returned * organicOrderFee
    + adOrders * adsUnit.weights.returned * adsOrderFee;
  const platformFees = scale(organicUnit.weights.success * organicUnit.platformFees, adsUnit.weights.success * adsUnit.platformFees)
    + returnedOrderFees;
  const taxes = scale(organicUnit.weights.success * organicUnit.tax, adsUnit.weights.success * adsUnit.tax);
  const expectedPayoutBeforeAffiliate = netRevenue - platformFees;
  const expectedNetSettlement = expectedPayoutBeforeAffiliate - organicCommission - adsCommission - taxes;
  const soldGoodsCost = scale(organicUnit.weights.success * organicUnit.cogs, adsUnit.weights.success * adsUnit.cogs);
  const fulfillmentCost = scale(organicUnit.weights.success * organicUnit.operatingCosts, adsUnit.weights.success * adsUnit.operatingCosts);
  const scenarioLoss = scale(
    organicUnit.weights.returned * organicUnit.returnLoss + organicUnit.weights.deliveryFailed * organicUnit.deliveryFailureLoss + organicUnit.weights.cancelled * organicUnit.cancellationLoss,
    adsUnit.weights.returned * adsUnit.returnLoss + adsUnit.weights.deliveryFailed * adsUnit.deliveryFailureLoss + adsUnit.weights.cancelled * adsUnit.cancellationLoss,
  );
  const totalCost = campaignInvestment + organicCommission + adsCommission + platformFees
    + taxes + soldGoodsCost + fulfillmentCost + scenarioLoss;
  const netProfit = netRevenue - totalCost;
  const contributionBeforeCampaign = expectedOrders > 0 ? (netRevenue - totalCost + campaignInvestment) / expectedOrders : 0;
  const breakEvenOrders = contributionBeforeCampaign > 0 ? campaignInvestment / contributionBeforeCampaign : null;
  const adContributionBeforeSpend = adsUnit.expectedProfitPerOrder;
  const breakEvenCpa = input.useAds && adContributionBeforeSpend > 0 ? adContributionBeforeSpend : null;
  const warnings = [...new Set([...organicUnit.warnings, ...adsUnit.warnings])];
  if (costPerInvitedKoc <= 0) warnings.push("Cần nhập chi phí mẫu, gửi mẫu hoặc booking để xác định số KOC có thể mời.");
  if (input.useAds && input.adsCostPerOrder <= 0) warnings.push("Đã bật quảng cáo nhưng chưa nhập CPA, nên chưa thể dự phóng đơn từ Ads.");
  if (expectedOrders > 0 && input.costPerSoldItem <= 0) warnings.push("Chưa nhập giá vốn hàng bán; lợi nhuận đang cao hơn thực tế.");

  return {
    creatorBudget, costPerInvitedKoc, invitedKocs, effectiveKocs, videos, organicOrders,
    adOrders, expectedOrders, returnedOrders, successfulOrders,
    grossRevenue: expectedOrders * nonNegative(input.averageSellingPrice), netRevenue,
    expectedPayoutBeforeAffiliate, expectedNetSettlement,
    sampleAndCastCost, adSpend, organicCommission, adsCommission, platformFees, taxes,
    soldGoodsCost, fulfillmentCost, returnLoss: scenarioLoss, extraKocCost, totalCost, netProfit,
    roi: campaignInvestment > 0 ? netProfit / campaignInvestment * 100 : 0,
    roas: adSpend > 0 ? adOrders * adsUnit.expectedRevenuePerOrder / adSpend : null,
    costPerSuccessfulOrder: successfulOrders > 0 ? campaignInvestment / successfulOrders : null,
    breakEvenOrders, breakEvenCpa,
    netMargin: netRevenue > 0 ? netProfit / netRevenue * 100 : 0,
    unusedBudget: Math.max(0, creatorBudget - sampleAndCastCost - extraKocCost), warnings,
  };
}
