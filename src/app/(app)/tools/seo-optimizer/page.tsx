"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Megaphone,
  Sparkles,
  Search,
  RotateCcw,
  Sparkle,
  Tag,
  FileText,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { SeoOptimizerOutput } from "@/components/tools/SeoOptimizerOutput";
import { TextDots } from "@/components/ui/text-dots";
import { useToast } from "@/context/ToastContext";

const QUICK_USP_TAGS = [
  "100% Cotton thoáng mát",
  "Co giãn 4 chiều cực êm",
  "Form rộng Oversize cá tính",
  "Thấm hút mồ hôi vượt trội",
  "Chống nước / Chống trầy xước",
  "Bảo hành chính hãng 12 tháng",
  "Freeship Extra / Đổi trả 7 ngày",
  "Công nghệ kháng khuẩn khử mùi",
];

export default function SeoOptimizer() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const [productName, setProductName] = useState("");
  const [usp, setUsp] = useState("");

  const handleSelectUspTag = (tagText: string) => {
    if (!usp.trim()) {
      setUsp(tagText);
    } else if (!usp.includes(tagText)) {
      setUsp(`${usp.trim()}, ${tagText}`);
    }
  };

  const handleResetForm = () => {
    setProductName("");
    setUsp("");
  };

  const handleUseSample = () => {
    setProductName("Áo phông nam");
    setUsp("100% cotton tự nhiên, co giãn 4 chiều, thấm hút mồ hôi, form rộng oversize phong cách streetwear, không xù lông khi giặt máy");
  };

  const handleGenerate = async () => {
    if (!productName.trim() || !usp.trim()) {
      showWarning("Vui lòng nhập Tên cơ bản và Điểm nổi bật (USP)!", "Thiếu Thông Tin");
      return;
    }

    const canUse = await checkAccess("seo-optimizer", false); // Free Tool
    if (!canUse) return;

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "seo-optimizer",
          inputs: { productName: productName.trim(), usp: usp.trim() },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        showAiError(data, "Có lỗi xảy ra khi tối ưu SEO");
      }
    } catch (error) {
      showAiError({ error: "Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại mạng hoặc token." });
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
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition-colors shadow-sm"
            title="Quay lại kho công cụ"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <Megaphone size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  AI Tối Ưu SEO Sản Phẩm Shopee/TikTok
                </h1>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                  FREE TOOL
                </span>
              </div>
              <p className="text-slate-400 text-xs hidden sm:block">
                Phần mềm tạo tiêu đề, mô tả và hashtag lên top tìm kiếm tự động.
              </p>
            </div>
          </div>
        </div>

        {/* Nút thử sản phẩm mẫu */}
        <button
          onClick={handleUseSample}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
        >
          <Sparkle size={13} className="text-blue-500 fill-blue-500" />
          <span>Thử mẫu sản phẩm</span>
        </button>
      </div>

      {/* Khu vực thao tác chính 2 cột chiếm trọn chiều cao còn lại */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái: Form nhập thông tin sản phẩm */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Form */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-blue-500" />
              <h2 className="font-bold text-slate-800 text-sm">Nhập thông tin sản phẩm</h2>
            </div>
            {(productName || usp) && (
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
            {/* Tên sản phẩm cơ bản */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <ShoppingBag size={12} className="text-slate-400" />
                  Tên sản phẩm cơ bản <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {productName.length} ký tự
                </span>
              </div>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="VD: Áo phông nam, Son môi lì, Kem chống nắng..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Gợi ý USP chọn nhanh */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Tag size={12} className="text-slate-400" />
                Gợi ý điểm nổi bật (Chọn nhanh để thêm)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_USP_TAGS.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectUspTag(tag)}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-lg border bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all cursor-pointer active:scale-95"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Đặc điểm nổi bật (USP) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <FileText size={12} className="text-slate-400" />
                  Đặc điểm nổi bật (USP) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {usp.length} ký tự
                </span>
              </div>
              <textarea
                value={usp}
                onChange={(e) => setUsp(e.target.value)}
                rows={5}
                placeholder="VD: 100% cotton, thấm hút mồ hôi, dáng oversize, in hình sau lưng, giặt máy không xù..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none placeholder:text-slate-400 leading-relaxed"
              ></textarea>
            </div>
          </div>

          {/* Footer nút Tối ưu SEO */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={loading || !productName.trim() || !usp.trim()}
              className={`w-full text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                loading || !productName.trim() || !usp.trim()
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/25 active:scale-[0.99]"
              }`}
            >
              {loading ? (
                <TextDots dots={3} className="text-white text-sm font-semibold">
                  Đang phân tích từ khóa ngách & tạo SEO
                </TextDots>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Tối Ưu SEO Bằng AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cột phải: Bảng kết quả tối ưu SEO */}
        <div className="lg:col-span-7 h-full min-h-0">
          <SeoOptimizerOutput
            result={result}
            loading={loading}
            productName={productName}
            usp={usp}
          />
        </div>
      </div>
    </div>
  );
}
