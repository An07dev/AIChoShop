"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  ShieldAlert,
  Send,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { PolicyCheckerOutput } from "@/components/tools/PolicyCheckerOutput";
import { scanTextForViolations, sanitizePolicyInput, ScanReport } from "@/lib/policy-blacklist/dictionary";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

import {
  SAMPLE_POLICY_INPUT,
  SAMPLE_POLICY_DATA,
  buildOfflinePolicyData,
} from "@/lib/policy-checker/contract";

const PLATFORMS = [
  { id: "TikTok Shop", label: "TikTok Shop (Kiểm duyệt gắt gao nhất)" },
  { id: "Shopee", label: "Shopee" },
  { id: "Facebook Ads", label: "Facebook Ads / Fanpage" },
  { id: "Lazada", label: "Lazada" },
];

const CONTENT_TYPES = [
  "Mô tả sản phẩm (Product Description)",
  "Tiêu đề sản phẩm (Product Title)",
  "Kịch bản Video / Livestream",
  "Tin nhắn Chat chăm sóc khách",
];

export default function PolicyCheckerPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Form states
  const [platform, setPlatform] = useState("TikTok Shop");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [text, setText] = useState("");

  const [scanReport, setScanReport] = useState<ScanReport | null>(null);
  const [aiOutput, setAiOutput] = useState<string | null>(null);

  // Khôi phục bản nháp từ localStorage khi vào trang
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aicho_policy_checker_draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft && typeof draft.text === "string" && draft.text.trim()) {
          setText(draft.text);
          if (draft.platform) setPlatform(draft.platform);
          if (draft.contentType) setContentType(draft.contentType);
          const instant = scanTextForViolations(draft.text);
          setScanReport(instant);
        }
      }
    } catch {
      // Bỏ qua lỗi truy cập storage
    }
  }, []);

  // Tự động lưu bản nháp với debounce 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        if (text && text.trim()) {
          localStorage.setItem(
            "aicho_policy_checker_draft",
            JSON.stringify({
              platform,
              contentType,
              text,
              updatedAt: Date.now(),
            })
          );
        }
      } catch {
        // Quota exceeded
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [text, platform, contentType]);

  // Quét nhanh từ điển Regex tự động khi người dùng gõ (debounce 300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!text.trim()) {
        setScanReport(null);
        return;
      }
      const report = scanTextForViolations(text);
      setScanReport(report);
    }, 300);

    return () => clearTimeout(handler);
  }, [text]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleUseSample = () => {
    setText(SAMPLE_POLICY_INPUT.text);
    setPlatform(SAMPLE_POLICY_INPUT.platform);
    setContentType(CONTENT_TYPES[0]);
    setIsOfflineMode(false);
    const instantReport = scanTextForViolations(SAMPLE_POLICY_INPUT.text);
    setScanReport(instantReport);
    setAiOutput(JSON.stringify(SAMPLE_POLICY_DATA));
  };

  const handleResetForm = () => {
    setText("");
    setScanReport(null);
    setAiOutput(null);
    setIsOfflineMode(false);
    try {
      localStorage.removeItem("aicho_policy_checker_draft");
    } catch {
      // ignore
    }
  };

  const handleScan = async () => {
    const hasAccess = await checkAccess("policy-checker", false);
    if (!hasAccess) return;

    const sanitizedText = sanitizePolicyInput(text, 10000);
    if (!sanitizedText.trim()) {
      showWarning("Vui lòng nhập hoặc dán nội dung cần kiểm tra vi phạm!", "Thiếu Nội Dung");
      return;
    }
    if (sanitizedText !== text) {
      setText(sanitizedText);
    }

    // 1. Quét tức thì qua từ điển Regex
    const instantReport = scanTextForViolations(sanitizedText);
    setScanReport(instantReport);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 2. Gọi AI để phân tích ngữ cảnh sâu và viết lại bản an toàn
    setLoading(true);
    setElapsedSeconds(0);
    setAiOutput(null);
    setIsOfflineMode(false);
    setMobileTab("result");

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
        // Quá thời gian -> kích hoạt Offline Engine liền mạch
        const offlineData = buildOfflinePolicyData(sanitizedText, platform, contentType);
        setAiOutput(JSON.stringify(offlineData));
        setIsOfflineMode(true);
        showWarning(
          "Yêu cầu AI quá thời gian phản hồi. Đã kích hoạt báo cáo quét Ngoại Tuyến an toàn.",
          "Chế Độ Ngoại Tuyến"
        );
      }
    }, 120000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          tool: "policy-checker",
          inputs: {
            platform,
            contentType,
            text: sanitizedText,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Fallback sang Offline Engine thay vì màn hình trống
        const offlineData = buildOfflinePolicyData(sanitizedText, platform, contentType);
        setAiOutput(JSON.stringify(offlineData));
        setIsOfflineMode(true);
        showWarning(
          data?.error || "Máy chủ AI đang bảo trì. Đã kích hoạt chế độ Quét Ngoại Tuyến với từ điển chính sách sàn 2026.",
          "Chế Độ Ngoại Tuyến"
        );
        return;
      }

      setAiOutput(data.data);
      setIsOfflineMode(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      if (error?.name === "AbortError" || controller.signal.aborted) {
        showWarning("Đã dừng quá trình quét chính sách theo yêu cầu của bạn.", "Đã Hủy");
        return;
      }
      // Offline fallback khi mất mạng hoặc lỗi kết nối
      const offlineData = buildOfflinePolicyData(sanitizedText, platform, contentType);
      setAiOutput(JSON.stringify(offlineData));
      setIsOfflineMode(true);
      showWarning(
        "Không thể kết nối đến máy chủ AI (mất mạng). Đã kích hoạt chế độ Quét Ngoại Tuyến với từ điển 2026.",
        "Chế Độ Ngoại Tuyến"
      );
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
    <div className="max-w-7xl w-full mx-auto lg:flex-1 flex flex-col lg:min-h-0 lg:h-full lg:overflow-hidden pb-3">
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
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-2xs">
              <Sparkles size={12} className="text-emerald-600 dark:text-emerald-400" />
              FREE
            </span>
            <AiUsageBadge tool="policy-checker" refreshTrigger={refreshTrigger} historyOnly />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            {/* Desktop Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/tools" className="hover:text-red-600 transition-colors flex items-center gap-1 text-slate-500">
                <ArrowLeft size={13} /> Kho Công Cụ AI
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Vận Hành & Xử Lý Rủi Ro</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full sm:rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/80 flex items-center justify-center text-rose-500 dark:text-rose-400 shadow-xs shrink-0">
                <ShieldAlert size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    AI Soi Từ Khóa Cấm
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
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-xs uppercase tracking-wider shrink-0">
                    <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400" />
                    FREE TOOL
                  </span>
                </div>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Rà soát 100% từ cấm theo luật kiểm duyệt TikTok Shop, Shopee, chấm điểm rủi ro và tự động viết lại bản an toàn.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="policy-checker" refreshTrigger={refreshTrigger} />
            <button
              type="button"
              onClick={handleUseSample}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
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
        hasResult={Boolean(aiOutput)}
        loading={loading}
        resultLabel="Báo Cáo Vi Phạm"
      />

      {/* Grid 2 cột: Trái nhập liệu - Phải hiển thị Output (Cuộn độc lập trên Desktop, Chuyển tab trên Mobile) */}
      <div className="lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-start lg:items-stretch">
        {/* CỘT TRÁI: FORM NHẬP NỘI DUNG */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col lg:min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* Header Khối Form */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center font-bold shadow-2xs">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                      Nội Dung Rà Soát
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800">
                  Chính Sách 2026
                </span>
              </div>

              {/* 1. CHỌN SÀN KIỂM DUYỆT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nền Tảng Đăng Tải
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => {
                    const isSelected = platform === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatform(p.id)}
                        className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          }`}
                      >
                        <div className="leading-tight">{p.id}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 truncate">
                          {p.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. CHỌN LOẠI NỘI DUNG */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Loại Nội Dung Quét
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                >
                  {CONTENT_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. KHUNG NHẬP NỘI DUNG */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Nội Dung Cần Soi <span className="text-rose-500">*</span></span>
                  <span
                    className={`text-[10px] font-mono transition-colors ${
                      text.length >= 9000
                        ? "text-rose-500 font-bold"
                        : text.length >= 6000
                        ? "text-amber-500 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {text.length.toLocaleString()} / 10,000 ký tự
                    {text.length >= 9000 && " (Gần đạt giới hạn)"}
                    {text.length >= 6000 && text.length < 9000 && " (Khuyên dùng < 6k)"}
                  </span>
                </label>
                <textarea
                  rows={9}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={10000}
                  placeholder="Dán tiêu đề, mô tả sản phẩm, kịch bản video hoặc nội dung quảng cáo bạn chuẩn bị đăng lên sàn vào đây..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none leading-relaxed"
                />

                {/* Mini Instant Scanner Alert below textarea */}
                {scanReport && scanReport.matches.length > 0 && !aiOutput && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="shrink-0 text-amber-500 font-bold">⚡</span>
                      <span className="truncate">
                        Phát hiện nhanh: <strong>{scanReport.matches.length} từ vi phạm</strong> (
                        {Array.from(new Set(scanReport.matches.map((m) => m.matchedText))).slice(0, 3).join(", ")}
                        {scanReport.matches.length > 3 ? "..." : ""})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleScan}
                      className="shrink-0 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Bấm quét ngay &rarr;
                    </button>
                  </div>
                )}
              </div>

              {/* NÚT SUBMIT + HỦY */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Sparkles size={16} className="animate-spin text-white" />
                      <span>Đang Soi Từ Khóa ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={16} /> Quét Vi Phạm &amp; Đề Xuất Bản Sạch
                    </>
                  )}
                </button>

                {loading && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3.5 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                    title="Hủy yêu cầu"
                  >
                    <XCircle size={16} />
                    <span>Hủy</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tips Policy */}
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col w-full lg:min-h-0 lg:h-full lg:overflow-hidden pb-20 lg:pb-0`}>
          <PolicyCheckerOutput
            scanReport={scanReport}
            aiOutput={aiOutput}
            isLoading={loading}
            platform={platform}
            isOfflineMode={isOfflineMode}
            onUseSample={handleUseSample}
            onApplySafeText={(cleanText) => setText(cleanText)}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
            onRetryWithAi={handleScan}
          />
        </div>
      </div>
    </div>
  );
}
