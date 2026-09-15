export type TaxPayerType = "household" | "individual" | "company";
export type BusinessActivity = "goods" | "services" | "production" | "digital" | "other";
export type PersonalIncomeMethod = "revenue" | "profit";
export type TaxResidencyStatus = "resident" | "nonresident" | "unknown";
export type ActivityRevenues = Record<BusinessActivity, number>;

export type TaxCalculatorInput = {
  taxYear: number; payerType: TaxPayerType;
  /** Nhóm ngành cũ, chỉ dùng để đọc lịch sử trước khi hỗ trợ đa hoạt động. */
  activity: BusinessActivity;
  activityRevenues: ActivityRevenues;
  personalIncomeMethod: PersonalIncomeMethod;
  residencyStatus: TaxResidencyStatus;
  personalPreviousYearRevenue: number;
  profitMethodStartYear: number | null;
  shopeeRevenue: number; tiktokRevenue: number; otherPlatformRevenue: number; directRevenue: number;
  platformFees: number; deductibleCosts: number; otherTaxableIncome: number; carriedLoss: number;
  withheldVat: number; withheldIncomeTax: number;
  companyPreviousYearRevenue: number; companyPreviousYearOperatingMonths: number; companyHasPreviousYearData: boolean;
  companyIsNewThisYear: boolean; companyHasDisqualifyingRelatedParty: boolean;
  companyVatRate: number; deductibleInputVat: number;
  companyIsSme: boolean; companyFirstRegistrationYear: number | null;
  companyCreatedFromReorganization: boolean; companyControllerHasPriorBusiness: boolean;
  companyHasExcludedIncome: boolean; companyUsesOtherTaxIncentive: boolean;
  /** Trường lịch sử cũ; không còn dùng vì giảm 30% chưa phải chính sách có hiệu lực. */
  applyIncomeTaxReduction?: boolean;
};

export type ActivityTaxBreakdown = {
  activity: BusinessActivity; label: string; revenue: number;
  vatRate: number; vat: number; pitRate: number; pitTaxableRevenue: number; pit: number;
};
export type TaxSource = { label: string; url: string };

export type TaxCalculatorResult = {
  totalRevenue: number; activityRevenueTotal: number;
  isExempt: boolean; vatExempt: boolean; incomeTaxExempt: boolean;
  incomeTaxExemptionReason: string | null;
  effectivePersonalMethod: PersonalIncomeMethod;
  vatRate: number; vat: number; incomeTaxRate: number; taxableIncomeBase: number;
  incomeTaxBeforeReduction: number; incomeTaxReduction: number; incomeTax: number; totalTax: number;
  remainingVat: number; remainingIncomeTax: number; remainingPayable: number;
  overpaidVat: number; overpaidIncomeTax: number; potentialRefundOrOffset: number;
  netCashAfterTaxAndPlatformFees: number; effectiveTaxRate: number; platformFeeRate: number; netRate: number;
  reductionEligible: boolean; annualizedCompanyReferenceRevenue: number;
  activityBreakdown: ActivityTaxBreakdown[]; ruleVersion: string; sources: TaxSource[];
  validationErrors: string[]; warnings: string[]; requiresProfessionalReview: boolean;
};
