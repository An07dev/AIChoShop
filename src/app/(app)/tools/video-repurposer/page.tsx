"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Sparkle,
  Share2,
  Video,
  Package,
  MousePointerClick,
  Smile,
  GraduationCap,
  HeartHandshake,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { useToast } from "@/context/ToastContext";
import VideoRepurposerOutput from "@/components/tools/VideoRepurposerOutput";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";

const BRAND_TONES = [
  {
    id: "friendly",
    name: "Tâm Sự Gần Gũi",
    desc: "Chân thật, chia sẻ trải nghiệm như bạn thân",
    icon: HeartHandshake,
    badge: "Bán Hàng Tự Nhiên",
    color: "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
  },
  {
    id: "gen_z",
    name: "Hài Hước & Gen Z",
    desc: "Bắt trend, viral, dí dỏm, năng động",
    icon: Smile,
    badge: "Viral Bắt Trend",
    color: "border-pink-500 bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300",
  },
  {
    id: "expert",
    name: "Chuyên Gia Uy Tín",
    desc: "Chuyên sâu, logic, phân tích khách quan",
    icon: GraduationCap,
    badge: "Độ Tin Cậy Cao",
    color: "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
  },
];

const QUICK_CTA_PRESETS = [
  "Bình luận lấy mã giảm 200k & link mua",
  "Bấm vào giỏ hàng góc trái săn deal sốc",
  "Nhắn tin (Inbox) để được tư vấn miễn phí",
  "Thả tim & Lưu lại kẻo lúc cần không tìm thấy",
];

export default function VideoRepurposerPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states
  const [videoScript, setVideoScript] = useState("");
  const [productName, setProductName] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [brandTone, setBrandTone] = useState("friendly");

  // Khóa cuộn trang chính trên desktop, chỉ cho phép cuộn nội bộ
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

  // Nạp kịch bản mẫu thử (Demo Nồi chiên hơi nước)
  const handleUseSample = () => {
    setProductName("Nồi chiên không dầu hơi nước 2 trong 1 Lock&Care 7L");
    setVideoScript(
      "Mọi người đừng bao giờ mua nồi chiên không dầu thường nữa! Đây là lý do: Nồi thường chiên xong thịt gà hay bị khô đét như rơm. Còn con nồi chiên hơi nước này vừa nướng nhiệt 200 độ vừa phun sương nano liên tục. Nhìn miếng đùi gà này: Bên ngoài da giòn rụm màu cánh gián, bên trong xé ra nước mọng ướt sũng ngọt lịm! Dung tích 7L nướng nguyên con gà 2.5kg thoải mái. Lòng nồi phủ chống dính Ceramic 5 lớp rửa tráng nước là sạch bong. Link chính hãng em ghim ở giỏ hàng góc trái nhé!"
    );
    setCallToAction("Bình luận 'Nồi chiên' lấy mã giảm giá 200k & link mua chính hãng");
    setBrandTone("friendly");
  };

  // Xóa trắng form
  const handleResetForm = () => {
    setVideoScript("");
    setProductName("");
    setCallToAction("");
    setBrandTone("friendly");
    setResult("");
  };

  // Submit gọi AI
  const handleGenerate = async () => {
    const hasAccess = await checkAccess("video-repurposer", true); // VIP Tool
    if (!hasAccess) return;

    if (!videoScript.trim()) {
      showWarning("Vui lòng nhập kịch bản hoặc lời thoại video gốc!", "Thiếu Kịch Bản Video");
      return;
    }
    if (!productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm hoặc dịch vụ!", "Thiếu Tên Sản Phẩm");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "video-repurposer",
          inputs: {
            video_script: videoScript.trim(),
            product_name: productName.trim(),
            call_to_action: callToAction.trim() || "Bình luận nhận link / Mua ngay",
            brand_tone: brandTone,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setResult(data.data);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showAiError(data, "Không thể chuyển đổi nội dung đa kênh");
      }
    } catch (err: any) {
      showAiError({ error: err?.message || "Lỗi mạng hoặc kết nối máy chủ thất bại." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0 overflow-hidden">
      <GateModals />

      {/* Thanh tiêu đề thu gọn trên 1 dòng */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 flex items-center justify-center transition-colors shadow-2xs"
            title="Quay lại kho công cụ"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-100 dark:bg-amber-950/60 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Share2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  AI Biến Video Thành 5 Kênh
                </h1>
                <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                  VIP ONLY
                </span>
              </div>
              <p className="text-slate-400 text-xs hidden sm:block">
                1 Video TikTok ➔ 5 Định dạng: FB Group Seeding, Fanpage Ads, Carousel Album, Blog SEO & Zalo OA.
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2">
          <AiUsageBadge tool="video-repurposer" refreshTrigger={refreshTrigger} />
          <button
            type="button"
            onClick={handleUseSample}
            className="px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkle size={13} className="fill-amber-600 text-amber-600 dark:fill-amber-400 dark:text-amber-400" />
            <span>Dùng Mẫu Thử (Demo)</span>
          </button>

          {(videoScript || productName || callToAction) && (
            <button
              type="button"
              onClick={handleResetForm}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Xóa trắng form"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Khu vực thao tác chính 2 cột */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Cột trái: Form nhập thông tin */}
        <div className="w-full lg:w-[460px] xl:w-[480px] shrink-0 flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Dữ Liệu Video Gốc</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Bắt buộc: Kịch bản & Sản phẩm</span>
          </div>

          <div className="p-3.5 flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar overscroll-contain gap-3">
            {/* 1. KỊCH BẢN / LỜI THOẠI VIDEO GỐC */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Video size={13} className="text-amber-500" /> Lời thoại / Kịch bản video đã quay: <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">TikTok, Reels, Shorts</span>
              </label>
              <textarea
                value={videoScript}
                onChange={(e) => setVideoScript(e.target.value)}
                placeholder="Dán toàn bộ lời thoại hoặc tóm tắt kịch bản video TikTok vào đây... (Bạn có thể copy phụ đề từ CapCut hoặc TikTok)"
                rows={4}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* 2. TÊN SẢN PHẨM */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Package size={13} className="text-amber-500" /> Tên sản phẩm / Dịch vụ: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="VD: Nồi chiên không dầu hơi nước Lock&Care 7L..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            {/* 3. MỤC TIÊU KÊU GỌI (CTA) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MousePointerClick size={13} className="text-amber-500" /> Mục tiêu kêu gọi sau khi đọc (CTA):
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Mong muốn lớn nhất</span>
              </label>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                placeholder="VD: Bình luận lấy link / Mua ngay trên sàn / Nhắn tin tư vấn..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 mb-1.5"
              />

              {/* Gợi ý CTA chọn nhanh */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-slate-400 font-semibold">Gợi ý nhanh:</span>
                {QUICK_CTA_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCallToAction(preset)}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-400 hover:text-amber-800 dark:hover:text-amber-300 rounded-md transition cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. PHONG CÁCH / BRAND TONE (3 DROPDOWN / CARDS) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Phong cách / Văn phong (Brand Tone):</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Phù hợp tệp khách</span>
              </label>

              <div className="grid grid-cols-1 gap-1.5">
                {BRAND_TONES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = brandTone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBrandTone(t.id)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? `${t.color} shadow-xs ring-1 ring-amber-500/40`
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-1.5 rounded-lg ${isSelected ? "bg-white/80 dark:bg-slate-900" : "bg-slate-100 dark:bg-slate-800"}`}>
                          <Icon size={14} className={isSelected ? "text-amber-600 dark:text-amber-400" : "text-slate-500"} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">{t.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{t.desc}</div>
                        </div>
                      </div>

                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-current shrink-0 opacity-80">
                        {t.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Nút Tạo 5 Định Dạng Đa Kênh */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Sparkles size={16} />
              <span>
                {loading ? "Đang Chuyển Đổi 5 Kênh..." : "Chuyển Đổi Sang 5 Định Dạng Kênh"}
              </span>
            </button>
          </div>
        </div>

        {/* Cột phải: Khung hiển thị kết quả */}
        <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
          <VideoRepurposerOutput
            result={result}
            loading={loading}
            productName={productName}
            brandTone={brandTone}
            callToAction={callToAction}
          />
        </div>
      </div>
    </div>
  );
}
