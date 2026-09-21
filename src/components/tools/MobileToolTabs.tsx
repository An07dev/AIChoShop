"use client";

import { Edit3, Sparkles } from "lucide-react";

interface MobileToolTabsProps {
  activeTab: "form" | "result";
  onChangeTab: (tab: "form" | "result") => void;
  hasResult?: boolean;
  loading?: boolean;
  formLabel?: string;
  resultLabel?: string;
  className?: string;
}

export function MobileToolTabs({
  activeTab,
  onChangeTab,
  hasResult = false,
  loading = false,
  formLabel = "Nhập thông tin",
  resultLabel = "Kết quả",
  className = "",
}: MobileToolTabsProps) {
  return (
    <div
      className={`lg:hidden flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-3 border border-slate-200 dark:border-slate-700/60 shadow-2xs shrink-0 ${className}`}
    >
      <button
        type="button"
        onClick={() => onChangeTab("form")}
        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
          activeTab === "form"
            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
      >
        <Edit3 size={13} />
        <span>{formLabel}</span>
      </button>

      <button
        type="button"
        onClick={() => onChangeTab("result")}
        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none relative ${
          activeTab === "result"
            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
      >
        <Sparkles
          size={13}
          className={
            loading
              ? "text-amber-500 animate-spin"
              : hasResult
              ? "text-emerald-500"
              : ""
          }
        />
        <span>{resultLabel}</span>

        {loading && (
          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 animate-pulse">
            Đang tạo...
          </span>
        )}

        {!loading && hasResult && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
        )}
      </button>
    </div>
  );
}
