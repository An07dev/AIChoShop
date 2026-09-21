"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  Lightbulb,
  Scale,
  Package,
  Flame,
  Target,
  DollarSign,
  Search,
  Zap,
  Boxes,
  Coins,
  Crown,
  Info,
  ChevronRight,
  LayoutList,
  FileText,
  Layers,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

export interface CriterionItem {
  criteria: string;
  score: number;
  maxScore: number;
  comment: string;
}

export interface RiskItem {
  title: string;
  content: string;
}

export interface StrategyItem {
  title: string;
  content: string;
}

export interface ParsedProductValidatorData {
  totalScore: number | null;
  verdict: string;
  summary: string;
  criteriaList: CriterionItem[];
  risks: RiskItem[];
  strategies: StrategyItem[];
  sampleQuantity: string;
  maxAdsBudget: string;
  expertAdvice: string;
  raw: string;
}

interface ProductValidatorOutputProps {
  result: string;
  loading: boolean;
  productName: string;
}

export function parseProductValidatorOutput(text: string): ParsedProductValidatorData | null {
  if (!text) return null;

  const findSection = (keywords: string[], nextKeywords: string[] = []) => {
    let bestStart = -1;
    let headerLen = 0;
    for (const kw of keywords) {
      const match = text.match(new RegExp(`^[ \\t]*(?:##|#)?\\s*[^\\n]*?${kw}[^\\n]*$`, "im"));
      if (match && match.index !== undefined) {
        bestStart = match.index;
        headerLen = match[0].length;
        break;
      }
    }
    if (bestStart === -1) return "";

    const contentStart = text.slice(bestStart + headerLen);
    let endIdx = contentStart.length;

    for (const nextKw of nextKeywords) {
      const nextMatch = contentStart.match(new RegExp(`^[ \\t]*(?:---|##|#)\\s*[^\\n]*?${nextKw}`, "im"));
      if (nextMatch && nextMatch.index !== undefined && nextMatch.index < endIdx) {
        endIdx = nextMatch.index;
      }
    }
    return contentStart.slice(0, endIdx).trim();
  };

  const s1 = findSection(["BẢNG ĐIỂM", "TIỀM NĂNG", "TIỀN NĂNG"], ["CẢNH BÁO", "TỬ HUYỆT", "RỦI RO ẨN"]);
  const s2 = findSection(["CẢNH BÁO", "TỬ HUYỆT", "RỦI RO ẨN"], ["CHIẾN LƯỢC", "BIẾN THỂ", "NÉ BẪY"]);
  const s3 = findSection(["CHIẾN LƯỢC", "BIẾN THỂ", "NÉ BẪY"], ["KẾT LUẬN", "LỘ TRÌNH", "TEST ĐƠN"]);
  const s4 = findSection(["KẾT LUẬN", "LỘ TRÌNH", "TEST ĐƠN"], []);

  // Section 1: Score, Verdict, Summary & Criteria Table
  let totalScore: number | null = null;
  let verdict = "";
  let summary = "";

  const scoreMatch = text.match(/(\d{1,3})\s*\/\s*100/i);
  if (scoreMatch) {
    totalScore = parseInt(scoreMatch[1], 10);
  }

  const verdictMatch = text.match(/(?:Điểm tổng quan:?)[^—\n-]*[—\-]\s*\**([^*—\n]+)\**/i);
  if (verdictMatch) {
    verdict = verdictMatch[1].replace(/\*\*/g, "").trim();
  } else if (totalScore !== null) {
    verdict = totalScore >= 75 ? "KHUYÊN NÊN LÀM" : totalScore >= 50 ? "CÂN NHẮC KỸ" : "RỦI RO CAO - NÊN BỎ";
  }

  const summaryMatch = text.match(/(?:Đánh giá ngắn gọn:?)\s*\**([^\n]+)\**/i);
  if (summaryMatch) {
    summary = summaryMatch[1].replace(/^\*+|\*+$/g, "").trim();
  }

  // Criteria Table
  const criteriaList: CriterionItem[] = [];
  const tableRows = (s1 || text).split("\n").filter((line) => line.includes("|") && !line.includes(":---") && !line.includes("Tiêu chí"));
  for (const row of tableRows) {
    const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 3) {
      const criteriaName = cols[0].replace(/\*\*/g, "").trim();
      const rawScore = cols[1].replace(/\*\*/g, "").trim();
      const scoreSubMatch = rawScore.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/);
      const scoreVal = scoreSubMatch ? parseFloat(scoreSubMatch[1]) : parseFloat(rawScore) || 7;
      const maxScoreVal = scoreSubMatch ? parseFloat(scoreSubMatch[2]) : 10;
      const comment = cols[2].replace(/\*\*/g, "").trim();
      criteriaList.push({
        criteria: criteriaName,
        score: scoreVal,
        maxScore: maxScoreVal,
        comment,
      });
    }
  }

  // Section 2: Risks
  const risks: RiskItem[] = [];
  const riskLines = (s2 || "").split("\n");
  for (const line of riskLines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("-") && !trimmed.startsWith("*")) continue;
    const m = trimmed.match(/^[-*]\s*\*\*(.+?)(?:\*\*:|\*\*)\s*(.+)$/);
    if (m) {
      risks.push({
        title: m[1].replace(/[:*]/g, "").trim(),
        content: m[2].replace(/^\*+/, "").trim(),
      });
    }
  }

  // Section 3: Strategies
  const strategies: StrategyItem[] = [];
  const stratLines = (s3 || "").split("\n");
  for (const line of stratLines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("-") && !trimmed.startsWith("*")) continue;
    const m = trimmed.match(/^[-*]\s*\*\*(.+?)(?:\*\*:|\*\*)\s*(.+)$/);
    if (m) {
      strategies.push({
        title: m[1].replace(/[:*]/g, "").trim(),
        content: m[2].replace(/^\*+/, "").trim(),
      });
    }
  }

  // Section 4: Conclusions
  let sampleQuantity = "";
  let maxAdsBudget = "";
  let expertAdvice = "";

  const qMatch = (s4 || "").match(/(?:Khuyến nghị số lượng nhập|Số lượng nhập thử nghiệm)[^:]*:(?:\s*\*\*)?\s*(.+)$/im);
  if (qMatch) sampleQuantity = qMatch[1].replace(/\*\*/g, "").trim();

  const bMatch = (s4 || "").match(/(?:Ngân sách Ads tối đa)[^:]*:(?:\s*\*\*)?\s*(.+)$/im);
  if (bMatch) maxAdsBudget = bMatch[1].replace(/\*\*/g, "").trim();

  const aMatch = (s4 || "").match(/(?:Lời khuyên vàng từ chuyên gia|Lời khuyên sống còn)[^:]*:(?:\s*\*\*)?\s*(.+)$/im);
  if (aMatch) expertAdvice = aMatch[1].replace(/\*\*/g, "").trim();

  return {
    totalScore,
    verdict,
    summary,
    criteriaList,
    risks,
    strategies,
    sampleQuantity,
    maxAdsBudget,
    expertAdvice,
    raw: text,
  };
}

export function ProductValidatorOutput({
  result,
  loading,
  productName,
}: ProductValidatorOutputProps) {
  const [activeTab, setActiveTab] = useState<"all" | "scores" | "risks" | "strategies" | "roadmap">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"analysis" | "raw">("analysis");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  const parsedData = useMemo(() => parseProductValidatorOutput(result), [result]);

  const handleCopyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopiedAll(true);
    showToast("Đã sao chép toàn bộ báo cáo thẩm định!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySnippet = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    showToast("Đã sao chép nội dung!");
    setTimeout(() => setCopiedSnippet(null), 2000);
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
      ["BÁO CÁO THẨM ĐỊNH SẢN PHẨM TREND & RỦI RO THƯƠNG MẠI"],
      ["Sản phẩm", productName || "Sản phẩm thẩm định"],
      ["Thời gian xuất", new Date().toLocaleString("vi-VN")],
      ["Điểm tổng quan", `${parsedData.totalScore ?? 0}/100 - ${parsedData.verdict}`],
      ["Đánh giá ngắn gọn", parsedData.summary],
      [],
      ["--- 1. BẢNG ĐIỂM TIÊU CHÍ THẨM ĐỊNH ---"],
      ["Tiêu chí", "Điểm (1-10)", "Nhận xét chi tiết từ chuyên gia"],
    ];

    for (const c of parsedData.criteriaList) {
      rows.push([c.criteria, `${c.score}/${c.maxScore}`, c.comment]);
    }

    rows.push([]);
    rows.push(["--- 2. CẢNH BÁO TỬ HUYỆT VẬN HÀNH & RỦI RO ẨN ---"]);
    rows.push(["Tên rủi ro", "Phân tích chi tiết"]);
    for (const r of parsedData.risks) {
      rows.push([r.title, r.content]);
    }

    rows.push([]);
    rows.push(["--- 3. CHIẾN LƯỢC BIẾN THỂ NGÁCH & NÉ BẪY GIÁ RẺ ---"]);
    rows.push(["Chiến lược", "Đề xuất triển khai"]);
    for (const s of parsedData.strategies) {
      rows.push([s.title, s.content]);
    }

    rows.push([]);
    rows.push(["--- 4. KẾT LUẬN & LỘ TRÌNH TEST ĐƠN AN TOÀN ---"]);
    rows.push(["Khuyến nghị số lượng nhập thử nghiệm", parsedData.sampleQuantity]);
    rows.push(["Ngân sách Ads tối đa cho phép", parsedData.maxAdsBudget]);
    rows.push(["Lời khuyên vàng từ chuyên gia", parsedData.expertAdvice]);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 35 }, { wch: 20 }, { wch: 60 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Thẩm Định Sản Phẩm");
    XLSX.writeFile(
      workbook,
      `Tham_dinh_${(productName || "san_pham").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}.xlsx`
    );
    showToast("Đã xuất file Excel!");
  };

  const getCriterionIcon = (criteria: string) => {
    const low = criteria.toLowerCase();
    if (low.includes("dung lượng") || low.includes("nhu cầu")) return <Search size={15} className="text-blue-400" />;
    if (low.includes("bão hòa") || low.includes("cạnh tranh")) return <Flame size={15} className="text-orange-400" />;
    if (low.includes("lợi nhuận") || low.includes("biên")) return <DollarSign size={15} className="text-emerald-400" />;
    if (low.includes("vòng đời") || low.includes("bền vững")) return <TrendingUp size={15} className="text-purple-400" />;
    if (low.includes("vận hành") || low.includes("vận chuyển")) return <Package size={15} className="text-amber-400" />;
    return <BarChart3 size={15} className="text-indigo-400" />;
  };

  const scoreNum = parsedData?.totalScore;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col min-h-0 relative overflow-hidden border border-slate-800">
      {/* Toast mini */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-slate-950/95 text-blue-400 text-xs font-semibold shadow-xl border border-blue-500/30 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          <Check size={13} className="stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hiệu ứng nền ambient */}
      <div className="absolute top-0 right-0 p-40 bg-blue-500/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-40 bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Header thanh công cụ (Toolbar) - 1 hàng ngang duy nhất trên cả mobile & desktop */}
      <div className="px-2.5 sm:px-4 py-2 sm:py-2.5 border-b border-slate-800 flex items-center justify-between gap-1.5 sm:gap-2 relative z-20 bg-slate-900/90 backdrop-blur-md shrink-0 flex-nowrap">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400 shrink-0 shadow-2xs">
            <BarChart3 size={14} className="sm:w-3.5 sm:h-3.5" />
          </div>
          <h2 className="font-bold text-white text-xs sm:text-sm truncate">
            Báo Cáo Thẩm Định
          </h2>
          {scoreNum !== null && scoreNum !== undefined && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border hidden md:inline truncate ${
                scoreNum >= 75
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : scoreNum >= 50
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
              }`}
            >
              {scoreNum}/100 • {parsedData?.verdict || (scoreNum >= 75 ? "NÊN LÀM" : "CÂN NHẮC")}
            </span>
          )}
        </div>

        {/* Hàng nút hành động - Cố định 1 hàng ngang */}
        {result && !loading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* Chế độ xem: Trực quan vs Gốc */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("analysis")}
                title="Dạng giao diện trực quan"
                className={`p-1 sm:px-2 sm:py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "analysis"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
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
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
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
              title="Xuất bảng điểm ra file Excel (.xlsx)"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs shrink-0"
            >
              <FileSpreadsheet size={12} className="text-emerald-400 sm:w-[13px] sm:h-[13px]" />
              <span className="hidden xs:inline">Excel</span>
            </button>

            {/* Nút Tải báo cáo (.txt): chỉ hiện trên màn lớn */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải tệp báo cáo .txt"
              className="hidden sm:flex p-1 sm:p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer shrink-0"
            >
              <Download size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Nút Sao chép tất cả */}
            <button
              type="button"
              onClick={handleCopyAll}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-all shadow-md shadow-blue-950/40 flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
            >
              {copiedAll ? (
                <>
                  <Check size={12} className="stroke-[3]" />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Chép hết</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tabs Phân Loại Danh Mục Đầu Ra (Pinned Sub-Tabs) - Cố định bên dưới toolbar */}
      {result && viewMode === "analysis" && !loading && (
        <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 border-b border-slate-800 bg-slate-950/70 flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar sm:custom-scrollbar shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "all"
                ? "bg-slate-800 text-blue-300 border border-blue-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>Tất Cả</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("scores")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "scores"
                ? "bg-slate-800 text-blue-300 border border-blue-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>1. Bảng Điểm ({parsedData?.criteriaList.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("risks")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "risks"
                ? "bg-slate-800 text-blue-300 border border-blue-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>2. Tử Huyệt Rủi Ro</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("strategies")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "strategies"
                ? "bg-slate-800 text-blue-300 border border-blue-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lightbulb size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>3. Chiến Lược Ngách</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("roadmap")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "roadmap"
                ? "bg-slate-800 text-blue-300 border border-blue-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Target size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>4. Lộ Trình Test</span>
          </button>
        </div>
      )}

      {/* Nội dung báo cáo */}
      <div className="flex-1 min-h-0 p-3 sm:p-5 overflow-y-auto custom-scrollbar relative z-10 pb-24 lg:pb-4 space-y-4 sm:space-y-5">
        {loading ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
              <Sparkles size={26} className="animate-spin text-blue-400 duration-1000" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Thẩm Định Tiềm Năng & Rủi Ro...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang đo lường dung lượng thị trường, bóc tách rủi ro cước vận chuyển, phí sàn và dự báo vòng đời trend...
              </p>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-5">
            {viewMode === "raw" ? (
              <textarea
                readOnly
                value={result}
                className="w-full h-[520px] bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
              />
            ) : parsedData ? (
              <div className="space-y-5">
                {/* 0. HERO SCORE CARD TỔNG QUAN */}
                {(activeTab === "all" || activeTab === "scores") && scoreNum !== null && scoreNum !== undefined && (
                  <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 relative z-10">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                        {/* Score Circle */}
                        <div
                          className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg shrink-0 border ${
                            scoreNum >= 75
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10"
                              : scoreNum >= 50
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-amber-500/10"
                              : "bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-rose-500/10"
                          }`}
                        >
                          <span className="text-2xl font-black leading-none">{scoreNum}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 mt-0.5">/ 100 Điểm</span>
                        </div>

                        {/* Verdict & Summary */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                              Chỉ Số Tiềm Năng Thương Mại
                            </span>
                            <span
                              className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                                scoreNum >= 75
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : scoreNum >= 50
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              }`}
                            >
                              {parsedData.verdict || (scoreNum >= 75 ? "KHUYÊN NÊN LÀM" : "CÂN NHẮC KỸ")}
                            </span>
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                            {productName || "Sản Phẩm Đang Thẩm Định"}
                          </h3>

                          {parsedData.summary && (
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal pt-0.5">
                              {parsedData.summary}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const tableText = result.match(/## 📊 1\.[\s\S]*?(?=---|$)/)?.[0] || result;
                          handleCopySnippet(tableText, "score");
                        }}
                        className="text-xs text-blue-400 hover:text-white px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-center sm:self-start"
                      >
                        {copiedSnippet === "score" ? <Check size={13} /> : <Copy size={13} />} Copy Bảng Điểm
                      </button>
                    </div>
                  </div>
                )}

                {/* 1. BẢNG ĐIỂM TIỀM NĂNG SẢN PHẨM (THANG ĐIỂM 100) */}
                {(activeTab === "all" || activeTab === "scores") && parsedData.criteriaList.length > 0 && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                          <BarChart3 size={16} />
                        </div>
                        <h3 className="font-bold text-white text-sm sm:text-base">
                          1. Bảng Điểm Tiềm Năng Sản Phẩm (Thang Điểm 100)
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const sec = result.match(/## 📊 1\.[\s\S]*?(?=---|$)/)?.[0] || "";
                          handleCopySnippet(sec, "sec1");
                        }}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-800 transition-colors"
                      >
                        {copiedSnippet === "sec1" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>Sao chép</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full min-w-[500px] text-left text-xs">
                        <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold text-[11px] border-b border-slate-800">
                          <tr>
                            <th className="px-3.5 py-2.5 w-1/3">Tiêu Chí Thẩm Định</th>
                            <th className="px-3.5 py-2.5 w-36 text-center">Thang Điểm (1-10)</th>
                            <th className="px-3.5 py-2.5">Nhận Xét Chi Tiết Từ Chuyên Gia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {parsedData.criteriaList.map((item, idx) => {
                            const pct = Math.min(100, Math.max(0, (item.score / item.maxScore) * 100));
                            const scoreColor =
                              item.score >= 8
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                                : item.score >= 6
                                ? "text-blue-400 bg-blue-500/10 border-blue-500/30"
                                : item.score >= 5
                                ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                                : "text-rose-400 bg-rose-500/10 border-rose-500/30";

                            const barColor =
                              item.score >= 8
                                ? "bg-emerald-500"
                                : item.score >= 6
                                ? "bg-blue-500"
                                : item.score >= 5
                                ? "bg-amber-500"
                                : "bg-rose-500";

                            return (
                              <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                                <td className="px-3.5 py-3 font-semibold text-slate-200">
                                  <div className="flex items-center gap-2">
                                    {getCriterionIcon(item.criteria)}
                                    <span>{item.criteria}</span>
                                  </div>
                                </td>
                                <td className="px-3.5 py-3">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border ${scoreColor}`}>
                                      {item.score} / {item.maxScore}
                                    </span>
                                    <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${barColor}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3.5 py-3 text-slate-300 leading-relaxed font-normal">
                                  {item.comment}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. CẢNH BÁO TỬ HUYỆT VẬN HÀNH & RỦI RO ẨN */}
                {(activeTab === "all" || activeTab === "risks") && parsedData.risks.length > 0 && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                          <AlertTriangle size={16} />
                        </div>
                        <h3 className="font-bold text-white text-sm sm:text-base">
                          2. Cảnh Báo Tử Huyệt Vận Hành & Rủi Ro Ẩn
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const sec = result.match(/## ⚠️ 2\.[\s\S]*?(?=---|$)/)?.[0] || "";
                          handleCopySnippet(sec, "sec2");
                        }}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-800 transition-colors"
                      >
                        {copiedSnippet === "sec2" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>Sao chép</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {parsedData.risks.map((risk, idx) => {
                        const isWeight = risk.title.toLowerCase().includes("cân nặng") || risk.title.toLowerCase().includes("thể tích");
                        const isCod = risk.title.toLowerCase().includes("hoàn hàng") || risk.title.toLowerCase().includes("cod");
                        const icon = isWeight ? (
                          <Scale size={18} className="text-amber-400 shrink-0" />
                        ) : isCod ? (
                          <Package size={18} className="text-rose-400 shrink-0" />
                        ) : (
                          <ShieldAlert size={18} className="text-red-400 shrink-0" />
                        );

                        const badgeText = isWeight ? "Cước Cân Nặng" : isCod ? "Rủi Ro COD" : "Chính Sách Sàn";
                        const badgeStyle = isWeight
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : isCod
                          ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                          : "bg-red-500/15 text-red-300 border-red-500/30";

                        return (
                          <div
                            key={idx}
                            className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/90 rounded-xl p-4 space-y-2.5 flex flex-col justify-between transition-all"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {icon}
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                                    {badgeText}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopySnippet(`${risk.title}:\n${risk.content}`, `risk_${idx}`)}
                                  className="text-slate-500 hover:text-slate-300 p-1"
                                >
                                  {copiedSnippet === `risk_${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                </button>
                              </div>
                              <h4 className="font-bold text-slate-100 text-xs leading-snug">
                                {risk.title}
                              </h4>
                              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                                {risk.content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. CHIẾN LƯỢC BIẾN THỂ NGÁCH & NÉ BẪY GIÁ RẺ */}
                {(activeTab === "all" || activeTab === "strategies") && parsedData.strategies.length > 0 && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                          <Lightbulb size={16} />
                        </div>
                        <h3 className="font-bold text-white text-sm sm:text-base">
                          3. Chiến Lược Biến Thể Ngách & Né Bẫy Giá Rẻ
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const sec = result.match(/## 💡 3\.[\s\S]*?(?=---|$)/)?.[0] || "";
                          handleCopySnippet(sec, "sec3");
                        }}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-800 transition-colors"
                      >
                        {copiedSnippet === "sec3" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>Sao chép</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {parsedData.strategies.map((strat, idx) => {
                        const isDiff = strat.title.toLowerCase().includes("biến thể") || strat.title.toLowerCase().includes("độc quyền");
                        const icon = isDiff ? (
                          <Zap size={18} className="text-indigo-400 shrink-0" />
                        ) : (
                          <Boxes size={18} className="text-purple-400 shrink-0" />
                        );
                        const badgeText = isDiff ? "Biến Thể Độc Quyền" : "Combo / Upsell Tăng AOV";

                        return (
                          <div
                            key={idx}
                            className="bg-slate-900/90 border border-indigo-900/30 hover:border-indigo-700/50 rounded-xl p-4 space-y-2.5 transition-all"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {icon}
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                  {badgeText}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopySnippet(`${strat.title}:\n${strat.content}`, `strat_${idx}`)}
                                className="text-slate-500 hover:text-slate-300 p-1"
                              >
                                {copiedSnippet === `strat_${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              </button>
                            </div>
                            <h4 className="font-bold text-slate-100 text-xs leading-snug">
                              {strat.title}
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed font-normal">
                              {strat.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. KẾT LUẬN & LỘ TRÌNH TEST ĐƠN AN TOÀN */}
                {(activeTab === "all" || activeTab === "roadmap") && (parsedData.sampleQuantity || parsedData.maxAdsBudget || parsedData.expertAdvice) && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                          <Target size={16} />
                        </div>
                        <h3 className="font-bold text-white text-sm sm:text-base">
                          4. Kết Luận & Lộ Trình Test Đơn An Toàn
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const sec = result.match(/## 🎯 4\.[\s\S]*?(?=---|$)/)?.[0] || "";
                          handleCopySnippet(sec, "sec4");
                        }}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-800 transition-colors"
                      >
                        {copiedSnippet === "sec4" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>Sao chép</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {parsedData.sampleQuantity && (
                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                            <Target size={15} />
                            <span>Khuyến Nghị Số Lượng Nhập Thử Nghiệm</span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                            {parsedData.sampleQuantity}
                          </p>
                        </div>
                      )}

                      {parsedData.maxAdsBudget && (
                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                            <Coins size={15} />
                            <span>Ngân Sách Ads Tối Đa Cho Phép</span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                            {parsedData.maxAdsBudget}
                          </p>
                        </div>
                      )}
                    </div>

                    {parsedData.expertAdvice && (
                      <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/30 space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                          <Crown size={16} />
                          <span>Lời Khuyên Vàng Từ Chuyên Gia</span>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed italic font-normal">
                          &ldquo;{parsedData.expertAdvice}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Fallback nếu không parse được
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 text-xs text-slate-300 space-y-4 whitespace-pre-line leading-relaxed font-sans">
                {result}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="font-semibold text-slate-300 text-sm">Chưa Có Dữ Liệu Thẩm Định</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Điền thông tin ý tưởng sản phẩm bên trái và bấm &ldquo;Thẩm Định Sản Phẩm Ngay&rdquo;.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductValidatorOutput;
