"use client";

import { useState, useEffect, useTransition } from "react";
import {
  CreditCard,
  Copy,
  Check,
  Save,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Zap,
  Search,
  Crown,
  Trash2,
} from "lucide-react";
import {
  saveSePayConfigAction,
  simulateSePayWebhookAction,
  approveTransactionAction,
  deleteTransactionAction,
} from "@/app/admin/sepay/actions";

function formatRelativeTime(isoString: string) {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (seconds < 60) return "Vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

interface SePayConfigManagerProps {
  initialConfig: {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    apiKey: string | null;
    syntaxPrefix: string;
    autoActivate: boolean;
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    status: string;
    type: string;
    sepayId: string | null;
    createdAt: string;
    user: {
      id: string;
      email: string;
      name: string | null;
      phone: string | null;
      isVIP: boolean;
    };
  }>;
}

const POPULAR_BANKS = [
  "MB Bank",
  "Vietcombank",
  "Techcombank",
  "ACB",
  "VPBank",
  "TPBank",
  "BIDV",
  "Agribank",
  "Sacombank",
  "HDBank",
  "VIB",
  "SHB",
];

export function SePayConfigManager({
  initialConfig,
  recentTransactions: initialTransactions,
}: SePayConfigManagerProps) {
  const [config, setConfig] = useState(initialConfig);
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Transactions State
  const [transactions, setTransactions] = useState(initialTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUCCESS" | "PENDING">("ALL");
  const [displayLimit, setDisplayLimit] = useState<number | "ALL">(5); // Mặc định hiển thị đúng 5 bản ghi mới nhất
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhooks/sepay`);
    }
  }, []);

  const handleCopyUrl = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    showToast("Đã sao chép Webhook URL!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async (txId: string) => {
    if (approvingId) return;
    setApprovingId(txId);
    try {
      const res = await approveTransactionAction(txId);
      if (res.success) {
        showToast(res.message || "Đã duyệt giao dịch thành công!");
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === txId
              ? {
                  ...t,
                  status: "SUCCESS",
                  user: { ...t.user, isVIP: true },
                }
              : t
          )
        );
      } else {
        showToast(res.error || "Không thể duyệt giao dịch", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi xử lý duyệt", "error");
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = async (txId: string) => {
    if (deletingId) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản ghi giao dịch này không?")) return;
    setDeletingId(txId);
    try {
      const res = await deleteTransactionAction(txId);
      if (res.success) {
        showToast(res.message || "Đã xóa giao dịch thành công!");
        setTransactions((prev) => prev.filter((t) => t.id !== txId));
      } else {
        showToast(res.error || "Không thể xóa giao dịch", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi xóa giao dịch", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyTxId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedTxId(id);
    showToast(`Đã sao chép: ${id}`);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  // Form State
  const [formData, setFormData] = useState({
    bankName: config.bankName,
    accountNumber: config.accountNumber,
    accountHolder: config.accountHolder,
    apiKey: config.apiKey || "",
    syntaxPrefix: config.syntaxPrefix,
    autoActivate: config.autoActivate,
  });

  // Simulator State
  const [simQuery, setSimQuery] = useState("");
  const [simAmount, setSimAmount] = useState(200000);
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Xử lý lưu cấu hình
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveSePayConfigAction(formData);
      if (res.success) {
        showToast("Đã lưu cấu hình SePay!");
        setConfig((prev) => ({ ...prev, ...formData }));
      } else {
        showToast(res.error || "Không thể lưu cấu hình", "error");
      }
    });
  };

  // Xử lý chạy giả lập Webhook
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simQuery.trim()) {
      showToast("Vui lòng nhập SĐT hoặc Email học viên", "error");
      return;
    }

    setIsSimulating(true);
    setSimResult(null);

    try {
      const res = await simulateSePayWebhookAction({
        phoneOrEmailOrId: simQuery.trim(),
        amount: Number(simAmount),
      });

      setSimResult(res);
      if (res.success) {
        showToast(res.message || "Đã kích hoạt thử thành công!");
        if (res.transactionId) {
          const newTx = {
            id: res.transactionId,
            amount: Number(simAmount),
            status: res.autoActivated ? "SUCCESS" : "PENDING",
            type: "UPGRADE_VIP_TEST",
            sepayId: `SIM-${Date.now()}`,
            createdAt: new Date().toISOString(),
            user: {
              id: res.user?.id || "sim-user",
              email: res.user?.email || simQuery.trim(),
              name: res.user?.name || "Học viên giả lập",
              phone: null,
              isVIP: !!res.user?.isVIP,
            },
          };
          setTransactions((prev) => [newTx, ...prev]);
        }
      } else {
        showToast(res.error || "Thử nghiệm thất bại", "error");
      }
    } catch (err: any) {
      setSimResult({ success: false, error: err.message });
      showToast(err.message || "Lỗi khi gọi giả lập", "error");
    } finally {
      setIsSimulating(false);
    }
  };

  // Thống kê nhanh
  const totalCount = transactions.length;
  const successCount = transactions.filter((t) => t.status === "SUCCESS").length;
  const pendingCount = transactions.filter((t) => t.status === "PENDING").length;
  const totalRevenue = transactions
    .filter((t) => t.status === "SUCCESS")
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  // Lọc theo tìm kiếm và trạng thái
  const filteredTransactions = transactions.filter((tx) => {
    if (statusFilter !== "ALL" && tx.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = (tx.sepayId || tx.id).toLowerCase().includes(q);
      const matchEmail = (tx.user?.email || "").toLowerCase().includes(q);
      const matchName = (tx.user?.name || "").toLowerCase().includes(q);
      const matchPhone = (tx.user?.phone || "").toLowerCase().includes(q);
      if (!matchCode && !matchEmail && !matchName && !matchPhone) return false;
    }
    return true;
  });

  // Giới hạn hiển thị (Mặc định 5 bản ghi mới nhất)
  const displayedTransactions =
    displayLimit === "ALL"
      ? filteredTransactions
      : filteredTransactions.slice(0, displayLimit);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
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

      {/* Header gọn gàng */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <CreditCard size={22} className="text-blue-600" />
            Cấu hình SePay & Webhook
          </h1>
        </div>

        <a
          href="https://my.sepay.vn"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs"
        >
          <span>my.sepay.vn</span>
          <ExternalLink size={12} className="text-slate-400" />
        </a>
      </div>

      {/* Webhook URL Bar (Gọn gàng, thanh lịch) */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-slate-800">Webhook URL (Dán vào SePay.vn)</span>
          </div>
          <div className="font-mono text-xs text-blue-700 bg-blue-50/70 px-3 py-2 rounded-lg border border-blue-100 select-all truncate">
            {webhookUrl || "Đang tải URL..."}
          </div>
        </div>

        <button
          onClick={handleCopyUrl}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 shadow-xs ${
            copied
              ? "bg-emerald-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "Đã sao chép" : "Sao chép URL"}</span>
        </button>
      </div>

      {/* Grid: Form Cấu hình (Trái) & Test Nhanh (Phải) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Cấu hình Ngân hàng & Token (7 cột) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Tài Khoản Nhận Tiền & Kết Nối
          </h2>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Ngân hàng</label>
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Số tài khoản</label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="0358888899"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Chủ tài khoản</label>
                <input
                  type="text"
                  required
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value.toUpperCase() })}
                  placeholder="AICHO SHOP OFFICIAL"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Cú pháp chuyển</label>
                <input
                  type="text"
                  required
                  value={formData.syntaxPrefix}
                  onChange={(e) => setFormData({ ...formData, syntaxPrefix: e.target.value.toUpperCase() })}
                  placeholder="VIP"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                SePay API Key (Webhook Token)
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Bỏ trống nếu không dùng xác thực Header"
                  className="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Switch Tự Động Kích Hoạt */}
            <div
              onClick={() => setFormData({ ...formData, autoActivate: !formData.autoActivate })}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
                formData.autoActivate
                  ? "bg-emerald-50/70 border-emerald-300 shadow-xs"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">Tự động nâng VIP khi nhận tiền</span>
                {formData.autoActivate ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full mt-1 shadow-2xs">
                    <Check size={11} className="stroke-[3] text-emerald-600" />
                    <span>Đang bật (Tự duyệt 24/7 qua Webhook)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] text-slate-500 font-medium mt-1">
                    Đang tắt (Lưu trạng thái chờ duyệt thủ công)
                  </span>
                )}
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={formData.autoActivate}
                onClick={(e) => {
                  e.stopPropagation();
                  setFormData({ ...formData, autoActivate: !formData.autoActivate });
                }}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  formData.autoActivate
                    ? "bg-emerald-500 shadow-md shadow-emerald-500/35"
                    : "bg-slate-300 hover:bg-slate-400"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    formData.autoActivate ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save size={14} /> Lưu Cấu Hình
                </>
              )}
            </button>
          </form>
        </div>

        {/* Cột Phải: Test Webhook Giả Lập (5 cột) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Zap size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">Thử Nghiệm Webhook</h2>
          </div>

          <form onSubmit={handleRunSimulation} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">SĐT hoặc Email học viên</label>
              <input
                type="text"
                required
                placeholder="0987654321 hoặc email@gmail.com"
                value={simQuery}
                onChange={(e) => setSimQuery(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Số tiền test</label>
              <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                <button
                  type="button"
                  onClick={() => setSimAmount(200000)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition ${
                    simAmount === 200000
                      ? "bg-blue-50 text-blue-700 border-blue-300"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  200k (Tháng)
                </button>
                <button
                  type="button"
                  onClick={() => setSimAmount(1290000)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition ${
                    simAmount === 1290000
                      ? "bg-blue-50 text-blue-700 border-blue-300"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  1.290k (Năm)
                </button>
                <button
                  type="button"
                  onClick={() => setSimAmount(1990000)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition ${
                    simAmount === 1990000
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  1.990k (Trọn đời)
                </button>
              </div>
              <input
                type="number"
                value={simAmount}
                onChange={(e) => setSimAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <RefreshCw size={13} className="animate-spin" /> Đang thử...
                </>
              ) : (
                <>
                  <Play size={13} className="fill-white" /> Bắn Thử Webhook
                </>
              )}
            </button>
          </form>

          {/* Kết quả Test */}
          {simResult && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                simResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {simResult.success ? (
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={14} className="text-rose-600 shrink-0" />
                )}
                <span>{simResult.success ? "Thành công" : "Lỗi"}</span>
              </div>
              <p className="text-[11px] text-slate-600">{simResult.message || simResult.error}</p>
              {simResult.user && (
                <div className="mt-2 pt-2 border-t border-emerald-200/60 font-mono text-[10px] space-y-0.5">
                  <div>User: {simResult.user.name || simResult.user.email}</div>
                  <div>Gói: {simResult.planName}</div>
                  <div>
                    Hạn:{" "}
                    {simResult.user.vipExpiresAt
                      ? new Date(simResult.user.vipExpiresAt).toLocaleDateString("vi-VN")
                      : "Trọn đời"}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── LỊCH SỬ GIAO DỊCH GẦN ĐÂY (CHUYỂN KHOẢN SEPAY) ── */}
      <div className="bg-white rounded-3xl p-5 md:p-7 border border-slate-200 shadow-xs space-y-5">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Giao Dịch Gần Đây
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200">
                  {displayLimit === 5 ? "5 mới nhất" : displayLimit === "ALL" ? "Tất cả" : `${displayLimit} mới nhất`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Biến động số dư VietQR và lịch sử thanh toán nạp VIP qua SePay
              </p>
            </div>
          </div>

          {/* Switcher limit buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto">
            <span className="text-[11px] font-bold text-slate-500 px-2">Hiển thị:</span>
            {[5, 10, 20, "ALL"].map((lim) => (
              <button
                key={String(lim)}
                type="button"
                onClick={() => setDisplayLimit(lim as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  displayLimit === lim
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {lim === "ALL" ? "Tất cả" : `${lim} GD`}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Mini Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng giao dịch</span>
            <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{totalCount}</span>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Thành công</span>
            <span className="text-xl font-black text-emerald-600 font-mono mt-0.5 block">{successCount}</span>
          </div>
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Chờ duyệt</span>
            <span className="text-xl font-black text-amber-600 font-mono mt-0.5 block">{pendingCount}</span>
          </div>
          <div className="bg-purple-50/50 border border-purple-200/60 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Đã thực thu</span>
            <span className="text-xl font-black text-purple-600 font-mono mt-0.5 block">
              {totalRevenue.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: `Tất cả (${totalCount})` },
              { id: "SUCCESS", label: `Thành công (${successCount})` },
              { id: "PENDING", label: `Chờ duyệt (${pendingCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã GD, email, tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 text-[11px] uppercase font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Mã Giao Dịch</th>
                  <th className="py-3 px-4">Học Viên</th>
                  <th className="py-3 px-4 text-right">Số Tiền</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thời Gian</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Clock size={32} className="text-slate-300 stroke-[1.5]" />
                        <span className="font-bold text-slate-600 text-xs">
                          {searchQuery || statusFilter !== "ALL"
                            ? "Không tìm thấy giao dịch nào phù hợp bộ lọc"
                            : "Chưa có giao dịch chuyển khoản nào"}
                        </span>
                        {(searchQuery || statusFilter !== "ALL") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery("");
                              setStatusFilter("ALL");
                            }}
                            className="text-blue-600 hover:underline text-xs font-bold mt-1"
                          >
                            Xóa bộ lọc tìm kiếm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedTransactions.map((tx) => {
                    const isSuccess = tx.status === "SUCCESS";
                    const initial = (tx.user?.name || tx.user?.email || "H").charAt(0).toUpperCase();
                    const txCode = tx.sepayId || tx.id.slice(0, 8);

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Mã GD */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-xs">{txCode}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyTxId(txCode)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                              title="Sao chép mã giao dịch"
                            >
                              {copiedTxId === txCode ? (
                                <Check size={11} className="text-emerald-600 stroke-[2.5]" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[140px]">
                            {tx.type || "UPGRADE_VIP"}
                          </span>
                        </td>

                        {/* Học Viên */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shadow-2xs shrink-0">
                                {initial}
                              </div>
                              {tx.user?.isVIP && (
                                <span
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs"
                                  title="Thành viên VIP"
                                >
                                  <Crown size={8} className="fill-white" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                                  {tx.user?.name || "Học viên"}
                                </span>
                                {tx.user?.isVIP && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black border border-amber-200 shrink-0">
                                    VIP
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-400 font-mono text-[11px] block truncate max-w-[180px]">
                                {tx.user?.email || "Chưa có email"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Số Tiền */}
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-mono font-black text-sm block ${
                              isSuccess ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            +{Number(tx.amount).toLocaleString("vi-VN")} đ
                          </span>
                        </td>

                        {/* Trạng Thái */}
                        <td className="py-3.5 px-4 text-center">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/90 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-[11px] shadow-2xs">
                              <CheckCircle2 size={12} className="text-emerald-600" /> Thành công
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/90 text-amber-800 px-2.5 py-1 rounded-full font-bold text-[11px] shadow-2xs">
                              <Clock size={12} className="text-amber-600" /> Chờ duyệt
                            </span>
                          )}
                        </td>

                        {/* Thời Gian */}
                        <td className="py-3.5 px-4 text-right text-slate-500">
                          <span className="font-medium text-xs text-slate-700 block">
                            {formatRelativeTime(tx.createdAt)}
                          </span>
                          <span className="text-slate-400 text-[10px] font-mono block mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>

                        {/* Thao Tác */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isSuccess && (
                              <button
                                type="button"
                                disabled={approvingId === tx.id}
                                onClick={() => handleApprove(tx.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                                title="Duyệt giao dịch và kích hoạt VIP cho học viên này ngay lập tức"
                              >
                                {approvingId === tx.id ? (
                                  <RefreshCw size={11} className="animate-spin" />
                                ) : (
                                  <Check size={11} className="stroke-[2.5]" />
                                )}
                                <span>Duyệt VIP</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={deletingId === tx.id}
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Xóa giao dịch này"
                            >
                              {deletingId === tx.id ? (
                                <RefreshCw size={13} className="animate-spin text-rose-500" />
                              ) : (
                                <Trash2 size={13} />
                              )}
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

          {/* Footer of Table */}
          <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Đang hiển thị <strong className="text-slate-900 font-mono">{displayedTransactions.length}</strong> trên tổng số{" "}
              <strong className="text-slate-900 font-mono">{filteredTransactions.length}</strong> giao dịch phù hợp
            </span>
            {filteredTransactions.length > 5 && displayLimit === 5 && (
              <button
                type="button"
                onClick={() => setDisplayLimit("ALL")}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer self-start sm:self-auto"
              >
                Xem tất cả {filteredTransactions.length} giao dịch →
              </button>
            )}
            {displayLimit === "ALL" && filteredTransactions.length > 5 && (
              <button
                type="button"
                onClick={() => setDisplayLimit(5)}
                className="text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer self-start sm:self-auto"
              >
                ← Thu gọn về 5 bản ghi mới nhất
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
