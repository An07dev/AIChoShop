
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import VipPlansManager from "./VipPlansManager";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cấu Hình Bảng Giá & Gói VIP",
  description: "Cấu hình giá cước, thời hạn và quyền lợi các gói VIP trên hệ thống AIChoShop.",
};

export default async function AdminVipPlansPage() {
  await requireAdmin();
  const plans = await prisma.vipPlan.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <VipPlansManager initialPlans={JSON.parse(JSON.stringify(plans))} />
    </div>
  );
}
