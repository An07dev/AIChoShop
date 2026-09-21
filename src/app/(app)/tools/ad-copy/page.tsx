"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Crown,
  Send,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { AdCopyOutput } from "@/components/tools/AdCopyOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

const SAMPLE_DATA = {
  productName: "Tai nghe Bluetooth không dây chống ồn ANC AirPro 5",
  price: "Gốc 690.000đ - Flash Sale độc quyền 389.000đ",
  usp: "Chống ồn chủ động ANC 35dB khử tạp âm; Thời lượng pin trâu 30 giờ kèm dock sạc; Micro ENC đàm thoại lọc gió cực nét; Chống nước IPX5 đi mưa thể thao thoải mái",
  targetAudience: "Học sinh sinh viên, dân văn phòng hay họp online, người thích nghe nhạc và tài xế công nghệ cần nghe gọi rõ ngoài đường",
  adPlatform: "both",
};

const SAMPLE_RESULT = `### MA TRẬN TỪ KHÓA ĐẤU THẦU SHOPEE ADS

#### Nhóm 1: Từ Khóa Chính Xác (Exact Match)
- tai nghe bluetooth anc: 1.200đ - 1.800đ
- tai nghe airpro 5: 1.500đ - 2.200đ
- tai nghe chống ồn chủ động: 1.800đ - 2.500đ
- tai nghe không dây pin trâu: 1.100đ - 1.600đ

#### Nhóm 2: Từ Khóa Mở Rộng (Broad Match)
- tai nghe bluetooth: 800đ - 1.200đ
- tai nghe khong day: 700đ - 1.000đ
- tai nghe gaming: 900đ - 1.300đ
- tai nghe nhet tai: 650đ - 950đ

#### Nhóm 3: Từ Khóa Ngách & Lỗi Gõ
- tai nge bluetooth: 450đ - 700đ
- tai nghe chong on: 600đ - 900đ
- tay nghe blutooth: 400đ - 650đ
- tai nghe gia re: 550đ - 800đ

### TIÊU ĐỀ QUẢNG CÁO TỐI ƯU CTR (< 60 KÝ TỰ)
- Mẫu 1 (Đẩy Thẳng Flash Sale): Tai Nghe Bluetooth ANC AirPro 5 - Flash Sale Giảm 45%
- Mẫu 2 (Nhấn Mạnh Chống Ồn): AirPro 5 Khử Ồn ANC 35dB - Nghe Nhạc Pin 30 Giờ
- Mẫu 3 (Cam Kết Hàng Hiệu): Tai Nghe Không Dây AirPro 5 - Bảo Hành 1 Đổi 1 Trong 12T

### 5 CÂU HOOK 3 GIÂY ĐẦU VIDEO (TIKTOK ADS)
- Hook 1 (Nỗi đau): "Bỏ cả triệu mua tai nghe mà tạp âm ồn ào không chịu nổi? Thử ngay em này!"
- Hook 2 (Tò mò): "Chiếc tai nghe chống ồn 300 cành khiến các đàn anh tiền triệu phải dè chừng!"
- Hook 3 (Trải nghiệm thực tế): "Test thử độ chống ồn ANC ở quán cafe đông đúc và cái kết bất ngờ..."
- Hook 4 (Báo giá shock): "Săn đúng đợt sale độc quyền này tiết kiệm ngay một nửa tiền tai nghe!"
- Hook 5 (Khẳng định): "Nếu bạn cần tai nghe đàm thoại lọc gió chạy xe ngoài đường, đây là chân ái!"

### MẪU CAPTION QUẢNG CÁO KÈM CTA GIỎ HÀNG
- Mẫu Caption 1 (Tập trung tính năng & ưu đãi):
Chống ồn đỉnh chóp - Bật ANC một phát là cả thế giới yên tĩnh ngay!
🎧 Tai nghe Bluetooth AirPro 5 bản nâng cấp mới nhất:
✓ Chống ồn chủ động ANC 35dB khử sạch tạp âm
✓ Pin trâu 30 tiếng kèm dock sạc cả tuần không lo hết pin
✓ Micro kép ENC lọc gió đàm thoại cực nét ngoài đường
🔥 Đang Flash Sale độc quyền hôm nay, bấm vào giỏ hàng góc trái nhận ngay voucher giảm 50k nhé!

- Mẫu Caption 2 (Khơi gợi nhu cầu & thúc đẩy hành động):
Đi học, đi làm hay họp online cả ngày không đau tai, nghe gọi cực rõ!
Ưu đãi chỉ áp dụng cho 100 đơn đầu tiên hôm nay trong giỏ hàng TikTok Shop.
Bảo hành chính hãng 12 tháng lỗi 1 đổi 1 tận nhà. Chốt đơn ngay!

#tainghebluetooth #tainghekhongday #airpro5 #tainghechongon #xuhuongtiktok #reviewcongnghe`;

export default function AdCopyPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

  // Form states
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [usp, setUsp] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [adPlatform, setAdPlatform] = useState("both");

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
      .catch(() => {});
  }, [refreshTrigger]);

  const handleUseSample = () => {
    setProductName(SAMPLE_DATA.productName);
    setPrice(SAMPLE_DATA.price);
    setUsp(SAMPLE_DATA.usp);
    setTargetAudience(SAMPLE_DATA.targetAudience);
    setAdPlatform(SAMPLE_DATA.adPlatform);
    setResult(SAMPLE_RESULT);
    setMobileTab("result");
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
    setMobileTab("result");

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
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
      {/* Modals chặn quyền nếu có */}
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
            <AiUsageBadge tool="ad-copy" refreshTrigger={refreshTrigger} historyOnly />
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
              <span className="text-slate-600 dark:text-slate-300">Marketing &amp; Kéo Traffic</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/80 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-xs shrink-0">
                <Flame size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    AI Mẫu Quảng Cáo
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
                  Ma trận từ khóa đấu thầu Shopee Ads + 5 Câu Hook 3s và Caption tối ưu Giỏ hàng TikTok Spark Ads.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved exactly as original) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="ad-copy" refreshTrigger={refreshTrigger} />
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
        resultLabel="Mẫu Quảng Cáo"
      />

      {/* Grid 2 Cột: Cuộn độc lập trên Desktop, Chuyển tab trên Mobile */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div
          className={`${
            mobileTab === "form" ? "flex" : "hidden lg:flex"
          } lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}
        >
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* 1. NỀN TẢNG QUẢNG CÁO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Nền Tảng Quảng Cáo <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdPlatform("both")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      adPlatform === "both"
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>⚡ Cả Hai</span>
                    <span className="text-[10px] font-normal opacity-80">Shopee &amp; TikTok</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdPlatform("shopee")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      adPlatform === "shopee"
                        ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>🛒 Shopee Ads</span>
                    <span className="text-[10px] font-normal opacity-80">Từ Khóa &amp; CTR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdPlatform("tiktok")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      adPlatform === "tiktok"
                        ? "bg-pink-50 dark:bg-pink-950/40 border-pink-500 text-pink-600 dark:text-pink-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>🎵 TikTok Ads</span>
                    <span className="text-[10px] font-normal opacity-80">Hook 3s &amp; Giỏ</span>
                  </button>
                </div>
              </div>

              {/* 2. TÊN SẢN PHẨM */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên Sản Phẩm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="VD: Tai nghe Bluetooth chống ồn ANC AirPro 5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* 3. GIÁ BÁN & GIÁ KHUYẾN MÃI */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>
                    Giá Bán &amp; Khuyến Mãi <span className="text-rose-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="VD: Gốc 690k - Giảm còn 389k hôm nay"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* 4. ĐIỂM NỔI BẬT (USP) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>
                    Điểm Nổi Bật (USP) / Lợi Ích Cốt Lõi <span className="text-rose-500">*</span>
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                  placeholder="VD: Chống ồn chủ động ANC 35dB; Pin 30 tiếng; Micro lọc gió cực nét; Chống nước IPX5..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none leading-relaxed"
                />
              </div>

              {/* 5. ĐỐI TƯỢNG MỤC TIÊU */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Đối Tượng Khách Hàng Nhắm Tới</span>
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="VD: Sinh viên, dân văn phòng, người hay đi xe máy ngoài đường..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* NÚT SUBMIT TRONG FORM */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Sparkles size={16} className="animate-spin" /> Đang Tạo Mẫu Quảng Cáo...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Tạo Mẫu Quảng Cáo Chuyển Đổi
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
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
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

        {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ */}
        <div
          className={`${
            mobileTab === "result" ? "flex" : "hidden lg:flex"
          } lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden pb-16 lg:pb-0`}
        >
          <AdCopyOutput
            result={result}
            loading={loading}
            productName={productName}
            platform={adPlatform}
            onUseSample={handleUseSample}
          />
        </div>
      </div>

      {/* Mobile Floating Sticky Action Bar (chỉ hiện khi ở tab form trên mobile) */}
      {mobileTab === "form" && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 lg:hidden shadow-lg">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Sparkles size={16} className="animate-spin" /> Đang Tạo Mẫu Quảng Cáo...
              </>
            ) : (
              <>
                <Send size={16} /> Tạo Mẫu Quảng Cáo Chuyển Đổi
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
