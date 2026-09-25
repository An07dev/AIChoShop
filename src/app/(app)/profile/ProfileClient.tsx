"use client";

import { useState, useEffect, useRef } from "react";
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
  CreditCard,
  Star,
  Gift,
  Flame,
  ShieldCheck,
  Rocket,
  Infinity,
  Server,
  Headphones,
} from "lucide-react";
import Link from "next/link";
import {
  updateUserProfile,
  changeUserPassword,
  requestVipActivation,
} from "@/app/actions/profile";
import { logoutUser } from "@/app/actions/auth";
import { VipPlanItem } from "@/lib/vip-plans";
import { VipPaymentModal } from "@/components/payments/VipPaymentModal";
import type { PaymentIntentView } from "@/lib/payments/service";
import { PersonalDataControls } from "./data/PersonalDataControls";

interface ProfileClientProps {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: string;
    isVIP: boolean;
    vipExpiresAt?: string | null;
    vipDaysLeft?: number | null;
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
  vipPlans?: VipPlanItem[];
  sePayConfig?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    syntaxPrefix: string;
  };
}

export default function ProfileClient({
  user,
  totalCourses,
  totalLessons,
  vipPlans = [],
}: ProfileClientProps) {
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

  // VIP Package Selection (Dynamic from Database)
  const activeVipPlans = vipPlans.filter(plan => plan.active);

  const defaultSelectedSlug =
    activeVipPlans.find((p) => p.isPopular)?.slug ||
    activeVipPlans[0]?.slug ||
    "lifetime";

  const [selectedPlan, setSelectedPlan] = useState<string>(defaultSelectedSlug);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentView | null>(null);
  const [isRequestingVip, setIsRequestingVip] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const creatingIntent = useRef(false);
  const openPayment = async (plan: VipPlanItem) => {
    if (creatingIntent.current) return;
    creatingIntent.current = true;
    setIsRequestingVip(true);
    setPaymentError("");
    setSelectedPlan(plan.slug || plan.id);
    try {
      const result = await requestVipActivation(plan.id);
      if (result.success && result.intent) setPaymentIntent(result.intent);
      else setPaymentError(result.error || "Không thể tạo yêu cầu thanh toán.");
    } catch { setPaymentError("Không thể kết nối. Vui lòng thử lại."); }
    finally { creatingIntent.current = false; setIsRequestingVip(false); }
  };

  // Handle auto-scroll to pricing section if URL contains #pricing-section
  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== "undefined" && window.location.hash === "#pricing-section") {
        setActiveTab("vip");
        setTimeout(() => {
          const el = document.getElementById("pricing-section");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 150);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

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

  // Scroll to VIP Pricing section smoothly
  const scrollToPricing = () => {
    setActiveTab("vip");
    setTimeout(() => {
      const el = document.getElementById("pricing-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  const completedCount = user.completedLessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const memberSince = new Date(user.createdAt).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-16 min-w-0 w-full">
      {/* ── 1. HERO PROFILE CARD ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4 sm:p-7 md:p-10 text-white border border-slate-800 shadow-2xl min-w-0">
        {/* Ambient Glows adapting to theme */}
        <div
          className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-25"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 min-w-0">
          {/* User Basic Info */}
          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-brand text-white flex items-center justify-center font-black text-xl sm:text-2xl md:text-3xl shadow-xl shadow-brand/25 border-2 border-white/20">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              {user.isVIP && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 p-1.5 rounded-xl shadow-md border-2 border-slate-950">
                  <Crown size={13} className="fill-slate-950" />
                </div>
              )}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate max-w-full">{user.name}</h1>
                {user.role === "ADMIN" && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-light text-brand text-[10px] font-black uppercase tracking-wider border border-brand/30 shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-mono truncate max-w-full">{user.email}</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                <Calendar size={13} className="shrink-0" />
                <span className="truncate">Tham gia: {memberSince}</span>
              </p>
            </div>
          </div>

          {/* Quick CTA */}
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            {!user.isVIP ? (
              <button
                onClick={scrollToPricing}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown size={16} className="fill-slate-950" />
                <span>Nâng Cấp VIP PRO</span>
              </button>
            ) : (
              <div className="w-full sm:w-auto bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 text-emerald-400 flex items-center gap-2.5">
                <CheckCircle2 size={18} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-wider truncate">Đặc quyền VIP PRO</div>
                  <div className="text-[11px] text-emerald-300/80 truncate">Kích hoạt vĩnh viễn • Full tính năng</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-3 sm:p-3.5 border border-slate-700/50 min-w-0">
            <span className="text-slate-400 text-[11px] sm:text-xs font-medium block truncate">Gói tài khoản</span>
            <span className="text-sm sm:text-base md:text-xl font-black text-white mt-0.5 flex items-center gap-1.5 truncate">
              {user.isVIP ? (
                <>
                  <Crown size={15} className="text-amber-400 shrink-0" /> <span className="truncate">VIP PRO</span>
                </>
              ) : (
                <span className="truncate">FREE Member</span>
              )}
            </span>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3 sm:p-3.5 border border-slate-700/50 min-w-0">
            <span className="text-slate-400 text-[11px] sm:text-xs font-medium block truncate">Tiến độ bài học</span>
            <span className="text-sm sm:text-base md:text-xl font-black text-white mt-0.5 block truncate">
              {completedCount}/{totalLessons} ({progressPercent}%)
            </span>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3 sm:p-3.5 border border-slate-700/50 min-w-0">
            <span className="text-slate-400 text-[11px] sm:text-xs font-medium block truncate">Khóa học</span>
            <span className="text-sm sm:text-base md:text-xl font-black text-white mt-0.5 block truncate">
              {totalCourses} khóa
            </span>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3 sm:p-3.5 border border-slate-700/50 min-w-0">
            <span className="text-slate-400 text-[11px] sm:text-xs font-medium block truncate">Công cụ AI</span>
            <span className="text-sm sm:text-base md:text-xl font-black text-emerald-400 mt-0.5 block truncate">
              {user.isVIP ? "8/8 Mở khóa" : "Giới hạn"}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. TAB NAVIGATION ───────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-1 sm:gap-2 pb-px no-scrollbar -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
        <button
          onClick={() => setActiveTab("vip")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === "vip"
            ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/10 rounded-t-xl"
            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          <Crown size={16} className={activeTab === "vip" ? "text-amber-500" : "text-slate-400"} />
          <span>{user.isVIP ? "Đặc Quyền VIP" : "Gói VIP & Nâng Cấp"}</span>
        </button>

        <button
          onClick={() => setActiveTab("info")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === "info"
            ? "border-brand text-brand bg-brand-light rounded-t-xl"
            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          <User size={16} className={activeTab === "info" ? "text-brand" : "text-slate-400"} />
          <span>Thông Tin Cá Nhân</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === "history"
            ? "border-brand text-brand bg-brand-light rounded-t-xl"
            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          <Clock size={16} className={activeTab === "history" ? "text-brand" : "text-slate-400"} />
          <span>Tiến Độ & Lịch Sử</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === "security"
            ? "border-brand text-brand bg-brand-light rounded-t-xl"
            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          <Shield size={16} className={activeTab === "security" ? "text-brand" : "text-slate-400"} />
          <span>Dữ Liệu & Bảo Mật</span>
        </button>
      </div>

      {/* ── 3. TAB 1: VIP MEMBERSHIP & UPGRADE ───────────────────────────────────── */}
      {activeTab === "vip" && (
        <div className="space-y-10">
          {/* ── A. LUXURY VIRTUAL MEMBERSHIP CARD & STATUS ────────────────────────── */}
          {user.isVIP ? (
            /* ACTIVE VIP PRO: LUXURY BLACK & GOLD METAL CARD */
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-zinc-900 to-amber-950 p-4 sm:p-7 md:p-9 text-white border border-amber-500/40 shadow-2xl shadow-amber-500/10 min-w-0">
              {/* Card Ambient Glows */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8 min-w-0">
                {/* Left: Card Info */}
                <div className="space-y-4 max-w-xl min-w-0">
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap min-w-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 shrink-0">
                      <Crown size={13} className="fill-slate-950" /> AIChoShop Black Elite
                    </span>
                    <span className="text-xs font-bold text-amber-300/90 flex items-center gap-1.5 flex-wrap">
                      {user.vipExpiresAt && user.vipDaysLeft !== null ? (
                        <>
                          <Clock size={13} className="text-amber-400 shrink-0" />
                          <span>
                            VIP PRO (Còn <strong className="text-white font-black">{user.vipDaysLeft} ngày</strong> - Đến{" "}
                            {new Date(user.vipExpiresAt).toLocaleDateString("vi-VN")})
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={13} className="text-amber-400 shrink-0" />
                          <span>Kích hoạt vĩnh viễn (LIFETIME)</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight break-words">
                      Chào mừng Hội Viên <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">{user.name}</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Bạn đang sở hữu đặc quyền tối thượng của AIChoShop: không giới hạn toàn bộ 8 công cụ AI, 100% bài giảng Masterclass và quyền truy cập nhóm kín Top Seller.
                    </p>
                  </div>

                  {/* Card Number & EMV Chip Emulation */}
                  <div className="flex items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
                    <div className="w-10 h-7 sm:w-11 sm:h-8 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 shadow-inner flex items-center justify-center border border-amber-300/60 shrink-0">
                      <div className="w-6 h-4 sm:w-7 sm:h-5 rounded border border-amber-700/40 grid grid-cols-2 gap-0.5 p-0.5">
                        <div className="bg-amber-600/30 rounded-xs"></div>
                        <div className="bg-amber-600/30 rounded-xs"></div>
                      </div>
                    </div>
                    <div className="font-mono text-xs sm:text-sm tracking-widest text-amber-200/90 font-bold truncate">
                      VIP •••• •••• {user.id.slice(-4).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto">
                  <Link
                    href="/learn"
                    className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
                  >
                    <BookOpen size={16} className="fill-slate-950" />
                    <span>Vào Học Masterclass</span>
                  </Link>
                  <Link
                    href="/tools"
                    className="w-full sm:w-auto px-5 py-3 bg-slate-800/90 hover:bg-slate-700/90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer"
                  >
                    <Zap size={16} className="text-amber-400" />
                    <span>Mở Kho Công Cụ AI</span>
                  </Link>
                  <a
                    href="https://zalo.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 bg-brand/20 hover:bg-brand/30 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-brand/30"
                  >
                    <MessageCircle size={15} />
                    <span>Nhóm Zalo VIP Support</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* FREE MEMBER: INVITATION TO VIP CLUB */
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-7 md:p-9 text-white border border-slate-800 shadow-2xl min-w-0">
              <div
                className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-20"
                style={{ backgroundColor: "var(--brand-primary)" }}
              />
              <div className="absolute bottom-0 left-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 min-w-0">
                <div className="space-y-3 max-w-2xl min-w-0">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                    Nâng Cấp <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-300">VIP PRO MEMBER</span> – Bứt Phá Doanh Số TMĐT
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Bạn hiện đang sử dụng gói <strong>FREE</strong> với tính năng giới hạn. Gia nhập cộng đồng VIP Seller để mở khóa không giới hạn trọn bộ 8 công cụ AI bán hàng, 100% video thực chiến và nhận hỗ trợ 1-1 độc quyền.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 text-xs text-amber-200/90 font-medium">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400 shrink-0" /> Không giới hạn lượt AI</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400 shrink-0" /> Mở toàn bộ 27 bài giảng</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400 shrink-0" /> Hỗ trợ kỹ thuật 1-1</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={scrollToPricing}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Crown size={17} className="fill-slate-950" />
                    <span>Xem Các Gói Nâng Cấp VIP</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    ⚡ Kích hoạt tự động sau 1 - 3 phút
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── B. SO SÁNH QUYỀN LỢI FREE VS VIP PRO (MINI STRIP) ───────────────────── */}


          {/* ── C. LƯỚI 6 ĐẶC QUYỀN VÀNG HỘI VIÊN (THE 6 GOLDEN PERKS) ─────────────── */}
          <div className="space-y-5">
            <div className="text-center max-w-2xl mx-auto space-y-1.5">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {user.isVIP
                  ? "6 Đặc Quyền Vàng Đang Mở Khóa Trên Tài Khoản Của Bạn"
                  : "6 Đặc Quyền Vàng Khi Gia Nhập VIP Member"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {user.isVIP
                  ? "Bạn đang sở hữu trọn vẹn đặc quyền cao cấp nhất, không giới hạn lượt dùng AI và toàn bộ kho tài nguyên thực chiến của AIChoShop."
                  : "Toàn bộ vũ khí bán hàng đỉnh cao giúp bạn tiết kiệm hàng chục giờ mỗi tuần và bứt phá doanh thu."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Perk 1 */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                    <Zap size={22} className="fill-slate-950" />
                  </div>
                  {user.isVIP && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/50 shadow-xs">
                      <CheckCircle2 size={12} className="text-emerald-500" /> Đã mở khóa
                    </span>
                  )}
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-base">8 Siêu Công Cụ AI Không Giới Hạn</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sử dụng trọn vẹn AI viết kịch bản video TikTok 15s-60s triệu view, tính giá & thuế sàn chuẩn 100%, SEO giật Top 1 Shopee, kháng nghị vi phạm tài khoản.
                </p>
              </div>

              {/* Perk 2 */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand dark:hover:border-brand/70 hover:shadow-lg hover:shadow-brand/5 transition-all space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-brand text-white flex items-center justify-center shadow-md shadow-brand/20 group-hover:scale-105 transition-transform">
                    <BookOpen size={22} />
                  </div>
                  {user.isVIP && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/50 shadow-xs">
                      <CheckCircle2 size={12} className="text-emerald-500" /> Đã mở khóa
                    </span>
                  )}
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-base">Trọn Bộ Video Masterclass Thực Chiến</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Mở khóa 100% video bài giảng từ cơ bản đến chuyên sâu của Masterclass. Học trực tiếp quy trình tìm hàng win, tối ưu shop chuẩn thuật toán 2026.
                </p>
              </div>

              {/* Perk 3 */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                    <Gift size={22} />
                  </div>
                  {user.isVIP && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/50 shadow-xs">
                      <CheckCircle2 size={12} className="text-emerald-500" /> Đã mở khóa
                    </span>
                  )}
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-base">Kho 200+ Prompt AI Chốt Đơn</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tặng bộ câu lệnh AI bản quyền chuẩn chỉnh &quot;Copy & Paste&quot; chuyên dùng để viết mô tả sản phẩm, kịch bản livestream và nội dung quảng cáo đa nền tảng.
                </p>
              </div>

              {/* Perk 4 */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Rocket size={22} />
                  </div>
                  {user.isVIP && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/50 shadow-xs">
                      <CheckCircle2 size={12} className="text-emerald-500" /> Đã mở khóa
                    </span>
                  )}
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-base">Hạ Tầng Server Riêng Tốc Độ Cao</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Được định tuyến qua cụm máy chủ AI riêng biệt. Tốc độ sinh nội dung dưới 1 giây, cam kết không giật lag hoặc nghẽn mạng ngay cả trong giờ Mega Sale sàn.
                </p>
              </div>

              {/* Perk 5 */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                    <Flame size={22} />
                  </div>
                  {user.isVIP && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/50 shadow-xs">
                      <CheckCircle2 size={12} className="text-emerald-500" /> Đã mở khóa
                    </span>
                  )}
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-base">Nhóm Kín Top Seller Thực Chiến</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Quyền tham gia cộng đồng Zalo/Telegram VIP kín cùng hàng trăm chủ shop TMĐT doanh thu hàng trăm triệu. Giao lưu, kết nối nguồn hàng và học hỏi kinh nghiệm.
                </p>
              </div>

              {/* Perk 6 */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:scale-105 transition-transform">
                    <ShieldCheck size={22} className="text-amber-400" />
                  </div>
                  {user.isVIP && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/50 shadow-xs">
                      <CheckCircle2 size={12} className="text-emerald-500" /> Đã mở khóa
                    </span>
                  )}
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-base">Kỹ Thuật Viên Hỗ Trợ 1-1</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ưu tiên nhận hỗ trợ kỹ thuật viên đồng hành qua Zalo/UltraViewer. Giải đáp mọi thắc mắc về cách dùng công cụ, biểu phí sàn và tối ưu gian hàng.
                </p>
              </div>
            </div>
          </div>

          {/* ── D-VIP. DÀNH RIÊNG CHO VIP: HẠ TẦNG DEDICATED SERVER & HỖ TRỢ CONCIERGE ── */}
          {user.isVIP && (
            <div className="space-y-8">
              {/* Server Performance Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-900 p-6 sm:p-8 text-white border border-amber-500/30 shadow-xl">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-black text-xs uppercase tracking-wider">
                        <Server size={13} className="text-amber-400" /> Cụm Máy Chủ Dedicated VIP Node
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                        Hạ Tầng Tốc Độ Cao & Trạng Thái Tài Nguyên VIP
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tài khoản của bạn được cấp phân luồng ưu tiên độc quyền, tối ưu hóa tốc độ xử lý cho Seller quy mô lớn.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-bold text-emerald-400">100% Sẵn Sàng</span>
                    </div>
                  </div>

                  {/* 4 Infrastructure Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-xs text-slate-400 font-medium block">Cụm Máy Chủ AI</span>
                      <span className="text-sm sm:text-base font-black text-amber-300 block">
                        SG-PRO-01 (Tier-3)
                      </span>
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 size={12} /> Băng thông riêng
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-xs text-slate-400 font-medium block">Tốc Độ Xử Lý</span>
                      <span className="text-sm sm:text-base font-black text-emerald-400 block">
                        &lt; 1.2 Giây
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Zap size={12} className="text-amber-400" /> Luồng ưu tiên cực đại
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-xs text-slate-400 font-medium block">Hạn Mức AI Tokens</span>
                      <span className="text-sm sm:text-base font-black text-white block">
                        Không Giới Hạn
                      </span>
                      <span className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold">
                        <Infinity size={12} /> Unlimited Runs
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-xs text-slate-400 font-medium block">Bảo Hành Bản Quyền</span>
                      <span className="text-sm sm:text-base font-black text-amber-400 block">
                        Trọn Đời (Lifetime)
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck size={12} className="text-emerald-400" /> Cập nhật vĩnh viễn
                      </span>
                    </div>
                  </div>

                  {/* 3 Value Commitments */}
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                      <span>Thuật toán Shopee / TikTok 2026 cập nhật liên tục</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                      <span>Miễn phí 100% tính năng AI mới phát triển trong tương lai</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                      <span>Bảo mật tuyệt đối dữ liệu doanh thu & sản phẩm shop</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIP Concierge Support & Top Seller Community */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1-1 Dedicated Technician */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4 flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-500/50 transition-all">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/50">
                      <Headphones size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-slate-900 dark:text-white">
                        Kênh Hỗ Trợ Kỹ Thuật Viên 1-1
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Bạn có đặc quyền liên hệ trực tiếp với chuyên gia AIChoShop qua Zalo / UltraViewer để được hướng dẫn sử dụng công cụ, kiểm tra lỗi bài đăng hoặc tối ưu SEO sản phẩm.
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://zalo.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <MessageCircle size={16} className="fill-slate-950" />
                    <span>Nhắn Zalo Kỹ Thuật Viên Ưu Tiên</span>
                  </a>
                </div>

                {/* VIP Seller Community */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4 flex flex-col justify-between hover:border-brand dark:hover:border-brand/70 transition-all">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-light text-brand flex items-center justify-center border border-brand/20">
                      <Flame size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-slate-900 dark:text-white">
                        Nhóm Kín Top Seller TMĐT Doanh Thu Cao
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Giao lưu, chia sẻ nguồn hàng sỉ tận gốc và nắm bắt kịp thời các chiến dịch Mega Sale cùng hàng trăm chủ shop TMĐT hàng đầu trong mạng lưới VIP AIChoShop.
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://zalo.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-brand/20 cursor-pointer"
                  >
                    <ExternalLink size={16} />
                    <span>Tham Gia Nhóm Kín VIP Seller</span>
                  </a>
                </div>
              </div>

              {/* VIP Quick Launchpad */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Rocket size={18} className="text-amber-500" /> Bệ Phóng Công Cụ & Bài Giảng VIP
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Truy cập nhanh vào các vũ khí bán hàng đỉnh cao đã mở khóa trên tài khoản của bạn.
                    </p>
                  </div>
                  <Link
                    href="/tools"
                    className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
                  >
                    <span>Xem tất cả 8 công cụ</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link
                    href="/tools/tiktok-script"
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition-all group block"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Zap size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      Kịch Bản Video TikTok
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Tạo kịch bản video bán hàng 15s-60s chuẩn thuật toán giữ chân triệu view.
                    </p>
                  </Link>

                  <Link
                    href="/tools/seo-optimizer"
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand dark:hover:border-brand/70 hover:shadow-md transition-all group block"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Sparkles size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                      SEO Sản Phẩm Shopee
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Quét từ khóa hot search, tối ưu tiêu đề và mô tả leo Top 1 tìm kiếm.
                    </p>
                  </Link>

                  <Link
                    href="/tools/tax-calculator"
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:shadow-md transition-all group block"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <CreditCard size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                      Tính Giá Bán & Thuế Sàn
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Tự động tính biểu phí sàn và thuế TNCN 2026, xuất file Excel chuyên nghiệp.
                    </p>
                  </Link>

                  <Link
                    href="/learn"
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500/50 hover:shadow-md transition-all group block"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <BookOpen size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors">
                      Khóa Học Masterclass
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Mở khóa toàn bộ 27 bài giảng thực chiến từ cơ bản tới nâng cao.
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ── D-FREE. DÀNH RIÊNG CHO FREE: BỘ 3 GÓI NÂNG CẤP & CỔNG THANH TOÁN VIETQR ── */}
          {(
            <>
              {/* ── D. BỘ 3 GÓI NÂNG CẤP VIP (PRICING SECTION) ─────────────────────────── */}
              {activeVipPlans.length > 0 ? (
                <div id="pricing-section" className="space-y-6 pt-4 scroll-mt-6">
                  <div className="text-center max-w-xl mx-auto space-y-1.5">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      Chọn Gói VIP Phù Hợp Với Bạn
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Đầu tư 1 lần – Nhân bản doanh số bền vững. Chọn gói bên dưới để kích hoạt ngay.
                    </p>
                  </div>

                  <div className={`grid grid-cols-1 ${
                    activeVipPlans.length === 1
                      ? "max-w-md mx-auto"
                      : activeVipPlans.length === 2
                      ? "md:grid-cols-2 max-w-4xl mx-auto"
                      : "md:grid-cols-3"
                  } gap-6`}>
                    {activeVipPlans.map((plan) => {
                      const isSelected = selectedPlan === plan.slug || selectedPlan === plan.id;

                      return (
                        <div
                          key={plan.id || plan.slug}
                          onClick={() => {
                            setSelectedPlan(plan.slug || plan.id);
                          }}
                          className={`relative rounded-2xl sm:rounded-3xl p-5 sm:p-7 transition-all cursor-pointer flex flex-col justify-between border-2 min-w-0 ${isSelected
                            ? "border-amber-500 bg-white dark:bg-slate-900 shadow-2xl shadow-amber-500/15 scale-100 sm:scale-[1.02] md:scale-[1.03] z-10"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                            }`}
                        >
                          {plan.isPopular && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[11px] px-4 py-1 rounded-full uppercase tracking-wider shadow-md shadow-amber-500/30 flex items-center gap-1">
                              <Star size={12} className="fill-slate-950" /> {plan.tag || "Best-Seller"}
                            </div>
                          )}

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-lg text-slate-900 dark:text-white">{plan.name}</h4>
                              {!plan.isPopular && plan.tag && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {plan.tag}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px] leading-relaxed">{plan.desc}</p>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                              {plan.originalPrice > plan.price && (
                                <div className="text-xs text-slate-400 dark:text-slate-500 line-through">
                                  {plan.originalPrice.toLocaleString("vi-VN")} đ
                                </div>
                              )}
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-3xl font-black text-slate-900 dark:text-white">
                                  {plan.price.toLocaleString("vi-VN")}
                                </span>
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">đ {plan.period}</span>
                              </div>
                            </div>

                            {/* Benefits Checklist */}
                            <div className="space-y-2.5 pt-4 text-xs">
                              {plan.features && plan.features.length > 0 ? (
                                plan.features.map((feat, fIdx) => (
                                  <div key={fIdx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <Check size={15} className="text-emerald-500 shrink-0" />
                                    <span>{feat}</span>
                                  </div>
                                ))
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <Check size={15} className="text-emerald-500 shrink-0" />
                                    <span>Không giới hạn 8 công cụ AI bán hàng</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <Check size={15} className="text-emerald-500 shrink-0" />
                                    <span>Mở khóa toàn bộ 27 video Masterclass</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void openPayment(plan);
                            }}
                            className={`w-full mt-6 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isSelected
                              ? "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/25"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                              }`}
                          >
                            <CreditCard size={15} />
                            <span>{isRequestingVip ? "Đang tạo yêu cầu…" : isSelected ? "Thanh Toán Gói Này →" : "Chọn Gói Này →"}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div id="pricing-section" className="pt-4 scroll-mt-6">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-12 text-center shadow-sm relative overflow-hidden space-y-6 max-w-2xl mx-auto">
                    {/* Decorative ambient gradient */}
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Icon Crown Badge */}
                    <div className="relative inline-block mx-auto">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-400/40 flex items-center justify-center text-amber-500 shadow-inner">
                        <Crown size={32} className="sm:w-9 sm:h-9 text-amber-500" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs">
                        <Sparkles size={11} className="text-slate-950 fill-slate-950" />
                      </span>
                    </div>

                    {/* Heading & Description */}
                    <div className="space-y-2 max-w-md mx-auto">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Đang Cập Nhật Các Gói VIP Mới
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        Hệ thống đang chuẩn bị các chính sách ưu đãi và gói đặc quyền VIP nâng cấp tốt nhất cho nhà bán hàng. Vui lòng quay lại sau hoặc liên hệ hỗ trợ để được kích hoạt thủ công.
                      </p>
                    </div>

                    {/* Feature tags */}
                    <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 font-medium flex items-center gap-1.5">
                        <Check size={12} className="text-emerald-500 stroke-[3]" /> Mở khóa toàn bộ 8 AI Tools
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 font-medium flex items-center gap-1.5">
                        <Check size={12} className="text-emerald-500 stroke-[3]" /> 27 Video Masterclass VIP
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 font-medium flex items-center gap-1.5">
                        <Check size={12} className="text-emerald-500 stroke-[3]" /> Hỗ trợ kỹ thuật 1-1 qua Zalo
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <a
                        href="https://zalo.me"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                      >
                        <MessageCircle size={15} />
                        <span>Liên Hệ Tư Vấn &amp; Kích Hoạt Sớm</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                      >
                        <RefreshCw size={13} />
                        <span>Làm mới danh sách</span>
                      </button>
                    </div>

                    {/* Reassurance note */}
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                      💡 Bạn muốn trải nghiệm ngay hôm nay? Hãy nhắn CSKH để được nhận suất VIP sớm với mức giá ưu đãi nhất.
                    </p>
                  </div>
                </div>
              )}

              {paymentError && (
                <div role="alert" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs sm:text-sm shadow-xs max-w-2xl mx-auto">
                  <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">Không thể tạo yêu cầu thanh toán</span>
                    <span className="text-rose-600 dark:text-rose-400">{paymentError}</span>
                  </div>
                </div>
              )}
              {paymentIntent && <VipPaymentModal key={paymentIntent.id} intent={paymentIntent} onClose={() => setPaymentIntent(null)} />}

            </>
          )}
        </div>
      )}

      {/* ── 4. TAB 2: PERSONAL INFORMATION ──────────────────────────────────────── */}
      {activeTab === "info" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8 shadow-sm space-y-5 sm:space-y-6 min-w-0">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Thông Tin Hồ Sơ Cá Nhân</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cập nhật họ tên và số điện thoại liên hệ để nhận hỗ trợ nhanh chóng từ đội ngũ AIChoShop.
            </p>
          </div>

          {profileMessage && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${profileMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50"
                }`}
            >
              {profileMessage.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-xl">
            {/* Email (Readonly) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email đăng nhập</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-medium cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Email dùng làm tài khoản đăng nhập và không thể thay đổi.</p>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Họ và tên hiển thị</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên..."
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Số điện thoại (Zalo nhận hỗ trợ)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0988xxxxxx"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                />
              </div>
            </div>

            {/* Role & VIP Information */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Vai trò tài khoản:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {user.role === "ADMIN" ? "Quản trị viên (Admin)" : "Học viên (User)"}
              </span>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isUpdatingProfile ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Lưu Thay Đổi</span>
            </button>
          </form>
        </div>
      )}

      {/* ── 6. TAB 4: LEARNING PROGRESS & TRANSACTION HISTORY ───────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Learning Progress Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8 shadow-sm space-y-4 sm:space-y-5 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Bài Học Đã Hoàn Thành</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Theo dõi danh sách các bài học video bạn đã tích lũy trong lộ trình X10 Doanh Số.
                </p>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-brand-light text-brand font-bold text-xs shrink-0">
                {user.completedLessons.length} bài đã học
              </span>
            </div>

            {user.completedLessons.length === 0 ? (
              <div className="p-6 sm:p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <BookOpen size={24} className="text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Bạn chưa hoàn thành bài học nào</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Hãy vào xem bài giảng và bấm &quot;Đánh dấu hoàn thành&quot; để lưu lại tiến độ nhé.
                </p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl mt-2 hover:bg-brand-hover transition-colors shadow-sm shadow-brand/20"
                >
                  Xem danh sách bài học <ChevronRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {user.completedLessons.map((item) => (
                  <div key={item.lessonId} className="py-3.5 flex items-center justify-between gap-3 sm:gap-4 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Check size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.lessonTitle}</h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{item.courseTitle}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                      {new Date(item.completedAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transactions History Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8 shadow-sm space-y-4 sm:space-y-5 min-w-0">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Lịch Sử Giao Dịch & Nâng Cấp VIP</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Các đơn đăng ký gói thành viên VIP của bạn trên hệ thống.
              </p>
            </div>

            {user.transactions.length === 0 ? (
              <div className="p-6 sm:p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <CreditCard size={24} className="text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Chưa có giao dịch nào</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Khi bạn đăng ký nâng cấp gói VIP, lịch sử và trạng thái duyệt sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full text-xs text-left min-w-[500px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Mã GD</th>
                      <th className="px-4 py-3">Loại Giao Dịch</th>
                      <th className="px-4 py-3">Số Tiền</th>
                      <th className="px-4 py-3">Trạng Thái</th>
                      <th className="px-4 py-3 rounded-r-xl">Thời Gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {user.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{tx.id.slice(-8)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{tx.type}</td>
                        <td className="px-4 py-3 font-black text-slate-900 dark:text-white">
                          {tx.amount.toLocaleString("vi-VN")} đ
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${tx.status === "SUCCESS"
                              ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                              : tx.status === "FAILED"
                                ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
                                : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                              }`}
                          >
                            {tx.status === "SUCCESS"
                              ? "Thành công"
                              : tx.status === "FAILED"
                                ? "Thất bại"
                                : "Đang chờ duyệt"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 dark:text-slate-500">
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

      {/* ── 7. TAB 4: DATA & PRIVACY SECURITY ─────────────────────────────────── */}
      {activeTab === "security" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8 shadow-sm space-y-5 sm:space-y-6 min-w-0">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Shield size={20} className="text-brand shrink-0" />
              <span>Dữ Liệu Cá Nhân & Quyền Riêng Tư</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chủ động kiểm soát quyền riêng tư: Tải bản sao lưu JSON hoặc xóa lịch sử sử dụng AI và các công cụ trên thiết bị của bạn.
            </p>
          </div>

          <PersonalDataControls />

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-400">Bạn muốn tìm hiểu thêm về cách AIChoShop bảo vệ dữ liệu?</span>
            <Link href="/privacy" className="font-bold text-brand hover:underline flex items-center gap-1">
              <span>Xem chính sách dữ liệu</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
