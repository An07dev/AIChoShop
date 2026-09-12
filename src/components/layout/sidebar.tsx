"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, BookOpen, Wrench, UserCircle, Settings, Crown, ChevronDown, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { logoutUser } from '@/app/actions/auth';

export interface SidebarCourseItem {
  id: string;
  title: string;
  lessonsCount: number;
  firstLessonId?: string;
}

export function Sidebar({
  user,
  dynamicModules,
  courses = [],
}: {
  user: any;
  dynamicModules?: { name: string; count: number }[];
  courses?: SidebarCourseItem[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCourseId = searchParams.get('courseId');
  const currentLessonId = searchParams.get('lessonId');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const totalLessonsCount = dynamicModules?.reduce((a, b) => a + b.count, 0) || 26;

  // Danh sách các khóa học thực tế: đầu tiên là "Tất cả bài học & Video", tiếp theo là các khóa học đang có
  const displayCourses = courses.length > 0 
    ? courses 
    : [{ id: '1', title: 'Masterclass Ứng Dụng AI Vào Bán Hàng', lessonsCount: totalLessonsCount, firstLessonId: '' }];

  const courseSubItems = [
    { name: '📺 Tất cả bài học & Video', href: '/courses' },
    ...displayCourses.map((c) => {
      const learnHref = c.firstLessonId
        ? `/learn?lessonId=${c.firstLessonId}`
        : `/learn?courseId=${c.id}`;
      return {
        name: `🎓 ${c.title}`,
        href: learnHref,
        courseId: c.id,
        lessonId: c.firstLessonId,
        badge: c.lessonsCount > 0 ? `${c.lessonsCount} bài` : undefined,
      };
    }),
  ];

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
      name: 'Khóa học', 
      desc: displayCourses.length > 0 
        ? `${displayCourses.length} Khóa học thực chiến` 
        : `${totalLessonsCount} Bài học thực chiến`,
      href: '/courses', 
      icon: BookOpen,
      subItems: courseSubItems,
    },
    { 
      id: 3, 
      name: 'Kho Công Cụ AI', 
      desc: '8 Tools bứt phá doanh số',
      href: '/tools', 
      icon: Wrench,
      viewAllHref: '/tools',
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
    const currentStep = journeySteps.find(step => {
      if (step.id === 2) {
        return pathname?.startsWith('/courses') || pathname?.startsWith('/learn');
      }
      return pathname?.startsWith(step.href) && step.href !== '/';
    });
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
              const isActive =
                pathname?.startsWith(step.href) ||
                (step.id === 2 && (pathname?.startsWith('/courses') || pathname?.startsWith('/learn')));
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
                          ? 'bg-brand text-white shadow-[0_0_15px_var(--brand-ring)]' 
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
                      }`}>
                        <Icon size={18} />
                      </div>
                      {isActive && index !== journeySteps.length - 1 && (
                        <div className="absolute top-10 w-0.5 h-12 bg-brand/50"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pt-2 pb-1 transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                      <div className="flex items-center justify-between pr-2">
                        <h3 className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                          {step.name}
                        </h3>
                        {hasSub && (
                          <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand' : ''}`} />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  </Link>

                  {/* SubMenu (Accordion) */}
                  {hasSub && (
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[600px] mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="pl-14 pr-2 space-y-1.5 pb-2">
                        {step.subItems?.map((sub: any, i) => {
                          const isSubActive =
                            sub.href === '/courses'
                              ? pathname === '/courses' && !currentCourseId
                              : sub.lessonId
                              ? pathname === '/learn' && (currentLessonId === sub.lessonId || currentCourseId === sub.courseId)
                              : sub.courseId
                              ? (pathname === '/learn' || pathname === '/courses') && currentCourseId === sub.courseId
                              : pathname === sub.href;

                          return (
                            <Link 
                              key={i} 
                              href={sub.href}
                              title={sub.name}
                              className={`flex items-center justify-between text-xs py-2 px-3 rounded-lg transition-colors group ${
                                isSubActive
                                  ? 'bg-brand-light text-brand font-bold border-l-2 border-brand pl-2.5'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              <span className="truncate">{sub.name}</span>
                              {sub.badge && (
                                <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-mono shrink-0 ml-1.5 font-normal">
                                  {sub.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                        {/* A link to go to the main page if they want to view all */}
                        {step.viewAllHref && (
                          <Link
                            href={step.viewAllHref}
                            className="block text-[11px] py-1.5 px-3 text-slate-400 hover:text-brand hover:bg-slate-800/60 rounded-lg transition-colors italic mt-1 font-semibold"
                          >
                            Xem toàn bộ trang &rarr;
                          </Link>
                        )}
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              pathname === '/settings'
                ? 'bg-brand text-white font-semibold shadow-md shadow-brand/20'
                : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <Settings size={18} className={pathname === '/settings' ? 'text-white' : 'text-slate-400'} />
            <span className="text-sm">Cài đặt hệ thống</span>
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
          <Link href="/login" className="relative z-10 flex items-center justify-center gap-2 text-xs bg-brand hover:bg-brand-hover text-white py-2 rounded-lg font-bold transition-all shadow-lg shadow-brand/30">
            Đăng nhập / Đăng ký
          </Link>
        )}
      </div>
    </aside>
  );
}
