"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  FileSpreadsheet,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  RotateCcw,
  Tag,
  CheckCircle2,
  Table as TableIcon,
  LayoutList,
  FileText,
  Layers,
  ShieldBan,
  Maximize2,
  Minimize2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import { ScanReport } from "@/lib/policy-blacklist/dictionary";
import {
  PolicyCheckerData,
  ViolationItem,
  RiskAudit,
  SafeRewriteData,
  parsePolicyCheckerResult,
  SAMPLE_POLICY_DATA,
} from "@/lib/policy-checker/contract";

interface PolicyCheckerOutputProps {
  scanReport: ScanReport | null;
  aiOutput: string | null;
  isLoading: boolean;
  platform: string;
  isOfflineMode?: boolean;
  onUseSample?: () => void;
  onApplySafeText?: (cleanText: string) => void;
  elapsedSeconds?: number;
  onCancel?: () => void;
  onRetryWithAi?: () => void;
}

const POLICY_STAGES = [
  { upToSeconds: 4, text: "🛡️ Đang rà quét từ khóa nhạy cảm theo từ điển chính sách sàn 2026..." },
  { upToSeconds: 10, text: "🔍 Đối chiếu quy chế kiểm duyệt Shopee, TikTok Shop & Meta Ads..." },
  { upToSeconds: 20, text: "⚠️ Bóc tách danh sách vi phạm: Từ cấm, cam kết y tế & thương hiệu..." },
  { upToSeconds: 35, text: "✍️ Viết lại bản mô tả sạch 100% giữ trọn sức hút bán hàng đỉnh cao..." },
  { upToSeconds: 60, text: "✨ Hoàn tất báo cáo rủi ro & giải pháp bảo vệ gian hàng..." },
];

/**
 * Hàm sao chép an toàn 2 tầng chống lỗi webview / Safari iOS
 */
async function safeCopyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback sang Tầng 2
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

export function PolicyCheckerOutput({
  scanReport,
  aiOutput,
  isLoading,
  platform,
  isOfflineMode = false,
  onUseSample,
  onApplySafeText,
  elapsedSeconds = 0,
  onCancel,
  onRetryWithAi,
}: PolicyCheckerOutputProps) {
  const [activeTab, setActiveTab] = useState<"all" | "rewrite" | "violations" | "audit" | "tips">("all");
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [violationStyle, setViolationStyle] = useState<"list" | "table">("list");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Phím tắt Esc đóng toàn màn hình
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Phân tích dữ liệu JSON schema chuẩn hóa với 4-tier resilient parser
  // Chỉ hiển thị báo cáo chi tiết sau khi người dùng bấm Quét (aiOutput đã có)
  const parsed: PolicyCheckerData | null = useMemo(() => {
    if (!aiOutput) return null;
    return parsePolicyCheckerResult(aiOutput, {
      platform,
      contentType: "Mô tả sản phẩm",
      text: scanReport?.text || "",
    });
  }, [aiOutput, scanReport, platform]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCopy = async (text: string, key: string, label: string = "Đã sao chép!") => {
    if (!text) return;
    const ok = await safeCopyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      showToast(label);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1800);
    }
  };

  const handleCopyForbiddenList = () => {
    if (!parsed || parsed.violations.length === 0) return;
    const list = parsed.forbiddenTags.length > 0
      ? parsed.forbiddenTags.join(", ")
      : parsed.violations.map((v) => v.phrase).join(", ");
    handleCopy(list, "forbiddenList", "Đã chép danh sách từ cấm!");
  };

  const handleCopyTsv = () => {
    if (!parsed || parsed.violations.length === 0) return;
    const headers = [
      "STT",
      "Từ ngữ vi phạm",
      "Mức độ",
      "Nhóm chính sách",
      "Cơ chế phạt",
      "Cụm từ an toàn",
      "Hướng dẫn sửa",
    ];
    const rows = parsed.violations.map((v, i) => [
      i + 1,
      v.phrase,
      v.severity,
      v.category,
      v.reason,
      v.replacementPhrase,
      v.solution,
    ]);
    const tsv = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
    handleCopy(tsv, "tsv", "Đã chép bảng vi phạm (dán được vào Excel / Google Sheets)!");
  };

  const handleExportExcel = () => {
    if (!parsed) return;
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Danh sách điểm vi phạm
      const violationsData = parsed.violations.map((v, i) => ({
        STT: i + 1,
        "Từ ngữ vi phạm": v.phrase,
        "Mức độ rủi ro": v.severityBadge || v.severity,
        "Nhóm chính sách": v.category,
        "Cơ chế thuật toán AI phạt": v.reason,
        "Cụm từ thay thế an toàn (1-chạm)": v.replacementPhrase,
        "Giải pháp khắc phục": v.solution,
      }));
      const wsViolations = XLSX.utils.json_to_sheet(violationsData);
      XLSX.utils.book_append_sheet(wb, wsViolations, "DiemViPham");

      // Sheet 2: Bản viết lại sạch 100% & Báo cáo tổng thể
      const safeData = [
        { Muc: "Nền tảng kiểm duyệt", NoiDung: parsed.platform || platform },
        { Muc: "Mức độ rủi ro", NoiDung: parsed.audit.riskBadge || parsed.audit.riskLevel },
        { Muc: "Điểm số an toàn", NoiDung: `${parsed.audit.safetyScore}/100` },
        { Muc: "Tóm tắt kết luận rủi ro", NoiDung: parsed.audit.summary },
        { Muc: "Dự báo hình phạt từ sàn", NoiDung: parsed.audit.penaltyConsequences?.join("; ") || "Chưa có" },
        { Muc: "Chính sách vi phạm", NoiDung: parsed.audit.violatedPolicies?.join("; ") || "Chưa có" },
        { Muc: "Tiêu đề gợi ý chuẩn SEO", NoiDung: parsed.rewrite.headline || "Chưa có" },
        { Muc: "Bản Viết Lại An Toàn 100%", NoiDung: parsed.rewrite.fullCleanText || "Chưa có" },
        { Muc: "Lời kêu gọi hành động an toàn (CTA)", NoiDung: parsed.rewrite.safeCta || "Chưa có" },
        ...parsed.tips.map((tip, idx) => ({
          Muc: `Lời khuyên thực chiến #${idx + 1}`,
          NoiDung: tip,
        })),
      ];
      const wsSafe = XLSX.utils.json_to_sheet(safeData);
      XLSX.utils.book_append_sheet(wb, wsSafe, "BanVietLai_AnToan");

      const fileName = `bao-cao-chinh-sach-${(parsed.platform || platform)
        .toLowerCase()
        .replace(/\s+/g, "-")}-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast("Đã tải xuống file Excel!");
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      showToast("Không thể xuất file Excel.");
    }
  };

  const handleDownloadTxt = () => {
    if (!parsed) return;
    const content = `BÁO CÁO THẨM ĐỊNH CHÍNH SÁCH SÀN TMĐT
Nền tảng: ${parsed.platform || platform}
Điểm an toàn: ${parsed.audit.safetyScore}/100
Mức độ rủi ro: ${parsed.audit.riskBadge || parsed.audit.riskLevel}

TÓM TẮT:
${parsed.audit.summary}

HÌNH PHẠT DỰ BÁO:
${parsed.audit.penaltyConsequences?.map((p) => `- ${p}`).join("\n")}

DANH SÁCH VI PHẠM:
${parsed.violations
        .map(
          (v, i) =>
            `${i + 1}. [${v.phrase}] (${v.severity}) -> Thay bằng: "${v.replacementPhrase}"\n   Lý do: ${v.reason}`
        )
        .join("\n\n")}

BẢN VIẾT LẠI AN TOÀN 100%:
${parsed.rewrite.fullCleanText}

LỜI KHUYÊN SÀN:
${parsed.tips?.map((t) => `- ${t}`).join("\n")}
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-chinh-sach-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải xuống file báo cáo .txt!");
  };

  const score = parsed?.audit.safetyScore ?? (scanReport?.score ?? 100);
  const isDanger = score < 60 || parsed?.audit.riskLevel === "CRITICAL";
  const isWarning = !isDanger && (score < 90 || parsed?.audit.riskLevel === "HIGH" || parsed?.audit.riskLevel === "MEDIUM");

  const rawJsonView = useMemo(() => {
    if (!parsed) return "";
    return JSON.stringify(parsed, null, 2);
  }, [parsed]);

  return (
    <div
      className={`bg-black text-white rounded-2xl shadow-2xl flex flex-col w-full h-auto lg:min-h-[560px] lg:h-full relative overflow-visible lg:overflow-hidden border border-zinc-800/90 transition-all ${isFullscreen ? "fixed inset-2 sm:inset-4 z-50 rounded-2xl shadow-2xl bg-black overflow-y-auto" : ""
        }`}
    >
      {/* Toast mini tinh tế */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-zinc-900/95 text-white text-xs font-semibold shadow-2xl border border-zinc-700 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
          <Check size={13} className="text-emerald-400 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP TOOLBAR: CỐ ĐỊNH 1 HÀNG NGANG, TỐI GIẢN & TỐI ƯU MOBILE            */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-20 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-zinc-800/80 flex items-center justify-between gap-1.5 sm:gap-2 bg-black/95 backdrop-blur-xl shrink-0 flex-nowrap rounded-t-2xl">
        {/* Left: Icon + Title + Platform */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${isDanger
              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
              : isWarning
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}
          >
            {isDanger ? (
              <ShieldAlert size={14} />
            ) : isWarning ? (
              <AlertTriangle size={14} />
            ) : (
              <ShieldCheck size={14} />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
              <span className="hidden sm:inline">Báo Cáo Kiểm Duyệt Sàn</span>
              <span className="sm:hidden">Kiểm Duyệt</span>
            </h2>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 hidden md:inline truncate">
            {parsed?.platform || platform}
          </span>
          {isOfflineMode && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
              ⚡ Ngoại Tuyến
            </span>
          )}
        </div>

        {/* Right: Quick Action Buttons */}
        {parsed && !isLoading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* View Mode: Trực quan vs JSON */}
            <div className="bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("visual")}
                title="Dạng giao diện trực quan"
                className={`px-2 py-1 rounded text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${viewMode === "visual"
                  ? "bg-white text-black shadow-xs"
                  : "text-zinc-400 hover:text-white"
                  }`}
              >
                <LayoutList size={12} />
                <span className="hidden md:inline">Trực quan</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Dạng JSON Schema chuẩn hóa"
                className={`px-2 py-1 rounded text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${viewMode === "raw"
                  ? "bg-white text-black shadow-xs"
                  : "text-zinc-400 hover:text-white"
                  }`}
              >
                <FileText size={12} />
                <span className="hidden md:inline">JSON</span>
              </button>
            </div>

            {/* Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Xuất báo cáo ra file Excel (.xlsx)"
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
            >
              <FileSpreadsheet size={13} className="text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Tải tệp text: desktop only */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải tệp text báo cáo (.txt)"
              className="hidden sm:flex p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              <Download size={13} />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Thu nhỏ lại" : "Mở rộng toàn màn hình"}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            {/* Nút Chép Bản Sạch (High-Contrast White Button) - Icon only on mobile */}
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  parsed.rewrite.fullCleanText || rawJsonView,
                  "all",
                  "Đã sao chép bản viết lại an toàn 100%!"
                )
              }
              className="bg-white hover:bg-zinc-200 text-black text-[11px] sm:text-xs font-bold p-1.5 sm:px-3 sm:py-1.5 rounded-lg transition-all shadow-md flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
              title="Sao chép bản sạch 100%"
              aria-label="Sao chép bản sạch"
            >
              {copiedKey === "all" ? (
                <>
                  <Check size={13} className="stroke-[3] text-black" />
                  <span className="hidden sm:inline">Đã chép</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-black" />
                  <span className="hidden sm:inline">Chép bản sạch</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-TABS PHÂN LOẠI: VUỐT NGANG MƯỢT MÀ TRÊN MOBILE                     */}
      {/* ========================================================================= */}
      {parsed && !isLoading && viewMode === "visual" && (
        <div className="sticky top-[45px] sm:top-[47px] z-10 px-3 sm:px-4 py-2 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "all"
              ? "bg-zinc-800 text-white border border-zinc-700 shadow-xs"
              : "text-zinc-400 hover:text-zinc-200"
              }`}
          >
            <Layers size={13} />
            <span>Tất Cả</span>
          </button>

          {/* Tab 1: Bản Sạch 100% */}
          {parsed.rewrite && (
            <button
              type="button"
              onClick={() => setActiveTab("rewrite")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "rewrite"
                ? "bg-white text-black shadow-sm"
                : "text-zinc-400 hover:text-white"
                }`}
            >
              <Sparkles size={13} className={activeTab === "rewrite" ? "text-black" : "text-emerald-400"} />
              <span className="sm:hidden">1. Bản Sạch</span>
              <span className="hidden sm:inline">1. Bản Sạch 100%</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${activeTab === "rewrite" ? "bg-black/10 text-black" : "bg-emerald-500/20 text-emerald-300"
                }`}>
                Dùng Ngay
              </span>
            </button>
          )}

          {/* Tab 2: Điểm Vi Phạm */}
          <button
            type="button"
            onClick={() => setActiveTab("violations")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "violations"
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white"
              }`}
          >
            <AlertTriangle size={13} className={activeTab === "violations" ? "text-black" : "text-rose-400"} />
            <span className="sm:hidden">2. Vi Phạm</span>
            <span className="hidden sm:inline">2. Điểm Vi Phạm</span>
            {parsed.violations.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === "violations" ? "bg-black/10 text-black" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}>
                {parsed.violations.length}
              </span>
            )}
          </button>

          {/* Tab 3: Đánh Giá Rủi Ro */}
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "audit"
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white"
              }`}
          >
            <ShieldCheck size={13} className={activeTab === "audit" ? "text-black" : "text-blue-400"} />
            <span className="sm:hidden">3. Điểm Số</span>
            <span className="hidden sm:inline">3. Đánh Giá Rủi Ro</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === "audit" ? "bg-black/10 text-black" : "bg-zinc-800 text-zinc-300"
              }`}>
              {score}/100
            </span>
          </button>

          {/* Tab 4: Lời Khuyên Sàn */}
          <button
            type="button"
            onClick={() => setActiveTab("tips")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "tips"
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-white"
              }`}
          >
            <Info size={13} className={activeTab === "tips" ? "text-black" : "text-amber-400"} />
            <span className="sm:hidden">4. Lời Khuyên</span>
            <span className="hidden sm:inline">4. Lời Khuyên Sàn</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VÙNG NỘI DUNG CHÍNH (DARKMODE TỐI GIẢN, TEXT TRẮNG NỀN ĐEN)            */}
      {/* ========================================================================= */}
      <div className="w-full lg:flex-1 lg:min-h-0 p-3 sm:p-4 lg:overflow-y-auto custom-scrollbar relative z-10 pb-20 lg:pb-4 bg-black">
        {isLoading ? (
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="AI Đang Soi Từ Cấm & Tối Ưu Bản Sạch..."
            stages={POLICY_STAGES}
            accentColor="emerald"
            minHeightClass="min-h-[360px]"
          />
        ) : parsed ? (
          <div className="space-y-3.5 sm:space-y-4 max-w-5xl mx-auto">
            {viewMode === "raw" ? (
              /* DẠNG XEM JSON SCHEMA NGUYÊN BẢN */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                  <span className="font-mono text-[11px]">JSON Schema Chuẩn Hóa:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(rawJsonView, "rawJson", "Đã sao chép JSON Schema!")}
                    className="p-1 sm:px-2 sm:py-1 hover:text-white flex items-center gap-1 cursor-pointer font-medium transition-colors"
                    title="Sao chép JSON Schema"
                    aria-label="Sao chép JSON"
                  >
                    <Copy size={12} />
                    <span className="hidden sm:inline">Sao chép JSON</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={rawJsonView}
                  className="w-full h-[520px] bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-zinc-200 leading-relaxed resize-none focus:outline-hidden custom-scrollbar selection:bg-zinc-800"
                />
              </div>
            ) : (
              /* GIAO DIỆN TRỰC QUAN HIỆN ĐẠI (DARKMODE TỐI GIẢN) */
              <div className="space-y-3.5 sm:space-y-4">
                {/* Banner Chế Độ Quét Ngoại Tuyến */}
                {isOfflineMode && (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm animate-fadeIn">
                    <div className="flex items-start sm:items-center gap-2.5 text-xs">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        🛡️
                      </span>
                      <div>
                        <p className="font-bold text-amber-300">
                          Chế Độ Quét Ngoại Tuyến (Offline Resilience)
                        </p>
                        <p className="text-zinc-400 text-[11px] mt-0.5">
                          Báo cáo rà soát và bản làm sạch được sinh tự động bằng từ điển quy chế sàn TMĐT 2026.
                        </p>
                      </div>
                    </div>
                    {onRetryWithAi && (
                      <button
                        type="button"
                        onClick={onRetryWithAi}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs active:scale-95"
                      >
                        <Sparkles size={12} /> Quét Lại Với AI
                      </button>
                    )}
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* BLOC 1: ĐÁNH GIÁ RỦI RO & ĐIỂM SỐ AN TOÀN                     */}
                {/* ------------------------------------------------------------- */}
                {(activeTab === "all" || activeTab === "audit") && (
                  <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3.5 sm:p-4 space-y-3">
                    {/* Header: Score Hero Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-base border shrink-0 ${isDanger
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : isWarning
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            }`}
                        >
                          {score}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                              Thẩm Định An Toàn Sàn
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${isDanger
                                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                : isWarning
                                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                  : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                }`}
                            >
                              {parsed.audit.riskBadge || parsed.audit.riskLevel}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            Thang điểm: <span className="text-white font-bold font-mono">{score}/100</span> (100 là an toàn tuyệt đối)
                          </div>
                        </div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full sm:w-48 bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          style={{ width: `${Math.max(score, 5)}%` }}
                          className={`h-full transition-all duration-500 ${isDanger
                            ? "bg-rose-500"
                            : isWarning
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                            }`}
                        />
                      </div>
                    </div>

                    {/* Tóm tắt tình trạng */}
                    {parsed.audit.summary && (
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                        <span className="text-zinc-400 font-semibold">Tình trạng: </span>
                        {parsed.audit.summary}
                      </p>
                    )}

                    {/* Dự báo hình phạt sàn nếu đăng nguyên bản */}
                    {parsed.audit.penaltyConsequences && parsed.audit.penaltyConsequences.length > 0 && (
                      <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/25 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 uppercase tracking-wide">
                          <ShieldBan size={14} />
                          <span>Dự Báo Hình Phạt Nếu Đăng Nguyên Bản:</span>
                        </div>
                        <ul className="space-y-1 text-xs text-rose-200/90 pl-4 list-disc font-sans">
                          {parsed.audit.penaltyConsequences.map((p, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Danh sách điều khoản vi phạm */}
                    {parsed.audit.violatedPolicies && parsed.audit.violatedPolicies.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider shrink-0 font-medium">
                          Chính sách vi phạm:
                        </span>
                        {parsed.audit.violatedPolicies.map((p, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* BLOC 2: BẢN VIẾT LẠI AN TOÀN 100% (HIGH-CONVERTING COPY)      */}
                {/* ------------------------------------------------------------- */}
                {(activeTab === "all" || activeTab === "rewrite") && parsed.rewrite && (
                  <div className="rounded-xl border border-zinc-700/80 bg-zinc-950 p-3.5 sm:p-4 space-y-3 shadow-xl">
                    {/* Header: Title + Actions */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-white text-black shrink-0">
                          <Sparkles size={14} />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <h3 className="font-bold text-white text-xs sm:text-sm tracking-tight uppercase truncate">
                            Bản Viết Lại An Toàn 100%
                          </h3>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide hidden xs:inline">
                            Chuẩn Sàn 2026
                          </span>
                        </div>
                      </div>

                      {/* Nút hành động (Icon-only trên mobile) */}
                      <div className="flex items-center gap-1.5 justify-end shrink-0">
                        {onApplySafeText && (
                          <button
                            type="button"
                            onClick={() => {
                              onApplySafeText(parsed.rewrite.fullCleanText);
                              showToast("Đã dán đè bản sạch vào ô nhập!");
                            }}
                            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs shrink-0"
                            title="Dán đè bản sạch này vào ô nhập bên trái"
                            aria-label="Dán vào ô nhập"
                          >
                            <RotateCcw size={13} />
                            <span className="hidden sm:inline">Dán vào ô nhập</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              parsed.rewrite.fullCleanText,
                              "safeRewrite",
                              "Đã sao chép toàn bộ bản sạch!"
                            )
                          }
                          className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-zinc-200 text-black transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 shrink-0"
                          title="Sao chép toàn bộ bản sạch"
                          aria-label="Sao chép toàn bộ bản sạch"
                        >
                          {copiedKey === "safeRewrite" ? (
                            <>
                              <Check size={13} className="stroke-[3] text-black" />
                              <span className="hidden sm:inline">Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span className="hidden sm:inline">Sao chép bản sạch</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Headline chuẩn SEO gợi ý */}
                    {parsed.rewrite.headline && (
                      <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                            Tiêu Đề Bán Hàng Gợi Ý (Chuẩn SEO &amp; Không Dính Từ Cấm):
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-white leading-snug">
                            {parsed.rewrite.headline}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(parsed.rewrite.headline, "headline", "Đã chép tiêu đề!")
                          }
                          className="p-1.5 sm:px-2 sm:py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition cursor-pointer shrink-0 mt-0.5 flex items-center gap-1"
                          title="Sao chép tiêu đề này"
                          aria-label="Sao chép tiêu đề"
                        >
                          {copiedKey === "headline" ? (
                            <Check size={12} className="text-emerald-400 stroke-[2.5]" />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span className="hidden sm:inline">Chép</span>
                        </button>
                      </div>
                    )}

                    {/* Điểm nổi bật bán hàng (Selling Points) */}
                    {parsed.rewrite.sellingPoints && parsed.rewrite.sellingPoints.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {parsed.rewrite.sellingPoints.map((sp, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-1.5"
                          >
                            <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                            <span className="leading-snug">{sp}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Toàn văn bản sạch */}
                    <div className="bg-black/70 p-3 sm:p-4 rounded-xl border border-zinc-800 text-zinc-100 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-text font-sans">
                      {parsed.rewrite.fullCleanText}
                    </div>

                    {/* CTA an toàn khuyên dùng */}
                    {parsed.rewrite.safeCta && (
                      <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-2">
                        <div className="text-xs text-zinc-300 min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase mr-1.5">
                            CTA Hợp Quy Chế Sàn:
                          </span>
                          &quot;{parsed.rewrite.safeCta}&quot;
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(parsed.rewrite.safeCta, "cta", "Đã chép CTA an toàn!")
                          }
                          className="p-1.5 sm:px-2 sm:py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                          title="Sao chép CTA an toàn"
                          aria-label="Sao chép CTA an toàn"
                        >
                          {copiedKey === "cta" ? (
                            <Check size={12} className="text-emerald-400 stroke-[2.5]" />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span className="hidden sm:inline">Chép</span>
                        </button>
                      </div>
                    )}

                    {/* Footer đếm ký tự & từ */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 size={13} />
                        <span>Đã loại bỏ 100% từ cấm &amp; lôi kéo ngoài sàn</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* BLOC 3: DANH SÁCH ĐIỂM VI PHẠM (CARD LIST / MATRIX TABLE)     */}
                {/* ------------------------------------------------------------- */}
                {(activeTab === "all" || activeTab === "violations") && (
                  <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3.5 sm:p-4 space-y-3">
                    {/* Header mục vi phạm */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded bg-rose-500/20 text-rose-400 shrink-0">
                          <AlertTriangle size={14} />
                        </div>
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider truncate">
                          {parsed.violations.length} Điểm Vi Phạm Cần Gỡ Bỏ
                        </h3>
                      </div>

                      {/* Tiện ích chuyển đổi & sao chép (Icon-only trên mobile) */}
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {/* Toggle kiểu xem List / Table */}
                        <div className="hidden sm:flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 items-center">
                          <button
                            type="button"
                            onClick={() => setViolationStyle("list")}
                            className={`p-1 rounded text-xs transition cursor-pointer ${violationStyle === "list"
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-400 hover:text-white"
                              }`}
                            title="Dạng danh sách thẻ trực quan"
                          >
                            <LayoutList size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViolationStyle("table")}
                            className={`p-1 rounded text-xs transition cursor-pointer ${violationStyle === "table"
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-400 hover:text-white"
                              }`}
                            title="Dạng bảng ma trận chi tiết"
                          >
                            <TableIcon size={13} />
                          </button>
                        </div>

                        {/* Nút copy TSV (Icon-only on mobile) */}
                        <button
                          type="button"
                          onClick={handleCopyTsv}
                          className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition cursor-pointer flex items-center gap-1 active:scale-95"
                          title="Sao chép bảng để dán vào Excel / Sheets"
                          aria-label="Sao chép bảng vi phạm"
                        >
                          <FileSpreadsheet size={12} className="text-emerald-400" />
                          <span className="hidden sm:inline">Chép Bảng</span>
                        </button>

                        {/* Nút copy danh sách từ cấm (Icon-only on mobile) */}
                        <button
                          type="button"
                          onClick={handleCopyForbiddenList}
                          className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition cursor-pointer flex items-center gap-1 active:scale-95"
                          title="Sao chép toàn bộ từ cấm dạng phẩy"
                          aria-label="Sao chép danh sách từ cấm"
                        >
                          <Copy size={12} />
                          <span className="hidden sm:inline">Chép từ cấm</span>
                        </button>
                      </div>
                    </div>

                    {/* Danh Sách Các Lỗi Vi Phạm */}
                    {parsed.violations.length > 0 ? (
                      violationStyle === "list" ? (
                        /* GIAO DIỆN DANH SÁCH THẺ GỌN GÀNG - TỐI ƯU MOBILE */
                        <div className="space-y-2">
                          {parsed.violations.map((v, index) => (
                            <div
                              key={v.id || index}
                              className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80 hover:border-zinc-700/80 transition-all space-y-2"
                            >
                              {/* Hàng 1: Thứ tự, Từ vi phạm & Nhóm */}
                              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                  <span className="text-[10px] font-mono font-bold text-zinc-500">
                                    #{index + 1}
                                  </span>
                                  <span className="font-mono font-bold text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/25 break-words">
                                    &quot;{v.phrase}&quot;
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-medium">
                                    • {v.category}
                                  </span>
                                </div>
                                {v.severityBadge && (
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 border ${v.severity === "CRITICAL"
                                      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                      : v.severity === "HIGH"
                                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                        : "bg-zinc-800 text-zinc-300 border-zinc-700"
                                      }`}
                                  >
                                    {v.severityBadge}
                                  </span>
                                )}
                              </div>

                              {/* Hàng 2: Cụm từ thay thế 1-chạm (Icon-only trên mobile) */}
                              {v.replacementPhrase && (
                                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                                  <div className="text-xs min-w-0 flex-1 leading-snug">
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase mr-1.5">
                                      Thay bằng:
                                    </span>
                                    <span className="font-semibold text-white">
                                      &quot;{v.replacementPhrase}&quot;
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopy(
                                        v.replacementPhrase,
                                        `sol-${index}`,
                                        `Đã sao chép: "${v.replacementPhrase}"`
                                      )
                                    }
                                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                                    title="Sao chép cụm từ thay thế này"
                                    aria-label="Sao chép cụm từ thay thế"
                                  >
                                    {copiedKey === `sol-${index}` ? (
                                      <Check size={12} className="stroke-[3] text-emerald-400" />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                    <span className="hidden sm:inline">Chép</span>
                                  </button>
                                </div>
                              )}

                              {/* Hàng 3: Cơ chế thuật toán AI phạt */}
                              {v.reason && (
                                <p className="text-[11px] text-zinc-400 leading-relaxed pl-0.5">
                                  <span className="text-zinc-500 font-medium">Lý do phạt:</span> {v.reason}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* GIAO DIỆN BẢNG MA TRẬN - DESKTOP */
                        <div className="overflow-x-auto rounded-lg border border-zinc-800">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-semibold">
                                <th className="py-2.5 px-2.5 w-8 text-center">#</th>
                                <th className="py-2.5 px-3 min-w-[130px]">Từ Ngữ Vi Phạm</th>
                                <th className="py-2.5 px-3 min-w-[110px]">Nhóm &amp; Mức Độ</th>
                                <th className="py-2.5 px-3 min-w-[160px]">Cơ Chế Thuật Toán Phạt</th>
                                <th className="py-2.5 px-3 min-w-[200px]">Cụm Từ Thay Thế An Toàn</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
                              {parsed.violations.map((v, index) => (
                                <tr key={v.id || index} className="hover:bg-zinc-900/40">
                                  <td className="py-2.5 px-2.5 text-center text-zinc-500 font-mono text-[11px] align-top">
                                    {index + 1}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-semibold text-rose-400 text-xs break-words align-top">
                                    &quot;{v.phrase}&quot;
                                  </td>
                                  <td className="py-2.5 px-3 text-[11px] text-zinc-400 align-top">
                                    <div>{v.category}</div>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-1 inline-block uppercase ${v.severity === "CRITICAL"
                                        ? "bg-rose-500/20 text-rose-300"
                                        : v.severity === "HIGH"
                                          ? "bg-amber-500/20 text-amber-300"
                                          : "bg-zinc-800 text-zinc-300"
                                        }`}
                                    >
                                      {v.severityBadge || v.severity}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-400 text-[11px] break-words leading-relaxed align-top">
                                    {v.reason}
                                  </td>
                                  <td className="py-2.5 px-3 align-top">
                                    <div className="flex items-start justify-between gap-2 text-white bg-zinc-950 p-2 rounded border border-zinc-800 text-xs">
                                      <span className="break-words leading-relaxed flex-1 font-medium">
                                        {v.replacementPhrase || v.solution}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCopy(
                                            v.replacementPhrase || v.solution,
                                            `sol-tbl-${index}`,
                                            `Đã sao chép: "${v.replacementPhrase || v.solution}"`
                                          )
                                        }
                                        className="text-zinc-400 hover:text-white transition cursor-pointer shrink-0 mt-0.5"
                                        title="Sao chép từ thay thế này"
                                      >
                                        {copiedKey === `sol-tbl-${index}` ? (
                                          <Check size={12} className="text-emerald-400" />
                                        ) : (
                                          <Copy size={12} />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      <div className="p-4 text-center text-zinc-400 bg-zinc-900/40 rounded-lg">
                        <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-1" />
                        <span className="text-xs font-medium text-white">
                          Không phát hiện vi phạm từ cấm nào! Nội dung đạt chuẩn an toàn sàn.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* BLOC 4: LỜI KHUYÊN TỪ CHUYÊN GIA & BỘ TỪ KHÓA                 */}
                {/* ------------------------------------------------------------- */}
                {(activeTab === "all" || activeTab === "tips") && (
                  <div className="space-y-3">
                    {/* Khối lời khuyên */}
                    {parsed.tips && parsed.tips.length > 0 && (
                      <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3.5 sm:p-4 space-y-2">
                        <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-800 text-white">
                          <Info size={14} className="text-amber-400" />
                          <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                            Lời Khuyên Thực Chiến Dành Riêng Cho {parsed.platform || platform}
                          </h3>
                        </div>
                        <div className="space-y-1.5">
                          {parsed.tips.map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                              <p className="leading-relaxed font-sans">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bộ từ khóa an toàn khuyên dùng */}
                    {parsed.safeTags && parsed.safeTags.length > 0 && (
                      <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3.5 sm:p-4 space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                          <div className="flex items-center gap-1.5 text-white">
                            <Tag size={13} className="text-emerald-400" />
                            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                              Từ Khóa An Toàn Khuyên Dùng
                            </h3>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {parsed.safeTags.map((tag, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleCopy(tag, `safeTag-${idx}`, `Đã chép: "${tag}"`)}
                              className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer flex items-center gap-1 ${copiedKey === `safeTag-${idx}`
                                ? "bg-white text-black font-bold"
                                : "bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-zinc-700 hover:text-white"
                                }`}
                            >
                              {copiedKey === `safeTag-${idx}` ? (
                                <Check size={11} className="stroke-[3] text-black" />
                              ) : (
                                <span className="text-emerald-400 text-[11px]">+</span>
                              )}
                              <span>{tag}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Danh sách từ cấm tuyệt đối né */}
                    {parsed.forbiddenTags && parsed.forbiddenTags.length > 0 && (
                      <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3.5 sm:p-4 space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                          <div className="flex items-center gap-1.5 text-white">
                            <ShieldBan size={13} className="text-rose-400" />
                            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                              Danh Sách Từ Cấm Cần Tuyệt Đối Né Tránh
                            </h3>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {parsed.forbiddenTags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-900 text-rose-300 border border-zinc-800"
                            >
                              ✕ {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* EMPTY STATE TỐI GIẢN */
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 text-zinc-400 space-y-3 bg-black">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <ShieldAlert size={22} className="text-zinc-300" />
            </div>

            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-sm text-white">
                Chưa Có Kết Quả Soi Vi Phạm
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Nhập nội dung ở khung bên trái và bấm &quot;Quét Vi Phạm &amp; Đề Xuất Bản Sạch&quot; để đối chiếu thuật toán chính sách sàn.
              </p>
            </div>

            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Sparkles size={13} className="text-zinc-300" />
                <span>Thử dữ liệu mẫu thực chiến</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
