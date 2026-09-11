"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  Upload,
  X,
  FileText,
  Sparkle,
  CheckCircle2,
  AlertCircle,
  Building2,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { AppealGeneratorOutput } from "@/components/tools/AppealGeneratorOutput";
import { TextDots } from "@/components/ui/text-dots";

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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  // Form states (giữ nguyên toàn bộ logic cũ)
  const [platform, setPlatform] = useState("Shopee");
  const [violationType, setViolationType] = useState(VIOLATION_OPTIONS[0]);
  const [customViolationType, setCustomViolationType] = useState("");
  const [shopName, setShopName] = useState("");
  const [details, setDetails] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);

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
  };

  const handleUseSample = () => {
    setPlatform("Shopee");
    setViolationType(VIOLATION_OPTIONS[0]);
    setCustomViolationType("");
    setShopName("TuKi Store Official");
    setDetails("Sản phẩm kem dưỡng da của shop bị AI quét khóa với lý do nghi ngờ hàng nhái. Shop có hóa đơn VAT nhập khẩu chính ngạch từ công ty phân phối và tem phụ tiếng Việt đầy đủ.");
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("appeal-generator", true); // VIP Only
    if (!hasAccess) return;

    const finalViolationType = violationType.startsWith("Khác")
      ? customViolationType.trim()
      : violationType;

    if (violationType.startsWith("Khác") && !customViolationType.trim()) {
      alert("Vui lòng nhập lý do vi phạm cụ thể của bạn!");
      return;
    }

    if (!shopName.trim() || (!details.trim() && !imageBase64)) {
      alert("Vui lòng cung cấp Tên Shop và Mô tả chi tiết hoặc Ảnh chụp màn hình!");
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
          inputs: { platform, violationType: finalViolationType, shopName: shopName.trim(), details: details.trim(), imageBase64 },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        alert("Có lỗi xảy ra: " + (data.error || "Vui lòng thử lại"));
      }
    } catch (error) {
      alert("Không thể kết nối đến máy chủ AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col min-h-0">
      <GateModals />

      {/* Thanh tiêu đề thu gọn trên 1 dòng */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition-colors shadow-sm"
            title="Quay lại kho công cụ"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  AI Kháng Nghị Vi Phạm
                </h1>
                <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                  VIP ONLY
                </span>
              </div>
              <p className="text-slate-400 text-xs hidden sm:block">
                Tự động viết đơn xin mở khóa shop/sản phẩm với văn phong thuyết phục nhất.
              </p>
            </div>
          </div>
        </div>

        {/* Nút thử nội dung mẫu */}
        <button
          onClick={handleUseSample}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
        >
          <Sparkle size={13} className="text-rose-500 fill-rose-500" />
          <span>Thử mẫu vi phạm</span>
        </button>
      </div>

      {/* Khu vực thao tác chính 2 cột chiếm trọn chiều cao còn lại */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái: Form nhập thông tin vi phạm */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Form */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-500" />
              <h2 className="font-bold text-slate-800 text-sm">Thông tin vi phạm & Shop</h2>
            </div>
            {(shopName || details || imageBase64 || customViolationType) && (
              <button
                onClick={handleResetForm}
                className="text-xs font-medium text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer"
                title="Làm mới form"
              >
                <RotateCcw size={12} /> Làm mới
              </button>
            )}
          </div>

          {/* Form scrollable content */}
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3.5">
            {/* Sàn TMĐT & Tên Shop */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sàn TMĐT
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold text-slate-800"
                >
                  <option>Shopee</option>
                  <option>TikTok Shop</option>
                  <option>Facebook</option>
                  <option>Lazada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Building2 size={12} className="text-slate-400" />
                  Tên Shop <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="VD: TuKi Store"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Loại Vi Phạm */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Tag size={12} className="text-slate-400" />
                Loại Vi Phạm (Lý do bị khóa)
              </label>
              <select
                value={violationType}
                onChange={(e) => setViolationType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold text-slate-800 cursor-pointer"
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
                    placeholder="Nhập lý do hoặc lỗi vi phạm cụ thể của bạn (VD: Trùng CCCD, đổi tài khoản ngân hàng...)"
                    className="w-full px-3 py-2 bg-rose-50/40 border border-rose-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all font-semibold text-rose-950 placeholder:text-slate-400"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Giải trình chi tiết */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <FileText size={12} className="text-slate-400" />
                  Giải trình chi tiết của bạn <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {details.length} ký tự
                </span>
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                placeholder="Kể ngắn gọn sự việc, lý do khách quan và các bằng chứng bạn có (hóa đơn, tem mác, giấy ủy quyền, clip đóng gói)..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none placeholder:text-slate-400 leading-relaxed"
              ></textarea>
            </div>

            {/* Ảnh chụp thông báo vi phạm (Tùy chọn) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ảnh chụp thông báo vi phạm (Tùy chọn)
              </label>

              {!imageBase64 ? (
                <label className="border-2 border-dashed border-slate-200 hover:border-rose-400 bg-slate-50/60 hover:bg-rose-50/30 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all group">
                  <Upload size={18} className="text-slate-400 group-hover:text-rose-500 mb-1" />
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-rose-600">
                    Bấm để tải ảnh lên (PNG, JPG)
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    AI sẽ đọc thông báo phạt và tìm lỗi quét của sàn
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-xl border border-slate-200 p-2.5 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={imageBase64}
                      alt="Ảnh vi phạm"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-sm"
                    />
                    <div>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Đã tải ảnh lên
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        AI sẽ phân tích hình ảnh này
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Xóa ảnh"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer nút Tạo đơn */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={loading || !shopName.trim() || (!details.trim() && !imageBase64)}
              className={`w-full text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${loading || !shopName.trim() || (!details.trim() && !imageBase64)
                ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/25 active:scale-[0.99]"
                }`}
            >
              {loading ? (
                <TextDots dots={3} className="text-white text-sm font-semibold">
                  Đang phân tích chính sách & tạo đơn
                </TextDots>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Viết Đơn Kháng Nghị Bằng AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cột phải: Bảng kết quả hồ sơ kháng nghị */}
        <div className="lg:col-span-7 h-full min-h-0">
          <AppealGeneratorOutput
            result={result}
            loading={loading}
            platform={platform}
            shopName={shopName}
            violationType={violationType.startsWith("Khác") ? (customViolationType || "Vi phạm khác") : violationType}
          />
        </div>
      </div>
    </div>
  );
}
