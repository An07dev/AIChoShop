"use client";

import { useState } from "react";
import { Copy, Check, FileSpreadsheet, Sparkles, RotateCcw } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { ANGLES, PLATFORMS, exportRows, inspectVariant, length, lockedWords, variantText, type Snapshot } from "@/lib/spinner/contract";

type Props = { snapshot: Snapshot | null; selected: number[]; onSelect: (indices: number[]) => void; pending: number | "all" | null; onRegenerate: (index: number) => void };
export function TitleSpinnerOutput({ snapshot, selected, onSelect, pending, onRegenerate }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const { showError } = useToast();
  const loading = pending !== null;
  async function copy(text: string, id: string) {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(current => current === id ? null : current), 1800); }
    catch { showError("Không sao chép được. Hãy chọn văn bản và sao chép thủ công."); }
  }
  async function download() {
    if (!snapshot || !selected.length) return;
    try {
      const XLSX = await import("xlsx");
      const rows = exportRows(snapshot, [...selected].sort((a, b) => a - b));
      const sheet = XLSX.utils.json_to_sheet(rows);
      sheet["!cols"] = [8, 16, 24, 65, 90, 18, 24, 70, 45, 65, 90].map(wch => ({ wch }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Phien ban da chon");
      XLSX.writeFile(workbook, `AIChoShop_PhienBan_${snapshot.inputs.platform}_${Date.now()}.xlsx`);
    } catch { showError("Không xuất được Excel. Vui lòng thử lại."); }
  }
  const button = "inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed";
  return <section aria-label="Kết quả nhân bản" aria-busy={loading} className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col lg:h-full min-h-[360px] lg:min-h-0 overflow-hidden text-slate-200">
    <div className="px-4 py-3 border-b border-slate-800 space-y-3 shrink-0">
      <div className="flex justify-between items-center flex-wrap gap-2"><h2 className="text-sm font-bold flex gap-2 items-center"><Sparkles size={16} className="text-teal-400" />Kho Phiên Bản Nội Dung</h2>{snapshot && <span className="text-[10px] text-teal-300">{PLATFORMS[snapshot.inputs.platform].label} · {snapshot.variants.length} phiên bản</span>}</div>
      {snapshot && <div className="flex flex-wrap gap-2">
        <button className={button} disabled={loading} onClick={() => onSelect(selected.length === snapshot.variants.length ? [] : snapshot.variants.map((_, i) => i))}>{selected.length === snapshot.variants.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}</button>
        <button className={button} disabled={!selected.length || loading} onClick={() => void copy([...selected].sort((a, b) => a - b).map(i => `PHIÊN BẢN ${(snapshot.variants[i].slot ?? i) + 1}\n${variantText(snapshot.variants[i])}`).join("\n\n"), "selected")}><Copy size={12} />{copied === "selected" ? "Đã chép" : `Chép đã chọn (${selected.length})`}</button>
        <button className={button} disabled={!selected.length || loading} onClick={() => void download()}><FileSpreadsheet size={12} />Xuất Excel đã chọn</button>
      </div>}
    </div>
    <div className="p-3.5 space-y-4 flex-1 min-h-0 lg:overflow-y-auto custom-scrollbar">
      {loading && <p role="status" className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-200">{pending === "all" ? "Đang tạo bộ nội dung và kiểm tra từ khóa, thông số, trùng lặp…" : `Đang tạo lại phiên bản ${Number(pending) + 1} từ dữ liệu của bộ kết quả này…`}</p>}
      {!snapshot && !loading && <div className="min-h-[280px] h-full flex flex-col items-center justify-center text-center p-5"><Copy size={32} className="text-teal-400 mb-4" /><h3 className="font-bold mb-2">Chưa có phiên bản nội dung</h3><p className="text-xs text-slate-400 max-w-sm">Nhập nội dung gốc, chọn hướng viết rồi tạo 5 hoặc 10 phiên bản để đối chiếu và lựa chọn.</p></div>}
      {snapshot && <>
        <details className="rounded-xl border border-slate-700 bg-slate-800/50 p-3"><summary className="text-xs font-bold cursor-pointer">Đối chiếu nội dung gốc · {snapshot.inputs.originalTitle}</summary><div className="text-xs leading-relaxed whitespace-pre-wrap mt-3 space-y-2"><p>{snapshot.inputs.originalDescription || "Không có mô tả gốc."}</p><p className="text-teal-300">Từ khóa giữ nguyên: {lockedWords(snapshot.inputs).join(", ") || "Chưa chỉ định"}</p></div></details>
        <p className="text-[10px] leading-relaxed text-slate-400">Tương đồng được tính từ các từ xuất hiện trong hai văn bản, không xét thứ tự; từ 80% sẽ cảnh báo. Với cả bộ, hiển thị mức cao hơn giữa tiêu đề và mô tả. Đây không phải điểm SEO hoặc kết quả kiểm duyệt của sàn.</p>
        {snapshot.variants.map((item, index) => {
          const review = inspectVariant(snapshot.inputs, snapshot.variants, index);
          const slot = item.slot ?? index;
          return <article key={index} className={`rounded-xl border p-3.5 space-y-3 ${selected.includes(index) ? "border-teal-500/60 bg-teal-500/5" : "border-slate-700 bg-slate-950/50"}`}>
            <div className="flex justify-between items-center flex-wrap gap-2"><label className="text-xs font-bold flex gap-2 items-center"><input type="checkbox" aria-label={`Chọn phiên bản ${slot + 1}`} disabled={loading} checked={selected.includes(index)} onChange={event => onSelect(event.target.checked ? [...selected, index] : selected.filter(i => i !== index))} className="accent-teal-500" />Phiên bản {slot + 1}</label><span className="text-[10px] rounded-full bg-slate-800 px-2 py-1 text-teal-300">{ANGLES[item.angle]}</span></div>
            {item.title && <div><h3 className="font-semibold text-sm text-white leading-relaxed break-words">{item.title}</h3><p className="text-[10px] text-slate-400 mt-1">{length(item.title)}/{PLATFORMS[snapshot.inputs.platform].titleLimit} ký tự tiêu đề</p></div>}
            {item.description && <div><p className="text-xs whitespace-pre-wrap break-words leading-relaxed text-slate-300">{item.description}</p><p className="text-[10px] text-slate-400 mt-1">{length(item.description)}/1.800 ký tự mô tả</p></div>}
            <div className="flex flex-wrap gap-2 text-[10px]"><span className="text-emerald-300">{lockedWords(snapshot.inputs).length ? "Đủ từ khóa bắt buộc" : "Không có từ khóa bắt buộc"}</span><span className="text-slate-400">Giống bản gốc: {review.originalSimilarity}%</span>{review.closest && <span className="text-slate-400">Gần nhất: bản {(snapshot.variants[review.closest.index].slot ?? review.closest.index) + 1} ({review.closest.score}%)</span>}</div>
            {review.warnings.length > 0 && <ul className="text-[11px] text-amber-300 space-y-1">{review.warnings.map(w => <li key={w}>• {w}</li>)}</ul>}
            <div className="flex flex-wrap gap-2"><button className={button} disabled={loading} onClick={() => void copy(variantText(item), String(index))}>{copied === String(index) ? <Check size={12} /> : <Copy size={12} />}{copied === String(index) ? "Đã chép" : "Sao chép"}</button><button className={button} disabled={loading} onClick={() => onRegenerate(slot)}><RotateCcw size={12} />Tạo lại phiên bản này</button></div>
          </article>;
        })}
        <p className="text-[10px] leading-relaxed text-slate-400">Kiểm tra lại thông tin thực tế trước khi sử dụng. Viết lại nội dung không đảm bảo tránh bị đánh dấu spam hoặc được sàn chấp thuận.</p>
      </>}
    </div>
  </section>;
}
