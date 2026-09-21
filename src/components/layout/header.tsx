"use client";

import { Bell, Search, UserCircle, Sun, Moon, Palette, Crown, Menu } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';

export function Header({ user }: { user: any }) {
  const { themeMode, toggleThemeMode } = useTheme();
  const { toggleMobile } = useSidebar();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3.5 sm:px-6 z-10 sticky top-0 transition-colors duration-200">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={toggleMobile}
          aria-label="Mở menu điều hướng"
          className="lg:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <Menu size={22} />
        </button>

        {/* Mobile Brand Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 lg:hidden font-extrabold text-brand tracking-tight text-base select-none"
        >
          <div className="w-7 h-7 bg-brand text-white rounded-lg flex items-center justify-center font-black text-xs shadow-xs">
            AI
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">
            AIChoShop
          </span>
        </Link>

        {/* Search input (Hidden on small mobile screens to prevent clutter) */}
        <div className="hidden sm:flex items-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 focus-within:border-brand dark:focus-within:border-brand focus-within:bg-white dark:focus-within:bg-slate-800 transition-all max-w-xs md:max-w-sm w-full">
          <Search size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Tìm kiếm công cụ, khóa học..." 
            className="ml-2 bg-transparent border-none focus:outline-none text-xs md:text-sm w-full font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
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
