"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useToolGate } from "@/hooks/useToolGate";
import { AuthModal } from "@/components/auth/AuthModal";
import { SeoOptimizerOutput } from "@/components/tools/SeoOptimizerOutput";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { useToast } from "@/context/ToastContext";
import {
  SEO_LIMITS,
  charCount,
  parseSeoResult,
  validateSeoInputs,
  type SeoInputs,
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
  const { showAiError, showWarning } = useToast();

  const [inputs, setInputs] = useState<SeoInputs>({ ...EMPTY });
  const [snapshot, setSnapshot] = useState<SeoSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  // Khóa cuộn trang chính trên desktop, chỉ cho phép cuộn nội bộ phần input và output
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        main.style.overflow = "hidden";
      } else {
        main.style.overflow = "auto";
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      main.style.overflow = "";
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleUseSample = () => {
    setInputs({ ...SAMPLE_DATA });
  };

  const handleResetForm = () => {
    setInputs({ ...EMPTY });
    setSnapshot(null);
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
      showWarning("Vui lòng nhập điểm nổi bật (USP) và lợi ích của sản phẩm!", "Thiếu Thông Tin");
      return;
    }

    setLoading(true);

    try {
      const submitted = validateSeoInputs(inputs);
      const signal = AbortSignal.timeout(115_000);
      const send = () =>
        fetch("/api/ai/seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitted),
          signal,
        });

      let response = await send();
      let data = await response.json();

      if (data.code === "VISITOR_INITIALIZED") {
        response = await send();
        data = await response.json();
      }

      if (!response.ok || !data.success) {
        if (data.code === "LOGIN_REQUIRED") {
          setLoginOpen(true);
          return;
        }
        if (data.code === "DAILY_LIMIT_EXCEEDED") {
          await checkAccess("seo-optimizer", false);
          return;
        }
        showAiError(data, data.error || "Không thể tối ưu SEO. Vui lòng thử lại sau.");
        return;
      }

      const output = parseSeoResult(data.data, submitted.platform, submitted);
      setSnapshot({ inputs: submitted, output });
      setRemaining(data.remaining);
      setRefreshTrigger((prev) => prev + 1);
    } catch (cause: any) {
      if (cause instanceof Error && (cause.name === "TimeoutError" || cause.name === "AbortError")) {
        showAiError({
          code: "TIMEOUT",
          error: "Chưa nhận được kết quả kịp thời. Vui lòng chờ một chút trước khi thử lại.",
        });
      } else {
        showAiError(
          cause instanceof Error
            ? { code: "SERVER_ERROR", error: cause.message }
            : { code: "NETWORK_ERROR", error: "Không thể kết nối máy chủ. Vui lòng thử lại sau." }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Modals chặn quyền & đăng nhập */}
      <GateModals />
      <AuthModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} initialTab="login" />

      {/* Header & Breadcrumb thu gọn */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/tools" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Kho Công Cụ AI
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Tối Ưu SEO & Đăng Bán</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
            AI Tối Ưu SEO Sản Phẩm Shopee/TikTok
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs uppercase tracking-wider">
              <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400" />
              FREE TOOL
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 uppercase tracking-wide border border-emerald-200 dark:border-emerald-800">
              Chuẩn SEO Top 1
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AiUsageBadge tool="seo-optimizer" refreshTrigger={refreshTrigger} />
          <button
            type="button"
            onClick={handleUseSample}
            className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles size={14} /> Dữ Liệu Mẫu
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} /> Xóa Form
          </button>
        </div>
      </div>

      {/* Khu vực thao tác chính 2 cột: Cả 2 cuộn độc lập, trang ngoài không cuộn */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* CỘT TRÁI: FORM NHẬP LIỆU (Cấu hình Dữ liệu SEO) */}
        <div className="w-full lg:w-[450px] xl:w-[480px] shrink-0 flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Header cột trái */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-emerald-500" />
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Cấu Hình Dữ Liệu SEO</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Shopee & TikTok</span>
          </div>

          {/* Form inputs cuộn nội bộ */}
          <div className="p-3.5 sm:p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain space-y-3.5">
            {/* 1. SÀN THƯƠNG MẠI ĐIỆN TỬ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Sàn Thương Mại Điện Tử <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInputs((prev) => ({ ...prev, platform: "shopee" }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    inputs.platform === "shopee"
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
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    inputs.platform === "tiktok"
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
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <Layers size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  5 Tiêu Đề
                </div>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Chuẩn SEO sàn</p>
              </div>
              <div className="p-2 rounded-xl border border-teal-200/70 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-300">
                  <FileText size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  Mô Tả AIDA
                </div>
                <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80 mt-0.5">Kích thích chốt đơn</p>
              </div>
              <div className="p-2 rounded-xl border border-cyan-200/70 dark:border-cyan-900/40 bg-cyan-50/40 dark:bg-cyan-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900 dark:text-cyan-300">
                  <Hash size={13} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                  10 Hashtag
                </div>
                <p className="text-[10px] text-cyan-700/80 dark:text-cyan-400/80 mt-0.5">Gợi ý lên xu hướng</p>
              </div>
            </div>

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
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold">Gợi ý nhanh:</span>
                {USP_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    disabled={inputs.usp.includes(tag) || charCount(inputs.usp + ", " + tag) > SEO_LIMITS.usp}
                    onClick={() => handleAddUspTag(tag)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
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

            {/* Tips Card chuẩn Chat Broadcast */}
            <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-500" /> Bí quyết tối ưu SEO sàn TMĐT Top 1:
              </p>
              <p>• <strong>Cấu trúc tiêu đề chuẩn:</strong> [Loại SP] + [Thương hiệu/Đặc điểm chính] + [Chất liệu/Công năng] + [Kích thước/Mã].</p>
              <p>• <strong>Vị trí từ khóa vàng:</strong> Đặt từ khóa tìm kiếm quan trọng nhất trong 40 ký tự đầu tiên để hiển thị trọn vẹn trên app điện thoại.</p>
              <p>• <strong>Hashtag chuẩn ngách:</strong> Kết hợp hashtag ngành hàng + hashtag công năng + hashtag tệp khách để thuật toán phân phối đúng tệp mua.</p>
            </div>
          </div>

          {/* Nút Submit ghim cố định ở đáy cột trái */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-1.5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Sparkles size={16} className="animate-spin" /> Đang Tối Ưu SEO Chuẩn Sàn...
                </>
              ) : (
                <>
                  <Send size={16} /> Tối Ưu SEO ({inputs.platform === "shopee" ? "Shopee" : "TikTok Shop"})
                </>
              )}
            </button>

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

        {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ */}
        <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
          <SeoOptimizerOutput snapshot={snapshot} loading={loading} />
        </div>
      </div>
    </div>
  );
}
