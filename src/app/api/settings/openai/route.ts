import { dataErrorResponse } from "@/lib/db-errors";
import { auditOutcome } from "@/lib/auth/audit-operations";
import { adminRouteGuard, requireAdmin } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { getSystemSettings, updateSystemSettings } from "@/lib/system-settings";

// Admin-only metadata. Provider credentials are never returned to the browser.
export async function GET() {
  const denial = await adminRouteGuard();
  if (denial) return denial;
  try {
    const settings = await getSystemSettings();
    const token = settings.openaiApiKey || process.env.OPENAI_API_KEY?.trim().replace(/^["']|["']$/g, "") || "";

    return NextResponse.json({
      success: true,


      model: settings.openaiModel || "gpt-4o-mini",
      isOpenAiActive: settings.isOpenAiActive,
      baseURL: settings.openaiBaseUrl || null,
      configured: Boolean(token && token.length > 5),
    });
  } catch (error) {
    return dataErrorResponse(error, "app/api/settings/openai/route.ts");
  }
}

// POST /api/settings/openai - Lưu token / apiKey vào Database
export async function POST(req: Request) {
  const denial = await adminRouteGuard(req);
  if (denial) return denial;
  const auditAdmin = await requireAdmin("POST /api/settings/openai");
  return auditOutcome(auditAdmin.id, "POST /api/settings/openai", async () => {

  try {
    const body = await req.json();
    const {
      token,
      apiKey,
      openaiApiKey,
      model,
      openaiModel,
      baseURL,
      baseUrl,
      openaiBaseUrl,
      isOpenAiActive,
    } = body;

    // Chấp nhận nhiều định dạng tên field: token, apiKey, openaiApiKey
    const resolvedKey = token !== undefined ? token : apiKey !== undefined ? apiKey : openaiApiKey;
    const resolvedModel = model || openaiModel;
    const resolvedBaseUrl = baseURL !== undefined ? baseURL : baseUrl !== undefined ? baseUrl : openaiBaseUrl;

    const updated = await updateSystemSettings({
      ...(resolvedKey !== undefined && { openaiApiKey: resolvedKey }),
      ...(resolvedModel !== undefined && { openaiModel: resolvedModel }),
      ...(resolvedBaseUrl !== undefined && { openaiBaseUrl: resolvedBaseUrl }),
      ...(isOpenAiActive !== undefined && { isOpenAiActive: Boolean(isOpenAiActive) }),
    }, auditAdmin.id);

    const finalToken = updated.openaiApiKey || "";

    return NextResponse.json({
      success: true,
      message: "Lưu cấu hình OpenAI thành công",


      model: updated.openaiModel,
      isOpenAiActive: updated.isOpenAiActive,
      baseURL: updated.openaiBaseUrl,
      configured: Boolean(finalToken && finalToken.length > 5),
    });
  } catch (error) {
    return dataErrorResponse(error, "app/api/settings/openai/route.ts");
  }

  });
}
