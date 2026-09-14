"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Sparkles, Sparkle, Search, Globe, Layers, FileText, Hash } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { SeoOptimizerOutput } from "@/components/tools/SeoOptimizerOutput";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { SEO_LIMITS, SEO_PLATFORMS, charCount, parseSeoResult, validateSeoInputs, type SeoInputs, type SeoSnapshot } from "@/lib/seo/contract";

const EMPTY: SeoInputs = { platform: "shopee", productName: "", usp: "", brand: "", specs: "", audience: "", keywords: "", policies: "" };
const FIELDS = [
  { key: "productName", label: "Tên sản phẩm", placeholder: "VD: Áo phông nam", required: true, rows: 1 },
  { key: "usp", label: "Điểm nổi bật (USP)", placeholder: "Chất liệu, đặc điểm và lợi ích thực tế của sản phẩm…", required: true, rows: 4 },
  { key: "brand", label: "Thương hiệu", placeholder: "Chỉ nhập thương hiệu thực tế", rows: 1 },
  { key: "specs", label: "Thông số sản phẩm", placeholder: "Kích thước, dung tích, chất liệu, mẫu mã…", rows: 3 },
  { key: "audience", label: "Khách hàng mục tiêu", placeholder: "VD: Nam sinh viên thích phong cách đơn giản", rows: 1 },
  { key: "keywords", label: "Từ khóa mong muốn", placeholder: "VD: áo phông nam cotton, áo thun oversize", rows: 1 },
  { key: "policies", label: "Chính sách thực tế của shop", placeholder: "Chỉ nhập bảo hành, đổi trả hoặc ưu đãi shop đang áp dụng", rows: 3 },
] as const;
const USP_TAGS = ["Chất liệu cotton", "Thiết kế nhỏ gọn", "Dễ vệ sinh", "Co giãn linh hoạt", "Nhiều kích thước", "Dễ lắp đặt"];

export default function SeoOptimizer() {
  const [inputs, setInputs] = useState<SeoInputs>({ ...EMPTY });
  const [snapshot, setSnapshot] = useState<SeoSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null | undefined>();
  const busy = useRef(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function reset() {
    if (busy.current) return;
    setInputs({ ...EMPTY });
    setSnapshot(null);
    setError("");
  }

  async function generate() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const submitted = validateSeoInputs(inputs);
      const signal = AbortSignal.timeout(115_000);
      const send = () => fetch("/api/ai/seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(submitted), signal });
      let response = await send();
      let data = await response.json();
      if (data.code === "VISITOR_INITIALIZED") { response = await send(); data = await response.json(); }
      if (!response.ok || !data.success) {
        if (data.code === "LOGIN_REQUIRED") setLoginOpen(true);
        throw new Error(data.error || "Không thể tạo nội dung. Vui lòng thử lại.");
      }
      const output = parseSeoResult(data.data, submitted.platform);
      setSnapshot({ inputs: submitted, output });
      setRemaining(data.remaining);
      setRefreshTrigger((prev) => prev + 1);
    } catch (cause) {
      setError(cause instanceof Error && (cause.name === "TimeoutError" || cause.name === "AbortError")
        ? "Chưa nhận được kết quả kịp thời. Vui lòng chờ một chút trước khi thử lại."
        : cause instanceof Error ? cause.message : "Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  const inputClass = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white disabled:opacity-60";
  const field = (key: keyof typeof SEO_LIMITS) => {
    const item = FIELDS.find(item => item.key === key)!;
    const required = "required" in item && item.required;
    const props = { id: `seo-${key}`, value: inputs[key], maxLength: SEO_LIMITS[key], required, placeholder: item.placeholder, className: inputClass,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setInputs({ ...inputs, [key]: event.target.value }) };
    return <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <label htmlFor={props.id} className="text-xs font-bold text-slate-700">{item.label}{required && <span className="text-rose-500"> *</span>}</label>
        <span className="text-[10px] text-slate-400 shrink-0">{charCount(inputs[key])}/{SEO_LIMITS[key]}</span>
      </div>
      {key === "usp" || key === "policies" ? <textarea {...props} rows={key === "usp" ? 3 : 2} className={`${inputClass} resize-none`} /> : <input {...props} type="text" />}
    </div>;
  };
  return (
    <div className="max-w-7xl mx-auto flex flex-col min-h-0 lg:h-[calc(100vh-100px)]">
      <AuthModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} initialTab="login" />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/tools" aria-label="Quay lại kho công cụ" className="w-9 h-9 shrink-0 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 flex items-center justify-center shadow-2xs"><ArrowLeft size={17} /></Link>
          <div className="w-9 h-9 bg-amber-100 rounded-xl items-center justify-center text-amber-600 shrink-0 hidden sm:flex"><Search size={20} /></div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">AI Tối Ưu SEO Sản Phẩm Shopee/TikTok</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">FREE TOOL</span>
            </div>
            <p className="text-slate-400 text-xs hidden sm:block">5 tiêu đề, mô tả sản phẩm và 10 hashtag theo nền tảng bạn chọn.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AiUsageBadge tool="seo-optimizer" refreshTrigger={refreshTrigger} />
          <button type="button" disabled={loading} className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50" onClick={() => { setInputs({ ...EMPTY, platform: inputs.platform, productName: "Áo phông nam", usp: "Chất liệu cotton, co giãn 4 chiều, thấm hút mồ hôi, form rộng oversize", specs: "Kích thước M, L, XL", audience: "Nam thích phong cách streetwear" }); setError(""); }}><Sparkle size={13} className="fill-amber-600 text-amber-600" />Dùng Mẫu Thử (Demo)</button>
          <button type="button" onClick={reset} disabled={loading} title="Xóa trắng form và kết quả" aria-label="Làm mới" className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"><RotateCcw size={16} /></button>
        </div>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <form onSubmit={event => { event.preventDefault(); void generate(); }} className="lg:col-span-5 flex flex-col lg:h-full min-h-0 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center gap-2 bg-slate-50 shrink-0">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Sparkles size={16} className="text-amber-500" />Cấu Hình SEO & Dữ Liệu</h2>
            <span className="text-[11px] text-slate-400 font-medium">Bắt buộc: Tên & USP</span>
          </div>
          <div className="p-4 flex-1 min-h-0 lg:overflow-y-auto custom-scrollbar">
            <fieldset disabled={loading} className="space-y-3.5 min-w-0">
              <div role="group" aria-labelledby="seo-platform-label">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span id="seo-platform-label" className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Globe size={13} className="text-amber-500" />Sàn TMĐT:</span>
                  <span className="text-[10px] text-slate-400">Nội dung riêng cho từng sàn</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                  {Object.entries(SEO_PLATFORMS).map(([key, item]) => <button key={key} type="button" aria-pressed={inputs.platform === key} onClick={() => setInputs({ ...inputs, platform: key as SeoInputs["platform"] })} className={`text-[11px] font-bold py-1.5 px-2 rounded-lg transition-all cursor-pointer ${inputs.platform === key ? `${key === "shopee" ? "bg-orange-50 text-orange-700 border-orange-500" : "bg-slate-900 text-white border-slate-900"} border shadow-xs ring-1 ring-black/5` : "text-slate-600 hover:bg-white/60 border border-transparent"}`}>{item.label}</button>)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2" aria-label="Bộ nội dung được tạo">
                {[{ icon: Layers, title: "5 tiêu đề", detail: "Biến thể từ khóa" }, { icon: FileText, title: "Mô tả", detail: "Lợi ích sản phẩm" }, { icon: Hash, title: "10 hashtag", detail: "Gợi ý liên quan" }].map(item => <div key={item.title} className="p-2 rounded-xl border border-amber-200 bg-slate-50"><div className="flex items-center gap-1.5 text-xs font-bold text-slate-800"><item.icon size={13} className="text-amber-600 shrink-0" />{item.title}</div><p className="text-[10px] text-slate-500 mt-1">{item.detail}</p></div>)}
              </div>
              {field("productName")}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{field("brand")}{field("keywords")}</div>
              <div>
                {field("usp")}
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold">Chọn đặc điểm đúng:</span>
                  {USP_TAGS.map(tag => <button key={tag} type="button" disabled={inputs.usp.includes(tag) || (inputs.usp + ", " + tag).length > SEO_LIMITS.usp} onClick={() => setInputs({ ...inputs, usp: inputs.usp.trim() ? `${inputs.usp.trim()}, ${tag}` : tag })} className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 rounded-md transition cursor-pointer disabled:opacity-40">+ {tag}</button>)}
                </div>
              </div>
              {field("specs")}
              {field("audience")}
              {field("policies")}
              <p className="text-[10px] leading-relaxed text-slate-400">Các trường không có dấu * là tùy chọn. Chỉ nhập thông tin và chính sách thực tế của sản phẩm.</p>
            </fieldset>
          </div>
          <div className="p-3 bg-white border-t border-slate-100 space-y-2 shrink-0">
            {error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2.5">{error}{snapshot && " Kết quả trước vẫn được giữ."}</p>}
            <button type="submit" disabled={loading || !inputs.productName.trim() || !inputs.usp.trim()} className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed">
              <Sparkles size={16} />{loading ? "Đang Tối Ưu SEO…" : error ? "Thử Tối Ưu Lại" : `Tối Ưu SEO (${SEO_PLATFORMS[inputs.platform].label})`}
            </button>
            <p aria-live="polite" className="text-[10px] text-center text-slate-400">{remaining === null ? "Đã đăng nhập · Miễn phí, có giới hạn tần suất." : typeof remaining === "number" ? `Còn ${remaining}/2 lượt thử. Đăng nhập để tiếp tục miễn phí.` : "2 lượt tạo thành công miễn phí · Đăng nhập để dùng tiếp."}</p>
          </div>
        </form>
        <div className="lg:col-span-7 lg:h-full min-h-0"><SeoOptimizerOutput snapshot={snapshot} loading={loading} /></div>
      </div>
    </div>
  );
}
