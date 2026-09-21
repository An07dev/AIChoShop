"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  Send,
  Crown,
  Cpu,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { TitleSpinnerOutput } from "@/components/tools/TitleSpinnerOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

const SAMPLE_TITLE =
  "Áo polo nam ngắn tay cổ bẻ vải cá sấu gai cao cấp thoáng khí co giãn 4 chiều chống nhăn";

const SAMPLE_RESULT = `1. Áo Polo Nam Ngắn Tay Cổ Bẻ Vải Cá Sấu Gai Co Giãn 4 Chiều Thoáng Khí Chống Nhăn Cao Cấp
2. [Chính Hãng] Áo Thun Polo Nam Có Cổ Vải Cá Sấu Tổ Ong Thoáng Mát Co Giãn Tôn Dáng
3. Áo Polo Nam Cổ Bẻ Cao Cấp Vải Cotton Cá Sấu Co Giãn 4 Chiều Thấm Hút Mồ Hôi Cực Tốt
4. Áo Phông Polo Nam Tay Ngắn Cổ Bẻ Phong Cách Thể Thao Trẻ Trung Vải Cá Sấu Gai Bền Đẹp
5. [Freeship Extra] Áo Polo Nam Công Sở Lịch Lãm Chất Vải Cá Sấu Dày Dặn Không Xù Lông
6. Áo Thun Nam Polo Cổ Gập Trẻ Trung Năng Động Form Regular Fit Co Giãn 4 Chiều Thoải Mái
7. Áo Polo Nam Ngắn Tay Basic Đi Học Đi Chơi Đều Đẹp Vải Cá Sấu Cao Cấp Chống Bai Dão
8. [Giá Xưởng] Áo Polo Nam Cổ Bẻ Đẹp Chuẩn Form Vải Cá Sấu Gai Xuất Khẩu Cao Cấp
9. Áo Phông Có Cổ Nam Ngắn Tay Thoáng Khí Hè 2024 Vải Cá Sấu Co Giãn Tốt Bền Màu
10. Áo Polo Nam Cổ Bẻ Sang Trọng Tinh Tế Vải Cá Sấu Gai Mềm Mịn Thấm Hút Bảo Hành 1 Đổi 1`;

const QUICK_TAGS = [
  "Chính hãng",
  "Freeship Extra",
  "Cao cấp",
  "Giá xưởng",
  "Bảo hành 1 đổi 1",
  "Sẵn hàng",
  "Chuẩn form",
];

export default function TitleSpinnerPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

  const [originalTitle, setOriginalTitle] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
      .catch(() => {});
  }, [refreshTrigger]);

  const handleUseSample = () => {
    setOriginalTitle(SAMPLE_TITLE);
    setResult(SAMPLE_RESULT);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setOriginalTitle("");
    setResult("");
  };

  const handleAddTag = (tag: string) => {
    if (originalTitle.includes(tag)) return;
    const newTitle = originalTitle.trim() ? `[${tag}] ${originalTitle.trim()}` : `[${tag}]`;
    setOriginalTitle(newTitle);
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("title-spinner", false);
    if (!hasAccess) return;

    if (!originalTitle.trim()) {
      showWarning("Vui lòng nhập tiêu đề sản phẩm gốc!", "Thiếu Thông Tin");
      return;
    }

    if (originalTitle.trim().length < 10) {
      showWarning("Tiêu đề sản phẩm quá ngắn, vui lòng nhập ít nhất 10 ký tự.", "Tiêu Đề Ngắn");
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
          tool: "title-spinner",
          inputs: { originalTitle: originalTitle.trim() },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showAiError(data, "Có lỗi xảy ra khi gọi AI");
      }
    } catch (error: any) {
      showAiError({
        error: "Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại mạng hoặc token.",
      });
    } finally {
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
            <AiUsageBadge tool="title-spinner" refreshTrigger={refreshTrigger} historyOnly />
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
              <span className="text-slate-600 dark:text-slate-300">Nhân Bản Sản Phẩm</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/80 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-xs shrink-0">
                <Cpu size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    AI Nhân Bản Chống Spam
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
                  Nhân bản 10 biến thể tiêu đề chuẩn SEO, xáo trộn từ khóa thông minh để tránh bị sàn phạt vi phạm trùng lặp.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved exactly as original) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="title-spinner" refreshTrigger={refreshTrigger} />
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
        resultLabel="10 Tiêu Đề Spin"
      />

      {/* Grid 2 Cột: Cuộn độc lập trên Desktop, Chuyển tab trên Mobile */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div
          className={`${
            mobileTab === "form" ? "flex" : "hidden lg:flex"
          } lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}
        >
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* 3 Thẻ tóm tắt tính năng */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl border border-teal-200/70 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-300">
                    <Layers size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
                    10 Tiêu Đề
                  </div>
                  <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80 mt-0.5">
                    Xào nấu thông minh
                  </p>
                </div>
                <div className="p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    <ShieldCheck
                      size={13}
                      className="text-emerald-600 dark:text-emerald-400 shrink-0"
                    />
                    Chống Quét
                  </div>
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                    An toàn nhân bản
                  </p>
                </div>
                <div className="p-2.5 rounded-xl border border-cyan-200/70 dark:border-cyan-900/40 bg-cyan-50/40 dark:bg-cyan-950/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900 dark:text-cyan-300">
                    <FileSpreadsheet
                      size={13}
                      className="text-cyan-600 dark:text-cyan-400 shrink-0"
                    />
                    Xuất Excel
                  </div>
                  <p className="text-[10px] text-cyan-700/80 dark:text-cyan-400/80 mt-0.5">
                    File .xlsx sẵn sàng
                  </p>
                </div>
              </div>

              {/* Tiêu đề sản phẩm gốc */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tiêu Đề Sản Phẩm Gốc <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Khuyến nghị: 30 - 120 ký tự</span>
                </div>
                <textarea
                  rows={4}
                  value={originalTitle}
                  onChange={(e) => setOriginalTitle(e.target.value)}
                  placeholder="Dán tiêu đề sản phẩm gốc vào đây...&#10;VD: Áo thun nam polo ngắn tay cổ bẻ vải cá sấu gai cao cấp thoáng khí co giãn 4 chiều chống nhăn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Gợi ý chèn từ khóa kích thích mua */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Gợi ý thêm từ kích thích mua hàng:
                  </span>
                  {originalTitle && (
                    <button
                      type="button"
                      onClick={() => setOriginalTitle("")}
                      className="text-slate-400 hover:text-rose-500 transition-colors text-[11px] cursor-pointer"
                    >
                      Xóa text
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer active:scale-95"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nút Submit trong Form */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Sparkles size={16} className="animate-spin" /> Đang Xào Nấu 10 Tiêu Đề...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Nhân Bản Bằng AI (10 Biến Thể)
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
                      ⚡ Còn{" "}
                      <strong
                        className={
                          userQuota.remainingFree === 0 ? "text-rose-500" : "text-emerald-500"
                        }
                      >
                        {userQuota.remainingFree ?? 0}
                      </strong>
                      /{userQuota.dailyFreeLimit} lượt hôm nay ·{" "}
                      <Link
                        href="/profile#pricing-section"
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Nâng cấp VIP
                      </Link>
                    </span>
                  )
                ) : (
                  <span>Tài khoản miễn phí được cấp lượt dùng mỗi ngày.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ NHÂN BẢN */}
        <div
          className={`${
            mobileTab === "result" ? "flex" : "hidden lg:flex"
          } lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden pb-16 lg:pb-0`}
        >
          <TitleSpinnerOutput
            result={result}
            loading={loading}
            originalTitle={originalTitle}
            onUseSample={handleUseSample}
          />
        </div>
      </div>

      {/* Mobile Floating Sticky Action Bar (chỉ hiện khi ở tab form trên mobile) */}
      {mobileTab === "form" && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 lg:hidden shadow-lg">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Sparkles size={16} className="animate-spin" /> Đang Xào Nấu 10 Tiêu Đề...
              </>
            ) : (
              <>
                <Send size={16} /> Nhân Bản Bằng AI (10 Biến Thể)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
