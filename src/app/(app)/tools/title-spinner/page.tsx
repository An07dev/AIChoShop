"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  Send,
  Crown,
  Cpu,
  ShoppingBag,
  Music2,
  Store,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { TitleSpinnerOutput } from "@/components/tools/TitleSpinnerOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";
import {
  SPINNER_PLATFORMS,
  type SpinnerPlatform,
  charCount,
  buildOfflineTitleSpinnerData,
} from "@/lib/title-spinner/contract";

const SAMPLE_TITLE =
  "Áo polo nam ngắn tay cổ bẻ vải cá sấu gai cao cấp thoáng khí co giãn 4 chiều chống nhăn";

const SAMPLE_CORE_KEYWORDS = "áo polo nam, áo thun polo có cổ";

const SAMPLE_RESULT = JSON.stringify(
  {
    titles: [
      {
        id: 1,
        strategyTag: "Đẩy Top Sàn",
        strategyName: "SEO Thuật Toán (Search Priority)",
        title: "Áo Polo Nam Ngắn Tay Cổ Bẻ Vải Cá Sấu Gai Co Giãn 4 Chiều Thoáng Khí Chống Nhăn Cao Cấp",
        highlightKeywords: ["áo polo nam", "vải cá sấu gai"],
        reason: "Đặt từ khóa hạt nhân lên đầu, tối ưu điểm chuẩn SEO sàn Shopee",
      },
      {
        id: 2,
        strategyTag: "Kéo Click CTR",
        strategyName: "Tò Mò & Flash Sale (High CTR)",
        title: "[Flash Sale] Áo Thun Polo Nam Có Cổ Cá Sấu Tổ Ong Thoáng Mát Tôn Dáng Cực Đẹp",
        highlightKeywords: ["áo thun polo nam", "Flash Sale"],
        reason: "Hook ưu đãi và tính từ cảm xúc kích thích tỷ lệ click",
      },
      {
        id: 3,
        strategyTag: "Chất Liệu & Specs",
        strategyName: "Đột Phá Thông Số (Specs Master)",
        title: "Áo Polo Nam Cổ Bẻ Cotton Cá Sấu Gai 100% Co Giãn 4 Chiều Thấm Hút Mồ Hôi Siêu Mát",
        highlightKeywords: ["cotton cá sấu gai", "co giãn 4 chiều"],
        reason: "Tập trung thông số kỹ thuật vải và công năng thấm hút",
      },
      {
        id: 4,
        strategyTag: "Đối Tượng Mục Tiêu",
        strategyName: "Khách Hàng Mục Tiêu (Persona Hook)",
        title: "Áo Phông Polo Nam Cổ Gập Phong Cách Công Sở Lịch Lãm Năng Động Trẻ Trung",
        highlightKeywords: ["phong cách công sở", "áo phông polo nam"],
        reason: "Nhắm trúng nhóm đối tượng văn phòng và sinh viên",
      },
      {
        id: 5,
        strategyTag: "Cam Kết An Tâm",
        strategyName: "Bảo Hành & Đổi Trả (Trust & Risk Reversal)",
        title: "[Chính Hãng] Áo Polo Nam Ngắn Tay Vải Cá Sấu Cao Cấp - Bao Đổi Trả 7 Ngày Tận Nhà",
        highlightKeywords: ["chính hãng", "đổi trả 7 ngày"],
        reason: "Cam kết hậu mãi an tâm, xóa bỏ rào cản mua hàng online",
      },
      {
        id: 6,
        strategyTag: "Bối Cảnh Sử Dụng",
        strategyName: "Dịp Sử Dụng & Mùa Vụ (Contextual)",
        title: "Áo Polo Nam Đi Làm Đi Chơi Đều Đẹp Vải Cá Sấu Gai Thoáng Khí Hè 2024",
        highlightKeywords: ["đi làm đi chơi", "hè 2024"],
        reason: "Gợi ý bối cảnh sử dụng thực tế đa năng",
      },
      {
        id: 7,
        strategyTag: "Độc Quyền USP",
        strategyName: "Lợi Thế Cạnh Tranh (Exclusive USP)",
        title: "Áo Polo Nam Bo Cổ Dệt Nguyên Khối Không Bai Dão Vải Cá Sấu Gai Xuất Khẩu",
        highlightKeywords: ["bo cổ dệt nguyên khối", "không bai dão"],
        reason: "Nhấn mạnh USP độc quyền bo cổ dệt bền đẹp",
      },
      {
        id: 8,
        strategyTag: "Form Dáng Chuẩn",
        strategyName: "Tôn Dáng & Thẩm Mỹ (Fit & Aesthetics)",
        title: "Áo Polo Nam Form Regular Fit Tôn Dáng Cực Đẹp Cổ Bẻ Vải Cá Sấu Dày Dặn",
        highlightKeywords: ["form Regular Fit", "tôn dáng"],
        reason: "Đánh vào nhu cầu mặc đẹp, tôn dáng cơ thể",
      },
      {
        id: 9,
        strategyTag: "Giá Xưởng Tốt",
        strategyName: "Tối Ưu Chi Phí (Value & Economy)",
        title: "[Giá Xưởng Tận Gốc] Áo Polo Nam Ngắn Tay Basic Vải Cá Sấu Bền Màu Chuẩn Form",
        highlightKeywords: ["giá xưởng tận gốc", "basic"],
        reason: "Đánh vào tâm lý mua hàng chất lượng với giá xưởng",
      },
      {
        id: 10,
        strategyTag: "Chốt Đơn Master",
        strategyName: "Toàn Diện & Chốt Đơn (Conversion King)",
        title: "Áo Polo Nam Cổ Bẻ Cao Cấp Vải Cá Sấu Gai Co Giãn Thoáng Khí Bảo Hành 1 Đổi 1",
        highlightKeywords: ["áo polo nam", "bảo hành 1 đổi 1"],
        reason: "Tổng hòa cân bằng từ khóa hạt nhân, công năng và cam kết dịch vụ",
      },
    ],
    recommendation:
      "Đã tạo thành công 10 biến thể tiêu đề chuẩn thuật toán Shopee. Đề xuất sử dụng Tiêu đề #01 cho gian hàng chính và Tiêu đề #02, #07 cho các shop vệ tinh để đạt tỷ lệ độc bản chống quét cao nhất.",
  },
  null,
  2
);

const QUICK_TAGS = [
  "Chính hãng",
  "Freeship Extra",
  "Cao cấp",
  "Giá xưởng",
  "Bảo hành 1 đổi 1",
  "Sẵn hàng",
  "Chuẩn form",
];

export default function TitleSpinnerPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [platform, setPlatform] = useState<SpinnerPlatform>("shopee");
  const [originalTitle, setOriginalTitle] = useState("");
  const [coreKeywords, setCoreKeywords] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [userQuota, setUserQuota] = useState<{
    isLogged: boolean;
    isVIP: boolean;
    remainingFree: number | null;
    dailyFreeLimit: number;
  } | null>(null);

  const activeConfig = SPINNER_PLATFORMS[platform] || SPINNER_PLATFORMS.shopee;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    fetch("/api/ai/usage")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.dailyFreeLimit !== "undefined") {
          setUserQuota({
            isLogged: !!data.isLogged,
            isVIP: !!data.isVIP,
            remainingFree: data.remainingFree,
            dailyFreeLimit: data.dailyFreeLimit || 12,
          });
        }
      })
      .catch(() => { });
  }, [refreshTrigger]);

  const handleUseSample = () => {
    setPlatform("shopee");
    setOriginalTitle(SAMPLE_TITLE);
    setCoreKeywords(SAMPLE_CORE_KEYWORDS);
    setResult(SAMPLE_RESULT);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setOriginalTitle("");
    setCoreKeywords("");
    setResult("");
  };

  const handleAddTag = (tag: string) => {
    if (originalTitle.includes(tag)) return;
    const newTitle = originalTitle.trim() ? `[${tag}] ${originalTitle.trim()}` : `[${tag}]`;
    setOriginalTitle(newTitle);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("title-spinner", false);
    if (!hasAccess) return;

    if (!originalTitle.trim()) {
      showWarning("Vui lòng nhập tiêu đề sản phẩm gốc!", "Thiếu Thông Tin");
      return;
    }

    if (originalTitle.trim().length < 10) {
      showWarning("Tiêu đề sản phẩm quá ngắn, vui lòng nhập ít nhất 10 ký tự.", "Tiêu Đề Ngắn");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setResult("");
    setMobileTab("result");
    setElapsedSeconds(0);

    // Bắt đầu bộ đếm thời gian thực
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Timeout an toàn 120 giây
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
        showAiError({
          code: "TIMEOUT",
          error: "Yêu cầu đã quá thời gian phản hồi (120s). Vui lòng thử lại hoặc giảm bớt độ dài nội dung.",
        });
      }
    }, 120000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          tool: "title-spinner",
          inputs: {
            platform,
            originalTitle: originalTitle.trim(),
            coreKeywords: coreKeywords.trim() || undefined,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        if (data.code === "REQUEST_ABORTED") {
          showWarning("Đã hủy nhân bản tiêu đề theo yêu cầu của bạn.", "Đã Hủy");
          return;
        }
        // Tự động kích hoạt Offline Blueprint dự phòng khi AI 502/503/timeout
        const offlineData = buildOfflineTitleSpinnerData({
          platform,
          originalTitle: originalTitle.trim(),
          coreKeywords: coreKeywords.trim() || undefined,
        });
        setResult(JSON.stringify(offlineData));
        showWarning(
          data?.error || "Máy chủ AI phản hồi chậm hoặc đang bảo trì (502). Đã kích hoạt Bộ 10 Tiêu Đề Dự Phòng 2026!",
          "Chế Độ Dự Phòng"
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || controller.signal.aborted) {
        showWarning("Đã dừng quá trình nhân bản tiêu đề.", "Đã Hủy");
        return;
      }
      // Tự động phục hồi khi mất kết nối mạng
      const offlineData = buildOfflineTitleSpinnerData({
        platform,
        originalTitle: originalTitle.trim(),
        coreKeywords: coreKeywords.trim() || undefined,
      });
      setResult(JSON.stringify(offlineData));
      showWarning(
        "Không thể kết nối đến máy chủ AI (sự cố mạng). Đã kích hoạt Bộ 10 Tiêu Đề Dự Phòng 2026!",
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
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
      <GateModals />

      {/* Header & Breadcrumb */}
      <div className="shrink-0 pb-3 space-y-2 sm:space-y-3">
        {/* Mobile top bar: Breadcrumb + VIP badge + Lịch sử */}
        <div className="flex items-center justify-between gap-2 md:hidden">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand transition-colors"
          >
            <ArrowLeft size={13} /> Kho công cụ AI
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs uppercase tracking-wider">
              <Crown size={10} className="text-amber-600 dark:text-amber-400" />
              VIP
            </span>
            <AiUsageBadge tool="title-spinner" refreshTrigger={refreshTrigger} historyOnly />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            {/* Desktop Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/tools" className="hover:text-teal-600 transition-colors flex items-center gap-1 text-slate-500">
                <ArrowLeft size={13} /> Kho Công Cụ AI
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Nhân Bản Sản Phẩm</span>
            </div>

            {/* Title Row */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/80 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-xs shrink-0">
                <Cpu size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    AI Nhân Bản Chống Spam
                  </h1>
                  {/* Minimal icon-only reset button: ONLY ON MOBILE */}
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all cursor-pointer shadow-2xs active:scale-90"
                    title="Xóa Form / Đặt lại"
                    aria-label="Xóa Form"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider shrink-0">
                    <Crown size={11} className="text-amber-600 dark:text-amber-400" />
                    VIP TOOL
                  </span>
                </div>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Nhân bản 10 biến thể tiêu đề theo 10 chiến lược phễu, đảo cấu trúc ngữ pháp thông minh chống thuật toán sàn phạt spam.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="title-spinner" refreshTrigger={refreshTrigger} />
            <button
              type="button"
              onClick={handleUseSample}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 text-xs font-bold hover:bg-teal-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
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
        resultLabel="10 Tiêu Đề Spin"
      />

      {/* Grid 2 Cột: Cuộn độc lập trên Desktop, Chuyển tab trên Mobile */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div
          className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"
            } lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}
        >
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* 1. Bộ chọn Sàn TMĐT mục tiêu */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sàn Thương Mại Điện Tử Mục Tiêu <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlatform("shopee")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${platform === "shopee"
                        ? "bg-amber-500/10 border-amber-500/50 text-amber-500 dark:text-amber-400 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <ShoppingBag size={14} className="shrink-0" />
                      <span>Shopee</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Tối đa 120 ký tự
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlatform("tiktok")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${platform === "tiktok"
                        ? "bg-rose-500/10 border-rose-500/50 text-rose-500 dark:text-rose-400 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Music2 size={14} className="shrink-0" />
                      <span>TikTok Shop</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Tối đa 79 ký tự
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlatform("lazada")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${platform === "lazada"
                        ? "bg-blue-500/10 border-blue-500/50 text-blue-500 dark:text-blue-400 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Store size={14} className="shrink-0" />
                      <span>Lazada</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Tối đa 120 ký tự
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Tiêu đề sản phẩm gốc */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tiêu Đề Sản Phẩm Gốc <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {charCount(originalTitle)}/{activeConfig.maxChars} ký tự
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={originalTitle}
                  onChange={(e) => setOriginalTitle(e.target.value)}
                  placeholder="Dán tiêu đề sản phẩm gốc vào đây...&#10;VD: Áo polo nam ngắn tay cổ bẻ vải cá sấu gai cao cấp thoáng khí co giãn 4 chiều chống nhăn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all resize-none leading-relaxed"
                />
              </div>

              {/* 3. Từ khóa hạt nhân bắt buộc giữ nguyên */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Từ Khóa Hạt Nhân Bắt Buộc Giữ Nguyên{" "}
                    <span className="text-[10px] font-normal text-slate-400">(Tùy chọn)</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={coreKeywords}
                  onChange={(e) => setCoreKeywords(e.target.value)}
                  placeholder="VD: áo polo nam, áo thun polo có cổ..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  🔒 AI sẽ cố định các cụm từ khóa này trong toàn bộ 10 tiêu đề để không làm mất thứ hạng SEO.
                </p>
              </div>

              {/* Gợi ý chèn từ kích thích mua */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Gợi ý thêm từ kích thích mua hàng:
                  </span>
                  {originalTitle && (
                    <button
                      type="button"
                      onClick={() => setOriginalTitle("")}
                      className="text-slate-400 hover:text-rose-500 transition-colors text-[11px] cursor-pointer"
                    >
                      Xóa text
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-950/50 text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer active:scale-95"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Thẻ tóm tắt tính năng */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-xl border border-teal-200/70 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-300">
                    <Layers size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
                    10 Biến Thể
                  </div>
                  <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80 mt-0.5">
                    10 Chiến lược phễu
                  </p>
                </div>
                <div className="p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    <ShieldCheck
                      size={13}
                      className="text-emerald-600 dark:text-emerald-400 shrink-0"
                    />
                    Chống Quét
                  </div>
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                    Độc bản &ge;80%
                  </p>
                </div>
                <div className="p-2.5 rounded-xl border border-cyan-200/70 dark:border-cyan-900/40 bg-cyan-50/40 dark:bg-cyan-950/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900 dark:text-cyan-300">
                    <FileSpreadsheet
                      size={13}
                      className="text-cyan-600 dark:text-cyan-400 shrink-0"
                    />
                    Xuất Excel
                  </div>
                  <p className="text-[10px] text-cyan-700/80 dark:text-cyan-400/80 mt-0.5">
                    File .xlsx sẵn sàng
                  </p>
                </div>
              </div>

              {/* Nút Submit trong Form & Hủy yêu cầu */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:via-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Sparkles size={16} className="animate-spin" /> Đang Xào Nấu 10 Tiêu Đề ({elapsedSeconds}s)...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Nhân Bản Bằng AI (10 Biến Thể)
                    </>
                  )}
                </button>

                {loading && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/60 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                  >
                    <XCircle size={14} className="text-rose-400" /> Hủy Quá Trình Tạo
                  </button>
                )}
              </div>

              {/* Thông tin quota tài khoản */}
              <p aria-live="polite" className="text-[10px] text-center text-slate-400">
                {userQuota?.isLogged ? (
                  userQuota.isVIP ? (
                    <span className="text-amber-500 font-bold flex items-center justify-center gap-1">
                      <span>👑</span> VIP · Không giới hạn
                    </span>
                  ) : (
                    <span>
                      ⚡ Còn{" "}
                      <strong
                        className={
                          userQuota.remainingFree === 0 ? "text-rose-500" : "text-emerald-500"
                        }
                      >
                        {userQuota.remainingFree ?? 0}
                      </strong>
                      /{userQuota.dailyFreeLimit} lượt hôm nay ·{" "}
                      <Link
                        href="/profile#pricing-section"
                        className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
                      >
                        Nâng cấp VIP
                      </Link>
                    </span>
                  )
                ) : (
                  <span>Tài khoản miễn phí được cấp lượt dùng mỗi ngày.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ NHÂN BẢN */}
        <div
          className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"
            } lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden pb-16 lg:pb-0`}
        >
          <TitleSpinnerOutput
            result={result}
            loading={loading}
            originalTitle={originalTitle}
            platform={platform}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
            onUseSample={handleUseSample}
          />
        </div>
      </div>

      {/* Mobile Floating Sticky Action Bar (chỉ hiện khi ở tab form trên mobile) */}
      {mobileTab === "form" && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 lg:hidden shadow-lg space-y-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:via-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Sparkles size={16} className="animate-spin" /> Đang Xào Nấu 10 Tiêu Đề ({elapsedSeconds}s)...
              </>
            ) : (
              <>
                <Send size={16} /> Nhân Bản Bằng AI (10 Biến Thể)
              </>
            )}
          </button>

          {loading && (
            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 text-rose-400 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <XCircle size={14} /> Hủy Yêu Cầu
            </button>
          )}
        </div>
      )}
    </div>
  );
}
