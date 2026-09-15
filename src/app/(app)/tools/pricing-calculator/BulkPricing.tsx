"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Calculator, ChevronDown, ChevronUp, Download, FileSpreadsheet, Plus, Save, Settings2, Trash2, Upload } from "lucide-react";
import { calculatePricing } from "@/lib/pricing/engine";
import { resolveFeeProfile } from "@/lib/pricing/fee-resolver";
import { csvNumber, MAX_CSV_ROWS, parseCsv, safeSpreadsheetRows } from "@/lib/pricing/csv";
import { detectCategory, getAvailableCategories, getAvailablePrograms, getCategoryLabel, getDefaultCategoryId, getFeeProfile, getOfficialCategory } from "@/lib/pricing/registry";
import { downloadTextFile, type PricingCalculationSnapshot } from "@/lib/pricing/storage";
import type { CostMode, FeeOverrideRecord, Platform, PricingInput, ShopType, TaxMode } from "@/lib/pricing/types";

type BatchRow = {
  id: string;
  name: string;
  platform: Platform;
  externalChannel: "facebook" | "website" | "youtube" | "other";
  categoryId: string;
  quantity: number;
  cost: number;
  packaging: number;
  currentPrice: number;
  needsCategoryReview?: boolean;
};

type CommonSettings = {
  targetMode: "margin" | "fixed";
  targetValue: number;
  marketingMode: CostMode;
  marketingValue: number;
  taxMode: TaxMode;
  manualRevenueTaxRate: number;
  taxableRevenueShare: number;
  profitTaxRate: number;
  cancellationRate: number;
  deliveryFailureRate: number;
  returnRate: number;
  roundingStep: number;
};

type PlatformSettings = {
  shopType: ShopType;
  enabledProgramIds: string[];
  tiktokGmvMax: boolean;
  paymentFeeRate: number;
  codFeeRate: number;
  fixedOrderFee: number;
};

type BatchResult = { row: BatchRow; snapshot: PricingCalculationSnapshot; currentMargin: number | null };

const platforms: Platform[] = ["shopee", "tiktok", "external"];
const platformNames: Record<Platform, string> = { shopee: "Shopee", tiktok: "TikTok Shop", external: "Đơn ngoài" };
const numberFormat = new Intl.NumberFormat("vi-VN");
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const money = (value: number) => currency.format(Math.round(value));
const parseMoney = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;
const rowId = () => globalThis.crypto?.randomUUID?.() ?? `row-${Date.now()}-${Math.random()}`;

function makeRow(platform: Platform, id = rowId()): BatchRow {
  return {
    id,
    name: "",
    platform,
    externalChannel: "facebook",
    categoryId: getDefaultCategoryId(platform, "marketplace"),
    quantity: 1,
    cost: 0,
    packaging: 0,
    currentPrice: 0,
  };
}

function parseBatchCsv(text: string, settings: Record<Platform, PlatformSettings>, worksheet: Platform) {
  const parsed = parseCsv(text);
  if (parsed.errors.length) return { rows: [] as BatchRow[], errors: parsed.errors, warnings: [] as { id: string; message: string }[] };
  const errors: string[] = [];
  const warnings: { id: string; message: string }[] = [];
  const rows = parsed.records.slice(1).filter(({ cells }) => cells[0]).map(({ cells, line }) => {
      const platform = worksheet;
      const shopType = settings[platform].shopType;
      const detected = detectCategory(cells[0], platform, shopType);
      const columnOffset = platform === "external" ? 1 : 0;
      const quantity = csvNumber(cells[1 + columnOffset] ?? "1");
      const cost = csvNumber(cells[2 + columnOffset] ?? "0");
      const packaging = csvNumber(cells[3 + columnOffset] ?? "0");
      const currentPrice = csvNumber(cells[4 + columnOffset] ?? "0");
      if (quantity === null || !Number.isInteger(quantity) || quantity < 1) errors.push(`Dòng ${line}: số lượng phải là số nguyên từ 1 trở lên.`);
      if (cost === null || cost < 0) errors.push(`Dòng ${line}: giá vốn không hợp lệ.`);
      if (packaging === null || packaging < 0 || currentPrice === null || currentPrice < 0) errors.push(`Dòng ${line}: chi phí hoặc giá bán không hợp lệ.`);
      const id = rowId();
      if (!detected && platform !== "external") warnings.push({ id, message: `Dòng ${line}: chưa nhận diện chắc chắn ngành; hãy chọn thủ công.` });
      return {
        id,
        name: cells[0],
        platform,
        externalChannel:
          platform === "external" && ["facebook", "website", "youtube"].includes(cells[1]?.toLowerCase())
            ? (cells[1].toLowerCase() as BatchRow["externalChannel"])
            : "facebook",
        categoryId: detected?.id ?? getDefaultCategoryId(platform, shopType),
        quantity: quantity ?? 0,
        cost: cost ?? 0,
        packaging: packaging ?? 0,
        currentPrice: currentPrice ?? 0,
        needsCategoryReview: !detected && platform !== "external",
      } satisfies BatchRow;
    });
  if (!rows.length) errors.push("CSV không có dòng dữ liệu.");
  return { rows, errors, warnings };
}

function MoneyInput({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return (
    <div className="relative flex items-center">
      <input
        aria-label={label}
        inputMode="numeric"
        value={value ? numberFormat.format(value) : ""}
        onChange={(event) => onChange(parseMoney(event.target.value))}
        className="w-full min-w-24 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 pr-7 text-right text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <span className="pointer-events-none absolute right-2 text-xs text-slate-400">₫</span>
    </div>
  );
}

function PercentInput({
  value,
  onChange,
  label,
  max = 100,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  max?: number;
}) {
  return (
    <div className="relative flex items-center">
      <input
        aria-label={label}
        type="number"
        min={0}
        max={max}
        step={0.5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 pr-7 text-right text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <span className="pointer-events-none absolute right-2 text-xs font-bold text-slate-400">%</span>
    </div>
  );
}

function SettingField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}

export default function BulkPricing({
  baseInput,
  feeOverrides,
  onSaveAll,
}: {
  baseInput: PricingInput;
  feeOverrides: FeeOverrideRecord[];
  onSaveAll: (items: PricingCalculationSnapshot[]) => void;
}) {
  const [configOpen, setConfigOpen] = useState(true);
  const [activeSheet, setActiveSheet] = useState<Platform>("shopee");
  const [configTab, setConfigTab] = useState<"cost" | "platform">("cost");
  const [common, setCommon] = useState<CommonSettings>({
    targetMode: "margin",
    targetValue: 20,
    marketingMode: baseInput.marketingMode,
    marketingValue: baseInput.marketingValue,
    taxMode: baseInput.taxMode,
    manualRevenueTaxRate: baseInput.manualRevenueTaxRate,
    taxableRevenueShare: baseInput.taxableRevenueShare,
    profitTaxRate: baseInput.profitTaxRate,
    cancellationRate: baseInput.cancellationRate,
    deliveryFailureRate: baseInput.deliveryFailureRate,
    returnRate: baseInput.returnRate,
    roundingStep: 1_000,
  });
  const [platformSettings, setPlatformSettings] = useState<Record<Platform, PlatformSettings>>({
    shopee: { shopType: "marketplace", enabledProgramIds: [], tiktokGmvMax: false, paymentFeeRate: 0, codFeeRate: 0, fixedOrderFee: 0 },
    tiktok: { shopType: "marketplace", enabledProgramIds: [], tiktokGmvMax: false, paymentFeeRate: 0, codFeeRate: 0, fixedOrderFee: 0 },
    external: { shopType: "marketplace", enabledProgramIds: [], tiktokGmvMax: false, paymentFeeRate: 0, codFeeRate: 0, fixedOrderFee: 0 },
  });
  const [rows, setRows] = useState<BatchRow[]>([
    makeRow("shopee", "row-shopee"),
    makeRow("tiktok", "row-tiktok"),
    makeRow("external", "row-external"),
  ]);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const updateCommon = <K extends keyof CommonSettings>(key: K, value: CommonSettings[K]) =>
    setCommon((current) => ({ ...current, [key]: value }));

  const updatePlatform = (platform: Platform, update: Partial<PlatformSettings>) => {
    setPlatformSettings((current) => ({ ...current, [platform]: { ...current[platform], ...update } }));
    if (update.shopType)
      setRows((current) =>
        current.map((row) =>
          row.platform === platform ? { ...row, categoryId: getDefaultCategoryId(platform, update.shopType!) } : row
        )
      );
  };

  const updateRow = (id: string, update: Partial<BatchRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...update, ...(update.categoryId ? { needsCategoryReview: false } : {}) } : row)));
    setRowErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setNotice("");
  };

  const toggleProgram = (platform: Platform, programId: string) => {
    const selected = platformSettings[platform].enabledProgramIds;
    updatePlatform(platform, {
      enabledProgramIds: selected.includes(programId)
        ? selected.filter((id) => id !== programId)
        : [...selected, programId],
    });
  };

  const results = useMemo<(BatchResult | null)[]>(
    () =>
      rows.map((row) => {
        if (!row.name.trim() || row.cost <= 0 || row.needsCategoryReview) return null;
        const platformConfig = platformSettings[row.platform];
        const available = getAvailableCategories(row.platform, platformConfig.shopType);
        const categoryId = available.some((category) => category.id === row.categoryId)
          ? row.categoryId
          : getDefaultCategoryId(row.platform, platformConfig.shopType);
        const resolvedFee = resolveFeeProfile(row.platform, platformConfig.shopType, categoryId, feeOverrides);
        const input: PricingInput = {
          ...baseInput,
          platform: row.platform,
          externalChannel: row.externalChannel,
          shopType: platformConfig.shopType,
          categoryId,
          quantity: Math.max(1, Math.floor(row.quantity)),
          costPerUnit: row.cost,
          packagingCost: row.packaging,
          marketingMode: common.marketingMode,
          marketingValue: common.marketingValue,
          taxMode: common.taxMode,
          manualRevenueTaxRate: common.manualRevenueTaxRate,
          taxableRevenueShare: common.taxableRevenueShare,
          profitTaxRate: common.profitTaxRate,
          cancellationRate: common.cancellationRate,
          deliveryFailureRate: common.deliveryFailureRate,
          returnRate: common.returnRate,
          enabledProgramIds: platformConfig.enabledProgramIds,
          commissionOverride: row.platform === "external" ? platformConfig.paymentFeeRate : resolvedFee.commissionRate,
          transactionOverride:
            row.platform === "external"
              ? platformConfig.codFeeRate
              : platformConfig.tiktokGmvMax && row.platform === "tiktok"
              ? 5
              : resolvedFee.transactionRate,
          fixedFeeOverride: row.platform === "external" ? platformConfig.fixedOrderFee : resolvedFee.orderProcessingFee,
        };
        const result = calculatePricing(input, "target", 0, {
          mode: common.targetMode,
          value: common.targetValue,
          roundingStep: common.roundingStep,
        });
        const current =
          row.currentPrice > 0
            ? calculatePricing(input, "audit", row.currentPrice, {
                mode: common.targetMode,
                value: common.targetValue,
                roundingStep: common.roundingStep,
              })
            : null;
        return {
          row,
          currentMargin: current?.evaluation.expectedMargin ?? null,
          snapshot: {
            id: row.id,
            createdAt: new Date().toISOString(),
            productName: row.name.trim(),
            mode: "target",
            input,
            auditPrice: row.currentPrice,
            targetMode: common.targetMode,
            targetValue: common.targetValue,
            roundingStep: common.roundingStep,
            result,
            feeVersion: resolvedFee.dataVersion,
            feeSource: resolvedFee.sourceName,
          },
        };
      }),
    [baseInput, common, feeOverrides, platformSettings, rows]
  );

  const visibleRows = rows.filter((row) => row.platform === activeSheet);
  const resultById = new Map(
    results.filter((item): item is BatchResult => item !== null).map((item) => [item.row.id, item])
  );
  const validResults = visibleRows
    .map((row) => resultById.get(row.id))
    .filter((item): item is BatchResult => Boolean(item?.snapshot.result.feasible));

  const calculateAll = () => {
    const errors: Record<string, string> = {};
    visibleRows.forEach((row) => {
      if (!row.name.trim()) errors[row.id] = "Nhập tên sản phẩm";
      else if (row.cost <= 0) errors[row.id] = "Giá vốn phải lớn hơn 0";
      else if (row.needsCategoryReview) errors[row.id] = "Hãy chọn ngành thủ công";
    });
    setRowErrors(errors);
    setHasCalculated(true);
    setNotice(
      Object.keys(errors).length
        ? `Có ${Object.keys(errors).length} dòng cần bổ sung dữ liệu.`
        : `Đã tính ${visibleRows.length} sản phẩm ${platformNames[activeSheet]}. Kết quả sẽ tự cập nhật khi bạn sửa số liệu.`
    );
  };

  const saveAll = () => {
    if (!hasCalculated || !validResults.length) return;
    const createdAt = new Date().toISOString();
    onSaveAll(
      validResults.map(({ snapshot }, index) => ({
        ...snapshot,
        id: globalThis.crypto?.randomUUID?.() ?? `batch-${createdAt}-${index}`,
        createdAt,
      }))
    );
    setNotice(`Đã lưu ${validResults.length} sản phẩm vào danh sách.`);
  };

  const exportRows = () =>
    validResults.map(({ row, snapshot, currentMargin }) => {
      const evaluation = snapshot.result.evaluation;
      const category = getOfficialCategory(snapshot.input.categoryId);
      return {
        "Tên sản phẩm": row.name,
        "Nền tảng": platformNames[row.platform],
        "Loại shop": snapshot.input.shopType === "mall" ? "Mall" : "Shop thường",
        "Ngành cấp 3": category ? getCategoryLabel(category) : snapshot.input.categoryId,
        "Số lượng": row.quantity,
        "Giá vốn": row.cost,
        "Đóng gói": row.packaging,
        "Giá bán hiện tại": row.currentPrice || "",
        "Biên giá hiện tại (%)": currentMargin ?? "",
        "Giá hòa vốn": snapshot.result.breakEvenPrice ?? "",
        "Giá đề xuất": evaluation.listPrice,
        "Sàn giải ngân": evaluation.payout,
        Thuế: evaluation.tax,
        "Lãi đơn thành công": evaluation.profitOnSuccess,
        "Lãi kỳ vọng/đơn": evaluation.expectedProfitPerOrder,
        "Biên lợi nhuận (%)": Number(evaluation.expectedMargin.toFixed(2)),
        "ROI (%)": Number(evaluation.roiOnCogs.toFixed(2)),
      };
    });

  const exportFile = async (format: "csv" | "xlsx") => {
    if (!hasCalculated || !validResults.length) {
      setNotice("Hãy tính hàng loạt trước khi xuất dữ liệu.");
      return;
    }
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.json_to_sheet(safeSpreadsheetRows(exportRows()));
    if (format === "xlsx") {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Định giá hàng loạt");
      XLSX.writeFile(workbook, "aichoshop-dinh-gia-hang-loat.xlsx");
    } else {
      downloadTextFile("aichoshop-dinh-gia-hang-loat.csv", `\uFEFF${XLSX.utils.sheet_to_csv(sheet)}`, "text/csv;charset=utf-8");
    }
  };

  const downloadTemplate = () =>
    downloadTextFile(
      `aichoshop-mau-${activeSheet}.csv`,
      activeSheet === "external"
        ? "\uFEFFTên sản phẩm,Kênh bán,Số lượng,Giá vốn,Chi phí đóng gói,Giá bán hiện tại (tùy chọn)\r\nÁo thun,Facebook,1,50000,5000,150000\r\nKhóa học online,YouTube,1,70000,0,"
        : "\uFEFFTên sản phẩm,Số lượng,Giá vốn,Chi phí đóng gói,Giá bán hiện tại (tùy chọn)\r\nÁo polo nam,1,50000,5000,150000\r\nÁo thun nữ,1,70000,5000,",
      "text/csv;charset=utf-8"
    );

  const upload = async (file?: File) => {
    if (!file) return;
    const parsed = parseBatchCsv(await file.text(), platformSettings, activeSheet);
    if (parsed.errors.length || !parsed.rows.length) {
      setNotice(parsed.errors.slice(0, 5).join(" ") || "Không đọc được sản phẩm. Hãy dùng đúng file CSV mẫu.");
      return;
    }
    if (parsed.rows.length > MAX_CSV_ROWS) { setNotice(`Chỉ hỗ trợ tối đa ${MAX_CSV_ROWS} sản phẩm.`); return; }
    setRows((current) => [...current.filter((row) => row.platform !== activeSheet), ...parsed.rows]);
    setHasCalculated(false);
    setRowErrors(Object.fromEntries(parsed.warnings.map((item) => [item.id, item.message])));
    setNotice(`Đã nhập ${parsed.rows.length} sản phẩm vào trang ${platformNames[activeSheet]}.${parsed.warnings.length ? ` Có ${parsed.warnings.length} dòng cần chọn ngành thủ công.` : ""} Nhấn “Tính toán hàng loạt” để xem kết quả.`);
  };

  return (
    <div className="space-y-6">
      {/* Platform Navigation Tabs */}
      <nav
        aria-label="Trang tính theo kênh"
        className="grid overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xs sm:grid-cols-3"
      >
        {platforms.map((platform) => {
          const isActive = activeSheet === platform;
          return (
            <button
              key={platform}
              type="button"
              onClick={() => {
                setActiveSheet(platform);
                setHasCalculated(false);
                setRowErrors({});
                setNotice("");
              }}
              className={`rounded-xl px-4 py-3 text-sm font-black transition-all cursor-pointer ${
                isActive
                  ? platform === "shopee"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                    : platform === "tiktok"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                    : "btn-brand-cta text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {platform === "shopee"
                ? "Trang tính Shopee"
                : platform === "tiktok"
                ? "Trang tính TikTok Shop"
                : "Trang tính Đơn ngoài"}
            </button>
          );
        })}
      </nav>

      {/* Common Configuration Accordion */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
        <button
          type="button"
          onClick={() => setConfigOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          <span>
            <strong className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <Settings2 size={19} className="text-brand" /> Cấu hình chi phí và lợi nhuận chung
            </strong>
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
              Các thiết lập được áp dụng đồng thời cho tất cả sản phẩm trong bảng.
            </span>
          </span>
          <span className="flex items-center gap-1 text-sm font-bold text-brand">
            {configOpen ? "Thu gọn" : "Mở rộng"}
            {configOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        {configOpen && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 p-5">
            <div className="mb-5 grid max-w-xl grid-cols-2 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 text-sm font-bold">
              <button
                type="button"
                onClick={() => setConfigTab("cost")}
                className={`rounded-xl px-4 py-2.5 transition-all cursor-pointer ${
                  configTab === "cost"
                    ? "bg-white dark:bg-slate-700 text-brand shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Chi phí và lợi nhuận
              </button>
              <button
                type="button"
                onClick={() => setConfigTab("platform")}
                className={`rounded-xl px-4 py-2.5 transition-all cursor-pointer ${
                  configTab === "platform"
                    ? "bg-white dark:bg-slate-700 text-brand shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Cấu hình nền tảng sàn
              </button>
            </div>

            {configTab === "cost" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                <SettingField label="Lợi nhuận mong muốn">
                  <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <select
                      value={common.targetMode}
                      onChange={(event) => updateCommon("targetMode", event.target.value as CommonSettings["targetMode"])}
                      className="w-28 border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                    >
                      <option value="margin">% doanh thu</option>
                      <option value="fixed">đ / đơn</option>
                    </select>
                    {common.targetMode === "fixed" ? (
                      <MoneyInput
                        label="Lợi nhuận mong muốn"
                        value={common.targetValue}
                        onChange={(value) => updateCommon("targetValue", value)}
                      />
                    ) : (
                      <PercentInput
                        label="Lợi nhuận mong muốn"
                        value={common.targetValue}
                        onChange={(value) => updateCommon("targetValue", value)}
                        max={95}
                      />
                    )}
                  </div>
                </SettingField>

                <SettingField label="Chi phí quảng cáo">
                  <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <select
                      value={common.marketingMode}
                      onChange={(event) => updateCommon("marketingMode", event.target.value as CostMode)}
                      className="w-24 border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                    >
                      <option value="percent">% GMV</option>
                      <option value="fixed">đ / đơn</option>
                    </select>
                    {common.marketingMode === "fixed" ? (
                      <MoneyInput
                        label="Chi phí quảng cáo"
                        value={common.marketingValue}
                        onChange={(value) => updateCommon("marketingValue", value)}
                      />
                    ) : (
                      <PercentInput
                        label="Chi phí quảng cáo"
                        value={common.marketingValue}
                        onChange={(value) => updateCommon("marketingValue", value)}
                      />
                    )}
                  </div>
                </SettingField>

                <SettingField label="Tỷ lệ hủy đơn">
                  <PercentInput
                    label="Tỷ lệ hủy đơn"
                    value={common.cancellationRate}
                    onChange={(value) => updateCommon("cancellationRate", value)}
                  />
                </SettingField>

                <SettingField label="Giao thất bại">
                  <PercentInput
                    label="Tỷ lệ giao thất bại"
                    value={common.deliveryFailureRate}
                    onChange={(value) => updateCommon("deliveryFailureRate", value)}
                  />
                </SettingField>

                <SettingField label="Tỷ lệ hoàn/trả">
                  <PercentInput
                    label="Tỷ lệ hoàn trả"
                    value={common.returnRate}
                    onChange={(value) => updateCommon("returnRate", value)}
                  />
                </SettingField>

                <SettingField label="Bước làm tròn">
                  <select
                    value={common.roundingStep}
                    onChange={(event) => updateCommon("roundingStep", Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value={1} className="dark:bg-slate-900">1 ₫</option>
                    <option value={1000} className="dark:bg-slate-900">1.000 ₫</option>
                    <option value={5000} className="dark:bg-slate-900">5.000 ₫</option>
                    <option value={10000} className="dark:bg-slate-900">10.000 ₫</option>
                  </select>
                </SettingField>

                <div className="sm:col-span-2 lg:col-span-4 xl:col-span-6">
                  <div className="grid gap-4 rounded-2xl border border-brand/20 bg-brand-light/20 dark:bg-brand-light/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SettingField label="Cách tính thuế">
                      <select
                        value={common.taxMode}
                        onChange={(event) => updateCommon("taxMode", event.target.value as TaxMode)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                      >
                        <option value="household_exempt" className="dark:bg-slate-900">Hộ/cá nhân đủ điều kiện miễn thuế 2026</option>
                        <option value="household_revenue" className="dark:bg-slate-900">Hộ/cá nhân tính trên doanh thu</option>
                        <option value="profit_based" className="dark:bg-slate-900">Tính trên lợi nhuận ròng</option>
                        <option value="manual" className="dark:bg-slate-900">Tỷ lệ doanh thu tự nhập</option>
                      </select>
                    </SettingField>
                    {common.taxMode === "household_revenue" && (
                      <SettingField label="Phần doanh thu chịu TNCN">
                        <PercentInput
                          label="Phần doanh thu chịu TNCN"
                          value={common.taxableRevenueShare}
                          onChange={(value) => updateCommon("taxableRevenueShare", value)}
                        />
                      </SettingField>
                    )}
                    {common.taxMode === "profit_based" && (
                      <SettingField label="Thuế suất lợi nhuận">
                        <PercentInput
                          label="Thuế suất lợi nhuận"
                          value={common.profitTaxRate}
                          onChange={(value) => updateCommon("profitTaxRate", value)}
                        />
                      </SettingField>
                    )}
                    {common.taxMode === "manual" && (
                      <SettingField label="Thuế trên doanh thu">
                        <PercentInput
                          label="Thuế trên doanh thu"
                          value={common.manualRevenueTaxRate}
                          onChange={(value) => updateCommon("manualRevenueTaxRate", value)}
                        />
                      </SettingField>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {platforms
                  .filter((platform) => platform === activeSheet)
                  .map((platform) => {
                    const setting = platformSettings[platform];
                    const profile = getFeeProfile(
                      platform,
                      setting.shopType,
                      getDefaultCategoryId(platform, setting.shopType)
                    );
                    return (
                      <div
                        key={platform}
                        className={`rounded-2xl border p-4.5 transition-colors ${
                          platform === "shopee"
                            ? "border-orange-200 dark:border-orange-900/50 bg-orange-50/60 dark:bg-orange-950/20"
                            : platform === "tiktok"
                            ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20"
                            : "border-brand/30 bg-brand-light/30 dark:bg-brand-light/10"
                        }`}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <strong className="text-slate-900 dark:text-white font-bold">
                            Cấu hình nền tảng {platformNames[platform]}
                          </strong>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black text-white ${
                              platform === "shopee"
                                ? "bg-orange-500"
                                : platform === "tiktok"
                                ? "bg-emerald-600"
                                : "bg-brand"
                            }`}
                          >
                            {platformNames[platform]}
                          </span>
                        </div>

                        {platform === "external" ? (
                          <>
                            <p className="mb-4 text-xs text-slate-600 dark:text-slate-400">
                              Dùng cho Facebook, website, YouTube và các đơn tự chốt. Không áp dụng phí sàn TMĐT.
                            </p>
                            <div className="grid gap-4 sm:grid-cols-3">
                              <SettingField label="Phí thanh toán / cổng bán">
                                <PercentInput
                                  label="Phí thanh toán đơn ngoài"
                                  value={setting.paymentFeeRate}
                                  onChange={(value) => updatePlatform(platform, { paymentFeeRate: value })}
                                />
                              </SettingField>
                              <SettingField label="Phí COD / đối tác">
                                <PercentInput
                                  label="Phí COD đơn ngoài"
                                  value={setting.codFeeRate}
                                  onChange={(value) => updatePlatform(platform, { codFeeRate: value })}
                                />
                              </SettingField>
                              <SettingField label="Phí xử lý mỗi đơn">
                                <MoneyInput
                                  label="Phí xử lý đơn ngoài"
                                  value={setting.fixedOrderFee}
                                  onChange={(value) => updatePlatform(platform, { fixedOrderFee: value })}
                                />
                              </SettingField>
                            </div>
                          </>
                        ) : (
                          <>
                            <SettingField label="Loại shop">
                              <select
                                value={setting.shopType}
                                onChange={(event) =>
                                  updatePlatform(platform, { shopType: event.target.value as ShopType })
                                }
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                              >
                                <option value="marketplace" className="dark:bg-slate-900">Shop thường</option>
                                <option value="mall" className="dark:bg-slate-900">Shop Mall</option>
                              </select>
                            </SettingField>
                            <div className="mt-3 rounded-xl bg-white/80 dark:bg-slate-800/80 px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                              Phí giao dịch mặc định: <strong>{profile.transactionRate}%</strong> · Phí cố định:{" "}
                              <strong>{money(profile.orderProcessingFee)}</strong> · Hoa hồng lấy theo ngành cấp 3 của từng dòng.
                            </div>
                            <div className="mt-3 space-y-2.5">
                              {platform === "tiktok" && (
                                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-800 p-3 text-xs">
                                  <input
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-emerald-600"
                                    type="checkbox"
                                    checked={setting.tiktokGmvMax}
                                    onChange={(event) => updatePlatform(platform, { tiktokGmvMax: event.target.checked })}
                                  />
                                  <span>
                                    <strong className="block text-slate-900 dark:text-white font-bold">
                                      Ưu đãi giao dịch GMV Max: 5%
                                    </strong>
                                    Chỉ bật khi Seller Center xác nhận shop đủ điều kiện áp dụng.
                                  </span>
                                </label>
                              )}
                              {getAvailablePrograms(platform, setting.shopType).map((program) => (
                                <label
                                  key={program.id}
                                  className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-3 text-xs"
                                >
                                  <input
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[var(--brand-primary)]"
                                    type="checkbox"
                                    checked={setting.enabledProgramIds.includes(program.id)}
                                    onChange={() => toggleProgram(platform, program.id)}
                                  />
                                  <span>
                                    <strong className="block text-slate-900 dark:text-white font-bold">
                                      {program.name}: {program.rate}%
                                      {program.cap ? `, tối đa ${money(program.cap)}` : ""}
                                    </strong>
                                    {program.note}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Product Batch Table Card */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
        <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800/80 px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
              <FileSpreadsheet size={21} className="text-brand" /> Bảng tính hàng loạt {platformNames[activeSheet]}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {activeSheet === "external"
                ? "Định giá đơn Facebook, website, YouTube hoặc kênh tự bán."
                : "Tất cả dòng sản phẩm áp dụng tự động đúng biểu phí sàn mới nhất."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRows((current) => [...current, makeRow(activeSheet)])}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand/30 bg-brand-light/30 dark:bg-brand-light/10 px-3.5 py-2 text-xs font-bold text-brand hover:bg-brand-light/60 transition-colors cursor-pointer"
            >
              <Plus size={15} /> Thêm sản phẩm
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand/30 bg-brand-light/30 dark:bg-brand-light/10 px-3.5 py-2 text-xs font-bold text-brand hover:bg-brand-light/60 transition-colors">
              <Upload size={15} /> Nhập CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => upload(event.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download size={15} /> File mẫu CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setRows((current) => current.filter((row) => row.platform !== activeSheet));
                setHasCalculated(false);
                setRowErrors({});
                setNotice("");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 size={15} /> Xóa trang tính
            </button>
            <button
              type="button"
              onClick={calculateAll}
              disabled={!visibleRows.length}
              className="btn-brand-cta inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black text-white shadow-md disabled:opacity-40 cursor-pointer"
            >
              <Calculator size={15} /> Tính toán hàng loạt
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1680px] text-left text-sm">
            <thead className="bg-slate-950 dark:bg-slate-950 text-xs text-white">
              <tr>
                <th className="w-12 px-3 py-3 text-center">#</th>
                <th className="w-56 px-3 py-3">Tên sản phẩm</th>
                <th className="w-36 px-3 py-3">{activeSheet === "external" ? "Kênh bán" : "Nền tảng"}</th>
                <th className="w-72 px-3 py-3">{activeSheet === "external" ? "Loại đơn" : "Ngành cấp 3"}</th>
                <th className="w-24 px-3 py-3">SL</th>
                <th className="w-36 px-3 py-3 text-right">Giá vốn</th>
                <th className="w-36 px-3 py-3 text-right">Đóng gói</th>
                <th className="w-40 px-3 py-3 text-right">Giá hiện tại</th>
                <th className="w-36 px-3 py-3 text-right">Hòa vốn</th>
                <th className="w-36 px-3 py-3 text-right">Giá đề xuất</th>
                <th className="w-32 px-3 py-3 text-right">Thuế</th>
                <th className="w-40 px-3 py-3 text-right">Lãi kỳ vọng</th>
                <th className="w-24 px-3 py-3 text-right">Biên</th>
                <th className="w-14 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {visibleRows.map((row, index) => {
                const shopType = platformSettings[row.platform].shopType;
                const categories = getAvailableCategories(row.platform, shopType);
                const result = hasCalculated ? resultById.get(row.id) : null;
                const evaluation = result?.snapshot.result.evaluation;
                return (
                  <tr
                    key={row.id}
                    className={
                      rowErrors[row.id]
                        ? "bg-rose-50/70 dark:bg-rose-950/30"
                        : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    }
                  >
                    <td className="px-3 py-3 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="px-3 py-3">
                      <input
                        aria-label={`Tên sản phẩm dòng ${index + 1}`}
                        value={row.name}
                        onChange={(event) => updateRow(row.id, { name: event.target.value })}
                        placeholder="Nhập tên sản phẩm"
                        className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-800/80 px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand ${
                          rowErrors[row.id]
                            ? "border-rose-400"
                            : "border-slate-200 dark:border-slate-700/80"
                        }`}
                      />
                      {rowErrors[row.id] && (
                        <p className="mt-1 text-[10px] font-bold text-rose-600">{rowErrors[row.id]}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {activeSheet === "external" ? (
                        <select
                          aria-label={`Kênh bán dòng ${index + 1}`}
                          value={row.externalChannel}
                          onChange={(event) =>
                            updateRow(row.id, {
                              externalChannel: event.target.value as BatchRow["externalChannel"],
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-2 py-2 font-semibold text-slate-900 dark:text-slate-100"
                        >
                          <option value="facebook" className="dark:bg-slate-900">Facebook</option>
                          <option value="website" className="dark:bg-slate-900">Website</option>
                          <option value="youtube" className="dark:bg-slate-900">YouTube</option>
                          <option value="other" className="dark:bg-slate-900">Kênh khác</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black text-white ${
                            activeSheet === "shopee" ? "bg-orange-500" : "bg-emerald-600"
                          }`}
                        >
                          {platformNames[activeSheet]}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {activeSheet === "external" ? (
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Đơn tự chốt, không phí sàn
                        </span>
                      ) : (
                        <select
                          aria-label={`Ngành hàng dòng ${index + 1}`}
                          value={
                            categories.some((category) => category.id === row.categoryId)
                              ? row.categoryId
                              : categories[0]?.id
                          }
                          onChange={(event) => updateRow(row.id, { categoryId: event.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-2 py-2 text-xs text-slate-900 dark:text-slate-100"
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id} className="dark:bg-slate-900">
                              {category.level3} — {shopType === "mall" ? category.mallRate : category.marketplaceRate}%
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <input
                        aria-label={`Số lượng dòng ${index + 1}`}
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(event) =>
                          updateRow(row.id, { quantity: Math.max(1, Number(event.target.value)) })
                        }
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-2 py-2 text-center font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <MoneyInput
                        label={`Giá vốn dòng ${index + 1}`}
                        value={row.cost}
                        onChange={(value) => updateRow(row.id, { cost: value })}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <MoneyInput
                        label={`Đóng gói dòng ${index + 1}`}
                        value={row.packaging}
                        onChange={(value) => updateRow(row.id, { packaging: value })}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <MoneyInput
                        label={`Giá hiện tại dòng ${index + 1}`}
                        value={row.currentPrice}
                        onChange={(value) => updateRow(row.id, { currentPrice: value })}
                      />
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {result?.snapshot.result.breakEvenPrice == null
                        ? "—"
                        : money(result.snapshot.result.breakEvenPrice)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {evaluation ? money(evaluation.listPrice) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-800 dark:text-slate-200">
                      {evaluation ? money(evaluation.tax) : "—"}
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-mono font-bold ${
                        evaluation && evaluation.expectedProfitPerOrder < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-brand"
                      }`}
                    >
                      {evaluation ? money(evaluation.expectedProfitPerOrder) : "—"}
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-bold ${
                        evaluation && evaluation.expectedMargin < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {evaluation ? `${evaluation.expectedMargin.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        aria-label={`Xóa ${row.name || `dòng ${index + 1}`}`}
                        onClick={() => {
                          setRows((current) => current.filter((item) => item.id !== row.id));
                          setRowErrors((current) => {
                            const next = { ...current };
                            delete next[row.id];
                            return next;
                          });
                        }}
                        className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!visibleRows.length && (
          <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Trang tính chưa có sản phẩm. Nhấn “Thêm sản phẩm” hoặc nhập file CSV.
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {notice && (
              <p
                className={`text-sm font-semibold ${
                  Object.keys(rowErrors).length ? "text-rose-600" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {notice}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!hasCalculated || !validResults.length}
              onClick={saveAll}
              className="btn-brand-cta inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black text-white shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <Save size={14} /> Lưu tất cả
            </button>
            <button
              disabled={!hasCalculated || !validResults.length}
              onClick={() => exportFile("xlsx")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Download size={14} /> Xuất Excel
            </button>
            <button
              disabled={!hasCalculated || !validResults.length}
              onClick={() => exportFile("csv")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Download size={14} /> Xuất CSV
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
