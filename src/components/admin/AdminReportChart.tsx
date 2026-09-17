"use client";
import { useMemo, useState } from "react";
import { TrendingUp, BarChart2, LineChart } from "lucide-react";
type Day = {
    day: string;
    gross: number;
    refunds: number;
    count: number;
};
export function AdminReportChart({ days }: {
    days: Day[];
}) {
    const [mode, setMode] = useState<"day" | "week" | "month">("day");
    const [chart, setChart] = useState<"bar" | "line">("bar");
    const points = useMemo(() => { const map = new Map<string, number>(); for (const row of days) {
        let key = row.day;
        if (mode === "month")
            key = key.slice(0, 7);
        if (mode === "week") {
            const date = new Date(`${key}T00:00:00Z`);
            date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
            key = date.toISOString().slice(0, 10);
        }
        map.set(key, (map.get(key) ?? 0) + row.gross - row.refunds);
    } return [...map].map(([label, value]) => ({ label, value })); }, [days, mode]);
    const max = Math.max(1, ...points.map(point => point.value)), min = Math.min(0, ...points.map(point => point.value));
    const y = (value: number) => 180 - (value - min) / (max - min) * 160;
    const x = (index: number) => 95 + (index + 0.5) * 665 / Math.max(1, points.length);
    const width = Math.max(0.8, Math.min(28, 665 / Math.max(1, points.length) * 0.65));
    const money = (value: number) => Math.round(value).toLocaleString("vi-VN") + " đ";
    const toggle = "rounded-lg px-2.5 py-1 text-xs font-bold transition-colors";
    return <section className="h-full flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600"><TrendingUp size={18}/></div><div><h2 className="text-sm font-black text-slate-900">Biểu Đồ Doanh Thu VIP</h2><p className="text-[11px] text-slate-400">Doanh thu sau hoàn tiền trong kỳ đã chọn</p></div></div>
        <div className="flex flex-wrap gap-2"><div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5">{([{value:"day",label:"Ngày"},{value:"week",label:"Tuần"},{value:"month",label:"Tháng"}] as const).map(item=><button key={item.value} type="button" aria-pressed={mode===item.value} onClick={()=>setMode(item.value)} className={`${toggle} ${mode===item.value?"bg-white text-purple-700 shadow-xs":"text-slate-500"}`}>{item.label}</button>)}</div><div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5">{([{value:"bar",label:"Biểu đồ cột",icon:BarChart2},{value:"line",label:"Biểu đồ đường",icon:LineChart}] as const).map(item=><button key={item.value} type="button" title={item.label} aria-label={item.label} aria-pressed={chart===item.value} onClick={()=>setChart(item.value)} className={`${toggle} ${chart===item.value?"bg-white text-purple-700 shadow-xs":"text-slate-500"}`}><item.icon size={14}/></button>)}</div></div>
      </div>
      <div className="p-4 sm:p-5 flex-1"><p className="text-xs text-slate-500 mb-3">Theo ngày Việt Nam. Tuần bắt đầu thứ Hai; tuần/tháng ở hai đầu kỳ có thể chưa đủ ngày.</p><svg viewBox="0 0 800 215" role="img" aria-label="Biểu đồ doanh thu sau hoàn tiền; số liệu chi tiết ở bảng theo ngày bên dưới" className="w-full min-h-40">
        {[min,(min+max)/2,max].map((tick,index)=><g key={index}><line x1="95" x2="760" y1={y(tick)} y2={y(tick)} stroke="#e2e8f0" strokeDasharray="4 4"/><text x="88" y={y(tick)+4} textAnchor="end" fontSize="10" fill="#94a3b8">{money(tick)}</text></g>)}
        <line x1="95" x2="760" y1={y(0)} y2={y(0)} stroke="#94a3b8"/>
        {chart==="line"&&<polyline fill="none" stroke="#9333ea" strokeWidth="3" points={points.map((point,index)=>`${x(index)},${y(point.value)}`).join(" ")}/>}
        {points.map((point,index)=>chart==="bar"?<rect key={point.label} x={x(index)-width/2} y={Math.min(y(0),y(point.value))} width={width} height={Math.abs(y(0)-y(point.value))} rx="2" fill={point.value<0?"#f43f5e":"#a855f7"}><title>{point.label + ": " + money(point.value)}</title></rect>:<circle key={point.label} cx={x(index)} cy={y(point.value)} r="3" fill="#9333ea"><title>{point.label + ": " + money(point.value)}</title></circle>)}
        <text x="95" y="205" fontSize="11" fill="#64748b">{points[0]?.label}</text><text x="760" y="205" fontSize="11" textAnchor="end" fill="#64748b">{points.at(-1)?.label}</text>
      </svg></div>
      <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex flex-wrap justify-between gap-2 text-xs"><span className="text-slate-500">Sau hoàn tiền: <strong className="text-purple-700 font-mono">{money(days.reduce((sum,row)=>sum+row.gross-row.refunds,0))}</strong></span><span className="text-slate-500">{days.reduce((sum,row)=>sum+row.count,0)} lượt thanh toán</span></div>
    </section>;
}
