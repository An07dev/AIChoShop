"use client";

import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  RotateCcw,
  Sparkle,
  Gift,
  Tag,
  Store,
  ShieldCheck,
  Zap,
  HelpCircle,
  Layers,
  Smartphone,
  BookOpen,
  Flame,
  Award,
  Globe,
  Sliders,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ProductDescriptionOutput } from "@/components/tools/ProductDescriptionOutput";
import { useToast } from "@/context/ToastContext";

const QUICK_USP_TAGS = [
  "Làm nóng siêu tốc 20 giây",
  "Thiết kế gấp gọn 180°",
  "Khử khuẩn & khử mùi ẩm mốc",
  "Mặt gốm Ceramic chống dính",
  "Trọng lượng siêu nhẹ chỉ 450g",
  "100% Cotton tự nhiên",
  "Bảo hành 1 đổi 1 trong 30 ngày",
  "Tặng kèm phụ kiện cao cấp",
];

const COPYWRITING_MODES = [
  {
    id: "seo-full",
    name: "Chuẩn SEO & Đầy Đủ",
    tagline: "Cấu trúc 6 tầng chuyển đổi kinh điển",
    badge: "Cơ bản",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Layers,
    desc: "Cam kết vàng, Nỗi đau & Giải pháp, Điểm vượt trội USP, Thông số & Đổi trả.",
  },
  {
    id: "mobile-short",
    name: "Ngắn Gọn Mobile-First",
    tagline: "Lướt 3 giây đập vào mắt người xem",
    badge: "Lướt 3s",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: Smartphone,
    desc: "100% Bullet points ngắn, in đậm từ khóa cốt lõi, dễ đọc trên màn hình điện thoại.",
  },
  {
    id: "storytelling",
    name: "Storytelling Cảm Xúc",
    tagline: "Chạm sâu nỗi đau & Sự chuyển hóa",
    badge: "Cảm xúc",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    icon: BookOpen,
    desc: "Kể chuyện Before - After đời thực, khơi gợi cảm xúc mua hàng tự nhiên.",
  },
  {
    id: "flash-sale",
    name: "Flash Sale & FOMO",
    tagline: "Deal sốc có hạn, chốt đơn cấp tốc",
    badge: "Deal sốc",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    icon: Flame,
    desc: "Tạo áp lực thời gian, đếm ngược quà tặng, kích thích bấm Mua Ngay.",
  },
];

const PLATFORMS = [
  { id: "shopee", name: "Shopee", label: "Shopee SEO", color: "border-orange-500 bg-orange-50 text-orange-700" },
  { id: "tiktok", name: "TikTok Shop", label: "TikTok Shop", color: "border-slate-900 bg-slate-900 text-white" },
  { id: "lazada", name: "Lazada", label: "Lazada LazMall", color: "border-blue-600 bg-blue-50 text-blue-700" },
  { id: "all", name: "Đa Sàn", label: "Đa Nền Tảng", color: "border-purple-600 bg-purple-50 text-purple-700" },
];

const TONES = [
  { id: "expert", name: "Chuyên Gia Uy Tín", desc: "Chuyên sâu, logic, đáng tin cậy" },
  { id: "friendly", name: "Thân Thiện Gần Gũi", desc: "Như bạn thân chia sẻ review" },
  { id: "humorous", name: "Hài Hước Bắt Trend", desc: "Dí dỏm, viral, thoải mái" },
  { id: "luxury", name: "Sang Trọng Cao Cấp", desc: "Đẳng cấp, tinh tế, trau chuốt" },
];

export default function ProductDescriptionPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  // Mode, Platform, Tone states
  const [mode, setMode] = useState("seo-full");
  const [platform, setPlatform] = useState("shopee");
  const [tone, setTone] = useState("expert");

  // Form input states
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [shopName, setShopName] = useState("");
  const [usp, setUsp] = useState("");
  const [specs, setSpecs] = useState("");
  const [gift, setGift] = useState("");
  const [painPoint, setPainPoint] = useState("");

  // Nạp kịch bản mẫu thử (Demo bàn ủi hơi nước)
  const handleUseSample = () => {
    setProductName("Bàn ủi hơi nước mini cầm tay du lịch gấp gọn 180 độ");
    setBrand("Aicho Tech");
    setShopName("Aicho Official Store");
    setPlatform("shopee");
    setMode("seo-full");
    setTone("expert");
    setUsp(
      "Làm nóng siêu tốc 20 giây cắm điện là ủi ngay; Hơi nước áp suất cao xuyên sâu sợi vải khử khuẩn và khử mùi ẩm mốc; Thiết kế gấp gọn 180 độ chỉ 450g; Mặt ủi tráng gốm Ceramic chống dính lướt êm ái"
    );
    setSpecs("Công suất: 1000W; Dung tích bình chứa: 120ml (ủi 3-4 bộ); Dây điện dài: 1.5m; Điện áp: 220V - 50Hz");
    setGift("01 Túi rút nhung cao cấp đựng bàn ủi tiện lợi khi đi xa");
    setPainPoint(
      "Đi công tác du lịch mở vali ra thấy quần áo nhăn nhúm nhưng khách sạn không có bàn ủi, còn bàn ủi ở nhà thì quá to cồng kềnh khó mang theo"
    );
  };

  // Xóa trắng form
  const handleResetForm = () => {
    setProductName("");
    setBrand("");
    setShopName("");
    setUsp("");
    setSpecs("");
    setGift("");
    setPainPoint("");
  };

  const handleAddTag = (tag: string) => {
    if (!usp.trim()) {
      setUsp(tag);
    } else if (!usp.includes(tag)) {
      setUsp(`${usp.trim()}; ${tag}`);
    }
  };

  // Submit gọi AI
  const handleGenerate = async () => {
    const hasAccess = await checkAccess("product-description", true); // VIP Tool
    if (!hasAccess) return;

    if (!productName.trim() || !usp.trim()) {
      showWarning("Vui lòng nhập Tên sản phẩm và Điểm khác biệt vượt trội (USP)!", "Thiếu Thông Tin");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "product-description",
          inputs: {
            mode,
            platform,
            tone,
            productName: productName.trim(),
            brand: brand.trim(),
            shopName: shopName.trim(),
            usp: usp.trim(),
            specs: specs.trim(),
            gift: gift.trim(),
            guarantee: gift.trim(),
            painPoint: painPoint.trim(),
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        showAiError(data, "Có lỗi xảy ra khi tạo mô tả sản phẩm");
      }
    } catch (error) {
      showAiError({ error: "Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại mạng hoặc token." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col min-h-0">
      <GateModals />

      {/* Thanh tiêu đề thu gọn trên 1 dòng */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 flex items-center justify-center transition-colors shadow-2xs"
            title="Quay lại kho công cụ"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  AI Viết Mô Tả Chuyển Đổi Cao
                </h1>
                <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                  VIP ONLY
                </span>
              </div>
              <p className="text-slate-400 text-xs hidden sm:block">
                4 chế độ chuyên sâu: Chuẩn SEO 6 tầng, Mobile-First 3s, Storytelling cảm xúc & Flash Sale FOMO.
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUseSample}
            className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkle size={13} className="fill-amber-600 text-amber-600" />
            <span>Dùng Mẫu Thử (Demo)</span>
          </button>

          {(productName || usp || brand) && (
            <button
              type="button"
              onClick={handleResetForm}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Xóa trắng form"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Khu vực thao tác chính 2 cột */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái: Form nhập thông tin */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <h2 className="font-bold text-slate-800 text-sm">Cấu Hình Mô Tả & Dữ Liệu</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Bắt buộc: Tên & USP</span>
          </div>

          <div className="p-4 flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar gap-3.5">
            {/* 1. SÀN TMĐT (1 HÀNG NGANG ĐẦU TIÊN) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe size={13} className="text-amber-500" /> Sàn TMĐT:
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Tối ưu thuật toán theo từng sàn</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                {PLATFORMS.map((p) => {
                  const isSelected = platform === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id)}
                      className={`text-[11px] font-bold py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${isSelected
                        ? `${p.color} shadow-xs font-black ring-1 ring-black/5`
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. CHỌN CHẾ ĐỘ VIẾT (4 MODES) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Chế độ viết mô tả:</span>
                <span className="text-[10px] text-amber-600 font-semibold">Tối ưu tâm lý mua hàng</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COPYWRITING_MODES.map((m) => {
                  const Icon = m.icon;
                  const isSelected = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${isSelected
                        ? "border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-500/30"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon size={14} className={isSelected ? "text-amber-600" : "text-slate-500"} />
                          <span className="text-xs font-bold text-slate-800 leading-none">{m.name}</span>
                        </div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${m.badgeColor}`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 leading-tight">{m.tagline}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. TÊN SẢN PHẨM */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên sản phẩm: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="VD: Bàn ủi hơi nước mini cầm tay du lịch gấp gọn..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            {/* 4. THƯƠNG HIỆU & TÊN SHOP */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Award size={13} className="text-slate-400" /> Thương hiệu / Brand:
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="VD: Aicho Tech, Lock&Lock..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Store size={13} className="text-slate-400" /> Tên Shop của bạn:
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="VD: Aicho Official Store"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>

            {/* 5. ĐIỂM KHÁC BIỆT VƯỢT TRỘI (USP) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Điểm khác biệt vượt trội (USP): <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={usp}
                onChange={(e) => setUsp(e.target.value)}
                placeholder="VD: Làm nóng siêu tốc 20s cắm điện là ủi ngay; Thiết kế gấp gọn 180 độ chỉ 450g; Mặt tráng gốm Ceramic chống dính..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
              />

              {/* Tag chọn nhanh */}
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-slate-400 font-semibold">Gợi ý nhanh:</span>
                {QUICK_USP_TAGS.slice(0, 4).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 rounded-md transition cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. THÔNG SỐ KỸ THUẬT */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Thông số kỹ thuật / Kích cỡ:</span>
                <span className="text-[10px] text-slate-400 font-normal">Tự động gợi ý nếu để trống</span>
              </label>
              <input
                type="text"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder="VD: Công suất 1000W; Dung tích 120ml; Dây điện 1.5m..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            {/* 7. QUÀ TẶNG KÈM & NỖI ĐAU KHÁCH HÀNG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>🎁 Quà tặng kèm & Cam kết:</span>
                </label>
                <input
                  type="text"
                  value={gift}
                  onChange={(e) => setGift(e.target.value)}
                  placeholder="VD: Túi rút nhung cao cấp... (để trống nếu không tặng quà)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>⚡ Nỗi đau / Tình huống:</span>
                </label>
                <input
                  type="text"
                  value={painPoint}
                  onChange={(e) => setPainPoint(e.target.value)}
                  placeholder="VD: Đồ nhăn nhúm khi du lịch... (để trống nếu đi thẳng vào tính năng)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Nút Tạo Mô Tả */}
          <div className="p-3 border-t border-slate-100 bg-white shrink-0">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Sparkles size={16} />
              <span>
                {loading
                  ? "Đang Viết Mô Tả..."
                  : `Viết Mô Tả (${COPYWRITING_MODES.find((m) => m.id === mode)?.name || "Chuẩn Chuyển Đổi"})`}
              </span>
            </button>
          </div>
        </div>

        {/* Cột phải: Khung hiển thị kết quả */}
        <div className="lg:col-span-7 h-full min-h-0">
          <ProductDescriptionOutput
            result={result}
            loading={loading}
            productName={productName}
            shopName={shopName || brand}
            mode={mode}
            platform={platform}
            tone={tone}
          />
        </div>
      </div>
    </div>
  );
}
