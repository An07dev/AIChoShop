import { prisma } from "@/lib/prisma";
import type { VipPlanItem } from "@/lib/vip-plans";

// Reads never recreate plans that an administrator disabled or removed.
export async function getActiveVipPlans(): Promise<VipPlanItem[]> {
  return prisma.vipPlan.findMany({ where: { active: true }, orderBy: { order: "asc" } });
}
