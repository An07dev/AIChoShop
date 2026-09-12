"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Calculator, Check, ChevronDown, ChevronUp, CircleDollarSign, Copy, ExternalLink, Info, PackageCheck, ReceiptText, RotateCcw, Save, ShieldCheck, Sparkles, Table2, TrendingDown, Truck } from "lucide-react";
import { useToolGate } from "@/hooks/useToolGate";
import { calculatePricing } from "@/lib/pricing/engine";
import { detectCategory, FEE_DATA_VERSION, getAvailableCategories, getCategoryLabel, getDefaultCategoryId, getFeeProfile, getOfficialCategory, PROGRAMS, SOURCES } from "@/lib/pricing/registry";
import { readPricingHistory, writePricingHistory, type PricingCalculationSnapshot } from "@/lib/pricing/storage";
import type { CostMode, ExternalSalesChannel, FeeOverrideRecord, OfficialFeeCategory, Platform, PricingInput, ShopType, TaxMode } from "@/lib/pricing/types";
import BulkPricing from "./BulkPricing";
import { CalculationSummary, CostVisuals, EmptyCalculation, SavedCalculations } from "./PricingExtras";

const initialInput: PricingInput = {
  platform: "shopee", externalChannel: "facebook", shopType: "marketplace", categoryId: "shopee-416", quantity: 1,
  costPerUnit: 50_000, packagingCost: 5_000, handlingCost: 0, overheadCost: 0,
  sellerShippingCost: 0, buyerShippingFee: 0, platformDiscount: 0, sellerDiscountRate: 0,
  affiliateRate: 0, marketingMode: "percent", marketingValue: 10,
  commissionOverride: null, transactionOverride: null, fixedFeeOverride: null, enabledProgramIds: [],
  taxMode: "household_revenue", taxableRevenueShare: 100, manualRevenueTaxRate: 1.5, profitTaxRate: 20,
  cancellationRate: 2, cancellationCost: 0, deliveryFailureRate: 4, returnRate: 12,
  returnShippingCost: 25_000, nonRefundableReturnFee: 0, returnedInventoryRecoveryRate: 95, damageRate: 5,
};

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const formatMoney = (value: number) => currency.format(Math.round(value));
const parseMoney = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;
const platformNames: Record<Platform, string> = { shopee: "Shopee", tiktok: "TikTok Shop", external: "Đơn ngoài" };
const externalChannelNames: Record<ExternalSalesChannel, string> = { facebook: "Facebook", website: "Website", youtube: "YouTube", other: "Kênh khác" };

function MoneyInput({ value, onChange, className = "" }: { value: number; onChange: (value: number) => void; className?: string }) {
  return <input inputMode="numeric" value={value ? new Intl.NumberFormat("vi-VN").format(value) : ""} onChange={(e) => onChange(parseMoney(e.target.value))} className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 ${className}`} />;
}

function NumberInput({ value, onChange, suffix = "%", min = 0, max, step = 0.5 }: { value: number; onChange: (value: number) => void; suffix?: string; min?: number; max?: number; step?: number }) {
  return <div className="relative"><input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15" />{suffix && <span className="absolute right-3 top-2 text-sm text-slate-400">{suffix}</span>}</div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold text-slate-700">{label}{hint && <span className="font-normal text-slate-400">{hint}</span>}</span>{children}</label>;
}

function CategorySelector({ platform, shopType, categoryId, onChange }: {
  platform: Platform; shopType: ShopType; categoryId: string; onChange: (id: string) => void;
}) {
  const categories = useMemo(() => getAvailableCategories(platform, shopType), [platform, shopType]);
  const selected = categories.find((category) => category.id === categoryId) ?? categories[0];
  const level1Values = Array.from(new Set(categories.map((category) => category.level1)));
  const level2Categories = categories.filter((category) => category.level1 === selected.level1);
  const level2Values = Array.from(new Set(level2Categories.map((category) => category.level2)));
  const level3Categories = level2Categories.filter((category) => category.level2 === selected.level2);
  const choose = (matches: (category: OfficialFeeCategory) => boolean) => {
    const category = categories.find(matches);
    if (category) onChange(category.id);
  };
  const inputClass = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500";
  return <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
    <div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wide text-blue-800">Ngành chính thức của sàn</span><span className="rounded-full bg-white px-2 py-1 text-xs font-black text-blue-700">{shopType === "mall" ? selected.mallRate : selected.marketplaceRate}%</span></div>
    <Field label="Ngành cấp 1"><select aria-label="Ngành cấp 1" value={selected.level1} onChange={(event) => choose((category) => category.level1 === event.target.value)} className={inputClass}>{level1Values.map((value) => <option key={value}>{value}</option>)}</select></Field>
    <Field label="Ngành cấp 2"><select aria-label="Ngành cấp 2" value={selected.level2} onChange={(event) => choose((category) => category.level1 === selected.level1 && category.level2 === event.target.value)} className={inputClass}>{level2Values.map((value) => <option key={value}>{value}</option>)}</select></Field>
    <Field label="Ngành cấp 3"><select aria-label="Ngành cấp 3" value={selected.id} onChange={(event) => onChange(event.target.value)} className={inputClass}>{level3Categories.map((category) => <option key={category.id} value={category.id}>{category.level3} — {shopType === "mall" ? category.mallRate : category.marketplaceRate}%</option>)}</select></Field>
  </div>;
}

function Metric({ label, value, tone = "slate", subtext }: { label: string; value: string; tone?: "slate" | "blue" | "green" | "red"; subtext?: string }) {
  const tones = { slate: "border-slate-200 bg-white text-slate-900", blue: "border-blue-200 bg-blue-50 text-blue-800", green: "border-emerald-200 bg-emerald-50 text-emerald-800", red: "border-rose-200 bg-rose-50 text-rose-800" };
  return <div className={`rounded-xl border p-4 ${tones[tone]}`}><p className="text-[11px] font-bold uppercase tracking-wide opacity-65">{label}</p><p className="mt-1 text-xl font-black font-mono">{value}</p>{subtext && <p className="mt-1 text-[11px] opacity-70">{subtext}</p>}</div>;
}

export default function PricingCalculatorClient({ feeOverrides }: { feeOverrides: FeeOverrideRecord[] }) {
  const { checkAccess, GateModals } = useToolGate();
  const [workspaceMode, setWorkspaceMode] = useState<"single" | "bulk">("single");
  const [mode, setMode] = useState<"target" | "audit">("target");
  const [advanced, setAdvanced] = useState(false);
  const [productName, setProductName] = useState("");
  const [input, setInput] = useState<PricingInput>(initialInput);
  const [auditPrice, setAuditPrice] = useState(150_000);
  const [targetMode, setTargetMode] = useState<"margin" | "fixed">("margin");
  const [targetValue, setTargetValue] = useState(20);
  const [roundingStep, setRoundingStep] = useState(1_000);
  const [copied, setCopied] = useState(false);
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [savedHistory, setSavedHistory] = useState<PricingCalculationSnapshot[]>([]);
  const [saveNotice, setSaveNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productNameError, setProductNameError] = useState("");
  const productNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { checkAccess("pricing-calculator", false); }, [checkAccess]);
  useEffect(() => {
    // localStorage chỉ tồn tại sau khi component đã gắn vào trình duyệt.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedHistory(readPricingHistory(window.localStorage));
  }, []);
  const update = <K extends keyof PricingInput>(key: K, value: PricingInput[K]) => setInput((current) => ({ ...current, [key]: value }));
  const availableCategories = getAvailableCategories(input.platform, input.shopType);
  const selectedCategory = availableCategories.find((category) => category.id === input.categoryId)
    ?? availableCategories[0];
  const baseFeeProfile = getFeeProfile(input.platform, input.shopType, input.categoryId);
  const adminOverride = feeOverrides.find((item) => item.platform === input.platform && item.shopType === input.shopType && item.categoryId === input.categoryId);
  const feeProfile = {
    ...baseFeeProfile,
    commissionRate: adminOverride?.commissionRate ?? baseFeeProfile.commissionRate,
    transactionRate: adminOverride?.transactionRate ?? baseFeeProfile.transactionRate,
    orderProcessingFee: adminOverride?.orderProcessingFee ?? baseFeeProfile.orderProcessingFee,
    sourceName: adminOverride?.sourceName ?? baseFeeProfile.sourceName,
    sourceUrl: adminOverride?.sourceUrl ?? baseFeeProfile.sourceUrl,
    note: adminOverride?.note ?? baseFeeProfile.note,
  };
  const calculationInput = useMemo(() => ({ ...input,
    commissionOverride: input.commissionOverride ?? adminOverride?.commissionRate ?? null,
    transactionOverride: input.transactionOverride ?? adminOverride?.transactionRate ?? null,
    fixedFeeOverride: input.fixedFeeOverride ?? adminOverride?.orderProcessingFee ?? null,
  }), [adminOverride, input]);
  const result = useMemo(() => calculatePricing(calculationInput, mode, auditPrice, { mode: targetMode, value: targetValue, roundingStep }), [auditPrice, calculationInput, mode, roundingStep, targetMode, targetValue]);
  const evaluation = result.evaluation;
  const isLoss = evaluation.expectedProfitPerOrder < 0;

  const applyCategory = (categoryId: string) => {
    const category = getOfficialCategory(categoryId);
    if (!category) return;
    setInput((current) => ({ ...current, categoryId, commissionOverride: null }));
    setSuggestedCategoryId(null);
  };
  const changePlatform = (platform: Platform) => { setInput((current) => ({ ...current, platform,
    categoryId: getDefaultCategoryId(platform, current.shopType), commissionOverride: null,
    transactionOverride: null, fixedFeeOverride: null, enabledProgramIds: [] })); };
  const changeShopType = (shopType: ShopType) => { setInput((current) => ({ ...current, shopType,
    categoryId: getDefaultCategoryId(current.platform, shopType), commissionOverride: null,
    transactionOverride: null, fixedFeeOverride: null })); };
  const toggleProgram = (id: string) => setInput((current) => ({ ...current, enabledProgramIds: current.enabledProgramIds.includes(id) ? current.enabledProgramIds.filter((item) => item !== id) : [...current.enabledProgramIds, id] }));
  const handleName = (name: string) => { setProductName(name); setProductNameError(""); const found = detectCategory(name, input.platform, input.shopType); setSuggestedCategoryId(found && found.id !== input.categoryId ? found.id : null); };
  const reset = () => { setInput({ ...initialInput, platform: input.platform, externalChannel: input.externalChannel, categoryId: getDefaultCategoryId(input.platform, initialInput.shopType) }); setMode("target"); setProductName(""); setAuditPrice(150_000); setTargetMode("margin"); setTargetValue(20); setRoundingStep(1_000); setSuggestedCategoryId(null); setHasCalculated(false); setSaveNotice(""); setEditingId(null); setProductNameError(""); };
  const calculate = () => {
    if (!productName.trim()) {
      setProductNameError("Vui lòng nhập tên sản phẩm trước khi tính giá bán.");
      setHasCalculated(false);
      productNameRef.current?.focus();
      return;
    }
    setProductNameError("");
    setHasCalculated(true);
    setSaveNotice("");
  };
  const createSnapshot = (name = productName || "Sản phẩm chưa đặt tên"): PricingCalculationSnapshot => ({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(), productName: name, mode, input: calculationInput,
    auditPrice, targetMode, targetValue, roundingStep, result,
  });
  const persistHistory = (next: PricingCalculationSnapshot[]) => {
    setSavedHistory(next);
    writePricingHistory(window.localStorage, next);
  };
  const saveCurrent = () => {
    if (!productName.trim()) { setProductNameError("Vui lòng nhập tên sản phẩm trước khi lưu."); productNameRef.current?.focus(); return; }
    if (!hasCalculated) { setSaveNotice("Hãy nhấn Tính toán giá bán trước khi lưu."); return; }
    const snapshot = createSnapshot();
    const item = editingId ? { ...snapshot, id: editingId } : snapshot;
    persistHistory(editingId ? savedHistory.map((saved) => saved.id === editingId ? item : saved) : [item, ...savedHistory]);
    setSaveNotice(editingId ? `Đã cập nhật “${item.productName}”.` : `Đã lưu “${item.productName}” trên trình duyệt này.`);
  };
  const saveMany = (items: PricingCalculationSnapshot[]) => {
    persistHistory([...items, ...savedHistory]);
    setSaveNotice(`Đã lưu ${items.length} sản phẩm từ file CSV.`);
  };
  const openSaved = (item: PricingCalculationSnapshot) => {
    setWorkspaceMode("single"); setProductName(item.productName); setMode(item.mode); setInput(item.input);
    setAuditPrice(item.auditPrice); setTargetMode(item.targetMode); setTargetValue(item.targetValue);
    setRoundingStep(item.roundingStep); setSuggestedCategoryId(null); setHasCalculated(true);
    setEditingId(item.id);
    setSaveNotice(`Đã mở lại “${item.productName}”. Bạn có thể sửa, tính lại rồi nhấn Cập nhật.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const deleteSaved = (id: string) => { if (editingId === id) setEditingId(null); persistHistory(savedHistory.filter((item) => item.id !== id)); };
  const deleteAllSaved = () => {
    if (window.confirm("Xóa toàn bộ lịch sử định giá đã lưu trên trình duyệt này?")) { setEditingId(null); persistHistory([]); }
  };
  const copyResult = async () => {
    const fees = evaluation.fees.map((fee) => `- ${fee.name}: ${formatMoney(fee.amount)}`).join("\n");
    const channel = input.platform === "external" ? externalChannelNames[input.externalChannel] : platformNames[input.platform];
    const classification = input.platform === "external" ? `Kênh bán: ${channel}` : `Ngành: ${getCategoryLabel(selectedCategory)}`;
    await navigator.clipboard.writeText(`PHÂN TÍCH GIÁ BÁN ${channel.toUpperCase()}\nSản phẩm: ${productName || "Chưa đặt tên"}\n${classification}\nGiá niêm yết: ${formatMoney(evaluation.listPrice)}\nGiá hòa vốn: ${result.breakEvenPrice === null ? "Không khả thi" : formatMoney(result.breakEvenPrice)}\n${input.platform === "external" ? "Thực thu" : "Tiền sàn giải ngân"}: ${formatMoney(evaluation.payout)}\n${fees}\nLãi đơn thành công: ${formatMoney(evaluation.profitOnSuccess)}\nLãi kỳ vọng/đơn phát sinh: ${formatMoney(evaluation.expectedProfitPerOrder)}\nBiên kỳ vọng: ${evaluation.expectedMargin.toFixed(1)}%\nDữ liệu phí: ${FEE_DATA_VERSION}`);
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  };
  const suggestion = suggestedCategoryId ? getOfficialCategory(suggestedCategoryId) : undefined;

  return <div className="mx-auto max-w-7xl pb-12"><GateModals />
    <div className="mb-6">
      <Link href="/tools" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600"><ArrowLeft size={16} /> Quay lại kho công cụ</Link>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="flex flex-wrap items-center gap-2"><div className="rounded-xl bg-blue-100 p-2.5 text-blue-700"><Calculator size={25} /></div><h1 className="text-2xl font-black text-slate-950">Tính giá bán & lợi nhuận thực tế</h1><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800">DỮ LIỆU {FEE_DATA_VERSION}</span></div><p className="mt-2 text-sm text-slate-500">Tính riêng phí sàn, thuế, voucher và tổn thất từ đơn hủy, giao thất bại, trả hàng.</p></div>
        <div className="flex rounded-xl bg-slate-200/70 p-1"><button onClick={() => setMode("target")} className={`flex-1 rounded-lg px-4 py-2 text-xs font-bold ${mode === "target" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Tính giá mục tiêu</button><button onClick={() => setMode("audit")} className={`flex-1 rounded-lg px-4 py-2 text-xs font-bold ${mode === "audit" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600"}`}>Thẩm định giá bán</button></div>
      </div>
    </div>

    <div className="mb-6 flex w-fit rounded-xl bg-slate-200/70 p-1"><button onClick={() => setWorkspaceMode("single")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${workspaceMode === "single" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}><Calculator size={16} /> Định giá đơn lẻ</button><button onClick={() => setWorkspaceMode("bulk")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${workspaceMode === "bulk" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600"}`}><Table2 size={16} /> Định giá hàng loạt</button></div>

    {workspaceMode === "bulk" ? <><BulkPricing baseInput={input} feeOverrides={feeOverrides} onSaveAll={saveMany} />{saveNotice && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{saveNotice}</div>}<SavedCalculations history={savedHistory} onOpen={openSaved} onDelete={deleteSaved} onDeleteAll={deleteAllSaved} /></> : <><nav aria-label="Trang tính đơn lẻ theo kênh" className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-3">{(["shopee", "tiktok", "external"] as Platform[]).map((platform) => <button key={platform} onClick={() => changePlatform(platform)} className={`rounded-xl px-4 py-3 text-sm font-black transition ${input.platform === platform ? platform === "shopee" ? "bg-orange-500 text-white shadow-sm" : platform === "tiktok" ? "bg-emerald-600 text-white shadow-sm" : "bg-blue-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>Trang tính {platformNames[platform]}</button>)}</nav><div className="grid grid-cols-1 gap-6 lg:grid-cols-12"><div className="space-y-5 lg:col-span-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b bg-slate-50/70 px-5 py-4"><h2 className="flex items-center gap-2 font-bold"><PackageCheck size={18} className="text-blue-600" /> {input.platform === "external" ? "Sản phẩm và kênh bán" : "Sản phẩm và sàn"}</h2><button onClick={reset} className="flex items-center gap-1 text-xs font-semibold text-slate-500"><RotateCcw size={13} /> Đặt lại</button></div>
        <div className="space-y-4 p-5"><Field label="Tên sản phẩm" hint="bắt buộc"><input ref={productNameRef} value={productName} onChange={(e) => handleName(e.target.value)} aria-invalid={Boolean(productNameError)} aria-describedby={productNameError ? "product-name-error" : undefined} placeholder="Ví dụ: Áo polo nam" className={`w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 ${productNameError ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15" : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/15"}`} />{productNameError && <p id="product-name-error" className="mt-1.5 text-xs font-semibold text-rose-600">{productNameError}</p>}</Field>
          {suggestion && <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800"><span className="flex items-center gap-1.5"><Sparkles size={14} /> Gợi ý: <strong>{getCategoryLabel(suggestion)}</strong></span><button onClick={() => applyCategory(suggestion.id)} className="rounded-md bg-blue-600 px-2.5 py-1.5 font-bold text-white">Xác nhận</button></div>}
          {input.platform === "external" ? <><Field label="Kênh bán đơn ngoài"><select value={input.externalChannel} onChange={(e) => update("externalChannel", e.target.value as ExternalSalesChannel)} className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900"><option value="facebook">Facebook</option><option value="website">Website</option><option value="youtube">YouTube</option><option value="other">Kênh khác</option></select></Field><div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4"><p className="mb-3 text-xs font-black uppercase tracking-wide text-blue-800">Chi phí thu tiền và xử lý đơn</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><Field label="Phí thanh toán/cổng bán"><NumberInput value={input.commissionOverride ?? 0} onChange={(v) => update("commissionOverride", v)} max={100} /></Field><Field label="Phí COD/đối tác"><NumberInput value={input.transactionOverride ?? 0} onChange={(v) => update("transactionOverride", v)} max={100} /></Field><Field label="Phí xử lý mỗi đơn"><MoneyInput value={input.fixedFeeOverride ?? 0} onChange={(v) => update("fixedFeeOverride", v)} /></Field></div></div></> : <><div className="grid grid-cols-2 gap-3"><Field label="Sàn"><div className={`rounded-lg px-3 py-2 text-sm font-black text-white ${input.platform === "shopee" ? "bg-orange-500" : "bg-emerald-600"}`}>{platformNames[input.platform]}</div></Field><Field label="Loại shop"><select value={input.shopType} onChange={(e) => changeShopType(e.target.value as ShopType)} className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm font-bold"><option value="marketplace">Shop thường</option><option value="mall">Mall</option></select></Field></div><CategorySelector platform={input.platform} shopType={input.shopType} categoryId={selectedCategory.id} onChange={applyCategory} /></>}
          <div className="grid grid-cols-2 gap-3"><Field label="Giá vốn / sản phẩm"><MoneyInput value={input.costPerUnit} onChange={(v) => update("costPerUnit", v)} /></Field><Field label="Số lượng / đơn"><NumberInput value={input.quantity} onChange={(v) => update("quantity", Math.max(1, Math.floor(v)))} suffix="" min={1} step={1} /></Field><Field label="Đóng gói / đơn"><MoneyInput value={input.packagingCost} onChange={(v) => update("packagingCost", v)} /></Field><Field label="Ads"><div className="flex overflow-hidden rounded-lg border"><select value={input.marketingMode} onChange={(e) => update("marketingMode", e.target.value as CostMode)} className="w-24 border-r bg-slate-100 px-2 text-xs font-bold"><option value="percent">% GMV</option><option value="fixed">đ/đơn</option></select>{input.marketingMode === "fixed" ? <MoneyInput value={input.marketingValue} onChange={(v) => update("marketingValue", v)} className="rounded-none border-0" /> : <div className="flex-1"><NumberInput value={input.marketingValue} onChange={(v) => update("marketingValue", v)} max={100} /></div>}</div></Field></div>
          {mode === "target" ? <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><Field label="Lợi nhuận kỳ vọng mong muốn"><div className="flex overflow-hidden rounded-lg border border-blue-200 bg-white"><select value={targetMode} onChange={(e) => setTargetMode(e.target.value as "margin" | "fixed")} className="w-40 border-r bg-blue-100 px-2 text-xs font-bold text-blue-900"><option value="margin">% doanh thu thực</option><option value="fixed">Tiền / đơn phát sinh</option></select>{targetMode === "fixed" ? <MoneyInput value={targetValue} onChange={setTargetValue} className="rounded-none border-0 bg-white" /> : <div className="flex-1"><NumberInput value={targetValue} onChange={setTargetValue} max={95} /></div>}</div></Field></div> : <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><Field label="Giá niêm yết cần thẩm định"><MoneyInput value={auditPrice} onChange={setAuditPrice} className="border-emerald-300 bg-white text-base" /></Field></div>}
          <div className="grid grid-cols-[1fr_auto] gap-3"><button onClick={calculate} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/15"><Calculator size={17} /> Tính toán giá bán</button><button onClick={saveCurrent} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700"><Save size={17} /> {editingId ? "Cập nhật" : "Lưu"}</button></div>
          {saveNotice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">{saveNotice}</p>}
        </div></section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><button onClick={() => setAdvanced((v) => !v)} className="flex w-full items-center justify-between px-5 py-4 text-left"><span><strong className="flex items-center gap-2 text-sm"><ReceiptText size={17} className="text-violet-600" /> Chi phí và rủi ro chi tiết</strong><span className="mt-0.5 block text-xs text-slate-500">Voucher, Affiliate, thuế, vận chuyển và hoàn hàng</span></span>{advanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>{advanced && <AdvancedFields input={input} update={update} feeProfile={feeProfile} roundingStep={roundingStep} setRoundingStep={setRoundingStep} toggleProgram={toggleProgram} />}</section>
    </div>

    <div className="space-y-5 lg:col-span-7">{!hasCalculated ? <EmptyCalculation /> : <>{result.error && <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800"><AlertTriangle size={18} />{result.error}</div>}
      <section className={`overflow-hidden rounded-2xl border shadow-sm ${isLoss ? "border-rose-300 bg-rose-950" : "border-slate-800 bg-slate-950"}`}><div className="p-6 text-white"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">{mode === "target" ? "Giá niêm yết mục tiêu" : "Giá đang thẩm định"}</p><p className="mt-1 text-4xl font-black text-emerald-400 font-mono">{formatMoney(evaluation.listPrice)}</p><p className="mt-2 text-xs text-slate-400">Sau giảm giá của shop: {formatMoney(evaluation.productRevenue)}</p></div><button onClick={copyResult} className="flex h-fit items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold">{copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}{copied ? "Đã sao chép" : "Sao chép kết quả"}</button></div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-4"><Mini label={input.platform === "external" ? "Thực thu" : "Sàn giải ngân"} value={formatMoney(evaluation.payout)} /><Mini label="Lãi đơn thành công" value={formatMoney(evaluation.profitOnSuccess)} loss={evaluation.profitOnSuccess < 0} /><Mini label="Lãi kỳ vọng/đơn" value={formatMoney(evaluation.expectedProfitPerOrder)} loss={isLoss} /><Mini label="Biên kỳ vọng" value={`${evaluation.expectedMargin.toFixed(1)}%`} loss={isLoss} /></div></div></section>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Giá hòa vốn" value={result.breakEvenPrice === null ? "Không khả thi" : formatMoney(result.breakEvenPrice)} tone="blue" subtext="Đã gồm hoàn/hủy" /><Metric label="ROI trên giá vốn" value={`${evaluation.roiOnCogs.toFixed(1)}%`} tone={evaluation.roiOnCogs < 0 ? "red" : "green"} /><Metric label="Ads tối đa" value={formatMoney(evaluation.maximumMarketingCost)} subtext="mỗi đơn có quảng cáo" /><Metric label="ROAS hòa vốn" value={evaluation.breakEvenRoas === null ? "—" : `${evaluation.breakEvenRoas.toFixed(2)}x`} /></div>
      <CalculationSummary evaluation={evaluation} />
      <CostVisuals evaluation={evaluation} isExternal={input.platform === "external"} />
      {evaluation.warnings.map((warning) => <div key={warning} className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900"><AlertTriangle size={15} className="shrink-0" />{warning}</div>)}
      <Breakdown evaluation={evaluation} input={input} />
      <Scenarios evaluation={evaluation} isLoss={isLoss} />
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600"><div className="flex gap-2"><Info size={16} className="shrink-0 text-blue-600" /><div><strong className="text-slate-800">Nguồn và phạm vi dữ liệu</strong><p className="mt-1">{input.platform === "external" ? "Đơn ngoài không áp dụng biểu phí sàn. Kết quả dùng phí thanh toán, COD và xử lý đơn do bạn nhập." : "Hoa hồng lấy đúng dòng ngành cấp 3 trong bảng chính thức. Hợp đồng hoặc ưu đãi riêng của shop vẫn cần ghi đè theo sao kê."}</p><div className="mt-2 flex flex-wrap gap-3">{feeProfile.sourceUrl && <a href={feeProfile.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-blue-600">Nguồn phí <ExternalLink size={11} /></a>}<a href={SOURCES.tax} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-blue-600">Nghị định thuế 68/2026 <ExternalLink size={11} /></a></div></div></div></section></>}
    </div></div><SavedCalculations history={savedHistory} onOpen={openSaved} onDelete={deleteSaved} onDeleteAll={deleteAllSaved} /></>}
  </div>;
}

type Update = <K extends keyof PricingInput>(key: K, value: PricingInput[K]) => void;
function AdvancedFields({ input, update, feeProfile, roundingStep, setRoundingStep, toggleProgram }: { input: PricingInput; update: Update; feeProfile: ReturnType<typeof getFeeProfile>; roundingStep: number; setRoundingStep: (v: number) => void; toggleProgram: (id: string) => void }) {
  return <div className="space-y-5 border-t p-5"><Group title="Giá bán và vận hành"><div className="grid grid-cols-2 gap-3"><Field label="Giảm giá của shop"><NumberInput value={input.sellerDiscountRate} onChange={(v) => update("sellerDiscountRate", v)} max={100} /></Field><Field label="Voucher sàn tài trợ"><MoneyInput value={input.platformDiscount} onChange={(v) => update("platformDiscount", v)} /></Field><Field label="Affiliate/KOC"><NumberInput value={input.affiliateRate} onChange={(v) => update("affiliateRate", v)} max={100} /></Field><Field label="Khách trả phí ship"><MoneyInput value={input.buyerShippingFee} onChange={(v) => update("buyerShippingFee", v)} /></Field><Field label="Shop chịu phí ship"><MoneyInput value={input.sellerShippingCost} onChange={(v) => update("sellerShippingCost", v)} /></Field><Field label="Nhân công / đơn"><MoneyInput value={input.handlingCost} onChange={(v) => update("handlingCost", v)} /></Field><Field label="Chi phí chung / đơn"><MoneyInput value={input.overheadCost} onChange={(v) => update("overheadCost", v)} /></Field><Field label="Bước làm tròn"><select value={roundingStep} onChange={(e) => setRoundingStep(Number(e.target.value))} className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm"><option value={1}>1đ</option><option value={1000}>1.000đ</option><option value={5000}>5.000đ</option><option value={10000}>10.000đ</option></select></Field></div></Group>
    {input.platform !== "external" && <Group title="Phí sàn"><div className="grid grid-cols-3 gap-3"><Field label="Hoa hồng" hint={`${feeProfile.commissionRate}%`}><NumberInput value={input.commissionOverride ?? feeProfile.commissionRate} onChange={(v) => update("commissionOverride", v)} max={100} /></Field><Field label="Giao dịch" hint={`${feeProfile.transactionRate}%`}><NumberInput value={input.transactionOverride ?? feeProfile.transactionRate} onChange={(v) => update("transactionOverride", v)} max={100} /></Field><Field label="Phí cố định"><MoneyInput value={input.fixedFeeOverride ?? feeProfile.orderProcessingFee} onChange={(v) => update("fixedFeeOverride", v)} /></Field></div><button onClick={() => { update("commissionOverride", null); update("transactionOverride", null); update("fixedFeeOverride", null); }} className="mt-2 text-xs font-semibold text-blue-600">Dùng lại mức gợi ý</button><div className="mt-3 space-y-2">{PROGRAMS[input.platform].map((p) => <label key={p.id} className="flex cursor-pointer gap-3 rounded-lg border p-3"><input type="checkbox" checked={input.enabledProgramIds.includes(p.id)} onChange={() => toggleProgram(p.id)} /><span className="text-xs text-slate-600"><strong className="block text-slate-800">{p.name}: {p.rate}%{p.cap ? `, trần ${formatMoney(p.cap)}` : ""}</strong>{p.note}</span></label>)}</div></Group>}
    <Group title="Thuế"><Field label="Loại hình/phương pháp"><select value={input.taxMode} onChange={(e) => update("taxMode", e.target.value as TaxMode)} className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm"><option value="household_exempt">Hộ/cá nhân — doanh thu năm ≤ 500 triệu</option><option value="household_revenue">Hộ/cá nhân — tính theo doanh thu</option><option value="profit_based">Công ty/hộ — tính trên lợi nhuận</option><option value="manual">Tỷ lệ doanh thu tự nhập</option></select></Field>{input.taxMode === "household_revenue" && <div className="mt-3"><Field label="Phần doanh thu chịu TNCN" hint="GTGT 1% toàn doanh thu"><NumberInput value={input.taxableRevenueShare} onChange={(v) => update("taxableRevenueShare", v)} max={100} /></Field></div>}{input.taxMode === "profit_based" && <div className="mt-3"><Field label="Thuế suất trên lợi nhuận"><NumberInput value={input.profitTaxRate} onChange={(v) => update("profitTaxRate", v)} max={100} /></Field></div>}{input.taxMode === "manual" && <div className="mt-3"><Field label="Thuế trên doanh thu"><NumberInput value={input.manualRevenueTaxRate} onChange={(v) => update("manualRevenueTaxRate", v)} max={100} /></Field></div>}</Group>
    <Group title="Hủy, giao thất bại và trả hàng"><div className="grid grid-cols-2 gap-3"><Field label="Tỷ lệ hủy"><NumberInput value={input.cancellationRate} onChange={(v) => update("cancellationRate", v)} max={100} /></Field><Field label="Chi phí một đơn hủy"><MoneyInput value={input.cancellationCost} onChange={(v) => update("cancellationCost", v)} /></Field><Field label="Tỷ lệ giao thất bại"><NumberInput value={input.deliveryFailureRate} onChange={(v) => update("deliveryFailureRate", v)} max={100} /></Field><Field label="Tỷ lệ trả sau giao"><NumberInput value={input.returnRate} onChange={(v) => update("returnRate", v)} max={100} /></Field><Field label="Phí vận chuyển hoàn"><MoneyInput value={input.returnShippingCost} onChange={(v) => update("returnShippingCost", v)} /></Field><Field label="Phí không được hoàn"><MoneyInput value={input.nonRefundableReturnFee} onChange={(v) => update("nonRefundableReturnFee", v)} /></Field><Field label="Thu hồi giá trị hàng"><NumberInput value={input.returnedInventoryRecoveryRate} onChange={(v) => update("returnedInventoryRecoveryRate", v)} max={100} /></Field><Field label="Hao hụt/hư hỏng"><NumberInput value={input.damageRate} onChange={(v) => update("damageRate", v)} max={100} /></Field></div></Group>
  </div>;
}

function Group({ title, children }: { title: string; children: ReactNode }) { return <div><h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">{title}</h3>{children}</div>; }
function Mini({ label, value, loss = false }: { label: string; value: string; loss?: boolean }) { return <div><p className="text-[10px] uppercase text-slate-500">{label}</p><p className={`mt-1 font-bold font-mono ${loss ? "text-rose-400" : "text-emerald-400"}`}>{value}</p></div>; }
function Row({ label, value, hint, positive = false, strong = false }: { label: string; value: number; hint?: string; positive?: boolean; strong?: boolean }) { return <div className="flex items-center justify-between gap-4"><div><span className={strong ? "font-black text-slate-900" : "text-slate-600"}>{label}</span>{hint && <span className="ml-2 text-[10px] text-slate-400">{hint}</span>}</div><span className={`shrink-0 font-mono ${strong ? "text-base font-black" : "font-bold"} ${value < 0 ? "text-rose-600" : positive ? "text-emerald-700" : "text-slate-900"}`}>{value > 0 && positive ? "+" : ""}{formatMoney(value)}</span></div>; }

function Breakdown({ evaluation: e, input }: { evaluation: ReturnType<typeof calculatePricing>["evaluation"]; input: PricingInput }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="flex items-center gap-2 font-black"><CircleDollarSign size={19} className="text-emerald-600" /> Đối soát một đơn thành công</h2><p className="mt-1 text-xs text-slate-500">Mỗi khoản dùng cơ sở tính phí riêng.</p></div><div className="space-y-2.5 text-sm"><Row label="Doanh thu sau giảm của shop" value={e.productRevenue} positive />{e.fees.map((fee) => <Row key={fee.id} label={`${fee.name}${fee.rate === null ? "" : ` (${fee.rate}%)`}`} value={-fee.amount} hint={fee.id === "order" ? "Tính theo 1 đơn" : `Cơ sở ${formatMoney(fee.base)}`} />)}<div className="border-t pt-2.5"><Row label={input.platform === "external" ? "Thực thu" : "Sàn giải ngân"} value={e.payout} positive strong /></div><Row label={`Giá vốn (${input.quantity} sản phẩm)`} value={-e.cogs} /><Row label="Đóng gói, vận hành và ship" value={-e.operatingCosts} /><Row label="Ads/Marketing" value={-e.marketingCost} /><Row label="Affiliate/KOC" value={-e.affiliateCost} /><Row label="Thuế ước tính" value={-e.tax} /><div className="border-t-2 pt-3"><Row label="Lãi đơn giao thành công" value={e.profitOnSuccess} positive strong /></div></div></section>;
}

function Scenarios({ evaluation: e, isLoss }: { evaluation: ReturnType<typeof calculatePricing>["evaluation"]; isLoss: boolean }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="flex items-center gap-2 font-black"><ShieldCheck size={19} className="text-blue-600" /> Mô hình 100 đơn phát sinh</h2><p className="mt-1 text-xs text-slate-500">Tính tuần tự: hủy → giao thất bại → trả sau giao.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Scenario icon={<PackageCheck size={17} />} label="Thành công" count={e.weights.success * 100} amount={e.weights.success * 100 * e.profitOnSuccess} tone="green" /><Scenario icon={<RotateCcw size={17} />} label="Trả hàng" count={e.weights.returned * 100} amount={-e.weights.returned * 100 * e.returnLoss} tone="red" /><Scenario icon={<Truck size={17} />} label="Giao thất bại" count={e.weights.deliveryFailed * 100} amount={-e.weights.deliveryFailed * 100 * e.deliveryFailureLoss} tone="amber" /><Scenario icon={<TrendingDown size={17} />} label="Bị hủy" count={e.weights.cancelled * 100} amount={-e.weights.cancelled * 100 * e.cancellationLoss} tone="slate" /></div><div className={`mt-4 flex items-center justify-between rounded-xl p-4 ${isLoss ? "bg-rose-100 text-rose-900" : "bg-emerald-100 text-emerald-900"}`}><span className="text-sm font-bold">Lợi nhuận kỳ vọng trên 100 đơn</span><span className="text-xl font-black font-mono">{formatMoney(e.expectedProfitPerOrder * 100)}</span></div></section>;
}
function Scenario({ icon, label, count, amount, tone }: { icon: ReactNode; label: string; count: number; amount: number; tone: "green" | "red" | "amber" | "slate" }) { const colors = { green: "bg-emerald-50 text-emerald-800 border-emerald-200", red: "bg-rose-50 text-rose-800 border-rose-200", amber: "bg-amber-50 text-amber-800 border-amber-200", slate: "bg-slate-50 text-slate-700 border-slate-200" }; return <div className={`rounded-xl border p-3 ${colors[tone]}`}><div className="flex items-center gap-1.5 text-xs font-bold">{icon}{label}</div><p className="mt-2 text-lg font-black">{count.toFixed(1)} đơn</p><p className="mt-1 text-[11px] font-bold font-mono">{formatMoney(amount)}</p></div>; }
