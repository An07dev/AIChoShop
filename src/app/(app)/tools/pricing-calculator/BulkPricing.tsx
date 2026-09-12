"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Calculator, ChevronDown, ChevronUp, Download, FileSpreadsheet, Plus, Save, Settings2, Trash2, Upload } from "lucide-react";
import { calculatePricing } from "@/lib/pricing/engine";
import { detectCategory, getAvailableCategories, getCategoryLabel, getDefaultCategoryId, getFeeProfile, getOfficialCategory, PROGRAMS } from "@/lib/pricing/registry";
import { downloadTextFile, type PricingCalculationSnapshot } from "@/lib/pricing/storage";
import type { CostMode, FeeOverrideRecord, Platform, PricingInput, ShopType, TaxMode } from "@/lib/pricing/types";

type BatchRow = { id: string; name: string; platform: Platform; categoryId: string; quantity: number; cost: number; packaging: number; currentPrice: number };
type CommonSettings = { targetMode: "margin" | "fixed"; targetValue: number; marketingMode: CostMode; marketingValue: number; taxMode: TaxMode; manualRevenueTaxRate: number; taxableRevenueShare: number; profitTaxRate: number; cancellationRate: number; deliveryFailureRate: number; returnRate: number; roundingStep: number };
type PlatformSettings = { shopType: ShopType; enabledProgramIds: string[]; tiktokGmvMax: boolean };
type BatchResult = { row: BatchRow; snapshot: PricingCalculationSnapshot; currentMargin: number | null };

const platforms: Platform[] = ["shopee", "tiktok"];
const platformNames: Record<Platform, string> = { shopee: "Shopee", tiktok: "TikTok Shop" };
const numberFormat = new Intl.NumberFormat("vi-VN");
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const money = (value: number) => currency.format(Math.round(value));
const parseMoney = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;
const rowId = () => globalThis.crypto?.randomUUID?.() ?? `row-${Date.now()}-${Math.random()}`;

function makeRow(id = rowId()): BatchRow {
  return { id, name: "", platform: "shopee", categoryId: getDefaultCategoryId("shopee", "marketplace"), quantity: 1, cost: 0, packaging: 0, currentPrice: 0 };
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { cells.push(cell.trim()); cell = ""; }
    else cell += character;
  }
  cells.push(cell.trim());
  return cells;
}

function parseCsv(text: string, settings: Record<Platform, PlatformSettings>) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  return lines.slice(1).map(parseCsvLine).filter((cells) => cells[0]).map((cells) => {
    const platform: Platform = cells[1]?.toLowerCase().includes("tiktok") ? "tiktok" : "shopee";
    const shopType = settings[platform].shopType;
    const detected = detectCategory(cells[0], platform, shopType);
    return { id: rowId(), name: cells[0], platform, categoryId: detected?.id ?? getDefaultCategoryId(platform, shopType), quantity: Math.max(1, parseMoney(cells[2] ?? "1")), cost: parseMoney(cells[3] ?? "0"), packaging: parseMoney(cells[4] ?? "0"), currentPrice: parseMoney(cells[5] ?? "0") } satisfies BatchRow;
  });
}

function MoneyInput({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return <input aria-label={label} inputMode="numeric" value={value ? numberFormat.format(value) : ""} onChange={(event) => onChange(parseMoney(event.target.value))} className="w-full min-w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15" />;
}

function PercentInput({ value, onChange, label, max = 100 }: { value: number; onChange: (value: number) => void; label: string; max?: number }) {
  return <div className="relative"><input aria-label={label} type="number" min={0} max={max} step={0.5} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-sm font-semibold outline-none focus:border-blue-500" /><span className="absolute right-3 top-2 text-sm text-slate-400">%</span></div>;
}

function SettingField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span>{children}</label>;
}

export default function BulkPricing({ baseInput, feeOverrides, onSaveAll }: { baseInput: PricingInput; feeOverrides: FeeOverrideRecord[]; onSaveAll: (items: PricingCalculationSnapshot[]) => void }) {
  const [configOpen, setConfigOpen] = useState(true);
  const [configTab, setConfigTab] = useState<"cost" | "platform">("cost");
  const [common, setCommon] = useState<CommonSettings>({ targetMode: "margin", targetValue: 20, marketingMode: baseInput.marketingMode, marketingValue: baseInput.marketingValue, taxMode: baseInput.taxMode, manualRevenueTaxRate: baseInput.manualRevenueTaxRate, taxableRevenueShare: baseInput.taxableRevenueShare, profitTaxRate: baseInput.profitTaxRate, cancellationRate: baseInput.cancellationRate, deliveryFailureRate: baseInput.deliveryFailureRate, returnRate: baseInput.returnRate, roundingStep: 1_000 });
  const [platformSettings, setPlatformSettings] = useState<Record<Platform, PlatformSettings>>({ shopee: { shopType: "marketplace", enabledProgramIds: [], tiktokGmvMax: false }, tiktok: { shopType: "marketplace", enabledProgramIds: [], tiktokGmvMax: false } });
  const [rows, setRows] = useState<BatchRow[]>([makeRow("row-initial")]);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const updateCommon = <K extends keyof CommonSettings>(key: K, value: CommonSettings[K]) => setCommon((current) => ({ ...current, [key]: value }));
  const updatePlatform = (platform: Platform, update: Partial<PlatformSettings>) => {
    setPlatformSettings((current) => ({ ...current, [platform]: { ...current[platform], ...update } }));
    if (update.shopType) setRows((current) => current.map((row) => row.platform === platform ? { ...row, categoryId: getDefaultCategoryId(platform, update.shopType!) } : row));
  };
  const updateRow = (id: string, update: Partial<BatchRow>) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...update } : row));
    setRowErrors((current) => { const next = { ...current }; delete next[id]; return next; });
    setNotice("");
  };
  const changeRowPlatform = (row: BatchRow, platform: Platform) => updateRow(row.id, { platform, categoryId: getDefaultCategoryId(platform, platformSettings[platform].shopType) });
  const toggleProgram = (platform: Platform, programId: string) => {
    const selected = platformSettings[platform].enabledProgramIds;
    updatePlatform(platform, { enabledProgramIds: selected.includes(programId) ? selected.filter((id) => id !== programId) : [...selected, programId] });
  };

  const results = useMemo<(BatchResult | null)[]>(() => rows.map((row) => {
    if (!row.name.trim() || row.cost <= 0) return null;
    const platformConfig = platformSettings[row.platform];
    const available = getAvailableCategories(row.platform, platformConfig.shopType);
    const categoryId = available.some((category) => category.id === row.categoryId) ? row.categoryId : getDefaultCategoryId(row.platform, platformConfig.shopType);
    const adminOverride = feeOverrides.find((item) => item.platform === row.platform && item.shopType === platformConfig.shopType && item.categoryId === categoryId);
    const input: PricingInput = { ...baseInput, platform: row.platform, shopType: platformConfig.shopType, categoryId, quantity: Math.max(1, Math.floor(row.quantity)), costPerUnit: row.cost, packagingCost: row.packaging, marketingMode: common.marketingMode, marketingValue: common.marketingValue, taxMode: common.taxMode, manualRevenueTaxRate: common.manualRevenueTaxRate, taxableRevenueShare: common.taxableRevenueShare, profitTaxRate: common.profitTaxRate, cancellationRate: common.cancellationRate, deliveryFailureRate: common.deliveryFailureRate, returnRate: common.returnRate, enabledProgramIds: platformConfig.enabledProgramIds, commissionOverride: adminOverride?.commissionRate ?? null, transactionOverride: platformConfig.tiktokGmvMax && row.platform === "tiktok" ? 5 : adminOverride?.transactionRate ?? null, fixedFeeOverride: adminOverride?.orderProcessingFee ?? null };
    const result = calculatePricing(input, "target", 0, { mode: common.targetMode, value: common.targetValue, roundingStep: common.roundingStep });
    const current = row.currentPrice > 0 ? calculatePricing(input, "audit", row.currentPrice, { mode: common.targetMode, value: common.targetValue, roundingStep: common.roundingStep }) : null;
    return { row, currentMargin: current?.evaluation.expectedMargin ?? null, snapshot: { id: row.id, createdAt: new Date().toISOString(), productName: row.name.trim(), mode: "target", input, auditPrice: row.currentPrice, targetMode: common.targetMode, targetValue: common.targetValue, roundingStep: common.roundingStep, result } };
  }), [baseInput, common, feeOverrides, platformSettings, rows]);
  const validResults = results.filter((item): item is BatchResult => item !== null && item.snapshot.result.feasible);

  const calculateAll = () => {
    const errors: Record<string, string> = {};
    rows.forEach((row) => { if (!row.name.trim()) errors[row.id] = "Nhập tên sản phẩm"; else if (row.cost <= 0) errors[row.id] = "Giá vốn phải lớn hơn 0"; });
    setRowErrors(errors);
    setHasCalculated(true);
    setNotice(Object.keys(errors).length ? `Có ${Object.keys(errors).length} dòng cần bổ sung dữ liệu.` : `Đã tính ${rows.length} sản phẩm. Kết quả sẽ tự cập nhật khi bạn sửa số liệu.`);
  };
  const saveAll = () => {
    if (!hasCalculated || !validResults.length) return;
    const createdAt = new Date().toISOString();
    onSaveAll(validResults.map(({ snapshot }, index) => ({ ...snapshot, id: globalThis.crypto?.randomUUID?.() ?? `batch-${createdAt}-${index}`, createdAt })));
    setNotice(`Đã lưu ${validResults.length} sản phẩm vào danh sách.`);
  };
  const exportRows = () => validResults.map(({ row, snapshot, currentMargin }) => {
    const evaluation = snapshot.result.evaluation;
    const category = getOfficialCategory(snapshot.input.categoryId);
    return { "Tên sản phẩm": row.name, "Nền tảng": platformNames[row.platform], "Loại shop": snapshot.input.shopType === "mall" ? "Mall" : "Shop thường", "Ngành cấp 3": category ? getCategoryLabel(category) : snapshot.input.categoryId, "Số lượng": row.quantity, "Giá vốn": row.cost, "Đóng gói": row.packaging, "Giá bán hiện tại": row.currentPrice || "", "Biên giá hiện tại (%)": currentMargin ?? "", "Giá hòa vốn": snapshot.result.breakEvenPrice ?? "", "Giá đề xuất": evaluation.listPrice, "Sàn giải ngân": evaluation.payout, "Thuế": evaluation.tax, "Lãi đơn thành công": evaluation.profitOnSuccess, "Lãi kỳ vọng/đơn": evaluation.expectedProfitPerOrder, "Biên lợi nhuận (%)": Number(evaluation.expectedMargin.toFixed(2)), "ROI (%)": Number(evaluation.roiOnCogs.toFixed(2)) };
  });
  const exportFile = async (format: "csv" | "xlsx") => {
    if (!hasCalculated || !validResults.length) { setNotice("Hãy tính hàng loạt trước khi xuất dữ liệu."); return; }
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.json_to_sheet(exportRows());
    if (format === "xlsx") { const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, "Định giá hàng loạt"); XLSX.writeFile(workbook, "aichoshop-dinh-gia-hang-loat.xlsx"); }
    else downloadTextFile("aichoshop-dinh-gia-hang-loat.csv", `\uFEFF${XLSX.utils.sheet_to_csv(sheet)}`, "text/csv;charset=utf-8");
  };
  const downloadTemplate = () => downloadTextFile("aichoshop-mau-dinh-gia-hang-loat.csv", "\uFEFFTên sản phẩm,Nền tảng,Số lượng,Giá vốn,Chi phí đóng gói,Giá bán hiện tại (tùy chọn)\r\nÁo polo nam,Shopee,1,50000,5000,150000\r\nÁo thun nữ,TikTok Shop,1,70000,5000,", "text/csv;charset=utf-8");
  const upload = async (file?: File) => {
    if (!file) return;
    const parsed = parseCsv(await file.text(), platformSettings);
    if (!parsed.length) { setNotice("Không đọc được sản phẩm. Hãy dùng đúng file CSV mẫu."); return; }
    setRows(parsed); setHasCalculated(false); setRowErrors({}); setNotice(`Đã nhập ${parsed.length} sản phẩm. Nhấn “Tính toán hàng loạt” để xem kết quả.`);
  };

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button onClick={() => setConfigOpen((open) => !open)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"><span><strong className="flex items-center gap-2 text-base"><Settings2 size={19} className="text-blue-600" /> Cấu hình chi phí và lợi nhuận chung</strong><span className="mt-1 block text-xs text-slate-500">Các thiết lập được áp dụng đồng thời cho tất cả sản phẩm trong bảng.</span></span><span className="flex items-center gap-1 text-sm font-bold text-blue-600">{configOpen ? "Thu gọn" : "Mở rộng"}{configOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span></button>
      {configOpen && <div className="border-t p-5">
        <div className="mb-5 grid max-w-xl grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-bold"><button onClick={() => setConfigTab("cost")} className={`rounded-lg px-4 py-2.5 ${configTab === "cost" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Chi phí và lợi nhuận</button><button onClick={() => setConfigTab("platform")} className={`rounded-lg px-4 py-2.5 ${configTab === "platform" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Cấu hình nền tảng sàn</button></div>
        {configTab === "cost" ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <SettingField label="Lợi nhuận mong muốn"><div className="flex overflow-hidden rounded-lg border"><select value={common.targetMode} onChange={(event) => updateCommon("targetMode", event.target.value as CommonSettings["targetMode"])} className="w-28 border-r bg-slate-100 px-2 text-xs font-bold"><option value="margin">% doanh thu</option><option value="fixed">đ/đơn</option></select>{common.targetMode === "fixed" ? <MoneyInput label="Lợi nhuận mong muốn" value={common.targetValue} onChange={(value) => updateCommon("targetValue", value)} /> : <PercentInput label="Lợi nhuận mong muốn" value={common.targetValue} onChange={(value) => updateCommon("targetValue", value)} max={95} />}</div></SettingField>
          <SettingField label="Chi phí quảng cáo"><div className="flex overflow-hidden rounded-lg border"><select value={common.marketingMode} onChange={(event) => updateCommon("marketingMode", event.target.value as CostMode)} className="w-24 border-r bg-slate-100 px-2 text-xs font-bold"><option value="percent">% GMV</option><option value="fixed">đ/đơn</option></select>{common.marketingMode === "fixed" ? <MoneyInput label="Chi phí quảng cáo" value={common.marketingValue} onChange={(value) => updateCommon("marketingValue", value)} /> : <PercentInput label="Chi phí quảng cáo" value={common.marketingValue} onChange={(value) => updateCommon("marketingValue", value)} />}</div></SettingField>
          <SettingField label="Tỷ lệ hủy đơn"><PercentInput label="Tỷ lệ hủy đơn" value={common.cancellationRate} onChange={(value) => updateCommon("cancellationRate", value)} /></SettingField><SettingField label="Giao thất bại"><PercentInput label="Tỷ lệ giao thất bại" value={common.deliveryFailureRate} onChange={(value) => updateCommon("deliveryFailureRate", value)} /></SettingField><SettingField label="Tỷ lệ hoàn/trả"><PercentInput label="Tỷ lệ hoàn trả" value={common.returnRate} onChange={(value) => updateCommon("returnRate", value)} /></SettingField>
          <SettingField label="Bước làm tròn"><select value={common.roundingStep} onChange={(event) => updateCommon("roundingStep", Number(event.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><option value={1}>1 ₫</option><option value={1000}>1.000 ₫</option><option value={5000}>5.000 ₫</option><option value={10000}>10.000 ₫</option></select></SettingField>
          <div className="sm:col-span-2 lg:col-span-4 xl:col-span-6"><div className="grid gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4"><SettingField label="Cách tính thuế"><select value={common.taxMode} onChange={(event) => updateCommon("taxMode", event.target.value as TaxMode)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="household_exempt">Hộ/cá nhân ≤ 500 triệu/năm</option><option value="household_revenue">Hộ/cá nhân tính trên doanh thu</option><option value="profit_based">Tính trên lợi nhuận</option><option value="manual">Tỷ lệ doanh thu tự nhập</option></select></SettingField>{common.taxMode === "household_revenue" && <SettingField label="Phần doanh thu chịu TNCN"><PercentInput label="Phần doanh thu chịu TNCN" value={common.taxableRevenueShare} onChange={(value) => updateCommon("taxableRevenueShare", value)} /></SettingField>}{common.taxMode === "profit_based" && <SettingField label="Thuế suất lợi nhuận"><PercentInput label="Thuế suất lợi nhuận" value={common.profitTaxRate} onChange={(value) => updateCommon("profitTaxRate", value)} /></SettingField>}{common.taxMode === "manual" && <SettingField label="Thuế trên doanh thu"><PercentInput label="Thuế trên doanh thu" value={common.manualRevenueTaxRate} onChange={(value) => updateCommon("manualRevenueTaxRate", value)} /></SettingField>}</div></div>
        </div> : <div className="grid gap-4 lg:grid-cols-2">{platforms.map((platform) => {
          const setting = platformSettings[platform]; const profile = getFeeProfile(platform, setting.shopType, getDefaultCategoryId(platform, setting.shopType));
          return <div key={platform} className={`rounded-xl border p-4 ${platform === "shopee" ? "border-orange-200 bg-orange-50/60" : "border-emerald-200 bg-emerald-50/60"}`}><div className="mb-4 flex items-center justify-between"><strong>Cấu hình {platformNames[platform]}</strong><span className={`rounded-full px-2 py-1 text-[10px] font-black text-white ${platform === "shopee" ? "bg-orange-500" : "bg-emerald-600"}`}>{platformNames[platform]}</span></div><SettingField label="Loại shop"><select value={setting.shopType} onChange={(event) => updatePlatform(platform, { shopType: event.target.value as ShopType })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><option value="marketplace">Shop thường</option><option value="mall">Mall</option></select></SettingField><div className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-600">Phí giao dịch mặc định: <strong>{profile.transactionRate}%</strong> · Phí theo đơn: <strong>{money(profile.orderProcessingFee)}</strong> · Hoa hồng lấy theo ngành cấp 3 của từng dòng.</div><div className="mt-3 space-y-2">{platform === "tiktok" && <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-emerald-200 bg-white p-3 text-xs"><input className="mt-0.5" type="checkbox" checked={setting.tiktokGmvMax} onChange={(event) => updatePlatform(platform, { tiktokGmvMax: event.target.checked })} /><span><strong className="block">Ưu đãi giao dịch GMV Max: 5%</strong>Chỉ bật khi Seller Center xác nhận shop đủ điều kiện.</span></label>}{PROGRAMS[platform].map((program) => <label key={program.id} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs"><input className="mt-0.5" type="checkbox" checked={setting.enabledProgramIds.includes(program.id)} onChange={() => toggleProgram(platform, program.id)} /><span><strong className="block">{program.name}: {program.rate}%{program.cap ? `, tối đa ${money(program.cap)}` : ""}</strong>{program.note}</span></label>)}</div></div>;
        })}</div>}
      </div>}
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b px-5 py-5 xl:flex-row xl:items-center xl:justify-between"><div><h2 className="flex items-center gap-2 text-lg font-black"><FileSpreadsheet size={21} className="text-emerald-600" /> Bảng tính định giá hàng loạt</h2><p className="mt-1 text-sm text-slate-500">Nhập trực tiếp hoặc tải CSV; mỗi sản phẩm có nền tảng và ngành cấp 3 riêng.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setRows((current) => [...current, makeRow()])} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700"><Plus size={15} /> Thêm sản phẩm</button><label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700"><Upload size={15} /> Nhập CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => upload(event.target.files?.[0])} /></label><button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"><Download size={15} /> File mẫu</button><button onClick={() => { setRows([]); setHasCalculated(false); setRowErrors({}); setNotice(""); }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-rose-600"><Trash2 size={15} /> Xóa tất cả</button><button onClick={calculateAll} disabled={!rows.length} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm disabled:opacity-40"><Calculator size={15} /> Tính toán hàng loạt</button></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1680px] text-left text-sm"><thead className="bg-slate-950 text-xs text-white"><tr><th className="w-12 px-3 py-3 text-center">#</th><th className="w-56 px-3 py-3">Tên sản phẩm</th><th className="w-36 px-3 py-3">Nền tảng</th><th className="w-72 px-3 py-3">Ngành cấp 3</th><th className="w-24 px-3 py-3">SL</th><th className="w-36 px-3 py-3 text-right">Giá vốn</th><th className="w-36 px-3 py-3 text-right">Đóng gói</th><th className="w-40 px-3 py-3 text-right">Giá hiện tại</th><th className="w-36 px-3 py-3 text-right">Hòa vốn</th><th className="w-36 px-3 py-3 text-right">Giá đề xuất</th><th className="w-32 px-3 py-3 text-right">Thuế</th><th className="w-40 px-3 py-3 text-right">Lãi kỳ vọng</th><th className="w-24 px-3 py-3 text-right">Biên</th><th className="w-14 px-3 py-3"></th></tr></thead><tbody className="divide-y divide-slate-200">{rows.map((row, index) => {
        const shopType = platformSettings[row.platform].shopType; const categories = getAvailableCategories(row.platform, shopType); const result = hasCalculated ? results[index] : null; const evaluation = result?.snapshot.result.evaluation;
        return <tr key={row.id} className={rowErrors[row.id] ? "bg-rose-50" : "hover:bg-slate-50/70"}><td className="px-3 py-3 text-center font-bold text-slate-400">{index + 1}</td><td className="px-3 py-3"><input aria-label={`Tên sản phẩm dòng ${index + 1}`} value={row.name} onChange={(event) => updateRow(row.id, { name: event.target.value })} placeholder="Nhập tên sản phẩm" className={`w-full rounded-lg border bg-slate-50 px-3 py-2 font-semibold outline-none focus:border-blue-500 ${rowErrors[row.id] ? "border-rose-400" : "border-slate-200"}`} />{rowErrors[row.id] && <p className="mt-1 text-[10px] font-bold text-rose-600">{rowErrors[row.id]}</p>}</td><td className="px-3 py-3"><select aria-label={`Nền tảng dòng ${index + 1}`} value={row.platform} onChange={(event) => changeRowPlatform(row, event.target.value as Platform)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 font-semibold"><option value="shopee">Shopee</option><option value="tiktok">TikTok Shop</option></select></td><td className="px-3 py-3"><select aria-label={`Ngành hàng dòng ${index + 1}`} value={categories.some((category) => category.id === row.categoryId) ? row.categoryId : categories[0]?.id} onChange={(event) => updateRow(row.id, { categoryId: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs">{categories.map((category) => <option key={category.id} value={category.id}>{category.level3} — {shopType === "mall" ? category.mallRate : category.marketplaceRate}%</option>)}</select></td><td className="px-3 py-3"><input aria-label={`Số lượng dòng ${index + 1}`} type="number" min={1} value={row.quantity} onChange={(event) => updateRow(row.id, { quantity: Math.max(1, Number(event.target.value)) })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center font-semibold" /></td><td className="px-3 py-3"><MoneyInput label={`Giá vốn dòng ${index + 1}`} value={row.cost} onChange={(value) => updateRow(row.id, { cost: value })} /></td><td className="px-3 py-3"><MoneyInput label={`Đóng gói dòng ${index + 1}`} value={row.packaging} onChange={(value) => updateRow(row.id, { packaging: value })} /></td><td className="px-3 py-3"><MoneyInput label={`Giá hiện tại dòng ${index + 1}`} value={row.currentPrice} onChange={(value) => updateRow(row.id, { currentPrice: value })} /></td><td className="px-3 py-3 text-right font-mono font-bold text-slate-700">{result?.snapshot.result.breakEvenPrice == null ? "—" : money(result.snapshot.result.breakEvenPrice)}</td><td className="px-3 py-3 text-right font-mono font-black text-emerald-700">{evaluation ? money(evaluation.listPrice) : "—"}</td><td className="px-3 py-3 text-right font-mono">{evaluation ? money(evaluation.tax) : "—"}</td><td className={`px-3 py-3 text-right font-mono font-bold ${evaluation && evaluation.expectedProfitPerOrder < 0 ? "text-rose-600" : "text-blue-700"}`}>{evaluation ? money(evaluation.expectedProfitPerOrder) : "—"}</td><td className={`px-3 py-3 text-right font-bold ${evaluation && evaluation.expectedMargin < 0 ? "text-rose-600" : "text-emerald-700"}`}>{evaluation ? `${evaluation.expectedMargin.toFixed(1)}%` : "—"}</td><td className="px-3 py-3"><button aria-label={`Xóa ${row.name || `dòng ${index + 1}`}`} onClick={() => { setRows((current) => current.filter((item) => item.id !== row.id)); setRowErrors((current) => { const next = { ...current }; delete next[row.id]; return next; }); }} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 size={16} /></button></td></tr>;
      })}</tbody></table></div>
      {!rows.length && <div className="px-5 py-12 text-center text-sm text-slate-500">Chưa có sản phẩm. Nhấn “Thêm sản phẩm” hoặc nhập file CSV.</div>}
      <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div>{notice && <p className={`text-sm font-semibold ${Object.keys(rowErrors).length ? "text-rose-600" : "text-emerald-700"}`}>{notice}</p>}</div><div className="flex flex-wrap gap-2"><button disabled={!hasCalculated || !validResults.length} onClick={saveAll} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><Save size={14} /> Lưu tất cả</button><button disabled={!hasCalculated || !validResults.length} onClick={() => exportFile("xlsx")} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-40"><Download size={14} /> Xuất Excel</button><button disabled={!hasCalculated || !validResults.length} onClick={() => exportFile("csv")} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-40"><Download size={14} /> Xuất CSV</button></div></div>
    </section>
  </div>;
}
