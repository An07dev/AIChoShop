import { prisma } from "@/lib/prisma";
import { DEFAULT_VIP_PLANS } from "@/lib/vip-plans";
import VipPlansManager from "./VipPlansManager";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cấu Hình Bảng Giá & Gói VIP",
  description: "Cấu hình giá cước, thời hạn và quyền lợi các gói VIP trên hệ thống AIChoShop.",
};

export default async function AdminVipPlansPage() {
  let plans = await prisma.vipPlan.findMany({
    orderBy: { order: "asc" },
  });

  // Tự khởi tạo 3 gói chuẩn nếu bảng chưa có dữ liệu
  if (plans.length === 0) {
    for (const plan of DEFAULT_VIP_PLANS) {
      await prisma.vipPlan.upsert({
        where: { slug: plan.slug },
        update: {},
        create: plan,
      });
    }
    plans = await prisma.vipPlan.findMany({
      orderBy: { order: "asc" },
    });
  }

  return (
    <div className="max-w-7xl mx-auto">
      <VipPlansManager initialPlans={JSON.parse(JSON.stringify(plans))} />
    </div>
  );
}
