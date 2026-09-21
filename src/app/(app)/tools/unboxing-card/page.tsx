"use client";

import { useState } from "react";
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
  Send,
  Printer,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { UnboxingCardOutput } from "@/components/tools/UnboxingCardOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

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
    desc: "Tiêu chuẩn sang trọng, phổ biến nhất trên sàn",
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

const SAMPLE_DATA = {
  shopName: "Aicho Official Store",
  productCategory: "Thời trang thiết kế nữ & Phụ kiện cao cấp",
  cardTone: "emotional",
  specialOffer: "Voucher giảm 30.000đ cho đơn hàng sau + Quà tặng kẹp tóc ngọc trai đính kèm trong kiện hàng",
  cardFormat: "postcard_a6",
};

const SAMPLE_OUTPUT = `## 🎴 1. MẶT TRƯỚC (BÌA THIỆP - FIRST IMPRESSION)
- **Tiêu đề đập vào mắt:** MÓN QUÀ NÀY ĐƯỢC CHUẨN BỊ DÀNH RIÊNG CHO BẠN!
- **Lời tựa (Sub-headline):** Cảm ơn bạn vì đã tin tưởng lựa chọn AICHO giữa muôn vàn thương hiệu ngoài kia. Hãy mở ra để khám phá điều đặc biệt bên trong nhé!
- **Điểm nhấn thiết kế (Visual Note):** Họa tiết hoa thanh nhã dập nổi nhẹ góc dưới bên phải, nền hồng pastel trang nhã chuẩn thời trang cao cấp.

---

## 💌 2. MẶT SAU (NỘI DUNG THƯ TRI ÂN ĐẮC NHÂN TÂM)

### 🌹 Lời Tri Ân Từ Trái Tim Đội Ngũ
Chào bạn yêu dấu, khi bạn cầm trên tay kiện hàng này, từng đường kim mũi chỉ và nếp gấp đều được đội ngũ AICHO nâng niu đóng gói bằng tất cả sự tận tụy. Chúng mình hiểu rằng bạn không chỉ mua một bộ trang phục, mà là gửi gắm cả niềm vui và sự tự tin. Cảm ơn bạn đã tiếp thêm động lực cho chúng mình trên hành trình tôn vinh vẻ đẹp người phụ nữ Việt!

### 🛡️ KHIÊN CHẮN 1 SAO (Anti-1-Star Shield)
Nếu trong quá trình vận chuyển đường xa có bất kỳ điều gì sơ suất khiến bạn chưa thực sự hài lòng (nhầm size, lỗi vải hay hộp hàng móp méo), xin bạn ĐỪNG VỘI ĐÁNH GIÁ 1 SAO làm tổn thương công sức của các bạn thợ may và đóng gói. Xin hãy cho AICHO cơ hội được sửa sai bằng cách nhắn tin ngay cho shop qua khung chat sàn để được ĐỔI MỚI 100% HOÀN TOÀN MIỄN PHÍ hoặc HOÀN TIỀN trong 24 giờ!

### ⭐ NAM CHÂM KÉO REVIEW 5 SAO (Review Magnet)
Bạn ưng ý với sản phẩm chứ? Hãy chia sẻ niềm vui ấy cùng chúng mình bằng cách chụp ảnh hoặc quay clip diện đồ thật xinh kèm đánh giá 5 sao nhé! AICHO xin gửi tặng bạn ngay VOUCHER GIẢM 30.000Đ áp dụng trực tiếp cho đơn hàng tiếp theo và món quà kẹp tóc ngọc trai cao cấp đính kèm trong kiện hàng này nha!

### 📲 CỔNG QUÉT QR CHĂM SÓC KHÁCH HÀNG AN TOÀN (Safe QR / Zalo OA)
- **Khung quét mã QR:** [ĐẶT MÃ QR BẢO HÀNH ĐIỆN TỬ TẠI ĐÂY]
- **Lời dẫn an toàn sàn:** "Quét mã QR để KÍCH HOẠT BẢO HÀNH ĐỔI TRẢ 1 ĐỔI 1 TRONG 7 NGÀY & NHẬN QUÀ BÍ MẬT DÀNH RIÊNG CHO KHÁCH HÀNG THÂN THIẾT CỦA AICHO STORE."

---

## 🖨️ 3. QUY CHUẨN IN ẤN & TỐI ƯU CHI PHÍ THỰC CHIẾN
- **Quy cách kích thước in:** Khổ A6 (105 x 148 mm) - Khổ bưu thiếp chuẩn quốc tế, sang trọng và cầm vừa vặn tay khách.
- **Chất liệu giấy đề xuất:** Giấy Couche 300gsm (C300) cán màng mờ 2 mặt - Chống thấm nước, chống quăn mép khi dính hơi ẩm thùng hàng.
- **Ước tính chi phí in tại xưởng Việt Nam:** In Offset ghép bài số lượng 1.000 tấm giá dao động từ 350đ - 480đ/tấm; in 2.000 tấm giá chỉ khoảng 280đ - 320đ/tấm.
- **Mẹo nhỏ từ chuyên gia:** Dùng kẹp gỗ nhỏ kẹp thiệp cảm ơn vào nơ gói hàng hoặc túi zip sản phẩm, xịt thêm 1 làn hương nước hoa dịu nhẹ lên thiệp trước khi đóng nắp thùng để tạo trải nghiệm Unboxing đa giác quan bùng nổ!`;

export default function UnboxingCardPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

  // Form states
  const [shopName, setShopName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [cardTone, setCardTone] = useState(CARD_TONES[0].id);
  const [specialOffer, setSpecialOffer] = useState("");
  const [cardFormat, setCardFormat] = useState(CARD_FORMATS[0].id);

  const handleUseSample = () => {
    setShopName(SAMPLE_DATA.shopName);
    setProductCategory(SAMPLE_DATA.productCategory);
    setCardTone(SAMPLE_DATA.cardTone);
    setSpecialOffer(SAMPLE_DATA.specialOffer);
    setCardFormat(SAMPLE_DATA.cardFormat);
    setResult(SAMPLE_OUTPUT);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setShopName("");
    setProductCategory("");
    setCardTone(CARD_TONES[0].id);
    setSpecialOffer("");
    setCardFormat(CARD_FORMATS[0].id);
    setResult("");
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("unboxing-card", false);
    if (!hasAccess) return;

    if (!shopName.trim()) {
      showWarning("Vui lòng nhập tên gian hàng hoặc thương hiệu của bạn!", "Thiếu Thông Tin");
      return;
    }

    if (!productCategory.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm hoặc ngành hàng kinh doanh!", "Thiếu Thông Tin");
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
          tool: "unboxing-card",
          inputs: {
            shopName: shopName.trim(),
            productCategory: productCategory.trim(),
            cardTone,
            specialOffer: specialOffer.trim(),
            cardFormat,
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

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
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
                  Tạo thiệp cảm ơn 2 mặt chuẩn in xưởng: Cài &ldquo;khiên chắn chống 1 sao&rdquo;, kéo review 5 sao và kéo khách về Zalo đúng luật sàn.
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

      {/* Bố cục Form & Kết quả */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* Cột trái: Form nhập liệu */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
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

              {/* 3. Phong cách văn phong (Tone) */}
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
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${isSelected
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
                            className={`text-xs font-bold ${isSelected ? "text-rose-900 dark:text-rose-200" : "text-slate-700 dark:text-slate-300"
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

              {/* 4. Định dạng thẻ in */}
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
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${isSelected
                          ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600"
                          : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                          }`}
                      >
                        <div>
                          <div
                            className={`text-xs font-bold ${isSelected ? "text-rose-900 dark:text-rose-200" : "text-slate-700 dark:text-slate-300"
                              }`}
                          >
                            {fmt.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{fmt.desc}</div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-rose-500 bg-rose-500" : "border-slate-300 dark:border-slate-700"
                            }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Quà tặng / Ưu đãi tri ân */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Quà Tặng / Ưu Đãi Kích Hoạt Bảo Hành & Đơn Kế Tiếp
                </label>
                <textarea
                  rows={2}
                  value={specialOffer}
                  onChange={(e) => setSpecialOffer(e.target.value)}
                  placeholder="VD: Voucher 20k cho đơn sau, tặng móc khóa xinh xắn, bảo hành 1 đổi 1 trong 30 ngày..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                />
              </div>

              {/* Nút bấm Tạo Thư */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGenerate}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 hover:shadow-rose-500/25 active:scale-[0.99]"
                  }`}
              >
                {loading ? (
                  <>
                    <Sparkles size={16} className="animate-spin" /> Đang Thiết Kế Thư Cảm Ơn...
                  </>
                ) : (
                  <>
                    <HeartHandshake size={16} /> Tạo Thư Cảm Ơn Nhét Hộp Ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Cột phải: Kết quả trực quan */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
          <UnboxingCardOutput
            result={result}
            loading={loading}
            shopName={shopName}
            cardFormat={cardFormat}
            cardTone={cardTone}
          />
        </div>
      </div>
    </div>
  );
}
