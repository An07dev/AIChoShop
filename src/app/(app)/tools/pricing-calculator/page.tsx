import PricingCalculatorClient from "./PricingCalculatorClient";
import { prisma } from "@/lib/prisma";
import type { FeeOverrideRecord } from "@/lib/pricing/types";

export default async function PricingCalculatorPage() {
  let feeOverrides: FeeOverrideRecord[] = [];
  try {
    const now = new Date();
    const rows = await prisma.pricingFeeOverride.findMany({
      where: { active: true, effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] },
      orderBy: { effectiveFrom: "desc" },
    });
    feeOverrides = rows.map((row) => ({
      id: row.id, platform: row.platform as FeeOverrideRecord["platform"],
      shopType: row.shopType as FeeOverrideRecord["shopType"], categoryId: row.categoryId,
      commissionRate: row.commissionRate, transactionRate: row.transactionRate,
      orderProcessingFee: row.orderProcessingFee, effectiveFrom: row.effectiveFrom.toISOString(),
      effectiveTo: row.effectiveTo?.toISOString() ?? null, sourceName: row.sourceName,
      sourceUrl: row.sourceUrl, note: row.note,
    }));
  } catch (error) {
    console.warn("Không tải được biểu phí quản trị, dùng dữ liệu tích hợp:", error);
  }
  return <PricingCalculatorClient feeOverrides={feeOverrides} />;
}
