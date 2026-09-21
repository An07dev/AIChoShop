"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  Camera,
  Layers,
  Sliders,
  FileText,
  FileSpreadsheet,
  Ban,
  Lightbulb,
  Maximize2,
  Aperture,
  CheckCircle2,
  Sparkle,
  Eye,
  LayoutList,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

export interface StudioPromptItem {
  index: number;
  rawHeader: string;
  title: string;
  promptCode: string;
  intention: string;
  aspectRatio: string;
  lensInfo?: string;
  versionInfo?: string;
}

export interface PhotographerTipItem {
  title: string;
  content: string;
}

export interface ParsedPhotoPrompterData {
  prompts: StudioPromptItem[];
  negativePrompt: string;
  tips: PhotographerTipItem[];
  raw: string;
}

interface PhotoPrompterOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  onUseSample?: () => void;
}

function cleanQuotesAndBrackets(str: string): string {
  if (!str) return "";
  let s = str.trim();
  s = s.replace(/^\*\*|\*\*$/g, "").trim();
  s = s.replace(/^\[|\]$/g, "").trim();
  s = s.replace(/^["“'«]|["”'»]$/g, "").trim();
  return s.trim();
}

export function parsePhotoPrompterOutput(text: string): ParsedPhotoPrompterData | null {
  if (!text) return null;

  const findSection = (keywords: string[], nextKeywords: string[] = []) => {
    let bestStart = -1;
    let headerLen = 0;
    for (const kw of keywords) {
      const match = text.match(new RegExp(`^[ \\t]*(?:##|#)\\s*[^\\n]*?${kw}[^\\n]*$`, "im"));
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

  const s1 = findSection(
    ["TOP 5 BỘ PROMPT", "BỘ PROMPT", "PROMPT TIẾNG ANH"],
    ["BỘ CÂU LỆNH LOẠI TRỪ", "NEGATIVE PROMPT", "MẸO THỰC CHIẾN"]
  );
  const s2 = findSection(["BỘ CÂU LỆNH LOẠI TRỪ", "NEGATIVE PROMPT"], ["MẸO THỰC CHIẾN", "MẸO"]);
  const s3 = findSection(["MẸO THỰC CHIẾN", "MẸO"], []);

  // 1. Phân tích 5 Prompts
  const prompts: StudioPromptItem[] = [];
  if (s1) {
    const promptBlocks = s1.split(/(?=###\s*)/g).filter((chunk) => chunk.trim().startsWith("###"));

    promptBlocks.forEach((chunk, idx) => {
      const headerMatch = chunk.match(/^###\s*([^\n]+)/);
      const rawHeader = headerMatch ? headerMatch[1].trim() : `Prompt ${idx + 1}`;

      let title = rawHeader.replace(/^[🌟🔍💃☕✨📸📷\s]+/, "");

      // Trích xuất mã code trong ```...```
      const codeMatch = chunk.match(/```(?:[a-zA-Z]*\n)?([\s\S]*?)```/);
      const promptCode = codeMatch ? codeMatch[1].trim() : "";

      // Trích xuất Ý đồ nhiếp ảnh
      let intention = "";
      const lines = chunk.split("\n");
      for (const line of lines) {
        const stripped = line.replace(/^[-*•]\s+/, "").trim();
        let m = stripped.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
        if (!m) {
          m = stripped.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
        }
        if (!m) {
          m = stripped.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);
        }
        if (m && /ý đồ|ghi chú|mô tả/i.test(m[1])) {
          intention = cleanQuotesAndBrackets(m[2]);
          break;
        }
      }

      // Trích xuất Aspect Ratio nếu có (--ar 1:1, --ar 3:4, v.v.)
      const arMatch = promptCode.match(/--ar\s+([0-9:]+)/i);
      const aspectRatio = arMatch ? arMatch[1] : "1:1";

      // Trích xuất thông số Lens nếu có
      const lensMatch = promptCode.match(/(\b\d+mm\b(?:\s+(?:prime|macro))?(?:\s+lens)?(?:\s+f\/[0-9.]+)?)/i);
      const lensInfo = lensMatch ? lensMatch[1].trim() : "";

      const verMatch = promptCode.match(/--v\s+([0-9.]+)/i);
      const versionInfo = verMatch ? `v${verMatch[1]}` : "";

      prompts.push({
        index: idx + 1,
        rawHeader,
        title,
        promptCode,
        intention,
        aspectRatio,
        lensInfo,
        versionInfo,
      });
    });
  }

  // 2. Negative Prompt
  let negativePrompt = "";
  if (s2) {
    const negMatch = s2.match(/```(?:[a-zA-Z]*\n)?([\s\S]*?)```/);
    if (negMatch) {
      negativePrompt = negMatch[1].trim();
    } else {
      negativePrompt = s2.replace(/^\*\([^\)]+\)\*\s*/, "").replace(/^[-*•]\s*/, "").trim();
    }
  }

  // 3. Mẹo thực chiến
  const tips: PhotographerTipItem[] = [];
  if (s3) {
    const lines = s3.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed === "---") continue;
      const strippedBullet = trimmed.replace(/^[-*•]\s+/, "");

      let m = strippedBullet.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) {
        m = strippedBullet.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      }
      if (!m) {
        m = strippedBullet.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);
      }

      if (m && /mẹo|lưu ý|bước|tip/i.test(m[1])) {
        tips.push({
          title: m[1].replace(/^\*\*|\*\*$/g, "").trim(),
          content: cleanQuotesAndBrackets(m[2]),
        });
      } else if (strippedBullet.length > 5) {
        tips.push({
          title: `Mẹo ${tips.length + 1}`,
          content: cleanQuotesAndBrackets(strippedBullet),
        });
      }
    }
  }

  return {
    prompts,
    negativePrompt,
    tips,
    raw: text,
  };
}

export function PhotoPrompterOutput({
  result,
  loading,
  productName,
  onUseSample,
}: PhotoPrompterOutputProps) {
  const [activeTab, setActiveTab] = useState<"all" | "p1" | "p2" | "p3" | "p4" | "p5" | "negative">("all");
  const [viewMode, setViewMode] = useState<"interactive" | "raw">("interactive");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const parsed = useMemo(() => {
    return parsePhotoPrompterOutput(result);
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

  const handleCopyAllPrompts = () => {
    if (!parsed || parsed.prompts.length === 0) return;
    const text = parsed.prompts
      .map((p) => `### ${p.title}\n${p.promptCode}\n\nÝ đồ: ${p.intention}`)
      .join("\n\n---\n\n");
    handleCopy(text, "prompts_all", "Đã sao chép toàn bộ 5 Prompt!");
  };

  const handleExportExcel = () => {
    if (!parsed) return;
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: 5 Prompts
      const promptRows = parsed.prompts.map((p) => ({
        STT: p.index,
        "Góc Chụp & Tên Prompt": p.title,
        "Tỷ Lệ (--ar)": p.aspectRatio,
        "Ống Kính (Lens)": p.lensInfo || "Studio Prime",
        "Prompt Tiếng Anh (Ready to Copy)": p.promptCode,
        "Ý Đồ Nhiếp Ảnh": p.intention,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(promptRows), "Prompts_Studio");

      // Sheet 2: Negative Prompt & Mẹo
      const negRows = [
        {
          "Hạng Mục": "Negative Prompt",
          "Nội Dung": parsed.negativePrompt,
          "Hướng Dẫn": "Dán vào ô Negative Prompt hoặc thêm tham số --no",
        },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(negRows), "Negative_Prompt");

      const tipRows = parsed.tips.map((t, idx) => ({
        STT: idx + 1,
        "Tiêu Đề Mẹo": t.title,
        "Nội Dung Hướng Dẫn Thực Chiến": t.content,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tipRows), "Meo_NhiepAnh");

      const safeName = (productName || "studio-photo").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      const fileName = `prompt-studio-8k-${safeName}-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast("Đã xuất file Excel Prompts Studio!");
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
    const safeName = (productName || "studio-photo").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    a.download = `prompt-studio-8k-${safeName}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải tệp .txt!");
  };

  const getPromptBadgeColor = (idx: number) => {
    switch (idx) {
      case 1:
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case 2:
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
      case 3:
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      case 4:
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case 5:
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      default:
        return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col min-h-0 relative overflow-hidden border border-slate-800">
      {/* Toast mini thông báo sao chép */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-slate-950/95 text-purple-400 text-xs font-semibold shadow-xl border border-purple-500/30 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          <Check size={13} className="stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header thanh công cụ tối giản - Cố định 1 hàng ngang */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-800 flex items-center justify-between gap-1.5 sm:gap-2 relative z-10 bg-slate-900/95 backdrop-blur-md shrink-0 flex-nowrap">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center bg-purple-500/15 text-purple-400 border border-purple-500/25 shrink-0 shadow-2xs">
            <Camera size={13} className="sm:w-[15px] sm:h-[15px]" />
          </div>
          <h2 className="font-bold text-white text-xs sm:text-sm truncate">
            Bộ Prompt Studio (8K)
          </h2>
        </div>

        {/* Nút hành động - Cố định 1 hàng ngang */}
        {result && !loading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* Chế độ xem: Trực quan vs Gốc */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("interactive")}
                title="Dạng giao diện trực quan"
                className={`p-1 sm:px-2 sm:py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "interactive"
                    ? "bg-purple-600 text-white shadow-xs"
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
                    ? "bg-purple-600 text-white shadow-xs"
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
              title="Xuất file Excel (.xlsx)"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs shrink-0"
            >
              <FileSpreadsheet size={12} className="text-emerald-400 sm:w-[13px] sm:h-[13px]" />
              <span className="hidden xs:inline">Excel</span>
            </button>

            {/* Nút Tải .txt: Chỉ hiện trên sm+ */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải file .txt"
              className="hidden sm:flex p-1 sm:p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer shrink-0"
            >
              <Download size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Nút Sao chép tất cả */}
            <button
              type="button"
              onClick={() => handleCopy(result, "all", "Đã sao chép toàn bộ bộ prompt!")}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-all shadow-md shadow-purple-950/40 flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
            >
              {copiedKey === "all" ? (
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
      {result && viewMode === "interactive" && !loading && (
        <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 border-b border-slate-800 bg-slate-950/70 flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar sm:custom-scrollbar shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "all"
                ? "bg-slate-800 text-purple-300 border border-purple-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>Tất Cả ({parsed?.prompts.length || 5})</span>
          </button>
          {parsed?.prompts.map((p) => (
            <button
              key={p.index}
              type="button"
              onClick={() => setActiveTab(`p${p.index}` as any)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                activeTab === `p${p.index}`
                  ? "bg-slate-800 text-purple-300 border border-purple-500/40 shadow-xs"
                  : "text-slate-400 hover:text-purple-200"
              }`}
            >
              <span>P{p.index}</span>
              <span className="text-[10px] opacity-75 hidden xs:inline">
                {p.index === 1 ? "Toàn cảnh" : p.index === 2 ? "Macro" : p.index === 3 ? "Lookbook" : p.index === 4 ? "Lifestyle" : "Editorial"}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActiveTab("negative")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "negative"
                ? "bg-slate-800 text-rose-300 border border-rose-500/40 shadow-xs"
                : "text-slate-400 hover:text-rose-200"
            }`}
          >
            <Ban size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>Negative &amp; Mẹo</span>
          </button>
        </div>
      )}

      {/* Vùng hiển thị kết quả (cuộn độc lập) */}
      <div className="flex-1 min-h-0 p-3 sm:p-5 overflow-y-auto custom-scrollbar relative z-10 pb-24 lg:pb-4 space-y-4 sm:space-y-5">
        {loading ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-purple-400">
              <Sparkles size={22} className="animate-spin text-purple-400 duration-1000" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-sm text-white">
                <TextShimmerWave>AI Đang Thiết Kế Bộ Prompt Studio 8K...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang căn chỉnh tiêu cự ống kính, ánh sáng studio, bố cục thương mại và tối ưu tham số render...
              </p>
            </div>
          </div>
        ) : result && parsed ? (
          <div className="space-y-4">
            {viewMode === "raw" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Dữ liệu Markdown gốc:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result, "rawText", "Đã sao chép Markdown!")}
                    className="hover:text-purple-400 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Copy size={12} /> Sao chép
                  </button>
                </div>
                <textarea
                  readOnly
                  value={result}
                  className="w-full h-[500px] bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* ========================================================================= */}
                {/* 1. TOP 5 BỘ PROMPT TIẾNG ANH CHUẨN STUDIO THƯƠNG MẠI                      */}
                {/* ========================================================================= */}
                {activeTab !== "negative" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Camera size={14} className="text-purple-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          1. Top 5 Bộ Prompt Tiếng Anh Chuẩn Studio Thương Mại
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAllPrompts}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "prompts_all" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>Sao chép</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {parsed.prompts
                        .filter((p) => activeTab === "all" || activeTab === `p${p.index}`)
                        .map((prompt) => (
                          <div
                            key={prompt.index}
                            className="bg-slate-900/80 rounded-xl border border-slate-800 hover:border-purple-500/40 p-3.5 sm:p-4 space-y-3 transition-all"
                          >
                            {/* Tiêu đề & Thông số */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${getPromptBadgeColor(prompt.index)}`}>
                                  P{prompt.index}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold text-white">
                                  {prompt.title}
                                </h4>
                                {prompt.aspectRatio && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
                                    --ar {prompt.aspectRatio}
                                  </span>
                                )}
                                {prompt.lensInfo && (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30 hidden sm:inline-block">
                                    {prompt.lensInfo}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCopy(prompt.promptCode, `p_${prompt.index}`, `Đã chép Prompt ${prompt.index}!`)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                {copiedKey === `p_${prompt.index}` ? (
                                  <>
                                    <Check size={12} className="stroke-[3]" /> Đã sao chép
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} /> Sao chép Prompt
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Khối Mã Lệnh Prompt Tiếng Anh (Ready to Copy) */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                  <Sliders size={12} className="text-purple-400" />
                                  English Prompt (Dán trực tiếp vào Midjourney / Flux / Fooocus):
                                </span>
                              </div>
                              <div
                                onClick={() => handleCopy(prompt.promptCode, `p_${prompt.index}`, `Đã chép Prompt ${prompt.index}!`)}
                                className="bg-slate-950 rounded-xl p-3 sm:p-3.5 border border-slate-800 hover:border-purple-500/50 transition text-xs font-mono text-purple-200/90 leading-relaxed break-words select-text cursor-pointer group relative"
                                title="Bấm để sao chép nhanh"
                              >
                                {prompt.promptCode}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-[10px] text-slate-400 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none">
                                  Bấm để copy
                                </div>
                              </div>
                            </div>

                            {/* Ý đồ nhiếp ảnh */}
                            {prompt.intention && (
                              <div className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/80 flex items-start gap-2 text-xs">
                                <Eye size={14} className="text-purple-400 mt-0.5 shrink-0" />
                                <div className="leading-relaxed text-slate-300 break-words select-text">
                                  <span className="font-bold text-slate-200 mr-1.5">Ý đồ nhiếp ảnh:</span>
                                  {prompt.intention}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. BỘ CÂU LỆNH LOẠI TRỪ (NEGATIVE PROMPT)                                 */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "negative") && parsed.negativePrompt && (
                  <div className="rounded-xl border border-rose-500/20 bg-slate-950/60 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Ban size={14} className="text-rose-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          2. Bộ Câu Lệnh Loại Trừ (Negative Prompt)
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(parsed.negativePrompt, "negative_prompt", "Đã chép Negative Prompt!")}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-600/90 hover:bg-rose-500 text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        {copiedKey === "negative_prompt" ? (
                          <>
                            <Check size={11} className="stroke-[3]" /> Đã chép
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> Sao chép
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Dán đoạn này vào ô <b>Negative Prompt</b> hoặc thêm cú pháp <code>--no [từ khóa]</code> trong Midjourney để ảnh không bị lỗi thừa ngón, biến dạng hay mờ nhoè:
                    </p>

                    <div
                      onClick={() => handleCopy(parsed.negativePrompt, "negative_prompt", "Đã chép Negative Prompt!")}
                      className="bg-slate-950 rounded-lg p-3 border border-rose-500/30 text-xs font-mono text-rose-200/90 leading-relaxed select-text cursor-pointer hover:border-rose-400 transition"
                      title="Bấm để sao chép"
                    >
                      {parsed.negativePrompt}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. MẸO THỰC CHIẾN TỪ NHIẾP ẢNH GIA AI                                     */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "negative") && parsed.tips.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={14} className="text-amber-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          3. Mẹo Thực Chiến Từ Nhiếp Ảnh Gia AI
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {parsed.tips.map((tip, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-3 space-y-1.5 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                              <Lightbulb size={13} className="text-amber-400 shrink-0" />
                              {tip.title}
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed break-words select-text">
                              {tip.content}
                            </p>
                          </div>

                          <div className="pt-2 mt-1 border-t border-slate-800/60 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleCopy(`${tip.title}: ${tip.content}`, `tip-${idx}`, `Đã chép ${tip.title}!`)}
                              className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer font-medium"
                            >
                              {copiedKey === `tip-${idx}` ? (
                                <>
                                  <Check size={11} className="text-emerald-400" /> Đã chép
                                </>
                              ) : (
                                <>
                                  <Copy size={11} /> Chép mẹo
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-purple-400 shadow-inner">
              <Camera size={24} />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="font-semibold text-slate-200 text-sm">Chưa Có Dữ Liệu Prompt Studio</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập tên sản phẩm &amp; chọn góc chụp studio bên trái, sau đó bấm &ldquo;Tạo Bộ Prompt Studio Chuẩn Xưởng Ngay&rdquo;.
              </p>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-purple-400 hover:text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
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

export default PhotoPrompterOutput;
