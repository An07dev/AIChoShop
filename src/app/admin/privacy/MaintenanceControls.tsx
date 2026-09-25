"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Sparkles,
  Layers,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import { runPrivacyMaintenance } from "./actions";

interface MaintenanceResult {
  history: number;
  sessions: number;
  resets: number;
  rateLimits: number;
  scrubbed: number;
}

export function MaintenanceControls() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<MaintenanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    if (busy || !confirmed) return;
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const response = await runPrivacyMaintenance();
      if (response.success) {
        setResult(response.result);
        router.refresh();
      } else {
        setError(response.error || "Không thể thực hiện bảo trì");
      }
    } catch {
      setError("Không thực hiện được bảo trì. Vui lòng kiểm tra quyền quản trị và kết nối.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Khối Xác Nhận & Nút Kích Hoạt */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={busy}
            className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 focus:ring-2 border-slate-300 cursor-pointer"
          />
          <div className="text-xs text-slate-700 leading-relaxed font-medium">
            <span>
              Tôi xác nhận kích hoạt bảo trì: xóa nội dung input/output & tóm tắt của nhật ký AI quá 90 ngày, thanh lọc ảnh base64 và dọn các phiên đăng nhập / token hết hạn.
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">
              (Thao tác này tuân thủ cam kết bảo mật và tự động lưu vết kiểm toán hệ thống)
            </span>
          </div>
        </label>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
          <div className="text-xs text-slate-500">
            {confirmed ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" /> Đã sẵn sàng thực thi
              </span>
            ) : (
              <span className="text-slate-400 italic">Vui lòng tích chọn xác nhận ở trên</span>
            )}
          </div>

          <button
            onClick={handleRun}
            disabled={busy || !confirmed}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            {busy ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Đang xử lý dọn dẹp...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={15} />
                <span>Chạy Bảo Trì Định Kỳ (90 Ngày)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Thông Báo Lỗi */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in"
        >
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Kết Quả Bảo Trì Thành Công */}
      {result && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-slate-800 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>Đã hoàn thành đợt bảo trì dữ liệu riêng tư thành công!</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
              <span className="block text-[10px] text-slate-500 font-medium uppercase">
                Lịch sử quá hạn
              </span>
              <span className="text-base font-black text-slate-900 mt-0.5 block">
                {result.history.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Đã dọn</span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
              <span className="block text-[10px] text-slate-500 font-medium uppercase">
                Lịch sử còn hạn
              </span>
              <span className="text-base font-black text-slate-900 mt-0.5 block">
                {result.scrubbed.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] text-blue-600 font-medium">Đã làm sạch</span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
              <span className="block text-[10px] text-slate-500 font-medium uppercase">
                Phiên đăng nhập
              </span>
              <span className="text-base font-black text-slate-900 mt-0.5 block">
                {result.sessions.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] text-purple-600 font-medium">Hết hạn</span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
              <span className="block text-[10px] text-slate-500 font-medium uppercase">
                Token khôi phục
              </span>
              <span className="text-base font-black text-slate-900 mt-0.5 block">
                {result.resets.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] text-amber-600 font-medium">Đã hủy</span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center col-span-2 sm:col-span-1">
              <span className="block text-[10px] text-slate-500 font-medium uppercase">
                Bộ đếm cũ
              </span>
              <span className="text-base font-black text-slate-900 mt-0.5 block">
                {result.rateLimits.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Đã dọn</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
