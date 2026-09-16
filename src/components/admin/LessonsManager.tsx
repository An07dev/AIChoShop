"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  BookOpen,
  Crown,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Filter,
  Layers,
  Video,
  Film,
  RotateCcw,
  UploadCloud,
  Loader2,
  Link2,
  GraduationCap,
  FolderPlus,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  createLesson,
  updateLesson,
  deleteLesson,
  toggleLessonVip,
  restoreDefaultLessons,
  createCourse,
  setLessonStatus,
  cleanupOrphanMedia,
} from "@/app/admin/lessons/actions";
import { parseVideoUrl } from "@/lib/video";
import type { LearningContentStatus } from "@/lib/learning/policy";


export interface AdminLessonItem {
  id: string;
  title: string;
  moduleName: string;
  content: string | null;
  videoUrl: string | null;
  order: number;
  isVIP: boolean;
  status: LearningContentStatus;
  durationSeconds: number | null;
  mediaAssetId: string | null;
  createdAt: Date | string;
  course: {
    id: string;
    title: string;
  };
}

export interface AdminCourseItem {
  id: string;
  title: string;
}

interface LessonsManagerProps {
  initialLessons: AdminLessonItem[];
  courses: AdminCourseItem[];
}

export function LessonsManager({ initialLessons, courses }: LessonsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCourseId = searchParams.get("courseId");
  const [lessons, setLessons] = useState<AdminLessonItem[]>(initialLessons);
  const [coursesList, setCoursesList] = useState<AdminCourseItem[]>(courses);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    requestedCourseId && courses.some((course) => course.id === requestedCourseId)
      ? requestedCourseId
      : "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [vipFilter, setVipFilter] = useState<"all" | "vip" | "free">("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLessonItem | null>(null);
  const [previewVideoLesson, setPreviewVideoLesson] = useState<AdminLessonItem | null>(null);
  const [modalError, setModalError] = useState("");

  // Modal Tạo Khóa Học Mới
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [courseModalError, setCourseModalError] = useState("");
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  // Form State (dùng chung cho Add & Edit)
  const [formData, setFormData] = useState({
    title: "",
    moduleName: "Phần 1",
    customModuleName: "",
    isCustomModule: false,
    content: "",
    videoUrl: "",
    order: 1,
    isVIP: false,
    status: "DRAFT" as LearningContentStatus,
    durationSeconds: 0,
    mediaAssetId: null as string | null,
    courseId: courses[0]?.id || "",
  });

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Video Upload States
  const [videoMode, setVideoMode] = useState<"upload" | "url">("upload");
  const [isUploading, setIsUploading] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const selectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModule("all");
    const params = new URLSearchParams(searchParams.toString());
    if (courseId === "all") params.delete("courseId");
    else params.set("courseId", courseId);
    const query = params.toString();
    router.replace(query ? `/admin/lessons?${query}` : "/admin/lessons", { scroll: false });
  };


  // Danh sách các Module lấy từ field moduleName của các bài học
  const allModules = useMemo(() => {
    const modulesSet = new Set<string>();
    const relevantLessons =
      selectedCourseId === "all"
        ? lessons
        : lessons.filter((l) => l.course?.id === selectedCourseId);

    relevantLessons.forEach((l) => {
      if (l.moduleName && l.moduleName.trim()) {
        modulesSet.add(l.moduleName.trim());
      }
    });
    if (modulesSet.size === 0) {
      modulesSet.add("Phần 1");
      modulesSet.add("Phần 2");
      modulesSet.add("Phần 3");
      modulesSet.add("Phần 4");
      modulesSet.add("Phần 5");
    }
    return Array.from(modulesSet);
  }, [lessons, selectedCourseId]);

  // Thống kê KPIs
  const stats = useMemo(() => {
    const total = lessons.length;
    const vipCount = lessons.filter((l) => l.isVIP).length;
    const freeCount = total - vipCount;
    const vipPercent = total > 0 ? Math.round((vipCount / total) * 100) : 0;
    const withVideoCount = lessons.filter((l) => l.videoUrl && l.videoUrl.trim()).length;

    return { total, vipCount, freeCount, vipPercent, withVideoCount, moduleCount: allModules.length };
  }, [lessons, allModules]);

  // Lọc bài học
  const filteredLessons = useMemo(() => {
    return lessons
      .filter((lesson) => {
        // Lọc theo Khóa học
        const matchCourse =
          selectedCourseId === "all" || lesson.course?.id === selectedCourseId;

        // Tìm kiếm theo tên bài, nội dung, khóa học hoặc STT
        const matchSearch =
          !searchTerm.trim() ||
          lesson.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
          (lesson.content && lesson.content.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
          (lesson.course?.title && lesson.course.title.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
          String(lesson.order).includes(searchTerm.trim());

        // Lọc VIP
        const matchVip =
          vipFilter === "all" ||
          (vipFilter === "vip" && lesson.isVIP) ||
          (vipFilter === "free" && !lesson.isVIP);

        // Lọc theo Module
        const matchModule =
          selectedModule === "all" ||
          lesson.moduleName === selectedModule;

        return matchCourse && matchSearch && matchVip && matchModule;
      })
      .sort((a, b) => a.order - b.order);
  }, [lessons, searchTerm, vipFilter, selectedModule, selectedCourseId]);

  // Bật Modal Thêm Mới
  const handleOpenAddModal = () => {
    // Nếu đang chọn lọc theo 1 khóa học cụ thể thì chọn khóa học đó, ngược lại lấy khóa học đầu tiên
    const targetCourseId =
      selectedCourseId !== "all" ? selectedCourseId : coursesList[0]?.id || "";

    const lessonsInCourse = lessons.filter((l) => l.course?.id === targetCourseId);
    const maxOrder = lessonsInCourse.reduce((max, l) => (l.order > max ? l.order : max), 0);

    setVideoMode("upload");
    setFormData({
      title: "",
      moduleName: allModules[0] || "Phần 1",
      customModuleName: "",
      isCustomModule: false,
      content: "",
      videoUrl: "",
      order: maxOrder + 1,
      isVIP: false,
      status: "DRAFT",
      durationSeconds: 0,
      mediaAssetId: null,
      courseId: targetCourseId,
    });
    setModalError("");
    setShowAddModal(true);
  };

  // Tạo khóa học mới
  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) {
      setCourseModalError("Vui lòng nhập tên khóa học");
      return;
    }

    setIsCreatingCourse(true);
    setCourseModalError("");

    try {
      const res = await createCourse({
        title: newCourseTitle.trim(),
        description: newCourseDesc.trim() || undefined,
      });

      if (res.success && res.course) {
        const newCourse: AdminCourseItem = {
          id: res.course.id,
          title: res.course.title,
        };
        setCoursesList((prev) => [...prev, newCourse]);
        selectCourse(newCourse.id);
        setShowCourseModal(false);
        setNewCourseTitle("");
        setNewCourseDesc("");
        showToast(`Đã tạo khóa học mới "${newCourse.title}" thành công!`);
      } else {
        setCourseModalError(res.error || "Không thể tạo khóa học mới");
      }
    } catch {
      setCourseModalError("Lỗi kết nối khi tạo khóa học");
    } finally {
      setIsCreatingCourse(false);
    }
  };

  // Bật Modal Chỉnh Sửa
  const handleOpenEditModal = (lesson: AdminLessonItem) => {
    setEditingLesson(lesson);
    const isExisting = allModules.includes(lesson.moduleName);
    const isLocalFile = lesson.videoUrl?.startsWith("/uploads/") || lesson.videoUrl?.startsWith("/api/media/");
    setVideoMode(isLocalFile ? "upload" : "url");
    setFormData({
      title: lesson.title,
      moduleName: isExisting ? lesson.moduleName : allModules[0] || "Phần 1",
      customModuleName: isExisting ? "" : lesson.moduleName,
      isCustomModule: !isExisting,
      content: lesson.content || "",
      videoUrl: lesson.videoUrl || "",
      order: lesson.order,
      isVIP: lesson.isVIP,
      status: lesson.status,
      durationSeconds: lesson.durationSeconds || 0,
      mediaAssetId: lesson.mediaAssetId,
      courseId: lesson.course.id,
    });
    setModalError("");
  };

  // Xử lý Upload Video từ máy tính lên Server
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setModalError("File video quá lớn (tối đa 100MB). Vui lòng chọn file nhỏ hơn hoặc nén video.");
      return;
    }

    setIsUploading(true);
    setModalError("");

    try {
      const uploadData = new FormData();
      uploadData.append("video", file);

      const res = await fetch("/api/upload/video", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setFormData((prev) => ({ ...prev, videoUrl: data.url, mediaAssetId: data.mediaAssetId || null }));
        showToast(`Đã tải lên video "${file.name}" thành công!`);
      } else {
        setModalError(data.error || "Không thể tải video lên server");
      }
    } catch {
      setModalError("Lỗi kết nối khi tải video lên server");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTogglePublished = (lesson: AdminLessonItem) => {
    const status: LearningContentStatus = lesson.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
    startTransition(async () => {
      const res = await setLessonStatus(lesson.id, status);
      if (res.success) {
        setLessons(prev => prev.map(item => item.id === lesson.id ? { ...item, status } : item));
        showToast(status === "PUBLISHED" ? "Đã xuất bản bài học." : "Đã ẩn bài học.");
      } else showToast(res.error || "Không thể đổi trạng thái bài học.", "error");
    });
  };

  // Xử lý bật/tắt VIP 1-click
  const handleToggleVip = (lesson: AdminLessonItem) => {
    const newVip = !lesson.isVIP;

    // Optimistic UI update
    setLessons((prev) =>
      prev.map((l) => (l.id === lesson.id ? { ...l, isVIP: newVip } : l))
    );

    startTransition(async () => {
      const res = await toggleLessonVip(lesson.id, newVip);
      if (res.success) {
        showToast(
          newVip
            ? `Đã chuyển bài #${lesson.order} sang chế độ VIP PRO 👑`
            : `Đã mở bài #${lesson.order} thành bài học FREE`
        );
      } else {
        // Rollback
        setLessons((prev) =>
          prev.map((l) => (l.id === lesson.id ? { ...l, isVIP: lesson.isVIP } : l))
        );
        showToast(res.error || "Có lỗi xảy ra", "error");
      }
    });
  };

  // Xóa bài học
  const handleDeleteLesson = (lesson: AdminLessonItem) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa bài học "#${lesson.order}: ${lesson.title}"? Dữ liệu tiến độ học tập của bài này cũng sẽ bị xóa.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteLesson(lesson.id);
      if (res.success) {
        setLessons((prev) =>
          prev
            .filter((item) => item.id !== lesson.id)
            .map((item) =>
              item.course.id === lesson.course.id && item.order > lesson.order
                ? { ...item, order: item.order - 1 }
                : item
            )
        );
        showToast(`Đã xóa bài học #${lesson.order} thành công!`);
      } else {
        showToast(res.error || "Không thể xóa bài học", "error");
      }
    });
  };

  // Khôi phục 25 bài học mẫu chuẩn
  const handleRestoreDefault = () => {
    if (
      !confirm(
        "Bạn có chắc muốn khôi phục lại các bài học mẫu chuẩn của khóa học (25 bài)? Các bài đã bị xóa sẽ được tạo lại tự động."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await restoreDefaultLessons();
      if (res.success) {
        showToast(`Đã khôi phục thành công ${res.restoredCount} bài học! Trang sẽ tải lại.`);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showToast(res.error || "Không thể khôi phục dữ liệu", "error");
      }
    });
  };

  const handleCleanupMedia = () => {
    if (!confirm("Dọn các video đã tải lên hơn 24 giờ nhưng không còn gắn với bài học nào?")) return;
    startTransition(async () => {
      const res = await cleanupOrphanMedia();
      showToast(res.success ? `Đã dọn ${res.removed} video không còn sử dụng.` : "Không thể dọn video.", res.success ? "success" : "error");
    });
  };


  // Submit form Thêm mới
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!formData.title.trim()) {
      setModalError("Vui lòng nhập tên bài học");
      return;
    }

    const finalModuleName = formData.isCustomModule
      ? formData.customModuleName.trim()
      : formData.moduleName.trim();

    if (!finalModuleName) {
      setModalError("Vui lòng chọn hoặc nhập tên Phần (Module) cho bài học");
      return;
    }

    startTransition(async () => {
      const res = await createLesson({
        ...formData,
        moduleName: finalModuleName,
        order: Number(formData.order),
      });

      if (res.success && res.lesson) {
        const course = coursesList.find((c) => c.id === formData.courseId) || coursesList[0] || { id: "1", title: "Khóa học" };
        const createdItem: AdminLessonItem = {
          ...res.lesson,
          moduleName: res.lesson.moduleName || finalModuleName,
          course: { id: course.id, title: course.title },
          createdAt: res.lesson.createdAt || new Date(),
        };

        setLessons((prev) => [
          ...prev.map((item) =>
            item.course.id === createdItem.course.id && item.order >= createdItem.order
              ? { ...item, order: item.order + 1 }
              : item
          ),
          createdItem,
        ]);
        setShowAddModal(false);
        showToast(`Đã thêm bài học "${formData.title}" vào ${finalModuleName} thành công!`);
      } else {
        setModalError(res.error || "Lỗi khi tạo bài học mới");
      }
    });
  };

  // Submit form Chỉnh sửa
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    setModalError("");

    if (!formData.title.trim()) {
      setModalError("Vui lòng nhập tên bài học");
      return;
    }

    const finalModuleName = formData.isCustomModule
      ? formData.customModuleName.trim()
      : formData.moduleName.trim();

    if (!finalModuleName) {
      setModalError("Vui lòng chọn hoặc nhập tên Phần (Module) cho bài học");
      return;
    }

    startTransition(async () => {
      const res = await updateLesson(editingLesson.id, {
        ...formData,
        moduleName: finalModuleName,
        order: Number(formData.order),
      });

      if (res.success && res.lesson) {
        const course = coursesList.find((c) => c.id === formData.courseId) || editingLesson.course;
        const oldCourseId = editingLesson.course.id;
        const newCourseId = course.id;
        const oldOrder = editingLesson.order;
        const newOrder = res.lesson.order;
        setLessons((prev) => prev.map((item) => {
          if (item.id === editingLesson.id) {
            return {
              ...item,
              ...res.lesson,
              moduleName: res.lesson.moduleName || finalModuleName,
              course: { id: course.id, title: course.title },
            };
          }
          if (oldCourseId === newCourseId && item.course.id === oldCourseId) {
            if (newOrder < oldOrder && item.order >= newOrder && item.order < oldOrder) return { ...item, order: item.order + 1 };
            if (newOrder > oldOrder && item.order > oldOrder && item.order <= newOrder) return { ...item, order: item.order - 1 };
          }
          if (oldCourseId !== newCourseId) {
            if (item.course.id === oldCourseId && item.order > oldOrder) return { ...item, order: item.order - 1 };
            if (item.course.id === newCourseId && item.order >= newOrder) return { ...item, order: item.order + 1 };
          }
          return item;
        }));
        setEditingLesson(null);
        showToast(`Đã cập nhật bài học #${formData.order} thành công!`);
      } else {
        setModalError(res.error || "Lỗi khi cập nhật bài học");
      }
    });
  };

  // Live video preview info for modal
  const formVideoInfo = useMemo(() => {
    return parseVideoUrl(formData.videoUrl);
  }, [formData.videoUrl]);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-4">
      {/* Toast thông báo nổi */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-sm font-semibold text-white animate-bounce duration-300 ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Tiêu đề trang Quản lý Nội dung Khóa học */}
      <AdminPageHeader
        title="Quản Lý Nội Dung Khóa Học & Video"
        subtitle="Tổ chức học phần, gán link video YouTube/Vimeo, và phân quyền bài học FREE hoặc VIP cho học viên."
        icon={BookOpen}
        iconGradient="from-emerald-600 to-teal-600"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            {stats.total} bài giảng ({stats.vipCount} VIP)
          </span>
        }
      />

      {/* 4 Thẻ Thống Kê KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
        {/* Tổng số bài học */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Tổng Số Bài Học
            </span>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <span className="text-xs text-slate-400 mt-1 block">Trong {stats.moduleCount || 1} phần lộ trình</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen size={24} />
          </div>
        </div>

        {/* Bài học VIP PRO */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-amber-200 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Crown size={14} className="text-amber-500 fill-amber-500" /> Bài Học VIP PRO
            </span>
            <div className="text-2xl font-black text-amber-600">{stats.vipCount}</div>
            <span className="text-xs text-amber-700/80 mt-1 block font-semibold">
              Chiếm {stats.vipPercent}% khóa học
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center relative z-10">
            <Crown size={24} />
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-200/30 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Bài học FREE */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Sparkles size={14} className="text-emerald-500" /> Bài Học FREE
            </span>
            <div className="text-2xl font-black text-emerald-600">{stats.freeCount}</div>
            <span className="text-xs text-emerald-700/80 mt-1 block">Mọi thành viên đều xem được</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles size={24} />
          </div>
        </div>

        {/* Đã gắn Video */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Video size={14} className="text-blue-500" /> Đã Gắn Video
            </span>
            <div className="text-2xl font-black text-slate-900">{stats.withVideoCount}</div>
            <span className="text-xs text-slate-400 mt-1 block">
              {stats.total - stats.withVideoCount > 0
                ? `Còn ${stats.total - stats.withVideoCount} bài chưa có link`
                : "100% đã có video"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <PlayCircle size={24} />
          </div>
        </div>
      </div>

      {/* Thanh Tìm Kiếm, Bộ Lọc & Nút Thêm Mới */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-3.5 shadow-sm space-y-2.5 shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tìm kiếm */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên bài học, nội dung hoặc STT..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Nút Khôi phục dữ liệu gốc nếu cần */}
            <button
              onClick={handleRestoreDefault}
              disabled={isPending}
              title="Khôi phục lại 25 bài học mẫu chuẩn nếu lỡ xóa nhầm"
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <RotateCcw size={14} className={isPending ? "animate-spin" : ""} />
              <span>Khôi Phục Bài Mẫu</span>
            </button>
            <button
              onClick={handleCleanupMedia}
              disabled={isPending}
              title="Xóa video tải lên quá 24 giờ nhưng không gắn với bài học"
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Trash2 size={14} /> Dọn Video Thừa
            </button>

            {/* Nút Thêm Khóa Học Mới */}
            <button
              type="button"
              onClick={() => {
                setCourseModalError("");
                setNewCourseTitle("");
                setNewCourseDesc("");
                setShowCourseModal(true);
              }}
              title="Tạo thêm khóa học mới vào hệ thống"
              className="px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <FolderPlus size={15} />
              <span>+ Khóa Học Mới</span>
            </button>

            {/* Nút Thêm Bài Học Mới */}
            <button
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 text-sm"
            >
              <Plus size={16} /> + Thêm Bài Giảng
            </button>
          </div>
        </div>


        {/* Thanh chip bộ lọc nhanh */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Filter size={12} /> Lọc:
          </span>

          {/* Lọc theo Khóa học */}
          <div className="inline-flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-200/80 rounded-lg p-1 text-xs">
            <span className="text-indigo-700 font-bold px-1.5 flex items-center gap-1">
              <GraduationCap size={14} /> Khóa học:
            </span>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                selectCourse(e.target.value);
              }}
              className="bg-white border border-indigo-200 text-slate-800 font-bold rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer max-w-[200px] truncate"
            >
              <option value="all">Tất cả khóa học ({coursesList.length})</option>
              {coursesList.map((c) => {
                const count = lessons.filter((l) => l.course?.id === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.title} ({count} bài)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Lọc VIP */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setVipFilter("all")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${vipFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              onClick={() => setVipFilter("vip")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${vipFilter === "vip"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-amber-600 hover:text-amber-700"
                }`}
            >
              <Crown size={11} /> VIP ({stats.vipCount})
            </button>
            <button
              onClick={() => setVipFilter("free")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${vipFilter === "free"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-600 hover:text-emerald-700"
                }`}
            >
              <Sparkles size={11} />FREE ({stats.freeCount})
            </button>
          </div>

          {/* Lọc theo Module (Phần 1, 2,...) */}
          {allModules.length > 0 && (
            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-xs">
              <span className="text-slate-400 px-1.5 flex items-center gap-1">
                <Layers size={11} /> Phần:
              </span>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="bg-white border-0 text-slate-700 font-semibold rounded px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả các phần</option>
                {allModules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(searchTerm || vipFilter !== "all" || selectedModule !== "all" || selectedCourseId !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setVipFilter("all");
                selectCourse("all");
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng Danh Sách Bài Học (Chỉ cuộn trong bảng) */}
      <div className="flex-1 min-h-[260px] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 shadow-2xs">
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                <th className="p-3.5 sm:p-4 font-bold w-16 text-center bg-slate-50 sticky top-0">STT</th>
                <th className="p-3.5 sm:p-4 font-bold min-w-[150px] bg-slate-50 sticky top-0">Khóa Học</th>
                <th className="p-3.5 sm:p-4 font-bold min-w-[240px] bg-slate-50 sticky top-0">Tên bài học & Nội dung</th>
                <th className="p-3.5 sm:p-4 font-bold min-w-[160px] bg-slate-50 sticky top-0">Video Bài Giảng</th>
                <th className="p-3.5 sm:p-4 font-bold text-center min-w-[140px] bg-slate-50 sticky top-0">Chế Độ Phân Quyền</th>
                <th className="p-3.5 sm:p-4 font-bold text-right min-w-[150px] bg-slate-50 sticky top-0">Thao Tác Quản Trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLessons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">Không tìm thấy bài học nào phù hợp</p>
                    <p className="text-xs mt-1 text-slate-400">Thử thay đổi bộ lọc hoặc thêm bài học mới</p>
                  </td>
                </tr>
              ) : (
                filteredLessons.map((lesson) => {
                  const videoInfo = parseVideoUrl(lesson.videoUrl);
                  const hasVideo = !!videoInfo.embedUrl;

                  return (
                    <tr
                      key={lesson.id}
                      className={`hover:bg-slate-50/80 transition-colors ${lesson.isVIP ? "bg-amber-50/10" : ""
                        }`}
                    >
                      {/* Cột 1: STT */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 font-black text-xs text-slate-600">
                          #{lesson.order}
                        </span>
                      </td>

                      {/* Cột 2: Khóa Học (Lọc nhanh khi click) */}
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => selectCourse(lesson.course?.id || "all")}
                          title={`Click để lọc chỉ xem các bài của khóa "${lesson.course?.title}"`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all cursor-pointer group text-left max-w-[190px]"
                        >
                          <GraduationCap size={13} className="shrink-0 text-indigo-600 group-hover:scale-110 transition-transform" />
                          <span className="truncate">{lesson.course?.title || "Chưa gán"}</span>
                        </button>
                      </td>

                      {/* Cột 3: Tên & Nội dung & Học phần */}
                      <td className="p-4">
                        <div className="max-w-md">
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                              <Layers size={10} /> {lesson.moduleName || "Phần 1"}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${lesson.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : lesson.status === "DRAFT" ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                              {lesson.status === "PUBLISHED" ? "ĐÃ XUẤT BẢN" : lesson.status === "DRAFT" ? "BẢN NHÁP" : "ĐÃ ẨN"}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 line-clamp-2 leading-snug">
                            {lesson.title}
                          </div>
                          {lesson.content && (
                            <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {lesson.content}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: Video */}
                      <td className="p-4">
                        {hasVideo ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewVideoLesson(lesson)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all cursor-pointer border border-blue-200 active:scale-95"
                              title="Bấm để xem thử video này"
                            >
                              <PlayCircle size={14} className="text-blue-600" />
                              <span>Xem Thử</span>
                            </button>
                            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]" title={lesson.videoUrl || ""}>
                              {videoInfo.type === "youtube" ? "YouTube" : videoInfo.type === "vimeo" ? "Vimeo" : "Direct Video"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic flex items-center gap-1">
                            <Film size={13} /> Chưa gắn link
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Chế độ VIP */}
                      <td className="p-4 text-center">
                        {lesson.isVIP ? (
                          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-sm shadow-amber-500/20 tracking-wide">
                            <Crown size={12} className="fill-white" /> VIP PRO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                            <Sparkles size={12} /> FREE (Mở)
                          </span>
                        )}
                      </td>

                      {/* Cột 5: Thao tác */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleTogglePublished(lesson)}
                            disabled={isPending}
                            title={lesson.status === "PUBLISHED" ? "Ẩn bài học khỏi học viên" : "Xuất bản bài học"}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border ${lesson.status === "PUBLISHED" ? "bg-white text-slate-600 border-slate-200" : "bg-emerald-600 text-white border-emerald-600"}`}
                          >
                            {lesson.status === "PUBLISHED" ? "Ẩn" : "Xuất bản"}
                          </button>
                          {/* Nút Đổi VIP 1-click */}
                          <button
                            onClick={() => handleToggleVip(lesson)}
                            disabled={isPending}
                            title={lesson.isVIP ? "Hạ về bài học FREE" : "Nâng lên bài học VIP"}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm ${lesson.isVIP
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                              : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-amber-500/20"
                              }`}
                          >
                            <Crown size={13} className={lesson.isVIP ? "text-slate-500" : "fill-white"} />
                            <span>{lesson.isVIP ? "Hạ FREE" : "Lên VIP"}</span>
                          </button>

                          {/* Nút Chỉnh Sửa */}
                          <button
                            onClick={() => handleOpenEditModal(lesson)}
                            title="Chỉnh sửa thông tin & link video"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                          >
                            <Edit size={16} />
                          </button>

                          {/* Nút Xóa */}
                          <button
                            onClick={() => handleDeleteLesson(lesson)}
                            title="Xóa bài học"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Thêm Mới / Chỉnh Sửa Bài Học */}
      {(showAddModal || editingLesson) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            {/* Header Modal - Cố định ở đỉnh modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <BookOpen size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingLesson ? `Chỉnh Sửa Bài Học #${editingLesson.order}` : "Thêm Bài Giảng Mới"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingLesson(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form bọc toàn bộ Body cuộn + Footer cố định */}
            <form onSubmit={editingLesson ? handleEditSubmit : handleAddSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              {/* Nội dung form có thể cuộn độc lập */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {modalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Tên bài học */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên bài học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ví dụ: Bài 1: Sự chuyển dịch quyền lực khi dùng AI..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Chọn Học Phần (Phần của bài giảng) */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers size={14} className="text-indigo-600" />
                      Thuộc Học Phần (Phần / Module) <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Chọn phần có sẵn hoặc tạo phần mới
                    </span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={formData.isCustomModule ? "NEW_CUSTOM" : formData.moduleName}
                      onChange={(e) => {
                        if (e.target.value === "NEW_CUSTOM") {
                          setFormData({ ...formData, isCustomModule: true });
                        } else {
                          setFormData({
                            ...formData,
                            moduleName: e.target.value,
                            isCustomModule: false,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-800 bg-white cursor-pointer"
                    >
                      {allModules.map((m) => (
                        <option key={m} value={m}>
                          📂 {m}
                        </option>
                      ))}
                      <option value="NEW_CUSTOM">➕ Tạo phần mới...</option>
                    </select>

                    {formData.isCustomModule && (
                      <input
                        type="text"
                        required
                        autoFocus
                        value={formData.customModuleName}
                        onChange={(e) => setFormData({ ...formData, customModuleName: e.target.value })}
                        placeholder="Nhập tên phần mới (Ví dụ: Phần 6: Livestream...)"
                        className="w-full px-3 py-2 border border-indigo-300 bg-indigo-50/40 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-indigo-900"
                      />
                    )}
                  </div>
                </div>

                {/* Số thứ tự & Khóa học */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số thứ tự hiển thị (STT) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Khóa học</label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    >
                      {coursesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Checkbox Phân Quyền VIP */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 cursor-pointer">
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Xuất bản cho học viên</span>
                    <span className="text-[11px] text-slate-500">Tắt để lưu bản nháp; bản nháp không xuất hiện ở danh mục hoặc trình học.</span>
                  </div>
                  <input type="checkbox" checked={formData.status === "PUBLISHED"} onChange={e => setFormData({ ...formData, status: e.target.checked ? "PUBLISHED" : "DRAFT" })} className="w-4 h-4" />
                </label>

                {/* Checkbox Phân Quyền VIP */}
                <div
                  onClick={() => setFormData({ ...formData, isVIP: !formData.isVIP })}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${formData.isVIP
                    ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20"
                    : "bg-emerald-50/60 border-emerald-200"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${formData.isVIP ? "bg-amber-500 text-white" : "bg-emerald-100 text-emerald-700"
                        }`}
                    >
                      {formData.isVIP ? <Crown size={20} /> : <Sparkles size={20} />}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        {formData.isVIP ? "👑 BÀI HỌC VIP PRO (CẦN NÂNG CẤP VIP ĐỂ XEM)" : "✨ BÀI HỌC FREE (TẤT CẢ NGƯỜI DÙNG ĐỀU XEM ĐƯỢC)"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formData.isVIP
                          ? "Học viên tài khoản FREE sẽ bị khóa video và hiện màn hình mời nâng cấp VIP."
                          : "Tất cả học viên đăng ký đều có thể xem video bài giảng này."}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isVIP}
                    onChange={(e) => setFormData({ ...formData, isVIP: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer pointer-events-none"
                  />
                </div>

                {/* Khu vực Chọn & Tải Video Bài Giảng */}
                <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Video size={15} className="text-blue-600" />
                      Video Bài Giảng <span className="text-rose-500">*</span>
                    </label>

                    {/* Tab chọn cách nạp video: Tải từ máy tính vs Dán link */}
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-bold shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setVideoMode("upload")}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${videoMode === "upload"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        <UploadCloud size={13} /> Tải Từ Máy Tính
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoMode("url")}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${videoMode === "url"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        <Link2 size={13} /> Dán Link YouTube / Online
                      </button>
                    </div>
                  </div>

                  {videoMode === "upload" ? (
                    /* Khung Tải Video Từ Máy Tính */
                    <div className="space-y-2">
                      <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl p-5 bg-blue-50/40 hover:bg-blue-50/80 transition-all cursor-pointer group">
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="sr-only"
                        />

                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2 text-blue-600 py-3">
                            <Loader2 size={32} className="animate-spin" />
                            <span className="text-xs font-bold">Đang tải video lên server, vui lòng đợi...</span>
                            <span className="text-[11px] text-slate-500">File đang được lưu trực tiếp vào hệ thống</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-center py-2">
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <UploadCloud size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-800 mt-1">
                              Bấm để chọn file video từ máy tính của bạn
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Hỗ trợ file .mp4, .webm, .mov, .mkv (tối đa 500MB)
                            </span>
                            {formData.videoUrl && formData.videoUrl.startsWith("/uploads/") && (
                              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100/90 px-3 py-1 rounded-md border border-emerald-200">
                                <CheckCircle2 size={13} /> File hiện tại: {formData.videoUrl.split("/").pop()}
                              </span>
                            )}
                          </div>
                        )}
                      </label>
                    </div>
                  ) : (
                    /* Khung Dán Link Online */
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value, mediaAssetId: null })}
                        placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/... hoặc Vimeo"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium font-mono bg-white"
                      />
                      <p className="text-[11px] text-slate-400">
                        Hỗ trợ link YouTube (thường, rút gọn, shorts, embed), Vimeo, hoặc link direct .mp4 ngoài.
                      </p>
                    </div>
                  )}

                  {/* Khung Live Preview Video */}
                  {formVideoInfo.embedUrl ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-0.5">
                        <span className="flex items-center gap-1">
                          <PlayCircle size={13} className="text-blue-600" /> Xem trước video:
                        </span>
                        {formVideoInfo.type === "direct" && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono font-medium">
                            Video trực tiếp
                          </span>
                        )}
                      </div>
                      <div className="rounded-xl overflow-hidden border border-slate-300 bg-black h-56 sm:h-64 w-full flex items-center justify-center relative shadow-inner">
                        {formVideoInfo.type === "direct" ? (
                          <video
                            key={formVideoInfo.embedUrl}
                            src={formVideoInfo.embedUrl}
                            controls
                            className="w-full h-full max-h-56 sm:max-h-64 object-contain"
                          />
                        ) : (
                          <iframe
                            key={formVideoInfo.embedUrl}
                            src={formVideoInfo.embedUrl}
                            title="Video Preview"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )}
                      </div>
                    </div>
                  ) : formData.videoUrl.trim() ? (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>Không nhận diện được định dạng video. Hãy kiểm tra lại URL hoặc tải file MP4 lên.</span>
                    </div>
                  ) : null}
                </div>

                {/* Nội dung / Tóm tắt bài học */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tóm tắt & Tài liệu bài học (Markdown / Text)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Mô tả nội dung bài học, lưu ý quan trọng, đường link tài liệu đính kèm..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium leading-relaxed"
                  />
                </div>
              </div>

              {/* Footer Buttons - Cố định ở đáy modal */}
              <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/90 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingLesson(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isPending ? "Đang xử lý..." : editingLesson ? "Cập Nhật Bài Học" : "Lưu Bài Giảng Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Xem Nhanh Video (Preview Player) */}
      {previewVideoLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-950 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-800">
            <div className="p-4 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-600 text-white">
                  <PlayCircle size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    #{previewVideoLesson.order}: {previewVideoLesson.title}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {previewVideoLesson.isVIP ? "👑 Bài học VIP" : "✨ Bài học FREE"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewVideoLesson(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="aspect-video w-full max-h-[75vh] bg-black relative flex items-center justify-center">
              {(() => {
                const info = parseVideoUrl(previewVideoLesson.videoUrl);
                if (!info.embedUrl) {
                  return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                      <Film size={48} className="mb-2 opacity-50" />
                      <p className="font-bold">Bài học này chưa có URL video hợp lệ</p>
                    </div>
                  );
                }

                if (info.type === "direct") {
                  return (
                    <video
                      src={info.embedUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                }

                return (
                  <iframe
                    src={info.embedUrl}
                    title={previewVideoLesson.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tạo Khóa Học Mới */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Thêm Khóa Học Mới</h3>
                  <p className="text-xs text-slate-500">Tạo khóa học để phân loại và quản lý các bài giảng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCourseSubmit}>
              <div className="p-6 space-y-4">
                {courseModalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{courseModalError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên khóa học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    placeholder="Ví dụ: Khóa học AI Bán Hàng Shopee / TikTok..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mô tả khóa học (tùy chọn)
                  </label>
                  <textarea
                    rows={3}
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                    placeholder="Mô tả tóm tắt nội dung, kiến thức học viên nhận được..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium leading-relaxed"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/90">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCourse}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 cursor-pointer active:scale-95 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isCreatingCourse ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang tạo khóa học...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      <span>Tạo Khóa Học</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
