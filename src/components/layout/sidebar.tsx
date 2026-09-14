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
      desc: '9 Tools bứt phá doanh số',
      href: '/tools', 
      icon: Wrench,
      viewAllHref: '/tools',
      subItems: [
        { name: '1. Tính Giá Bán', href: '/tools/pricing-calculator' },
        { name: '2. Tính Thuế TMĐT', href: '/tools/tax-calculator' },
        { name: '3. AI Tối Ưu SEO', href: '/tools/seo-optimizer' },
        { name: '4. AI Viết Mô Tả', href: '/tools/product-description' },
        { name: '5. Nhân Bản Chống Spam', href: '/tools/title-spinner' },
        { name: '6. AI Kịch Bản Video', href: '/tools/script-writer' },
        { name: '7. AI Lập Kế Hoạch KOC', href: '/tools/koc-planner' },
        { name: '8. AI Xử Lý Khủng Hoảng', href: '/tools/review-replier' },
        { name: '9. AI Kháng Nghị', href: '/tools/appeal-generator' }
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
    <aside className={`w-72 sidebar-theme border-r min-h-screen flex-col relative z-20 ${pathname === '/tools/seo-optimizer' ? 'hidden lg:flex shrink-0' : 'flex'}`}>
      <div className="p-6 pb-2">
        <h1 
          className="text-2xl font-black bg-clip-text text-transparent"
          style={{ backgroundImage: "var(--brand-gradient)" }}
        >
          AIChoShop
        </h1>
        <p className="text-xs text-[var(--sidebar-text-muted)] mt-1 font-medium">Hành trình X10 Doanh Số</p>
      </div>

      <div className="flex-1 px-6 py-8 overflow-y-auto custom-scrollbar">
        <p className="text-[11px] font-bold text-[var(--sidebar-text-muted)] uppercase tracking-wider mb-6">Lộ trình khám phá</p>
        
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-5 top-5 bottom-8 w-0.5" style={{ backgroundColor: "var(--sidebar-timeline-line)" }}></div>

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
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${
                          isActive 
                            ? 'bg-brand text-white shadow-[0_0_15px_var(--brand-ring)]' 
                            : 'bg-white/80 dark:bg-slate-800/80 text-[var(--sidebar-text-muted)] group-hover:bg-brand-light group-hover:text-brand shadow-xs'
                        }`}
                        style={{ borderColor: "var(--sidebar-node-border)" }}
                      >
                        <Icon size={18} />
                      </div>
                      {isActive && index !== journeySteps.length - 1 && (
                        <div className="absolute top-10 w-0.5 h-12 bg-brand/50"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pt-2 pb-1 transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                      <div className="flex items-center justify-between pr-2">
                        <h3 className={`text-sm font-bold transition-colors ${isActive ? 'text-[var(--sidebar-text-primary)]' : 'text-[var(--sidebar-text-secondary)] group-hover:text-[var(--sidebar-text-primary)]'}`}>
                          {step.name}
                        </h3>
                        {hasSub && (
                          <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand' : 'text-[var(--sidebar-text-muted)]'}`} />
                        )}
                      </div>
                      <p className="text-xs text-[var(--sidebar-text-muted)] mt-0.5">{step.desc}</p>
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
                                  ? 'bg-white/90 dark:bg-brand-light text-brand font-bold border-l-2 border-brand pl-2.5 shadow-xs'
                                  : 'text-[var(--sidebar-text-secondary)] hover:text-[var(--sidebar-text-primary)] hover:bg-[var(--sidebar-hover-bg)]'
                              }`}
                            >
                              <span className="truncate">{sub.name}</span>
                              {sub.badge && (
                                <span className="text-[10px] text-[var(--sidebar-text-muted)] group-hover:text-[var(--sidebar-text-secondary)] font-mono shrink-0 ml-1.5 font-normal">
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
                            className="block text-[11px] py-1.5 px-3 text-[var(--sidebar-text-muted)] hover:text-brand hover:bg-[var(--sidebar-hover-bg)] rounded-lg transition-colors italic mt-1 font-semibold"
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
        <div className="mt-12 pt-6 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              pathname === '/settings'
                ? 'bg-brand text-white font-semibold shadow-md shadow-brand/20'
                : 'hover:bg-[var(--sidebar-hover-bg)] text-[var(--sidebar-text-secondary)] hover:text-[var(--sidebar-text-primary)]'
            }`}
          >
            <Settings size={18} className={pathname === '/settings' ? 'text-white' : 'text-[var(--sidebar-text-muted)]'} />
            <span className="text-sm">Cài đặt hệ thống</span>
          </Link>
        </div>
      </div>

      <div className="p-4 m-4 sidebar-user-card border rounded-2xl relative overflow-hidden group shadow-xs">
        <div 
          className="absolute top-0 right-0 w-24 h-24 rounded-full blur-xl transition-all opacity-40 group-hover:opacity-70 pointer-events-none"
          style={{ backgroundColor: "var(--brand-primary)" }}
        ></div>
        
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center font-black shadow-inner uppercase">
            {user ? user.name?.charAt(0) : 'U'}
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--sidebar-text-primary)] truncate max-w-[120px]">{user ? user.name : 'Khách Vãng Lai'}</p>
            {user?.isVIP ? (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded inline-block mt-0.5 border border-amber-500/20">VIP Member</p>
            ) : (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded inline-block mt-0.5 border border-emerald-500/20">Free Plan</p>
            )}
          </div>
        </div>
        
        {user ? (
          <div className="flex gap-2">
            {!user.isVIP && (
              <Link href="/profile#pricing-section" className="relative z-10 flex-1 flex items-center justify-center gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white py-2 rounded-lg font-bold transition-all shadow-md shadow-brand/30">
                <Crown size={14} /> Lên VIP
              </Link>
            )}
            <button 
              onClick={() => logoutUser()}
              className="relative z-10 flex items-center justify-center text-xs hover:bg-[var(--sidebar-hover-bg)] text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text-primary)] py-2 px-3 rounded-lg font-bold transition-all border border-[var(--sidebar-card-border)] cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <Link href="/login" className="relative z-10 flex items-center justify-center gap-2 text-xs bg-brand hover:bg-brand-hover text-white py-2 rounded-lg font-bold transition-all shadow-md shadow-brand/30">
            Đăng nhập / Đăng ký
          </Link>
        )}
      </div>
    </aside>
  );
}
