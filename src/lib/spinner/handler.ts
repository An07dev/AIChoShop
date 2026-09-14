import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/system-settings";
import { SpinnerError, validateRequest } from "./contract";
import { generateVariants, schema, PartialSpinnerError } from "./generate";

export async function handleSpinner(req: Request, body: unknown) {
  try {
    const origin = req.headers.get("origin");
    if ((origin && origin !== new URL(req.url).origin) || req.headers.get("sec-fetch-site") === "cross-site") throw new SpinnerError("Nguồn yêu cầu không hợp lệ.", 403);
    const request = validateRequest(body);
    const settings = await getSystemSettings();
    const local = !settings.isOpenAiActive;
    const apiKey = local ? "ollama" : settings.openaiApiKey?.trim() || process.env.OPENAI_API_KEY?.trim();
    if (!apiKey || apiKey === "dummy") throw new SpinnerError("Dịch vụ AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.", 503);
    const baseURL = local ? process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1" : settings.openaiBaseUrl?.trim() || undefined;
    const model = local ? process.env.OLLAMA_MODEL || "qwen2.5:7b" : settings.openaiModel || process.env.OPENAI_MODEL || "gpt-4o-mini";
    const official = !local && (!baseURL || new URL(baseURL).hostname === "api.openai.com");
    const client = new OpenAI({ apiKey, baseURL, timeout: 55_000, maxRetries: 0 });
    const signal = AbortSignal.any([req.signal, AbortSignal.timeout(110_000)]);
    let format: "schema" | "json" | "prompt" = official ? "schema" : "json";
    const variants = await generateVariants(request, async prompt => {
      const run = () => client.chat.completions.create({
        model,
        messages: [{ role: "system", content: "Bạn là biên tập viên nội dung sản phẩm. Tuân thủ dữ liệu thực tế và trả JSON." }, { role: "user", content: prompt }],
        ...(local ? { max_tokens: 9000, temperature: 0.5 } : { max_completion_tokens: 9000 }),
        ...(format === "schema" ? { response_format: { type: "json_schema" as const, json_schema: { name: "product_variants", strict: true, schema } } } : format === "json" ? { response_format: { type: "json_object" as const } } : {}),
      }, { signal });
      let completion;
      try { completion = await run(); }
      catch (error) {
        if (error instanceof OpenAI.APIError && error.status === 400 && /response_format|json_schema|json_object/i.test(error.message) && format !== "prompt") {
          format = "prompt";
          completion = await run();
        } else throw error;
      }
      const choice = completion.choices[0];
      return { content: choice?.message.content ?? null, finished: choice?.finish_reason === "stop", refused: !!choice?.message.refusal };
    });
    return NextResponse.json({ success: true, data: variants }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof PartialSpinnerError) return NextResponse.json({ success: true, data: error.variants, partial: true, warning: error.message }, { headers: { "Cache-Control": "no-store" } });
    let message = "Dịch vụ AI đang tạm gián đoạn. Vui lòng thử lại sau.";
    let status = 503;
    if (error instanceof SpinnerError) { message = error.message; status = error.status; }
    else if (error instanceof OpenAI.APIConnectionTimeoutError || error instanceof OpenAI.APIUserAbortError || (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name))) { message = "AI xử lý quá lâu. Hãy thử 5 phiên bản hoặc rút gọn mô tả."; status = 504; }
    else if (error instanceof OpenAI.APIConnectionError) message = "Không kết nối được dịch vụ AI. Nếu dùng Ollama, hãy kiểm tra ứng dụng Ollama đang chạy trên máy chủ.";
    else if (error instanceof OpenAI.APIError) {
      if ([400, 401, 403, 404].includes(error.status ?? 0)) message = "Model hoặc cấu hình kết nối AI chưa hợp lệ. Vui lòng liên hệ quản trị viên.";
      else if (error.status === 429) message = "Dịch vụ AI đang quá tải hoặc hết hạn mức. Vui lòng thử lại sau.";
    }
    return NextResponse.json({ success: false, error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
