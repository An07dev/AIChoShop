import Link from "next/link";
import { LayoutDashboard, Users, BookOpen, Database, LogOut, ShieldAlert } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-2 text-white font-black text-xl">
            <ShieldAlert className="text-rose-500" />
            Admin Panel
          </Link>
          <p className="text-xs text-slate-500 mt-1">AIChoShop Management</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white bg-blue-600/20 text-blue-400 font-medium hover:bg-blue-600/30 transition-colors">
            <LayoutDashboard size={20} /> Tổng quan
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-slate-800 hover:text-white transition-colors">
            <Users size={20} /> Quản lý Users
          </Link>
          <Link href="/admin/lessons" className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-slate-800 hover:text-white transition-colors">
            <BookOpen size={20} /> Nội dung Khóa học
          </Link>
          <Link href="/admin/pricing-fees" className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-slate-800 hover:text-white transition-colors">
            <Database size={20} /> Biểu phí bán hàng
          </Link>
        </nav>
        <AdminNav />

        <div className="p-4 border-t border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <LogOut size={20} /> Thoát Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <h2 className="font-bold text-slate-800">Hệ thống Quản trị viên</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
