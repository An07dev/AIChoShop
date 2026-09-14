"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Video,
  Flame,
  Film,
  FileSpreadsheet,
  Clock,
  Send,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ScriptWriterOutput } from "@/components/tools/ScriptWriterOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";

const SAMPLE_DATA = {
  productName: "Kem Chống Nắng La Roche-Posay Anthelios Khô Thoáng Giảm Dầu SPF50+",
  usp: "Màng lọc Mexoplex độc quyền kiềm dầu 12h, nâng tone tự nhiên không bết dính vệt trắng, kháng nước và mồ hôi tối ưu",
};

const QUICK_TAGS = [
  "Flash Sale 50%",
  "Tặng quà độc quyền",
  "Chính hãng 100%",
  "Đổi trả 7 ngày",
  "Freeship 0đ",
  "Giảm sâu trên Live",
];

export default function ScriptWriterPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const [productName, setProductName] = useState("");
  const [usp, setUsp] = useState("");
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
    setProductName(SAMPLE_DATA.productName);
    setUsp(SAMPLE_DATA.usp);
  };

  const handleResetForm = () => {
    setProductName("");
    setUsp("");
    setResult("");
  };

  const handleAddUspTag = (tag: string) => {
    setUsp((prev) => (prev ? `${prev}, ${tag}` : tag));
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

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "script-writer",
          inputs: { productName: productName.trim(), usp: usp.trim() },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showAiError(data, "Có lỗi xảy ra khi tạo kịch bản video");
      }
    } catch (error) {
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
            <Link href="/tools" className="hover:text-purple-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Kho Công Cụ AI
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Sáng Tạo Video Ngắn</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
            AI Kịch Bản Video/Live
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider">
              <Crown size={11} className="text-amber-600 dark:text-amber-400" />
              VIP TOOL
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 uppercase tracking-wide border border-purple-200 dark:border-purple-800">
              Hook 3s Triệu View
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AiUsageBadge tool="script-writer" refreshTrigger={refreshTrigger} />
          <button
            type="button"
            onClick={handleUseSample}
            className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 text-xs font-bold hover:bg-purple-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
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
              <Video size={15} className="text-purple-500" />
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Thông Tin Sản Phẩm</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">TikTok & Reels</span>
          </div>

          {/* Form inputs cuộn nội bộ */}
          <div className="p-3.5 sm:p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain space-y-3.5">
            {/* 3 Thẻ tóm tắt tính năng */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl border border-purple-200/70 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
                  <Flame size={13} className="text-amber-500 shrink-0" />
                  3 Kịch Bản
                </div>
                <p className="text-[10px] text-purple-700/80 dark:text-purple-400/80 mt-0.5">3 góc tiếp cận</p>
              </div>
              <div className="p-2 rounded-xl border border-indigo-200/70 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  <Film size={13} className="text-indigo-500 shrink-0" />
                  Phân Cảnh
                </div>
                <p className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80 mt-0.5">Thoại & góc quay</p>
              </div>
              <div className="p-2 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <FileSpreadsheet size={13} className="text-emerald-500 shrink-0" />
                  Xuất Excel
                </div>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Sẵn sàng quay</p>
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
                rows={4}
                value={usp}
                onChange={(e) => setUsp(e.target.value)}
                placeholder="VD: Kiềm dầu 12h, nâng tone tự nhiên không bết dính vệt trắng, kháng nước mồ hôi tối ưu khi hoạt động ngoài trời..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Gợi ý điểm bán hàng nhanh / Quick tags */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Gợi ý thêm điểm bán & ưu đãi:
                </span>
                {(productName || usp) && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-slate-400 hover:text-rose-500 transition-colors text-[11px] cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddUspTag(tag)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/50 text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock size={13} className="text-purple-500" /> Bí quyết video ngắn giữ chân người xem:
              </p>
              <p>• <strong>Hook 3s đầu:</strong> Đặt câu hỏi sốc hoặc hành động bất ngờ ngăn người xem lướt đi.</p>
              <p>• <strong>Chữ trên video:</strong> Hơn 70% người dùng xem tắt tiếng, hãy luôn có caption to rõ.</p>
            </div>
          </div>

          {/* Nút Submit ghim cố định ở đáy cột trái */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-1.5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:via-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Sparkles size={16} className="animate-spin" /> Đang Viết 3 Kịch Bản Phân Cảnh...
                </>
              ) : (
                <>
                  <Send size={16} /> Lên Kịch Bản Bằng AI (3 Góc Quay)
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
                    ⚡ Còn <strong className={userQuota.remainingFree === 0 ? "text-rose-500" : "text-emerald-500"}>{userQuota.remainingFree ?? 0}</strong>/{userQuota.dailyFreeLimit} lượt hôm nay · <Link href="/profile#pricing-section" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">Nâng cấp VIP</Link>
                  </span>
                )
              ) : (
                <span>Tài khoản miễn phí được cấp lượt dùng mỗi ngày.</span>
              )}
            </p>
          </div>
        </div>

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ KỊCH BẢN */}
        <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
          <ScriptWriterOutput
            result={result}
            loading={loading}
            productName={productName}
            usp={usp}
          />
        </div>
      </div>
    </div>
  );
}
