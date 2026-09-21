"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  Upload,
  X,
  FileText,
  CheckCircle2,
  Building2,
  Tag,
  ShieldCheck,
  Scale,
  Clock,
  Send,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { AppealGeneratorOutput } from "@/components/tools/AppealGeneratorOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

const VIOLATION_OPTIONS = [
  "Hàng giả / Hàng nhái (Nghi ngờ hàng Fake)",
  "Vi phạm quyền sở hữu trí tuệ (Bản quyền thương hiệu/Logo)",
  "Vi phạm bản quyền hình ảnh / Video sao chép",
  "Spam từ khóa, giật tít, mô tả sản phẩm sai lệch",
  "Giao dịch ảo / Búp đơn / Đánh giá ảo (Buff đơn)",
  "Tỷ lệ đơn hàng không thành công / Tỷ lệ hủy đơn quá cao",
  "Giao hàng trễ hạn / Thời gian chuẩn bị hàng quá lâu",
  "Gửi hàng sai / Gửi hộp rỗng / Tráo đổi hàng",
  "Điều hướng khách hàng ra ngoài sàn (Zalo/SĐT/Website ngoài)",
  "Sản phẩm cấm hoặc hạn chế kinh doanh (Y tế, TPCN, chất cấm,...)",
  "Nội dung phản cảm, khiêu dâm, bạo lực hoặc không an toàn",
  "Quảng cáo quá mức công dụng (Cam kết 100%, trị dứt điểm...)",
  "Trùng lặp sản phẩm / Nhân bản gian hàng spam",
  "Hành vi lừa đảo hoặc vi phạm tiêu chuẩn cộng đồng",
  "Khác (Tự nhập lý do vi phạm...)",
];

export default function AppealGenerator() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  // Form states
  const [platform, setPlatform] = useState("Shopee");
  const [violationType, setViolationType] = useState(VIOLATION_OPTIONS[0]);
  const [customViolationType, setCustomViolationType] = useState("");
  const [shopName, setShopName] = useState("");
  const [details, setDetails] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

  const [userQuota, setUserQuota] = useState<{
    isLogged: boolean;
    isVIP: boolean;
    remainingFree: number | null;
    dailyFreeLimit: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/ai/usage")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.dailyFreeLimit !== "undefined") {
          setUserQuota({
            isLogged: !!data.isLogged,
            isVIP: !!data.isVIP,
            remainingFree: data.remainingFree,
            dailyFreeLimit: data.dailyFreeLimit || 12,
          });
        }
      })
      .catch(() => { });
  }, [refreshTrigger]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageBase64(null);
  };

  const handleResetForm = () => {
    setPlatform("Shopee");
    setViolationType(VIOLATION_OPTIONS[0]);
    setCustomViolationType("");
    setShopName("");
    setDetails("");
    setImageBase64(null);
    setResult("");
  };

  const handleUseSample = () => {
    setPlatform("Shopee");
    setViolationType(VIOLATION_OPTIONS[0]);
    setCustomViolationType("");
    setShopName("TuKi Store Official");
    setDetails(
      "Sản phẩm kem dưỡng da của shop bị AI quét khóa với lý do nghi ngờ hàng nhái. Shop có hóa đơn VAT nhập khẩu chính ngạch từ công ty phân phối và tem phụ tiếng Việt đầy đủ."
    );
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("appeal-generator", true); // VIP Only
    if (!hasAccess) return;

    const finalViolationType = violationType.startsWith("Khác")
      ? customViolationType.trim()
      : violationType;

    if (violationType.startsWith("Khác") && !customViolationType.trim()) {
      showWarning("Vui lòng nhập lý do vi phạm cụ thể của bạn!", "Thiếu Thông Tin");
      return;
    }

    if (!shopName.trim() || (!details.trim() && !imageBase64)) {
      showWarning("Vui lòng cung cấp Tên Shop và Mô tả chi tiết hoặc Ảnh chụp màn hình!", "Thiếu Dữ Liệu");
      return;
    }

    setLoading(true);
    setResult("");
    setMobileTab("result");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "appeal-generator",
          inputs: {
            platform,
            violationType: finalViolationType,
            shopName: shopName.trim(),
            details: details.trim(),
            imageBase64,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showAiError(data, "Có lỗi xảy ra khi tạo văn bản kháng nghị");
      }
    } catch (error) {
      showAiError({ error: "Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại mạng hoặc token." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 h-full lg:overflow-hidden pb-3">
      <GateModals />

      {/* 1. Header Navigation & Quick Actions */}
      <div className="shrink-0 mb-3 space-y-2">
        {/* Mobile Top Bar: Breadcrumb + Badges */}
        <div className="md:hidden flex items-center justify-between pb-1">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand transition-colors"
          >
            <ArrowLeft size={13} /> Kho công cụ AI
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
              <Crown size={12} className="text-amber-600 dark:text-amber-400" />
              VIP
            </span>
            <AiUsageBadge tool="appeal-generator" refreshTrigger={refreshTrigger} historyOnly />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            {/* Desktop Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/tools" className="hover:text-rose-600 transition-colors flex items-center gap-1 text-slate-500">
                <ArrowLeft size={13} /> Kho Công Cụ AI
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Vận Hành & Xử Lý Rủi Ro</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/80 flex items-center justify-center text-rose-500 dark:text-rose-400 shadow-xs shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    AI Kháng Nghị Vi Phạm
                  </h1>
                  {/* Minimal icon-only reset button: ONLY ON MOBILE */}
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="md:hidden w-7 h-7 rounded-full bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer shadow-2xs active:scale-90"
                    title="Xóa Form / Đặt lại"
                    aria-label="Xóa Form"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider shrink-0">
                    <Crown size={11} className="text-amber-600 dark:text-amber-400" />
                    VIP TOOL
                  </span>
                </div>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Tạo chiến lược giải trình pháp lý và mẫu đơn khiếu nại chuẩn sàn tăng tỷ lệ mở shop &amp; sản phẩm bị khóa.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="appeal-generator" refreshTrigger={refreshTrigger} />
            <button
              type="button"
              onClick={handleUseSample}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
            >
              <Sparkles size={14} /> Thử Mẫu Vi Phạm
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <RotateCcw size={14} /> Xóa Form
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <MobileToolTabs
        activeTab={mobileTab}
        onChangeTab={setMobileTab}
        hasResult={Boolean(result)}
        loading={loading}
        resultLabel="Đơn Kháng Nghị"
      />

      {/* Grid 2 Cột: Cuộn độc lập trên Desktop, Chuyển tab trên Mobile */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM THÔNG TIN VI PHẠM (cuộn độc lập) */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* Header Khối Form */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shadow-2xs">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                      Thông Tin Vi Phạm
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  Chuẩn Sàn TMĐT
                </span>
              </div>

              {/* Sàn TMĐT & Tên Shop */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sàn TMĐT <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all cursor-pointer"
                  >
                    <option>Shopee</option>
                    <option>TikTok Shop</option>
                    <option>Facebook</option>
                    <option>Lazada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Building2 size={12} className="text-rose-500" />
                    Tên Shop <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="VD: TuKi Store..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Loại Vi Phạm */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Tag size={12} className="text-rose-500" />
                  Loại Vi Phạm (Lý do bị quét khóa) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all cursor-pointer"
                >
                  {VIOLATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                {/* Ô nhập tuỳ chỉnh khi chọn mục Khác */}
                {violationType.startsWith("Khác") && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={customViolationType}
                      onChange={(e) => setCustomViolationType(e.target.value)}
                      placeholder="Nhập lý do cụ thể (VD: Trùng CCCD, đổi tài khoản ngân hàng...)"
                      className="w-full px-3 py-2 bg-rose-50/40 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-950 dark:text-rose-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all placeholder:text-slate-400"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Giải trình chi tiết */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <FileText size={12} className="text-rose-500" />
                    Giải Trình Chi Tiết Sự Việc <span className="text-rose-500">*</span>
                  </label>
                </div>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  placeholder="Kể ngắn gọn sự việc, lý do khách quan và các bằng chứng bạn có (hóa đơn VAT, tem mác, giấy ủy quyền, clip đóng gói)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              {/* Ảnh chụp thông báo vi phạm (Tùy chọn) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ảnh Chụp Thông Báo Phạt / Mã Lỗi (Tùy chọn)
                </label>

                {!imageBase64 ? (
                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-emerald-50/30 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all group">
                    <Upload size={18} className="text-slate-400 group-hover:text-emerald-500 mb-1" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-emerald-600">
                      Bấm để tải ảnh lên (PNG, JPG)
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      AI sẽ đọc thông báo phạt và tìm lỗ hổng quét của sàn
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={imageBase64}
                        alt="Ảnh vi phạm"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs"
                      />
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={13} /> Đã tải ảnh lên
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          AI sẽ đọc dữ liệu từ hình ảnh này
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Nút Submit */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !shopName.trim() || (!details.trim() && !imageBase64)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <ShieldAlert size={16} className="animate-spin" /> Đang Phân Tích & Viết Đơn Kháng Nghị...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Viết Đơn Kháng Nghị Bằng AI
                  </>
                )}
              </button>

              {/* Quota info */}
              <p aria-live="polite" className="text-[10px] text-center text-slate-400">
                {userQuota?.isLogged ? (
                  userQuota.isVIP ? (
                    <span className="text-amber-500 font-bold flex items-center justify-center gap-1">
                      <span>👑</span> VIP · Không giới hạn
                    </span>
                  ) : (
                    <span>
                      ⚡ Còn <strong className={userQuota.remainingFree === 0 ? "text-rose-500" : "text-emerald-500"}>{userQuota.remainingFree ?? 0}</strong>/{userQuota.dailyFreeLimit} lượt hôm nay · <Link href="/profile#pricing-section" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Nâng cấp VIP</Link>
                    </span>
                  )
                ) : (
                  <span>Tài khoản miễn phí được cấp lượt dùng mỗi ngày.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ ĐƠN KHÁNG NGHỊ (cuộn độc lập) */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>

          <AppealGeneratorOutput
            result={result}
            loading={loading}
            platform={platform}
            shopName={shopName}
            violationType={violationType.startsWith("Khác") ? (customViolationType || "Vi phạm khác") : violationType}
            onUseSample={handleUseSample}
          />
        </div>
      </div>
    </div>
  );
}
