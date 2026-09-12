import type { PricingInput, PricingResult } from "./types";

export const PRICING_STORAGE_KEY = "aichoshop_pricing_calculations_v1";

export type PricingCalculationSnapshot = {
  id: string;
  createdAt: string;
  productName: string;
  mode: "target" | "audit";
  input: PricingInput;
  auditPrice: number;
  targetMode: "margin" | "fixed";
  targetValue: number;
  roundingStep: number;
  result: PricingResult;
};

export function readPricingHistory(storage: Pick<Storage, "getItem">): PricingCalculationSnapshot[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(PRICING_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PricingCalculationSnapshot => Boolean(
      item && typeof item === "object" && "id" in item && "input" in item && "result" in item,
    ));
  } catch {
    return [];
  }
}

export function writePricingHistory(storage: Pick<Storage, "setItem">, history: PricingCalculationSnapshot[]) {
  storage.setItem(PRICING_STORAGE_KEY, JSON.stringify(history));
}

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function pricingHistoryToCsv(history: PricingCalculationSnapshot[]) {
  const header = [
    "Thời gian", "Tên sản phẩm", "Sàn", "Loại shop", "Mã ngành", "Giá vốn",
    "Giá đề xuất", "Giá hòa vốn", "Sàn giải ngân", "Lãi đơn thành công",
    "Lãi kỳ vọng/đơn", "Biên lợi nhuận (%)", "ROI (%)", "Ads tối đa", "ROAS hòa vốn",
  ];
  const rows = history.map((item) => {
    const evaluation = item.result.evaluation;
    return [
      item.createdAt, item.productName, item.input.platform, item.input.shopType,
      item.input.categoryId, item.input.costPerUnit, evaluation.listPrice,
      item.result.breakEvenPrice, evaluation.payout, evaluation.profitOnSuccess,
      evaluation.expectedProfitPerOrder, evaluation.expectedMargin, evaluation.roiOnCogs,
      evaluation.maximumMarketingCost, evaluation.breakEvenRoas,
    ];
  });
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

