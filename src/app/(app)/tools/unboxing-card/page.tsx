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

export default function UnboxingCardPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

      {/* Header & Breadcrumb */}
      <div className="shrink-0 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/tools" className="hover:text-rose-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Kho Công Cụ AI
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Trải Nghiệm Khách Hàng</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-2">
              <HeartHandshake className="text-rose-500" /> AI Thư Cảm Ơn Nhét Hộp & Nam Châm 5 Sao
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider">
              <Crown size={11} className="text-amber-600 dark:text-amber-400" />
              VIP TOOL
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Tạo thiệp cảm ơn 2 mặt chuẩn in xưởng: Cài &ldquo;khiên chắn chống 1 sao&rdquo;, thúc đẩy chụp ảnh đánh giá 5 sao và kéo khách về Zalo OA đúng luật sàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AiUsageBadge tool="unboxing-card" refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Bố cục Form & Kết quả */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* Cột trái: Form nhập liệu */}
        <div className="lg:col-span-5 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-2">
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Thông Tin Thiết Kế Thiệp
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseSample}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Dữ liệu mẫu
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Làm mới
              </button>
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
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              loading
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
        <div className="lg:col-span-7 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
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
