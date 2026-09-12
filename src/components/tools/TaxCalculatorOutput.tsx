"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, Copy, Download, ExternalLink, PieChart, Scale, ShieldCheck } from "lucide-react";
import { ACTIVITY_RATES, TAX_EXEMPT_REVENUE_2026 } from "@/lib/tax-calculator/engine";
import type { TaxCalculatorInput, TaxCalculatorResult } from "@/lib/tax-calculator/types";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const money = (value: number) => currency.format(Math.round(value));

const SOURCES = {
  threshold: "https://vanban.chinhphu.vn/?classid=0&docid=217960&pageid=27160",
  household: "https://vanban.chinhphu.vn/?classid=1&docid=217111&orggroupid=2&pageid=27160",
  reduction: "https://vanban.chinhphu.vn/?docid=219330&orggroupid=1&pageid=27160",
  company: "https://xaydungchinhsach.chinhphu.vn/thue-suat-thue-thu-nhap-doanh-nghiep-moi-ap-dung-tu-1-10-2025-119250730082233732.htm",
};

function Row({ label, value, strong = false, tone = "slate" }: { label: string; value: string; strong?: boolean; tone?: "slate" | "rose" | "green" | "amber" }) {
  const colors = { slate: "text-slate-100", rose: "text-rose-400", green: "text-emerald-400", amber: "text-amber-400" };
  return <div className={`flex items-center justify-between gap-4 border-b border-slate-700/60 py-2.5 text-xs ${strong ? "font-black" : "font-semibold"}`}><span className="text-slate-300">{label}</span><span className={`font-mono ${colors[tone]}`}>{value}</span></div>;
}

export function TaxCalculatorOutput({ input, result }: { input: TaxCalculatorInput; result: TaxCalculatorResult }) {
  const [copied, setCopied] = useState(false);
  const isCompany = input.payerType === "company";
  const incomeName = isCompany ? "TNDN" : "TNCN";
  const report = useMemo(() => [
    `BẢNG ƯỚC TÍNH THUẾ TMĐT ${input.taxYear}`,
    `Tổng doanh thu đa kênh: ${money(result.totalRevenue)}`,
    `Thuế GTGT: ${money(result.vat)}`,
    `${incomeName}: ${money(result.incomeTax)}`,
    `Tổng nghĩa vụ: ${money(result.totalTax)}`,
    `Đã khấu trừ/tạm nộp: ${money(input.withheldVat + input.withheldIncomeTax)}`,
    `Còn phải nộp: ${money(result.remainingPayable)}`,
    `Có thể bù trừ/hoàn: ${money(result.potentialRefundOrOffset)}`,
    `Dòng tiền sau phí sàn và thuế: ${money(result.netCashAfterTaxAndPlatformFees)}`,
  ].join("\n"), [incomeName, input, result]);
  const copy = async () => { await navigator.clipboard.writeText(report); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  const download = () => { const url = URL.createObjectURL(new Blob([report], { type: "text/plain;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `uoc-tinh-thue-tmdt-${input.taxYear}.txt`; anchor.click(); URL.revokeObjectURL(url); };

  return <aside className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-xl lg:sticky lg:top-4">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-5 py-4"><div><h2 className="flex items-center gap-2 font-black"><PieChart size={18} className="text-rose-400" /> Kết quả nghĩa vụ thuế</h2><p className="mt-1 text-xs text-slate-400">Ước tính theo dữ liệu và phương pháp đã chọn.</p></div><div className="flex gap-2"><button onClick={download} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-bold"><Download size={13} className="inline" /> Tải</button><button onClick={copy} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-bold">{copied ? <Check size={13} className="inline text-emerald-400" /> : <Copy size={13} className="inline" />} {copied ? "Đã chép" : "Sao chép"}</button></div></div>
    <div className="space-y-4 p-5">
      {result.isExempt && <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/50 p-4"><h3 className="font-black text-emerald-400">Thuộc ngưỡng không chịu GTGT và không phải nộp TNCN</h3><p className="mt-1 text-xs leading-relaxed text-emerald-200/80">Tổng doanh thu không quá {money(TAX_EXEMPT_REVENUE_2026)} trong năm.</p></div>}
      <div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-slate-700 bg-slate-800 p-3"><p className="text-[10px] uppercase text-slate-400">Tổng doanh thu</p><strong className="mt-1 block font-mono text-base">{money(result.totalRevenue)}</strong></div><div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3"><p className="text-[10px] uppercase text-rose-300">Tổng nghĩa vụ thuế</p><strong className="mt-1 block font-mono text-base text-rose-400">{money(result.totalTax)}</strong></div></div>
      <section className="rounded-xl border border-slate-700 bg-slate-800/70 p-4"><h3 className="mb-1 flex items-center gap-2 text-xs font-black uppercase"><Scale size={14} className="text-rose-400" /> Chi tiết tính thuế</h3><Row label={`GTGT (${result.vatRate}%)`} value={money(result.vat)} /><Row label={`${incomeName} trước giảm (${result.incomeTaxRate}%)`} value={money(result.incomeTaxBeforeReduction)} /><Row label="Giảm thuế thu nhập 30%" value={`-${money(result.incomeTaxReduction)}`} tone="green" /><Row label={`${incomeName} sau giảm`} value={money(result.incomeTax)} /><Row label="Tổng nghĩa vụ" value={money(result.totalTax)} strong tone="rose" /></section>
      <section className="rounded-xl border border-slate-700 bg-slate-800/70 p-4"><h3 className="mb-1 text-xs font-black uppercase">Đối chiếu đã khấu trừ</h3><Row label="GTGT còn phải nộp" value={money(result.remainingVat)} /><Row label={`${incomeName} còn phải nộp`} value={money(result.remainingIncomeTax)} /><Row label="Tổng còn phải nộp" value={money(result.remainingPayable)} strong tone="rose" /><Row label="Có thể bù trừ/hoàn" value={money(result.potentialRefundOrOffset)} strong tone="green" /></section>
      <section className="rounded-xl bg-gradient-to-r from-emerald-700 to-cyan-700 p-4"><p className="text-xs text-emerald-100">Doanh thu còn lại sau phí sàn và tổng nghĩa vụ thuế</p><strong className="mt-1 block font-mono text-2xl">{money(result.netCashAfterTaxAndPlatformFees)}</strong><p className="mt-1 text-xs text-emerald-100">Tỷ lệ còn lại {result.netRate.toFixed(1)}% · Thuế hiệu dụng {result.effectiveTaxRate.toFixed(2)}%</p></section>
      {!isCompany && <p className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-3 text-xs text-blue-200">Phương pháp: {result.effectivePersonalMethod === "revenue" ? `${ACTIVITY_RATES[input.activity].label}; TNCN tính trên phần doanh thu vượt 1 tỷ đồng.` : `TNCN tính trên thu nhập chịu thuế ${money(result.taxableIncomeBase)}.`}</p>}
      {result.warnings.map((warning) => <p key={warning} className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-200"><AlertTriangle size={14} className="shrink-0" />{warning}</p>)}
      <section className="rounded-xl border border-slate-700 p-4 text-xs text-slate-400"><h3 className="mb-2 flex items-center gap-2 font-black text-slate-200"><ShieldCheck size={15} /> Căn cứ cập nhật</h3><div className="flex flex-wrap gap-3"><a href={SOURCES.threshold} target="_blank" rel="noreferrer" className="text-blue-400">Ngưỡng 1 tỷ <ExternalLink size={11} className="inline" /></a><a href={SOURCES.household} target="_blank" rel="noreferrer" className="text-blue-400">NĐ 68/2026 <ExternalLink size={11} className="inline" /></a><a href={SOURCES.reduction} target="_blank" rel="noreferrer" className="text-blue-400">Giảm 30% <ExternalLink size={11} className="inline" /></a><a href={SOURCES.company} target="_blank" rel="noreferrer" className="text-blue-400">Thuế TNDN <ExternalLink size={11} className="inline" /></a></div><p className="mt-3 leading-relaxed">Công cụ hỗ trợ dự toán; hồ sơ, hóa đơn và đặc điểm hoạt động quyết định số quyết toán cuối cùng.</p></section>
    </div>
  </aside>;
}
