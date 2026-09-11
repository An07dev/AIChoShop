"use client";

import { Bell, Search, UserCircle } from 'lucide-react';
import Link from 'next/link';

export function Header({ user }: { user: any }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex items-center text-slate-400 w-1/3">
        <Search size={20} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Tìm kiếm công cụ AI, khóa học..." 
          className="ml-2 bg-transparent border-none focus:outline-none text-sm w-full font-medium"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="h-8 w-px bg-slate-200 mx-1"></div>
        {user ? (
          <Link href="/profile" className="flex items-center gap-2 hover:bg-slate-50 py-1 px-2 rounded-lg transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold uppercase text-sm">
              {user.name?.charAt(0)}
            </div>
            <span className="text-sm font-bold text-slate-700 hidden sm:block">{user.name}</span>
          </Link>
        ) : (
          <Link href="/login" className="flex items-center gap-2 hover:bg-slate-50 py-1 px-2 rounded-lg transition-colors cursor-pointer text-slate-500">
            <UserCircle size={28} />
            <span className="text-sm font-bold hidden sm:block">Đăng nhập</span>
          </Link>
        )}
      </div>
    </header>
  );
}
