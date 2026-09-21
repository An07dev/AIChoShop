"use client";

import { type HistoryActivity } from "@/lib/history/types";
import { useAccountStorage } from "@/context/AccountHistoryContext";
import type { HistoryStorage } from "@/lib/history/storage";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calculator,
  Check,
  ChevronRight,
  Clock,
  Copy,
  FolderOpen,
  Info,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  User,
  X,
  Zap,
} from "lucide-react";
import { useToolGate } from "@/hooks/useToolGate";
import { TaxCalculatorOutput } from "@/components/tools/TaxCalculatorOutput";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";
import { ACTIVITY_RATES, calculateEcommerceTax } from "@/lib/tax-calculator/engine";
import type { BusinessActivity, TaxCalculatorInput, TaxCalculatorResult, TaxPayerType } from "@/lib/tax-calculator/types";

const moneyFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const parseMoney = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;

export type TaxCalculationSnapshot = {
  id: string;
  createdAt: string;
  payerType: TaxPayerType;
  taxYear: number;
  totalRevenue: number;
  totalTaxPayable: number;
  netRemainingPayable: number;
  input: TaxCalculatorInput;
  summaryText: string;
};

const STORAGE_KEY = "aicho_tax_calculator_history";

function readTaxHistory(storage: HistoryStorage): TaxCalculationSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeTaxHistory(storage: HistoryStorage, history: TaxCalculationSnapshot[]) {
  storage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
}

const payerLabels: Record<TaxPayerType, string> = {
  household: "Hộ kinh doanh",
  individual: "Cá nhân KD",
  company: "Doanh nghiệp",
};

const initialInput: TaxCalculatorInput = {
  taxYear: 2026,
  payerType: "household",
  activity: "goods",
  activityRevenues: { goods: 1_000_000_000, services: 0, production: 0, digital: 0, other: 0 },
  personalIncomeMethod: "revenue",
  residencyStatus: "resident",
  personalPreviousYearRevenue: 0,
  profitMethodStartYear: null,
  shopeeRevenue: 500_000_000,
  tiktokRevenue: 500_000_000,
  otherPlatformRevenue: 0,
  directRevenue: 0,
  platformFees: 140_000_000,
  platformFeesDeductible: false,
  deductibleCosts: 700_000_000,
  otherTaxableIncome: 0,
  carriedLoss: 0,
  withheldVat: 0,
  withheldIncomeTax: 0,
  companyPreviousYearRevenue: 0,
  companyPreviousYearOperatingMonths: 12,
  companyHasPreviousYearData: false,
  companyIsNewThisYear: false,
  companyHasDisqualifyingRelatedParty: false,
  companyVatRate: 10,
  deductibleInputVat: 0,
  companyIsSme: false,
  companyFirstRegistrationYear: null,
  companyCreatedFromReorganization: false,
  companyControllerHasPriorBusiness: false,
  companyHasExcludedIncome: false,
  companyUsesOtherTaxIncentive: false,
};

function MoneyInput({
  value,
  onChange,
  placeholder,
  className = "",
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  max?: number;
}) {
  return (
    <div className="relative flex items-center">
      <input
        inputMode="numeric"
        placeholder={placeholder}
        value={value ? moneyFormat.format(value) : ""}
        onChange={(event) => {
          const parsed = parseMoney(event.target.value);
          onChange(max === undefined ? parsed : Math.min(parsed, Math.max(0, max)));
        }}
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
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 px-4 sm:px-6 py-3.5">
        <h2 className="flex items-center gap-2 text-sm sm:text-base font-black text-slate-900 dark:text-white">
          {icon}
          <span>{title}</span>
        </h2>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        {children}
      </div>
    </section>
  );
}

export default function TaxCalculator() {
  const { checkAccess, GateModals } = useToolGate();

  const { storage: historyStorage, ready: historyReady, fetch: historyFetch } = useAccountStorage();
  const [input, setInput] = useState<TaxCalculatorInput>(initialInput);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [calculatedResult, setCalculatedResult] = useState<TaxCalculatorResult | null>(null);
  const [saveNotice, setSaveNotice] = useState("");
  const [savedHistory, setSavedHistory] = useState<TaxCalculationSnapshot[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

  // Modal Lịch sử states
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyActivities, setHistoryActivities] = useState<HistoryActivity<TaxCalculationSnapshot>[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<HistoryActivity<TaxCalculationSnapshot> | null>(null);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    checkAccess("tax-calculator", false);
  }, [checkAccess]);

  useEffect(() => {
    if (!historyReady) return;
    queueMicrotask(() => setSavedHistory(readTaxHistory(historyStorage)));
  }, [historyStorage, historyReady]);

  // Lấy lịch sử từ server (/api/ai/usage)
  const fetchActivities = useCallback(async () => {
    try {
      const res = await historyFetch("/api/ai/usage?tool=tax-calculator");
      if (res.ok) {
        const data = await res.json();
        const serverActivities = (data.recentActivities || []).filter(
          (a: HistoryActivity<TaxCalculationSnapshot>) => a.tool === "tax-calculator"
        );
        setHistoryActivities(serverActivities);
        setHistoryTotal(serverActivities.length);
      }
    } catch {
      // ignore
    }
  }, [historyFetch]);

  useEffect(() => {
    queueMicrotask(() => { void fetchActivities(); });
  }, [fetchActivities, historyRefreshTrigger]);

  const liveTotalRevenue =
    (Number(input.shopeeRevenue) || 0) +
    (Number(input.tiktokRevenue) || 0) +
    (Number(input.otherPlatformRevenue) || 0) +
    (Number(input.directRevenue) || 0);

  const isPersonal = input.payerType !== "company";
  const activityRevenueTotal = Object.values(input.activityRevenues || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);

  const update = <K extends keyof TaxCalculatorInput>(key: K, value: TaxCalculatorInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setHasCalculated(false);
    setCalculatedResult(null);
  };

  const updateActivityRevenue = (activity: BusinessActivity, value: number) => {
    setInput((current) => ({
      ...current,
      activityRevenues: { ...current.activityRevenues, [activity]: value },
    }));
    setHasCalculated(false);
    setCalculatedResult(null);
  };

  const maxActivityRevenue = (activity: BusinessActivity) => {
    const otherActivities = Object.entries(input.activityRevenues || {}).reduce(
      (sum, [key, value]) => sum + (key === activity ? 0 : Number(value) || 0),
      0
    );
    return Math.max(0, liveTotalRevenue - otherActivities);
  };

  const changePayer = (payerType: TaxPayerType) => {
    setInput((current) => ({
      ...current,
      payerType,
      personalIncomeMethod: current.personalIncomeMethod,
    }));
    setHasCalculated(false);
    setCalculatedResult(null);
  };

  const handleCalculate = async (overrideInput?: TaxCalculatorInput) => {
    const hasAccess = await checkAccess("tax-calculator", false);
    if (!hasAccess) return;

    const currentInput = overrideInput || input;
    const result = calculateEcommerceTax(currentInput);
    setCalculatedResult(result);
    setHasCalculated(true);
    setMobileTab("result");
    if (result.validationErrors.length > 0) {
      setSaveNotice("Chưa lưu dự toán: hãy sửa các dữ liệu chưa khớp được hiển thị trong kết quả.");
      return;
    }

    const isCompany = currentInput.payerType === "company";
    const payerLabel = payerLabels[currentInput.payerType];
    const incomeName = isCompany ? "TNDN" : "TNCN";

    const summaryText = [
      `BẢNG DỰ TOÁN THUẾ TMĐT ${currentInput.taxYear}`,
      `Loại người nộp thuế: ${payerLabel}`,
      `Doanh thu đã tách theo ${result.activityBreakdown.filter((row) => row.revenue > 0).length} nhóm hoạt động`,
      `Tổng doanh thu đa kênh: ${moneyFormat.format(result.totalRevenue)} ₫`,
      `Thuế GTGT: ${moneyFormat.format(result.vat)} ₫ (${result.vatRate}%)`,
      `Thuế ${incomeName}: ${moneyFormat.format(result.incomeTax)} ₫ (${result.incomeTaxRate}%)`,
      `Bộ quy tắc: ${result.ruleVersion}`,
      `Tổng thuế phát sinh: ${moneyFormat.format(result.totalTax)} ₫`,
      `Thuế sàn đã khấu trừ / nộp thay: ${moneyFormat.format(
        currentInput.withheldVat + currentInput.withheldIncomeTax
      )} ₫`,
      `Số thuế còn phải nộp: ${moneyFormat.format(result.remainingPayable)} ₫`,
    ]
      .filter(Boolean)
      .join("\n");

    const snapshotId = editingId || `tax-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const snapshot: TaxCalculationSnapshot = {
      id: snapshotId,
      createdAt: new Date().toISOString(),
      payerType: currentInput.payerType,
      taxYear: currentInput.taxYear,
      totalRevenue: result.totalRevenue,
      totalTaxPayable: result.totalTax,
      netRemainingPayable: result.remainingPayable,
      input: { ...currentInput },
      summaryText,
    };

    setEditingId(snapshotId);

    const nextHistory = editingId
      ? savedHistory.map((s) => (s.id === editingId ? snapshot : s))
      : [snapshot, ...savedHistory.filter((s) => s.id !== snapshotId)].slice(0, 50);

    try { writeTaxHistory(historyStorage, nextHistory); } catch (error) { setSaveNotice(error instanceof Error ? error.message : "Không lưu được lịch sử."); return; }
    setSavedHistory(readTaxHistory(historyStorage));
    setSaveNotice(
      editingId
        ? `Đã tính toán & cập nhật dự toán thuế (${payerLabel} - ${moneyFormat.format(result.totalRevenue)} ₫).`
        : `Đã tính toán & lưu dự toán thuế (${payerLabel} - ${moneyFormat.format(result.totalRevenue)} ₫).`
    );

    // Gửi log đến server để hiển thị tại "Hoạt động gần đây" (Dashboard & Modal Lịch sử)
    historyFetch("/api/ai/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "tax-calculator",
        toolName: "Tính Thuế TMĐT",
        action: editingId
          ? `Cập nhật dự toán thuế ${payerLabel} năm ${currentInput.taxYear} (DT: ${moneyFormat.format(result.totalRevenue)} ₫)`
          : `Dự toán thuế ${payerLabel} năm ${currentInput.taxYear} (DT: ${moneyFormat.format(result.totalRevenue)} ₫)`,
        input: {
          payerType: currentInput.payerType,
          taxYear: currentInput.taxYear,
          totalRevenue: result.totalRevenue,
          totalTax: result.totalTax,
          remainingPayable: result.remainingPayable,
          snapshotId,
          snapshot,
        },
        output: summaryText,
      }),
    })
      .then(() => setHistoryRefreshTrigger((p) => p + 1))
      .catch(() => setSaveNotice("Đã lưu trên thiết bị; chưa lưu được nhật ký server. Hãy kiểm tra đăng nhập và kết nối."));
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
      activityRevenues: { goods: 0, services: 0, production: 0, digital: 0, other: 0 },
    });
    setHasCalculated(false);
    setCalculatedResult(null);
    setEditingId(null);
    setSaveNotice("");
  };

  const handleUseSample = () => {
    setInput(initialInput);
    setEditingId(null);
    setSaveNotice("Đã nạp dữ liệu mẫu 1 tỷ. Nhấn nút 'Tính toán nghĩa vụ thuế' bên dưới để xem kết quả.");
  };

  const openSavedSnapshot = (snapshot: TaxCalculationSnapshot) => {
    const migratedInput: TaxCalculatorInput = {
      ...initialInput,
      ...snapshot.input,
      activityRevenues: snapshot.input.activityRevenues || {
        goods: snapshot.input.activity === "goods" ? snapshot.totalRevenue : 0,
        services: snapshot.input.activity === "services" ? snapshot.totalRevenue : 0,
        production: snapshot.input.activity === "production" ? snapshot.totalRevenue : 0,
        digital: snapshot.input.activity === "digital" ? snapshot.totalRevenue : 0,
        other: snapshot.input.activity === "other" ? snapshot.totalRevenue : 0,
      },
      applyIncomeTaxReduction: false,
    };
    setInput(migratedInput);
    const res = calculateEcommerceTax(migratedInput);
    setCalculatedResult(res);
    setHasCalculated(true);
    setEditingId(snapshot.id);
    setIsHistoryModalOpen(false);
    setViewingHistoryItem(null);
    setSaveNotice(`Đã nạp lại dự toán thuế từ lịch sử (${payerLabels[snapshot.payerType]} - ${snapshot.taxYear}). Bạn có thể sửa thông số rồi nhấn Cập nhật.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopyHistory = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedHistoryId(id);
    setTimeout(() => setCopiedHistoryId(null), 2000);
  };

  // Tổng hợp danh sách hiển thị trong Modal Lịch sử - Tránh lưu/hiện duplicate 2 lần
  const displayActivities = useMemo<HistoryActivity<TaxCalculationSnapshot>[]>(() => {
    if (historyActivities.length > 0) {
      return historyActivities.map((act) => {
        const matchedSnapshot =
          act.input?.snapshot ||
          savedHistory.find(
            (s) =>
              s.id === act.input?.snapshotId ||
              s.id === act.id ||
              (s.payerType === act.input?.payerType &&
                s.taxYear === act.input?.taxYear &&
                s.totalRevenue === act.input?.totalRevenue)
          );

        return {
          ...act,
          snapshot: matchedSnapshot,
        };
      });
    }

    return savedHistory.map((s) => ({
      id: s.id,
      tool: "tax-calculator",
      toolName: "Tính Thuế TMĐT",
      action: `Dự toán thuế ${payerLabels[s.payerType]} năm ${s.taxYear} (DT: ${moneyFormat.format(s.totalRevenue)} ₫)`,
      output: s.summaryText,
      time: new Date(s.createdAt).toLocaleDateString("vi-VN"),
      createdAt: s.createdAt,
      snapshot: s,
    }));
  }, [historyActivities, savedHistory]);

  const historyCount = Math.max(historyTotal, savedHistory.length, displayActivities.length);

  return (
    <div className="mx-auto max-w-7xl pb-16 px-2 sm:px-4">
      {/* Modal kiểm tra quyền */}
      <GateModals />

      {/* Modal Lịch Sử Dự Toán Thuế (Giống trang Chat Broadcast & Định Giá) */}
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
                    {viewingHistoryItem ? "Chi tiết dự toán thuế" : "Lịch Sử Tính Thuế Gần Đây"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {viewingHistoryItem
                      ? "Tính Thuế TMĐT 2026"
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
                        const matchedSnapshot: TaxCalculationSnapshot | undefined =
                          viewingHistoryItem.snapshot ||
                          savedHistory.find(
                            (s) =>
                              s.id === viewingHistoryItem.input?.snapshotId ||
                              s.id === viewingHistoryItem.id
                          );
                        if (!matchedSnapshot) return null;
                        return (
                          <button
                            type="button"
                            onClick={() => openSavedSnapshot(matchedSnapshot)}
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
                        Chưa có lịch sử tính thuế nào
                      </p>
                      <p className="text-xs mt-1 text-slate-400">
                        Hãy nhập thông tin doanh thu, chi phí và bấm &ldquo;Tính toán nghĩa vụ thuế&rdquo; để tự động lưu.
                      </p>
                    </div>
                  ) : (
                    displayActivities.map((item) => {
                      const matchedSnapshot: TaxCalculationSnapshot | undefined =
                        item.snapshot ||
                        savedHistory.find(
                          (s) =>
                            s.id === item.input?.snapshotId ||
                            s.id === item.id
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
                                {item.toolName || "Tính Thuế TMĐT"}
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
                                onClick={() => openSavedSnapshot(matchedSnapshot)}
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

      {/* 1. Header Navigation & Title */}
      <header className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        {/* Mobile top bar: Breadcrumb + FREE badge + Lịch sử */}
        <div className="flex items-center justify-between gap-2 md:hidden">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand transition-colors"
          >
            <ArrowLeft size={13} /> Kho công cụ AI
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs uppercase tracking-wider">
              <Sparkles size={10} className="text-emerald-600 dark:text-emerald-400" />
              FREE
            </span>
            <button
              type="button"
              onClick={() => {
                setViewingHistoryItem(null);
                setIsHistoryModalOpen(true);
              }}
              className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Xem lịch sử các lần tính thuế đã lưu"
            >
              <Clock size={12} className="text-blue-500 shrink-0" />
              <span>Lịch sử</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] font-black">
                  {historyCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            {/* Desktop breadcrumb */}
            <Link
              href="/tools"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand transition-colors mb-2"
            >
              <ArrowLeft size={14} /> Kho công cụ AI
            </Link>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-light dark:bg-brand-light/20 flex items-center justify-center text-brand shadow-xs shrink-0">
                <Calculator size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                    Tính Thuế TMĐT 2026
                  </h1>
                  {/* Minimal icon-only reset button: ONLY ON MOBILE */}
                  <button
                    type="button"
                    onClick={resetAll}
                    className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all cursor-pointer shadow-2xs active:scale-90"
                    title="Xóa trắng / Đặt lại số tiền về 0"
                    aria-label="Xóa trắng tất cả dữ liệu"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs uppercase tracking-wider shrink-0">
                    <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400" />
                    FREE TOOL
                  </span>
                </div>
                <p className="hidden sm:block mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Dự toán thuế GTGT, TNCN/TNDN bán hàng Shopee, TikTok Shop &amp; đa kênh theo quy định 2026.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved exactly as original) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setViewingHistoryItem(null);
                setIsHistoryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 px-3.5 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 transition cursor-pointer shadow-xs active:scale-95"
              title="Xem lịch sử các lần tính thuế đã lưu"
            >
              <Clock size={14} className="text-blue-500 shrink-0" />
              <span>Lịch sử</span>
              {historyCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-black">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleUseSample}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs active:scale-95"
            >
              <Zap size={14} className="text-amber-500 shrink-0" />
              <span>Dữ liệu mẫu (1 Tỷ)</span>
            </button>

            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer shadow-xs active:scale-95"
              title="Đặt lại tất cả số tiền về 0"
            >
              <RotateCcw size={14} className="shrink-0" />
              <span>Xóa trắng</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <MobileToolTabs
        activeTab={mobileTab}
        onChangeTab={setMobileTab}
        hasResult={hasCalculated && Boolean(calculatedResult)}
        formLabel="Thông tin nộp thuế"
        resultLabel="Dự toán thuế 2026"
      />

      {/* 2. Balanced 2-Column Core Architecture (5 cols Left - 7 cols Right) */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Form Setup (5 cols) */}
        <div className={`space-y-5 pb-24 lg:pb-0 ${mobileTab === "form" ? "block" : "hidden lg:block"} lg:col-span-5`}>
          {/* Section 1: Payer Type & Period */}
          <Section
            title="Đối tượng & Loại hình người nộp thuế"
            icon={<Building2 size={18} className="text-brand" />}
            badge=""
          >
            {/* Interactive 3-Button Segmented Selector */}
            <div>
              <span className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                Mô hình kinh doanh của bạn:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "household", label: "Hộ kinh doanh", icon: <Store size={17} />, hint: "Phổ biến nhất sàn" },
                  { id: "individual", label: "Cá nhân KD", icon: <User size={17} />, hint: "Kinh doanh tự do" },
                  { id: "company", label: "Doanh nghiệp", icon: <Building2 size={17} />, hint: "Công ty / DN" },
                ].map((item) => {
                  const isActive = input.payerType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => changePayer(item.id as TaxPayerType)}
                      className={`min-h-[72px] sm:min-h-[80px] h-full flex flex-col items-center justify-center rounded-2xl border p-2 sm:p-3 text-center transition-all cursor-pointer ${isActive
                        ? "border-brand bg-brand-light/35 dark:bg-brand-light/15 text-brand shadow-xs ring-2 ring-brand/20 font-black"
                        : "border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                    >
                      <div className="mb-1">{item.icon}</div>
                      <span className="text-[11px] sm:text-xs font-bold leading-tight">{item.label}</span>
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
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  <option value={2026} className="dark:bg-slate-900">Kỳ tính thuế 2026 (được hỗ trợ)</option>
                </select>
              </Field>

              {isPersonal ? (
                <Field label="Tình trạng cư trú">
                  <select
                    value={input.residencyStatus}
                    onChange={(event) => update("residencyStatus", event.target.value as TaxCalculatorInput["residencyStatus"])}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="resident" className="dark:bg-slate-900">Cá nhân cư trú tại Việt Nam</option>
                    <option value="nonresident" className="dark:bg-slate-900">Cá nhân không cư trú</option>
                    <option value="unknown" className="dark:bg-slate-900">Chưa xác định</option>
                  </select>
                </Field>
              ) : (
                <Field label="Thuế suất GTGT đầu ra">
                  <select
                    value={input.companyVatRate}
                    onChange={(event) => update("companyVatRate", Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
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
              <div className="rounded-2xl border border-brand/20 bg-brand-light/30 dark:bg-brand-light/10 p-3.5 space-y-3">
                <div>
                  <span className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Phương pháp tính thuế TNCN:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => update("personalIncomeMethod", "revenue")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${input.personalIncomeMethod === "revenue"
                        ? "border-brand bg-white dark:bg-slate-800 text-brand shadow-xs ring-2 ring-brand/20 font-bold"
                        : "border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${input.personalIncomeMethod === "revenue" ? "bg-brand" : "bg-slate-300 dark:bg-slate-600"}`} />
                        <span>1. Theo % Doanh thu</span>
                      </div>
                      <p className="mt-1 text-[11px] opacity-75 font-normal pl-4 leading-tight">
                        Tính trên phần vượt ngưỡng 1 tỷ (Áp dụng phổ biến sàn TMĐT)
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => update("personalIncomeMethod", "profit")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${input.personalIncomeMethod === "profit"
                        ? "border-brand bg-white dark:bg-slate-800 text-brand shadow-xs ring-2 ring-brand/20 font-bold"
                        : "border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${input.personalIncomeMethod === "profit" ? "bg-brand" : "bg-slate-300 dark:bg-slate-600"}`} />
                        <span>2. Theo Thu nhập chịu thuế</span>
                      </div>
                      <p className="mt-1 text-[11px] opacity-75 font-normal pl-4 leading-tight">
                        Thu nhập = Doanh thu − Chi phí hợp lệ có chứng từ
                      </p>
                    </button>
                  </div>
                </div>

                <Field label="Doanh thu năm trước" hint="">
                  <MoneyInput value={input.personalPreviousYearRevenue} onChange={(value) => update("personalPreviousYearRevenue", value)} />
                </Field>

                {input.personalIncomeMethod === "profit" && (
                  <Field label="Năm bắt đầu theo thu nhập" hint="Duy trì tối thiểu 2 năm">
                    <input
                      type="number"
                      min={2024}
                      max={2026}
                      value={input.profitMethodStartYear ?? ""}
                      onChange={(event) => update("profitMethodStartYear", event.target.value ? Number(event.target.value) : null)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-bold outline-none transition focus:border-brand"
                    />
                  </Field>
                )}
              </div>
            )}
          </Section>

          {/* Section 2: Multichannel Revenue */}
          <Section
            title="Doanh thu đa kênh trong năm"
            icon={<ShoppingCart size={18} className="text-brand" />}
            badge={
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-0.5 text-xs font-mono font-black text-emerald-700 dark:text-emerald-300 shrink-0">
                Tổng: {moneyFormat.format(liveTotalRevenue)} ₫
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
              <Field label="Sàn TMĐT khác" hint="">
                <MoneyInput
                  value={input.otherPlatformRevenue}
                  onChange={(value) => update("otherPlatformRevenue", value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Kênh tự chốt" hint="">
                <MoneyInput
                  value={input.directRevenue}
                  onChange={(value) => update("directRevenue", value)}
                  placeholder="0"
                />
              </Field>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl bg-brand-light/30 dark:bg-brand-light/10 border border-brand/20 p-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <Info size={16} className="shrink-0 text-brand mt-0.5" />
              <span>
                <strong>Căn cứ Luật Thuế 2026:</strong> Ngưỡng 1 tỷ đồng/năm xét trên <strong>tổng doanh thu toàn bộ hoạt động kinh doanh</strong>, không xét riêng từng sàn hay từng tài khoản.
              </span>
            </div>

            {isPersonal && (
              <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">Phân bổ theo nhóm hoạt động</p>


                  </div>
                  <span className={`text-[11px] font-black shrink-0 ${Math.abs(activityRevenueTotal - liveTotalRevenue) <= 1 ? "text-emerald-600" : "text-rose-600"}`}>
                    {moneyFormat.format(activityRevenueTotal)} / {moneyFormat.format(liveTotalRevenue)} ₫
                  </span>
                </div>

                {activityRevenueTotal < liveTotalRevenue && liveTotalRevenue > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setInput(prev => ({
                        ...prev,
                        activityRevenues: {
                          goods: liveTotalRevenue,
                          services: 0,
                          production: 0,
                          digital: 0,
                          other: 0,
                        }
                      }));
                      setHasCalculated(false);
                      setCalculatedResult(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-brand/30 bg-brand-light/30 dark:bg-brand-light/10 text-xs font-bold text-brand hover:bg-brand-light/60 transition cursor-pointer shadow-2xs"
                  >
                    <Zap size={13} className="text-amber-500" /> Phân bổ nhanh 100% vào Bán hàng hóa (1.5%)
                  </button>
                )}

                <div className="grid gap-2.5 grid-cols-1">
                  {(Object.entries(ACTIVITY_RATES) as [BusinessActivity, (typeof ACTIVITY_RATES)[BusinessActivity]][]).map(([id, item]) => (
                    <Field key={id} label={item.label} hint={``}>
                      <MoneyInput
                        value={input.activityRevenues[id]}
                        max={maxActivityRevenue(id)}
                        onChange={(value) => updateActivityRevenue(id, value)}
                      />
                    </Field>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Section 3: Costs, Deductions & Fees */}
          <Section
            title="Chi phí có hóa đơn chứng từ & Dòng tiền"
            icon={<ReceiptText size={18} className="text-amber-500" />}
          >
            <div className="grid gap-3 grid-cols-1">
              <Field label="Tổng phí sàn TMĐT" hint="">
                <MoneyInput
                  value={input.platformFees}
                  onChange={(value) => update("platformFees", value)}
                  placeholder="0"
                />
              </Field>

              {(!isPersonal || input.personalIncomeMethod === "profit") && (
                <label className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-xs cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition sm:col-span-2">
                  <input type="checkbox" className="mt-0.5 rounded text-brand focus:ring-brand shrink-0" checked={input.platformFeesDeductible}
                    onChange={(event) => update("platformFeesDeductible", event.target.checked)} />
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">Tính phí sàn vào chi phí được trừ</strong>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Chỉ bật khi phí sàn có hóa đơn/chứng từ hợp lệ và chưa được cộng trong ô chi phí hợp lệ khác.
                    </p>
                  </div>
                </label>
              )}

              {(!isPersonal || input.personalIncomeMethod === "profit" || liveTotalRevenue > 3_000_000_000) && (
                <>
                  <Field label="Chi phí hợp lệ khác" hint="Không gồm phí sàn">
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
                  <Field label="Tổng doanh thu năm trước" hint="Gồm tài chính, thu nhập khác">
                    <MoneyInput
                      value={input.companyPreviousYearRevenue}
                      onChange={(value) => update("companyPreviousYearRevenue", value)}
                      placeholder="0"
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Số tháng hoạt động năm trước" hint="Quy đổi đủ 12 tháng">
                      <input type="number" min={1} max={12} value={input.companyPreviousYearOperatingMonths}
                        onChange={(event) => update("companyPreviousYearOperatingMonths", Number(event.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-right font-mono text-sm font-bold" />
                    </Field>
                    <Field label="GTGT đầu vào được khấu trừ" hint="">
                      <MoneyInput
                        value={input.deductibleInputVat}
                        onChange={(value) => update("deductibleInputVat", value)}
                        placeholder="0"
                      />
                    </Field>
                  </div>
                </>
              )}
            </div>

            {!isPersonal && (
              <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                <p className="text-xs font-black text-blue-900 dark:text-blue-200">Điều kiện miễn TNDN và ưu đãi doanh nghiệp nhỏ</p>
                <label className="flex gap-2 text-xs cursor-pointer"><input type="checkbox" checked={input.companyIsNewThisYear} onChange={(e) => update("companyIsNewThisYear", e.target.checked)} /> Doanh nghiệp mới thành lập trong năm 2026</label>
                <label className="flex gap-2 text-xs cursor-pointer"><input type="checkbox" checked={input.companyHasPreviousYearData} onChange={(e) => update("companyHasPreviousYearData", e.target.checked)} /> Đã nhập đủ doanh thu tham chiếu của năm trước</label>
                <label className="flex gap-2 text-xs cursor-pointer"><input type="checkbox" checked={input.companyHasDisqualifyingRelatedParty} onChange={(e) => update("companyHasDisqualifyingRelatedParty", e.target.checked)} /> Có doanh nghiệp liên kết không đáp ứng điều kiện miễn theo doanh thu</label>
                <label className="flex gap-2 text-xs cursor-pointer"><input type="checkbox" checked={input.companyIsSme} onChange={(e) => update("companyIsSme", e.target.checked)} /> Là doanh nghiệp nhỏ và vừa đăng ký lần đầu</label>
                {input.companyIsSme && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Năm đăng ký lần đầu">
                      <input type="number" min={2024} max={2026} value={input.companyFirstRegistrationYear ?? ""}
                        onChange={(e) => update("companyFirstRegistrationYear", e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold dark:border-blue-900 dark:bg-slate-900" />
                    </Field>
                    <div className="space-y-2 text-[11px]">
                      <label className="flex gap-2 cursor-pointer"><input type="checkbox" checked={input.companyCreatedFromReorganization} onChange={(e) => update("companyCreatedFromReorganization", e.target.checked)} /> Hình thành do chia, tách, sáp nhập hoặc chuyển đổi</label>
                      <label className="flex gap-2 cursor-pointer"><input type="checkbox" checked={input.companyControllerHasPriorBusiness} onChange={(e) => update("companyControllerHasPriorBusiness", e.target.checked)} /> Người kiểm soát có doanh nghiệp trước đó thuộc diện loại trừ</label>
                      <label className="flex gap-2 cursor-pointer"><input type="checkbox" checked={input.companyHasExcludedIncome} onChange={(e) => update("companyHasExcludedIncome", e.target.checked)} /> Có thu nhập không được hưởng miễn</label>
                      <label className="flex gap-2 cursor-pointer"><input type="checkbox" checked={input.companyUsesOtherTaxIncentive} onChange={(e) => update("companyUsesOtherTaxIncentive", e.target.checked)} /> Đang áp dụng ưu đãi TNDN khác</label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Section 4: Withheld Tax */}
          <Section
            title="Thuế đã khấu trừ, tạm nộp"
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

            <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <Info size={15} className="mt-0.5 shrink-0" />
              Công cụ không tự áp dụng đề xuất giảm 30% khi chưa có văn bản xác định chính sách có hiệu lực. Số đã khấu trừ hoặc tạm nộp chỉ dùng để đối chiếu số còn phải nộp và nộp thừa.
            </div>
          </Section>

          {/* ACTION BUTTON & NOTICES: NÚT TÍNH TOÁN THEO YÊU CẦU */}
          <div className="space-y-3 pt-2">
            {saveNotice && (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{saveNotice}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleCalculate()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand hover:bg-brand-hover px-5 py-4 text-sm font-black text-white shadow-lg shadow-brand/25 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Calculator size={18} />
              <span>{editingId ? "Cập nhật dự toán thuế" : hasCalculated ? "Cập nhật & Tính toán lại" : "Tính toán nghĩa vụ thuế"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Tax Output (7 cols) - Chỉ hiển thị khi đã ấn tính toán */}
        <div className={`${mobileTab === "result" ? "block" : "hidden lg:block"} lg:col-span-7`}>
          {hasCalculated && calculatedResult ? (
            <TaxCalculatorOutput input={input} result={calculatedResult} />
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[480px] shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-brand-light dark:bg-brand-light/20 text-brand flex items-center justify-center mb-4 shadow-xs">
                <Calculator size={32} />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Sẵn sàng dự toán thuế TMĐT 2026
              </h3>
              <p className="mt-2 max-w-md text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Thiết lập các thông số doanh thu và chi phí ở cột bên trái, sau đó nhấn nút <strong className="text-brand">Tính toán nghĩa vụ thuế</strong> để xem báo cáo bóc tách chi tiết.
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleCalculate()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 text-sm font-black text-white shadow-lg shadow-brand/20 hover:bg-brand-hover active:scale-95 transition-all cursor-pointer"
                >
                  <Calculator size={16} /> Bấm để tính toán ngay
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-left">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Ngưỡng 1 Tỷ Mới</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Áp dụng Luật 2026 trên tổng doanh thu đa sàn</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Đa hoạt động</p>
                  <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Tách doanh thu theo từng mức thuế suất</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50">
                  <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Khấu Trừ Sàn</p>
                  <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">Bóc tách thuế sàn đã nộp & số còn phải nộp</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Mobile Sticky CTA Bar */}
      {mobileTab === "form" && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400">Doanh thu tạm tính</p>
              <p className="text-sm font-black font-mono text-slate-900 dark:text-white truncate">
                {moneyFormat.format(liveTotalRevenue)} ₫
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCalculate()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-hover px-5 py-2.5 text-xs font-black text-white shadow-md shadow-brand/25 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Calculator size={15} />
              <span>{editingId ? "Cập nhật dự toán" : hasCalculated ? "Tính lại" : "Tính thuế ngay"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
