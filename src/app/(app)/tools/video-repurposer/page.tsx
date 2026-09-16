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
  Crown,
  ClipboardPaste,
  Trash2,
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
  },
  {
    id: "gen_z",
    name: "Hài Hước & Gen Z",
    desc: "Bắt trend, viral, dí dỏm, năng động",
    icon: Smile,
    badge: "Viral Bắt Trend",
  },
  {
    id: "expert",
    name: "Chuyên Gia Uy Tín",
    desc: "Chuyên sâu, logic, phân tích khách quan",
    icon: GraduationCap,
    badge: "Độ Tin Cậy Cao",
  },
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

  // Dán nhanh từ bộ nhớ tạm
  const handlePasteScript = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setVideoScript(text);
      }
    } catch {
      // Clipboard denied or unsupported
    }
  };

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
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 h-full lg:overflow-hidden pb-3">
      <GateModals />

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/tools" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Kho Công Cụ AI
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Sáng Tạo Đa Kênh</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
            AI Biến Video Thành 5 Kênh
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider">
              <Crown size={11} className="text-amber-600 dark:text-amber-400" />
              VIP TOOL
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Chuyển hóa kịch bản video TikTok thành 5 bài đăng chất lượng cao
          </p>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2 shrink-0">
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

      {/* Grid 2 Cột: Cuộn độc lập */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP LIỆU (cuộn độc lập) */}
        <div className="lg:col-span-5 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* Header Khối Form */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs">
                    <Video size={16} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                      Dữ Liệu Video Gốc
                    </h2>

                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  5 Định Dạng
                </span>
              </div>

              {/* 1. KỊCH BẢN / LỜI THOẠI VIDEO GỐC */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>Lời Thoại / Kịch Bản Gốc</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {videoScript && (
                      <button
                        type="button"
                        onClick={() => setVideoScript("")}
                        className="text-[10px] text-slate-400 hover:text-rose-500 transition cursor-pointer flex items-center gap-1 font-medium"
                      >
                        <Trash2 size={11} /> Xóa
                      </button>
                    )}
                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {videoScript.trim() ? `${videoScript.trim().split(/\s+/).filter(Boolean).length} từ` : "TikTok / Reels"}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={videoScript}
                    onChange={(e) => setVideoScript(e.target.value)}
                    placeholder="Dán toàn bộ lời thoại hoặc kịch bản video TikTok vào đây... (Có thể copy phụ đề từ CapCut hoặc TikTok Studio)"
                    rows={5}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all resize-none leading-relaxed shadow-2xs"
                  />
                  {!videoScript && (
                    <button
                      type="button"
                      onClick={handlePasteScript}
                      className="absolute right-2.5 bottom-3.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer shadow-xs"
                      title="Dán nhanh từ clipboard"
                    >
                      <ClipboardPaste size={12} /> Dán nhanh
                    </button>
                  )}
                </div>
              </div>

              {/* 2. TÊN SẢN PHẨM */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Package size={13} className="text-emerald-500" />
                    <span>Tên Sản Phẩm / Dịch Vụ</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">Sản phẩm cần bán</span>
                </div>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="VD: Nồi chiên không dầu hơi nước Lock&Care 7L..."
                  className="w-full h-[40px] px-3.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all shadow-2xs"
                />
              </div>

              {/* 3. MỤC TIÊU KÊU GỌI (CTA) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MousePointerClick size={13} className="text-emerald-500" />
                    <span>Mục Tiêu Kêu Gọi (CTA)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">Hành động mong muốn</span>
                </div>
                <input
                  type="text"
                  value={callToAction}
                  onChange={(e) => setCallToAction(e.target.value)}
                  placeholder="VD: Bình luận lấy mã giảm 200k & link mua / Nhắn tin tư vấn..."
                  className="w-full h-[40px] px-3.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all shadow-2xs"
                />
              </div>

              {/* 4. PHONG CÁCH / BRAND TONE */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Phong Cách / Văn Phong (Brand Tone)
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Phù hợp tệp khách
                  </span>
                </div>

                <div className="space-y-2">
                  {BRAND_TONES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = brandTone === t.id;
                    return (
                      <div
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setBrandTone(t.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setBrandTone(t.id);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${isSelected
                          ? "border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs ring-1.5 ring-emerald-500/30"
                          : "border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {t.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {t.desc}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isSelected
                              ? "bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                              }`}
                          >
                            {t.badge}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected
                              ? "border-emerald-600 bg-emerald-600"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                              }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nút Submit */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
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
          </div>
        </div>

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ 5 KÊNH (cuộn độc lập) */}
        <div className="lg:col-span-7 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
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
