"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  FileText,
  ShieldAlert,
  HelpCircle,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ProductValidatorOutput } from "@/components/tools/ProductValidatorOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

const PLATFORMS = [
  { id: "all", name: "TikTok Shop & Shopee (Đa sàn)" },
  { id: "tiktok", name: "TikTok Shop (Thiên về Video/Livestream)" },
  { id: "shopee", name: "Shopee (Thiên về Search & Flash Sale)" },
  { id: "other", name: "Facebook / Web / Đa kênh" },
];

const SOURCES = [
  { id: "1688", name: "Nhập 1688 / Taobao Quảng Châu" },
  { id: "domestic", name: "Tổng kho trong nước (Ninh Hiệp, Tân Bình...)" },
  { id: "oem", name: "Xưởng gia công trực tiếp / OEM" },
  { id: "dropship", name: "Dropshipping / Khác" },
];

const SAMPLE_DATA = {
  productName: "Đèn ngủ hoàng hôn LED RGB đổi 16 màu kèm loa Bluetooth",
  costPrice: "68.000đ",
  targetPrice: "189.000đ",
  platform: "all",
  source: "1688",
  notes: "Hàng hot trend Douyin, kích thước đóng gói 15x15x20cm, nặng 380g, có phụ kiện cáp sạc USB và remote.",
};

export default function ProductValidatorPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

  // Form states
  const [productName, setProductName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS[0].id);
  const [source, setSource] = useState(SOURCES[0].id);
  const [notes, setNotes] = useState("");

  const handleUseSample = () => {
    setProductName(SAMPLE_DATA.productName);
    setCostPrice(SAMPLE_DATA.costPrice);
    setTargetPrice(SAMPLE_DATA.targetPrice);
    setPlatform(SAMPLE_DATA.platform);
    setSource(SAMPLE_DATA.source);
    setNotes(SAMPLE_DATA.notes);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setProductName("");
    setCostPrice("");
    setTargetPrice("");
    setPlatform(PLATFORMS[0].id);
    setSource(SOURCES[0].id);
    setNotes("");
    setResult("");
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("product-validator", false);
    if (!hasAccess) return;

    if (!productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm hoặc ý tưởng bạn muốn thẩm định!", "Thiếu Thông Tin");
      return;
    }

    setLoading(true);
    setResult("");
    setMobileTab("result");

    const selectedPlatform = PLATFORMS.find((p) => p.id === platform)?.name || platform;
    const selectedSource = SOURCES.find((s) => s.id === source)?.name || source;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "product-validator",
          inputs: {
            productName: productName.trim(),
            costPrice: costPrice.trim() || "Chưa xác định",
            targetPrice: targetPrice.trim() || "Chưa xác định",
            platform: selectedPlatform,
            source: selectedSource,
            notes: notes.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showAiError(data);
        return;
      }

      setResult(data.data);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      showAiError({
        code: "NETWORK_ERROR",
        error: "Không thể kết nối đến hệ thống AI. Vui lòng kiểm tra lại mạng hoặc thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 h-full lg:overflow-hidden">
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
            <AiUsageBadge tool="product-validator" refreshTrigger={refreshTrigger} historyOnly />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            {/* Desktop Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/tools" className="hover:text-amber-600 transition-colors flex items-center gap-1 text-slate-500">
                <ArrowLeft size={13} /> Kho Công Cụ AI
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Nghiên Cứu Thị Trường</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full sm:rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs shrink-0">
                <TrendingUp size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    AI Thẩm Định Sản Phẩm Trend
                  </h1>
                  {/* Minimal icon-only reset button: ONLY ON MOBILE */}
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="md:hidden w-7 h-7 rounded-full bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer shadow-2xs active:scale-90 shrink-0"
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
                  Bóc tách rủi ro chôn vốn, cước cân nặng ẩn, nguy cơ cạnh tranh giá và tính toán biên lợi nhuận thực tế trước khi xuống tiền nhập hàng.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="product-validator" refreshTrigger={refreshTrigger} />
            <button
              type="button"
              onClick={handleUseSample}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
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
        resultLabel="Bảng Thẩm Định"
      />

      {/* Bố cục Form & Kết quả (Cuộn độc lập trên Desktop, Chuyển tab mượt mà trên Mobile) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* Cột trái: Form nhập liệu */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              {/* Header Khối Form */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-2xs">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                      Thông Tin Sản Phẩm Cần Thẩm Định
                    </h2>
                  </div>
                </div>

              </div>

              {/* 1. Tên Sản Phẩm */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tên Sản Phẩm / Ý Tưởng Định Nhập <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="VD: Quạt mini tích điện cầm tay gấp gọn kiêm sạc dự phòng..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* 2. Giá Vốn & Giá Bán */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Giá Vốn Dự Kiến
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="VD: 65.000đ"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Giá Bán Mục Tiêu
                  </label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="VD: 179.000đ"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Kênh Bán & Nguồn Hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kênh Bán Mục Tiêu
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium cursor-pointer"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nguồn Hàng Dự Kiến
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium cursor-pointer"
                  >
                    {SOURCES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Ghi Chú & Đặc Tính */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText size={14} className="text-amber-500" />
                  Đặc Tính Vận Hành & Ghi Chú Cụ Thể (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Kích thước đóng gói, cân nặng, hàng dễ vỡ/chứa pin, xu hướng video trên mạng, điểm bạn băn khoăn nhất..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none font-medium"
                />
              </div>

              {/* Nút hành động */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGenerate}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 hover:shadow-amber-500/25 active:scale-[0.99]"
                  }`}
              >
                {loading ? (
                  <>
                    <Sparkles size={16} className="animate-spin" /> Đang Thẩm Định Tiềm Năng & Rủi Ro...
                  </>
                ) : (
                  <>
                    <BarChart3 size={16} /> Bắt Đầu Thẩm Định Sản Phẩm Ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Cột phải: Kết quả trực quan */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>

          <ProductValidatorOutput
            result={result}
            loading={loading}
            productName={productName}
          />
        </div>
      </div>
    </div>
  );
}
