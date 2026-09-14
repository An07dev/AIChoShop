"use client";

import { useState } from "react";
import { Copy, Check, Download, Sparkles, Search, Layers, FileText, Hash } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { SEO_PLATFORMS, charCount, seoFilename, seoToText, type SeoSnapshot } from "@/lib/seo/contract";

export function SeoOptimizerOutput({ snapshot, loading }: { snapshot: SeoSnapshot | null; loading: boolean }) {
  const [copied, setCopied] = useState("");
  const [raw, setRaw] = useState(false);
  const { showError } = useToast();
  const result = snapshot?.output;

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(current => current === id ? "" : current), 1800);
    } catch { showError("Không thể sao chép. Hãy chọn văn bản và sao chép thủ công."); }
  }
  function download() {
    if (!snapshot) return;
    const url = URL.createObjectURL(new Blob([seoToText(snapshot.output)], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = seoFilename(snapshot.inputs);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const copyButton = (text: string, id: string, label: string) => <button type="button" onClick={() => void copy(text, id)} aria-label={label} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-200 bg-slate-800/80 hover:bg-slate-700 shrink-0 cursor-pointer transition">{copied === id ? <Check size={13} /> : <Copy size={13} />}{copied === id ? "Đã chép" : label}</button>;

  return (
    <section aria-label="Kết quả tối ưu SEO" aria-busy={loading} className="bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative flex flex-col lg:h-full min-h-[360px] lg:min-h-0">
      <div className="absolute top-0 right-0 p-36 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-36 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="px-4 py-2.5 border-b border-slate-800 space-y-2.5 relative z-10 bg-slate-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-bold text-white text-sm flex gap-2 items-center"><span className="p-1 rounded-lg bg-amber-500/20 text-amber-400"><Sparkles size={16} /></span>Bộ Nội Dung SEO</h2>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">{snapshot ? SEO_PLATFORMS[snapshot.inputs.platform].label : "Tiêu đề · Mô tả · Hashtag"}</span>
        </div>
        {snapshot && result && <>
          <p className="text-xs text-slate-400 break-words">{SEO_PLATFORMS[snapshot.inputs.platform].label} · {snapshot.inputs.productName}</p>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => setRaw(!raw)} className="text-[11px] px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg cursor-pointer">{raw ? "Xem trực quan" : "Xem văn bản"}</button>
            {copyButton(seoToText(result), "all", "Chép tất cả")}
            <button type="button" onClick={download} className="text-[11px] font-black px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-lg flex items-center gap-1 cursor-pointer shadow-md shadow-amber-500/20"><Download size={13} /> Tải .txt</button>
          </div>
        </>}
      </div>
      <div className="p-3.5 flex-1 min-h-0 space-y-4 relative z-10 lg:overflow-y-auto custom-scrollbar">
        {loading && <p role="status" className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-200">Đang tạo tiêu đề, mô tả và hashtag. AI sẽ kiểm tra lại nếu kết quả chưa đủ hoặc tiêu đề quá dài…</p>}
        {!result && !loading && <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/10"><Search size={28} /></div>
          <h3 className="text-base font-bold text-slate-200 mb-1.5">Chưa Có Nội Dung SEO</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">Nhập thông tin ở khung bên trái rồi bấm <strong className="text-amber-400">Tối Ưu SEO</strong> để tạo bộ nội dung cho sản phẩm.</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4 text-[10px] text-slate-400">
            <span className="flex gap-1 items-center border border-slate-700 rounded-full px-2 py-1"><Layers size={11} />5 tiêu đề</span>
            <span className="flex gap-1 items-center border border-slate-700 rounded-full px-2 py-1"><FileText size={11} />Mô tả sản phẩm</span>
            <span className="flex gap-1 items-center border border-slate-700 rounded-full px-2 py-1"><Hash size={11} />10 hashtag</span>
          </div>
        </div>}
        {result && snapshot && (raw ? <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">{seoToText(result)}</pre> : <>
          <section className="space-y-3">
            <div className="flex justify-between items-center gap-2 flex-wrap"><h3 className="text-xs font-black text-white uppercase tracking-wide">1. Năm biến thể tiêu đề</h3>{copyButton(result.titles.join("\n"), "titles", "Chép tiêu đề")}</div>
            <p className="text-xs text-slate-400">Mục tiêu biên tập: tối đa {SEO_PLATFORMS[snapshot.inputs.platform].titleLimit} ký tự mỗi tiêu đề.</p>
            {result.titles.map((title, index) => <div key={index} className="bg-slate-950/70 rounded-xl border border-slate-800 p-3 space-y-2">
              <p className="text-xs leading-relaxed break-words select-text">{index + 1}. {title}</p>
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-emerald-300">{charCount(title)} ký tự · Trong mục tiêu độ dài</span>{copyButton(title, `title-${index}`, `Chép tiêu đề ${index + 1}`)}</div>
            </div>)}
          </section>
          <section className="space-y-3">
            <div className="flex justify-between items-center gap-2 flex-wrap"><h3 className="text-xs font-black text-white uppercase tracking-wide">2. Mô tả sản phẩm</h3>{copyButton(result.descriptions.map(item => `• ${item.title}: ${item.content}`).join("\n"), "description", "Chép mô tả")}</div>
            {result.descriptions.map((item, index) => <div key={index} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs leading-relaxed break-words"><h4 className="font-semibold text-amber-300 mb-1">{item.title}</h4><p className="whitespace-pre-wrap">{item.content}</p></div>)}
          </section>
          <section className="space-y-3">
            <div className="flex justify-between items-center gap-2 flex-wrap"><h3 className="text-xs font-black text-white uppercase tracking-wide">3. Mười hashtag gợi ý</h3>{copyButton(result.hashtags.join(" "), "tags", "Chép hashtag")}</div>
            <div className="flex gap-2 flex-wrap">{result.hashtags.map(tag => <button key={tag} type="button" onClick={() => void copy(tag, tag)} aria-label={`Sao chép ${tag}`} className="max-w-full break-all bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-amber-200">{tag}{copied === tag ? " ✓" : ""}</button>)}</div>
          </section>
        </>)}
        {result && <p className="text-xs leading-relaxed text-slate-400 border-t border-slate-700 pt-4">Hãy kiểm tra thông tin và chính sách shop trước khi đăng. Gợi ý được tạo từ dữ liệu bạn nhập, không phải dữ liệu xu hướng hoặc cam kết thứ hạng tìm kiếm.</p>}
      </div>
    </section>
  );
}
