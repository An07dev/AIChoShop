import { classifyDatabaseError } from "@/lib/db-errors";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { reserveAi, completeAi, releaseAi } from "@/lib/ai-quota";
import { isVipActive } from "@/lib/vip-expiration";
import { getAiUsageStats } from "@/lib/ai-usage";
import { SeoError, validateSeoInputs } from "./contract";
import { generateSeo } from "./generate";
import { finishSeo, reserveSeo, seoIdentity, type RunMetrics } from "./usage";
import { isAllowedOrigin } from "@/lib/http/origin";
import { createSeoCompleterWithFallback } from "@/lib/ai-fallback";

function publicError(error: unknown): SeoError {
  if (error instanceof SeoError) return error;
  const database = classifyDatabaseError(error);
  if (database) return new SeoError(database.code, database.message, database.status);
  if (error instanceof Error && (error.name === "AbortError" || error.message.includes("AbortError"))) return new SeoError("REQUEST_ABORTED", "Yêu cầu đã được hủy bởi người dùng.", 499);
  if (error instanceof OpenAI.APIConnectionTimeoutError) return new SeoError("TIMEOUT", "AI xử lý quá lâu. Vui lòng thử lại; lượt dùng chưa bị trừ.", 504);
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

    const completer = await createSeoCompleterWithFallback(metrics, req.signal);
    const output = await generateSeo(
      inputs,
      completer,
      (input, outputTokens) => {
        metrics.inputTokens += input;
        metrics.outputTokens += outputTokens;
      }
    );
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
