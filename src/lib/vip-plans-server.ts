import { prisma } from "@/lib/prisma";
import { DEFAULT_VIP_PLANS, VipPlanItem } from "@/lib/vip-plans";

/**
 * Lấy danh sách gói VIP đang hoạt động, nếu DB chưa có gói nào sẽ tự khởi tạo 3 gói mặc định
 */
export async function getActiveVipPlans(): Promise<VipPlanItem[]> {
  const existing = await prisma.vipPlan.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  if (existing.length > 0) {
    return existing as VipPlanItem[];
  }

  // Khởi tạo tự động nếu DB chưa có
  for (const plan of DEFAULT_VIP_PLANS) {
    const { id, createdAt, updatedAt, ...planData } = plan;
    await prisma.vipPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: planData,
    });
  }

  const seeded = await prisma.vipPlan.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  return seeded as VipPlanItem[];
}
