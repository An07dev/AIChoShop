"use client";

import { useState, useMemo, useTransition, useEffect, useRef, type ReactNode } from "react";
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
  FolderPlus,
  Copy,
  ExternalLink,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAdminMutation } from "@/hooks/useAdminMutation";
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
  maxOrder?: number;
}

export interface VideoSampleTemplate {
  id: string;
  title: string;
  platform: "youtube" | "vimeo" | "direct";
  url: string;
  duration: string;
  category: string;
  description: string;
}

export const SAMPLE_VIDEO_TEMPLATES: VideoSampleTemplate[] = [
  {
    id: "sample-yt-1",
    title: "Tổng Quan AI Bán Hàng E-Commerce & Xu Hướng 2026",
    platform: "youtube",
    url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    duration: "12:45",
    category: "Phần 1: Nhập Môn & Tư Duy",
    description: "Video mẫu YouTube bài mở đầu tổng quan cách AI thay đổi cuộc chơi bán hàng đa kênh trên Shopee & TikTok.",
  },
  {
    id: "sample-yt-2",
    title: "Kỹ Thuật Viết Prompt & Tạo Ảnh Studio Sản Phẩm",
    platform: "youtube",
    url: "https://www.youtube.com/watch?v=aircAruvnKk",
    duration: "18:20",
    category: "Phần 3: Visual & Thiết Kế",
    description: "Video mẫu YouTube kỹ thuật prompt Midjourney dựng bối cảnh studio chuyên nghiệp cho sản phẩm.",
  },
  {
    id: "sample-yt-3",
    title: "Tối Ưu Tỷ Lệ Chuyển Đổi & Kịch Bản Livestream Chốt Đơn",
    platform: "youtube",
    url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    duration: "15:10",
    category: "Phần 2: Livestream & Video",
    description: "Video mẫu YouTube về kịch bản giữ chân người xem và công thức mồi câu (Hook) chuyển đổi khách hàng.",
  },
  {
    id: "sample-vimeo-1",
    title: "Masterclass HD: Setup Hệ Thống Chatbot CSKH 24/7",
    platform: "vimeo",
    url: "https://vimeo.com/76979871",
    duration: "24:30",
    category: "Phần 4: Chăm Sóc Khách Hàng",
    description: "Bản mẫu video chất lượng cao qua Vimeo Player dành cho bài giảng chuyên sâu VIP PRO.",
  },
  {
    id: "sample-mp4-1",
    title: "Video Trực Tiếp MP4 (Cloud CDN - Không Quảng Cáo)",
    platform: "direct",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "00:15",
    category: "Direct MP4 Video",
    description: "Bản mẫu định dạng file .mp4 trực tiếp qua CDN đám mây, phát mượt mà không dính quảng cáo của bên thứ 3.",
  },
  {
    id: "sample-mp4-2",
    title: "Video Thử Nghiệm Trình Phát Web Player (Full HD)",
    platform: "direct",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: "09:56",
    category: "Direct MP4 Video",
    description: "Bản mẫu video MP4 tiêu chuẩn Web giúp kiểm tra trình phát, tính năng nhớ thời lượng và lưu tiến độ xem.",
  },
];

interface LessonsManagerProps {
  listControls?: ReactNode;
  initialLessons: AdminLessonItem[];
  courses: AdminCourseItem[];
  coursesSlot?: React.ReactNode;
}

export function LessonsManager({ initialLessons, courses, coursesSlot }: LessonsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCourseId = searchParams.get("courseId");

  const [lessons, setLessons] = useState<AdminLessonItem[]>(initialLessons);
  useEffect(() => {
    queueMicrotask(() => setLessons(initialLessons));
  }, [initialLessons]);

  const [coursesList, setCoursesList] = useState<AdminCourseItem[]>(courses);
  useEffect(() => {
    queueMicrotask(() => setCoursesList(courses));
  }, [courses]);

  // Tab điều hướng: "lessons" | "videos" | "courses"
  const [activeTab, setActiveTab] = useState<"lessons" | "videos" | "courses">("lessons");

  // Bộ lọc & tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    requestedCourseId && courses.some((course) => course.id === requestedCourseId)
      ? requestedCourseId
      : "all"
  );
  const [vipFilter, setVipFilter] = useState<"all" | "vip" | "free">("all");
  const [videoFilter, setVideoFilter] = useState<"all" | "has_video" | "no_video">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "PUBLISHED" | "DRAFT">("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLessonItem | null>(null);
  const [previewVideoLesson, setPreviewVideoLesson] = useState<{
    title: string;
    videoUrl: string;
    isVIP?: boolean;
    order?: number;
  } | null>(null);
  const [modalError, setModalError] = useState("");

  // Modal Tạo Khóa Học Mới
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [courseModalError, setCourseModalError] = useState("");
  const courseBusy = useRef(false);
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const [isPending, startTransition] = useAdminMutation((message) => showToast(message, "error"));

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

  // Lọc bài học danh sách
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      // 1. Khóa học
      if (selectedCourseId !== "all" && lesson.course?.id !== selectedCourseId) {
        return false;
      }
      // 2. Phân quyền VIP
      if (vipFilter === "vip" && !lesson.isVIP) return false;
      if (vipFilter === "free" && lesson.isVIP) return false;
      // 3. Trạng thái có video
      const hasVid = !!lesson.videoUrl && lesson.videoUrl.trim().length > 0;
      if (videoFilter === "has_video" && !hasVid) return false;
      if (videoFilter === "no_video" && hasVid) return false;
      // 4. Trạng thái xuất bản
      if (statusFilter !== "all" && lesson.status !== statusFilter) return false;
      // 5. Từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = lesson.title.toLowerCase().includes(q);
        const matchModule = lesson.moduleName?.toLowerCase().includes(q);
        const matchCourse = lesson.course?.title?.toLowerCase().includes(q);
        if (!matchTitle && !matchModule && !matchCourse) return false;
      }
      return true;
    });
  }, [lessons, selectedCourseId, vipFilter, videoFilter, statusFilter, searchQuery]);

  // Bật Modal Thêm Mới
  const handleOpenAddModal = (initialData?: {
    title?: string;
    videoUrl?: string;
    moduleName?: string;
  }) => {
    const targetCourseId =
      selectedCourseId !== "all" ? selectedCourseId : coursesList[0]?.id || "";
    const maxOrder = coursesList.find((course) => course.id === targetCourseId)?.maxOrder ?? 0;

    setVideoMode(initialData?.videoUrl ? "url" : "upload");
    setFormData({
      title: initialData?.title || "",
      moduleName: initialData?.moduleName || allModules[0] || "Phần 1",
      customModuleName: "",
      isCustomModule: false,
      content: "",
      videoUrl: initialData?.videoUrl || "",
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
    if (courseBusy.current) return;
    if (!newCourseTitle.trim()) {
      setCourseModalError("Vui lòng nhập tên khóa học");
      return;
    }
    courseBusy.current = true;
    setIsCreatingCourse(true);
    setCourseModalError("");

    try {
      const res = await createCourse({
        title: newCourseTitle.trim(),
        description: newCourseDesc.trim() || undefined,
        status: "DRAFT",
      });
      if (res.success && res.course) {
        setCoursesList((prev) => [
          ...prev,
          { id: res.course.id, title: res.course.title, maxOrder: 0 },
        ]);
        setSelectedCourseId(res.course.id);
        setShowCourseModal(false);
        setNewCourseTitle("");
        setNewCourseDesc("");
        showToast(`Đã tạo khóa học "${res.course.title}" thành công!`);
        router.refresh();
      } else {
        setCourseModalError(res.error || "Không thể tạo khóa học mới");
      }
    } catch {
      setCourseModalError("Lỗi kết nối khi tạo khóa học");
    } finally {
      courseBusy.current = false;
      setIsCreatingCourse(false);
    }
  };

  // Bật Modal Chỉnh Sửa
  const handleOpenEditModal = (lesson: AdminLessonItem) => {
    setEditingLesson(lesson);
    const isExisting = allModules.includes(lesson.moduleName);
    const isLocalFile =
      lesson.videoUrl?.startsWith("/uploads/") || lesson.videoUrl?.startsWith("/api/media/");
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
        setFormData((prev) => ({
          ...prev,
          videoUrl: data.url,
          mediaAssetId: data.mediaAssetId || null,
        }));
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

  // Đổi trạng thái xuất bản
  const handleTogglePublished = (lesson: AdminLessonItem) => {
    const status: LearningContentStatus = lesson.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
    startTransition(async () => {
      const res = await setLessonStatus(lesson.id, status);
      if (res.success) {
        setLessons((prev) =>
          prev.map((item) => (item.id === lesson.id ? { ...item, status } : item))
        );
        showToast(status === "PUBLISHED" ? "Đã xuất bản bài học." : "Đã ẩn bài học.");
      } else showToast(res.error || "Không thể đổi trạng thái bài học.", "error");
    });
  };

  // Xử lý bật/tắt VIP 1-click
  const handleToggleVip = (lesson: AdminLessonItem) => {
    const newVip = !lesson.isVIP;
    setLessons((prev) => prev.map((l) => (l.id === lesson.id ? { ...l, isVIP: newVip } : l)));

    startTransition(async () => {
      const res = await toggleLessonVip(lesson.id, newVip);
      if (res.success) {
        showToast(
          newVip
            ? `Đã chuyển bài #${lesson.order} sang chế độ VIP PRO 👑`
            : `Đã mở bài #${lesson.order} thành bài học FREE`
        );
      } else {
        setLessons((prev) =>
          prev.map((l) => (l.id === lesson.id ? { ...l, isVIP: lesson.isVIP } : l))
        );
        showToast(res.error || "Không thể cập nhật quyền VIP", "error");
      }
    });
  };

  // Xóa bài học
  const handleDeleteLesson = (lesson: AdminLessonItem) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa bài học #${lesson.order}: "${lesson.title}"? Thao tác không thể hoàn tác.`
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
        "Bạn có chắc muốn khôi phục lại 25 bài học mẫu chuẩn kèm link video? Các bài đã bị xóa sẽ được tạo lại tự động."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await restoreDefaultLessons();
      if (res.success) {
        showToast(`Đã khôi phục thành công ${res.restoredCount} bài học kèm video! Trang đang tải lại...`);
        setTimeout(() => {
          router.refresh();
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
      showToast(
        res.success ? `Đã dọn ${res.removed} video không còn sử dụng.` : "Không thể dọn video.",
        res.success ? "success" : "error"
      );
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
        const course =
          coursesList.find((c) => c.id === formData.courseId) ||
          coursesList[0] || { id: "1", title: "Khóa học" };
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

        setLessons((prev) =>
          prev.map((item) => {
            if (item.id === editingLesson.id) {
              return {
                ...item,
                ...res.lesson,
                moduleName: res.lesson.moduleName || finalModuleName,
                course: { id: course.id, title: course.title },
              };
            }
            if (oldCourseId === newCourseId && item.course.id === oldCourseId) {
              if (newOrder < oldOrder && item.order >= newOrder && item.order < oldOrder)
                return { ...item, order: item.order + 1 };
              if (newOrder > oldOrder && item.order > oldOrder && item.order <= newOrder)
                return { ...item, order: item.order - 1 };
            }
            if (oldCourseId !== newCourseId) {
              if (item.course.id === oldCourseId && item.order > oldOrder)
                return { ...item, order: item.order - 1 };
              if (item.course.id === newCourseId && item.order >= newOrder)
                return { ...item, order: item.order + 1 };
            }
            return item;
          })
        );
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

  // Sao chép link video mẫu
  const handleCopySample = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast("Đã sao chép đường link video mẫu vào bộ nhớ tạm!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Toast thông báo nổi */}
      {toast && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white transition-all animate-in fade-in slide-in-from-top-2 ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── TIÊU ĐỀ TRANG QUẢN LÝ NỘI DUNG KHÓA HỌC ── */}
      <AdminPageHeader
        title="Quản Lý Nội Dung Khóa Học & Video"
        subtitle="Tổ chức học phần, gán link video YouTube/Vimeo/MP4 và phân quyền bài học Free/VIP cho học viên."
        icon={BookOpen}
        iconGradient="from-emerald-600 via-teal-600 to-cyan-600"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <Sparkles size={12} className="text-emerald-600" />
            {stats.total} bài giảng ({stats.vipCount} VIP)
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreDefault}
              disabled={isPending}
              title="Khôi phục 25 bài học mẫu chuẩn kèm link video"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <RotateCcw size={14} className={isPending ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Khôi Phục Bài Mẫu</span>
            </button>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={15} />
              <span>+ Thêm Bài Giảng</span>
            </button>
          </div>
        }
      />

      {/* ── 4 THẺ CHỈ SỐ KPI TỐI GIẢN ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Tổng số bài học */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tổng Bài Giảng
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{stats.total}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {stats.moduleCount} phần học
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen size={18} />
          </div>
        </div>

        {/* Bài học VIP PRO */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
              <Crown size={12} className="text-amber-500 fill-amber-500" /> Bài Học VIP
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">{stats.vipCount}</div>
            <span className="text-[11px] text-amber-700/80 mt-0.5 block font-semibold">
              Chiếm {stats.vipPercent}% khóa
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Crown size={18} />
          </div>
        </div>

        {/* Bài học FREE */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-500" /> Bài Học FREE
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{stats.freeCount}</div>
            <span className="text-[11px] text-emerald-700/80 mt-0.5 block">
              Mở cho mọi học viên
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
        </div>

        {/* Đã gắn Video */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Video size={12} className="text-blue-500" /> Đã Gắn Video
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{stats.withVideoCount}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {stats.total - stats.withVideoCount > 0
                ? `Còn ${stats.total - stats.withVideoCount} bài chưa link`
                : "100% đã có link"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <PlayCircle size={18} />
          </div>
        </div>
      </div>

      {/* ── THANH CHUYỂN TAB ĐIỀU HƯỚNG TỐI GIẢN ── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab("lessons")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "lessons"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
        >
          <BookOpen size={14} />
          <span>Danh Sách Bài Giảng</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "lessons" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-700"
              }`}
          >
            {filteredLessons.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("videos")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "videos"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
        >
          <Film size={14} className="text-blue-500" />
          <span>Bản Mẫu Video Sẵn Có</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
            {SAMPLE_VIDEO_TEMPLATES.length} mẫu
          </span>
        </button>

        <button
          onClick={() => setActiveTab("courses")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "courses"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
        >
          <FolderPlus size={14} className="text-indigo-500" />
          <span>Quản Lý Khóa Học</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "courses" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-700"
              }`}
          >
            {coursesList.length}
          </span>
        </button>
      </div>

      {/* ── TAB 1: DANH SÁCH BÀI GIẢNG ── */}
      {activeTab === "lessons" && (
        <div className="space-y-4">
          {/* Thanh công cụ tìm kiếm & bộ lọc */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
              {/* Ô tìm kiếm */}
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm bài học theo tên, phần học (Module)..."
                  className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Lọc Khóa Học */}
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white cursor-pointer"
              >
                <option value="all">Tất cả khóa học ({coursesList.length})</option>
                {coursesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    Khóa: {c.title}
                  </option>
                ))}
              </select>

              {/* Lọc VIP */}
              <select
                value={vipFilter}
                onChange={(e) => setVipFilter(e.target.value as "all" | "vip" | "free")}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white cursor-pointer"
              >
                <option value="all">Tất cả phân quyền</option>
                <option value="vip">Chỉ bài VIP PRO</option>
                <option value="free">Chỉ bài FREE</option>
              </select>

              {/* Lọc Video */}
              <select
                value={videoFilter}
                onChange={(e) => setVideoFilter(e.target.value as "all" | "has_video" | "no_video")}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white cursor-pointer"
              >
                <option value="all">Tất cả video</option>
                <option value="has_video">Đã gắn link</option>
                <option value="no_video">Chưa có video</option>
              </select>

              {/* Lọc Trạng Thái */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "PUBLISHED" | "DRAFT")}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PUBLISHED">Đã xuất bản</option>
                <option value="DRAFT">Bản nháp / Ẩn</option>
              </select>

              {/* Dọn video thừa */}
              <button
                onClick={handleCleanupMedia}
                disabled={isPending}
                title="Dọn video tải lên hơn 24 giờ không gắn bài học"
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
              >
                <Trash2 size={13} className="text-slate-400" />
                <span className="hidden sm:inline">Dọn Video Thừa</span>
              </button>
            </div>
          </div>

          {/* Bảng Danh Sách Bài Học */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[620px] custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
                  <tr className="text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5 text-center w-12">STT</th>
                    <th className="py-3 px-3.5 min-w-[140px]">Học Phần &amp; Khóa</th>
                    <th className="py-3 px-3.5 min-w-[240px]">Tên Bài Giảng</th>
                    <th className="py-3 px-3.5 min-w-[150px]">Video Bài Giảng</th>
                    <th className="py-3 px-3.5 text-center min-w-[110px]">Phân Quyền</th>
                    <th className="py-3 px-3.5 text-center min-w-[100px]">Trạng Thái</th>
                    <th className="py-3 px-3.5 text-right min-w-[110px]">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLessons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="font-bold text-slate-700 text-sm">Không tìm thấy bài học nào phù hợp</p>
                        <p className="text-xs mt-1 text-slate-400">
                          Thử thay đổi bộ lọc tìm kiếm hoặc bấm &quot;Thêm Bài Giảng&quot;
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredLessons.map((lesson) => {
                      const videoInfo = parseVideoUrl(lesson.videoUrl);
                      const hasVideo = !!videoInfo.embedUrl;

                      return (
                        <tr
                          key={lesson.id}
                          className={`hover:bg-slate-50/80 transition-colors ${lesson.isVIP ? "bg-amber-50/15" : ""
                            }`}
                        >
                          {/* STT */}
                          <td className="py-3 px-3.5 text-center font-black text-slate-500">
                            #{lesson.order}
                          </td>

                          {/* Học phần & Khóa */}
                          <td className="py-3 px-3.5">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {lesson.moduleName || "Phần 1"}
                            </span>
                            <div className="text-[11px] text-slate-400 truncate max-w-[140px] mt-0.5" title={lesson.course?.title}>
                              {lesson.course?.title}
                            </div>
                          </td>

                          {/* Tên bài giảng */}
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900 leading-snug line-clamp-2">
                              {lesson.title}
                            </div>
                            {lesson.content && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {lesson.content}
                              </p>
                            )}
                          </td>

                          {/* Video */}
                          <td className="py-3 px-3.5">
                            {hasVideo ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewVideoLesson({
                                      title: lesson.title,
                                      videoUrl: lesson.videoUrl || "",
                                      isVIP: lesson.isVIP,
                                      order: lesson.order,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold text-[11px] transition-colors cursor-pointer"
                                >
                                  <PlayCircle size={13} className="text-blue-600" />

                                </button>
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium text-slate-500 bg-slate-100">
                                  {videoInfo.type === "youtube"
                                    ? "YouTube"
                                    : videoInfo.type === "vimeo"
                                      ? "Vimeo"
                                      : "MP4 Direct"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                                <Film size={12} /> Chưa gắn link
                              </span>
                            )}
                          </td>

                          {/* Phân quyền VIP */}
                          <td className="py-3 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleVip(lesson)}
                              disabled={isPending}
                              title="Bấm để chuyển đổi nhanh VIP / FREE"
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer active:scale-95 shadow-2xs whitespace-nowrap ${lesson.isVIP
                                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-amber-500/20"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                }`}
                            >
                              {lesson.isVIP ? (
                                <>
                                  <Crown size={11} className="fill-white" /> VIP PRO
                                </>
                              ) : (
                                <>
                                  <Sparkles size={11} /> FREE
                                </>
                              )}
                            </button>
                          </td>

                          {/* Trạng thái xuất bản */}
                          <td className="py-3 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePublished(lesson)}
                              disabled={isPending}
                              title="Bấm để bật / tắt xuất bản"
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${lesson.status === "PUBLISHED"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}
                            >
                              {lesson.status === "PUBLISHED" ? (
                                <>
                                  <Eye size={11} /> Xuất bản
                                </>
                              ) : (
                                <>
                                  <EyeOff size={11} /> Bản nháp
                                </>
                              )}
                            </button>
                          </td>

                          {/* Thao tác */}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(lesson)}
                                title="Chỉnh sửa bài học"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(lesson)}
                                title="Xóa bài học"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
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
        </div>
      )}

      {/* ── TAB 2: KHO BẢN MẪU VIDEO SẴN CÓ ── */}
      {activeTab === "videos" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Thông tin giới thiệu kho bản mẫu video */}
          <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white rounded-2xl border border-blue-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Film size={18} className="text-blue-600" />
                Kho Bản Mẫu Video Chuẩn Định Dạng
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các bản mẫu video thực tế (YouTube, Vimeo, MP4 Direct qua CDN) giúp quản trị viên kiểm tra nhanh trình phát bài học hoặc 1-click gán vào bài giảng.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-100/80 text-blue-800 shrink-0 self-start sm:self-center">
              6 Bản Mẫu Sẵn Sàng
            </span>
          </div>

          {/* Lưới 6 bản mẫu video */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_VIDEO_TEMPLATES.map((sample) => {
              const info = parseVideoUrl(sample.url);

              return (
                <div
                  key={sample.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
                >
                  {/* Trình phát preview thu nhỏ */}
                  <div className="relative bg-slate-950 aspect-video w-full flex items-center justify-center overflow-hidden">
                    {info.type === "direct" ? (
                      <video
                        src={sample.url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : info.embedUrl ? (
                      <iframe
                        src={info.embedUrl}
                        title={sample.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-xs text-slate-400">Không thể xem trước</div>
                    )}

                    {/* Tag nền tảng ở góc trên */}
                    <span
                      className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow-md ${sample.platform === "youtube"
                          ? "bg-rose-600"
                          : sample.platform === "vimeo"
                            ? "bg-sky-600"
                            : "bg-emerald-600"
                        }`}
                    >
                      {sample.platform === "youtube"
                        ? "YouTube"
                        : sample.platform === "vimeo"
                          ? "Vimeo"
                          : "Direct MP4"}
                    </span>

                    {/* Thời lượng */}
                    <span className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-white">
                      {sample.duration}
                    </span>
                  </div>

                  {/* Thông tin video */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                        {sample.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 line-clamp-2 leading-snug">
                        {sample.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {sample.description}
                      </p>
                    </div>

                    {/* Hành động */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenAddModal({
                            title: sample.title,
                            videoUrl: sample.url,
                            moduleName: sample.category.split(":")[0]?.trim() || "Phần 1",
                          })
                        }
                        className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <Plus size={13} />
                        <span>Gán Vào Bài Mới</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopySample(sample.url, sample.id)}
                        title="Sao chép link video"
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shrink-0"
                      >
                        {copiedId === sample.id ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: QUẢN LÝ KHÓA HỌC ── */}
      {activeTab === "courses" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {coursesSlot ? (
            <div>{coursesSlot}</div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">
              Chưa có dữ liệu danh mục khóa học
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: THÊM MỚI / CHỈNH SỬA BÀI HỌC ── */}
      {(showAddModal || editingLesson) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <BookOpen size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingLesson
                    ? `Chỉnh Sửa Bài Học #${editingLesson.order}`
                    : "Thêm Bài Giảng Mới"}
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

            {/* Form bọc toàn bộ Body */}
            <form
              onSubmit={editingLesson ? handleEditSubmit : handleAddSubmit}
              className="flex flex-col flex-1 overflow-hidden min-h-0"
            >
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar">
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

                {/* Chọn Học Phần */}
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
                        onChange={(e) =>
                          setFormData({ ...formData, customModuleName: e.target.value })
                        }
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

                {/* Checkbox Xuất Bản */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Xuất bản cho học viên</span>
                    <span className="text-[11px] text-slate-500">
                      Tắt để lưu bản nháp; bản nháp sẽ không xuất hiện ở danh mục hoặc trình học.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.status === "PUBLISHED"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.checked ? "PUBLISHED" : "DRAFT",
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </label>

                {/* Phân Quyền VIP */}
                <div
                  onClick={() => setFormData({ ...formData, isVIP: !formData.isVIP })}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${formData.isVIP
                      ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20"
                      : "bg-emerald-50/60 border-emerald-200"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${formData.isVIP ? "bg-amber-500 text-white" : "bg-emerald-100 text-emerald-700"
                        }`}
                    >
                      {formData.isVIP ? <Crown size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        {formData.isVIP
                          ? "👑 BÀI HỌC VIP PRO (CẦN NÂNG CẤP VIP ĐỂ XEM)"
                          : "✨ BÀI HỌC FREE (TẤT CẢ HỌC VIÊN ĐỀU XEM ĐƯỢC)"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formData.isVIP
                          ? "Học viên FREE sẽ bị khóa video và hiện màn hình nâng cấp VIP."
                          : "Mọi thành viên đều có thể xem bài giảng này."}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isVIP}
                    onChange={(e) => setFormData({ ...formData, isVIP: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded cursor-pointer pointer-events-none"
                  />
                </div>

                {/* ── KHU VỰC VIDEO & BẢN MẪU SẴN CÓ ── */}
                <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Video size={15} className="text-blue-600" />
                      Video Bài Giảng <span className="text-rose-500">*</span>
                    </label>

                    {/* Tab chọn cách nạp video */}
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-bold shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setVideoMode("upload")}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${videoMode === "upload"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        <UploadCloud size={13} /> Tải File
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoMode("url")}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${videoMode === "url"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        <Link2 size={13} /> Link Online
                      </button>
                    </div>
                  </div>

                  {/* Thanh chọn nhanh từ bản mẫu video */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      ⚡ Chọn nhanh từ bản mẫu video có sẵn:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {SAMPLE_VIDEO_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => {
                            setVideoMode("url");
                            setFormData((prev) => ({
                              ...prev,
                              videoUrl: tmpl.url,
                              mediaAssetId: null,
                            }));
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${formData.videoUrl === tmpl.url
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-white hover:bg-blue-50 text-slate-700 border-slate-200"
                            }`}
                        >
                          <PlayCircle size={11} />
                          <span>{tmpl.title.split(":")[0]?.trim() || tmpl.title.slice(0, 20)}</span>
                        </button>
                      ))}
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
                            <Loader2 size={28} className="animate-spin" />
                            <span className="text-xs font-bold">Đang tải video lên server...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-center py-1">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <UploadCloud size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-800 mt-1">
                              Bấm để chọn file video từ máy tính
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Hỗ trợ .mp4, .webm, .mov (tối đa 100MB)
                            </span>
                            {formData.videoUrl &&
                              (formData.videoUrl.startsWith("/uploads/") ||
                                formData.videoUrl.startsWith("/api/media/")) && (
                                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-md border border-emerald-200">
                                  <CheckCircle2 size={12} /> File: {formData.videoUrl.split("/").pop()}
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
                        onChange={(e) =>
                          setFormData({ ...formData, videoUrl: e.target.value, mediaAssetId: null })
                        }
                        placeholder="https://www.youtube.com/watch?v=... hoặc https://vimeo.com/... hoặc link .mp4"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium font-mono bg-white"
                      />
                      <p className="text-[11px] text-slate-400">
                        Hỗ trợ link YouTube (thường, Shorts, Embed), Vimeo, hoặc link direct .mp4 ngoài.
                      </p>
                    </div>
                  )}

                  {/* Live Preview Video trong modal */}
                  {formVideoInfo.embedUrl ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-0.5">
                        <span className="flex items-center gap-1">
                          <PlayCircle size={13} className="text-blue-600" /> Xem trước video:
                        </span>
                        {formVideoInfo.type === "direct" && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono font-medium">
                            Video trực tiếp MP4
                          </span>
                        )}
                      </div>
                      <div className="rounded-xl overflow-hidden border border-slate-300 bg-black h-48 sm:h-56 w-full flex items-center justify-center relative shadow-inner">
                        {formVideoInfo.type === "direct" ? (
                          <video
                            key={formVideoInfo.embedUrl}
                            src={formVideoInfo.embedUrl}
                            controls
                            className="w-full h-full max-h-56 object-contain"
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
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>Không nhận diện được link video. Vui lòng kiểm tra lại URL.</span>
                    </div>
                  ) : null}
                </div>

                {/* Nội dung tóm tắt */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tóm tắt &amp; Tài liệu bài học (Markdown / Text)
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

              {/* Footer Modal Buttons */}
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
                  {isPending
                    ? "Đang xử lý..."
                    : editingLesson
                      ? "Cập Nhật Bài Học"
                      : "Lưu Bài Giảng Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: XEM NHANH VIDEO PLAYER ── */}
      {previewVideoLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-950 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-800">
            <div className="p-4 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-600 text-white">
                  <PlayCircle size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white line-clamp-1">
                    {previewVideoLesson.order ? `#${previewVideoLesson.order}: ` : ""}
                    {previewVideoLesson.title}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {previewVideoLesson.isVIP ? "👑 Bài học VIP PRO" : "✨ Bài học FREE"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewVideoLesson(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {(() => {
                const info = parseVideoUrl(previewVideoLesson.videoUrl);
                if (info.type === "direct") {
                  return (
                    <video
                      src={previewVideoLesson.videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                }
                if (info.embedUrl) {
                  return (
                    <iframe
                      src={info.embedUrl}
                      title="Video Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <div className="text-xs text-slate-400">Không thể tải trình phát video</div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TẠO KHÓA HỌC MỚI ── */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4 border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FolderPlus size={16} className="text-indigo-600" /> Tạo Khóa Học Mới
              </h3>
              <button
                onClick={() => setShowCourseModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {courseModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                {courseModalError}
              </div>
            )}

            <form onSubmit={handleCreateCourseSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Khóa Học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="Ví dụ: Khóa Học Bán Hàng Shopee AI Pro..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô Tả Ngắn Khóa Học
                </label>
                <textarea
                  rows={2}
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="Mô tả mục tiêu và nội dung khóa học..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCourse}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
                >
                  {isCreatingCourse ? "Đang tạo..." : "Tạo Khóa Học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
