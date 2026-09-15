export type Platform = "shopee" | "tiktok" | "external";
export type ExternalSalesChannel = "facebook" | "website" | "youtube" | "other";
export type ShopType = "marketplace" | "mall";
export type CostMode = "percent" | "fixed";
export type TaxMode = "household_exempt" | "household_revenue" | "profit_based" | "manual";

export type OfficialFeeCategory = {
  id: string; platform: Platform; industry: string;
  level1: string; level2: string; level3: string;
  marketplaceRate: number | null; mallRate: number | null;
};

export type FeeProgram = {
  id: string; name: string; rate: number; cap: number | null;
  defaultEnabled: boolean; note: string;
};

export type PlatformFeeProfile = {
  platform: Platform; shopType: ShopType; categoryId: string;
  commissionRate: number; transactionRate: number; orderProcessingFee: number;
  effectiveFrom: string; effectiveTo?: string; verifiedAt: string;
  sourceName: string; sourceUrl: string;
  specificity: "representative" | "exact"; note: string;
};

export type PricingInput = {
  platform: Platform; externalChannel: ExternalSalesChannel; shopType: ShopType; categoryId: string;
  quantity: number; costPerUnit: number; packagingCost: number; handlingCost: number;
  overheadCost: number; sellerShippingCost: number; buyerShippingFee: number;
  platformDiscount: number; sellerDiscountRate: number; affiliateRate: number;
  marketingMode: CostMode; marketingValue: number;
  commissionOverride: number | null; transactionOverride: number | null;
  fixedFeeOverride: number | null; enabledProgramIds: string[];
  taxMode: TaxMode; taxableRevenueShare: number; manualRevenueTaxRate: number;
  profitTaxRate: number; cancellationRate: number; cancellationCost: number;
  deliveryFailureRate: number; returnRate: number; returnShippingCost: number;
  nonRefundableReturnFee: number; returnedInventoryRecoveryRate: number; damageRate: number;
};

export type Target = { mode: "margin" | "fixed"; value: number; roundingStep: number };
export type AppliedFee = { id: string; name: string; base: number; rate: number | null; amount: number; note?: string };
export type ScenarioWeights = { success: number; cancelled: number; deliveryFailed: number; returned: number };

export type PriceEvaluation = {
  listPrice: number; productRevenue: number; customerProductPayment: number; customerPayment: number;
  payout: number; fees: AppliedFee[]; platformFees: number; affiliateCost: number;
  marketingCost: number; revenueTax: number; profitTax: number; tax: number; cogs: number;
  operatingCosts: number; profitOnSuccess: number; returnLoss: number;
  deliveryFailureLoss: number; cancellationLoss: number; expectedProfitPerOrder: number;
  expectedRevenuePerOrder: number; expectedMargin: number; roiOnCogs: number;
  breakEvenRoas: number | null; maximumMarketingCost: number; weights: ScenarioWeights;
  warnings: string[];
};

export type PricingResult = {
  evaluation: PriceEvaluation; breakEvenPrice: number | null; targetPrice: number | null;
  feasible: boolean; error?: string;
};

export type FeeOverrideRecord = {
  id: string; platform: Platform; shopType: ShopType; categoryId: string;
  commissionRate: number | null; transactionRate: number | null;
  orderProcessingFee: number | null; effectiveFrom: string; effectiveTo: string | null;
  sourceName: string; sourceUrl: string | null; note: string | null;
};

export type ResolvedFeeProfile = PlatformFeeProfile & {
  overrideId: string | null;
  dataVersion: string;
};
