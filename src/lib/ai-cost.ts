/**
 * Bảng giá chính thức của OpenAI (USD / 1M tokens) và công cụ tính toán chi phí AI
 */

export interface ModelPricing {
  promptCostPerMillion: number;
  completionCostPerMillion: number;
}

export const OPENAI_MODEL_PRICING: Record<string, ModelPricing> = {
  // GPT-4o mini (Mặc định của hệ thống)
  "gpt-4o-mini": {
    promptCostPerMillion: 0.15,
    completionCostPerMillion: 0.60,
  },
  "gpt-4o-mini-2024-07-18": {
    promptCostPerMillion: 0.15,
    completionCostPerMillion: 0.60,
  },
  // GPT-4o (Cao cấp)
  "gpt-4o": {
    promptCostPerMillion: 2.50,
    completionCostPerMillion: 10.00,
  },
  "gpt-4o-2024-08-06": {
    promptCostPerMillion: 2.50,
    completionCostPerMillion: 10.00,
  },
  "gpt-4o-2024-05-13": {
    promptCostPerMillion: 5.00,
    completionCostPerMillion: 15.00,
  },
  // GPT-3.5 Turbo
  "gpt-3.5-turbo": {
    promptCostPerMillion: 0.50,
    completionCostPerMillion: 1.50,
  },
  "gpt-3.5-turbo-0125": {
    promptCostPerMillion: 0.50,
    completionCostPerMillion: 1.50,
  },
};

// Tỷ giá quy đổi USD sang VND mặc định
export const DEFAULT_USD_TO_VND_RATE = 25400;

/**
 * Tính chi phí ước tính bằng USD dựa trên số lượng prompt và completion tokens
 */
export function calculateTokenCost(
  model: string | null | undefined,
  promptTokens: number,
  completionTokens: number
): number {
  if (!model) return 0;
  const normalizedModel = model.trim().toLowerCase();

  // Nếu dùng model offline / local Ollama / Qwen thì chi phí API bằng 0
  if (
    normalizedModel.startsWith("qwen") ||
    normalizedModel.startsWith("ollama") ||
    normalizedModel.startsWith("llama") ||
    normalizedModel.startsWith("mistral")
  ) {
    return 0;
  }

  // Tìm bảng giá khớp với model
  let pricing = OPENAI_MODEL_PRICING[normalizedModel];
  if (!pricing) {
    if (normalizedModel.includes("gpt-4o-mini")) {
      pricing = OPENAI_MODEL_PRICING["gpt-4o-mini"];
    } else if (normalizedModel.includes("gpt-4o")) {
      pricing = OPENAI_MODEL_PRICING["gpt-4o"];
    } else if (normalizedModel.includes("gpt-3.5")) {
      pricing = OPENAI_MODEL_PRICING["gpt-3.5-turbo"];
    } else {
      // Mặc định tính theo mức giá của gpt-4o-mini
      pricing = OPENAI_MODEL_PRICING["gpt-4o-mini"];
    }
  }

  const promptCost = (promptTokens / 1_000_000) * pricing.promptCostPerMillion;
  const completionCost = (completionTokens / 1_000_000) * pricing.completionCostPerMillion;

  const totalCost = promptCost + completionCost;
  // Làm tròn tới 6 chữ số thập phân (USD)
  return Number(totalCost.toFixed(6));
}

/**
 * Quy đổi chi phí từ USD sang VND
 */
export function usdToVnd(costUsd: number, rate = DEFAULT_USD_TO_VND_RATE): number {
  return Math.round(costUsd * rate);
}

/**
 * Định dạng tiền tệ VND chuyên nghiệp
 */
export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Định dạng tiền tệ USD
 */
export function formatUsd(amount: number): string {
  if (amount < 0.001 && amount > 0) {
    return `$${amount.toFixed(5)}`;
  }
  if (amount < 1 && amount >= 0.001) {
    return `$${amount.toFixed(4)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Định dạng hiển thị rút gọn số lượng token (VD: 1.2k, 450k, 1.5M)
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k`;
  }
  return tokens.toLocaleString("vi-VN");
}
