"use client";

import { useState, useEffect, useRef } from "react";
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
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ScriptWriterOutput } from "@/components/tools/ScriptWriterOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

import {
  SAMPLE_SCRIPT_INPUTS,
  SAMPLE_SCRIPT_DATA,
  buildOfflineScriptWriterData,
  type ScriptFormat,
  type ScriptAngle,
} from "@/lib/script-writer/contract";

const SCRIPT_DRAFT_KEY = "aicho_script_writer_draft";

export default function ScriptWriterPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const [productName, setProductName] = useState("");
  const [usp, setUsp] = useState("");
  const [format, setFormat] = useState<ScriptFormat>("both");
  const [priceDeal, setPriceDeal] = useState("");
  const [scriptAngle, setScriptAngle] = useState<string>("pain_point");
  const [targetAudience, setTargetAudience] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [userQuota, setUserQuota] = useState<{
    isLogged: boolean;
    isVIP: boolean;
    remainingFree: number | null;
    dailyFreeLimit: number;
  } | null>(null);

  // Khôi phục bản nháp từ localStorage khi mở trang
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCRIPT_DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft && typeof draft === "object") {
          if (draft.productName && !productName) setProductName(draft.productName);
          if (draft.usp && !usp) setUsp(draft.usp);
          if (draft.format) setFormat(draft.format);
          if (draft.priceDeal) setPriceDeal(draft.priceDeal);
          if (draft.scriptAngle) setScriptAngle(draft.scriptAngle);
          if (draft.targetAudience) setTargetAudience(draft.targetAudience);
        }
      }
    } catch {
      // Bỏ qua lỗi truy cập localStorage
    }
  }, []);

  // Tự động lưu bản nháp sau mỗi thay đổi của người dùng
  useEffect(() => {
    if (!productName && !usp && !priceDeal && !targetAudience) return;
    try {
      const draft = {
        productName,
        usp,
        format,
        priceDeal,
        scriptAngle,
        targetAudience,
      };
      localStorage.setItem(SCRIPT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Bỏ qua lỗi vượt dung lượng storage
    }
  }, [productName, usp, format, priceDeal, scriptAngle, targetAudience]);

  // Hủy tiến trình AI khi unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

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
    setProductName(SAMPLE_SCRIPT_INPUTS.productName);
    setUsp(SAMPLE_SCRIPT_INPUTS.usp);
    setFormat(SAMPLE_SCRIPT_INPUTS.format);
    setPriceDeal(SAMPLE_SCRIPT_INPUTS.priceDeal || "");
    setScriptAngle(SAMPLE_SCRIPT_INPUTS.scriptAngle || "pain_point");
    setTargetAudience(SAMPLE_SCRIPT_INPUTS.targetAudience || "");
    setResult(JSON.stringify(SAMPLE_SCRIPT_DATA));
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setProductName("");
    setUsp("");
    setFormat("both");
    setPriceDeal("");
    setScriptAngle("pain_point");
    setTargetAudience("");
    setResult("");
    try {
      localStorage.removeItem(SCRIPT_DRAFT_KEY);
    } catch {
      // Bỏ qua
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
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
    setElapsedSeconds(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Bộ đếm thời gian thực
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Timeout bảo vệ tối đa 120 giây
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
        showAiError({
          error: "Yêu cầu đã quá thời gian phản hồi (120s). Vui lòng thử lại hoặc giảm bớt độ dài nội dung.",
        });
      }
    }, 120000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "script-writer",
          inputs: {
            productName: productName.trim(),
            usp: usp.trim(),
            format,
            priceDeal: priceDeal.trim() || undefined,
            scriptAngle: scriptAngle || undefined,
            targetAudience: targetAudience.trim() || undefined,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        if (data.code === "REQUEST_ABORTED") {
          showWarning("Đã hủy tạo kịch bản theo yêu cầu của bạn.", "Đã Hủy");
          return;
        }
        // Tự động kích hoạt Offline Blueprint dự phòng khi AI 502/503/timeout
        const offlineData = buildOfflineScriptWriterData({
          productName: productName.trim(),
          usp: usp.trim(),
          format,
          priceDeal: priceDeal.trim() || undefined,
          scriptAngle: scriptAngle || undefined,
          targetAudience: targetAudience.trim() || undefined,
        });
        setResult(JSON.stringify(offlineData));
        showWarning(
          data?.error || "Máy chủ AI phản hồi chậm hoặc đang bảo trì (502). Đã kích hoạt Bộ Kịch Bản Dự Phòng 2026!",
          "Chế Độ Dự Phòng"
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || controller.signal.aborted) {
        showWarning("Đã dừng quá trình tạo kịch bản.", "Đã Hủy");
        return;
      }
      // Tự động phục hồi khi mất kết nối mạng
      const offlineData = buildOfflineScriptWriterData({
        productName: productName.trim(),
        usp: usp.trim(),
        format,
        priceDeal: priceDeal.trim() || undefined,
        scriptAngle: scriptAngle || undefined,
        targetAudience: targetAudience.trim() || undefined,
      });
      setResult(JSON.stringify(offlineData));
      showWarning(
        "Không thể kết nối đến máy chủ AI (sự cố mạng). Đã kích hoạt Bộ Kịch Bản Dự Phòng 2026!",
        "Chế Độ Dự Phòng"
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
            <AiUsageBadge
              tool="script-writer"
              refreshTrigger={refreshTrigger}
              historyOnly
              onSelectOutput={(pastOutput) => {
                setResult(pastOutput);
                setMobileTab("result");
              }}
            />
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
            <AiUsageBadge
              tool="script-writer"
              refreshTrigger={refreshTrigger}
              onSelectOutput={(pastOutput) => {
                setResult(pastOutput);
                setMobileTab("result");
              }}
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

              {/* Lựa chọn Định dạng Kịch bản (Video ngắn / Livestream / Cả hai) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Định Dạng Kịch Bản Cần Tạo <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormat("both")}
                    className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                      format === "both"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>🎬 Cả Hai</span>
                    <span className="text-[10px] font-normal opacity-80">Video + Live</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("video_short")}
                    className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                      format === "video_short"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>🎥 Video Ngắn</span>
                    <span className="text-[10px] font-normal opacity-80">30 - 45 giây</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("livestream")}
                    className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                      format === "livestream"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>🔴 Livestream</span>
                    <span className="text-[10px] font-normal opacity-80">4 Chặng Vàng</span>
                  </button>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition-all"
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
                  rows={3}
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                  placeholder="VD: Kiềm dầu 12h, nâng tone tự nhiên không bết dính vệt trắng, kháng nước mồ hôi tối ưu khi hoạt động ngoài trời..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Giá & Ưu đãi Deal / Quà tặng */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Giá Bán &amp; Ưu Đãi Deal Chốt Đơn (Tùy chọn)
                  </label>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                    Đẩy FOMO thực tế
                  </span>
                </div>
                <input
                  type="text"
                  value={priceDeal}
                  onChange={(e) => setPriceDeal(e.target.value)}
                  placeholder="VD: Giá gốc 495k -> Deal chỉ 339k tặng túi canvas + minisize 15ml"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* Góc kịch bản & Chân dung khách hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phong Cách Kịch Bản
                  </label>
                  <select
                    value={scriptAngle}
                    onChange={(e) => setScriptAngle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition-all"
                  >
                    <option value="pain_point">🔥 Nỗi Đau &amp; Đồng Cảm</option>
                    <option value="curiosity_hook">⚡ Giật Tít &amp; Tò Mò</option>
                    <option value="review_test">🧪 Review &amp; Test Cực Hạn</option>
                    <option value="drama">🎭 Tình Huống / Drama Ngắn</option>
                    <option value="expert_comparison">💎 Chuyên Gia &amp; So Sánh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Khách Hàng Mục Tiêu
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="VD: Da dầu mụn, văn phòng, sinh viên..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Nút Submit máy tính & Hủy yêu cầu */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Sparkles size={16} className="animate-spin" /> Đang Viết Kịch Bản Phân Cảnh ({elapsedSeconds}s)...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Lên Kịch Bản Bằng AI ({format === "both" ? "Video & Live" : format === "video_short" ? "3 Kịch Bản Video" : "Kịch Bản Live"})
                    </>
                  )}
                </button>

                {loading && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/60 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                  >
                    <XCircle size={14} className="text-rose-400" /> Hủy Quá Trình Tạo
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

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ KỊCH BẢN */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden pb-16 lg:pb-0`}>
          <ScriptWriterOutput
            result={result}
            loading={loading}
            productName={productName}
            usp={usp}
            format={format}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
            onUseSample={handleUseSample}
          />
        </div>
      </div>

      {/* Mobile Floating Sticky Action Bar (chỉ hiện khi ở tab form trên mobile) */}
      {mobileTab === "form" && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 lg:hidden shadow-lg space-y-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Sparkles size={16} className="animate-spin" /> Đang Viết Kịch Bản ({elapsedSeconds}s)...
              </>
            ) : (
              <>
                <Send size={16} /> Lên Kịch Bản Bằng AI (3 Góc Quay)
              </>
            )}
          </button>

          {loading && (
            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 text-rose-400 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <XCircle size={14} /> Hủy Yêu Cầu
            </button>
          )}
        </div>
      )}
    </div>
  );
}
