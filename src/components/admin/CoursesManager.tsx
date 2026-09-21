"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import { createCourse, deleteCourse, updateCourse } from "@/app/admin/lessons/actions";
import type { LearningContentStatus } from "@/lib/learning/policy";

export type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  status: LearningContentStatus;
  lessonsCount: number;
};

export function CoursesManager({ courses }: { courses: CourseRow[] }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editDraft, setEditDraft] = useState({
    title: "",
    description: "",
    status: "DRAFT" as LearningContentStatus,
  });
  const [newDraft, setNewDraft] = useState({
    title: "",
    description: "",
    status: "PUBLISHED" as LearningContentStatus,
  });
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const openEdit = (course: CourseRow) => {
    setEditingCourse(course);
    setEditDraft({
      title: course.title,
      description: course.description || "",
      status: course.status,
    });
    setMessage(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    if (!editDraft.title.trim()) {
      setMessage({ type: "error", text: "Tên khóa học không được để trống." });
      return;
    }

    startTransition(async () => {
      const result = await updateCourse(editingCourse.id, {
        title: editDraft.title.trim(),
        description: editDraft.description.trim() || undefined,
        status: editDraft.status,
      });

      if (!result.success) {
        setMessage({ type: "error", text: result.error || "Không thể cập nhật khóa học." });
      } else {
        setEditingCourse(null);
        setMessage({ type: "success", text: `Đã cập nhật khóa học "${editDraft.title.trim()}".` });
        router.refresh();
      }
    });
  };

  const handleQuickStatusChange = (course: CourseRow, newStatus: LearningContentStatus) => {
    if (newStatus === course.status) return;
    startTransition(async () => {
      const result = await updateCourse(course.id, {
        title: course.title,
        description: course.description || undefined,
        thumbnail: course.thumbnail || undefined,
        status: newStatus,
      });

      if (!result.success) {
        setMessage({ type: "error", text: result.error || "Không thể cập nhật trạng thái." });
      } else {
        const label =
          newStatus === "PUBLISHED"
            ? "Đang xuất bản"
            : newStatus === "DRAFT"
            ? "Bản nháp"
            : "Đã ẩn";
        setMessage({
          type: "success",
          text: `Đã đổi trạng thái "${course.title}" sang ${label}.`,
        });
        router.refresh();
      }
    });
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDraft.title.trim()) {
      setMessage({ type: "error", text: "Vui lòng nhập tên khóa học." });
      return;
    }

    startTransition(async () => {
      const result = await createCourse({
        title: newDraft.title.trim(),
        description: newDraft.description.trim() || undefined,
        status: newDraft.status,
      });

      if (!result.success) {
        setMessage({ type: "error", text: result.error || "Không thể tạo khóa học mới." });
      } else {
        setIsCreating(false);
        setNewDraft({ title: "", description: "", status: "PUBLISHED" });
        setMessage({ type: "success", text: "Đã tạo khóa học mới thành công!" });
        router.refresh();
      }
    });
  };

  const handleRemove = (course: CourseRow) => {
    if (!confirm(`Xóa khóa học "${course.title}"? Chỉ xóa được khóa không còn bài học.`)) return;
    startTransition(async () => {
      const result = await deleteCourse(course.id);
      if (!result.success) {
        setMessage({ type: "error", text: result.error || "Không thể xóa khóa học." });
      } else {
        setMessage({ type: "success", text: `Đã xóa khóa học "${course.title}".` });
        router.refresh();
      }
    });
  };

  const publishedCount = courses.filter((c) => c.status === "PUBLISHED").length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden shrink-0 transition-all">
      {/* Header thanh gọn */}
      <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen size={15} />
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h2 className="font-bold text-slate-900 text-xs sm:text-sm">Xuất bản khóa học</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {courses.length} khóa ({publishedCount} xuất bản)
            </span>
            <span className="hidden md:inline text-[11px] text-slate-400">
              • Khóa nháp hoặc đã ẩn không xuất hiện ở danh mục và trình học.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setIsCreating(true);
            }}
            className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <Plus size={13} />
            <span>Thêm khóa</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Thu gọn danh sách" : "Mở rộng danh sách"}
            className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Thông báo kết quả thao tác */}
      {message && (
        <div
          className={`px-4 py-2 text-xs font-semibold flex items-center justify-between border-b ${
            message.type === "error"
              ? "bg-rose-50 text-rose-700 border-rose-100"
              : "bg-emerald-50 text-emerald-700 border-emerald-100"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Danh sách khóa học dạng dòng gọn gàng */}
      {isExpanded && (
        <div className="divide-y divide-slate-100">
          {courses.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              Chưa có khóa học nào trong hệ thống.
            </div>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                className="px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
              >
                {/* Tên khóa & mô tả rút gọn */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <GraduationCap size={13} />
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {course.title}
                  </span>
                  {course.description && (
                    <span className="hidden lg:inline text-[11px] text-slate-400 truncate max-w-sm">
                      — {course.description}
                    </span>
                  )}
                </div>

                {/* Số bài, Trạng thái nhanh & Thao tác */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                    {course.lessonsCount} bài
                  </span>

                  {/* Dropdown đổi trạng thái 1-click */}
                  <div className="relative">
                    <select
                      disabled={pending}
                      value={course.status}
                      onChange={(e) =>
                        handleQuickStatusChange(course, e.target.value as LearningContentStatus)
                      }
                      className={`text-[11px] font-bold rounded-lg pl-2 pr-5 py-1 border appearance-none cursor-pointer transition-all focus:outline-none ${
                        course.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60"
                          : course.status === "DRAFT"
                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/60"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/60"
                      }`}
                    >
                      <option value="PUBLISHED">● Đang xuất bản</option>
                      <option value="DRAFT">● Bản nháp</option>
                      <option value="HIDDEN">● Đã ẩn</option>
                    </select>
                    <ChevronDown
                      size={11}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                    />
                  </div>

                  {/* Thao tác Sửa / Xóa */}
                  <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(course)}
                      title={`Chỉnh sửa "${course.title}"`}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={pending || course.lessonsCount > 0}
                      onClick={() => handleRemove(course)}
                      title={
                        course.lessonsCount > 0
                          ? `Không thể xóa vì khóa có ${course.lessonsCount} bài`
                          : `Xóa khóa học "${course.title}"`
                      }
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: Chỉnh Sửa Khóa Học */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <Pencil size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Chỉnh Sửa Khóa Học</h3>
                  <p className="text-[11px] text-slate-500">Cập nhật tên, mô tả và trạng thái xuất bản</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên khóa học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={160}
                    value={editDraft.title}
                    onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mô tả khóa học</label>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={editDraft.description}
                    onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                    placeholder="Mô tả tóm tắt nội dung khóa học..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái xuất bản</label>
                  <select
                    value={editDraft.status}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, status: e.target.value as LearningContentStatus })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="PUBLISHED">Đang xuất bản (Hiện trên trang học & danh mục)</option>
                    <option value="DRAFT">Bản nháp (Chỉ Admin xem được)</option>
                    <option value="HIDDEN">Đã ẩn (Tạm ẩn khỏi học viên)</option>
                  </select>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setEditingCourse(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {pending && <Loader2 size={13} className="animate-spin" />}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Thêm Khóa Học Mới */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Thêm Khóa Học Mới</h3>
                  <p className="text-[11px] text-slate-500">Tạo khóa học để phân loại và tổ chức bài giảng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCourse}>
              <div className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên khóa học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={160}
                    value={newDraft.title}
                    onChange={(e) => setNewDraft({ ...newDraft, title: e.target.value })}
                    placeholder="Ví dụ: Masterclass Bán Hàng Shopee / TikTok..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mô tả khóa học</label>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={newDraft.description}
                    onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })}
                    placeholder="Mô tả tóm tắt mục tiêu, kiến thức nhận được..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái ban đầu</label>
                  <select
                    value={newDraft.status}
                    onChange={(e) =>
                      setNewDraft({ ...newDraft, status: e.target.value as LearningContentStatus })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="PUBLISHED">Đang xuất bản (Hiện trên trang học & danh mục)</option>
                    <option value="DRAFT">Bản nháp (Chỉ Admin xem được)</option>
                    <option value="HIDDEN">Đã ẩn (Tạm ẩn khỏi học viên)</option>
                  </select>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {pending && <Loader2 size={13} className="animate-spin" />}
                  <span>Tạo khóa học</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
