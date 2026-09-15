"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Share2,
  Video,
  Package,
  MousePointerClick,
  Smile,
  GraduationCap,
  HeartHandshake,
  Send,
  Clock,
  Zap,
  FileSpreadsheet,
  Crown,
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
      showWarning("Vui lòng dán lời thoại hoặc kịch bản video gốc!", "Thiếu Dữ Liệu");
      return;
    }
    if (!productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm / dịch vụ!", "Thiếu Dữ Liệu");
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
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <GateModals />

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/tools" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Kho Công Cụ AI
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Sáng Tạo Đa Kênh</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
            AI Biến Video Thành 5 Kênh
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider">
              <Crown size={11} className="text-amber-600 dark:text-amber-400" />
              VIP TOOL
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 uppercase tracking-wide border border-amber-200 dark:border-amber-800">
              Omnichannel 5-in-1
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Chuyển hóa kịch bản video TikTok thành 5 bài đăng chất lượng cao          </p>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2">
          <AiUsageBadge tool="video-repurposer" refreshTrigger={refreshTrigger} />
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

      {/* Grid 2 Cột: Cấu hình bên trái & Output bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            {/* 3 Thẻ tóm tắt tính năng */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <Share2 size={13} className="text-amber-500 shrink-0" />
                  5 Kênh
                </div>
                <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">FB, Blog, Zalo...</p>
              </div>
              <div className="p-2.5 rounded-xl border border-orange-200/70 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900 dark:text-orange-300">
                  <Zap size={13} className="text-orange-500 shrink-0" />
                  Chuẩn Sàn
                </div>
                <p className="text-[10px] text-orange-700/80 dark:text-orange-400/80 mt-0.5">Tránh quét spam</p>
              </div>
              <div className="p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <FileSpreadsheet size={13} className="text-emerald-500 shrink-0" />
                  Xuất Excel
                </div>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Đăng đa kênh</p>
              </div>
            </div>

            {/* 1. KỊCH BẢN / LỜI THOẠI VIDEO GỐC */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Video size={13} className="text-emerald-500" /> Lời Thoại / Kịch Bản Gốc <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  TikTok, Reels, Shorts
                </span>
              </div>
              <textarea
                value={videoScript}
                onChange={(e) => setVideoScript(e.target.value)}
                placeholder="Dán toàn bộ lời thoại hoặc kịch bản video TikTok vào đây... (Bạn có thể copy phụ đề từ CapCut hoặc TikTok)"
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none leading-relaxed"
              />
            </div>

            {/* 2. TÊN SẢN PHẨM */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Package size={13} className="text-emerald-500" /> Tên Sản Phẩm / Dịch Vụ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="VD: Nồi chiên không dầu hơi nước Lock&Care 7L..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
              />
            </div>

            {/* 3. MỤC TIÊU KÊU GỌI (CTA) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MousePointerClick size={13} className="text-emerald-500" /> Mục Tiêu Kêu Gọi Sau Khi Đọc (CTA)
                </label>
                <span className="text-[10px] text-slate-400">
                  Hành động mong muốn
                </span>
              </div>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                placeholder="VD: Bình luận lấy mã giảm 200k & link mua / Nhắn tin tư vấn..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all mb-2"
              />

              {/* Gợi ý CTA chọn nhanh */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-slate-400 font-semibold">Gợi ý nhanh:</span>
                {QUICK_CTA_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCallToAction(preset)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. PHONG CÁCH / BRAND TONE (3 CARDS) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Phong Cách / Văn Phong (Brand Tone)
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Phù hợp tệp khách
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {BRAND_TONES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = brandTone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBrandTone(t.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${isSelected
                        ? `${t.color} shadow-xs ring-1 ring-emerald-500/40`
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg ${isSelected ? "bg-white/80 dark:bg-slate-900" : "bg-slate-100 dark:bg-slate-800"}`}>
                          <Icon size={14} className={isSelected ? "text-amber-600 dark:text-amber-400" : "text-slate-500"} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">{t.name}</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{t.desc}</div>
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

            {/* Nút Submit */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Share2 size={16} className="animate-spin" /> Đang Chuyển Đổi 5 Kênh...
                </>
              ) : (
                <>
                  <Send size={16} /> Chuyển Đổi Sang 5 Định Dạng Kênh
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

          {/* Tips Card */}
          <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock size={13} className="text-emerald-500" /> Bí quyết phân phối nội dung đa kênh:
            </p>
            <p>• <strong>FB Group Seeding:</strong> Giữ văn phong tự nhiên dạng chia sẻ trải nghiệm thật, không gắn link trực tiếp trên bài để tránh bóp tương tác.</p>
            <p>• <strong>Fanpage & Carousel:</strong> Tối ưu tiêu đề 3 giây đầu để giữ chân người xem lướt slide và chủ động nhắn tin.</p>
          </div>
        </div>

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ 5 KÊNH */}
        <div className="lg:col-span-7 min-h-[520px]">
          <VideoRepurposerOutput
            result={result}
            loading={loading}
            productName={productName}
            brandTone={brandTone}
            callToAction={callToAction}
            onUseSample={handleUseSample}
          />
        </div>
      </div>
    </div>
  );
}
