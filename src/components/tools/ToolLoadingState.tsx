"use client";

import { Sparkles, XCircle } from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

export interface LoadingStage {
  upToSeconds: number;
  text: string;
}

export interface ToolLoadingStateProps {
  elapsedSeconds?: number;
  onCancel?: () => void;
  title?: string;
  stages?: LoadingStage[];
  accentColor?: "emerald" | "purple" | "indigo" | "amber" | "cyan" | "rose" | "blue";
  minHeightClass?: string;
}

export function ToolLoadingState({
  elapsedSeconds = 0,
  onCancel,
  title = "AI Đang Xử Lý Dữ Liệu...",
  stages,
  accentColor = "emerald",
  minHeightClass = "min-h-[340px]",
}: ToolLoadingStateProps) {
  const colorMap = {
    emerald: {
      icon: "text-emerald-400",
      shadow: "shadow-emerald-950/40",
      badge: "text-emerald-300",
      progress: "from-emerald-500 via-teal-500 to-cyan-400",
    },
    purple: {
      icon: "text-purple-400",
      shadow: "shadow-purple-950/40",
      badge: "text-purple-300",
      progress: "from-purple-500 via-indigo-500 to-cyan-400",
    },
    indigo: {
      icon: "text-indigo-400",
      shadow: "shadow-indigo-950/40",
      badge: "text-indigo-300",
      progress: "from-indigo-500 via-purple-500 to-pink-400",
    },
    amber: {
      icon: "text-amber-400",
      shadow: "shadow-amber-950/40",
      badge: "text-amber-300",
      progress: "from-amber-500 via-orange-500 to-yellow-400",
    },
    cyan: {
      icon: "text-cyan-400",
      shadow: "shadow-cyan-950/40",
      badge: "text-cyan-300",
      progress: "from-cyan-500 via-teal-500 to-emerald-400",
    },
    rose: {
      icon: "text-rose-400",
      shadow: "shadow-rose-950/40",
      badge: "text-rose-300",
      progress: "from-rose-500 via-pink-500 to-purple-400",
    },
    blue: {
      icon: "text-blue-400",
      shadow: "shadow-blue-950/40",
      badge: "text-blue-300",
      progress: "from-blue-500 via-indigo-500 to-cyan-400",
    },
  }[accentColor];

  // Tìm thông điệp phù hợp theo số giây
  let activeMessage = "⚡ Đang xử lý và phân tích dữ liệu...";
  if (stages && stages.length > 0) {
    const matched = stages.find((s) => elapsedSeconds < s.upToSeconds);
    activeMessage = matched ? matched.text : stages[stages.length - 1].text;
  }

  return (
    <div className={`h-full ${minHeightClass} flex flex-col items-center justify-center text-center p-6 space-y-4`}>
      <div className="relative">
        <div className={`w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center ${colorMap.icon} shadow-lg ${colorMap.shadow}`}>
          <Sparkles size={22} className="animate-spin duration-1000" />
        </div>
        {typeof elapsedSeconds === "number" && (
          <div className={`absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-mono ${colorMap.badge}`}>
            {elapsedSeconds}s
          </div>
        )}
      </div>

      <div className="space-y-1.5 max-w-sm">
        <div className="font-bold text-sm text-white">
          <TextShimmerWave>{title}</TextShimmerWave>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed min-h-[32px]">
          {activeMessage}
        </p>
      </div>

      {/* Thanh tiến trình giả lập nhịp điệu sinh dữ liệu */}
      <div className="w-full max-w-xs bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
        <div
          className={`bg-gradient-to-r ${colorMap.progress} h-full rounded-full transition-all duration-300`}
          style={{
            width: `${Math.min(95, Math.max(5, ((elapsedSeconds || 1) / 45) * 100))}%`,
          }}
        />
      </div>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/60 text-xs font-semibold transition-all cursor-pointer active:scale-95"
        >
          <XCircle size={13} className="text-rose-400" />
          <span>Hủy yêu cầu</span>
        </button>
      )}
    </div>
  );
}
