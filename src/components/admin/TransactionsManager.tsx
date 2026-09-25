"use client";

import { useState } from "react";
import {
  Receipt,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Copy,
  Check,
  Clock,
  FlaskConical,
  CreditCard,
  User,
  Mail,
  Coins,
  TrendingUp,
  X,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useAdminMutation } from "@/hooks/useAdminMutation";
import {
  approveTransactionAction,
  deleteTransactionAction,
  setTransactionSandboxAction,
  recordRefundAction,
} from "@/app/admin/sepay/actions";

export type AdminTransaction = {
  id: string;
  paymentCode: string | null;
  amount: number;
  currency: string;
  status: string;
  planName: string | null;
  createdAt: string;
  paidAt: string | null;
  refundedAt?: string | null;
  isSandbox: boolean;
  user: {
    email: string;
    name: string | null;
  };
};

export interface TransactionStats {
  totalRevenue: number;
  successCount: number;
  pendingCount: number;
  totalCount: number;
}

interface TransactionsManagerProps {
  transactions: AdminTransaction[];
  stats?: TransactionStats;
  listControls?: React.ReactNode;
  showStats?: boolean;
}

export function TransactionStatsCards({
  stats,
}: {
  stats?: TransactionStats | null;
}) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs border border-emerald-100">
          <Coins size={22} />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
            Doanh Thu Đã Thu
          </span>
          <div className="text-xl font-black text-slate-900 truncate mt-0.5">
            {stats.totalRevenue.toLocaleString("vi-VN")} ₫
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <TrendingUp size={12} /> Giao dịch thật (Live)
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs border border-blue-100">
          <CheckCircle2 size={22} />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
            Thành Công (Live)
          </span>
          <div className="text-xl font-black text-slate-900 truncate mt-0.5">
            {stats.successCount.toLocaleString("vi-VN")} đơn
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            Đã thanh toán & cấp VIP
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-xs border border-amber-100">
          <Clock size={22} />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
            Chờ Xử Lý / Đối Soát
          </span>
          <div className="text-xl font-black text-slate-900 truncate mt-0.5">
            {stats.pendingCount.toLocaleString("vi-VN")} đơn
          </div>
          <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">
            Pending hoặc Review
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-xs border border-purple-100">
          <Receipt size={22} />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
            Tổng Lượt Yêu Cầu
          </span>
          <div className="text-xl font-black text-slate-900 truncate mt-0.5">
            {stats.totalCount.toLocaleString("vi-VN")} đơn
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            Bao gồm cả thử nghiệm
          </span>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function TransactionsManager({
  transactions,
  stats,
  listControls,
  showStats = false,
}: TransactionsManagerProps) {
  const [notice, setNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [pending, startMutation] = useAdminMutation((msg) =>
    setNotice({ text: msg, type: "error" })
  );

  // Modals state
  const [approveTarget, setApproveTarget] = useState<AdminTransaction | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminTransaction | null>(null);
  const [classifyTarget, setClassifyTarget] = useState<AdminTransaction | null>(null);
  const [refundTarget, setRefundTarget] = useState<AdminTransaction | null>(null);
  const [refundTime, setRefundTime] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast("Đã sao chép mã giao dịch: " + code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 1. Duyệt giao dịch đối soát (Cấp quyền VIP)
  const confirmApprove = () => {
    if (!approveTarget) return;
    const target = approveTarget;
    setApproveTarget(null);
    startMutation(async () => {
      const res = await approveTransactionAction(target.id);
      if (res.success) {
        showToast(res.message || "Đã duyệt giao dịch và kích hoạt VIP thành công!");
      } else {
        showToast(res.error || "Không thể duyệt giao dịch", "error");
      }
    });
  };

  // 2. Hủy yêu cầu chưa thanh toán
  const confirmCancel = () => {
    if (!cancelTarget) return;
    const target = cancelTarget;
    setCancelTarget(null);
    startMutation(async () => {
      const res = await deleteTransactionAction(target.id);
      if (res.success) {
        showToast(res.message || "Đã hủy yêu cầu thanh toán.");
      } else {
        showToast(res.error || "Không thể hủy yêu cầu", "error");
      }
    });
  };

  // 3. Chuyển đổi môi trường Thật / Sandbox
  const confirmClassify = () => {
    if (!classifyTarget) return;
    const target = classifyTarget;
    setClassifyTarget(null);
    startMutation(async () => {
      const res = await setTransactionSandboxAction(target.id, !target.isSandbox);
      if (res.success) {
        showToast(res.message || "Đã cập nhật phân loại môi trường.");
      } else {
        showToast(res.error || "Không thể phân loại giao dịch", "error");
      }
    });
  };

  // 4. Ghi nhận hoàn tiền toàn phần
  const confirmRefund = () => {
    if (!refundTarget || !refundTime) return;
    const target = refundTarget;
    const time = refundTime;
    setRefundTarget(null);
    startMutation(async () => {
      const res = await recordRefundAction(target.id, time);
      if (res.success) {
        showToast(res.message || "Đã ghi nhận hoàn tiền toàn phần.");
      } else {
        showToast(res.error || "Không thể ghi nhận hoàn tiền", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast thông báo nổi */}
      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 ${
            notice.type === "success"
              ? "bg-slate-900 text-emerald-400 border border-emerald-500/30"
              : "bg-rose-950 text-rose-300 border border-rose-500/30"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* ── 1. CÁC THẺ THỐNG KÊ DOANH THU & GIAO DỊCH (NẾU ĐƯỢC BẬT) ────────────────── */}
      {showStats && stats && <TransactionStatsCards stats={stats} />}

      {/* ── 2. KHỐI QUẢN LÝ GIAO DỊCH CHÍNH ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
        {/* Header Khối */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Receipt size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Lịch Sử Giao Dịch & Nạp VIP</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {stats ? `${transactions.length} / ${stats.totalCount} bản ghi` : `${transactions.length} bản ghi`}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Đối soát sao kê ngân hàng VietQR / SePay, theo dõi nạp VIP và ghi nhận hoàn tiền.
              </p>
            </div>
          </div>
        </div>

        {/* Khối Bộ Lọc Tích Hợp (List Controls) */}
        {listControls && <div className="px-5 md:px-6">{listControls}</div>}

        {/* ── BẢNG DANH SÁCH GIAO DỊCH ───────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-y border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-5">Mã Giao Dịch & Khách Hàng</th>
                <th className="py-3 px-4">Gói VIP & Số Tiền</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Môi Trường</th>
                <th className="py-3 px-4">Thời Gian (VN)</th>
                <th className="py-3 px-4 sm:px-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
                        <Receipt size={26} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-sm text-slate-900">
                          Chưa có giao dịch phù hợp
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Các yêu cầu chuyển khoản quét mã VietQR và thông báo từ SePay Webhook sẽ tự động xuất hiện tại đây.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((row) => {
                  const isSuccess = row.status === "SUCCESS";
                  const isPendingStatus = row.status === "PENDING";
                  const isReview = row.status === "REVIEW";
                  const isRefunded = row.status === "REFUNDED";

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Cột 1: Mã Thanh Toán & Khách Hàng */}
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => handleCopyCode(row.paymentCode || row.id)}
                              title="Nhấp để sao chép mã"
                              className="font-mono font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-900 px-2 py-0.5 rounded border border-slate-200 cursor-pointer inline-flex items-center gap-1 transition-colors"
                            >
                              <span>{row.paymentCode || row.id}</span>
                              {copiedCode === (row.paymentCode || row.id) ? (
                                <Check size={11} className="text-emerald-600 stroke-[3]" />
                              ) : (
                                <Copy size={11} className="text-slate-400" />
                              )}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <User size={12} className="text-slate-400 shrink-0" />
                            <span>{row.user.name || "Khách hàng"}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Mail size={11} className="text-slate-400 shrink-0" />
                            <span>{row.user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Gói VIP & Số Tiền */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {row.planName ? (
                            <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              {row.planName}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Nạp số dư / Khác
                            </span>
                          )}
                          <div className="text-sm font-black text-slate-900">
                            {row.amount.toLocaleString("vi-VN")}{" "}
                            <span className="text-xs font-bold text-slate-500">
                              {row.currency}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Trạng Thái */}
                      <td className="py-3.5 px-4">
                        {isSuccess && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Thành công</span>
                          </span>
                        )}
                        {isPendingStatus && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                            <Clock size={12} className="text-blue-600" />
                            <span>Chờ chuyển</span>
                          </span>
                        )}
                        {isReview && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs animate-pulse">
                            <AlertTriangle size={12} className="text-amber-600" />
                            <span>Cần đối soát</span>
                          </span>
                        )}
                        {isRefunded && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                            <RotateCcw size={12} className="text-purple-600" />
                            <span>Đã hoàn tiền</span>
                          </span>
                        )}
                        {!isSuccess && !isPendingStatus && !isReview && !isRefunded && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle size={12} />
                            <span>{row.status}</span>
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Môi Trường */}
                      <td className="py-3.5 px-4">
                        {row.isSandbox ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200 shadow-2xs">
                            <FlaskConical size={11} />
                            <span>Sandbox</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span>Thật (Live)</span>
                          </span>
                        )}
                      </td>

                      {/* Cột 5: Thời Gian */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-slate-600">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Tạo:</span>
                            <span>{formatDate(row.createdAt)}</span>
                          </div>
                          {row.paidAt && (
                            <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                              <span className="text-emerald-500">Trả:</span>
                              <span>{formatDate(row.paidAt)}</span>
                            </div>
                          )}
                          {row.refundedAt && (
                            <div className="flex items-center gap-1 text-purple-700 font-semibold">
                              <span className="text-purple-500">Hoàn:</span>
                              <span>{formatDate(row.refundedAt)}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột 6: Thao Tác Nhanh */}
                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Duyệt & Cấp VIP (cho đơn REVIEW) */}
                          {!row.isSandbox && isReview && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => setApproveTarget(row)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                              title="Đối soát khớp tiền và kích hoạt VIP ngay"
                            >
                              <CheckCircle2 size={12} />
                              <span>Duyệt</span>
                            </button>
                          )}

                          {/* Ghi nhận hoàn tiền (cho đơn SUCCESS đã trả) */}
                          {isSuccess && row.paidAt && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => {
                                setRefundTime(
                                  new Date(Date.now() + 7 * 3600000)
                                    .toISOString()
                                    .slice(0, 19)
                                );
                                setRefundTarget(row);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                              title="Ghi nhận đối soát hoàn tiền toàn phần"
                            >
                              <RotateCcw size={12} />
                              <span>Hoàn tiền</span>
                            </button>
                          )}

                          {/* Hủy đơn chưa thanh toán (PENDING) */}
                          {isPendingStatus && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => setCancelTarget(row)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                              title="Hủy yêu cầu chưa thanh toán"
                            >
                              <XCircle size={12} />
                              <span>Hủy</span>
                            </button>
                          )}

                          {/* Đánh dấu Thật / Thử nghiệm */}
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => setClassifyTarget(row)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                            title={
                              row.isSandbox
                                ? "Đánh dấu là giao dịch thật"
                                : "Đánh dấu là thử nghiệm (Sandbox)"
                            }
                          >
                            <FlaskConical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: XÁC NHẬN DUYỆT GIAO DỊCH (CẤP VIP) ───────────────────────── */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckCircle2 size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-base text-slate-900">
                  Duyệt Giao Dịch &amp; Kích Hoạt VIP
                </h3>
                <p className="text-xs text-slate-500">
                  Xác nhận đối soát có bằng chứng ngân hàng
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-bold text-slate-900">
                  {approveTarget.user.name || approveTarget.user.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã đơn:</span>
                <span className="font-mono font-bold text-slate-900">
                  {approveTarget.paymentCode || approveTarget.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói đăng ký:</span>
                <span className="font-bold text-amber-700">
                  {approveTarget.planName || "VIP"}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-slate-700">Số tiền:</span>
                <span className="text-sm font-black text-emerald-600">
                  {approveTarget.amount.toLocaleString("vi-VN")} {approveTarget.currency}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={pending}
                onClick={confirmApprove}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {pending ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Xác nhận duyệt &amp; Cấp VIP</span>
              </button>
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: XÁC NHẬN HỦY ĐƠN CHƯA THANH TOÁN ──────────────────────── */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <XCircle size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-base text-slate-900">
                  Hủy Yêu Cầu Thanh Toán
                </h3>
                <p className="text-xs text-slate-500">
                  Hủy đơn chưa nhận tiền (Bản ghi vẫn được lưu đối soát)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn hủy yêu cầu thanh toán mã{" "}
              <strong className="font-mono text-slate-900">
                {cancelTarget.paymentCode || cancelTarget.id}
              </strong>{" "}
              của khách hàng <strong>{cancelTarget.user.email}</strong>?
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={pending}
                onClick={confirmCancel}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {pending ? <RefreshCw size={13} className="animate-spin" /> : <XCircle size={14} />}
                <span>Xác nhận hủy đơn</span>
              </button>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: XÁC NHẬN CHUYỂN MÔI TRƯỜNG SANDBOX ─────────────────────── */}
      {classifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                <FlaskConical size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-base text-slate-900">
                  Phân Loại Môi Trường Báo Cáo
                </h3>
                <p className="text-xs text-slate-500">
                  Chuyển trạng thái Thật (Live) ↔ Thử nghiệm (Sandbox)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Đánh dấu đơn{" "}
              <strong className="font-mono text-slate-900">
                {classifyTarget.paymentCode || classifyTarget.id}
              </strong>{" "}
              là{" "}
              <strong className="text-blue-600">
                {classifyTarget.isSandbox ? "Giao dịch thật (Live)" : "Thử nghiệm (Sandbox)"}
              </strong>
              ?
              <br />
              <span className="text-[11px] text-slate-400 mt-1 block">
                * Thao tác này chỉ thay đổi phân loại doanh thu trong báo cáo; quyền VIP của tài khoản không bị thu hồi.
              </span>
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={pending}
                onClick={confirmClassify}
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {pending ? <RefreshCw size={13} className="animate-spin" /> : <Check size={14} />}
                <span>Cập nhật phân loại</span>
              </button>
              <button
                type="button"
                onClick={() => setClassifyTarget(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: GHI NHẬN HOÀN TIỀN TOÀN PHẦN ───────────────────────────── */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                <RotateCcw size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-base text-slate-900">
                  Ghi Nhận Hoàn Tiền Toàn Phần
                </h3>
                <p className="text-xs text-slate-500">
                  Đối soát sau khi đã chuyển khoản trả lại tiền
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 text-xs text-purple-900 space-y-1">
              <p className="font-bold">
                Mã đơn: {refundTarget.paymentCode || refundTarget.id}
              </p>
              <p>
                Số tiền hoàn trả:{" "}
                <strong className="text-sm font-black text-purple-700">
                  {refundTarget.amount.toLocaleString("vi-VN")} {refundTarget.currency}
                </strong>
              </p>
              <p className="text-[11px] text-purple-600 pt-1 border-t border-purple-200">
                ⚠️ Chỉ ghi nhận sau khi bạn đã chuyển khoản hoàn trả thực tế cho khách qua ngân hàng. Hệ thống không tự động trừ tiền ngân hàng hoặc thu hồi VIP.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar size={13} />
                <span>Thời điểm hoàn tiền thực tế (Việt Nam)</span>
              </label>
              <input
                type="datetime-local"
                step="1"
                required
                value={refundTime}
                onChange={(e) => setRefundTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={pending || !refundTime}
                onClick={confirmRefund}
                className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {pending ? <RefreshCw size={13} className="animate-spin" /> : <RotateCcw size={14} />}
                <span>Xác nhận đã hoàn tiền</span>
              </button>
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionsManager;
