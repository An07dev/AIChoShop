"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Download,
  Sparkles,
  Search,
  Layers,
  FileText,
  Hash,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Zap,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";
import {
  SEO_PLATFORMS,
  charCount,
  seoFilename,
  seoToText,
  type SeoSnapshot,
} from "@/lib/seo/contract";

const TITLE_VARIANTS_META = [
  {
    role: "Chuẩn SEO Thuật Toán",
    tag: "Đẩy Top Sàn",
    tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    badgeBg: "from-emerald-600 to-teal-600",
  },
  {
    role: "Kích Cầu Click Chuột",
    tag: "Tăng CTR",
    tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    badgeBg: "from-amber-600 to-orange-600",
  },
  {
    role: "Nổi Bật Ưu Điểm (USP)",
    tag: "Độc Quyền",
    tagColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    badgeBg: "from-cyan-600 to-blue-600",
  },
  {
    role: "Tối Ưu Quảng Cáo Ads",
    tag: "Chuẩn Ads",
    tagColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    badgeBg: "from-indigo-600 to-violet-600",
  },
  {
    role: "Toàn Diện & Chuyển Đổi",
    tag: "Chốt Đơn",
    tagColor: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    badgeBg: "from-teal-600 to-emerald-600",
  },
];

export function SeoOptimizerOutput({
  snapshot,
  loading,
  onUseSample,
}: {
  snapshot: SeoSnapshot | null;
  loading: boolean;
  onUseSample?: () => void;
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const [activeFilter, setActiveFilter] = useState<"all" | "titles" | "desc" | "hashtags">("all");
  const { showError, showSuccess } = useToast();

  const result = snapshot?.output;
  const platform = snapshot?.inputs.platform || "shopee";
  const platformInfo = SEO_PLATFORMS[platform];

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
    } catch {
      showError("Không thể sao chép. Vui lòng chọn văn bản và sao chép thủ công.");
    }
  };

  const handleCopyAll = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(seoToText(result));
      setCopiedAll(true);
      showSuccess("Đã sao chép toàn bộ nội dung SEO!");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      showError("Không thể sao chép toàn bộ. Vui lòng thử lại.");
    }
  };

  const handleDownload = () => {
    if (!snapshot || !result) return;
    const blob = new Blob([seoToText(result)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = seoFilename(snapshot.inputs);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const allText = result ? seoToText(result) : "";
  const wordCount = allText ? allText.trim().split(/\s+/).length : 0;
  const totalChars = allText ? allText.length : 0;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl flex flex-col lg:h-full lg:min-h-0 relative lg:overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ sang trọng */}
      <div className="absolute top-0 right-0 p-36 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-36 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header thanh công cụ (Sticky trên Mobile để luôn nằm trong tầm tay) */}
      <div className="sticky top-0 z-30 px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md rounded-t-2xl shrink-0 space-y-2.5 shadow-sm">
        {/* Hàng 1: Tiêu đề + Chuyển chế độ xem */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <Search size={14} />
            </div>
            <h2 className="font-bold text-white text-xs sm:text-sm whitespace-nowrap">
              Nội Dung SEO Sàn
            </h2>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                platform === "shopee"
                  ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                  : "bg-blue-500/20 text-blue-300 border-blue-500/40"
              }`}
            >
              {platformInfo.label}
            </span>
          </div>

          {/* Nút chuyển chế độ Trực Quan / Văn Bản (chỉ hiện trên Desktop lg+) */}
          {result && !loading && (
            <div className="hidden lg:flex bg-slate-950/90 p-0.5 rounded-lg border border-slate-800 shrink-0 gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`py-1 px-2.5 rounded text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "preview"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Trực Quan
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`py-1 px-2.5 rounded text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Văn Bản
              </button>
            </div>
          )}
        </div>

        {/* Hàng 2: Nút Tải TXT & Nút Sao Chép Toàn Bộ (chỉ hiện trên Desktop lg+) */}
        {result && !loading && (
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/80 shrink-0 text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-xs"
              title="Tải về file TXT"
            >
              <Download size={13} />
              <span>TXT</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className={`flex-1 justify-center px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
                copiedAll
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20"
              }`}
            >
              {copiedAll ? (
                <>
                  <Check size={14} className="stroke-[3]" />
                  <span>Đã Sao Chép Toàn Bộ</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Sao Chép Tất Cả</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Hàng 3: Tabs lọc nhanh danh mục (chỉ hiện trên Desktop lg+) */}
        {result && !loading && viewMode === "preview" && (
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === "all"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-800/70 text-slate-400 hover:text-white"
              }`}
            >
              Tất Cả
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("titles")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeFilter === "titles"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-800/70 text-slate-400 hover:text-white"
              }`}
            >
              <Layers size={12} /> 1. Tiêu Đề ({result.titles.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("desc")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeFilter === "desc"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-800/70 text-slate-400 hover:text-white"
              }`}
            >
              <FileText size={12} /> 2. Mô Tả AIDA
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("hashtags")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeFilter === "hashtags"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-800/70 text-slate-400 hover:text-white"
              }`}
            >
              <Hash size={12} /> 3. Hashtags ({result.hashtags.length})
            </button>
          </div>
        )}
      </div>

      {/* Vùng hiển thị nội dung: Cuộn tự nhiên mượt mà trên Mobile, cuộn độc lập trên Desktop */}
      <div className="flex-1 p-3.5 sm:p-5 lg:overflow-y-auto custom-scrollbar relative z-10">
        {loading ? (
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Sparkles size={26} className="animate-spin text-emerald-400 duration-1000" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Tối Ưu SEO &amp; Viết Nội Dung Chuẩn Sàn...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Đang nghiên cứu từ khóa, tạo 5 biến thể tiêu đề giật tít chuẩn thuật toán và xây dựng mô tả AIDA...
              </p>
            </div>
          </div>
        ) : !result ? (
          <div className="h-full min-h-[360px] sm:min-h-[380px] flex flex-col items-center justify-center text-center p-5 sm:p-6 text-slate-500 space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Search size={28} />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm sm:text-base font-bold text-slate-200">Chưa Có Nội Dung SEO</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập thông tin sản phẩm ở tab &quot;Nhập thông tin&quot; rồi bấm nút bên dưới để AI tự động tối ưu trọn bộ.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-[10px] text-slate-400">
              <span className="flex gap-1 items-center border border-slate-700/80 bg-slate-800/50 rounded-full px-2.5 py-1 text-slate-300">
                <Layers size={11} className="text-emerald-400" /> 5 Tiêu đề chuẩn SEO
              </span>
              <span className="flex gap-1 items-center border border-slate-700/80 bg-slate-800/50 rounded-full px-2.5 py-1 text-slate-300">
                <FileText size={11} className="text-teal-400" /> Mô tả AIDA thu hút
              </span>
              <span className="flex gap-1 items-center border border-slate-700/80 bg-slate-800/50 rounded-full px-2.5 py-1 text-slate-300">
                <Hash size={11} className="text-cyan-400" /> 10 Hashtag thịnh hành
              </span>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles size={14} /> Thử Dữ Liệu Mẫu (Demo)
              </button>
            )}
          </div>
        ) : viewMode === "raw" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Định dạng văn bản thô (Markdown)</span>
              <button
                type="button"
                onClick={() => handleCopy(seoToText(result), "raw-copy")}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
              >
                {copiedId === "raw-copy" ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedId === "raw-copy" ? "Đã chép" : "Sao chép toàn bộ"}</span>
              </button>
            </div>
            <pre className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30 overflow-x-auto">
              {seoToText(result)}
            </pre>
          </div>
        ) : (
          <div>
            {/* ============================================================= */}
            {/* 📱 GIAO DIỆN MOBILE: THUẦN TEXT GỌN GÀNG CHUẨN AI (< lg)       */}
            {/* ============================================================= */}
            <div className="lg:hidden p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 text-[13px] text-slate-200 leading-relaxed select-text space-y-5">
              {/* 1. NĂM BIẾN THỂ TIÊU ĐỀ */}
              {result.titles.length > 0 && (
                <div className="space-y-3 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      🏷️ 1. NĂM BIẾN THỂ TIÊU ĐỀ CHUẨN SEO
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.titles.join("\n\n"), "all-titles")}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                    >
                      {copiedId === "all-titles" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedId === "all-titles" ? "Đã chép" : "Chép cả 5"}</span>
                    </button>
                  </div>

                  <div className="space-y-3 pl-1">
                    {result.titles.map((title, index) => {
                      const count = charCount(title);
                      const isOptimal = count <= platformInfo.titleLimit;
                      const itemKey = `title-${index}`;
                      const isCopied = copiedId === itemKey;
                      const meta = TITLE_VARIANTS_META[index] || TITLE_VARIANTS_META[0];

                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-300 text-xs">
                              • Biến thể {index + 1} ({meta.role}):
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(title, itemKey)}
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                            >
                              {isCopied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                              <span>{isCopied ? "Đã chép" : "Chép"}</span>
                            </button>
                          </div>
                          <p className="text-slate-100 pl-3 leading-snug select-text">
                            <span className="text-slate-400">Tên sản phẩm: </span>
                            {title}
                          </p>
                          <p className="text-[11px] text-slate-500 pl-3">
                            ({count}/{platformInfo.titleLimit} ký tự{isOptimal ? " - Chuẩn SEO sàn" : " - Dài hơn đề xuất"})
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. MÔ TẢ SẢN PHẨM AIDA */}
              {result.descriptions.length > 0 && (
                <div className="space-y-3.5 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      📝 2. MÔ TẢ SẢN PHẨM (AIDA)
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          result.descriptions.map((item) => `• ${item.title}:\n${item.content}`).join("\n\n"),
                          "all-desc"
                        )
                      }
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                    >
                      {copiedId === "all-desc" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedId === "all-desc" ? "Đã chép" : "Chép toàn bộ"}</span>
                    </button>
                  </div>

                  <div className="space-y-3 pl-1">
                    {result.descriptions.map((item, index) => {
                      const descKey = `desc-${index}`;
                      const isCopied = copiedId === descKey;

                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-slate-300 text-xs">
                              • {item.title}:
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleCopy(`${item.title}:\n\n${item.content}`, descKey)}
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                            >
                              {isCopied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                              <span>{isCopied ? "Đã chép" : "Chép"}</span>
                            </button>
                          </div>
                          <p className="text-slate-300 leading-relaxed pl-3 whitespace-pre-wrap select-text">
                            {item.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. HASHTAGS GỢI Ý */}
              {result.hashtags.length > 0 && (
                <div className="space-y-3 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      🔍 3. MƯỜI HASHTAG LÊN XU HƯỚNG
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.hashtags.join(" "), "all-tags")}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                    >
                      {copiedId === "all-tags" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedId === "all-tags" ? "Đã chép" : "Chép toàn bộ"}</span>
                    </button>
                  </div>

                  <div className="space-y-1 pl-1">
                    <p className="pl-3 text-slate-300 leading-relaxed select-text font-mono text-xs">
                      {result.hashtags.join(" ")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================= */}
            {/* 🖥️ GIAO DIỆN DESKTOP: THẺ TRỰC QUAN ĐẦY ĐỦ (lg+)              */}
            {/* ============================================================= */}
            <div className="hidden lg:block space-y-6 pb-6">
              {/* 1. NĂM BIẾN THỂ TIÊU ĐỀ */}
            {(activeFilter === "all" || activeFilter === "titles") && (
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-3.5 sm:p-5 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/90">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base sm:text-lg shrink-0">🏷️</span>
                    <div>
                      <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide">
                        1. Năm Biến Thể Tiêu Đề Chuẩn SEO
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Thuật toán {platformInfo.label} · Tối đa {platformInfo.titleLimit} ký tự
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.titles.join("\n\n"), "all-titles")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 shadow-xs"
                  >
                    {copiedId === "all-titles" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedId === "all-titles" ? "Đã chép 5 tiêu đề" : "Chép 5 tiêu đề"}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {result.titles.map((title, index) => {
                    const count = charCount(title);
                    const isOptimal = count <= platformInfo.titleLimit;
                    const itemKey = `title-${index}`;
                    const meta = TITLE_VARIANTS_META[index] || TITLE_VARIANTS_META[0];
                    const percent = Math.min(100, Math.round((count / platformInfo.titleLimit) * 100));

                    return (
                      <div
                        key={index}
                        className="bg-slate-900/90 rounded-xl border border-slate-800 hover:border-slate-700/80 p-3 sm:p-4 transition-all space-y-2.5 group"
                      >
                        {/* Hàng 1: Số thứ tự + Nhãn biến thể bên trái, Nút sao chép bên phải */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${meta.badgeBg} text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-xs`}>
                              {index + 1}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${meta.tagColor}`}>
                              {meta.tag}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 truncate hidden sm:inline">
                              {meta.role}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopy(title, itemKey)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                              copiedId === itemKey
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                            }`}
                          >
                            {copiedId === itemKey ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedId === itemKey ? "Đã chép" : "Sao chép"}</span>
                          </button>
                        </div>

                        {/* Hàng 2: Thanh tiến trình & Đếm ký tự */}
                        <div className="space-y-1">
                          <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isOptimal ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono px-0.5">
                            <span
                              className={`font-medium flex items-center gap-1.5 shrink-0 ${
                                isOptimal ? "text-emerald-400" : "text-amber-400"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isOptimal ? "bg-emerald-400" : "bg-amber-400"
                                }`}
                              />
                              <span>{count}/{platformInfo.titleLimit} ký tự</span>
                            </span>
                            <span className="text-slate-600 shrink-0">•</span>
                            <span className={`text-[10px] sm:text-[11px] truncate ${isOptimal ? "text-slate-400" : "text-amber-400/90 font-medium"}`}>
                              {isOptimal ? "Chuẩn thuật toán sàn" : "Hơi dài so với sàn"}
                            </span>
                          </div>
                        </div>

                        {/* Hàng 3: Khung text tiêu đề tương phản cao, click-to-copy */}
                        <div
                          onClick={() => handleCopy(title, itemKey)}
                          title="Bấm để sao chép nhanh"
                          className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/90 group-hover:border-slate-700 transition-colors cursor-pointer active:bg-slate-950"
                        >
                          <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed select-all">
                            {title}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. MÔ TẢ SẢN PHẨM AIDA */}
            {(activeFilter === "all" || activeFilter === "desc") && (
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-3.5 sm:p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/90">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base sm:text-lg shrink-0">📝</span>
                    <div>
                      <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide">
                        2. Mô Tả Sản Phẩm Chi Tiết (AIDA)
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Cấu trúc khơi gợi nhu cầu, nổi bật USP và cam kết mua hàng
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        result.descriptions.map((item) => `• ${item.title}:\n${item.content}`).join("\n\n"),
                        "all-desc"
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 shadow-xs"
                  >
                    {copiedId === "all-desc" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedId === "all-desc" ? "Đã chép cả mô tả" : "Chép cả mô tả"}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {result.descriptions.map((item, index) => {
                    const descKey = `desc-${index}`;
                    return (
                      <div
                        key={index}
                        className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-2.5 hover:border-slate-700/80 transition-all"
                      >
                        {/* Tiêu đề mục mô tả: Không bao giờ bị truncate trên Mobile */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                            <h4 className="font-bold text-xs sm:text-sm text-emerald-300 leading-snug break-words">
                              {item.title}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(`${item.title}:\n\n${item.content}`, descKey)}
                            className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                              copiedId === descKey
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60"
                            }`}
                          >
                            {copiedId === descKey ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copiedId === descKey ? "Đã chép" : "Chép đoạn"}</span>
                          </button>
                        </div>

                        {/* Nội dung mô tả */}
                        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
                            {item.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. MƯỜI HASHTAG GỢI Ý */}
            {(activeFilter === "all" || activeFilter === "hashtags") && (
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-3.5 sm:p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/90">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base sm:text-lg shrink-0">🔍</span>
                    <div>
                      <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide">
                        3. Mười Hashtag Lên Xu Hướng
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Tăng hiển thị đề xuất và tìm kiếm tự nhiên
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.hashtags.join(" "), "all-tags")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 shadow-xs"
                  >
                    {copiedId === "all-tags" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedId === "all-tags" ? "Đã chép tất cả" : "Chép toàn bộ"}</span>
                  </button>
                </div>

                {/* Danh sách Hashtag chips */}
                <div className="flex gap-2 flex-wrap">
                  {result.hashtags.map((tag) => {
                    const isCopied = copiedId === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleCopy(tag, tag)}
                        title="Bấm để sao chép hashtag này"
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          isCopied
                            ? "bg-emerald-500 text-white border-emerald-400 shadow-xs"
                            : "bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60 hover:text-emerald-200 shadow-xs"
                        }`}
                      >
                        {isCopied ? <Check size={11} className="stroke-[3]" /> : <Hash size={11} />}
                        <span className="font-medium">{tag.replace(/^#/, "")}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Chuỗi dán nhanh toàn bộ Hashtag */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Chuỗi Hashtag Dán Nhanh Vào Cuối Bài
                    </span>
                    <p className="text-xs text-slate-300 font-mono select-all break-all leading-relaxed">
                      {result.hashtags.join(" ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.hashtags.join(" "), "all-tags-box")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
                      copiedId === "all-tags-box"
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40"
                    }`}
                  >
                    {copiedId === "all-tags-box" ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedId === "all-tags-box" ? "Đã chép chuỗi" : "Chép chuỗi"}</span>
                  </button>
                </div>
              </div>
            )}
            </div>

            {/* Footer metadata */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <span>Số từ: <strong className="text-slate-300">{wordCount}</strong></span>
                <span>•</span>
                <span>Ký tự: <strong className="text-slate-300">{totalChars}</strong></span>
                <span>•</span>
                <span>Hashtag: <strong className="text-emerald-400">{result.hashtags.length}</strong></span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-medium">
                <Check size={13} className="shrink-0 stroke-[3]" />
                <span>Đã chuẩn hóa định dạng cho {platformInfo.label}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
