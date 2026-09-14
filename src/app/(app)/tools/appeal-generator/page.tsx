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

  // Form states (giữ nguyên toàn bộ logic cũ)
  const [platform, setPlatform] = useState("Shopee");
  const [violationType, setViolationType] = useState(VIOLATION_OPTIONS[0]);
  const [customViolationType, setCustomViolationType] = useState("");
  const [shopName, setShopName] = useState("");
  const [details, setDetails] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [userQuota, setUserQuota] = useState<{
    isLogged: boolean;
    isVIP: boolean;
    remainingFree: number | null;
    dailyFreeLimit: number;
  } | null>(null);

  // Khóa cuộn trang chính trên desktop, chỉ cho phép cuộn nội bộ phần input và output
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        main.style.overflow = "hidden";
      } else {
        main.style.overflow = "auto";
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      main.style.overflow = "";
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
      .catch(() => {});
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
    <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0 overflow-hidden">
      <GateModals />

      {/* 1. Header & Breadcrumb thu gọn */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/tools" className="hover:text-rose-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Kho Công Cụ AI
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Xử Lý Khiếu Nại & Khủng Hoảng</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
            AI Xử Lý Khủng Hoảng
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider">
              <Crown size={11} className="text-amber-600 dark:text-amber-400" />
              VIP TOOL
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 uppercase tracking-wide border border-rose-200 dark:border-rose-800">
              Kháng Nghị Vi Phạm
            </span>
          </h1>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2 shrink-0">
          <AiUsageBadge tool="appeal-generator" refreshTrigger={refreshTrigger} />
          <button
            type="button"
            onClick={handleUseSample}
            className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles size={14} /> Thử Mẫu Vi Phạm
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} /> Xóa Form
          </button>
        </div>
      </div>

      {/* 2. Khu vực thao tác chính 2 cột: Cả 2 cuộn độc lập, trang ngoài không cuộn */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="w-full lg:w-[460px] xl:w-[480px] shrink-0 flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Header cột trái */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldAlert size={15} className="text-rose-500" />
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Hồ Sơ Vi Phạm & Shop</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400 font-semibold">
              {details.length} ký tự
            </span>
          </div>

          {/* Form inputs cuộn nội bộ */}
          <div className="p-3.5 sm:p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain space-y-3.5">
            {/* 3 Thẻ tóm tắt tính năng */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl border border-rose-200/70 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 dark:text-rose-300">
                  <ShieldCheck size={13} className="text-rose-500 shrink-0" />
                  Luật Sàn
                </div>
                <p className="text-[10px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">Bám sát chính sách</p>
              </div>
              <div className="p-2 rounded-xl border border-pink-200/70 dark:border-pink-900/40 bg-pink-50/40 dark:bg-pink-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-pink-900 dark:text-pink-300">
                  <FileText size={13} className="text-pink-500 shrink-0" />
                  2 Khối
                </div>
                <p className="text-[10px] text-pink-700/80 dark:text-pink-400/80 mt-0.5">Chiến lược & Lá đơn</p>
              </div>
              <div className="p-2 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <Scale size={13} className="text-amber-500 shrink-0" />
                  Tỷ Lệ Mở
                </div>
                <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">Lập luận chuyên sâu</p>
              </div>
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-hidden transition-all cursor-pointer"
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-hidden transition-all placeholder:text-slate-400"
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-hidden transition-all cursor-pointer"
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
                    className="w-full px-3 py-2 bg-rose-50/40 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-950 dark:text-rose-200 focus:ring-2 focus:ring-rose-500 focus:outline-hidden transition-all placeholder:text-slate-400"
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
                <span className="text-[10px] text-slate-400">
                  Lý do khách quan & bằng chứng
                </span>
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                placeholder="Kể ngắn gọn sự việc, lý do khách quan và các bằng chứng bạn có (hóa đơn VAT, tem mác, giấy ủy quyền, clip đóng gói)..."
                className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden transition-all resize-none placeholder:text-slate-400 leading-relaxed"
              />
            </div>

            {/* Ảnh chụp thông báo vi phạm (Tùy chọn) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Ảnh Chụp Thông Báo Phạt / Mã Lỗi (Tùy chọn)
              </label>

              {!imageBase64 ? (
                <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-rose-50/30 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all group">
                  <Upload size={18} className="text-slate-400 group-hover:text-rose-500 mb-1" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-rose-600">
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

            {/* Tips Card */}
            <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock size={13} className="text-rose-500" /> Bí quyết gỡ gậy & mở khóa shop thành công:
              </p>
              <p>• <strong>Bằng chứng xác thực:</strong> Kèm số hóa đơn VAT, vận đơn hoặc video đóng hàng để tăng 90% tỷ lệ xét duyệt.</p>
              <p>• <strong>Thái độ văn minh:</strong> Thừa nhận lỗi hiểu nhầm thuật toán, cam kết khắc phục thay vì tranh cãi gay gắt.</p>
            </div>
          </div>

          {/* Nút Submit ghim cố định ở đáy cột trái */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-1.5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !shopName.trim() || (!details.trim() && !imageBase64)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 hover:from-rose-600 hover:via-rose-700 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
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

            {/* Thông tin quota tài khoản */}
            <p aria-live="polite" className="text-[10px] text-center text-slate-400">
              {userQuota?.isLogged ? (
                userQuota.isVIP ? (
                  <span className="text-amber-500 font-bold flex items-center justify-center gap-1">
                    <span>👑</span> VIP · Không giới hạn
                  </span>
                ) : (
                  <span>
                    ⚡ Còn <strong className={userQuota.remainingFree === 0 ? "text-rose-500" : "text-emerald-500"}>{userQuota.remainingFree ?? 0}</strong>/{userQuota.dailyFreeLimit} lượt hôm nay · <Link href="/profile#pricing-section" className="text-rose-600 dark:text-rose-400 font-bold hover:underline">Nâng cấp VIP</Link>
                  </span>
                )
              ) : (
                <span>Tài khoản miễn phí được cấp lượt dùng mỗi ngày.</span>
              )}
            </p>
          </div>
        </div>

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ ĐƠN KHÁNG NGHỊ */}
        <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
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
