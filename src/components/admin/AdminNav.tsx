"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coins,
  CreditCard,
  Crown,
  BadgePercent,
  Users,
  History,
  ClipboardList,
  ShieldAlert,
  GraduationCap,
  Settings,
} from "lucide-react";

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
    { href: "/admin/ai-costs", label: "Chi phí AI & Margin", icon: Coins },
    { href: "/admin/sepay", label: "SePay & Webhook", icon: CreditCard },
    { href: "/admin/vip-plans", label: "Cấu hình Gói VIP", icon: Crown },
    { href: "/admin/pricing-fees", label: "Biểu phí bán hàng", icon: BadgePercent, exact: true },
    { href: "/admin/users", label: "Quản lý Users", icon: Users },
    { href: "/admin/usage", label: "Lịch sử sử dụng", icon: History },
    { href: "/admin/audit", label: "Nhật ký quản trị", icon: ClipboardList },
    { href: "/admin/privacy", label: "Bảo trì dữ liệu", icon: ShieldAlert },
    { href: "/admin/lessons", label: "Nội dung Khóa học", icon: GraduationCap },
    { href: "/admin/settings", label: "Cài đặt hệ thống", icon: Settings },
  ];

  return (
    <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href) && link.href !== "#";

        return (
          <Link
            key={link.label}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm group ${
              isActive
                ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <Icon
              size={18}
              className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? "text-white" : "text-slate-400 group-hover:text-white"
              }`}
            />
            <span className="truncate">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
