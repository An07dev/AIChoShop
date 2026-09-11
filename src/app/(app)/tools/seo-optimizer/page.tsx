"use client";

import { useState } from "react";
import { ArrowLeft, Megaphone, CheckCircle2, Copy, Sparkles, Search } from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";

export default function SeoOptimizer() {
  const { checkAccess, GateModals } = useToolGate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const [productName, setProductName] = useState("");
  const [usp, setUsp] = useState("");

  const handleGenerate = async () => {
    if (!productName || !usp) {
      alert("Vui lòng nhập Tên cơ bản và Điểm nổi bật!");
      return;
    }

    const canUse = await checkAccess("seo-optimizer", false);
    if (!canUse) return;

    setLoading(true);
    setResult("");
    
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "seo-optimizer",
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
        <Link href="/tools" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Quay lại kho công cụ
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Megaphone size={28} className="text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">AI Tối Ưu SEO Sản Phẩm Shopee/TikTok</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded shadow-sm">FREE TOOL</span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Phần mềm tạo tiêu đề, mô tả và hashtag lên top tìm kiếm tự động.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-slate-600" />
                <h2 className="font-bold text-slate-800">Nhập thông tin sản phẩm</h2>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên sản phẩm cơ bản</label>
                <input 
                  type="text" 
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="VD: Áo phông nam" 
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Đặc điểm nổi bật (USP)</label>
                <textarea 
                  value={usp}
                  onChange={e => setUsp(e.target.value)}
                  rows={5}
                  placeholder="VD: 100% cotton, thấm hút mồ hôi, dáng oversize, in hình sau lưng..."
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                ></textarea>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/30'}`}
              >
                {loading ? (
                  <>Đang phân tích từ khóa ngách...</>
                ) : (
                  <><Sparkles size={18} /> Tối Ưu SEO bằng AI</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800 min-h-[400px]">
            <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-400" />
                <h2 className="font-bold text-white">Kết quả Tối Ưu SEO</h2>
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
                  <Megaphone size={48} className="mb-4 opacity-20" />
                  <p>Nhập Tên cơ bản, AI sẽ sinh ra 5 tiêu đề ngách đỉnh nhất.</p>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="animate-pulse">Đang trích xuất bộ Hashtag chuẩn thuật toán...</p>
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

      {/* SEO Content Section - Rich Text for Google Indexing */}
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 max-w-4xl mx-auto prose prose-slate lg:prose-lg">
        <h2 className="text-3xl font-black text-slate-900 mb-6">Tại sao cần Tối Ưu SEO Sản Phẩm trên Shopee & TikTok?</h2>
        <p>
          Trong kỷ nguyên thương mại điện tử 2026, hàng triệu sản phẩm mới được đăng tải mỗi ngày. Nếu bạn không <strong>tối ưu SEO (Search Engine Optimization)</strong>, sản phẩm của bạn sẽ bị chôn vùi dưới đáy kết quả tìm kiếm, dẫn đến việc phải đốt rất nhiều tiền vào quảng cáo (Ads) để ra đơn.
        </p>
        
        <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Lợi ích của việc dùng công cụ AI SEO Optimizer:</h3>
        <ul className="space-y-2 mb-8 list-disc pl-5">
          <li><strong>Tự động hóa hoàn toàn:</strong> Không cần vắt óc suy nghĩ từ khóa, hệ thống AI của AIChoShop đã được huấn luyện trên hàng triệu data sản phẩm bán chạy nhất.</li>
          <li><strong>Lách luật thuật toán:</strong> Tiêu đề được thiết kế theo đúng chuẩn "Tên cơ bản + Từ khóa phụ + USP" mà máy học của Shopee ưu tiên hiển thị.</li>
          <li><strong>Hashtag ăn đề xuất:</strong> Bộ hashtag được trích xuất dựa trên xu hướng tìm kiếm thực tế của người tiêu dùng.</li>
        </ul>

        <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Bí quyết lên Top 1 không cần chạy Ads</h3>
        <p>
          Kết hợp 5 tiêu đề do công cụ sinh ra với một chiến lược hình ảnh bắt mắt (Tỷ lệ Click CTR cao), bạn sẽ có một "combo hủy diệt". Đừng quên sử dụng <strong>Tool Nhân bản chống Spam</strong> của chúng tôi nếu bạn muốn phủ sóng các từ khóa này trên nhiều gian hàng (Shop clone) khác nhau.
        </p>
      </div>
    </div>
  );
}
