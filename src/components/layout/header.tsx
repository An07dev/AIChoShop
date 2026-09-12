"use client";

import { Bell, Search, UserCircle, Sun, Moon, Palette, Crown } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export function Header({ user }: { user: any }) {
  const { themeMode, toggleThemeMode } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-10 sticky top-0 transition-colors duration-200">
      <div className="flex items-center text-slate-400 dark:text-slate-500 w-1/3">
        <Search size={20} className="text-slate-400 dark:text-slate-500 shrink-0" />
        <input 
          type="text" 
          placeholder="Tìm kiếm công cụ AI, khóa học..." 
          className="ml-2 bg-transparent border-none focus:outline-none text-sm w-full font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Theme Toggle Button */}
        <button
          onClick={toggleThemeMode}
          title={themeMode === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          {themeMode === "dark" ? (
            <Sun size={19} className="text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={19} className="hover:-rotate-12 transition-transform text-slate-600" />
          )}
        </button>

        {/* Quick link to Settings */}
        <Link
          href="/settings"
          title="Cài đặt hệ thống & Màu giao diện"
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <Palette size={19} />
        </Link>

        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

        {user ? (
          <Link
            href="/profile"
            title="Vào phần Hồ sơ & VIP (Quản lý tài khoản)"
            className="flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 py-1.5 px-3 rounded-xl transition-all cursor-pointer group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center font-bold uppercase text-sm shadow-xs group-hover:scale-105 transition-transform">
              {user.name?.charAt(0) || "U"}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand transition-colors">
                {user.name}
              </span>
              {user.isVIP ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-500 dark:text-amber-400">
                  <Crown size={10} className="fill-amber-500 dark:fill-amber-400" /> VIP Member
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">Hồ sơ & VIP</span>
              )}
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            title="Đăng nhập tài khoản"
            className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 py-1.5 px-2.5 rounded-xl transition-colors cursor-pointer text-slate-500 dark:text-slate-400"
          >
            <UserCircle size={28} />
            <span className="text-sm font-bold hidden sm:block">Đăng nhập</span>
          </Link>
        )}
      </div>
    </header>
  );
}
