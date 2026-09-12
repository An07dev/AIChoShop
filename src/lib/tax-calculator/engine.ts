import type { BusinessActivity, TaxCalculatorInput, TaxCalculatorResult } from "./types.ts";

export const TAX_EXEMPT_REVENUE_2026 = 1_000_000_000;
export const INCOME_TAX_REDUCTION_REVENUE_LIMIT = 10_000_000_000;

export const ACTIVITY_RATES: Record<BusinessActivity, { label: string; vat: number; pitRevenue: number }> = {
  goods: { label: "Phân phối, cung cấp hàng hóa", vat: 1, pitRevenue: 0.5 },
  services: { label: "Dịch vụ, xây dựng không bao thầu vật liệu", vat: 5, pitRevenue: 2 },
  production: { label: "Sản xuất, vận tải, dịch vụ gắn với hàng hóa", vat: 3, pitRevenue: 1.5 },
  digital: { label: "Nội dung số, quảng cáo số, trò chơi điện tử", vat: 5, pitRevenue: 5 },
  other: { label: "Hoạt động kinh doanh khác", vat: 2, pitRevenue: 1 },
};

const amount = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);
const rateOf = (base: number, rate: number) => base * Math.max(0, rate) / 100;

function personalProfitRate(revenue: number) {
  if (revenue <= 3_000_000_000) return 15;
  if (revenue <= 50_000_000_000) return 17;
  return 20;
}

function companyIncomeRate(previousYearRevenue: number, currentRevenue: number) {
  const basis = previousYearRevenue > 0 ? previousYearRevenue : currentRevenue;
  if (basis <= 3_000_000_000) return 15;
  if (basis <= 50_000_000_000) return 17;
  return 20;
}

export function calculateEcommerceTax(input: TaxCalculatorInput): TaxCalculatorResult {
  const totalRevenue = amount(input.shopeeRevenue) + amount(input.tiktokRevenue)
    + amount(input.otherPlatformRevenue) + amount(input.directRevenue);
  const isPersonal = input.payerType !== "company";
  const isExempt = isPersonal && totalRevenue <= TAX_EXEMPT_REVENUE_2026;
  const rates = ACTIVITY_RATES[input.activity];
  const effectivePersonalMethod = isPersonal && totalRevenue > 3_000_000_000
    ? "profit" : input.personalIncomeMethod;
  const reductionEligible = input.applyIncomeTaxReduction
    && (input.taxYear === 2026 || input.taxYear === 2027)
    && totalRevenue > 0 && totalRevenue <= INCOME_TAX_REDUCTION_REVENUE_LIMIT;

  let vatRate = 0;
  let vat = 0;
  let incomeTaxRate = 0;
  let taxableIncomeBase = 0;
  let incomeTaxBeforeReduction = 0;

  if (!isExempt && isPersonal) {
    vatRate = rates.vat;
    vat = rateOf(totalRevenue, vatRate);
    if (effectivePersonalMethod === "revenue") {
      incomeTaxRate = rates.pitRevenue;
      taxableIncomeBase = Math.max(0, totalRevenue - TAX_EXEMPT_REVENUE_2026);
    } else {
      incomeTaxRate = personalProfitRate(totalRevenue);
      taxableIncomeBase = Math.max(0, totalRevenue + amount(input.otherTaxableIncome)
        - amount(input.deductibleCosts) - amount(input.carriedLoss));
    }
    incomeTaxBeforeReduction = rateOf(taxableIncomeBase, incomeTaxRate);
  } else if (!isPersonal) {
    vatRate = Math.max(0, input.companyVatRate);
    vat = Math.max(0, rateOf(totalRevenue, vatRate) - amount(input.deductibleInputVat));
    incomeTaxRate = companyIncomeRate(amount(input.companyPreviousYearRevenue), totalRevenue);
    taxableIncomeBase = Math.max(0, totalRevenue + amount(input.otherTaxableIncome)
      - amount(input.deductibleCosts) - amount(input.carriedLoss));
    incomeTaxBeforeReduction = rateOf(taxableIncomeBase, incomeTaxRate);
  }

  const incomeTaxReduction = reductionEligible ? incomeTaxBeforeReduction * 0.3 : 0;
  const incomeTax = Math.max(0, incomeTaxBeforeReduction - incomeTaxReduction);
  const totalTax = vat + incomeTax;
  const remainingVat = Math.max(0, vat - amount(input.withheldVat));
  const remainingIncomeTax = Math.max(0, incomeTax - amount(input.withheldIncomeTax));
  const overpaidVat = Math.max(0, amount(input.withheldVat) - vat);
  const overpaidIncomeTax = Math.max(0, amount(input.withheldIncomeTax) - incomeTax);
  const remainingPayable = remainingVat + remainingIncomeTax;
  const potentialRefundOrOffset = overpaidVat + overpaidIncomeTax;
  const netCashAfterTaxAndPlatformFees = totalRevenue - amount(input.platformFees) - totalTax;
  const warnings: string[] = [];

  if (isPersonal && totalRevenue > 3_000_000_000 && input.personalIncomeMethod === "revenue") {
    warnings.push("Doanh thu trên 3 tỷ đồng nên hệ thống chuyển TNCN sang phương pháp tính trên thu nhập.");
  }
  if (input.directRevenue > 0) warnings.push("Doanh thu ngoài sàn phải được tổng hợp và tự kê khai nếu chưa có đơn vị khấu trừ, nộp thay.");
  if (isPersonal && input.activity !== "goods") warnings.push("Nếu có nhiều nhóm hoạt động, cần tách doanh thu theo từng mức thuế suất thay vì dùng một tỷ lệ chung.");
  if (!isPersonal) warnings.push("GTGT doanh nghiệp là ước tính từ thuế đầu ra trừ thuế đầu vào được khấu trừ; hóa đơn và điều kiện khấu trừ quyết định số quyết toán.");
  if (potentialRefundOrOffset > 0) warnings.push("Số đã khấu trừ lớn hơn nghĩa vụ ước tính; cần đối chiếu để bù trừ hoặc đề nghị hoàn theo thủ tục thuế.");

  return {
    totalRevenue, isExempt, effectivePersonalMethod, vatRate, vat, incomeTaxRate,
    taxableIncomeBase, incomeTaxBeforeReduction, incomeTaxReduction, incomeTax,
    totalTax, remainingVat, remainingIncomeTax, remainingPayable, overpaidVat,
    overpaidIncomeTax, potentialRefundOrOffset, netCashAfterTaxAndPlatformFees,
    effectiveTaxRate: totalRevenue > 0 ? totalTax / totalRevenue * 100 : 0,
    platformFeeRate: totalRevenue > 0 ? amount(input.platformFees) / totalRevenue * 100 : 0,
    netRate: totalRevenue > 0 ? netCashAfterTaxAndPlatformFees / totalRevenue * 100 : 0,
    reductionEligible, warnings,
  };
}
