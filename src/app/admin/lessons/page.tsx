import { prisma } from "@/lib/prisma";
import { Edit, Trash2, Lock, Unlock } from "lucide-react";

export default async function AdminLessons() {
  const lessons = await prisma.lesson.findMany({
    orderBy: { order: 'asc' },
    include: { course: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nội dung Khóa học</h1>
          <p className="text-slate-500 text-sm">Quản lý các bài học và thiết lập thu phí.</p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700">
          + Thêm bài giảng
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
              <th className="p-4 font-bold w-16 text-center">STT</th>
              <th className="p-4 font-bold">Tên bài học</th>
              <th className="p-4 font-bold">Trạng thái (Khóa)</th>
              <th className="p-4 font-bold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {lessons.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  Chưa có bài học nào.
                </td>
              </tr>
            ) : (
              lessons.map((lesson: { id: string; title: string; content: string | null; isVIP: boolean; order: number; course: { title: string } }) => (
                <tr key={lesson.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-center font-bold text-slate-400">{lesson.order}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{lesson.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-md">{lesson.content}</div>
                  </td>
                  <td className="p-4">
                    {lesson.isVIP ? (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-xs font-bold">
                        <Lock size={14} /> VIP (Đã khóa)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold">
                        <Unlock size={14} /> FREE (Mở)
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg hover:bg-blue-50 transition-colors">
                      <Edit size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg hover:bg-rose-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
