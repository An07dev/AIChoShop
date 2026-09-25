import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  History,
  KeyRound,
  Lock,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Database,
  Trash2,
  Sparkles,
  Server,
  FileText,
  AlertTriangle,
  Layers,
  HardDrive,
  Check,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { historyCutoff } from "@/lib/privacy/policy";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MaintenanceControls } from "./MaintenanceControls";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Bảo Trì Dữ Liệu Riêng Tư & Lưu Trữ 90 Ngày - AIChoShop Admin",
  description:
    "Quản trị chu kỳ lưu trữ 90 ngày, thanh lọc nội dung nhạy cảm và bảo vệ quyền riêng tư người dùng.",
};

export default async function AdminPrivacyPage() {
  await requireAdmin("privacy-maintenance");

  const now = new Date();
  const cutoff = historyCutoff(now);

  const [
    pendingHistoryCount,
    expiredSessionsCount,
    expiredResetsCount,
    expiredRateLimitsCount,
    lastMaintenance,
    totalHistoryLogs,
  ] = await Promise.all([
    // 1. Số nhật ký AI quá 90 ngày chưa được dọn nội dung
    prisma.aiUsageLog.count({
      where: {
        createdAt: { lt: cutoff },
        OR: [
          { input: { not: null } },
          { output: { not: null } },
          { action: { not: "Nội dung lịch sử đã được xóa" } },
        ],
      },
    }),
    // 2. Số phiên đăng nhập đã quá hạn
    prisma.seoSession.count({
      where: { expiresAt: { lt: now } },
    }),
    // 3. Số token khôi phục mật khẩu đã quá hạn
    prisma.passwordReset.count({
      where: {
        expiresAt: { lt: now },
        OR: [{ tokenHash: { not: null } }, { passwordVersion: { not: null } }],
      },
    }),
    // 4. Số bộ đếm rate limit cũ hơn 24 giờ
    prisma.authRateLimit.count({
      where: { expiresAt: { lt: new Date(now.getTime() - 86400000) } },
    }),
    // 5. Nhật ký bảo trì gần nhất
    prisma.adminAuditLog.findFirst({
      where: { action: "PRIVACY_MAINTENANCE" },
      orderBy: { createdAt: "desc" },
    }),
    // 6. Tổng số nhật ký AI trên hệ thống
    prisma.aiUsageLog.count(),
  ]);

  // Lấy thông tin quản trị viên thực hiện lần bảo trì gần nhất
  let lastActorLabel = "Hệ thống tự động";
  if (lastMaintenance?.actorId) {
    const actor = await prisma.user.findUnique({
      where: { id: lastMaintenance.actorId },
      select: { name: true, email: true },
    });
    if (actor) {
      lastActorLabel = actor.name || actor.email || "Quản trị viên";
    }
  }

  // Định dạng ngày giờ lần bảo trì gần nhất
  const lastRunDateFormatted = lastMaintenance
    ? lastMaintenance.createdAt.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;
  const lastRunTimeFormatted = lastMaintenance
    ? lastMaintenance.createdAt.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6 w-full lg:w-[70%] mx-auto pb-12">
      {/* ── TIÊU ĐỀ TRANG QUẢN TRỊ DỮ LIỆU RIÊNG TƯ ── */}
      <AdminPageHeader
        title="Bảo Trì Dữ Liệu Riêng Tư & Lưu Trữ 90 Ngày"
        subtitle="Quản lý chu kỳ lưu trữ dữ liệu 90 ngày, thanh lọc thông tin nhạy cảm và bảo vệ an toàn quyền riêng tư cho người dùng theo cam kết bảo mật."
        icon={ShieldAlert}
        iconGradient="from-indigo-600 via-blue-600 to-cyan-600"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
            <ShieldCheck size={13} className="text-indigo-600" /> Cam Kết Lưu Trữ 90 Ngày
          </span>
        }
        actions={
          <Link
            href="/privacy"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer"
          >
            <span>Chính sách công khai</span>
            <ExternalLink size={13} className="text-slate-400" />
          </Link>
        }
      />

      {/* ── 4 THẺ CHỈ SỐ KPI DỮ LIỆU & TRẠNG THÁI HIỆN TẠI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Nhật ký AI > 90 ngày */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lịch Sử AI &gt; 90 Ngày</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {pendingHistoryCount.toLocaleString("vi-VN")}
              </span>
              <span className="text-xs text-slate-400">bản ghi</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Tổng log: {totalHistoryLogs.toLocaleString("vi-VN")}</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-md ${
                  pendingHistoryCount > 0
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {pendingHistoryCount > 0 ? "Chờ làm sạch" : "Đã tối ưu"}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Phiên đăng nhập hết hạn */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Phiên Hết Hạn</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <KeyRound size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {expiredSessionsCount.toLocaleString("vi-VN")}
              </span>
              <span className="text-xs text-slate-400">phiên</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Session quá hạn</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-md ${
                  expiredSessionsCount > 0
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {expiredSessionsCount > 0 ? "Cần dọn" : "Sạch sẽ"}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Token khôi phục mật khẩu hết hạn */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Token Khôi Phục</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Lock size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {expiredResetsCount.toLocaleString("vi-VN")}
              </span>
              <span className="text-xs text-slate-400">token</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Quá hạn &gt; 15 phút</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-md ${
                  expiredResetsCount > 0
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {expiredResetsCount > 0 ? "Chờ hủy" : "An toàn"}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Lần bảo trì gần nhất */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lần Bảo Trì Gần Nhất</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3">
            {lastMaintenance ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-slate-900 tracking-tight">
                    {lastRunTimeFormatted}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">· {lastRunDateFormatted}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 truncate max-w-[120px]" title={lastActorLabel}>
                    Bởi: {lastActorLabel}
                  </span>
                  <span className="font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    Đã lưu vết
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-base font-black text-slate-400">Chưa ghi nhận</div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Chưa chạy đợt nào</span>
                  <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Mới
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── KHỐI CHÍNH: TÁC VỤ KÍCH HOẠT BẢO TRÌ VÀ NGUYÊN TẮC BẢO TOÀN ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tiêu đề khối */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/70 to-white">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600" />
              Thực Thi Tác Vụ Dọn Dẹp &amp; Thanh Lọc Dữ Liệu
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Thực hiện quét toàn bộ cơ sở dữ liệu để loại bỏ nội dung nhạy cảm quá hạn và giải phóng dung lượng đĩa.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
              <CheckCircle2 size={12} /> Tuyệt Đối Không Mất Giao Dịch
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* So sánh 2 mặt: Dữ liệu được dọn dẹp vs Dữ liệu được bảo toàn vĩnh viễn */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cột 1: Dữ liệu sẽ được dọn dẹp */}
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wide">
                <Trash2 size={15} className="text-rose-600" />
                <span>Nội Dung Được Dọn Dẹp &amp; Giải Phóng</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold text-sm leading-none mt-0.5">•</span>
                  <span>
                    <strong>Lịch sử AI &gt; 90 ngày:</strong> Xóa trắng nội dung câu hỏi đầu vào (input) và kết quả (output), đổi nhãn thành <em>&quot;Nội dung lịch sử đã được xóa&quot;</em>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold text-sm leading-none mt-0.5">•</span>
                  <span>
                    <strong>Ảnh Base64 &amp; Chuỗi dung lượng lớn:</strong> Tự động gỡ bỏ ảnh đính kèm và dữ liệu nhị phân nặng nhằm tối ưu dung lượng DB.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold text-sm leading-none mt-0.5">•</span>
                  <span>
                    <strong>Phiên đăng nhập &amp; Token hết hạn:</strong> Xóa sạch các session cũ và token đổi mật khẩu đã quá hạn 15 phút.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold text-sm leading-none mt-0.5">•</span>
                  <span>
                    <strong>Bộ đếm chống lạm dụng:</strong> Xóa các bản ghi giới hạn tần suất đăng nhập (rate limit) cũ hơn 24 giờ.
                  </span>
                </li>
              </ul>
            </div>

            {/* Cột 2: Dữ liệu được bảo toàn vĩnh viễn */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
                <ShieldCheck size={15} className="text-emerald-600" />
                <span>Dữ Liệu Được Bảo Toàn Tuyệt Đối</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                  <span>
                    <strong>Số lượt sử dụng &amp; Quota:</strong> Giữ nguyên số lần sử dụng công cụ của từng học viên, hạn mức quota ngày và thống kê lượt gọi AI.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                  <span>
                    <strong>Quyền VIP &amp; Thời hạn:</strong> Bảo lưu trạng thái VIP, gói đăng ký đang hoạt động và số dư credit tài khoản.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                  <span>
                    <strong>Lịch sử giao dịch &amp; Hóa đơn:</strong> Toàn bộ biên lai thanh toán SePay, mã nạp và thông tin đối soát được lưu giữ vĩnh viễn.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                  <span>
                    <strong>Khóa học &amp; Tiến độ bài học:</strong> Bảo lưu các khóa học học viên đã sở hữu, video đã xem và trạng thái hoàn thành.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Component tương tác chạy bảo trì */}
          <div className="pt-2">
            <MaintenanceControls />
          </div>
        </div>
      </div>

      {/* ── BẢNG MA TRẬN QUY CHUẨN LƯU TRỮ DỮ LIỆU (DATA RETENTION POLICY) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Bảng Quy Chuẩn Lưu Trữ Dữ Liệu (Retention Policy Matrix)
              </h3>
              <p className="text-xs text-slate-500">
                Chính sách phân loại vòng đời dữ liệu áp dụng trên toàn bộ nền tảng AIChoShop.
              </p>
            </div>
          </div>
          <Link
            href="/admin/audit"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>Xem vết kiểm toán</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Loại Dữ Liệu</th>
                <th className="py-3 px-4">Thời Hạn Lưu Trữ</th>
                <th className="py-3 px-4">Hành Động Khi Hết Hạn</th>
                <th className="py-3 px-4">Hiển Thị Phía Người Dùng</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">Prompt &amp; Kết Quả AI (Nội dung thô)</div>
                  <div className="text-[11px] text-slate-400">Câu lệnh, kịch bản, ảnh sản phẩm gửi vào</div>
                </td>
                <td className="py-3 px-4 font-semibold text-indigo-700">90 Ngày</td>
                <td className="py-3 px-4">
                  <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-medium">
                    Xóa trắng Input/Output
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">
                  Ẩn khỏi giao diện lịch sử và API xuất dữ liệu
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                    <Check size={11} /> Tự động
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">Ảnh Base64 &amp; Dữ Liệu Nhị Phân Lớn</div>
                  <div className="text-[11px] text-slate-400">Ảnh đính kèm phân tích, biểu mẫu chụp màn hình</div>
                </td>
                <td className="py-3 px-4 font-semibold text-amber-700">Tức thì &amp; Quá hạn</td>
                <td className="py-3 px-4">
                  <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">
                    Lược bỏ ảnh, giữ text thuần
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">
                  Đánh dấu <em>[ảnh đã lược bỏ]</em>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                    <Check size={11} /> Tự động
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">Phiên Đăng Nhập (SeoSession)</div>
                  <div className="text-[11px] text-slate-400">Token xác thực cookie trên trình duyệt</div>
                </td>
                <td className="py-3 px-4 font-semibold text-purple-700">30 Ngày</td>
                <td className="py-3 px-4">
                  <span className="text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-medium">
                    Xóa vĩnh viễn khỏi Database
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">
                  Yêu cầu người dùng đăng nhập lại an toàn
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                    <Check size={11} /> Tự động
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">Token Khôi Phục Mật Khẩu (PasswordReset)</div>
                  <div className="text-[11px] text-slate-400">Mã hash xác minh đổi mật khẩu qua email</div>
                </td>
                <td className="py-3 px-4 font-semibold text-rose-700">15 Phút</td>
                <td className="py-3 px-4">
                  <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-medium">
                    Hủy mã hash &amp; version
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">
                  Link báo hết hạn và từ chối đổi mật khẩu
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                    <Check size={11} /> Tự động
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">Giao Dịch Nạp Tiền &amp; Hóa Đơn SePay</div>
                  <div className="text-[11px] text-slate-400">Biên lai chuyển khoản, mã thanh toán, ngày kích hoạt VIP</div>
                </td>
                <td className="py-3 px-4 font-semibold text-blue-700">Vĩnh Viễn</td>
                <td className="py-3 px-4">
                  <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium">
                    Bảo toàn kế toán &amp; đối soát
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">
                  Hiển thị trong lịch sử ví &amp; trang tài khoản cá nhân
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                    <ShieldCheck size={11} /> Lưu trữ
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">Khóa Học, Bài Học &amp; Tiến Độ Học Tập</div>
                  <div className="text-[11px] text-slate-400">Video đã xem, bài đã xong, chứng nhận</div>
                </td>
                <td className="py-3 px-4 font-semibold text-emerald-700">Vĩnh Viễn</td>
                <td className="py-3 px-4">
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                    Bảo toàn quyền lợi học tập
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">
                  Xem lại bất cứ lúc nào trong khu vực học viên
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                    <ShieldCheck size={11} /> Lưu trữ
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── KHỐI HƯỚNG DẪN TỰ ĐỘNG HÓA & CRON SCHEDULER ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hướng dẫn Cron Server */}
        <div className="md:col-span-2 bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Server size={15} />
            <span>Tự Động Hóa Định Kỳ Trên Máy Chủ (Production Cron)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Hệ thống có cơ chế tự làm sạch khi người dùng lưu kết quả công cụ mới. Tuy nhiên, để đảm bảo dữ liệu luôn được thanh lọc cả khi không có người dùng truy cập, hãy thiết lập Cron Job chạy hàng ngày vào lúc 02:00 sáng trên server deploy:
          </p>
          <div className="bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-emerald-400 border border-slate-800 flex items-center justify-between">
            <code>0 2 * * * cd /var/www/aichoshop &amp;&amp; npx tsx scripts/privacy-cron.ts</code>
            <span className="text-[10px] text-slate-500 font-sans">02:00 AM mỗi ngày</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>Mỗi lần bảo trì tự động đều ghi nhật ký vào bảng <code>AdminAuditLog</code> với nhãn <code>PRIVACY_MAINTENANCE</code>.</span>
          </div>
        </div>

        {/* Thẻ Chính Sách & Minh Bạch Pháp Lý */}
        <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/60 rounded-2xl p-5 border border-indigo-100 flex flex-col justify-between space-y-3">
          <div>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileText size={18} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-3">
              Chính Sách Quyền Riêng Tư Công Khai
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Trang chính sách bảo mật hiển thị công khai cho mọi học viên và người dùng ghé thăm AIChoShop.
            </p>
          </div>
          <Link
            href="/privacy"
            target="_blank"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-white border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-2xs group cursor-pointer"
          >
            <span>Đọc Chính Sách Công Khai</span>
            <ExternalLink size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
