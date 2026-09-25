"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Download,
  Camera,
  Layers,
  FileText,
  FileSpreadsheet,
  Ban,
  Lightbulb,
  LayoutList,
  Aperture,
  Flame,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import {
  PhotoPrompterData,
  parsePhotoPrompterOutput,
} from "@/lib/photo-prompter/contract";

interface PhotoPrompterOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  onUseSample?: () => void;
  elapsedSeconds?: number;
  onCancel?: () => void;
  productImage?: string | null;
  isOfflineMode?: boolean;
  onRetryWithAi?: () => void;
}

const PHOTO_STAGES = [
  { upToSeconds: 4, text: "Đang phân tích chất liệu, màu sắc & phom dáng sản phẩm..." },
  { upToSeconds: 10, text: "Tạo cấu trúc Image Prompting (--iw 2.0) khóa chuẩn ảnh thật..." },
  { upToSeconds: 20, text: "Thiết kế 5 góc chụp Studio: Hero, Mẫu Á Đông, Macro, Flatlay, UGC..." },
  { upToSeconds: 35, text: "Tối ưu câu lệnh loại trừ (Negative Prompt) chống biến dạng..." },
  { upToSeconds: 60, text: "Hoàn thiện thông số render chuẩn Midjourney v6.1 & Flux.1..." },
];

export function PhotoPrompterOutput({
  result,
  loading,
  productName,
  onUseSample,
  elapsedSeconds = 0,
  onCancel,
  productImage,
  isOfflineMode,
  onRetryWithAi,
}: PhotoPrompterOutputProps) {
  const [viewMode, setViewMode] = useState<"interactive" | "raw">("interactive");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "p1" | "p2" | "p3" | "p4" | "p5" | "negative">("all");
  const [promptModes, setPromptModes] = useState<Record<number, "imagePrompt" | "textOnly">>({
    1: "imagePrompt",
    2: "imagePrompt",
    3: "imagePrompt",
    4: "imagePrompt",
    5: "imagePrompt",
  });

  const parsed: PhotoPrompterData | null = useMemo(() => {
    if (!result) return null;
    return parsePhotoPrompterOutput(result, { productName, imageBase64: productImage });
  }, [result, productName, productImage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 1800);
  };

  const handleCopy = (text: string, key: string, message = "Đã sao chép!") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(message);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const togglePromptMode = (index: number, mode: "imagePrompt" | "textOnly") => {
    setPromptModes((prev) => ({ ...prev, [index]: mode }));
  };

  const handleCopyAllPrompts = () => {
    if (!parsed || parsed.prompts.length === 0) return;
    const text = parsed.prompts
      .map((p) => {
        const mode = promptModes[p.index] || "imagePrompt";
        const code = mode === "imagePrompt" ? p.imagePromptEn : p.promptEn;
        return `### ${p.title}\n${code}\n\nÝ đồ: ${p.vietnameseSummary}\nThông số: ${p.cameraAndLighting}`;
      })
      .join("\n\n---\n\n");
    handleCopy(text, "prompts_all", "Đã chép toàn bộ 5 Prompt!");
  };

  const handleExportExcel = () => {
    if (!parsed) return;
    try {
      const wb = XLSX.utils.book_new();

      const promptRows = parsed.prompts.map((p) => ({
        STT: p.index,
        "Góc Chụp": p.title,
        "Cú Pháp Ảnh Thật (--iw 2.0)": p.imagePromptEn,
        "Prompt Text": p.promptEn,
        "Tỷ Lệ": p.aspectRatio,
        "Ống Kính & Ánh Sáng": p.cameraAndLighting,
        "Ý Đồ": p.vietnameseSummary,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(promptRows), "Prompts");

      const negRows = [
        {
          "Hạng Mục": "Negative Prompt",
          "Nội Dung": parsed.negativePrompt.standardNegative,
          "Ý Nghĩa": parsed.negativePrompt.vietnameseMeaning,
        },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(negRows), "Negative");

      const tipRows = parsed.workflowTips.map((t, idx) => ({
        STT: idx + 1,
        "Mẹo Thực Chiến": t.title,
        "Chi Tiết": t.content,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tipRows), "Meo");

      const safeName = (productName || "studio").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      XLSX.writeFile(wb, `prompt-studio-${safeName}-${Date.now()}.xlsx`);
      showToast("Đã xuất file Excel!");
    } catch {
      showToast("Không thể xuất file Excel.");
    }
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (productName || "studio").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    a.download = `prompt-studio-${safeName}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải tệp .txt!");
  };

  return (
    <div className="bg-black text-white rounded-2xl shadow-2xl flex flex-col min-h-0 relative border border-zinc-800 lg:h-full lg:overflow-hidden">
      {/* Toast mini thông báo sao chép */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-2xl border border-zinc-700 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <Check size={13} className="text-emerald-400 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Toolbar: Tối Giản, Chữ Trắng Nền Đen */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-zinc-800 flex items-center justify-between gap-2 relative z-10 bg-black shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center bg-zinc-900 text-white border border-zinc-800 shrink-0">
            <Camera size={13} className="sm:w-[15px] sm:h-[15px]" />
          </div>
          <h2 className="font-bold text-white text-xs sm:text-sm truncate">
            Prompt Studio 8K
          </h2>
        </div>

        {/* Nút thao tác Toolbar */}
        {result && !loading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* View Mode Toggle */}
            <div className="bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("interactive")}
                title="Giao diện thẻ trực quan"
                className={`p-1 sm:px-2 sm:py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "interactive"
                    ? "bg-white text-black shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <LayoutList size={12} />
                <span className="hidden md:inline">Thẻ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Dạng JSON / Raw gốc"
                className={`p-1 sm:px-2 sm:py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-white text-black shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <FileText size={12} />
                <span className="hidden md:inline">Gốc</span>
              </button>
            </div>

            {/* Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Xuất file Excel (.xlsx)"
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Xuất file Excel"
            >
              <FileSpreadsheet size={13} className="text-emerald-400" />
            </button>

            {/* Tải tệp .txt */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải tệp .txt"
              className="hidden sm:flex w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Tải file text"
            >
              <Download size={13} />
            </button>

            {/* Sao chép toàn bộ: Icon-only Nổi Bật */}
            <button
              type="button"
              onClick={handleCopyAllPrompts}
              title={copiedKey === "prompts_all" ? "Đã chép tất cả" : "Sao chép tất cả"}
              className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
              aria-label="Sao chép toàn bộ"
            >
              {copiedKey === "prompts_all" ? (
                <Check size={14} className="stroke-[3]" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Thông báo Chế độ Dự Phòng Offline Blueprint */}
      {isOfflineMode && result && !loading && (
        <div className="px-3 sm:px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2 text-xs text-zinc-300 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-amber-400 font-bold">⚡</span>
            <span className="truncate">
              Bộ prompt dự phòng chuẩn sàn TMĐT (Lượt dùng AI chưa bị trừ).
            </span>
          </div>
          {onRetryWithAi && (
            <button
              type="button"
              onClick={onRetryWithAi}
              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-medium text-[11px] shrink-0 transition-colors cursor-pointer flex items-center gap-1"
            >
              Thử lại AI
            </button>
          )}
        </div>
      )}

      {/* Tabs Phân Loại Gọn Gàng - Nền Đen Chữ Trắng */}
      {result && viewMode === "interactive" && !loading && (
        <div className="px-3 sm:px-4 py-2 border-b border-zinc-800 bg-zinc-950 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "all"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
            }`}
          >
            <Layers size={12} />
            <span>Tất Cả ({parsed?.prompts.length || 5})</span>
          </button>
          {parsed?.prompts.map((p) => (
            <button
              key={p.index}
              type="button"
              onClick={() => setActiveTab(`p${p.index}` as any)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                activeTab === `p${p.index}`
                  ? "bg-white text-black font-bold shadow-xs"
                  : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
              }`}
            >
              <span>P{p.index}</span>
              <span className="text-[10px] opacity-75 hidden xs:inline">
                {p.index === 1 ? "Hero" : p.index === 2 ? "Mẫu Á" : p.index === 3 ? "Macro" : p.index === 4 ? "Flatlay" : "UGC"}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActiveTab("negative")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "negative"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
            }`}
          >
            <Ban size={12} />
            <span>Negative</span>
          </button>
        </div>
      )}

      {/* Vùng Cuộn Nội Dung Toàn Trang Mobile Mượt Mà */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 lg:overflow-y-auto custom-scrollbar relative z-10 space-y-3 sm:space-y-4 pb-20 lg:pb-4 bg-black">
        {loading ? (
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="Đang tạo 5 bộ Prompt Studio chuẩn sàn..."
            stages={PHOTO_STAGES}
            accentColor="purple"
            minHeightClass="min-h-[360px]"
          />
        ) : result && parsed ? (
          <div className="space-y-3">
            {viewMode === "raw" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Dữ liệu gốc:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result, "rawText", "Đã sao chép nội dung gốc!")}
                    className="hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Copy size={12} /> Sao chép
                  </button>
                </div>
                <textarea
                  readOnly
                  value={result}
                  className="w-full h-[520px] bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* 1. DANH SÁCH PROMPT: TỐI GIẢN, NÚT SAO CHÉP ICON-ONLY BÊN PHẢI CÙNG HÀNG */}
                {activeTab !== "negative" &&
                  parsed.prompts
                    .filter((p) => activeTab === "all" || activeTab === `p${p.index}`)
                    .map((prompt) => {
                      const currentMode = promptModes[prompt.index] || "imagePrompt";
                      const activeCodeToCopy =
                        currentMode === "imagePrompt" ? prompt.imagePromptEn : prompt.promptEn;

                      return (
                        <div
                          key={prompt.index}
                          className="bg-zinc-950 rounded-xl border border-zinc-800/90 p-3 sm:p-3.5 space-y-2 transition-colors hover:border-zinc-700"
                        >
                          {/* Hàng Tiêu Đề: Tiêu đề bên trái tự động xuống dòng, Nút Sao Chép Icon-Only bên phải cùng hàng */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              <span className="text-[11px] font-black px-1.5 py-0.5 rounded bg-zinc-900 text-white border border-zinc-800 shrink-0 font-mono mt-0.5">
                                P{prompt.index}
                              </span>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-xs sm:text-sm font-bold text-white leading-snug break-words">
                                  {prompt.title}
                                  {prompt.aspectRatio && (
                                    <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 inline-block align-middle font-normal">
                                      {prompt.aspectRatio}
                                    </span>
                                  )}
                                </h3>
                              </div>
                            </div>

                            {/* Nút Sao Chép Icon-Only Cùng Hàng Tiêu Đề */}
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  activeCodeToCopy,
                                  `p_${prompt.index}`,
                                  `Đã chép Prompt ${prompt.index}!`
                                )
                              }
                              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
                              title={`Sao chép Prompt ${prompt.index}`}
                              aria-label={`Sao chép Prompt ${prompt.index}`}
                            >
                              {copiedKey === `p_${prompt.index}` ? (
                                <Check size={14} className="text-emerald-400 stroke-[3]" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>

                          {/* Mode Toggle: Cú pháp Ảnh Thật (--iw 2.0) vs Text Thuần */}
                          <div className="flex items-center gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={() => togglePromptMode(prompt.index, "imagePrompt")}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                currentMode === "imagePrompt"
                                  ? "bg-white text-black"
                                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                              }`}
                            >
                              <Flame size={11} className={currentMode === "imagePrompt" ? "text-amber-600" : "text-zinc-500"} />
                              <span>Ảnh Thật (--iw 2.0)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePromptMode(prompt.index, "textOnly")}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                currentMode === "textOnly"
                                  ? "bg-white text-black font-bold"
                                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                              }`}
                            >
                              Text Thuần
                            </button>
                          </div>

                          {/* Khối Mã Prompt Sẵn Sàng Sao Chép */}
                          <div className="relative">
                            <pre className="p-2.5 sm:p-3 bg-black rounded-lg border border-zinc-800 text-xs font-mono text-zinc-100 leading-relaxed overflow-x-auto whitespace-pre-wrap break-words select-all custom-scrollbar">
                              {activeCodeToCopy}
                            </pre>
                          </div>

                          {/* Thông số kỹ thuật & Ý đồ rút gọn - Xuống dòng tự nhiên */}
                          {(prompt.cameraAndLighting || prompt.vietnameseSummary) && (
                            <div className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 leading-snug">
                              {prompt.cameraAndLighting && (
                                <span className="flex items-center gap-1 break-words">
                                  <Aperture size={11} className="text-zinc-500 shrink-0" />
                                  <span>{prompt.cameraAndLighting}</span>
                                </span>
                              )}
                              {prompt.vietnameseSummary && (
                                <span className="text-zinc-300 break-words">
                                  • {prompt.vietnameseSummary}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                {/* 2. BỘ CÂU LỆNH LOẠI TRỪ (NEGATIVE PROMPT) */}
                {(activeTab === "all" || activeTab === "negative") && parsed.negativePrompt && (
                  <div className="bg-zinc-950 rounded-xl border border-zinc-800/90 p-3 sm:p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded flex items-center justify-center bg-zinc-900 text-zinc-400 shrink-0 mt-0.5">
                          <Ban size={12} />
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-white leading-snug break-words">
                          Negative Prompt (Câu Lệnh Loại Trừ)
                        </h3>
                      </div>

                      {/* Nút Sao Chép Icon-Only */}
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            parsed.negativePrompt.standardNegative,
                            "negative_prompt",
                            "Đã chép Negative Prompt!"
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
                        title="Sao chép Negative Prompt"
                        aria-label="Sao chép Negative Prompt"
                      >
                        {copiedKey === "negative_prompt" ? (
                          <Check size={14} className="text-emerald-400 stroke-[3]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>

                    <pre className="p-2.5 sm:p-3 bg-black rounded-lg border border-zinc-800 text-xs font-mono text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre-wrap break-words select-all custom-scrollbar">
                      {parsed.negativePrompt.standardNegative}
                    </pre>

                    {parsed.negativePrompt.vietnameseMeaning && (
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {parsed.negativePrompt.vietnameseMeaning}
                      </p>
                    )}
                  </div>
                )}

                {/* 3. MẸO THỰC CHIẾN TỐI GIẢN */}
                {(activeTab === "all" || activeTab === "negative") &&
                  parsed.workflowTips &&
                  parsed.workflowTips.length > 0 && (
                    <div className="bg-zinc-950 rounded-xl border border-zinc-800/90 p-3 sm:p-3.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={13} className="text-zinc-400" />
                        <h3 className="text-xs sm:text-sm font-bold text-white">
                          Mẹo Chụp Ảnh &amp; Inpaint Sản Phẩm Thật
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {parsed.workflowTips.map((tip, idx) => (
                          <div
                            key={idx}
                            className="bg-black p-2.5 rounded-lg border border-zinc-800/80 space-y-0.5"
                          >
                            <h4 className="text-[11px] font-bold text-white">
                              {tip.title}
                            </h4>
                            <p className="text-[11px] text-zinc-400 leading-snug">
                              {tip.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Camera size={22} />
            </div>
            <div className="max-w-xs space-y-1">
              <h3 className="text-sm font-bold text-white">
                Chưa Có Bộ Prompt
              </h3>
              <p className="text-xs text-zinc-400">
                Tải ảnh hoặc nhập sản phẩm bên trái để AI tạo 5 góc chụp Studio &amp; Người mẫu.
              </p>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Dùng Dữ Liệu Mẫu
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
