"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Copy,
  Check,
  FileSpreadsheet,
  Download,
  Video,
  Radio,
  Film,
  Sparkles,
  ShieldCheck,
  Tv,
} from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";
import {
  parseScriptWriterResult,
  scriptToText,
  formatTeleprompterText,
  formatLiveTeleprompterText,
  formatAllTeleprompterText,
  exportScriptExcel,
  type ScriptFormat,
  type ScriptWriterData,
  type VideoScriptItem,
  type VideoScriptScene,
} from "@/lib/script-writer/contract";

interface ScriptWriterOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  usp?: string;
  format?: ScriptFormat;
  elapsedSeconds?: number;
  onCancel?: () => void;
  onUseSample?: () => void;
}

export function ScriptWriterOutput({
  result,
  loading,
  productName,
  usp,
  format = "both",
  elapsedSeconds,
  onCancel,
  onUseSample,
}: ScriptWriterOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "teleprompter" | "raw">("visual");
  const [activeFilter, setActiveFilter] = useState<"all" | "video" | "live" | "policy">("all");
  const [selectedScriptId, setSelectedScriptId] = useState<number>(1);
  const [teleprompterTarget, setTeleprompterTarget] = useState<string>("video-1");
  const [teleprompterSubMode, setTeleprompterSubMode] = useState<"cards" | "markdown">("cards");

  // Parser 4 tầng bền bỉ
  const data: ScriptWriterData = useMemo(() => {
    return parseScriptWriterResult(result, format);
  }, [result, format]);

  // Văn bản text thô (Markdown chuẩn) cho toàn bộ kịch bản
  const formattedRawText = useMemo(() => {
    return data ? scriptToText(data) : (result || "");
  }, [data, result]);

  const videoScripts = useMemo(() => data.videoScripts || [], [data]);
  const liveScript = useMemo(() => data.liveScript, [data]);
  const policy = useMemo(() => data.policyCompliance, [data]);

  // Đảm bảo selectedScriptId luôn hợp lệ
  useEffect(() => {
    if (videoScripts.length > 0) {
      if (!videoScripts.some((s) => s.id === selectedScriptId)) {
        setSelectedScriptId(videoScripts[0].id);
      }
    }
  }, [videoScripts, selectedScriptId]);

  // Đảm bảo teleprompterTarget luôn hợp lệ khi dữ liệu thay đổi
  useEffect(() => {
    if (videoScripts.length > 0) {
      if (teleprompterTarget.startsWith("video-")) {
        const id = parseInt(teleprompterTarget.replace("video-", ""), 10);
        if (!videoScripts.some((s) => s.id === id)) {
          setTeleprompterTarget(`video-${videoScripts[0].id}`);
        }
      }
    } else if (liveScript) {
      setTeleprompterTarget("live");
    }
  }, [videoScripts, liveScript, teleprompterTarget]);

  const activeVideoScript = useMemo(() => {
    return videoScripts.find((s) => s.id === selectedScriptId) || videoScripts[0];
  }, [videoScripts, selectedScriptId]);

  const selectedTeleprompterVideo = useMemo(() => {
    if (!teleprompterTarget.startsWith("video-")) return null;
    const id = parseInt(teleprompterTarget.replace("video-", ""), 10);
    return videoScripts.find((s) => s.id === id) || videoScripts[0] || null;
  }, [videoScripts, teleprompterTarget]);

  // Nội dung văn bản nhắc chữ của mục đang chọn
  const currentTeleprompterText = useMemo(() => {
    if (teleprompterTarget === "all") {
      return formatAllTeleprompterText(data);
    }
    if (teleprompterTarget === "live" && liveScript) {
      return formatLiveTeleprompterText(liveScript);
    }
    if (selectedTeleprompterVideo) {
      return formatTeleprompterText(selectedTeleprompterVideo);
    }
    if (videoScripts.length > 0) {
      return formatTeleprompterText(videoScripts[0]);
    }
    if (liveScript) {
      return formatLiveTeleprompterText(liveScript);
    }
    return "";
  }, [teleprompterTarget, data, liveScript, selectedTeleprompterVideo, videoScripts]);

  // Sao chép dùng chung (Icon-only)
  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Sao chép tất cả
  const handleCopyAll = () => {
    if (!formattedRawText) return;
    handleCopy(formattedRawText, "all");
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Tải file .txt
  const handleDownload = () => {
    if (!formattedRawText) return;
    const blob = new Blob([formattedRawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = productName
      ? productName.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30)
      : "kich-ban";
    a.download = `kich-ban-video-live-${safeName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Xuất Excel
  const handleExportExcel = () => {
    exportScriptExcel(data, productName, usp);
  };

  const wordCount = formattedRawText ? formattedRawText.trim().split(/\s+/).length : 0;
  const totalVideoScenes = videoScripts.reduce((acc, s) => acc + s.scenes.length, 0);

  return (
    <div className="bg-black rounded-2xl shadow-2xl flex flex-col lg:h-full lg:min-h-0 relative lg:overflow-hidden border border-slate-800 text-white">
      {/* Header thanh công cụ (Sticky) - Chuẩn phong cách AI Mẫu Quảng Cáo */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-col gap-1.5 shrink-0">
        {/* Hàng 1: Tiêu đề + Nút thao tác (Copy, Excel, TXT, Thẻ/Nhắc chữ/Gốc) */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Trái: Icon + Tiêu đề + Badge nền tảng */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-white shrink-0">
              <Video size={13} className="text-purple-400 sm:w-3.5 sm:h-3.5" />
            </div>
            <h2 className="font-bold text-xs sm:text-sm text-white tracking-wide uppercase truncate whitespace-nowrap">
              <span className="hidden sm:inline">Kịch Bản Video &amp; Live</span>
              <span className="sm:hidden">Kịch Bản</span>
            </h2>
          </div>

          {/* Phải: Các nút thao tác */}
          {result && !loading && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Nút Sao Chép Tất Cả (ICON ONLY) */}
              <button
                type="button"
                onClick={handleCopyAll}
                title={copiedAll ? "Đã sao chép toàn bộ nội dung" : "Sao chép toàn bộ kịch bản"}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xs ${copiedAll ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-slate-200"
                  }`}
              >
                {copiedAll ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
              </button>

              {/* Nút Xuất Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                title="Xuất bảng phân cảnh & chặng live ra Excel (.xlsx)"
                className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <FileSpreadsheet size={13} />
                <span className="hidden sm:inline">Excel</span>
              </button>

              {/* Nút Tải TXT */}
              <button
                type="button"
                onClick={handleDownload}
                title="Tải về file TXT"
                className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Download size={13} />
                <span className="hidden sm:inline">TXT</span>
              </button>

              {/* Chuyển đổi Xem: Thẻ / Nhắc chữ / Markdown */}
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("visual")}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${viewMode === "visual"
                    ? "bg-white text-black font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  Thẻ
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("raw")}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${viewMode === "raw"
                    ? "bg-white text-black font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                    }`}
                  title="Chế độ văn bản Markdown chuẩn"
                >
                  Markdown
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hàng 2: Thanh Tab Lọc Danh Mục - Giống hệt AI Mẫu Quảng Cáo */}
        {result && !loading && viewMode === "visual" && (
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pt-0.5 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${activeFilter === "all"
                ? "bg-white text-black font-bold"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
            >
              Tất Cả
            </button>

            {videoScripts.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("video")}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${activeFilter === "video"
                  ? "bg-white text-black font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
              >
                <span>Video Ngắn</span>
                <span
                  className={`text-[10px] px-1 rounded font-mono ${activeFilter === "video"
                    ? "bg-black/20 text-black font-bold"
                    : "bg-black/50 text-slate-300"
                    }`}
                >
                  {videoScripts.length}
                </span>
              </button>
            )}

            {liveScript && (
              <button
                type="button"
                onClick={() => setActiveFilter("live")}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${activeFilter === "live"
                  ? "bg-white text-black font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
              >
                <span>Livestream 4 Chặng</span>
                <span
                  className={`text-[10px] px-1 rounded font-mono ${activeFilter === "live"
                    ? "bg-black/20 text-black font-bold"
                    : "bg-black/50 text-slate-300"
                    }`}
                >
                  4
                </span>
              </button>
            )}

            {policy && (
              <button
                type="button"
                onClick={() => setActiveFilter("policy")}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${activeFilter === "policy"
                  ? "bg-white text-black font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
              >
                <span>Tuân Thủ Sàn</span>
                <span
                  className={`text-[10px] px-1 rounded font-mono ${activeFilter === "policy"
                    ? "bg-black/20 text-black font-bold"
                    : "bg-black/50 text-slate-300"
                    }`}
                >
                  {policy.safeScore}%
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vùng nội dung chính: Chữ trắng nền đen chuẩn AI Mẫu Quảng Cáo */}
      <div
        className={`flex-1 min-h-0 p-3 sm:p-4 flex flex-col ${
          viewMode === "raw" ? "h-full overflow-hidden" : "lg:overflow-y-auto custom-scrollbar"
        }`}
      >
        {loading ? (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-950/40">
                <Sparkles size={22} className="animate-spin duration-1000" />
              </div>
              {typeof elapsedSeconds === "number" && (
                <div className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-mono text-purple-300">
                  {elapsedSeconds}s
                </div>
              )}
            </div>

            <div className="space-y-1.5 max-w-sm">
              <div className="font-bold text-sm text-white">
                <TextShimmerWave>AI Đang Lên Kịch Bản Chuyển Đổi Cao...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed min-h-[32px]">
                {typeof elapsedSeconds === "number" && elapsedSeconds < 8
                  ? "⚡ Đang phân tích sản phẩm & sáng tạo Hook 3s giật mắt..."
                  : typeof elapsedSeconds === "number" && elapsedSeconds < 20
                    ? "🎬 Đang dựng 3 kịch bản video ngắn (visual action, audio voiceover, SFX)..."
                    : typeof elapsedSeconds === "number" && elapsedSeconds < 35
                      ? "🔥 Đang xây dựng khung livestream 4 chặng & chiến thuật tung deal..."
                      : "🛡️ Đang kiểm tra từ ngữ an toàn chính sách sàn Shopee & TikTok Shop..."}
              </p>
            </div>

            {/* Thanh tiến trình thời gian tạo kịch bản */}
            <div className="w-full max-w-xs bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(95, Math.max(5, ((elapsedSeconds || 1) / 45) * 100))}%`,
                }}
              />
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/60 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              >
                <span>Hủy yêu cầu</span>
              </button>
            )}
          </div>
        ) : result && data ? (
          <div
            className={
              viewMode === "raw"
                ? "flex-1 flex flex-col min-h-0 h-full"
                : "space-y-4"
            }
          >
            {/* ═══════════════════════════════════════════════════════ */}
            {/* CHẾ ĐỘ XEM MARKDOWN THUẦN (TEXT THÔ)                     */}
            {/* ═══════════════════════════════════════════════════════ */}
            {viewMode === "raw" ? (
              <div className="flex-1 flex flex-col min-h-0 h-full space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">Văn bản text thô (Markdown chuẩn):</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 hidden sm:inline-block">
                      {wordCount} từ
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    title={copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ"}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                      copiedAll
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-white text-black hover:bg-slate-200"
                    }`}
                  >
                    {copiedAll ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={formattedRawText}
                  className="w-full flex-1 min-h-[350px] lg:min-h-0 h-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm font-mono text-slate-200 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
                />
              </div>
            ) : viewMode === "teleprompter" ? (
              /* ═══════════════════════════════════════════════════════ */
              /* CHẾ ĐỘ MÁY NHẮC CHỮ (TELEPROMPTER ĐA KỊCH BẢN)         */
              /* ═══════════════════════════════════════════════════════ */
              <div className="space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-3.5">
                {/* Header Nhắc Chữ: Tiêu đề + Chuyển Thẻ Cảnh / Markdown + Copy */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-2">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Tv size={14} className="text-purple-400" />
                      <span>Máy Nhắc Chữ KOC &amp; MC Livestream</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Chữ to rõ, ngắt nhịp phân cảnh chuẩn tốc độ đọc quay video hoặc livestream
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    {/* Switcher: Thẻ phân cảnh vs Markdown text thô */}
                    <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setTeleprompterSubMode("cards")}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${teleprompterSubMode === "cards"
                          ? "bg-white text-black font-bold shadow-xs"
                          : "text-slate-400 hover:text-white"
                          }`}
                        title="Chế độ thẻ cảnh chữ to"
                      >
                        Thẻ Cảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeleprompterSubMode("markdown")}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${teleprompterSubMode === "markdown"
                          ? "bg-white text-black font-bold shadow-xs"
                          : "text-slate-400 hover:text-white"
                          }`}
                        title="Chế độ Markdown text thô để copy vào CapCut"
                      >
                        Markdown
                      </button>
                    </div>

                    {/* Nút sao chép teleprompter hiện tại */}
                    <button
                      type="button"
                      onClick={() => handleCopy(currentTeleprompterText, "teleprompter-active")}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
                      title="Sao chép toàn bộ lời thoại nhắc chữ đang chọn"
                    >
                      {copiedKey === "teleprompter-active" ? (
                        <Check size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Thanh Tab chọn kịch bản nhắc chữ (Kịch Bản 1, 2, 3, Livestream, Tất cả) */}
                <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-900">
                  {videoScripts.map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setTeleprompterTarget(`video-${sc.id}`)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${teleprompterTarget === `video-${sc.id}`
                        ? "bg-white text-black font-bold shadow-xs"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                        }`}
                    >
                      <span>Mẫu {sc.id}</span>
                      {sc.estimatedDuration && (
                        <span
                          className={`text-[10px] px-1 rounded font-mono ${teleprompterTarget === `video-${sc.id}`
                            ? "bg-black/20 text-black font-bold"
                            : "bg-black/50 text-slate-400"
                            }`}
                        >
                          {sc.estimatedDuration}
                        </span>
                      )}
                    </button>
                  ))}

                  {liveScript && (
                    <button
                      type="button"
                      onClick={() => setTeleprompterTarget("live")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${teleprompterTarget === "live"
                        ? "bg-white text-black font-bold shadow-xs"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                        }`}
                    >
                      <Radio size={11} className={teleprompterTarget === "live" ? "text-rose-600" : "text-rose-400"} />
                      <span>Livestream (4 Chặng)</span>
                    </button>
                  )}

                  {(videoScripts.length > 1 || (videoScripts.length > 0 && liveScript)) && (
                    <button
                      type="button"
                      onClick={() => setTeleprompterTarget("all")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${teleprompterTarget === "all"
                        ? "bg-white text-black font-bold shadow-xs"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                        }`}
                    >
                      <span>Tất Cả Lời Thoại</span>
                    </button>
                  )}
                </div>

                {/* Nội dung hiển thị */}
                {teleprompterSubMode === "markdown" ? (
                  /* ─── XEM TELEPROMPTER DẠNG VĂN BẢN TEXT THÔ / MARKDOWN ─── */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span>Văn bản text thô (sẵn sàng dán vào CapCut / Teleprompter app):</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentTeleprompterText, "teleprompter-markdown-inner")}
                        title="Sao chép văn bản này"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      >
                        {copiedKey === "teleprompter-markdown-inner" ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                    <pre className="w-full bg-black border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap select-all overflow-x-auto min-h-[360px]">
                      {currentTeleprompterText}
                    </pre>
                  </div>
                ) : (
                  /* ─── XEM TELEPROMPTER DẠNG THẺ PHÂN CẢNH CHỮ TO ─── */
                  <div className="space-y-4">
                    {/* Trường hợp 1: Chọn một kịch bản Video lẻ */}
                    {teleprompterTarget.startsWith("video-") && selectedTeleprompterVideo && (
                      <div className="bg-black rounded-xl p-4 sm:p-6 border border-slate-800 space-y-5">
                        <div className="pb-2 border-b border-slate-900 flex items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-white">{selectedTeleprompterVideo.title}</h4>
                            <span className="text-xs text-slate-400">{selectedTeleprompterVideo.angleLabel}</span>
                          </div>
                          <span className="text-xs text-purple-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                            {selectedTeleprompterVideo.estimatedDuration}
                          </span>
                        </div>
                        {selectedTeleprompterVideo.scenes.map((sc, i) => (
                          <div
                            key={sc.id}
                            className="space-y-1.5 pb-4 border-b border-slate-900 last:border-0 last:pb-0"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                              <span className="font-bold text-slate-300">
                                CẢNH {i + 1} ({sc.timeRange}) · {sc.phaseTitle || sc.phase.toUpperCase()}
                              </span>
                              <span className="text-[10px]">{sc.audioVoiceover.length} ký tự</span>
                            </div>
                            <p className="text-white text-base sm:text-lg font-semibold leading-relaxed select-all pl-3 border-l-2 border-white">
                              &ldquo;{sc.audioVoiceover}&rdquo;
                            </p>
                            {sc.visualAction && (
                              <p className="text-xs text-slate-400 italic pl-3 border-l-2 border-slate-800">
                                👉 Visual: {sc.visualAction}
                              </p>
                            )}
                            {sc.textOverlay && (
                              <p className="text-xs text-slate-400 pl-3 border-l-2 border-slate-800">
                                🔤 Chữ video: <span className="text-slate-300 font-medium">&ldquo;{sc.textOverlay}&rdquo;</span>
                              </p>
                            )}
                            {sc.soundEffectSuggestion && (
                              <p className="text-[11px] text-purple-300/80 pl-3 border-l-2 border-slate-800">
                                🎵 Âm thanh: {sc.soundEffectSuggestion}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Trường hợp 2: Chọn Livestream */}
                    {teleprompterTarget === "live" && liveScript && (
                      <div className="bg-black rounded-xl p-4 sm:p-6 border border-slate-800 space-y-5">
                        <div className="pb-2 border-b border-slate-900">
                          <h4 className="font-bold text-sm text-white">Livestream: {liveScript.targetProducts}</h4>
                          <p className="text-xs text-slate-400">{liveScript.overview}</p>
                        </div>
                        {liveScript.stages.map((st) => (
                          <div
                            key={st.stageNumber}
                            className="space-y-2 pb-5 border-b border-slate-900 last:border-0 last:pb-0"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                              <span className="font-bold text-rose-400 uppercase">
                                CHẶNG {st.stageNumber}: {st.stageName}
                              </span>
                              <span className="text-[10px] text-slate-500">{st.timeAllocation}</span>
                            </div>
                            <p className="text-white text-base sm:text-lg font-semibold leading-relaxed select-all pl-3 border-l-2 border-rose-500">
                              &ldquo;{st.hostSpeech}&rdquo;
                            </p>
                            {st.hostAction && (
                              <p className="text-xs text-slate-400 italic pl-3 border-l-2 border-slate-800">
                                👉 Hành động Host: {st.hostAction}
                              </p>
                            )}
                            {st.assistantModAction && (
                              <p className="text-xs text-slate-400 pl-3 border-l-2 border-slate-800">
                                👥 Trợ lý/Mod: {st.assistantModAction}
                              </p>
                            )}
                            {st.pinnedStrategy && (
                              <p className="text-[11px] text-amber-400 pl-3 border-l-2 border-slate-800">
                                🏷️ Ghim deal: {st.pinnedStrategy}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Trường hợp 3: Chọn Tất Cả Lời Thoại */}
                    {teleprompterTarget === "all" && (
                      <div className="space-y-5">
                        {videoScripts.map((vScript) => (
                          <div key={vScript.id} className="bg-black rounded-xl p-4 sm:p-6 border border-slate-800 space-y-4">
                            <div className="pb-2 border-b border-slate-900 flex items-center justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-white">🎬 {vScript.title}</h4>
                                <span className="text-xs text-slate-400">{vScript.angleLabel}</span>
                              </div>
                              <span className="text-xs text-purple-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                                {vScript.estimatedDuration}
                              </span>
                            </div>
                            {vScript.scenes.map((sc, idx) => (
                              <div key={sc.id} className="space-y-1.5 pb-3 border-b border-slate-900 last:border-0 last:pb-0">
                                <div className="text-xs text-slate-400 font-mono font-bold">
                                  CẢNH {idx + 1} ({sc.timeRange}) · {sc.phaseTitle || sc.phase.toUpperCase()}
                                </div>
                                <p className="text-white text-base font-semibold leading-relaxed select-all pl-3 border-l-2 border-white">
                                  &ldquo;{sc.audioVoiceover}&rdquo;
                                </p>
                                {sc.visualAction && (
                                  <p className="text-xs text-slate-400 italic pl-3 border-l-2 border-slate-800">
                                    👉 Visual: {sc.visualAction}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}

                        {liveScript && (
                          <div className="bg-black rounded-xl p-4 sm:p-6 border border-slate-800 space-y-4">
                            <div className="pb-2 border-b border-slate-900">
                              <h4 className="font-bold text-sm text-white">🔴 Livestream: {liveScript.targetProducts}</h4>
                              <p className="text-xs text-slate-400">{liveScript.overview}</p>
                            </div>
                            {liveScript.stages.map((st) => (
                              <div key={st.stageNumber} className="space-y-1.5 pb-3 border-b border-slate-900 last:border-0 last:pb-0">
                                <div className="text-xs text-rose-400 font-mono font-bold uppercase">
                                  CHẶNG {st.stageNumber}: {st.stageName} ({st.timeAllocation})
                                </div>
                                <p className="text-white text-base font-semibold leading-relaxed select-all pl-3 border-l-2 border-rose-500">
                                  &ldquo;{st.hostSpeech}&rdquo;
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ═══════════════════════════════════════════════════════ */
              /* CHẾ ĐỘ XEM THẺ (VISUAL)                                  */
              /* ═══════════════════════════════════════════════════════ */
              <div className="space-y-4">
                {/* 1. BỘ KỊCH BẢN VIDEO NGẮN (3 GÓC TIẾP CẬN) */}
                {videoScripts.length > 0 &&
                  (activeFilter === "all" || activeFilter === "video") && (
                    <div className="space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 gap-2">
                        <div className="flex items-center gap-2">
                          <Film size={14} className="text-purple-400" />
                          <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider leading-snug">
                            1. Bộ Kịch Bản Video Ngắn TikTok/Reels ({videoScripts.length} Góc Quay)
                          </h3>
                        </div>

                        {/* Nút chép toàn bộ kịch bản video */}
                        <button
                          type="button"
                          onClick={() => {
                            const allVideoText = videoScripts
                              .map(
                                (s) =>
                                  `=== ${s.title.toUpperCase()} (${s.estimatedDuration}) ===\n` +
                                  s.scenes
                                    .map(
                                      (sc) =>
                                        `[${sc.timeRange}] ${sc.phaseTitle || sc.phase}\n- Hành động: ${sc.visualAction}\n- Thoại: "${sc.audioVoiceover}"\n- Chữ: ${sc.textOverlay}`
                                    )
                                    .join("\n\n")
                              )
                              .join("\n\n\n");
                            handleCopy(allVideoText, "all-videos");
                          }}
                          className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
                          title="Sao chép toàn bộ các kịch bản video"
                        >
                          {copiedKey === "all-videos" ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>

                      {/* Danh sách từng kịch bản */}
                      <div className="space-y-4">
                        {videoScripts.map((script) => (
                          <div
                            key={script.id}
                            className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 sm:p-3.5 space-y-3"
                          >
                            {/* Header Kịch Bản */}
                            <div className="space-y-1.5 pb-2 border-b border-slate-800/80">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {script.id}
                                </span>
                                <h4 className="font-bold text-xs sm:text-sm text-white leading-snug">
                                  {script.title}
                                </h4>
                              </div>

                              <div className="flex items-center justify-between gap-2 pl-7">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {script.estimatedDuration && (
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0 whitespace-nowrap">
                                      {script.estimatedDuration}
                                    </span>
                                  )}
                                  {script.angleLabel && (
                                    <span className="text-[10px] text-slate-400 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800/80 shrink-0">
                                      {script.angleLabel}
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const singleScriptText = `${script.title} (${script.estimatedDuration})\n` +
                                      script.scenes
                                        .map(
                                          (sc) =>
                                            `[${sc.timeRange}] ${sc.phaseTitle || sc.phase}\n- Hành động: ${sc.visualAction}\n- Thoại: "${sc.audioVoiceover}"\n- Chữ: ${sc.textOverlay}`
                                        )
                                        .join("\n\n");
                                    handleCopy(singleScriptText, `script-${script.id}`);
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-90 shrink-0"
                                  title="Sao chép kịch bản này"
                                >
                                  {copiedKey === `script-${script.id}` ? (
                                    <Check size={12} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Danh sách phân cảnh trong kịch bản */}
                            <div className="space-y-2.5">
                              {script.scenes.map((sec) => {
                                const secKey = `sec-${script.id}-${sec.id}`;
                                const isCopiedSec = copiedKey === secKey;

                                return (
                                  <div
                                    key={sec.id}
                                    className="bg-slate-900 rounded-xl p-3 sm:p-3.5 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors"
                                  >
                                    {/* Header Phân Cảnh: Thời lượng và Icon sao chép ở dòng riêng bên dưới tiêu đề */}
                                    <div className="space-y-1.5 pb-2 border-b border-slate-800/80">
                                      {/* Dòng 1: STT + Tiêu đề phân cảnh */}
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                          {sec.id}
                                        </span>
                                        <span className="font-bold text-xs sm:text-sm text-white leading-snug">
                                          {sec.phaseTitle || sec.phase.toUpperCase()}
                                        </span>
                                      </div>

                                      {/* Dòng 2: Thời lượng bên trái, Icon sao chép bên phải */}
                                      <div className="flex items-center justify-between gap-2 pl-7">
                                        {sec.timeRange && (
                                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0 whitespace-nowrap">
                                            {sec.timeRange}
                                          </span>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleCopy(sec.audioVoiceover, secKey)}
                                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-90 shrink-0"
                                          title="Sao chép lời thoại"
                                        >
                                          {isCopiedSec ? (
                                            <Check size={12} className="text-emerald-400" />
                                          ) : (
                                            <Copy size={12} />
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {/* 1. Lời thoại lồng tiếng (Voiceover) */}
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                        <span>🎙️</span>
                                        <span>Lời thoại đọc (Voiceover):</span>
                                      </div>
                                      <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed pl-2.5 border-l-2 border-white select-text">
                                        &ldquo;{sec.audioVoiceover}&rdquo;
                                      </p>
                                    </div>

                                    {/* 2. Kịch bản hình ảnh & góc quay */}
                                    {sec.visualAction && (
                                      <div className="space-y-1 pt-1 border-t border-slate-800/60">
                                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                          <span>🎬</span>
                                          <span>Kịch bản hình ảnh &amp; góc quay:</span>
                                        </div>
                                        <p className="text-xs text-slate-200 leading-relaxed pl-2.5 border-l-2 border-slate-700 select-text">
                                          {sec.visualAction}
                                        </p>
                                      </div>
                                    )}

                                    {/* 3. Chữ đè video (Text Overlay) & SFX */}
                                    {(sec.textOverlay || sec.soundEffectSuggestion) && (
                                      <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                                        {sec.textOverlay && (
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                              <span>💬</span>
                                              <span>Chữ đè video (Text Overlay):</span>
                                            </div>
                                            <p className="text-xs font-bold text-white leading-relaxed pl-2.5 border-l-2 border-slate-700 select-text">
                                              &ldquo;{sec.textOverlay}&rdquo;
                                            </p>
                                          </div>
                                        )}
                                        {sec.soundEffectSuggestion && (
                                          <div className="text-[11px] text-slate-400 pl-2.5 flex items-center gap-1.5">
                                            <span>🎵</span>
                                            <span>Âm thanh SFX:</span>
                                            <span className="text-slate-300 font-medium">
                                              {sec.soundEffectSuggestion}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Lưu ý quay dựng & BGM */}
                            {script.directorNotes && (
                              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-1">
                                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                  <span>💡</span>
                                  <span>Lưu ý quay dựng &amp; BGM:</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed pl-2.5 border-l-2 border-slate-700 select-text">
                                  {script.directorNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 2. KHUNG KỊCH BẢN LIVESTREAM (4 CHẶNG VÀNG) */}
                {liveScript && (activeFilter === "all" || activeFilter === "live") && (
                  <div className="space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 gap-2">
                      <div className="flex items-center gap-2">
                        <Radio size={14} className="text-emerald-400" />
                        <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider leading-snug">
                          2. Khung Livestream Bùng Nổ Doanh Số (4 Chặng Vàng)
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const liveText = `=== KHUNG LIVESTREAM BÙNG NỔ DOANH SỐ ===\nTổng quan: ${liveScript.overview}\nSản phẩm: ${liveScript.targetProducts}\n\n` +
                            liveScript.stages
                              .map(
                                (st) =>
                                  `[Chặng ${st.stageNumber}: ${st.stageName} - ${st.timeAllocation}]\n- Thoại Host: "${st.hostSpeech}"\n- Hành động: ${st.hostAction}\n- Trợ lý: ${st.assistantModAction}\n- Ghim Deal: ${st.pinnedStrategy}`
                              )
                              .join("\n\n");
                          handleCopy(liveText, "all-live");
                        }}
                        className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
                        title="Sao chép toàn bộ kịch bản livestream"
                      >
                        {copiedKey === "all-live" ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>

                    {/* Hộp Tổng Quan Phiên Live */}
                    {liveScript.overview && (
                      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2">
                        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <span>💡</span>
                          <span>Chiến lược phiên live 30 phút:</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed pl-2.5 border-l-2 border-slate-700 select-text">
                          {liveScript.overview}
                        </p>
                        {liveScript.targetProducts && (
                          <div className="pt-1.5 border-t border-slate-800/60 text-xs text-slate-300 flex items-center gap-1.5">
                            <span className="text-slate-400 font-semibold">Sản phẩm trọng tâm:</span>
                            <span className="font-bold text-white">
                              {liveScript.targetProducts}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Danh sách 4 Chặng Vàng */}
                    <div className="space-y-2.5">
                      {liveScript.stages.map((st) => {
                        const stageKey = `stage-${st.stageNumber}`;
                        const isCopiedStage = copiedKey === stageKey;

                        return (
                          <div
                            key={st.stageNumber}
                            className="bg-slate-900 rounded-xl p-3 sm:p-3.5 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors"
                          >
                            {/* Header Chặng: Thời lượng và Icon sao chép ở dòng riêng bên dưới tiêu đề */}
                            <div className="space-y-1.5 pb-2 border-b border-slate-800/80">
                              {/* Dòng 1: STT + Tiêu đề chặng */}
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {st.stageNumber}
                                </span>
                                <span className="font-bold text-xs sm:text-sm text-white leading-snug">
                                  {st.stageName}
                                </span>
                              </div>

                              {/* Dòng 2: Thời lượng bên trái, Icon sao chép bên phải */}
                              <div className="flex items-center justify-between gap-2 pl-7">
                                {st.timeAllocation && (
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0 whitespace-nowrap">
                                    {st.timeAllocation}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleCopy(st.hostSpeech, stageKey)}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-90 shrink-0"
                                  title="Sao chép lời thoại Host chặng này"
                                >
                                  {isCopiedStage ? (
                                    <Check size={12} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Lời thoại Host */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                <span>🎙️</span>
                                <span>Lời thoại Host / MC bán hàng:</span>
                              </div>
                              <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed pl-2.5 border-l-2 border-white select-text">
                                &ldquo;{st.hostSpeech}&rdquo;
                              </p>
                            </div>

                            {/* 3 Cột thao tác: Host, Trợ lý & Ghim deal */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/60 text-xs">
                              <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 space-y-1">
                                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                  <span>🎬</span>
                                  <span>Hành động Host:</span>
                                </div>
                                <p className="text-[11px] text-slate-200 leading-relaxed">
                                  {st.hostAction}
                                </p>
                              </div>

                              <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 space-y-1">
                                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                  <span>👥</span>
                                  <span>Trợ lý / Mod hỗ trợ:</span>
                                </div>
                                <p className="text-[11px] text-slate-200 leading-relaxed">
                                  {st.assistantModAction}
                                </p>
                              </div>

                              <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 space-y-1">
                                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                  <span>📌</span>
                                  <span>Chiến lược ghim Deal:</span>
                                </div>
                                <p className="text-[11px] text-slate-200 leading-relaxed">
                                  {st.pinnedStrategy}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chiến thuật đẩy FOMO chốt đơn */}
                    {liveScript.fomoTactics && liveScript.fomoTactics.length > 0 && (
                      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2">
                        <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                          <span>⚡</span>
                          <span>Chiến thuật đẩy FOMO chốt đơn:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                          {liveScript.fomoTactics.map((tactic, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-950 rounded-lg p-2 border border-slate-800 text-xs text-slate-200 flex items-start gap-2"
                            >
                              <span className="w-4 h-4 rounded bg-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{tactic}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. KIỂM ĐỊNH AN TOÀN CHÍNH SÁCH SÀN */}
                {policy && (activeFilter === "all" || activeFilter === "policy") && (
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-3.5 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-300 pb-1.5 border-b border-slate-800/80">
                      <span className="font-bold flex items-center gap-1.5 text-white uppercase tracking-wider text-xs">
                        <ShieldCheck size={14} className="text-emerald-400" /> An Toàn Chính Sách Sàn
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {policy.safeScore}/100
                      </span>
                    </div>

                    {policy.bannedWordsAvoided && policy.bannedWordsAvoided.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 font-semibold">
                          Đã loại trừ từ cấm sàn:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {policy.bannedWordsAvoided.map((w, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                            >
                              &ldquo;{w}&rdquo;
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {policy.warningNotes && policy.warningNotes.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-800/60 text-slate-400 text-xs">
                        {policy.warningNotes.map((n, i) => (
                          <p key={i} className="leading-relaxed select-text">
                            • {n}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* TRẠNG THÁI CHƯA CÓ KẾT QUẢ - CHUẨN PHONG CÁCH AI MẪU QUẢNG CÁO */
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <Video size={20} />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-xs sm:text-sm text-slate-300">
                Chưa có kịch bản video &amp; live
              </p>
              <p className="text-xs text-slate-500 max-w-xs">
                Điền thông tin bên trái và bấm &quot;Lên Kịch Bản Bằng AI&quot; để tạo kịch bản.
              </p>
            </div>

            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Sparkles size={12} />
                Thử Dữ Liệu Mẫu (Demo)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer metadata - Gọn gàng chuẩn AI Mẫu Quảng Cáo */}

    </div>
  );
}
