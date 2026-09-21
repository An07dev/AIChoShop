"use client";
import { useState } from "react";
import { useAccountStorage } from "@/context/AccountHistoryContext";
import { HISTORY_KEYS } from "@/lib/history/storage";
function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function PersonalDataControls() {
  const { storage, owner, ready, fetch: historyFetch } = useAccountStorage();
  const [confirmation, setConfirmation] = useState(""); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  async function exportData() {
    if (busy) return; setBusy(true); setNotice("");
    try {
      const local = Object.fromEntries(HISTORY_KEYS.map(key => [key, JSON.parse(storage.getItem(key) ?? "[]")]));
      download("aichoshop-device-history.json", new Blob([JSON.stringify({ owner, version: 2, exportedAt: new Date(), local }, null, 2)], { type: "application/json" })); setNotice("Đã xuất lịch sử của tài khoản trên thiết bị này. Dùng nút xuất server để tải hồ sơ, lịch sử công cụ, tiến độ và giao dịch.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Không xuất được dữ liệu."); } finally { setBusy(false); }
  }
  async function eraseData() {
    if (busy || confirmation !== "XOA LICH SU") return; setBusy(true); setNotice("");
    try {
      const response = await historyFetch("/api/account/data", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
      const data = await response.json(); if (!response.ok) throw Error(data.error || "Không xóa được lịch sử.");
      for (const key of HISTORY_KEYS) storage.removeItem(key);
      setConfirmation(""); setNotice("Đã xóa nội dung lịch sử server và lịch sử của tài khoản trên thiết bị này. Hạn mức AI không thay đổi.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Không xóa được lịch sử. Server có thể đã xóa thành công; hãy kiểm tra lại."); } finally { setBusy(false); }
  }
  return <div className="space-y-4">
    {ready && <a href={`/api/account/data?owner=${encodeURIComponent(owner)}`} className="mr-3 inline-block rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white">Xuất dữ liệu server của tôi</a>}
    <button disabled={busy || !ready} onClick={exportData} className="rounded-xl border border-blue-600 px-4 py-3 font-semibold text-blue-600 disabled:opacity-50">{busy ? "Đang xử lý…" : "Xuất lịch sử trên thiết bị"}</button>
    <div className="rounded-xl border border-red-200 p-4">
      <label className="block font-semibold" htmlFor="erase-history">Nhập XOA LICH SU để xóa nội dung lịch sử</label>
      <input id="erase-history" value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} className="my-3 w-full rounded-lg border border-slate-300 bg-transparent p-3" autoComplete="off" />
      <button disabled={busy || !ready || confirmation !== "XOA LICH SU"} onClick={eraseData} className="rounded-xl bg-red-700 px-4 py-3 text-white disabled:opacity-50">Xóa nội dung lịch sử</button>
    </div>
    {notice && <p role="status" className="rounded-lg bg-slate-100 p-3 text-slate-900">{notice}</p>}
    <p className="text-sm text-slate-500">Lịch sử cũ dùng chung giữa tài khoản không được tự chuyển vào tài khoản hiện tại vì không xác định được người sở hữu. Xóa dữ liệu trình duyệt trong cài đặt trình duyệt nếu bạn cần dọn toàn bộ thiết bị. Dữ liệu trên thiết bị khác cần được xóa riêng.</p>
  </div>;
}
