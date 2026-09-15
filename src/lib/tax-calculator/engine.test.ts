import test from "node:test";
import assert from "node:assert/strict";
import { calculateEcommerceTax, TAX_RULE_VERSION } from "./engine.ts";
import type { TaxCalculatorInput } from "./types.ts";

const base: TaxCalculatorInput = {
  taxYear: 2026, payerType: "household", activity: "goods",
  activityRevenues: { goods: 0, services: 0, production: 0, digital: 0, other: 0 },
  personalIncomeMethod: "revenue", residencyStatus: "resident", personalPreviousYearRevenue: 0,
  profitMethodStartYear: null, shopeeRevenue: 0, tiktokRevenue: 0, otherPlatformRevenue: 0,
  directRevenue: 0, platformFees: 0, deductibleCosts: 0, otherTaxableIncome: 0, carriedLoss: 0,
  withheldVat: 0, withheldIncomeTax: 0, companyPreviousYearRevenue: 2_000_000_000,
  companyPreviousYearOperatingMonths: 12, companyHasPreviousYearData: false, companyIsNewThisYear: false,
  companyHasDisqualifyingRelatedParty: false, companyVatRate: 10, deductibleInputVat: 0,
  companyIsSme: false, companyFirstRegistrationYear: null, companyCreatedFromReorganization: false,
  companyControllerHasPriorBusiness: false, companyHasExcludedIncome: false,
  companyUsesOtherTaxIncentive: false,
};

const goodsRevenue = (value: number): TaxCalculatorInput => ({
  ...base, shopeeRevenue: value,
  activityRevenues: { ...base.activityRevenues, goods: value },
});

test("hộ kinh doanh không quá 1 tỷ được miễn cả GTGT và TNCN", () => {
  const result = calculateEcommerceTax(goodsRevenue(1_000_000_000));
  assert.equal(result.vatExempt, true);
  assert.equal(result.incomeTaxExempt, true);
  assert.equal(result.totalTax, 0);
  assert.equal(result.ruleVersion, TAX_RULE_VERSION);
});

test("không áp dụng đề xuất giảm 30% và chỉ trừ ngưỡng khi tính TNCN", () => {
  const result = calculateEcommerceTax({ ...goodsRevenue(2_000_000_000), applyIncomeTaxReduction: true });
  assert.equal(result.vat, 20_000_000);
  assert.equal(result.taxableIncomeBase, 1_000_000_000);
  assert.equal(result.incomeTax, 5_000_000);
  assert.equal(result.incomeTaxReduction, 0);
  assert.match(result.warnings.join(" "), /Không áp dụng giảm 30%/);
});

test("nhiều hoạt động được tách đúng thuế suất", () => {
  const result = calculateEcommerceTax({
    ...base, shopeeRevenue: 1_000_000_000, tiktokRevenue: 1_000_000_000,
    activityRevenues: { ...base.activityRevenues, goods: 1_000_000_000, services: 1_000_000_000 },
  });
  assert.equal(result.vat, 60_000_000);
  assert.equal(result.incomeTax, 12_500_000);
  assert.equal(result.activityBreakdown.filter((row) => row.revenue > 0).length, 2);
});

test("phương pháp TNCN dùng doanh thu tham chiếu năm trước", () => {
  const result = calculateEcommerceTax({
    ...goodsRevenue(2_000_000_000), personalPreviousYearRevenue: 4_000_000_000,
    deductibleCosts: 1_000_000_000,
  });
  assert.equal(result.effectivePersonalMethod, "profit");
  assert.equal(result.incomeTaxRate, 15);
  assert.equal(result.incomeTax, 150_000_000);
});

test("vượt 3 tỷ trong năm hiện tại không tự đổi sai phương pháp ngay trong năm", () => {
  const result = calculateEcommerceTax(goodsRevenue(4_000_000_000));
  assert.equal(result.effectivePersonalMethod, "revenue");
  assert.match(result.warnings.join(" "), /kỳ tiếp theo/);
});

test("doanh nghiệp doanh thu tham chiếu không quá 1 tỷ chỉ miễn TNDN, không miễn GTGT", () => {
  const result = calculateEcommerceTax({
    ...goodsRevenue(2_000_000_000), payerType: "company", companyPreviousYearRevenue: 800_000_000, companyHasPreviousYearData: true,
    deductibleCosts: 1_000_000_000, deductibleInputVat: 50_000_000,
  });
  assert.equal(result.incomeTaxExempt, true);
  assert.equal(result.vatExempt, false);
  assert.equal(result.incomeTax, 0);
  assert.equal(result.vat, 150_000_000);
});

test("không tự miễn TNDN khi chưa xác nhận dữ liệu doanh thu tham chiếu", () => {
  const result = calculateEcommerceTax({ ...goodsRevenue(800_000_000), payerType: "company" });
  assert.equal(result.incomeTaxExempt, false);
  assert.equal(result.requiresProfessionalReview, true);
  assert.match(result.warnings.join(" "), /Chưa xác nhận dữ liệu/);
});

test("doanh thu năm trước chưa đủ 12 tháng được quy đổi", () => {
  const result = calculateEcommerceTax({
    ...goodsRevenue(2_000_000_000), payerType: "company", companyPreviousYearRevenue: 600_000_000,
    companyPreviousYearOperatingMonths: 6, companyHasPreviousYearData: true, deductibleCosts: 1_000_000_000,
  });
  assert.equal(result.annualizedCompanyReferenceRevenue, 1_200_000_000);
  assert.equal(result.incomeTaxExempt, false);
  assert.equal(result.incomeTax, 150_000_000);
});

test("bên liên kết không đủ điều kiện chặn miễn TNDN theo doanh thu", () => {
  const result = calculateEcommerceTax({
    ...goodsRevenue(2_000_000_000), payerType: "company", companyPreviousYearRevenue: 800_000_000,
    companyHasPreviousYearData: true, companyHasDisqualifyingRelatedParty: true, deductibleCosts: 1_000_000_000,
  });
  assert.equal(result.incomeTaxExempt, false);
  assert.equal(result.incomeTax, 150_000_000);
  assert.equal(result.requiresProfessionalReview, true);
});

test("miễn TNDN ba năm cho SME bị chặn khi có thu nhập loại trừ", () => {
  const eligible = calculateEcommerceTax({
    ...goodsRevenue(2_000_000_000), payerType: "company", companyPreviousYearRevenue: 2_000_000_000,
    companyHasPreviousYearData: true, companyIsSme: true, companyFirstRegistrationYear: 2025, deductibleCosts: 1_000_000_000,
  });
  const excluded = calculateEcommerceTax({
    ...goodsRevenue(2_000_000_000), payerType: "company", companyPreviousYearRevenue: 2_000_000_000,
    companyHasPreviousYearData: true, companyIsSme: true, companyFirstRegistrationYear: 2025, companyHasExcludedIncome: true,
    deductibleCosts: 1_000_000_000,
  });
  assert.equal(eligible.incomeTaxExempt, true);
  assert.equal(excluded.incomeTaxExempt, false);
});

test("chặn năm chưa có bộ quy tắc và doanh thu nhóm ngành không khớp", () => {
  const result = calculateEcommerceTax({ ...goodsRevenue(2_000_000_000), taxYear: 2027,
    activityRevenues: { ...base.activityRevenues, goods: 1_900_000_000 } });
  assert.equal(result.validationErrors.length, 2);
  assert.equal(result.totalTax, 0);
});

test("thuế đã khấu trừ được đối chiếu riêng phần phải nộp và nộp thừa", () => {
  const result = calculateEcommerceTax({ ...goodsRevenue(2_000_000_000), withheldVat: 12_000_000,
    withheldIncomeTax: 6_000_000 });
  assert.equal(result.remainingVat, 8_000_000);
  assert.equal(result.remainingIncomeTax, 0);
  assert.equal(result.potentialRefundOrOffset, 1_000_000);
});
