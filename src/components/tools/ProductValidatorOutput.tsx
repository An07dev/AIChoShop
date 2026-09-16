"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface ProductValidatorOutputProps {
  result: string;
  loading: boolean;
  productName: string;
}

export function ProductValidatorOutput({
  result,
  loading,
  productName,
}: ProductValidatorOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"analysis" | "raw">("analysis");

  const handleCopyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySnippet = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tham-dinh-san-pham-${productName.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Trích xuất điểm số nếu có
  const scoreMatch = result ? result.match(/(\d{1,3})\/100/) : null;
  const scoreNumber = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col min-h-0 relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ */}
      <div className="absolute top-0 right-0 p-36 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 relative z-10 bg-slate-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
            <BarChart3 size={16} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none">Báo Cáo Thẩm Định Sản Phẩm</h2>
          </div>
          {scoreNumber !== null && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                scoreNumber >= 75
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : scoreNumber >= 50
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
              }`}
            >
              Điểm Tiềm Năng: {scoreNumber}/100
            </span>
          )}
        </div>

        {/* Nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("analysis")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                  viewMode === "analysis"
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Trực Quan
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                  viewMode === "raw"
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Văn Bản
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              title="Tải file txt"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Download size={14} />
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                copiedAll
                  ? "bg-blue-500 text-white"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
              }`}
            >
              {copiedAll ? (
                <>
                  <Check size={13} className="stroke-[3]" /> Đã Sao Chép
                </>
              ) : (
                <>
                  <Copy size={13} /> Sao Chép Tất Cả
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Nội dung báo cáo */}
      <div className="flex-1 min-h-0 p-5 overflow-y-auto custom-scrollbar relative z-10">
        {loading ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
              <Sparkles size={26} className="animate-spin text-blue-400 duration-1000" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Thẩm Định Tiềm Năng & Rủi Ro...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang đo lường dung lượng thị trường, bóc tách rủi ro cước vận chuyển, phí sàn và dự báo vòng đời trend...
              </p>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-5">
            {viewMode === "raw" ? (
              <textarea
                readOnly
                value={result}
                className="w-full h-[500px] bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
              />
            ) : (
              <div className="space-y-5">
                {/* Thẻ Điểm Nổi Bật */}
                {scoreNumber !== null && (
                  <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-blue-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${
                          scoreNumber >= 75
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : scoreNumber >= 50
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        {scoreNumber}
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                          Chỉ số Khả thi Thương mại
                        </div>
                        <h3 className="text-base font-bold text-white">
                          {scoreNumber >= 75
                            ? "Sản Phẩm Tiềm Năng Cao — Khuyên Nên Làm"
                            : scoreNumber >= 50
                            ? "Tiềm Năng Trung Bình — Cần Tối Ưu Nguồn Hàng"
                            : "Rủi Ro Cao — Cân Nhắc Kỹ Trước Khi Nhập"}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const tableMatch = result.match(/## 📊 1\. BẢNG ĐIỂM[\s\S]*?(?=---|$)/);
                        if (tableMatch) handleCopySnippet(tableMatch[0], "score");
                      }}
                      className="text-xs text-blue-400 hover:text-white px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {copiedSnippet === "score" ? <Check size={13} /> : <Copy size={13} />} Copy Bảng Điểm
                    </button>
                  </div>
                )}

                {/* Nội dung kết quả Markdown được phân đoạn */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 text-xs text-slate-300 space-y-4 whitespace-pre-line leading-relaxed font-sans">
                  {result}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="font-semibold text-slate-300 text-sm">Chưa Có Dữ Liệu Thẩm Định</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Điền thông tin ý tưởng sản phẩm bên trái và bấm &ldquo;Thẩm Định Sản Phẩm Ngay&rdquo;.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default ProductValidatorOutput;
