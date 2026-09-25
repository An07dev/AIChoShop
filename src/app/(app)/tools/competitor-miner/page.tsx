"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Target,
  FileText,
  Shield,
  MessageSquareWarning,
  Flame,
  Award,
  HelpCircle,
  Crown,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { CompetitorMinerOutput } from "@/components/tools/CompetitorMinerOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

import {
  SAMPLE_COMPETITOR_MINER_INPUT,
  SAMPLE_COMPETITOR_MINER_RESULT,
  buildOfflineCompetitorMinerData,
} from "@/lib/competitor-miner/contract";

const CATEGORIES = [
  "Thời Trang & Phụ Kiện",
  "Mỹ Phẩm & Chăm Sóc Sắc Đẹp",
  "Gia Dụng & Đời Sống Thông Minh",
  "Phụ Kiện Điện Thoại & Công Nghệ",
  "Mẹ & Bé / Đồ Chơi Trẻ Em",
  "Thực Phẩm & Đồ Ăn Vặt",
  "Ngành hàng khác",
];

export default function CompetitorMinerPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dọn dẹp timer và abort request khi component unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Form states
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [competitorReviews, setCompetitorReviews] = useState("");
  const [shopStrength, setShopStrength] = useState("");

  const handleUseSample = () => {
    setProductName(SAMPLE_COMPETITOR_MINER_INPUT.productName);
    setCategory(SAMPLE_COMPETITOR_MINER_INPUT.category || CATEGORIES[0]);
    setCompetitorReviews(SAMPLE_COMPETITOR_MINER_INPUT.competitorReviews);
    setShopStrength(SAMPLE_COMPETITOR_MINER_INPUT.shopStrength || "");
    setResult(SAMPLE_COMPETITOR_MINER_RESULT);
    setIsOfflineMode(false);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setProductName("");
    setCategory(CATEGORIES[0]);
    setCompetitorReviews("");
    setShopStrength("");
    setResult("");
    setIsOfflineMode(false);
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("competitor-miner", false);
    if (!hasAccess) return;

    if (!productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm của shop bạn!", "Thiếu Thông Tin");
      return;
    }
    if (!competitorReviews.trim()) {
      showWarning("Vui lòng dán các đánh giá hoặc lời chê của khách về đối thủ!", "Thiếu Thông Tin");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setElapsedSeconds(0);
    setResult("");
    setMobileTab("result");

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
        showAiError({
          code: "TIMEOUT",
          error: "Yêu cầu đã quá thời gian phản hồi (120s). Vui lòng thử lại sau.",
        });
      }
    }, 120000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          tool: "competitor-miner",
          inputs: {
            productName: productName.trim(),
            category,
            competitorReviews: competitorReviews.trim(),
            shopStrength: shopStrength.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Tự động kích hoạt Offline Blueprint dự phòng khi AI 502/503/timeout
        const offlineData = buildOfflineCompetitorMinerData({
          productName: productName.trim(),
          category,
          competitorReviews: competitorReviews.trim(),
          shopStrength: shopStrength.trim(),
        });
        setResult(JSON.stringify(offlineData));
        setIsOfflineMode(true);
        showWarning(
          data?.error || "Máy chủ AI phản hồi chậm hoặc đang bảo trì (502). Đã kích hoạt Bản phân tích đối thủ dự phòng 2026!",
          "Chế Độ Dự Phòng"
        );
        return;
      }

      setResult(data.data);
      setIsOfflineMode(Boolean(data.isOfflineFallback));
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      if (error?.name === "AbortError" || controller.signal.aborted) {
        showWarning("Đã dừng quá trình xử lý theo yêu cầu của bạn.", "Đã Hủy");
        return;
      }
      // Tự động phục hồi khi mất kết nối mạng
      const offlineData = buildOfflineCompetitorMinerData({
        productName: productName.trim(),
        category,
        competitorReviews: competitorReviews.trim(),
        shopStrength: shopStrength.trim(),
      });
      setResult(JSON.stringify(offlineData));
      setIsOfflineMode(true);
      showWarning(
        "Không thể kết nối đến máy chủ AI (sự cố mạng). Đã kích hoạt Bản phân tích đối thủ dự phòng 2026!",
        "Chế Độ Dự Phòng"
      );
    } finally {
      clearTimeout(timeoutId);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto lg:flex-1 flex flex-col lg:min-h-0 lg:h-full lg:overflow-hidden pb-3">
      {/* Modals kiểm tra quyền truy cập */}
      <GateModals />

      {/* 1. Header Navigation & Quick Actions */}
      <div className="shrink-0 mb-3 space-y-2">
        {/* Mobile Top Bar: Breadcrumb + Badges */}
        <div className="md:hidden flex items-center justify-between pb-1">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
          >
            <ArrowLeft size={13} /> Kho công cụ AI
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
              <Crown size={12} className="text-amber-600 dark:text-amber-400" />
              VIP
            </span>
            <AiUsageBadge tool="competitor-miner" refreshTrigger={refreshTrigger} historyOnly />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            {/* Desktop Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/tools" className="hover:text-rose-600 transition-colors flex items-center gap-1 text-slate-500">
                <ArrowLeft size={13} /> Kho Công Cụ AI
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Chiến Lược Cạnh Tranh</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full sm:rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs shrink-0">
                <Target size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    AI Đọc Vị Đối Thủ &amp; Săn &ldquo;Tử Huyệt&rdquo; Tìm USP
                  </h1>
                  {/* Minimal icon-only reset button: ONLY ON MOBILE */}
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="md:hidden w-7 h-7 rounded-full bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer shadow-2xs active:scale-90 shrink-0"
                    title="Xóa Form / Đặt lại"
                    aria-label="Xóa Form"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider shrink-0">
                    <Crown size={11} className="text-amber-600 dark:text-amber-400" />
                    VIP TOOL
                  </span>
                </div>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Bóc tách review 1-3 sao cay đắng của đối thủ, tìm vũ khí USP độc quyền và kịch bản video dìm hàng văn minh nâng tầm sản phẩm của bạn.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="competitor-miner" refreshTrigger={refreshTrigger} />
            <button
              type="button"
              onClick={handleUseSample}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
            >
              <Sparkles size={14} /> Dữ Liệu Mẫu
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <RotateCcw size={14} /> Xóa Form
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <MobileToolTabs
        activeTab={mobileTab}
        onChangeTab={setMobileTab}
        hasResult={Boolean(result)}
        loading={loading}
        resultLabel="Vũ Khí & USP"
      />

      {/* Bố cục Form & Kết quả (Cuộn độc lập trên Desktop, Chuyển tab trên Mobile) */}
      <div className="lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-start lg:items-stretch">
        {/* Cột trái: Form nhập liệu */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col w-full lg:min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Target size={15} />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Dữ Liệu Đối Thủ &amp; Sản Phẩm
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseSample}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                  >
                    Dữ liệu mẫu
                  </button>
                  <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="hidden sm:flex text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} /> Làm mới
                  </button>
                </div>
              </div>

              {/* 1. Tên Sản Phẩm */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tên Sản Phẩm Của Shop Bạn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="VD: Kem chống nắng nâng tone kiềm dầu SPF 50+..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                />
              </div>

              {/* 2. Ngành Hàng */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ngành Hàng / Danh Mục
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Đánh Giá Chê Của Đối Thủ */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MessageSquareWarning size={14} className="text-rose-500" />
                    Review Chê / Đánh Giá 1-3 Sao Của Đối Thủ <span className="text-rose-500">*</span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">
                  Hãy vào Shopee/TikTok Shop của các top đối thủ, lọc đánh giá 1-2 sao và copy dán vào đây:
                </p>
                <textarea
                  rows={5}
                  value={competitorReviews}
                  onChange={(e) => setCompetitorReviews(e.target.value)}
                  placeholder={`VD: "Áo mỏng dính nhìn xuyên thấu, vải pha nilon mặc ngứa dã man..."
"Hộp nát bét, gãy vỡ bên trong, nhắn tin shop không thèm rep..."
"Dùng 3 hôm bị kích ứng nổi mụn tùm lum, hàng nhái chắc luôn..."`}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none font-medium"
                />
              </div>

              {/* 4. Thế Mạnh Riêng Của Shop Bạn */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Award size={14} className="text-emerald-500" />
                  Thế Mạnh / Cam Kết Vượt Trội Của Shop Bạn (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={shopStrength}
                  onChange={(e) => setShopStrength(e.target.value)}
                  placeholder="VD: Đóng hộp carton cứng 3 lớp, bảo hành 1 đổi 1 tận nhà trong 30 ngày, xưởng tự sản xuất vải sợi 100% cotton..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none font-medium"
                />
              </div>

              {/* Nút hành động */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGenerate}
                  className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                    loading
                      ? "bg-slate-700 text-slate-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 hover:shadow-rose-500/25 active:scale-[0.99]"
                  }`}
                >
                  {loading ? (
                    <>
                      <Sparkles size={16} className="animate-spin text-white" />
                      <span>Đang Săn Tử Huyệt ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <Target size={16} /> Đọc Vị Đối Thủ & Tìm USP Ngay
                    </>
                  )}
                </button>

                {loading && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3.5 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                    title="Hủy yêu cầu"
                  >
                    <XCircle size={16} />
                    <span>Hủy</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Kết quả trực quan (Chữ trắng nền đen, cuộn cả trang trên Mobile) */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col w-full lg:min-h-0 lg:h-full lg:overflow-hidden pb-20 lg:pb-0`}>
          <CompetitorMinerOutput
            result={result}
            loading={loading}
            productName={productName}
            onUseSample={handleUseSample}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
            isOfflineMode={isOfflineMode}
          />
        </div>
      </div>
    </div>
  );
}
