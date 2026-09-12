import { NextResponse } from "next/server";
import { getSystemSettings, updateSystemSettings } from "@/lib/system-settings";

// GET /api/settings/openai - Gọi field token và cấu hình OpenAI để sử dụng
export async function GET() {
  try {
    const settings = await getSystemSettings();
    const token = settings.openaiApiKey || process.env.OPENAI_API_KEY?.trim().replace(/^["']|["']$/g, "") || "";

    return NextResponse.json({
      success: true,
      token: token,
      apiKey: token,
      model: settings.openaiModel || "gpt-4o-mini",
      isOpenAiActive: settings.isOpenAiActive,
      baseURL: settings.openaiBaseUrl || null,
      configured: Boolean(token && token.length > 5),
    });
  } catch (error: any) {
    console.error("GET /api/settings/openai error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể lấy cấu hình OpenAI",
        token: "",
        apiKey: "",
      },
      { status: 500 }
    );
  }
}

// POST /api/settings/openai - Lưu token / apiKey vào Database
export async function POST(req: Request) {
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
    });

    const finalToken = updated.openaiApiKey || "";

    return NextResponse.json({
      success: true,
      message: "Lưu cấu hình OpenAI thành công",
      token: finalToken,
      apiKey: finalToken,
      model: updated.openaiModel,
      isOpenAiActive: updated.isOpenAiActive,
      baseURL: updated.openaiBaseUrl,
      configured: Boolean(finalToken && finalToken.length > 5),
    });
  } catch (error: any) {
    console.error("POST /api/settings/openai error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Lỗi hệ thống khi lưu cấu hình OpenAI",
      },
      { status: 500 }
    );
  }
}
