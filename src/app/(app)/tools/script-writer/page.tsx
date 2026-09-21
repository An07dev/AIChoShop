"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Video,
  Flame,
  Film,
  FileSpreadsheet,
  Send,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ScriptWriterOutput } from "@/components/tools/ScriptWriterOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

const SAMPLE_DATA = {
  productName: "Kem Chống Nắng La Roche-Posay Anthelios Khô Thoáng Giảm Dầu SPF50+",
  usp: "Màng lọc Mexoplex độc quyền kiềm dầu 12h, nâng tone tự nhiên không bết dính vệt trắng, kháng nước và mồ hôi tối ưu",
};

const SAMPLE_RESULT = `# KỊCH BẢN 1: Góc Nỗi Đau & Đồng Cảm (Chảo Dầu Mùa Hè)
- **Thời lượng**: 35 giây

### [00:00 - 00:03] HOOK: Giữ chân 3 giây đầu
- **Hình ảnh / Hành động**: Cận cảnh KOC lấy giấy thấm dầu áp lên trán và cánh mũi, nhấc ra ướt sũng với biểu cảm bất lực, ngán ngẩm.
- **Lời thoại (Voice)**: "Bôi kem chống nắng mà cứ như rán mỡ trên mặt, chiều về mụn ẩn thi nhau biểu tình?"
- **Chữ trên video**: "MẶT CHẢO DẦU VÌ KEM CHỐNG NẮNG SAI CÁCH?"

### [00:03 - 00:15] NỖI ĐAU: Khơi gợi vấn đề
- **Hình ảnh / Hành động**: KOC chỉ vào vùng chữ T bóng nhẫy và viền cổ dính vệt kem trắng loang lổ khi mồ hôi chảy ra.
- **Lời thoại (Voice)**: "Mùa này ra đường 5 phút là dầu đổ lênh láng, kem loang lổ thành vệt trắng xoá, vừa mất thẩm mỹ vừa bít tắc lỗ chân lông!"
- **Chữ trên video**: "BÓNG DẦU • LOANG VỆT • BÍT TẮC MỤN"

### [00:15 - 00:30] GIẢI PHÁP: Giới thiệu USP
- **Hình ảnh / Hành động**: KOC lấy tuýp La Roche-Posay Anthelios vạch xanh, chấm lên nửa mặt và tán đều, zoom cực cận bề mặt da khô ráo mịn lì ngay sau 10 giây. Áp lại giấy thấm dầu mới: khô tinh.
- **Lời thoại (Voice)**: "Đổi ngay sang em La Roche-Posay Anthelios vạch xanh này đi! Màng lọc Mexoplex kiềm dầu đỉnh cao tận 12 giờ, chất kem thấm ráo tức thì, không vón cục, nâng tone tự nhiên siêu tệp da."
- **Chữ trên video**: "KIỀM DẦU 12H • MÀNG LỌC MEXOPLEX ĐỘC QUYỀN"

### [00:30 - 00:45] CTA: Kêu gọi hành động chốt đơn
- **Hình ảnh / Hành động**: KOC cầm tuýp kem giơ cạnh giỏ hàng nhấp nháy, tay chỉ vào góc trái màn hình kèm sticker voucher giảm giá.
- **Lời thoại (Voice)**: "Đang có deal Flash Sale chính hãng giảm sâu kèm quà tặng minisize độc quyền trên live. Bấm ngay vào giỏ hàng góc trái săn trước khi hết voucher nhé!"
- **Chữ trên video**: "FLASH SALE 50% TRONG GIỎ HÀNG GÓC TRÁI"

# KỊCH BẢN 2: Góc Giật Tít & Tò Mò (Sự Thật Thổi Phồng?)
- **Thời lượng**: 38 giây

### [00:00 - 00:03] HOOK: Giữ chân 3 giây đầu
- **Hình ảnh / Hành động**: KOC cầm tuýp kem vạch xanh giơ thẳng vào camera, lắc đầu đầy hoài nghi với biểu cảm tò mò.
- **Lời thoại (Voice)**: "Đừng mua em kem chống nắng quốc dân này nếu da bạn là da khô hoặc thích bóng bóng kiểu Hàn Quốc!"
- **Chữ trên video**: "CẢNH BÁO: ĐỪNG MUA THEO PHONG TRÀO!"

### [00:03 - 00:15] NỖI ĐAU: Khơi gợi vấn đề
- **Hình ảnh / Hành động**: KOC mở điện thoại quay màn hình hàng trăm bình luận khen ngợi rồi zoom vào chất gel-cream đặc trưng.
- **Lời thoại (Voice)**: "Ai cũng bảo em này đắt mà sao hot rần rần TikTok suốt bao năm? Thật sự có thần thánh như lời đồn hay chỉ là quảng cáo thổi phồng?"
- **Chữ trên video**: "ĐẮT CÓ XẮT RA MIẾNG KHÔNG?"

### [00:15 - 00:30] GIẢI PHÁP: Giới thiệu USP
- **Hình ảnh / Hành động**: KOC test trực tiếp: xịt nước khoáng lên mặt mô phỏng đi mưa/mồ hôi, lớp kem vẫn nguyên vẹn không trôi. Dùng đèn UV soi kiểm tra độ bảo vệ phổ rộng.
- **Lời thoại (Voice)**: "Sự thật là màng lọc quang phổ rộng chống UVA/UVB tối ưu, công nghệ Airlicium hút dầu gấp 100 lần trọng lượng của nó! Kháng nước, chống mồ hôi đi bơi thoải mái luôn."
- **Chữ trên video**: "SPF50+ PA++++ • KHÁNG NƯỚC & MỒ HÔI"

### [00:30 - 00:45] CTA: Kêu gọi hành động chốt đơn
- **Hình ảnh / Hành động**: KOC chỉ tay vào biểu tượng giỏ hàng vàng, xuất hiện bảng so sánh giá gốc vs giá ưu đãi ngày hôm nay.
- **Lời thoại (Voice)**: "Bình thường gần 500 cành, hôm nay trong live có voucher TikTok Shop trợ giá chỉ còn hơn 300k chính hãng. Chốt đơn ngay góc trái màn hình nha!"
- **Chữ trên video**: "CHÍNH HÃNG 100% • GIẢM TỚI 150K HÔM NAY"

# KỊCH BẢN 3: Góc Review Thực Tế & Trải Nghiệm (Test Cả Ngày 8 Tiếng)
- **Thời lượng**: 40 giây

### [00:00 - 00:03] HOOK: Giữ chân 3 giây đầu
- **Hình ảnh / Hành động**: Màn hình chia đôi: Bên trái đồng hồ 8h sáng, bên phải đồng hồ 5h chiều, KOC nở nụ cười tự tin khoe làn da vẫn khô thoáng.
- **Lời thoại (Voice)**: "Thử thách bôi kem chống nắng đi làm từ 8 giờ sáng đến 5 giờ chiều không dặm lại, xem cái kết!"
- **Chữ trên video**: "TEST THỰC TẾ 8 TIẾNG ĐI LÀM: CÁI KẾT?"

### [00:03 - 00:15] NỖI ĐAU: Khơi gợi vấn đề
- **Hình ảnh / Hành động**: Cảnh KOC ngồi văn phòng điều hòa rồi ra ngoài ăn trưa dưới nắng gắt 38 độ, đồng nghiệp xung quanh ai cũng bóng loáng mặt.
- **Lời thoại (Voice)**: "Ngồi phòng máy lạnh thì khô nẻ, trưa chạy ra đường thì nắng cháy da, thường là lớp nền mốc meo và chảy nhớp nháp."
- **Chữ trên video**: "MÁY LẠNH HÚT ẨM • NẮNG TRƯA 38 ĐỘ"

### [00:15 - 00:30] GIẢI PHÁP: Giới thiệu USP
- **Hình ảnh / Hành động**: KOC dùng camera thường zoom sát từng lỗ chân lông lúc 5h chiều: da đều màu, không xuống tone, vùng mũi chỉ bóng nhẹ tự nhiên không nhờn rít.
- **Lời thoại (Voice)**: "Nhưng nhìn da mình lúc 5 giờ chiều nè: vẫn khô ráo, không bị xỉn màu tối sầm, da mịn màng nhẹ tênh cả ngày dài luôn!"
- **Chữ trên video**: "KHÔNG XUỐNG TONE • KHÔ THOÁNG NHẸ TÊNH"

### [00:30 - 00:45] CTA: Kêu gọi hành động chốt đơn
- **Hình ảnh / Hành động**: KOC giơ tuýp kem cùng set quà tặng túi canvas và minisize của hãng, chỉ tay vào giỏ hàng.
- **Lời thoại (Voice)**: "Đang có chương trình freeship 0 đồng và tặng kèm quà độc quyền. Số lượng quà có hạn, cả nhà bấm giỏ hàng bên dưới rinh liền tay nhé!"
- **Chữ trên video**: "FREESHIP 0Đ • TẶNG KÈM QUÀ ĐỘC QUYỀN"`;

export default function ScriptWriterPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const [productName, setProductName] = useState("");
  const [usp, setUsp] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

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
    setProductName(SAMPLE_DATA.productName);
    setUsp(SAMPLE_DATA.usp);
    setResult(SAMPLE_RESULT);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setProductName("");
    setUsp("");
    setResult("");
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("script-writer", false);
    if (!hasAccess) return;

    if (!productName.trim() || !usp.trim()) {
      showWarning("Vui lòng nhập Tên sản phẩm và Điểm nổi bật (USP)!", "Thiếu Thông Tin");
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
          tool: "script-writer",
          inputs: { productName: productName.trim(), usp: usp.trim() },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showAiError(data, "Có lỗi xảy ra khi tạo kịch bản video");
      }
    } catch {
      showAiError({
        error: "Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại mạng hoặc token.",
      });
    } finally {
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
            <AiUsageBadge tool="script-writer" refreshTrigger={refreshTrigger} historyOnly />
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
              <span className="text-slate-600 dark:text-slate-300">Sáng Tạo Video Ngắn</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs shrink-0">
                <Video size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    AI Kịch Bản Video/Live
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
                  Tạo 3 kịch bản TikTok / Reels chuẩn bảng phân cảnh, hook 3s đầu giữ chân người xem và kịch bản chốt đơn.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved exactly as original) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="script-writer" refreshTrigger={refreshTrigger} />
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
        resultLabel="Kịch Bản Video"
      />

      {/* Grid 2 Cột: Cuộn độc lập trên Desktop, Chuyển tab trên Mobile */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* 3 Thẻ tóm tắt tính năng */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl border border-purple-200/70 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
                    <Flame size={13} className="text-amber-500 shrink-0" />
                    3 Kịch Bản
                  </div>
                  <p className="text-[10px] text-purple-700/80 dark:text-purple-400/80 mt-0.5">3 góc tiếp cận</p>
                </div>
                <div className="p-2.5 rounded-xl border border-indigo-200/70 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                    <Film size={13} className="text-indigo-500 shrink-0" />
                    Phân Cảnh
                  </div>
                  <p className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80 mt-0.5">Thoại & visual</p>
                </div>
                <div className="p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    <FileSpreadsheet size={13} className="text-emerald-500 shrink-0" />
                    Xuất Excel
                  </div>
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Sẵn sàng quay</p>
                </div>
              </div>

              {/* Tên sản phẩm */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên Sản Phẩm Của Bạn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="VD: Kem chống nắng La Roche-Posay Anthelios kiềm dầu..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* Điểm nổi bật (USP) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Điểm Nổi Bật (USP) Cần Nhấn Mạnh <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Lợi ích giải quyết vấn đề
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                  placeholder="VD: Kiềm dầu 12h, nâng tone tự nhiên không bết dính vệt trắng, kháng nước mồ hôi tối ưu khi hoạt động ngoài trời..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Nút Submit máy tính */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Sparkles size={16} className="animate-spin" /> Đang Viết 3 Kịch Bản Phân Cảnh...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Lên Kịch Bản Bằng AI (3 Góc Quay)
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
                ) : (
                  <span>Tài khoản miễn phí được cấp lượt dùng mỗi ngày.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ KỊCH BẢN */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden pb-16 lg:pb-0`}>
          <ScriptWriterOutput
            result={result}
            loading={loading}
            productName={productName}
            usp={usp}
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
                <Sparkles size={16} className="animate-spin" /> Đang Viết 3 Kịch Bản Phân Cảnh...
              </>
            ) : (
              <>
                <Send size={16} /> Lên Kịch Bản Bằng AI (3 Góc Quay)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
