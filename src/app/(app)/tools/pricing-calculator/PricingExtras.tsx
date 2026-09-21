"use client";

import { BarChart3, Download, FileJson, FolderOpen, PackageOpen, PieChart, Trash2 } from "lucide-react";
import { downloadTextFile, pricingHistoryToCsv, type PricingCalculationSnapshot } from "@/lib/pricing/storage";
import type { ExternalSalesChannel, PriceEvaluation } from "@/lib/pricing/types";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const money = (value: number) => currency.format(Math.round(value));

export function EmptyCalculation() {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-xs transition-colors">
      <div className="rounded-2xl bg-brand-light p-4 text-brand shadow-xs">
        <BarChart3 size={38} />
      </div>
      <h2 className="mt-4 font-black text-slate-900 dark:text-white text-base">
        Sẵn sàng phân tích định giá
      </h2>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        Nhập thông tin sản phẩm rồi nhấn <strong className="text-brand font-bold">“Cập nhật & Tính toán”</strong> để xem đầy đủ giá đề xuất, biên lợi nhuận ròng và mô phỏng 100 đơn.
      </p>
    </section>
  );
}

export function CostVisuals({ evaluation, isExternal = false }: { evaluation: PriceEvaluation; isExternal?: boolean }) {
  const items = [
    { label: isExternal ? "Phí thu tiền & xử lý" : "Phí nền tảng sàn", value: evaluation.platformFees, color: "#8b5cf6" },
    { label: "Giá vốn hàng bán", value: evaluation.cogs, color: "#2563eb" },
    { label: "Đóng gói & Vận hành", value: evaluation.operatingCosts, color: "#0d9488" },
    { label: "Ads & Marketing", value: evaluation.marketingCost, color: "#f59e0b" },
    { label: "Affiliate / KOC", value: evaluation.affiliateCost, color: "#ec4899" },
    { label: "Nghĩa vụ thuế", value: evaluation.tax, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradient = items
    .map((item) => {
      const start = cursor;
      cursor += total > 0 ? (item.value / total) * 100 : 0;
      return `${item.color} ${start}% ${cursor}%`;
    })
    .join(", ");

  return (
    <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs transition-colors">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-brand-light text-brand">
          <PieChart size={20} />
        </div>
        <div>
          <h2 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
            Cơ cấu tỷ trọng chi phí đơn thành công
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tỷ lệ phân bổ chi phí cấu thành nên một đơn hàng giao thành công.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
        <div
          className="relative mx-auto h-40 w-40 rounded-full shadow-inner"
          style={{ background: total > 0 ? `conic-gradient(${gradient})` : "#e2e8f0" }}
        >
          <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900 text-center shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tổng chi phí
            </span>
            <strong className="mt-0.5 text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white">
              {money(total)}
            </strong>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.label}>
                <div className="mb-1 flex justify-between gap-3 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {percent.toFixed(1)}% · {money(item.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percent}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function CalculationSummary({ evaluation }: { evaluation: PriceEvaluation }) {
  const totalCost = evaluation.productRevenue - evaluation.profitOnSuccess;
  return (
    <section
      className="rounded-3xl p-5 text-white shadow-md relative overflow-hidden"
      style={{ backgroundImage: "var(--brand-gradient)" }}
    >
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <h2 className="font-black text-base relative z-10">Tóm tắt dòng tiền định giá</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
        <SummaryValue label="Tổng chi phí" value={money(totalCost)} />
        <SummaryValue label="Giá niêm yết" value={money(evaluation.listPrice)} />
        <SummaryValue label="Lãi đơn thành công" value={money(evaluation.profitOnSuccess)} />
        <SummaryValue label="Biên lợi nhuận" value={`${evaluation.expectedMargin.toFixed(1)}%`} />
      </div>
    </section>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] sm:text-xs text-white/80 font-medium truncate">{label}</p>
      <p className="mt-1 font-mono text-sm sm:text-lg font-black text-white break-words">{value}</p>
    </div>
  );
}

export function SavedCalculations({
  history,
  onOpen,
  onDelete,
  onDeleteAll,
}: {
  history: PricingCalculationSnapshot[];
  onOpen: (item: PricingCalculationSnapshot) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}) {
  const exportCsv = () =>
    downloadTextFile("aichoshop-lich-su-dinh-gia.csv", `\uFEFF${pricingHistoryToCsv(history)}`, "text/csv;charset=utf-8");
  const exportJson = () =>
    downloadTextFile("aichoshop-lich-su-dinh-gia.json", JSON.stringify(history, null, 2), "application/json;charset=utf-8");

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-sm sm:text-base">
          <PackageOpen size={20} className="text-brand" /> Danh sách sản phẩm đã lưu ({history.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!history.length}
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 disabled:opacity-40 transition cursor-pointer"
          >
            <Download size={14} /> Tải CSV
          </button>
          <button
            disabled={!history.length}
            onClick={exportJson}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand/40 bg-brand-light px-3 py-2 text-xs font-bold text-brand hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
          >
            <FileJson size={14} /> Tải JSON
          </button>
          <button
            disabled={!history.length}
            onClick={onDeleteAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 disabled:opacity-40 transition cursor-pointer"
          >
            <Trash2 size={14} /> Xóa tất cả
          </button>
        </div>
      </div>

      {!history.length ? (
        <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Chưa có sản phẩm nào được lưu. Hệ thống sẽ tự động lưu lại lịch sử mỗi khi bạn bấm &ldquo;Cập nhật &amp; Tính toán&rdquo;.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {history.map((item) => {
            const evaluation = item.result.evaluation;
            const externalNames: Record<ExternalSalesChannel, string> = {
              facebook: "Facebook",
              website: "Website",
              youtube: "YouTube",
              other: "Kênh khác",
            };
            return (
              <article
                key={item.id}
                className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                      {item.productName}
                    </h3>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">
                      {item.input.platform === "external" ? "Đơn ngoài" : item.input.platform}
                    </span>
                    <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand">
                      {item.input.platform === "external"
                        ? externalNames[item.input.externalChannel ?? "facebook"]
                        : item.input.shopType === "mall"
                        ? "Mall"
                        : "Shop thường"}
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400 md:grid-cols-4">
                    <span>
                      Giá vốn: <b className="font-mono text-slate-900 dark:text-white">{money(item.input.costPerUnit)}</b>
                    </span>
                    <span>
                      Giá đề xuất: <b className="font-mono text-emerald-600 dark:text-emerald-400">{money(evaluation.listPrice)}</b>
                    </span>
                    <span>
                      Lãi kỳ vọng: <b className="font-mono text-brand">{money(evaluation.expectedProfitPerOrder)}</b>
                    </span>
                    <span>
                      Biên: <b className="font-mono text-slate-900 dark:text-white">{evaluation.expectedMargin.toFixed(1)}%</b>
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Lưu lúc {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpen(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand hover:bg-brand-hover px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer active:scale-95"
                  >
                    <FolderOpen size={14} /> Mở lại
                  </button>
                  <button
                    aria-label={`Xóa ${item.productName}`}
                    onClick={() => onDelete(item.id)}
                    className="rounded-xl border border-rose-200 dark:border-rose-800/80 p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
