"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  AiUnitEconomicsData,
  ToolCostMetric,
  VipUserMetric,
  DailyEconomicsMetric,
} from "@/lib/ai-economics";
import { formatVnd, formatUsd, formatTokens } from "@/lib/ai-cost";
import { fetchAiEconomicsAction, clearAiUsageLogsAction } from "@/app/admin/ai-costs/actions";
import {
  Coins,
  TrendingUp,
  Cpu,
  PiggyBank,
  Percent,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Award,
  Trash2,
  CheckCircle2,
} from "lucide-react";

interface AiCostsManagerProps {
  initialData: AiUnitEconomicsData;
}

export function AiCostsManager({ initialData }: AiCostsManagerProps) {
  const [data, setData] = useState<AiUnitEconomicsData>(initialData);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "all">(initialData.timeframe);
  const [isPending, startTransition] = useTransition();

  // Filter states
  const [toolSearch, setToolSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userHealthFilter, setUserHealthFilter] = useState<string>("ALL");
  const [showPricingGuide, setShowPricingGuide] = useState(false);
  const [chartMode, setChartMode] = useState<"both" | "revenue" | "cost">("both");

  // Clear data states
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearScope, setClearScope] = useState<"all" | "7d" | "30d_older">("all");
  const [isClearing, setIsClearing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Switch timeframe handler
  const handleTimeframeChange = (tf: "7d" | "30d" | "all") => {
    setTimeframe(tf);
    startTransition(async () => {
      const res = await fetchAiEconomicsAction(tf);
      if (res.success && res.data) {
        setData(res.data);
      }
    });
  };

  const handleRefresh = () => {
    startTransition(async () => {
      const res = await fetchAiEconomicsAction(timeframe);
      if (res.success && res.data) {
        setData(res.data);
      }
    });
  };

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      const res = await clearAiUsageLogsAction(clearScope);
      if (res.success) {
        setShowClearModal(false);
        setToastMessage(`Đã xóa thành công ${res.count ?? 0} bản ghi nhật ký sử dụng AI!`);
        setTimeout(() => setToastMessage(null), 4000);
        const updated = await fetchAiEconomicsAction(timeframe);
        if (updated.success && updated.data) {
          setData(updated.data);
        }
      } else {
        alert(res.error || "Không thể xóa dữ liệu.");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi khi xóa dữ liệu.");
    } finally {
      setIsClearing(false);
    }
  };

  // Filtered tools
  const filteredTools = useMemo(() => {
    return data.toolBreakdown.filter(
      (t) =>
        t.toolName.toLowerCase().includes(toolSearch.toLowerCase()) ||
        t.tool.toLowerCase().includes(toolSearch.toLowerCase())
    );
  }, [data.toolBreakdown, toolSearch]);

  // Filtered VIP users
  const filteredUsers = useMemo(() => {
    return data.vipBreakdown.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.phone && u.phone.includes(userSearch));

      if (!matchesSearch) return false;

      if (userHealthFilter === "ALL") return true;
      if (userHealthFilter === "VIP_ONLY") return u.isVIP;
      return u.healthStatus === userHealthFilter;
    });
  }, [data.vipBreakdown, userSearch, userHealthFilter]);

  // Export CSV functions
  const exportToolsCsv = () => {
    const headers = [
      "Cong Cu",
      "Slug",
      "Luot Tao",
      "Prompt Tokens",
      "Completion Tokens",
      "Tong Tokens",
      "Chi Phi USD",
      "Chi Phi VND",
      "Chi Phi TB/Luot (VND)",
      "Ty Trong Chi Phi (%)",
    ];
    const rows = data.toolBreakdown.map((t) => [
      `"${t.toolName.replace(/"/g, '""')}"`,
      t.tool,
      t.generationCount,
      t.promptTokens,
      t.completionTokens,
      t.totalTokens,
      t.costUsd,
      t.costVnd,
      t.avgCostPerGenVnd,
      `${t.shareOfCostPct}%`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bao-cao-chi-phi-cong-cu-${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportVipCsv = () => {
    const headers = [
      "Khach Hang",
      "Email",
      "So Dien Thoai",
      "La VIP",
      "Goi Dich Vu",
      "Doanh Thu (VND)",
      "Luot Dung AI",
      "Tong Tokens",
      "Chi Phi AI (VND)",
      "Chi Phi AI (USD)",
      "Loi Nhuan Rong (VND)",
      "Bien Loi Nhuan (%)",
      "Trang Thai Unit Economics",
    ];
    const rows = data.vipBreakdown.map((u) => [
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      u.phone || "",
      u.isVIP ? "CO" : "KHONG",
      `"${u.planName}"`,
      u.revenueVnd,
      u.generationCount,
      u.totalTokens,
      u.costVnd,
      u.costUsd,
      u.netProfitVnd,
      `${u.grossMarginPct}%`,
      u.healthStatus,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `unit-economics-khach-hang-${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for status badge
  const renderHealthBadge = (status: VipUserMetric["healthStatus"], marginPct: number) => {
    switch (status) {
      case "SUPER_PROFITABLE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Siêu lợi nhuận ({marginPct}%)
          </span>
        );
      case "HEALTHY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck size={12} />
            An toàn ({marginPct}%)
          </span>
        );
      case "LOW_MARGIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={12} />
            Biên mỏng ({marginPct}%)
          </span>
        );
      case "DEFICIT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Flame size={12} />
            Thâm hụt ({marginPct}%)
          </span>
        );
      case "FREE_TIER":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Miễn phí
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Báo Cáo Chi Phí Token & Unit Economics
            </h1>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              OpenAI Cost Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Đo lường chi phí OpenAI thực tế theo từng công cụ và từng user VIP để kiểm soát biên lợi nhuận ròng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => handleTimeframeChange("7d")}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === "7d"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => handleTimeframeChange("30d")}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === "30d"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              30 ngày qua
            </button>
            <button
              onClick={() => handleTimeframeChange("all")}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === "all"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Toàn thời gian
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} className={isPending ? "animate-spin text-blue-600" : ""} />
          </button>

          {/* Clear Data button */}
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-colors shadow-2xs"
            title="Xóa nhật ký dữ liệu chi phí AI để đặt lại số liệu"
          >
            <Trash2 size={13} />
            <span>Xóa Dữ Liệu</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={exportToolsCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download size={13} />
              <span>Xuất CSV Công Cụ</span>
            </button>
            <button
              onClick={exportVipCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Download size={13} />
              <span>Xuất CSV VIP Economics</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Doanh thu */}
        <div className="bg-gradient-to-br from-white to-emerald-50/40 p-5 rounded-2xl border border-emerald-100/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Doanh Thu Gói VIP
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-700">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatVnd(data.totalRevenueVnd)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Từ các đơn SePay thành công</span>
            </p>
          </div>
        </div>

        {/* Chi phí OpenAI */}
        <div className="bg-gradient-to-br from-white to-rose-50/40 p-5 rounded-2xl border border-rose-100/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-rose-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Tổng Chi Phí AI
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100/80 flex items-center justify-center text-rose-700">
              <Cpu size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
              <span>{formatVnd(data.totalAiCostVnd)}</span>
              <span className="text-xs font-bold text-rose-600">
                ({formatUsd(data.totalAiCostUsd)})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Đã dùng: <strong className="text-slate-700">{formatTokens(data.totalTokens)}</strong> tokens
            </p>
          </div>
        </div>

        {/* Lợi nhuận gộp */}
        <div className="bg-gradient-to-br from-white to-blue-50/40 p-5 rounded-2xl border border-blue-100/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-blue-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Lợi Nhuận Gộp AI
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100/80 flex items-center justify-center text-blue-700">
              <PiggyBank size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatVnd(data.grossProfitVnd)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Doanh thu sau khi trừ chi phí token
            </p>
          </div>
        </div>

        {/* Biên lợi nhuận ròng */}
        <div className="bg-gradient-to-br from-white to-indigo-50/40 p-5 rounded-2xl border border-indigo-100/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-indigo-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
              Biên Lợi Nhuận
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100/80 flex items-center justify-center text-indigo-700">
              <Percent size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{data.grossMarginPct}%</span>
              {data.marginStatus === "EXCELLENT" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Cực Tốt
                </span>
              )}
              {data.marginStatus === "GOOD" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Chuẩn
                </span>
              )}
              {data.marginStatus === "WARNING" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Cảnh Báo
                </span>
              )}
              {data.marginStatus === "CRITICAL" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  Báo Động
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Mục tiêu chiến lược: &gt; 80%
            </p>
          </div>
        </div>

        {/* Chi phí trung bình / VIP */}
        <div className="bg-gradient-to-br from-white to-amber-50/40 p-5 rounded-2xl border border-amber-100/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-amber-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Chi Phí TB / Khách VIP
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-700">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatVnd(data.avgCostPerVipUserVnd)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Trên tổng số <strong>{data.vipUsersCount}</strong> hội viên VIP
            </p>
          </div>
        </div>
      </div>

      {/* Visual Charts & Timeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Economics Timeline Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Calendar size={18} className="text-blue-600" />
                <span>Xu Hướng Doanh Thu & Chi Phí Token Hàng Ngày</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                So sánh lượng tiền thu vào và chi phí OpenAI theo từng ngày
              </p>
            </div>

            {/* Mode selector and Legend */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setChartMode("both")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    chartMode === "both"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cả hai
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("revenue")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    chartMode === "revenue"
                      ? "bg-white text-emerald-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Doanh thu
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("cost")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    chartMode === "cost"
                      ? "bg-white text-rose-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Chi phí AI
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs font-medium pl-1">
                {(chartMode === "both" || chartMode === "revenue") && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
                    Doanh thu
                  </span>
                )}
                {(chartMode === "both" || chartMode === "cost") && (
                  <span className="flex items-center gap-1 text-rose-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span>
                    Chi phí AI
                  </span>
                )}
                {chartMode === "both" && (
                  <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                    Cùng thang đo VND
                  </span>
                )}
                {chartMode === "cost" && (
                  <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-medium">
                    Phóng to chi phí Token
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Render Timeline Bars */}
          {data.dailyTimeline.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Không có dữ liệu phát sinh trong giai đoạn này.
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {/* Chart Visual Area with Gridlines */}
              <div className="relative h-52 w-full pt-4">
                {/* Horizontal Grid lines */}
                {(() => {
                  const maxRev = Math.max(...data.dailyTimeline.map((d) => d.revenueVnd), 20000);
                  const maxC = Math.max(...data.dailyTimeline.map((d) => d.costVnd), 100);
                  const maxUni = Math.max(maxRev, maxC);
                  const topVal = chartMode === "cost" ? maxC : chartMode === "revenue" ? maxRev : maxUni;

                  return (
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
                      <div className="border-b border-dashed border-slate-200/80 w-full flex justify-between items-center text-[10px] text-slate-400">
                        <span className="bg-white/90 px-1 font-mono">{formatVnd(topVal)}</span>
                      </div>
                      <div className="border-b border-dashed border-slate-100 w-full flex justify-between items-center text-[10px] text-slate-300">
                        <span className="bg-white/90 px-1 font-mono">{formatVnd(Math.round(topVal / 2))}</span>
                      </div>
                      <div className="border-b border-slate-200 w-full flex justify-between items-center text-[10px] text-slate-400">
                        <span className="bg-white/90 px-1 font-mono">0 ₫</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Bars Container */}
                <div className="relative h-full flex items-end gap-0.5 sm:gap-1 px-1 pb-7 z-10">
                  {(() => {
                    const maxRevenue = Math.max(
                      ...data.dailyTimeline.map((d) => d.revenueVnd),
                      20000
                    );
                    const maxCost = Math.max(
                      ...data.dailyTimeline.map((d) => d.costVnd),
                      100
                    );
                    // Ở chế độ "Cả hai": Quy chuẩn về cùng thang đo tiền tệ chung VND
                    const maxUnified = Math.max(maxRevenue, maxCost);

                    const totalDays = data.dailyTimeline.length;
                    const step = totalDays > 14 ? Math.ceil(totalDays / 7) : 1;

                    return data.dailyTimeline.map((day, index) => {
                      const isLabelVisible =
                        step === 1 ||
                        index === 0 ||
                        index === totalDays - 1 ||
                        index % step === 0;

                      let revPct = 0;
                      let costPct = 0;

                      if (chartMode === "revenue") {
                        revPct = day.revenueVnd > 0 ? Math.max(8, Math.min(100, (day.revenueVnd / maxRevenue) * 100)) : 0;
                      } else if (chartMode === "cost") {
                        // Chế độ phóng to chi phí token: thang đo theo maxCost
                        costPct = day.costVnd > 0 ? Math.max(8, Math.min(100, (day.costVnd / maxCost) * 100)) : 0;
                      } else {
                        // Chế độ "Cả hai": Dùng thang đo tiền tệ VND đồng nhất
                        revPct = day.revenueVnd > 0 ? Math.max(8, Math.min(100, (day.revenueVnd / maxUnified) * 100)) : 0;
                        // Chi phí AI thực tế rất nhỏ so với doanh thu nạp VIP (ví dụ 150đ so với 20.000đ - 50.000đ)
                        // Hiển thị tỷ lệ tương quan chính xác với mức tối thiểu 2.5% khi có phát sinh chi phí
                        costPct = day.costVnd > 0 ? Math.max(2.5, Math.min(100, (day.costVnd / maxUnified) * 100)) : 0;
                      }

                      return (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                        >
                          {/* Rich Floating Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col z-30 bg-slate-900 text-white text-[11px] p-2.5 rounded-xl shadow-xl border border-slate-700 whitespace-nowrap pointer-events-none left-1/2 -translate-x-1/2">
                            <span className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1">
                              {day.date}
                            </span>
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between gap-4 text-emerald-400">
                                <span>Doanh thu:</span>
                                <span className="font-bold">{formatVnd(day.revenueVnd)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-rose-400">
                                <span>Chi phí AI:</span>
                                <span className="font-bold">
                                  {formatVnd(day.costVnd)}{" "}
                                  <span className="text-[10px] opacity-80">
                                    ({formatUsd(day.costUsd)})
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-blue-300">
                                <span>Lợi nhuận ròng:</span>
                                <span className="font-bold">{formatVnd(day.profitVnd)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                                <span>Lượt chạy & Token:</span>
                                <span>
                                  {day.generations} lượt | {formatTokens(day.tokens)} tok
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Hover Column Indicator */}
                          <div className="absolute inset-0 group-hover:bg-slate-100/60 rounded-t-md transition-colors pointer-events-none"></div>

                          {/* Bar Graphic */}
                          <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full z-10">
                            {/* Revenue Bar */}
                            {(chartMode === "both" || chartMode === "revenue") && (
                              <div
                                style={{ height: `${revPct}%` }}
                                className={`rounded-t-xs transition-all ${
                                  chartMode === "revenue"
                                    ? "w-full max-w-[14px]"
                                    : "w-1/2 max-w-[8px]"
                                } ${
                                  day.revenueVnd > 0
                                    ? "bg-emerald-500 group-hover:bg-emerald-600 shadow-2xs"
                                    : "opacity-0 pointer-events-none"
                                }`}
                              ></div>
                            )}

                            {/* Cost Bar */}
                            {(chartMode === "both" || chartMode === "cost") && (
                              <div
                                style={{ height: `${costPct}%` }}
                                className={`rounded-t-xs transition-all ${
                                  chartMode === "cost"
                                    ? "w-full max-w-[14px]"
                                    : "w-1/2 max-w-[8px]"
                                } ${
                                  day.costVnd > 0
                                    ? "bg-rose-500 group-hover:bg-rose-600 shadow-2xs"
                                    : "opacity-0 pointer-events-none"
                                }`}
                              ></div>
                            )}
                          </div>

                          {/* X-Axis Date Label (No truncation with ...) */}
                          <div className="absolute -bottom-6 w-full flex justify-center text-center">
                            {isLabelVisible ? (
                              <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                                {day.label}
                              </span>
                            ) : (
                              <span className="w-1 h-1 rounded-full bg-slate-200 my-1.5 opacity-60"></span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Summary Footer */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 px-1 gap-2">
                <div className="flex items-center gap-3">
                  <span>
                    Tổng số lượt tạo: <strong className="text-slate-800">{data.totalGenerations}</strong> lượt
                  </span>
                  <span>•</span>
                  <span>
                    Tổng token: <strong className="text-slate-800">{formatTokens(data.totalTokens)}</strong>
                  </span>
                </div>
                <div>
                  Chi phí TB / lượt:{" "}
                  <strong className="text-slate-800">{formatVnd(data.avgCostPerGenVnd)}</strong> (
                  {data.avgTokensPerGen} tokens)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* OpenAI Model Distribution & System Stats */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-amber-500" />
              <span>Phân Bổ Theo Mô Hình AI & Thuật Toán</span>
            </h3>

            <div className="space-y-3">
              {data.modelBreakdown.length === 0 ? (
                <div className="text-slate-400 text-xs py-4 text-center">Chưa có dữ liệu model</div>
              ) : (
                data.modelBreakdown.map((m) => {
                  const isFormula = m.model.includes("Thuật toán") || m.model.includes("Calculator");
                  const isLocal = m.model.toLowerCase().includes("qwen") || m.model.toLowerCase().includes("ollama");
                  return (
                    <div key={m.model} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono">{m.model}</span>
                          {isFormula ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-sans font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                              Thuật toán thuần (0 đ)
                            </span>
                          ) : isLocal ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-sans font-medium bg-purple-100 text-purple-700 border border-purple-200">
                              Local AI (0 đ)
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-sans font-medium bg-sky-100 text-sky-700 border border-sky-200">
                              OpenAI API
                            </span>
                          )}
                        </div>
                        <span className={m.costVnd > 0 ? "text-rose-600 shrink-0" : "text-emerald-600 font-mono shrink-0"}>
                          {formatVnd(m.costVnd)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${m.sharePct}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                        <span>
                          {m.generationCount} lượt ({m.sharePct}% chi phí)
                        </span>
                        <span>{formatTokens(m.totalTokens)} tokens</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pricing Cheat Sheet Toggle Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-indigo-400" />
                <span className="font-bold text-xs sm:text-sm">Bảng Giá Chuẩn OpenAI</span>
              </div>
              <button
                onClick={() => setShowPricingGuide(!showPricingGuide)}
                className="text-xs text-indigo-200 hover:text-white flex items-center gap-1 font-medium underline"
              >
                <span>{showPricingGuide ? "Thu gọn" : "Xem chi tiết"}</span>
                {showPricingGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {showPricingGuide && (
              <div className="mt-3 pt-3 border-t border-indigo-800/60 text-xs space-y-2 text-indigo-100">
                <div className="flex justify-between items-center py-1 border-b border-indigo-800/40">
                  <span className="font-semibold text-white">GPT-4o mini</span>
                  <span>$0.15 in / $0.60 out (1M tokens)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-indigo-800/40">
                  <span className="font-semibold text-white">GPT-4o</span>
                  <span>$2.50 in / $10.00 out (1M tokens)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold text-white">Tỷ giá VND áp dụng</span>
                  <span className="font-mono font-bold text-emerald-400">25,400 đ / USD</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tool Cost Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              <span>Bảng Đo Lường Chi Phí OpenAI Theo Từng Công Cụ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phát hiện công cụ nào đang “ngốn” token nhiều nhất để tối ưu hóa prompt hoặc điều chỉnh quota
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên công cụ..."
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Công Cụ AI</th>
                <th className="px-4 py-3 text-center">Lượt Chạy</th>
                <th className="px-4 py-3 text-right">Tổng Tokens</th>
                <th className="px-4 py-3 text-right">Chi Phí (USD)</th>
                <th className="px-4 py-3 text-right">Chi Phí (VND)</th>
                <th className="px-4 py-3 text-right">TB / Lượt Chạy</th>
                <th className="px-4 py-3 text-left w-44">Tỷ Trọng Chi Phí</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTools.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Không tìm thấy công cụ phù hợp với từ khóa.
                  </td>
                </tr>
              ) : (
                filteredTools.map((tool) => (
                  <tr key={tool.tool} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{tool.toolName}</span>
                        {["pricing-calculator", "tax-calculator", "koc-planner", "koc-calculator"].includes(tool.tool) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Công thức thuần (0 đ)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{tool.tool}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-slate-800 px-2 py-0.5 rounded-md bg-slate-100">
                        {tool.generationCount}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-700">
                      <div>{formatTokens(tool.totalTokens)}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatTokens(tool.promptTokens)} in / {formatTokens(tool.completionTokens)} out
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-700">
                      {formatUsd(tool.costUsd)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                      {formatVnd(tool.costVnd)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-600">
                      <span className="font-semibold text-slate-800">
                        {formatVnd(tool.avgCostPerGenVnd)}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        ~{tool.avgTokensPerGen} tokens
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, tool.shareOfCostPct)}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-700 text-[11px] w-10 text-right">
                          {tool.shareOfCostPct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIP Customer Unit Economics Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              <span>Bảng Unit Economics Từng Khách Hàng VIP</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              So sánh số tiền khách hàng đã thanh toán so với chi phí OpenAI API họ đã tiêu thụ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter status */}
            <select
              value={userHealthFilter}
              onChange={(e) => setUserHealthFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả khách hàng ({data.vipBreakdown.length})</option>
              <option value="VIP_ONLY">Chỉ hội viên VIP</option>
              <option value="SUPER_PROFITABLE">Siêu lợi nhuận (Margin &ge; 90%)</option>
              <option value="HEALTHY">An toàn (Margin 70 - 89%)</option>
              <option value="LOW_MARGIN">Biên mỏng (Margin &lt; 70%)</option>
              <option value="DEFICIT">Thâm hụt / Lỗ</option>
            </select>

            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tên, email, số điện thoại..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Khách Hàng</th>
                <th className="px-4 py-3">Gói Hội Viên</th>
                <th className="px-4 py-3 text-right">Doanh Thu (VND)</th>
                <th className="px-4 py-3 text-center">Lượt Dùng AI</th>
                <th className="px-4 py-3 text-right">Chi Phí AI (VND)</th>
                <th className="px-4 py-3 text-right">Lợi Nhuận Ròng</th>
                <th className="px-4 py-3 text-center">Biên Lợi Nhuận</th>
                <th className="px-4 py-3 text-center">Đánh Giá Kinh Doanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Không tìm thấy người dùng phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs uppercase shrink-0">
                          {user.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.isVIP && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{user.email}</div>
                          {user.phone && (
                            <div className="text-[10px] text-slate-400">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                        {user.planName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                      {formatVnd(user.revenueVnd)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-semibold text-slate-800 px-2 py-0.5 rounded bg-slate-100">
                        {user.generationCount}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formatTokens(user.totalTokens)} tok
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-rose-600">
                      {formatVnd(user.costVnd)}
                      <div className="text-[10px] font-normal text-slate-400">
                        {formatUsd(user.costUsd)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold">
                      <span
                        className={
                          user.netProfitVnd >= 0 ? "text-emerald-600" : "text-rose-600 font-black"
                        }
                      >
                        {formatVnd(user.netProfitVnd)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold">
                      {user.revenueVnd > 0 ? (
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs ${
                            user.grossMarginPct >= 90
                              ? "bg-emerald-100 text-emerald-800"
                              : user.grossMarginPct >= 70
                              ? "bg-blue-100 text-blue-800"
                              : user.grossMarginPct >= 40
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {user.grossMarginPct}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {renderHealthBadge(user.healthStatus, user.grossMarginPct)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Xác Nhận Xóa Dữ Liệu Chi Phí AI
            </h3>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Hành động này sẽ xóa các bản ghi nhật ký sử dụng AI (<code className="text-rose-600 font-mono font-bold bg-rose-50 px-1 py-0.5 rounded">AiUsageLog</code>) trong cơ sở dữ liệu.
              Toàn bộ số lượt tạo, token tiêu thụ và chi phí OpenAI sẽ được đặt lại tương ứng.
              <br />
              <strong className="text-slate-700 block mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                🛡️ Lưu ý an toàn: Doanh thu nạp tiền và quyền hạn VIP của người dùng vẫn được bảo toàn nguyên vẹn.
              </strong>
            </p>

            <div className="mt-4 space-y-2.5">
              <label className="text-xs font-bold text-slate-700 block">
                Chọn phạm vi xóa:
              </label>

              <div
                onClick={() => setClearScope("all")}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  clearScope === "all"
                    ? "border-rose-500 bg-rose-50/50 shadow-2xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === "all"}
                  onChange={() => setClearScope("all")}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Xóa toàn bộ (Reset về 0)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Xóa sạch 100% nhật ký để bắt đầu đo lường dữ liệu từ đầu.
                  </div>
                </div>
              </div>

              <div
                onClick={() => setClearScope("7d")}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  clearScope === "7d"
                    ? "border-rose-500 bg-rose-50/50 shadow-2xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === "7d"}
                  onChange={() => setClearScope("7d")}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Chỉ xóa 7 ngày gần nhất</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Xóa các lượt chạy thử nghiệm phát sinh trong 7 ngày qua.
                  </div>
                </div>
              </div>

              <div
                onClick={() => setClearScope("30d_older")}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  clearScope === "30d_older"
                    ? "border-rose-500 bg-rose-50/50 shadow-2xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === "30d_older"}
                  onChange={() => setClearScope("30d_older")}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Chỉ xóa dữ liệu cũ hơn 30 ngày</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Dọn dẹp các bản ghi lịch sử cũ nhằm tối ưu dung lượng cơ sở dữ liệu.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={isClearing}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleClearData}
                disabled={isClearing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs disabled:opacity-50"
              >
                {isClearing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Xác nhận xóa vĩnh viễn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
