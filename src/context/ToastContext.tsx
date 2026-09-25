"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  X,
  Copy,
  Check,
  Key,
} from "lucide-react";

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  code?: string;
  actionUrl?: string;
  actionLabel?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => string;
  showError: (message: string, title?: string, options?: Partial<ToastItem>) => string;
  showSuccess: (message: string, title?: string, options?: Partial<ToastItem>) => string;
  showWarning: (message: string, title?: string, options?: Partial<ToastItem>) => string;
  showAiError: (errorData: unknown, fallbackMessage?: string) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const duration = toast.duration ?? (toast.type === "error" ? 8000 : 4500);

      const newToast: ToastItem = {
        ...toast,
        id,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const showError = useCallback(
    (message: string, title?: string, options?: Partial<ToastItem>) => {
      return showToast({
        type: "error",
        title: title || "Đã Xảy Ra Lỗi",
        message,
        ...options,
      });
    },
    [showToast]
  );

  const showSuccess = useCallback(
    (message: string, title?: string, options?: Partial<ToastItem>) => {
      return showToast({
        type: "success",
        title: title || "Thành Công",
        message,
        ...options,
      });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string, options?: Partial<ToastItem>) => {
      return showToast({
        type: "warning",
        title: title || "Cảnh Báo",
        message,
        ...options,
      });
    },
    [showToast]
  );

  /**
   * Helper chuyên biệt để hiển thị lỗi từ API OpenAI
   */
  const showAiError = useCallback(
    (errorData: unknown, fallbackMessage?: string) => {
      let message = fallbackMessage || "Không thể hoàn thành yêu cầu gọi AI.";
      let title = "Lỗi Gọi OpenAI API";
      let code: string | undefined = undefined;
      let actionUrl: string | undefined = undefined;
      let actionLabel: string | undefined = undefined;

      if (typeof errorData === "string") {
        message = errorData;
      } else if (errorData && typeof errorData === "object") {
        const errObj = errorData as Record<string, unknown>;
        message = (errObj.error as string) || (errObj.message as string) || message;
        code = errObj.code as string | undefined;
        actionUrl = (errObj.details as { actionUrl?: string } | undefined)?.actionUrl;
      }

      // Nhận diện mã lỗi để đặt tiêu đề và nút hỗ trợ thông minh
      if (code === "MISSING_TOKEN" || message.includes("Chưa cấu hình OpenAI API Key")) {
        title = "Chưa Cấu Hình OpenAI Token";
        actionUrl = "/admin/settings";
        actionLabel = "Đi đến Cài Đặt Key";
      } else if (code === "INVALID_TOKEN" || message.includes("401") || message.includes("Incorrect API key")) {
        title = "OpenAI Token Không Hợp Lệ (401)";
        actionUrl = "/admin/settings";
        actionLabel = "Đổi Token Tại Cài Đặt";
      } else if (code === "EXPIRED_QUOTA" || message.includes("429") || message.includes("insufficient_quota")) {
        title = "Hết Hạn Ngạch Quota / Credits (429)";
        actionUrl = "/admin/settings";
        actionLabel = "Đổi Token Khác";
      } else if (code === "MODEL_NOT_FOUND" || message.includes("404")) {
        title = "Không Tìm Thấy Model AI (404)";
        actionUrl = "/admin/settings";
        actionLabel = "Chọn Lại Model";
      } else if (code === "AI_BOTH_PROVIDERS_UNAVAILABLE" || code === "AI_ALL_PROVIDERS_FAILED" || message.includes("Cả 2 phương án")) {
        title = "Tất Cả Dịch Vụ AI Đều Gián Đoạn";
        actionUrl = "/admin/settings";
        actionLabel = "Kiểm Tra Cài Đặt AI";
      } else if (code === "SERVER_OVERLOAD" || message.includes("500") || message.includes("503")) {
        title = "Máy Chủ AI Đang Quá Tải";
      } else if (code === "NETWORK_ERROR") {
        title = "Lỗi Kết Nối Mạng Đến AI";
      }

      return showToast({
        type: "error",
        title,
        message,
        code,
        actionUrl,
        actionLabel,
        duration: 9000,
      });
    },
    [showToast]
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showError,
        showSuccess,
        showWarning,
        showAiError,
        removeToast,
      }}
    >
      {children}

      {/* Cụm hiển thị Toast trên màn hình */}
      <div className="fixed top-5 right-4 sm:right-6 z-[99999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const isSuccess = toast.type === "success";
          const isWarning = toast.type === "warning";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
                isError
                  ? "bg-slate-950/95 border-rose-500/40 text-slate-100 ring-1 ring-rose-500/20 shadow-rose-950/30"
                  : isSuccess
                  ? "bg-slate-950/95 border-emerald-500/40 text-slate-100 ring-1 ring-emerald-500/20 shadow-emerald-950/30"
                  : isWarning
                  ? "bg-slate-950/95 border-amber-500/40 text-slate-100 ring-1 ring-amber-500/20 shadow-amber-950/30"
                  : "bg-slate-950/95 border-blue-500/40 text-slate-100 ring-1 ring-blue-500/20"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon Trạng Thái */}
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    isError
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : isSuccess
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : isWarning
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}
                >
                  {isError && <XCircle size={18} className="text-rose-400" />}
                  {isSuccess && <CheckCircle2 size={18} className="text-emerald-400" />}
                  {isWarning && <AlertTriangle size={18} className="text-amber-400" />}
                  {toast.type === "info" && <Info size={18} className="text-blue-400" />}
                </div>

                {/* Nội Dung */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h5
                      className={`font-black text-xs sm:text-sm leading-tight ${
                        isError ? "text-rose-300" : isSuccess ? "text-emerald-300" : "text-white"
                      }`}
                    >
                      {toast.title || (isError ? "Lỗi OpenAI" : "Thông báo")}
                    </h5>

                    {toast.code && (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                        {toast.code}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {toast.message}
                  </p>

                  {/* Hành động nhanh nếu có */}
                  {(toast.actionUrl || isError) && (
                    <div className="pt-2 flex items-center gap-2 flex-wrap">
                      {toast.actionUrl && (
                        <Link
                          href={toast.actionUrl}
                          onClick={() => removeToast(toast.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition"
                        >
                          <Key size={12} />
                          <span>{toast.actionLabel || "Đến Cài Đặt Hệ Thống"}</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopy(toast.id, toast.message)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
                        title="Sao chép nội dung lỗi"
                      >
                        {copiedId === toast.id ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span className="text-emerald-400">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Sao chép log</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Nút Đóng */}
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer shrink-0"
                  title="Đóng thông báo"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
