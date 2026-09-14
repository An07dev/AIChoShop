"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Sparkles, RotateCcw, Globe } from "lucide-react";
import { TitleSpinnerOutput } from "@/components/tools/TitleSpinnerOutput";
import { ANGLES, CONTENT_MODES, EMPTY, LIMITS, PLATFORMS, parseExisting, validateInput, type SpinnerInput, type Snapshot } from "@/lib/spinner/contract";

export default function TitleSpinner() {
  const [inputs, setInputs] = useState<SpinnerInput>({ ...EMPTY });
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [pending, setPending] = useState<number | "all" | null>(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const busy = useRef(false);
  const loading = pending !== null;
  async function generate(replaceIndex: number | null = null, resume = false) {
    if (busy.current) return;
    busy.current = true;
    setPending(replaceIndex ?? "all");
    setError("");
    try {
      const useSnapshot = resume || replaceIndex !== null;
      const submitted = useSnapshot ? snapshot!.inputs : validateInput(inputs);
      const response = await fetch("/api/ai/title-spinner", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: submitted, replaceIndex, existing: useSnapshot ? snapshot!.variants : undefined }),
        signal: AbortSignal.timeout(115_000),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Không tạo được nội dung. Vui lòng thử lại.");
      const variants = parseExisting(data.data, submitted);
      if (!variants.length) throw new Error("AI chưa trả phiên bản đạt yêu cầu.");
      const selectedSlots = useSnapshot ? selected.map(i => snapshot!.variants[i].slot ?? i) : [];
      setSnapshot({ inputs: submitted, variants });
      setSelected(variants.flatMap((v, i) => selectedSlots.includes(v.slot ?? i) ? [i] : []));
      setWarning(typeof data.warning === "string" ? data.warning : "");
    } catch (cause) {
      setError(cause instanceof Error && ["TimeoutError", "AbortError"].includes(cause.name) ? "AI xử lý quá lâu. Hãy giảm số phiên bản hoặc rút gọn mô tả." : cause instanceof Error ? cause.message : "Không kết nối được máy chủ.");
    } finally { busy.current = false; setPending(null); }
  }
  const update = <K extends keyof SpinnerInput>(key: K, value: SpinnerInput[K]) => setInputs(current => ({ ...current, [key]: value }));
  const inputClass = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50";
  return <div className="max-w-7xl mx-auto flex flex-col min-h-0 lg:h-[calc(100vh-100px)]">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
      <div className="flex items-center gap-3">
        <Link href="/tools" aria-label="Quay lại kho công cụ" className="p-2 rounded-xl border border-slate-200 bg-white"><ArrowLeft size={17} /></Link>
        <div className="p-2 rounded-xl bg-teal-100 text-teal-600 hidden sm:block"><Copy size={20} /></div>
        <div><h1 className="text-lg font-black text-slate-900">AI Nhân Bản Chống Spam</h1><p className="text-xs text-slate-400 mt-0.5">Tạo nhiều phiên bản nội dung, giảm lặp từ và kiểm tra độ tương đồng.</p></div>
      </div>
      <div className="flex gap-2">
        <button type="button" disabled={loading} onClick={() => { setInputs({ ...EMPTY, mode: "both", originalTitle: "Áo phông nam cotton form rộng", originalDescription: "Áo phông nam chất liệu cotton, form rộng thoải mái. Co giãn linh hoạt, dễ phối đồ khi đi học hoặc đi chơi.", keywords: "áo phông nam, cotton", usp: "Form rộng, dễ phối đồ, co giãn linh hoạt" }); setError(""); }} className="text-xs font-bold bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1.5 rounded-xl disabled:opacity-50">Dùng Mẫu Thử</button>
        <button type="button" disabled={loading} aria-label="Làm mới" onClick={() => { setInputs({ ...EMPTY }); setSnapshot(null); setSelected([]); setWarning(""); setError(""); }} className="p-2 text-slate-400 disabled:opacity-50"><RotateCcw size={16} /></button>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
      <form onSubmit={e => { e.preventDefault(); void generate(); }} className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-0">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-sm font-bold text-slate-800 flex gap-2 items-center"><Sparkles size={16} className="text-teal-500" />Nội Dung Gốc & Cấu Hình</div>
        <div className="p-4 flex-1 min-h-0 lg:overflow-y-auto custom-scrollbar">
          <fieldset disabled={loading} className="space-y-3.5 min-w-0">
            <div><span id="spinner-platform" className="text-xs font-bold text-slate-700 flex gap-1 mb-1.5"><Globe size={13} />Sàn TMĐT</span>
              <div role="group" aria-labelledby="spinner-platform" className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">{Object.entries(PLATFORMS).map(([id, platform]) => <button key={id} type="button" aria-pressed={inputs.platform === id} onClick={() => update("platform", id as SpinnerInput["platform"])} className={`text-xs font-bold py-2 rounded-lg ${inputs.platform === id ? "bg-teal-600 text-white" : "text-slate-600"}`}>{platform.label}</button>)}</div>
            </div>
            <div><label htmlFor="spinner-mode" className="block text-xs font-bold text-slate-700 mb-1">Nội dung cần nhân bản</label><select id="spinner-mode" className={inputClass} value={inputs.mode} onChange={e => update("mode", e.target.value as SpinnerInput["mode"])}>{Object.entries(CONTENT_MODES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div><label htmlFor="spinner-angle" className="block text-xs font-bold text-slate-700 mb-1">Hướng viết</label><select id="spinner-angle" className={inputClass} value={inputs.angle} onChange={e => update("angle", e.target.value as SpinnerInput["angle"])}><option value="mixed">Kết hợp cả ba</option>{Object.entries(ANGLES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div>
              <div><label htmlFor="spinner-count" className="block text-xs font-bold text-slate-700 mb-1">Số phiên bản</label><select id="spinner-count" className={inputClass} value={inputs.count} onChange={e => update("count", Number(e.target.value) as 5 | 10)}><option value={5}>5 phiên bản</option><option value={10}>10 phiên bản</option></select></div>
            </div>
            <div><label htmlFor="spinner-title" className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề gốc <span className="text-rose-500">*</span></label><textarea id="spinner-title" required rows={2} maxLength={LIMITS.originalTitle} className={`${inputClass} resize-none`} value={inputs.originalTitle} onChange={e => update("originalTitle", e.target.value)} placeholder="Tên sản phẩm, thương hiệu, mã model, thông số…" /><p className="text-[10px] text-slate-400 text-right">{inputs.originalTitle.length}/{LIMITS.originalTitle}</p></div>
            <div><label htmlFor="spinner-description" className="block text-xs font-bold text-slate-700 mb-1">Mô tả gốc {inputs.mode !== "title" ? <span className="text-rose-500">*</span> : "(tùy chọn)"}</label><textarea id="spinner-description" required={inputs.mode !== "title"} rows={4} maxLength={LIMITS.originalDescription} className={`${inputClass} resize-y`} value={inputs.originalDescription} onChange={e => update("originalDescription", e.target.value)} placeholder="Dán mô tả cần viết lại. Giữ các thông số và chính sách đúng thực tế." /><p className="text-[10px] text-slate-400 text-right">{inputs.originalDescription.length}/{LIMITS.originalDescription}</p></div>
            <div><label htmlFor="spinner-keywords" className="block text-xs font-bold text-slate-700 mb-1">Từ khóa / thương hiệu / mã model phải giữ</label><textarea id="spinner-keywords" rows={2} maxLength={LIMITS.keywords} className={`${inputClass} resize-none`} value={inputs.keywords} onChange={e => update("keywords", e.target.value)} placeholder="VD: áo phông nam, cotton, ABC-123" /><p className="text-[10px] leading-relaxed text-slate-400 mt-1">Ngăn cách bằng dấu phẩy, chấm phẩy hoặc xuống dòng. Chỉ khóa các cụm thực sự cần giữ nguyên, tối đa 12 cụm. Ví dụ “áo phông nam, cotton” là hai cụm; “áo thun nam” không thay được “áo phông nam”. Mỗi tiêu đề (hoặc mô tả nếu chỉ tạo mô tả) phải đủ các cụm đã khóa.</p></div>
            <div><label htmlFor="spinner-usp" className="block text-xs font-bold text-slate-700 mb-1">USP / thông tin bổ sung thực tế</label><textarea id="spinner-usp" rows={3} maxLength={LIMITS.usp} className={`${inputClass} resize-none`} value={inputs.usp} onChange={e => update("usp", e.target.value)} placeholder="Chỉ nhập đặc điểm, công dụng và chính sách shop thực sự có." /></div>
            <p className="text-[10px] text-slate-400">Mục tiêu biên tập: tiêu đề tối đa {PLATFORMS[inputs.platform].titleLimit} ký tự; mô tả tối đa 1.800 ký tự. Không phải chứng nhận nội dung được sàn chấp thuận.</p>
          </fieldset>
        </div>
        <div className="p-3 border-t border-slate-100 shrink-0 space-y-2">
          {warning && snapshot && <p role="status" className="text-xs text-amber-800 bg-amber-50 rounded-lg p-2.5">Đã giữ {snapshot.variants.length}/{snapshot.inputs.count} phiên bản đạt yêu cầu. {warning}</p>}
          {snapshot && snapshot.variants.length < snapshot.inputs.count && <button type="button" disabled={loading} onClick={() => void generate(null, true)} className="w-full rounded-xl py-2 border border-teal-500 text-teal-700 text-xs font-bold disabled:opacity-50">Tạo tiếp {snapshot.inputs.count - snapshot.variants.length} bản còn thiếu từ dữ liệu của bộ kết quả</button>}
          {error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2.5">{error}{snapshot && " Bộ kết quả trước vẫn được giữ."}</p>}
          <button disabled={loading || !inputs.originalTitle.trim() || (inputs.mode !== "title" && !inputs.originalDescription.trim())} type="submit" className="w-full rounded-xl py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed">{loading ? pending === "all" ? "Đang Tạo & Kiểm Tra…" : `Đang Tạo Lại Phiên Bản ${Number(pending) + 1}…` : `Tạo ${inputs.count} Phiên Bản (${CONTENT_MODES[inputs.mode]})`}</button>
        </div>
      </form>
      <div className="lg:col-span-7 min-h-0 lg:h-full"><TitleSpinnerOutput snapshot={snapshot} selected={selected} onSelect={setSelected} pending={pending} onRegenerate={index => void generate(index)} /></div>
    </div>
  </div>;
}
