"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  Hash,
  Clock,
  Send,
  Megaphone,
  XCircle,
} from "lucide-react";
import { useToolGate } from "@/hooks/useToolGate";
import { AuthModal } from "@/components/auth/AuthModal";
import { SeoOptimizerOutput } from "@/components/tools/SeoOptimizerOutput";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";
import { useToast } from "@/context/ToastContext";
import {
  SEO_LIMITS,
  charCount,
  parseSeoResult,
  validateSeoInputs,
  type SeoInputs,
  type SeoResult,
  type SeoSnapshot,
} from "@/lib/seo/contract";

const EMPTY: SeoInputs = {
  platform: "shopee",
  productName: "",
  usp: "",
  brand: "",
  specs: "",
  audience: "",
  keywords: "",
  policies: "",
};

const SAMPLE_DATA: SeoInputs = {
  platform: "shopee",
  productName: "Áo polo nam ngắn tay cổ bẻ vải cá sấu gai cao cấp",
  usp: "Chất liệu cotton cá sấu gai tổ ong 100% tự nhiên, co giãn 4 chiều, thấm hút mồ hôi vượt trội, bo cổ dệt nguyên khối không bai dão sau khi giặt máy",
  brand: "No Brand",
  specs: "Size M (50-60kg), L (60-70kg), XL (70-80kg), XXL (80-90kg). Bảng 5 màu: Đen, Trắng, Xanh Navy, Ghi xám, Be",
  audience: "Nam thanh niên, nhân viên văn phòng, sinh viên yêu thích phong cách lịch lãm, năng động",
  keywords: "áo polo nam, áo thun có cổ, áo phông nam cá sấu, áo polo basic",
  policies: "Hỗ trợ đổi trả miễn phí trong 7 ngày nếu không vừa size, được kiểm tra hàng trước khi thanh toán",
};

const SAMPLE_OUTPUT: SeoResult = {
  seoScore: {
    score: 98,
    grade: "XUẤT SẮC",
    checklist: [
      { item: "Từ khóa chính 'áo polo nam' nằm trọn trong 40 ký tự đầu", passed: true },
      { item: "Độ dài tiêu đề đạt chuẩn thuật toán Shopee (100 - 120 ký tự)", passed: true },
      { item: "Mô tả AIDA đầy đủ 4 tầng chuyển đổi (Hook -> USP -> Size -> Cam kết)", passed: true },
      { item: "Kiểm duyệt an toàn 100%: Không chứa từ cấm sàn", passed: true },
    ],
    safetyPassed: true,
  },
  titles: [
    "Áo polo nam ngắn tay cổ bẻ vải cá sấu gai cao cấp cotton 100% co giãn 4 chiều",
    "🔥 Áo polo nam công sở lịch lãm chất cá sấu gai tổ ong thấm hút mồ hôi bo cổ bền đẹp",
    "Áo thun có cổ nam basic phong cách trẻ trung năng động vải cá sấu không bai dão",
    "Áo phông nam cổ bẻ cao cấp form chuẩn size M đến XXL tôn dáng nam tính",
    "Áo polo nam ngắn tay vải cotton cá sấu gai co giãn 4 chiều mềm mát chính hãng",
  ],
  richTitles: [
    {
      id: 1,
      style: "SEO Thuật Toán (Search-Driven)",
      tag: "Đẩy Top Sàn",
      title: "Áo polo nam ngắn tay cổ bẻ vải cá sấu gai cao cấp cotton 100% co giãn 4 chiều",
      charCount: "Áo polo nam ngắn tay cổ bẻ vải cá sấu gai cao cấp cotton 100% co giãn 4 chiều".length,
      hookKeywords: "áo polo nam, cá sấu gai",
      targetAudience: "Khách gõ tìm kiếm tự nhiên trên sàn",
    },
    {
      id: 2,
      style: "Kéo Click CTR (Impulse/Curiosity)",
      tag: "Tăng CTR",
      title: "🔥 Áo polo nam công sở lịch lãm chất cá sấu gai tổ ong thấm hút mồ hôi bo cổ bền đẹp",
      charCount: "🔥 Áo polo nam công sở lịch lãm chất cá sấu gai tổ ong thấm hút mồ hôi bo cổ bền đẹp".length,
      hookKeywords: "áo polo nam công sở lịch lãm",
      targetAudience: "Khách lướt feed, mua theo cảm xúc & deal hời",
    },
    {
      id: 3,
      style: "Đấu Thầu Quảng Cáo (High Ads Quality)",
      tag: "Chuẩn Ads",
      title: "Áo thun có cổ nam basic phong cách trẻ trung năng động vải cá sấu không bai dão",
      charCount: "Áo thun có cổ nam basic phong cách trẻ trung năng động vải cá sấu không bai dão".length,
      hookKeywords: "áo thun có cổ nam basic",
      targetAudience: "Khách tìm kiếm từ khóa ngách chạy Ads",
    },
    {
      id: 4,
      style: "Đột Phá USP (Lợi Thế Độc Quyền)",
      tag: "Độc Quyền",
      title: "Áo phông nam cổ bẻ cao cấp form chuẩn size M đến XXL tôn dáng nam tính",
      charCount: "Áo phông nam cổ bẻ cao cấp form chuẩn size M đến XXL tôn dáng nam tính".length,
      hookKeywords: "form chuẩn tôn dáng nam tính",
      targetAudience: "Khách quan tâm form dáng & chất lượng vải",
    },
    {
      id: 5,
      style: "Toàn Diện & Chốt Đơn (Conversion Master)",
      tag: "Chốt Đơn",
      title: "Áo polo nam ngắn tay vải cotton cá sấu gai co giãn 4 chiều mềm mát chính hãng",
      charCount: "Áo polo nam ngắn tay vải cotton cá sấu gai co giãn 4 chiều mềm mát chính hãng".length,
      hookKeywords: "cotton cá sấu co giãn 4 chiều chính hãng",
      targetAudience: "Khách xem xét kỹ thông số trước khi bấm mua",
    },
  ],
  descriptionAida: {
    attentionHook: "Bạn đang tìm kiếm một chiếc áo polo nam lịch lãm, vừa vặn tôn dáng nhưng vẫn thoáng mát tuyệt đối suốt ngày dài làm việc?",
    uspStory: "Chất liệu cotton cá sấu gai tổ ong 100% tự nhiên dệt dày dặn, co giãn 4 chiều linh hoạt và thấm hút mồ hôi vượt trội. Điểm nhấn bo cổ dệt nguyên khối cao cấp không bao giờ bị bai dão hay cong vênh sau nhiều lần giặt máy.",
    featureBullets: [
      { feature: "Vải cá sấu gai tổ ong cao cấp", benefit: "Mềm mát, thoáng khí tối đa, không xù lông" },
      { feature: "Form Regular Fit hiện đại", benefit: "Tôn dáng nam tính, che khuyết điểm bụng cực tốt" },
      { feature: "Đường may 4 kim tinh xảo", benefit: "Độ bền vượt bậc, giữ phom áo nguyên bản dài lâu" },
    ],
    sizeAndSpecs: [
      "Size M: 50 - 60kg (Chiều cao 1m60 - 1m68)",
      "Size L: 60 - 70kg (Chiều cao 1m68 - 1m75)",
      "Size XL: 70 - 80kg (Chiều cao 1m75 - 1m80)",
      "Size XXL: 80 - 90kg (Chiều cao 1m80 - 1m85)",
    ],
    commitments: [
      "Cam kết 100% hình ảnh thực tế và chất lượng chuẩn như mô tả",
      "Hỗ trợ đổi size miễn phí tận nhà trong 7 ngày nếu không vừa",
      "Khách hàng được đồng kiểm tra hàng thoải mái trước khi thanh toán",
    ],
    ctaCloser: "👉 BẤM [MUA NGAY] ĐỂ NHẬN VOUCHER GIẢM GIÁ VÀ QUÀ TẶNG BẢO HÀNH ĐẶC BIỆT HÔM NAY!",
  },
  descriptions: [
    {
      title: "✨ ĐIỂM NHẤN ĐẶC QUYỀN (USP)",
      content:
        "Chất liệu cotton cá sấu gai tổ ong 100% tự nhiên, co giãn 4 chiều linh hoạt, thấm hút mồ hôi vượt trội giữ cơ thể luôn khô thoáng suốt ngày dài. Bo cổ dệt nguyên khối cao cấp không bai dão hay mất form sau nhiều lần giặt máy.",
    },
    {
      title: "💎 THIẾT KẾ & TÍNH NĂNG NỔI BẬT",
      content:
        "Form áo Regular Fit tôn dáng hiện đại, đường may tỉ mỉ 4 kim sắc nét. Phù hợp cả khi đi làm văn phòng, gặp gỡ đối tác hay đi chơi, dạo phố cuối tuần.",
    },
    {
      title: "📏 BẢNG QUY ĐỔI KÍCH CỠ CHUẨN",
      content:
        "• Size M: 50 - 60kg (1m60 - 1m68)\n• Size L: 60 - 70kg (1m68 - 1m75)\n• Size XL: 70 - 80kg (1m75 - 1m80)\n• Size XXL: 80 - 90kg (1m80 - 1m85)",
    },
    {
      title: "🛡️ CHÍNH SÁCH BÁN HÀNG & BẢO HÀNH",
      content:
        "Hỗ trợ đổi trả miễn phí trong 7 ngày nếu không vừa size hoặc lỗi từ nhà sản xuất. Khách hàng được đồng kiểm tra hàng trước khi nhận.",
    },
  ],
  keywordMatrix: {
    coreKeywords: ["áo polo nam", "áo thun có cổ", "áo phông nam cổ bẻ"],
    longtailKeywords: ["áo polo nam vải cá sấu gai", "áo polo nam co giãn 4 chiều", "áo polo nam công sở lịch lãm"],
    hashtags: [
      "#aopolonam",
      "#aothuncoco",
      "#aophongnam",
      "#aopolocasau",
      "#aopolobasic",
      "#thoitrangnam",
      "#aopolocongso",
      "#aonamngantay",
      "#aocobe",
      "#aopolocaocap",
    ],
  },
  hashtags: [
    "#aopolonam",
    "#aothuncoco",
    "#aophongnam",
    "#aopolocasau",
    "#aopolobasic",
    "#thoitrangnam",
    "#aopolocongso",
    "#aonamngantay",
    "#aocobe",
    "#aopolocaocap",
  ],
};

const USP_TAGS = [
  "Chất liệu cotton",
  "Co giãn 4 chiều",
  "Thấm hút mồ hôi",
  "Không bai dão",
  "Thiết kế nhỏ gọn",
  "Dễ vệ sinh",
  "Nhiều kích thước",
  "Dễ phối đồ",
];

export default function SeoOptimizerPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning, showSuccess } = useToast();

  const [inputs, setInputs] = useState<SeoInputs>({ ...EMPTY });
  const [snapshot, setSnapshot] = useState<SeoSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const [userQuota, setUserQuota] = useState<{
    isLogged: boolean;
    isVIP: boolean;
    remainingFree: number | null;
    dailyFreeLimit: number;
  } | null>(null);

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
    setInputs({ ...SAMPLE_DATA });
    setSnapshot({
      inputs: { ...SAMPLE_DATA },
      output: SAMPLE_OUTPUT,
    });
    setMobileTab("result");
  };

  const handleResetForm = () => {
    abortRef.current?.abort();
    setInputs({ ...EMPTY });
    setSnapshot(null);
  };

  const handleRestoreFromHistory = (savedOutput: string) => {
    try {
      const parsed = parseSeoResult(savedOutput, inputs.platform, inputs);
      setSnapshot({
        inputs: { ...inputs },
        output: parsed,
      });
      setMobileTab("result");
      showSuccess("Đã tải lại kết quả SEO từ lịch sử!");
    } catch {
      // ignore
    }
  };

  const handleAddUspTag = (tag: string) => {
    if (inputs.usp.includes(tag)) return;
    const newUsp = inputs.usp.trim() ? `${inputs.usp.trim()}, ${tag}` : tag;
    if (charCount(newUsp) <= SEO_LIMITS.usp) {
      setInputs((prev) => ({ ...prev, usp: newUsp }));
    }
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("seo-optimizer", false);
    if (!hasAccess) return;

    if (!inputs.productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm gốc!", "Thiếu Thông Tin");
      return;
    }
    if (!inputs.usp.trim()) {
      showWarning("Vui lòng nhập điểm nổi bật (USP) của sản phẩm!", "Thiếu Thông Tin");
      return;
    }

    try {
      validateSeoInputs(inputs);
    } catch (e: any) {
      showWarning(e.message || "Dữ liệu nhập vào chưa hợp lệ", "Kiểm Tra Lại");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setMobileTab("result");
    setElapsedSeconds(0);

    // Bộ đếm thời gian thực
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Timeout bảo vệ tối đa 60 giây
    const timeoutId = setTimeout(() => {
      if (abortRef.current === controller) {
        controller.abort();
        showAiError({
          code: "TIMEOUT",
          error: "Yêu cầu đã quá thời gian phản hồi (120s). Vui lòng thử lại hoặc giảm bớt độ dài nội dung.",
        });
      }
    }, 120000);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          tool: "seo-optimizer",
          inputs: {
            platform: inputs.platform,
            productName: inputs.productName.trim(),
            usp: inputs.usp.trim(),
            brand: inputs.brand.trim() || undefined,
            specs: inputs.specs.trim() || undefined,
            audience: inputs.audience.trim() || undefined,
            keywords: inputs.keywords.trim() || undefined,
            policies: inputs.policies.trim() || undefined,
          },
        }),
      });

      let json: any;
      try {
        const text = await res.text();
        try {
          json = JSON.parse(text);
        } catch {
          json = {
            success: false,
            code: res.status === 504 ? "TIMEOUT" : "SERVER_ERROR",
            error:
              res.status === 504
                ? "Dịch vụ AI đang xử lý quá lâu hoặc hết hạn mức chờ (504 Gateway Timeout). Lượt dùng chưa bị trừ, vui lòng thử lại."
                : `Máy chủ tạm thời bận hoặc phản hồi mã lỗi ${res.status}. Vui lòng thử lại sau ít phút.`,
          };
        }
      } catch {
        json = {
          success: false,
          code: "NETWORK_ERROR",
          error: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.",
        };
      }

      if (!res.ok || !json.success) {
        if (json.code === "REQUEST_ABORTED") {
          showWarning("Đã hủy tối ưu SEO theo yêu cầu của bạn.", "Đã Hủy");
          return;
        }
        showAiError(json);
        if (json.loginRequired) {
          setLoginOpen(true);
        }
        return;
      }

      const parsed = parseSeoResult(json.data, inputs.platform, inputs);
      setSnapshot({
        inputs: { ...inputs },
        output: parsed,
      });
      setRefreshTrigger((prev) => prev + 1);

      if (typeof json.remaining === "number") {
        setRemaining(json.remaining);
      }
    } catch (cause: any) {
      if (cause?.name === "AbortError" || controller.signal.aborted) {
        showWarning("Đã dừng quá trình tối ưu SEO.", "Đã Hủy");
        return;
      }
      showAiError(
        cause instanceof Error
          ? { code: "SERVER_ERROR", error: cause.message }
          : { code: "NETWORK_ERROR", error: "Không thể kết nối máy chủ. Vui lòng thử lại sau." }
      );
    } finally {
      clearTimeout(timeoutId);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      abortRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto w-full flex flex-col lg:flex-1 lg:min-h-0 lg:h-full lg:overflow-hidden">
      {/* Modals chặn quyền & đăng nhập */}
      <GateModals />
      <AuthModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} initialTab="login" />

      {/* Header & Breadcrumb */}
      <div className="shrink-0 pb-3 space-y-2 sm:space-y-3">
        {/* Mobile top bar: Breadcrumb + FREE badge + Lịch sử */}
        <div className="flex items-center justify-between gap-2 md:hidden">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand transition-colors"
          >
            <ArrowLeft size={13} /> Kho công cụ AI
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs uppercase tracking-wider">
              <Sparkles size={10} className="text-emerald-600 dark:text-emerald-400" />
              FREE
            </span>
            <AiUsageBadge
              tool="seo-optimizer"
              refreshTrigger={refreshTrigger}
              onSelectOutput={handleRestoreFromHistory}
              historyOnly
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            {/* Desktop Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/tools" className="hover:text-emerald-600 transition-colors flex items-center gap-1 text-slate-500">
                <ArrowLeft size={13} /> Kho Công Cụ AI
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Tối Ưu SEO &amp; Đăng Bán</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs shrink-0">
                <Megaphone size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    AI Tối Ưu SEO Sản Phẩm
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
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs uppercase tracking-wider shrink-0">
                    <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400" />
                    FREE TOOL
                  </span>
                </div>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Tạo 5 biến thể tiêu đề giật tít chuẩn thuật toán, dàn ý mô tả kích thích mua hàng và bộ 10 hashtag đẩy xu hướng.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved exactly as original) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge
              tool="seo-optimizer"
              refreshTrigger={refreshTrigger}
              onSelectOutput={handleRestoreFromHistory}
            />
            <button
              type="button"
              onClick={handleUseSample}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
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
        hasResult={Boolean(snapshot)}
        loading={loading}
        resultLabel="Tiêu Đề & Listing"
      />

      {/* Grid 2 Cột: Cuộn tự nhiên cả trang trên Mobile, Cuộn độc lập trên Desktop */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:flex-1 lg:min-h-0 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col w-full lg:min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="w-full lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* 1. SÀN THƯƠNG MẠI ĐIỆN TỬ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Sàn Thương Mại Điện Tử <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInputs((prev) => ({ ...prev, platform: "shopee" }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${inputs.platform === "shopee"
                      ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <span className="text-base">🛒</span>
                    <div className="text-left">
                      <div className="font-bold leading-tight">Shopee</div>
                      <div className="text-[10px] font-normal opacity-80">Tiêu đề ≤ 120 ký tự</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputs((prev) => ({ ...prev, platform: "tiktok" }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${inputs.platform === "tiktok"
                      ? "bg-slate-100 dark:bg-slate-800 border-slate-600 text-slate-900 dark:text-white shadow-xs"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <span className="text-base">🎵</span>
                    <div className="text-left">
                      <div className="font-bold leading-tight">TikTok Shop</div>
                      <div className="text-[10px] font-normal opacity-80">Tiêu đề ≤ 79 ký tự</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3 Thẻ tóm tắt tính năng */}


              {/* 2. TÊN SẢN PHẨM */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tên Sản Phẩm Gốc <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {charCount(inputs.productName)}/{SEO_LIMITS.productName}
                  </span>
                </div>
                <input
                  type="text"
                  value={inputs.productName}
                  onChange={(e) => setInputs((prev) => ({ ...prev, productName: e.target.value }))}
                  placeholder="VD: Áo polo nam ngắn tay cổ bẻ vải cá sấu gai cao cấp"
                  maxLength={SEO_LIMITS.productName}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* 3. THƯƠNG HIỆU & TỪ KHÓA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Thương Hiệu
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {charCount(inputs.brand)}/{SEO_LIMITS.brand}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={inputs.brand}
                    onChange={(e) => setInputs((prev) => ({ ...prev, brand: e.target.value }))}
                    placeholder="VD: OEM hoặc No Brand"
                    maxLength={SEO_LIMITS.brand}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Từ Khóa Đẩy Top
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {charCount(inputs.keywords)}/{SEO_LIMITS.keywords}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={inputs.keywords}
                    onChange={(e) => setInputs((prev) => ({ ...prev, keywords: e.target.value }))}
                    placeholder="VD: áo polo nam, áo thun có cổ"
                    maxLength={SEO_LIMITS.keywords}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* 4. ĐIỂM NỔI BẬT (USP) & TAGS */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Điểm Nổi Bật (USP) & Lợi Ích <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {charCount(inputs.usp)}/{SEO_LIMITS.usp}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={inputs.usp}
                  onChange={(e) => setInputs((prev) => ({ ...prev, usp: e.target.value }))}
                  placeholder="Chất liệu cotton cá sấu gai tổ ong 100% tự nhiên, co giãn 4 chiều, thấm hút mồ hôi vượt trội, bo cổ dệt nguyên khối không bai dão..."
                  maxLength={SEO_LIMITS.usp}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none"
                />
                {/* <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold">Gợi ý nhanh:</span>
                {USP_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    disabled={inputs.usp.includes(tag) || charCount(inputs.usp + ", " + tag) > SEO_LIMITS.usp}
                    onClick={() => handleAddUspTag(tag)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    + {tag}
                  </button>
                ))}
              </div> */}
              </div>

              {/* 5. THÔNG SỐ KỸ THUẬT */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Thông Số Kỹ Thuật
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {charCount(inputs.specs)}/{SEO_LIMITS.specs}
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={inputs.specs}
                  onChange={(e) => setInputs((prev) => ({ ...prev, specs: e.target.value }))}
                  placeholder="Size M (50-60kg), L (60-70kg), XL, XXL, bảng 5 màu..."
                  maxLength={SEO_LIMITS.specs}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none"
                />
              </div>

              {/* 6. KHÁCH HÀNG MỤC TIÊU */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Khách Hàng Mục Tiêu
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {charCount(inputs.audience)}/{SEO_LIMITS.audience}
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={inputs.audience}
                  onChange={(e) => setInputs((prev) => ({ ...prev, audience: e.target.value }))}
                  placeholder="Nam thanh niên, nhân viên văn phòng, sinh viên..."
                  maxLength={SEO_LIMITS.audience}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none"
                />
              </div>

              {/* 7. CHÍNH SÁCH BÁN HÀNG */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Chính Sách Bán Hàng & Đổi Trả
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {charCount(inputs.policies)}/{SEO_LIMITS.policies}
                  </span>
                </div>
                <input
                  type="text"
                  value={inputs.policies}
                  onChange={(e) => setInputs((prev) => ({ ...prev, policies: e.target.value }))}
                  placeholder="VD: Hỗ trợ đổi trả trong 7 ngày nếu lỗi từ NSX, kiểm tra hàng trước khi nhận..."
                  maxLength={SEO_LIMITS.policies}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* Nút Submit & Hủy yêu cầu */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Sparkles size={16} className="animate-spin" /> Đang Tối Ưu SEO ({elapsedSeconds}s)...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Tối Ưu SEO ({inputs.platform === "shopee" ? "Shopee" : "TikTok Shop"})
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
                      ⚡ Còn <strong className={userQuota.remainingFree === 0 ? "text-rose-500" : "text-emerald-500"}>{userQuota.remainingFree ?? 0}</strong>/{userQuota.dailyFreeLimit} lượt hôm nay · <Link href="/profile#pricing-section" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Nâng cấp VIP</Link>
                    </span>
                  )
                ) : remaining === null ? (
                  <span>Đã đăng nhập · Sử dụng theo định mức hàng ngày.</span>
                ) : typeof remaining === "number" ? (
                  <span>Còn {remaining}/2 lượt thử nghiệm miễn phí. Đăng nhập để nhận lượt hàng ngày.</span>
                ) : (
                  <span>Tài khoản miễn phí được cấp lượt dùng mỗi ngày.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col w-full lg:min-h-0 lg:h-full lg:overflow-hidden pb-24 lg:pb-0`}>
          <SeoOptimizerOutput
            snapshot={snapshot}
            loading={loading}
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
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Sparkles size={16} className="animate-spin" /> Đang Tối Ưu SEO ({elapsedSeconds}s)...
              </>
            ) : (
              <>
                <Send size={16} /> Tối Ưu SEO ({inputs.platform === "shopee" ? "Shopee" : "TikTok Shop"})
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
