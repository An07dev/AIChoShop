"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Crown,
  Sparkles,
  BarChart2,
  LineChart,
  PieChart as PieIcon,
  ArrowUpRight,
  ShieldCheck,
  Percent,
} from "lucide-react";

interface AdminTransactionItem {
  id: string;
  amount: number;
  createdAt: string | Date;
}

interface AdminUserTimelineItem {
  id: string;
  isVIP: boolean;
  createdAt: string | Date;
}

interface AdminChartsProps {
  transactions: AdminTransactionItem[];
  usersTimeline: AdminUserTimelineItem[];
  userCount: number;
  vipCount: number;
  totalRevenue: number;
  successTxCount: number;
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(val);

const formatShortMoney = (val: number) => {
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} tỷ`;
  }
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1).replace(/\.0$/, "")} tr`;
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toFixed(0)} k`;
  }
  return `${val} đ`;
};

export function AdminCharts({
  transactions,
  usersTimeline,
  userCount,
  vipCount,
  totalRevenue,
  successTxCount,
}: AdminChartsProps) {
  // Tabs cho Biểu đồ doanh thu: "day" | "week" | "month"
  const [revenuePeriod, setRevenuePeriod] = useState<"day" | "week" | "month">("day");
  // Chế độ hiển thị: "bar" | "line"
  const [chartMode, setChartMode] = useState<"bar" | "line">("bar");
  // Hover tooltip state cho biểu đồ doanh thu
  const [hoveredPoint, setHoveredPoint] = useState<{
    label: string;
    subLabel: string;
    revenue: number;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Tabs cho Biểu đồ học viên: "donut" | "growth"
  const [memberView, setMemberView] = useState<"donut" | "growth">("donut");
  // Hover tooltip state cho biểu đồ học viên tăng trưởng
  const [hoveredMemberMonth, setHoveredMemberMonth] = useState<{
    label: string;
    vipCount: number;
    freeCount: number;
    total: number;
  } | null>(null);

  // 1. TÍNH TOÁN DỮ LIỆU DOANH THU THEO NGÀY / TUẦN / THÁNG
  const revenueChartData = useMemo(() => {
    const now = new Date();

    if (revenuePeriod === "day") {
      // 14 ngày gần nhất
      const days: { key: string; label: string; subLabel: string; date: Date }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        days.push({
          key: `${yyyy}-${mm}-${dd}`,
          label: `${dd}/${mm}`,
          subLabel: `Ngày ${dd}/${mm}/${yyyy}`,
          date: d,
        });
      }

      const map = new Map<string, { revenue: number; count: number }>();
      days.forEach((d) => map.set(d.key, { revenue: 0, count: 0 }));

      transactions.forEach((tx) => {
        const txDate = new Date(tx.createdAt);
        const yyyy = txDate.getFullYear();
        const mm = String(txDate.getMonth() + 1).padStart(2, "0");
        const dd = String(txDate.getDate()).padStart(2, "0");
        const key = `${yyyy}-${mm}-${dd}`;
        if (map.has(key)) {
          const curr = map.get(key)!;
          curr.revenue += tx.amount || 0;
          curr.count += 1;
        }
      });

      const list = days.map((d) => {
        const val = map.get(d.key) || { revenue: 0, count: 0 };
        return {
          label: d.label,
          subLabel: d.subLabel,
          revenue: val.revenue,
          count: val.count,
        };
      });

      return list;
    }

    if (revenuePeriod === "week") {
      // 8 tuần gần nhất
      const weeks: {
        label: string;
        subLabel: string;
        start: Date;
        end: Date;
      }[] = [];

      for (let i = 7; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(end.getDate() - i * 7);
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        const sDD = String(start.getDate()).padStart(2, "0");
        const sMM = String(start.getMonth() + 1).padStart(2, "0");
        const eDD = String(end.getDate()).padStart(2, "0");
        const eMM = String(end.getMonth() + 1).padStart(2, "0");

        weeks.push({
          label: i === 0 ? "Tuần này" : `${sDD}/${sMM}`,
          subLabel: `Tuần ${sDD}/${sMM} - ${eDD}/${eMM}`,
          start,
          end,
        });
      }

      return weeks.map((w) => {
        let rev = 0;
        let cnt = 0;
        transactions.forEach((tx) => {
          const t = new Date(tx.createdAt).getTime();
          if (t >= w.start.getTime() && t <= w.end.getTime()) {
            rev += tx.amount || 0;
            cnt += 1;
          }
        });
        return {
          label: w.label,
          subLabel: w.subLabel,
          revenue: rev,
          count: cnt,
        };
      });
    }

    // 6 tháng gần nhất (Monthly)
    const months: {
      key: string;
      label: string;
      subLabel: string;
      year: number;
      month: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = d.getMonth() + 1;
      months.push({
        key: `${yyyy}-${String(mm).padStart(2, "0")}`,
        label: `Thg ${mm}`,
        subLabel: `Tháng ${mm}/${yyyy}`,
        year: yyyy,
        month: mm,
      });
    }

    return months.map((m) => {
      let rev = 0;
      let cnt = 0;
      transactions.forEach((tx) => {
        const txDate = new Date(tx.createdAt);
        if (txDate.getFullYear() === m.year && txDate.getMonth() + 1 === m.month) {
          rev += tx.amount || 0;
          cnt += 1;
        }
      });
      return {
        label: m.label,
        subLabel: m.subLabel,
        revenue: rev,
        count: cnt,
      };
    });
  }, [revenuePeriod, transactions]);

  // Thống kê tóm tắt cho kỳ đang chọn
  const revenueSummary = useMemo(() => {
    const total = revenueChartData.reduce((acc, curr) => acc + curr.revenue, 0);
    const txCount = revenueChartData.reduce((acc, curr) => acc + curr.count, 0);
    const max = Math.max(...revenueChartData.map((d) => d.revenue), 0);
    const avg = revenueChartData.length > 0 ? Math.round(total / revenueChartData.length) : 0;
    return { total, txCount, max, avg };
  }, [revenueChartData]);

  // Kích thước khung vẽ biểu đồ doanh thu SVG
  const svgWidth = 720;
  const svgHeight = 230;
  const paddingLeft = 56;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 34;
  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Tính toán trục Y làm tròn số chẵn đẹp mắt (tránh các số lẻ như 17k, 33k)
  const yAxis = useMemo(() => {
    const target = Math.max(revenueSummary.max, 40_000);
    const roughStep = target / 3;
    const power = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const frac = roughStep / power;
    let niceStep = power;
    if (frac <= 1.2) niceStep = 1 * power;
    else if (frac <= 2.5) niceStep = 2 * power;
    else if (frac <= 6) niceStep = 5 * power;
    else niceStep = 10 * power;

    const maxTick = Math.max(
      Math.ceil((target * 1.05) / niceStep) * niceStep,
      niceStep * 3
    );
    const ticks: number[] = [];
    for (let val = maxTick; val >= 0; val -= niceStep) {
      ticks.push(val);
    }
    return { maxTick, ticks, niceStep };
  }, [revenueSummary.max]);

  const points = useMemo(() => {
    if (revenueChartData.length === 0) return [];
    const count = revenueChartData.length;
    const colW = chartW / count;

    return revenueChartData.map((item, idx) => {
      // Tọa độ X căn chính giữa ô phân bổ dữ liệu của cột
      const x = paddingLeft + (idx + 0.5) * colW;
      const ratio = yAxis.maxTick > 0 ? Math.min(item.revenue / yAxis.maxTick, 1) : 0;
      const rawBarH = ratio * chartH;
      // Chỉ gán chiều cao cột khi doanh thu > 0, tránh vẽ vạch tím đè lên số 0 đ
      const barH = item.revenue > 0 ? Math.max(rawBarH, 4) : 0;
      const barY = paddingTop + chartH - barH;
      const y = paddingTop + chartH - ratio * chartH;

      return {
        ...item,
        x,
        y,
        barY,
        barH,
        colW,
      };
    });
  }, [revenueChartData, yAxis.maxTick, chartW, chartH, paddingLeft, paddingTop]);

  // Đường Path Area & Line cho SVG
  const pathData = useMemo(() => {
    if (points.length === 0) return { line: "", area: "" };
    const line = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, "");
    const area = `${line} L ${points[points.length - 1].x},${paddingTop + chartH} L ${points[0].x},${paddingTop + chartH} Z`;
    return { line, area };
  }, [points, paddingTop, chartH]);

  // 2. TÍNH TOÁN DỮ LIỆU HỌC VIÊN (VIP vs FREE)
  const freeCount = Math.max(0, userCount - vipCount);
  const vipPercent = userCount > 0 ? Math.round((vipCount / userCount) * 100) : 0;
  const freePercent = 100 - vipPercent;
  const arpu = vipCount > 0 ? Math.round(totalRevenue / vipCount) : 0;

  // Donut SVG circumference calculation (r = 54, C = 2 * pi * r ≈ 339.29)
  const donutRadius = 54;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const vipStrokeLength = (vipPercent / 100) * donutCircumference;
  const freeStrokeLength = (freePercent / 100) * donutCircumference;

  // Tăng trưởng học viên theo 6 tháng gần nhất
  const memberGrowthData = useMemo(() => {
    const now = new Date();
    const months: {
      label: string;
      year: number;
      month: number;
      vip: number;
      free: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = d.getMonth() + 1;
      months.push({
        label: `T${mm}`,
        year: yyyy,
        month: mm,
        vip: 0,
        free: 0,
      });
    }

    usersTimeline.forEach((u) => {
      const d = new Date(u.createdAt);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const target = months.find((it) => it.year === y && it.month === m);
      if (target) {
        if (u.isVIP) target.vip += 1;
        else target.free += 1;
      }
    });

    return months;
  }, [usersTimeline]);

  const maxGrowthCount = Math.max(
    ...memberGrowthData.map((m) => m.vip + m.free),
    5
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-5 items-stretch">
      {/* ── CARD 1: BIỂU ĐỒ DOANH THU THEO NGÀY, TUẦN, THÁNG (8 CỘT) ────────── */}
      <div className="xl:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header card doanh thu */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 min-h-[64px] bg-slate-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs shrink-0">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Biểu Đồ Doanh Thu VIP
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black border border-purple-200">
                  {revenuePeriod === "day"
                    ? "14 ngày qua"
                    : revenuePeriod === "week"
                    ? "8 tuần qua"
                    : "6 tháng qua"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Theo dõi biến động nguồn thu nâng cấp VIP tự động
              </p>
            </div>
          </div>

          {/* Bộ lọc thời gian & chế độ xem */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Ngày / Tuần / Tháng */}
            <div className="p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setRevenuePeriod("day");
                  setHoveredPoint(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  revenuePeriod === "day"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Ngày
              </button>
              <button
                type="button"
                onClick={() => {
                  setRevenuePeriod("week");
                  setHoveredPoint(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  revenuePeriod === "week"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Tuần
              </button>
              <button
                type="button"
                onClick={() => {
                  setRevenuePeriod("month");
                  setHoveredPoint(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  revenuePeriod === "month"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Tháng
              </button>
            </div>

            {/* Toggle Bar / Line */}
            <div className="p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 hidden sm:flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setChartMode("bar")}
                title="Dạng cột"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === "bar"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <BarChart2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setChartMode("line")}
                title="Dạng đường"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === "line"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <LineChart size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Thanh tóm tắt chỉ số tài chính của kỳ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3.5 sm:px-5 sm:py-3 bg-purple-50/20 border-b border-slate-100 text-xs">
          <div className="border-r border-slate-100/80 pr-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Thu kỳ này
            </span>
            <span className="text-sm sm:text-base font-black text-purple-700 font-mono">
              {formatMoney(revenueSummary.total)}
            </span>
          </div>
          <div className="border-r border-slate-100/80 pr-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Giao dịch thành công
            </span>
            <span className="text-sm sm:text-base font-black text-slate-800 font-mono">
              {revenueSummary.txCount}{" "}
              <span className="text-[11px] font-normal text-slate-400">đơn</span>
            </span>
          </div>
          <div className="border-r border-slate-100/80 pr-2 hidden sm:block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Trung bình / kỳ
            </span>
            <span className="text-sm font-bold text-slate-700 font-mono">
              {formatShortMoney(revenueSummary.avg)}
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Đỉnh doanh thu
            </span>
            <span className="text-sm font-bold text-emerald-600 font-mono">
              {formatShortMoney(revenueSummary.max)}
            </span>
          </div>
        </div>

        {/* Khung vẽ biểu đồ SVG tương tác */}
        <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between select-none">
          {/* Container chứa SVG và Tooltip tuyệt đối khớp tỷ lệ 1:1 */}
          <div className="relative w-full">
            {/* Tooltip nổi khi hover */}
            {hoveredPoint && (
              <div
                className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 bg-slate-900 text-white text-xs rounded-xl py-2 px-3 shadow-xl border border-slate-700 space-y-1 transition-all duration-100"
                style={{
                  left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                  top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                }}
              >
                <div className="text-[10px] font-bold text-slate-300 border-b border-slate-800 pb-1">
                  {hoveredPoint.subLabel}
                </div>
                <div className="text-emerald-400 font-black text-sm font-mono">
                  +{formatMoney(hoveredPoint.revenue)}
                </div>
                <div className="text-[10px] text-slate-400">
                  {hoveredPoint.count > 0
                    ? `${hoveredPoint.count} giao dịch thành công`
                    : "Chưa có giao dịch"}
                </div>
              </div>
            )}

            {/* Biểu đồ SVG co giãn tự nhiên theo chiều ngang */}
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto block overflow-visible"
            >
              <defs>
                {/* Gradient cho Cột */}
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
                </linearGradient>
                {/* Gradient khi Hover cột */}
                <linearGradient id="barHoverGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.9" />
                </linearGradient>
                {/* Gradient Miền Area */}
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Đường lưới ngang Y-axis với các mốc số chẵn, không đè lên nhãn */}
              {yAxis.ticks.map((tickVal, i) => {
                const ratio = yAxis.maxTick > 0 ? tickVal / yAxis.maxTick : 0;
                const y = paddingTop + chartH - ratio * chartH;
                const isBaseline = tickVal === 0;
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke={isBaseline ? "#cbd5e1" : "#f1f5f9"}
                      strokeWidth={isBaseline ? "1.5" : "1"}
                      strokeDasharray={isBaseline ? "none" : "3 3"}
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className={`text-[9.5px] font-mono select-none ${
                        isBaseline ? "fill-slate-500 font-bold" : "fill-slate-400 font-medium"
                      }`}
                    >
                      {formatShortMoney(tickVal)}
                    </text>
                  </g>
                );
              })}

              {/* Chế độ VẼ ĐƯỜNG (Area / Line Chart) */}
              {chartMode === "line" && (
                <>
                  {pathData.area && (
                    <path d={pathData.area} fill="url(#areaGradient)" />
                  )}
                  {pathData.line && (
                    <path
                      d={pathData.line}
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </>
              )}

              {/* Vẽ từng điểm dữ liệu / cột */}
              {points.map((pt, idx) => {
                const isHovered = hoveredPoint?.label === pt.label;
                const barWidth = Math.max(
                  Math.min(pt.colW * 0.55, 24),
                  8
                );

                return (
                  <g
                    key={idx}
                    className="cursor-pointer transition-transform"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Cột highlight mờ phía sau khi hover */}
                    {isHovered && (
                      <rect
                        x={pt.x - pt.colW / 2 + 1}
                        y={paddingTop}
                        width={pt.colW - 2}
                        height={chartH}
                        rx={6}
                        fill="#8b5cf6"
                        opacity={0.06}
                      />
                    )}

                    {/* Cột dữ liệu (nếu ở chế độ Bar) */}
                    {chartMode === "bar" && (
                      <>
                        {pt.revenue > 0 ? (
                          <>
                            <rect
                              x={pt.x - barWidth / 2}
                              y={pt.barY}
                              width={barWidth}
                              height={pt.barH}
                              rx={barWidth > 12 ? 4 : 2}
                              fill={isHovered ? "url(#barHoverGradient)" : "url(#barGradient)"}
                              className="transition-all duration-200"
                            />
                            {/* Đường viền sáng đỉnh cột */}
                            <rect
                              x={pt.x - barWidth / 2}
                              y={pt.barY}
                              width={barWidth}
                              height={3}
                              rx={1}
                              fill="#c084fc"
                            />
                          </>
                        ) : (
                          /* Khi doanh thu = 0: chỉ hiện vạch mờ xám nhẹ khi hover */
                          isHovered && (
                            <rect
                              x={pt.x - barWidth / 2}
                              y={paddingTop + chartH - 3}
                              width={barWidth}
                              height={3}
                              rx={1.5}
                              fill="#cbd5e1"
                              className="transition-all duration-150"
                            />
                          )
                        )}
                      </>
                    )}

                    {/* Chế độ Line Chart: Điểm tròn trên đỉnh */}
                    {chartMode === "line" && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 5.5 : pt.revenue > 0 ? 3.5 : 2}
                        fill={isHovered ? "#a855f7" : pt.revenue > 0 ? "#7c3aed" : "#cbd5e1"}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />
                    )}

                    {/* Vùng cảm ứng hover vô hình rộng toàn bộ ô cột */}
                    <rect
                      x={pt.x - pt.colW / 2}
                      y={paddingTop}
                      width={pt.colW}
                      height={chartH + paddingBottom}
                      fill="transparent"
                    />

                    {/* Nhãn X-axis dưới chân cột */}
                    <text
                      x={pt.x}
                      y={paddingTop + chartH + 18}
                      textAnchor="middle"
                      className={`text-[9.5px] select-none transition-colors ${
                        isHovered ? "fill-purple-700 font-bold" : "fill-slate-400 font-medium"
                      }`}
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2.5 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Doanh thu thành công qua SePay
            </span>
            <span>Rê chuột vào điểm/cột để xem số liệu chi tiết</span>
          </div>
        </div>
      </div>

      {/* ── CARD 2: BIỂU ĐỒ HỌC VIÊN VIP VÀ FREE (5 CỘT) ───────────────────── */}
      <div className="xl:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header card học viên */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between min-h-[64px] bg-slate-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
              <Crown size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Cơ Cấu Học Viên VIP & Free
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tỷ lệ nâng cấp và chất lượng hội viên
              </p>
            </div>
          </div>

          {/* Toggle Donut vs Growth */}
          <div className="p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setMemberView("donut")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                memberView === "donut"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Tỷ Lệ
            </button>
            <button
              type="button"
              onClick={() => setMemberView("growth")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                memberView === "growth"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Xu Hướng
            </button>
          </div>
        </div>

        {/* Nội dung card học viên */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          {memberView === "donut" ? (
            <>
              {/* Vòng tròn Donut Chart SVG */}
              <div className="flex items-center justify-center py-2">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                    {/* Vòng nền mờ */}
                    <circle
                      cx="70"
                      cy="70"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="16"
                    />
                    {/* Phần Học viên Miễn Phí (Blue) */}
                    <circle
                      cx="70"
                      cy="70"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="16"
                      strokeDasharray={`${freeStrokeLength} ${donutCircumference}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                    {/* Phần Thành viên VIP (Amber) */}
                    <circle
                      cx="70"
                      cy="70"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="16"
                      strokeDasharray={`${vipStrokeLength} ${donutCircumference}`}
                      strokeDashoffset={-freeStrokeLength}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>

                  {/* Tâm vòng tròn: Tổng số học viên */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                      {userCount}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tổng Học Viên
                    </span>
                  </div>
                </div>
              </div>

              {/* Danh mục chi tiết 2 nhóm VIP vs Free */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Thẻ VIP */}
                <div className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      👑 VIP Member
                    </span>
                    <span className="text-xs font-black text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-md">
                      {vipPercent}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-black text-amber-900 font-mono">
                      {vipCount}{" "}
                      <span className="text-xs font-medium text-amber-700">học viên</span>
                    </div>
                    <span className="text-[10px] text-amber-700/80 mt-0.5 block truncate">
                      Full 11 Tool AI + VIP Course
                    </span>
                  </div>
                </div>

                {/* Thẻ Free */}
                <div className="p-3 rounded-xl border border-blue-200/80 bg-blue-50/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      👤 Free Member
                    </span>
                    <span className="text-xs font-black text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded-md">
                      {freePercent}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-black text-blue-900 font-mono">
                      {freeCount}{" "}
                      <span className="text-xs font-medium text-blue-700">học viên</span>
                    </div>
                    <span className="text-[10px] text-blue-700/80 mt-0.5 block truncate">
                      12 lượt dùng AI mỗi ngày
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Chế độ xem: Xu hướng tăng trưởng học viên 6 tháng */
            <div className="space-y-3 flex-1 flex flex-col justify-between py-2">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="font-bold text-slate-700">Học viên mới theo tháng:</span>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> VIP
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Miễn phí
                  </span>
                </div>
              </div>

              {/* Biểu đồ cột chồng (Stacked Bars) */}
              <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                {memberGrowthData.map((item, idx) => {
                  const total = item.vip + item.free;
                  const vipWidth = total > 0 ? (item.vip / maxGrowthCount) * 100 : 0;
                  const freeWidth = total > 0 ? (item.free / maxGrowthCount) * 100 : 0;

                  return (
                    <div
                      key={idx}
                      className="space-y-1 text-xs cursor-pointer group"
                      onMouseEnter={() =>
                        setHoveredMemberMonth({
                          label: item.label,
                          vipCount: item.vip,
                          freeCount: item.free,
                          total,
                        })
                      }
                      onMouseLeave={() => setHoveredMemberMonth(null)}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600">{item.label}</span>
                        <span className="font-mono text-slate-400">
                          {total > 0 ? (
                            <strong className="text-slate-700 font-bold">
                              +{total} học viên ({item.vip} VIP)
                            </strong>
                          ) : (
                            "0 mới"
                          )}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="bg-amber-500 h-full transition-all duration-500"
                          style={{ width: `${vipWidth}%` }}
                          title={`${item.vip} VIP`}
                        />
                        <div
                          className="bg-blue-500 h-full transition-all duration-500"
                          style={{ width: `${freeWidth}%` }}
                          title={`${item.free} Free`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-2">
                Dữ liệu tự động đồng bộ từ ngày đăng ký của học viên
              </div>
            </div>
          )}

          {/* Thanh chỉ số chuyển đổi & ARPU đáy card */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                Tỷ lệ chuyển đổi VIP
              </span>
              <span className="font-bold text-amber-600 font-mono text-sm">
                {vipPercent}% học viên
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                ARPU (Thu TB / VIP)
              </span>
              <span className="font-bold text-emerald-600 font-mono text-sm">
                {formatMoney(arpu)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
