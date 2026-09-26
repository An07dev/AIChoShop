"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  Sparkles,
  Rocket,
  Search,
  Video,
  Megaphone,
  HeartHandshake,
  ShieldAlert,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import {
  ProductLaunchpadData,
  ProductLaunchpadInputs,
  cleanAndValidateLaunchpadOutput,
  generatePlainTextDossier,
  exportLaunchpadToExcel,
} from "@/lib/product-launchpad/contract";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";

interface ProductLaunchpadOutputProps {
  result: string;
  loading: boolean;
  inputs: ProductLaunchpadInputs;
  elapsedSeconds?: number;
  onCancel?: () => void;
  onUseSample?: () => void;
}

const LAUNCHPAD_STAGES = [
  { upToSeconds: 5, text: "🚀 Đang định vị sản phẩm & phân tích đối tượng mục tiêu..." },
  { upToSeconds: 15, text: "📦 Đang tối ưu bộ Listing SEO & Bullet points chuẩn Shopee/TikTok..." },
  { upToSeconds: 28, text: "🎬 Đang biên soạn 3 kịch bản video ngắn đánh trúng tâm lý mua hàng..." },
  { upToSeconds: 42, text: "📢 Đang viết 3 mẫu bài quảng cáo Ads chuyển đổi cao..." },
  { upToSeconds: 60, text: "💌 Đang soạn thư cảm ơn nhét hộp & kịch bản CSKH chống bom COD..." },
  { upToSeconds: 90, text: "✨ Hoàn thiện đóng gói trọn bộ hồ sơ chiến dịch ra mắt 5-in-1..." },
];

/**
 * Nút sao chép tối ưu: Chỉ hiển thị icon trên Mobile, hiển thị đầy đủ icon + chữ trên Desktop
 */
function CopyIconButton({
  copied,
  onClick,
  title = "Sao chép",
  ariaLabel = "Sao chép nội dung",
}: {
  copied: boolean;
  onClick: () => void;
  title?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0 border ${
        copied
          ? "bg-emerald-600 text-white border-emerald-500 shadow-xs"
          : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700"
      }`}
      title={copied ? "Đã sao chép!" : title}
      aria-label={ariaLabel}
    >
      {copied ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
      <span className="hidden sm:inline">{copied ? "Đã chép" : "Sao chép"}</span>
    </button>
  );
}

export function ProductLaunchpadOutput({
  result,
  loading,
  inputs,
  elapsedSeconds = 0,
  onCancel,
  onUseSample,
}: ProductLaunchpadOutputProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "seo" | "video" | "ads" | "unboxing" | "cod">("overview");
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Trình sao chép an toàn đa nền tảng (hỗ trợ mobile browser, in-app webview Zalo/FB/TikTok)
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback sang textarea execCommand nếu clipboard API bị chặn
    }

    try {
      if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.setAttribute("readonly", "");
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        return Boolean(successful);
      }
    } catch {
      return false;
    }
    return false;
  };

  // Phân tích kết quả JSON có bẫy lỗi tuyệt đối không crash React component
  const data: ProductLaunchpadData | null = useMemo(() => {
    if (!result) return null;
    try {
      return cleanAndValidateLaunchpadOutput(result, inputs);
    } catch (err) {
      console.error("[ProductLaunchpadOutput] Parse error:", err);
      return null;
    }
  }, [result, inputs]);

  // Sao chép an toàn
  const handleCopy = async (id: string, text: string) => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Sao chép toàn bộ hồ sơ
  const handleCopyAll = () => {
    if (!data) return;
    try {
      const fullText = generatePlainTextDossier(data, inputs);
      handleCopy("copy_all", fullText);
    } catch (err) {
      console.error("[ProductLaunchpadOutput] Copy all error:", err);
    }
  };

  // Tải file .TXT an toàn tuyệt đối
  const handleDownloadTxt = () => {
    if (!data) return;
    try {
      const fullText = generatePlainTextDossier(data, inputs);
      const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (data.overview?.productName || "Product")
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\s+/g, "_")
        .slice(0, 30);
      a.download = `Ho_So_Ra_Mat_${safeName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("[ProductLaunchpadOutput] TXT download error:", err);
    }
  };

  // Xuất file Excel
  const handleExportExcel = () => {
    if (!data) return;
    try {
      exportLaunchpadToExcel(data, inputs);
    } catch (err) {
      console.error("[ProductLaunchpadOutput] Excel export error:", err);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0b0f19] text-white rounded-2xl shadow-xl border border-slate-800 flex flex-col w-full h-auto lg:min-h-[560px] lg:h-full relative overflow-visible lg:overflow-hidden p-4 sm:p-6 justify-center">
        <ToolLoadingState
          stages={LAUNCHPAD_STAGES}
          elapsedSeconds={elapsedSeconds}
          onCancel={onCancel}
          accentColor="emerald"
          title="AI Đang Lập Hồ Sơ 5-in-1..."
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#0b0f19] text-white rounded-2xl shadow-xl border border-slate-800 flex flex-col items-center justify-center p-4 sm:p-8 text-center w-full h-auto min-h-[420px] lg:min-h-[560px] lg:h-full relative overflow-visible lg:overflow-hidden">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-emerald-500/10">
          <Rocket size={28} className="sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-white">
          Sẵn Sàng Ra Mắt Sản Phẩm Mới
        </h3>
        <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
          Nhập thông tin sản phẩm hoặc bấm nạp nhanh dữ liệu mẫu để AI xuất bản trọn bộ 5 tài sản:
        </p>

        {/* 5 Deliverables checklist (gọn gàng trên mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-left my-4 sm:my-5 max-w-lg w-full">
          <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>Listing chuẩn SEO Shopee &amp; TikTok</span>
          </div>
          <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>Bộ 3 Kịch bản Video ngắn</span>
          </div>
          <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>Bộ 3 Mẫu bài viết chạy Ads</span>
          </div>
          <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>Thư cảm ơn nhét hộp &amp; Voucher</span>
          </div>
          <div className="col-span-1 sm:col-span-2 flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>Kịch bản CSKH &amp; Chống bom hàng COD</span>
          </div>
        </div>

        {onUseSample && (
          <button
            type="button"
            onClick={onUseSample}
            className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95"
          >
            <Sparkles size={13} />
            <span>Nạp Nhanh Dữ Liệu Mẫu Thực Chiến</span>
          </button>
        )}
      </div>
    );
  }

  const { overview, seoListing, videoScripts, adCopies, unboxingCard, antiReturnNudge } = data;

  return (
    <div className="bg-[#0b0f19] text-white rounded-2xl shadow-xl border border-slate-800 flex flex-col w-full h-auto lg:min-h-[560px] lg:h-full relative overflow-visible lg:overflow-hidden">
      {/* 1. TOP TOOLBAR: GỌN GÀNG TRÊN MOBILE, ĐẦY ĐỦ TRÊN DESKTOP */}
      <div className="sticky top-0 z-20 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-800 bg-[#0e1526]/95 backdrop-blur-md shrink-0 space-y-2 rounded-t-2xl">
        {/* Hàng 1: Tiêu đề + Nhóm nút thao tác (chỉ icon trên mobile) */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
            <div className="p-1 sm:p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 shrink-0">
              <Rocket size={14} className="sm:w-4 sm:h-4" />
            </div>
            <h2 className="font-bold text-white text-xs sm:text-sm tracking-wide shrink-0">
              <span className="sm:hidden">Hồ Sơ 5-in-1</span>
              <span className="hidden sm:inline">Hồ Sơ Ra Mắt 5-in-1</span>
            </h2>
            <span className="hidden md:inline-block text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium truncate max-w-[160px]">
              {overview.productName}
            </span>
          </div>

          {/* Nhóm nút thao tác: Trên mobile chỉ hiển thị Icon để tiết kiệm tối đa diện tích */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Nút Sao Chép Toàn Bộ (Trên mobile chỉ icon) */}
            <button
              type="button"
              onClick={handleCopyAll}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
                copiedId === "copy_all"
                  ? "bg-emerald-600 text-white"
                  : "bg-white hover:bg-slate-200 text-slate-950"
              }`}
              title={copiedId === "copy_all" ? "Đã sao chép tất cả!" : "Sao chép toàn bộ hồ sơ 5-in-1"}
              aria-label="Sao chép toàn bộ hồ sơ"
            >
              {copiedId === "copy_all" ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
              <span className="hidden sm:inline">{copiedId === "copy_all" ? "Đã Chép!" : "Sao Chép Tất Cả"}</span>
            </button>

            {/* Nút Tải TXT (Trên mobile chỉ icon) */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
              title="Tải file văn bản .TXT"
              aria-label="Tải file TXT"
            >
              <Download size={13} className="text-slate-300" />
              <span className="hidden sm:inline">TXT</span>
            </button>

            {/* Nút Xuất Excel 5 Sheet (Trên mobile chỉ icon) */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs"
              title="Xuất file Excel đầy đủ 5 sheets"
              aria-label="Xuất file Excel"
            >
              <FileSpreadsheet size={13} />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>

        {/* Hàng 2: Thanh điều hướng 6 Tab (Tối ưu padding & nhãn ngắn gọn trên Mobile) */}
        <div className="bg-slate-900/90 p-0.5 sm:p-1 rounded-xl border border-slate-800 flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === "overview"
                ? "bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-xs"
                : "text-slate-400 hover:text-white font-medium"
            }`}
          >
            <Sparkles size={11} className="sm:w-3 sm:h-3" />
            <span>Tổng Quan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className={`py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === "seo"
                ? "bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-xs"
                : "text-slate-400 hover:text-white font-medium"
            }`}
          >
            <Search size={11} className="sm:w-3 sm:h-3" />
            <span><span className="hidden sm:inline">1. </span>Listing SEO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("video")}
            className={`py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === "video"
                ? "bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-xs"
                : "text-slate-400 hover:text-white font-medium"
            }`}
          >
            <Video size={11} className="sm:w-3 sm:h-3" />
            <span><span className="hidden sm:inline">2. </span>Video ({videoScripts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ads")}
            className={`py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === "ads"
                ? "bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-xs"
                : "text-slate-400 hover:text-white font-medium"
            }`}
          >
            <Megaphone size={11} className="sm:w-3 sm:h-3" />
            <span><span className="hidden sm:inline">3. </span>Ads ({adCopies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("unboxing")}
            className={`py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === "unboxing"
                ? "bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-xs"
                : "text-slate-400 hover:text-white font-medium"
            }`}
          >
            <HeartHandshake size={11} className="sm:w-3 sm:h-3" />
            <span><span className="hidden sm:inline">4. </span>Thư Cảm Ơn</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cod")}
            className={`py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === "cod"
                ? "bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-xs"
                : "text-slate-400 hover:text-white font-medium"
            }`}
          >
            <ShieldAlert size={11} className="sm:w-3 sm:h-3" />
            <span><span className="hidden sm:inline">5. </span>CSKH COD</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT (Scrollable, Tối ưu thẻ và khoảng cách trên Mobile) */}
      <div className="flex-1 lg:min-h-0 lg:overflow-y-auto custom-scrollbar p-3 sm:p-5 space-y-3 sm:space-y-4">
        {/* ==================== TAB 0: TỔNG QUAN CHIẾN DỊCH ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in-50 duration-200">
            {/* Banner Định Vị & Slogan */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 p-4 sm:p-5 text-white border border-slate-800 shadow-md">
              <div className="relative z-10 space-y-1.5 sm:space-y-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider inline-block">
                  Slogan &amp; Định Vị
                </span>
                <h3 className="text-sm sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-300 leading-snug">
                  {overview.slogan}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                  {overview.positioning}
                </p>
              </div>
            </div>

            {/* Thông tin cốt lõi & Biên lợi nhuận */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  🎯 Khách Hàng Mục Tiêu
                </span>
                <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                  {overview.targetAudienceSummary}
                </p>
              </div>

              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  💰 Biên Lợi Nhuận Gộp Ước Tính
                </span>
                <p className="text-xs font-semibold text-emerald-400 leading-relaxed">
                  {overview.grossMarginEst || "Chưa cung cấp chi tiết giá vốn"}
                </p>
              </div>
            </div>

            {/* Lộ trình 3 Giai Đoạn Ra Mắt */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-2.5 sm:space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={13} className="text-emerald-400" />
                <span>Lộ Trình Triển Khai 3 Giai Đoạn</span>
              </h4>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-500/20 text-blue-400 text-[11px] sm:text-xs font-black flex items-center justify-center shrink-0 border border-blue-500/30">
                    1
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">Chuẩn bị &amp; Seeding</span>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {overview.launchPhases?.phase1 || "Chuẩn bị tài nguyên và kiểm thử listing."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-500/20 text-amber-400 text-[11px] sm:text-xs font-black flex items-center justify-center shrink-0 border border-amber-500/30">
                    2
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">Bùng Nổ Mega Deal</span>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {overview.launchPhases?.phase2 || "Đẩy mạnh traffic qua video ngắn và sàn live."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] sm:text-xs font-black flex items-center justify-center shrink-0 border border-emerald-500/30">
                    3
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">Tối Ưu &amp; Tái Mua</span>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {overview.launchPhases?.phase3 || "Tối ưu chi phí và kích hoạt kịch bản mua lại."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 1: LISTING CHUẨN SEO ==================== */}
        {activeTab === "seo" && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in-50 duration-200">
            {/* Tiêu đề Shopee */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                  🟠 Tiêu đề Shopee ({(seoListing.shopeeTitle || "").length} ký tự)
                </span>
                <CopyIconButton
                  copied={copiedId === "shopee_title"}
                  onClick={() => handleCopy("shopee_title", seoListing.shopeeTitle || "")}
                  title="Sao chép tiêu đề Shopee"
                />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800 leading-snug">
                {seoListing.shopeeTitle || "Chưa có tiêu đề Shopee"}
              </p>
            </div>

            {/* Tiêu đề TikTok */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  ⚫ Tiêu đề TikTok Shop (Kéo click)
                </span>
                <CopyIconButton
                  copied={copiedId === "tiktok_title"}
                  onClick={() => handleCopy("tiktok_title", seoListing.tiktokTitle || "")}
                  title="Sao chép tiêu đề TikTok"
                />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800 leading-snug">
                {seoListing.tiktokTitle || "Chưa có tiêu đề TikTok"}
              </p>
            </div>

            {/* 5 Bullet points */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  ✨ 5 Điểm Nổi Bật Ăn Khách
                </span>
                <CopyIconButton
                  copied={copiedId === "bullets"}
                  onClick={() => handleCopy("bullets", (seoListing.bulletPoints || []).join("\n"))}
                  title="Sao chép 5 bullet points"
                />
              </div>

              <div className="space-y-1.5">
                {(seoListing.bulletPoints || []).map((bp, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 sm:p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-slate-200 font-medium">
                    <span className="text-emerald-400 font-bold shrink-0">{i + 1}.</span>
                    <span className="leading-snug">{bp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mô tả chi tiết & Hashtag */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  📄 Đoạn Mô Tả Sản Phẩm
                </span>
                <CopyIconButton
                  copied={copiedId === "description"}
                  onClick={() => handleCopy("description", seoListing.detailedDescription)}
                  title="Sao chép đoạn mô tả"
                />
              </div>

              <pre className="font-sans text-xs text-slate-200 bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed select-text max-h-64 sm:max-h-96 overflow-y-auto custom-scrollbar">
                {seoListing.detailedDescription}
              </pre>

              {/* Hashtags */}
              <div className="pt-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                <span className="text-xs font-bold text-slate-400 mr-0.5">Tags:</span>
                {seoListing.hashtags.map((h, i) => (
                  <span key={i} className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: 3 KỊCH BẢN VIDEO NGẮN ==================== */}
        {activeTab === "video" && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in-50 duration-200">
            {/* Bộ chọn kịch bản (gọn gàng trên mobile) */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {videoScripts.map((vs, idx) => (
                <button
                  key={vs.id || idx}
                  type="button"
                  onClick={() => setActiveVideoIdx(idx)}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    activeVideoIdx === idx
                      ? "bg-emerald-600 text-white shadow-xs border border-emerald-500"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <span>Kịch bản #{idx + 1}</span>
                  <span className="text-[10px] opacity-80 hidden sm:inline">({vs.angle.split("(")[0]})</span>
                </button>
              ))}
            </div>

            {/* Chi tiết kịch bản đang chọn */}
            {(() => {
              const currentVideo = videoScripts[activeVideoIdx] || videoScripts[0];
              if (!currentVideo) return null;
              const scenes = Array.isArray(currentVideo.scenes) ? currentVideo.scenes : [];

              return (
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-block">
                          {currentVideo.angle || "Góc Thực Chiến"} · {currentVideo.estimatedDuration || "30-45s"}
                        </span>
                        <h3 className="text-xs sm:text-sm font-black text-white mt-1 truncate">
                          {currentVideo.title || "Kịch bản video"}
                        </h3>
                      </div>

                      <CopyIconButton
                        copied={copiedId === `video_${activeVideoIdx}`}
                        onClick={() => {
                          const text = `KỊCH BẢN: ${currentVideo.title || ""}\nHook 3s: ${currentVideo.hook3s || ""}\n\n` +
                            scenes.map(s => `[${s.time || ""}]\n- Góc máy: ${s.visual || ""}\n- Lời thoại: ${s.voiceover || ""}\n- Chữ màn hình: ${s.textOverlay || ""}`).join("\n\n") +
                            `\n\nCTA: ${currentVideo.callToAction || ""}`;
                          handleCopy(`video_${activeVideoIdx}`, text);
                        }}
                        title="Sao chép kịch bản video"
                      />
                    </div>

                    {/* Hook 3s Highlight */}
                    <div className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                      <span className="text-[10px] font-bold text-amber-400 block uppercase">
                        ⚡ Hook giữ chân 3 giây đầu
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-amber-200 mt-0.5 leading-snug">
                        &ldquo;{currentVideo.hook3s || ""}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Bảng phân cảnh video (Tối ưu dạng thẻ phẳng trên Mobile) */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      🎬 Chi Tiết Từng Phân Cảnh
                    </h4>

                    <div className="space-y-2">
                      {scenes.map((scene, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3 rounded-xl bg-[#0e1526]/90 border border-slate-800 space-y-1.5 shadow-xs"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
                              ⏱️ {scene.time || `Cảnh ${sIdx + 1}`}
                            </span>
                            <span className="text-slate-400 font-medium text-[10px]">
                              Cảnh {sIdx + 1}
                            </span>
                          </div>

                          {/* Trên mobile hiển thị liền mạch không bị lồng quá nhiều khung viền */}
                          <div className="space-y-1 text-xs pt-0.5">
                            <div className="text-slate-300 leading-snug">
                              <span className="text-[10px] text-slate-400 font-bold mr-1">📹 Góc máy:</span>
                              {scene.visual || ""}
                            </div>

                            <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-white font-medium leading-snug">
                              <span className="text-[10px] text-emerald-400 font-bold block mb-0.5">🗣️ Lời thoại:</span>
                              {scene.voiceover || ""}
                            </div>

                            <div className="text-[11px] text-amber-300 font-medium">
                              <span className="text-[10px] text-amber-400/80 mr-1">🔤 Chữ in:</span>
                              {scene.textOverlay || ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Call to action */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center justify-between">
                      <span>👉 Kêu gọi: {currentVideo.callToAction || ""}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================== TAB 3: BỘ 3 MẪU BÀI ADS ==================== */}
        {activeTab === "ads" && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in-50 duration-200">
            {(adCopies || []).map((ad, idx) => (
              <div
                key={ad.id || idx}
                className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 inline-block">
                      Mẫu Ads #{idx + 1} · {ad.angleName || "Góc Thực Chiến"}
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-white mt-1 leading-snug">
                      {ad.headline || `Mẫu Quảng Cáo #${idx + 1}`}
                    </h3>
                  </div>

                  <CopyIconButton
                    copied={copiedId === `ad_${idx}`}
                    onClick={() => {
                      const text = `${ad.headline || ""}\n\n${ad.bodyText || ""}\n\n${ad.callToAction || ""}`;
                      handleCopy(`ad_${idx}`, text);
                    }}
                    title="Sao chép mẫu Ads"
                  />
                </div>

                {/* Thân bài Ads */}
                <pre className="font-sans text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed select-text">
                  {ad.bodyText || "Nội dung đang được cập nhật..."}
                </pre>

                {/* CTA & Target */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 text-xs">
                  <div className="text-emerald-400 font-bold text-[11px] sm:text-xs">
                    {ad.callToAction || "Đặt mua ngay hôm nay!"}
                  </div>
                  <div className="text-slate-400 text-[10px] sm:text-[11px]">
                    🎯 Target: {(ad.targetInterests || []).join(", ") || "Khách hàng mua sắm online"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== TAB 4: THƯ CẢM ƠN NHÉT HỘP ==================== */}
        {activeTab === "unboxing" && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in-50 duration-200">
            {/* Thiệp Cảm Ơn Mockup A6 */}
            <div className="max-w-xl mx-auto p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900 via-[#0e1526] to-slate-900 border-2 border-amber-500/30 shadow-xl space-y-3 sm:space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">💌</span>
                  <h3 className="text-xs sm:text-base font-black text-white">
                    {unboxingCard.title || "Thư Cảm Ơn Tri Ân Khách Hàng"}
                  </h3>
                </div>
                <CopyIconButton
                  copied={copiedId === "unboxing_full"}
                  onClick={() => {
                    const text = `${unboxingCard.title || ""}\n\n${unboxingCard.letterBody || ""}\n\nVoucher: ${unboxingCard.reorderVoucherCode || ""}\n\n${unboxingCard.fiveStarTip || ""}\n\n${unboxingCard.warrantyPolicy || ""}`;
                    handleCopy("unboxing_full", text);
                  }}
                  title="Sao chép toàn bộ thiệp"
                />
              </div>

              {/* Lời tri ân */}
              <div className="p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed italic text-center whitespace-pre-wrap">
                {unboxingCard.letterBody || "Cảm ơn bạn đã lựa chọn sản phẩm của chúng tôi giữa hàng vạn sự lựa chọn!"}
              </div>

              {/* Voucher Box */}
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-dashed border-amber-500/40 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 block uppercase">
                    Mã Ưu Đãi Đơn Sau
                  </span>
                  <span className="text-sm sm:text-base font-black text-white font-mono">
                    {unboxingCard.reorderVoucherCode || "AICHO15"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("voucher", unboxingCard.reorderVoucherCode || "AICHO15")}
                  className="p-1.5 sm:px-3 sm:py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  title="Sao chép mã voucher"
                  aria-label="Sao chép voucher"
                >
                  {copiedId === "voucher" ? <Check size={12} /> : <Copy size={12} />}
                  <span className="hidden sm:inline">{copiedId === "voucher" ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>

              {/* Mẹo kéo 5 sao & Hotline */}
              <div className="space-y-1.5 text-xs">
                <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold text-center text-[11px] sm:text-xs">
                  {unboxingCard.fiveStarTip || "Đánh giá 5 sao kèm hình ảnh để nhận ngay ưu đãi cho đơn hàng tiếp theo!"}
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 text-center">
                  {unboxingCard.warrantyPolicy || "Cam kết hỗ trợ đổi mới 1-1 miễn phí nếu có lỗi sản phẩm."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: CSKH & CHỐNG BOM COD ==================== */}
        {activeTab === "cod" && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in-50 duration-200">
            {/* Tin nhắn xuất kho */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  📦 1. Tin nhắn vừa xuất kho
                </span>
                <CopyIconButton
                  copied={copiedId === "sms_dispatch"}
                  onClick={() => handleCopy("sms_dispatch", antiReturnNudge.dispatchSms || "")}
                  title="Sao chép tin nhắn xuất kho"
                />
              </div>
              <p className="text-xs text-slate-200 p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800 leading-relaxed">
                {antiReturnNudge.dispatchSms || "Đơn hàng của bạn đã được xuất kho và bàn giao bưu tá thành công."}
              </p>
            </div>

            {/* Tin nhắn bưu tá đang đi giao */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  🛵 2. Tin nhắn shipper đang giao
                </span>
                <CopyIconButton
                  copied={copiedId === "sms_delivery"}
                  onClick={() => handleCopy("sms_delivery", antiReturnNudge.outForDeliverySms || "")}
                  title="Sao chép tin nhắn shipper đang giao"
                />
              </div>
              <p className="text-xs text-slate-200 p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800 leading-relaxed">
                {antiReturnNudge.outForDeliverySms || "Bưu tá đang trên đường giao hàng đến bạn hôm nay."}
              </p>
            </div>

            {/* Kịch bản giữ đơn khi khách phân vân */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1526]/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  🛡️ 3. Kịch bản giữ đơn khi khách muốn hủy
                </span>
                <CopyIconButton
                  copied={copiedId === "sms_rescue"}
                  onClick={() => handleCopy("sms_rescue", antiReturnNudge.hesitationRescue || "")}
                  title="Sao chép kịch bản giữ đơn"
                />
              </div>
              <p className="text-xs text-slate-200 p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800 leading-relaxed">
                {antiReturnNudge.hesitationRescue || "Shop luôn hỗ trợ đổi trả 1-1 miễn phí để bạn hoàn toàn yên tâm trải nghiệm!"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
