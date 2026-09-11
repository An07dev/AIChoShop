"use client";

import { useState } from "react";
import { ArrowLeft, Video, CheckCircle2, Copy, Sparkles, PenTool } from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";

export default function ScriptWriter() {
  const { checkAccess, GateModals } = useToolGate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const [productName, setProductName] = useState("");
  const [usp, setUsp] = useState("");

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("script-writer", true); // VIP Only
    if (!hasAccess) return;

    if (!productName || !usp) {
      alert("Vui lòng nhập Tên sản phẩm và Điểm nổi bật!");
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
          inputs: { productName, usp }
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        alert("Có lỗi xảy ra: " + data.error);
      }
    } catch (error) {
      alert("Không thể kết nối đến máy chủ AI.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <GateModals />
      <div className="mb-6">
        <Link href="/tools" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-purple-600 mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Quay lại kho công cụ
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Video size={28} className="text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">AI Kịch Bản Video/Live</h1>
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm">VIP ONLY</span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Chỉ cần nhập tên sản phẩm, AI sẽ sinh ra kịch bản quay TikTok Reels với Hook 3s đầu siêu gắt.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <PenTool size={18} className="text-slate-600" />
                <h2 className="font-bold text-slate-800">Thông tin sản phẩm</h2>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên sản phẩm của bạn</label>
                <input 
                  type="text" 
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="VD: Kem chống nắng La Roche-Posay" 
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Điểm nổi bật (USP) cần nhấn mạnh</label>
                <textarea 
                  value={usp}
                  onChange={e => setUsp(e.target.value)}
                  rows={4}
                  placeholder="VD: Không bết dính, nâng tone nhẹ tự nhiên, chống nước tốt đi bơi không trôi..."
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                ></textarea>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-purple-500/30'}`}
              >
                {loading ? (
                  <>Đang phân tích và sáng tạo kịch bản...</>
                ) : (
                  <><Sparkles size={18} /> Lên Kịch Bản Bằng AI</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 p-32 bg-purple-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                <h2 className="font-bold text-white">Kết quả kịch bản</h2>
              </div>
              {result && (
                <button 
                  onClick={copyToClipboard}
                  className="text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white"
                >
                  {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  {copied ? "Đã chép" : "Copy nội dung"}
                </button>
              )}
            </div>
            
            <div className="p-6 flex-1 relative z-10">
              {!result && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Video size={48} className="mb-4 opacity-20" />
                  <p>Nhập Tên sản phẩm và Điểm nổi bật để AI bắt đầu viết.</p>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-10 h-10 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin"></div>
                  <p className="animate-pulse">Đang tìm ý tưởng mồi câu (Hook) hấp dẫn...</p>
                </div>
              )}

              {result && (
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl h-full overflow-y-auto custom-scrollbar">
                  <pre className="text-slate-300 font-sans text-[15px] leading-relaxed whitespace-pre-wrap">
                    {result}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
