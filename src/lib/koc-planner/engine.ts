import { evaluatePrice } from "../pricing/engine.ts";
import { getAvailableCategories, PROGRAMS } from "../pricing/registry.ts";
import type { PricingInput } from "../pricing/types.ts";
import type { KocForecast, KocPlanInput, KocPlanResult, KocSensitivityDriver } from "./types.ts";

export const KOC_MODEL_VERSION = "KOC-FORECAST-2026-v1";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
const nonNegative = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);

export function validateKocPlanInput(input: KocPlanInput) {
  if (!input.campaignName.trim() || input.campaignName.length > 160) return "Tên chiến dịch phải có từ 1 đến 160 ký tự.";
  const numbers = Object.entries(input).filter(([, value]) => typeof value === "number") as [string, number][];
  if (numbers.some(([, value]) => !Number.isFinite(value))) return "Các giá trị phải là số hữu hạn.";
  if (!["marketplace", "mall"].includes(input.shopType) || !getAvailableCategories("tiktok", input.shopType).some((item) => item.id === input.categoryId)) return "Ngành TikTok hoặc loại shop không hợp lệ.";
  const programIds = new Set(PROGRAMS.tiktok.map((item) => item.id));
  if (new Set(input.enabledProgramIds).size !== input.enabledProgramIds.length || input.enabledProgramIds.some((id) => !programIds.has(id))) return "Chương trình phí TikTok không hợp lệ hoặc bị trùng.";
  const rates = [input.effectiveKocRate, input.sellerDiscountRate, input.organicCommissionRate,
    input.adsBudgetRate, input.adsCommissionRate, input.platformCommissionRate, input.transactionFeeRate,
    input.taxRate, input.cancellationRate, input.deliveryFailureRate, input.returnRate,
    input.returnedInventoryRecoveryRate, input.damageRate, input.extraKocCostRate];
  if (rates.some((value) => value < 0 || value > 100)) return "Các tỷ lệ phải nằm trong khoảng 0–100%.";
  if (numbers.some(([key, value]) => !key.endsWith("Rate") && value < 0)) return "Chi phí, số lượng và ngân sách không được âm.";
  if (input.totalBudget <= 0) return "Tổng ngân sách phải lớn hơn 0.";
  if (input.averageSellingPrice <= 0) return "Giá bán trung bình phải lớn hơn 0.";
  if (!Number.isInteger(input.videosPerKoc)) return "Số video mỗi KOC phải là số nguyên.";
  return null;
}

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
    unusedBudget: Math.max(0, creatorBudget - sampleAndCastCost - extraKocCost),
    modelVersion: KOC_MODEL_VERSION,
    assumptions: [
      `Tỷ lệ KOC lên clip ${clamp(input.effectiveKocRate)}% do người dùng cung cấp.`,
      `Mỗi KOC hiệu quả tạo ${nonNegative(input.organicOrdersPerEffectiveKoc)} đơn tự nhiên dự kiến.`,
      input.useAds ? `CPA quảng cáo dự kiến ${Math.round(nonNegative(input.adsCostPerOrder)).toLocaleString("vi-VN")} đồng/đơn.` : "Không sử dụng quảng cáo trả phí.",
      `Tỷ lệ hủy ${clamp(input.cancellationRate)}%, giao thất bại ${clamp(input.deliveryFailureRate)}%, hoàn ${clamp(input.returnRate)}%.`,
    ],
    warnings,
  };
}

export function calculateKocForecast(input: KocPlanInput): KocForecast {
  const base = calculateKocPlan(input);
  const cautiousInput: KocPlanInput = {
    ...input,
    effectiveKocRate: clamp(input.effectiveKocRate * 0.8),
    organicOrdersPerEffectiveKoc: nonNegative(input.organicOrdersPerEffectiveKoc) * 0.7,
    adsCostPerOrder: input.useAds ? nonNegative(input.adsCostPerOrder) * 1.25 : input.adsCostPerOrder,
    returnRate: clamp(input.returnRate * 1.3 + 2),
  };
  const favorableInput: KocPlanInput = {
    ...input,
    effectiveKocRate: clamp(input.effectiveKocRate * 1.1),
    organicOrdersPerEffectiveKoc: nonNegative(input.organicOrdersPerEffectiveKoc) * 1.25,
    adsCostPerOrder: input.useAds ? nonNegative(input.adsCostPerOrder) * 0.85 : input.adsCostPerOrder,
    returnRate: clamp(input.returnRate * 0.75),
  };
  const scenarios = [
    { key: "cautious" as const, label: "Thận trọng", description: "Hiệu suất KOC và đơn tự nhiên thấp hơn, CPA và hoàn hàng cao hơn.",
      adjustments: ["KOC hiệu quả −20%", "Đơn tự nhiên/KOC −30%", "CPA +25%", "Tỷ lệ hoàn tăng"], result: calculateKocPlan(cautiousInput) },
    { key: "base" as const, label: "Cơ sở", description: "Giữ nguyên toàn bộ giả định bạn đã nhập.",
      adjustments: ["Theo dữ liệu hiện tại"], result: base },
    { key: "favorable" as const, label: "Thuận lợi", description: "Hiệu suất KOC và đơn tự nhiên tốt hơn, CPA và hoàn hàng thấp hơn.",
      adjustments: ["KOC hiệu quả +10%", "Đơn tự nhiên/KOC +25%", "CPA −15%", "Tỷ lệ hoàn −25%"], result: calculateKocPlan(favorableInput) },
  ];

  const variants: Array<Omit<KocSensitivityDriver, "netProfitDelta" | "impactPercent"> & { input: KocPlanInput }> = [
    { key: "sellingPrice", label: "Giá bán trung bình", adverseChange: "giảm 5%", input: { ...input, averageSellingPrice: input.averageSellingPrice * 0.95 } },
    { key: "effectiveKocRate", label: "Tỷ lệ KOC lên clip", adverseChange: "giảm 10%", input: { ...input, effectiveKocRate: input.effectiveKocRate * 0.9 } },
    { key: "organicOrders", label: "Đơn tự nhiên/KOC", adverseChange: "giảm 10%", input: { ...input, organicOrdersPerEffectiveKoc: input.organicOrdersPerEffectiveKoc * 0.9 } },
    { key: "adsCpa", label: "CPA quảng cáo", adverseChange: "tăng 10%", input: { ...input, adsCostPerOrder: input.adsCostPerOrder * 1.1 } },
    { key: "returnRate", label: "Tỷ lệ hoàn", adverseChange: "tăng 2 điểm %", input: { ...input, returnRate: clamp(input.returnRate + 2) } },
  ];
  const denominator = Math.max(1, Math.abs(base.netProfit));
  const sensitivity = variants.map((variant) => {
    const changed = calculateKocPlan(variant.input);
    const netProfitDelta = changed.netProfit - base.netProfit;
    return { key: variant.key, label: variant.label, adverseChange: variant.adverseChange,
      netProfitDelta, impactPercent: Math.abs(netProfitDelta) / denominator * 100 };
  }).sort((a, b) => Math.abs(b.netProfitDelta) - Math.abs(a.netProfitDelta));

  return { modelVersion: KOC_MODEL_VERSION, scenarios, sensitivity };
}
