"use client";

import { useState } from "react";
import { ArrowLeft, ShieldAlert, CheckCircle2, Copy, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";

export default function AppealGenerator() {
  const { checkAccess, GateModals } = useToolGate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  // Form states
  const [platform, setPlatform] = useState("Shopee");
  const [violationType, setViolationType] = useState("Hàng giả / Hàng nhái (Nghi ngờ)");
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

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("appeal-generator", true); // VIP Only
    if (!hasAccess) return;

    if (!shopName || (!details && !imageBase64)) {
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
          inputs: { platform, violationType, shopName, details, imageBase64 }
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
        <Link href="/tools" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-rose-600 mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Quay lại kho công cụ
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-100 rounded-xl">
            <ShieldAlert size={28} className="text-rose-600" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">AI Kháng Nghị Vi Phạm</h1>
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm">VIP ONLY</span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Tự động viết đơn xin mở khóa shop/sản phẩm với văn phong thuyết phục nhất.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-slate-600" />
                <h2 className="font-bold text-slate-800">Cung cấp thông tin</h2>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Sàn TMĐT</label>
                  <select 
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                  >
                    <option>Shopee</option>
                    <option>TikTok Shop</option>
                    <option>Facebook</option>
                    <option>Lazada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên Shop của bạn</label>
                  <input 
                    type="text" 
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    placeholder="VD: TuKi Store" 
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Loại Vi Phạm (Lý do bị khóa)</label>
                <select 
                  value={violationType}
                  onChange={e => setViolationType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                >
                  <option>Hàng giả / Hàng nhái (Nghi ngờ)</option>
                  <option>Tỷ lệ hoàn hàng/hủy đơn quá cao</option>
                  <option>Spam từ khóa, mô tả sản phẩm</option>
                  <option>Giao dịch ảo / Đánh giá ảo</option>
                  <option>Vi phạm bản quyền hình ảnh</option>
                  <option>Khác...</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Giải trình chi tiết của bạn</label>
                <textarea 
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  rows={4}
                  placeholder="Kể ngắn gọn sự việc và các bằng chứng bạn có..."
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ảnh chụp thông báo vi phạm (Tùy chọn)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100" 
                />
                {imageBase64 && (
                  <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 size={14} /> Đã tải ảnh lên thành công
                  </div>
                )}
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/30'}`}
              >
                {loading ? (
                  <>Đang phân tích chính sách và tạo đơn...</>
                ) : (
                  <><Sparkles size={18} /> Viết Đơn Kháng Nghị Bằng AI</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output View */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
            {/* BG Effects */}
            <div className="absolute top-0 right-0 p-32 bg-rose-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-rose-400" />
                <h2 className="font-bold text-white">Kết quả từ AIChoShop</h2>
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
                  <ShieldAlert size={48} className="mb-4 opacity-20" />
                  <p>Nhập thông tin bên trái và bấm nút để AI tạo đơn kháng nghị.</p>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-10 h-10 border-4 border-slate-700 border-t-rose-500 rounded-full animate-spin"></div>
                  <p className="animate-pulse">Đang rà soát chính sách {platform}...</p>
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
