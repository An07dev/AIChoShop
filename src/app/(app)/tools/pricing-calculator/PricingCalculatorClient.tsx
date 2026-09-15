"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calculator,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  Clock,
  Copy,
  ExternalLink,
  FolderOpen,
  Info,
  Layers,
  PackageCheck,
  PieChart,
  ReceiptText,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Table2,
  TrendingDown,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import { useToolGate } from "@/hooks/useToolGate";
import { calculatePricing } from "@/lib/pricing/engine";
import { isFeeProfileStale, resolveFeeProfile, selectFeeOverride } from "@/lib/pricing/fee-resolver";
import {
  detectCategoryMatch,
  FEE_DATA_VERSION,
  getAvailableCategories,
  getCategoryLabel,
  getDefaultCategoryId,
  getFeeProfile,
  getOfficialCategory,
  PROGRAMS,
  SOURCES,
} from "@/lib/pricing/registry";
import { readPricingHistory, writePricingHistory, type PricingCalculationSnapshot } from "@/lib/pricing/storage";
import type { CostMode, ExternalSalesChannel, FeeOverrideRecord, OfficialFeeCategory, Platform, PriceEvaluation, PricingInput, PricingResult, ShopType, TaxMode } from "@/lib/pricing/types";
import BulkPricing from "./BulkPricing";
import { CostVisuals, EmptyCalculation } from "./PricingExtras";

const initialInput: PricingInput = {
  platform: "shopee",
  externalChannel: "facebook",
  shopType: "marketplace",
  categoryId: "shopee-416",
  quantity: 1,
  costPerUnit: 50_000,
  packagingCost: 5_000,
  handlingCost: 0,
  overheadCost: 0,
  sellerShippingCost: 0,
  buyerShippingFee: 0,
  platformDiscount: 0,
  sellerDiscountRate: 0,
  affiliateRate: 0,
  marketingMode: "percent",
  marketingValue: 10,
  commissionOverride: null,
  transactionOverride: null,
  fixedFeeOverride: null,
  enabledProgramIds: [],
  taxMode: "household_revenue",
  taxableRevenueShare: 100,
  manualRevenueTaxRate: 1.5,
  profitTaxRate: 20,
  cancellationRate: 2,
  cancellationCost: 0,
  deliveryFailureRate: 4,
  returnRate: 12,
  returnShippingCost: 25_000,
  nonRefundableReturnFee: 0,
  returnedInventoryRecoveryRate: 95,
  damageRate: 5,
};

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const formatMoney = (value: number) => currency.format(Math.round(value));
const parseMoney = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;
const platformNames: Record<Platform, string> = { shopee: "Shopee", tiktok: "TikTok Shop", external: "Đơn ngoài" };
const externalChannelNames: Record<ExternalSalesChannel, string> = {
  facebook: "Facebook",
  website: "Website",
  youtube: "YouTube",
  other: "Kênh khác",
};

function MoneyInput({
  value,
  onChange,
  className = "",
  placeholder,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div className="relative flex items-center">
      <input
        inputMode="numeric"
        placeholder={placeholder}
        value={value ? new Intl.NumberFormat("vi-VN").format(value) : ""}
        onChange={(e) => onChange(parseMoney(e.target.value))}
        className={`w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 pr-8 text-right text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:focus:border-brand ${className}`}
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
  min = 0,
  max,
  step = 0.5,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
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
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 pr-8 text-right text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:focus:border-brand ${className}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 text-xs font-bold text-slate-400 dark:text-slate-500">
          {suffix}
        </span>
      )}
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

function CategorySelector({
  platform,
  shopType,
  categoryId,
  onChange,
}: {
  platform: Platform;
  shopType: ShopType;
  categoryId: string;
  onChange: (id: string) => void;
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
  const inputClass =
    "w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="space-y-2.5 rounded-2xl border border-brand/20 bg-brand-light/30 dark:bg-brand-light/10 p-3.5 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-brand">Ngành hàng chính thức sàn</span>
        <span className="rounded-full bg-white dark:bg-slate-800 border border-brand/30 px-2.5 py-0.5 text-xs font-black text-brand shadow-xs">
          {shopType === "mall" ? selected.mallRate : selected.marketplaceRate}% hoa hồng
        </span>
      </div>
      <Field label="Ngành cấp 1">
        <select
          aria-label="Ngành cấp 1"
          value={selected.level1}
          onChange={(event) => choose((category) => category.level1 === event.target.value)}
          className={inputClass}
        >
          {level1Values.map((value) => (
            <option key={value} value={value} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              {value}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Ngành cấp 2">
        <select
          aria-label="Ngành cấp 2"
          value={selected.level2}
          onChange={(event) => choose((category) => category.level1 === selected.level1 && category.level2 === event.target.value)}
          className={inputClass}
        >
          {level2Values.map((value) => (
            <option key={value} value={value} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              {value}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Ngành cấp 3 (Chi tiết theo biểu phí)">
        <select
          aria-label="Ngành cấp 3"
          value={selected.id}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        >
          {level3Categories.map((category) => (
            <option key={category.id} value={category.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              {category.level3} — {shopType === "mall" ? category.mallRate : category.marketplaceRate}%
            </option>
          ))}
        </select>
      </Field>
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
  tone?: "slate" | "blue" | "green" | "red" | "amber";
  subtext?: string;
  icon?: ReactNode;
}) {
  const tones = {
    slate: "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
    blue: "border-brand/30 bg-brand-light/30 dark:bg-brand-light/10 text-brand",
    green: "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300",
    red: "border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300",
    amber: "border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300",
  };
  return (
    <div className={`rounded-2xl border p-3.5 sm:p-4 transition-all shadow-xs ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-1">
        <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{label}</p>
        {icon && <div className="opacity-75">{icon}</div>}
      </div>
      <p className="mt-1 text-lg sm:text-xl font-black font-mono tracking-tight">{value}</p>
      {subtext && <p className="mt-0.5 text-[11px] opacity-75 font-medium">{subtext}</p>}
    </div>
  );
}

export default function PricingCalculatorClient({ feeOverrides, feeLoadWarning = false }: { feeOverrides: FeeOverrideRecord[]; feeLoadWarning?: boolean }) {
  const { checkAccess, GateModals } = useToolGate();
  const [workspaceMode, setWorkspaceMode] = useState<"single" | "bulk">("single");
  const [mode, setMode] = useState<"target" | "audit">("target");
  const [activeResultTab, setActiveResultTab] = useState<"all" | "structure" | "breakdown" | "scenarios">("structure");
  const [advanced, setAdvanced] = useState(false);
  const [productName, setProductName] = useState("Áo polo nam thể thao");
  const [input, setInput] = useState<PricingInput>(initialInput);
  const [auditPrice, setAuditPrice] = useState(150_000);
  const [targetMode, setTargetMode] = useState<"margin" | "fixed">("margin");
  const [targetValue, setTargetValue] = useState(20);
  const [roundingStep, setRoundingStep] = useState(1_000);
  const [copied, setCopied] = useState(false);
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null);
  const [suggestionConfidence, setSuggestionConfidence] = useState<"high" | "medium" | null>(null);
  const [appliedCalculation, setAppliedCalculation] = useState<{
    result: PricingResult;
    evaluation: PriceEvaluation;
    input: PricingInput;
    mode: "target" | "audit";
    productName: string;
    auditPrice: number;
    isLoss: boolean;
  } | null>(null);
  const [savedHistory, setSavedHistory] = useState<PricingCalculationSnapshot[]>([]);
  const [saveNotice, setSaveNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productNameError, setProductNameError] = useState("");
  const productNameRef = useRef<HTMLInputElement>(null);

  // Lịch sử modal & hoạt động server (Hoạt động gần đây)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyActivities, setHistoryActivities] = useState<any[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<any | null>(null);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    checkAccess("pricing-calculator", false);
  }, [checkAccess]);

  useEffect(() => {
    setSavedHistory(readPricingHistory(window.localStorage));
  }, []);

  useEffect(() => {
    fetch("/api/ai/usage?tool=pricing-calculator")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setHistoryActivities(data.recentActivities || []);
          setHistoryTotal(data.totalGenerated || 0);
        }
      })
      .catch(() => { });
  }, [historyRefreshTrigger]);

  const handleCopyHistory = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedHistoryId(id);
    setTimeout(() => setCopiedHistoryId(null), 2000);
  };

  const displayActivities = useMemo(() => {
    if (historyActivities.length > 0) return historyActivities;
    return savedHistory.map((s) => ({
      id: s.id,
      tool: "pricing-calculator",
      toolName: "Tính Giá Bán",
      action: `Định giá "${s.productName}" - ${s.input.platform.toUpperCase()}`,
      time: "Đã lưu",
      createdAt: s.createdAt,
      output: `Sản phẩm: ${s.productName}\nSàn: ${s.input.platform.toUpperCase()}\nGiá vốn: ${(s.input.costPerUnit || 0).toLocaleString("vi-VN")}đ\nGiá bán đề xuất: ${(s.result?.evaluation?.listPrice || s.auditPrice || 0).toLocaleString("vi-VN")}đ\nLợi nhuận ròng/đơn: ${(s.result?.evaluation?.expectedProfitPerOrder || 0).toLocaleString("vi-VN")}đ\nTỷ suất lợi nhuận: ${(s.result?.evaluation?.expectedMargin || 0).toFixed(1)}%`,
      snapshot: s,
    }));
  }, [historyActivities, savedHistory]);

  const update = <K extends keyof PricingInput>(key: K, value: PricingInput[K]) =>
    setInput((current) => ({ ...current, [key]: value }));

  const availableCategories = getAvailableCategories(input.platform, input.shopType);
  const selectedCategory =
    availableCategories.find((category) => category.id === input.categoryId) ?? availableCategories[0];
  const feeProfile = resolveFeeProfile(input.platform, input.shopType, input.categoryId, feeOverrides);
  const adminOverride = selectFeeOverride(feeOverrides, input.platform, input.shopType, feeProfile.categoryId);

  const calculationInput = useMemo(
    () => ({
      ...input,
      commissionOverride: input.commissionOverride ?? adminOverride?.commissionRate ?? null,
      transactionOverride: input.transactionOverride ?? adminOverride?.transactionRate ?? null,
      fixedFeeOverride: input.fixedFeeOverride ?? adminOverride?.orderProcessingFee ?? null,
    }),
    [adminOverride, input]
  );

  const hasCalculated = !!appliedCalculation;
  const result = appliedCalculation?.result;
  const evaluation = appliedCalculation?.evaluation;
  const isLoss = appliedCalculation?.isLoss ?? false;

  const applyCategory = (categoryId: string) => {
    const category = getOfficialCategory(categoryId);
    if (!category) return;
    setInput((current) => ({ ...current, categoryId, commissionOverride: null }));
    setSuggestedCategoryId(null);
  };

  const changePlatform = (platform: Platform) => {
    setInput((current) => ({
      ...current,
      platform,
      categoryId: getDefaultCategoryId(platform, current.shopType),
      commissionOverride: null,
      transactionOverride: null,
      fixedFeeOverride: null,
      enabledProgramIds: [],
    }));
  };

  const changeShopType = (shopType: ShopType) => {
    setInput((current) => ({
      ...current,
      shopType,
      categoryId: getDefaultCategoryId(current.platform, shopType),
      commissionOverride: null,
      transactionOverride: null,
      fixedFeeOverride: null,
    }));
  };

  const toggleProgram = (id: string) =>
    setInput((current) => ({
      ...current,
      enabledProgramIds: current.enabledProgramIds.includes(id)
        ? current.enabledProgramIds.filter((item) => item !== id)
        : [...current.enabledProgramIds, id],
    }));

  const handleName = (name: string) => {
    setProductName(name);
    setProductNameError("");
    const found = detectCategoryMatch(name, input.platform, input.shopType);
    setSuggestedCategoryId(found && found.category.id !== input.categoryId ? found.category.id : null);
    setSuggestionConfidence(found?.confidence ?? null);
  };

  const reset = () => {
    setInput({
      ...initialInput,
      platform: input.platform,
      externalChannel: input.externalChannel,
      categoryId: getDefaultCategoryId(input.platform, initialInput.shopType),
    });
    setMode("target");
    setProductName("");
    setAuditPrice(150_000);
    setTargetMode("margin");
    setTargetValue(20);
    setRoundingStep(1_000);
    setSuggestedCategoryId(null);
    setSuggestionConfidence(null);
    setAppliedCalculation(null);
    setSaveNotice("");
    setEditingId(null);
    setProductNameError("");
  };

  const calculate = () => {
    if (!productName.trim()) {
      setProductNameError("Vui lòng nhập tên sản phẩm trước khi tính toán.");
      productNameRef.current?.focus();
      return;
    }
    setProductNameError("");

    const computedResult = calculatePricing(calculationInput, mode, auditPrice, {
      mode: targetMode,
      value: targetValue,
      roundingStep,
    });

    const applied = {
      result: computedResult,
      evaluation: computedResult.evaluation,
      input: { ...calculationInput },
      mode,
      productName: productName.trim(),
      auditPrice,
      isLoss: computedResult.evaluation.expectedProfitPerOrder < 0,
    };
    setAppliedCalculation(applied);

    // Tự động lưu snapshot vào lịch sử
    const snapshotId = editingId || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    const item: PricingCalculationSnapshot = {
      id: snapshotId,
      createdAt: new Date().toISOString(),
      productName: productName.trim(),
      mode,
      input: calculationInput,
      auditPrice,
      targetMode,
      targetValue,
      roundingStep,
      result: computedResult,
      feeVersion: feeProfile.dataVersion,
      feeSource: feeProfile.sourceName,
    };

    setEditingId(snapshotId);

    persistHistory(
      editingId ? savedHistory.map((saved) => (saved.id === editingId ? item : saved)) : [item, ...savedHistory]
    );
    setSaveNotice(
      editingId ? `Đã tính toán & cập nhật “${item.productName}”.` : `Đã tính toán & lưu “${item.productName}” vào lịch sử.`
    );

    // Gửi log đến server để hiển thị tại "Hoạt động gần đây" (Dashboard & Modal Lịch sử)
    const targetSelling = computedResult.targetPrice ?? computedResult.evaluation?.listPrice ?? auditPrice;
    const netProfit = computedResult.evaluation?.expectedProfitPerOrder ?? 0;
    const margin = computedResult.evaluation?.expectedMargin ?? 0;
    const totalFees = computedResult.evaluation?.platformFees ?? 0;
    const totalTaxes = computedResult.evaluation?.tax ?? 0;
    const platformName = input.platform === "shopee" ? "Shopee" : input.platform === "tiktok" ? "TikTok" : "Đơn ngoài";

    fetch("/api/ai/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "pricing-calculator",
        toolName: "Tính Giá Bán",
        action: editingId
          ? `Cập nhật định giá "${productName.trim()}" - ${platformName}`
          : `Định giá "${productName.trim()}" - ${platformName}`,
        input: {
          productName: productName.trim(),
          platform: input.platform,
          shopType: input.shopType,
          costPerUnit: input.costPerUnit,
          targetSellingPrice: targetSelling,
          netProfit,
          margin,
          snapshotId: item.id,
          snapshot: item,
        },
        output: `Sản phẩm: ${productName.trim()}\nSàn: ${platformName} (${input.shopType === "mall" ? "Mall" : "Shop thường"})\nGiá vốn: ${input.costPerUnit.toLocaleString("vi-VN")}đ\nGiá bán đề xuất: ${targetSelling.toLocaleString("vi-VN")}đ\nLợi nhuận ròng/đơn: ${netProfit.toLocaleString("vi-VN")}đ\nTỷ suất lợi nhuận: ${margin.toFixed(1)}%\nTổng phí sàn: ${totalFees.toLocaleString("vi-VN")}đ\nThuế TMĐT: ${totalTaxes.toLocaleString("vi-VN")}đ`,
      }),
    })
      .then(() => setHistoryRefreshTrigger((prev) => prev + 1))
      .catch((err) => console.warn("Failed to log pricing usage:", err));
  };


  const persistHistory = (next: PricingCalculationSnapshot[]) => {
    setSavedHistory(next);
    writePricingHistory(window.localStorage, next);
  };

  const saveCurrent = () => {
    calculate();
  };

  const saveMany = (items: PricingCalculationSnapshot[]) => {
    persistHistory([...items, ...savedHistory]);
    setSaveNotice(`Đã lưu ${items.length} sản phẩm từ file CSV.`);

    fetch("/api/ai/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "pricing-calculator",
        toolName: "Tính Giá Bán",
        action: `Định giá hàng loạt ${items.length} sản phẩm`,
        input: { count: items.length },
        output: `Đã tính toán và lưu ${items.length} sản phẩm định giá hàng loạt vào tài khoản.`,
      }),
    })
      .then(() => setHistoryRefreshTrigger((prev) => prev + 1))
      .catch((err) => console.warn("Failed to log bulk pricing:", err));
  };

  const openSaved = (item: PricingCalculationSnapshot) => {
    setWorkspaceMode("single");
    setProductName(item.productName);
    setMode(item.mode);
    setInput(item.input);
    setAuditPrice(item.auditPrice);
    setTargetMode(item.targetMode);
    setTargetValue(item.targetValue);
    setRoundingStep(item.roundingStep);
    setSuggestedCategoryId(null);
    setSuggestionConfidence(null);

    const computedResult = item.result || calculatePricing(item.input, item.mode, item.auditPrice, {
      mode: item.targetMode,
      value: item.targetValue,
      roundingStep: item.roundingStep,
    });

    setAppliedCalculation({
      result: computedResult,
      evaluation: computedResult.evaluation,
      input: { ...item.input },
      mode: item.mode,
      productName: item.productName,
      auditPrice: item.auditPrice,
      isLoss: computedResult.evaluation.expectedProfitPerOrder < 0,
    });

    setEditingId(item.id);
    setSaveNotice(`Đã mở lại “${item.productName}”. Bạn có thể sửa, tính lại rồi nhấn Cập nhật.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteSaved = (id: string) => {
    if (editingId === id) setEditingId(null);
    persistHistory(savedHistory.filter((item) => item.id !== id));
  };

  const deleteAllSaved = () => {
    if (window.confirm("Xóa toàn bộ lịch sử định giá đã lưu trên trình duyệt này?")) {
      setEditingId(null);
      persistHistory([]);
    }
  };

  const copyResult = async () => {
    if (!evaluation || !result) return;
    const fees = evaluation.fees.map((fee) => `- ${fee.name}: ${formatMoney(fee.amount)}`).join("\n");
    const channel = input.platform === "external" ? externalChannelNames[input.externalChannel] : platformNames[input.platform];
    const classification = input.platform === "external" ? `Kênh bán: ${channel}` : `Ngành: ${getCategoryLabel(selectedCategory)}`;
    await navigator.clipboard.writeText(
      `PHÂN TÍCH GIÁ BÁN ${channel.toUpperCase()}\nSản phẩm: ${productName || "Chưa đặt tên"}\n${classification}\nGiá niêm yết: ${formatMoney(
        evaluation.listPrice
      )}\nGiá hòa vốn: ${result.breakEvenPrice === null ? "Không khả thi" : formatMoney(result.breakEvenPrice)
      }\n${input.platform === "external" ? "Thực thu" : "Tiền sàn giải ngân"}: ${formatMoney(
        evaluation.payout
      )}\n${fees}\nLãi đơn thành công: ${formatMoney(evaluation.profitOnSuccess)}\nLãi kỳ vọng/đơn phát sinh: ${formatMoney(
        evaluation.expectedProfitPerOrder
      )}\nBiên kỳ vọng: ${evaluation.expectedMargin.toFixed(1)}%\nDữ liệu phí: ${FEE_DATA_VERSION}`
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const suggestion = suggestedCategoryId ? getOfficialCategory(suggestedCategoryId) : undefined;

  return (
    <div className="mx-auto max-w-7xl pb-16 px-2 sm:px-4">
      <GateModals />
      {feeLoadWarning && <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">Không tải được biểu phí quản trị. Kết quả đang dùng bộ phí tích hợp; hãy kiểm tra lại trước khi quyết định giá.</div>}
      {isFeeProfileStale(feeProfile) && <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">Biểu phí này đã quá 90 ngày kể từ lần xác minh hoặc ngày hiệu lực. Hãy đối chiếu Seller Center trước khi chốt giá.</div>}

      {/* Modal Lịch Sử Định Giá Gần Đây (Giống trang Chat Broadcast & Zalo) */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => {
              setIsHistoryModalOpen(false);
              setViewingHistoryItem(null);
            }}
          />

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 relative z-10 flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {viewingHistoryItem ? "Chi tiết định giá" : "Lịch Sử Định Giá Gần Đây"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {viewingHistoryItem
                      ? (viewingHistoryItem.toolName || "Tính Giá Bán")
                      : `Tổng cộng ${displayActivities.length} bản ghi đã lưu vào tài khoản`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (viewingHistoryItem) {
                    setViewingHistoryItem(null);
                  } else {
                    setIsHistoryModalOpen(false);
                  }
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
              {viewingHistoryItem ? (
                /* Chi tiết 1 bản ghi */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {viewingHistoryItem.action}
                    </span>
                    <span className="text-slate-400">{viewingHistoryItem.time || "Gần đây"}</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
                    {viewingHistoryItem.output || "(Không có nội dung)"}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setViewingHistoryItem(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      Quay lại danh sách
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Nút nạp lại vào bảng tính nếu tìm thấy snapshot */}
                      {(() => {
                        const matchedSnapshot =
                          viewingHistoryItem.snapshot ||
                          savedHistory.find(
                            (s) =>
                              s.id === viewingHistoryItem.input?.snapshotId ||
                              viewingHistoryItem.action?.includes(s.productName)
                          );
                        if (!matchedSnapshot) return null;
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              openSaved(matchedSnapshot);
                              setIsHistoryModalOpen(false);
                              setViewingHistoryItem(null);
                            }}
                            className="px-3.5 py-2 text-xs font-bold bg-brand hover:bg-brand-hover text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <FolderOpen size={14} /> Nạp vào bảng tính
                          </button>
                        );
                      })()}

                      {viewingHistoryItem.output && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyHistory(
                              viewingHistoryItem.id,
                              viewingHistoryItem.output || ""
                            )
                          }
                          className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {copiedHistoryId === viewingHistoryItem.id ? (
                            <>
                              <Check size={14} /> Đã sao chép!
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Sao chép tóm tắt
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Danh sách bản ghi gần đây */
                <div className="space-y-2.5">
                  {displayActivities.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Sparkles size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-medium text-sm text-slate-600 dark:text-slate-300">
                        Chưa có lịch sử định giá nào
                      </p>
                      <p className="text-xs mt-1 text-slate-400">
                        Hãy nhập thông tin sản phẩm và bấm Cập nhật & Tính toán để lưu tự động.
                      </p>
                    </div>
                  ) : (
                    displayActivities.map((item: any) => {
                      const matchedSnapshot =
                        item.snapshot ||
                        savedHistory.find(
                          (s) =>
                            s.id === item.input?.snapshotId ||
                            item.action?.includes(s.productName)
                        );

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/60 transition-all flex items-start justify-between gap-3 group"
                        >
                          <div
                            className="flex-1 cursor-pointer min-w-0"
                            onClick={() => setViewingHistoryItem(item)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                                {item.toolName || "Tính Giá Bán"}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {item.time || (item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "Gần đây")}
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                              {item.action}
                            </h4>
                            {item.output && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-mono">
                                {item.output.replace(/\n/g, " • ").slice(0, 90)}...
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0 pt-1">
                            {matchedSnapshot && (
                              <button
                                type="button"
                                onClick={() => {
                                  openSaved(matchedSnapshot);
                                  setIsHistoryModalOpen(false);
                                }}
                                title="Nạp lại vào bảng tính"
                                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600 shadow-2xs"
                              >
                                <FolderOpen size={14} />
                              </button>
                            )}
                            {item.output && (
                              <button
                                type="button"
                                onClick={() => handleCopyHistory(item.id, item.output || "")}
                                title="Sao chép tóm tắt"
                                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600 shadow-2xs"
                              >
                                {copiedHistoryId === item.id ? (
                                  <Check size={14} className="text-emerald-500" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setViewingHistoryItem(item)}
                              title="Xem chi tiết"
                              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600 shadow-2xs"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. Header Toolbar */}
      <div className="mb-6 space-y-4">
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
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    Tính Giá Bán & Tối Ưu Lợi Nhuận
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs uppercase tracking-wider">
                    <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400" />
                    FREE TOOL
                  </span>
                  <span className="hidden sm:inline-flex rounded-full bg-brand-light/80 border border-brand/30 px-2.5 py-0.5 text-[10px] font-black text-brand uppercase tracking-wider">
                    {FEE_DATA_VERSION}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Hạch toán toàn diện phí sàn TMĐT, thuế, voucher và chi phí rủi ro đơn hủy, giao thất bại, trả hàng.
                </p>
              </div>
            </div>
          </div>

          {/* Workspace Switcher: Single vs Bulk & Nút Lịch Sử ở cạnh Định giá đơn lẻ */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-slate-800/90 p-1 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <button
                type="button"
                onClick={() => setWorkspaceMode("single")}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${workspaceMode === "single"
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                <Calculator size={14} /> Định giá đơn lẻ
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode("bulk")}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${workspaceMode === "bulk"
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                <Table2 size={14} /> Định giá hàng loạt
              </button>
            </div>

            {/* Nút Lịch sử ở cạnh Định giá đơn lẻ */}
            <button
              type="button"
              onClick={() => {
                setViewingHistoryItem(null);
                setIsHistoryModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Xem lịch sử định giá đã tính toán"
            >
              <Clock size={14} className="text-blue-500 shrink-0" />
              <span>Lịch sử</span>
            </button>
          </div>
        </div>
      </div>

      {workspaceMode === "bulk" ? (
        <>
          <BulkPricing baseInput={input} feeOverrides={feeOverrides} onSaveAll={saveMany} />
          {saveNotice && (
            <div className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              {saveNotice}
            </div>
          )}
        </>
      ) : (
        <>
          {/* 2. Interactive Platform Selector Cards */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                {
                  id: "shopee",
                  name: "Shopee",
                  badge: "Sàn TMĐT",
                  hint: "Phí sàn ~11.5% - 14.5% (Tự động theo ngành)",
                  color: "orange",
                },
                {
                  id: "tiktok",
                  name: "TikTok Shop",
                  badge: "Video & Live",
                  hint: "Phí sàn ~10.0% - 13.0% (Tự động theo ngành)",
                  color: "emerald",
                },
                {
                  id: "external",
                  name: "Đơn tự chốt (Đa kênh)",
                  badge: "Facebook, Web, Zalo",
                  hint: "Tùy chỉnh phí cổng & COD (Không phí sàn)",
                  color: "brand",
                },
              ] as const
            ).map((p) => {
              const isActive = input.platform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => changePlatform(p.id)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer ${isActive
                    ? "border-brand bg-brand-light/30 dark:bg-brand-light/15 shadow-md shadow-brand/10 ring-2 ring-brand/20"
                    : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                      {p.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive
                        ? "bg-brand text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {p.hint}
                  </p>
                  {isActive && (
                    <div className="absolute right-3 bottom-3 h-2 w-2 rounded-full bg-brand animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 3. Balanced 2-Column Core Architecture (5 cols Left - 7 cols Right) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Left Column: Structured Input Form (5 cols) */}
            <div className="space-y-5 lg:col-span-5">
              {/* Card 1: Mode & Product Setup */}
              <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors">
                <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-4">
                  {/* Calculation Mode Toggle right inside the form */}
                  <div className="grid grid-cols-2 rounded-2xl bg-slate-200/70 dark:bg-slate-800 p-1 border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setMode("target")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${mode === "target"
                        ? "bg-white dark:bg-slate-700 text-brand shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                      <TrendingUp size={14} /> Tính giá mục tiêu
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("audit")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${mode === "audit"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                      <Check size={14} /> Thẩm định giá bán
                    </button>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  {/* Product Name */}
                  <Field label="Tên sản phẩm" hint="bắt buộc">
                    <input
                      ref={productNameRef}
                      value={productName}
                      onChange={(e) => handleName(e.target.value)}
                      aria-invalid={Boolean(productNameError)}
                      aria-describedby={productNameError ? "product-name-error" : undefined}
                      placeholder="Ví dụ: Áo polo nam thể thao cao cấp"
                      className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:ring-2 ${productNameError
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                        : "border-slate-200 dark:border-slate-700/80 focus:border-brand focus:ring-brand/20"
                        }`}
                    />
                    {productNameError && (
                      <p id="product-name-error" className="mt-1.5 text-xs font-semibold text-rose-600">
                        {productNameError}
                      </p>
                    )}
                  </Field>

                  {suggestion && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand-light/40 dark:bg-brand-light/10 p-3 text-xs text-brand transition-colors">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Sparkles size={15} /> Gợi ý ngành: <strong>{getCategoryLabel(suggestion)}</strong>
                        <span className="rounded-full bg-white/70 px-2 py-0.5">Độ chắc chắn {suggestionConfidence === "high" ? "cao" : "trung bình"}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => applyCategory(suggestion.id)}
                        className="btn-brand-cta rounded-lg px-3 py-1.5 font-bold text-white text-xs shadow-xs cursor-pointer"
                      >
                        Xác nhận
                      </button>
                    </div>
                  )}

                  {/* Platform & Shop Configuration */}
                  {input.platform === "external" ? (
                    <div className="space-y-3">
                      <Field label="Kênh bán đơn ngoài">
                        <select
                          value={input.externalChannel}
                          onChange={(e) => update("externalChannel", e.target.value as ExternalSalesChannel)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none"
                        >
                          <option value="facebook" className="dark:bg-slate-900">Facebook (Fanpage / Group)</option>
                          <option value="website" className="dark:bg-slate-900">Website bán lẻ</option>
                          <option value="youtube" className="dark:bg-slate-900">YouTube</option>
                          <option value="other" className="dark:bg-slate-900">Kênh bán khác</option>
                        </select>
                      </Field>

                      <div className="rounded-2xl border border-brand/20 bg-brand-light/20 dark:bg-brand-light/5 p-3.5 space-y-2.5">
                        <p className="text-[11px] font-black uppercase tracking-wider text-brand">
                          Phí thanh toán & Xử lý đơn tự bán
                        </p>
                        <div className="grid grid-cols-3 gap-2.5">
                          <Field label="Cổng TT (%)">
                            <NumberInput
                              value={input.commissionOverride ?? 0}
                              onChange={(v) => update("commissionOverride", v)}
                              max={100}
                            />
                          </Field>
                          <Field label="COD (%)">
                            <NumberInput
                              value={input.transactionOverride ?? 0}
                              onChange={(v) => update("transactionOverride", v)}
                              max={100}
                            />
                          </Field>
                          <Field label="Xử lý / đơn">
                            <MoneyInput
                              value={input.fixedFeeOverride ?? 0}
                              onChange={(v) => update("fixedFeeOverride", v)}
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                        <button
                          type="button"
                          onClick={() => changeShopType("marketplace")}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${input.shopType === "marketplace"
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-500 dark:text-slate-400"
                            }`}
                        >
                          Shop thường
                        </button>
                        <button
                          type="button"
                          onClick={() => changeShopType("mall")}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${input.shopType === "mall"
                            ? "bg-brand text-white shadow-xs"
                            : "text-slate-500 dark:text-slate-400"
                            }`}
                        >
                          Shop Mall (Chính hãng)
                        </button>
                      </div>

                      <CategorySelector
                        platform={input.platform}
                        shopType={input.shopType}
                        categoryId={selectedCategory.id}
                        onChange={applyCategory}
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Card 2: Financial Inputs & Target Margins */}
              <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors p-5 space-y-4">
                <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <CircleDollarSign size={18} className="text-brand" /> Chi phí trực tiếp & Mục tiêu lợi nhuận
                </h2>

                {/* 2x2 Balanced Cost Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Giá vốn / sản phẩm (COGS)">
                    <MoneyInput value={input.costPerUnit} onChange={(v) => update("costPerUnit", v)} />
                  </Field>
                  <Field label="Số lượng / đơn">
                    <NumberInput
                      value={input.quantity}
                      onChange={(v) => update("quantity", Math.max(1, Math.floor(v)))}
                      suffix="SP"
                      min={1}
                      step={1}
                    />
                  </Field>
                  <Field label="Đóng gói & Phụ kiện">
                    <MoneyInput value={input.packagingCost} onChange={(v) => update("packagingCost", v)} />
                  </Field>
                  <Field label="Ngân sách Ads / Marketing">
                    <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/80">
                      <select
                        value={input.marketingMode}
                        onChange={(e) => update("marketingMode", e.target.value as CostMode)}
                        className="w-24 border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                      >
                        <option value="percent">% GMV</option>
                        <option value="fixed">đ / đơn</option>
                      </select>
                      {input.marketingMode === "fixed" ? (
                        <MoneyInput
                          value={input.marketingValue}
                          onChange={(v) => update("marketingValue", v)}
                          className="rounded-none border-0"
                        />
                      ) : (
                        <div className="flex-1">
                          <NumberInput
                            value={input.marketingValue}
                            onChange={(v) => update("marketingValue", v)}
                            max={100}
                            className="rounded-none border-0"
                          />
                        </div>
                      )}
                    </div>
                  </Field>
                </div>

                {/* Mode Target Box */}
                {mode === "target" ? (
                  <div className="rounded-2xl border border-brand/30 bg-brand-light/30 dark:bg-brand-light/10 p-4 transition-colors">
                    <Field label="Lợi nhuận mong muốn đạt được">
                      <div className="flex overflow-hidden rounded-xl border border-brand/30 bg-white dark:bg-slate-800 shadow-xs">
                        <select
                          value={targetMode}
                          onChange={(e) => setTargetMode(e.target.value as "margin" | "fixed")}
                          className="w-44 border-r border-brand/20 bg-brand-light/60 dark:bg-slate-700/60 px-3 text-xs font-bold text-brand outline-none"
                        >
                          <option value="margin">% Doanh thu thực</option>
                          <option value="fixed">Lãi tiền mặt / đơn</option>
                        </select>
                        {targetMode === "fixed" ? (
                          <MoneyInput
                            value={targetValue}
                            onChange={setTargetValue}
                            className="rounded-none border-0 bg-transparent text-brand"
                          />
                        ) : (
                          <div className="flex-1">
                            <NumberInput
                              value={targetValue}
                              onChange={setTargetValue}
                              max={95}
                              className="rounded-none border-0 bg-transparent text-brand"
                            />
                          </div>
                        )}
                      </div>
                    </Field>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 transition-colors">
                    <Field label="Giá niêm yết hiện tại cần thẩm định">
                      <MoneyInput
                        value={auditPrice}
                        onChange={setAuditPrice}
                        className="border-emerald-300 dark:border-emerald-700/80 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 text-base font-black"
                      />
                    </Field>
                  </div>
                )}

                {/* Action Buttons (Bỏ nút Lưu thủ công vì tự động lưu vào lịch sử & Hoạt động gần đây) */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={calculate}
                    className="flex-1 btn-brand-cta flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-brand/20 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <Calculator size={18} /> Cập nhật & Tính toán
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    title="Đặt lại thông số"
                    className="flex items-center justify-center rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-rose-600 transition-colors shadow-xs cursor-pointer"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>

                {saveNotice && (
                  <p className="rounded-xl border border-brand/30 bg-brand-light/50 dark:bg-brand-light/10 px-4 py-3 text-xs font-bold text-brand">
                    {saveNotice}
                  </p>
                )}
              </section>

              {/* Card 3: Advanced Operational Costs, Taxes & Risk Accordion */}
              <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors">
                <button
                  type="button"
                  onClick={() => setAdvanced((v) => !v)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <span>
                    <strong className="flex items-center gap-2 text-sm text-slate-900 dark:text-white font-bold">
                      <ReceiptText size={18} className="text-brand" /> Chi phí vận hành, Thuế & Rủi ro hoàn hủy
                    </strong>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      Voucher, Affiliate, Thuế TMĐT, Ship hoàn và hao hụt
                    </span>
                  </span>
                  {advanced ? (
                    <ChevronUp size={18} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400" />
                  )}
                </button>
                {advanced && (
                  <AdvancedFields
                    input={input}
                    update={update}
                    feeProfile={feeProfile}
                    roundingStep={roundingStep}
                    setRoundingStep={setRoundingStep}
                    toggleProgram={toggleProgram}
                  />
                )}
              </section>
            </div>

            {/* Right Column: Financial Intelligence Engine (7 cols, sticky on desktop) */}
            <div className="space-y-5 lg:col-span-7 lg:sticky lg:top-4 self-start">
              {!hasCalculated || !result || !evaluation ? (
                <EmptyCalculation />
              ) : (
                <>
                  {result.error && (
                    <div className="flex gap-2 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm font-semibold text-rose-800 dark:text-rose-300">
                      <AlertTriangle size={18} />
                      {result.error}
                    </div>
                  )}

                  {/* 1. Hero Valuation Output Card */}
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
                              {mode === "target" ? "Giá niêm yết đề xuất" : "Giá đang thẩm định"}
                            </span>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                              {input.platform === "external"
                                ? externalChannelNames[input.externalChannel]
                                : platformNames[input.platform]}
                            </span>
                          </div>
                          <p className="mt-2 text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-400">
                            {formatMoney(evaluation.listPrice)}
                          </p>
                          <p className="mt-1.5 text-xs text-slate-400 font-medium">
                            Doanh thu sau chiết khấu shop:{" "}
                            <strong className="text-white font-mono">{formatMoney(evaluation.productRevenue)}</strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={copyResult}
                          className="flex h-fit items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer active:scale-95"
                        >
                          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          {copied ? "Đã sao chép" : "Sao chép báo cáo"}
                        </button>
                      </div>

                      {/* 4 Core Financial Metrics */}
                      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">
                        <Mini
                          label={input.platform === "external" ? "Thực thu dự kiến" : "Sàn giải ngân ví"}
                          value={formatMoney(evaluation.payout)}
                        />
                        <Mini
                          label="Lãi đơn thành công"
                          value={formatMoney(evaluation.profitOnSuccess)}
                          loss={evaluation.profitOnSuccess < 0}
                        />
                        <Mini
                          label="Lãi kỳ vọng / mỗi đơn"
                          value={formatMoney(evaluation.expectedProfitPerOrder)}
                          loss={isLoss}
                        />
                        <Mini label="Biên lợi nhuận ròng" value={`${evaluation.expectedMargin.toFixed(1)}%`} loss={isLoss} />
                      </div>
                    </div>
                  </section>

                  {/* 2. Four Security & Leverage Financial KPI Cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Metric
                      label="Giá hòa vốn"
                      value={result.breakEvenPrice === null ? "Không khả thi" : formatMoney(result.breakEvenPrice)}
                      tone="blue"
                      subtext="Đã gồm hoàn & hủy"
                      icon={<ShieldCheck size={15} />}
                    />
                    <Metric
                      label="ROI trên vốn"
                      value={`${evaluation.roiOnCogs.toFixed(1)}%`}
                      tone={evaluation.roiOnCogs < 0 ? "red" : "green"}
                      subtext="Hiệu quả đồng vốn"
                      icon={<TrendingUp size={15} />}
                    />
                    <Metric
                      label="Ads tối đa / đơn"
                      value={formatMoney(evaluation.maximumMarketingCost)}
                      subtext="Trần chi phí an toàn"
                      tone="slate"
                      icon={<BarChart3 size={15} />}
                    />
                    <Metric
                      label="ROAS hòa vốn"
                      value={evaluation.breakEvenRoas === null ? "—" : `${evaluation.breakEvenRoas.toFixed(2)}x`}
                      subtext="Ngưỡng tối thiểu"
                      tone="slate"
                      icon={<Layers size={15} />}
                    />
                  </div>

                  {/* 3. Segmented Navigation for Deep Analytical Breakdown */}
                  <div className="flex items-center justify-between rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveResultTab("structure")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${activeResultTab === "structure"
                        ? "bg-white dark:bg-slate-700 text-brand shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                      <PieChart size={14} /> Cơ cấu chi phí
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab("breakdown")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${activeResultTab === "breakdown"
                        ? "bg-white dark:bg-slate-700 text-brand shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                      <ReceiptText size={14} /> Đối soát P&L
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab("scenarios")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${activeResultTab === "scenarios"
                        ? "bg-white dark:bg-slate-700 text-brand shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                      <ShieldAlert size={14} /> Kịch bản 100 đơn
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab("all")}
                      className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${activeResultTab === "all"
                        ? "bg-white dark:bg-slate-700 text-brand shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                      Tất cả
                    </button>
                  </div>

                  {/* Tab 1: Cost Structure Donut Visuals */}
                  {(activeResultTab === "structure" || activeResultTab === "all") && (
                    <CostVisuals evaluation={evaluation} isExternal={input.platform === "external"} />
                  )}

                  {/* Warnings List */}
                  {evaluation.warnings.map((warning) => (
                    <div
                      key={warning}
                      className="flex gap-2.5 rounded-2xl border border-amber-300 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-xs font-semibold text-amber-900 dark:text-amber-300"
                    >
                      <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                      {warning}
                    </div>
                  ))}

                  {/* Tab 2: Line-by-Line P&L Reconciliation */}
                  {(activeResultTab === "breakdown" || activeResultTab === "all") && (
                    <Breakdown evaluation={evaluation} input={input} />
                  )}

                  {/* Tab 3: 100-Orders Probabilistic Risk Model */}
                  {(activeResultTab === "scenarios" || activeResultTab === "all") && (
                    <Scenarios evaluation={evaluation} isLoss={isLoss} />
                  )}

                  {/* 4. Data Source & Legal Assurance */}
                  <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex gap-3">
                      <Info size={17} className="shrink-0 text-brand mt-0.5" />
                      <div>
                        <strong className="text-slate-900 dark:text-white font-bold">Nguồn dữ liệu & Căn cứ tính toán</strong>
                        <p className="mt-1 leading-relaxed">
                          {input.platform === "external"
                            ? "Đơn ngoài không chịu biểu phí sàn TMĐT. Kết quả sử dụng mức phí thanh toán, phí COD và chi phí xử lý do bạn thiết lập."
                            : "Hoa hồng được tra cứu chuẩn xác theo mã ngành cấp 3 trong biểu phí sàn chính thức. Các mức phí bổ sung có thể tùy biến đè nếu shop có hợp đồng riêng."}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-3">
                          {feeProfile.sourceUrl && (
                            <a
                              href={feeProfile.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-brand hover:underline"
                            >
                              Biểu phí sàn <ExternalLink size={12} />
                            </a>
                          )}
                          <a
                            href={SOURCES.tax}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-brand hover:underline"
                          >
                            Nghị định thuế 68/2026 <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type Update = <K extends keyof PricingInput>(key: K, value: PricingInput[K]) => void;

function AdvancedFields({
  input,
  update,
  feeProfile,
  roundingStep,
  setRoundingStep,
  toggleProgram,
}: {
  input: PricingInput;
  update: Update;
  feeProfile: ReturnType<typeof getFeeProfile>;
  roundingStep: number;
  setRoundingStep: (v: number) => void;
  toggleProgram: (id: string) => void;
}) {
  return (
    <div className="space-y-5 border-t border-slate-100 dark:border-slate-800/80 p-5">
      <Group title="Khuyến mãi & Vận hành">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Giảm giá của shop (%)">
            <NumberInput
              value={input.sellerDiscountRate}
              onChange={(v) => update("sellerDiscountRate", v)}
              max={100}
            />
          </Field>
          <Field label="Voucher sàn tài trợ">
            <MoneyInput value={input.platformDiscount} onChange={(v) => update("platformDiscount", v)} />
          </Field>
          <Field label="Affiliate / KOC (%)">
            <NumberInput value={input.affiliateRate} onChange={(v) => update("affiliateRate", v)} max={100} />
          </Field>
          <Field label="Khách trả phí ship">
            <MoneyInput value={input.buyerShippingFee} onChange={(v) => update("buyerShippingFee", v)} />
          </Field>
          <Field label="Shop chịu phí ship">
            <MoneyInput value={input.sellerShippingCost} onChange={(v) => update("sellerShippingCost", v)} />
          </Field>
          <Field label="Nhân công / đơn">
            <MoneyInput value={input.handlingCost} onChange={(v) => update("handlingCost", v)} />
          </Field>
          <Field label="Chi phí chung / đơn">
            <MoneyInput value={input.overheadCost} onChange={(v) => update("overheadCost", v)} />
          </Field>
          <Field label="Bước làm tròn giá">
            <select
              value={roundingStep}
              onChange={(e) => setRoundingStep(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value={1} className="dark:bg-slate-900">1 ₫</option>
              <option value={1000} className="dark:bg-slate-900">1.000 ₫</option>
              <option value={5000} className="dark:bg-slate-900">5.000 ₫</option>
              <option value={10000} className="dark:bg-slate-900">10.000 ₫</option>
            </select>
          </Field>
        </div>
      </Group>

      {input.platform !== "external" && (
        <Group title="Biểu phí sàn & Gói hỗ trợ">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Hoa hồng" hint={`${feeProfile.commissionRate}%`}>
              <NumberInput
                value={input.commissionOverride ?? feeProfile.commissionRate}
                onChange={(v) => update("commissionOverride", v)}
                max={100}
              />
            </Field>
            <Field label="Giao dịch" hint={`${feeProfile.transactionRate}%`}>
              <NumberInput
                value={input.transactionOverride ?? feeProfile.transactionRate}
                onChange={(v) => update("transactionOverride", v)}
                max={100}
              />
            </Field>
            <Field label="Phí cố định">
              <MoneyInput
                value={input.fixedFeeOverride ?? feeProfile.orderProcessingFee}
                onChange={(v) => update("fixedFeeOverride", v)}
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={() => {
              update("commissionOverride", null);
              update("transactionOverride", null);
              update("fixedFeeOverride", null);
            }}
            className="mt-2 text-xs font-bold text-brand hover:underline cursor-pointer"
          >
            Sử dụng lại mức mặc định sàn
          </button>
          <div className="mt-3 space-y-2.5">
            {PROGRAMS[input.platform].map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-brand/40 p-3.5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={input.enabledProgramIds.includes(p.id)}
                  onChange={() => toggleProgram(p.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[var(--brand-primary)]"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  <strong className="block text-slate-900 dark:text-white font-bold">
                    {p.name}: {p.rate}%{p.cap ? `, trần ${formatMoney(p.cap)}` : ""}
                  </strong>
                  {p.note}
                </span>
              </label>
            ))}
          </div>
        </Group>
      )}

      <Group title="Thuế suất thương mại điện tử">
        <Field label="Loại hình & Phương pháp kê khai">
          <select
            value={input.taxMode}
            onChange={(e) => update("taxMode", e.target.value as TaxMode)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="household_exempt" className="dark:bg-slate-900">Hộ/cá nhân — doanh thu năm ≤ 500 triệu (Miễn thuế)</option>
            <option value="household_revenue" className="dark:bg-slate-900">Hộ/cá nhân — tính theo tỷ lệ doanh thu</option>
            <option value="profit_based" className="dark:bg-slate-900">Doanh nghiệp/hộ — tính trên lợi nhuận ròng</option>
            <option value="manual" className="dark:bg-slate-900">Tự nhập tỷ lệ thuế theo doanh thu</option>
          </select>
        </Field>
        {input.taxMode === "household_revenue" && (
          <div className="mt-3">
            <Field label="Phần doanh thu chịu TNCN" hint="GTGT 1% toàn doanh thu">
              <NumberInput
                value={input.taxableRevenueShare}
                onChange={(v) => update("taxableRevenueShare", v)}
                max={100}
              />
            </Field>
          </div>
        )}
        {input.taxMode === "profit_based" && (
          <div className="mt-3">
            <Field label="Thuế suất trên lợi nhuận ròng">
              <NumberInput value={input.profitTaxRate} onChange={(v) => update("profitTaxRate", v)} max={100} />
            </Field>
          </div>
        )}
        {input.taxMode === "manual" && (
          <div className="mt-3">
            <Field label="Thuế trên doanh thu">
              <NumberInput
                value={input.manualRevenueTaxRate}
                onChange={(v) => update("manualRevenueTaxRate", v)}
                max={100}
              />
            </Field>
          </div>
        )}
      </Group>

      <Group title="Tỷ lệ tổn thất, hủy đơn & Hoàn trả">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tỷ lệ hủy đơn (%)">
            <NumberInput value={input.cancellationRate} onChange={(v) => update("cancellationRate", v)} max={100} />
          </Field>
          <Field label="Chi phí một đơn hủy">
            <MoneyInput value={input.cancellationCost} onChange={(v) => update("cancellationCost", v)} />
          </Field>
          <Field label="Tỷ lệ giao thất bại (%)">
            <NumberInput
              value={input.deliveryFailureRate}
              onChange={(v) => update("deliveryFailureRate", v)}
              max={100}
            />
          </Field>
          <Field label="Tỷ lệ trả sau giao (%)">
            <NumberInput value={input.returnRate} onChange={(v) => update("returnRate", v)} max={100} />
          </Field>
          <Field label="Phí vận chuyển hoàn">
            <MoneyInput value={input.returnShippingCost} onChange={(v) => update("returnShippingCost", v)} />
          </Field>
          <Field label="Phí sàn không hoàn lại">
            <MoneyInput value={input.nonRefundableReturnFee} onChange={(v) => update("nonRefundableReturnFee", v)} />
          </Field>
          <Field label="Tỷ lệ thu hồi giá trị (%)">
            <NumberInput
              value={input.returnedInventoryRecoveryRate}
              onChange={(v) => update("returnedInventoryRecoveryRate", v)}
              max={100}
            />
          </Field>
          <Field label="Hao hụt & Hư hỏng (%)">
            <NumberInput value={input.damageRate} onChange={(v) => update("damageRate", v)} max={100} />
          </Field>
        </div>
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h3>
      {children}
    </div>
  );
}

function Mini({ label, value, loss = false }: { label: string; value: string; loss?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{label}</p>
      <p className={`mt-1 font-black font-mono text-sm sm:text-base ${loss ? "text-rose-400" : "text-emerald-400"}`}>
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  positive = false,
  strong = false,
}: {
  label: string;
  value: number;
  hint?: string;
  positive?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <span className={strong ? "font-black text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300 font-medium"}>
          {label}
        </span>
        {hint && <span className="ml-2 text-[10px] text-slate-400 dark:text-slate-500 font-normal">{hint}</span>}
      </div>
      <span
        className={`shrink-0 font-mono ${strong ? "text-base font-black" : "font-bold text-sm"} ${value < 0 ? "text-rose-600 dark:text-rose-400" : positive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
          }`}
      >
        {value > 0 && positive ? "+" : ""}
        {formatMoney(value)}
      </span>
    </div>
  );
}

function Breakdown({ evaluation: e, input }: { evaluation: ReturnType<typeof calculatePricing>["evaluation"]; input: PricingInput }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-base">
          <ReceiptText size={19} className="text-emerald-600 dark:text-emerald-400" /> Bảng đối soát chi tiết một đơn thành công
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Minh bạch từng dòng doanh thu, các khoản khấu trừ của sàn và chi phí nội bộ shop.
        </p>
      </div>
      <div className="space-y-2 text-sm">
        <Row label="Doanh thu sau chiết khấu của shop" value={e.productRevenue} positive />
        {e.fees.map((fee) => (
          <Row
            key={fee.id}
            label={`${fee.name}${fee.rate === null ? "" : ` (${fee.rate}%)`}`}
            value={-fee.amount}
            hint={fee.id === "order" ? "Theo đơn" : `Cơ sở: ${formatMoney(fee.base)}`}
          />
        ))}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
          <Row label={input.platform === "external" ? "Thực thu dự kiến" : "Tiền sàn giải ngân về ví"} value={e.payout} positive strong />
        </div>
        <Row label={`Giá vốn (${input.quantity} sản phẩm)`} value={-e.cogs} />
        <Row label="Đóng gói, bao bì & vận hành" value={-e.operatingCosts} />
        <Row label="Chi phí Ads / Marketing" value={-e.marketingCost} />
        <Row label="Chi phí Affiliate / KOC" value={-e.affiliateCost} />
        <Row label="Nghĩa vụ thuế ước tính" value={-e.tax} />
        <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-2.5">
          <Row label="Lợi nhuận ròng đơn giao thành công" value={e.profitOnSuccess} positive strong />
        </div>
      </div>
    </section>
  );
}

function Scenarios({ evaluation: e, isLoss }: { evaluation: ReturnType<typeof calculatePricing>["evaluation"]; isLoss: boolean }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-base">
          <ShieldAlert size={19} className="text-brand" /> Mô hình xác suất dòng tiền trên 100 đơn
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Khấu trừ tuần tự rủi ro thực tế: Hủy đơn trước giao → Giao thất bại → Trả hàng sau nhận → Giao thành công.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Scenario
          icon={<PackageCheck size={16} />}
          label="Giao thành công"
          count={e.weights.success * 100}
          amount={e.weights.success * 100 * e.profitOnSuccess}
          tone="green"
        />
        <Scenario
          icon={<RotateCcw size={16} />}
          label="Trả sau giao"
          count={e.weights.returned * 100}
          amount={-e.weights.returned * 100 * e.returnLoss}
          tone="red"
        />
        <Scenario
          icon={<Truck size={16} />}
          label="Giao thất bại"
          count={e.weights.deliveryFailed * 100}
          amount={-e.weights.deliveryFailed * 100 * e.deliveryFailureLoss}
          tone="amber"
        />
        <Scenario
          icon={<TrendingDown size={16} />}
          label="Bị khách hủy"
          count={e.weights.cancelled * 100}
          amount={-e.weights.cancelled * 100 * e.cancellationLoss}
          tone="slate"
        />
      </div>
      <div
        className={`mt-4 flex items-center justify-between rounded-2xl p-4 transition-colors ${isLoss
          ? "border border-rose-300 dark:border-rose-900/50 bg-rose-100 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200"
          : "border border-emerald-300 dark:border-emerald-900/50 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200"
          }`}
      >
        <span className="text-xs sm:text-sm font-bold">Tổng lãi kỳ vọng thực nhận trên 100 đơn phát sinh:</span>
        <span className="text-lg sm:text-xl font-black font-mono">{formatMoney(e.expectedProfitPerOrder * 100)}</span>
      </div>
    </section>
  );
}

function Scenario({
  icon,
  label,
  count,
  amount,
  tone,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  amount: number;
  tone: "green" | "red" | "amber" | "slate";
}) {
  const colors = {
    green: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
    red: "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
    slate: "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
  };
  return (
    <div className={`rounded-2xl border p-3 sm:p-3.5 transition-colors ${colors[tone]}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-base sm:text-lg font-black">{count.toFixed(1)} đơn</p>
      <p className="mt-0.5 text-[11px] font-bold font-mono">{formatMoney(amount)}</p>
    </div>
  );
}
