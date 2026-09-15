import type { ActivityRevenues, BusinessActivity, TaxCalculatorInput, TaxCalculatorResult, TaxSource } from "./types.ts";

export const TAX_EXEMPT_REVENUE_2026 = 1_000_000_000;
export const SUPPORTED_TAX_YEARS = [2026] as const;
export const TAX_RULE_VERSION = "VN-2026-ND141-ND68-LTNDN67-ND20-v1";
export const TAX_SOURCES: TaxSource[] = [
  { label: "Nghị định 141/2026/NĐ-CP", url: "https://vanban.chinhphu.vn/?classid=1&docid=217960&pageid=27160&typegroupid=4" },
  { label: "Nghị định 68/2026/NĐ-CP", url: "https://vanban.chinhphu.vn/?classid=0&docid=217111&pageid=27160" },
  { label: "Luật Thuế TNDN 67/2025/QH15", url: "https://vanban.chinhphu.vn/?docid=214607&pageid=27160" },
  { label: "Nghị định 20/2026/NĐ-CP", url: "https://xaydungchinhsach.chinhphu.vn/quy-dinh-moi-ve-mien-giam-thue-thu-nhap-doanh-nghiep-de-phat-trien-kinh-te-tu-nhan-11926011908115524.htm" },
];

export const ACTIVITY_RATES: Record<BusinessActivity, { label: string; vat: number; pitRevenue: number }> = {
  goods: { label: "Phân phối, cung cấp hàng hóa", vat: 1, pitRevenue: 0.5 },
  services: { label: "Dịch vụ, xây dựng không bao thầu vật liệu", vat: 5, pitRevenue: 2 },
  production: { label: "Sản xuất, vận tải, dịch vụ gắn với hàng hóa", vat: 3, pitRevenue: 1.5 },
  digital: { label: "Nội dung số, quảng cáo số, trò chơi điện tử", vat: 5, pitRevenue: 5 },
  other: { label: "Hoạt động kinh doanh khác", vat: 2, pitRevenue: 1 },
};

const activities = Object.keys(ACTIVITY_RATES) as BusinessActivity[];
const amount = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);
const rateOf = (base: number, rate: number) => base * Math.max(0, rate) / 100;
const totalChannels = (input: TaxCalculatorInput) => amount(input.shopeeRevenue) + amount(input.tiktokRevenue)
  + amount(input.otherPlatformRevenue) + amount(input.directRevenue);

function personalProfitRate(revenue: number) {
  if (revenue <= 3_000_000_000) return 15;
  if (revenue <= 50_000_000_000) return 17;
  return 20;
}
function companyIncomeRate(referenceRevenue: number) {
  if (referenceRevenue <= 3_000_000_000) return 15;
  if (referenceRevenue <= 50_000_000_000) return 17;
  return 20;
}
function normalizedActivityRevenue(input: TaxCalculatorInput, totalRevenue: number): ActivityRevenues {
  const supplied = input.activityRevenues;
  const suppliedTotal = supplied ? activities.reduce((sum, key) => sum + amount(supplied[key]), 0) : 0;
  if (suppliedTotal > 0 || totalRevenue === 0) {
    return Object.fromEntries(activities.map((key) => [key, amount(supplied?.[key])])) as ActivityRevenues;
  }
  return Object.fromEntries(activities.map((key) => [key, key === input.activity ? totalRevenue : 0])) as ActivityRevenues;
}
function annualizedReferenceRevenue(input: TaxCalculatorInput) {
  if (input.companyIsNewThisYear) return totalChannels(input);
  const months = Math.min(12, Math.max(1, Math.trunc(input.companyPreviousYearOperatingMonths || 12)));
  return amount(input.companyPreviousYearRevenue) / months * 12;
}

export function calculateEcommerceTax(input: TaxCalculatorInput): TaxCalculatorResult {
  const totalRevenue = totalChannels(input);
  const isPersonal = input.payerType !== "company";
  const revenueByActivity = normalizedActivityRevenue(input, totalRevenue);
  const activityRevenueTotal = activities.reduce((sum, key) => sum + revenueByActivity[key], 0);
  const validationErrors: string[] = [];
  const warnings: string[] = [];

  if (!SUPPORTED_TAX_YEARS.includes(input.taxYear as 2026)) validationErrors.push("Bộ quy tắc hiện chỉ hỗ trợ kỳ tính thuế 2026.");
  if (isPersonal && Math.abs(activityRevenueTotal - totalRevenue) > 1) validationErrors.push("Tổng doanh thu theo nhóm hoạt động phải bằng tổng doanh thu theo kênh bán.");
  if (isPersonal && input.residencyStatus !== "resident") validationErrors.push("Công thức này chỉ áp dụng khi đã xác nhận là cá nhân cư trú tại Việt Nam.");
  if (!isPersonal && (input.companyPreviousYearOperatingMonths < 1 || input.companyPreviousYearOperatingMonths > 12)) validationErrors.push("Số tháng hoạt động của năm trước phải từ 1 đến 12.");
  if (!isPersonal && (input.companyVatRate < 0 || input.companyVatRate > 100)) validationErrors.push("Thuế suất GTGT đầu ra phải nằm trong khoảng 0% đến 100%.");

  const personalThresholdExempt = isPersonal && totalRevenue <= TAX_EXEMPT_REVENUE_2026;
  const annualizedCompanyReferenceRevenue = isPersonal ? 0 : annualizedReferenceRevenue(input);
  const companyHasReference = input.companyIsNewThisYear || input.companyHasPreviousYearData;
  const companyRevenueExempt = !isPersonal && companyHasReference
    && annualizedCompanyReferenceRevenue <= TAX_EXEMPT_REVENUE_2026
    && !input.companyHasDisqualifyingRelatedParty;
  const registrationYear = input.companyFirstRegistrationYear;
  const withinSmeExemptionPeriod = !isPersonal && input.companyIsSme && registrationYear !== null
    && input.taxYear >= registrationYear && input.taxYear <= registrationYear + 2;
  const companySmeExempt = withinSmeExemptionPeriod && !input.companyCreatedFromReorganization
    && !input.companyControllerHasPriorBusiness && !input.companyHasExcludedIncome && !input.companyUsesOtherTaxIncentive;
  const incomeTaxExempt = personalThresholdExempt || companyRevenueExempt || companySmeExempt;
  const vatExempt = personalThresholdExempt;
  const incomeTaxExemptionReason = personalThresholdExempt
    ? "Doanh thu hộ/cá nhân kinh doanh không quá 1 tỷ đồng trong năm 2026."
    : companyRevenueExempt
      ? "Doanh thu tham chiếu năm trước sau quy đổi không quá 1 tỷ đồng và không vướng điều kiện bên liên kết."
      : companySmeExempt
        ? "Doanh nghiệp nhỏ và vừa trong 3 năm đầu kể từ lần đăng ký đầu tiên, đã xác nhận không thuộc trường hợp loại trừ."
        : null;

  let effectivePersonalMethod = input.personalIncomeMethod;
  if (isPersonal && amount(input.personalPreviousYearRevenue) > 3_000_000_000) {
    effectivePersonalMethod = "profit";
    if (input.personalIncomeMethod === "revenue") warnings.push("Doanh thu năm trước trên 3 tỷ đồng nên kỳ 2026 phải tính TNCN theo thu nhập chịu thuế.");
  } else if (isPersonal && totalRevenue > 3_000_000_000 && input.personalIncomeMethod === "revenue") {
    warnings.push("Doanh thu thực tế 2026 vượt 3 tỷ đồng; nếu năm trước chưa vượt ngưỡng, phương pháp theo thu nhập áp dụng từ kỳ tiếp theo.");
  }
  if (isPersonal && input.personalIncomeMethod === "profit" && input.profitMethodStartYear !== null
      && input.taxYear < input.profitMethodStartYear + 2) warnings.push("Phương pháp tính trên thu nhập phải được duy trì liên tục 2 năm; hãy đối chiếu năm bắt đầu trước khi đổi phương pháp.");

  let vatRate = 0, vat = 0, incomeTaxRate = 0, taxableIncomeBase = 0, incomeTaxBeforeReduction = 0;
  const excessRatio = totalRevenue > 0 ? Math.max(0, totalRevenue - TAX_EXEMPT_REVENUE_2026) / totalRevenue : 0;
  const activityBreakdown = activities.map((activity) => {
    const revenue = revenueByActivity[activity], rate = ACTIVITY_RATES[activity];
    const activityVat = !isPersonal || vatExempt ? 0 : rateOf(revenue, rate.vat);
    const pitTaxableRevenue = isPersonal && effectivePersonalMethod === "revenue" && !incomeTaxExempt ? revenue * excessRatio : 0;
    return { activity, label: rate.label, revenue, vatRate: rate.vat, vat: activityVat,
      pitRate: rate.pitRevenue, pitTaxableRevenue, pit: rateOf(pitTaxableRevenue, rate.pitRevenue) };
  });
  const activeActivityCount = activityBreakdown.filter((row) => row.revenue > 0).length;
  if (isPersonal && effectivePersonalMethod === "revenue" && activeActivityCount > 1) {
    warnings.push("Phần doanh thu vượt ngưỡng 1 tỷ đang được phân bổ theo tỷ trọng doanh thu từng hoạt động; cần đối chiếu cách phân bổ trên hồ sơ khai thuế.");
  }

  if (validationErrors.length === 0) {
    if (isPersonal) {
      vat = activityBreakdown.reduce((sum, row) => sum + row.vat, 0);
      vatRate = totalRevenue > 0 ? vat / totalRevenue * 100 : 0;
      if (!incomeTaxExempt && effectivePersonalMethod === "revenue") {
        taxableIncomeBase = Math.max(0, totalRevenue - TAX_EXEMPT_REVENUE_2026);
        incomeTaxBeforeReduction = activityBreakdown.reduce((sum, row) => sum + row.pit, 0);
        incomeTaxRate = taxableIncomeBase > 0 ? incomeTaxBeforeReduction / taxableIncomeBase * 100 : 0;
      } else if (!incomeTaxExempt) {
        incomeTaxRate = personalProfitRate(totalRevenue);
        taxableIncomeBase = Math.max(0, totalRevenue + amount(input.otherTaxableIncome) - amount(input.deductibleCosts) - amount(input.carriedLoss));
        incomeTaxBeforeReduction = rateOf(taxableIncomeBase, incomeTaxRate);
      }
    } else {
      vatRate = Math.max(0, input.companyVatRate);
      vat = Math.max(0, rateOf(totalRevenue, vatRate) - amount(input.deductibleInputVat));
      incomeTaxRate = companyIncomeRate(annualizedCompanyReferenceRevenue);
      taxableIncomeBase = Math.max(0, totalRevenue + amount(input.otherTaxableIncome) - amount(input.deductibleCosts) - amount(input.carriedLoss));
      incomeTaxBeforeReduction = incomeTaxExempt ? 0 : rateOf(taxableIncomeBase, incomeTaxRate);
    }
  }

  if (input.applyIncomeTaxReduction) warnings.push("Không áp dụng giảm 30%: nội dung này chưa được xác định là chính sách đã có hiệu lực trong bộ quy tắc 2026.");
  if (input.directRevenue > 0) warnings.push("Doanh thu ngoài sàn phải được tổng hợp và tự kê khai nếu chưa có đơn vị khấu trừ, nộp thay.");
  if (!isPersonal) {
    warnings.push("GTGT doanh nghiệp là dự toán thuế đầu ra trừ thuế đầu vào; hồ sơ hóa đơn và điều kiện khấu trừ quyết định số quyết toán.");
    if (input.companyHasExcludedIncome) warnings.push("Có thu nhập thuộc diện loại trừ; công cụ không tự phân bổ ưu đãi cho phần thu nhập này.");
    if (input.companyUsesOtherTaxIncentive) warnings.push("Có ưu đãi thuế khác; cần chọn phương án ưu đãi theo hồ sơ và duy trì nhất quán.");
    if (!companyHasReference) warnings.push("Chưa xác nhận dữ liệu doanh thu tham chiếu năm trước nên công cụ không tự kết luận miễn TNDN theo ngưỡng 1 tỷ đồng.");
  }

  const incomeTaxReduction = 0, incomeTax = incomeTaxBeforeReduction, totalTax = vat + incomeTax;
  const remainingVat = Math.max(0, vat - amount(input.withheldVat));
  const remainingIncomeTax = Math.max(0, incomeTax - amount(input.withheldIncomeTax));
  const overpaidVat = Math.max(0, amount(input.withheldVat) - vat);
  const overpaidIncomeTax = Math.max(0, amount(input.withheldIncomeTax) - incomeTax);
  const remainingPayable = remainingVat + remainingIncomeTax;
  const potentialRefundOrOffset = overpaidVat + overpaidIncomeTax;
  const netCashAfterTaxAndPlatformFees = totalRevenue - amount(input.platformFees) - totalTax;
  if (potentialRefundOrOffset > 0) warnings.push("Số đã khấu trừ lớn hơn nghĩa vụ dự toán; cần đối chiếu điều kiện bù trừ hoặc hoàn thuế.");

  return { totalRevenue, activityRevenueTotal, isExempt: vatExempt && incomeTaxExempt, vatExempt,
    incomeTaxExempt, incomeTaxExemptionReason, effectivePersonalMethod, vatRate, vat, incomeTaxRate,
    taxableIncomeBase, incomeTaxBeforeReduction, incomeTaxReduction, incomeTax, totalTax,
    remainingVat, remainingIncomeTax, remainingPayable, overpaidVat, overpaidIncomeTax,
    potentialRefundOrOffset, netCashAfterTaxAndPlatformFees,
    effectiveTaxRate: totalRevenue > 0 ? totalTax / totalRevenue * 100 : 0,
    platformFeeRate: totalRevenue > 0 ? amount(input.platformFees) / totalRevenue * 100 : 0,
    netRate: totalRevenue > 0 ? netCashAfterTaxAndPlatformFees / totalRevenue * 100 : 0,
    reductionEligible: false, annualizedCompanyReferenceRevenue, activityBreakdown,
    ruleVersion: TAX_RULE_VERSION, sources: TAX_SOURCES, validationErrors, warnings,
    requiresProfessionalReview: validationErrors.length > 0 || (isPersonal && activeActivityCount > 1)
      || (!isPersonal && (!companyHasReference || input.companyHasExcludedIncome
      || input.companyUsesOtherTaxIncentive || input.companyHasDisqualifyingRelatedParty)) };
}
