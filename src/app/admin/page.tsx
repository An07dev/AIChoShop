import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Users,
  BookOpen,
  Crown,
  DollarSign,
  UserPlus,
  CreditCard,
  ArrowUpRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Settings,
  Phone,
  Mail,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  GraduationCap,
} from "lucide-react";

export const dynamic = "force-dynamic";

const formatMoney = (val: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(val);

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "Vừa xong";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return formatDate(d);
}

export default async function AdminDashboard() {
  let userCount = 0;
  let vipCount = 0;
  let lessonCount = 0;
  let courseCount = 0;
  let totalRevenue = 0;
  let successTxCount = 0;
  let recentUsers: any[] = [];
  let recentTransactions: any[] = [];

  try {
    const [
      uCount,
      vCount,
      lCount,
      cCount,
      revenueAgg,
      sTxCount,
      users,
      txs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVIP: true } }),
      prisma.lesson.count(),
      prisma.course.count(),
      prisma.transaction.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where: { status: "SUCCESS" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isVIP: true,
          vipExpiresAt: true,
          createdAt: true,
        },
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              isVIP: true,
            },
          },
        },
      }),
    ]);

    userCount = uCount;
    vipCount = vCount;
    lessonCount = lCount;
    courseCount = cCount;
    totalRevenue = revenueAgg._sum.amount || 0;
    successTxCount = sTxCount;
    recentUsers = users;
    recentTransactions = txs;
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu dashboard:", error);
  }

  const stats = [
    {
      name: "Tổng Học Viên",
      value: userCount.toLocaleString("vi-VN"),
      subtext: `${vipCount} VIP • ${Math.max(0, userCount - vipCount)} Thường`,
      icon: <Users size={24} className="text-blue-600" />,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      link: "/admin/users",
    },
    {
      name: "Thành Viên VIP",
      value: vipCount.toLocaleString("vi-VN"),
      subtext: `${userCount > 0 ? Math.round((vipCount / userCount) * 100) : 0}% tổng học viên`,
      icon: <Crown size={24} className="text-amber-600" />,
      color: "bg-amber-50 text-amber-600 border-amber-100",
      link: "/admin/users",
    },
    {
      name: "Nội Dung Đào Tạo",
      value: `${lessonCount} bài`,
      subtext: `${courseCount} khóa học thực chiến`,
      icon: <BookOpen size={24} className="text-emerald-600" />,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      link: "/admin/courses",
    },
    {
      name: "Doanh Thu VIP Đã Thu",
      value: formatMoney(totalRevenue),
      subtext: `${successTxCount} giao dịch thành công`,
      icon: <DollarSign size={24} className="text-purple-600" />,
      color: "bg-purple-50 text-purple-600 border-purple-100",
      link: "/admin/sepay",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 pb-6">
      {/* ── 1. METRICS CARDS (4 THẺ TỔNG QUAN) ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {stats.map((stat, idx) => (
          <Link
            key={idx}
            href={stat.link}
            className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${stat.color} shadow-2xs`}
              >
                {stat.icon}
              </div>
              <ArrowUpRight
                size={16}
                className="text-slate-300 group-hover:text-slate-600 transition-colors"
              />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {stat.name}
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5 font-mono tracking-tight">
                {stat.value}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                {stat.subtext}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── 2. TWO-COLUMN MAIN WORKSPACE (NGƯỜI DÙNG MỚI & CHUYỂN KHOẢN GẦN ĐÂY) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-stretch">
        {/* CỘT TRÁI: NGƯỜI DÙNG MỚI ĐĂNG KÝ */}
        <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Card */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between min-h-[64px]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
                <UserPlus size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    Người Dùng Mới Đăng Ký
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-200">
                    5 mới nhất
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hiển thị 5 tài khoản học viên đăng ký mới nhất
                </p>
              </div>
            </div>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition shrink-0"
            >
              Xem tất cả <ArrowRight size={13} />
            </Link>
          </div>

          {/* List Users (Always exactly 5 rows) */}
          <div className="divide-y divide-slate-100 flex-1 flex flex-col">
            {recentUsers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                <UserPlus size={28} className="text-slate-300 stroke-[1.5] mb-2" />
                Chưa có người dùng nào đăng ký gần đây.
              </div>
            ) : (
              <>
                {recentUsers.map((user) => {
                  const initial = (user.name || user.email).charAt(0).toUpperCase();
                  return (
                    <div
                      key={user.id}
                      className="px-4 sm:px-5 py-2.5 sm:py-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3 h-[64px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shadow-2xs">
                            {initial}
                          </div>
                          {user.isVIP && (
                            <span
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs"
                              title="VIP Member"
                            >
                              <Crown size={8} className="fill-white" />
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[130px] sm:max-w-[200px]">
                              {user.name || "Học viên mới"}
                            </strong>
                            {user.role === "ADMIN" ? (
                              <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[9px] font-black border border-purple-200 shrink-0">
                                ADMIN
                              </span>
                            ) : user.isVIP ? (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black border border-amber-300 shrink-0 flex items-center gap-0.5">
                                <Crown size={8} className="fill-amber-600 text-amber-600" /> VIP
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-bold border border-slate-200 shrink-0">
                                Thường
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                            <span className="truncate max-w-[130px] sm:max-w-[210px]">{user.email}</span>
                            {user.phone && <span className="shrink-0">• {user.phone}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Time & Action */}
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-medium text-slate-400 block">
                          {timeAgo(user.createdAt)}
                        </span>
                        <Link
                          href={`/admin/users?search=${encodeURIComponent(user.email)}`}
                          className="text-[10px] font-bold text-blue-600 hover:underline inline-block"
                        >
                          Quản lý →
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Empty slot filler to keep exact 5 rows and match right column height */}
                {recentUsers.length < 5 &&
                  Array.from({ length: 5 - recentUsers.length }).map((_, i) => (
                    <div
                      key={`empty-user-slot-${i}`}
                      className="px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-3 h-[64px] bg-slate-50/40 text-slate-400"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs shrink-0">
                          <UserPlus size={14} className="opacity-50" />
                        </div>
                        <div>
                          <span className="text-xs font-medium text-slate-400 block">
                            Đang chờ học viên tiếp theo...
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Cổng đăng ký tài khoản tự do 24/7
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 shrink-0">
                        Vị trí {recentUsers.length + i + 1}
                      </span>
                    </div>
                  ))}
              </>
            )}
          </div>

          {/* Footer Card */}
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 min-h-[46px]">
            <span>
              Tổng cộng: <strong className="text-slate-900 font-mono font-bold">{userCount}</strong> tài khoản
            </span>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Xem danh sách đầy đủ →
            </Link>
          </div>
        </div>

        {/* CỘT PHẢI: CHUYỂN KHOẢN GẦN ĐÂY (GIAO DỊCH GẦN ĐÂY) */}
        <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Card */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between min-h-[64px]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
                <CreditCard size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    Chuyển Khoản Gần Đây (Giao Dịch)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                    5 mới nhất
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hiển thị 5 giao dịch chuyển khoản mới nhất
                </p>
              </div>
            </div>
            <Link
              href="/admin/sepay"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition shrink-0"
            >
              Cổng SePay <ArrowRight size={13} />
            </Link>
          </div>

          {/* List Transactions (Always exactly 5 rows) */}
          <div className="divide-y divide-slate-100 flex-1 flex flex-col">
            {recentTransactions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
                <Clock size={28} className="mx-auto text-slate-300" />
                <p className="text-xs text-slate-500 font-bold">Chưa có giao dịch chuyển khoản nào</p>
                <p className="text-[11px] text-slate-400">
                  Giao dịch tự động ghi nhận khi học viên quét mã VietQR SePay
                </p>
                <Link
                  href="/admin/sepay"
                  className="inline-block mt-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200"
                >
                  Cấu hình SePay ngay
                </Link>
              </div>
            ) : (
              <>
                {recentTransactions.map((tx) => {
                  const isSuccess = tx.status === "SUCCESS";
                  return (
                    <div
                      key={tx.id}
                      className="px-4 sm:px-5 py-2.5 sm:py-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3 h-[64px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icon Status */}
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${
                            isSuccess
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                        </div>

                        {/* Transaction details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[130px] sm:max-w-[200px]">
                              {tx.user?.name || tx.user?.email || "Học viên"}
                            </strong>
                            {isSuccess ? (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black border border-emerald-200 shrink-0">
                                Thành công
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black border border-amber-200 shrink-0">
                                Chờ duyệt
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                            <span className="shrink-0 font-semibold text-slate-500">Mã: {tx.sepayId || tx.id.slice(0, 8)}</span>
                            <span>• {tx.user?.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Amount & Time */}
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-black font-mono block ${
                            isSuccess ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          +{formatMoney(tx.amount)}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                          {timeAgo(tx.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Empty slot filler if fewer than 5 transactions */}
                {recentTransactions.length < 5 &&
                  Array.from({ length: 5 - recentTransactions.length }).map((_, i) => (
                    <div
                      key={`empty-tx-slot-${i}`}
                      className="px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-3 h-[64px] bg-slate-50/40 text-slate-400"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs shrink-0">
                          <CreditCard size={14} className="opacity-50" />
                        </div>
                        <div>
                          <span className="text-xs font-medium text-slate-400 block">
                            Đang chờ giao dịch tiếp theo...
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Tự động kích hoạt ngay khi quét VietQR
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 shrink-0">
                        Vị trí {recentTransactions.length + i + 1}
                      </span>
                    </div>
                  ))}
              </>
            )}
          </div>

          {/* Footer Card */}
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 min-h-[46px]">
            <span>
              Tổng đã thu:{" "}
              <strong className="text-emerald-600 font-mono font-bold">
                {formatMoney(totalRevenue)}
              </strong>
            </span>
            <Link
              href="/admin/sepay"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Kiểm tra cổng SePay →
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. QUICK MANAGEMENT HUBS (TIỆN ÍCH QUẢN TRỊ TRUNG TÂM) ─────────── */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-0.5">
          Lối Tắt Quản Trị Chuyên Mục
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          <Link
            href="/admin/users"
            className="group bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-105 transition-transform shrink-0">
              <Users size={17} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Quản lý Hội Viên
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Cấp quyền VIP, đổi mật khẩu
              </p>
            </div>
          </Link>

          <Link
            href="/admin/courses"
            className="group bg-white p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-105 transition-transform shrink-0">
              <GraduationCap size={17} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Khóa Học & Bài Học
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Video và giáo trình nội bộ
              </p>
            </div>
          </Link>

          <Link
            href="/admin/sepay"
            className="group bg-white p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-xs transition flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 group-hover:scale-105 transition-transform shrink-0">
              <CreditCard size={17} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Cổng SePay Tự Động
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Cấu hình STK & Webhook nạp
              </p>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="group bg-white p-3.5 rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-xs transition flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 group-hover:scale-105 transition-transform shrink-0">
              <Settings size={17} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Cài Đặt Hệ Thống
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                OpenAI Key, Đổi mật khẩu Admin
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
