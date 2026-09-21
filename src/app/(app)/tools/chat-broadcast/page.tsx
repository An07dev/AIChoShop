"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  MessageSquare,
  Gift,
  Store,
  Tag,
  AlertCircle,
  Clock,
  Send,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ChatBroadcastOutput } from "@/components/tools/ChatBroadcastOutput";
import { TextDots } from "@/components/ui/text-dots";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

const SCENARIOS = [
  { id: "cart_abandoned", label: "🛒 Nhắc giỏ hàng bỏ quên (Chưa thanh toán)", desc: "Kéo khách chốt đơn giỏ hàng đang chờ" },
  { id: "loyalty_voucher", label: "🎁 Tri ân khách cũ tặng voucher độc quyền", desc: "Tặng mã riêng cảm ơn khách hàng thân thiết" },
  { id: "repurchase", label: "🔄 Nhắc mua lại hàng tiêu hao (Hết chu kỳ)", desc: "Nhắc khách bổ sung mỹ phẩm, thực phẩm, gia dụng..." },
  { id: "mega_sale", label: "⚡ Thông báo Mega Sale / Flash Sale bí mật", desc: "Kích cầu đợt sale lớn với số lượng có hạn" },
];

const SAMPLE_DATA = {
  shopName: "Aicho Tech Official Store",
  productName: "Củ sạc nhanh GaN 65W 3 cổng Type-C & Cáp dù siêu bền",
  scenario: "loyalty_voucher",
  offer: "Voucher độc quyền AICHO50K giảm ngay 50.000đ cho đơn từ 200.000đ + Tặng 01 Túi nhung chống sốc đựng sạc cáp, chỉ áp dụng trong 24 giờ",
  channel: "both",
};

const SAMPLE_RESULT = `## 💬 KỊCH BẢN SHOPEE CHAT BROADCAST (TỐI ƯU GIAO DIỆN CHAT SÀN)

### Mẫu 1 (Trực diện & Cấp bách):
🔥 [CHỈ TRONG 24H] Aicho Tech tặng riêng bạn Voucher AICHO50K giảm ngay 50.000đ cho đơn Củ sạc nhanh GaN 65W từ 200k!
🎁 Tặng kèm 01 Túi nhung chống sốc cao cấp.
👉 Bấm LƯU MÃ ngay trên tin nhắn này để dùng trước 23h59 hôm nay bạn nhé!

### Mẫu 2 (Thân thiện & Tri ân đặc quyền):
Dạ Aicho Tech gửi lời cảm ơn bạn đã luôn đồng hành cùng shop ạ! 🌿
Shop gửi tặng riêng bạn mã AICHO50K giảm 50K khi sắm Củ sạc nhanh GaN 65W 3 cổng hôm nay.
✨ Hàng chính hãng bảo hành 12 tháng 1 đổi 1.
👉 Bấm vào banner bên dưới để nhận voucher độc quyền bạn nhé!

### Mẫu 3 (Kích thích tò mò & Giới hạn số lượng):
⚡ Bạn ơi, Aicho Tech chỉ còn đúng 20 suất voucher AICHO50K dành riêng cho khách hàng thân thiết thôi ạ!
Giảm 50K + Tặng túi nhung khi đặt sạc nhanh GaN 65W.
👉 Số lượng có hạn trong ngày, bạn bấm LƯU MÃ và chốt đơn ngay kẻo hết nhé!

## 📱 KỊCH BẢN ZALO OA & ZALO CÁ NHÂN (CHĂM SÓC KHÁCH HÀNG THÂN THIẾT)

### Mẫu 1 (Hỏi thăm chân thành & Tặng quà tri ân):
Dạ em chào Anh/Chị ạ! 🌿

Em là nhân viên CSKH từ Aicho Tech Official Store đây ạ. Dạo này Anh/Chị dùng thiết bị sạc bên em có êm và ổn định không ạ? Nếu có điểm nào chưa hài lòng Anh/Chị cứ góp ý để shop cải thiện tốt hơn nhé!

Để cảm ơn Anh/Chị đã luôn tin tưởng, em xin gửi tặng riêng Anh/Chị Voucher [AICHO50K] - Giảm ngay 50.000đ cho đơn từ 200.000đ khi nâng cấp lên dòng Củ sạc nhanh GaN 65W 3 cổng, kèm quà tặng 01 Túi nhung đựng phụ kiện cao cấp ạ.

Anh/Chị nhắn lại em để em giữ mã giảm giá độc quyền này cho mình trong 24h nhé ạ! ❤️

### Mẫu 2 (Nhắc chu kỳ sử dụng & Ưu đãi thành viên VIP):
Dạ em chào Anh/Chị! ✨

Đợt này các thiết bị điện thoại, laptop của mình sạc có bị nóng hay sụt pin nhanh không ạ? Củ sạc công nghệ GaN 65W mới nhất của Aicho Tech vừa về đợt hàng mới siêu mát và sạc nhanh gấp 3 lần củ sạc thường đó ạ.

Nhân dịp tri ân khách hàng thân thiết, shop gửi tặng riêng Anh/Chị mã [AICHO50K] giảm 50.000đ kèm quà tặng túi chống sốc. 

Anh/Chị có cần em hỗ trợ tư vấn chọn cáp sạc phù hợp với máy mình đang dùng không ạ? Cứ nhắn cho em nhé!

### Mẫu 3 (Hỗ trợ riêng 1:1 & Giữ voucher độc quyền):
Dạ em chào Anh/Chị ạ!

Em thấy đợt này Anh/Chị có quan tâm đến mẫu Củ sạc nhanh GaN 65W 3 cổng của Aicho Tech. Hiện tại kho chỉ còn 15 suất quà tặng Túi nhung chống sốc dành riêng cho khách VIP hôm nay thôi ạ.

Em xin phép giữ trước cho Anh/Chị 1 suất kèm mã giảm giá riêng [AICHO50K] nhé ạ. 

Anh/Chị bấm vào link bên dưới hoặc phản hồi tin nhắn này để em hướng dẫn áp mã nhận quà liền tay nha:
👉 https://zalo.me/aichotech

### 💡 LỜI KHUYÊN GỬI TIN HIỆU QUẢ TỪ CHUYÊN GIA:
- Khung giờ vàng gửi tin Shopee: 11h30 - 13h00 (giờ nghỉ trưa) và 19h30 - 21h00 (giờ thư giãn lướt shopping).
- Khung giờ vàng Zalo OA: 09h00 - 10h30 sáng hoặc 14h30 - 16h00 chiều (tránh gửi quá muộn sau 21h).
- Tần suất phát sóng: Tối đa 1-2 lần/tuần/khách hàng để tránh tỷ lệ hủy theo dõi (Unfollow/Block).`;

export default function ChatBroadcastPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

  // Form states
  const [shopName, setShopName] = useState("");
  const [productName, setProductName] = useState("");
  const [scenario, setScenario] = useState(SCENARIOS[1].id);
  const [offer, setOffer] = useState("");
  const [channel, setChannel] = useState("both");

  const handleUseSample = () => {
    setShopName(SAMPLE_DATA.shopName);
    setProductName(SAMPLE_DATA.productName);
    setScenario(SAMPLE_DATA.scenario);
    setOffer(SAMPLE_DATA.offer);
    setChannel(SAMPLE_DATA.channel);
    setResult(SAMPLE_RESULT);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setShopName("");
    setProductName("");
    setScenario(SCENARIOS[0].id);
    setOffer("");
    setChannel("both");
    setResult("");
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("chat-broadcast", false);
    if (!hasAccess) return;

    if (!shopName.trim()) {
      showWarning("Vui lòng nhập tên Gian Hàng / Shop của bạn!", "Thiếu Dữ Liệu");
      return;
    }
    if (!productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm hoặc danh mục cần remarketing!", "Thiếu Dữ Liệu");
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
          tool: "chat-broadcast",
          inputs: {
            shopName: shopName.trim(),
            productName: productName.trim(),
            scenario,
            offer: offer.trim() || "Voucher giảm giá độc quyền dành cho khách cũ",
            channel,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setResult(data.data);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showAiError(data, "Không thể tạo kịch bản chat broadcast");
      }
    } catch (err: any) {
      showAiError({
        code: "NETWORK_ERROR",
        error: "Không thể kết nối đến hệ thống AI. Vui lòng kiểm tra lại mạng hoặc thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 h-full lg:overflow-hidden pb-3">
      {/* Modals chặn quyền nếu có */}
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
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs uppercase tracking-wider">
              <Crown size={10} className="text-amber-600 dark:text-amber-400" />
              VIP
            </span>
            <AiUsageBadge tool="chat-broadcast" refreshTrigger={refreshTrigger} historyOnly />
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
              <span className="text-slate-600 dark:text-slate-300">Remarketing Khách Cũ</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0">
                <MessageSquare size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    Soạn Tin Nhắn Chat Broadcast
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
                  Tạo kịch bản Shopee Chat Broadcast dưới 350 ký tự & Tin nhắn Zalo OA đắc nhân tâm kéo khách mua lại.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved exactly as original) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="chat-broadcast" refreshTrigger={refreshTrigger} />
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
        resultLabel="Tin Nhắn Broadcast"
      />

      {/* Grid 2 Cột: Cuộn độc lập trên Desktop, Chuyển tab trên Mobile */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP LIỆU (cuộn độc lập) */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* Header Khối Form */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                      Thiết Lập Broadcast
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Chuẩn Remarketing
                </span>
              </div>

              {/* 1. KÊNH GỬI TIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Kênh Gửi Tin Nhắn <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel("both")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${channel === "both"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <span>💬 Cả Hai</span>
                    <span className="text-[10px] font-normal opacity-80">Shopee & Zalo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("shopee")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${channel === "shopee"
                        ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <span>🛒 Shopee</span>
                    <span className="text-[10px] font-normal opacity-80">&lt; 350 ký tự</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("zalo")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${channel === "zalo"
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <span>📱 Zalo OA</span>
                    <span className="text-[10px] font-normal opacity-80">Thân tình 1:1</span>
                  </button>
                </div>
              </div>

              {/* 2. TÌNH HUỐNG GỬI TIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tình Huống Gửi Tin (Kịch Bản) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all cursor-pointer"
                >
                  {SCENARIOS.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. TÊN GIAN HÀNG & SẢN PHẨM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tên Shop <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="VD: Aicho Tech Store"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sản Phẩm / Ngành Hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="VD: Củ cáp sạc nhanh GaN 65W"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* 4. ƯU ĐÃI / VOUCHER / QUÀ TẶNG */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>
                    Ưu Đãi / Voucher Kèm Theo <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Lý do khách mở tin</span>
                </label>
                <textarea
                  rows={3}
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  placeholder="VD: Mã GIAM30K giảm 30.000đ cho đơn từ 150k + Tặng 01 cáp sạc ngắn, số lượng chỉ có 50 suất trong 24h..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none"
                />
              </div>

              {/* NÚT SUBMIT */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Sparkles size={16} className="animate-spin" /> Đang Soạn Tin Nhắn...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Soạn Tin Nhắn Kéo Khách Cũ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ (cuộn độc lập) */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>

          <ChatBroadcastOutput
            result={result}
            loading={loading}
            shopName={shopName}
            channel={channel}
            scenario={scenario}
            onUseSample={handleUseSample}
          />
        </div>
      </div>
    </div>
  );
}
