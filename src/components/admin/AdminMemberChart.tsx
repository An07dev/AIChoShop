"use client";

import { useState } from "react";
import { Users, Crown, Sparkles } from "lucide-react";

export function AdminMemberChart({ userCount, vipCount, registrations }: {
  userCount: number;
  vipCount: number;
  registrations: { month: string; vip: number; free: number }[];
}) {
  const [view, setView] = useState<"donut" | "growth">("donut");
  const free = Math.max(0, userCount - vipCount);
  const percent = userCount ? vipCount / userCount * 100 : 0;
  const circumference = 2 * Math.PI * 54;
  const max = Math.max(1, ...registrations.map(row => row.vip + row.free));
  return <section className="h-full flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
    <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600"><Users size={18}/></div><div><h2 className="text-sm font-black text-slate-900">Phân Bổ Học Viên</h2><p className="text-[11px] text-slate-400">Quyền Free/VIP còn hạn hiện tại</p></div></div>
      <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5">{([{value:"donut",label:"VIP / Free"},{value:"growth",label:"Đăng ký mới"}] as const).map(item=><button key={item.value} type="button" aria-pressed={view===item.value} onClick={()=>setView(item.value)} className={`rounded-lg px-2.5 py-1 text-xs font-bold ${view===item.value?"bg-white text-blue-700 shadow-xs":"text-slate-500"}`}>{item.label}</button>)}</div>
    </div>
    <div className="p-4 sm:p-5 flex-1">
      {view==="donut"?<div className="flex flex-wrap items-center justify-center gap-6"><svg viewBox="0 0 140 140" className="w-40 h-40" role="img" aria-label={`${vipCount} VIP còn hạn, ${free} Free, tổng ${userCount} tài khoản`}><circle cx="70" cy="70" r="54" fill="none" stroke={userCount ? "#3b82f6" : "#e2e8f0"} strokeWidth="16"/><circle cx="70" cy="70" r="54" fill="none" stroke="#f59e0b" strokeWidth="16" strokeDasharray={`${circumference*percent/100} ${circumference}`} transform="rotate(-90 70 70)"/><text x="70" y="68" textAnchor="middle" className="fill-slate-900 text-xl font-black">{userCount}</text><text x="70" y="88" textAnchor="middle" className="fill-slate-400 text-[10px]">Tài khoản</text></svg><div className="space-y-4 text-sm"><p className="flex items-center gap-2 text-amber-600"><Crown size={16}/> VIP: <strong>{vipCount}</strong> ({percent.toFixed(1)}%)</p><p className="flex items-center gap-2 text-blue-600"><Sparkles size={16}/> Free: <strong>{free}</strong></p>{userCount===0&&<p className="text-xs text-slate-500">Chưa có tài khoản.</p>}</div></div>:<div className="space-y-3"><p className="text-xs text-slate-500">Tài khoản đăng ký trong kỳ đang chọn, nhóm theo tháng Việt Nam. Màu thể hiện quyền hiện tại, không phải số VIP đã cấp trong tháng.</p>{registrations.length?registrations.map(row=><div key={row.month}><div className="flex justify-between text-xs mb-1"><span>{row.month}</span><strong>{row.vip+row.free} tài khoản</strong></div><div className="flex h-3 rounded-full overflow-hidden bg-slate-100" style={{width:`${(row.vip+row.free)/max*100}%`}}><div className="bg-amber-500" style={{width:`${row.vip/(row.vip+row.free)*100}%`}}/><div className="bg-blue-500 flex-1"/></div><p className="mt-1 text-[10px] text-slate-500">VIP hiện tại: {row.vip} · Free: {row.free}</p></div>):<p className="py-8 text-center text-sm text-slate-500">Chưa có tài khoản đăng ký trong kỳ.</p>}</div>}
    </div>
    <p className="px-4 py-3 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500">Bao gồm tài khoản quản trị. VIP hết hạn được tính vào Free.</p>
  </section>;
}
