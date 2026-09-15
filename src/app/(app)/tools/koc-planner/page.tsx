"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calculator,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCopy,
  Clock,
  CopyPlus,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  HelpCircle,
  Info,
  Layers,
  Loader2,
  Package,
  Percent,
  PieChart,
  Play,
  Plus,
  Presentation,
  ReceiptText,
  RotateCcw,
  Save,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Target,
  Trash2,
  TrendingUp,
  Tv,
  Users,
  Video,
  Wallet,
  X,
  Zap,
  Crown,
} from "lucide-react";
import { useToolGate } from "@/hooks/useToolGate";
import { calculateKocPlan } from "@/lib/koc-planner/engine";
import type { KocPlanInput, KocPlanResult } from "@/lib/koc-planner/types";
import {
  FEE_DATA_VERSION,
  getAvailableCategories,
  getCategoryLabel,
  getDefaultCategoryId,
  getFeeProfile,
  PROGRAMS,
  SOURCES,
} from "@/lib/pricing/registry";
import { readPricingHistory, type PricingCalculationSnapshot } from "@/lib/pricing/storage";
import type { ShopType } from "@/lib/pricing/types";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const money = (value: number) => currency.format(Math.round(value));
const number = (value: number, digits = 0) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);
const parseMoney = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;
const STORAGE_KEY = "aichoshop_koc_plans_v2";

const initialInput: KocPlanInput = {
  campaignName: "",
  shopType: "marketplace",
  categoryId: "tiktok-468",
  totalBudget: 50_000_000,
  sampleCost: 100_000,
  sampleShippingCost: 30_000,
  castFee: 50_000,
  effectiveKocRate: 80,
  videosPerKoc: 3,
  organicOrdersPerEffectiveKoc: 10,
  averageSellingPrice: 500_000,
  sellerDiscountRate: 0,
  platformDiscount: 0,
  buyerShippingFee: 0,
  costPerSoldItem: 150_000,
  packagingCost: 5_000,
  handlingCost: 0,
  sellerShippingCost: 0,
  organicCommissionRate: 10,
  useAds: true,
  adsBudgetRate: 30,
  adsCostPerOrder: 100_000,
  adsCommissionRate: 7.5,
  includeTikTokFees: true,
  platformCommissionRate: 0,
  transactionFeeRate: 6,
  fixedOrderFee: 3_000,
  enabledProgramIds: [],
  taxRate: 1.5,
  cancellationRate: 2,
  cancellationCost: 0,
  deliveryFailureRate: 4,
  returnRate: 5,
  returnedInventoryRecoveryRate: 95,
  returnCostPerOrder: 25_000,
  nonRefundableReturnFee: 0,
  damageRate: 5,
  extraKocCostRate: 10,
  otherOperatingCost: 0,
};

type SavedPlan = {
  id: string;
  createdAt: string;
  categoryId: string;
  shopType: ShopType;
  input: KocPlanInput;
  result: KocPlanResult;
};

type LegacyKocInput = Partial<KocPlanInput> & { adsBudget?: number };

function migrateInput(raw: LegacyKocInput): KocPlanInput {
  const totalBudget = raw.totalBudget ?? initialInput.totalBudget;
  const adsBudgetRate =
    raw.adsBudgetRate ??
    (raw.adsBudget !== undefined && totalBudget > 0
      ? (raw.adsBudget / totalBudget) * 100
      : initialInput.adsBudgetRate);
  return { ...initialInput, ...raw, adsBudgetRate: Math.min(100, Math.max(0, adsBudgetRate)) };
}

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
        value={value ? new Intl.NumberFormat("vi-VN").format(value) : ""}
        onChange={(event) => onChange(parseMoney(event.target.value))}
        className={`w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 pr-8 text-right font-mono text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:focus:border-brand ${className}`}
      />
      <span className="pointer-events-none absolute right-3 text-xs font-bold text-slate-400 dark:text-slate-500">
        ₫
      </span>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  suffix = "%",
  step = 0.5,
  min = 0,
  max,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <div className="relative flex items-center">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 pr-8 text-right font-mono text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:focus:border-brand ${className}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 text-xs font-bold text-slate-400 dark:text-slate-500">
          {suffix}
        </span>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  tooltip,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  tooltip?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          {label}
          {tooltip && (
            <span title={tooltip} className="cursor-help text-slate-400 hover:text-slate-600">
              <HelpCircle size={12} />
            </span>
          )}
        </span>
        {hint && (
          <span className="font-normal text-slate-400 dark:text-slate-500 text-[11px]">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

function SectionCard({
  title,
  icon,
  children,
  badge,
  className = "",
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors p-5 sm:p-6 space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
        <h2 className="flex items-center gap-2.5 text-sm sm:text-base font-black text-slate-900 dark:text-white">
          <span className="text-brand flex items-center">{icon}</span>
          {title}
        </h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

function ToggleCard({
  checked,
  onChange,
  label,
  note,
  badge,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  note?: string;
  badge?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 p-4 transition hover:border-slate-300 dark:hover:border-slate-600">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <strong className="text-sm font-bold text-slate-900 dark:text-white">{label}</strong>
          {badge && (
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-black text-brand">
              {badge}
            </span>
          )}
        </div>
        {note && <p className="text-xs text-slate-500 dark:text-slate-400">{note}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded accent-brand cursor-pointer"
      />
    </label>
  );
}

function ResultRow({
  label,
  value,
  subtext,
  tone = "slate",
  strong = false,
  highlight = false,
}: {
  label: string;
  value: string;
  subtext?: string;
  tone?: "slate" | "brand" | "green" | "orange" | "red";
  strong?: boolean;
  highlight?: boolean;
}) {
  const tones = {
    slate: "text-slate-800 dark:text-slate-200",
    brand: "text-brand",
    green: "text-emerald-600 dark:text-emerald-400 font-bold",
    orange: "text-amber-600 dark:text-amber-400",
    red: "text-rose-600 dark:text-rose-400",
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 py-2.5 text-xs transition-colors ${highlight
        ? "rounded-xl bg-brand-light/30 dark:bg-brand-light/10 px-3 border border-brand/20 my-1"
        : "border-b border-slate-100 dark:border-slate-800/80"
        }`}
    >
      <div className="space-y-0.5">
        <span className={`${strong ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
          {label}
        </span>
        {subtext && <p className="text-[10px] text-slate-400 dark:text-slate-500">{subtext}</p>}
      </div>
      <span className={`font-mono ${tones[tone]} ${strong ? "text-sm font-black" : "font-bold"}`}>
        {value}
      </span>
    </div>
  );
}

function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportRows(campaignName: string, category: string, result: KocPlanResult): (string | number)[][] {
  return [
    ["Chỉ số", "Giá trị"],
    ["Chiến dịch", campaignName],
    ["Ngành hàng TikTok Shop", category],
    ["KOC có thể mời", result.invitedKocs],
    ["KOC hiệu quả làm clip", result.effectiveKocs],
    ["Tổng số Video KOC", result.videos],
    ["Đơn tự nhiên dự kiến", result.organicOrders],
    ["Đơn từ quảng cáo Ads", result.adOrders],
    ["Đơn giao thành công", result.successfulOrders],
    ["GMV trước rủi ro", result.grossRevenue],
    ["Doanh thu sau hủy/hoàn", result.netRevenue],
    ["Giải ngân trước Affiliate & Thuế", result.expectedPayoutBeforeAffiliate],
    ["Tiền ròng sau Affiliate & Thuế", result.expectedNetSettlement],
    ["Hoa hồng KOC tự nhiên", result.organicCommission],
    ["Hoa hồng KOC quảng cáo", result.adsCommission],
    ["Phí sàn TikTok Shop", result.platformFees],
    ["Thuế doanh thu ước tính", result.taxes],
    ["Giá vốn hàng bán (COGS)", result.soldGoodsCost],
    ["Vận hành đơn hàng & ship", result.fulfillmentCost],
    ["Tổn thất trạng thái đơn", result.returnLoss],
    ["Tổng chi phí toàn chiến dịch", result.totalCost],
    ["Lợi nhuận ròng dự kiến", result.netProfit],
    ["ROI (%)", result.roi],
    ["ROAS Ads", result.roas ?? ""],
    ["Đơn hòa vốn", result.breakEvenOrders ?? ""],
    ["CPA hòa vốn", result.breakEvenCpa ?? ""],
    ["Biên lợi nhuận ròng (%)", result.netMargin],
  ];
}

export default function KocPlanner() {
  const { checkAccess, GateModals } = useToolGate();
  const [input, setInput] = useState<KocPlanInput>(initialInput);
  const [shopType, setShopType] = useState<ShopType>("marketplace");
  const [categoryId, setCategoryId] = useState(() => getDefaultCategoryId("tiktok", "marketplace"));
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedResult, setCalculatedResult] = useState<KocPlanResult | null>(null);
  const [lastCalculatedInput, setLastCalculatedInput] = useState<KocPlanInput | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [savedProducts, setSavedProducts] = useState<PricingCalculationSnapshot[]>([]);
  const [saveNotice, setSaveNotice] = useState("");
  const [activeTab, setActiveTab] = useState<"budget" | "funnel" | "pnl">("budget");
  const [searchFilter, setSearchFilter] = useState("");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Không khóa cuộn trang để đồng bộ trải nghiệm cuộn tự nhiên với các công cụ khác

  const categories = useMemo(() => getAvailableCategories("tiktok", shopType), [shopType]);
  const category = categories.find((item) => item.id === categoryId) ?? categories[0];
  const level1Values = Array.from(new Set(categories.map((item) => item.level1)));
  const level2Categories = categories.filter((item) => item.level1 === category.level1);
  const level2Values = Array.from(new Set(level2Categories.map((item) => item.level2)));
  const level3Categories = level2Categories.filter((item) => item.level2 === category.level2);
  const feeProfile = getFeeProfile("tiktok", shopType, category.id);

  const calculationInput = useMemo(
    () => ({
      ...input,
      shopType,
      categoryId: category.id,
      platformCommissionRate: feeProfile.commissionRate,
    }),
    [category.id, feeProfile.commissionRate, input, shopType]
  );

  const result = calculatedResult;
  const update = <K extends keyof KocPlanInput>(key: K, value: KocPlanInput[K]) =>
    setInput((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    checkAccess("koc-planner", false);
  }, [checkAccess]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedPlan[];
      setSavedPlans(
        Array.isArray(stored)
          ? stored.map((item) => ({ ...item, input: migrateInput(item.input as LegacyKocInput) }))
          : []
      );
    } catch {
      setSavedPlans([]);
    }
    setSavedProducts(readPricingHistory(localStorage).filter((item) => item.input.platform === "tiktok"));
  }, []);

  const changeShopType = (next: ShopType) => {
    setShopType(next);
    setCategoryId(getDefaultCategoryId("tiktok", next));
  };

  const chooseCategory = (matches: (item: typeof category) => boolean) => {
    const next = categories.find(matches);
    if (next) setCategoryId(next.id);
  };

  const applySavedProduct = (id: string) => {
    const saved = savedProducts.find((item) => item.id === id);
    if (!saved) return;
    setShopType(saved.input.shopType);
    setCategoryId(saved.input.categoryId);
    setInput((current) => ({
      ...current,
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
      taxRate:
        saved.input.taxMode === "manual"
          ? saved.input.manualRevenueTaxRate
          : saved.result.evaluation.productRevenue > 0
            ? (saved.result.evaluation.tax / saved.result.evaluation.productRevenue) * 100
            : current.taxRate,
      cancellationRate: saved.input.cancellationRate,
      cancellationCost: saved.input.cancellationCost,
      deliveryFailureRate: saved.input.deliveryFailureRate,
      returnRate: saved.input.returnRate,
      returnedInventoryRecoveryRate: saved.input.returnedInventoryRecoveryRate,
      returnCostPerOrder: saved.input.returnShippingCost,
      nonRefundableReturnFee: saved.input.nonRefundableReturnFee,
      damageRate: saved.input.damageRate,
    }));
    setSaveNotice(`Đã nạp dữ liệu từ sản phẩm "${saved.productName}"`);
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const calculate = () => {
    if (!input.campaignName.trim()) {
      setError("Vui lòng nhập tên chiến dịch trước khi tính.");
      return;
    }
    if (input.totalBudget <= 0) {
      setError("Tổng ngân sách phải lớn hơn 0.");
      return;
    }
    if (input.adsBudgetRate < 0 || input.adsBudgetRate > 100) {
      setError("Ngân sách quảng cáo phải nằm trong khoảng 0–100%.");
      return;
    }
    if (input.averageSellingPrice <= 0) {
      setError("Giá bán trung bình phải lớn hơn 0.");
      return;
    }
    setError("");
    setIsCalculating(true);
    setTimeout(() => {
      const res = calculateKocPlan(calculationInput);
      setCalculatedResult(res);
      setLastCalculatedInput(calculationInput);
      setHasCalculated(true);
      setIsCalculating(false);
    }, 300);
  };

  const runSample = () => {
    const sampleInput = {
      ...input,
      campaignName: input.campaignName.trim() || "Chiến dịch KOC Áo Polo Tháng 10",
    };
    setInput(sampleInput);
    const sampleCalcInput = {
      ...sampleInput,
      shopType,
      categoryId: category.id,
      platformCommissionRate: feeProfile.commissionRate,
    };
    setIsCalculating(true);
    setTimeout(() => {
      const res = calculateKocPlan(sampleCalcInput);
      setCalculatedResult(res);
      setLastCalculatedInput(sampleCalcInput);
      setError("");
      setHasCalculated(true);
      setIsCalculating(false);
    }, 300);
  };

  const handleResetForm = () => {
    setInput(initialInput);
    setError("");
    setHasCalculated(false);
    setCalculatedResult(null);
    setLastCalculatedInput(null);
  };

  const save = () => {
    if (!hasCalculated || !calculatedResult || !lastCalculatedInput) {
      setError("Hãy tính kế hoạch trước khi lưu.");
      return;
    }
    const item: SavedPlan = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      categoryId: category.id,
      shopType,
      input: lastCalculatedInput,
      result: calculatedResult,
    };
    const next = [item, ...savedPlans];
    setSavedPlans(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaveNotice("Đã lưu phương án thành công!");
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const openPlan = (item: SavedPlan) => {
    setInput(item.input);
    setShopType(item.shopType);
    setCategoryId(item.categoryId);
    setCalculatedResult(item.result);
    setLastCalculatedInput(item.input);
    setHasCalculated(true);
    setError("");
    setIsHistoryModalOpen(false);
    setSaveNotice(`Đã nạp lại: ${item.input.campaignName || "Chiến dịch"}`);
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const duplicatePlan = (item: SavedPlan) => {
    const dupInput = { ...item.input, campaignName: `${item.input.campaignName} (bản sao)` };
    setInput(dupInput);
    setShopType(item.shopType);
    setCategoryId(item.categoryId);
    const dupCalcInput = {
      ...dupInput,
      shopType: item.shopType,
      categoryId: item.categoryId,
      platformCommissionRate: feeProfile.commissionRate,
    };
    const res = calculateKocPlan(dupCalcInput);
    setCalculatedResult(res);
    setLastCalculatedInput(dupCalcInput);
    setHasCalculated(true);
    setIsHistoryModalOpen(false);
    setSaveNotice(`Đã nhân bản: ${dupInput.campaignName}`);
    setTimeout(() => setSaveNotice(""), 3000);
  };

  const deletePlan = (id: string) => {
    const next = savedPlans.filter((item) => item.id !== id);
    setSavedPlans(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const copyResult = async () => {
    if (!calculatedResult || !lastCalculatedInput) return;
    await navigator.clipboard.writeText(
      `KẾ HOẠCH KOC: ${lastCalculatedInput.campaignName}\nNgành: ${getCategoryLabel(category)}\nNgân sách: ${money(
        lastCalculatedInput.totalBudget
      )}\nKOC có thể mời: ${calculatedResult.invitedKocs}\nKOC làm nội dung: ${calculatedResult.effectiveKocs}\nVideo: ${calculatedResult.videos
      }\nĐơn thành công: ${number(calculatedResult.successfulOrders, 1)}\nDoanh thu sau hoàn: ${money(
        calculatedResult.netRevenue
      )}\nTổng chi phí: ${money(calculatedResult.totalCost)}\nLợi nhuận ròng: ${money(
        calculatedResult.netProfit
      )}\nROI: ${calculatedResult.roi.toFixed(1)}%`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const exportCsv = () => {
    if (!calculatedResult || !lastCalculatedInput) return;
    const rows = exportRows(lastCalculatedInput.campaignName || "Chien-dich-KOC", getCategoryLabel(category), calculatedResult);
    download(
      `koc-plan-${Date.now()}.csv`,
      `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n")}`
    );
  };

  const exportExcel = async () => {
    if (!calculatedResult || !lastCalculatedInput) return;
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(
        exportRows(lastCalculatedInput.campaignName || "Chien-dich-KOC", getCategoryLabel(category), calculatedResult)
      ),
      "Kế hoạch KOC"
    );
    XLSX.writeFile(workbook, `koc-plan-${Date.now()}.xlsx`);
  };

  const filteredPlans = useMemo(() => {
    if (!searchFilter.trim()) return savedPlans;
    const q = searchFilter.toLowerCase();
    return savedPlans.filter((p) => p.input.campaignName.toLowerCase().includes(q));
  }, [savedPlans, searchFilter]);

  const isLoss = result ? result.netProfit < 0 : false;
  const singleKocCost = input.sampleCost + input.sampleShippingCost + input.castFee;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <GateModals />

      {/* Modal Lịch Sử Phương Án Đã Lưu */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsHistoryModalOpen(false)}
          />

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 relative z-10 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    Lịch Sử Kế Hoạch KOC ({savedPlans.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lưu trữ, đối chiếu và nạp lại các kịch bản ngân sách KOC đã thử nghiệm
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {savedPlans.length > 0 && (
                  <>
                    <div className="relative hidden sm:block">
                      <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm theo tên..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 pl-7 pr-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-brand"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Bạn có chắc chắn muốn xóa toàn bộ phương án đã lưu?")) {
                          setSavedPlans([]);
                          localStorage.setItem(STORAGE_KEY, "[]");
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
                    >
                      <Trash2 size={12} /> <span className="hidden sm:inline">Xóa tất cả</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Mobile search bar if on small screen */}
            {savedPlans.length > 0 && (
              <div className="sm:hidden px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 pl-7 pr-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-brand"
                  />
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto custom-scrollbar">
              {savedPlans.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <Clock size={32} className="text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">Chưa có phương án nào được lưu</p>
                  <p className="max-w-xs text-slate-400 text-[11px]">
                    Sau khi tính toán kịch bản chiến dịch KOC, hãy nhấn nút <strong className="text-brand">“Lưu phương án”</strong> trên thanh công cụ để lưu lại và đối chiếu.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Chiến dịch KOC</th>
                        <th className="px-3 py-3 text-right">Tổng ngân sách</th>
                        <th className="px-3 py-3 text-center">KOC Clip</th>
                        <th className="px-3 py-3 text-center">Đơn thành công</th>
                        <th className="px-3 py-3 text-right">Doanh thu sau hoàn</th>
                        <th className="px-3 py-3 text-right">Lợi nhuận ròng</th>
                        <th className="px-3 py-3 text-center">ROI</th>
                        <th className="px-4 py-3 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredPlans.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-xs text-slate-400">
                            Không tìm thấy phương án nào khớp với từ khóa &ldquo;{searchFilter}&rdquo;
                          </td>
                        </tr>
                      ) : (
                        filteredPlans.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <strong className="block text-slate-900 dark:text-white font-bold text-xs">
                                {item.input.campaignName || "Chiến dịch chưa đặt tên"}
                              </strong>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {new Date(item.createdAt).toLocaleString("vi-VN")} •{" "}
                                {item.shopType === "mall" ? "Mall" : "Shop thường"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {money(item.input.totalBudget)}
                            </td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-brand">
                              {number(item.result.effectiveKocs)}
                            </td>
                            <td className="px-3 py-3 text-center font-mono text-slate-700 dark:text-slate-300">
                              {number(item.result.successfulOrders, 1)}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              {money(item.result.netRevenue)}
                            </td>
                            <td
                              className={`px-3 py-3 text-right font-mono font-black ${item.result.netProfit < 0
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-emerald-600 dark:text-emerald-400"
                                }`}
                            >
                              {money(item.result.netProfit)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-mono font-black ${item.result.roi < 0
                                  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                                  : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                  }`}
                              >
                                {item.result.roi.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  title="Mở lại phương án này"
                                  onClick={() => openPlan(item)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand-light/40 px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-light transition cursor-pointer"
                                >
                                  <FolderOpen size={12} /> Mở
                                </button>
                                <button
                                  type="button"
                                  title="Nhân bản phương án"
                                  onClick={() => duplicatePlan(item)}
                                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
                                >
                                  <CopyPlus size={13} />
                                </button>
                                <button
                                  type="button"
                                  title="Xóa phương án"
                                  onClick={() => deletePlan(item.id)}
                                  className="rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. Header Navigation & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/tools" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Kho Công Cụ AI
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Tăng Trưởng Doanh Số</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
            Lập Kế Hoạch KOC Campaign TikTok Shop
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider">
              <Crown size={11} className="text-amber-600 dark:text-amber-400" />
              VIP TOOL
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 uppercase tracking-wide border border-amber-200 dark:border-amber-800">
              PHÍ TIKTOK {FEE_DATA_VERSION}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Lập kế hoạch chiến dịch KOC TikTok Shop, tính toán điểm hòa vốn và dự phóng dòng tiền P&L chính xác.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2">
          {saveNotice && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <Check size={13} /> {saveNotice}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Xem lịch sử các phương án KOC đã lưu"
          >
            <Clock size={14} /> Lịch sử
          </button>
          <button
            type="button"
            onClick={runSample}
            className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles size={14} /> Dữ Liệu Mẫu
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} /> Xóa Form
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Core Architecture: Grid 12 cột chuẩn Chat Broadcast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Header cột trái */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-brand" />
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Thông Số Chiến Dịch</h2>
            </div>
            <span className="text-[11px] font-mono text-brand font-bold bg-brand/10 dark:bg-brand/20 px-2 py-0.5 rounded border border-brand/20">
              {feeProfile.commissionRate}% hoa hồng
            </span>
          </div>

          {/* Form inputs cuộn nội bộ */}
          <div className="p-3.5 sm:p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain space-y-3.5">
            {/* Card 1: Thông tin chiến dịch & Ngành hàng TikTok */}
            <SectionCard
              title="Chiến dịch & Ngành hàng"
              icon={<Users size={18} />}
              badge={
                <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-black text-brand">
                  {feeProfile.commissionRate}% hoa hồng
                </span>
              }
            >
              {/* Guidance banner */}
              <p className="rounded-2xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900 dark:text-amber-300">
                💡 <strong>Lưu ý quan trọng:</strong> Hoa hồng sàn được đối chiếu tự động theo biểu phí TikTok Shop
                ngành cấp 3. Các tỷ lệ hiệu suất KOC, Ads, hoàn huỷ nên cập nhật theo số liệu thực tế từ Seller Center.
              </p>

              {/* Quick Load from Pricing History */}
              {savedProducts.length > 0 && (
                <div className="rounded-2xl border border-brand/20 bg-brand-light/30 dark:bg-brand-light/10 p-3.5 space-y-2">
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand">
                    <Sparkles size={13} /> Nạp nhanh từ sản phẩm TikTok đã tính giá
                  </span>
                  <select
                    defaultValue=""
                    onChange={(event) => applySavedProduct(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer"
                  >
                    <option value="" disabled>
                      Chọn sản phẩm để tự động điền giá bán & chi phí...
                    </option>
                    {savedProducts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.productName} — {money(item.result.evaluation.listPrice)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Campaign Name */}
              <Field label="Tên chiến dịch KOC" hint="Bắt buộc">
                <input
                  value={input.campaignName}
                  onChange={(event) => {
                    update("campaignName", event.target.value);
                    setError("");
                  }}
                  placeholder="Ví dụ: Mega Live 10.10 - Bộ sưu tập Polo Thu Đông"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </Field>

              {/* Shop Type (Marketplace vs Mall) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Loại hình gian hàng TikTok</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => changeShopType("marketplace")}
                    className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition cursor-pointer ${shopType === "marketplace"
                      ? "border-brand bg-brand-light/30 dark:bg-brand-light/10 shadow-xs ring-2 ring-brand/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300"
                      }`}
                  >
                    <Store size={18} className={shopType === "marketplace" ? "text-brand" : "text-slate-400"} />
                    <div>
                      <strong className="block text-xs font-bold text-slate-900 dark:text-white">Shop thường</strong>
                      <span className="text-[10px] text-slate-400">Marketplace tiêu chuẩn</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => changeShopType("mall")}
                    className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition cursor-pointer ${shopType === "mall"
                      ? "border-brand bg-brand-light/30 dark:bg-brand-light/10 shadow-xs ring-2 ring-brand/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300"
                      }`}
                  >
                    <ShieldCheck size={18} className={shopType === "mall" ? "text-brand" : "text-slate-400"} />
                    <div>
                      <strong className="block text-xs font-bold text-slate-900 dark:text-white">TikTok Shop Mall</strong>
                      <span className="text-[10px] text-slate-400">Thương hiệu chính hãng</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Cascading Category Selector */}
              <div className="space-y-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ngành hàng chính thức TikTok Shop
                </span>
                <div className="grid gap-3">
                  <Field label="Ngành cấp 1">
                    <select
                      value={category.level1}
                      onChange={(event) => chooseCategory((item) => item.level1 === event.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand"
                    >
                      {level1Values.map((value) => (
                        <option key={value} value={value} className="dark:bg-slate-900">
                          {value}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Ngành cấp 2">
                    <select
                      value={category.level2}
                      onChange={(event) =>
                        chooseCategory((item) => item.level1 === category.level1 && item.level2 === event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand"
                    >
                      {level2Values.map((value) => (
                        <option key={value} value={value} className="dark:bg-slate-900">
                          {value}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Ngành cấp 3 (Chi tiết theo biểu phí)">
                    <select
                      value={category.id}
                      onChange={(event) => setCategoryId(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand"
                    >
                      {level3Categories.map((item) => (
                        <option key={item.id} value={item.id} className="dark:bg-slate-900">
                          {item.level3} — {shopType === "mall" ? item.mallRate : item.marketplaceRate}% hoa hồng
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* Card 2: Ngân sách & Chi phí Mời KOC */}
            <SectionCard
              title="Ngân sách & Chi phí Mời KOC"
              icon={<Wallet size={18} />}
              badge={
                <span className="text-xs font-mono font-bold text-slate-500">
                  1 KOC ~ {money(singleKocCost)}
                </span>
              }
            >
              {/* Quick Budget Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mức ngân sách mẫu</span>
                <div className="grid grid-cols-4 gap-2">
                  {[10_000_000, 20_000_000, 50_000_000, 100_000_000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => update("totalBudget", preset)}
                      className={`rounded-xl border py-2 text-xs font-mono font-bold transition cursor-pointer ${input.totalBudget === preset
                        ? "border-brand bg-brand-light text-brand shadow-xs"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                    >
                      {preset / 1_000_000}M
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Tổng ngân sách chiến dịch" hint="Toàn bộ kinh phí dự kiến">
                <MoneyInput value={input.totalBudget} onChange={(value) => update("totalBudget", value)} />
              </Field>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Giá vốn mẫu / KOC" tooltip="Giá vốn 1 sản phẩm gửi tặng cho KOC">
                  <MoneyInput value={input.sampleCost} onChange={(value) => update("sampleCost", value)} />
                </Field>
                <Field label="Phí ship / KOC" tooltip="Cước vận chuyển gửi hàng mẫu">
                  <MoneyInput value={input.sampleShippingCost} onChange={(value) => update("sampleShippingCost", value)} />
                </Field>
                <Field label="Phí booking / cast" tooltip="Thù lao cứng trả trực tiếp cho KOC">
                  <MoneyInput value={input.castFee} onChange={(value) => update("castFee", value)} />
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Số KOC dự kiến có thể mời:</span>
                <span className="font-mono font-black text-brand text-sm">
                  {result
                    ? result.invitedKocs
                    : singleKocCost > 0
                      ? Math.floor((input.totalBudget * (1 - input.adsBudgetRate / 100)) / singleKocCost)
                      : 0}{" "}
                  KOC
                </span>
              </div>
            </SectionCard>

            {/* Card 3: Hiệu suất KOC & Kinh tế Đơn hàng */}
            <SectionCard title="Hiệu suất KOC & Kinh tế Đơn hàng" icon={<Video size={18} />}>
              <div className="space-y-4">
                <div>
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                    1. Hiệu suất chuyển đổi KOC
                  </span>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Tỷ lệ KOC lên clip" hint="">
                      <NumberInput
                        value={input.effectiveKocRate}
                        onChange={(value) => update("effectiveKocRate", value)}
                        max={100}
                      />
                    </Field>
                    <Field label="Video / KOC" hint="">
                      <NumberInput
                        value={input.videosPerKoc}
                        onChange={(value) => update("videosPerKoc", value)}
                        suffix="clip"
                        step={1}
                      />
                    </Field>
                    <Field label="Đơn tự nhiên / KOC" hint="">
                      <NumberInput
                        value={input.organicOrdersPerEffectiveKoc}
                        onChange={(value) => update("organicOrdersPerEffectiveKoc", value)}
                        suffix="đơn"
                        step={1}
                      />
                    </Field>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                    2. Giá bán & Voucher ưu đãi
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Giá niêm yết trung bình">
                      <MoneyInput
                        value={input.averageSellingPrice}
                        onChange={(value) => update("averageSellingPrice", value)}
                      />
                    </Field>
                    <Field label="Chiết khấu của Shop">
                      <NumberInput
                        value={input.sellerDiscountRate}
                        onChange={(value) => update("sellerDiscountRate", value)}
                        max={100}
                      />
                    </Field>
                    <Field label="Voucher sàn tài trợ">
                      <MoneyInput
                        value={input.platformDiscount}
                        onChange={(value) => update("platformDiscount", value)}
                      />
                    </Field>
                    <Field label="Khách trả phí ship">
                      <MoneyInput
                        value={input.buyerShippingFee}
                        onChange={(value) => update("buyerShippingFee", value)}
                      />
                    </Field>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                    3. Giá vốn & Chi phí vận hành đơn
                  </span>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Giá vốn SP (COGS)">
                      <MoneyInput
                        value={input.costPerSoldItem}
                        onChange={(value) => update("costPerSoldItem", value)}
                      />
                    </Field>
                    <Field label="Đóng gói / đơn">
                      <MoneyInput value={input.packagingCost} onChange={(value) => update("packagingCost", value)} />
                    </Field>
                    <Field label="Nhân công / đơn">
                      <MoneyInput value={input.handlingCost} onChange={(value) => update("handlingCost", value)} />
                    </Field>
                    <Field label="Shop chịu phí ship">
                      <MoneyInput
                        value={input.sellerShippingCost}
                        onChange={(value) => update("sellerShippingCost", value)}
                      />
                    </Field>
                    <Field label="HH Affiliate KOC" hint="">
                      <NumberInput
                        value={input.organicCommissionRate}
                        onChange={(value) => update("organicCommissionRate", value)}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Card 4: Quảng cáo & Phí sàn TikTok */}
            <SectionCard title="Quảng cáo & Phí sàn TikTok Shop" icon={<TrendingUp size={18} />}>
              <div className="space-y-4">
                {/* Ads Toggle */}
                <ToggleCard
                  checked={input.useAds}
                  onChange={(value) => update("useAds", value)}
                  label="Chạy quảng cáo Ads / Spark Ads"
                  note="Dự phóng đơn hàng từ Ads dựa theo CPA thực tế bạn cấu hình"
                  badge={input.useAds ? `${input.adsBudgetRate}% ngân sách` : undefined}
                />

                {input.useAds && (
                  <div className="rounded-2xl border border-brand/20 bg-brand-light/20 dark:bg-brand-light/5 p-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field
                        label="% Ngân sách Ads"
                        hint=""
                      >
                        <NumberInput
                          value={input.adsBudgetRate}
                          onChange={(value) => update("adsBudgetRate", value)}
                          max={100}
                        />
                      </Field>
                      <Field label="CPA mục tiêu">
                        <MoneyInput
                          value={input.adsCostPerOrder}
                          onChange={(value) => update("adsCostPerOrder", value)}
                        />
                      </Field>
                      <Field label="Hoa hồng đơn Ads">
                        <NumberInput
                          value={input.adsCommissionRate}
                          onChange={(value) => update("adsCommissionRate", value)}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {/* TikTok Fees Toggle */}
                <ToggleCard
                  checked={input.includeTikTokFees}
                  onChange={(value) => update("includeTikTokFees", value)}
                  label="Tính biểu phí sàn TikTok Shop"
                  note={`Hoa hồng ngành ${feeProfile.commissionRate}%, phí thanh toán giao dịch 6% và phí xử lý đơn`}
                />

                {input.includeTikTokFees && (
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Hoa hồng ngành" hint="">
                        <div className="flex h-[42px] items-center justify-end rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 px-3.5 font-mono text-sm font-black text-amber-700 dark:text-amber-300">
                          {feeProfile.commissionRate}%
                        </div>
                      </Field>
                      <Field label="Phí giao dịch sàn">
                        <NumberInput
                          value={input.transactionFeeRate}
                          onChange={(value) => update("transactionFeeRate", value)}
                        />
                      </Field>
                      <Field label="Phí xử lý đơn">
                        <MoneyInput value={input.fixedOrderFee} onChange={(value) => update("fixedOrderFee", value)} />
                      </Field>
                    </div>

                    {/* Programs Checklist */}
                    <div className="space-y-2 border-t border-slate-200/70 dark:border-slate-800 pt-3">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Chương trình dịch vụ sàn bổ sung
                      </span>
                      <div className="grid gap-2">
                        {PROGRAMS.tiktok.map((prog) => {
                          const isChecked = input.enabledProgramIds.includes(prog.id);
                          return (
                            <label
                              key={prog.id}
                              className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 transition ${isChecked
                                ? "border-brand bg-brand-light/30 dark:bg-brand-light/10"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                                }`}
                            >
                              <div className="space-y-0.5">
                                <strong className="text-xs font-bold text-slate-900 dark:text-white">
                                  {prog.name} ({prog.rate}%{prog.cap ? `, tối đa ${money(prog.cap)}` : ""})
                                </strong>
                                <p className="text-[11px] text-slate-400">{prog.note}</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  update(
                                    "enabledProgramIds",
                                    isChecked
                                      ? input.enabledProgramIds.filter((id) => id !== prog.id)
                                      : [...input.enabledProgramIds, prog.id]
                                  )
                                }
                                className="mt-0.5 h-4 w-4 rounded accent-brand cursor-pointer"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Card 5: Thuế & Quản trị Rủi ro Hủy/Hoàn */}
            <SectionCard title="Thuế & Quản trị Rủi ro Hủy / Hoàn" icon={<ReceiptText size={18} />}>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Thuế doanh thu" tooltip="Thuế khoán hộ kinh doanh 1.5% hoặc tỷ lệ doanh nghiệp">
                    <NumberInput value={input.taxRate} onChange={(value) => update("taxRate", value)} />
                  </Field>
                  <Field label="Tỷ lệ hủy đơn">
                    <NumberInput
                      value={input.cancellationRate}
                      onChange={(value) => update("cancellationRate", value)}
                    />
                  </Field>
                  <Field label="Chi phí 1 đơn hủy">
                    <MoneyInput
                      value={input.cancellationCost}
                      onChange={(value) => update("cancellationCost", value)}
                    />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Tỷ lệ giao thất bại (Bom hàng)">
                    <NumberInput
                      value={input.deliveryFailureRate}
                      onChange={(value) => update("deliveryFailureRate", value)}
                    />
                  </Field>
                  <Field label="Tỷ lệ hoàn sau giao">
                    <NumberInput value={input.returnRate} onChange={(value) => update("returnRate", value)} />
                  </Field>
                  <Field label="Phí vận chuyển hoàn">
                    <MoneyInput
                      value={input.returnCostPerOrder}
                      onChange={(value) => update("returnCostPerOrder", value)}
                    />
                  </Field>
                  <Field label="Phí sàn không được hoàn">
                    <MoneyInput
                      value={input.nonRefundableReturnFee}
                      onChange={(value) => update("nonRefundableReturnFee", value)}
                    />
                  </Field>
                  <Field label="Thu hồi giá trị hàng hoàn">
                    <NumberInput
                      value={input.returnedInventoryRecoveryRate}
                      onChange={(value) => update("returnedInventoryRecoveryRate", value)}
                    />
                  </Field>
                  <Field label="Tỷ lệ hao hụt / hỏng hàng">
                    <NumberInput value={input.damageRate} onChange={(value) => update("damageRate", value)} />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <Field label="Dự phòng KOC phát sinh" hint="">
                    <NumberInput
                      value={input.extraKocCostRate}
                      onChange={(value) => update("extraKocCostRate", value)}
                    />
                  </Field>
                  <Field label="Vận hành chiến dịch khác">
                    <MoneyInput
                      value={input.otherOperatingCost}
                      onChange={(value) => update("otherOperatingCost", value)}
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

          </div>

          {/* Nút Submit ghim cố định ở đáy cột trái */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-1.5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={calculate}
              disabled={isCalculating}
              className="btn-brand-cta flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-black text-white shadow-md shadow-brand/25 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
            >
              {isCalculating ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Đang Tính Toán Kế Hoạch...</span>
                </>
              ) : (
                <>
                  <Calculator size={17} />
                  <span>{hasCalculated ? "Cập Nhật & Tính Toán Lại" : "Tính Toán Kế Hoạch KOC"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: KẾT QUẢ DỰ PHÓNG TÀI CHÍNH */}
      <div className="lg:col-span-7 min-h-[520px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
          {/* Header cột phải */}
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 relative z-10 bg-slate-50/70 dark:bg-slate-800/50 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-brand/10 text-brand">
                <BarChart3 size={16} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm leading-none">
                  Dự Phóng Tài Chính KOC
                </h2>
                <span className="text-[10px] text-slate-400 font-medium">TikTok Shop P&L Model</span>
              </div>
            </div>

            {/* Cụm nút hành động */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={save}
                disabled={!hasCalculated}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 disabled:opacity-40 transition shadow-xs cursor-pointer"
              >
                <Save size={12} /> Lưu
              </button>
              <button
                type="button"
                disabled={!hasCalculated}
                onClick={exportCsv}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition shadow-xs cursor-pointer"
              >
                <Download size={12} /> CSV
              </button>
              <button
                type="button"
                disabled={!hasCalculated}
                onClick={exportExcel}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet size={12} /> Excel
              </button>
              <button
                type="button"
                disabled={!hasCalculated}
                onClick={copyResult}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition shadow-xs cursor-pointer active:scale-95"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <ClipboardCopy size={12} />}
                {copied ? "Đã chép" : "Sao chép"}
              </button>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 transition shadow-xs cursor-pointer"
                title="Xem lịch sử các phương án KOC đã lưu"
              >
                <Clock size={12} />
                <span>Lịch sử {savedPlans.length > 0 ? `(${savedPlans.length})` : ""}</span>
              </button>
            </div>
          </div>

          {/* Nội dung kết quả cuộn mượt */}
          <div className="p-3.5 sm:p-4 flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar space-y-4">
            {isCalculating ? (
              <div className="min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-light text-brand flex items-center justify-center mb-1 shadow-lg shadow-brand/15">
                  <Loader2 size={28} className="animate-spin text-brand" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Đang Tính Toán & Mô Phỏng Phễu KOC...
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                    Hệ thống đang mô phỏng dữ liệu phân bổ ngân sách, tỷ lệ hoàn hàng và bảng cân đối P&L TikTok Shop...
                  </p>
                </div>
              </div>
            ) : !hasCalculated || !result ? (
              <div className="space-y-6">
                <div className="min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-brand-light text-brand flex items-center justify-center mb-1 shadow-lg shadow-brand/10">
                    <BarChart3 size={28} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Chưa Có Kết Quả Dự Phóng Chiến Dịch
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                    Thiết lập ngân sách và thông số chiến dịch ở cột bên trái rồi nhấn <strong className="text-brand font-semibold">"Tính toán Kế hoạch KOC"</strong>. Hệ thống sẽ mô phỏng toàn bộ phễu KOC, video, đơn hàng và bảng P&L tài chính chi tiết.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={runSample}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand hover:bg-brand-hover px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer transition-all"
                    >
                      <Sparkles size={14} /> Chạy thử với dữ liệu mẫu
                    </button>
                    {savedPlans.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 px-3.5 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 transition cursor-pointer shadow-xs"
                      >
                        <Clock size={14} /> Xem lịch sử ({savedPlans.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Hero Profit Card */}
                <section
                  className={`relative overflow-hidden rounded-3xl border shadow-xl transition-all ${isLoss
                    ? "border-rose-500/40 bg-gradient-to-br from-rose-950 via-slate-950 to-slate-950"
                    : "border-slate-800 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
                    }`}
                >
                  {/* Ambient Glow */}
                  <div
                    className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-25 blur-3xl"
                    style={{ background: isLoss ? "#e11d48" : "var(--brand-primary)" }}
                  />

                  <div className="relative p-6 sm:p-7 text-white">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                            Lợi nhuận ròng dự kiến
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${isLoss ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
                              }`}
                          >
                            Biên ròng: {result.netMargin.toFixed(1)}%
                          </span>
                        </div>
                        <p
                          className={`mt-2 text-4xl sm:text-5xl font-black font-mono tracking-tight ${isLoss ? "text-rose-400" : "text-emerald-400"
                            }`}
                        >
                          {money(result.netProfit)}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-400 font-medium">
                          ROI Chiến dịch:{" "}
                          <strong className={result.roi < 0 ? "text-rose-400" : "text-emerald-400"}>
                            {result.roi.toFixed(1)}%
                          </strong>{" "}
                          • Doanh thu sau hoàn:{" "}
                          <strong className="text-white font-mono">{money(result.netRevenue)}</strong>
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={copyResult}
                          className="flex h-fit items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer active:scale-95"
                        >
                          {copied ? <Check size={14} className="text-emerald-400" /> : <ClipboardCopy size={14} />}
                          {copied ? "Đã chép" : "Sao chép"}
                        </button>
                      </div>
                    </div>

                    {/* 4 Core Financial Metrics */}
                    <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Tổng ngân sách</p>
                        <p className="mt-1 text-sm font-black font-mono text-white">{money(input.totalBudget)}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">KOC làm video</p>
                        <p className="mt-1 text-sm font-black font-mono text-white">
                          {number(result.effectiveKocs)} / {number(result.invitedKocs)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Đơn thành công</p>
                        <p className="mt-1 text-sm font-black font-mono text-emerald-400">
                          {number(result.successfulOrders, 1)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Đơn hòa vốn</p>
                        <p className="mt-1 text-sm font-black font-mono text-white">
                          {result.breakEvenOrders === null ? "—" : number(result.breakEvenOrders, 1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Four Financial Intelligence KPI Cards Grid (2x2) */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-bold uppercase">ROI Toàn bộ</span>
                      <Percent size={14} className="text-brand" />
                    </div>
                    <p
                      className={`mt-2 font-mono text-lg font-black ${result.roi < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                        }`}
                    >
                      {result.roi.toFixed(1)}%
                    </p>
                    <span className="mt-1 block text-[10px] text-slate-400">
                      {result.roi > 50 ? "Hiệu quả cao" : result.roi > 0 ? "Khả quan" : "Cần tối ưu"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-bold uppercase">ROAS Ads</span>
                      <Tv size={14} className="text-brand" />
                    </div>
                    <p className="mt-2 font-mono text-lg font-black text-slate-900 dark:text-white">
                      {result.roas === null ? "—" : `${result.roas.toFixed(2)}x`}
                    </p>
                    <span className="mt-1 block text-[10px] text-slate-400">
                      {input.useAds ? `Đơn Ads: ${number(result.adOrders, 1)}` : "Tắt Ads"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-bold uppercase">Chi phí / Đơn</span>
                      <Package size={14} className="text-brand" />
                    </div>
                    <p className="mt-2 font-mono text-lg font-black text-slate-900 dark:text-white">
                      {result.costPerSuccessfulOrder === null ? "—" : money(result.costPerSuccessfulOrder)}
                    </p>
                    <span className="mt-1 block text-[10px] text-slate-400">Trên mỗi đơn giao đạt</span>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-bold uppercase">CPA Hòa vốn</span>
                      <Target size={14} className="text-brand" />
                    </div>
                    <p className="mt-2 font-mono text-lg font-black text-slate-900 dark:text-white">
                      {result.breakEvenCpa === null ? "—" : money(result.breakEvenCpa)}
                    </p>
                    <span className="mt-1 block text-[10px] text-slate-400">Mức trần chi phí Ads</span>
                  </div>
                </div>

                {/* 3. Deep Analytical Tabs */}
                <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                  {/* Tab Header Buttons */}
                  <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab("budget")}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold transition cursor-pointer ${activeTab === "budget"
                        ? "bg-white dark:bg-slate-900 text-brand shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                      <PieChart size={14} /> Phân bổ Ngân sách
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("funnel")}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold transition cursor-pointer ${activeTab === "funnel"
                        ? "bg-white dark:bg-slate-900 text-brand shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                      <Layers size={14} /> Sản lượng & Funnel
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("pnl")}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold transition cursor-pointer ${activeTab === "pnl"
                        ? "bg-white dark:bg-slate-900 text-brand shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                      <ReceiptText size={14} /> Báo cáo P&L Doanh thu
                    </button>
                  </div>

                  <div className="p-5 sm:p-6">
                    {/* Tab 1: Phân bổ ngân sách */}
                    {activeTab === "budget" && (
                      <div className="space-y-4">
                        {/* Visual Allocation Bar */}
                        <div>
                          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                            <span>Biểu đồ tỷ lệ ngân sách ({money(input.totalBudget)})</span>
                            <span className="text-brand">
                              {((result.sampleAndCastCost / input.totalBudget) * 100).toFixed(0)}% Mẫu & Booking •{" "}
                              {((result.adSpend / input.totalBudget) * 100).toFixed(0)}% Ads
                            </span>
                          </div>
                          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              style={{ width: `${Math.min(100, (result.sampleAndCastCost / input.totalBudget) * 100)}%` }}
                              className="bg-brand"
                              title="Ngân sách Mẫu & Booking KOC"
                            />
                            <div
                              style={{ width: `${Math.min(100, (result.adSpend / input.totalBudget) * 100)}%` }}
                              className="bg-sky-400"
                              title="Ngân sách Quảng cáo Ads"
                            />
                            <div
                              style={{ width: `${Math.max(0, (result.unusedBudget / input.totalBudget) * 100)}%` }}
                              className="bg-amber-400"
                              title="Ngân sách chưa phân bổ"
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-brand" /> Mẫu & Booking KOC
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-sky-400" /> Ngân sách Ads
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-amber-400" /> Chưa phân bổ
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
                          <ResultRow
                            label="Ngân sách mẫu / booking khả dụng"
                            value={money(result.creatorBudget)}
                          />
                          <ResultRow
                            label="Chi phí chuẩn bị cho mỗi KOC được mời"
                            value={money(result.costPerInvitedKoc)}
                            subtext="Bao gồm: Hàng mẫu + Ship mẫu + Booking cast"
                          />
                          <ResultRow
                            label="Tổng chi phí mẫu & booking thực dùng"
                            value={money(result.sampleAndCastCost)}
                            strong
                          />
                          <ResultRow
                            label="Ngân sách phân bổ cho Quảng cáo Ads"
                            value={money(result.adSpend)}
                            strong
                          />
                          <ResultRow
                            label="Ngân sách dôi dư / chưa phân bổ"
                            value={money(result.unusedBudget)}
                            tone={result.unusedBudget > 0 ? "orange" : "slate"}
                          />
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Sản lượng KOC & Funnel */}
                    {activeTab === "funnel" && (
                      <div className="space-y-3">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">1. KOC Mời</span>
                            <p className="mt-1 text-lg font-black font-mono text-slate-900 dark:text-white">
                              {number(result.invitedKocs)}
                            </p>
                            <span className="text-[11px] text-slate-400">Được gửi mẫu</span>
                          </div>
                          <div className="rounded-2xl border border-brand/20 bg-brand-light/20 dark:bg-brand-light/10 p-3.5">
                            <span className="text-[10px] uppercase font-bold text-brand">2. KOC Lên clip</span>
                            <p className="mt-1 text-lg font-black font-mono text-brand">
                              {number(result.effectiveKocs)}
                            </p>
                            <span className="text-[11px] text-brand">Tỷ lệ {input.effectiveKocRate}%</span>
                          </div>
                          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">3. Video clip</span>
                            <p className="mt-1 text-lg font-black font-mono text-slate-900 dark:text-white">
                              {number(result.videos)}
                            </p>
                            <span className="text-[11px] text-slate-400">{input.videosPerKoc} video/KOC</span>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">4. Đơn tự nhiên</span>
                            <p className="mt-1 text-lg font-black font-mono text-slate-900 dark:text-white">
                              {number(result.organicOrders, 1)}
                            </p>
                            <span className="text-[11px] text-slate-400">Từ video KOC</span>
                          </div>
                          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">5. Đơn từ Ads</span>
                            <p className="mt-1 text-lg font-black font-mono text-slate-900 dark:text-white">
                              {number(result.adOrders, 1)}
                            </p>
                            <span className="text-[11px] text-slate-400">Chạy Spark Ads</span>
                          </div>
                          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 p-3.5">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                              6. Đơn thành công
                            </span>
                            <p className="mt-1 text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                              {number(result.successfulOrders, 1)}
                            </p>
                            <span className="text-[11px] text-emerald-600/80">Sau trừ hủy/hoàn</span>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1">
                          <ResultRow
                            label="Tổng đơn hàng kỳ vọng ban đầu"
                            value={`${number(result.expectedOrders, 1)} đơn`}
                          />
                          <ResultRow
                            label="Số đơn bị hủy / giao thất bại / hoàn hàng"
                            value={`-${number(result.returnedOrders, 1)} đơn`}
                            tone="orange"
                          />
                          <ResultRow
                            label="Số đơn giao thành công thực tế"
                            value={`${number(result.successfulOrders, 1)} đơn`}
                            tone="green"
                            strong
                          />
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Báo cáo P&L Doanh thu & Chi phí */}
                    {activeTab === "pnl" && (
                      <div className="space-y-3">
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                            Dòng Doanh Thu & Dòng Tiền Về Ví
                          </span>
                          <div className="mt-1 space-y-1">
                            <ResultRow
                              label="Tổng GMV niêm yết (trước rủi ro)"
                              value={money(result.grossRevenue)}
                            />
                            <ResultRow
                              label="Doanh thu kỳ vọng sau hủy / hoàn"
                              value={money(result.netRevenue)}
                              tone="green"
                              strong
                            />
                            <ResultRow
                              label="Giải ngân sàn trước Affiliate & Thuế"
                              value={money(result.expectedPayoutBeforeAffiliate)}
                              tone="green"
                            />
                            <ResultRow
                              label="Dòng tiền ròng thực nhận về ví sàn"
                              value={money(result.expectedNetSettlement)}
                              tone="green"
                              strong
                              highlight
                            />
                          </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                            Các Khoản Chi Phí Chiến Dịch
                          </span>
                          <div className="mt-1 space-y-1">
                            <ResultRow
                              label="Chi phí Hàng mẫu & Booking KOC"
                              value={`-${money(result.sampleAndCastCost)}`}
                            />
                            <ResultRow
                              label="Ngân sách Chạy Quảng cáo Ads"
                              value={`-${money(result.adSpend)}`}
                            />
                            <ResultRow
                              label="Hoa hồng KOC đơn tự nhiên"
                              value={`-${money(result.organicCommission)}`}
                            />
                            <ResultRow
                              label="Hoa hồng KOC đơn quảng cáo"
                              value={`-${money(result.adsCommission)}`}
                            />
                            <ResultRow
                              label="Tổng phí dịch vụ sàn TikTok Shop"
                              value={`-${money(result.platformFees)}`}
                            />
                            <ResultRow
                              label="Thuế trên doanh thu ước tính"
                              value={`-${money(result.taxes)}`}
                            />
                            <ResultRow
                              label="Giá vốn hàng bán (COGS đơn giao thành công)"
                              value={`-${money(result.soldGoodsCost)}`}
                            />
                            <ResultRow
                              label="Đóng gói, nhân sự, vận hành & ship shop"
                              value={`-${money(result.fulfillmentCost)}`}
                            />
                            <ResultRow
                              label="Tổn thất trạng thái đơn (hủy / giao lỗi / ship hoàn)"
                              value={`-${money(result.returnLoss)}`}
                              tone="orange"
                            />
                            <ResultRow
                              label="Dự phòng KOC phát sinh & chi phí khác"
                              value={`-${money(result.extraKocCost)}`}
                            />
                            <ResultRow
                              label="Tổng chi phí chiến dịch"
                              value={money(result.totalCost)}
                              tone="red"
                              strong
                              highlight
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* 4. Warning Alerts */}
                {result.warnings.length > 0 && (
                  <div className="space-y-2">
                    {result.warnings.map((warning, index) => (
                      <div
                        key={index}
                        className="flex gap-2.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-300"
                      >
                        <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Policy & Reference Citations */}
                <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    <FileText size={16} className="text-brand" />
                    <span>Căn cứ pháp lý & Biểu phí TikTok Shop Việt Nam</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Tỷ lệ hoa hồng được tham chiếu trực tiếp từ biểu phí TikTok Shop Seller University mới nhất. Thuế
                    áp dụng theo chính sách kê khai TMĐT hiện hành.
                  </p>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <a
                      href={SOURCES.tiktok}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-brand hover:border-brand transition"
                    >
                      Phí nhà bán hàng <ExternalLink size={10} />
                    </a>
                    <a
                      href={SOURCES.tiktokTransaction}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-brand hover:border-brand transition"
                    >
                      Phí giao dịch <ExternalLink size={10} />
                    </a>
                    <a
                      href={SOURCES.tiktokVxp}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-brand hover:border-brand transition"
                    >
                      Voucher Extra <ExternalLink size={10} />
                    </a>
                    <a
                      href={SOURCES.tax}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-brand hover:border-brand transition"
                    >
                      Thuế TMĐT <ExternalLink size={10} />
                    </a>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
