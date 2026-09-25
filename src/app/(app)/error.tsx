"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("[System Error Boundary Captured]:", error);
  }, [error]);

  return (
    <div className="flex-1 w-full min-h-[500px] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
          <AlertTriangle size={32} />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-black text-white">
            Hệ Thống Đang Gặp Sự Cố Tạm Thời
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Một lỗi không mong muốn đã xảy ra trong quá trình xử lý giao diện. Đừng lo lắng, phiên làm việc của bạn vẫn được bảo vệ an toàn.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <RotateCcw size={15} /> Thử Lại Ngay
          </button>

          <Link
            href="/tools"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Sparkles size={15} className="text-emerald-400" /> Kho Công Cụ AI
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold flex items-center justify-center transition-all"
            title="Về Trang Chủ"
          >
            <Home size={16} />
          </Link>
        </div>

        {/* Technical Details Toggle */}
        <div className="pt-4 border-t border-slate-800/80 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <span>Thông tin kỹ thuật (Mã lỗi &amp; Digest)</span>
            {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showDetails && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-rose-300 break-all space-y-1">
              <p>Lỗi: {error.message || "Unknown client error"}</p>
              {error.digest && <p className="text-slate-500">Digest: {error.digest}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
