"use client";

import { BarChart3, Download, FileJson, FolderOpen, PackageOpen, PieChart, Trash2 } from "lucide-react";
import { downloadTextFile, pricingHistoryToCsv, type PricingCalculationSnapshot } from "@/lib/pricing/storage";
import type { ExternalSalesChannel, PriceEvaluation } from "@/lib/pricing/types";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const money = (value: number) => currency.format(Math.round(value));

export function EmptyCalculation() {
  return <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
    <div className="rounded-2xl bg-blue-50 p-4 text-blue-600"><BarChart3 size={34} /></div>
    <h2 className="mt-4 font-black text-slate-900">Chưa có kết quả tính toán</h2>
    <p className="mt-1 max-w-sm text-sm text-slate-500">Nhập thông tin sản phẩm rồi nhấn “Tính toán giá bán” để xem đầy đủ giá đề xuất, lợi nhuận và cơ cấu chi phí.</p>
  </section>;
}

export function CostVisuals({ evaluation, isExternal = false }: { evaluation: PriceEvaluation; isExternal?: boolean }) {
  const items = [
    { label: isExternal ? "Phí thu tiền & xử lý" : "Phí nền tảng", value: evaluation.platformFees, color: "#7c3aed" },
    { label: "Giá vốn", value: evaluation.cogs, color: "#2563eb" },
    { label: "Vận hành", value: evaluation.operatingCosts, color: "#0d9488" },
    { label: "Ads", value: evaluation.marketingCost, color: "#f59e0b" },
    { label: "Affiliate", value: evaluation.affiliateCost, color: "#ec4899" },
    { label: "Thuế", value: evaluation.tax, color: "#ef4444" },
  ].filter((item) => item.value > 0);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradient = items.map((item) => {
    const start = cursor;
    cursor += total > 0 ? item.value / total * 100 : 0;
    return `${item.color} ${start}% ${cursor}%`;
  }).join(", ");

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-5 flex items-center gap-2"><PieChart size={20} className="text-violet-600" /><div><h2 className="font-black">Cơ cấu chi phí đơn thành công</h2><p className="text-xs text-slate-500">Tỷ trọng trên tổng chi phí của một đơn giao thành công.</p></div></div>
    <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
      <div className="relative mx-auto h-40 w-40 rounded-full" style={{ background: total > 0 ? `conic-gradient(${gradient})` : "#e2e8f0" }}>
        <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center"><span className="text-[10px] font-bold uppercase text-slate-400">Tổng chi phí</span><strong className="mt-1 text-sm text-slate-900">{money(total)}</strong></div>
      </div>
      <div className="space-y-3">{items.map((item) => {
        const percent = total > 0 ? item.value / total * 100 : 0;
        return <div key={item.label}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-700">{item.label}</span><span className="font-mono font-bold">{percent.toFixed(1)}% · {money(item.value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: item.color }} /></div></div>;
      })}</div>
    </div>
  </section>;
}

export function CalculationSummary({ evaluation }: { evaluation: PriceEvaluation }) {
  const totalCost = evaluation.productRevenue - evaluation.profitOnSuccess;
  return <section className="rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-600 p-5 text-white shadow-sm">
    <h2 className="font-black">Tóm tắt tính toán</h2>
    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <SummaryValue label="Tổng chi phí" value={money(totalCost)} />
      <SummaryValue label="Giá bán đề xuất" value={money(evaluation.listPrice)} />
      <SummaryValue label="Lãi đơn thành công" value={money(evaluation.profitOnSuccess)} />
      <SummaryValue label="Biên kỳ vọng" value={`${evaluation.expectedMargin.toFixed(1)}%`} />
    </div>
  </section>;
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-blue-100">{label}</p><p className="mt-1 font-mono text-lg font-black">{value}</p></div>;
}

export function SavedCalculations({ history, onOpen, onDelete, onDeleteAll }: {
  history: PricingCalculationSnapshot[];
  onOpen: (item: PricingCalculationSnapshot) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}) {
  const exportCsv = () => downloadTextFile("aichoshop-lich-su-dinh-gia.csv", `\uFEFF${pricingHistoryToCsv(history)}`, "text/csv;charset=utf-8");
  const exportJson = () => downloadTextFile("aichoshop-lich-su-dinh-gia.json", JSON.stringify(history, null, 2), "application/json;charset=utf-8");

  return <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="flex items-center gap-2 font-black"><PackageOpen size={20} className="text-blue-600" /> Danh sách sản phẩm đã lưu ({history.length})</h2>
      <div className="flex flex-wrap gap-2">
        <button disabled={!history.length} onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-40"><Download size={14} /> Tải CSV</button>
        <button disabled={!history.length} onClick={exportJson} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-40"><FileJson size={14} /> Tải JSON</button>
        <button disabled={!history.length} onClick={onDeleteAll} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-40"><Trash2 size={14} /> Xóa tất cả</button>
      </div>
    </div>
    {!history.length ? <div className="p-8 text-center text-sm text-slate-500">Chưa có sản phẩm nào được lưu trên trình duyệt này.</div> : <div className="divide-y">{history.map((item) => {
      const evaluation = item.result.evaluation;
      const externalNames: Record<ExternalSalesChannel, string> = { facebook: "Facebook", website: "Website", youtube: "YouTube", other: "Kênh khác" };
      return <article key={item.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-900">{item.productName}</h3><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">{item.input.platform === "external" ? "Đơn ngoài" : item.input.platform}</span><span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{item.input.platform === "external" ? externalNames[item.input.externalChannel ?? "facebook"] : item.input.shopType === "mall" ? "Mall" : "Shop thường"}</span></div>
          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-slate-600 md:grid-cols-4"><span>Giá vốn: <b>{money(item.input.costPerUnit)}</b></span><span>Giá đề xuất: <b className="text-emerald-700">{money(evaluation.listPrice)}</b></span><span>Lãi kỳ vọng: <b>{money(evaluation.expectedProfitPerOrder)}</b></span><span>Biên: <b>{evaluation.expectedMargin.toFixed(1)}%</b></span></div>
          <p className="mt-2 text-[11px] text-slate-400">Lưu lúc {new Date(item.createdAt).toLocaleString("vi-VN")}</p>
        </div>
        <div className="flex gap-2"><button onClick={() => onOpen(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"><FolderOpen size={14} /> Mở lại</button><button aria-label={`Xóa ${item.productName}`} onClick={() => onDelete(item.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600"><Trash2 size={15} /></button></div>
      </article>;
    })}</div>}
  </section>;
}
