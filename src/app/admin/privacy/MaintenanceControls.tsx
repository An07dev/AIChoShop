"use client";
import { useState } from "react";
import { runPrivacyMaintenance } from "./actions";
export function MaintenanceControls() {
  const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false); const [notice, setNotice] = useState("");
  async function run() {
    if (busy || !confirm) return; setBusy(true); setNotice("");
    try { const response = await runPrivacyMaintenance(); setNotice(response.success ? `Đã dọn ${response.result.history} nội dung quá hạn, làm sạch ${response.result.scrubbed} lịch sử còn hạn, ${response.result.sessions} phiên hết hạn, ${response.result.resets} token khôi phục và ${response.result.rateLimits} bộ đếm cũ.` : response.error); }
    catch { setNotice("Không thực hiện được bảo trì. Hãy kiểm tra quyền và kết nối."); } finally { setBusy(false); }
  }
  return <div className="space-y-3"><label className="flex items-center gap-2"><input type="checkbox" checked={confirm} onChange={event => setConfirm(event.target.checked)} disabled={busy} />Tôi xác nhận dọn nội dung quá hạn</label><button onClick={run} disabled={busy || !confirm} className="rounded-lg bg-blue-600 px-4 py-3 text-white disabled:opacity-50">{busy ? "Đang dọn…" : "Chạy bảo trì 90 ngày"}</button>{notice && <p role="status">{notice}</p>}</div>;
}
