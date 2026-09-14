"use client";

import { useState } from "react";
import { ArrowLeft, Video, Sparkles, PenTool } from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ScriptWriterOutput } from "@/components/tools/ScriptWriterOutput";
import { TextDots } from "@/components/ui/text-dots";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";

export default function ScriptWriter() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const [productName, setProductName] = useState("");
  const [usp, setUsp] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("script-writer", true); // VIP Only
    if (!hasAccess) return;

    if (!productName.trim() || !usp.trim()) {
      showWarning("Vui lòng nhập Tên sản phẩm và Điểm nổi bật (USP)!", "Thiếu Thông Tin");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "script-writer",
          inputs: { productName: productName.trim(), usp: usp.trim() }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showAiError(data, "Có lỗi xảy ra khi tạo kịch bản video");
      }
    } catch (error) {
      showAiError({ error: "Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại mạng hoặc token." });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUspTag = (tag: string) => {
    setUsp(prev => prev ? `${prev}, ${tag}` : tag);
  };

  const handleClearAll = () => {
    setProductName("");
    setUsp("");
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col min-h-0">
      <GateModals />

      {/* Thanh tiêu đề thu gọn trên 1 dòng */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-300 flex items-center justify-center transition-colors shadow-sm"
            title="Quay lại kho công cụ"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
              <Video size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">AI Kịch Bản Video/Live</h1>
                <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">VIP ONLY</span>
              </div>
              <p className="text-slate-400 text-xs hidden sm:block">Chỉ cần nhập tên sản phẩm, AI sẽ sinh ra kịch bản quay TikTok Reels với Hook 3s đầu siêu gắt.</p>
            </div>
          </div>
        </div>
        <AiUsageBadge tool="script-writer" refreshTrigger={refreshTrigger} />
      </div>

      {/* Khu vực thao tác chính 2 cột chiếm trọn phần chiều cao còn lại */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái: Nhập thông tin sản phẩm */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2">
              <PenTool size={16} className="text-slate-500" />
              <h2 className="font-bold text-slate-800 text-sm">Thông tin sản phẩm</h2>
            </div>
            {(productName || usp) && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          <div className="p-4 flex-1 flex flex-col min-h-0 gap-3 justify-between">
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              {/* Tên sản phẩm */}
              <div className="shrink-0">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên sản phẩm của bạn</label>
                <input
                  type="text"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="VD: Kem chống nắng La Roche-Posay Anthelios..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                />
              </div>

              {/* Điểm nổi bật (USP) */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Điểm nổi bật (USP) cần nhấn mạnh
                </label>
                <textarea
                  value={usp}
                  onChange={e => setUsp(e.target.value)}
                  placeholder="VD: Kiềm dầu 12h, nâng tone tự nhiên không bết dính, chống trôi khi đổ mồ hôi..."
                  className="w-full flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none font-medium leading-relaxed"
                />
              </div>
            </div>

            {/* Gợi ý điểm bán hàng nhanh / Quick tags */}
            <div className="shrink-0 space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Gợi ý chèn điểm mạnh & ưu đãi:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Flash Sale 50%",
                  "Tặng quà độc quyền",
                  "Chính hãng 100%",
                  "Đổi trả 7 ngày",
                  "Freeship 0đ",
                  "Giảm sâu trên Live",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddUspTag(tag)}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-slate-200 rounded-md text-slate-600 font-medium transition-all cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Nút hành động Submit */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full shrink-0 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer ${loading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-purple-500/25 active:scale-[0.99]'
                }`}
            >
              {loading ? (
                <TextDots dots={3}>Thinking</TextDots>
              ) : (
                <><Sparkles size={16} /> Lên Kịch Bản Bằng AI</>
              )}
            </button>
          </div>
        </div>

        {/* Cột phải: Hiển thị kết quả kịch bản */}
        <div className="lg:col-span-7 h-full min-h-0">
          <ScriptWriterOutput
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
