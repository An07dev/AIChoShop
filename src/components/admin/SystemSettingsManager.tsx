"use client";

import { useState } from "react";
import {
  Settings,
  Key,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Copy,
  ExternalLink,
  Bot,
  Zap,
  ShieldCheck,
  Globe,
  Sliders,
  Terminal,
  Play,
  Save,
} from "lucide-react";
import { saveSystemSettingsAction, testOpenAiConnectionAction } from "@/app/admin/settings/actions";

interface SystemSettingsManagerProps {
  initialSettings: {
    id: string;
    openaiApiKey: string | null;
    openaiModel: string;
    openaiBaseUrl: string | null;
    isOpenAiActive: boolean;
  };
}

const POPULAR_MODELS = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    desc: "Nhanh, thông minh, chi phí cực thấp (Khuyên dùng)",
    badge: "Khuyên dùng",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    desc: "Mô hình đa phương thức thông minh và mạnh nhất",
    badge: "Mạnh nhất",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    desc: "Hiệu năng cao cho các tác vụ viết lách phức tạp",
    badge: "Turbo",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    desc: "Mô hình cơ bản thế hệ cũ",
    badge: "Cơ bản",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
  },
];

export function SystemSettingsManager({ initialSettings }: SystemSettingsManagerProps) {
  // Form State
  const [apiKey, setApiKey] = useState(initialSettings.openaiApiKey || "");
  const [model, setModel] = useState(initialSettings.openaiModel || "gpt-4o-mini");
  const [baseUrl, setBaseUrl] = useState(initialSettings.openaiBaseUrl || "");
  const [isOpenAiActive, setIsOpenAiActive] = useState(initialSettings.isOpenAiActive);

  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Test Connection Result
  const [testResult, setTestResult] = useState<{
    type: "success" | "error";
    message: string;
    sampleReply?: string;
  } | null>(null);

  // Live API Tester
  const [isCallingApi, setIsCallingApi] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Copy API Key
  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    showToast("Đã sao chép API Key vào bộ nhớ tạm");
    setTimeout(() => setCopied(false), 2000);
  };

  // Kiểm tra kết nối thử nghiệm
  const handleTestConnection = async () => {
    setTestResult(null);
    if (!apiKey || !apiKey.trim()) {
      setTestResult({
        type: "error",
        message: "Vui lòng nhập OpenAI API Key vào ô bên dưới trước khi kiểm tra.",
      });
      return;
    }

    setIsTesting(true);
    try {
      const res = await testOpenAiConnectionAction({
        apiKey: apiKey.trim(),
        model: model.trim(),
        baseUrl: baseUrl.trim() || undefined,
      });

      setIsTesting(false);
      if (res.success) {
        setTestResult({
          type: "success",
          message: res.message || "Kiểm tra kết nối thành công!",
          sampleReply: res.sampleReply,
        });
        showToast("✅ Kết nối OpenAI thành công! Key hoạt động tốt.");
      } else {
        setTestResult({
          type: "error",
          message: res.error || "Không thể kết nối đến OpenAI.",
        });
        showToast("❌ Kiểm tra kết nối thất bại!", "error");
      }
    } catch (err: any) {
      setIsTesting(false);
      setTestResult({
        type: "error",
        message: err.message || "Lỗi kết nối máy chủ",
      });
    }
  };

  // Lưu cấu hình hệ thống
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await saveSystemSettingsAction({
        openaiApiKey: apiKey.trim(),
        openaiModel: model.trim(),
        openaiBaseUrl: baseUrl.trim(),
        isOpenAiActive,
      });

      setIsSaving(false);
      if (res.success) {
        showToast("Đã lưu cấu hình OpenAI vào CSDL thành công! 🎉");
      } else {
        showToast(res.error || "Không thể lưu cấu hình.", "error");
      }
    } catch (err: any) {
      setIsSaving(false);
      showToast(err.message || "Lỗi khi lưu cấu hình", "error");
    }
  };

  // Test gọi API /api/settings/openai thực tế
  const handleCallApiDirectly = async () => {
    setIsCallingApi(true);
    setApiResponse(null);
    try {
      const res = await fetch("/api/settings/openai");
      const data = await res.json();
      setApiResponse(data);
      setIsCallingApi(false);
    } catch (err: any) {
      setApiResponse({ success: false, error: err.message || "Lỗi gọi API" });
      setIsCallingApi(false);
    }
  };

  const hasKey = Boolean(apiKey && apiKey.trim().length > 10);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === "success"
              ? "bg-slate-900 text-emerald-400 border border-emerald-500/30"
              : "bg-rose-950 text-rose-300 border border-rose-500/30"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
              <Settings size={22} />
            </div>
            Cài Đặt Hệ Thống & OpenAI API Key
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý Token OpenAI, cấu hình mô hình AI và cung cấp API lấy token trực tiếp từ CSDL (Không cần sửa file .env).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <span>Lấy Key tại OpenAI</span>
            <ExternalLink size={13} className="text-slate-400" />
          </a>
        </div>
      </div>

      {/* Alert thông báo không cần file .env */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white border border-blue-200/80 flex items-start gap-3.5 shadow-2xs">
        <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-xs">
          <Sparkles size={16} />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-slate-900 text-sm">
            Cấu hình Độc Lập qua Database & API
          </h4>
          <p className="text-slate-600 leading-relaxed">
            Từ phiên bản này, bạn <strong>không cần phải thêm hoặc chỉnh sửa biến OPENAI_API_KEY trong file .env</strong> nữa.
            Toàn bộ khóa API (Token) và tùy chọn Model được lưu trữ tập trung trong Cơ sở dữ liệu và có thể gọi qua API <code>/api/settings/openai</code>.
            Mọi thay đổi sẽ có <strong>hiệu lực tức thì</strong> cho tất cả công cụ AI (KOC Planner, Title Spinner, SEO Optimizer, Appeal Generator, v.v.).
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── CARD 1: CẤU HÌNH KHÓA OPENAI API KEY ────────────────────────── */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                <Key size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  OpenAI API Key (Token)
                </h2>
                <p className="text-xs text-slate-500">
                  Khóa bí mật dùng để kết nối với dịch vụ OpenAI API chính thức.
                </p>
              </div>
            </div>

            {/* Trạng thái key */}
            <div>
              {hasKey ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Đã cấu hình Key (Sẵn sàng)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <AlertCircle size={14} className="text-amber-600" />
                  Chưa có Key (Vui lòng nhập)
                </span>
              )}
            </div>
          </div>

          {/* Switch Bật/Tắt OpenAI */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl text-white ${isOpenAiActive ? "bg-blue-600" : "bg-slate-400"}`}>
                <Bot size={18} />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">
                  Kích hoạt OpenAI Cloud API
                </div>
                <div className="text-[11px] text-slate-500">
                  {isOpenAiActive
                    ? "Đang sử dụng OpenAI Cloud (Nhanh, thông minh, ổn định)"
                    : "Đang tắt OpenAI -> Hệ thống sẽ chuyển hướng sang mô hình Ollama Local"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpenAiActive(!isOpenAiActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isOpenAiActive ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isOpenAiActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Ô Nhập API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Khóa OpenAI API Key (Token):
              </label>
              {apiKey && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Độ dài: {apiKey.length} ký tự
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                  title={showApiKey ? "Ẩn Key" : "Hiện Key"}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>

                <button
                  type="button"
                  onClick={handleCopyKey}
                  disabled={!apiKey}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer disabled:opacity-40"
                  title="Sao chép Key"
                >
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <span>Khóa của bạn bắt đầu bằng <code>sk-...</code>. Luôn giữ bí mật và không chia sẻ công khai.</span>
            </p>
          </div>

          {/* ── CARD 2: CHỌN MÔ HÌNH AI (MODEL) ────────────────────────── */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Chọn Mô Hình AI (Model):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {POPULAR_MODELS.map((m) => {
                const isSelected = model.toLowerCase() === m.id.toLowerCase();
                return (
                  <div
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between active:scale-98 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-xs font-black ${isSelected ? "text-blue-900" : "text-slate-900"}`}>
                          {m.name}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${m.badgeColor}`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {m.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">{m.id}</span>
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          <Check size={10} className="stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">Chọn</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Model nhập tùy chỉnh */}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 shrink-0">Model tùy chỉnh khác:</span>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ví dụ: gpt-4o-mini, gpt-4o, o1-mini..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* ── CARD 3: BASE URL TÙY BIẾN (TÙY CHỌN) ────────────────────────── */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Tùy Chỉnh Base URL (Tùy chọn cho Proxy / Azure):
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1 (Để trống nếu dùng mặc định của OpenAI)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              {baseUrl && (
                <button
                  type="button"
                  onClick={() => setBaseUrl("")}
                  className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Đặt lại mặc định
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Nếu bạn không sử dụng Reverse Proxy hoặc Azure OpenAI Gateway, vui lòng để trống ô này.
            </p>
          </div>

          {/* Hộp Test Kết Nối (Kiểm tra Key hoạt động) */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Kiểm Tra Trực Tiếp Kết Nối (Test Key)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Gửi 1 request thử nghiệm đến OpenAI để đảm bảo Key hoạt động và còn Credit.
                </p>
              </div>

              <button
                type="button"
                disabled={isTesting || !apiKey}
                onClick={handleTestConnection}
                className="px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Đang kiểm tra kết nối...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>Kiểm Tra Kết Nối Ngay</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-2xl border text-xs animate-in fade-in duration-200 ${
                  testResult.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {testResult.type === "success" ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold">{testResult.message}</div>
                    {testResult.sampleReply && (
                      <div className="text-[11px] text-emerald-700 font-mono bg-white/70 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 inline-block">
                        Phản hồi từ OpenAI: &quot;{testResult.sampleReply}&quot;
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer nút Lưu Cấu Hình */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-slate-500 font-medium">
              * Thay đổi sẽ được ghi đè trực tiếp vào bảng cấu hình hệ thống (Database).
            </span>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-600/25 flex items-center gap-2 cursor-pointer active:scale-95 transition disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Đang lưu cấu hình...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Lưu Cấu Hình Hệ Thống</span>
                </>
              )}
            </button>
          </div>
        </section>
      </form>

      {/* ── CARD 4: API ENDPOINT TÍCH HỢP CHO CLIENT / DEVELOPER ────────────────────────── */}
      <section className="bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-7 shadow-lg space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-800 text-blue-400 border border-slate-700">
              <Terminal size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                API Endpoint Lấy Token & Cấu Hình
              </h3>
              <p className="text-xs text-slate-400">
                Sử dụng API này để lấy field <code>token</code> hoặc cập nhật key từ ứng dụng khác.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCallApiDirectly}
            disabled={isCallingApi}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
          >
            {isCallingApi ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Đang gọi API...</span>
              </>
            ) : (
              <>
                <Play size={13} className="fill-white" />
                <span>Gọi Thử API Trực Tiếp</span>
              </>
            )}
          </button>
        </div>

        {/* Thông tin API */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-emerald-400 font-bold flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                GET
              </span>
              <span>/api/settings/openai</span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans">
              Trả về cấu hình hiện tại và field <code>token</code> để các module AI sử dụng.
            </p>
            <pre className="text-[11px] text-slate-300 bg-slate-900/90 p-3 rounded-xl overflow-x-auto">
{`// JSON Phản Hồi:
{
  "success": true,
  "token": "sk-...",
  "apiKey": "sk-...",
  "model": "${model}",
  "isOpenAiActive": ${isOpenAiActive}
}`}
            </pre>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-blue-400 font-bold flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px]">
                POST
              </span>
              <span>/api/settings/openai</span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans">
              Lưu hoặc cập nhật token / apiKey mới vào Database qua HTTP Request.
            </p>
            <pre className="text-[11px] text-slate-300 bg-slate-900/90 p-3 rounded-xl overflow-x-auto">
{`// Body gửi lên:
{
  "token": "sk-proj-...",
  "model": "gpt-4o-mini",
  "isOpenAiActive": true
}`}
            </pre>
          </div>
        </div>

        {/* Khung hiển thị kết quả gọi thử API sống */}
        {apiResponse && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" /> Kết quả gọi thử GET /api/settings/openai:
              </span>
              <button
                type="button"
                onClick={() => setApiResponse(null)}
                className="text-slate-500 hover:text-slate-300 text-[11px] cursor-pointer"
              >
                Đóng
              </button>
            </div>
            <pre className="text-xs text-emerald-400 font-mono bg-slate-900 p-3.5 rounded-xl overflow-x-auto max-h-48 custom-scrollbar">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
