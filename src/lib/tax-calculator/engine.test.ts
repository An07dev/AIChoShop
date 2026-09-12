import test from "node:test";
import assert from "node:assert/strict";
import { calculateEcommerceTax } from "./engine.ts";
import type { TaxCalculatorInput } from "./types.ts";

const base: TaxCalculatorInput = {
  taxYear: 2026, payerType: "household", activity: "goods", personalIncomeMethod: "revenue",
  shopeeRevenue: 0, tiktokRevenue: 0, otherPlatformRevenue: 0, directRevenue: 0,
  platformFees: 0, deductibleCosts: 0, otherTaxableIncome: 0, carriedLoss: 0,
  withheldVat: 0, withheldIncomeTax: 0, companyPreviousYearRevenue: 0,
  companyVatRate: 10, deductibleInputVat: 0, applyIncomeTaxReduction: true,
};

test("hộ kinh doanh không quá 1 tỷ đồng được miễn GTGT và TNCN", () => {
  const result = calculateEcommerceTax({ ...base, shopeeRevenue: 1_000_000_000 });
  assert.equal(result.isExempt, true);
  assert.equal(result.totalTax, 0);
});

test("bán hàng hóa theo doanh thu chỉ trừ ngưỡng 1 tỷ khi tính TNCN", () => {
  const result = calculateEcommerceTax({ ...base, shopeeRevenue: 2_000_000_000 });
  assert.equal(result.vat, 20_000_000);
  assert.equal(result.taxableIncomeBase, 1_000_000_000);
  assert.equal(result.incomeTaxBeforeReduction, 5_000_000);
  assert.equal(result.incomeTaxReduction, 1_500_000);
  assert.equal(result.incomeTax, 3_500_000);
});

test("doanh thu trên 3 tỷ bắt buộc tính TNCN theo thu nhập", () => {
  const result = calculateEcommerceTax({ ...base, shopeeRevenue: 4_000_000_000,
    deductibleCosts: 3_000_000_000, applyIncomeTaxReduction: false });
  assert.equal(result.effectivePersonalMethod, "profit");
  assert.equal(result.incomeTaxRate, 17);
  assert.equal(result.incomeTax, 170_000_000);
});

test("doanh nghiệp tính GTGT khấu trừ và TNDN theo lợi nhuận", () => {
  const result = calculateEcommerceTax({ ...base, payerType: "company", shopeeRevenue: 2_000_000_000,
    companyPreviousYearRevenue: 2_000_000_000, deductibleCosts: 1_000_000_000,
    deductibleInputVat: 50_000_000 });
  assert.equal(result.vat, 150_000_000);
  assert.equal(result.incomeTaxRate, 15);
  assert.equal(result.incomeTax, 105_000_000);
  assert.equal(result.totalTax, 255_000_000);
});

test("thuế sàn đã khấu trừ làm giảm số còn phải nộp", () => {
  const result = calculateEcommerceTax({ ...base, shopeeRevenue: 2_000_000_000,
    withheldVat: 12_000_000, withheldIncomeTax: 4_000_000 });
  assert.equal(result.remainingVat, 8_000_000);
  assert.equal(result.remainingIncomeTax, 0);
  assert.equal(result.potentialRefundOrOffset, 500_000);
});
