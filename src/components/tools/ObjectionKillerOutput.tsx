"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  FileSpreadsheet,
  Brain,
  AlertCircle,
  MessageSquareCheck,
  Lightbulb,
  LayoutList,
  FileText,
  Layers,
  HelpCircle,
  Clock,
  Flame,
  ShieldCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import {
  parseObjectionKillerOutput,
  type ObjectionKillerData,
  type ObjectionKillerInputs,
} from "@/lib/objection-killer/contract";

export type ParsedObjectionKillerData = ObjectionKillerData;

interface ObjectionKillerOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  customerObjection?: string;
  price?: string;
  flexibleOffer?: string;
  onUseSample?: () => void;
  elapsedSeconds?: number;
  onCancel?: () => void;
  isOfflineMode?: boolean;
  onRetryWithAi?: () => void;
}

const OBJECTION_STAGES = [
  { upToSeconds: 4, text: "Đang giải mã tâm lý ngầm của khách mua online..." },
  { upToSeconds: 15, text: "Soạn thảo 3 kịch bản phản hồi bẻ gãy từ chối tức thì..." },
  { upToSeconds: 30, text: "Thiết kế các câu hỏi mở chống Ghosting dẫn dắt đặt hàng..." },
  { upToSeconds: 60, text: "Hoàn thiện bộ kịch bản chốt đơn tối ưu cho sàn..." },
];

export function ObjectionKillerOutput({
  result,
  loading,
  productName,
  customerObjection,
  price,
  flexibleOffer,
  onUseSample,
  elapsedSeconds = 0,
  onCancel,
  isOfflineMode = false,
  onRetryWithAi,
}: ObjectionKillerOutputProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"interactive" | "raw">("interactive");
  const [activeTab, setActiveTab] = useState<"all" | "pa1" | "pa2" | "pa3" | "questions" | "psychology">("all");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 1800);
  };

  const handleCopy = (text: string, key: string, label = "Đã sao chép!") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(label);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1600);
  };

  const inputs: ObjectionKillerInputs = useMemo(
    () => ({
      productName: productName || "Sản phẩm",
      price: price || "",
      customerObjection: customerObjection || "",
      flexibleOffer: flexibleOffer || "",
    }),
    [productName, price, customerObjection, flexibleOffer]
  );

  const parsed = useMemo(() => {
    if (!result) return null;
    return parseObjectionKillerOutput(result, inputs);
  }, [result, inputs]);

  const handleCopyAll = () => {
    if (!parsed) return;
    const lines = [
      `=== KỊCH BẢN BẺ GÃY TỪ CHỐI 1-1: ${parsed.productName} ===`,
      `Khách từ chối: "${parsed.customerObjection}"`,
      `\n--- 3 PHƯƠNG ÁN PHẢN HỒI ---`,
      ...parsed.responseOptions.map(
        (opt) =>
          `[${opt.title}]\nThời điểm: ${opt.timing}\nTin nhắn chat:\n"${opt.message}"`
      ),
      `\n--- CÂU HỎI MỞ CHỐNG GHOSTING ---`,
      ...parsed.openQuestions.map((q) => `• ${q.title}: "${q.question}"`),
    ];
    handleCopy(lines.join("\n\n"), "all_script", "Đã chép toàn bộ kịch bản!");
  };

  const handleExportExcel = () => {
    if (!parsed) return;
    try {
      const wb = XLSX.utils.book_new();

      const optionsRows = parsed.responseOptions.map((opt) => ({
        STT: opt.index,
        "Phương Án": opt.title,
        "Nhãn": opt.badge,
        "Thời Điểm Dùng": opt.timing,
        "Mẫu Tin Nhắn Chat": opt.message,
        "Chiến Thuật": opt.closingTactic,
        "Số Ký Tự": opt.charCount,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(optionsRows), "KichBanChat");

      const questionRows = parsed.openQuestions.map((q) => ({
        STT: q.index,
        "Kỹ Thuật": q.title,
        "Câu Hỏi Mở": q.question,
        "Tác Dụng": q.purpose,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(questionRows), "CauHoiMo");

      const safeName = (productName || "kich-ban-chat").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      XLSX.writeFile(wb, `kich-ban-chat-${safeName}-${Date.now()}.xlsx`);
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
    const safeName = (productName || "kich-ban-chat").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    a.download = `kich-ban-chat-${safeName}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải tệp .txt!");
  };

  return (
    <div className="bg-black text-white rounded-2xl shadow-2xl flex flex-col w-full min-w-0 min-h-0 relative border border-zinc-800 lg:h-full lg:overflow-hidden">
      {/* Toast mini thông báo sao chép */}
      {toastMessage && (
        <div className="fixed sm:absolute top-14 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-2xl border border-zinc-700 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <Check size={13} className="text-emerald-400 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER DÍNH (STICKY) TÍCH HỢP TOOLBAR & TABS TRÊN MOBILE */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-zinc-800 shrink-0 rounded-t-2xl">
        {/* Hàng 1: Tiêu đề & Nút Thao Tác Nhanh */}
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center bg-zinc-900 text-white border border-zinc-800 shrink-0">
              <MessageSquareCheck size={13} className="sm:w-[15px] sm:h-[15px] text-emerald-400" />
            </div>
            <h2 className="font-bold text-white text-xs sm:text-sm truncate">
              Kịch Bản Chốt Đơn 1-1
            </h2>
          </div>

          {/* Nhóm Nút Thao Tác */}
          {result && !loading && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Toggle Thẻ / Gốc */}
              <div className="bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("interactive")}
                  title="Giao diện trực quan"
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
                  title="Dữ liệu JSON gốc"
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
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Xuất file Excel"
              >
                <FileSpreadsheet size={13} className="text-emerald-400" />
              </button>

              {/* Tải tệp .txt (ẩn trên mobile để gọn) */}
              <button
                type="button"
                onClick={handleDownloadTxt}
                title="Tải tệp .txt"
                className="hidden sm:flex w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Tải file text"
              >
                <Download size={13} />
              </button>

              {/* Sao chép toàn bộ: Trắng nổi bật */}
              <button
                type="button"
                onClick={handleCopyAll}
                title={copiedKey === "all_script" ? "Đã chép tất cả" : "Sao chép toàn bộ"}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
                aria-label="Sao chép toàn bộ"
              >
                {copiedKey === "all_script" ? (
                  <Check size={13} className="stroke-[3]" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Hàng 2: Thanh Tab Lọc Tối Giản, Gọn Gàng Trên Mobile */}
        {result && viewMode === "interactive" && !loading && (
          <div className="px-3 sm:px-4 py-1.5 border-t border-zinc-900 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                activeTab === "all"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 font-medium"
              }`}
            >
              <Layers size={11} />
              <span>Tất Cả ({parsed?.responseOptions.length || 3})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pa1")}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                activeTab === "pa1"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 font-medium"
              }`}
            >
              <Sparkles size={11} className="text-emerald-400" />
              <span>PA1</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pa2")}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                activeTab === "pa2"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 font-medium"
              }`}
            >
              <Flame size={11} className="text-amber-400" />
              <span>PA2</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pa3")}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                activeTab === "pa3"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 font-medium"
              }`}
            >
              <ShieldCheck size={11} className="text-sky-400" />
              <span>PA3</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("questions")}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                activeTab === "questions"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 font-medium"
              }`}
            >
              <HelpCircle size={11} />
              <span>Hỏi Mở</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("psychology")}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                activeTab === "psychology"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 font-medium"
              }`}
            >
              <Brain size={11} />
              <span>Tâm Lý</span>
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
              Kịch bản dự phòng thực chiến sàn TMĐT (Lượt dùng AI chưa bị trừ).
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

      {/* VÙNG CUỘN NỘI DUNG CHÍNH (FULL WIDTH, CUỘN MƯỢT MÀ) */}
      <div className="flex-1 min-h-0 w-full p-3 sm:p-4 lg:overflow-y-auto custom-scrollbar relative z-10 space-y-3 pb-20 lg:pb-4 bg-black">
        {loading ? (
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="Đang soạn 3 kịch bản bẻ gãy từ chối..."
            stages={OBJECTION_STAGES}
            accentColor="emerald"
            minHeightClass="min-h-[340px]"
          />
        ) : result && parsed ? (
          <div className="space-y-3 w-full">
            {/* Tóm tắt lời từ chối của khách hàng (siêu gọn) */}
            {parsed.customerObjection && (
              <div className="px-2.5 py-1 bg-zinc-950 rounded-lg border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center gap-1.5 truncate">
                <span className="text-zinc-500 font-bold shrink-0">Khách nói:</span>
                <span className="text-zinc-300 truncate italic">
                  &ldquo;{parsed.customerObjection}&rdquo;
                </span>
              </div>
            )}

            {viewMode === "raw" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Dữ liệu gốc (JSON):</span>
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
              <div className="space-y-3 w-full">
                {/* 1. DANH SÁCH 3 PHƯƠNG ÁN PHẢN HỒI (PA1, PA2, PA3) */}
                {activeTab !== "questions" &&
                  activeTab !== "psychology" &&
                  parsed.responseOptions
                    .filter((opt) => {
                      if (activeTab === "all") return true;
                      if (activeTab === "pa1") return opt.index === 1;
                      if (activeTab === "pa2") return opt.index === 2;
                      if (activeTab === "pa3") return opt.index === 3;
                      return false;
                    })
                    .map((opt) => (
                      <div
                        key={opt.index}
                        className="bg-zinc-950 rounded-xl border border-zinc-800/90 p-3 sm:p-3.5 space-y-2 transition-colors hover:border-zinc-700 w-full"
                      >
                        {/* Hàng Tiêu Đề: Gọn gàng, tiêu đề + badge trên 1 dòng, nút copy icon-only cùng hàng */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-zinc-900 text-white border border-zinc-800 shrink-0 font-mono">
                              PA{opt.index}
                            </span>
                            <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                              {opt.title}
                            </h3>
                            {opt.badge && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 inline-block font-normal">
                                {opt.badge}
                              </span>
                            )}
                          </div>

                          {/* Nút Sao Chép Icon-Only */}
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                opt.message,
                                `opt_${opt.index}`,
                                `Đã chép Phương án ${opt.index}!`
                              )
                            }
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
                            title={`Sao chép Phương án ${opt.index}`}
                            aria-label={`Sao chép Phương án ${opt.index}`}
                          >
                            {copiedKey === `opt_${opt.index}` ? (
                              <Check size={13} className="text-emerald-400 stroke-[3]" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>

                        {/* Thời điểm dùng ngắn gọn */}
                        {opt.timing && (
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 break-words leading-tight">
                            <Clock size={11} className="text-zinc-500 shrink-0" />
                            <span>{opt.timing}</span>
                          </div>
                        )}

                        {/* Mẫu Tin Nhắn Chat: Nền đen thuần, Chạm là sao chép ngay */}
                        <div
                          onClick={() =>
                            handleCopy(
                              opt.message,
                              `opt_${opt.index}`,
                              `Đã chép Phương án ${opt.index}!`
                            )
                          }
                          title="Chạm để sao chép tin nhắn"
                          className="bg-black border border-zinc-800 hover:border-zinc-700 active:border-emerald-500/80 rounded-xl p-3 sm:p-3.5 text-zinc-100 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words select-all font-sans cursor-pointer transition-colors"
                        >
                          {opt.message}
                          <div className="flex items-center justify-between pt-1.5 mt-2 border-t border-zinc-900 text-[10px] text-zinc-500">
                            <span className="text-zinc-400">⚡ Chạm để sao chép tin nhắn</span>
                            <span className="font-mono">{opt.charCount || opt.message.length} ký tự</span>
                          </div>
                        </div>

                        {/* Chiến thuật tâm lý ngắn gọn */}
                        {opt.closingTactic && (
                          <div className="text-[11px] text-zinc-400 flex items-start gap-1.5 break-words pt-0.5 leading-snug">
                            <Lightbulb size={11} className="text-amber-400/80 shrink-0 mt-0.5" />
                            <span className="text-zinc-300">{opt.closingTactic}</span>
                          </div>
                        )}
                      </div>
                    ))}

                {/* 2. CÂU HỎI MỞ CHỐNG GHOSTING */}
                {(activeTab === "all" || activeTab === "questions") && (
                  <div className="space-y-2.5 pt-1 w-full">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white px-0.5">
                      <HelpCircle size={13} className="text-sky-400" />
                      <span>CÂU HỎI MỞ CHỐNG GHOSTING</span>
                    </div>

                    {parsed.openQuestions.map((q) => (
                      <div
                        key={q.index}
                        className="bg-zinc-950 rounded-xl border border-zinc-800/90 p-3 sm:p-3.5 space-y-2 hover:border-zinc-700 transition-colors w-full"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-white leading-snug break-words flex-1">
                            {q.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                q.question,
                                `oq_${q.index}`,
                                `Đã chép câu hỏi mở ${q.index}!`
                              )
                            }
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
                            title="Sao chép câu hỏi mở"
                            aria-label="Sao chép câu hỏi mở"
                          >
                            {copiedKey === `oq_${q.index}` ? (
                              <Check size={13} className="text-emerald-400 stroke-[3]" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>

                        <div
                          onClick={() =>
                            handleCopy(
                              q.question,
                              `oq_${q.index}`,
                              `Đã chép câu hỏi mở ${q.index}!`
                            )
                          }
                          title="Chạm để sao chép"
                          className="bg-black border border-zinc-800 border-l-2 border-l-sky-400 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm text-zinc-100 italic break-words cursor-pointer hover:border-zinc-700 select-all transition-colors"
                        >
                          &ldquo;{q.question}&rdquo;
                        </div>

                        {q.purpose && (
                          <p className="text-[11px] text-zinc-400 leading-snug">
                            🎯 {q.purpose}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. TÂM LÝ NGẦM TỐI GIẢN */}
                {(activeTab === "all" || activeTab === "psychology") && (
                  <div className="space-y-2.5 pt-1 w-full">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white px-0.5">
                      <Brain size={13} className="text-amber-400" />
                      <span>GIẢI MÃ TÂM LÝ NGẦM CỦA KHÁCH</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                      <div className="bg-zinc-950 rounded-xl border border-zinc-800/90 p-3 space-y-1.5">
                        <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                          <Brain size={12} /> Nỗi Sợ Thực Sự Của Khách:
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed break-words">
                          {parsed.psychology.realFear}
                        </p>
                      </div>

                      <div className="bg-zinc-950 rounded-xl border border-zinc-800/90 p-3 space-y-1.5">
                        <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                          <AlertCircle size={12} /> Sai Lầm Nhân Viên Cần Tránh:
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed break-words">
                          {parsed.psychology.staffMistake}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Trạng Thái Trống / Chưa Tạo */
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <MessageSquareCheck size={22} />
            </div>
            <div className="max-w-xs space-y-1">
              <h3 className="text-sm font-bold text-white">Chưa Có Kịch Bản Trực Chat</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Nhập tên sản phẩm và lời từ chối của khách bên trái để AI lên 3 kịch bản bẻ gãy từ chối ngay.
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

export default ObjectionKillerOutput;
