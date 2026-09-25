"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
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
  Save,
  RefreshCw,
  Zap,
  Pencil,
  UserCog,
} from "lucide-react";
import { useAdminMutation } from "@/hooks/useAdminMutation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  toggleUserVip,
  toggleUserLock,
  createUserByAdmin,
  resetPasswordByAdmin,
  deleteUserByAdmin,
  updateUserVipDuration,
  updateUserDailyFreeLimit,
  updateGlobalDailyFreeLimit,
} from "@/app/admin/users/actions";
import { computeVipDaysLeft, getVipStatusInfo } from "@/lib/vip-expiration";
import { VipPlanItem } from "@/lib/vip-plans";

export interface AdminUserItem {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  isVIP: boolean;
  vipExpiresAt?: Date | string | null;
  vipDaysLeft?: number | null;
  dailyFreeLimit?: number;
  remainingFree?: number | null;
  usedToday?: number;
  isLocked: boolean;
  createdAt: Date | string;
  userCredit?: { balance: number } | null;
}

interface UsersManagerProps {
  listControls?: ReactNode;
  initialUsers: AdminUserItem[];
  initialPlans?: VipPlanItem[];
  initialGlobalFreeLimit?: number;
}

export function UsersManager({
  listControls,
  initialUsers,
  initialPlans,
  initialGlobalFreeLimit = 12,
}: UsersManagerProps) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  useEffect(() => { queueMicrotask(() => setUsers(initialUsers)); }, [initialUsers]);
  const [globalFreeLimit, setGlobalFreeLimit] = useState<number>(initialGlobalFreeLimit);
  const [showGlobalFreeModal, setShowGlobalFreeModal] = useState<boolean>(false);
  const [globalFreeLimitValue, setGlobalFreeLimitValue] = useState<number>(initialGlobalFreeLimit);
  const vipPlans = initialPlans ?? [];

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUserItem | null>(null);
  const [vipModalUser, setVipModalUser] = useState<AdminUserItem | null>(null);
  const [customVipDate, setCustomVipDate] = useState("");
  const [selectedVipOption, setSelectedVipOption] = useState<{
    type: "plan" | "quick_days" | "custom_date" | "expire_now";
    planId?: string;
    days?: number;
    isLifetime?: boolean;
    name: string;
    customDate?: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Modal cài đặt số lượt Free
  const [freeLimitUser, setFreeLimitUser] = useState<AdminUserItem | null>(null);
  const [editFreeLimitValue, setEditFreeLimitValue] = useState<number>(12);

  // Form thêm user mới
  const [addForm, setAddForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    isVIP: false,
    role: "USER" as "USER" | "ADMIN",
    dailyFreeLimit: globalFreeLimit,
  });

  // Mở modal cài đặt số lượt Free chung cho toàn hệ thống
  const openGlobalFreeModal = () => {
    setGlobalFreeLimitValue(globalFreeLimit);
    setModalError("");
    setShowGlobalFreeModal(true);
  };

  // Lưu cài đặt số lượt Free CHUNG cho TẤT CẢ tài khoản FREE
  const handleSaveGlobalFreeLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLimit = Math.max(0, Math.floor(Number(globalFreeLimitValue) || 0));

    startTransition(async () => {
      const res = await updateGlobalDailyFreeLimit(newLimit);
      if (res.success) {
        setGlobalFreeLimit(newLimit);
        // Đồng bộ ngay lập tức cho toàn bộ học viên FREE trong danh sách
        setUsers((prev) =>
          prev.map((u) => {
            if (!u.isVIP) {
              const used = u.usedToday ?? 0;
              return {
                ...u,
                dailyFreeLimit: newLimit,
                remainingFree: Math.max(0, newLimit - used),
              };
            }
            return u;
          })
        );
        showToast(
          `Đã áp dụng định mức ${newLimit} lượt/ngày cho tài khoản FREE trong hệ thống! ⚡`
        );
        setShowGlobalFreeModal(false);
      } else {
        showToast(res.error || "Không thể cập nhật số lượt Free chung", "error");
      }
    });
  };

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [isPending, startTransition] = useAdminMutation((message) => showToast(message, "error"));

  // Thống kê số liệu trang hiện tại
  const stats = useMemo(() => {
    const total = users.length;
    const vipCount = users.filter((u) => u.isVIP).length;
    const freeCount = total - vipCount;
    const lockedCount = users.filter((u) => u.isLocked).length;
    const activeCount = total - lockedCount;
    const vipPercent = total > 0 ? Math.round((vipCount / total) * 100) : 0;

    return { total, vipCount, freeCount, lockedCount, activeCount, vipPercent };
  }, [users]);

  const filteredUsers = users;

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

  // Mở modal nâng cấp VIP với tùy chọn mặc định
  const openVipModal = (user: AdminUserItem) => {
    setVipModalUser(user);
    setCustomVipDate("");
    const popPlan = vipPlans.find((p) => p.isPopular) || vipPlans[0];
    if (popPlan) {
      const isLife = !popPlan.durationDays || popPlan.durationDays === 0;
      setSelectedVipOption({
        type: "plan",
        planId: popPlan.id || popPlan.slug,
        days: popPlan.durationDays ?? undefined,
        isLifetime: isLife,
        name: `${popPlan.name} (${isLife ? "Trọn đời" : `+${popPlan.durationDays} ngày`})`,
      });
    } else {
      setSelectedVipOption({
        type: "quick_days",
        days: 30,
        name: "+30 Ngày (Gói 1 Tháng)",
      });
    }
  };

  // Xác nhận lưu và áp dụng gói VIP đã chọn từ Modal
  const handleApplyVipSelection = async () => {
    if (!vipModalUser || !selectedVipOption) return;

    if (selectedVipOption.type === "plan") {
      if (selectedVipOption.isLifetime) {
        await handleUpdateVipDuration(vipModalUser.id, "lifetime");
      } else {
        await handleUpdateVipDuration(vipModalUser.id, "add_days", selectedVipOption.days || 30);
      }
    } else if (selectedVipOption.type === "quick_days") {
      await handleUpdateVipDuration(vipModalUser.id, "add_days", selectedVipOption.days || 30);
    } else if (selectedVipOption.type === "custom_date") {
      if (!selectedVipOption.customDate) {
        showToast("Vui lòng chọn ngày hết hạn hợp lệ", "error");
        return;
      }
      await handleUpdateVipDuration(
        vipModalUser.id,
        "custom_date",
        undefined,
        selectedVipOption.customDate
      );
    } else if (selectedVipOption.type === "expire_now") {
      await handleUpdateVipDuration(vipModalUser.id, "expire_now");
    }

    setVipModalUser(null);
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
      const limit = Number(addForm.dailyFreeLimit) || 12;
      const newUser: AdminUserItem = {
        id: "temp-" + Date.now(),
        email: addForm.email.toLowerCase(),
        name: addForm.name || null,
        phone: addForm.phone || null,
        role: addForm.role,
        isVIP: addForm.isVIP,
        dailyFreeLimit: limit,
        remainingFree: addForm.isVIP ? null : limit,
        usedToday: 0,
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
        dailyFreeLimit: 12,
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

      {/* Tiêu đề trang Quản lý Người dùng */}
      <AdminPageHeader
        title="Quản Lý Người Dùng & Học Viên"
        subtitle="Cấp quyền VIP, phân bổ định mức lượt dùng AI miễn phí, đổi mật khẩu và quản lý trạng thái tài khoản."
        icon={UserCog}
        iconGradient="from-indigo-600 to-violet-600"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
            {stats.total} tài khoản
          </span>
        }
      />

      {/* 4 Thẻ Thống Kê Tổng Quan (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
        {/* Tổng Users */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Tài Khoản Trên Trang
            </span>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <span className="text-xs text-slate-400 mt-1 block">Trong trang đang xem</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        {/* Khách VIP Pro */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-amber-200 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Crown size={14} className="text-amber-500 fill-amber-500" /> Khách VIP
            </span>
            <div className="text-2xl font-black text-amber-600">{stats.vipCount}</div>
            <span className="text-xs text-amber-700/80 mt-1 block font-semibold">
              Chiếm {stats.vipPercent}% trên trang
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center relative z-10">
            <Crown size={24} />
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-200/30 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Tài khoản FREE */}
        <div
          onClick={openGlobalFreeModal}
          className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-300 hover:shadow-md transition-all group"
          title="Bấm để cài đặt số lượt Free chung cho toàn bộ học viên Free"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Tài Khoản FREE
            </span>
            <div className="text-2xl font-black text-slate-700">{stats.freeCount}</div>
            <span className="text-xs text-amber-600 group-hover:text-amber-700 font-bold mt-1 flex items-center gap-1">
              <Zap size={12} className="fill-amber-500 text-amber-500" />
              Định mức: {globalFreeLimit} lượt/ngày ✏️
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 group-hover:scale-105 transition-all">
            <Zap size={24} className="fill-amber-500" />
          </div>
        </div>

        {/* Tài khoản Bị Khóa */}
        <div
          className={`rounded-2xl p-3.5 sm:p-4 border shadow-sm flex items-center justify-between ${stats.lockedCount > 0
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
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-3.5 shadow-sm space-y-2.5 shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-start gap-4">
          <div className="min-w-0 flex-1">{listControls}</div>
          {/* Nút Thêm User Mới */}
          <button
            onClick={() => {
              setModalError("");
              setShowAddModal(true);
            }}
            className="w-full sm:w-auto sm:self-start xl:mt-5 shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus size={16} /> Thêm Người Dùng
          </button>
        </div>

      </div>

      {/* Bảng Danh Sách Người Dùng (Chỉ cuộn trong bảng) */}
      <div className="flex-1 min-h-[260px] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 shadow-2xs">
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                <th className="px-3.5 py-3 font-bold bg-slate-50 sticky top-0 whitespace-nowrap">Người Dùng</th>
                <th className="px-3.5 py-3 font-bold text-center bg-slate-50 sticky top-0 whitespace-nowrap">Gói VIP & Hạn</th>
                <th className="px-3.5 py-3 font-bold text-center bg-slate-50 sticky top-0 whitespace-nowrap">Trạng Thái</th>
                <th className="px-3.5 py-3 font-bold text-center bg-slate-50 sticky top-0 whitespace-nowrap">Lượt Free</th>
                <th className="px-3.5 py-3 font-bold bg-slate-50 sticky top-0 whitespace-nowrap">Ngày Tạo</th>
                <th className="px-3.5 py-3 font-bold text-center bg-slate-50 sticky top-0 whitespace-nowrap">Thao Tác</th>
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
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${user.isVIP
                              ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-xs"
                              : user.isLocked
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                              }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                              <span className="truncate max-w-[140px] sm:max-w-[170px]">{user.name || "Chưa đặt tên"}</span>
                              {user.role === "ADMIN" && (
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-1.5 py-0.2 rounded border border-purple-200 shrink-0">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono truncate max-w-[160px] sm:max-w-[190px]">
                              <Mail size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono mt-0.5 whitespace-nowrap">
                                <Phone size={10} className="text-slate-400 shrink-0" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Cấp độ VIP & Thời Hạn */}
                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        <div
                          onClick={() => {
                            setVipModalUser(user);
                            setCustomVipDate("");
                          }}
                          className="inline-flex flex-col items-center cursor-pointer group whitespace-nowrap"
                          title="Bấm để xem và điều chỉnh thời hạn VIP"
                        >
                          {vipInfo.badgeType === "lifetime" && (
                            <>
                              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-2.5 py-0.5 rounded-full text-xs font-black shadow-xs tracking-wide group-hover:scale-105 transition-transform whitespace-nowrap">
                                <Crown size={12} className="fill-white" /> VIP Trọn Đời
                              </span>
                              <span className="text-[10px] text-amber-600 font-bold mt-0.5 block whitespace-nowrap">Vĩnh viễn</span>
                            </>
                          )}

                          {vipInfo.badgeType === "active" && (
                            <>
                              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2.5 py-0.5 rounded-full text-xs font-black shadow-xs tracking-wide group-hover:scale-105 transition-transform whitespace-nowrap">
                                <Crown size={12} className="fill-white" /> Còn {vipInfo.daysLeft} ngày
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
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
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-bold group-hover:scale-105 transition-transform whitespace-nowrap">
                                <Clock size={11} /> Hết hạn VIP
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5 block whitespace-nowrap">Đã về Free</span>
                            </>
                          )}

                          {vipInfo.badgeType === "free" && (
                            <>
                              <span className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-semibold group-hover:scale-105 transition-transform whitespace-nowrap">
                                Tài khoản FREE
                              </span>
                              <span className="text-[10px] text-blue-600 font-semibold mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                + Cấp hạn VIP
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: Trạng thái tài khoản */}
                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        {user.isLocked ? (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap">
                            <Lock size={12} /> Đã khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap">
                            <CheckCircle2 size={12} /> Hoạt động
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Số Lượt Free Còn Lại */}
                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        {user.isVIP ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/80 shadow-2xs whitespace-nowrap"
                            title="VIP không giới hạn lượt dùng AI mỗi ngày"
                          >
                            <Crown size={12} className="text-amber-500 fill-amber-500" />
                            Không giới hạn
                          </span>
                        ) : (
                          <div className="inline-flex items-center justify-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={openGlobalFreeModal}
                              className="group inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900 px-2 py-0.5 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                              title="Bấm để cài đặt số lượt Free chung cho toàn bộ tài khoản FREE"
                            >
                              <Zap size={12} className="text-amber-500 fill-amber-500" />
                              <span className="font-mono">
                                Còn <strong className={user.remainingFree === 0 ? "text-rose-600" : "text-emerald-700"}>{user.remainingFree ?? globalFreeLimit}</strong>/{user.dailyFreeLimit ?? globalFreeLimit}
                              </span>
                              <Pencil size={10} className="text-slate-400 group-hover:text-amber-600 opacity-60" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Cột 5: Quyền & Ngày Tạo */}
                      <td className="px-3.5 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium text-slate-700 whitespace-nowrap">
                          <Calendar size={11} className="text-slate-400 shrink-0" />
                          <span>{new Date(user.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono whitespace-nowrap">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </td>

                      {/* Cột 6: Bộ nút Thao tác Quản trị */}
                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1 flex-nowrap shrink-0 whitespace-nowrap">
                          {/* Nút Quản Lý Thời Hạn VIP */}
                          <button
                            onClick={() => openVipModal(user)}
                            disabled={isPending}
                            title="Quản lý và gia hạn thời hạn VIP"
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer border border-amber-200 active:scale-95 shrink-0"
                          >
                            <CalendarClock size={14} />
                          </button>

                          {/* Nút Chuyển VIP / Hạ VIP */}
                          <button
                            onClick={() => {
                              if (user.isVIP) {
                                if (
                                  confirm(
                                    `Bạn có chắc chắn muốn hạ tài khoản ${user.email} về FREE không?`
                                  )
                                ) {
                                  handleToggleVip(user);
                                }
                              } else {
                                openVipModal(user);
                              }
                            }}
                            disabled={isPending}
                            title={user.isVIP ? "Hạ về tài khoản FREE" : "Chọn gói VIP để nâng cấp"}
                            className={`text-xs font-bold px-2 py-1 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs whitespace-nowrap shrink-0 ${user.isVIP
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                              : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-amber-500/20"
                              }`}
                          >
                            <Crown size={12} className={user.isVIP ? "text-slate-500" : "fill-white"} />
                            <span>{user.isVIP ? "Hạ FREE" : "Lên VIP"}</span>
                          </button>

                          {/* Nút Khóa TK / Mở TK */}
                          <button
                            onClick={() => handleToggleLock(user)}
                            disabled={isPending}
                            title={user.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản này"}
                            className={`text-xs font-bold px-2 py-1 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${user.isLocked
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                              }`}
                          >
                            {user.isLocked ? <Unlock size={12} /> : <Lock size={12} />}
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200 shrink-0"
                          >
                            <Key size={14} />
                          </button>

                          {/* Nút Xóa User */}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            title="Xóa tài khoản vĩnh viễn"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200 shrink-0"
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


              {/* <div className="flex items-center justify-between p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
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
              </div> */}

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

      {/* Modal Quản Lý & Chọn Loại VIP (Có Nút Lưu Mới Áp Dụng) */}
      {vipModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setVipModalUser(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 my-auto animate-in zoom-in-95 duration-150 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white shadow-md shadow-amber-500/25 shrink-0">
                  <Crown size={22} className="fill-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">
                    {vipModalUser.isVIP ? "Quản Lý & Gia Hạn Gói VIP" : "Nâng Cấp Gói VIP Cho Học Viên"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {vipModalUser.isVIP
                      ? "Chọn gói hoặc số ngày muốn gia hạn, sau đó bấm Lưu để áp dụng"
                      : "Chọn loại gói VIP muốn cấp, sau đó bấm Lưu để kích hoạt"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVipModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-7 space-y-6 max-h-[78vh] overflow-y-auto custom-scrollbar">
              {/* Thông tin học viên */}
              <div className="p-4 sm:p-4.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-black text-slate-900 text-base">{vipModalUser.name || "Chưa đặt tên"}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{vipModalUser.email}</div>
                  {vipModalUser.phone && (
                    <div className="text-xs text-slate-500 font-mono mt-0.5">SĐT: {vipModalUser.phone}</div>
                  )}
                </div>
                <div className="text-right">
                  {(() => {
                    const info = getVipStatusInfo(vipModalUser.isVIP, vipModalUser.vipExpiresAt);
                    if (info.badgeType === "lifetime") {
                      return (
                        <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-1.5 rounded-full text-xs font-black shadow-2xs">
                          <Crown size={14} className="fill-amber-500 text-amber-500" /> VIP Trọn Đời
                        </span>
                      );
                    }
                    if (info.badgeType === "active") {
                      return (
                        <div>
                          <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
                            Còn {info.daysLeft} ngày
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-1 font-medium">
                            Hạn: {vipModalUser.vipExpiresAt && new Date(vipModalUser.vipExpiresAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      );
                    }
                    if (info.badgeType === "expired") {
                      return (
                        <div>
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-rose-200">
                            Đã Hết Hạn VIP
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-1 font-medium">Hạ về Free</span>
                        </div>
                      );
                    }
                    return (
                      <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                        Tài khoản FREE
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* 1. Danh Sách Gói Cước VIP Cấu Hình */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span className="text-slate-900 font-extrabold text-sm">1. Chọn Gói Cước VIP:</span>
                  <span className="text-xs text-slate-400 font-normal">Nhấp để chọn gói</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {vipPlans.map((plan) => {
                    const isLifetime = !plan.durationDays || plan.durationDays === 0;
                    const isSelected =
                      selectedVipOption?.type === "plan" &&
                      selectedVipOption?.planId === (plan.id || plan.slug);

                    return (
                      <div
                        key={plan.id || plan.slug}
                        onClick={() => {
                          setSelectedVipOption({
                            type: "plan",
                            planId: plan.id || plan.slug,
                            days: plan.durationDays ?? undefined,
                            isLifetime,
                            name: `${plan.name} (${isLifetime ? "Trọn đời" : `+${plan.durationDays} ngày`})`,
                          });
                        }}
                        className={`p-4 sm:p-4.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer active:scale-95 group ${isSelected
                          ? "border-amber-500 bg-amber-50/90 shadow-md shadow-amber-500/20 ring-2 ring-amber-500/40 scale-[1.02] z-10"
                          : isLifetime
                            ? "bg-gradient-to-br from-amber-50/60 via-yellow-50/40 to-white border-amber-200/90 hover:border-amber-300 hover:shadow-xs"
                            : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-xs"
                          }`}
                      >
                        {/* Hàng trên cùng: Badge tag (nếu có) riêng biệt, không đè lên text */}
                        <div className="flex items-center justify-between gap-1.5 mb-2.5 min-h-[22px]">
                          {plan.isPopular || plan.tag ? (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                              ★ {plan.tag || "Khuyên Dùng"}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400">
                              {isLifetime ? "Gói VIP Cao Cấp" : "Gói Tiêu Chuẩn"}
                            </span>
                          )}
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded-full">
                              <Check size={11} className="stroke-[3]" />
                            </span>
                          )}
                        </div>

                        {/* Tiêu đề & Icon */}
                        <div className="space-y-1 my-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1.5 rounded-xl shrink-0 ${isLifetime ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                                }`}
                            >
                              {isLifetime ? (
                                <Crown size={17} className="fill-amber-500 text-amber-500" />
                              ) : (
                                <Sparkles size={17} />
                              )}
                            </div>
                            <span className={`text-sm font-black ${isLifetime ? "text-amber-950" : "text-slate-900"}`}>
                              {plan.name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium pl-8">
                            {isLifetime ? "Vĩnh viễn (Trọn đời)" : `+${plan.durationDays} Ngày (${plan.period})`}
                          </p>
                        </div>

                        {/* Giá tiền & Nút chọn */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-medium">Giá gói</span>
                            <span className={`text-sm sm:text-base font-black ${isLifetime ? "text-amber-700" : "text-blue-600"}`}>
                              {plan.price.toLocaleString("vi-VN")} đ
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1 ${isSelected
                              ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                              : isLifetime
                                ? "bg-amber-100 text-amber-900 group-hover:bg-amber-200"
                                : "bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700"
                              }`}
                          >
                            {isSelected ? (
                              <>
                                <Check size={12} className="stroke-[3]" />
                                <span>Đang chọn</span>
                              </>
                            ) : (
                              <span>Chọn gói</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Gia Hạn Nhanh Số Ngày Tùy Chọn */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-900 font-extrabold text-sm uppercase tracking-wider mb-3">
                  2. Hoặc Gia Hạn Nhanh Số Ngày:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {[
                    { label: "+30 Ngày", days: 30, sub: "1 Tháng" },
                    { label: "+90 Ngày", days: 90, sub: "3 Tháng" },
                    { label: "+180 Ngày", days: 180, sub: "6 Tháng" },
                    { label: "+365 Ngày", days: 365, sub: "1 Năm" },
                  ].map((btn) => {
                    const isSelected =
                      selectedVipOption?.type === "quick_days" && selectedVipOption?.days === btn.days;
                    return (
                      <button
                        key={btn.days}
                        type="button"
                        onClick={() => {
                          setSelectedVipOption({
                            type: "quick_days",
                            days: btn.days,
                            name: `${btn.label} (${btn.sub})`,
                          });
                        }}
                        className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/30 shadow-xs"
                          : "border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-slate-800 shadow-2xs"
                          }`}
                      >
                        <span className="text-sm font-black text-blue-600">{btn.label}</span>
                        <span className="text-xs text-slate-400 font-normal">{btn.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Đặt ngày hết hạn cụ thể từ lịch */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-900 font-extrabold text-sm uppercase tracking-wider mb-2.5">
                  3. Hoặc Đặt Ngày Hết Hạn Tùy Chọn:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={customVipDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomVipDate(val);
                      if (val) {
                        setSelectedVipOption({
                          type: "custom_date",
                          customDate: val,
                          name: `Hết hạn ngày: ${new Date(val).toLocaleDateString("vi-VN")}`,
                        });
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  {selectedVipOption?.type === "custom_date" && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 border border-emerald-200 shrink-0">
                      <Check size={14} className="stroke-[3]" /> Đã chọn ngày này
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Nút Hạ Về FREE nếu đang là VIP */}
              {vipModalUser.isVIP && (
                <div
                  onClick={() => {
                    setSelectedVipOption({
                      type: "expire_now",
                      name: "Hạ cấp về tài khoản FREE ngay",
                    });
                  }}
                  className={`pt-3 border-t border-slate-100 flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border ${selectedVipOption?.type === "expire_now"
                    ? "bg-rose-100 border-rose-400 ring-2 ring-rose-500/30"
                    : "bg-rose-50/70 border-rose-200 hover:border-rose-300"
                    }`}
                >
                  <div>
                    <span className="text-sm font-bold text-rose-900 block">Hạ cấp tài khoản về FREE</span>
                    <span className="text-xs text-rose-600">Thu hồi toàn bộ quyền lợi VIP của học viên này</span>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shrink-0 ${selectedVipOption?.type === "expire_now"
                      ? "bg-rose-700 text-white shadow-xs"
                      : "bg-rose-600 text-white hover:bg-rose-700"
                      }`}
                  >
                    <XCircle size={15} />
                    <span>{selectedVipOption?.type === "expire_now" ? "Đang chọn hạ" : "Chọn hạ FREE"}</span>
                  </span>
                </div>
              )}

              {/* Hộp Preview Tóm Tắt Lựa Chọn */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-300/80 flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                    Gói VIP chuẩn bị áp dụng:
                  </span>
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <Sparkles size={16} className="text-amber-500 shrink-0" />
                    <span>{selectedVipOption ? selectedVipOption.name : "Chưa chọn gói nào"}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-900 bg-amber-200/90 px-3.5 py-1.5 rounded-full shrink-0">
                  Chờ bấm Lưu & Áp Dụng
                </span>
              </div>
            </div>

            {/* Footer Modal: Hủy và NÚT LƯU ÁP DỤNG */}
            <div className="px-6 sm:px-7 py-4.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setVipModalUser(null)}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer shadow-xs transition"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                disabled={!selectedVipOption || isPending}
                onClick={handleApplyVipSelection}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-500/25 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Lưu & Áp Dụng VIP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cài Đặt Số Lượt Free Chung Cho Toàn Bộ Tài Khoản FREE */}
      {showGlobalFreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/80 to-orange-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Zap size={20} className="fill-slate-950" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Lượt Free Chung</h3>
                  <p className="text-[11px] text-slate-500">Áp dụng cho tất cả tài khoản FREE trên hệ thống</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGlobalFreeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveGlobalFreeLimit} className="p-6 space-y-5">
              {/* Summary info */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">Phạm vi cài đặt</span>
                  <div className="font-black text-slate-900 text-sm mt-0.5">Tất Cả Tài Khoản FREE</div>
                  <div className="text-xs text-amber-800 font-medium mt-0.5">
                    Đồng bộ cho {stats.freeCount} tài khoản & đăng ký mới
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-amber-700 font-bold block uppercase tracking-wider">Hiện tại</span>
                  <span className="text-base font-black text-amber-700 font-mono">
                    {globalFreeLimit} lượt/ngày
                  </span>
                </div>
              </div>

              {/* Number input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Số lượt Free mỗi ngày (Lượt / ngày):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    required
                    value={globalFreeLimitValue}
                    onChange={(e) => setGlobalFreeLimitValue(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    lượt / ngày
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Chọn nhanh định mức:
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {[12, 20, 30, 50, 100].map((num) => {
                    const isSelected = globalFreeLimitValue === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGlobalFreeLimitValue(num)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center active:scale-95 ${isSelected
                          ? "bg-amber-500 text-slate-950 border-amber-500 font-black shadow-xs ring-2 ring-amber-500/30"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300"
                          }`}
                      >
                        {num === 12 ? "12 (Gốc)" : num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info Note */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Đồng bộ toàn hệ thống:
                </div>
                <div>
                  • Toàn bộ <strong>{stats.freeCount} tài khoản FREE</strong> hiện có sẽ được cập nhật định mức mới ngay lập tức.
                </div>
                <div>
                  • Số lượt dùng AI sẽ tự động làm mới vào lúc <strong>00:00 mỗi ngày (GMT+7)</strong>.
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGlobalFreeModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/25 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save size={13} />
                      <span>Lưu & Áp Dụng Cho Tất Cả</span>
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
