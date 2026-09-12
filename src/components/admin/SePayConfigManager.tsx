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
} from "lucide-react";
import { saveSePayConfigAction, simulateSePayWebhookAction } from "@/app/admin/sepay/actions";

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
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Tự động nâng VIP khi nhận tiền</span>
                <span className="text-[11px] text-slate-400">
                  {formData.autoActivate ? "Đang bật" : "Đang tắt (Lưu trạng thái chờ duyệt)"}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.autoActivate}
                  onChange={(e) => setFormData({ ...formData, autoActivate: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
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

      {/* Lịch Sử Giao Dịch Gần Đây */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Giao Dịch Gần Đây</h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {initialTransactions.length} giao dịch
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Mã GD</th>
                <th className="py-2.5 px-3">Học Viên</th>
                <th className="py-2.5 px-3 text-right">Số Tiền</th>
                <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                <th className="py-2.5 px-3 text-right">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {initialTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                    Chưa có giao dịch nào
                  </td>
                </tr>
              ) : (
                initialTransactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {tx.sepayId || tx.id.slice(0, 8)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block">{tx.user.name || "Học viên"}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{tx.user.email}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600">
                      {Number(tx.amount).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {tx.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                          Thành công
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                          Chờ duyệt
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
