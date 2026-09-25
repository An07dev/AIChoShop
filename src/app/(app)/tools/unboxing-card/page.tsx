"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  HeartHandshake,
  Gift,
  Store,
  Tag,
  Heart,
  Palette,
  Layers,
  Crown,
  XCircle,
  ShieldCheck,
  Star,
  QrCode,
  Repeat,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { UnboxingCardOutput } from "@/components/tools/UnboxingCardOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";
import {
  SAMPLE_CARD_INPUT,
  SAMPLE_CARD_DATA,
  buildOfflineUnboxingCardData,
} from "@/lib/unboxing-card/contract";

const DRAFT_STORAGE_KEY = "aicho_unboxing_card_draft";

const CARD_TONES = [
  {
    id: "emotional",
    name: "Chân Thành & Cảm Động",
    desc: "Tâm sự biết ơn sâu sắc của startup Việt, chạm đến trái tim",
    icon: Heart,
  },
  {
    id: "friendly_witty",
    name: "Trẻ Trung & Hài Hước",
    desc: "Văn phong Gen Z vui nhộn, tạo tiếng cười khi mở hộp",
    icon: Sparkles,
  },
  {
    id: "premium_elegant",
    name: "Sang Trọng & Đẳng Cấp",
    desc: "Xưng hô Quý Khách trang nhã, dành cho đồ hiệu & mỹ phẩm cao cấp",
    icon: Palette,
  },
  {
    id: "cute_cheerful",
    name: "Đáng Yêu & Ngọt Ngào",
    desc: "Tươi vui, ấm áp, phù hợp mẹ & bé, phụ kiện, quà lưu niệm",
    icon: Gift,
  },
];

const CARD_FORMATS = [
  {
    id: "postcard_a6",
    name: "Bưu Thiếp A6 (10 x 15 cm)",
    desc: "Tiêu chuẩn sang trọng, phổ biến nhất trên sàn TMĐT",
  },
  {
    id: "mini_card",
    name: "Card Visit Mini (9 x 5.4 cm)",
    desc: "Nhỏ gọn, tiết kiệm chi phí in ấn tối đa",
  },
  {
    id: "voucher_tag",
    name: "Tag Treo / Thẻ Kèm Nơ",
    desc: "Gài vào nơ hoặc túi sản phẩm, tạo sự bất ngờ",
  },
];

const PRIMARY_GOALS = [
  {
    id: "anti_1_star",
    name: "Chống 1 Sao & Xử Lý Sự Cố",
    desc: "Hóa giải bức xúc vận chuyển, cam kết đổi mới 100% trong 24h",
    icon: ShieldCheck,
  },
  {
    id: "review_booster",
    name: "Kéo Review 5 Sao & Clip Đập Hộp",
    desc: "Tặng voucher & quà tri ân kích thích khách chụp ảnh, quay video",
    icon: Star,
  },
  {
    id: "repurchase",
    name: "Kích Thích Mua Lại Lần 2",
    desc: "Cài đặt Secret Voucher độc quyền có hạn sử dụng 30 ngày",
    icon: Repeat,
  },
  {
    id: "warranty_crm",
    name: "Kích Hoạt Bảo Hành & CRM",
    desc: "Hướng dẫn quét QR bảo hành chính hãng đúng 100% luật sàn",
    icon: QrCode,
  },
];

export default function UnboxingCardPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);

  // Form states
  const [shopName, setShopName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [cardTone, setCardTone] = useState(CARD_TONES[0].id);
  const [cardFormat, setCardFormat] = useState(CARD_FORMATS[0].id);
  const [primaryGoal, setPrimaryGoal] = useState(PRIMARY_GOALS[0].id);
  const [specialOffer, setSpecialOffer] = useState("");

  // 1. Phục hồi bản nháp từ localStorage khi mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.productCategory) setProductCategory(parsed.productCategory);
        if (parsed.cardTone) setCardTone(parsed.cardTone);
        if (parsed.cardFormat) setCardFormat(parsed.cardFormat);
        if (parsed.primaryGoal) setPrimaryGoal(parsed.primaryGoal);
        if (parsed.specialOffer) setSpecialOffer(parsed.specialOffer);
        if (parsed.result) setResult(parsed.result);
      }
    } catch {
      // Bỏ qua lỗi parsing draft
    }
  }, []);

  // 2. Tự động lưu bản nháp vào localStorage (Debounce 500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            shopName,
            productCategory,
            cardTone,
            cardFormat,
            primaryGoal,
            specialOffer,
            result,
          })
        );
      } catch {
        // Bỏ qua nếu vượt quota
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [shopName, productCategory, cardTone, cardFormat, primaryGoal, specialOffer, result]);

  // 3. Lifecycle cleanup khi unmount (Tránh memory leak)
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isSubmittingRef.current = false;
    };
  }, []);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    isSubmittingRef.current = false;
    setLoading(false);
  };

  const handleUseSample = () => {
    handleCancel();
    setShopName(SAMPLE_CARD_INPUT.shopName);
    setProductCategory(SAMPLE_CARD_INPUT.productCategory);
    setCardTone(SAMPLE_CARD_INPUT.cardTone);
    setCardFormat(SAMPLE_CARD_INPUT.cardFormat);
    setPrimaryGoal(SAMPLE_CARD_INPUT.primaryGoal || "anti_1_star");
    setSpecialOffer(SAMPLE_CARD_INPUT.specialOffer || "");
    setResult(JSON.stringify(SAMPLE_CARD_DATA));
    setIsOfflineMode(false);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    handleCancel();
    setShopName("");
    setProductCategory("");
    setCardTone(CARD_TONES[0].id);
    setCardFormat(CARD_FORMATS[0].id);
    setPrimaryGoal(PRIMARY_GOALS[0].id);
    setSpecialOffer("");
    setResult("");
    setIsOfflineMode(false);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
  };

  const handleGenerate = async () => {
    if (isSubmittingRef.current || loading) return;

    const trimmedShop = shopName.trim();
    const trimmedCategory = productCategory.trim();

    if (!trimmedShop) {
      showWarning("Vui lòng nhập tên gian hàng hoặc thương hiệu của bạn!", "Thiếu Thông Tin");
      return;
    }

    if (!trimmedCategory) {
      showWarning("Vui lòng nhập tên sản phẩm hoặc ngành hàng kinh doanh!", "Thiếu Thông Tin");
      return;
    }

    isSubmittingRef.current = true;

    try {
      const hasAccess = await checkAccess("unboxing-card", false);
      if (!hasAccess) {
        isSubmittingRef.current = false;
        return;
      }
    } catch {
      isSubmittingRef.current = false;
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setElapsedSeconds(0);
    setResult("");
    setIsOfflineMode(false);
    setMobileTab("result");

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
        const offlineData = buildOfflineUnboxingCardData({
          shopName: trimmedShop.slice(0, 100),
          productCategory: trimmedCategory.slice(0, 200),
          cardTone,
          cardFormat,
          primaryGoal,
          specialOffer: specialOffer.trim().slice(0, 1000),
        });
        setResult(JSON.stringify(offlineData));
        setIsOfflineMode(true);
        showWarning(
          "Yêu cầu AI quá thời gian chờ (120s). Đã kích hoạt bản thiết kế Offline Blueprint chuẩn in xưởng cho bạn!",
          "Chế Độ Dự Phòng"
        );
      }
    }, 120000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          tool: "unboxing-card",
          inputs: {
            shopName: trimmedShop.slice(0, 100),
            productCategory: trimmedCategory.slice(0, 200),
            cardTone,
            cardFormat,
            primaryGoal,
            specialOffer: specialOffer.trim().slice(0, 1000),
          },
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data || !data.success) {
        const offlineData = buildOfflineUnboxingCardData({
          shopName: trimmedShop.slice(0, 100),
          productCategory: trimmedCategory.slice(0, 200),
          cardTone,
          cardFormat,
          primaryGoal,
          specialOffer: specialOffer.trim().slice(0, 1000),
        });
        setResult(JSON.stringify(offlineData));
        setIsOfflineMode(true);
        showWarning(
          data?.error || "Hệ thống AI tạm thời gián đoạn. Đã kích hoạt bản thiết kế Offline Blueprint chuẩn in xưởng!",
          "Chế Độ Dự Phòng"
        );
        return;
      }

      setResult(data.data);
      setIsOfflineMode(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      if (error?.name === "AbortError" || controller.signal.aborted) {
        showWarning("Đã dừng quá trình thiết kế theo yêu cầu của bạn.", "Đã Hủy");
        return;
      }
      const offlineData = buildOfflineUnboxingCardData({
        shopName: trimmedShop.slice(0, 100),
        productCategory: trimmedCategory.slice(0, 200),
        cardTone,
        cardFormat,
        primaryGoal,
        specialOffer: specialOffer.trim().slice(0, 1000),
      });
      setResult(JSON.stringify(offlineData));
      setIsOfflineMode(true);
      showWarning("Không thể kết nối máy chủ AI. Đã kích hoạt bản thiết kế Offline Blueprint để bạn tiếp tục công việc!", "Chế Độ Dự Phòng");
    } finally {
      clearTimeout(timeoutId);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      abortControllerRef.current = null;
      isSubmittingRef.current = false;
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand transition-colors"
          >
            <ArrowLeft size={13} /> Kho công cụ AI
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
              <Crown size={12} className="text-amber-600 dark:text-amber-400" />
              VIP
            </span>
            <AiUsageBadge tool="unboxing-card" refreshTrigger={refreshTrigger} historyOnly />
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
              <span className="text-slate-600 dark:text-slate-300">Trải Nghiệm Khách Hàng</span>
            </div>

            {/* Title Row */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full sm:rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/80 flex items-center justify-center text-rose-500 dark:text-rose-400 shadow-xs shrink-0">
                <HeartHandshake size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    AI Thư Cảm Ơn Nhét Hộp
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
                  Thiết kế thiệp 2 mặt chuẩn in xưởng: Cài khiên chắn chống 1 sao, kéo review 5 sao và kích hoạt bảo hành điện tử an toàn quy chế sàn.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="unboxing-card" refreshTrigger={refreshTrigger} />
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
        resultLabel="Thiệp Cảm Ơn"
      />

      {/* Bố cục Form & Kết quả: Cuộn độc lập trên Desktop, Chuyển tab & Cuộn cả trang trên Mobile */}
      <div className="lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-start lg:items-stretch">
        {/* Cột trái: Form nhập liệu (Giữ nguyên giao diện ban đầu) */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col w-full lg:min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              {/* Header Khối Form */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shadow-2xs">
                    <HeartHandshake size={16} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                      Thông Tin Thiết Kế Thiệp
                    </h2>
                  </div>
                </div>
              </div>

              {/* 1. Tên Shop */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tên Gian Hàng / Thương Hiệu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="VD: Aicho Tech Store, Tiệm Mỹ Phẩm May..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                  <Store size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              {/* 2. Ngành hàng / Sản phẩm */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sản Phẩm Hoặc Ngành Hàng <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    placeholder="VD: Đầm thiết kế, Mỹ phẩm dưỡng trắng, Phụ kiện điện thoại..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                  <Tag size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              {/* 3. Mục tiêu chiến lược ưu tiên */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Mục Tiêu Ưu Tiên Của Thư</span>
                  <span className="text-[10px] text-rose-500 font-semibold">Tối ưu hiệu quả</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRIMARY_GOALS.map((goal) => {
                    const Icon = goal.icon;
                    const isSelected = primaryGoal === goal.id;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setPrimaryGoal(goal.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 shadow-xs"
                            : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon
                            size={14}
                            className={isSelected ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}
                          />
                          <span
                            className={`text-xs font-bold leading-tight ${
                              isSelected ? "text-rose-900 dark:text-rose-200" : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {goal.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-snug">
                          {goal.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Phong cách văn phong (Tone) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Phong Cách Ngôn Từ (Tone Giọng)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CARD_TONES.map((tone) => {
                    const Icon = tone.icon;
                    const isSelected = cardTone === tone.id;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setCardTone(tone.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 shadow-xs"
                            : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon
                            size={14}
                            className={isSelected ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}
                          />
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? "text-rose-900 dark:text-rose-200" : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {tone.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-snug">
                          {tone.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Định dạng thẻ in */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kích Thước Thẻ In Dự Kiến
                </label>
                <div className="space-y-1.5">
                  {CARD_FORMATS.map((fmt) => {
                    const isSelected = cardFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setCardFormat(fmt.id)}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600"
                            : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div
                            className={`text-xs font-bold ${
                              isSelected ? "text-rose-900 dark:text-rose-200" : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {fmt.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{fmt.desc}</div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-rose-500 bg-rose-500" : "border-slate-300 dark:border-slate-700"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Quà tặng / Ưu đãi tri ân */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Quà Tặng / Ưu Đãi Kích Hoạt Bảo Hành & Đơn Kế Tiếp
                </label>
                <textarea
                  rows={2}
                  value={specialOffer}
                  onChange={(e) => setSpecialOffer(e.target.value)}
                  placeholder="VD: Voucher 30k đơn tiếp theo, tặng kẹp tóc xinh xắn, bảo hành 1 đổi 1 trong 30 ngày..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                />
              </div>

              {/* Nút bấm Tạo Thư + Hủy */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGenerate}
                  className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                    loading
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 hover:shadow-rose-500/25 active:scale-[0.99]"
                  }`}
                >
                  {loading ? (
                    <>
                      <Sparkles size={16} className="animate-spin text-white" />
                      <span>Đang Thiết Kế ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <HeartHandshake size={16} /> Tạo Thư Cảm Ơn Nhét Hộp Ngay
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

        {/* Cột phải: Kết quả trực quan (Chữ trắng nền đen) */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col w-full lg:min-h-0 lg:h-full lg:overflow-hidden pb-20 lg:pb-0`}>
          <UnboxingCardOutput
            result={result}
            loading={loading}
            shopName={shopName}
            cardFormat={cardFormat}
            cardTone={cardTone}
            primaryGoal={primaryGoal}
            isOfflineMode={isOfflineMode}
            onUseSample={handleUseSample}
            onRetryWithAi={handleGenerate}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
