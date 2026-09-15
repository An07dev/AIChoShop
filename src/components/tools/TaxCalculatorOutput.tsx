"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  CircleDollarSign,
  Copy,
  Download,
  ExternalLink,
  Percent,
  ReceiptText,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { TaxCalculatorInput, TaxCalculatorResult } from "@/lib/tax-calculator/types";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const money = (value: number) => currency.format(Math.round(value));
const formatMoney = money;

function Row({
  label,
  value,
  strong = false,
  tone = "slate",
  hint,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "slate" | "rose" | "green" | "amber" | "brand";
  hint?: string;
}) {
  const colors = {
    slate: "text-slate-900 dark:text-slate-100",
    rose: "text-rose-600 dark:text-rose-400 font-bold",
    green: "text-emerald-600 dark:text-emerald-400 font-bold",
    amber: "text-amber-600 dark:text-amber-400 font-bold",
    brand: "text-brand font-bold",
  };
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 py-2.5 text-xs ${
        strong ? "font-black" : "font-semibold"
      }`}
    >
      <div>
        <span className={strong ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}>
          {label}
        </span>
        {hint && <span className="ml-2 text-[10px] text-slate-400 dark:text-slate-500 font-normal">{hint}</span>}
      </div>
      <span className={`font-mono text-right ${colors[tone]}`}>{value}</span>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "slate",
  subtext,
  icon,
}: {
  label: string;
  value: string;
  tone?: "slate" | "brand" | "green" | "rose" | "amber";
  subtext?: string;
  icon?: ReactNode;
}) {
  const tones = {
    slate: "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
    brand: "border-brand/30 bg-brand-light/30 dark:bg-brand-light/10 text-brand",
    green: "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300",
    rose: "border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300",
    amber: "border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300",
  };
  return (
    <div className={`rounded-2xl border p-3.5 transition-all shadow-xs ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-1">
        <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{label}</p>
        {icon && <div className="opacity-75">{icon}</div>}
      </div>
      <p className="mt-1 text-base sm:text-lg font-black font-mono tracking-tight">{value}</p>
      {subtext && <p className="mt-0.5 text-[11px] opacity-75 font-medium">{subtext}</p>}
    </div>
  );
}

export function TaxCalculatorOutput({ input, result }: { input: TaxCalculatorInput; result: TaxCalculatorResult }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"breakdown" | "withheld" | "cashflow">("breakdown");

  const isCompany = input.payerType === "company";
  const incomeName = isCompany ? "TNDN" : "TNCN";

  const report = useMemo(
    () =>
      [
        `BẢNG DỰ TOÁN THUẾ THƯƠNG MẠI ĐIỆN TỬ ${input.taxYear}`,
        `Loại người nộp thuế: ${
          input.payerType === "company"
            ? "Doanh nghiệp / Công ty"
            : input.payerType === "household"
            ? "Hộ kinh doanh"
            : "Cá nhân kinh doanh"
        }`,
        `Tổng doanh thu đa kênh: ${money(result.totalRevenue)}`,
        `Thuế GTGT: ${money(result.vat)} (${result.vatRate}%)`,
        `Thuế ${incomeName}: ${money(result.incomeTax)} (${result.incomeTaxRate}%)`,
        result.incomeTaxExemptionReason ? `Căn cứ miễn ${incomeName}: ${result.incomeTaxExemptionReason}` : null,
        `Tổng nghĩa vụ thuế phát sinh: ${money(result.totalTax)}`,
        `Đã được sàn khấu trừ / nộp thay: ${money(input.withheldVat + input.withheldIncomeTax)}`,
        `Số thuế còn phải nộp: ${money(result.remainingPayable)}`,
        `Số có thể bù trừ hoặc hoàn: ${money(result.potentialRefundOrOffset)}`,
        `Dòng tiền ròng sau phí sàn & thuế: ${money(result.netCashAfterTaxAndPlatformFees)}`,
        `Tỷ lệ thuế hiệu dụng: ${result.effectiveTaxRate.toFixed(2)}%`,
        `Phiên bản bộ quy tắc: ${result.ruleVersion}`,
      ].filter(Boolean).join("\n"),
    [incomeName, input, result]
  );

  const copy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `du-toan-thue-tmdt-${input.taxYear}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="space-y-5 lg:sticky lg:top-4 self-start">
      {/* 1. Hero Tax Output Card */}
      <section
        className={`relative overflow-hidden rounded-3xl border shadow-xl transition-all ${
          result.isExempt
            ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900"
            : result.remainingPayable > 0
            ? "border-slate-800 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
            : "border-cyan-500/40 bg-gradient-to-br from-cyan-950 via-slate-950 to-slate-900"
        }`}
      >
        {/* Ambient Glow */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-25 blur-3xl"
          style={{
            background: result.isExempt ? "#10b981" : result.remainingPayable > 0 ? "var(--brand-primary)" : "#06b6d4",
          }}
        />

        <div className="relative p-6 sm:p-7 text-white">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  {result.isExempt
                    ? "Trạng thái nghĩa vụ thuế"
                    : result.remainingPayable > 0
                    ? "Tổng thuế thực tế còn phải nộp"
                    : "Thuế đã nộp đủ / Bù trừ hoàn"}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  Năm {input.taxYear}
                </span>
              </div>

              {result.isExempt ? (
                <div className="mt-2">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-emerald-400">
                    0 ₫
                  </p>
                  <p className="mt-1.5 text-xs text-emerald-300 font-medium">
                    Doanh thu năm ≤ 1.000.000.000 ₫ (Miễn nộp thuế GTGT & TNCN).
                  </p>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-emerald-400">
                    {formatMoney(result.remainingPayable)}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400 font-medium">
                    Tổng thuế phát sinh:{" "}
                    <strong className="text-white font-mono">{formatMoney(result.totalTax)}</strong> · Đã khấu trừ:{" "}
                    <strong className="text-white font-mono">
                      {formatMoney(input.withheldVat + input.withheldIncomeTax)}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={download}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-bold text-white transition cursor-pointer"
                title="Tải báo cáo văn bản"
              >
                <Download size={13} /> Tải file
              </button>
              <button
                type="button"
                onClick={copy}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer active:scale-95"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied ? "Đã sao chép" : "Sao chép"}
              </button>
            </div>
          </div>

          {/* 4 Mini Core Overview Numbers */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tổng doanh thu</p>
              <p className="mt-1 font-black font-mono text-sm sm:text-base text-white">
                {money(result.totalRevenue)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Thuế GTGT ({result.vatRate}%)</p>
              <p className="mt-1 font-black font-mono text-sm sm:text-base text-slate-200">
                {money(result.vat)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Thuế {incomeName}</p>
              <p className="mt-1 font-black font-mono text-sm sm:text-base text-slate-200">
                {money(result.incomeTax)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Còn phải nộp</p>
              <p
                className={`mt-1 font-black font-mono text-sm sm:text-base ${
                  result.remainingPayable > 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {money(result.remainingPayable)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Four Financial Health Metrics (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-3">
        <Metric
          label="Thuế suất hiệu dụng"
          value={`${result.effectiveTaxRate.toFixed(2)}%`}
          tone="brand"
          subtext="Tỷ trọng thuế / doanh thu"
          icon={<Percent size={15} />}
        />
        <Metric
          label={`Trạng thái ${incomeName}`}
          value={result.incomeTaxExempt ? "Được miễn" : "Có phát sinh"}
          tone={result.incomeTaxExempt ? "green" : "slate"}
          subtext={result.incomeTaxExempt ? "Theo dữ liệu điều kiện đã nhập" : `Thuế suất ${result.incomeTaxRate.toFixed(2)}%`}
          icon={<TrendingDown size={15} />}
        />
        <Metric
          label="Dòng tiền ròng thực nhận"
          value={money(result.netCashAfterTaxAndPlatformFees)}
          tone="green"
          subtext="Sau trừ thuế & phí sàn"
          icon={<Wallet size={15} />}
        />
        <Metric
          label="Tỷ lệ tiền mặt giữ lại"
          value={`${result.netRate.toFixed(1)}%`}
          tone="slate"
          subtext="Hiệu suất thu về"
          icon={<TrendingUp size={15} />}
        />
      </div>

      {/* 3. Segmented Navigation for Deep Analytical Breakdown */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors p-5">
        <div className="flex items-center justify-between rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("breakdown")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === "breakdown"
                ? "bg-white dark:bg-slate-700 text-brand shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Scale size={14} /> Chi tiết tính thuế
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("withheld")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === "withheld"
                ? "bg-white dark:bg-slate-700 text-brand shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ReceiptText size={14} /> Đối chiếu khấu trừ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cashflow")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === "cashflow"
                ? "bg-white dark:bg-slate-700 text-brand shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CircleDollarSign size={14} /> Dòng tiền ròng
          </button>
        </div>

        {/* Tab 1: Tax Breakdown */}
        {activeTab === "breakdown" && (
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Hạch toán từng sắc thuế phát sinh
            </h3>
            <Row label={`Thuế Giá trị gia tăng (GTGT)`} value={money(result.vat)} hint={`${result.vatRate}% doanh thu`} />
            <Row
              label={`Thuế ${incomeName} theo công thức`}
              value={money(result.incomeTaxBeforeReduction)}
              hint={`Thuế suất ${result.incomeTaxRate}%`}
            />
            <Row label={`Thuế ${incomeName} dự toán`} value={money(result.incomeTax)} />
            <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-1.5">
              <Row label="Tổng nghĩa vụ thuế phát sinh" value={money(result.totalTax)} strong tone="rose" />
            </div>
            {result.incomeTaxExemptionReason && (
              <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-[11px] leading-relaxed text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                <strong>Căn cứ miễn {incomeName}:</strong> {result.incomeTaxExemptionReason}
                {isCompany && " Miễn TNDN không đồng nghĩa miễn GTGT."}
              </p>
            )}
            {!isCompany && result.effectivePersonalMethod === "revenue" && (
              <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-[11px] dark:bg-slate-800/60">
                <p className="font-black text-slate-700 dark:text-slate-200">Chi tiết theo nhóm hoạt động</p>
                {result.activityBreakdown.filter((row) => row.revenue > 0).map((row) => (
                  <div key={row.activity} className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                    <span>{row.label}<br/><span className="text-[10px] text-slate-400">GTGT {row.vatRate}% · TNCN {row.pitRate}%</span></span>
                    <span className="text-right font-mono">{money(row.revenue)}<br/><span className="text-[10px]">Thuế {money(row.vat + row.pit)}</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Withheld Reconciliation */}
        {activeTab === "withheld" && (
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Đối soát số đã khấu trừ & Số còn phải nộp
            </h3>
            <Row
              label="Thuế GTGT sàn đã khấu trừ"
              value={money(input.withheldVat)}
              hint={`Nghĩa vụ: ${money(result.vat)}`}
            />
            <Row label="Thuế GTGT còn phải nộp bổ sung" value={money(result.remainingVat)} />
            <Row
              label={`Thuế ${incomeName} sàn đã khấu trừ`}
              value={money(input.withheldIncomeTax)}
              hint={`Nghĩa vụ: ${money(result.incomeTax)}`}
            />
            <Row label={`Thuế ${incomeName} còn phải nộp bổ sung`} value={money(result.remainingIncomeTax)} />
            <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-1.5">
              <Row
                label="Tổng số thuế còn phải nộp vào NSNN"
                value={money(result.remainingPayable)}
                strong
                tone={result.remainingPayable > 0 ? "rose" : "green"}
              />
            </div>
            {result.potentialRefundOrOffset > 0 && (
              <Row
                label="Số thuế nộp thừa có thể bù trừ / hoàn"
                value={money(result.potentialRefundOrOffset)}
                strong
                tone="green"
              />
            )}
          </div>
        )}

        {/* Tab 3: Net Cashflow */}
        {activeTab === "cashflow" && (
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Dòng tiền thực tế sau sàn & thuế
            </h3>
            <Row label="Tổng doanh thu bán hàng" value={money(result.totalRevenue)} />
            <Row label="Tổng phí sàn TMĐT (Ước tính)" value={`-${money(input.platformFees)}`} hint="Shopee, TikTok,..." />
            <Row label="Tổng nghĩa vụ thuế phải nộp" value={`-${money(result.totalTax)}`} tone="rose" />
            <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-1.5">
              <Row
                label="Dòng tiền ròng thực tế thu về"
                value={money(result.netCashAfterTaxAndPlatformFees)}
                strong
                tone="green"
              />
            </div>
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
              <span>Tỷ suất tiền mặt thực giữ lại:</span>
              <strong className="font-mono text-sm">{result.netRate.toFixed(1)}%</strong>
            </div>
          </div>
        )}
      </section>

      {result.validationErrors.map((error) => (
        <div key={error} className="flex gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-300">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" /><span>{error} Kết quả thuế đang được để bằng 0 để tránh sử dụng sai.</span>
        </div>
      ))}

      {result.requiresProfessionalReview && result.validationErrors.length === 0 && (
        <div className="flex gap-2.5 rounded-2xl border border-blue-300 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-900 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-300">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          <span>Kết quả có điều kiện hoặc cách phân bổ cần đối chiếu với hồ sơ thực tế và người phụ trách thuế trước khi kê khai.</span>
        </div>
      )}

      {/* 4. Warning Messages */}
      {result.warnings.map((warning) => (
        <div
          key={warning}
          className="flex gap-2.5 rounded-2xl border border-amber-300 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-xs font-semibold text-amber-900 dark:text-amber-300"
        >
          <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <span>{warning}</span>
        </div>
      ))}

      {/* 5. Official Legal References */}
      <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-2">
          <ShieldCheck size={16} className="text-brand" /> Căn cứ pháp lý & Cổng văn bản chính phủ
        </div>
        <p className="leading-relaxed mb-3">
          Phiên bản quy tắc <strong>{result.ruleVersion}</strong>. Công cụ hỗ trợ dự toán cho kỳ 2026; quyết toán thực tế căn cứ hồ sơ, hóa đơn và xác nhận của người phụ trách thuế.
        </p>
        <div className="flex flex-wrap gap-2">
          {result.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-brand hover:border-brand transition">
              {source.label} <ExternalLink size={10} />
            </a>
          ))}
        </div>
      </section>
    </aside>
  );
}
