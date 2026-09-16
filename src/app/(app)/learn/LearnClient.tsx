"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import {
  PlayCircle,
  Lock,
  CheckCircle2,
  Crown,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  FileText,
  ShieldCheck,
  Check,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseVideoUrl } from "@/lib/video";
import { saveLessonPlayback, toggleLessonProgress } from "@/app/actions/learn";

export interface ClientLesson {
  id: string;
  title: string;
  fullTitle?: string;
  moduleName?: string;
  content: string | null;
  videoUrl: string | null;
  order: number;
  isVIP: boolean;
  positionSeconds?: number;
}


export interface Module {
  moduleTitle: string;
  lessons: ClientLesson[];
}

export interface LearnCourseItem {
  id: string;
  title: string;
  lessonsCount: number;
  firstLessonId?: string;
}

interface LearnClientProps {
  modules: Module[];
  isUserVIP: boolean;
  isLogged: boolean;
  initialCompletedLessonIds: string[];
  courseTitle: string;
  currentCourseId?: string;
  courses?: LearnCourseItem[];
  initialLessonId?: string;
}

export default function LearnClient({
  modules,
  isUserVIP,
  isLogged,
  initialCompletedLessonIds,
  courseTitle,
  currentCourseId,
  courses,
  initialLessonId,
}: LearnClientProps) {
  const router = useRouter();
  // Tìm bài học đầu tiên
  const allLessons = useMemo(() => {
    return modules.flatMap((m) => m.lessons);
  }, [modules]);

  const [activeLessonId, setActiveLessonId] = useState(initialLessonId || allLessons[0]?.id || "");
  const activeLesson = allLessons.find((lesson) => lesson.id === activeLessonId)
    || allLessons.find((lesson) => lesson.id === initialLessonId)
    || allLessons[0]
    || null;

  const handleSelectLesson = (lesson: ClientLesson) => {
    setActiveLessonId(lesson.id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/learn?lessonId=${lesson.id}`);
    }
  };

  const [completedIds, setCompletedIds] = useState<string[]>(initialCompletedLessonIds);
  const [isPending, startTransition] = useTransition();
  const lastSavedSecondRef = useRef(0);

  if (!activeLesson) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto my-12">
        <BookOpen size={48} className="mx-auto mb-3 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-800">Chưa có bài học nào trong khóa học này</h3>
        <p className="text-sm text-slate-400 mt-1">Quản trị viên vui lòng thêm bài học tại trang Admin.</p>
      </div>
    );
  }

  // Quyền xem bài học: Nếu bài FREE -> xem được. Nếu bài VIP -> phải là VIP
  const canWatch = !activeLesson.isVIP || isUserVIP;

  // Video info
  const videoInfo = parseVideoUrl(activeLesson.videoUrl);

  // Trạng thái hoàn thành của bài hiện tại
  const isCurrentCompleted = completedIds.includes(activeLesson.id);

  // Vị trí bài học trong toàn bộ danh sách để hỗ trợ nút Bài Trước / Bài Kế Tiếp
  const currentIndex = allLessons.findIndex((l) => l.id === activeLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Tính % tiến độ hoàn thành khóa học (chỉ tính các bài học thuộc khóa học đang xem)
  const totalLessonsCount = allLessons.length;
  const courseLessonIds = new Set(allLessons.map((l) => l.id));
  const completedCount = completedIds.filter((id) => courseLessonIds.has(id)).length;
  const progressPercent =
    totalLessonsCount > 0
      ? Math.min(100, Math.round((completedCount / totalLessonsCount) * 100))
      : 0;

  // Xử lý đánh dấu hoàn thành bài học
  const handleToggleComplete = () => {
    if (!canWatch) return;
    if (!isLogged) {
      alert("Vui lòng đăng nhập để lưu tiến độ học tập!");
      return;
    }

    const nextCompleted = !isCurrentCompleted;

    // Optimistic UI update
    setCompletedIds((prev) =>
      nextCompleted ? [...prev, activeLesson.id] : prev.filter((id) => id !== activeLesson.id)
    );

    startTransition(async () => {
      const res = await toggleLessonProgress(activeLesson.id, nextCompleted);
      if (!res.success) {
        // Rollback nếu lỗi
        setCompletedIds((prev) =>
          isCurrentCompleted ? [...prev, activeLesson.id] : prev.filter((id) => id !== activeLesson.id)
        );
        alert(res.error || "Không thể lưu tiến độ học");
      }
    });
  };

  const persistPlayback = (video: HTMLVideoElement, force = false) => {
    if (!isLogged || !activeLesson || !canWatch) return;
    const second = Math.max(0, Math.floor(video.currentTime || 0));
    if (!force && second - lastSavedSecondRef.current < 15) return;
    lastSavedSecondRef.current = second;
    void saveLessonPlayback(activeLesson.id, second, Number.isFinite(video.duration) ? video.duration : null);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto pb-12">
      {/* VÙNG BÊN TRÁI: KHUNG PHÁT VIDEO & NỘI DUNG BÀI HỌC */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Khung Trình Phát Video */}
        <div className="bg-slate-950 rounded-2xl aspect-video overflow-hidden relative shadow-xl border border-slate-800">
          {!canWatch ? (
            /* =================== PAYWALL OVERLAY KHI LÀ BÀI VIP VÀ CHƯA NÂNG CẤP =================== */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-center p-6 sm:p-10 z-20 overflow-y-auto">
              {/* Vòng hào quang vương miện */}
              <div className="relative mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.5)] animate-pulse">
                  <Crown size={36} className="text-white fill-white" />
                </div>
                <div className="absolute -inset-2 bg-amber-500/20 rounded-full blur-xl -z-10"></div>
              </div>

              {/* Huy hiệu VIP */}
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest mb-3">
                <Lock size={12} /> Nội Dung Dành Riêng Cho Khách VIP
              </span>

              {/* Tiêu đề & Thông điệp chuyển đổi */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white max-w-xl leading-tight mb-2">
                Mở Khóa Toàn Bộ Lộ Trình & Video Chuyên Sâu
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-lg mb-6 leading-relaxed">
                Bài học &ldquo;<span className="text-amber-400 font-bold">{activeLesson.fullTitle || activeLesson.title}</span>&rdquo; thuộc hệ thống kiến thức nâng cao. Nâng cấp tài khoản VIP ngay hôm nay để làm chủ toàn bộ bài giảng và các siêu công cụ AI!
              </p>

              {/* Danh sách quyền lợi VIP vắn tắt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full mb-6 text-left">
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
                  <ShieldCheck size={16} className="text-amber-400 shrink-0" />
                  <span>Xem 100% video VIP không giới hạn</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
                  <Sparkles size={16} className="text-amber-400 shrink-0" />
                  <span>Tặng 1.000 Credits sử dụng AI</span>
                </div>
              </div>

              {/* Nút Kêu Gọi Nâng Cấp VIP */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/profile#pricing-section"
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-8 py-3.5 rounded-xl text-sm sm:text-base transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Crown size={18} className="fill-slate-950" />
                  Nâng Cấp VIP Ngay
                </Link>

                {!isLogged && (
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Đã có tài khoản VIP? Đăng nhập
                  </Link>
                )}
              </div>
            </div>
          ) : videoInfo.embedUrl ? (
            /* =================== VIDEO PLAYER THỰC TẾ (KHI ĐỦ QUYỀN) =================== */
            videoInfo.type === "direct" ? (
              <video
                key={activeLesson.id}
                src={videoInfo.embedUrl}
                controls
                autoPlay
                onLoadedMetadata={(event) => {
                  const saved = activeLesson.positionSeconds || 0;
                  if (saved > 0 && saved < event.currentTarget.duration - 3) event.currentTarget.currentTime = saved;
                  lastSavedSecondRef.current = saved;
                }}
                onTimeUpdate={(event) => persistPlayback(event.currentTarget)}
                onPause={(event) => persistPlayback(event.currentTarget, true)}
                onEnded={(event) => persistPlayback(event.currentTarget, true)}
                className="w-full h-full object-contain"
              />
            ) : (
              <iframe
                key={activeLesson.id}
                src={videoInfo.embedUrl}
                title={activeLesson.fullTitle || activeLesson.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )
          ) : (
            /* Khung thông báo khi bài học chưa gắn link video */
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <Video size={56} className="mb-3 opacity-40 text-slate-500" />
              <h3 className="text-lg font-bold text-white mb-1">Video đang được cập nhật</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Quản trị viên đang chuẩn bị nội dung video chất lượng cao cho bài học này. Bạn có thể xem phần tóm tắt và tài liệu bên dưới!
              </p>
            </div>
          )}
        </div>

        {/* Thông Tin Chi Tiết & Nút Thao Tác Bài Học */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          {/* Header Bài Học */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black px-2.5 py-1 rounded-lg">
                  Bài #{activeLesson.order}
                </span>

                {activeLesson.isVIP ? (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-black px-3 py-1 rounded-lg shadow-sm shadow-amber-500/20">
                    <Crown size={13} className="fill-white" /> VIP PRO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                    <Sparkles size={12} /> BÀI HỌC FREE
                  </span>
                )}

                {isCurrentCompleted && (
                  <span className="inline-flex items-center gap-1 bg-brand-light text-brand text-xs font-bold px-2.5 py-1 rounded-lg border border-brand/20">
                    <CheckCircle2 size={13} /> Đã hoàn thành
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {activeLesson.fullTitle || activeLesson.title}
              </h1>
            </div>

            {/* Nút Đánh dấu Hoàn thành */}
            <button
              onClick={handleToggleComplete}
              disabled={isPending || !canWatch}
              className={`shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                isCurrentCompleted
                  ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/30"
                  : "bg-brand hover:bg-brand-hover text-white shadow-md shadow-brand/20"
              }`}
            >
              {isCurrentCompleted ? (
                <>
                  <Check size={16} /> Đã Hoàn Thành
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Đánh Dấu Hoàn Thành
                </>
              )}
            </button>
          </div>

          {/* Nội Dung Tóm Tắt / Tài Liệu Bài Giảng */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <FileText size={14} /> Ghi Chú & Tóm Tắt Bài Học
            </h3>
            <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50/80 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
              {activeLesson.content || "Nội dung bài học đang được hoàn thiện. Vui lòng theo dõi video bài giảng."}
            </div>
          </div>

          {/* Điều Hướng Bài Trước / Bài Kế Tiếp */}
          {(prevLesson || nextLesson) && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              {prevLesson ? (
                <button
                  onClick={() => handleSelectLesson(prevLesson)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    Bài trước: #{prevLesson.order}
                  </span>
                </button>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <button
                  onClick={() => handleSelectLesson(nextLesson)}
                  className="flex items-center gap-2 text-xs font-bold text-brand hover:text-brand-hover px-3 py-2 rounded-lg hover:bg-brand-light transition-colors cursor-pointer ml-auto"
                >
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    Bài kế: #{nextLesson.order}
                  </span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <div />
              )}
            </div>
          )}
        </div>
      </div>

      {/* VÙNG BÊN PHẢI: PLAYLIST / DANH SÁCH BÀI HỌC CỦA KHÓA HỌC */}
      <div className="lg:w-[380px] xl:w-[430px] shrink-0">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col lg:max-h-[calc(100vh-100px)] h-fit lg:sticky lg:top-6">
          {/* Header Playlist & Thanh Tiến Độ Học */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
            {courses && courses.length > 1 ? (
              <div className="mb-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Khóa học hiện tại:
                  </span>
                  {isUserVIP ? (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                      <Crown size={10} className="fill-amber-600 text-amber-600" /> VIP PRO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      FREE
                    </span>
                  )}
                </div>
                <select
                  value={currentCourseId}
                  onChange={(e) => {
                    const selected = courses.find((c) => c.id === e.target.value);
                    if (selected?.firstLessonId) {
                      router.push(`/learn?lessonId=${selected.firstLessonId}`);
                    } else if (selected?.id) {
                      router.push(`/learn?courseId=${selected.id}`);
                    }
                  }}
                  className="w-full bg-brand-light border border-brand/30 text-brand text-xs font-bold rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-brand/20 cursor-pointer truncate shadow-2xs hover:border-brand transition-colors"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      🎓 {c.title} ({c.lessonsCount} bài)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-black text-base text-slate-900 dark:text-white line-clamp-1">{courseTitle}</h2>
                {isUserVIP ? (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                    <Crown size={10} className="fill-amber-600 text-amber-600" /> VIP
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                )}
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className="bg-brand h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
              <span>
                Đã học: <strong>{completedCount}</strong>/{totalLessonsCount} bài
              </span>
              <span className="font-bold text-brand">{progressPercent}% Hoàn thành</span>
            </div>
          </div>

          {/* Danh Sách Các Module và Bài Học */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {modules.map((module, mIdx) => (
              <div key={mIdx}>
                <div className="flex items-center justify-between px-2 py-1.5 mb-1 bg-slate-100/60 dark:bg-slate-800/60 rounded-lg">
                  <span className="font-black text-xs text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {module.moduleTitle}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {module.lessons.length} bài
                  </span>
                </div>

                <ul className="space-y-1">
                  {module.lessons.map((lesson) => {
                    const isActive = activeLesson.id === lesson.id;
                    const isLessonCompleted = completedIds.includes(lesson.id);
                    const canAccessThis = !lesson.isVIP || isUserVIP;

                    return (
                      <li key={lesson.id}>
                        <button
                          onClick={() => handleSelectLesson(lesson)}
                          className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl transition-all cursor-pointer ${
                            isActive
                              ? "bg-brand-light border border-brand/30 shadow-xs"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent"
                          }`}
                        >
                          {/* STT hoặc Trạng thái hoàn thành */}
                          <div className="relative shrink-0 mt-0.5">
                            {isLessonCompleted ? (
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
                                <Check size={14} />
                              </div>
                            ) : (
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                  isActive
                                    ? "bg-brand text-white shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                }`}
                              >
                                #{lesson.order}
                              </div>
                            )}
                          </div>

                          {/* Tiêu đề & Badges */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-bold leading-snug line-clamp-2 ${
                                isActive ? "text-brand" : "text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {lesson.title}
                            </p>

                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {lesson.isVIP ? (
                                canAccessThis ? (
                                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                                    <Crown size={9} className="fill-white" /> VIP (Đã mở)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-slate-900 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/30">
                                    <Lock size={9} /> VIP (Khóa)
                                  </span>
                                )
                              ) : (
                                <span className="inline-block bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30">
                                  FREE
                                </span>
                              )}

                              {lesson.videoUrl && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                  <PlayCircle size={10} /> Video
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
