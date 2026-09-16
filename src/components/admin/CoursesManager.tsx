"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Pencil, Trash2, X } from "lucide-react";
import { deleteCourse, updateCourse } from "@/app/admin/lessons/actions";
import type { LearningContentStatus } from "@/lib/learning/policy";

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  status: LearningContentStatus;
  lessonsCount: number;
};

export function CoursesManager({ courses }: { courses: CourseRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "", thumbnail: "", status: "DRAFT" as LearningContentStatus });
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const edit = (course: CourseRow) => {
    setEditingId(course.id);
    setDraft({ title: course.title, description: course.description || "", thumbnail: course.thumbnail || "", status: course.status });
    setMessage(null);
  };

  const save = (id: string) => startTransition(async () => {
    const result = await updateCourse(id, draft);
    if (!result.success) return setMessage({ type: "error", text: result.error || "Không thể cập nhật khóa học." });
    setEditingId(null);
    setMessage({ type: "success", text: "Đã cập nhật khóa học." });
    router.refresh();
  });

  const remove = (course: CourseRow) => {
    if (!confirm(`Xóa khóa học “${course.title}”? Chỉ khóa học không còn bài mới được xóa.`)) return;
    startTransition(async () => {
      const result = await deleteCourse(course.id);
      setMessage({ type: result.success ? "success" : "error", text: result.success ? "Đã xóa khóa học." : result.error || "Không thể xóa khóa học." });
      if (result.success) router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-slate-900 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600" /> Xuất bản khóa học</h2>
          <p className="text-xs text-slate-500 mt-1">Khóa nháp hoặc đã ẩn không xuất hiện ở danh mục và trình học.</p>
        </div>
        <span className="text-xs font-bold text-slate-500">{courses.length} khóa</span>
      </div>
      {message && <div className={`rounded-xl px-3 py-2 text-xs font-semibold ${message.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{message.text}</div>}
      <div className="grid gap-2 lg:grid-cols-2">
        {courses.map((course) => editingId === course.id ? (
          <div key={course.id} className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 space-y-2">
            <input value={draft.title} maxLength={160} onChange={e => setDraft({ ...draft, title: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" aria-label="Tên khóa học" />
            <textarea value={draft.description} maxLength={2000} onChange={e => setDraft({ ...draft, description: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" rows={2} aria-label="Mô tả khóa học" />
            <div className="flex flex-wrap gap-2">
              <select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as LearningContentStatus })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">
                <option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đã xuất bản</option><option value="HIDDEN">Đã ẩn</option>
              </select>
              <button disabled={pending} onClick={() => save(course.id)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white flex items-center gap-1"><Check size={14} /> Lưu</button>
              <button disabled={pending} onClick={() => setEditingId(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 flex items-center gap-1"><X size={14} /> Hủy</button>
            </div>
          </div>
        ) : (
          <div key={course.id} className="rounded-xl border border-slate-200 p-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold text-sm text-slate-900 truncate">{course.title}</div>
              <div className="text-xs text-slate-500 mt-1">{course.lessonsCount} bài · {course.status === "PUBLISHED" ? "Đang xuất bản" : course.status === "DRAFT" ? "Bản nháp" : "Đã ẩn"}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => edit(course)} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50" aria-label={`Sửa ${course.title}`}><Pencil size={15} /></button>
              <button disabled={pending || course.lessonsCount > 0} onClick={() => remove(course)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30" aria-label={`Xóa ${course.title}`}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
