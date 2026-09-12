"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, BarChart3, Calculator, Check, ClipboardCopy, CopyPlus, Download, ExternalLink, FileSpreadsheet, FileText, FolderOpen, Presentation, Save, Target, Trash2, Users } from "lucide-react";
import { useToolGate } from "@/hooks/useToolGate";
import { calculateKocPlan } from "@/lib/koc-planner/engine";
import type { KocPlanInput, KocPlanResult } from "@/lib/koc-planner/types";
import { FEE_DATA_VERSION, getAvailableCategories, getCategoryLabel, getDefaultCategoryId, getFeeProfile, PROGRAMS, SOURCES } from "@/lib/pricing/registry";
import { readPricingHistory, type PricingCalculationSnapshot } from "@/lib/pricing/storage";
import type { ShopType } from "@/lib/pricing/types";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const money = (value: number) => currency.format(Math.round(value));
const number = (value: number, digits = 0) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);
const parseMoney = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;
const STORAGE_KEY = "aichoshop_koc_plans_v2";

const initialInput: KocPlanInput = {
  campaignName: "", shopType: "marketplace", categoryId: "tiktok-468", totalBudget: 50_000_000, sampleCost: 100_000, sampleShippingCost: 30_000,
  castFee: 50_000, effectiveKocRate: 80, videosPerKoc: 3, organicOrdersPerEffectiveKoc: 10,
  averageSellingPrice: 500_000, sellerDiscountRate: 0, platformDiscount: 0, buyerShippingFee: 0,
  costPerSoldItem: 150_000, packagingCost: 5_000, handlingCost: 0, sellerShippingCost: 0, organicCommissionRate: 10,
  useAds: true, adsBudgetRate: 30, adsCostPerOrder: 100_000, adsCommissionRate: 7.5,
  includeTikTokFees: true, platformCommissionRate: 0, transactionFeeRate: 6, fixedOrderFee: 3_000, enabledProgramIds: [],
  taxRate: 1.5, cancellationRate: 2, cancellationCost: 0, deliveryFailureRate: 4,
  returnRate: 5, returnedInventoryRecoveryRate: 95, returnCostPerOrder: 25_000,
  nonRefundableReturnFee: 0, damageRate: 5,
  extraKocCostRate: 10, otherOperatingCost: 0,
};

type SavedPlan = { id: string; createdAt: string; categoryId: string; shopType: ShopType; input: KocPlanInput; result: KocPlanResult };
type LegacyKocInput = Partial<KocPlanInput> & { adsBudget?: number };

function migrateInput(raw: LegacyKocInput): KocPlanInput {
  const totalBudget = raw.totalBudget ?? initialInput.totalBudget;
  const adsBudgetRate = raw.adsBudgetRate ?? (raw.adsBudget !== undefined && totalBudget > 0
    ? raw.adsBudget / totalBudget * 100
    : initialInput.adsBudgetRate);
  return { ...initialInput, ...raw, adsBudgetRate: Math.min(100, Math.max(0, adsBudgetRate)) };
}

function MoneyInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <input inputMode="numeric" value={value ? number(value) : ""} onChange={(event) => onChange(parseMoney(event.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15" />;
}
function NumberInput({ value, onChange, suffix = "%", step = 0.5 }: { value: number; onChange: (value: number) => void; suffix?: string; step?: number }) {
  return <div className="relative"><input type="number" min={0} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15" />{suffix && <span className="absolute right-3 top-2 text-sm text-slate-400">{suffix}</span>}</div>;
}
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold text-slate-700">{label}{hint && <span className="font-normal text-slate-400">{hint}</span>}</span>{children}</label>;
}
function Toggle({ checked, onChange, label, note }: { checked: boolean; onChange: (checked: boolean) => void; label: string; note?: string }) {
  return <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-600" /><span className="text-xs text-slate-600"><strong className="block text-slate-800">{label}</strong>{note}</span></label>;
}
function ResultRow({ label, value, tone = "blue", strong = false }: { label: string; value: string; tone?: "blue" | "green" | "orange" | "red"; strong?: boolean }) {
  const tones = { blue: "text-blue-700", green: "text-emerald-700", orange: "text-orange-700", red: "text-rose-700" };
  return <div className={`flex items-center justify-between gap-4 border-b border-slate-200/70 py-2 text-xs ${strong ? "font-black" : "font-semibold"}`}><span className="text-slate-600">{label}</span><span className={`font-mono ${tones[tone]}`}>{value}</span></div>;
}
function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

export default function KocPlanner() {
  const { checkAccess, GateModals } = useToolGate();
  const [input, setInput] = useState<KocPlanInput>(initialInput);
  const [shopType, setShopType] = useState<ShopType>("marketplace");
  const [categoryId, setCategoryId] = useState(() => getDefaultCategoryId("tiktok", "marketplace"));
  const [hasCalculated, setHasCalculated] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [savedProducts, setSavedProducts] = useState<PricingCalculationSnapshot[]>([]);
  const categories = useMemo(() => getAvailableCategories("tiktok", shopType), [shopType]);
  const category = categories.find((item) => item.id === categoryId) ?? categories[0];
  const level1Values = Array.from(new Set(categories.map((item) => item.level1)));
  const level2Categories = categories.filter((item) => item.level1 === category.level1);
  const level2Values = Array.from(new Set(level2Categories.map((item) => item.level2)));
  const level3Categories = level2Categories.filter((item) => item.level2 === category.level2);
  const feeProfile = getFeeProfile("tiktok", shopType, category.id);
  const calculationInput = useMemo(() => ({ ...input, shopType, categoryId: category.id, platformCommissionRate: feeProfile.commissionRate }), [category.id, feeProfile.commissionRate, input, shopType]);
  const result = useMemo(() => calculateKocPlan(calculationInput), [calculationInput]);
  const update = <K extends keyof KocPlanInput>(key: K, value: KocPlanInput[K]) => setInput((current) => ({ ...current, [key]: value }));

  useEffect(() => { checkAccess("koc-planner", false); }, [checkAccess]);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // localStorage chỉ có sau khi component được gắn trong trình duyệt.
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedPlan[];
      setSavedPlans(Array.isArray(stored) ? stored.map((item) => ({ ...item, input: migrateInput(item.input as LegacyKocInput) })) : []);
    } catch { setSavedPlans([]); }
    setSavedProducts(readPricingHistory(localStorage).filter((item) => item.input.platform === "tiktok"));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  const changeShopType = (next: ShopType) => { setShopType(next); setCategoryId(getDefaultCategoryId("tiktok", next)); };
  const chooseCategory = (matches: (item: typeof category) => boolean) => {
    const next = categories.find(matches); if (next) setCategoryId(next.id);
  };
  const applySavedProduct = (id: string) => {
    const saved = savedProducts.find((item) => item.id === id); if (!saved) return;
    setShopType(saved.input.shopType); setCategoryId(saved.input.categoryId);
    setInput((current) => ({ ...current,
      averageSellingPrice: saved.result.evaluation.listPrice,
      sellerDiscountRate: saved.input.sellerDiscountRate,
      platformDiscount: saved.input.platformDiscount,
      buyerShippingFee: saved.input.buyerShippingFee,
      costPerSoldItem: saved.input.costPerUnit,
      packagingCost: saved.input.packagingCost,
      handlingCost: saved.input.handlingCost + saved.input.overheadCost,
      sellerShippingCost: saved.input.sellerShippingCost,
      transactionFeeRate: saved.input.transactionOverride ?? 6,
      fixedOrderFee: saved.input.fixedFeeOverride ?? 3_000,
      enabledProgramIds: saved.input.enabledProgramIds,
      taxRate: saved.input.taxMode === "manual" ? saved.input.manualRevenueTaxRate : saved.result.evaluation.productRevenue > 0 ? saved.result.evaluation.tax / saved.result.evaluation.productRevenue * 100 : current.taxRate,
      cancellationRate: saved.input.cancellationRate, cancellationCost: saved.input.cancellationCost,
      deliveryFailureRate: saved.input.deliveryFailureRate, returnRate: saved.input.returnRate,
      returnedInventoryRecoveryRate: saved.input.returnedInventoryRecoveryRate,
      returnCostPerOrder: saved.input.returnShippingCost,
      nonRefundableReturnFee: saved.input.nonRefundableReturnFee, damageRate: saved.input.damageRate,
    }));
  };
  const calculate = () => {
    if (!input.campaignName.trim()) return setError("Vui lòng nhập tên chiến dịch trước khi tính.");
    if (input.totalBudget <= 0) return setError("Tổng ngân sách phải lớn hơn 0.");
    if (input.adsBudgetRate < 0 || input.adsBudgetRate > 100) return setError("Ngân sách quảng cáo phải nằm trong khoảng 0–100%.");
    if (input.averageSellingPrice <= 0) return setError("Giá bán trung bình phải lớn hơn 0.");
    setError(""); setHasCalculated(true);
  };
  const save = () => {
    if (!hasCalculated) return setError("Hãy tính kế hoạch trước khi lưu.");
    const item: SavedPlan = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), categoryId: category.id, shopType, input: calculationInput, result };
    const next = [item, ...savedPlans]; setSavedPlans(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const openPlan = (item: SavedPlan) => { setInput(item.input); setShopType(item.shopType); setCategoryId(item.categoryId); setHasCalculated(true); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const duplicatePlan = (item: SavedPlan) => { setInput({ ...item.input, campaignName: `${item.input.campaignName} (bản sao)` }); setShopType(item.shopType); setCategoryId(item.categoryId); setHasCalculated(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const deletePlan = (id: string) => { const next = savedPlans.filter((item) => item.id !== id); setSavedPlans(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };
  const copyResult = async () => {
    await navigator.clipboard.writeText(`KẾ HOẠCH KOC: ${input.campaignName}\nNgành: ${getCategoryLabel(category)}\nNgân sách: ${money(input.totalBudget)}\nKOC có thể mời: ${result.invitedKocs}\nKOC làm nội dung: ${result.effectiveKocs}\nVideo: ${result.videos}\nĐơn thành công: ${number(result.successfulOrders, 1)}\nDoanh thu sau hoàn: ${money(result.netRevenue)}\nTổng chi phí: ${money(result.totalCost)}\nLợi nhuận ròng: ${money(result.netProfit)}\nROI: ${result.roi.toFixed(1)}%`);
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  };
  const exportCsv = () => {
    const rows = exportRows(input.campaignName, getCategoryLabel(category), result);
    download("ke-hoach-koc.csv", `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n")}`);
  };
  const exportExcel = async () => {
    const XLSX = await import("xlsx"); const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(exportRows(input.campaignName, getCategoryLabel(category), result)), "Kế hoạch KOC");
    XLSX.writeFile(workbook, "ke-hoach-koc.xlsx");
  };

  return <div className="mx-auto max-w-7xl pb-12"><GateModals />
    <div className="mb-5"><Link href="/tools" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600"><ArrowLeft size={16} /> Quay lại kho công cụ</Link><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div className="flex items-center gap-3"><div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700"><Presentation size={24} /></div><div><h1 className="text-2xl font-black text-slate-950">Lập kế hoạch chi phí KOC Campaign</h1><p className="mt-1 text-sm text-slate-500">Dự phóng từ ngân sách, hiệu suất KOC, Ads, phí TikTok, hoàn đơn và giá vốn.</p></div></div><span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-black text-amber-800">PHÍ TIKTOK {FEE_DATA_VERSION}</span></div></div>
    <div className="mb-5 flex flex-wrap gap-2"><button onClick={save} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700"><Save size={14} /> Lưu phương án</button><button disabled={!hasCalculated} onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-40"><Download size={14} /> Tải CSV</button><button disabled={!hasCalculated} onClick={exportExcel} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-40"><FileSpreadsheet size={14} /> Tải Excel</button><button disabled={!hasCalculated} onClick={copyResult} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-3 py-2 text-xs font-bold text-violet-700 disabled:opacity-40">{copied ? <Check size={14} /> : <ClipboardCopy size={14} />} {copied ? "Đã sao chép" : "Sao chép kết quả"}</button><span className="ml-auto self-center text-xs font-semibold text-slate-500">Đã lưu: {savedPlans.length} phương án</span></div>
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white"><h2 className="flex items-center gap-2 font-black"><Users size={19} /> Thông tin chiến dịch</h2></div><div className="space-y-5 p-5">
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900"><strong>Dữ liệu mẫu để bắt đầu:</strong> tỷ lệ KOC làm nội dung, số đơn/KOC, CPA, hoàn đơn và chi phí hiện có chưa phải số liệu shop của bạn. Chỉ hoa hồng ngành được lấy từ biểu phí TikTok; hãy thay các số mẫu bằng báo cáo chiến dịch và sao kê thực tế.</p>
        {savedProducts.length > 0 && <Field label="Lấy dữ liệu từ sản phẩm TikTok đã lưu" hint="Tính giá bán"><select defaultValue="" onChange={(event) => applySavedProduct(event.target.value)} className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900"><option value="" disabled>Chọn sản phẩm để tự điền giá và chi phí</option>{savedProducts.map((item) => <option key={item.id} value={item.id}>{item.productName} — {money(item.result.evaluation.listPrice)}</option>)}</select></Field>}
        <Field label="Tên chiến dịch" hint="bắt buộc"><input value={input.campaignName} onChange={(event) => { update("campaignName", event.target.value); setError(""); }} placeholder="Ví dụ: Ra mắt áo polo tháng 10" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></Field>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-xs font-black uppercase tracking-wide text-slate-700">Cấu hình TikTok Shop theo ngành cấp 3</h3><span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-indigo-700">{feeProfile.commissionRate}%</span></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Loại shop TikTok"><select value={shopType} onChange={(event) => changeShopType(event.target.value as ShopType)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><option value="marketplace">Shop thường</option><option value="mall">TikTok Shop Mall</option></select></Field><Field label="Ngành cấp 1"><select value={category.level1} onChange={(event) => chooseCategory((item) => item.level1 === event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">{level1Values.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Ngành cấp 2"><select value={category.level2} onChange={(event) => chooseCategory((item) => item.level1 === category.level1 && item.level2 === event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">{level2Values.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Ngành cấp 3"><select value={category.id} onChange={(event) => setCategoryId(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">{level3Categories.map((item) => <option key={item.id} value={item.id}>{item.level3} — {shopType === "mall" ? item.mallRate : item.marketplaceRate}%</option>)}</select></Field></div></div>
        <Panel title="Ngân sách và chi phí mỗi KOC mời" tone="blue"><div className="grid gap-3 sm:grid-cols-2"><Field label="Tổng ngân sách chiến dịch"><MoneyInput value={input.totalBudget} onChange={(value) => update("totalBudget", value)} /></Field><Field label="Giá vốn hàng mẫu / KOC"><MoneyInput value={input.sampleCost} onChange={(value) => update("sampleCost", value)} /></Field><Field label="Phí gửi mẫu / KOC"><MoneyInput value={input.sampleShippingCost} onChange={(value) => update("sampleShippingCost", value)} /></Field><Field label="Phí cast/booking / KOC"><MoneyInput value={input.castFee} onChange={(value) => update("castFee", value)} /></Field></div></Panel>
        <div><h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Hiệu suất nội dung và kinh tế mỗi đơn</h3><div className="grid gap-3 sm:grid-cols-3"><Field label="KOC thực sự làm nội dung"><NumberInput value={input.effectiveKocRate} onChange={(value) => update("effectiveKocRate", value)} /></Field><Field label="Video / KOC hiệu quả"><NumberInput value={input.videosPerKoc} onChange={(value) => update("videosPerKoc", value)} suffix="" step={1} /></Field><Field label="Đơn tự nhiên / KOC hiệu quả"><NumberInput value={input.organicOrdersPerEffectiveKoc} onChange={(value) => update("organicOrdersPerEffectiveKoc", value)} suffix="" step={1} /></Field><Field label="Giá niêm yết trung bình"><MoneyInput value={input.averageSellingPrice} onChange={(value) => update("averageSellingPrice", value)} /></Field><Field label="Giảm giá của shop"><NumberInput value={input.sellerDiscountRate} onChange={(value) => update("sellerDiscountRate", value)} /></Field><Field label="Voucher TikTok tài trợ"><MoneyInput value={input.platformDiscount} onChange={(value) => update("platformDiscount", value)} /></Field><Field label="Khách trả phí ship"><MoneyInput value={input.buyerShippingFee} onChange={(value) => update("buyerShippingFee", value)} /></Field><Field label="Giá vốn sản phẩm"><MoneyInput value={input.costPerSoldItem} onChange={(value) => update("costPerSoldItem", value)} /></Field><Field label="Đóng gói / đơn"><MoneyInput value={input.packagingCost} onChange={(value) => update("packagingCost", value)} /></Field><Field label="Nhân công / đơn"><MoneyInput value={input.handlingCost} onChange={(value) => update("handlingCost", value)} /></Field><Field label="Shop chịu phí ship"><MoneyInput value={input.sellerShippingCost} onChange={(value) => update("sellerShippingCost", value)} /></Field><Field label="Hoa hồng đơn tự nhiên"><NumberInput value={input.organicCommissionRate} onChange={(value) => update("organicCommissionRate", value)} /></Field></div></div>
        <Panel title="Quảng cáo" tone="violet"><Toggle checked={input.useAds} onChange={(value) => update("useAds", value)} label="Có sử dụng quảng cáo/Spark Ads" note="Dự phóng đơn quảng cáo theo CPA thực tế bạn nhập." />{input.useAds && <div className="mt-4 grid gap-3 sm:grid-cols-3"><Field label="Ngân sách quảng cáo" hint={money(input.totalBudget * Math.min(100, Math.max(0, input.adsBudgetRate)) / 100)}><NumberInput value={input.adsBudgetRate} onChange={(value) => update("adsBudgetRate", value)} /></Field><Field label="CPA quảng cáo"><MoneyInput value={input.adsCostPerOrder} onChange={(value) => update("adsCostPerOrder", value)} /></Field><Field label="Hoa hồng đơn quảng cáo"><NumberInput value={input.adsCommissionRate} onChange={(value) => update("adsCommissionRate", value)} /></Field></div>}</Panel>
        <Panel title="Phí TikTok Shop" tone="orange"><Toggle checked={input.includeTikTokFees} onChange={(value) => update("includeTikTokFees", value)} label="Tính phí bán hàng TikTok Shop" note={`Hoa hồng ngành cấp 3 ${feeProfile.commissionRate}%; phí giao dịch dùng đúng cơ sở tiền khách trả + voucher nền tảng.`} />{input.includeTikTokFees && <><div className="mt-4 grid gap-3 sm:grid-cols-3"><Field label="Hoa hồng ngành" hint="bảng chính thức"><div className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-black text-orange-700">{feeProfile.commissionRate}%</div></Field><Field label="Phí giao dịch"><NumberInput value={input.transactionFeeRate} onChange={(value) => update("transactionFeeRate", value)} /></Field><Field label="Phí xử lý mỗi đơn"><MoneyInput value={input.fixedOrderFee} onChange={(value) => update("fixedOrderFee", value)} /></Field></div><div className="mt-4 space-y-2 border-t border-orange-200 pt-4">{PROGRAMS.tiktok.map((program) => <label key={program.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-orange-200 bg-white p-3"><input type="checkbox" checked={input.enabledProgramIds.includes(program.id)} onChange={() => update("enabledProgramIds", input.enabledProgramIds.includes(program.id) ? input.enabledProgramIds.filter((id) => id !== program.id) : [...input.enabledProgramIds, program.id])} className="mt-0.5 h-4 w-4 accent-orange-600" /><span className="text-xs text-slate-600"><strong className="block text-slate-800">{program.name}: {program.rate}%{program.cap ? `, tối đa ${money(program.cap)}` : ""}</strong>{program.note}</span></label>)}</div><p className="mt-3 text-[11px] text-orange-800">Không thêm FSC vì chưa tìm thấy chính sách phí FSC hiện hành trong Seller University. Chỉ nhập khoản này vào chi phí khác nếu sao kê của shop có phát sinh.</p></>}</Panel>
        <div><h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Thuế, trạng thái đơn và chi phí bổ sung</h3><div className="grid gap-3 sm:grid-cols-3"><Field label="Thuế trên doanh thu"><NumberInput value={input.taxRate} onChange={(value) => update("taxRate", value)} /></Field><Field label="Tỷ lệ hủy"><NumberInput value={input.cancellationRate} onChange={(value) => update("cancellationRate", value)} /></Field><Field label="Chi phí một đơn hủy"><MoneyInput value={input.cancellationCost} onChange={(value) => update("cancellationCost", value)} /></Field><Field label="Tỷ lệ giao thất bại"><NumberInput value={input.deliveryFailureRate} onChange={(value) => update("deliveryFailureRate", value)} /></Field><Field label="Tỷ lệ hoàn sau giao"><NumberInput value={input.returnRate} onChange={(value) => update("returnRate", value)} /></Field><Field label="Phí vận chuyển hoàn"><MoneyInput value={input.returnCostPerOrder} onChange={(value) => update("returnCostPerOrder", value)} /></Field><Field label="Phí không được hoàn"><MoneyInput value={input.nonRefundableReturnFee} onChange={(value) => update("nonRefundableReturnFee", value)} /></Field><Field label="Thu hồi giá trị hàng hoàn"><NumberInput value={input.returnedInventoryRecoveryRate} onChange={(value) => update("returnedInventoryRecoveryRate", value)} /></Field><Field label="Hao hụt/hư hỏng"><NumberInput value={input.damageRate} onChange={(value) => update("damageRate", value)} /></Field><Field label="Chi phí KOC phát sinh"><NumberInput value={input.extraKocCostRate} onChange={(value) => update("extraKocCostRate", value)} /></Field><Field label="Vận hành chiến dịch khác"><MoneyInput value={input.otherOperatingCost} onChange={(value) => update("otherOperatingCost", value)} /></Field></div></div>
        {error && <p className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"><AlertTriangle size={15} />{error}</p>}
        <button onClick={calculate} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20"><Calculator size={17} /> Tính kế hoạch KOC</button>
      </div></section>
      <div className="space-y-5 lg:sticky lg:top-4">{!hasCalculated ? <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600"><BarChart3 size={34} /></div><h2 className="mt-4 font-black">Chưa có kết quả dự phóng</h2><p className="mt-1 max-w-sm text-sm text-slate-500">Nhập dữ liệu chiến dịch rồi nhấn “Tính kế hoạch KOC”. Các thay đổi sau đó sẽ cập nhật kết quả ngay.</p></section> : <Results result={result} />}
        {hasCalculated && <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600"><div className="flex gap-2"><FileText size={16} className="shrink-0 text-indigo-600" /><div><strong className="text-slate-800">Nguồn và giới hạn dữ liệu</strong><p className="mt-1">Hoa hồng lấy theo ngành cấp 3 TikTok Shop. Hiệu quả KOC, CPA, tỷ lệ hoàn và phí hợp đồng phải nhập từ báo cáo thực tế của shop.</p><div className="mt-2 flex flex-wrap gap-3"><a href={SOURCES.tiktok} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-indigo-600">Phí nhà bán hàng <ExternalLink size={11} /></a><a href={SOURCES.tiktokTransaction} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-indigo-600">Phí giao dịch <ExternalLink size={11} /></a><a href={SOURCES.tiktokVxp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-indigo-600">Voucher Extra <ExternalLink size={11} /></a><a href={SOURCES.tax} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-indigo-600">Nguồn thuế <ExternalLink size={11} /></a></div></div></div></section>}
      </div>
    </div>
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b bg-slate-50 px-5 py-4"><h2 className="font-black text-slate-900">So sánh phương án đã lưu ({savedPlans.length})</h2>{savedPlans.length > 0 && <button onClick={() => { setSavedPlans([]); localStorage.setItem(STORAGE_KEY, "[]"); }} className="inline-flex items-center gap-1 text-xs font-bold text-rose-600"><Trash2 size={14} /> Xóa tất cả</button>}</div>{savedPlans.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Chưa có phương án nào. Hãy tính rồi nhấn “Lưu phương án”.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-slate-900 text-white"><tr><th className="px-4 py-3">Chiến dịch</th><th className="px-4 py-3">Ngân sách</th><th className="px-4 py-3">KOC hiệu quả</th><th className="px-4 py-3">Đơn thành công</th><th className="px-4 py-3">Doanh thu</th><th className="px-4 py-3">Lợi nhuận</th><th className="px-4 py-3">ROI</th><th className="px-4 py-3">Thao tác</th></tr></thead><tbody className="divide-y">{savedPlans.map((item) => <tr key={item.id}><td className="px-4 py-3"><strong>{item.input.campaignName}</strong><span className="mt-1 block text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString("vi-VN")}</span></td><td className="px-4 py-3 font-mono">{money(item.input.totalBudget)}</td><td className="px-4 py-3">{number(item.result.effectiveKocs)}</td><td className="px-4 py-3">{number(item.result.successfulOrders, 1)}</td><td className="px-4 py-3 font-mono text-emerald-700">{money(item.result.netRevenue)}</td><td className={`px-4 py-3 font-mono font-bold ${item.result.netProfit < 0 ? "text-rose-600" : "text-blue-700"}`}>{money(item.result.netProfit)}</td><td className="px-4 py-3 font-bold">{item.result.roi.toFixed(1)}%</td><td className="px-4 py-3"><div className="flex gap-1"><button title="Mở lại" onClick={() => openPlan(item)} className="rounded-lg border border-blue-200 p-2 text-blue-600"><FolderOpen size={14} /></button><button title="Nhân bản" onClick={() => duplicatePlan(item)} className="rounded-lg border border-violet-200 p-2 text-violet-600"><CopyPlus size={14} /></button><button title="Xóa" onClick={() => deletePlan(item.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600"><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>}</section>
  </div>;
}

function Panel({ title, tone, children }: { title: string; tone: "blue" | "violet" | "orange"; children: ReactNode }) { const colors = { blue: "border-blue-200 bg-blue-50", violet: "border-violet-200 bg-violet-50", orange: "border-orange-200 bg-orange-50" }; return <div className={`rounded-xl border p-4 ${colors[tone]}`}><h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-700">{title}</h3>{children}</div>; }
function ResultGroup({ title, children }: { title: string; children: ReactNode }) { return <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"><h3 className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-800"><Target size={14} className="text-indigo-600" />{title}</h3>{children}</div>; }
function Kpi({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-white/10 p-3 text-center"><p className="text-[10px] uppercase text-white/70">{label}</p><p className="mt-1 font-mono text-sm font-black">{value}</p></div>; }
function Results({ result }: { result: KocPlanResult }) { return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-5 py-4 text-white"><h2 className="flex items-center gap-2 font-black"><BarChart3 size={19} /> Kết quả ước tính</h2><p className="mt-1 text-xs text-blue-100">Dự phóng từ dữ liệu bạn nhập, không phải cam kết doanh số.</p></div><div className="space-y-4 p-5">
  <ResultGroup title="Phân bổ ngân sách"><ResultRow label="Ngân sách mẫu/cast khả dụng" value={money(result.creatorBudget)} /><ResultRow label="Chi phí mỗi KOC được mời" value={money(result.costPerInvitedKoc)} /><ResultRow label="Chi phí mẫu/cast thực dùng" value={money(result.sampleAndCastCost)} /><ResultRow label="Ngân sách quảng cáo" value={money(result.adSpend)} /><ResultRow label="Ngân sách chưa phân bổ" value={money(result.unusedBudget)} tone="orange" /></ResultGroup>
  <ResultGroup title="Sản lượng chiến dịch"><ResultRow label="Số KOC có thể mời" value={`${number(result.invitedKocs)} KOC`} /><ResultRow label="KOC dự kiến làm nội dung" value={`${number(result.effectiveKocs)} KOC`} /><ResultRow label="Tổng video dự kiến" value={`${number(result.videos)} video`} /><ResultRow label="Đơn tự nhiên" value={`${number(result.organicOrders, 1)} đơn`} /><ResultRow label="Đơn từ quảng cáo" value={`${number(result.adOrders, 1)} đơn`} /><ResultRow label="Đơn thành công sau hoàn" value={`${number(result.successfulOrders, 1)} đơn`} tone="green" strong /></ResultGroup>
  <ResultGroup title="Doanh thu và chi phí"><ResultRow label="GMV niêm yết trước rủi ro" value={money(result.grossRevenue)} tone="green" /><ResultRow label="Doanh thu kỳ vọng sau hủy/hoàn" value={money(result.netRevenue)} tone="green" strong /><ResultRow label="Giải ngân trước Affiliate và thuế" value={money(result.expectedPayoutBeforeAffiliate)} tone="green" /><ResultRow label="Tiền ròng sau Affiliate và thuế" value={money(result.expectedNetSettlement)} tone="green" strong /><ResultRow label="Hoa hồng đơn tự nhiên" value={`-${money(result.organicCommission)}`} /><ResultRow label="Hoa hồng đơn quảng cáo" value={`-${money(result.adsCommission)}`} /><ResultRow label="Phí TikTok Shop" value={`-${money(result.platformFees)}`} /><ResultRow label="Thuế ước tính" value={`-${money(result.taxes)}`} /><ResultRow label="Giá vốn đơn thành công" value={`-${money(result.soldGoodsCost)}`} /><ResultRow label="Đóng gói, vận hành, ship" value={`-${money(result.fulfillmentCost)}`} /><ResultRow label="Tổn thất hủy/giao lỗi/hoàn" value={`-${money(result.returnLoss)}`} tone="orange" /><ResultRow label="Tổng chi phí" value={money(result.totalCost)} tone="orange" strong /></ResultGroup>
  <div className={`rounded-xl p-5 text-white ${result.netProfit < 0 ? "bg-gradient-to-r from-rose-600 to-orange-600" : "bg-gradient-to-r from-indigo-600 to-violet-600"}`}><div className="flex items-center justify-between gap-4"><span className="text-sm font-bold">Lợi nhuận ròng dự kiến</span><strong className="font-mono text-2xl">{money(result.netProfit)}</strong></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><Kpi label="ROI" value={`${result.roi.toFixed(1)}%`} /><Kpi label="ROAS Ads" value={result.roas === null ? "—" : `${result.roas.toFixed(2)}x`} /><Kpi label="Chi phí/đơn" value={result.costPerSuccessfulOrder === null ? "—" : money(result.costPerSuccessfulOrder)} /><Kpi label="Đơn hòa vốn" value={result.breakEvenOrders === null ? "—" : number(result.breakEvenOrders, 1)} /><Kpi label="CPA Ads hòa vốn" value={result.breakEvenCpa === null ? "—" : money(result.breakEvenCpa)} /><Kpi label="Biên ròng" value={`${result.netMargin.toFixed(1)}%`} /></div></div>
  {result.warnings.map((warning) => <p key={warning} className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"><AlertTriangle size={14} className="shrink-0" />{warning}</p>)}
</div></section>; }

function exportRows(campaignName: string, category: string, result: KocPlanResult): (string | number)[][] { return [
  ["Chỉ số", "Giá trị"], ["Chiến dịch", campaignName], ["Ngành cấp 3", category],
  ["KOC có thể mời", result.invitedKocs], ["KOC hiệu quả", result.effectiveKocs], ["Video", result.videos],
  ["Đơn tự nhiên", result.organicOrders], ["Đơn quảng cáo", result.adOrders], ["Đơn thành công", result.successfulOrders],
  ["GMV trước rủi ro", result.grossRevenue], ["Doanh thu sau hủy/hoàn", result.netRevenue],
  ["Giải ngân trước Affiliate và thuế", result.expectedPayoutBeforeAffiliate], ["Tiền ròng sau Affiliate và thuế", result.expectedNetSettlement],
  ["Hoa hồng tự nhiên", result.organicCommission], ["Hoa hồng quảng cáo", result.adsCommission], ["Phí TikTok", result.platformFees],
  ["Thuế", result.taxes], ["Giá vốn", result.soldGoodsCost], ["Vận hành đơn", result.fulfillmentCost], ["Tổn thất trạng thái đơn", result.returnLoss],
  ["Tổng chi phí", result.totalCost], ["Lợi nhuận ròng", result.netProfit], ["ROI (%)", result.roi], ["ROAS", result.roas ?? ""],
  ["Đơn hòa vốn", result.breakEvenOrders ?? ""], ["CPA hòa vốn", result.breakEvenCpa ?? ""], ["Biên ròng (%)", result.netMargin],
]; }
