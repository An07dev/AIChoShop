"use client";

import { useState, useEffect, useRef } from "react";
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
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { useToast } from "@/context/ToastContext";
import VideoRepurposerOutput from "@/components/tools/VideoRepurposerOutput";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";
import { SAMPLE_REPURPOSER_DATA } from "@/lib/video-repurposer/contract";

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

const SAMPLE_RESULT = JSON.stringify(SAMPLE_REPURPOSER_DATA, null, 2);

const DRAFT_STORAGE_KEY = "aichoshop_video_repurposer_draft_v1";

export default function VideoRepurposerPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning, showSuccess } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelReasonRef = useRef<"manual" | "timeout" | null>(null);

  // Form states
  const [videoScript, setVideoScript] = useState("");
  const [productName, setProductName] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [brandTone, setBrandTone] = useState("friendly");

  // 1. Phục hồi bản nháp từ localStorage khi mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.videoScript) setVideoScript(parsed.videoScript);
        if (parsed.productName) setProductName(parsed.productName);
        if (parsed.callToAction) setCallToAction(parsed.callToAction);
        if (parsed.brandTone) setBrandTone(parsed.brandTone);
        if (parsed.result) setResult(parsed.result);
      }
    } catch {
      // Bỏ qua nếu môi trường không cho phép truy cập localStorage
    }
  }, []);

  // 2. Tự động lưu bản nháp vào localStorage
  useEffect(() => {
    try {
      if (videoScript || productName || callToAction || result) {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            videoScript,
            productName,
            callToAction,
            brandTone,
            result,
          })
        );
      }
    } catch {
      // QuotaExceeded hoặc Private mode
    }
  }, [videoScript, productName, callToAction, brandTone, result]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleCancel = () => {
    cancelReasonRef.current = "manual";
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Nạp lại kết quả từ Lịch Sử hoạt động
  const handleSelectHistoryOutput = (pastOutput: string) => {
    if (!pastOutput) return;
    setResult(pastOutput);
    setMobileTab("result");
    showSuccess("Đã tải lại kết quả từ lịch sử!", "Lịch Sử Hoạt Động");
  };

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
    setResult(SAMPLE_RESULT);
    setMobileTab("result");
  };

  // Xóa trắng form & dọn draft localStorage
  const handleResetForm = () => {
    setVideoScript("");
    setProductName("");
    setCallToAction("");
    setBrandTone("friendly");
    setResult("");
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
  };

  // Submit gọi AI
  const handleGenerate = async () => {
    // Kiểm tra kết nối mạng
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showAiError({
        error: "Không có kết nối mạng Internet. Vui lòng kiểm tra lại đường truyền của bạn.",
      });
      return;
    }

    const hasAccess = await checkAccess("video-repurposer", true); // VIP Tool
    if (!hasAccess) return;

    if (!videoScript.trim()) {
      showWarning("Vui lòng dán lời thoại hoặc kịch bản video gốc!", "Thiếu Dữ Liệu");
      return;
    }

    if (videoScript.trim().length < 20) {
      showWarning("Kịch bản video quá ngắn (tối thiểu 20 ký tự) để AI có thể phân tích thành 5 kênh nội dung!", "Kịch Bản Quá Ngắn");
      return;
    }

    if (!productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm / dịch vụ!", "Thiếu Dữ Liệu");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    cancelReasonRef.current = null;

    setLoading(true);
    setElapsedSeconds(0);
    setResult("");
    setMobileTab("result");

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        cancelReasonRef.current = "timeout";
        controller.abort();
        showAiError({
          code: "TIMEOUT",
          error: "Yêu cầu chuyển đổi đa kênh đã quá thời gian phản hồi (120s). Vui lòng thử lại hoặc rút ngắn kịch bản video.",
        });
      }
    }, 120000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
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
      if (err?.name === "AbortError" || controller.signal.aborted) {
        // Chỉ thông báo Đã Hủy nếu người dùng chủ động bấm Hủy, tránh đè thông báo timeout
        if (cancelReasonRef.current === "manual") {
          showWarning("Đã dừng quá trình chuyển đổi nội dung theo yêu cầu của bạn.", "Đã Hủy");
        }
        return;
      }
      showAiError({ error: err?.message || "Lỗi mạng hoặc kết nối máy chủ thất bại." });
    } finally {
      clearTimeout(timeoutId);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 h-full lg:overflow-hidden pb-3">
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
            <AiUsageBadge
              tool="video-repurposer"
              refreshTrigger={refreshTrigger}
              historyOnly
              onSelectOutput={handleSelectHistoryOutput}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            {/* Desktop Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/tools" className="hover:text-pink-600 transition-colors flex items-center gap-1 text-slate-500">
                <ArrowLeft size={13} /> Kho Công Cụ AI
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Sáng Tạo Đa Kênh</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-800/80 flex items-center justify-center text-pink-600 dark:text-pink-400 shadow-xs shrink-0">
                <Share2 size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    AI Biến Video Thành 5 Kênh
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
                  Chuyển hóa kịch bản video TikTok thành 5 bài đăng chất lượng cao
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved exactly as original) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge
              tool="video-repurposer"
              refreshTrigger={refreshTrigger}
              onSelectOutput={handleSelectHistoryOutput}
            />
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
        resultLabel="Nội Dung 5 Kênh"
      />

      {/* Grid 2 Cột: Cuộn độc lập */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP LIỆU (cuộn độc lập) */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
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

              {/* Nút Submit + Hủy */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Share2 size={16} className="animate-spin text-white" />
                      <span>Đang Chuyển Đổi ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Chuyển Đổi Sang 5 Định Dạng Kênh
                    </>
                  )}
                </button>

                {loading && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3.5 py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                    title="Hủy yêu cầu"
                  >
                    <XCircle size={16} />
                    <span>Hủy</span>
                  </button>
                )}
              </div>

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
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>

          <VideoRepurposerOutput
            result={result}
            loading={loading}
            productName={productName}
            brandTone={brandTone}
            callToAction={callToAction}
            onUseSample={handleUseSample}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
