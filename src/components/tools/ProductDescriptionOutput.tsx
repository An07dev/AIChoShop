"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Sparkles,
  FileText,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Share2,
  ExternalLink,
} from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface ProductDescriptionOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  shopName?: string;
  mode?: string;
  platform?: string;
  tone?: string;
}

const MODE_LABELS: Record<string, { label: string; color: string }> = {
  "seo-full": { label: "Chuẩn SEO 6 Tầng", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  "mobile-short": { label: "Mobile-First 3s", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  "storytelling": { label: "Storytelling Cảm Xúc", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  "flash-sale": { label: "Flash Sale & FOMO", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
};

const PLATFORM_LABELS: Record<string, string> = {
  shopee: "Shopee",
  tiktok: "TikTok Shop",
  lazada: "Lazada",
  all: "Đa Sàn",
};

export function ProductDescriptionOutput({
  result,
  loading,
  productName,
  shopName,
  mode = "seo-full",
  platform = "shopee",
  tone = "expert",
}: ProductDescriptionOutputProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"formatted" | "preview" | "raw">("formatted");

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = result ? result.trim().split(/\s+/).length : 0;
  const charCount = result ? result.length : 0;
  const modeInfo = MODE_LABELS[mode] || MODE_LABELS["seo-full"];

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ */}
      <div className="absolute top-0 right-0 p-36 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 relative z-10 bg-slate-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none">Mô Tả Sản Phẩm</h2>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${modeInfo.color}`}>
            {modeInfo.label}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {PLATFORM_LABELS[platform] || "Shopee"}
          </span>
        </div>

        {/* Nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Chuyển tab xem */}
            <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("formatted")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  viewMode === "formatted"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText size={12} /> Soạn Thảo
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  viewMode === "preview"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone size={12} /> Mô Phỏng Shopee
              </button>
            </div>

            {/* Nút Copy */}
            <button
              type="button"
              onClick={handleCopy}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black px-3.5 py-1 rounded-lg transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {copied ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
              <span>{copied ? "Đã Sao Chép!" : "Sao Chép Toàn Bộ"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Vùng nội dung */}
      <div className="p-4 flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar">
        {/* Chưa có dữ liệu */}
        {!result && !loading && (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/10">
              <FileText size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1.5">
              Chưa Có Nội Dung Mô Tả
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Điền thông tin sản phẩm ở cột bên trái hoặc bấm nút{" "}
              <strong className="text-amber-400">&quot;Dùng Mẫu Thử (Demo)&quot;</strong> để trải nghiệm kịch bản chuyển đổi 6 khối vàng chuẩn Top Seller.
            </p>
          </div>
        )}

        {/* Trạng thái Loading */}
        {loading && (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center gap-3">
            <TextShimmerWave className="text-xl font-bold text-amber-400">
              Đang Viết Mô Tả Chuyển Đổi Cao...
            </TextShimmerWave>
            <p className="text-xs text-slate-500">
              Áp dụng công thức tâm lý bán hàng AIDA & 6 khối vàng của Top Seller
            </p>
          </div>
        )}

        {/* Hiển thị kết quả */}
        {result && !loading && (
          <>
            {viewMode === "formatted" && (
              <div className="space-y-4">
                {/* Thanh thống kê nhanh */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span>
                      Độ dài: <strong className="text-white font-mono">{charCount}</strong> ký tự
                    </span>
                    <span>
                      Số từ: <strong className="text-white font-mono">{wordCount}</strong> từ
                    </span>
                  </div>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Chuẩn cấu trúc chuyển đổi cao
                  </span>
                </div>

                {/* Khối văn bản hiển thị đẹp mắt */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-amber-500/30 selection:text-amber-200">
                  {result}
                </div>
              </div>
            )}

            {viewMode === "preview" && (
              /* Giả lập khung Shopee Mobile App */
              <div className="max-w-md mx-auto bg-slate-950 border-2 border-slate-700 rounded-3xl p-4 shadow-2xl space-y-3">
                {/* Mobile Status Bar giả lập */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-2 pb-2 border-b border-slate-800">
                  <span className="font-bold text-white">Shopee App</span>
                  <span>Chi Tiết Sản Phẩm</span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-black text-white">
                    {productName || "Tên Sản Phẩm"}
                  </div>
                  <div className="text-amber-500 font-black text-sm">
                    ₫199.000 - ₫350.000
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>⭐ 4.9 (1.2k đánh giá)</span>
                    <span>Đã bán 3.4k</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar">
                  {result}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
