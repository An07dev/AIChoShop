import OpenAI from "openai";
import { getSystemSettings } from "@/lib/system-settings";
import { SeoError, SEO_SCHEMA } from "@/lib/seo/contract";
import type { CompleteSeo, CompletionOutput } from "@/lib/seo/generate";
import type { RunMetrics } from "@/lib/seo/usage";

export type AiProviderType = "openai" | "ollama";

export interface ProviderErrorInfo {
  provider: AiProviderType;
  code: string;
  message: string;
  isQuota: boolean;
}

export interface AiExecutionOptions {
  systemPrompt: string;
  userPrompt: string;
  imageBase64?: string;
  tool?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: "schema" | "json" | "text";
  jsonSchema?: Record<string, unknown>;
  abortSignal?: AbortSignal;
  modelOverride?: string;
  timeoutMs?: number;
}

export interface AiExecutionResult {
  outputText: string;
  provider: AiProviderType;
  model: string;
  inputTokens: number;
  outputTokens: number;
  fallbackUsed: boolean;
}

/**
 * Kiểm tra xem lỗi có thuộc diện có thể phục hồi tạm thời (transient error) để thử lại hay không
 */
export function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const errObj = error as { name?: string; status?: number; statusCode?: number; message?: string };
  if (errObj.name === "AbortError") return false;
  const msg = errObj.message || "";
  // Nếu là lỗi cạn token/quota hoặc sai API Key thì KHÔNG THỬ LẠI (vì thử lại cũng chắc chắn thất bại và gây nghẽn)
  if (/insufficient_quota|credit_balance_exhausted|exceeded your current quota|billing|invalid_api_key|incorrect api key/i.test(msg)) {
    return false;
  }
  const status = errObj.status || errObj.statusCode;
  if (status === 429) return true; // Rate limit spike (RPM/TPM thông thường)
  if (typeof status === "number" && status >= 500 && status <= 504) return true;
  if (/econnreset|etimedout|enotfound|fetch failed|socket hang up|connection reset/i.test(msg)) return true;
  return false;
}

// -------------------------------------------------------------
// CIRCUIT BREAKER (BỘ NGẮT MẠCH BẢO VỆ TỰ ĐỘNG)
// -------------------------------------------------------------
interface CircuitState {
  failureCount: number;
  lastFailureTime: number;
  status: "CLOSED" | "OPEN" | "HALF_OPEN";
  reason?: string;
}

const CIRCUIT_FAILURE_THRESHOLD = 3; // 3 lỗi liên tiếp hoặc 1 lỗi Quota/Key
const CIRCUIT_COOLDOWN_MS = 180_000; // 3 phút ngắt mạch, sau đó chuyển HALF_OPEN thử lại 1 lần

const circuitBreakers: Record<AiProviderType, CircuitState> = {
  openai: { failureCount: 0, lastFailureTime: 0, status: "CLOSED" },
  ollama: { failureCount: 0, lastFailureTime: 0, status: "CLOSED" },
};

export function getCircuitStatus(provider: AiProviderType): "CLOSED" | "OPEN" | "HALF_OPEN" {
  const circuit = circuitBreakers[provider];
  if (circuit.status === "OPEN") {
    if (Date.now() - circuit.lastFailureTime > CIRCUIT_COOLDOWN_MS) {
      circuit.status = "HALF_OPEN";
      return "HALF_OPEN";
    }
    return "OPEN";
  }
  return circuit.status;
}

export function recordCircuitSuccess(provider: AiProviderType) {
  const circuit = circuitBreakers[provider];
  circuit.failureCount = 0;
  circuit.status = "CLOSED";
  circuit.reason = undefined;
}

export function recordCircuitFailure(provider: AiProviderType, errorInfo: ProviderErrorInfo) {
  const circuit = circuitBreakers[provider];
  circuit.lastFailureTime = Date.now();
  circuit.reason = errorInfo.message;

  // Lỗi Quota cạn kiệt hoặc API Key hỏng -> Ngắt mạch ngay lập tức (OPEN) để các request sau fallback tức thì
  if (errorInfo.isQuota || errorInfo.code === "INVALID_TOKEN") {
    circuit.status = "OPEN";
    circuit.failureCount = CIRCUIT_FAILURE_THRESHOLD;
    console.warn(`[Circuit Breaker] Kích hoạt ngắt mạch ngay lập tức cho [${provider.toUpperCase()}] do: ${errorInfo.message}`);
    return;
  }

  circuit.failureCount += 1;
  if (circuit.failureCount >= CIRCUIT_FAILURE_THRESHOLD) {
    circuit.status = "OPEN";
    console.warn(`[Circuit Breaker] [${provider.toUpperCase()}] chạm ngưỡng ${circuit.failureCount} lỗi liên tiếp. Ngắt mạch trong ${CIRCUIT_COOLDOWN_MS / 1000}s!`);
  }
}

/**
 * Phân loại lỗi từ các nhà cung cấp AI để hiển thị thông báo rõ ràng cho người dùng
 */
export function classifyAiError(provider: AiProviderType, error: unknown): ProviderErrorInfo {
  const errObj = error as { message?: string; status?: number; statusCode?: number; response?: { status?: number } } | null;
  const rawMsg = errObj?.message || String(error || "");
  const status = errObj?.status || errObj?.statusCode || errObj?.response?.status;

  if (provider === "openai") {
    if (
      status === 429 ||
      /insufficient_quota|credit_balance_exhausted|exceeded your current quota|billing/i.test(rawMsg)
    ) {
      return {
        provider,
        code: "EXPIRED_QUOTA",
        message: "Hết token / credits (429 Quota Exceeded)",
        isQuota: true,
      };
    }
    if (status === 401 || /invalid_api_key|incorrect api key/i.test(rawMsg)) {
      return {
        provider,
        code: "INVALID_TOKEN",
        message: "API Key không hợp lệ (401 Unauthorized)",
        isQuota: false,
      };
    }
    if (status === 403) {
      return {
        provider,
        code: "FORBIDDEN",
        message: "Từ chối truy cập (403 Forbidden)",
        isQuota: false,
      };
    }
    if (status === 404 || /model.*not found/i.test(rawMsg)) {
      return {
        provider,
        code: "MODEL_NOT_FOUND",
        message: "Model OpenAI không tồn tại hoặc không được hỗ trợ",
        isQuota: false,
      };
    }
    if (typeof status === "number" && status >= 500) {
      return {
        provider,
        code: "SERVER_OVERLOAD",
        message: `Máy chủ OpenAI phản hồi lỗi ${status}`,
        isQuota: false,
      };
    }
    if (/econnrefused|etimedout|enotfound|fetch failed|network/i.test(rawMsg)) {
      return {
        provider,
        code: "NETWORK_ERROR",
        message: "Lỗi kết nối mạng đến OpenAI",
        isQuota: false,
      };
    }
    return {
      provider,
      code: "OPENAI_ERROR",
      message: rawMsg || "Lỗi không xác định từ OpenAI",
      isQuota: false,
    };
  } else {
    // Ollama Local
    if (/econnrefused|connect econrefused|fetch failed/i.test(rawMsg) || rawMsg.includes("11434")) {
      return {
        provider,
        code: "OLLAMA_OFFLINE",
        message: "Ollama chưa được bật tại 127.0.0.1:11434",
        isQuota: false,
      };
    }
    if (/blocked this file|application control/i.test(rawMsg)) {
      return {
        provider,
        code: "OLLAMA_BLOCKED",
        message: "llama-server.exe bị Windows Application Control / Antivirus chặn",
        isQuota: false,
      };
    }
    if (status === 404 || /model.*not found/i.test(rawMsg)) {
      const match = rawMsg.match(/model ['"]?([^'"\s]+)['"]? not found/i);
      const missingModel = match ? match[1] : "";
      return {
        provider,
        code: "MODEL_NOT_FOUND",
        message: missingModel
          ? `Ollama chưa tải model '${missingModel}' (cần chạy: ollama pull ${missingModel})`
          : "Ollama chưa tải model này (cần chạy: ollama pull)",
        isQuota: false,
      };
    }
    if (/timeout|timed out/i.test(rawMsg)) {
      return {
        provider,
        code: "TIMEOUT",
        message: "Ollama Local phản hồi quá thời gian chờ (Timeout)",
        isQuota: false,
      };
    }
    return {
      provider,
      code: "OLLAMA_ERROR",
      message: rawMsg || "Lỗi từ Ollama Local",
      isQuota: false,
    };
  }
}

/**
 * Tạo messages tương thích với model (hỗ trợ Vision nếu model cho phép)
 */
function buildMessages(
  systemPrompt: string,
  userPrompt: string,
  imageBase64?: string,
  isVisionSupported?: boolean
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  if (imageBase64) {
    if (isVisionSupported) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: { url: imageBase64 },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `${userPrompt}\n\n(Lưu ý: Model hiện tại không hỗ trợ thị giác máy tính trực tiếp. Vui lòng phân tích dựa trên thông tin mô tả chi tiết của Seller).`,
      });
    }
  } else {
    messages.push({
      role: "user",
      content: userPrompt,
    });
  }

  return messages;
}

/**
 * Thực thi gọi AI một nhà cung cấp đơn lẻ
 */
async function callSingleProvider(
  provider: AiProviderType,
  options: AiExecutionOptions,
  config: {
    openaiApiKey: string;
    openaiBaseUrl?: string;
    openaiModel: string;
    ollamaBaseUrl: string;
    ollamaModel: string;
    ollamaVisionModel: string;
  }
): Promise<{ outputText: string; model: string; inputTokens: number; outputTokens: number }> {
  let baseURL: string | undefined;
  let apiKey: string;
  let model: string;
  let isVision = false;

  if (provider === "openai") {
    apiKey = config.openaiApiKey;
    if (!apiKey || apiKey === "dummy" || apiKey === "123123") {
      throw new Error("Chưa cấu hình OpenAI API Key hợp lệ.");
    }
    baseURL = config.openaiBaseUrl || undefined;
    model = options.modelOverride || config.openaiModel;
    isVision =
      model.includes("gpt-4") ||
      model.includes("4o") ||
      model.includes("vision") ||
      model.includes("vl") ||
      model.includes("gemini") ||
      model.includes("claude");
  } else {
    apiKey = "ollama";
    baseURL = config.ollamaBaseUrl;
    if (options.imageBase64 && config.ollamaVisionModel) {
      model = config.ollamaVisionModel;
    } else {
      model = config.ollamaModel;
    }
    isVision =
      model.includes("vision") ||
      model.includes("vl") ||
      model.includes("llava") ||
      model.includes("minicpm");
  }

  // Thời gian chờ trần chống lỗi 502/504: OpenAI đặt 25s, Ollama Local đặt 65s để model 7B đủ thời gian suy luận.
  const defaultTimeout = provider === "ollama" ? 65_000 : 25_000;
  const timeoutMs = options.timeoutMs ? Math.min(options.timeoutMs, defaultTimeout) : defaultTimeout;

  const client = new OpenAI({
    baseURL,
    apiKey,
    timeout: timeoutMs,
    maxRetries: 0,
  });

  const messages = buildMessages(
    options.systemPrompt,
    options.userPrompt,
    options.imageBase64,
    isVision
  );

  const requestParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens:
      provider === "ollama"
        ? Math.min(options.maxTokens ?? 3000, 3500)
        : (options.maxTokens ?? 2500),
  };

  if (options.responseFormat === "schema" && options.jsonSchema && provider === "openai") {
    requestParams.response_format = {
      type: "json_schema" as const,
      json_schema: { name: "result", strict: true, schema: options.jsonSchema },
    };
  } else if (options.responseFormat === "json") {
    requestParams.response_format = { type: "json_object" as const };
    // Bắt buộc format: "json" cho Ollama engine
    (requestParams as unknown as Record<string, unknown>).format = "json";
  }

  const executeCall = async () => {
    return client.chat.completions.create(requestParams, {
      signal: options.abortSignal,
    });
  };

  let completion;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      completion = await executeCall();
      break;
    } catch (error: unknown) {
      const errMsg = (error as { message?: string })?.message || "";
      const errStatus = (error as { status?: number })?.status;
      const isTimeout = /timeout|timed out/i.test(errMsg);

      // Xử lý riêng trường hợp Ollama chưa có model vision: fallback ngay sang model văn bản
      if (
        provider === "ollama" &&
        options.imageBase64 &&
        (errStatus === 404 || /not found/i.test(errMsg)) &&
        model !== config.ollamaModel
      ) {
        console.warn(
          `[Ollama] Model thị giác '${model}' chưa được cài đặt. Tự động thử chuyển sang model văn bản '${config.ollamaModel}'...`
        );
        model = config.ollamaModel;
        const textMessages = buildMessages(options.systemPrompt, options.userPrompt, undefined, false);
        requestParams.model = model;
        requestParams.messages = textMessages;
        completion = await executeCall();
        break;
      }

      // Nếu là lỗi tạm thời (502, 503, 504, 429 spike) và CHƯA retry, và KHÔNG PHẢI timeout
      // (Nếu đã timeout 38s, retry lại sẽ mất thêm 38s -> tổng 76s vượt quá 60s của Reverse Proxy gây lỗi 502)
      if (attempt === 0 && !isTimeout && isRetryableError(error) && !options.abortSignal?.aborted) {
        const backoffMs = 800 + Math.floor(Math.random() * 400); // Backoff ngắn 0.8s-1.2s
        console.warn(
          `[AI Retry] [${provider.toUpperCase()}] gặp sự cố tạm thời (${errMsg || errStatus}). Đang tự động thử lại sau ${(backoffMs / 1000).toFixed(1)}s...`
        );
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      throw error;
    }
  }

  if (!completion) {
    throw new Error("Không nhận được phản hồi từ AI.");
  }

  const choice = completion.choices[0];
  const outputText = choice?.message?.content?.trim();

  const isSuccessReason =
    choice?.finish_reason === "stop" ||
    (choice?.finish_reason === "length" && (outputText?.length ?? 0) >= 300);

  if (!outputText || choice?.message?.refusal || !isSuccessReason) {
    throw new Error("AI trả về kết quả rỗng hoặc không hoàn chỉnh.");
  }

  return {
    outputText,
    model,
    inputTokens: completion.usage?.prompt_tokens ?? 0,
    outputTokens: completion.usage?.completion_tokens ?? 0,
  };
}

/**
 * Lấy cấu hình các nhà cung cấp AI đã chuẩn hóa
 */
export async function getResolvedAiConfig() {
  const systemConfig = await getSystemSettings();

  const dbKey = systemConfig.openaiApiKey?.trim();
  const envKey = process.env.OPENAI_API_KEY?.trim().replace(/^["']|["']$/g, "");
  const openaiApiKey =
    dbKey && dbKey !== "dummy" && dbKey !== "123123" ? dbKey : envKey || dbKey || "";

  const config = {
    openaiApiKey,
    openaiBaseUrl: systemConfig.openaiBaseUrl?.trim() || undefined,
    openaiModel:
      systemConfig.openaiModel?.trim() || process.env.OPENAI_MODEL || "gpt-4o-mini",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1",
    ollamaModel: process.env.OLLAMA_MODEL || "qwen2.5:7b",
    ollamaVisionModel: process.env.OLLAMA_VISION_MODEL || "llava",
  };

  const isOpenAiActive =
    systemConfig.isOpenAiActive ??
    process.env.OpenAIStatus?.trim().toLowerCase() === "true";

  const providers: AiProviderType[] = isOpenAiActive
    ? ["openai", "ollama"]
    : ["ollama", "openai"];

  return { config, isOpenAiActive, providers };
}

/**
 * Thực thi AI với cơ chế FALLBACK 2 CHIỀU THÔNG MINH + CIRCUIT BREAKER:
 * 1. Tự động kiểm tra trạng thái Circuit Breaker để ưu tiên nguồn khả dụng.
 * 2. Nếu cấu hình OpenAI bật: Thử OpenAI -> nếu hết token/lỗi -> fallback sang Ollama.
 * 3. Nếu cấu hình Ollama bật: Thử Ollama -> nếu lỗi/không có local -> fallback sang OpenAI.
 * 4. Nếu cả 2 cùng thất bại (Ollama không có ở local + OpenAI hết token/lỗi) -> Báo lỗi chi tiết!
 */
export async function executeAiWithFallback(
  options: AiExecutionOptions
): Promise<AiExecutionResult> {
  const { config, isOpenAiActive, providers: defaultProviders } = await getResolvedAiConfig();

  // Tối ưu hóa thứ tự providers dựa trên Circuit Breaker:
  // Nếu provider ưu tiên đang ngắt mạch (OPEN), ưu tiên ngay provider dự phòng để không mất thời gian chờ
  const providers: AiProviderType[] = [...defaultProviders].sort((a, b) => {
    const statusA = getCircuitStatus(a);
    const statusB = getCircuitStatus(b);
    if (statusA === "OPEN" && statusB !== "OPEN") return 1;
    if (statusA !== "OPEN" && statusB === "OPEN") return -1;
    return 0;
  });

  const primaryLabel = isOpenAiActive ? "OpenAI Cloud" : "Ollama Local";

  const TOTAL_CHAIN_BUDGET_MS = 90_000; // Tổng thời gian trần 90s cho cả chuỗi (Next.js route timeout là 180s)
  const chainDeadline = Date.now() + TOTAL_CHAIN_BUDGET_MS;

  const errors: Record<AiProviderType, ProviderErrorInfo | null> = {
    openai: null,
    ollama: null,
  };

  for (let i = 0; i < providers.length; i++) {
    const currentProvider = providers[i];
    const isFallback = i > 0;
    const providerLabel = currentProvider === "openai" ? "OpenAI Cloud" : "Ollama Local";
    const circuit = getCircuitStatus(currentProvider);

    const remainingMs = chainDeadline - Date.now();
    if (remainingMs < 5_000) {
      console.warn(
        `[AI Timeout Budget] Thời gian còn lại (${remainingMs}ms) không đủ an toàn để gọi [${providerLabel}]. Dừng chuỗi để chuyển sang chế độ dự phòng.`
      );
      break;
    }

    try {
      if (circuit === "OPEN") {
        console.warn(`[Circuit Breaker] Bỏ qua [${providerLabel}] vì mạch đang NGẮT do sự cố trước đó.`);
        continue;
      }

      if (isFallback) {
        console.warn(
          `[AI Fallback] Đang kích hoạt phương án dự phòng: [${providerLabel}] (Thay thế cho ${primaryLabel})...`
        );
      } else {
        console.log(
          `[AI Service] Nguồn Mô Hình AI ưu tiên (theo Admin Settings / Circuit Breaker): [${providerLabel}]. Đang gửi yêu cầu...`
        );
      }

      const providerOptions: AiExecutionOptions = {
        ...options,
        timeoutMs: Math.min(options.timeoutMs ?? (currentProvider === "ollama" ? 65_000 : 25_000), remainingMs),
      };

      const result = await callSingleProvider(currentProvider, providerOptions, config);

      // Ghi nhận thành công vào Circuit Breaker để đóng mạch
      recordCircuitSuccess(currentProvider);

      if (isFallback) {
        console.log(
          `[AI Fallback] Fallback sang [${currentProvider.toUpperCase()}] THÀNH CÔNG! Model: ${result.model}`
        );
      } else {
        console.log(
          `[AI Service] Phản hồi thành công từ [${currentProvider.toUpperCase()}] (Model: ${result.model})`
        );
      }

      return {
        ...result,
        provider: currentProvider,
        fallbackUsed: isFallback,
      };
    } catch (err: unknown) {
      const classified = classifyAiError(currentProvider, err);
      errors[currentProvider] = classified;
      // Ghi nhận lỗi vào Circuit Breaker
      recordCircuitFailure(currentProvider, classified);
      console.warn(
        `[AI Error] Nhà cung cấp [${currentProvider.toUpperCase()}] thất bại: ${classified.message}`
      );

      if (i < providers.length - 1) {
        console.warn(`[AI Fallback] Tự động chuyển sang nhà cung cấp tiếp theo...`);
        continue;
      }
    }
  }

  // NẾU CẢ 2 ĐỀU THẤT BẠI: Báo lỗi chi tiết
  const openAiErr = errors.openai?.message || "Không thể kết nối";
  const ollamaErr = errors.ollama?.message || "Không thể kết nối";
  const isQuota = errors.openai?.isQuota ?? false;

  const compositeMessage =
    `Dịch vụ AI không khả dụng. Cả 2 phương án đều gặp sự cố:\n` +
    `• OpenAI: ${openAiErr}\n` +
    `• Ollama Local: ${ollamaErr}\n\n` +
    `Vui lòng nạp thêm token OpenAI / kiểm tra API Key tại Cài Đặt hoặc kiểm tra dịch vụ Ollama trên máy.`;

  console.error(`[AI Critical] ${compositeMessage}`);

  throw new SeoError(
    isQuota ? "EXPIRED_QUOTA" : "AI_BOTH_PROVIDERS_UNAVAILABLE",
    compositeMessage,
    503
  );
}

/**
 * Hỗ trợ Fallback cho riêng công cụ SEO Optimizer (generateSeo)
 */
export async function createSeoCompleterWithFallback(
  metrics: RunMetrics,
  abortSignal?: AbortSignal
): Promise<CompleteSeo> {
  const { config, isOpenAiActive, providers: defaultProviders } = await getResolvedAiConfig();
  const primaryLabel = isOpenAiActive ? "OpenAI Cloud" : "Ollama Local";

  return async (prompt: string): Promise<CompletionOutput> => {
    const providers: AiProviderType[] = [...defaultProviders].sort((a, b) => {
      const statusA = getCircuitStatus(a);
      const statusB = getCircuitStatus(b);
      if (statusA === "OPEN" && statusB !== "OPEN") return 1;
      if (statusA !== "OPEN" && statusB === "OPEN") return -1;
      return 0;
    });

    const errors: Record<AiProviderType, ProviderErrorInfo | null> = {
      openai: null,
      ollama: null,
    };

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const isFallback = i > 0;
      const providerLabel = provider === "openai" ? "OpenAI Cloud" : "Ollama Local";
      const circuit = getCircuitStatus(provider);

      try {
        if (circuit === "OPEN") {
          console.warn(`[Circuit Breaker] Bỏ qua [${providerLabel}] cho SEO vì mạch đang NGẮT do sự cố trước đó.`);
          continue;
        }

        if (isFallback) {
          console.warn(`[SEO Fallback] Đang kích hoạt phương án dự phòng: [${providerLabel}] (Thay thế cho ${primaryLabel})...`);
        } else {
          console.log(`[SEO Service] Nguồn Mô Hình AI ưu tiên (theo Admin Settings / Circuit Breaker): [${providerLabel}]. Đang gửi yêu cầu...`);
        }

        if (provider === "openai" && (!config.openaiApiKey || ["dummy", "123123"].includes(config.openaiApiKey))) {
          throw new Error("Chưa cấu hình OpenAI API Key hợp lệ.");
        }

        const isOfficialOpenAi =
          provider === "openai" &&
          (!config.openaiBaseUrl ||
            new URL(config.openaiBaseUrl).hostname === "api.openai.com");
        let format: "schema" | "json" | "prompt" = isOfficialOpenAi ? "schema" : "json";

        const timeoutMs = provider === "openai" ? 90_000 : 240_000;
        const client = new OpenAI({
          baseURL: provider === "openai" ? config.openaiBaseUrl : config.ollamaBaseUrl,
          apiKey: provider === "openai" ? config.openaiApiKey : "ollama",
          timeout: timeoutMs,
          maxRetries: 0,
        });

        const model = provider === "openai" ? config.openaiModel : config.ollamaModel;

        const request = () =>
          client.chat.completions.create({
            model,
            messages: [{ role: "system", content: prompt }],
            ...(provider === "openai"
              ? { max_completion_tokens: 3500 }
              : { max_tokens: 3500, temperature: 0.3 }),
            ...(format === "schema"
              ? {
                  response_format: {
                    type: "json_schema" as const,
                    json_schema: {
                      name: "seo_result",
                      strict: true,
                      schema: SEO_SCHEMA,
                    },
                  },
                }
              : format === "json"
              ? { response_format: { type: "json_object" as const } }
              : {}),
          }, { signal: abortSignal });

        let completion;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            completion = await request();
            break;
          } catch (error: unknown) {
            if (
              error instanceof OpenAI.APIError &&
              error.status === 400 &&
              /response_format|json_schema|json_object/i.test(error.message) &&
              (format as string) !== "prompt"
            ) {
              format = "prompt";
              completion = await request();
              break;
            }
            if (attempt === 0 && isRetryableError(error) && !abortSignal?.aborted) {
              const backoffMs = 1200 + Math.floor(Math.random() * 600);
              console.warn(
                `[SEO Retry] [${provider.toUpperCase()}] gặp sự cố tạm thời. Đang tự động thử lại sau ${(backoffMs / 1000).toFixed(1)}s...`
              );
              await new Promise((r) => setTimeout(r, backoffMs));
              continue;
            }
            throw error;
          }
        }

        if (!completion) throw new Error("AI không phản hồi.");

        // Ghi nhận thành công vào Circuit Breaker
        recordCircuitSuccess(provider);

        const choice = completion.choices[0];
        metrics.provider = provider;
        metrics.model = model;

        if (isFallback) {
          console.log(`[SEO Fallback] Fallback sang [${provider.toUpperCase()}] thành công!`);
        }

        return {
          content: choice?.message.content ?? null,
          finishReason: choice?.finish_reason ?? "",
          refused: !!choice?.message.refusal,
          inputTokens: completion.usage?.prompt_tokens ?? 0,
          outputTokens: completion.usage?.completion_tokens ?? 0,
        };
      } catch (err: unknown) {
        const classified = classifyAiError(provider, err);
        errors[provider] = classified;
        recordCircuitFailure(provider, classified);
        console.warn(
          `[SEO Fallback] [${provider.toUpperCase()}] thất bại: ${classified.message}`
        );

        if (i < providers.length - 1) {
          console.warn(`[SEO Fallback] Đang thử phương án dự phòng...`);
          continue;
        }
      }
    }

    const openAiErr = errors.openai?.message || "Không thể kết nối";
    const ollamaErr = errors.ollama?.message || "Không thể kết nối";
    const isQuota = errors.openai?.isQuota ?? false;

    throw new SeoError(
      isQuota ? "EXPIRED_QUOTA" : "AI_BOTH_PROVIDERS_UNAVAILABLE",
      `Dịch vụ AI không khả dụng. Cả 2 phương án đều gặp sự cố:\n• OpenAI: ${openAiErr}\n• Ollama Local: ${ollamaErr}\nVui lòng kiểm tra cấu hình hoặc nạp thêm token.`,
      503
    );
  };
}
