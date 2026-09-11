import { prisma } from "@/lib/prisma";
import { CheckCircle2, XCircle, MoreVertical } from "lucide-react";

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Users</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
          + Thêm thủ công
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
              <th className="p-4 font-bold">Email / Tên</th>
              <th className="p-4 font-bold">Trạng thái VIP</th>
              <th className="p-4 font-bold">Quyền</th>
              <th className="p-4 font-bold">Ngày tham gia</th>
              <th className="p-4 font-bold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Chưa có user nào đăng ký.
                </td>
              </tr>
            ) : (
              users.map((user: { id: string; name: string | null; email: string; isVIP: boolean; role: string; createdAt: Date }) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{user.name || "Chưa cập nhật"}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </td>
                  <td className="p-4">
                    {user.isVIP ? (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold">
                        <CheckCircle2 size={14} /> VIP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold">
                        FREE
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-slate-700">{user.role}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-slate-400 hover:text-blue-600">
                      <MoreVertical size={20} />
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
