"use client";

import { useState, useEffect } from "react";
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
  Star,
  Gift,
  Flame,
  ShieldCheck,
  Rocket,
  Infinity,
  Server,
  Headphones,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  updateUserProfile,
  changeUserPassword,
  requestVipActivation,
  checkCurrentUserVipStatus,
} from "@/app/actions/profile";
import { logoutUser } from "@/app/actions/auth";
import { VipPlanItem, DEFAULT_VIP_PLANS } from "@/lib/vip-plans";

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

const getBankCode = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("mb")) return "MB";
  if (lower.includes("vietcombank") || lower.includes("vcb")) return "VCB";
  if (lower.includes("techcombank") || lower.includes("tcb")) return "TCB";
  if (lower.includes("acb")) return "ACB";
  if (lower.includes("vpbank") || lower.includes("vpb")) return "VPB";
  if (lower.includes("tpbank") || lower.includes("tpb")) return "TPB";
  if (lower.includes("bidv")) return "BIDV";
  if (lower.includes("agribank")) return "VBA";
  if (lower.includes("sacombank") || lower.includes("stb")) return "STB";
  if (lower.includes("hdbank") || lower.includes("hdb")) return "HDB";
  if (lower.includes("vib")) return "VIB";
  if (lower.includes("shb")) return "SHB";
  return name.replace(/\s+/g, "");
};

export default function ProfileClient({
  user,
  totalCourses,
  totalLessons,
  vipPlans = [],
  sePayConfig,
}: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"vip" | "info" | "security" | "history">("vip");

  // Dynamic Bank / SePay Config
  const bankName = sePayConfig?.bankName || "MB Bank";
  const accountNumber = sePayConfig?.accountNumber || "0358888899";
  const accountHolder = sePayConfig?.accountHolder || "AIChoShop Official";
  const syntaxPrefix = sePayConfig?.syntaxPrefix || "VIP";

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
  const activeVipPlans: VipPlanItem[] =
    vipPlans && vipPlans.length > 0
      ? vipPlans.filter((p) => p.active)
      : (DEFAULT_VIP_PLANS as unknown as VipPlanItem[]);

  const defaultSelectedSlug =
    activeVipPlans.find((p) => p.isPopular)?.slug ||
    activeVipPlans[0]?.slug ||
    "lifetime";

  const [selectedPlan, setSelectedPlan] = useState<string>(defaultSelectedSlug);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRequestingVip, setIsRequestingVip] = useState(false);
  const [vipSuccessNotice, setVipSuccessNotice] = useState<string | null>(null);

  const currentPlan =
    activeVipPlans.find((p) => p.slug === selectedPlan || p.id === selectedPlan) ||
    activeVipPlans[0] ||
    (DEFAULT_VIP_PLANS[0] as unknown as VipPlanItem);

  const bankCode = getBankCode(bankName);
  const transferContent = `${syntaxPrefix} ${user.phone || user.email.split("@")[0]}`;
  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${currentPlan.price}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`;
  const sepayQrUrl = `https://qr.sepay.vn/img?bank=${bankCode}&acc=${accountNumber}&template=compact&amount=${currentPlan.price}&des=${encodeURIComponent(transferContent)}`;
  const [qrImgSrc, setQrImgSrc] = useState(qrUrl);

  useEffect(() => {
    setQrImgSrc(qrUrl);
  }, [qrUrl]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPaymentModalOpen) {
        setIsPaymentModalOpen(false);
        setVipSuccessNotice(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaymentModalOpen]);

  // Lắng nghe tự động realtime webhook SePay khi người dùng đang mở Modal thanh toán
  useEffect(() => {
    if (!isPaymentModalOpen || user.isVIP) return;

    const interval = setInterval(async () => {
      try {
        const res = await checkCurrentUserVipStatus();
        if (res.isVIP) {
          clearInterval(interval);
          setVipSuccessNotice(
            "🎉 Chúc mừng bạn! Hệ thống SePay đã ghi nhận thanh toán thành công và kích hoạt VIP. Đang làm mới hệ thống..."
          );
          setTimeout(() => {
            window.location.reload();
          }, 1800);
        }
      } catch {
        // ignore polling error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaymentModalOpen, user.isVIP]);

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

  // Copy helper
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle VIP Confirmation submission
  const handleConfirmTransfer = async () => {
    setIsRequestingVip(true);
    setVipSuccessNotice(null);
    try {
      const res = await requestVipActivation(currentPlan.slug || currentPlan.name, currentPlan.price);
      if (res.success) {
        setVipSuccessNotice(
          "Yêu cầu nâng cấp VIP đã được ghi nhận! Hệ thống SePay đang tự động kiểm tra giao dịch chuyển khoản. Tài khoản của bạn sẽ được kích hoạt ngay khi nhận được thanh toán."
        );
      } else {
        alert(res.error || "Có lỗi xảy ra, vui lòng liên hệ admin hỗ trợ");
      }
    } catch (e) {
      console.error(e);
      alert("Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại sau.");
    } finally {
      setIsRequestingVip(false);
    }
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
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* ── 1. HERO PROFILE CARD ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-10 text-white border border-slate-800 shadow-2xl">
        {/* Ambient Glows adapting to theme */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-25"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: "var(--brand-primary)" }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* User Basic Info */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-brand text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl shadow-brand/25 border-2 border-white/20">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              {user.isVIP && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 p-1.5 rounded-xl shadow-md border-2 border-slate-950">
                  <Crown size={15} className="fill-slate-950" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{user.name}</h1>
                {user.role === "ADMIN" && (
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-light text-brand text-[10px] font-black uppercase tracking-wider border border-brand/30">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-mono">{user.email}</p>
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
                onClick={scrollToPricing}
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
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar gap-2">
        <button
          onClick={() => setActiveTab("vip")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === "vip"
            ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/10 rounded-t-xl"
            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          <Crown size={17} className={activeTab === "vip" ? "text-amber-500" : "text-slate-400"} />
          <span>{user.isVIP ? "Đặc Quyền VIP" : "Gói VIP & Nâng Cấp"}</span>
        </button>

        <button
          onClick={() => setActiveTab("info")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === "info"
            ? "border-brand text-brand bg-brand-light rounded-t-xl"
            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          <User size={17} className={activeTab === "info" ? "text-brand" : "text-slate-400"} />
          <span>Thông Tin Cá Nhân</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === "history"
            ? "border-brand text-brand bg-brand-light rounded-t-xl"
            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
        >
          <Clock size={17} className={activeTab === "history" ? "text-brand" : "text-slate-400"} />
          <span>Tiến Độ & Lịch Sử</span>
        </button>
      </div>

      {/* ── 3. TAB 1: VIP MEMBERSHIP & UPGRADE ───────────────────────────────────── */}
      {activeTab === "vip" && (
        <div className="space-y-10">
          {/* ── A. LUXURY VIRTUAL MEMBERSHIP CARD & STATUS ────────────────────────── */}
          {user.isVIP ? (
            /* ACTIVE VIP PRO: LUXURY BLACK & GOLD METAL CARD */
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-zinc-900 to-amber-950 p-7 sm:p-9 text-white border border-amber-500/40 shadow-2xl shadow-amber-500/10">
              {/* Card Ambient Glows */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                {/* Left: Card Info */}
                <div className="space-y-4 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25">
                      <Crown size={14} className="fill-slate-950" /> AIChoShop Black Elite
                    </span>
                    <span className="text-xs font-bold text-amber-300/90 flex items-center gap-1.5">
                      {user.vipExpiresAt && user.vipDaysLeft !== null ? (
                        <>
                          <Clock size={14} className="text-amber-400" />
                          <span>
                            Trạng thái: VIP PRO (Còn <strong className="text-white font-black">{user.vipDaysLeft} ngày</strong> - Đến{" "}
                            {new Date(user.vipExpiresAt).toLocaleDateString("vi-VN")})
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} className="text-amber-400" />
                          <span>Trạng thái: Kích hoạt vĩnh viễn (LIFETIME)</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Chào mừng Hội Viên <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">{user.name}</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Bạn đang sở hữu đặc quyền tối thượng của AIChoShop: không giới hạn toàn bộ 8 công cụ AI, 100% bài giảng Masterclass và quyền truy cập nhóm kín Top Seller.
                    </p>
                  </div>

                  {/* Card Number & EMV Chip Emulation */}
                  <div className="flex items-center gap-4 pt-2">
                    <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 shadow-inner flex items-center justify-center border border-amber-300/60">
                      <div className="w-7 h-5 rounded border border-amber-700/40 grid grid-cols-2 gap-0.5 p-0.5">
                        <div className="bg-amber-600/30 rounded-xs"></div>
                        <div className="bg-amber-600/30 rounded-xs"></div>
                      </div>
                    </div>
                    <div className="font-mono text-sm tracking-widest text-amber-200/90 font-bold">
                      VIP •••• •••• {user.id.slice(-4).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                  <Link
                    href="/learn"
                    className="px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
                  >
                    <BookOpen size={16} className="fill-slate-950" />
                    <span>Vào Học Masterclass</span>
                  </Link>
                  <Link
                    href="/tools"
                    className="px-5 py-3 bg-slate-800/90 hover:bg-slate-700/90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer"
                  >
                    <Zap size={16} className="text-amber-400" />
                    <span>Mở Kho Công Cụ AI</span>
                  </Link>
                  <a
                    href="https://zalo.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-brand/20 hover:bg-brand/30 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-brand/30"
                  >
                    <MessageCircle size={15} />
                    <span>Nhóm Zalo VIP Support</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* FREE MEMBER: INVITATION TO VIP CLUB */
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-7 sm:p-9 text-white border border-slate-800 shadow-2xl">
              <div
                className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-20"
                style={{ backgroundColor: "var(--brand-primary)" }}
              />
              <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    Nâng Cấp <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-300">VIP PRO MEMBER</span> – Bứt Phá Doanh Số TMĐT
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Bạn hiện đang sử dụng gói <strong>FREE</strong> với tính năng giới hạn. Gia nhập cộng đồng VIP Seller để mở khóa không giới hạn trọn bộ 8 công cụ AI bán hàng, 100% video thực chiến và nhận hỗ trợ 1-1 độc quyền.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-amber-200/90 font-medium">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400" /> Không giới hạn lượt AI</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400" /> Mở toàn bộ 27 bài giảng</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400" /> Hỗ trợ kỹ thuật 1-1</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                  <button
                    onClick={scrollToPricing}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
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
          {!user.isVIP && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                <Shield size={14} className="text-brand" /> So sánh nhanh quyền lợi tài khoản
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Công cụ AI Bán Hàng</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Free: 3 lượt/ngày</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">VIP: Không giới hạn</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Video Masterclass</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Free: 12 bài cơ bản</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">VIP: 27 bài chuyên sâu</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Kho Prompt Bán Hàng</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Free: Giới hạn</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">VIP: Tặng 200+ mẫu</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Tốc Độ Xử Lý & Support</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Free: Tiêu chuẩn</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">VIP: Server riêng & 1-1</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
          {!user.isVIP && (
            <>
              {/* ── D. BỘ 3 GÓI NÂNG CẤP VIP (PRICING SECTION) ─────────────────────────── */}
              <div id="pricing-section" className="space-y-6 pt-4 scroll-mt-6">
                <div className="text-center max-w-xl mx-auto space-y-1.5">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Chọn Gói VIP Phù Hợp Với Bạn
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Đầu tư 1 lần – Nhân bản doanh số bền vững. Chọn gói bên dưới để kích hoạt ngay.
                  </p>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-${Math.min(activeVipPlans.length, 3)} gap-6`}>
                  {activeVipPlans.map((plan) => {
                    const isSelected = selectedPlan === plan.slug || selectedPlan === plan.id;

                    return (
                      <div
                        key={plan.id || plan.slug}
                        onClick={() => {
                          setSelectedPlan(plan.slug || plan.id);
                          setIsPaymentModalOpen(true);
                        }}
                        className={`relative rounded-3xl p-6 sm:p-7 transition-all cursor-pointer flex flex-col justify-between border-2 ${isSelected
                          ? "border-amber-500 bg-white dark:bg-slate-900 shadow-2xl shadow-amber-500/15 scale-[1.03] z-10"
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
                            setSelectedPlan(plan.slug || plan.id);
                            setIsPaymentModalOpen(true);
                          }}
                          className={`w-full mt-6 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isSelected
                            ? "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/25"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                        >
                          <CreditCard size={15} />
                          <span>{isSelected ? "Thanh Toán Gói Này →" : "Chọn Gói Này →"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── MODAL THANH TOÁN VIETQR & SEPAY GATEWAY ────────────────────────────── */}
              {isPaymentModalOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setVipSuccessNotice(null);
                  }}
                >
                  <div
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl my-auto overflow-hidden text-slate-900 dark:text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20">
                          <Crown size={20} className="fill-slate-950" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-black tracking-tight">
                            Cổng Thanh Toán Kích Hoạt VIP
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Hệ thống tự động kích hoạt 24/7 qua SePay Webhook
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPaymentModalOpen(false);
                          setVipSuccessNotice(null);
                        }}
                        className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                        title="Đóng"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-4 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto custom-scrollbar">
                      {/* Gói đang chọn */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                          Gói cước VIP đang chọn:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {activeVipPlans.map((plan) => {
                            const isCur = currentPlan.slug === plan.slug || currentPlan.id === plan.id;
                            return (
                              <button
                                key={plan.id || plan.slug}
                                type="button"
                                onClick={() => {
                                  setSelectedPlan(plan.slug || plan.id);
                                  setVipSuccessNotice(null);
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${isCur
                                  ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 shadow-xs"
                                  : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700"
                                  }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className={`text-xs font-black ${isCur ? "text-amber-800 dark:text-amber-300" : "text-slate-800 dark:text-slate-200"}`}>
                                    {plan.name}
                                  </span>
                                  {plan.tag && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-amber-500/20 text-amber-800 dark:text-amber-200">
                                      {plan.tag}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-black text-slate-900 dark:text-white">
                                  {plan.price.toLocaleString("vi-VN")} đ <span className="text-[10px] font-medium text-slate-400">{plan.period}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Thông báo thành công */}
                      {vipSuccessNotice ? (
                        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 text-center animate-in fade-in">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                            <CheckCircle2 size={26} />
                          </div>
                          <h4 className="font-black text-emerald-900 dark:text-emerald-200 text-sm">
                            Đã Ghi Nhận Yêu Cầu Chuyển Khoản!
                          </h4>
                          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed max-w-md mx-auto">
                            {vipSuccessNotice}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPaymentModalOpen(false);
                              setVipSuccessNotice(null);
                            }}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                          >
                            Hoàn Tất & Đóng
                          </button>
                        </div>
                      ) : (
                        /* Grid QR + Info */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                          {/* Left: VietQR Box */}
                          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-center">
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <QrCode size={15} className="text-brand" /> Quét mã VietQR Ngân Hàng
                            </div>

                            <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                              <img
                                src={qrImgSrc}
                                alt="VietQR Chuyển Khoản"
                                onError={() => {
                                  if (qrImgSrc !== sepayQrUrl) {
                                    setQrImgSrc(sepayQrUrl);
                                  }
                                }}
                                className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                              />
                            </div>

                            <div className="space-y-1">
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                Mở App ngân hàng quét mã QR để tự động điền đúng Số Tiền và Nội Dung.
                              </p>
                              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                <Zap size={12} /> Tự động duyệt sau 1 - 3 phút
                              </div>
                            </div>
                          </div>

                          {/* Right: Transfer details */}
                          <div className="space-y-2.5">
                            {/* Ngân hàng */}
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ngân Hàng</span>
                                <span className="text-xs font-black text-slate-900 dark:text-white">{bankName}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(bankName, "bankName")}
                                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedField === "bankName" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                <span className="text-[11px]">{copiedField === "bankName" ? "Đã chép" : "Sao chép"}</span>
                              </button>
                            </div>

                            {/* Số tài khoản */}
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số Tài Khoản</span>
                                <span className="text-sm font-mono font-black text-slate-900 dark:text-white">{accountNumber}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(accountNumber, "accountNumber")}
                                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedField === "accountNumber" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                <span className="text-[11px]">{copiedField === "accountNumber" ? "Đã chép" : "Sao chép"}</span>
                              </button>
                            </div>

                            {/* Chủ tài khoản */}
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chủ Tài Khoản</span>
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{accountHolder}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(accountHolder, "accountHolder")}
                                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedField === "accountHolder" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                <span className="text-[11px]">{copiedField === "accountHolder" ? "Đã chép" : "Sao chép"}</span>
                              </button>
                            </div>

                            {/* Số tiền */}
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số Tiền</span>
                                <span className="text-sm font-black text-brand">
                                  {currentPlan.price.toLocaleString("vi-VN")} đ
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(currentPlan.price.toString(), "amount")}
                                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedField === "amount" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                <span className="text-[11px]">{copiedField === "amount" ? "Đã chép" : "Sao chép"}</span>
                              </button>
                            </div>

                            {/* Nội dung chuyển khoản */}
                            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600/60 flex items-center justify-between shadow-xs">
                              <div>
                                <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                                  Nội Dung Chuyển Khoản <span className="text-rose-500 font-bold">*</span>
                                </span>
                                <span className="text-sm font-mono font-black text-slate-950 dark:text-amber-200 select-all">
                                  {transferContent}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(transferContent, "transferContent")}
                                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs shrink-0"
                              >
                                {copiedField === "transferContent" ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                                <span className="text-[11px]">{copiedField === "transferContent" ? "Đã chép!" : "Sao chép"}</span>
                              </button>
                            </div>

                            <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                              ⚠️ <strong>Lưu ý:</strong> Vui lòng giữ đúng nội dung chuyển khoản để hệ thống tự động đối soát và kích hoạt VIP.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                      <a
                        href="https://zalo.me"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-500 hover:text-brand transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle size={15} />
                        <span>Hỗ trợ thanh toán Zalo 24/7</span>
                      </a>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setIsPaymentModalOpen(false);
                            setVipSuccessNotice(null);
                          }}
                          className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Đóng
                        </button>
                        <button
                          type="button"
                          disabled={isRequestingVip || Boolean(vipSuccessNotice)}
                          onClick={handleConfirmTransfer}
                          className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isRequestingVip ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} className="fill-slate-950 text-amber-400" />
                          )}
                          <span>{isRequestingVip ? "Đang gửi..." : "Tôi Đã Chuyển Khoản"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      )}

      {/* ── 4. TAB 2: PERSONAL INFORMATION ──────────────────────────────────────── */}
      {activeTab === "info" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
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
              className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-brand/20 flex items-center gap-2 cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Bài Học Đã Hoàn Thành</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Theo dõi danh sách các bài học video bạn đã tích lũy trong lộ trình X10 Doanh Số.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-brand-light text-brand font-bold text-xs">
                {user.completedLessons.length} bài đã học
              </span>
            </div>

            {user.completedLessons.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
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
                  <div key={item.lessonId} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Check size={14} />
                      </div>
                      <div className="min-w-0">
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Lịch Sử Giao Dịch & Nâng Cấp VIP</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Các đơn đăng ký gói thành viên VIP của bạn trên hệ thống.
              </p>
            </div>

            {user.transactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <CreditCard size={24} className="text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Chưa có giao dịch nào</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Khi bạn đăng ký nâng cấp gói VIP, lịch sử và trạng thái duyệt sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
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
    </div>
  );
}
