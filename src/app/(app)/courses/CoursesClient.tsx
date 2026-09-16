"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Play,
  PlayCircle,
  Crown,
  Sparkles,
  BookOpen,
  Search,
  Layers,
  Video,
  ArrowRight,
  X,
  Check,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { parseVideoUrl } from "@/lib/video";

export interface CourseLessonItem {
  id: string;
  courseId: string;
  title: string;
  moduleName: string;
  content: string | null;
  videoUrl: string | null;
  order: number;
  isVIP: boolean;
}

export interface CourseItem {
  id: string;
  title: string;
  description: string | null;
  lessons: CourseLessonItem[];
}

interface CoursesClientProps {
  courses: CourseItem[];
  isUserVIP: boolean;
  isLogged: boolean;
  completedLessonIds: string[];
  initialModule?: string;
  initialCourseId?: string;
}

export default function CoursesClient({
  courses,
  isUserVIP,
  isLogged,
  completedLessonIds,
  initialModule,
  initialCourseId,
}: CoursesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "FREE" | "VIP">("ALL");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || "ALL");
  const [selectedModule, setSelectedModule] = useState<string>(initialModule || "ALL");
  const [previewLesson, setPreviewLesson] = useState<CourseLessonItem | null>(null);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModule("ALL");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (courseId === "ALL") {
        url.searchParams.delete("courseId");
      } else {
        url.searchParams.set("courseId", courseId);
      }
      url.searchParams.delete("module");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleModuleChange = (mod: string) => {
    setSelectedModule(mod);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (mod === "ALL") {
        url.searchParams.delete("module");
      } else {
        url.searchParams.set("module", mod);
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Tập hợp tất cả bài học của toàn bộ hệ thống
  const allLessons = useMemo(() => {
    return courses.flatMap((c) => c.lessons);
  }, [courses]);

  // Tập hợp bài học trong phạm vi khóa học đang chọn (nếu chọn ALL thì lấy tất cả)
  const scopeLessons = useMemo(() => {
    if (selectedCourseId === "ALL") {
      return allLessons;
    }
    return courses.find((c) => c.id === selectedCourseId)?.lessons || [];
  }, [allLessons, selectedCourseId, courses]);

  // Danh sách các module duy nhất (dựa trên khóa học đang chọn)
  const uniqueModules = useMemo(() => {
    const set = new Set<string>();
    scopeLessons.forEach((l) => {
      if (l.moduleName && l.moduleName.trim()) {
        set.add(l.moduleName.trim());
      }
    });
    return Array.from(set);
  }, [scopeLessons]);

  // Thống kê đồng bộ theo khóa học đang chọn
  const totalCourses = courses.length;
  const currentTotalLessons = scopeLessons.length;
  const currentFreeLessons = scopeLessons.filter((l) => !l.isVIP).length;
  const currentVipLessons = scopeLessons.filter((l) => l.isVIP).length;
  const currentCompletedCount = scopeLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const currentProgressPercent =
    currentTotalLessons > 0 ? Math.round((currentCompletedCount / currentTotalLessons) * 100) : 0;

  // Lọc bài học theo điều kiện tìm kiếm, khóa học và bộ lọc
  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => selectedCourseId === "ALL" || course.id === selectedCourseId)
      .map((course) => {
        const filteredLessons = course.lessons.filter((lesson) => {
          // Tìm kiếm theo từ khóa
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matchTitle = lesson.title.toLowerCase().includes(q);
            const matchModule = lesson.moduleName?.toLowerCase().includes(q);
            const matchContent = lesson.content?.toLowerCase().includes(q);
            const matchOrder = lesson.order.toString().includes(q);
            if (!matchTitle && !matchModule && !matchContent && !matchOrder) {
              return false;
            }
          }

          // Lọc theo FREE / VIP
          if (filterType === "FREE" && lesson.isVIP) return false;
          if (filterType === "VIP" && !lesson.isVIP) return false;

          // Lọc theo Module
          if (selectedModule !== "ALL" && lesson.moduleName !== selectedModule) {
            return false;
          }

          return true;
        });

        return {
          ...course,
          lessons: filteredLessons,
        };
      });
  }, [courses, selectedCourseId, searchQuery, filterType, selectedModule]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-16">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-10 text-white border border-slate-800 shadow-2xl">
        {/* Glow background effects adapting to theme */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-25"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />
        <div 
          className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Tất Cả Khóa Học &{" "}
              <span 
                className="bg-clip-text text-transparent font-black"
                style={{ backgroundImage: "var(--brand-gradient)" }}
              >
                Video Bài Giảng
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Trọn bộ kiến thức thực chiến ứng dụng AI vào bán hàng đa sàn (Shopee, TikTok Shop, Lazada).
              Xem video theo từng học phần, lưu tiến độ học tập và bứt phá doanh số.
            </p>
          </div>

          {/* Quick CTA to continue learning */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 w-full lg:w-80 shrink-0 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                {selectedCourseId === "ALL" ? "Tiến độ học tập tổng quan" : "Tiến độ khóa học đang xem"}
              </span>
              <span className="text-xs font-black text-brand">{currentProgressPercent}%</span>
            </div>

            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-brand h-full rounded-full transition-all duration-500"
                style={{ width: `${currentProgressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>Đã học: <strong>{currentCompletedCount}</strong>/{currentTotalLessons} bài</span>
              {isUserVIP ? (
                <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                  <Crown size={11} /> VIP Member
                </span>
              ) : (
                <span className="text-slate-400">Gói FREE</span>
              )}
            </div>

            <Link
              href={
                selectedCourseId !== "ALL" && scopeLessons[0]?.id
                  ? `/learn?lessonId=${scopeLessons[0].id}`
                  : "/learn"
              }
              className="w-full bg-brand hover:bg-brand-hover text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-brand/25 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <GraduationCap size={15} />
              <span>Vào Trình Phát Video Học Tập</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ── 2. STATS CARDS ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-slate-400 text-xs font-medium block">
              {selectedCourseId === "ALL" ? "Khóa học" : "Khóa học"}
            </span>
            <span className="text-2xl font-black text-white mt-0.5 block truncate">
              {selectedCourseId === "ALL" ? `${totalCourses} khóa` : "1 khóa"}
            </span>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-slate-400 text-xs font-medium block">Tổng số video</span>
            <span className="text-2xl font-black text-white mt-0.5 block">{currentTotalLessons} bài</span>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-emerald-400 text-xs font-medium block flex items-center gap-1">
              <Sparkles size={12} /> Bài học FREE
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{currentFreeLessons} bài</span>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-amber-400 text-xs font-medium block flex items-center gap-1">
              <Crown size={12} /> Bài học VIP PRO
            </span>
            <span className="text-2xl font-black text-amber-400 mt-0.5 block">{currentVipLessons} bài</span>
          </div>
        </div>
      </div>

      {/* ── 3. SEARCH & FILTER BAR ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        {/* Input Tìm kiếm */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bài học, số thứ tự (STT), nội dung..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand/20 focus:border-brand bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Bộ lọc Type (ALL / FREE / VIP) & Module */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc VIP/FREE */}
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 p-1 text-xs font-bold">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === "ALL"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              Tất cả ({currentTotalLessons})
            </button>
            <button
              onClick={() => setFilterType("FREE")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${filterType === "FREE"
                ? "bg-emerald-500 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              <Sparkles size={12} /> FREE ({currentFreeLessons})
            </button>
            <button
              onClick={() => setFilterType("VIP")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${filterType === "VIP"
                ? "bg-amber-500 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              <Crown size={12} /> VIP ({currentVipLessons})
            </button>
          </div>

          {/* Chọn Khóa Học */}
          {courses.length > 1 && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="px-3 py-2 border border-brand/30 dark:border-brand/40 rounded-xl text-xs font-bold text-brand bg-brand-light cursor-pointer hover:border-brand focus:ring-2 focus:ring-brand/20 max-w-[210px] truncate"
              >
                <option value="ALL">🎓 Tất cả khóa học ({courses.length})</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.lessons.length} bài)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Chọn Học Phần */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedModule}
              onChange={(e) => handleModuleChange(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer hover:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="ALL">📁 Tất cả các phần ({uniqueModules.length} phần)</option>
              {uniqueModules.map((m) => (
                <option key={m} value={m}>
                  📂 {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>


      {/* ── 4. COURSES & LESSONS LISTING ────────────────────────────────────────── */}
      {filteredCourses.every((c) => c.lessons.length === 0) ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen size={28} />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Không tìm thấy bài học nào phù hợp</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hãy thử tìm bằng từ khóa khác hoặc bấm bỏ bộ lọc để xem toàn bộ danh sách video bài giảng.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterType("ALL");
              setSelectedModule("ALL");
              setSelectedCourseId("ALL");
            }}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {filteredCourses.map((course) => {
            if (course.lessons.length === 0) return null;

            // Nhóm các bài học của khóa này theo module
            const moduleGroups = new Map<string, CourseLessonItem[]>();
            course.lessons.forEach((lesson) => {
              const modName = lesson.moduleName?.trim() || "Phần 1";
              if (!moduleGroups.has(modName)) {
                moduleGroups.set(modName, []);
              }
              moduleGroups.get(modName)!.push(lesson);
            });

            return (
              <div key={course.id} id={`course-${course.id}`} className="space-y-8 scroll-mt-6">
                {/* Course Header Banner */}
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-brand-light text-brand text-[10px] font-black uppercase tracking-wider">
                        Khóa học Masterclass
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {course.lessons.length} bài giảng
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {course.title}
                    </h2>
                    {course.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-2xl">{course.description}</p>
                    )}
                  </div>

                  <Link
                    href={`/learn?lessonId=${course.lessons[0]?.id || ""}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand hover:bg-brand-hover shadow-md shadow-brand/20 transition-all shrink-0 cursor-pointer"
                  >
                    <Play size={14} className="fill-white" />
                    <span>Học theo lộ trình chuyên sâu</span>
                  </Link>
                </div>

                {/* Các Module & Bài học bên trong */}
                <div className="space-y-8">
                  {Array.from(moduleGroups.entries()).map(([moduleName, lessons]) => (
                    <div key={moduleName} className="space-y-4">
                      {/* Module Title Ribbon */}
                      <div className="flex items-center gap-2 px-1">
                        <div className="p-1.5 rounded-lg bg-brand-light text-brand">
                          <Layers size={16} />
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                          {moduleName}
                        </h3>
                        <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {lessons.length} video
                        </span>
                      </div>

                      {/* Video Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                        {lessons.map((lesson) => {
                          const isCompleted = completedLessonIds.includes(lesson.id);
                          const videoInfo = parseVideoUrl(lesson.videoUrl);

                          // Thumbnail URL
                          const ytThumbnail =
                            videoInfo.type === "youtube" && videoInfo.videoId
                              ? `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`
                              : null;

                          return (
                            <div
                              key={lesson.id}
                              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                            >
                              {/* Video Thumbnail Box */}
                              <div
                                onClick={() => setPreviewLesson(lesson)}
                                className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer"
                              >
                                {ytThumbnail ? (
                                  // eslint-disable-next-line @next/next/no-img-element -- provider thumbnail is external and optional.
                                  <img
                                    src={ytThumbnail}
                                    alt={lesson.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                  />
                                ) : videoInfo.type === "direct" ? (
                                  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
                                    <Video size={36} className="text-brand mb-1 opacity-75" />
                                    <span className="text-[11px] font-mono text-slate-300 font-medium truncate max-w-[200px]">
                                      {lesson.videoUrl?.split("/").pop() || "Video tải lên"}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                                    <BookOpen size={36} className="text-slate-600" />
                                  </div>
                                )}

                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

                                {/* Play Button in Center */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg group-hover:scale-115 group-hover:bg-brand-hover transition-all duration-300 backdrop-blur-xs">
                                    <Play size={20} className="fill-white ml-0.5" />
                                  </div>
                                </div>

                                {/* Top Badges */}
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                  <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black px-2 py-0.5 rounded-lg border border-slate-700">
                                    #{lesson.order}
                                  </span>

                                  {lesson.isVIP ? (
                                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                                      <Crown size={10} className="fill-slate-950" /> VIP PRO
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-black px-2 py-0.5 rounded-lg backdrop-blur-xs">
                                      <Sparkles size={10} /> FREE
                                    </span>
                                  )}
                                </div>

                                {/* Completed Badge */}
                                {isCompleted && (
                                  <div className="absolute top-2.5 right-2.5">
                                    <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                                      <Check size={11} /> Đã học
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Card Content */}
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div className="space-y-1.5">
                                  <span className="inline-block text-[10px] font-bold text-brand bg-brand-light px-2 py-0.5 rounded-md border border-brand/20">
                                    {lesson.moduleName}
                                  </span>

                                  <h4
                                    onClick={() => setPreviewLesson(lesson)}
                                    className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2 hover:text-brand transition-colors cursor-pointer"
                                    title={lesson.title}
                                  >
                                    {lesson.title}
                                  </h4>

                                  {lesson.content && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                      {lesson.content}
                                    </p>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                  <button
                                    onClick={() => setPreviewLesson(lesson)}
                                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand hover:bg-brand-light px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <PlayCircle size={14} className="text-brand" />
                                    <span>Xem nhanh</span>
                                  </button>

                                  <Link
                                    href={`/learn?lessonId=${lesson.id}`}
                                    className="text-xs font-bold text-brand hover:text-brand-hover hover:bg-brand-light px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer ml-auto"
                                  >
                                    <span>Vào học</span>
                                    <ChevronRight size={14} />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 5. QUICK VIDEO WATCH MODAL ──────────────────────────────────────────── */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-800 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                <div className="p-1.5 rounded-lg bg-brand-light text-brand shrink-0">
                  <PlayCircle size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand">
                      Bài #{previewLesson.order}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      {previewLesson.moduleName}
                    </span>
                    {previewLesson.isVIP ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                        <Crown size={10} /> VIP PRO
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                        ✨ FREE
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white truncate mt-0.5">
                    {previewLesson.title}
                  </h4>
                </div>
              </div>

              <button
                onClick={() => setPreviewLesson(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Player Container */}
            <div className="relative aspect-video w-full max-h-[60vh] bg-black flex items-center justify-center overflow-hidden shrink-0">
              {previewLesson.isVIP && !isUserVIP ? (
                /* Paywall Overlay khi là bài VIP và tài khoản FREE */
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-center p-6 z-10 space-y-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Crown size={28} className="text-slate-950 fill-slate-950" />
                  </div>
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Bài Học Dành Riêng Cho Thành Viên VIP PRO
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white max-w-md">
                    Nâng Cấp VIP Để Xem Toàn Bộ Video Chuyên Sâu
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm">
                    Bài giảng này chứa kiến thức thực chiến nâng cao. Nâng cấp ngay để mở khóa trọn bộ 100% video và công cụ AI.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/profile#pricing-section"
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Crown size={14} className="fill-slate-950" /> Nâng Cấp VIP Ngay
                    </Link>
                    {!isLogged && (
                      <Link
                        href="/login"
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Đã có tài khoản? Đăng nhập
                      </Link>
                    )}
                  </div>
                </div>
              ) : (() => {
                const info = parseVideoUrl(previewLesson.videoUrl);
                if (!info.embedUrl) {
                  return (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-2">
                      <Video size={40} className="text-slate-600" />
                      <p className="font-bold text-sm text-slate-300">Bài học này chưa có link video hợp lệ</p>
                      <p className="text-xs text-slate-500">Quản trị viên đang cập nhật video cho bài này.</p>
                    </div>
                  );
                }

                if (info.type === "direct") {
                  return (
                    <video
                      key={info.embedUrl}
                      src={info.embedUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                }

                return (
                  <iframe
                    key={info.embedUrl}
                    src={info.embedUrl}
                    title={previewLesson.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              })()}
            </div>

            {/* Modal Body & Notes */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-900/60">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ghi Chú & Tóm Tắt Bài Giảng
              </h5>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 whitespace-pre-wrap">
                {previewLesson.content || "Bài giảng chưa có tài liệu ghi chú đính kèm. Vui lòng theo dõi video hướng dẫn chi tiết."}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
              <button
                onClick={() => setPreviewLesson(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <Link
                href={`/learn?lessonId=${previewLesson.id}`}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand hover:bg-brand-hover shadow-md shadow-brand/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <GraduationCap size={15} />
                <span>Mở Trong Trình Học Chuyên Sâu</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
