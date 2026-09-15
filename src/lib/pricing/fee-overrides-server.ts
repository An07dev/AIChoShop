import { prisma } from "@/lib/prisma";
import type { FeeOverrideRecord } from "./types";

export async function loadCurrentFeeOverrides(at = new Date()): Promise<FeeOverrideRecord[]> {
  const rows = await prisma.pricingFeeOverride.findMany({
    where: { active: true, effectiveFrom: { lte: at }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }] },
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
    select: { id: true, platform: true, shopType: true, categoryId: true, commissionRate: true,
      transactionRate: true, orderProcessingFee: true, effectiveFrom: true, effectiveTo: true,
      sourceName: true, sourceUrl: true, note: true },
  });
  return rows.map((row) => ({ ...row,
    platform: row.platform as FeeOverrideRecord["platform"], shopType: row.shopType as FeeOverrideRecord["shopType"],
    effectiveFrom: row.effectiveFrom.toISOString(), effectiveTo: row.effectiveTo?.toISOString() ?? null,
  }));
}
