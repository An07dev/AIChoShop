"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  PackageCheck,
  Truck,
  Store,
  Tag,
  DollarSign,
  AlertOctagon,
  PhoneCall,
  Clock,
  ShieldCheck,
  Send,
  Crown,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { AntiReturnNudgeOutput } from "@/components/tools/AntiReturnNudgeOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";
import {
  SAMPLE_ANTI_RETURN_INPUT,
  SAMPLE_ANTI_RETURN_DATA,
  buildOfflineAntiReturnNudgeData,
} from "@/lib/anti-return-nudge/contract";

const SCENARIOS = [
  {
    id: "just_ordered",
    label: "📦 Khách Vừa Đặt Đơn COD",
    desc: "Xác nhận đơn, tạo sự hào hứng và kích hoạt trách nhiệm nhận hàng",
  },
  {
    id: "cancel_requested",
    label: "🛑 Khách Bấm Yêu Cầu Hủy Đơn",
    desc: "Cứu đơn khẩn cấp trước khi giao: hỗ trợ đổi size/màu hoặc tặng thêm quà",
  },
  {
    id: "delivery_failed_1",
    label: "🚚 Shipper Báo Giao Thất Bại Lần 1",
    desc: "Khách bận/thuê bao, cứu đơn đang trên đà bị hoàn ngược về kho",
  },
  {
    id: "delayed_shipment",
    label: "⏳ Đơn Hàng Giao Chậm Do Kho Vận",
    desc: "Chủ động trấn an khách để ngăn chặn tâm lý nản lòng bấm hủy",
  },
  {
    id: "expensive_cod",
    label: "💎 Đơn COD Giá Trị Cao (>500k)",
    desc: "Lọc đơn ảo, xác thực nhu cầu thật để tránh rủi ro vỡ nợ cước vận chuyển",
  },
];

export default function AntiReturnNudgePage() {
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
  const [shopName, setShopName] = useState("");
  const [productName, setProductName] = useState("");
  const [codAmount, setCodAmount] = useState("");
  const [scenario, setScenario] = useState(SCENARIOS[2].id);
  const [customerReason, setCustomerReason] = useState("");
  const [compensationOffer, setCompensationOffer] = useState("");

  const handleUseSample = () => {
    setShopName(SAMPLE_ANTI_RETURN_INPUT.shopName);
    setProductName(SAMPLE_ANTI_RETURN_INPUT.productName);
    setCodAmount(SAMPLE_ANTI_RETURN_INPUT.codAmount || "");
    setScenario(SAMPLE_ANTI_RETURN_INPUT.scenario);
    setCustomerReason(SAMPLE_ANTI_RETURN_INPUT.customerReason || "");
    setCompensationOffer(SAMPLE_ANTI_RETURN_INPUT.compensationOffer || "");
    setResult(JSON.stringify(SAMPLE_ANTI_RETURN_DATA));
    setIsOfflineMode(false);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setShopName("");
    setProductName("");
    setCodAmount("");
    setScenario(SCENARIOS[0].id);
    setCustomerReason("");
    setCompensationOffer("");
    setResult("");
    setIsOfflineMode(false);
  };

  const handleGenerate = async () => {
    if (isSubmittingRef.current) return;
    const hasAccess = await checkAccess("anti-return-nudge", false);
    if (!hasAccess) return;

    if (!shopName.trim()) {
      showWarning("Vui lòng nhập tên shop hoặc gian hàng!", "Thiếu Thông Tin");
      return;
    }
    if (!productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm của đơn hàng!", "Thiếu Thông Tin");
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    isSubmittingRef.current = true;
    setLoading(true);
    setElapsedSeconds(0);
    setResult("");
    setIsOfflineMode(false);
    setMobileTab("result");

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Timeout chủ động 50s (ngắn hơn 60s của Reverse Proxy để không bao giờ bị văng 502)
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
        const offlineData = buildOfflineAntiReturnNudgeData({
          shopName: shopName.trim(),
          productName: productName.trim(),
          codAmount: codAmount.trim(),
          scenario,
          customerReason: customerReason.trim(),
          compensationOffer: compensationOffer.trim(),
        });
        setResult(JSON.stringify(offlineData));
        setIsOfflineMode(true);
        showWarning(
          "Yêu cầu AI quá thời gian chờ (50s). Đã kích hoạt Bộ Kịch Bản Cứu Đơn Dự Phòng chuẩn sàn 2026!",
          "Chế Độ Dự Phòng"
        );
      }
    }, 50000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          tool: "anti-return-nudge",
          inputs: {
            shopName: shopName.trim(),
            productName: productName.trim(),
            codAmount: codAmount.trim(),
            scenario,
            customerReason: customerReason.trim(),
            compensationOffer: compensationOffer.trim(),
          },
        }),
      });

      // Đọc response dạng text để bẫy trang HTML lỗi 502/504 từ Nginx/Cloudflare/Vercel
      const rawText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }

      if (!response.ok || !data || !data.success) {
        // Tự động fallback sang Offline Blueprint thay vì hiện lỗi 502 và làm trắng màn hình
        const offlineData = buildOfflineAntiReturnNudgeData({
          shopName: shopName.trim(),
          productName: productName.trim(),
          codAmount: codAmount.trim(),
          scenario,
          customerReason: customerReason.trim(),
          compensationOffer: compensationOffer.trim(),
        });
        setResult(JSON.stringify(offlineData));
        setIsOfflineMode(true);
        showWarning(
          data?.error || "Máy chủ AI phản hồi chậm hoặc đang bảo trì (502). Đã kích hoạt Bộ Kịch Bản Cứu Đơn Dự Phòng 2026!",
          "Chế Độ Dự Phòng"
        );
        return;
      }

      setResult(data.data);
      setIsOfflineMode(Boolean(data.isOfflineFallback));
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      if (error?.name === "AbortError" || controller.signal.aborted) {
        showWarning("Đã dừng quá trình tạo kịch bản theo yêu cầu của bạn.", "Đã Hủy");
        return;
      }
      // Khi mất mạng hoặc Reverse Proxy ngắt kết nối
      const offlineData = buildOfflineAntiReturnNudgeData({
        shopName: shopName.trim(),
        productName: productName.trim(),
        codAmount: codAmount.trim(),
        scenario,
        customerReason: customerReason.trim(),
        compensationOffer: compensationOffer.trim(),
      });
      setResult(JSON.stringify(offlineData));
      setIsOfflineMode(true);
      showWarning(
        "Không thể kết nối đến máy chủ AI (sự cố mạng/502). Đã kích hoạt Bộ Kịch Bản Cứu Đơn Dự Phòng 2026!",
        "Chế Độ Dự Phòng"
      );
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
            <AiUsageBadge tool="anti-return-nudge" refreshTrigger={refreshTrigger} historyOnly />
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
              <span className="text-slate-600 dark:text-slate-300">Vận Hành &amp; Phòng Thủ Đơn</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0">
                <PackageCheck size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    AI Chống Hoàn Hàng &amp; Cứu Đơn COD
                  </h1>
                  {/* Minimal icon-only reset button: ONLY ON MOBILE */}
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="md:hidden w-7 h-7 rounded-full bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all cursor-pointer shadow-2xs active:scale-90 shrink-0"
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
                  Xử lý triệt để nỗi đau bom hàng: Tin nhắn xác nhận kích hoạt trách nhiệm, cứu đơn khi khách đòi hủy và ứng cứu khi shipper báo giao thất bại lần 1.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="anti-return-nudge" refreshTrigger={refreshTrigger} />
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
        hasResult={Boolean(result)}
        loading={loading}
        resultLabel="Kịch Bản Cứu Đơn"
      />

      {/* Bố cục Form & Kết quả (Cuộn độc lập trên Desktop, Chuyển tab & Cuộn cả trang trên Mobile) */}
      <div className="lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-start lg:items-stretch">
        {/* Cột trái: Form nhập liệu */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col w-full lg:min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              {/* Header Khối Form */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs">
                    <PackageCheck size={16} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                      Thông Tin Đơn Hàng COD
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Phòng Thủ Đơn
                </span>
              </div>

              {/* 1. Tên Shop */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tên Gian Hàng / Shop <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="VD: Aicho Tech, Tiệm Giày Sneaker..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <Store size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              {/* 2. Tên Sản Phẩm & Tiền COD */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tên Sản Phẩm <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="VD: Tai nghe bluetooth ANC..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <Tag size={15} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                <div className="sm:col-span-4 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tiền COD (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={codAmount}
                      onChange={(e) => setCodAmount(e.target.value)}
                      placeholder="350.000"
                      className="w-full pl-8 pr-2 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <DollarSign size={14} className="absolute left-2.5 top-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* 3. Tình huống xử lý */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tình Huống Đơn Hàng Cần Xử Lý
                </label>
                <div className="space-y-2">
                  {SCENARIOS.map((sc) => {
                    const isSelected = scenario === sc.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setScenario(sc.id)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                          ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-xs"
                          : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${isSelected
                              ? "text-emerald-900 dark:text-emerald-200"
                              : "text-slate-700 dark:text-slate-300"
                              }`}
                          >
                            {sc.label}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-slate-300 dark:border-slate-700"
                              }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                          {sc.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Lý do từ khách / bối cảnh */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Lý Do Khách Đưa Ra / Bối Cảnh Thực Tế (Không bắt buộc)
                </label>
                <input
                  type="text"
                  value={customerReason}
                  onChange={(e) => setCustomerReason(e.target.value)}
                  placeholder="VD: Đi công tác không nhận được, Shipper gọi đúng lúc họp, Thấy shop khác rẻ hơn..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* 5. Ưu đãi giữ chân / giải pháp shop có thể hỗ trợ */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ưu Đãi Cứu Đơn Hoặc Giải Pháp Hỗ Trợ (Không bắt buộc)
                </label>
                <textarea
                  rows={2}
                  value={compensationOffer}
                  onChange={(e) => setCompensationOffer(e.target.value)}
                  placeholder="VD: Hỗ trợ đổi màu/size miễn phí tận nơi, tặng thêm quà bí mật trong kiện hàng, giảm 20k tiền ship..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Nút bấm Tạo Kịch Bản + Hủy */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGenerate}
                  className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/25 active:scale-[0.99]"
                    }`}
                >
                  {loading ? (
                    <>
                      <Sparkles size={16} className="animate-spin text-white" />
                      <span>Đang Lên Kịch Bản ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck size={16} /> Tạo Kịch Bản Chống Bom &amp; Cứu Đơn
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
          <AntiReturnNudgeOutput
            result={result}
            loading={loading}
            shopName={shopName}
            productName={productName}
            scenario={scenario}
            onUseSample={handleUseSample}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
            isOfflineMode={isOfflineMode}
            onRetryWithAi={handleGenerate}
          />
        </div>
      </div>
    </div>
  );
}
