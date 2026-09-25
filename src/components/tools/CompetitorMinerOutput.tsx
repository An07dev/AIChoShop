"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  Target,
  Swords,
  Flame,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Quote,
  Video,
  ShieldCheck,
  FileSpreadsheet,
  TrendingUp,
  Box,
  Layers,
  Sparkle,
  LayoutList,
  HelpCircle,
  MessageSquareWarning,
  Zap,
  Award,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import {
  parseCompetitorMinerResult,
  type CompetitorMinerData,
  type CompetitorFlaw,
  type ComparisonRow,
  type VideoHookItem,
  type SubtleListingDescription,
  type PriceObjectionHandling,
  type OperationalDefense,
} from "@/lib/competitor-miner/contract";

export {
  parseCompetitorMinerResult,
  parseCompetitorMinerResult as parseCompetitorMinerOutput,
};

export type {
  CompetitorMinerData,
  CompetitorFlaw,
  ComparisonRow,
  VideoHookItem,
  SubtleListingDescription,
  PriceObjectionHandling,
  OperationalDefense,
};

interface CompetitorMinerOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  onUseSample?: () => void;
  elapsedSeconds?: number;
  onCancel?: () => void;
  isOfflineMode?: boolean;
}

const COMPETITOR_STAGES = [
  { upToSeconds: 4, text: "Đang đọc & lọc dữ liệu đánh giá 1-3 sao của đối thủ..." },
  { upToSeconds: 10, text: "Bóc tách các tử huyệt chí mạng về chất lượng, bao bì & dịch vụ..." },
  { upToSeconds: 20, text: "Thiết kế ma trận so sánh vượt trội & tuyên ngôn USP đắt giá..." },
  { upToSeconds: 35, text: "Soạn thảo kịch bản video hook 3s & kịch bản xử lý đối thủ phá giá..." },
  { upToSeconds: 60, text: "Hoàn thiện chiến lược định vị và lời khuyên phòng thủ..." },
];

export function CompetitorMinerOutput({
  result,
  loading,
  productName,
  onUseSample,
  elapsedSeconds = 0,
  onCancel,
  isOfflineMode,
}: CompetitorMinerOutputProps) {
  const [activeTab, setActiveTab] = useState<"all" | "flaws" | "usp" | "hooks" | "objection" | "defense">("all");
  const [viewMode, setViewMode] = useState<"interactive" | "raw">("interactive");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!result) return null;
    return parseCompetitorMinerResult(result);
  }, [result]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCopy = (text: string, key: string, label: string = "Đã sao chép!") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(label);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const handleCopyFlawsAll = () => {
    if (!parsed || parsed.flaws.length === 0) return;
    const text = parsed.flaws
      .map((f, i) => `【TỬ HUYỆT ${i + 1}】${f.title} (${f.severityBadge})\n- Trích lời chê của khách: "${f.realReviewQuote}"\n- Tâm lý khách: ${f.customerPsychology}\n- Nguyên nhân đối thủ bị lỗi: ${f.rootCause}\n- Đòn phản công của Shop: ${f.shopCounterAttack}`)
      .join("\n\n");
    handleCopy(text, "flaws_all", "Đã sao chép toàn bộ tử huyệt đối thủ!");
  };

  const handleCopyTableAll = () => {
    if (!parsed || parsed.comparisonMatrix.length === 0) return;
    const rows = parsed.comparisonMatrix
      .map((r) => `• ${r.criteria}:\n  - Đối thủ: ${r.competitorFlaw}\n  - Shop bạn: ${r.shopAdvantage}\n  - Bằng chứng: ${r.proofMechanism}`)
      .join("\n\n");
    const text = `MA TRẬN SO SÁNH VƯỢT TRỘI ĐỐI THỦ:\n\n★ TUYÊN NGÔN ĐỊNH VỊ:\n"${parsed.battleOverview.coreSlogan}"\n\n${rows}`;
    handleCopy(text, "table_all", "Đã sao chép ma trận so sánh USP!");
  };

  const handleCopyHooksAll = () => {
    if (!parsed) return;
    const hookText = parsed.conversionWeapons.videoHooks
      .map((h) => `【${h.angleLabel}】\n- Hook 3s: "${h.hook3s}"\n- Cảnh quay: ${h.visualScene}\n- CTA: ${h.callToAction}`)
      .join("\n\n");
    const descText = parsed.conversionWeapons.subtleListingDescription?.body
      ? `\n\n【ĐOẠN MÔ TẢ ĐÁ XÉO ĐỐI THỦ TINH TẾ】\n${parsed.conversionWeapons.subtleListingDescription.headline}\n${parsed.conversionWeapons.subtleListingDescription.body}`
      : "";
    handleCopy(hookText + descText, "hooks_all", "Đã sao chép bộ video hooks & mô tả!");
  };

  const handleCopyDefenseAll = () => {
    if (!parsed || parsed.operationalDefense.mustAvoidChecklist.length === 0) return;
    const checklist = parsed.operationalDefense.mustAvoidChecklist.map((d) => `• ${d}`).join("\n");
    const wow = parsed.operationalDefense.unboxingWowFactor ? `\n\n★ Mẹo Unboxing: ${parsed.operationalDefense.unboxingWowFactor}` : "";
    handleCopy(`QUY TẮC PHÒNG THỦ VẬN HÀNH:\n${checklist}${wow}`, "defense_all", "Đã sao chép lời khuyên phòng thủ!");
  };

  const handleExportExcel = () => {
    if (!parsed) return;
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Tử huyệt
      const flawRows = parsed.flaws.map((f, idx) => ({
        STT: idx + 1,
        "Loại Tử Huyệt": f.title,
        "Mức Độ": f.severityBadge,
        "Trích Lời Chê Của Khách": f.realReviewQuote,
        "Tâm Lý Khách": f.customerPsychology,
        "Nguyên Nhân Đối Thủ": f.rootCause,
        "Đòn Phản Công Của Shop": f.shopCounterAttack,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flawRows), "1_TuHuyet_DoiThu");

      // Sheet 2: Ma trận USP
      const matrixRows = parsed.comparisonMatrix.map((r, idx) => ({
        STT: idx + 1,
        "Tiêu Chí So Sánh": r.criteria,
        "Đối Thủ Thị Trường (Sơ hở)": r.competitorFlaw,
        "Shop Bạn (Vượt trội)": r.shopAdvantage,
        "Bằng Chứng Kiểm Chứng": r.proofMechanism,
      }));
      if (parsed.battleOverview.coreSlogan) {
        matrixRows.unshift({
          STT: 0,
          "Tiêu Chí So Sánh": "★ TUYÊN NGÔN ĐỊNH VỊ",
          "Đối Thủ Thị Trường (Sơ hở)": "",
          "Shop Bạn (Vượt trội)": parsed.battleOverview.coreSlogan,
          "Bằng Chứng Kiểm Chứng": parsed.battleOverview.marketOpportunityBadge,
        });
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(matrixRows), "2_MaTran_USP");

      // Sheet 3: Video Hooks & Mô tả
      const hookRows = parsed.conversionWeapons.videoHooks.map((h, idx) => ({
        STT: idx + 1,
        "Góc Tiếp Cận": h.angleLabel,
        "Câu Hook 3 Giây": h.hook3s,
        "Mô Tả Cảnh Quay": h.visualScene,
        "Lời Kêu Gọi (CTA)": h.callToAction,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hookRows), "3_Video_Hooks");

      // Sheet 4: Phòng thủ & Xử lý phá giá
      const defenseRows = parsed.operationalDefense.mustAvoidChecklist.map((c, idx) => ({
        STT: idx + 1,
        "Hạng Mục": "Quy tắc kiểm soát kho",
        "Nội Dung": c,
      }));
      if (parsed.conversionWeapons.priceObjectionHandling?.consultantScript) {
        defenseRows.push({
          STT: defenseRows.length + 1,
          "Hạng Mục": "Kịch bản xử lý khách so sánh giá rẻ hơn",
          "Nội Dung": parsed.conversionWeapons.priceObjectionHandling.consultantScript,
        });
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(defenseRows), "4_PhongThu_ChotSale");

      const safeName = (productName || "san-pham").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      const fileName = `doc-vi-doi-thu-usp-${safeName}-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast("Đã xuất file Excel vũ khí USP & đối thủ!");
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      showToast("Không thể xuất file Excel.");
    }
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (productName || "san-pham").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    a.download = `doc-vi-doi-thu-${safeName}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải tệp .txt!");
  };

  return (
    <div className="bg-black text-white rounded-2xl border border-zinc-800 shadow-2xl flex flex-col w-full h-auto lg:h-full lg:min-h-0 relative overflow-visible lg:overflow-hidden transition-all">
      {/* Toast mini phản hồi */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-zinc-950 text-white text-xs font-semibold shadow-xl border border-zinc-700 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          <Check size={13} className="text-white stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header thanh công cụ tối giản - Dark Mode High Contrast (Sticky trên mobile) */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-zinc-800 bg-black flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-20 flex-nowrap sticky top-0 rounded-t-2xl">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center bg-white text-black shrink-0 shadow-xs font-bold">
            <Swords size={14} />
          </div>
          <h2 className="font-bold text-white text-xs sm:text-sm whitespace-nowrap">
            Vũ Khí &amp; USP Độc Quyền
          </h2>
          {isOfflineMode && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white text-black">
              Offline Blueprint
            </span>
          )}
        </div>

        {/* Nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* Chế độ xem: Trực quan vs Gốc */}
            <div className="bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("interactive")}
                title="Dạng giao diện trực quan"
                className={`p-1 sm:px-2 sm:py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "interactive"
                    ? "bg-white text-black shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <LayoutList size={12} className="sm:w-[13px] sm:h-[13px]" />
                <span className="hidden md:inline">Trực quan</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Dạng văn bản markdown gốc"
                className={`p-1 sm:px-2 sm:py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-white text-black shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <FileText size={12} className="sm:w-[13px] sm:h-[13px]" />
                <span className="hidden md:inline">Gốc</span>
              </button>
            </div>

            {/* Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Xuất dữ liệu ra file Excel (.xlsx)"
              aria-label="Xuất dữ liệu ra file Excel"
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
            >
              <FileSpreadsheet size={14} className="text-white" />
            </button>

            {/* Nút Tải .txt */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải tệp .txt"
              aria-label="Tải tệp .txt"
              className="hidden sm:flex w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Download size={14} />
            </button>

            {/* Nút Sao chép tất cả: CHỈ HIỂN THỊ ICON */}
            <button
              type="button"
              onClick={() => handleCopy(result, "all", "Đã sao chép toàn bộ kết quả phân tích!")}
              title={copiedKey === "all" ? "Đã sao chép tất cả" : "Sao chép tất cả"}
              aria-label="Sao chép tất cả"
              className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              {copiedKey === "all" ? (
                <Check size={14} className="stroke-[3]" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tabs Phân Loại Danh Mục Đầu Ra - Cố định bên dưới toolbar */}
      {result && viewMode === "interactive" && !loading && (
        <div className="sticky top-[41px] sm:top-[45px] z-10 px-2 sm:px-3 py-1.5 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "all"
                ? "bg-white text-black shadow-xs font-bold"
                : "text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800"
            }`}
          >
            <Layers size={12} />
            <span>Tất Cả</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("flaws")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "flaws"
                ? "bg-white text-black shadow-xs font-bold"
                : "text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800"
            }`}
          >
            <Flame size={12} />
            <span>Tử Huyệt ({parsed?.flaws.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("usp")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "usp"
                ? "bg-white text-black shadow-xs font-bold"
                : "text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800"
            }`}
          >
            <Sparkles size={12} />
            <span>Ma Trận USP</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hooks")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "hooks"
                ? "bg-white text-black shadow-xs font-bold"
                : "text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800"
            }`}
          >
            <Video size={12} />
            <span>Video Hooks</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("objection")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "objection"
                ? "bg-white text-black shadow-xs font-bold"
                : "text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800"
            }`}
          >
            <Zap size={12} />
            <span>Xử Lý Giá Rẻ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("defense")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "defense"
                ? "bg-white text-black shadow-xs font-bold"
                : "text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800"
            }`}
          >
            <ShieldCheck size={12} />
            <span>Phòng Thủ</span>
          </button>
        </div>
      )}

      {/* Vùng hiển thị nội dung: Cuộn cả trang trên Mobile, Cuộn nội bộ trên Desktop */}
      <div className="flex-1 min-h-0 p-3 sm:p-5 lg:overflow-y-auto custom-scrollbar relative z-10 pb-28 lg:pb-6 space-y-4 sm:space-y-5">
        {loading ? (
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="AI Đang Bóc Tách Đánh Giá Chê & Săn Tử Huyệt Đối Thủ..."
            stages={COMPETITOR_STAGES}
            accentColor="rose"
            minHeightClass="min-h-[360px]"
          />
        ) : result && parsed ? (
          <div className="space-y-4">
            {viewMode === "raw" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Dữ liệu gốc:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result, "rawText", "Đã sao chép dữ liệu gốc!")}
                    title="Sao chép dữ liệu gốc"
                    aria-label="Sao chép dữ liệu gốc"
                    className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition cursor-pointer active:scale-90"
                  >
                    {copiedKey === "rawText" ? <Check size={13} className="text-white stroke-[2.5]" /> : <Copy size={13} />}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={result}
                  className="w-full h-[520px] bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-zinc-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* ========================================================================= */}
                {/* 0. BẢNG TỔNG QUAN TƯƠNG QUAN LỰC LƯỢNG (BATTLE OVERVIEW)                   */}
                {/* ========================================================================= */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-zinc-800/80">
                    <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-white text-black border border-white break-words max-w-full text-left">
                        {parsed.battleOverview.marketOpportunityBadge}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-zinc-900 text-zinc-300 border border-zinc-700 break-words max-w-full text-left">
                        Sơ hở đối thủ: <b className="text-white">{parsed.battleOverview.competitorVulnerabilityScore}/100</b>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(parsed.battleOverview.coreSlogan, "slogan", "Đã chép slogan định vị!")}
                      title="Sao chép slogan định vị"
                      aria-label="Sao chép slogan định vị"
                      className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0 self-start"
                    >
                      {copiedKey === "slogan" ? <Check size={13} className="text-white stroke-[2.5]" /> : <Copy size={13} />}
                    </button>
                  </div>

                  {/* Slogan trọng tâm */}
                  <div className="p-2.5 sm:p-3 bg-zinc-900/90 rounded-lg border border-zinc-700 space-y-1">
                    <div className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Quote size={11} className="text-white shrink-0" />
                      <span>Tuyên ngôn định vị:</span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white italic select-text break-words leading-relaxed">
                      &ldquo;{parsed.battleOverview.coreSlogan}&rdquo;
                    </div>
                  </div>

                  {parsed.battleOverview.strategicSummary && (
                    <p className="text-xs text-zinc-300 leading-relaxed break-words select-text">
                      {parsed.battleOverview.strategicSummary}
                    </p>
                  )}
                </div>

                {/* ========================================================================= */}
                {/* 1. BÓC TÁCH TỬ HUYỆT CHÍ MẠNG CỦA ĐỐI THỦ                                 */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "flaws") && parsed.flaws.length > 0 && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4 space-y-3">
                    <div className="flex items-start justify-between pb-2 border-b border-zinc-800 gap-2">
                      <div className="flex items-start gap-1.5 min-w-0 flex-1">
                        <Flame size={15} className="text-white shrink-0 mt-0.5" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider break-words leading-snug">
                          1. Tử Huyệt Đối Thủ ({parsed.flaws.length})
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyFlawsAll}
                        title="Sao chép tất cả tử huyệt đối thủ"
                        aria-label="Sao chép tất cả tử huyệt đối thủ"
                        className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0 self-start"
                      >
                        {copiedKey === "flaws_all" ? <Check size={13} className="text-white stroke-[2.5]" /> : <Copy size={13} />}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                      {parsed.flaws.map((flaw, idx) => (
                        <div
                          key={flaw.id || idx}
                          className="bg-zinc-900/80 rounded-xl border border-zinc-800 p-3 sm:p-3.5 space-y-2 hover:border-zinc-700 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                {flaw.severityBadge && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                                    {flaw.severityBadge}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-white break-words leading-snug">
                                {flaw.title}
                              </h4>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  `Tử huyệt: ${flaw.title}\nLời chê: "${flaw.realReviewQuote}"\nTâm lý khách: ${flaw.customerPsychology}\nĐòn phản công: ${flaw.shopCounterAttack}`,
                                  `flaw-${idx}`,
                                  `Đã chép tử huyệt ${idx + 1}!`
                                )
                              }
                              title={`Sao chép tử huyệt ${idx + 1}`}
                              aria-label={`Sao chép tử huyệt ${idx + 1}`}
                              className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
                            >
                              {copiedKey === `flaw-${idx}` ? <Check size={12} className="text-white stroke-[2.5]" /> : <Copy size={12} />}
                            </button>
                          </div>

                          {/* Trích lời chê của khách */}
                          {flaw.realReviewQuote && (
                            <div className="p-2 sm:p-2.5 rounded-lg bg-black border border-zinc-800 text-xs text-zinc-300 leading-relaxed italic break-words select-text flex items-start gap-1.5">
                              <Quote size={12} className="text-zinc-500 shrink-0 mt-0.5" />
                              <div className="break-words min-w-0">
                                <span className="font-semibold text-zinc-400 not-italic block text-[10px] mb-0.5">Khách chê:</span>
                                &ldquo;{flaw.realReviewQuote}&rdquo;
                              </div>
                            </div>
                          )}

                          {/* Chi tiết nguyên nhân & Đòn phản công */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                              <span className="font-bold text-zinc-400 flex items-center gap-1 text-[11px] sm:text-xs">
                                <AlertTriangle size={12} className="text-zinc-400 shrink-0" />
                                Nguyên nhân đối thủ:
                              </span>
                              <p className="text-zinc-300 leading-relaxed select-text break-words">
                                {flaw.customerPsychology}
                              </p>
                              {flaw.rootCause && (
                                <p className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/80 break-words">
                                  Tử huyệt kỹ thuật: {flaw.rootCause}
                                </p>
                              )}
                            </div>

                            <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-950 border border-zinc-700 space-y-1">
                              <span className="font-bold text-white flex items-center gap-1 text-[11px] sm:text-xs">
                                <ShieldCheck size={12} className="text-white shrink-0" />
                                Đòn phản công của Shop:
                              </span>
                              <p className="text-white font-medium leading-relaxed select-text break-words">
                                {flaw.shopCounterAttack}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. MA TRẬN SO SÁNH HƠN HẲN & VŨ KHÍ USP (KILLER COMPARISON MATRIX)        */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "usp") && parsed.comparisonMatrix.length > 0 && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4 space-y-3">
                    <div className="flex items-start justify-between pb-2 border-b border-zinc-800 gap-2">
                      <div className="flex items-start gap-1.5 min-w-0 flex-1">
                        <Sparkles size={15} className="text-white shrink-0 mt-0.5" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider break-words leading-snug">
                          2. Ma Trận So Sánh USP
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyTableAll}
                        title="Sao chép toàn bộ bảng so sánh"
                        aria-label="Sao chép toàn bộ bảng so sánh"
                        className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0 self-start"
                      >
                        {copiedKey === "table_all" ? <Check size={13} className="text-white stroke-[2.5]" /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* Dạng Mobile Card: Hiển thị 100% nội dung không bị cuộn ngang */}
                    <div className="block md:hidden space-y-2.5">
                      {parsed.comparisonMatrix.map((row, idx) => (
                        <div key={idx} className="bg-zinc-900/70 rounded-xl border border-zinc-800 p-3 space-y-2">
                          <div className="font-bold text-white text-xs flex items-center justify-between pb-1.5 border-b border-zinc-800">
                            <span className="flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="break-words">{row.criteria}</span>
                            </span>
                          </div>

                          {/* Đối thủ */}
                          <div className="bg-black/60 rounded-lg p-2 border border-zinc-800/80 space-y-1">
                            <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                              <XCircle size={12} className="text-zinc-500 shrink-0" />
                              <span>Đối thủ:</span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed break-words select-text">
                              {row.competitorFlaw}
                            </p>
                          </div>

                          {/* Shop bạn */}
                          <div className="bg-zinc-950 rounded-lg p-2 border border-zinc-700 space-y-1">
                            <div className="text-[11px] font-bold text-white flex items-center gap-1">
                              <CheckCircle2 size={12} className="text-white shrink-0" />
                              <span>Shop bạn:</span>
                            </div>
                            <p className="text-xs text-white font-medium leading-relaxed break-words select-text">
                              {row.shopAdvantage}
                            </p>
                            {row.proofMechanism && (
                              <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80 flex items-start gap-1">
                                <span className="shrink-0">🛡️</span>
                                <span className="break-words"><b>Bằng chứng:</b> {row.proofMechanism}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dạng Table Desktop */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800 bg-black custom-scrollbar">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-300">
                            <th className="p-3 font-bold w-[22%]">Tiêu chí</th>
                            <th className="p-3 font-bold w-[38%] text-zinc-400">
                              <div className="flex items-center gap-1.5">
                                <XCircle size={13} className="text-zinc-500 shrink-0" />
                                <span>Đối thủ (Kém)</span>
                              </div>
                            </th>
                            <th className="p-3 font-bold w-[40%] text-white bg-zinc-800/80">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-white shrink-0" />
                                <span>Shop Bạn (Ưu thế)</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
                          {parsed.comparisonMatrix.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                              <td className="p-3 font-bold text-white align-top bg-zinc-950/60 break-words">
                                {row.criteria}
                              </td>
                              <td className="p-3 text-zinc-400 align-top leading-relaxed break-words">
                                {row.competitorFlaw}
                              </td>
                              <td className="p-3 text-white font-medium align-top leading-relaxed bg-zinc-900/40">
                                <div className="space-y-1">
                                  <span className="break-words">{row.shopAdvantage}</span>
                                  {row.proofMechanism && (
                                    <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800 break-words">
                                      🛡️ <b>Bằng chứng:</b> {row.proofMechanism}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. BỘ CÂU HOOK & ĐOẠN MÔ TẢ CẠNH TRANH                                    */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "hooks") && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4 space-y-3">
                    <div className="flex items-start justify-between pb-2 border-b border-zinc-800 gap-2">
                      <div className="flex items-start gap-1.5 min-w-0 flex-1">
                        <Video size={15} className="text-white shrink-0 mt-0.5" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider break-words leading-snug">
                          3. Video Hooks 3s &amp; Mô Tả Cạnh Tranh
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyHooksAll}
                        title="Sao chép tất cả kịch bản hook"
                        aria-label="Sao chép tất cả kịch bản hook"
                        className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0 self-start"
                      >
                        {copiedKey === "hooks_all" ? <Check size={13} className="text-white stroke-[2.5]" /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* Danh sách 3 Video Hooks */}
                    {parsed.conversionWeapons.videoHooks.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Top 3 Video Hook 3s (TikTok / Reels)
                        </span>

                        <div className="grid grid-cols-1 gap-2.5">
                          {parsed.conversionWeapons.videoHooks.map((hook, idx) => (
                            <div
                              key={hook.id || idx}
                              className="bg-zinc-900/70 rounded-xl border border-zinc-800 p-3 sm:p-3.5 space-y-2 hover:border-zinc-700 transition-all"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded bg-white text-black shrink-0">
                                  {hook.angleLabel}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleCopy(`"${hook.hook3s}"\nCảnh: ${hook.visualScene}\nCTA: ${hook.callToAction}`, `hook-${idx}`, `Đã chép hook ${idx + 1}!`)}
                                  title={`Sao chép kịch bản hook ${idx + 1}`}
                                  aria-label={`Sao chép kịch bản hook ${idx + 1}`}
                                  className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
                                >
                                  {copiedKey === `hook-${idx}` ? <Check size={12} className="text-white stroke-[2.5]" /> : <Copy size={12} />}
                                </button>
                              </div>

                              <div className="text-white text-xs sm:text-sm font-bold leading-relaxed bg-black p-2.5 rounded-lg border border-zinc-800 break-words select-text">
                                &ldquo;{hook.hook3s}&rdquo;
                              </div>

                              <div className="text-xs text-zinc-400 space-y-0.5 pt-0.5">
                                <p className="break-words">🎬 <b>Cảnh quay:</b> {hook.visualScene}</p>
                                <p className="break-words">👉 <b>Kêu gọi (CTA):</b> {hook.callToAction}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Đoạn mô tả sản phẩm đá xéo đối thủ */}
                    {parsed.conversionWeapons.subtleListingDescription?.body && (
                      <div className="bg-zinc-900/90 rounded-xl border border-zinc-700 p-3 sm:p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5 min-w-0">
                            <FileText size={14} className="text-white shrink-0" />
                            <span className="break-words">
                              {parsed.conversionWeapons.subtleListingDescription.headline || "Đoạn Mô Tả Sản Phẩm Đá Xéo Tinh Tế"}
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                `${parsed.conversionWeapons.subtleListingDescription.headline}\n\n${parsed.conversionWeapons.subtleListingDescription.body}\n\nCam kết:\n${parsed.conversionWeapons.subtleListingDescription.safeGuarantees.join("\n")}`,
                                "subtle_desc",
                                "Đã chép đoạn mô tả sản phẩm!"
                              )
                            }
                            title="Sao chép đoạn mô tả sản phẩm"
                            aria-label="Sao chép đoạn mô tả sản phẩm"
                            className="w-7 h-7 rounded-md bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0 shadow-sm"
                          >
                            {copiedKey === "subtle_desc" ? <Check size={13} className="text-black stroke-[2.5]" /> : <Copy size={13} />}
                          </button>
                        </div>

                        <div className="text-zinc-200 text-xs sm:text-sm leading-relaxed bg-black p-2.5 sm:p-3 rounded-lg border border-zinc-800 break-words select-text font-normal">
                          {parsed.conversionWeapons.subtleListingDescription.body}
                        </div>

                        {parsed.conversionWeapons.subtleListingDescription.safeGuarantees?.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 block">Cam kết dập tắt nỗi sợ:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                              {parsed.conversionWeapons.subtleListingDescription.safeGuarantees.map((g, i) => (
                                <div key={i} className="text-[11px] text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-800 flex items-start gap-1.5">
                                  <CheckCircle2 size={12} className="text-white shrink-0 mt-0.5" />
                                  <span className="break-words leading-snug">{g}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 4. KỊCH BẢN XỬ LÝ KHÁCH SO SÁNH GIÁ RẺ HƠN (OBJECTION HANDLING)             */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "objection") && parsed.conversionWeapons.priceObjectionHandling?.consultantScript && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                    <div className="flex items-start justify-between pb-2 border-b border-zinc-800 gap-2">
                      <div className="flex items-start gap-1.5 min-w-0 flex-1">
                        <Zap size={15} className="text-white shrink-0 mt-0.5" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider break-words leading-snug">
                          4. Kịch Bản Chat Khi Khách Chê Đắt
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            parsed.conversionWeapons.priceObjectionHandling.consultantScript,
                            "objection_script",
                            "Đã chép kịch bản tư vấn giá!"
                          )
                        }
                        title="Sao chép kịch bản tư vấn giá"
                        aria-label="Sao chép kịch bản tư vấn giá"
                        className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0 self-start"
                      >
                        {copiedKey === "objection_script" ? <Check size={13} className="text-white stroke-[2.5]" /> : <Copy size={13} />}
                      </button>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/90 rounded-lg border border-zinc-800 space-y-1.5">
                      <div className="text-xs font-bold text-zinc-400 flex items-start gap-1.5">
                        <HelpCircle size={13} className="text-white shrink-0 mt-0.5" />
                        <span className="break-words">Khách hỏi: &ldquo;{parsed.conversionWeapons.priceObjectionHandling.question}&rdquo;</span>
                      </div>

                      <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed bg-black p-2.5 sm:p-3 rounded-lg border border-zinc-800 select-text break-words">
                        {parsed.conversionWeapons.priceObjectionHandling.consultantScript}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 5. CẨM NANG PHÒNG THỦ VẬN HÀNH & UNBOXING WOW FACTOR                       */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "defense") && parsed.operationalDefense?.mustAvoidChecklist?.length > 0 && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                    <div className="flex items-start justify-between pb-2 border-b border-zinc-800 gap-2">
                      <div className="flex items-start gap-1.5 min-w-0 flex-1">
                        <ShieldCheck size={15} className="text-white shrink-0 mt-0.5" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider break-words leading-snug">
                          5. Quy Tắc Vận Hành Chống Hoàn Hàng
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyDefenseAll}
                        title="Sao chép checklist phòng thủ"
                        aria-label="Sao chép checklist phòng thủ"
                        className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0 self-start"
                      >
                        {copiedKey === "defense_all" ? <Check size={13} className="text-white stroke-[2.5]" /> : <Copy size={13} />}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                      {parsed.operationalDefense.mustAvoidChecklist.map((tip, idx) => (
                        <div
                          key={idx}
                          className="bg-zinc-900/80 rounded-xl border border-zinc-800 p-2.5 sm:p-3 space-y-1.5 flex flex-col justify-between hover:border-zinc-700 transition-all"
                        >
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <CheckCircle2 size={13} className="text-white shrink-0" />
                              Quy tắc {idx + 1}
                            </span>
                            <p className="text-xs text-zinc-300 leading-relaxed break-words select-text">
                              {tip}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {parsed.operationalDefense.unboxingWowFactor && (
                      <div className="p-2.5 sm:p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-xs text-zinc-200 leading-relaxed flex items-start gap-2">
                        <Sparkle size={14} className="text-white shrink-0 mt-0.5" />
                        <div className="break-words">
                          <b className="text-white">Tuyệt chiêu Unboxing:</b>{" "}
                          <span>{parsed.operationalDefense.unboxingWowFactor}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-inner font-bold">
              <Swords size={24} />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="font-semibold text-zinc-200 text-sm">Chưa Có Dữ Liệu Khai Thác Đối Thủ</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Nhập tên sản phẩm &amp; dán review chê 1-3 sao của đối thủ bên trái, sau đó bấm &ldquo;Đọc Vị Đối Thủ &amp; Tìm USP Ngay&rdquo;.
              </p>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Sparkle size={13} />
                <span>Thử dữ liệu mẫu để xem giao diện</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CompetitorMinerOutput;
