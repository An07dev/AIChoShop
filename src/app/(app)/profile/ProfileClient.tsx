"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Crown,
  Sparkles,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Zap,
  Lock,
  Key,
  ArrowRight,
  LogOut,
  Award,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Clock,
  ChevronRight,
  MessageCircle,
  QrCode,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { updateUserProfile, changeUserPassword, requestVipActivation } from "@/app/actions/profile";
import { logoutUser } from "@/app/actions/auth";

interface ProfileClientProps {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: string;
    isVIP: boolean;
    createdAt: string;
    creditBalance: number;
    completedLessons: Array<{
      lessonId: string;
      lessonTitle: string;
      courseTitle: string;
      completedAt: string;
    }>;
    transactions: Array<{
      id: string;
      amount: number;
      status: string;
      type: string;
      createdAt: string;
    }>;
  };
  totalCourses: number;
  totalLessons: number;
}

export default function ProfileClient({ user, totalCourses, totalLessons }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"vip" | "info" | "security" | "history">("vip");

  // Form State Profile
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // VIP Package Selection
  const [selectedPlan, setSelectedPlan] = useState<"month" | "year" | "lifetime">("lifetime");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRequestingVip, setIsRequestingVip] = useState(false);
  const [vipSuccessNotice, setVipSuccessNotice] = useState<string | null>(null);

  interface VipPlan {
    name: string;
    price: number;
    period: string;
    originalPrice: number;
    desc: string;
    tag: string;
    isPopular?: boolean;
  }

  const vipPlans: Record<"month" | "year" | "lifetime", VipPlan> = {
    month: {
      name: "Gói 1 Tháng",
      price: 299000,
      period: "/ tháng",
      originalPrice: 499000,
      desc: "Trải nghiệm sức mạnh toàn bộ công cụ AI và khóa học",
      tag: "Trải Nghiệm",
      isPopular: false,
    },
    year: {
      name: "Gói 1 Năm",
      price: 1290000,
      period: "/ năm",
      originalPrice: 3588000,
      desc: "Tiết kiệm 65%, tặng kèm bộ 100+ Prompt AI bán hàng độc quyền",
      tag: "Tiết Kiệm 65%",
      isPopular: false,
    },
    lifetime: {
      name: "Gói Trọn Đời",
      price: 1990000,
      period: "vĩnh viễn",
      originalPrice: 5990000,
      desc: "Sở hữu vĩnh viễn, cập nhật mọi tính năng & khóa học mới trọn đời",
      tag: "Khuyên Dùng - Phổ Biến Nhất",
      isPopular: true,
    },
  };

  const currentPlan = vipPlans[selectedPlan];
  const transferContent = `VIP ${user.phone || user.email.split("@")[0]}`;

  // Copy helper
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);

    const res = await updateUserProfile(formData);
    setIsUpdatingProfile(false);
    if (res.success) {
      setProfileMessage({ type: "success", text: res.message || "Cập nhật thành công!" });
    } else {
      setProfileMessage({ type: "error", text: res.error || "Có lỗi xảy ra!" });
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage(null);

    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    const res = await changeUserPassword(formData);
    setIsChangingPassword(false);
    if (res.success) {
      setPasswordMessage({ type: "success", text: res.message || "Đổi mật khẩu thành công!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMessage({ type: "error", text: res.error || "Có lỗi xảy ra!" });
    }
  };

  // Handle Request VIP
  const handleRequestVip = async () => {
    setIsRequestingVip(true);
    setVipSuccessNotice(null);
    const res = await requestVipActivation(selectedPlan.toUpperCase(), currentPlan.price);
    setIsRequestingVip(false);
    if (res.success) {
      setVipSuccessNotice(res.message || "Yêu cầu đã được ghi nhận!");
    }
  };

  const completedCount = user.completedLessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const memberSince = new Date(user.createdAt).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* ── 1. HERO PROFILE CARD ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-10 text-white border border-slate-800 shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Initials */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white font-black text-3xl sm:text-4xl shadow-xl shadow-blue-500/20 border-2 border-white/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {user.isVIP && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 p-1.5 rounded-full shadow-lg border-2 border-slate-900">
                  <Crown size={16} className="text-slate-950 fill-slate-950" />
                </div>
              )}
            </div>

            {/* Name & Basic Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {user.name}
                </h1>
                {user.isVIP ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20">
                    <Crown size={13} className="fill-slate-950" /> VIP MEMBER
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700">
                    Gói Miễn Phí (FREE)
                  </span>
                )}
                {user.role === "ADMIN" && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[11px] border border-blue-400/30">
                    Admin
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                <span>{user.email}</span>
                {user.phone && (
                  <>
                    <span className="text-slate-600">•</span>
                    <Phone size={14} className="text-slate-400" />
                    <span>{user.phone}</span>
                  </>
                )}
              </p>

              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Calendar size={13} />
                <span>Tham gia ngày: {memberSince}</span>
              </p>
            </div>
          </div>

          {/* Quick CTA */}
          <div className="flex items-center gap-3">
            {!user.isVIP ? (
              <button
                onClick={() => setActiveTab("vip")}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
              >
                <Crown size={16} className="fill-slate-950" />
                <span>Nâng Cấp VIP PRO</span>
              </button>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-3 text-emerald-400 flex items-center gap-2.5">
                <CheckCircle2 size={20} />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">Đặc quyền VIP PRO</div>
                  <div className="text-[11px] text-emerald-300/80">Kích hoạt vĩnh viễn • Full tính năng</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-slate-400 text-xs font-medium block">Gói tài khoản</span>
            <span className="text-lg sm:text-xl font-black text-white mt-0.5 block flex items-center gap-1.5">
              {user.isVIP ? (
                <>
                  <Crown size={16} className="text-amber-400" /> VIP PRO
                </>
              ) : (
                "FREE Member"
              )}
            </span>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-slate-400 text-xs font-medium block">Tiến độ bài học</span>
            <span className="text-lg sm:text-xl font-black text-white mt-0.5 block">
              {completedCount}/{totalLessons} bài ({progressPercent}%)
            </span>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-slate-400 text-xs font-medium block">Khóa học khả dụng</span>
            <span className="text-lg sm:text-xl font-black text-white mt-0.5 block">
              {totalCourses} khóa thực chiến
            </span>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-slate-400 text-xs font-medium block">Công cụ AI bán hàng</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5 block">
              {user.isVIP ? "8/8 Mở khóa" : "Giới hạn (Free)"}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. TAB NAVIGATION ───────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 overflow-x-auto custom-scrollbar gap-2">
        <button
          onClick={() => setActiveTab("vip")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "vip"
              ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Crown size={17} className={activeTab === "vip" ? "text-amber-500" : "text-slate-400"} />
          <span>Gói VIP & Nâng Cấp</span>
        </button>

        <button
          onClick={() => setActiveTab("info")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "info"
              ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <User size={17} className={activeTab === "info" ? "text-blue-600" : "text-slate-400"} />
          <span>Thông Tin Cá Nhân</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "security"
              ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Lock size={17} className={activeTab === "security" ? "text-blue-600" : "text-slate-400"} />
          <span>Đổi Mật Khẩu & Bảo Mật</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock size={17} className={activeTab === "history" ? "text-blue-600" : "text-slate-400"} />
          <span>Tiến Độ & Lịch Sử</span>
        </button>
      </div>

      {/* ── 3. TAB 1: VIP MEMBERSHIP & UPGRADE ───────────────────────────────────── */}
      {activeTab === "vip" && (
        <div className="space-y-8">
          {/* Status Alert Banner */}
          {user.isVIP ? (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent border border-amber-300/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  <Crown size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Tài Khoản Đang Kích Hoạt VIP PRO</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Bạn đang có đầy đủ mọi quyền lợi cao cấp nhất của AIChoShop: không giới hạn 8 công cụ AI và trọn bộ khóa học Masterclass.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/learn"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <BookOpen size={14} /> Vào Học Ngay
                </Link>
                <Link
                  href="/tools"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-amber-500/20"
                >
                  <Zap size={14} /> Dùng AI Tools
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Nâng Cấp VIP PRO Để Mở Khóa Trọn Bộ</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Mở khóa không giới hạn 8 công cụ AI bán hàng Shopee/TikTok và toàn bộ bài giảng thực chiến từ chuyên gia.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Cards */}
          <div>
            <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Chọn Gói VIP Phù Hợp Với Bạn
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Đầu tư 1 lần – Tăng tốc doanh số bán hàng TMĐT bền vững cùng hệ thống AI hàng đầu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(Object.keys(vipPlans) as Array<keyof typeof vipPlans>).map((key) => {
                const plan = vipPlans[key];
                const isSelected = selectedPlan === key;

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`relative rounded-3xl p-6 sm:p-7 transition-all cursor-pointer flex flex-col justify-between border-2 ${
                      isSelected
                        ? "border-amber-500 bg-white shadow-xl shadow-amber-500/10 scale-[1.02]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[11px] px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                        {plan.tag}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-lg text-slate-900">{plan.name}</h3>
                        {!plan.isPopular && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {plan.tag}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 min-h-[32px]">{plan.desc}</p>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-xs text-slate-400 line-through">
                          {plan.originalPrice.toLocaleString("vi-VN")} đ
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-3xl font-black text-slate-900">
                            {plan.price.toLocaleString("vi-VN")}
                          </span>
                          <span className="text-sm font-bold text-slate-500">đ {plan.period}</span>
                        </div>
                      </div>

                      {/* Benefits Checklist */}
                      <div className="space-y-2.5 pt-4 text-xs">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Check size={15} className="text-emerald-500 shrink-0" />
                          <span>Mở khóa toàn bộ 8 công cụ AI bán hàng</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Check size={15} className="text-emerald-500 shrink-0" />
                          <span>Xem toàn bộ video Masterclass chuyên sâu</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Check size={15} className="text-emerald-500 shrink-0" />
                          <span>Xuất file Excel tính giá & thuế nhanh chóng</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Check size={15} className="text-emerald-500 shrink-0" />
                          <span>Hỗ trợ kỹ thuật viên 1-1 qua Zalo</span>
                        </div>
                        {key === "lifetime" && (
                          <div className="flex items-center gap-2 font-bold text-amber-700">
                            <Sparkles size={15} className="text-amber-500 shrink-0" />
                            <span>Cập nhật miễn phí tính năng trọn đời</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      className={`w-full mt-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isSelected ? <Check size={15} /> : null}
                      <span>{isSelected ? "Đang chọn gói này" : "Chọn gói này"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & QR Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                  Cổng thanh toán tự động
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Hướng Dẫn Chuyển Khoản Kích Hoạt {currentPlan.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Quét mã QR bằng App Ngân Hàng bất kỳ. Hệ thống sẽ tự động điền đúng Số Tiền và Cú Pháp chuyển khoản.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://zalo.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle size={15} /> Hỗ trợ Zalo 24/7
                </a>
              </div>
            </div>

            {vipSuccessNotice && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>{vipSuccessNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* QR Code Column */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200/80">
                  {/* VietQR dynamic generation */}
                  <img
                    src={`https://img.vietqr.io/image/MB-0358888899-compact2.png?amount=${currentPlan.price}&addInfo=${encodeURIComponent(
                      transferContent
                    )}&accountName=AIChoShop`}
                    alt="VietQR Chuyển khoản VIP AIChoShop"
                    className="w-52 h-52 object-contain rounded-xl"
                  />
                </div>
                <p className="text-[11px] font-bold text-slate-500 mt-3 flex items-center gap-1">
                  <QrCode size={13} /> Quét mã để tự động điền nội dung
                </p>
              </div>

              {/* Transfer Details Column */}
              <div className="lg:col-span-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-xs font-semibold text-slate-400 block">Ngân Hàng</span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">
                      MB Bank (Ngân Hàng Quân Đội)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block">Số Tài Khoản</span>
                      <span className="text-base font-black text-blue-600 tracking-wider mt-0.5 block">
                        0358888899
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard("0358888899", "account")}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                    >
                      {copiedField === "account" ? (
                        <Check size={13} className="text-emerald-600" />
                      ) : (
                        <Copy size={13} />
                      )}
                      <span>{copiedField === "account" ? "Đã chép" : "Chép STK"}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-xs font-semibold text-slate-400 block">Chủ Tài Khoản</span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block uppercase">
                      AIChoShop Official
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block">Số Tiền</span>
                      <span className="text-base font-black text-emerald-600 mt-0.5 block">
                        {currentPlan.price.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(currentPlan.price.toString(), "amount")}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                    >
                      {copiedField === "amount" ? (
                        <Check size={13} className="text-emerald-600" />
                      ) : (
                        <Copy size={13} />
                      )}
                      <span>{copiedField === "amount" ? "Đã chép" : "Chép"}</span>
                    </button>
                  </div>
                </div>

                {/* Important Transfer Content */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      ⚠️ Nội dung chuyển khoản (Bắt buộc chính xác):
                    </span>
                    <span className="text-lg font-black text-amber-700 tracking-wider font-mono mt-0.5 block">
                      {transferContent}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(transferContent, "content")}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {copiedField === "content" ? (
                      <Check size={14} className="text-slate-950" />
                    ) : (
                      <Copy size={14} />
                    )}
                    <span>{copiedField === "content" ? "Đã chép cú pháp" : "Chép Cú Pháp"}</span>
                  </button>
                </div>

                {/* Action Confirmation Button */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleRequestVip}
                    disabled={isRequestingVip}
                    className="flex-1 py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    {isRequestingVip ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                    <span>Tôi Đã Chuyển Khoản Xong</span>
                  </button>

                  <a
                    href={`https://zalo.me?text=${encodeURIComponent(
                      `Chào Admin AIChoShop, mình đã chuyển khoản nâng cấp ${currentPlan.name} với nội dung: ${transferContent}. Nhờ admin kiểm tra kích hoạt giúp mình nhé!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <MessageCircle size={15} />
                    <span>Báo Admin Duyệt Ngay Qua Zalo</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. TAB 2: PERSONAL INFORMATION ──────────────────────────────────────── */}
      {activeTab === "info" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900">Thông Tin Hồ Sơ Cá Nhân</h2>
            <p className="text-xs text-slate-500">
              Cập nhật họ tên và số điện thoại liên hệ để nhận hỗ trợ nhanh chóng từ đội ngũ AIChoShop.
            </p>
          </div>

          {profileMessage && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
                profileMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {profileMessage.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-xl">
            {/* Email (Readonly) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email đăng nhập</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-500 text-xs font-medium cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400">Email dùng làm tài khoản đăng nhập và không thể thay đổi.</p>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Họ và tên hiển thị</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên..."
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Số điện thoại (Zalo nhận hỗ trợ)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0988xxxxxx"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Role & VIP Information */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Vai trò tài khoản:</span>
              <span className="font-bold text-slate-800">
                {user.role === "ADMIN" ? "Quản trị viên (Admin)" : "Học viên (User)"}
              </span>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
            >
              {isUpdatingProfile ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Lưu Thay Đổi</span>
            </button>
          </form>
        </div>
      )}

      {/* ── 5. TAB 3: PASSWORD & SECURITY ───────────────────────────────────────── */}
      {activeTab === "security" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900">Bảo Mật & Đổi Mật Khẩu</h2>
            <p className="text-xs text-slate-500">
              Hãy sử dụng mật khẩu mạnh gồm chữ hoa, chữ thường, số và ký tự đặc biệt để bảo vệ tài khoản.
            </p>
          </div>

          {passwordMessage && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
                passwordMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {passwordMessage.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Mật khẩu hiện tại</label>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Mật khẩu mới</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {isChangingPassword ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
              <span>Cập Nhật Mật Khẩu</span>
            </button>
          </form>

          {/* Danger Zone: Log out */}
          <div className="pt-8 border-t border-slate-200/80 space-y-4">
            <h3 className="text-sm font-black text-rose-600 uppercase tracking-wider">Khu Vực Bảo Mật & Đăng Xuất</h3>
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-800">Đăng xuất khỏi thiết bị này</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Xóa phiên đăng nhập hiện tại và quay về màn hình đăng nhập.
                </p>
              </div>
              <form action={logoutUser}>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-rose-600/20 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Đăng Xuất</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. TAB 4: LEARNING PROGRESS & TRANSACTION HISTORY ───────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Learning Progress Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Bài Học Đã Hoàn Thành</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi danh sách các bài học video bạn đã tích lũy trong lộ trình X10 Doanh Số.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold text-xs">
                {user.completedLessons.length} bài đã học
              </span>
            </div>

            {user.completedLessons.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <BookOpen size={24} className="text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Bạn chưa hoàn thành bài học nào</p>
                <p className="text-[11px] text-slate-400">
                  Hãy vào xem bài giảng và bấm &quot;Đánh dấu hoàn thành&quot; để lưu lại tiến độ nhé.
                </p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl mt-2 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Xem danh sách bài học <ChevronRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {user.completedLessons.map((item) => (
                  <div key={item.lessonId} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{item.lessonTitle}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{item.courseTitle}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(item.completedAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transactions History Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">Lịch Sử Giao Dịch & Nâng Cấp VIP</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các đơn đăng ký gói thành viên VIP của bạn trên hệ thống.
              </p>
            </div>

            {user.transactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <CreditCard size={24} className="text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Chưa có giao dịch nào</p>
                <p className="text-[11px] text-slate-400">
                  Khi bạn đăng ký nâng cấp gói VIP, lịch sử và trạng thái duyệt sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Mã GD</th>
                      <th className="px-4 py-3">Loại Giao Dịch</th>
                      <th className="px-4 py-3">Số Tiền</th>
                      <th className="px-4 py-3">Trạng Thái</th>
                      <th className="px-4 py-3 rounded-r-xl">Thời Gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {user.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">{tx.id.slice(-8)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{tx.type}</td>
                        <td className="px-4 py-3 font-black text-slate-900">
                          {tx.amount.toLocaleString("vi-VN")} đ
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              tx.status === "SUCCESS"
                                ? "bg-emerald-100 text-emerald-700"
                                : tx.status === "FAILED"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {tx.status === "SUCCESS"
                              ? "Thành công"
                              : tx.status === "FAILED"
                              ? "Thất bại"
                              : "Đang chờ duyệt"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
