import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowRight,
  Crown,
  BookOpen,
  Sparkles,
  Clock,
  CheckCircle2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getAiUsageStats } from "@/lib/ai-usage";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {

  const token = await getSessionUserId();

  if (!token) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: token },
    select: { id: true, name: true, email: true, isVIP: true, createdAt: true },
  });

  if (!user) {
    redirect("/login");
  }

  // 1. Lấy số liệu AI thực tế (Lượt dùng hôm nay, Tổng nội dung đã tạo, Hoạt động gần đây)
  // 2. Lấy dữ liệu Tiến độ học tập tổng quan chuẩn xác từ CSDL
  const [aiStats, totalLessons, completedLessonsCount] = await Promise.all([
    getAiUsageStats(user.id),
    prisma.lesson.count(),
    prisma.progress.count({
      where: { userId: user.id, completed: true },
    }),
  ]);

  // Tính % tiến độ học tập tổng quan
  const courseProgressPercent =
    totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* 1. WELCOME & BANNER */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            Chào mừng trở lại, <span className="text-brand">{user.name || user.email}</span>! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xl text-sm leading-relaxed">
            Tiếp tục hành trình X10 doanh số của bạn với các công cụ AI và kiến thức thực chiến từ chuyên gia.
          </p>

          <div className="flex flex-wrap gap-4 relative z-10">
            <Link
              href="/courses"
              className="bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand/25 flex items-center gap-2"
            >
              <BookOpen size={18} /> Học tiếp
            </Link>
            <Link
              href="/tools"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border border-slate-200/50 dark:border-slate-700/50"
            >
              <Sparkles size={18} /> Mở kho công cụ AI
            </Link>
          </div>
        </div>

        <div className="w-full md:w-80 bg-slate-900 dark:bg-slate-900/90 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20 border border-slate-800 flex flex-col justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${user.isVIP ? "bg-amber-500/20" : "bg-emerald-500/20"}`}>
                {user.isVIP ? (
                  <Crown size={24} className="text-amber-400" />
                ) : (
                  <CheckCircle2 size={24} className="text-emerald-400" />
                )}
              </div>
              <h2 className="font-bold text-slate-300 text-sm">Gói tài khoản</h2>
            </div>

            <h3 className="text-3xl font-black mb-1">
              {user.isVIP ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">
                  VIP Pro
                </span>
              ) : (
                "Free Plan"
              )}
            </h3>

            {user.isVIP ? (
              <p className="text-sm text-slate-400 mt-2">
                Mở khóa toàn bộ tính năng và khóa học. Chúc bạn bùng nổ doanh số!
              </p>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-slate-400 mb-4">
                  Bạn đang bị giới hạn truy cập công cụ VIP và phần nâng cao của khóa học.
                </p>
                <Link
                  href="/profile#pricing-section"
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-4 py-2.5 rounded-xl font-black text-sm hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crown size={16} className="fill-slate-950" /> Nâng cấp VIP ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. KPI / STATS CHUẨN XÁC DỰA TRÊN DỮ LIỆU THỰC TẾ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Lượt dùng AI hôm nay */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Lượt dùng AI hôm nay</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                {user.isVIP
                  ? `${aiStats.todayCount}`
                  : `${aiStats.todayCount}/${aiStats.dailyFreeLimit}`}
              </h4>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {user.isVIP
                  ? "/ Không giới hạn"
                  : `(Còn ${aiStats.remainingFree ?? 0} lượt)`}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Nội dung đã tạo */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Nội dung đã tạo</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                {aiStats.totalGenerated}
              </h4>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">bản ghi</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Tiến độ khóa học (Chuẩn hóa theo Tiến độ học tập tổng quan) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Tiến độ học tập</p>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                {courseProgressPercent}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${courseProgressPercent}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Đã học: <strong>{completedLessonsCount}</strong>/{totalLessons} bài</span>
              <Link href="/courses" className="hover:text-purple-500 font-semibold transition-colors">
                Xem khóa học &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RECENT ACTIVITY & RECOMMENDED TOOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Hoạt động gần đây (Dữ liệu thực tế từ AiUsageLog) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Clock size={18} className="text-slate-400" /> Hoạt động gần đây
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {aiStats.recentActivities.length > 0
                ? `${Math.min(3, aiStats.recentActivities.length)} thao tác gần nhất`
                : "Chưa có hoạt động"}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {aiStats.recentActivities.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-full flex items-center justify-center mx-auto text-blue-500">
                  <Sparkles size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Chưa có hoạt động AI nào
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Hãy trải nghiệm sức mạnh của các công cụ AI bán hàng để tự động tối ưu SEO, viết kịch bản và xử lý vi phạm.
                  </p>
                </div>
                <div>
                  <Link
                    href="/tools"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand bg-brand/10 hover:bg-brand/20 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Dùng thử công cụ AI ngay <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ) : (
              aiStats.recentActivities.slice(0, 3).map((activity) => (
                <div
                  key={activity.id}
                  className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-4 items-start"
                >
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                          {activity.toolName}
                        </span>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                          {activity.action}
                        </h4>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 shrink-0">
                        {activity.time}
                      </span>
                    </div>
                    {activity.output && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mt-1">
                        {activity.output.replace(/[#*`_]/g, "").slice(0, 140)}...
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột phải: Công cụ khuyên dùng */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Công cụ khuyên dùng</h3>
          </div>
          <div className="p-6 space-y-4">
            <Link
              href="/tools/seo-optimizer"
              className="block group p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-blue-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors text-sm">
                  AI Tối Ưu SEO
                </h4>
                <ArrowRight
                  size={16}
                  className="text-slate-400 group-hover:text-brand group-hover:translate-x-1 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Giật Top 1 tìm kiếm với bộ tiêu đề và hashtag chuẩn thuật toán.
              </p>
            </Link>

            <Link
              href="/tools/script-writer"
              className="block group p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-purple-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-400 transition-colors text-sm">
                    AI Kịch Bản Video
                  </h4>
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/50">
                    VIP
                  </span>
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Sáng tạo 3s đầu hook cực mạnh giữ chân khách hàng trên TikTok.
              </p>
            </Link>

            <Link
              href="/tools/appeal-generator"
              className="block group p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-rose-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors text-sm">
                    AI Kháng Nghị Vi Phạm
                  </h4>
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/50">
                    VIP
                  </span>
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tự động viết đơn giải trình chuẩn chính sách khi bị sàn đánh gậy.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
