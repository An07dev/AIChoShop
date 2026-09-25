"use client";

import { useState, useEffect } from "react";
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
import { useAdminMutation } from "@/hooks/useAdminMutation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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
    configured: boolean;
    syntaxPrefix: string;
    autoActivate: boolean;
  };
  showHeader?: boolean;
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
  showHeader = false,
}: SePayConfigManagerProps) {
  const [config, setConfig] = useState(initialConfig);
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [isPending, startTransition] = useAdminMutation((message) => showToast(message, "error"));

  useEffect(() => {
    if (typeof window !== "undefined") {
      queueMicrotask(() => setWebhookUrl(`${window.location.origin}/api/webhooks/sepay`));
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
    apiKey: "",
    syntaxPrefix: "ACS",
    autoActivate: config.autoActivate,
  });

  // Simulator State
  const [simQuery, setSimQuery] = useState("");
  const [simAmount, setSimAmount] = useState(200000);
  const [simResult, setSimResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Xử lý lưu cấu hình
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveSePayConfigAction(formData);
      if (res.success) {
        showToast("Đã lưu cấu hình SePay!");
        setConfig((prev) => ({ ...prev, ...formData, configured: !!res.configured }));
        setFormData(prev => ({ ...prev, apiKey: "" }));
      } else {
        showToast(res.error || "Không thể lưu cấu hình", "error");
      }
    });
  };

  // Xử lý chạy giả lập Webhook
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simQuery.trim()) {
      showToast("Vui lòng nhập Mã thanh toán ACS", "error");
      return;
    }

    setIsSimulating(true);
    setSimResult(null);

    try {
      const res = await simulateSePayWebhookAction({
        paymentCode: simQuery.trim(),
        amount: Number(simAmount),
      });

      setSimResult(res);
      if (res.success) {
        showToast(res.message || "Đã kích hoạt thử thành công!");
      } else {
        showToast(res.error || "Thử nghiệm thất bại", "error");
      }
    } catch {
      setSimResult({ success: false, error: "Không kiểm tra được yêu cầu." });
      showToast("Không kiểm tra được yêu cầu. Hãy thử lại.", "error");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 ${toast.type === "success"
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

      {/* ── TIÊU ĐỀ TRANG CỔNG SEPAY & WEBHOOK (NẾU BẬT) ─────────────────────────── */}
      {showHeader && (
        <AdminPageHeader
          title="Cổng Thanh Toán SePay & Lịch Sử Nạp VIP"
          subtitle="Cấu hình tài khoản ngân hàng nhận tiền, kiểm tra Webhook nạp VIP tự động và tra cứu giao dịch chuyển khoản."
          icon={CreditCard}
          iconGradient="from-blue-600 to-cyan-600"
          badge={
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              Tự Động 24/7
            </span>
          }
        />
      )}

      {/* Webhook URL Bar (Gọn gàng, thanh lịch) */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs text-blue-700 bg-blue-50/70 px-3 py-2 rounded-lg border border-blue-100 select-all truncate">
            {webhookUrl || "Đang tải URL..."}
          </div>
        </div>

        <button
          onClick={handleCopyUrl}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 shadow-xs ${copied
            ? "bg-emerald-600 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
            }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "Đã sao chép" : "URL Webhook"}</span>
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
                  value="ACS + mã riêng cho mỗi yêu cầu"
                  readOnly
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
                  placeholder={config.configured ? "Để trống để giữ khóa đã lưu" : "Bắt buộc cấu hình khóa webhook"}
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
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${formData.autoActivate
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
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${formData.autoActivate
                  ? "bg-emerald-500 shadow-md shadow-emerald-500/35"
                  : "bg-slate-300 hover:bg-slate-400"
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${formData.autoActivate ? "translate-x-5" : "translate-x-0"
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
              <label className="block font-bold text-slate-700 mb-1">Mã thanh toán ACS</label>
              <input
                type="text"
                required
                placeholder="ACS0123456789ABCDEF"
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
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition ${simAmount === 200000
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                >
                  200.000đ
                </button>
                <button
                  type="button"
                  onClick={() => setSimAmount(1290000)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition ${simAmount === 1290000
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                >
                  1.290.000đ
                </button>
                <button
                  type="button"
                  onClick={() => setSimAmount(1990000)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition ${simAmount === 1990000
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                >
                  1.990.000đ
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
                  <Play size={13} className="fill-white" /> Xem trước đối soát
                </>
              )}
            </button>
          </form>

          {/* Kết quả Test */}
          {simResult && (
            <div
              className={`p-3 rounded-xl border text-xs ${simResult.success
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

            </div>
          )}
        </div>
      </div>

    </div>
  );
}
