import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getAiUnitEconomics } from "@/lib/ai-economics";
import { AiCostsManager } from "@/components/admin/AiCostsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Báo Cáo Chi Phí Token & Unit Economics | AIChoShop Admin",
  description: "Đo lường chi phí OpenAI thực tế theo từng công cụ và từng user VIP để kiểm soát biên lợi nhuận.",
};

export default async function AdminAiCostsPage() {
  await requireAdmin("AdminAiCostsPage");
  const initialData = await getAiUnitEconomics("30d");

  return <AiCostsManager initialData={initialData} />;
}
