import { getFeeProfile, PROGRAMS } from "./registry.ts";
import type { AppliedFee, PriceEvaluation, PricingInput, PricingResult, ScenarioWeights, Target } from "./types.ts";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
const money = (value: number) => Math.round(value);
const percentOf = (base: number, rate: number) => base * rate / 100;
const feeAmount = (base: number, rate: number, cap: number | null) =>
  cap === null ? percentOf(base, rate) : Math.min(percentOf(base, rate), cap);

function scenarioWeights(input: PricingInput): ScenarioWeights {
  const cancelled = clamp(input.cancellationRate / 100, 0, 1);
  const afterCancellation = 1 - cancelled;
  const deliveryFailed = afterCancellation * clamp(input.deliveryFailureRate / 100, 0, 1);
  const delivered = afterCancellation - deliveryFailed;
  const returned = delivered * clamp(input.returnRate / 100, 0, 1);
  return { cancelled, deliveryFailed, returned, success: Math.max(0, delivered - returned) };
}

export function validatePricingInput(input: PricingInput) {
  const rates = [input.sellerDiscountRate, input.affiliateRate, input.taxableRevenueShare,
    input.cancellationRate, input.deliveryFailureRate, input.returnRate,
    input.returnedInventoryRecoveryRate, input.damageRate];
  if (rates.some((rate) => !Number.isFinite(rate) || rate < 0 || rate > 100)) {
    return "Các tỷ lệ phải nằm trong khoảng 0–100%.";
  }
  if (input.quantity < 1 || !Number.isFinite(input.quantity)) return "Số lượng sản phẩm trong đơn phải từ 1 trở lên.";
  if (input.costPerUnit < 0) return "Giá vốn không được âm.";
  if ((input.commissionOverride ?? 0) < 0 || (input.transactionOverride ?? 0) < 0) return "Phí sàn không được âm.";
  return null;
}

export function evaluatePrice(input: PricingInput, listPrice: number): PriceEvaluation {
  const profile = getFeeProfile(input.platform, input.shopType, input.categoryId);
  const commissionRate = input.commissionOverride ?? profile.commissionRate;
  const transactionRate = input.transactionOverride ?? profile.transactionRate;
  const fixedFee = input.fixedFeeOverride ?? profile.orderProcessingFee;
  const grossProductPrice = Math.max(0, listPrice);
  const sellerDiscount = percentOf(grossProductPrice, clamp(input.sellerDiscountRate, 0, 100));
  const productRevenue = Math.max(0, grossProductPrice - sellerDiscount);
  const platformDiscount = Math.max(0, input.platformDiscount);
  const customerProductPayment = Math.max(0, productRevenue - platformDiscount);
  const customerPayment = customerProductPayment + Math.max(0, input.buyerShippingFee);
  const commissionBase = productRevenue;
  const transactionBase = input.platform === "tiktok"
    ? customerPayment + platformDiscount
    : productRevenue + Math.max(0, input.buyerShippingFee);

  const fees: AppliedFee[] = [
    { id: "commission", name: input.platform === "external" ? "Phí thanh toán/cổng bán" : "Phí hoa hồng nền tảng", base: commissionBase, rate: commissionRate, amount: feeAmount(commissionBase, commissionRate, null), note: profile.note },
    { id: "transaction", name: input.platform === "external" ? "Phí COD/đối tác" : "Phí xử lý giao dịch", base: transactionBase, rate: transactionRate, amount: feeAmount(transactionBase, transactionRate, null) },
    { id: "order", name: input.platform === "external" ? "Phí xử lý đơn" : "Phí xử lý/hạ tầng theo đơn", base: 1, rate: null, amount: Math.max(0, fixedFee) },
  ];
  for (const program of PROGRAMS[input.platform].filter((item) => input.enabledProgramIds.includes(item.id))) {
    fees.push({ id: program.id, name: program.name, base: productRevenue, rate: program.rate,
      amount: feeAmount(productRevenue, program.rate, program.cap), note: program.note });
  }

  const platformFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const affiliateCost = percentOf(productRevenue, clamp(input.affiliateRate, 0, 100));
  const marketingCost = input.marketingMode === "fixed"
    ? Math.max(0, input.marketingValue)
    : percentOf(productRevenue, Math.max(0, input.marketingValue));
  const cogs = Math.max(0, input.costPerUnit) * Math.max(1, Math.floor(input.quantity));
  const operatingCosts = Math.max(0, input.packagingCost) + Math.max(0, input.handlingCost)
    + Math.max(0, input.overheadCost) + Math.max(0, input.sellerShippingCost);

  let revenueTax = 0;
  if (input.taxMode === "household_revenue") {
    const taxableShare = clamp(input.taxableRevenueShare, 0, 100) / 100;
    revenueTax = productRevenue * 0.01 + productRevenue * taxableShare * 0.005;
  } else if (input.taxMode === "manual") {
    revenueTax = percentOf(productRevenue, Math.max(0, input.manualRevenueTaxRate));
  }

  const payout = productRevenue - platformFees;
  const preProfitTaxProfit = payout - cogs - operatingCosts - affiliateCost - marketingCost - revenueTax;
  const profitTax = input.taxMode === "profit_based"
    ? percentOf(Math.max(0, preProfitTaxProfit), Math.max(0, input.profitTaxRate)) : 0;
  const tax = revenueTax + profitTax;
  const profitOnSuccess = preProfitTaxProfit - profitTax;

  const recoveredInventory = cogs * clamp(input.returnedInventoryRecoveryRate, 0, 100) / 100;
  const damageReserve = cogs * clamp(input.damageRate, 0, 100) / 100;
  const returnLoss = Math.max(0, input.packagingCost) + Math.max(0, input.handlingCost)
    + Math.max(0, input.sellerShippingCost) + Math.max(0, input.returnShippingCost)
    + Math.max(0, input.nonRefundableReturnFee) + Math.max(0, cogs - recoveredInventory)
    + damageReserve + marketingCost;
  const deliveryFailureLoss = Math.max(0, input.packagingCost) + Math.max(0, input.handlingCost)
    + Math.max(0, input.sellerShippingCost) + Math.max(0, input.returnShippingCost)
    + damageReserve + marketingCost;
  const cancellationLoss = Math.max(0, input.cancellationCost);
  const weights = scenarioWeights(input);
  const expectedProfitPerOrder = weights.success * profitOnSuccess - weights.returned * returnLoss
    - weights.deliveryFailed * deliveryFailureLoss - weights.cancelled * cancellationLoss;
  const expectedRevenuePerOrder = weights.success * productRevenue;
  const expectedMargin = expectedRevenuePerOrder > 0 ? expectedProfitPerOrder / expectedRevenuePerOrder * 100 : 0;
  const roiOnCogs = cogs > 0 ? expectedProfitPerOrder / cogs * 100 : 0;
  const nonMarketingProfit = expectedProfitPerOrder
    + (weights.success + weights.returned + weights.deliveryFailed) * marketingCost;
  const marketingExposure = weights.success + weights.returned + weights.deliveryFailed;
  const maximumMarketingCost = marketingExposure > 0 ? Math.max(0, nonMarketingProfit / marketingExposure) : 0;
  const breakEvenRoas = maximumMarketingCost > 0 && productRevenue > 0 ? productRevenue / maximumMarketingCost : null;

  const warnings: string[] = [];
  if (profile.specificity === "representative" && input.commissionOverride === null) warnings.push("Phí hoa hồng đang dùng mức đại diện của nhóm. Nhập tỷ lệ từ Seller Center để có kết quả chính xác nhất.");
  if (input.platform === "tiktok" && transactionRate === 5) warnings.push("Mức giao dịch 5% chỉ đúng khi shop đủ điều kiện ưu đãi GMV Max; hãy kiểm tra trạng thái mỗi ngày trong Seller Center.");
  if (input.taxMode === "household_revenue" && input.taxableRevenueShare < 100) warnings.push("Phần doanh thu chịu TNCN là ước tính phân bổ ngưỡng năm; kết quả sẽ thay đổi theo doanh thu thực tế cả năm.");
  if (input.returnRate > 0 && input.returnShippingCost === 0) warnings.push("Bạn có tỷ lệ trả hàng nhưng chưa nhập phí vận chuyển hoàn về.");

  return {
    listPrice: money(grossProductPrice), productRevenue: money(productRevenue),
    customerProductPayment: money(customerProductPayment), customerPayment: money(customerPayment),
    payout: money(payout), fees: fees.map((fee) => ({ ...fee, base: money(fee.base), amount: money(fee.amount) })),
    platformFees: money(platformFees), affiliateCost: money(affiliateCost), marketingCost: money(marketingCost),
    revenueTax: money(revenueTax), profitTax: money(profitTax), tax: money(tax), cogs: money(cogs),
    operatingCosts: money(operatingCosts), profitOnSuccess: money(profitOnSuccess), returnLoss: money(returnLoss),
    deliveryFailureLoss: money(deliveryFailureLoss), cancellationLoss: money(cancellationLoss),
    expectedProfitPerOrder: money(expectedProfitPerOrder), expectedRevenuePerOrder: money(expectedRevenuePerOrder),
    expectedMargin, roiOnCogs, breakEvenRoas, maximumMarketingCost: money(maximumMarketingCost), weights, warnings,
  };
}

function targetReached(evaluation: PriceEvaluation, target: Target) {
  return target.mode === "fixed" ? evaluation.expectedProfitPerOrder >= target.value : evaluation.expectedMargin >= target.value;
}
const roundedUp = (value: number, step: number) => Math.ceil(value / Math.max(1, Math.round(step))) * Math.max(1, Math.round(step));

export function solvePrice(input: PricingInput, target: Target): number | null {
  if (validatePricingInput(input)) return null;
  let low = 0;
  let high = Math.max(100_000, input.costPerUnit * input.quantity * 2);
  while (high < 1_000_000_000 && !targetReached(evaluatePrice(input, high), target)) high *= 2;
  if (!targetReached(evaluatePrice(input, high), target)) return null;
  for (let index = 0; index < 64; index += 1) {
    const middle = (low + high) / 2;
    if (targetReached(evaluatePrice(input, middle), target)) high = middle;
    else low = middle;
  }
  let candidate = roundedUp(high, target.roundingStep);
  while (candidate <= 1_000_000_000 && !targetReached(evaluatePrice(input, candidate), target)) candidate += Math.max(1, target.roundingStep);
  return candidate <= 1_000_000_000 ? candidate : null;
}

export function calculatePricing(input: PricingInput, mode: "target" | "audit", auditPrice: number, target: Target): PricingResult {
  const error = validatePricingInput(input) ?? undefined;
  const breakEvenPrice = error ? null : solvePrice(input, { mode: "fixed", value: 0, roundingStep: target.roundingStep });
  const targetPrice = error || mode === "audit" ? null : solvePrice(input, target);
  const evaluatedPrice = mode === "audit" ? Math.max(0, auditPrice) : targetPrice ?? 0;
  const evaluation = evaluatePrice(input, evaluatedPrice);
  const feasible = !error && (mode === "audit" || targetPrice !== null);
  return { evaluation, breakEvenPrice, targetPrice, feasible,
    error: error ?? (!feasible ? "Không tìm được giá khả thi dưới 1 tỷ đồng. Hãy giảm tỷ lệ chi phí hoặc mục tiêu lợi nhuận." : undefined) };
}
