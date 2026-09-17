import Link from "next/link";
import { LogOut, ShieldAlert } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { logoutUser } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: {
    template: "%s | AIChoShop Admin",
    default: "Hệ thống Quản trị viên | AIChoShop Admin",
  },
  description: "Bảng điều khiển và quản trị hệ thống đào tạo, công cụ AI bán hàng AIChoShop.",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") redirect("/admin-login");
  return (
    // Keep absolute accessibility text within the shell's clipping boundary.
    <div className="relative h-dvh min-h-0 shrink-0 overflow-hidden bg-slate-50 flex admin-root">
      {/* Admin Sidebar */}
      <aside className="w-64 min-h-0 bg-slate-900 text-slate-300 flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-slate-800 shrink-0">
          <Link href="/admin" className="flex items-center gap-2 text-white font-black text-xl">
            <ShieldAlert className="text-rose-500" />
            Admin Panel
          </Link>
          <p className="text-xs text-slate-500 mt-1">AIChoShop Management</p>
        </div>

        <AdminNav />

        <div className="p-4 border-t border-slate-800 shrink-0">
          <form action={logoutUser}><button type="submit" className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <LogOut size={20} /> Thoát Admin
          </button></form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <AdminTopBar />

        {/* Scrollable Content */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 flex flex-col min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
}
