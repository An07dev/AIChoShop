"use client";
import { useState } from "react";
import { useAdminMutation } from "@/hooks/useAdminMutation";
import { approveTransactionAction, deleteTransactionAction, setTransactionSandboxAction, recordRefundAction } from "@/app/admin/sepay/actions";
export type AdminTransaction = {
    id: string;
    paymentCode: string | null;
    amount: number;
    currency: string;
    status: string;
    planName: string | null;
    createdAt: string;
    paidAt: string | null;
    isSandbox: boolean;
    user: {
        email: string;
        name: string | null;
    };
};
export function TransactionsManager({ transactions }: {
    transactions: AdminTransaction[];
}) {
    const [notice, setNotice] = useState("");
    const [pending, start] = useAdminMutation(setNotice);
    const [refundTarget, setRefundTarget] = useState<AdminTransaction | null>(null);
    const [refundTime, setRefundTime] = useState("");
    const classify = (row: AdminTransaction) => { if (!confirm(`Đánh dấu ${row.paymentCode || row.id} là ${row.isSandbox ? "giao dịch thật" : "thử nghiệm"}? Chỉ thay đổi phân loại báo cáo, không đổi quyền VIP.`))
        return; start(async () => { const result = await setTransactionSandboxAction(row.id, !row.isSandbox); setNotice(result.success ? result.message || "Đã cập nhật." : result.error || "Thất bại."); }); };
    const refund = () => { if (!refundTarget || !confirm(`Xác nhận đã hoàn trả thực tế toàn bộ ${refundTarget.amount.toLocaleString("vi-VN")} ${refundTarget.currency}? Đây chỉ là ghi nhận đối soát, không gửi tiền hoặc thu hồi VIP.`))
        return; start(async () => { const result = await recordRefundAction(refundTarget.id, refundTime); setNotice(result.success ? result.message || "Đã ghi nhận." : result.error || "Thất bại."); if (result.success)
        setRefundTarget(null); }); };
    const act = (row: AdminTransaction, approve: boolean) => {
        if (!confirm(approve ? `Đối soát và duyệt ${row.paymentCode || row.id}? Chỉ duyệt nếu có sự kiện ngân hàng khớp.` : `Hủy yêu cầu ${row.paymentCode || row.id}? Bản ghi vẫn được giữ.`))
            return;
        start(async () => { const result = await (approve ? approveTransactionAction(row.id) : deleteTransactionAction(row.id)); setNotice(result.success ? (result.message || "Đã hoàn tất.") : result.error || "Thao tác thất bại."); });
    };
    const date = (value: string | null) => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
    return <section className="rounded-xl border bg-white p-4 space-y-3"><h2 className="text-lg font-bold">Giao dịch thanh toán</h2><p className="text-xs text-slate-500">Thời gian Việt Nam · Duyệt yêu cầu đã có bằng chứng ngân hàng; hủy chỉ áp dụng yêu cầu chưa nhận tiền.</p>{notice && <p role="status">{notice}</p>}{refundTarget && <div role="dialog" aria-label="Ghi nhận hoàn tiền toàn phần" className="rounded border p-4 space-y-3"><p>Giao dịch {refundTarget.paymentCode || refundTarget.id}. Chỉ ghi nhận sau khi đã hoàn trả thực tế; quyền VIP xử lý riêng.</p><label>Thời điểm hoàn tiền (Việt Nam)<input type="datetime-local" step="1" value={refundTime} onChange={event => setRefundTime(event.target.value)} className="block rounded border p-2"/></label><button disabled={pending || !refundTime} onClick={refund} className="mr-4 text-blue-700">Xác nhận đã hoàn tiền</button><button disabled={pending} onClick={() => setRefundTarget(null)}>Hủy</button></div>}<div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr>{["Mã / người dùng", "Gói / số tiền", "Trạng thái", "Ngày tạo", "Ngày thanh toán", "Thao tác"].map(title => <th key={title} className="p-3 border-b">{title}</th>)}</tr></thead><tbody>{transactions.length === 0 ? <tr><td colSpan={6} className="p-6 text-center">Không có giao dịch phù hợp.</td></tr> : transactions.map(row => <tr key={row.id}><td className="p-3 border-b">{row.paymentCode || row.id}<div>{row.user.name || row.user.email}</div><div className="text-xs text-slate-500">{row.user.email}</div></td><td className="p-3 border-b">{row.planName || "—"}<div>{row.amount.toLocaleString("vi-VN")} {row.currency}</div></td><td className="p-3 border-b">{row.status}{row.isSandbox && <div className="text-amber-700">SANDBOX</div>}</td><td className="p-3 border-b">{date(row.createdAt)}</td><td className="p-3 border-b">{date(row.paidAt)}</td><td className="p-3 border-b space-x-2"><button disabled={pending} onClick={() => classify(row)} className="text-slate-600 disabled:opacity-50">{row.isSandbox ? "Đánh dấu thật" : "Đánh dấu thử"}</button>{row.status === "SUCCESS" && row.paidAt && <button disabled={pending} onClick={() => { setRefundTime(new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 19)); setRefundTarget(row); }} className="text-amber-700 disabled:opacity-50">Ghi nhận hoàn tiền</button>}{!row.isSandbox && row.status === "REVIEW" && <button disabled={pending} onClick={() => act(row, true)} className="text-blue-700 disabled:opacity-50">Duyệt</button>}{row.status === "PENDING" && <button disabled={pending} onClick={() => act(row, false)} className="text-red-700 disabled:opacity-50">Hủy</button>}</td></tr>)}</tbody></table></div></section>;
}
