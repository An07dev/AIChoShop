import { classifyDatabaseError } from "@/lib/db-errors";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSystemSettings } from "@/lib/system-settings";
import { prisma } from "@/lib/prisma";
import { reserveAi, completeAi, releaseAi } from "@/lib/ai-quota";
import { isVipActive } from "@/lib/vip-expiration";
import { getAiUsageStats } from "@/lib/ai-usage";
import { SeoError, SEO_SCHEMA, validateSeoInputs } from "./contract";
import { generateSeo } from "./generate";
import { finishSeo, reserveSeo, seoIdentity, type RunMetrics } from "./usage";
import { isAllowedOrigin } from "@/lib/http/origin";

function publicError(error: unknown): SeoError {
  if (error instanceof SeoError) return error;
  const database = classifyDatabaseError(error);
  if (database) return new SeoError(database.code, database.message, database.status);
  if (error instanceof OpenAI.APIConnectionTimeoutError || (error instanceof Error && error.name === "AbortError")) return new SeoError("TIMEOUT", "AI xử lý quá lâu. Vui lòng thử lại; lượt dùng chưa bị trừ.", 504);
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401 || error.status === 403) return new SeoError("AI_CONFIG_ERROR", "Cấu hình kết nối AI chưa hợp lệ. Vui lòng liên hệ quản trị viên.", 503);
    if (error.status === 429) return new SeoError("AI_BUSY", "Dịch vụ AI đang quá tải hoặc hết hạn mức. Vui lòng thử lại sau.", 503);
    if (error.status === 400 || error.status === 404) return new SeoError("AI_CONFIG_ERROR", "Model AI hoặc cấu hình đầu ra chưa được hỗ trợ. Vui lòng liên hệ quản trị viên.", 503);
    return new SeoError("AI_UNAVAILABLE", "Chưa kết nối được dịch vụ AI. Vui lòng thử lại sau.", 503);
  }
  return new SeoError("SERVICE_UNAVAILABLE", "Dịch vụ đang tạm gián đoạn. Vui lòng thử lại sau.", 503);
}

export async function handleSeo(req: Request, rawInputs: unknown) {
  const started = Date.now();
  let runId: string | undefined;
  let subject = "";
  let lease: string | undefined;
  const metrics: RunMetrics = { model: "", provider: "", inputTokens: 0, outputTokens: 0, durationMs: 0 };
  try {
    if (!isAllowedOrigin(req)) {
      throw new SeoError("INVALID_ORIGIN", "Yêu cầu không hợp lệ.", 403);
    }
    const inputs = validateSeoInputs(rawInputs);
    const identity = await seoIdentity();
    subject = identity.id;

    const currentUser = identity.userId ? await prisma.user.findUnique({ where: { id: identity.userId }, select: { id: true, isVIP: true, vipExpiresAt: true, isLocked: true } }) : null;
    if (currentUser) currentUser.isVIP = isVipActive(currentUser);
    if (currentUser?.isLocked) throw new SeoError("ACCOUNT_LOCKED", "Tài khoản đang bị khóa.", 403);
    runId = await reserveSeo(identity);
    lease = await reserveAi(identity.userId ?? null, identity.id);
    const config = await getSystemSettings();
    const isOpenAI = config.isOpenAiActive;
    metrics.provider = isOpenAI ? "openai" : "ollama";
    metrics.model = isOpenAI ? config.openaiModel?.trim() || process.env.OPENAI_MODEL || "gpt-4o-mini" : process.env.OLLAMA_MODEL || "qwen2.5:7b";
    const apiKey = isOpenAI ? config.openaiApiKey?.trim() || process.env.OPENAI_API_KEY?.trim() : "ollama";
    if (!apiKey || apiKey === "dummy") throw new SeoError("AI_CONFIG_ERROR", "Dịch vụ AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.", 503);
    const baseURL = isOpenAI ? config.openaiBaseUrl?.trim() || undefined : process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1";
    const client = new OpenAI({ apiKey, baseURL, timeout: 45_000, maxRetries: 0 });
    const signal = AbortSignal.timeout(100_000);
    // Strict schema for the official API; compatible gateways/Ollama use JSON mode plus the same validator.
    let format: "schema" | "json" | "prompt" = isOpenAI && (!baseURL || new URL(baseURL).hostname === "api.openai.com") ? "schema" : "json";
    const output = await generateSeo(inputs, async prompt => {
      const request = () => client.chat.completions.create({
        model: metrics.model,
        messages: [{ role: "system", content: prompt }],
        ...(isOpenAI ? { max_completion_tokens: 3500 } : { max_tokens: 3500, temperature: 0.3 }),
        ...(format === "schema" ? { response_format: { type: "json_schema" as const, json_schema: { name: "seo_result", strict: true, schema: SEO_SCHEMA } } } :
          format === "json" ? { response_format: { type: "json_object" as const } } : {}),
      }, { signal });
      let completion;
      try { completion = await request(); }
      catch (error) {
        // Some compatible providers lack response_format; do not retry authentication/quota errors.
        if (error instanceof OpenAI.APIError && error.status === 400 && /response_format|json_schema|json_object/i.test(error.message) && format !== "prompt") {
          format = "prompt";
          completion = await request();
        } else throw error;
      }
      const choice = completion.choices[0];
      return { content: choice?.message.content ?? null, finishReason: choice?.finish_reason ?? "", refused: !!choice?.message.refusal,
        inputTokens: completion.usage?.prompt_tokens ?? 0, outputTokens: completion.usage?.completion_tokens ?? 0 };
    }, (input, outputTokens) => { metrics.inputTokens += input; metrics.outputTokens += outputTokens; });
    metrics.durationMs = Date.now() - started;
    let successes = 0;
    await completeAi(
      lease,
      {
        userId: identity.userId ?? null,
        tool: "seo-optimizer",
        toolName: "AI Tối Ưu SEO",
        action: inputs?.productName
          ? `Tối ưu SEO & Hashtag cho "${inputs.productName}"`
          : "Tối ưu SEO & Hashtag sản phẩm",
        input: inputs,
        output: JSON.stringify(output),
        model: metrics.model,
        inputTokens: metrics.inputTokens,
        outputTokens: metrics.outputTokens,
      },
      async tx => {
        successes = await finishSeo(subject, runId!, true, metrics, null, tx);
      }
    );
    lease = undefined;
    runId = undefined;
    const updatedStats = currentUser && !currentUser.isVIP ? await getAiUsageStats(currentUser.id).catch(() => null) : null;

    return NextResponse.json({
      success: true,
      data: output,
      remaining: currentUser
        ? (currentUser.isVIP ? null : updatedStats?.remainingFree)
        : (identity.anonymous ? Math.max(0, 2 - successes) : null),
      dailyFreeLimit: updatedStats?.dailyFreeLimit,
      isVIP: currentUser ? currentUser.isVIP : false,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (lease) await releaseAi(lease).catch(() => console.error("ai_lease_release_failed", { lease }));
    const failure = publicError(error);
    metrics.durationMs = Date.now() - started;
    if (runId) {
      try { await finishSeo(subject, runId, false, metrics, failure.code); }
      catch { console.error("seo_usage_finalize_failed", { runId, code: failure.code }); }
    }
    if (failure.status >= 500) console.error("seo_request_failed", { runId, code: failure.code, validationHint: failure.validationHint, ...metrics });
    return NextResponse.json({
      success: false,
      code: failure.code,
      error: failure.message,
      details: failure.code === "DAILY_LIMIT_EXCEEDED" ? { actionUrl: "/profile#pricing-section" } : undefined,
    }, {
      status: failure.status,
      headers: { "Cache-Control": "no-store", ...(failure.status === 429 ? { "Retry-After": "60" } : {}) },
    });
  }
}
