"use client";

import { useState } from "react";
import { ArrowLeft, Cpu, Sparkles, FileText } from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { TitleSpinnerOutput } from "@/components/tools/TitleSpinnerOutput";
import { TextDots } from "@/components/ui/text-dots";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";

export default function TitleSpinner() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const [originalTitle, setOriginalTitle] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleGenerate = async () => {
    // const hasAccess = await checkAccess("title-spinner", true); // VIP Only
    // if (!hasAccess) return;

    if (!originalTitle.trim()) {
      showWarning("Vui lòng nhập Tiêu đề gốc cần nhân bản!", "Thiếu Dữ Liệu");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "title-spinner",
          inputs: { originalTitle: originalTitle.trim() }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showAiError(data, "Có lỗi xảy ra khi gọi AI");
      }
    } catch (error: any) {
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
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-300 flex items-center justify-center transition-colors shadow-sm"
            title="Quay lại kho công cụ"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
              <Cpu size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">AI Nhân Bản Chống Spam</h1>
                <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">VIP ONLY</span>
              </div>
              <p className="text-slate-400 text-xs hidden sm:block">Xào nấu (spin) nội dung để đăng nhiều Shop clone mà không bị máy quét trùng lặp.</p>
            </div>
          </div>
        </div>
        <AiUsageBadge tool="title-spinner" refreshTrigger={refreshTrigger} />
      </div>

      {/* Khu vực thao tác chính 2 cột chiếm trọn phần chiều cao còn lại */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái: Nhập dữ liệu gốc */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-500" />
              <h2 className="font-bold text-slate-800 text-sm">Tiêu đề sản phẩm gốc</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400 font-semibold">
              {originalTitle.length} ký tự
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col min-h-0 gap-3 justify-between">
            <div className="flex-1 flex flex-col min-h-0">
              <textarea
                value={originalTitle}
                onChange={e => setOriginalTitle(e.target.value)}
                placeholder="Dán tiêu đề sản phẩm gốc vào đây...&#10;VD: Áo phông nam cổ tròn chất cotton khô mát 100% thấm hút mồ hôi co giãn 4 chiều..."
                className="w-full flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none font-medium leading-relaxed"
              />
            </div>

            {/* Gợi ý từ khóa mẫu / quick tags */}
            <div className="shrink-0 space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Gợi ý chèn từ khóa kích thích mua:</span>
                {originalTitle && (
                  <button 
                    onClick={() => setOriginalTitle("")} 
                    className="text-slate-400 hover:text-red-500 transition-colors text-[11px] cursor-pointer"
                  >
                    Xóa text
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Chính hãng", "Freeship", "Cao cấp", "Giá xưởng", "Bảo hành 1 đổi 1"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setOriginalTitle(prev => prev ? `${prev} ${tag}` : tag)}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-200 rounded-md text-slate-600 font-medium transition-all cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full shrink-0 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer ${
                loading 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/25 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <TextDots dots={3}>Thinking</TextDots>
              ) : (
                <><Sparkles size={16} /> Nhân Bản Bằng AI</>
              )}
            </button>
          </div>
        </div>

        {/* Cột phải: Hiển thị kết quả nhân bản */}
        <div className="lg:col-span-7 h-full min-h-0">
          <TitleSpinnerOutput
            result={result}
            loading={loading}
            originalTitle={originalTitle}
          />
        </div>
      </div>
    </div>
  );
}
