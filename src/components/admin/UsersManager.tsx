"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Crown,
  Lock,
  Unlock,
  Search,
  Plus,
  Trash2,
  Key,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Shield,
  Phone,
  Mail,
  Calendar,
  X,
  Sparkles,
  Coins,
  ArrowUpDown,
  Filter,
  Clock,
  CalendarClock,
  Hourglass,
  Check,
} from "lucide-react";
import {
  toggleUserVip,
  toggleUserLock,
  createUserByAdmin,
  resetPasswordByAdmin,
  deleteUserByAdmin,
  updateUserVipDuration,
} from "@/app/admin/users/actions";
import { computeVipDaysLeft, getVipStatusInfo } from "@/lib/vip-expiration";

export interface AdminUserItem {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  isVIP: boolean;
  vipExpiresAt?: Date | string | null;
  vipDaysLeft?: number | null;
  isLocked: boolean;
  createdAt: Date | string;
  userCredit?: { balance: number } | null;
}

interface UsersManagerProps {
  initialUsers: AdminUserItem[];
}

export function UsersManager({ initialUsers }: UsersManagerProps) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [vipFilter, setVipFilter] = useState<"all" | "vip" | "free">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "locked">("all");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUserItem | null>(null);
  const [vipModalUser, setVipModalUser] = useState<AdminUserItem | null>(null);
  const [customVipDate, setCustomVipDate] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Form thêm user mới
  const [addForm, setAddForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    isVIP: false,
    role: "USER" as "USER" | "ADMIN",
  });

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Thống kê số liệu tổng quan
  const stats = useMemo(() => {
    const total = users.length;
    const vipCount = users.filter((u) => u.isVIP).length;
    const freeCount = total - vipCount;
    const lockedCount = users.filter((u) => u.isLocked).length;
    const activeCount = total - lockedCount;
    const vipPercent = total > 0 ? Math.round((vipCount / total) * 100) : 0;

    return { total, vipCount, freeCount, lockedCount, activeCount, vipPercent };
  }, [users]);

  // Bộ lọc danh sách
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Tìm kiếm theo Email, Tên hoặc SĐT
      const matchSearch =
        !searchTerm.trim() ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (user.phone && user.phone.includes(searchTerm.trim()));

      // Lọc VIP
      const matchVip =
        vipFilter === "all" ||
        (vipFilter === "vip" && user.isVIP) ||
        (vipFilter === "free" && !user.isVIP);

      // Lọc Trạng thái Khóa
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !user.isLocked) ||
        (statusFilter === "locked" && user.isLocked);

      return matchSearch && matchVip && matchStatus;
    });
  }, [users, searchTerm, vipFilter, statusFilter]);

  // Xử lý bật/tắt VIP
  const handleToggleVip = (user: AdminUserItem) => {
    const newVip = !user.isVIP;
    // Cập nhật giao diện tức thì (Optimistic)
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isVIP: newVip } : u))
    );

    startTransition(async () => {
      const res = await toggleUserVip(user.id, newVip);
      if (res.success) {
        showToast(
          newVip
            ? `Đã nâng cấp tài khoản ${user.email} lên VIP thành công! 👑`
            : `Đã hạ gói tài khoản ${user.email} về FREE`
        );
      } else {
        // Rollback nếu lỗi
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isVIP: user.isVIP } : u))
        );
        showToast(res.error || "Có lỗi xảy ra", "error");
      }
    });
  };

  // Xử lý gia hạn / điều chỉnh thời hạn VIP
  const handleUpdateVipDuration = async (
    userId: string,
    action: "add_days" | "lifetime" | "expire_now" | "custom_date",
    days?: number,
    customDateVal?: string
  ) => {
    startTransition(async () => {
      const res = await updateUserVipDuration(userId, action, days, customDateVal);
      if (res.success && res.user) {
        const updatedUser = res.user;
        const daysLeft = computeVipDaysLeft(updatedUser.vipExpiresAt);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  isVIP: updatedUser.isVIP,
                  vipExpiresAt: updatedUser.vipExpiresAt,
                  vipDaysLeft: daysLeft,
                }
              : u
          )
        );
        if (vipModalUser && vipModalUser.id === userId) {
          setVipModalUser((prev) =>
            prev
              ? {
                  ...prev,
                  isVIP: updatedUser.isVIP,
                  vipExpiresAt: updatedUser.vipExpiresAt,
                  vipDaysLeft: daysLeft,
                }
              : null
          );
        }
        showToast("Đã cập nhật thời hạn VIP thành công! 🎉");
      } else {
        showToast(res.error || "Không thể cập nhật thời hạn VIP", "error");
      }
    });
  };

  // Xử lý Khóa / Mở khóa tài khoản
  const handleToggleLock = (user: AdminUserItem) => {
    const newLock = !user.isLocked;
    const actionText = newLock ? "khóa" : "mở khóa";

    if (
      !confirm(
        `Bạn có chắc chắn muốn ${actionText} tài khoản ${user.email}? ${newLock ? "Người dùng này sẽ không thể đăng nhập vào hệ thống." : ""
        }`
      )
    ) {
      return;
    }

    // Cập nhật giao diện tức thì
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isLocked: newLock } : u))
    );

    startTransition(async () => {
      const res = await toggleUserLock(user.id, newLock);
      if (res.success) {
        showToast(
          newLock
            ? `Đã khóa tài khoản ${user.email} thành công! 🔒`
            : `Đã mở khóa tài khoản ${user.email} thành công! 🔓`
        );
      } else {
        // Rollback nếu lỗi
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isLocked: user.isLocked } : u))
        );
        showToast(res.error || "Có lỗi xảy ra", "error");
      }
    });
  };

  // Xử lý Xóa tài khoản
  const handleDeleteUser = (user: AdminUserItem) => {
    if (
      !confirm(
        `CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản ${user.email}? Mọi dữ liệu liên quan sẽ bị xóa sạch!`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteUserByAdmin(user.id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        showToast(`Đã xóa vĩnh viễn tài khoản ${user.email}`);
      } else {
        showToast(res.error || "Không thể xóa tài khoản", "error");
      }
    });
  };

  // Xử lý Thêm User Mới
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!addForm.email || !addForm.password) {
      setModalError("Vui lòng nhập Email và Mật khẩu");
      return;
    }

    const res = await createUserByAdmin(addForm);
    if (res.success) {
      showToast(`Đã thêm người dùng mới ${addForm.email} thành công!`);
      setShowAddModal(false);
      // Thêm tạm vào danh sách
      const newUser: AdminUserItem = {
        id: "temp-" + Date.now(),
        email: addForm.email.toLowerCase(),
        name: addForm.name || null,
        phone: addForm.phone || null,
        role: addForm.role,
        isVIP: addForm.isVIP,
        isLocked: false,
        createdAt: new Date(),
        userCredit: { balance: addForm.isVIP ? 1000 : 100 },
      };
      setUsers((prev) => [newUser, ...prev]);
      setAddForm({
        email: "",
        password: "",
        name: "",
        phone: "",
        isVIP: false,
        role: "USER",
      });
    } else {
      setModalError(res.error || "Không thể tạo tài khoản");
    }
  };

  // Xử lý Đổi Mật Khẩu
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    setModalError("");

    if (!newPassword || newPassword.length < 6) {
      setModalError("Mật khẩu mới phải có tối thiểu 6 ký tự");
      return;
    }

    const res = await resetPasswordByAdmin(resetPasswordUser.id, newPassword);
    if (res.success) {
      showToast(`Đã đặt lại mật khẩu cho ${resetPasswordUser.email} thành công!`);
      setResetPasswordUser(null);
      setNewPassword("");
    } else {
      setModalError(res.error || "Lỗi khi đặt lại mật khẩu");
    }
  };

  return (
    <div className="space-y-6">
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

      {/* 4 Thẻ Thống Kê Tổng Quan (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tổng Users */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Tổng Người Dùng
            </span>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <span className="text-xs text-slate-400 mt-1 block">Tài khoản trên hệ thống</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        {/* Khách VIP Pro */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Crown size={14} className="text-amber-500 fill-amber-500" /> Khách VIP
            </span>
            <div className="text-2xl font-black text-amber-600">{stats.vipCount}</div>
            <span className="text-xs text-amber-700/80 mt-1 block font-semibold">
              Chiếm {stats.vipPercent}% tổng số
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center relative z-10">
            <Crown size={24} />
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-200/30 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Tài khoản FREE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Tài Khoản FREE
            </span>
            <div className="text-2xl font-black text-slate-700">{stats.freeCount}</div>
            <span className="text-xs text-slate-400 mt-1 block">Chưa nâng cấp</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Sparkles size={24} />
          </div>
        </div>

        {/* Tài khoản Bị Khóa */}
        <div
          className={`rounded-2xl p-5 border shadow-sm flex items-center justify-between ${stats.lockedCount > 0
            ? "bg-rose-50/70 border-rose-200 text-rose-900"
            : "bg-white border-slate-200 text-slate-900"
            }`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Lock size={14} className={stats.lockedCount > 0 ? "text-rose-600" : "text-slate-400"} />
              Tài Khoản Bị Khóa
            </span>
            <div className={`text-2xl font-black ${stats.lockedCount > 0 ? "text-rose-600" : "text-slate-700"}`}>
              {stats.lockedCount}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Bị ngắt quyền đăng nhập</span>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stats.lockedCount > 0 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
              }`}
          >
            <Lock size={24} />
          </div>
        </div>
      </div>

      {/* Thanh Công Cụ Tìm Kiếm & Bộ Lọc */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo Email, Tên hiển thị, Số điện thoại..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
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

          {/* Nút Thêm User Mới */}
          <button
            onClick={() => {
              setModalError("");
              setShowAddModal(true);
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus size={16} /> Thêm Người Dùng
          </button>
        </div>

        {/* Thanh chip bộ lọc nhanh */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Filter size={12} /> Bộ lọc:
          </span>

          {/* Lọc VIP */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setVipFilter("all")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${vipFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Tất cả VIP ({stats.total})
            </button>
            <button
              onClick={() => setVipFilter("vip")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${vipFilter === "vip"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-amber-600 hover:text-amber-700"
                }`}
            >
              <Crown size={11} /> Chỉ VIP 123 ({stats.vipCount})
            </button>
            <button
              onClick={() => setVipFilter("free")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${vipFilter === "free" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Chỉ FREE ({stats.freeCount})
            </button>
          </div>

          {/* Lọc Trạng Thái Khóa */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${statusFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Mọi trạng thái
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer text-emerald-700 ${statusFilter === "active" ? "bg-emerald-600 text-white shadow-sm" : "hover:text-emerald-800"
                }`}
            >
              Đang hoạt động ({stats.activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("locked")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer text-rose-700 ${statusFilter === "locked" ? "bg-rose-600 text-white shadow-sm" : "hover:text-rose-800"
                }`}
            >
              Đã bị khóa ({stats.lockedCount})
            </button>
          </div>

          {(searchTerm || vipFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setVipFilter("all");
                setStatusFilter("all");
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng Danh Sách Người Dùng */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                <th className="p-4 font-bold">Người Dùng</th>
                <th className="p-4 font-bold text-center">Gói & Thời Hạn VIP</th>
                <th className="p-4 font-bold text-center">Trạng Thái</th>
                <th className="p-4 font-bold text-center">Số Dư Credit</th>
                <th className="p-4 font-bold">Quyền & Ngày Tạo</th>
                <th className="p-4 font-bold text-right">Quản Trị / Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <Users size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">Không tìm thấy người dùng nào phù hợp</p>
                    <p className="text-xs mt-1 text-slate-400">Thử thay đổi từ khóa hoặc bộ lọc của bạn</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const initials = (user.name || user.email).slice(0, 2).toUpperCase();
                  const vipInfo = getVipStatusInfo(user.isVIP, user.vipExpiresAt);

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition-colors ${user.isLocked ? "bg-rose-50/30" : ""
                        }`}
                    >
                      {/* Cột 1: Thông tin User */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${user.isVIP
                              ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-500/20"
                              : user.isLocked
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                              }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <span className="truncate">{user.name || "Chưa đặt tên"}</span>
                              {user.role === "ADMIN" && (
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-1.5 py-0.2 rounded border border-purple-200">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 font-mono truncate">
                              <Mail size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                                <Phone size={10} className="text-slate-400 shrink-0" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Cấp độ VIP & Thời Hạn */}
                      <td className="p-4 text-center">
                        <div
                          onClick={() => {
                            setVipModalUser(user);
                            setCustomVipDate("");
                          }}
                          className="inline-flex flex-col items-center cursor-pointer group"
                          title="Bấm để xem và điều chỉnh thời hạn VIP"
                        >
                          {vipInfo.badgeType === "lifetime" && (
                            <>
                              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-sm shadow-amber-500/30 tracking-wide group-hover:scale-105 transition-transform">
                                <Crown size={13} className="fill-white" /> VIP Trọn Đời
                              </span>
                              <span className="text-[10px] text-amber-600 font-bold mt-1">Vĩnh viễn</span>
                            </>
                          )}

                          {vipInfo.badgeType === "active" && (
                            <>
                              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-sm shadow-amber-500/30 tracking-wide group-hover:scale-105 transition-transform">
                                <Crown size={13} className="fill-white" /> Còn {vipInfo.daysLeft} ngày
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                                <CalendarClock size={11} className="text-slate-400" />
                                {user.vipExpiresAt &&
                                  new Date(user.vipExpiresAt).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                              </span>
                            </>
                          )}

                          {vipInfo.badgeType === "expired" && (
                            <>
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold group-hover:scale-105 transition-transform">
                                <Clock size={12} /> Hết hạn VIP
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1">Đã hạ về Free</span>
                            </>
                          )}

                          {vipInfo.badgeType === "free" && (
                            <>
                              <span className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full text-xs font-semibold group-hover:scale-105 transition-transform">
                                Tài khoản FREE
                              </span>
                              <span className="text-[10px] text-blue-600 font-semibold mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                + Cấp hạn VIP
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: Trạng thái tài khoản */}
                      <td className="p-4 text-center">
                        {user.isLocked ? (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold">
                            <Lock size={12} /> ĐÃ KHÓA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                            <CheckCircle2 size={12} /> Hoạt động
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Số dư Credit */}
                      <td className="p-4 text-center font-mono">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <Coins size={12} className="text-amber-500" />
                          {user.userCredit?.balance ?? 0}
                        </span>
                      </td>

                      {/* Cột 5: Quyền & Ngày Tạo */}
                      <td className="p-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </td>

                      {/* Cột 6: Bộ nút Thao tác Quản trị */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Nút Quản Lý Thời Hạn VIP */}
                          <button
                            onClick={() => {
                              setVipModalUser(user);
                              setCustomVipDate("");
                            }}
                            disabled={isPending}
                            title="Quản lý và gia hạn thời hạn VIP"
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer border border-amber-200 active:scale-95"
                          >
                            <CalendarClock size={15} />
                          </button>

                          {/* Nút Chuyển VIP / Hạ VIP Nhanh */}
                          <button
                            onClick={() => handleToggleVip(user)}
                            disabled={isPending}
                            title={user.isVIP ? "Hạ về tài khoản FREE" : "Nâng cấp lên VIP Trọn đời"}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm ${user.isVIP
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                              : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-amber-500/20"
                              }`}
                          >
                            <Crown size={13} className={user.isVIP ? "text-slate-500" : "fill-white"} />
                            <span>{user.isVIP ? "Hạ FREE" : "Lên VIP"}</span>
                          </button>

                          {/* Nút Khóa TK / Mở TK */}
                          <button
                            onClick={() => handleToggleLock(user)}
                            disabled={isPending}
                            title={user.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản này"}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${user.isLocked
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                              }`}
                          >
                            {user.isLocked ? <Unlock size={13} /> : <Lock size={13} />}
                            <span>{user.isLocked ? "Mở Khóa" : "Khóa TK"}</span>
                          </button>

                          {/* Nút Đổi Mật Khẩu */}
                          <button
                            onClick={() => {
                              setModalError("");
                              setNewPassword("");
                              setResetPasswordUser(user);
                            }}
                            title="Đặt lại mật khẩu mới"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                          >
                            <Key size={15} />
                          </button>

                          {/* Nút Xóa User */}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            title="Xóa tài khoản vĩnh viễn"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          >
                            <Trash2 size={15} />
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

      {/* Modal Thêm Người Dùng Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                  <Users size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Thêm Người Dùng Mới</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email đăng nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="0987654321"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <Crown size={18} className="text-amber-500 fill-amber-500" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">Kích hoạt gói VIP</span>
                    <span className="text-[10px] text-amber-700">Được tặng 1.000 credits & mở khóa full tool</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={addForm.isVIP}
                  onChange={(e) => setAddForm({ ...addForm, isVIP: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
                >
                  Lưu Người Dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đổi Mật Khẩu */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-100 text-blue-600">
                  <Key size={16} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Đặt Lại Mật Khẩu</h3>
              </div>
              <button
                onClick={() => setResetPasswordUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-3.5">
              {modalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="text-xs text-slate-500">
                Đang đặt mật khẩu mới cho tài khoản:{" "}
                <strong className="text-slate-800 font-bold block mt-0.5">{resetPasswordUser.email}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer active:scale-95"
                >
                  Cập Nhật Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quản Lý & Gia Hạn Thời Hạn VIP */}
      {vipModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white shadow-md shadow-amber-500/25">
                  <Crown size={18} className="fill-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Quản Lý Thời Hạn VIP</h3>
                  <p className="text-xs text-slate-500">Gia hạn, cấp mới hoặc điều chỉnh số ngày VIP</p>
                </div>
              </div>
              <button
                onClick={() => setVipModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Thông tin học viên */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{vipModalUser.name || "Chưa đặt tên"}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{vipModalUser.email}</div>
                  {vipModalUser.phone && (
                    <div className="text-xs text-slate-400 font-mono mt-0.5">SĐT: {vipModalUser.phone}</div>
                  )}
                </div>
                <div className="text-right">
                  {(() => {
                    const info = getVipStatusInfo(vipModalUser.isVIP, vipModalUser.vipExpiresAt);
                    if (info.badgeType === "lifetime") {
                      return (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-black">
                          <Crown size={12} className="fill-amber-500 text-amber-500" /> VIP Trọn Đời
                        </span>
                      );
                    }
                    if (info.badgeType === "active") {
                      return (
                        <div>
                          <span className="inline-flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                            Còn {info.daysLeft} ngày
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            Hạn: {vipModalUser.vipExpiresAt && new Date(vipModalUser.vipExpiresAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      );
                    }
                    if (info.badgeType === "expired") {
                      return (
                        <div>
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold">
                            Đã Hết Hạn VIP
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">Hạ về Free</span>
                        </div>
                      );
                    }
                    return (
                      <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Tài khoản FREE
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Các nút gia hạn nhanh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  1. Gia Hạn Nhanh Số Ngày VIP:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdateVipDuration(vipModalUser.id, "add_days", 30)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-slate-800 text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                  >
                    <span className="text-sm font-black text-blue-600">+30 Ngày</span>
                    <span className="text-[10px] text-slate-400 font-normal">Gói 1 Tháng</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdateVipDuration(vipModalUser.id, "add_days", 90)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-slate-800 text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                  >
                    <span className="text-sm font-black text-blue-600">+90 Ngày</span>
                    <span className="text-[10px] text-slate-400 font-normal">Gói 3 Tháng</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdateVipDuration(vipModalUser.id, "add_days", 365)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-slate-800 text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                  >
                    <span className="text-sm font-black text-blue-600">+365 Ngày</span>
                    <span className="text-[10px] text-slate-400 font-normal">Gói 1 Năm</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdateVipDuration(vipModalUser.id, "lifetime")}
                    className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
                  >
                    <Crown size={14} className="fill-white" />
                    <span>VIP Trọn Đời (Vĩnh viễn)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpdateVipDuration(vipModalUser.id, "expire_now")}
                    className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <XCircle size={14} />
                    <span>Hạ Về FREE Ngay</span>
                  </button>
                </div>
              </div>

              {/* Tùy chỉnh ngày hết hạn cụ thể */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Hoặc Đặt Ngày Hết Hạn Tùy Chọn:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customVipDate}
                    onChange={(e) => setCustomVipDate(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    disabled={!customVipDate || isPending}
                    onClick={() =>
                      handleUpdateVipDuration(vipModalUser.id, "custom_date", undefined, customVipDate)
                    }
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shrink-0"
                  >
                    Áp Dụng Ngày
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setVipModalUser(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
