"use client";

import { useState } from "react";
import {
  Settings,
  Sun,
  Moon,
  Lock,
  Key,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  Palette,
  Shield,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useTheme, THEME_COLOR_OPTIONS, ThemeColor, ThemeMode } from "@/context/ThemeContext";
import { changeUserPassword } from "@/app/actions/profile";

interface SettingsManagerProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isVIP: boolean;
  };
}

export function SettingsManager({ user }: SettingsManagerProps) {
  const { themeMode, themeColor, setThemeMode, setThemeColor } = useTheme();

  // State đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "Vui lòng nhập đầy đủ các trường mật khẩu." });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      return;
    }

    setIsChangingPassword(true);
    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    try {
      const res = await changeUserPassword(formData);
      setIsChangingPassword(false);
      if (res.success) {
        setPasswordMessage({ type: "success", text: res.message || "Đổi mật khẩu thành công!" });
        showToast("Đổi mật khẩu thành công! 🔒");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ type: "error", text: res.error || "Không thể đổi mật khẩu." });
        showToast(res.error || "Đổi mật khẩu thất bại", "error");
      }
    } catch (err: any) {
      setIsChangingPassword(false);
      setPasswordMessage({ type: "error", text: err.message || "Lỗi kết nối máy chủ" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === "success"
              ? "bg-slate-900 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-950 text-rose-300 border border-rose-500/20"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand text-white shadow-sm">
            <Settings size={22} />
          </div>
          Cài Đặt Hệ Thống
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Tùy biến giao diện hiển thị và quản lý bảo mật cho tài khoản của bạn.
        </p>
      </div>

      {/* ── CARD 1: TÙY CHỈNH THEME & MÀU SẮC GIAO DIỆN ────────────────────────── */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-light text-brand">
            <Palette size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Giao Diện & Màu Sắc
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn chế độ hiển thị Sáng/Tối và màu sắc chủ đạo yêu thích (lưu tự động vào thiết bị).
            </p>
          </div>
        </div>

        {/* 1.1 Chế độ hiển thị (Sáng / Tối) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
            1. Chế Độ Hiển Thị
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Thẻ Sáng */}
            <button
              type="button"
              onClick={() => setThemeMode("light")}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 cursor-pointer ${
                themeMode === "light"
                  ? "border-brand bg-brand-light/30 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  themeMode === "light"
                    ? "bg-amber-100 text-amber-600 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                <Sun size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Chế Độ Sáng</span>
                  {themeMode === "light" && (
                    <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[10px]">
                      <Check size={12} className="stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nền trắng sáng, thanh thoát và dễ nhìn ban ngày
                </p>
              </div>
            </button>

            {/* Thẻ Tối */}
            <button
              type="button"
              onClick={() => setThemeMode("dark")}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 cursor-pointer ${
                themeMode === "dark"
                  ? "border-brand bg-slate-800/80 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  themeMode === "dark"
                    ? "bg-indigo-950 text-indigo-400 border border-indigo-500/30 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                <Moon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Chế Độ Tối (Dark)</span>
                  {themeMode === "dark" && (
                    <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[10px]">
                      <Check size={12} className="stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nền tối êm dịu, bảo vệ mắt và tiết kiệm pin
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 1.2 Màu Sắc Chủ Đạo (Theme Accent Color) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            2. Màu Sắc Chủ Đạo
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Đơn giản chọn 1 loại màu đại diện để áp dụng cho các nút bấm, biểu tượng và liên kết.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {THEME_COLOR_OPTIONS.map((c) => {
              const isSelected = themeColor === c.id;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setThemeColor(c.id);
                    showToast(`Đã đổi màu chủ đạo thành ${c.name}`);
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? "border-brand bg-brand-light/30 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-xs shrink-0"
                    style={{ backgroundColor: c.colorHex }}
                  >
                    {isSelected && <Check size={14} className="stroke-[3]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                      {c.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {c.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Preview nút với màu đang chọn */}
          <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand" /> Demo màu hiển thị:
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-brand-light text-brand font-bold text-[11px]">
                Huy hiệu xem trước
              </span>
              <button
                type="button"
                className="px-3.5 py-1 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-[11px] shadow-xs"
              >
                Nút Bấm Thử
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CARD 2: BẢO MẬT & ĐỔI MẬT KHẨU ───────────────────────────────────────── */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Đổi Mật Khẩu
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cập nhật mật khẩu định kỳ để bảo vệ tài khoản và lộ trình học tập của bạn.
            </p>
          </div>
        </div>

        {passwordMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
              passwordMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300"
            }`}
          >
            {passwordMessage.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg text-xs">
          {/* Mật khẩu hiện tại */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mật Khẩu Hiện Tại
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang dùng"
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mật Khẩu Mới
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
              >
                {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Xác Nhận Mật Khẩu Mới
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="py-2.5 px-5 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isChangingPassword ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Đang cập nhật...
              </>
            ) : (
              <>
                <Key size={14} /> Cập Nhật Mật Khẩu Mới
              </>
            )}
          </button>
        </form>
      </section>

      {/* ── CARD 3: THÔNG TIN HỆ THỐNG & TÀI KHOẢN ────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            Tài khoản: {user.email}
          </span>
          <span className="text-[11px]">
            Hạng thành viên:{" "}
            <strong className="text-amber-600 dark:text-amber-400 font-bold">
              {user.isVIP ? "VIP Member PRO" : "Thành viên Miễn phí (Free)"}
            </strong>
          </span>
        </div>
        <div className="text-right">
          <span className="font-mono text-[11px] block text-slate-400">AIChoShop Web Platform</span>
          <span className="text-[10px] text-slate-400">Phiên bản 2.4.0</span>
        </div>
      </section>
    </div>
  );
}
