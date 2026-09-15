import PricingCalculatorClient from "./PricingCalculatorClient";
import { loadCurrentFeeOverrides } from "@/lib/pricing/fee-overrides-server";
import type { FeeOverrideRecord } from "@/lib/pricing/types";

export default async function PricingCalculatorPage() {
  let feeOverrides: FeeOverrideRecord[] = [];
  let feeLoadWarning = false;
  try {
    feeOverrides = await loadCurrentFeeOverrides();
  } catch (error) {
    feeLoadWarning = true;
    console.warn("Không tải được biểu phí quản trị, dùng dữ liệu tích hợp:", error);
  }
  return <PricingCalculatorClient feeOverrides={feeOverrides} feeLoadWarning={feeLoadWarning} />;
}
