"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ExternalLink, ShieldCheck } from "lucide-react";

const ROUTE_TITLES: Record<string, { title: string; category: string }> = {
  "/admin": { title: "Tổng quan Dashboard", category: "Thống kê" },
  "/admin/users": { title: "Quản lý Người dùng & Học viên", category: "Tài khoản" },
  "/admin/lessons": { title: "Nội dung Khóa học & Video", category: "Đào tạo" },
  "/admin/vip-plans": { title: "Cấu hình Gói VIP & Bảng giá", category: "Gói cước" },
  "/admin/pricing-fees": { title: "Biểu phí bán hàng sàn TMĐT", category: "Dữ liệu" },
  "/admin/sepay": { title: "Cổng SePay & Webhook nạp VIP", category: "Thanh toán" },
  "/admin/settings": { title: "Cài đặt hệ thống & OpenAI Key", category: "Hệ thống" },
};

export function AdminTopBar() {
  const pathname = usePathname();

  const current = ROUTE_TITLES[pathname] || {
    title: "Hệ thống Quản trị viên",
    category: "Admin",
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
      {/* Breadcrumb & Section Title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-semibold text-slate-400 hidden sm:inline-block">
          AIChoShop Admin
        </span>
        <ChevronRight size={14} className="text-slate-300 hidden sm:inline-block shrink-0" />
        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hidden md:inline-block shrink-0">
          {current.category}
        </span>
        <ChevronRight size={14} className="text-slate-300 hidden md:inline-block shrink-0" />
        <h2 className="font-bold text-slate-900 text-sm sm:text-base truncate">
          {current.title}
        </h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/dashboard"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/80"
          title="Mở giao diện người dùng AIChoShop"
        >
          <span>Xem Website</span>
          <ExternalLink size={12} />
        </Link>

        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs">
            AD
          </div>
          <div className="hidden lg:block text-left">
            <span className="block text-xs font-bold text-slate-800 leading-tight">Admin Master</span>
            <span className="block text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang hoạt động
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
