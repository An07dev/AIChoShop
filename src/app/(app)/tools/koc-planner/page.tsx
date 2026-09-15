import KocPlannerClient from "./KocPlannerClient";
import { loadCurrentFeeOverrides } from "@/lib/pricing/fee-overrides-server";
import type { FeeOverrideRecord } from "@/lib/pricing/types";

export default async function KocPlannerPage() {
  let feeOverrides: FeeOverrideRecord[] = [];
  let feeLoadWarning = false;
  try { feeOverrides = await loadCurrentFeeOverrides(); }
  catch (error) { feeLoadWarning = true; console.warn("Không tải được biểu phí quản trị cho KOC:", error); }
  return <KocPlannerClient feeOverrides={feeOverrides} feeLoadWarning={feeLoadWarning} />;
}
