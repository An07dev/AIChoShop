
import { requireAdmin } from "@/lib/auth/session";
import { Metadata } from "next";
import { getSystemSettings } from "@/lib/system-settings";
import { SystemSettingsManager } from "@/components/admin/SystemSettingsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cài Đặt Hệ Thống & OpenAI API Key",
  description: "Cấu hình OpenAI API Key (Token), mô hình AI và các thiết lập toàn hệ thống lưu trữ trực tiếp trong Database.",
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();

  return (
    <SystemSettingsManager
      initialSettings={{
        id: settings.id,
        configured: Boolean(settings.openaiApiKey || process.env.OPENAI_API_KEY),
        openaiModel: settings.openaiModel,
        openaiBaseUrl: settings.openaiBaseUrl,
        isOpenAiActive: settings.isOpenAiActive,
      }}
    />
  );
}
