"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Flame,
  SlidersHorizontal,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { AdCopyOutput } from "@/components/tools/AdCopyOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";

const SAMPLE_DATA = {
  productName: "Tai nghe Bluetooth không dây chống ồn ANC AirPro 5",
  price: "Gốc 690.000đ - Flash Sale độc quyền 389.000đ",
  usp: "Chống ồn chủ động ANC 35dB khử tạp âm; Thời lượng pin trâu 30 giờ kèm dock sạc; Micro ENC đàm thoại lọc gió cực nét; Chống nước IPX5 đi mưa thể thao thoải mái",
  targetAudience: "Học sinh sinh viên, dân văn phòng hay họp online, người thích nghe nhạc và tài xế công nghệ cần nghe gọi rõ ngoài đường",
  adPlatform: "both",
};

export default function AdCopyPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [usp, setUsp] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [adPlatform, setAdPlatform] = useState("both");

  // Khóa cuộn trang chính trên desktop, chỉ cho phép cuộn nội bộ phần output
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
    setProductName(SAMPLE_DATA.productName);
    setPrice(SAMPLE_DATA.price);
    setUsp(SAMPLE_DATA.usp);
    setTargetAudience(SAMPLE_DATA.targetAudience);
    setAdPlatform(SAMPLE_DATA.adPlatform);
  };

  const handleResetForm = () => {
    setProductName("");
    setPrice("");
    setUsp("");
    setTargetAudience("");
    setAdPlatform("both");
    setResult("");
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("ad-copy", false);
    if (!hasAccess) return;

    if (!productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm!", "Thiếu Thông Tin");
      return;
    }
    if (!price.trim()) {
      showWarning("Vui lòng nhập giá bán hoặc giá khuyến mãi!", "Thiếu Thông Tin");
      return;
    }
    if (!usp.trim()) {
      showWarning("Vui lòng nhập 2-3 điểm nổi bật (USP) của sản phẩm!", "Thiếu Thông Tin");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "ad-copy",
          inputs: {
            productName: productName.trim(),
            price: price.trim(),
            usp: usp.trim(),
            targetAudience: targetAudience.trim() || "Khách hàng mua sắm online toàn quốc",
            adPlatform,
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
    } catch (error: any) {
      showAiError({
        code: "NETWORK_ERROR",
        error: "Không thể kết nối đến hệ thống AI. Vui lòng kiểm tra lại mạng hoặc thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Modals chặn quyền nếu có */}
      <GateModals />

      {/* Thanh tiêu đề thu gọn trên 1 dòng */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 flex items-center justify-center transition-colors shadow-2xs shrink-0"
            title="Quay lại kho công cụ"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950/60 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Flame size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  AI Mẫu Quảng Cáo Shopee & TikTok Ads
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider">
                  <Crown size={11} className="text-amber-600 dark:text-amber-400" />
                  VIP TOOL
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase tracking-wide border border-blue-200 dark:border-blue-800">
                  Chuyển Đổi Cao
                </span>
              </div>
              <p className="text-slate-400 text-xs hidden sm:block">
                Ma trận từ khóa đấu thầu Shopee Ads + 5 Câu Hook 3s và Caption tối ưu Giỏ hàng TikTok Spark Ads.
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2 shrink-0">
          <AiUsageBadge tool="ad-copy" refreshTrigger={refreshTrigger} />
          <button
            type="button"
            onClick={handleUseSample}
            className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkles size={13} /> Dữ Liệu Mẫu
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Xóa trắng form"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Khu vực thao tác chính 2 cột */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="w-full lg:w-[440px] xl:w-[460px] shrink-0 flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-blue-500" />
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Cấu Hình Chiến Dịch Ads</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Shopee & TikTok</span>
          </div>

          {/* Form inputs cuộn nội bộ nếu màn hình quá ngắn */}
          <div className="p-3.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain space-y-3">
            {/* 1. NỀN TẢNG QUẢNG CÁO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nền Tảng Quảng Cáo <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAdPlatform("both")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    adPlatform === "both"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 shadow-2xs"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>⚡ Cả Hai</span>
                  <span className="text-[10px] font-normal opacity-80">Shopee & TikTok</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdPlatform("shopee")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    adPlatform === "shopee"
                      ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 shadow-2xs"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>🛒 Shopee Ads</span>
                  <span className="text-[10px] font-normal opacity-80">Từ Khóa & CTR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdPlatform("tiktok")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    adPlatform === "tiktok"
                      ? "bg-pink-50 dark:bg-pink-950/40 border-pink-500 text-pink-600 dark:text-pink-400 shadow-2xs"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>🎵 TikTok Ads</span>
                  <span className="text-[10px] font-normal opacity-80">Hook 3s & Giỏ</span>
                </button>
              </div>
            </div>

            {/* 2. TÊN SẢN PHẨM */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tên Sản Phẩm <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="VD: Tai nghe Bluetooth chống ồn ANC AirPro 5"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
              />
            </div>

            {/* 3. GIÁ BÁN & GIÁ KHUYẾN MÃI */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Giá Bán & Khuyến Mãi <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400 font-normal">Kích thích click</span>
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="VD: Gốc 690k - Giảm còn 389k hôm nay"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
              />
            </div>

            {/* 4. ĐIỂM NỔI BẬT (USP) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Điểm Nổi Bật (USP) / Lợi Ích Cốt Lõi <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400 font-normal">2-3 tính năng ăn tiền</span>
              </label>
              <textarea
                rows={2}
                value={usp}
                onChange={(e) => setUsp(e.target.value)}
                placeholder="VD: Chống ồn chủ động ANC 35dB; Pin 30 tiếng; Micro lọc gió cực nét; Chống nước IPX5..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all resize-none"
              />
            </div>

            {/* 5. ĐỐI TƯỢNG MỤC TIÊU */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Đối Tượng Khách Hàng Nhắm Tới</span>
                <span className="text-[10px] text-slate-400 font-normal">Định hình tệp Ads</span>
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="VD: Sinh viên, dân văn phòng, người hay đi xe máy ngoài đường..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
              />
            </div>

            {/* Tips Performance Ads */}
            <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flame size={13} className="text-amber-500" /> Bí quyết chạy Ads chuyển đổi cao:
              </p>
              <p>• <strong>Shopee Ads:</strong> Kết hợp 70% từ khóa chính xác + 30% từ khóa mở rộng.</p>
              <p>• <strong>TikTok Ads:</strong> Hook 3s đầu quyết định 80% tỷ lệ giữ chân người xem.</p>
            </div>
          </div>

          {/* Nút Submit ghim cố định ở đáy cột trái */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Sparkles size={16} className="animate-spin" /> Đang Tạo Mẫu Quảng Cáo...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Tạo Mẫu Quảng Cáo Chuyển Đổi
                </>
              )}
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ (CHIẾM TRỌN CHIỀU CAO VÀ CUỘN NỘI BỘ) */}
        <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
          <AdCopyOutput
            result={result}
            loading={loading}
            productName={productName}
            platform={adPlatform}
          />
        </div>
      </div>
    </div>
  );
}
