"use client";
import { useMemo, useState } from "react";
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
    const x = (index: number) => 40 + index * 720 / Math.max(1, points.length - 1);
    return <section className="rounded-xl border bg-white p-4 space-y-3"><div className="flex flex-wrap items-center gap-3"><h2 className="font-bold">Xu hướng doanh thu sau hoàn tiền</h2><label className="text-sm">Nhóm theo <select value={mode} onChange={event => setMode(event.target.value as typeof mode)} className="rounded border p-2"><option value="day">Ngày</option><option value="week">Tuần (thứ Hai)</option><option value="month">Tháng</option></select></label></div><p className="text-xs text-slate-500">Chỉ dữ liệu trong kỳ đang chọn, theo ngày Việt Nam. Tuần/tháng ở hai đầu kỳ có thể chưa đủ ngày.</p><svg viewBox="0 0 800 215" role="img" aria-label="Biểu đồ doanh thu sau hoàn tiền; số liệu chi tiết ở bảng theo ngày bên dưới" className="w-full max-h-64"><line x1="40" x2="760" y1={y(0)} y2={y(0)} stroke="#94a3b8"/><polyline fill="none" stroke="#2563eb" strokeWidth="3" points={points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ")}/>{points.map((point, index) => <circle key={point.label} cx={x(index)} cy={y(point.value)} r="3" fill="#2563eb"><title>{point.label}: {point.value.toLocaleString("vi-VN")} đ</title></circle>)}<text x="40" y="205" fontSize="12">{points[0]?.label}</text><text x="760" y="205" fontSize="12" textAnchor="end">{points.at(-1)?.label}</text></svg></section>;
}
