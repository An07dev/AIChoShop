"use client";

import { useState } from "react";
import { ArrowLeft, Cpu, CheckCircle2, Copy, Sparkles, FileText } from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";

export default function TitleSpinner() {
  const { checkAccess, GateModals } = useToolGate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const [originalTitle, setOriginalTitle] = useState("");

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("title-spinner", true); // VIP Only
    if (!hasAccess) return;

    if (!originalTitle) {
      alert("Vui lòng nhập Tiêu đề gốc!");
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
          inputs: { originalTitle }
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
        <Link href="/tools" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-teal-600 mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Quay lại kho công cụ
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-100 rounded-xl">
            <Cpu size={28} className="text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">AI Nhân Bản Chống Spam</h1>
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm">VIP ONLY</span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Xào nấu (spin) nội dung để đăng lên nhiều Shop clone mà không bị máy quét trùng lặp.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-slate-600" />
                <h2 className="font-bold text-slate-800">Dữ liệu gốc</h2>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tiêu đề sản phẩm gốc</label>
                <textarea 
                  value={originalTitle}
                  onChange={e => setOriginalTitle(e.target.value)}
                  rows={4}
                  placeholder="VD: Áo phông nam cổ tròn chất cotton khô mát 100% thấm hút mồ hôi..."
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                ></textarea>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/30'}`}
              >
                {loading ? (
                  <>Đang lách luật thuật toán...</>
                ) : (
                  <><Sparkles size={18} /> Nhân Bản Bằng AI</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 p-32 bg-teal-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-teal-400" />
                <h2 className="font-bold text-white">Kết quả Nhân bản</h2>
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
                  <Cpu size={48} className="mb-4 opacity-20" />
                  <p>Nhập Tiêu đề gốc, AI sẽ xào nấu ra 10 bản clone tránh Spam.</p>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-10 h-10 border-4 border-slate-700 border-t-teal-500 rounded-full animate-spin"></div>
                  <p className="animate-pulse">Đang dùng NLP sinh biến thể đồng nghĩa...</p>
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
