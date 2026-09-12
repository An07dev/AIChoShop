"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Calculator, Info, ReceiptText, RotateCcw, ShoppingCart } from "lucide-react";
import { TaxCalculatorOutput } from "@/components/tools/TaxCalculatorOutput";
import { ACTIVITY_RATES, calculateEcommerceTax } from "@/lib/tax-calculator/engine";
import type { TaxCalculatorInput, TaxPayerType } from "@/lib/tax-calculator/types";

const moneyFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const parseMoney = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;

const initialInput: TaxCalculatorInput = {
  taxYear: 2026, payerType: "household", activity: "goods", personalIncomeMethod: "revenue",
  shopeeRevenue: 500_000_000, tiktokRevenue: 500_000_000, otherPlatformRevenue: 0, directRevenue: 0,
  platformFees: 140_000_000, deductibleCosts: 700_000_000, otherTaxableIncome: 0, carriedLoss: 0,
  withheldVat: 0, withheldIncomeTax: 0, companyPreviousYearRevenue: 0,
  companyVatRate: 10, deductibleInputVat: 0, applyIncomeTaxReduction: true,
};

function MoneyInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <input inputMode="numeric" value={value ? moneyFormat.format(value) : ""} onChange={(event) => onChange(parseMoney(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm font-bold outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15" />;
}
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="flex h-full flex-col justify-end"><span className="mb-1.5 flex items-start justify-between gap-2 text-xs font-bold text-slate-700">{label}{hint && <small className="font-normal leading-snug text-slate-400">{hint}</small>}</span>{children}</label>;
}
function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-900">{icon}{title}</h2>{children}</section>;
}

export default function TaxCalculator() {
  const [input, setInput] = useState<TaxCalculatorInput>(initialInput);
  const result = useMemo(() => calculateEcommerceTax(input), [input]);
  const update = <K extends keyof TaxCalculatorInput>(key: K, value: TaxCalculatorInput[K]) => setInput((current) => ({ ...current, [key]: value }));
  const isPersonal = input.payerType !== "company";
  const changePayer = (payerType: TaxPayerType) => setInput((current) => ({ ...current, payerType,
    personalIncomeMethod: payerType !== "company" && result.totalRevenue > 3_000_000_000 ? "profit" : current.personalIncomeMethod }));

  return <div className="mx-auto max-w-7xl pb-12">
    <header className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div><Link href="/tools" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-rose-600"><ArrowLeft size={16} /> Quay lại kho công cụ</Link><div className="flex items-center gap-3"><div className="rounded-xl bg-rose-100 p-2.5 text-rose-600"><Calculator size={23} /></div><div><h1 className="text-2xl font-black text-slate-950">Tính Thuế TMĐT 2026</h1><p className="mt-1 text-sm text-slate-500">Shopee, TikTok và doanh thu đa kênh theo quy định hiện hành.</p></div></div></div>
      <button onClick={() => setInput(initialInput)} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"><RotateCcw size={14} /> Dữ liệu mẫu</button>
    </header>

    <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_.95fr]">
      <div className="space-y-4">
        <Section title="Đối tượng và kỳ tính thuế" icon={<Building2 size={17} className="text-rose-500" />}><div className="grid gap-3 sm:grid-cols-2">
          <Field label="Kỳ tính thuế"><select value={input.taxYear} onChange={(event) => update("taxYear", Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold"><option value={2026}>Năm 2026</option><option value={2027}>Năm 2027</option><option value={2028}>Năm 2028 trở đi</option></select></Field>
          <Field label="Loại người nộp thuế"><select value={input.payerType} onChange={(event) => changePayer(event.target.value as TaxPayerType)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold"><option value="household">Hộ kinh doanh</option><option value="individual">Cá nhân kinh doanh</option><option value="company">Doanh nghiệp / Công ty</option></select></Field>
          {isPersonal && <><Field label="Nhóm hoạt động"><select value={input.activity} onChange={(event) => update("activity", event.target.value as TaxCalculatorInput["activity"])} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold">{Object.entries(ACTIVITY_RATES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></Field><Field label="Phương pháp tính TNCN" hint={result.totalRevenue > 3_000_000_000 ? "Trên 3 tỷ: bắt buộc theo thu nhập" : "Được lựa chọn"}><select value={result.effectivePersonalMethod} onChange={(event) => update("personalIncomeMethod", event.target.value as TaxCalculatorInput["personalIncomeMethod"])} disabled={result.totalRevenue > 3_000_000_000} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold disabled:opacity-60"><option value="revenue">Theo phần doanh thu vượt ngưỡng</option><option value="profit">Theo thu nhập = doanh thu − chi phí</option></select></Field></>}
        </div></Section>

        <Section title="Doanh thu tất cả kênh trong năm" icon={<ShoppingCart size={17} className="text-blue-600" />}><div className="grid gap-3 sm:grid-cols-2"><Field label="Doanh thu Shopee"><MoneyInput value={input.shopeeRevenue} onChange={(value) => update("shopeeRevenue", value)} /></Field><Field label="Doanh thu TikTok"><MoneyInput value={input.tiktokRevenue} onChange={(value) => update("tiktokRevenue", value)} /></Field><Field label="Sàn TMĐT khác"><MoneyInput value={input.otherPlatformRevenue} onChange={(value) => update("otherPlatformRevenue", value)} /></Field><Field label="Facebook, website, cửa hàng"><MoneyInput value={input.directRevenue} onChange={(value) => update("directRevenue", value)} /></Field></div><p className="mt-3 flex gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-900"><Info size={15} className="shrink-0" />Ngưỡng thuế xét tổng doanh thu của toàn bộ hoạt động kinh doanh, không xét riêng từng sàn.</p></Section>

        <Section title="Chi phí và cơ sở tính thu nhập" icon={<ReceiptText size={17} className="text-amber-600" />}><div className="grid gap-3 sm:grid-cols-2"><Field label="Tổng phí sàn" hint="dùng phân tích dòng tiền"><MoneyInput value={input.platformFees} onChange={(value) => update("platformFees", value)} /></Field>{(!isPersonal || result.effectivePersonalMethod === "profit") && <><Field label="Chi phí hợp lệ có chứng từ" hint="gồm giá vốn, phí sàn, Ads..."><MoneyInput value={input.deductibleCosts} onChange={(value) => update("deductibleCosts", value)} /></Field><Field label="Thu nhập chịu thuế khác"><MoneyInput value={input.otherTaxableIncome} onChange={(value) => update("otherTaxableIncome", value)} /></Field><Field label="Lỗ được chuyển kỳ trước"><MoneyInput value={input.carriedLoss} onChange={(value) => update("carriedLoss", value)} /></Field></>}
          {!isPersonal && <><Field label="Doanh thu năm trước" hint="xác định thuế suất TNDN"><MoneyInput value={input.companyPreviousYearRevenue} onChange={(value) => update("companyPreviousYearRevenue", value)} /></Field><Field label="Thuế suất GTGT đầu ra"><select value={input.companyVatRate} onChange={(event) => update("companyVatRate", Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold"><option value={0}>0%</option><option value={5}>5%</option><option value={8}>8%</option><option value={10}>10%</option></select></Field><Field label="GTGT đầu vào được khấu trừ"><MoneyInput value={input.deductibleInputVat} onChange={(value) => update("deductibleInputVat", value)} /></Field></>}
        </div></Section>

        <Section title="Thuế sàn đã khấu trừ, nộp thay" icon={<ReceiptText size={17} className="text-emerald-600" />}><div className="grid gap-3 sm:grid-cols-2"><Field label="GTGT đã khấu trừ"><MoneyInput value={input.withheldVat} onChange={(value) => update("withheldVat", value)} /></Field><Field label={isPersonal ? "TNCN đã khấu trừ" : "TNDN đã tạm nộp"}><MoneyInput value={input.withheldIncomeTax} onChange={(value) => update("withheldIncomeTax", value)} /></Field></div><label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><input type="checkbox" checked={input.applyIncomeTaxReduction} onChange={(event) => update("applyIncomeTaxReduction", event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" /><span className="text-xs text-emerald-900"><strong className="block">Áp dụng giảm 30% {isPersonal ? "TNCN" : "TNDN"} nếu đủ điều kiện</strong>Chỉ áp dụng kỳ 2026–2027 và doanh thu năm không quá 10 tỷ đồng.</span></label></Section>
      </div>
      <TaxCalculatorOutput input={input} result={result} />
    </div>
  </div>;
}
