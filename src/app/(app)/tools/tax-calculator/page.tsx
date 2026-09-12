"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  FileSpreadsheet,
  Globe,
  Info,
  Layers,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Store,
  User,
  Zap,
} from "lucide-react";
import { TaxCalculatorOutput } from "@/components/tools/TaxCalculatorOutput";
import { ACTIVITY_RATES, calculateEcommerceTax, TAX_EXEMPT_REVENUE_2026 } from "@/lib/tax-calculator/engine";
import type { TaxCalculatorInput, TaxPayerType } from "@/lib/tax-calculator/types";

const moneyFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const parseMoney = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;

const initialInput: TaxCalculatorInput = {
  taxYear: 2026,
  payerType: "household",
  activity: "goods",
  personalIncomeMethod: "revenue",
  shopeeRevenue: 500_000_000,
  tiktokRevenue: 500_000_000,
  otherPlatformRevenue: 0,
  directRevenue: 0,
  platformFees: 140_000_000,
  deductibleCosts: 700_000_000,
  otherTaxableIncome: 0,
  carriedLoss: 0,
  withheldVat: 0,
  withheldIncomeTax: 0,
  companyPreviousYearRevenue: 0,
  companyVatRate: 10,
  deductibleInputVat: 0,
  applyIncomeTaxReduction: true,
};

function MoneyInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className="relative flex items-center">
      <input
        inputMode="numeric"
        placeholder={placeholder}
        value={value ? moneyFormat.format(value) : ""}
        onChange={(event) => onChange(parseMoney(event.target.value))}
        className={`w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 pr-8 text-right font-mono text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:focus:border-brand ${className}`}
      />
      <span className="pointer-events-none absolute right-3 text-xs font-bold text-slate-400 dark:text-slate-500">
        ₫
      </span>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
        <span>{label}</span>
        {hint && <span className="font-normal text-slate-400 dark:text-slate-500 text-[11px]">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Section({
  title,
  icon,
  children,
  badge,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <h2 className="flex items-center gap-2 text-sm sm:text-base font-black text-slate-900 dark:text-white">
          {icon}
          {title}
        </h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

export default function TaxCalculator() {
  const [input, setInput] = useState<TaxCalculatorInput>(initialInput);

  const result = useMemo(() => calculateEcommerceTax(input), [input]);
  const update = <K extends keyof TaxCalculatorInput>(key: K, value: TaxCalculatorInput[K]) =>
    setInput((current) => ({ ...current, [key]: value }));

  const isPersonal = input.payerType !== "company";

  const changePayer = (payerType: TaxPayerType) => {
    setInput((current) => ({
      ...current,
      payerType,
      personalIncomeMethod:
        payerType !== "company" && result.totalRevenue > 3_000_000_000 ? "profit" : current.personalIncomeMethod,
    }));
  };

  const resetAll = () => {
    setInput({
      ...initialInput,
      shopeeRevenue: 0,
      tiktokRevenue: 0,
      otherPlatformRevenue: 0,
      directRevenue: 0,
      platformFees: 0,
      deductibleCosts: 0,
      withheldVat: 0,
      withheldIncomeTax: 0,
    });
  };

  return (
    <div className="mx-auto max-w-7xl pb-16 px-2 sm:px-4">
      {/* 1. Header Navigation & Title */}
      <header className="mb-6 space-y-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand transition-colors mb-2"
            >
              <ArrowLeft size={14} /> Kho công cụ AI
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-brand-light p-2.5 text-brand shadow-xs">
                <Calculator size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    Tính Thuế TMĐT 2026 (Nghị Định Mới)
                  </h1>
                  <span className="rounded-full bg-brand-light/80 border border-brand/30 px-2.5 py-0.5 text-[10px] font-black text-brand uppercase tracking-wider">
                    LUẬT 2026
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Dự toán chuẩn xác nghĩa vụ thuế GTGT và TNCN/TNDN cho người bán hàng Shopee, TikTok Shop và đa kênh.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setInput(initialInput)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
            >
              <Zap size={14} className="text-amber-500" /> Dữ liệu mẫu (1 Tỷ)
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer shadow-xs"
              title="Đặt lại tất cả số tiền về 0"
            >
              <RotateCcw size={14} /> Xóa trắng
            </button>
          </div>
        </div>
      </header>

      {/* 2. Balanced 2-Column Core Architecture (5 cols Left - 7 cols Right) */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Form Setup (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          {/* Section 1: Payer Type & Period */}
          <Section
            title="Đối tượng & Loại hình người nộp thuế"
            icon={<Building2 size={18} className="text-brand" />}
            badge={
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                Năm {input.taxYear}
              </span>
            }
          >
            {/* Interactive 3-Button Segmented Selector */}
            <div>
              <span className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Mô hình kinh doanh của bạn:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "household", label: "Hộ kinh doanh", icon: <Store size={14} />, hint: "Phổ biến nhất sàn" },
                  { id: "individual", label: "Cá nhân KD", icon: <User size={14} />, hint: "Kinh doanh tự do" },
                  { id: "company", label: "Doanh nghiệp", icon: <Building2 size={14} />, hint: "Công ty / DN" },
                ].map((item) => {
                  const isActive = input.payerType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => changePayer(item.id as TaxPayerType)}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 sm:p-3 text-center transition-all cursor-pointer ${isActive
                        ? "border-brand bg-brand-light/30 dark:bg-brand-light/15 text-brand shadow-xs ring-2 ring-brand/20 font-black"
                        : "border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                    >
                      <div className="mb-1">{item.icon}</div>
                      <span className="text-xs font-bold">{item.label}</span>
                      <span className="mt-0.5 text-[10px] opacity-70 hidden sm:inline">{item.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 pt-1 sm:grid-cols-2">
              <Field label="Kỳ tính thuế">
                <select
                  value={input.taxYear}
                  onChange={(event) => update("taxYear", Number(event.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  <option value={2026} className="dark:bg-slate-900">Kỳ tính thuế 2026</option>
                  <option value={2027} className="dark:bg-slate-900">Kỳ tính thuế 2027</option>
                  <option value={2028} className="dark:bg-slate-900">Kỳ tính thuế 2028 trở đi</option>
                </select>
              </Field>

              {isPersonal ? (
                <Field label="Nhóm ngành hoạt động">
                  <select
                    value={input.activity}
                    onChange={(event) => update("activity", event.target.value as TaxCalculatorInput["activity"])}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    {Object.entries(ACTIVITY_RATES).map(([id, item]) => (
                      <option key={id} value={id} className="dark:bg-slate-900">
                        {item.label} ({item.vat}% GTGT + {item.pitRevenue}% TNCN)
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field label="Thuế suất GTGT đầu ra">
                  <select
                    value={input.companyVatRate}
                    onChange={(event) => update("companyVatRate", Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value={0} className="dark:bg-slate-900">0% (Xuất khẩu)</option>
                    <option value={5} className="dark:bg-slate-900">5% (Thiết yếu)</option>
                    <option value={8} className="dark:bg-slate-900">8% (Giảm thuế)</option>
                    <option value={10} className="dark:bg-slate-900">10% (Chuẩn thông thường)</option>
                  </select>
                </Field>
              )}
            </div>

            {isPersonal && (
              <div className="rounded-2xl border border-brand/20 bg-brand-light/30 dark:bg-brand-light/10 p-3.5">
                <Field
                  label="Phương pháp tính thuế TNCN"
                  hint={
                    result.totalRevenue > 3_000_000_000
                      ? "Trên 3 tỷ: Bắt buộc theo thu nhập ròng"
                      : "Dưới 3 tỷ: Được chọn khoán hoặc thu nhập"
                  }
                >
                  <select
                    value={result.effectivePersonalMethod}
                    onChange={(event) =>
                      update("personalIncomeMethod", event.target.value as TaxCalculatorInput["personalIncomeMethod"])
                    }
                    disabled={result.totalRevenue > 3_000_000_000}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand disabled:opacity-60"
                  >
                    <option value="revenue" className="dark:bg-slate-900">
                      1. Theo tỷ lệ % doanh thu (Thuế tính trên phần vượt ngưỡng 1 tỷ)
                    </option>
                    <option value="profit" className="dark:bg-slate-900">
                      2. Theo thu nhập chịu thuế = Doanh thu − Chi phí hợp lệ
                    </option>
                  </select>
                </Field>
              </div>
            )}
          </Section>

          {/* Section 2: Multichannel Revenue */}
          <Section
            title="Doanh thu đa kênh trong năm "
            icon={<ShoppingCart size={18} className="text-brand" />}
            badge={
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-0.5 text-xs font-mono font-black text-emerald-700 dark:text-emerald-300">
                Tổng: {moneyFormat.format(result.totalRevenue)} ₫
              </span>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Doanh thu Shopee" hint="">
                <MoneyInput
                  value={input.shopeeRevenue}
                  onChange={(value) => update("shopeeRevenue", value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Doanh thu TikTok Shop" hint="">
                <MoneyInput
                  value={input.tiktokRevenue}
                  onChange={(value) => update("tiktokRevenue", value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Sàn TMĐT khác" hint="Lazada, Tiki, v.v.">
                <MoneyInput
                  value={input.otherPlatformRevenue}
                  onChange={(value) => update("otherPlatformRevenue", value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Kênh tự chốt" hint="Facebook, Web, Offline">
                <MoneyInput
                  value={input.directRevenue}
                  onChange={(value) => update("directRevenue", value)}
                  placeholder="0"
                />
              </Field>
            </div>

            <div className="flex items-start gap-2 rounded-2xl bg-brand-light/30 dark:bg-brand-light/10 border border-brand/20 p-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <Info size={16} className="shrink-0 text-brand mt-0.5" />
              <span>
                <strong>Căn cứ Luật Thuế 2026:</strong> Ngưỡng 1 tỷ đồng/năm xét trên <strong>tổng doanh thu toàn bộ hoạt động kinh doanh</strong>, không xét riêng từng sàn hay từng tài khoản.
              </span>
            </div>
          </Section>

          {/* Section 3: Costs, Deductions & Fees */}
          <Section
            title="Chi phí có hóa đơn chứng từ & Dòng tiền"
            icon={<ReceiptText size={18} className="text-amber-500" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tổng phí sàn TMĐT" hint="">
                <MoneyInput
                  value={input.platformFees}
                  onChange={(value) => update("platformFees", value)}
                  placeholder="0"
                />
              </Field>

              {(!isPersonal || result.effectivePersonalMethod === "profit") && (
                <>
                  <Field label="Chi phí hợp lệ có hóa đơn" hint="">
                    <MoneyInput
                      value={input.deductibleCosts}
                      onChange={(value) => update("deductibleCosts", value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Thu nhập chịu thuế khác" hint="">
                    <MoneyInput
                      value={input.otherTaxableIncome}
                      onChange={(value) => update("otherTaxableIncome", value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Lỗ được kết chuyển kỳ trước" hint="">
                    <MoneyInput
                      value={input.carriedLoss}
                      onChange={(value) => update("carriedLoss", value)}
                      placeholder="0"
                    />
                  </Field>
                </>
              )}

              {!isPersonal && (
                <>
                  <Field label="Doanh thu năm trước" hint="">
                    <MoneyInput
                      value={input.companyPreviousYearRevenue}
                      onChange={(value) => update("companyPreviousYearRevenue", value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="GTGT đầu vào được khấu trừ" hint="">
                    <MoneyInput
                      value={input.deductibleInputVat}
                      onChange={(value) => update("deductibleInputVat", value)}
                      placeholder="0"
                    />
                  </Field>
                </>
              )}
            </div>
          </Section>

          {/* Section 4: Withheld Tax & 30% Reduction */}
          <Section
            title="Thuế sàn đã khấu trừ & Ưu đãi giảm thuế"
            icon={<ShieldCheck size={18} className="text-emerald-500" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Thuế GTGT sàn đã khấu trừ" hint="">
                <MoneyInput
                  value={input.withheldVat}
                  onChange={(value) => update("withheldVat", value)}
                  placeholder="0"
                />
              </Field>
              <Field
                label={isPersonal ? "Thuế TNCN sàn đã khấu trừ" : "Thuế TNDN đã tạm nộp"}
                hint=""
              >
                <MoneyInput
                  value={input.withheldIncomeTax}
                  onChange={(value) => update("withheldIncomeTax", value)}
                  placeholder="0"
                />
              </Field>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 transition hover:border-emerald-300">
              <input
                type="checkbox"
                checked={input.applyIncomeTaxReduction}
                onChange={(event) => update("applyIncomeTaxReduction", event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-emerald-400 accent-emerald-600"
              />
              <span className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed">
                <strong className="block font-black">
                  Áp dụng giảm 30% thuế thu nhập ({isPersonal ? "TNCN" : "TNDN"}) nếu đủ điều kiện
                </strong>
                Chính sách hỗ trợ theo nghị định cho kỳ 2026–2027 đối với cơ sở kinh doanh có tổng doanh thu năm không quá 10 tỷ đồng.
              </span>
            </label>
          </Section>
        </div>

        {/* Right Column: Tax Output & Financial Dashboard (7 cols) */}
        <div className="lg:col-span-7">
          <TaxCalculatorOutput input={input} result={result} />
        </div>
      </div>
    </div>
  );
}
