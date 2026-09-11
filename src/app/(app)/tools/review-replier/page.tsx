"use client";

import { useState } from "react";
import { ArrowLeft, MessageSquareWarning, CheckCircle2, Copy, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";

export default function ReviewReplier() {
  const { checkAccess, GateModals } = useToolGate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const [reviewContent, setReviewContent] = useState("");

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("review-replier", false); // Free Tool
    if (!hasAccess) return;

    if (!reviewContent) {
      alert("Vui lòng paste nội dung đánh giá của khách vào!");
      return;
    }

    setLoading(true);
    setResult("");
    
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "review-replier",
          inputs: { reviewContent }
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
        <Link href="/tools" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-amber-600 mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Quay lại kho công cụ
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 rounded-xl">
            <MessageSquareWarning size={28} className="text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">AI Xử Lý Khủng Hoảng</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded shadow-sm">FREE TOOL</span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Viết phản hồi cho các đánh giá 1 sao một cách khéo léo, 'đắc nhân tâm' nhất.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-amber-500 fill-amber-500" />
                <h2 className="font-bold text-slate-800">Đánh giá 1 Sao của khách</h2>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nội dung khách chê</label>
                <textarea 
                  value={reviewContent}
                  onChange={e => setReviewContent(e.target.value)}
                  rows={6}
                  placeholder="Paste nguyên văn câu chửi/chê bai của khách vào đây. VD: Áo vải xấu quá, giao hàng chậm, thái độ phục vụ tồi..."
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                ></textarea>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'}`}
              >
                {loading ? (
                  <>Đang phân tích tâm lý khách hàng...</>
                ) : (
                  <><Sparkles size={18} /> Phản hồi bằng AI</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 p-32 bg-amber-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <h2 className="font-bold text-white">Kết quả phản hồi</h2>
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
                  <MessageSquareWarning size={48} className="mb-4 opacity-20" />
                  <p>Paste bình luận 1 sao để AI nghĩ cách dập lửa.</p>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-10 h-10 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
                  <p className="animate-pulse">Đang viết phản hồi đắc nhân tâm nhất...</p>
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
