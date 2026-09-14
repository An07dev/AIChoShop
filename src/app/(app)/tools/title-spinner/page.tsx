"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  Clock,
  Send,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { TitleSpinnerOutput } from "@/components/tools/TitleSpinnerOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";

const SAMPLE_TITLE = "Áo polo nam ngắn tay cổ bẻ vải cá sấu gai cao cấp thoáng khí co giãn 4 chiều chống nhăn";

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

  const [originalTitle, setOriginalTitle] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [userQuota, setUserQuota] = useState<{
    isLogged: boolean;
    isVIP: boolean;
    remainingFree: number | null;
    dailyFreeLimit: number;
  } | null>(null);

  // Khóa cuộn trang chính trên desktop, chỉ cho phép cuộn nội bộ phần input và output
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
  };

  const handleResetForm = () => {
    setOriginalTitle("");
    setResult("");
  };

  const handleAddTag = (tag: string) => {
    setOriginalTitle((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("title-spinner", false);
    if (!hasAccess) return;

    if (!originalTitle.trim()) {
      showWarning("Vui lòng nhập Tiêu đề gốc cần nhân bản!", "Thiếu Dữ Liệu");
      return;
    }

    setLoading(true);
    setResult("");

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
    <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0 overflow-hidden">
      <GateModals />

      {/* Header & Breadcrumb thu gọn */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/tools" className="hover:text-teal-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Kho Công Cụ AI
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Nhân Bản Sản Phẩm</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
            AI Nhân Bản Chống Spam
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider">
              <Crown size={11} className="text-amber-600 dark:text-amber-400" />
              VIP TOOL
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-black px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 uppercase tracking-wide border border-teal-200 dark:border-teal-800">
              Spin Content Top 1
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AiUsageBadge tool="title-spinner" refreshTrigger={refreshTrigger} />
          <button
            type="button"
            onClick={handleUseSample}
            className="px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 text-xs font-bold hover:bg-teal-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
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

      {/* Khu vực thao tác chính 2 cột: Cả 2 cuộn độc lập, trang ngoài không cuộn */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="w-full lg:w-[440px] xl:w-[470px] shrink-0 flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Header cột trái */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-teal-500" />
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Cấu Hình Nhân Bản Tiêu Đề</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400 font-semibold">
              {originalTitle.length} ký tự
            </span>
          </div>

          {/* Form inputs cuộn nội bộ */}
          <div className="p-3.5 sm:p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain space-y-3.5">
            {/* 3 Thẻ tóm tắt tính năng */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl border border-teal-200/70 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-300">
                  <Layers size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  10 Tiêu Đề
                </div>
                <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80 mt-0.5">Xào nấu thông minh</p>
              </div>
              <div className="p-2 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Chống Quét
                </div>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">An toàn nhân bản</p>
              </div>
              <div className="p-2 rounded-xl border border-cyan-200/70 dark:border-cyan-900/40 bg-cyan-50/40 dark:bg-cyan-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900 dark:text-cyan-300">
                  <FileSpreadsheet size={13} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                  Xuất Excel
                </div>
                <p className="text-[10px] text-cyan-700/80 dark:text-cyan-400/80 mt-0.5">File .xlsx sẵn sàng</p>
              </div>
            </div>

            {/* Tiêu đề sản phẩm gốc */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tiêu Đề Sản Phẩm Gốc <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Khuyến nghị: 30 - 120 ký tự
                </span>
              </div>
              <textarea
                rows={4}
                value={originalTitle}
                onChange={(e) => setOriginalTitle(e.target.value)}
                placeholder="Dán tiêu đề sản phẩm gốc vào đây...&#10;VD: Áo thun nam polo ngắn tay cổ bẻ vải cá sấu gai cao cấp thoáng khí co giãn 4 chiều chống nhăn..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all resize-none leading-relaxed"
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
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-950/50 text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock size={13} className="text-teal-500" /> Bí quyết nhân bản Shop clone an toàn:
              </p>
              <p>• <strong>Đảo trật tự từ khóa:</strong> Thay đổi vị trí tính năng và từ phụ để tỷ lệ trùng lặp văn bản dưới 60%.</p>
              <p>• <strong>Độ dài an toàn:</strong> Tiêu đề ≤ 120 ký tự để không bị thuật toán cắt dấu "..." trên app điện thoại.</p>
            </div>
          </div>

          {/* Nút Submit ghim cố định ở đáy cột trái */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-1.5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:via-emerald-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
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
                    ⚡ Còn <strong className={userQuota.remainingFree === 0 ? "text-rose-500" : "text-emerald-500"}>{userQuota.remainingFree ?? 0}</strong>/{userQuota.dailyFreeLimit} lượt hôm nay · <Link href="/profile#pricing-section" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">Nâng cấp VIP</Link>
                  </span>
                )
              ) : (
                <span>Tài khoản miễn phí được cấp lượt dùng mỗi ngày.</span>
              )}
            </p>
          </div>
        </div>

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ NHÂN BẢN */}
        <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
          <TitleSpinnerOutput
            result={result}
            loading={loading}
            originalTitle={originalTitle}
          />
        </div>
      </div>
    </div>
  );
}
