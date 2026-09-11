"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Wrench, UserCircle, Settings, Crown, ChevronDown, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { logoutUser } from '@/app/actions/auth';

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const journeySteps = [
    { 
      id: 1, 
      name: 'Tổng quan', 
      desc: 'Báo cáo hiệu suất',
      href: '/dashboard', 
      icon: Home 
    },
    { 
      id: 2, 
      name: 'Khóa học Masterclass', 
      desc: '27 Bài học thực chiến',
      href: '/learn', 
      icon: BookOpen,
      subItems: [
        { name: 'P.1: Tư duy & Cài đặt', href: '/learn#part-1' },
        { name: 'P.2: Tối ưu Listing & Doanh số', href: '/learn#part-2' },
        { name: 'P.3: Tiktok Shop & Live', href: '/learn#part-3' },
        { name: 'P.4: Xử lý khủng hoảng', href: '/learn#part-4' },
      ]
    },
    { 
      id: 3, 
      name: 'Kho Công Cụ AI', 
      desc: '8 Tools bứt phá doanh số',
      href: '/tools', 
      icon: Wrench,
      subItems: [
        { name: '1. Tính Giá Bán', href: '/tools/pricing-calculator' },
        { name: '2. Tính Thuế TMĐT', href: '/tools/tax-calculator' },
        { name: '3. AI Tối Ưu SEO', href: '/tools/seo-optimizer' },
        { name: '4. Nhân Bản Chống Spam', href: '/tools/title-spinner' },
        { name: '5. AI Kịch Bản Video', href: '/tools/script-writer' },
        { name: '6. AI Lập Kế Hoạch KOC', href: '/tools/koc-planner' },
        { name: '7. AI Xử Lý Khủng Hoảng', href: '/tools/review-replier' },
        { name: '8. AI Kháng Nghị', href: '/tools/appeal-generator' }
      ]
    },
    { 
      id: 4, 
      name: 'Hồ sơ & VIP', 
      desc: 'Quản lý tài khoản',
      href: '/profile', 
      icon: UserCircle 
    },
  ];

  // Auto-expand the menu that matches the current route
  useEffect(() => {
    const currentStep = journeySteps.find(step => pathname?.startsWith(step.href) && step.href !== '/');
    if (currentStep && currentStep.subItems) {
      setExpandedId(currentStep.id);
    }
  }, [pathname]);

  const toggleExpand = (id: number, hasSub: boolean, e: React.MouseEvent) => {
    if (!hasSub) return;
    e.preventDefault(); // Prevent navigation if we are just toggling the menu
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 text-white min-h-screen flex flex-col relative z-20">
      <div className="p-6 pb-2">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
          AIChoShop
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">Hành trình X10 Doanh Số</p>
      </div>

      <div className="flex-1 px-6 py-8 overflow-y-auto custom-scrollbar">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-6">Lộ trình khám phá</p>
        
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-5 top-5 bottom-8 w-0.5 bg-slate-800"></div>

          <div className="space-y-6">
            {journeySteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = pathname?.startsWith(step.href);
              const isExpanded = expandedId === step.id;
              const hasSub = !!step.subItems;
              
              return (
                <div key={step.id} className="relative">
                  <Link
                    href={step.href}
                    onClick={(e) => hasSub ? toggleExpand(step.id, hasSub, e) : null}
                    className="relative flex gap-4 group cursor-pointer"
                  >
                    {/* Timeline Node */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-slate-900 ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
                      }`}>
                        <Icon size={18} />
                      </div>
                      {isActive && index !== journeySteps.length - 1 && (
                        <div className="absolute top-10 w-0.5 h-12 bg-blue-600/50"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pt-2 pb-1 transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                      <div className="flex items-center justify-between pr-2">
                        <h3 className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                          {step.name}
                        </h3>
                        {hasSub && (
                          <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-400' : ''}`} />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  </Link>

                  {/* SubMenu (Accordion) */}
                  {hasSub && (
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="pl-14 pr-2 space-y-1.5 pb-2">
                        {step.subItems?.map((sub, i) => (
                          <Link 
                            key={i} 
                            href={sub.href}
                            className={`block text-xs py-2 px-3 rounded-lg transition-colors ${pathname === sub.href ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                        {/* A link to go to the main page if they want to view all */}
                        <Link href={step.href} className="block text-[11px] py-1 px-3 text-slate-500 hover:text-blue-400 transition-colors italic mt-1">
                          Xem toàn bộ trang &rarr;
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Other static links */}
        <div className="mt-12 pt-6 border-t border-slate-800">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-white"
          >
            <Settings size={18} />
            <span className="text-sm font-medium">Cài đặt hệ thống</span>
          </Link>
        </div>
      </div>

      <div className="p-4 m-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
        
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center font-black text-white shadow-inner uppercase">
            {user ? user.name?.charAt(0) : 'U'}
          </div>
          <div>
            <p className="text-sm font-bold text-white truncate max-w-[120px]">{user ? user.name : 'Khách Vãng Lai'}</p>
            {user?.isVIP ? (
              <p className="text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded inline-block mt-0.5 border border-amber-500/20">VIP Member</p>
            ) : (
              <p className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded inline-block mt-0.5">Free Plan</p>
            )}
          </div>
        </div>
        
        {user ? (
          <div className="flex gap-2">
            {!user.isVIP && (
              <Link href="/pricing" className="relative z-10 flex-1 flex items-center justify-center gap-1.5 text-xs bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white py-2 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/50">
                <Crown size={14} /> Lên VIP
              </Link>
            )}
            <button 
              onClick={() => logoutUser()}
              className="relative z-10 flex items-center justify-center text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-2 px-3 rounded-lg font-bold transition-all border border-slate-600/50"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <Link href="/login" className="relative z-10 flex items-center justify-center gap-2 text-xs bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/50">
            Đăng nhập / Đăng ký
          </Link>
        )}
      </div>
    </aside>
  );
}
