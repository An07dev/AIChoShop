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
  Terminal,
  Play,
  Save,
  Cpu,
  Database,
  Activity,
  Layers,
  Lock,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  saveSystemSettingsAction,
  testOpenAiConnectionAction,
  changeAdminPasswordAction,
} from "@/app/admin/settings/actions";

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
    desc: "Nhanh, thông minh, chi phí tối ưu",
    badge: "Khuyên dùng",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    desc: "Đa phương thức mạnh nhất",
    badge: "Mạnh nhất",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    desc: "Hiệu năng cao cho viết lách",
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

  // State & Handler Đổi Mật Khẩu ADMIN
  const [currentAdminPassword, setCurrentAdminPassword] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentAdminPassword.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu Admin hiện tại.");
      return;
    }
    if (!newAdminPassword.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (newAdminPassword.trim().length < 6) {
      setPasswordError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newAdminPassword.trim() !== confirmAdminPassword.trim()) {
      setPasswordError("Xác nhận mật khẩu mới không khớp!");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeAdminPasswordAction({
        currentPassword: currentAdminPassword.trim(),
        newPassword: newAdminPassword.trim(),
        confirmPassword: confirmAdminPassword.trim(),
      });

      setIsChangingPassword(false);
      if (res.success) {
        setPasswordSuccess(res.message || "Đổi mật khẩu ADMIN thành công!");
        setCurrentAdminPassword("");
        setNewAdminPassword("");
        setConfirmAdminPassword("");
        showToast("Đổi mật khẩu ADMIN thành công! 🔒");
      } else {
        setPasswordError(res.error || "Không thể đổi mật khẩu Admin.");
        showToast(res.error || "Đổi mật khẩu thất bại!", "error");
      }
    } catch (err: any) {
      setIsChangingPassword(false);
      setPasswordError(err?.message || "Lỗi xử lý kết nối máy chủ.");
    }
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
        showToast("Kết nối OpenAI thành công! Key hoạt động tốt. ✅");
      } else {
        setTestResult({
          type: "error",
          message: res.error || "Không thể kết nối đến OpenAI.",
        });
        showToast("Kiểm tra kết nối thất bại! ❌", "error");
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
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
  const currentModelObj = POPULAR_MODELS.find(
    (m) => m.id.toLowerCase() === model.toLowerCase()
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-in fade-in slide-in-from-bottom-4 ${toast.type === "success"
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

      {/* ── HEADER CHÍNH ──────────────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Cài Đặt Hệ Thống & OpenAI API Key"
        subtitle="Cấu hình mô hình AI, quản trị Token OpenAI và đồng bộ trực tiếp với Database."
        icon={Settings}
        iconGradient="from-purple-600 to-indigo-600"
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
            Cấu hình DB
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-2 transition shadow-2xs hover:border-slate-300"
            >
              <span>Lấy Key tại OpenAI</span>
              <ExternalLink size={13} className="text-slate-400" />
            </a>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Lưu Cấu Hình</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* ── METRIC CARDS OVERVIEW (4 THẺ TỔNG QUAN CÂN ĐỐI) ────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Trạng thái OpenAI Cloud */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Nguồn Mô Hình AI
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOpenAiActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <span className="text-sm font-black text-slate-900">
                {isOpenAiActive ? "OpenAI Cloud" : "Ollama Local"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              {isOpenAiActive ? "Đang bật cho toàn bộ Tools" : "Đang dùng model nội bộ"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpenAiActive(!isOpenAiActive)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isOpenAiActive ? "bg-blue-600" : "bg-slate-300"
              }`}
            title="Bật/Tắt OpenAI Cloud"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isOpenAiActive ? "translate-x-5" : "translate-x-0"
                }`}
            />
          </button>
        </div>

        {/* Card 2: Model Đang Chọn */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Mô Hình Mặc Định
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 truncate max-w-[140px]">
                {currentModelObj ? currentModelObj.name : model}
              </span>
            </div>
            <span className="text-[10px] font-mono text-blue-600 font-semibold block truncate">
              {model}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Cpu size={20} />
          </div>
        </div>

        {/* Card 3: Trạng thái API Key */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Khóa API Key
            </span>
            <div className="flex items-center gap-1.5">
              {hasKey ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <ShieldCheck size={13} className="text-emerald-600" /> Sẵn Sàng
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <AlertCircle size={13} className="text-amber-600" /> Chưa Có Key
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">
              {apiKey ? `${apiKey.slice(0, 10)}... (${apiKey.length} ký tự)` : "Vui lòng nhập Key"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Key size={20} />
          </div>
        </div>

        {/* Card 4: Kiểm Tra Nhanh Kết Nối */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Kiểm Tra Key & Quota
            </span>
            <div className="text-sm font-black text-slate-900">
              {testResult?.type === "success" ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Hoạt Động Tốt
                </span>
              ) : testResult?.type === "error" ? (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertCircle size={14} /> Kiểm Tra Lại
                </span>
              ) : (
                <span className="text-slate-600">Sẵn Sàng Ping</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Gửi ping test 5 tokens
            </span>
          </div>

          <button
            type="button"
            disabled={isTesting || !apiKey}
            onClick={handleTestConnection}
            className="w-10 h-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 transition active:scale-95 disabled:opacity-40 cursor-pointer shadow-2xs"
            title="Kiểm tra kết nối OpenAI ngay"
          >
            {isTesting ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Zap size={18} />
            )}
          </button>
        </div>
      </div>

      {/* ── BỐ CỤC CHÍNH 2 CỘT CÂN ĐỐI (7 CỘT TRÁI - 5 CỘT PHẢI) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===================== CỘT TRÁI (7 CỘT): FORM CẤU HÌNH CHÍNH ===================== */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* THẺ 1: CẤU HÌNH API KEY */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Key size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      OpenAI API Key (Token)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Khóa bí mật dùng để kết nối với dịch vụ OpenAI API chính thức.
                    </p>
                  </div>
                </div>

                {hasKey && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Check size={12} /> Hợp lệ
                  </span>
                )}
              </div>

              {/* Ô Nhập API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Khóa API Key (Token):
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
                    className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                      title={showApiKey ? "Ẩn Key" : "Hiện Key"}
                    >
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyKey}
                      disabled={!apiKey}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer disabled:opacity-40"
                      title="Sao chép Key"
                    >
                      {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 pt-0.5">
                  Khóa bắt đầu bằng <code>sk-...</code>. Được mã hóa và lưu trực tiếp trong Database máy chủ.
                </p>
              </div>

              {/* Tùy chỉnh Base URL */}
              <div className="pt-4 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tùy Chỉnh Base URL (Tùy chọn):
                  </label>
                  {baseUrl && (
                    <button
                      type="button"
                      onClick={() => setBaseUrl("")}
                      className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Đặt lại mặc định
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1 (Để trống nếu dùng mặc định)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />

                <p className="text-[11px] text-slate-400">
                  Dành riêng cho trường hợp bạn sử dụng Reverse Proxy hoặc Azure OpenAI Gateway.
                </p>
              </div>
            </div>

            {/* THẺ 2: CHỌN MÔ HÌNH AI (MODEL) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Mô Hình Trí Tuệ Nhân Tạo (Model)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Chọn model phù hợp với ngân sách và độ thông minh mong muốn.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {model}
                </span>
              </div>

              {/* Lưới 4 Model (2x2 cân đối) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POPULAR_MODELS.map((m) => {
                  const isSelected = model.toLowerCase() === m.id.toLowerCase();
                  return (
                    <div
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between active:scale-98 ${isSelected
                        ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60"
                        }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-xs font-black ${isSelected ? "text-blue-950" : "text-slate-900"}`}>
                            {m.name}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${m.badgeColor}`}>
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

              {/* Model tùy chỉnh */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hoặc nhập Model tùy chỉnh khác:
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ví dụ: gpt-4o-mini, gpt-4o, o1-mini..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Footer nút Lưu Cấu Hình */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <span className="text-[11px] text-slate-400">
                  * Tự động áp dụng tức thì cho 11 công cụ AI.
                </span>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Đang lưu cấu hình...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Lưu Thay Đổi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ===================== CỘT PHẢI (5 CỘT): TESTER, DIAGNOSTICS & API INFO ===================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* THẺ ĐỔI MẬT KHẨU ADMIN (NẰM TRÊN MỤC KIỂM TRA KẾT NỐI PING TEST) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Đổi Mật Khẩu ADMIN
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mật khẩu truy cập trang quản trị hệ thống (/admin-login).
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 text-[10px] font-black text-blue-700">
                Super Admin
              </span>
            </div>

            <form onSubmit={handleChangeAdminPassword} className="space-y-3.5">
              {/* Mật khẩu hiện tại */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu hiện tại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentAdminPassword}
                    onChange={(e) => {
                      setCurrentAdminPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Mật khẩu Admin đang dùng..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newAdminPassword}
                    onChange={(e) => {
                      setNewAdminPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmAdminPassword}
                    onChange={(e) => {
                      setConfirmAdminPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Nhập lại mật khẩu mới..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Thông báo lỗi / thành công */}
              {passwordError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-in fade-in duration-200">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in duration-200">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {/* Nút submit */}
              <button
                type="submit"
                disabled={isChangingPassword || !currentAdminPassword || !newAdminPassword || !confirmAdminPassword}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isChangingPassword ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Đang cập nhật mật khẩu Admin...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    <span>Cập Nhật Mật Khẩu ADMIN</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* THẺ 3: KIỂM TRA TRỰC TIẾP KẾT NỐI (TEST KEY) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kiểm Tra Kết Nối (Ping Test)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Gửi 1 request 5 tokens đến OpenAI để kiểm tra Key và hạn ngạch.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isTesting || !apiKey}
              onClick={handleTestConnection}
              className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            >
              {isTesting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Đang liên lạc với máy chủ OpenAI...</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Gửi Thử Nghiệm Kết Nối Ngay</span>
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs animate-in fade-in duration-200 ${testResult.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
              >
                <div className="flex items-start gap-2.5">
                  {testResult.type === "success" ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 min-w-0">
                    <div className="font-bold text-xs">{testResult.message}</div>
                    {testResult.sampleReply && (
                      <div className="text-[10px] text-emerald-700 font-mono bg-white/80 px-2 py-1 rounded border border-emerald-200/60 break-all">
                        Phản hồi: &quot;{testResult.sampleReply}&quot;
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* THẺ 5: THÔNG TIN LƯU TRỮ CSDL */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-start gap-3 text-xs">
            <div className="p-2 rounded-xl bg-slate-200 text-slate-700 shrink-0 mt-0.5">
              <Database size={16} />
            </div>
            <div className="space-y-0.5 text-slate-600">
              <h4 className="font-bold text-slate-800 text-xs">
                Lưu trữ Trực tiếp trong Database
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Hệ thống tự động đồng bộ cấu hình qua bảng <code>SystemSetting</code> trong CSDL PostgreSQL. Không cần chỉnh sửa file <code>.env</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
