"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  Crown,
  Zap,
  TrendingUp,
  Clock,
  Play,
  CheckCircle2,
  Copy,
  Check,
  CheckSquare,
  Square,
  Flame,
  ExternalLink,
} from "lucide-react";

export interface ResumeLessonData {
  id: string;
  title: string;
  moduleName: string;
  order: number;
  isVIP: boolean;
  label: string;
  isResume: boolean;
  course: {
    id: string;
    title: string;
  };
}

export interface DashboardClientProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    isVIP: boolean;
  };
  aiStats: {
    todayCount: number;
    totalGenerated: number;
    remainingFree: number | null;
    dailyFreeLimit: number;
    recentActivities: {
      id: string;
      tool: string;
      toolName: string;
      action: string;
      output?: string | null;
      time: string;
    }[];
  };
  totalLessons: number;
  completedLessonsCount: number;
  courseProgressPercent: number;
  resumeLesson: ResumeLessonData | null;
}

export default function DashboardClient({
  user,
  aiStats,
  totalLessons,
  completedLessonsCount,
  courseProgressPercent,
  resumeLesson,
}: DashboardClientProps) {
  // State sao chép hoạt động AI
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // State mục tiêu hàng ngày (Daily Seller Routine)
  const [dailyGoals, setDailyGoals] = useState({
    seo: false,
    video: false,
    lesson: false,
  });

  // Tải trạng thái mục tiêu từ localStorage
  useEffect(() => {
    try {
      const todayKey = `seller_goals_${new Date().toISOString().slice(0, 10)}`;
      const saved = localStorage.getItem(todayKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          queueMicrotask(() => {
            setDailyGoals((prev) => ({ ...prev, ...parsed }));
          });
        }
      }
    } catch {
      // Bỏ qua lỗi truy cập storage
    }
  }, []);

  const toggleGoal = (key: keyof typeof dailyGoals) => {
    setDailyGoals((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        const todayKey = `seller_goals_${new Date().toISOString().slice(0, 10)}`;
        localStorage.setItem(todayKey, JSON.stringify(next));
      } catch {
        // Bỏ qua lỗi
      }
      return next;
    });
  };

  const completedGoalsCount = Object.values(dailyGoals).filter(Boolean).length;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Ước tính thời gian làm việc tiết kiệm được (mỗi lần dùng AI tiết kiệm trung bình ~25 phút thủ công)
  const estimatedHoursSaved = Math.max(1, Math.round(aiStats.totalGenerated * 0.4 * 10) / 10);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-10">
      {/* 1. HERO BANNER: CHÀO MỪNG & TIẾP TỤC HỌC THÔNG MINH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Card Trái: Lời chào + Smart Learning Resume */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 sm:p-7 md:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all">
          <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-brand/10 text-brand border border-brand/20 mb-3">
                <Sparkles size={12} className="animate-pulse" />
                Trung tâm bán hàng AI thực chiến
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Chào mừng trở lại,{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-300">
                  {user.name || user.email.split("@")[0]}
                </span>
                ! 👋
              </h1>

              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                Hệ sinh thái tự động hóa quy trình kinh doanh đa sàn (Shopee, TikTok Shop, Lazada). Tiếp tục bài học và khai phóng sức mạnh AI ngay bên dưới.
              </p>
            </div>

            {/* Smart Learning Resume Widget */}
            {resumeLesson ? (
              <div className="bg-slate-50/90 dark:bg-slate-800/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                      <Play size={11} className="fill-purple-700 dark:fill-purple-300" />
                      {resumeLesson.label}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {resumeLesson.moduleName}
                    </span>
                  </div>

                  {resumeLesson.isVIP && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                      <Crown size={12} className="fill-amber-500" /> VIP
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1">
                    {resumeLesson.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    Khóa học: {resumeLesson.course.title}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  <Link
                    href={`/learn?lessonId=${resumeLesson.id}`}
                    className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-2 text-xs sm:text-sm group cursor-pointer"
                  >
                    <span>{resumeLesson.isResume ? "Học tiếp ngay" : "Bắt đầu học"}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/courses"
                    className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-semibold transition-all border border-slate-200 dark:border-slate-700 text-xs sm:text-sm flex items-center justify-center gap-1.5"
                  >
                    <BookOpen size={14} /> Xem danh sách khóa học
                  </Link>
                </div>
              </div>
            ) : totalLessons > 0 && completedLessonsCount >= totalLessons ? (
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-4">
                <div className="w-11 h-11 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                    Xuất sắc! Bạn đã hoàn thành 100% bài học hiện có
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Hãy áp dụng kiến thức vào thực chiến bằng 19 công cụ AI bên dưới hoặc xem lại bài giảng.
                  </p>
                </div>
                <Link
                  href="/courses"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0"
                >
                  Ôn tập
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {/* Card Phải: Gói tài khoản & Quota Status */}
        <div className="lg:col-span-4 bg-slate-900 dark:bg-slate-950 rounded-3xl p-5 sm:p-7 text-white relative overflow-hidden shadow-xl shadow-slate-900/20 border border-slate-800 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-amber-600/20 pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${user.isVIP ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>
                  {user.isVIP ? <Crown size={22} className="fill-amber-400" /> : <Sparkles size={22} />}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gói tài khoản</p>
                  <h3 className="text-xl sm:text-2xl font-black">
                    {user.isVIP ? (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200">
                        VIP Pro Member
                      </span>
                    ) : (
                      "Gói Trải Nghiệm Free"
                    )}
                  </h3>
                </div>
              </div>
            </div>

            {user.isVIP ? (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tài khoản của bạn đã được kích hoạt đặc quyền cao cấp nhất. Toàn quyền sử dụng 19 công cụ và xem toàn bộ video Masterclass.
                </p>

                <div className="space-y-1.5 py-1 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                    <span>Không giới hạn lượt dùng AI mỗi ngày</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                    <span>Mở khóa 19/19 công cụ bán hàng thực chiến</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                    <span>Hỗ trợ ưu tiên và cập nhật prompt mới</span>
                  </div>
                </div>

                <Link
                  href="/profile"
                  className="w-full bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Quản lý hồ sơ & VIP &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Lượt AI miễn phí hôm nay:</span>
                    <span className="font-bold text-amber-400">
                      Còn {aiStats.remainingFree ?? 0}/{aiStats.dailyFreeLimit} lượt
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round(((aiStats.remainingFree ?? 0) / (aiStats.dailyFreeLimit || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    * Reset tự động về {aiStats.dailyFreeLimit} lượt vào lúc 00:00 mỗi ngày.
                  </p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Nâng cấp VIP để mở khóa không giới hạn lượt dùng, mở toàn bộ 19 công cụ và video chuyên sâu.
                </p>

                <Link
                  href="/profile#pricing-section"
                  className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs hover:brightness-110 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crown size={15} className="fill-slate-950" /> Nâng cấp VIP ngay (Giảm 50%)
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. KPI / STATS CHUẨN XÁC DỰA TRÊN DỮ LIỆU THỰC TẾ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
        {/* KPI 1: Lượt dùng AI hôm nay */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
            <Zap size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Hạn mức AI hôm nay</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                {user.isVIP ? `${aiStats.todayCount}` : `${aiStats.todayCount}/${aiStats.dailyFreeLimit}`}
              </h4>
              <span className="text-xs font-semibold text-slate-400">
                {user.isVIP ? "Không giới hạn" : `(Còn ${aiStats.remainingFree ?? 0} lượt)`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {user.isVIP ? "Đang sử dụng gói VIP Pro" : "Tự động reset lúc 00:00 (GMT+7)"}
            </p>
          </div>
        </div>

        {/* KPI 2: Hiệu suất & Thời gian tiết kiệm */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Nội dung đã tạo & Hiệu suất</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                {aiStats.totalGenerated}
              </h4>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                ~{estimatedHoursSaved}h tiết kiệm
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              Tối ưu chi phí nhân sự & thời gian làm việc
            </p>
          </div>
        </div>

        {/* KPI 3: Tiến độ học tập */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen size={24} />
          </div>
          <div className="w-full min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Tiến độ Masterclass</p>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                {courseProgressPercent}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${courseProgressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
              <span>Đã học: <strong className="text-slate-700 dark:text-slate-200">{completedLessonsCount}</strong>/{totalLessons} bài</span>
              <Link href="/courses" className="text-brand hover:underline font-bold transition-colors">
                Xem chi tiết &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DAILY SELLER CHECKLIST (MỤC TIÊU HÀNH ĐỘNG HÀNG NGÀY CỦA SELLER) */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold">
              <CheckSquare size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Mục tiêu hành động hôm nay của Seller
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Duy trì 3 thói quen này mỗi ngày để tăng trưởng đơn hàng bền vững
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Tiến độ:</span>
            <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              {completedGoalsCount}/3 nhiệm vụ
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Nhiệm vụ 1 */}
          <div
            onClick={() => toggleGoal("seo")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${dailyGoals.seo
              ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
              : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
          >
            <div className="mt-0.5">
              {dailyGoals.seo ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
              ) : (
                <Square size={18} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className={`text-xs font-bold ${dailyGoals.seo ? "text-emerald-800 dark:text-emerald-300 line-through" : "text-slate-800 dark:text-slate-200"}`}>
                  1. Tối ưu SEO 1 sản phẩm
                </h4>
                <Link
                  href="/tools/seo-optimizer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-brand hover:underline font-semibold flex items-center gap-0.5"
                >
                  Mở tool <ExternalLink size={10} />
                </Link>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Cập nhật tiêu đề & hashtag chuẩn thuật toán sàn.
              </p>
            </div>
          </div>

          {/* Nhiệm vụ 2 */}
          <div
            onClick={() => toggleGoal("video")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${dailyGoals.video
              ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
              : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
          >
            <div className="mt-0.5">
              {dailyGoals.video ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
              ) : (
                <Square size={18} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className={`text-xs font-bold ${dailyGoals.video ? "text-emerald-800 dark:text-emerald-300 line-through" : "text-slate-800 dark:text-slate-200"}`}>
                  2. Tạo 1 kịch bản video TikTok
                </h4>
                <Link
                  href="/tools/script-writer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-brand hover:underline font-semibold flex items-center gap-0.5"
                >
                  Mở tool <ExternalLink size={10} />
                </Link>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Lên ý tưởng mồi câu 3s đầu để kéo view và gắn giỏ hàng.
              </p>
            </div>
          </div>

          {/* Nhiệm vụ 3 */}
          <div
            onClick={() => toggleGoal("lesson")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${dailyGoals.lesson
              ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
              : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
          >
            <div className="mt-0.5">
              {dailyGoals.lesson ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
              ) : (
                <Square size={18} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className={`text-xs font-bold ${dailyGoals.lesson ? "text-emerald-800 dark:text-emerald-300 line-through" : "text-slate-800 dark:text-slate-200"}`}>
                  3. Xem 1 video bài giảng
                </h4>
                <Link
                  href={resumeLesson ? `/learn?lessonId=${resumeLesson.id}` : "/courses"}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-brand hover:underline font-semibold flex items-center gap-0.5"
                >
                  Học ngay <ExternalLink size={10} />
                </Link>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Tích lũy tư duy thực chiến mới mỗi ngày.
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* 5. HOẠT ĐỘNG GẦN ĐÂY VỚI QUICK COPY & SHORTCUTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Cột trái: Hoạt động gần đây (Dữ liệu thực tế từ AiUsageLog + Quick Copy) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors flex flex-col justify-between">
          <div>
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
                <Clock size={16} className="text-slate-400" /> Lịch sử hoạt động AI gần đây
              </h3>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-400">
                {aiStats.recentActivities.length > 0
                  ? `${Math.min(3, aiStats.recentActivities.length)} tác vụ gần nhất`
                  : "Chưa có hoạt động"}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {aiStats.recentActivities.length === 0 ? (
                <div className="p-8 sm:p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-full flex items-center justify-center mx-auto text-blue-500 shadow-xs">
                    <Sparkles size={22} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      Chưa có lịch sử hoạt động AI
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Hãy trải nghiệm các công cụ AI để tự động tối ưu hóa SEO, viết kịch bản video và tạo tài liệu bán hàng ngay hôm nay.
                    </p>
                  </div>
                  <div>
                    <Link
                      href="/tools"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand hover:bg-brand-hover px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand/20 cursor-pointer"
                    >
                      Dùng thử công cụ AI ngay <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ) : (
                aiStats.recentActivities.slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex gap-3.5 sm:gap-4 items-start"
                  >
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Sparkles size={17} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded shrink-0">
                            {activity.toolName}
                          </span>
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate">
                            {activity.action}
                          </h4>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 shrink-0">
                          {activity.time}
                        </span>
                      </div>

                      {activity.output && (
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 mt-2">
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 select-text font-mono text-[11px]">
                            {activity.output.replace(/[#*`_]/g, "").slice(0, 160)}...
                          </p>

                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                            <button
                              onClick={() => handleCopy(activity.id, activity.output || "")}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand transition-colors cursor-pointer"
                            >
                              {copiedId === activity.id ? (
                                <>
                                  <Check size={12} className="text-emerald-500" />
                                  <span className="text-emerald-500">Đã chép vào clipboard!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Sao chép kết quả</span>
                                </>
                              )}
                            </button>

                            <Link
                              href={`/tools/${activity.tool}`}
                              className="text-[11px] font-bold text-brand hover:underline flex items-center gap-0.5"
                            >
                              Mở lại tool &rarr;
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex justify-between items-center text-xs">
            <span className="text-slate-400">Quản lý & tra cứu lại nội dung:</span>
            <Link href="/history" className="font-bold text-brand hover:underline flex items-center gap-1">
              Kho lưu trữ AI đã tạo <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Cột phải: 3 Công cụ bán chạy nhất & Lối tắt */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors flex flex-col justify-between">
          <div>
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                <Flame size={16} className="text-orange-500" /> Công cụ khuyên dùng nhiều nhất
              </h3>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              <Link
                href="/tools/seo-optimizer"
                className="block group p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors text-xs sm:text-sm">
                      AI Tối Ưu SEO Shopee
                    </h4>
                    <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-1.5 py-0.2 rounded">
                      FREE
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-brand group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Lên Top tìm kiếm với bộ tiêu đề và hashtag chuẩn thuật toán sàn.
                </p>
              </Link>

              <Link
                href="/tools/script-writer"
                className="block group p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-400 transition-colors text-xs sm:text-sm">
                      AI Kịch Bản Video TikTok
                    </h4>
                    <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-black px-1.5 py-0.2 rounded">
                      VIP
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  3s đầu Hook cực mạnh giữ chân khách xem và kích thích chốt đơn.
                </p>
              </Link>

              <Link
                href="/tools/appeal-generator"
                className="block group p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors text-xs sm:text-sm">
                      AI Kháng Nghị Vi Phạm Sàn
                    </h4>
                    <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-black px-1.5 py-0.2 rounded">
                      VIP
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tự động làm đơn xin mở khóa shop và sản phẩm chuẩn luật sàn.
                </p>
              </Link>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
            <Link
              href="/tools"
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              Khám phá toàn bộ 19 công cụ &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
