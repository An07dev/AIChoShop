"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  Lightbulb,
  Scale,
  Package,
  Target,
  DollarSign,
  Search,
  Zap,
  Boxes,
  Coins,
  Crown,
  LayoutList,
  FileText,
  Layers,
  Maximize2,
  Minimize2,
  Sparkles,
  Clock,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import {
  parseProductValidator,
  type ProductValidatorData,
  type FinancialBreakdown,
  type ValidationCriterion,
  type OperationalPitfall,
  type DifferentiationTactic,
  type SafeTestRoadmap,
} from "@/lib/product-validator/contract";

export type {
  ProductValidatorData,
  FinancialBreakdown,
  ValidationCriterion,
  OperationalPitfall,
  DifferentiationTactic,
  SafeTestRoadmap,
};

interface ProductValidatorOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  elapsedSeconds?: number;
  onCancel?: () => void;
  onUseSample?: () => void;
  isOfflineMode?: boolean;
  onRetryWithAi?: () => void;
}

const VALIDATOR_STAGES = [
  { upToSeconds: 4, text: "📊 Đang phân tích dung lượng thị trường & nhu cầu tìm kiếm 2026..." },
  { upToSeconds: 10, text: "💰 Tính toán chi phí sàn ẩn (12-16%) & xác định CPA trần hòa vốn..." },
  { upToSeconds: 20, text: "🚚 Bóc tách cước quy đổi thể tích & rủi ro hoàn đơn COD thực tế..." },
  { upToSeconds: 35, text: "💡 Thiết kế chiến lược biến thể ngách & combo đẩy AOV né bão giá..." },
  { upToSeconds: 60, text: "🎯 Hoàn thiện bảng điểm, mốc cắt lỗ & lộ trình test đợt 1 an toàn..." },
];

/**
 * Hàm sao chép 2 tầng chống lỗi webview / iOS Safari
 */
async function safeCopyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback tầng 2
    }
  }
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

function cleanLossText(val?: string): string {
  if (!val) return "";
  return val.replace(/^(thiệt hại\s*(khoảng|ước tính)?:?|mất:?|lỗ:?)\s*/i, "").trim();
}

function cleanTriggerText(val?: string): string {
  if (!val) return "";
  return val.replace(/^(cơ chế\s*(sàn\s*)?quét:?|máy quét\/sàn:?|máy quét:?|thuật toán:?)\s*/i, "").trim();
}

function cleanAddonText(val?: string): string {
  if (!val) return "";
  return val.replace(/^(quà\s*(\/\s*phụ kiện)?\s*(sỉ|gợi ý)?:?|gợi ý món quà:?)\s*/i, "").trim();
}

function cleanPricingText(val?: string): string {
  if (!val) return "";
  return val.replace(/^(chiến lược\s*)?(định giá\s*(phễu)?:?)\s*/i, "").trim();
}

function cleanAovText(val?: string): string {
  if (!val) return "";
  return val.replace(/^(tác động\s*(aov)?:?)\s*/i, "").trim();
}

export function ProductValidatorOutput({
  result,
  loading,
  productName,
  elapsedSeconds = 0,
  onCancel,
  onUseSample,
  isOfflineMode = false,
  onRetryWithAi,
}: ProductValidatorOutputProps) {
  const [activeTab, setActiveTab] = useState<"all" | "financials" | "scores" | "risks" | "strategies" | "roadmap">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"interactive" | "raw">("interactive");
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Thoát fullscreen khi nhấn Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const parsedData = useMemo(() => {
    if (!result) return null;
    return parseProductValidator(result, { productName });
  }, [result, productName]);

  const handleCopySnippet = async (text: string, key: string) => {
    const success = await safeCopyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      showToast("Đã sao chép nội dung!");
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  const handleCopyAll = async () => {
    if (!result) return;
    const success = await safeCopyToClipboard(result);
    if (success) {
      setCopiedKey("all");
      showToast("Đã sao chép toàn bộ báo cáo thẩm định!");
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tham-dinh-${(productName || "san-pham").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải tệp .txt!");
  };

  const handleExportExcel = () => {
    if (!parsedData) return;

    const rows: (string | number)[][] = [
      ["BÁO CÁO THẨM ĐỊNH SẢN PHẨM TREND & QUẢN TRỊ RỦI RO ĐẦU TƯ TMĐT 2026"],
      ["Sản phẩm", parsedData.productName || productName || "Sản phẩm thẩm định"],
      ["Thời gian xuất", new Date().toLocaleString("vi-VN")],
      ["Điểm tổng quan", `${parsedData.overallScore}/100 - ${parsedData.verdict}`],
      ["Nhận định", parsedData.verdictSubtitle],
      ["Đánh giá ngắn", parsedData.executiveSummary],
      [],
      ["--- 1. BÓC TÁCH CƠ CẤU TÀI CHÍNH (UNIT ECONOMICS 2026) ---"],
      ["Giá vốn nhập (COGS)", parsedData.financials.costPriceFormatted],
      ["Giá bán mục tiêu", parsedData.financials.targetPriceFormatted],
      ["Tỷ lệ biên lãi gộp", parsedData.financials.grossMarginPercent],
      ["Phí sàn ước tính (12-16%)", parsedData.financials.estimatedPlatformFee],
      ["Dự phòng hoàn COD & Bao bì", parsedData.financials.packagingAndReturnRisk],
      ["CPA TRẦN HÒA VỐN (Ads tối đa)", parsedData.financials.maxBreakevenCpa],
      ["Lợi nhuận ròng kỳ vọng", parsedData.financials.projectedNetProfit],
      ["Đánh giá tài chính", parsedData.financials.financialVerdict],
      [],
      ["--- 2. BẢNG ĐIỂM TIÊU CHÍ THẨM ĐỊNH ---"],
      ["Tiêu chí", "Điểm (1-10)", "Trạng thái", "Nhận xét chi tiết từ chuyên gia", "Hành động khắc phục"],
    ];

    for (const c of parsedData.criteriaList) {
      rows.push([c.name, `${c.score}/${c.maxScore}`, c.statusBadge, c.expertComment, c.actionAdvice]);
    }

    rows.push([]);
    rows.push(["--- 3. CẢNH BÁO TỬ HUYỆT VẬN HÀNH & RỦI RO ẨN ---"]);
    rows.push(["Tên tử huyệt", "Mức độ", "Thiệt hại ước tính (VNĐ)", "Cơ chế sàn quét", "Bản chất rủi ro", "Giải pháp phòng ngừa"]);
    for (const p of parsedData.pitfalls) {
      rows.push([p.title, p.severityBadge, p.estimatedLoss || "", p.platformTrigger || "", p.rootCause, p.preventionTip]);
    }

    rows.push([]);
    rows.push(["--- 4. CHIẾN LƯỢC BIẾN THỂ NGÁCH & NÉ BẪY GIÁ RẺ ---"]);
    rows.push(["Chiến lược", "Loại hình", "Cách đóng gói / triển khai", "Món quà/Phụ kiện sỉ", "Định giá phễu", "Tác động AOV"]);
    for (const d of parsedData.differentiation) {
      rows.push([d.title, d.badge, d.executionSteps, d.suggestedAddOn || "", d.pricingStrategy || "", d.aovImpact]);
    }

    rows.push([]);
    rows.push(["--- 5. LỘ TRÌNH TEST ĐƠN AN TOÀN & ĐIỂM CẮT LỖ ---"]);
    rows.push(["Số lượng nhập test đợt 1", parsedData.roadmap.initialUnits]);
    rows.push(["Ngân sách Ads trần / đơn", parsedData.roadmap.maxAdSpendPerOrder]);
    rows.push(["Target ROAS", parsedData.roadmap.targetRoas]);
    rows.push(["Điều kiện cắt lỗ dừng test", parsedData.roadmap.stopLossCondition]);
    if (parsedData.roadmap.phases && parsedData.roadmap.phases.length > 0) {
      rows.push([]);
      rows.push(["--- TIẾN TRÌNH 3 GIAI ĐOẠN TEST ĐƠN THỰC CHIẾN ---"]);
      rows.push(["Giai đoạn", "Thời gian", "Ngân sách", "Hành động thực tế", "KPI đạt chuẩn"]);
      for (const ph of parsedData.roadmap.phases) {
        rows.push([ph.phase, ph.duration, ph.budget, ph.action, ph.kpiGoal]);
      }
    }
    if (parsedData.roadmap.liquidationPlan) {
      rows.push([]);
      rows.push(["Kế hoạch xả hàng & thu hồi vốn", parsedData.roadmap.liquidationPlan]);
    }
    rows.push(["Lời khuyên vàng từ chuyên gia", parsedData.roadmap.expertVerdictAdvice]);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 32 }, { wch: 18 }, { wch: 25 }, { wch: 40 }, { wch: 55 }, { wch: 45 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Thẩm Định Sản Phẩm");
    XLSX.writeFile(
      workbook,
      `Tham_dinh_${(productName || "san_pham").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}.xlsx`
    );
    showToast("Đã xuất file Excel!");
  };

  const getCriterionIcon = (cat: string) => {
    switch (cat) {
      case "market":
        return <Search size={14} className="text-white shrink-0" />;
      case "competition":
        return <Scale size={14} className="text-white shrink-0" />;
      case "finance":
        return <DollarSign size={14} className="text-white shrink-0" />;
      case "lifecycle":
        return <TrendingUp size={14} className="text-white shrink-0" />;
      case "operation":
        return <Package size={14} className="text-white shrink-0" />;
      default:
        return <BarChart3 size={14} className="text-white shrink-0" />;
    }
  };

  const scoreNum = parsedData?.overallScore ?? null;

  return (
    <div
      className={`bg-black rounded-2xl border border-zinc-800 flex flex-col relative transition-all ${
        isFullScreen
          ? "fixed inset-0 z-50 rounded-none border-none h-screen w-screen overflow-hidden"
          : "h-auto lg:h-full lg:min-h-0 lg:overflow-hidden"
      }`}
    >
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-2xl border border-zinc-700 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          <Check size={13} className="text-emerald-400 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Toolbar Tối Giản (Chữ trắng nền đen, 1 hàng ngang duy nhất) */}
      <div className="px-3 sm:px-4 py-2.5 border-b border-zinc-800 bg-black flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-20 flex-nowrap sticky top-0 rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
            <TrendingUp size={15} />
          </div>
          <h2 className="font-bold text-white text-xs sm:text-sm tracking-wide uppercase whitespace-nowrap">
            <span className="xs:hidden">Thẩm Định Trend</span>
            <span className="hidden xs:inline">Thẩm Định Sản Phẩm Trend</span>
          </h2>

          {isOfflineMode && (
            <span className="hidden sm:inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 shrink-0">
              ⚡ Dự Phòng
            </span>
          )}
        </div>

        {/* Nút hành động Toolbar (100% Icon Only, Không Text Thừa) */}
        {result && !loading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* Chuyển chế độ: Trực quan vs Gốc (Icon Only) */}
            <div className="bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("interactive")}
                title="Giao diện trực quan"
                aria-label="Giao diện trực quan"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center transition-all cursor-pointer ${
                  viewMode === "interactive"
                    ? "bg-white text-black font-bold shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <LayoutList size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Văn bản gốc (Markdown)"
                aria-label="Văn bản gốc"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-white text-black font-bold shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <FileText size={14} />
              </button>
            </div>

            {/* Xuất Excel: Icon Only */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Xuất file Excel (.xlsx)"
              aria-label="Xuất file Excel"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <FileSpreadsheet size={14} />
            </button>

            {/* Tải tệp .txt: Icon Only */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải tệp .txt"
              aria-label="Tải tệp .txt"
              className="hidden sm:flex w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Download size={14} />
            </button>

            {/* Toàn màn hình: Icon Only */}
            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              title={isFullScreen ? "Thu nhỏ (Esc)" : "Toàn màn hình"}
              aria-label={isFullScreen ? "Thu nhỏ" : "Toàn màn hình"}
              className="hidden sm:flex w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Sao chép toàn bộ: Icon Only Nổi Bật (Nền trắng, text đen) */}
            <button
              type="button"
              onClick={handleCopyAll}
              title={copiedKey === "all" ? "Đã sao chép tất cả" : "Sao chép tất cả"}
              aria-label="Sao chép tất cả"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              {copiedKey === "all" ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Thông báo Chế độ Dự Phòng Offline Blueprint */}
      {isOfflineMode && result && !loading && (
        <div className="px-3 sm:px-4 py-1.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2 text-xs text-zinc-300 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <AlertTriangle size={13} className="text-white shrink-0" />
            <span className="leading-snug break-words">
              ⚡ Báo cáo thẩm định dự phòng 2026 (Lượt dùng AI chưa bị trừ).
            </span>
          </div>
          {onRetryWithAi && (
            <button
              type="button"
              onClick={onRetryWithAi}
              title="Thử lại bằng AI"
              aria-label="Thử lại AI"
              className="w-6 h-6 rounded bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-medium shrink-0 transition-colors cursor-pointer flex items-center justify-center"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      )}

      {/* 2. Sub-Tabs Phân Loại (Tối ưu vuốt mượt trên Mobile, nhãn ngắn gọn không vỡ chữ) */}
      {result && viewMode === "interactive" && !loading && (
        <div className="sticky top-[45px] sm:top-[49px] z-10 px-2 sm:px-4 py-1.5 sm:py-2 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "all"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
            }`}
          >
            <Layers size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Tất cả</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("financials")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "financials"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
            }`}
          >
            <DollarSign size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Tài chính</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("scores")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "scores"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
            }`}
          >
            <BarChart3 size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Bảng điểm</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("risks")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "risks"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
            }`}
          >
            <ShieldAlert size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Tử huyệt</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("strategies")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "strategies"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
            }`}
          >
            <Lightbulb size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Khác biệt</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("roadmap")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "roadmap"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
            }`}
          >
            <Target size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Lộ trình</span>
          </button>
        </div>
      )}

      {/* 3. Vùng Nội Dung Báo Cáo (Cuộn toàn trang trên mobile, cuộn độc lập trên desktop) */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 lg:overflow-y-auto custom-scrollbar space-y-4">
        {loading ? (
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="AI Đang Thẩm Định Tiềm Năng &amp; Rủi Ro Đầu Tư..."
            stages={VALIDATOR_STAGES}
            accentColor="amber"
            minHeightClass="min-h-[360px]"
          />
        ) : result ? (
          <div className="space-y-4">
            {viewMode === "raw" ? (
              <textarea
                readOnly
                value={result}
                className="w-full h-[520px] bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
              />
            ) : parsedData ? (
              <div className="space-y-4">
                {/* 0. HERO SCORE CARD TỔNG QUAN (CHỮ TRẮNG NỀN ĐEN + SCORE NỔI BẬT) */}
                {(activeTab === "all" || activeTab === "scores") && scoreNum !== null && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left min-w-0">
                        {/* Score Badge: Text đen nền trắng (White card, Black text) */}
                        <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 bg-white text-black shadow-md border border-white">
                          <span className="text-3xl font-black leading-none">{scoreNum}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 mt-1">/ 100</span>
                        </div>

                        {/* Title & Verdict */}
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              Thẩm Định 2026
                            </span>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-zinc-900 text-white border border-zinc-700">
                              {parsedData.verdict}
                            </span>
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                            {parsedData.productName || productName}
                          </h3>

                          {parsedData.verdictSubtitle && (
                            <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                              {parsedData.verdictSubtitle}
                            </p>
                          )}

                          {parsedData.executiveSummary && (
                            <p className="text-xs text-zinc-400 leading-relaxed font-normal pt-1.5 border-t border-zinc-800/80">
                              {parsedData.executiveSummary}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Icon-Only Copy Button for Hero */}
                      <button
                        type="button"
                        onClick={() =>
                          handleCopySnippet(
                            `BÁO CÁO THẨM ĐỊNH: ${parsedData.productName}\nĐiểm: ${scoreNum}/100 - ${parsedData.verdict}\n${parsedData.verdictSubtitle}\n${parsedData.executiveSummary}`,
                            "hero"
                          )
                        }
                        title="Sao chép tóm tắt đánh giá"
                        aria-label="Sao chép tóm tắt"
                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 self-end sm:self-start"
                      >
                        {copiedKey === "hero" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* 1. BÓC TÁCH CƠ CẤU TÀI CHÍNH (UNIT ECONOMICS 2026) */}
                {(activeTab === "all" || activeTab === "financials") && parsedData.financials && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
                          <DollarSign size={13} className="text-white" />
                        </div>
                        <h4 className="font-bold text-white text-xs sm:text-sm">
                          Unit Economics &amp; CPA Trần
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopySnippet(
                            `TÀI CHÍNH SẢN PHẨM:\n- Giá vốn: ${parsedData.financials.costPriceFormatted}\n- Giá bán: ${parsedData.financials.targetPriceFormatted}\n- Phí sàn (14%): ${parsedData.financials.estimatedPlatformFee}\n- Hoàn COD & Bao bì: ${parsedData.financials.packagingAndReturnRisk}\n- CPA trần hòa vốn: ${parsedData.financials.maxBreakevenCpa}\n- Lợi nhuận ròng: ${parsedData.financials.projectedNetProfit}`,
                            "financials"
                          )
                        }
                        title="Sao chép bảng tài chính"
                        aria-label="Sao chép tài chính"
                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey === "financials" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Financial Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 space-y-1">
                        <span className="text-[10px] text-zinc-400 block font-medium">Giá Vốn Nhập (COGS)</span>
                        <span className="text-sm sm:text-base font-bold text-white block font-mono">{parsedData.financials.costPriceFormatted}</span>
                        <span className="text-[10px] text-zinc-500 block">Đã gồm ship kho</span>
                      </div>

                      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 space-y-1">
                        <span className="text-[10px] text-zinc-400 block font-medium">Giá Bán Mục Tiêu</span>
                        <span className="text-sm sm:text-base font-bold text-white block font-mono">{parsedData.financials.targetPriceFormatted}</span>
                        <span className="text-[10px] text-zinc-300 font-semibold block">Lãi gộp: {parsedData.financials.grossMarginPercent}</span>
                      </div>

                      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 space-y-1">
                        <span className="text-[10px] text-zinc-400 block font-medium">Phí Sàn Thực Tế</span>
                        <span className="text-sm sm:text-base font-bold text-white block font-mono">{parsedData.financials.estimatedPlatformFee}</span>
                        <span className="text-[10px] text-zinc-500 block">Cố định + Voucher Xtra</span>
                      </div>

                      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 space-y-1">
                        <span className="text-[10px] text-zinc-400 block font-medium">Dự Phòng Hoàn COD</span>
                        <span className="text-sm sm:text-base font-bold text-white block font-mono">{parsedData.financials.packagingAndReturnRisk}</span>
                        <span className="text-[10px] text-zinc-500 block">Cước hoàn 2 đầu + hộp</span>
                      </div>
                    </div>

                    {/* Highlight Card: CPA Trần Hòa Vốn */}
                    <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/70 border border-zinc-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="space-y-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-white text-xs font-bold uppercase tracking-wider">
                          <Coins size={14} className="text-white" />
                          <span>Ngân Sách Ads Tối Đa Cho 1 Đơn (CPA Trần)</span>
                        </div>
                        <p className="text-xs text-zinc-400">
                          Nếu chi phí ra 1 đơn hàng (CPA) vượt quá ngưỡng này, bạn sẽ bị lỗ vốn ngay lập tức.
                        </p>
                      </div>

                      <div className="text-center sm:text-right shrink-0">
                        <span className="text-2xl sm:text-3xl font-black text-white block leading-tight font-mono">
                          {parsedData.financials.maxBreakevenCpa}
                        </span>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-white text-black text-[10px] font-bold shadow-xs">
                          Lãi ròng kỳ vọng: {parsedData.financials.projectedNetProfit}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. BẢNG ĐIỂM TIÊU CHÍ THẨM ĐỊNH (5 TIÊU CHÍ) */}
                {(activeTab === "all" || activeTab === "scores") && parsedData.criteriaList?.length > 0 && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
                          <BarChart3 size={13} className="text-white" />
                        </div>
                        <h4 className="font-bold text-white text-xs sm:text-sm">
                          Bảng Điểm 5 Tiêu Chí Thẩm Định
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopySnippet(
                            parsedData.criteriaList
                              .map((c) => `• ${c.name} (${c.score}/10): ${c.expertComment}\n-> Lời khuyên: ${c.actionAdvice}`)
                              .join("\n\n"),
                            "all_criteria"
                          )
                        }
                        title="Sao chép toàn bộ bảng điểm"
                        aria-label="Sao chép bảng điểm"
                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey === "all_criteria" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {parsedData.criteriaList.map((item, idx) => {
                        const pct = Math.min(100, Math.max(0, (item.score / item.maxScore) * 100));

                        return (
                          <div
                            key={item.id || idx}
                            className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 sm:p-4 space-y-2.5 transition-colors hover:border-zinc-700/80"
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex items-start gap-2 min-w-0 flex-1">
                                <div className="mt-0.5 shrink-0">{getCriterionIcon(item.category)}</div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h5 className="font-bold text-white text-xs sm:text-sm leading-snug break-words">
                                      {item.name}
                                    </h5>
                                    {item.statusBadge && (
                                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 leading-none shrink-0">
                                        {item.statusBadge}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-white text-black shadow-xs shrink-0">
                                  {item.score} / {item.maxScore}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopySnippet(`${item.name} (${item.score}/10):\n${item.expertComment}\nLời khuyên: ${item.actionAdvice}`, `crit_${idx}`)}
                                  title="Sao chép tiêu chí này"
                                  aria-label="Sao chép tiêu chí"
                                  className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                >
                                  {copiedKey === `crit_${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                </button>
                              </div>
                            </div>

                            {/* Progress bar: Monochrome sleek track */}
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-300 bg-white" style={{ width: `${pct}%` }} />
                            </div>

                            {/* Comment & Action Advice */}
                            <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                              {item.expertComment}
                            </p>

                            {item.actionAdvice && (
                              <div className="pt-2 border-t border-zinc-800/70 text-[11px] text-zinc-300 font-medium flex items-start gap-1.5 bg-black/40 p-2.5 rounded-lg border border-zinc-800/60 leading-relaxed">
                                <span className="shrink-0 font-bold text-white">👉 Lời khuyên:</span>
                                <span className="text-zinc-300 break-words min-w-0 flex-1">{item.actionAdvice}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. CẢNH BÁO TỬ HUYỆT VẬN HÀNH & RỦI RO ẨN */}
                {(activeTab === "all" || activeTab === "risks") && parsedData.pitfalls?.length > 0 && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
                          <ShieldAlert size={13} className="text-white" />
                        </div>
                        <h4 className="font-bold text-white text-xs sm:text-sm">
                          Tử Huyệt Vận Hành &amp; Rủi Ro Tài Chính Sàn
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopySnippet(
                            parsedData.pitfalls
                              .map(
                                (p) =>
                                  `[${p.severityBadge}] ${p.title}\n- Thiệt hại ước tính: ${cleanLossText(p.estimatedLoss) || "Chưa định lượng"}\n- Cơ chế sàn quét: ${cleanTriggerText(p.platformTrigger) || "Chưa xác định"}\n- Nguyên nhân: ${p.rootCause}\n- Giải pháp: ${p.preventionTip}`
                              )
                              .join("\n\n"),
                            "all_pitfalls"
                          )
                        }
                        title="Sao chép các rủi ro"
                        aria-label="Sao chép rủi ro"
                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey === "all_pitfalls" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {parsedData.pitfalls.map((pitfall, idx) => (
                        <div
                          key={pitfall.id || idx}
                          className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 sm:p-4 space-y-3 hover:border-zinc-700/80 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            {/* Dòng 1: Badge mức độ (trái) & Nút sao chép (phải) */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 shrink-0">
                                {pitfall.severityBadge}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  handleCopySnippet(
                                    `${pitfall.title}\n- Thiệt hại: ${cleanLossText(pitfall.estimatedLoss)}\n- Cơ chế quét: ${cleanTriggerText(pitfall.platformTrigger)}\n- Nguyên nhân: ${pitfall.rootCause}\n- Giải pháp: ${pitfall.preventionTip}`,
                                    `pitfall_${idx}`
                                  )
                                }
                                title="Sao chép tử huyệt này"
                                aria-label="Sao chép tử huyệt"
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                              >
                                {copiedKey === `pitfall_${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              </button>
                            </div>

                            {/* Dòng 2: Tiêu đề rủi ro tự xuống dòng chuẩn */}
                            <h5 className="font-bold text-white text-xs sm:text-sm leading-snug break-words">
                              {pitfall.title}
                            </h5>

                            {/* Dòng 3: Box Thiệt hại định lượng toàn chiều rộng (Nền đen, nhãn text đen nền trắng) */}
                            {pitfall.estimatedLoss && (
                              <div className="w-full p-2.5 rounded-lg bg-black/80 border border-zinc-700 text-xs flex items-start gap-2 shadow-xs">
                                <span className="shrink-0 font-bold px-1.5 py-0.5 rounded bg-white text-black text-[10px] uppercase tracking-wide">
                                  💸 Thiệt hại
                                </span>
                                <span className="text-zinc-200 font-medium break-words leading-relaxed min-w-0 flex-1">
                                  {cleanLossText(pitfall.estimatedLoss)}
                                </span>
                              </div>
                            )}

                            {/* Lưới 2 cột cân đối: Bản chất rủi ro & Cơ chế sàn quét */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="bg-black/50 border border-zinc-800/80 rounded-lg p-2.5 space-y-1">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                  🔍 Bản Chất Rủi Ro
                                </span>
                                <p className="text-zinc-300 leading-relaxed font-normal break-words">
                                  {pitfall.rootCause}
                                </p>
                              </div>

                              <div className="bg-black/50 border border-zinc-800/80 rounded-lg p-2.5 space-y-1">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center gap-1">
                                  🤖 Cơ Chế Quét Của Sàn
                                </span>
                                <p className="text-zinc-300 leading-relaxed font-normal break-words">
                                  {cleanTriggerText(pitfall.platformTrigger) || "Shipper và máy quét tự động kiểm tra."}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Giải pháp xử lý dưới cùng */}
                          <div className="pt-2.5 border-t border-zinc-800/80 text-[11px] sm:text-xs text-zinc-200 font-medium flex items-start gap-1.5 leading-relaxed">
                            <span className="shrink-0 font-bold text-white">🛡️ Giải pháp xử lý:</span>
                            <span className="text-zinc-300 break-words min-w-0 flex-1">{pitfall.preventionTip}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. CHIẾN LƯỢC BIẾN THỂ NGÁCH & NÉ BẪY GIÁ RẺ */}
                {(activeTab === "all" || activeTab === "strategies") && parsedData.differentiation?.length > 0 && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
                          <Lightbulb size={13} className="text-white" />
                        </div>
                        <h4 className="font-bold text-white text-xs sm:text-sm">
                          Chiến Lược Khác Biệt &amp; Định Giá Phễu AOV
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopySnippet(
                            parsedData.differentiation
                              .map(
                                (d) =>
                                  `[${d.badge}] ${d.title}\n- Triển khai: ${d.executionSteps}\n- Quà/Phụ kiện sỉ: ${cleanAddonText(d.suggestedAddOn) || "N/A"}\n- Định giá phễu: ${cleanPricingText(d.pricingStrategy) || "N/A"}\n- Tác động AOV: ${cleanAovText(d.aovImpact)}`
                              )
                              .join("\n\n"),
                            "all_diff"
                          )
                        }
                        title="Sao chép chiến lược ngách"
                        aria-label="Sao chép chiến lược"
                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey === "all_diff" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {parsedData.differentiation.map((diff, idx) => (
                        <div
                          key={diff.id || idx}
                          className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 sm:p-4 space-y-3 flex flex-col justify-between hover:border-zinc-700/80 transition-all"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-black font-bold shrink-0">
                                {diff.badge}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  handleCopySnippet(
                                    `${diff.title}\n- Triển khai: ${diff.executionSteps}\n- Quà/Phụ kiện: ${cleanAddonText(diff.suggestedAddOn)}\n- Định giá phễu: ${cleanPricingText(diff.pricingStrategy)}\n- Tác động: ${cleanAovText(diff.aovImpact)}`,
                                    `diff_${idx}`
                                  )
                                }
                                title="Sao chép chiến lược này"
                                aria-label="Sao chép chiến lược"
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                              >
                                {copiedKey === `diff_${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              </button>
                            </div>

                            <h5 className="font-bold text-white text-xs sm:text-sm leading-snug break-words">
                              {diff.title}
                            </h5>

                            <p className="text-xs text-zinc-300 leading-relaxed font-normal break-words">
                              {diff.executionSteps}
                            </p>
                          </div>

                          {/* Bảng Đặc Tả Thực Thi & Định Giá Phễu */}
                          <div className="rounded-xl border border-zinc-800/80 bg-black/60 overflow-hidden divide-y divide-zinc-800/70 text-xs mt-1">
                            {diff.suggestedAddOn && (
                              <div className="px-3 py-2 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                                <span className="shrink-0 text-zinc-400 font-bold text-[11px] flex items-center gap-1 sm:w-28 pt-0.5">
                                  🎁 Quà sỉ 1688:
                                </span>
                                <span className="text-zinc-200 leading-snug font-medium flex-1 break-words min-w-0">
                                  {cleanAddonText(diff.suggestedAddOn)}
                                </span>
                              </div>
                            )}

                            {diff.pricingStrategy && (
                              <div className="px-3 py-2 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                                <span className="shrink-0 text-zinc-400 font-bold text-[11px] flex items-center gap-1 sm:w-28 pt-0.5">
                                  🏷️ Định giá phễu:
                                </span>
                                <span className="text-zinc-200 leading-snug font-medium flex-1 break-words min-w-0">
                                  {cleanPricingText(diff.pricingStrategy)}
                                </span>
                              </div>
                            )}

                            {diff.aovImpact && (
                              <div className="px-3 py-2 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                                <span className="shrink-0 text-white font-bold text-[11px] flex items-center gap-1 sm:w-28 pt-0.5">
                                  📈 Tác động AOV:
                                </span>
                                <span className="text-white leading-snug font-bold flex-1 break-words min-w-0">
                                  {cleanAovText(diff.aovImpact)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. LỘ TRÌNH TEST ĐƠN AN TOÀN & ĐIỂM CẮT LỖ */}
                {(activeTab === "all" || activeTab === "roadmap") && parsedData.roadmap && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
                          <Target size={13} className="text-white" />
                        </div>
                        <h4 className="font-bold text-white text-xs sm:text-sm">
                          Lộ Trình Test 3 Giai Đoạn &amp; Kế Hoạch Cắt Lỗ
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopySnippet(
                            `LỘ TRÌNH TEST ĐƠN 3 GIAI ĐOẠN:\n- Số lượng test đợt 1: ${parsedData.roadmap.initialUnits}\n- Ngân sách Ads trần: ${parsedData.roadmap.maxAdSpendPerOrder}\n- Target ROAS: ${parsedData.roadmap.targetRoas}\n- Điều kiện cắt lỗ: ${parsedData.roadmap.stopLossCondition}\n\n${(parsedData.roadmap.phases || []).map((p) => `[${p.phase}] (${p.duration} - Ngân sách: ${p.budget})\n• Hành động: ${p.action}\n• KPI: ${p.kpiGoal}`).join("\n\n")}\n\nKế hoạch xả hàng: ${parsedData.roadmap.liquidationPlan || ""}\n\nLời khuyên vàng: ${parsedData.roadmap.expertVerdictAdvice}`,
                            "roadmap"
                          )
                        }
                        title="Sao chép lộ trình"
                        aria-label="Sao chép lộ trình"
                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey === "roadmap" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* 4 Chỉ Số Cốt Lõi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                          Số Lượng Nhập Test Đợt 1
                        </span>
                        <p className="text-xs text-white font-bold leading-relaxed">
                          {parsedData.roadmap.initialUnits}
                        </p>
                      </div>

                      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                          Target ROAS Chiến Dịch
                        </span>
                        <p className="text-xs text-white font-bold leading-relaxed">
                          {parsedData.roadmap.targetRoas}
                        </p>
                      </div>

                      <div className="sm:col-span-2 bg-black/60 border border-zinc-700/80 rounded-xl p-3.5 space-y-1">
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider block flex items-center gap-1">
                          <AlertTriangle size={12} className="text-white" />
                          Điều Kiện Dừng Lỗ (Stop-Loss KPI)
                        </span>
                        <p className="text-xs text-zinc-200 font-semibold leading-relaxed break-words">
                          {parsedData.roadmap.stopLossCondition}
                        </p>
                      </div>
                    </div>

                    {/* 3 Giai Đoạn Test Cụ Thể (Phases) */}
                    {parsedData.roadmap.phases && parsedData.roadmap.phases.length > 0 && (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-white" />
                          <h5 className="font-bold text-white text-xs tracking-wide uppercase">
                            Tiến Trình 3 Giai Đoạn Thực Chiến
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {parsedData.roadmap.phases.map((ph, pIdx) => (
                            <div
                              key={pIdx}
                              className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between hover:border-zinc-700 transition-colors"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-black font-bold shrink-0">
                                    {ph.duration}
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 shrink-0">
                                    💰 {ph.budget}
                                  </span>
                                </div>

                                <h6 className="font-bold text-white text-xs leading-snug break-words">
                                  {ph.phase}
                                </h6>

                                <div className="text-xs text-zinc-300 leading-relaxed space-y-1">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                    🎯 Hành động:
                                  </span>
                                  <p className="break-words text-xs text-zinc-300">{ph.action}</p>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-200 font-medium leading-snug break-words">
                                <span className="font-bold text-white">🏆 KPI:</span> {ph.kpiGoal}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Kế Hoạch Xả Hàng Thu Hồi Dòng Tiền (Liquidation Exit Plan) */}
                    {parsedData.roadmap.liquidationPlan && (
                      <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/80 border border-zinc-700/80 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-wider">
                          <RotateCcw size={12} className="text-white" />
                          <span>Kế Hoạch Xả Hàng &amp; Thu Hồi Vốn (Exit Strategy)</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed font-medium break-words">
                          {parsedData.roadmap.liquidationPlan}
                        </p>
                      </div>
                    )}

                    {/* Lời Khuyên Vàng */}
                    {parsedData.roadmap.expertVerdictAdvice && (
                      <div className="p-3.5 sm:p-4 rounded-xl bg-black/80 border border-zinc-700/80 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-wider">
                          <Crown size={13} className="text-white" />
                          <span>Lời Khuyên Vàng Từ Chuyên Gia</span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed italic font-normal break-words">
                          &ldquo;{parsedData.roadmap.expertVerdictAdvice}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Fallback nếu không parse được
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-xs text-zinc-300 space-y-4 whitespace-pre-line leading-relaxed font-sans">
                {result}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shadow-sm">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Chưa Có Dữ Liệu Thẩm Định</p>
              <p className="text-xs text-zinc-400 max-w-xs mt-1">
                Điền thông tin ý tưởng sản phẩm bên trái và bấm &ldquo;Bắt Đầu Thẩm Định Sản Phẩm Ngay&rdquo;.
              </p>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles size={13} className="text-amber-400" />
                <span>Thử Dữ Liệu Mẫu</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductValidatorOutput;
