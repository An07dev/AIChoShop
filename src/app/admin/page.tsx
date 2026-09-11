import { prisma } from "@/lib/prisma";
import { Users, BookOpen, Crown, DollarSign } from "lucide-react";

export default async function AdminDashboard() {
  // Fetch stats safely
  let userCount = 0;
  let vipCount = 0;
  let lessonCount = 0;

  try {
    userCount = await prisma.user.count();
    vipCount = await prisma.user.count({ where: { isVIP: true } });
    lessonCount = await prisma.lesson.count();
  } catch (error) {
    console.error("Lỗi khi đếm dữ liệu:", error);
  }

  const stats = [
    { name: "Tổng Users", value: userCount, icon: <Users size={24} className="text-blue-600" />, color: "bg-blue-100" },
    { name: "Thành viên VIP", value: vipCount, icon: <Crown size={24} className="text-amber-600" />, color: "bg-amber-100" },
    { name: "Tổng số Bài học", value: lessonCount, icon: <BookOpen size={24} className="text-emerald-600" />, color: "bg-emerald-100" },
    { name: "Doanh thu (Ước tính)", value: "0 đ", icon: <DollarSign size={24} className="text-purple-600" />, color: "bg-purple-100" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Tổng quan Hệ thống</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Người dùng mới đăng ký</h3>
          <div className="text-center py-8 text-slate-500">
            Tính năng đang được cập nhật...
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Giao dịch gần đây</h3>
          <div className="text-center py-8 text-slate-500">
            Chưa có giao dịch nào (Đang chờ tích hợp SePay)
          </div>
        </div>
      </div>
    </div>
  );
}
