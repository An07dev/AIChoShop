"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Rocket,
  Crown,
  XCircle,
  Send,
} from "lucide-react";
import { useToolGate } from "@/hooks/useToolGate";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";
import { ProductLaunchpadOutput } from "@/components/tools/ProductLaunchpadOutput";
import {
  ProductLaunchpadInputs,
  SAMPLE_LAUNCHPAD_PRESETS,
  buildOfflineProductLaunchpadData,
} from "@/lib/product-launchpad/contract";

const LAUNCHPAD_DRAFT_KEY = "aicho_launchpad_draft";

export default function ProductLaunchpadPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning, showSuccess } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Mỹ phẩm & Chăm sóc da");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [usp, setUsp] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platform, setPlatform] = useState<"all" | "shopee" | "tiktok" | "lazada">("all");
  const [tone, setTone] = useState<"aggressive" | "natural" | "expert" | "trendy">("natural");
  const [notes, setNotes] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Khôi phục bản nháp từ localStorage khi mở trang
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAUNCHPAD_DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft && typeof draft === "object") {
          queueMicrotask(() => {
            if (draft.productName) setProductName(draft.productName);
            if (draft.category) setCategory(draft.category);
            if (draft.costPrice) setCostPrice(draft.costPrice);
            if (draft.sellingPrice) setSellingPrice(draft.sellingPrice);
            if (draft.usp) setUsp(draft.usp);
            if (draft.targetAudience) setTargetAudience(draft.targetAudience);
            if (draft.platform) setPlatform(draft.platform);
            if (draft.tone) setTone(draft.tone);
            if (draft.notes) setNotes(draft.notes);
          });
        }
      }
    } catch {
      // Bỏ qua lỗi localStorage
    }
  }, []);

  // Tự động lưu bản nháp có debounce 400ms tránh nghẽn luồng khi gõ nhanh
  useEffect(() => {
    if (!productName && !usp && !costPrice && !sellingPrice) return;
    const timer = setTimeout(() => {
      try {
        const draft = {
          productName,
          category,
          costPrice,
          sellingPrice,
          usp,
          targetAudience,
          platform,
          tone,
          notes,
        };
        localStorage.setItem(LAUNCHPAD_DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Bỏ qua lỗi quota localStorage
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [productName, category, costPrice, sellingPrice, usp, targetAudience, platform, tone, notes]);

  // Hủy tiến trình AI khi unmount
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
    };
  }, []);

  // Tính nhẩm biên lợi nhuận tức thì
  const estimatedMargin = useMemo(() => {
    const parseNum = (str: string) => {
      const cleaned = str.replace(/[^0-9]/g, "");
      return cleaned ? parseInt(cleaned, 10) : 0;
    };
    const c = parseNum(costPrice);
    const s = parseNum(sellingPrice);
    if (s > 0 && c > 0 && s > c) {
      const profit = s - c;
      const marginPct = Math.round((profit / s) * 100);
      return {
        profit: profit.toLocaleString("vi-VN") + "đ",
        marginPct,
      };
    }
    return null;
  }, [costPrice, sellingPrice]);

  // Áp dụng mẫu gợi ý
  const handleApplyPreset = (preset: ProductLaunchpadInputs) => {
    setProductName(preset.productName);
    setCategory(preset.category);
    setCostPrice(preset.costPrice || "");
    setSellingPrice(preset.sellingPrice || "");
    setUsp(preset.usp);
    setTargetAudience(preset.targetAudience || "");
    setPlatform(preset.platform || "all");
    setTone(preset.tone || "natural");
    setNotes(preset.notes || "");
    showSuccess(`Đã nạp mẫu: ${preset.productName}`, "Nạp Dữ Liệu Thành Công");
  };

  // Đặt lại form
  const handleResetForm = () => {
    setProductName("");
    setCostPrice("");
    setSellingPrice("");
    setUsp("");
    setTargetAudience("");
    setNotes("");
    setPlatform("all");
    setTone("natural");
    try {
      localStorage.removeItem(LAUNCHPAD_DRAFT_KEY);
    } catch {
      // Bỏ qua
    }
  };

  // Hủy tiến trình tức thì & dọn dẹp bộ đếm
  const handleCancel = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    showWarning("Đã dừng quá trình lập kế hoạch theo yêu cầu của bạn.", "Đã Hủy");
  };

  // Kích hoạt AI tạo toàn bộ hồ sơ
  const handleGenerate = async () => {
    const hasAccess = await checkAccess("product-launchpad", false);
    if (!hasAccess) return;

    if (!productName.trim() || !usp.trim()) {
      showWarning("Vui lòng nhập Tên sản phẩm và Điểm nổi bật (USP)!", "Thiếu Thông Tin");
      return;
    }

    setLoading(true);
    setResult("");
    setMobileTab("result");
    setElapsedSeconds(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
        showAiError({
          error: "Yêu cầu đã quá thời gian phản hồi (150s). Vui lòng thử lại hoặc giảm bớt độ dài nội dung.",
        });
      }
    }, 150000);

    const currentInputs: ProductLaunchpadInputs = {
      productName: productName.trim(),
      category,
      costPrice: costPrice.trim() || undefined,
      sellingPrice: sellingPrice.trim() || undefined,
      usp: usp.trim(),
      targetAudience: targetAudience.trim() || undefined,
      platform,
      tone,
      notes: notes.trim() || undefined,
    };

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "product-launchpad",
          inputs: currentInputs,
        }),
      });

      clearTimeout(timeoutId);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Xử lý các mã lỗi HTTP đặc biệt (401, 502, 504 HTML proxy)
      if (response.status === 401) {
        showAiError({ error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục." });
        return;
      }

      let resData: { success?: boolean; data?: unknown; error?: string } | null = null;
      try {
        const rawText = await response.text();
        resData = JSON.parse(rawText);
      } catch {
        // Phản hồi không phải JSON (VD: 502/504 Bad Gateway dạng HTML)
      }

      if (!response.ok || !resData || !resData.success) {
        showAiError(resData || {
          error: `Máy chủ AI phản hồi lỗi (${response.status}). Đã kích hoạt bộ hồ sơ dự phòng thực chiến cho bạn!`,
        });
        // Tự động kích hoạt bản dự phòng để người dùng không bị gián đoạn trải nghiệm
        const offlineData = buildOfflineProductLaunchpadData(currentInputs);
        setResult(JSON.stringify(offlineData));
        return;
      }

      setResult(typeof resData.data === "string" ? resData.data : JSON.stringify(resData.data));
      setRefreshTrigger((prev) => prev + 1);
      showSuccess("Đã tạo trọn bộ hồ sơ ra mắt sản phẩm 5-in-1 thành công!", "Xuất Bản Hoàn Tất");
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if ((err as Error)?.name === "AbortError" || controller.signal.aborted) {
        setLoading(false);
        return;
      }

      showAiError({
        error: "Không thể kết nối đến máy chủ AI. Đã kích hoạt bộ hồ sơ dự phòng thực chiến cho bạn!",
      });

      const offlineData = buildOfflineProductLaunchpadData(currentInputs);
      setResult(JSON.stringify(offlineData));
    } finally {
      setLoading(false);
    }
  };

  const currentInputsObj: ProductLaunchpadInputs = {
    productName,
    category,
    costPrice,
    sellingPrice,
    usp,
    targetAudience,
    platform,
    tone,
    notes,
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col lg:min-h-0 lg:h-full lg:overflow-hidden">
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
            <AiUsageBadge tool="product-launchpad" refreshTrigger={refreshTrigger} historyOnly />
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
              <span className="text-slate-600 dark:text-slate-300">Chiến Lược &amp; Ra Mắt 5-in-1</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0">
                <Rocket size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    AI Ra Mắt Sản Phẩm Mới (5-in-1)
                  </h1>
                  {/* Mobile Quick Action Buttons */}
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(SAMPLE_LAUNCHPAD_PRESETS[0].data)}
                    className="md:hidden px-2 py-1 rounded-xl text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 transition-all cursor-pointer text-xs font-bold active:scale-90 flex items-center gap-1 shrink-0"
                    title="Thử dữ liệu mẫu"
                  >
                    <Sparkles size={12} className="text-emerald-500" />
                    <span>Mẫu</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all cursor-pointer shadow-2xs active:scale-90 shrink-0"
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
                  Nhập thông tin 1 lần, AI tự động thiết lập trọn bộ hồ sơ 5-in-1: Listing SEO, 3 Video Shorts, 3 Mẫu Ads, Thư cảm ơn &amp; Kịch bản COD.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="product-launchpad" refreshTrigger={refreshTrigger} className="w-full sm:w-auto" />
            <button
              type="button"
              onClick={() => handleApplyPreset(SAMPLE_LAUNCHPAD_PRESETS[0].data)}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100/60 transition-colors cursor-pointer shadow-2xs text-center active:scale-95 whitespace-nowrap"
            >
              <Sparkles size={13} className="shrink-0" />
              <span>Dữ Liệu Mẫu</span>
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer shadow-2xs text-center active:scale-95 whitespace-nowrap"
            >
              <RotateCcw size={13} className="shrink-0" />
              <span>Xóa Form</span>
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
        resultLabel="Hồ Sơ Ra Mắt 5-in-1"
      />

      {/* Grid 2 Cột: Cấu hình bên trái & Output bên phải */}
      <div className="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP THÔNG TIN CHIẾN DỊCH */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col lg:min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* NẠP NHANH MẪU NGÀNH HÀNG */}

              {/* TÊN SẢN PHẨM */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên Sản Phẩm &amp; Thương Hiệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="VD: Kem Chống Nắng Phổ Rộng AICHO Sunscreen..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* NGÀNH HÀNG & KÊNH BÁN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ngành Hàng
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all cursor-pointer"
                  >
                    <option value="Mỹ phẩm & Chăm sóc da">💄 Mỹ phẩm &amp; Skincare</option>
                    <option value="Thời trang nam">👕 Thời trang nam</option>
                    <option value="Thời trang nữ">👗 Thời trang nữ</option>
                    <option value="Gia dụng nhà bếp">🍳 Gia dụng &amp; Bếp</option>
                    <option value="Mẹ & Bé">🍼 Mẹ &amp; Bé</option>
                    <option value="Thực phẩm & Đồ ăn vặt">🍿 Thực phẩm &amp; Đồ ăn</option>
                    <option value="Điện tử & Phụ kiện">🎧 Điện tử &amp; Phụ kiện</option>
                    <option value="Khác">📦 Ngành hàng khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kênh Bán Trọng Tâm
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as "all" | "shopee" | "tiktok" | "lazada")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all cursor-pointer"
                  >
                    <option value="all">🌐 Đa sàn (Shopee + TikTok)</option>
                    <option value="shopee">🟠 Shopee Mall / Shop</option>
                    <option value="tiktok">⚫ TikTok Shop &amp; Live</option>
                    <option value="lazada">🔵 Lazada</option>
                  </select>
                </div>
              </div>

              {/* GIÁ VỐN & GIÁ BÁN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Giá Vốn (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="VD: 85.000đ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Giá Bán Dự Kiến
                  </label>
                  <input
                    type="text"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="VD: 199.000đ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* TÍNH NHẨM LỢI NHUẬN GỘP */}
              {estimatedMargin && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                  <span>Biên lợi nhuận gộp: ~{estimatedMargin.marginPct}%</span>
                  <span>Lãi thô: +{estimatedMargin.profit}/sản phẩm</span>
                </div>
              )}

              {/* ĐIỂM NỔI BẬT USP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Điểm Nổi Bật / Công Năng Cốt Lõi (USP) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                  placeholder="VD: Kiềm dầu 12h màng lọc độc quyền, không để vệt trắng, chống nước mồ hôi, tặng kèm túi canvas..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none leading-relaxed"
                />
              </div>

              {/* KHÁCH HÀNG MỤC TIÊU & TONE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Khách Hàng Mục Tiêu
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="VD: Dân văn phòng 20-35 tuổi..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tone Giọng / Phong Cách
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as "aggressive" | "natural" | "expert" | "trendy")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all cursor-pointer"
                  >
                    <option value="natural">🌿 Tự nhiên &amp; Đời thường</option>
                    <option value="aggressive">⚡ Thực chiến &amp; Chốt sale mạnh</option>
                    <option value="expert">🎓 Chuyên gia uy tín &amp; Khoa học</option>
                    <option value="trendy">🔥 Hài hước &amp; Bắt trend gen Z</option>
                  </select>
                </div>
              </div>

              {/* GHI CHÚ BỔ SUNG */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ưu Đãi / Ghi Chú Riêng Của Shop (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Tặng kèm voucher giảm 20k cho đơn tiếp theo, miễn phí đổi trả..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* NÚT SUBMIT + HỦY */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !productName.trim() || !usp.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Sparkles size={16} className="animate-spin text-white" />
                      <span>Đang Lập Kế Hoạch ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Tạo Trọn Gói 5 Bộ Hồ Sơ Ra Mắt
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

        {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} w-full lg:col-span-7 flex-col lg:min-h-0 lg:h-full lg:overflow-hidden pb-24 lg:pb-0`}>
          <ProductLaunchpadOutput
            result={result}
            loading={loading}
            inputs={currentInputsObj}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
            onUseSample={() => handleApplyPreset(SAMPLE_LAUNCHPAD_PRESETS[0].data)}
          />
        </div>
      </div>

      {/* Mobile Floating Sticky Action Bar (chỉ hiện khi ở tab form trên mobile) */}
      {mobileTab === "form" && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 lg:hidden shadow-lg flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !productName.trim() || !usp.trim()}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Sparkles size={16} className="animate-spin text-white" />
                <span>Đang Lập Kế Hoạch ({elapsedSeconds}s)...</span>
              </>
            ) : (
              <>
                <Send size={16} /> Tạo Trọn Gói 5 Bộ Hồ Sơ Ra Mắt
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
      )}
    </div>
  );
}
