"use client";
import { useState } from "react";
import { useAccountStorage } from "@/context/AccountHistoryContext";
import { HISTORY_KEYS } from "@/lib/history/storage";
import { Download, Trash2, ShieldCheck, AlertTriangle, HardDrive, Cloud, CheckCircle2, RefreshCw } from "lucide-react";

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PersonalDataControls() {
  const { storage, owner, ready, fetch: historyFetch } = useAccountStorage();
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  async function exportData() {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const local = Object.fromEntries(HISTORY_KEYS.map(key => [key, JSON.parse(storage.getItem(key) ?? "[]")]));
      download(
        "aichoshop-device-history.json",
        new Blob([JSON.stringify({ owner, version: 2, exportedAt: new Date(), local }, null, 2)], { type: "application/json" })
      );
      setNotice({ text: "Đã xuất lịch sử trên thiết bị này thành công! Dùng nút xuất dữ liệu máy chủ nếu bạn muốn tải hồ sơ đầy đủ." });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : "Không xuất được dữ liệu.", isError: true });
    } finally {
      setBusy(false);
    }
  }

  async function eraseData() {
    if (busy || confirmation !== "XOA LICH SU") return;
    setBusy(true);
    setNotice(null);
    try {
      const response = await historyFetch("/api/account/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation })
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Không xóa được lịch sử.");
      for (const key of HISTORY_KEYS) storage.removeItem(key);
      setConfirmation("");
      setNotice({ text: "Đã xóa toàn bộ nội dung lịch sử máy chủ và lịch sử trên thiết bị này. Hạn mức AI không thay đổi." });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : "Không xóa được lịch sử. Hãy thử lại.", isError: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div
          role="status"
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 animate-fadeIn ${
            notice.isError
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50"
              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
          }`}
        >
          {notice.isError ? (
            <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Card 1: Xuất dữ liệu */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Download size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Xuất & Sao Lưu Dữ Liệu</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tải toàn bộ kết quả tạo AI, bài toán định giá và lịch sử công cụ dưới dạng tệp JSON.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
          {ready && (
            <a
              href={`/api/account/data?owner=${encodeURIComponent(owner)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-sm shadow-blue-600/20 cursor-pointer w-full sm:w-auto"
            >
              <Cloud size={15} />
              <span>Xuất Dữ Liệu Máy Chủ</span>
            </a>
          )}
          <button
            disabled={busy || !ready}
            onClick={exportData}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-xs disabled:opacity-50 cursor-pointer w-full sm:w-auto"
          >
            <HardDrive size={15} />
            <span>{busy ? "Đang xử lý…" : "Xuất Lịch Sử Trên Thiết Bị"}</span>
          </button>
        </div>
      </div>

      {/* Card 2: Vùng nguy hiểm - Xóa lịch sử */}
      <div className="p-4 sm:p-6 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Xóa Dữ Liệu & Lịch Sử Công Cụ</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thao tác này sẽ xóa vĩnh viễn nội dung prompt và kết quả tạo AI trên thiết bị lẫn máy chủ.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 leading-normal" htmlFor="erase-history">
            Để xác nhận, vui lòng nhập chính xác cụm từ <span className="text-rose-600 dark:text-rose-400 font-mono font-black">XOA LICH SU</span> vào ô bên dưới:
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <input
              id="erase-history"
              value={confirmation}
              onChange={event => setConfirmation(event.target.value)}
              disabled={busy}
              placeholder="Nhập XOA LICH SU..."
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all font-mono"
              autoComplete="off"
            />
            <button
              disabled={busy || !ready || confirmation !== "XOA LICH SU"}
              onClick={eraseData}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white transition-colors shadow-sm shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer w-full sm:w-auto"
            >
              {busy ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              <span>Xóa Lịch Sử</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2.5">
        <ShieldCheck size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <p>
          Lịch sử AI được mã hóa và tách biệt theo từng tài khoản. Dữ liệu trên thiết bị khác nhau cần được xóa độc lập trên từng thiết bị đó. Số lượt sử dụng, quyền VIP và tài khoản của bạn được bảo lưu nguyên vẹn.
        </p>
      </div>
    </div>
  );
}

