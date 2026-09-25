import Link from "next/link";
import {
  ClipboardList,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Filter,
  User,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Nhật Ký Quản Trị Hệ Thống - AIChoShop Admin",
  description: "Theo dõi toàn bộ lịch sử thay đổi tài khoản, VIP và thanh toán.",
};

const actions: Record<string, string> = {
  PAYMENT_ENVIRONMENT_CHANGED: "Phân loại giao dịch thật/thử nghiệm",
  PAYMENT_REFUND_RECORDED: "Ghi nhận hoàn tiền toàn phần",
  PERSONAL_HISTORY_ERASED: "Xóa nội dung lịch sử cá nhân",
  PRIVACY_MAINTENANCE: "Bảo trì dữ liệu riêng tư",
  VIP_EXPIRED: "VIP hết hạn",
  VIP_PLAN_SEEDED: "Khởi tạo gói VIP mặc định",
  SYSTEM_SETTINGS_UPDATED: "Cập nhật cấu hình AI",
  BANK_SETTINGS_UPDATED: "Cập nhật ngân hàng",
  LESSON_CREATED: "Thêm bài học",
  LESSON_UPDATED: "Cập nhật bài học",
  LESSON_DELETED: "Xóa bài học",
  COURSE_CREATED: "Thêm khóa học",
  COURSE_UPDATED: "Cập nhật khóa học",
  COURSE_DELETED: "Xóa khóa học",
  VIP_PLAN_CREATED: "Thêm gói VIP",
  VIP_PLAN_UPDATED: "Cập nhật gói VIP",
  VIP_PLAN_DELETED: "Xóa gói VIP",
  PRICING_FEE_CREATED: "Thêm biểu phí",
  PRICING_FEE_UPDATED: "Cập nhật biểu phí",
  PRICING_FEE_DELETED: "Xóa biểu phí",
  VIDEO_UPLOADED: "Tải video lên",
  LOGIN_FAILED: "Đăng nhập thất bại",
  LOGIN_RATE_LIMITED: "Đăng nhập quá giới hạn",
  ADMIN_ACCESS_DENIED: "Truy cập bị từ chối",
  ADMIN_ORIGIN_DENIED: "Nguồn yêu cầu bị từ chối",
  ADMIN_OPERATION_REJECTED: "Thao tác không được chấp nhận",
  ADMIN_OPERATION_FAILED: "Thao tác gặp lỗi",
  VIP_CHANGED: "Thay đổi VIP",
  USER_CREATED: "Tạo tài khoản",
  USER_DELETED: "Xóa tài khoản",
  USER_LOCK_CHANGED: "Thay đổi khóa tài khoản",
  USER_QUOTA_CHANGED: "Đổi hạn mức AI",
  GLOBAL_QUOTA_CHANGED: "Đổi hạn mức chung",
  ADMIN_PASSWORD_RESET: "Đặt lại mật khẩu",
  PASSWORD_RESET_COMPLETED: "Khôi phục mật khẩu",
  PAYMENT_APPROVED: "Duyệt thanh toán",
  PAYMENT_CANCELLED: "Hủy yêu cầu thanh toán",
};

function describe(action: string, raw: string | null) {
  let data: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(raw || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      data = parsed as Record<string, unknown>;
    }
  } catch {}

  let title = actions[action] || "Thao tác khác";
  let detail = "Thao tác đã được ghi nhận.";
  let tone = "bg-blue-50 text-blue-700 ring-blue-200 border-blue-200";

  if (action === "VIP_CHANGED" && typeof data.isVIP === "boolean") {
    title = data.isVIP ? "Bật / Cập nhật VIP" : "Tắt quyền VIP";
    detail = data.isVIP
      ? "Tài khoản có trạng thái VIP sau thao tác."
      : "Tài khoản chuyển về trạng thái Free.";
    tone = data.isVIP
      ? "bg-amber-50 text-amber-800 ring-amber-200 border-amber-200"
      : "bg-slate-100 text-slate-600 ring-slate-200 border-slate-200";
  } else if (action === "USER_LOCK_CHANGED" && typeof data.isLocked === "boolean") {
    title = data.isLocked ? "Khóa tài khoản" : "Mở khóa tài khoản";
    detail = data.isLocked
      ? "Đã khóa tài khoản và thu hồi phiên đăng nhập."
      : "Tài khoản được phép đăng nhập trở lại.";
    tone = data.isLocked
      ? "bg-rose-50 text-rose-700 ring-rose-200 border-rose-200"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200";
  } else if (["USER_QUOTA_CHANGED", "GLOBAL_QUOTA_CHANGED"].includes(action)) {
    const limit = action === "GLOBAL_QUOTA_CHANGED" ? data.limit : data.dailyFreeLimit;
    detail =
      typeof limit === "number"
        ? `Hạn mức mới: ${limit.toLocaleString("vi-VN")} lượt AI/ngày.`
        : "Đã cập nhật hạn mức sử dụng AI.";
    tone = "bg-violet-50 text-violet-700 ring-violet-200 border-violet-200";
  } else if (action === "USER_CREATED") {
    detail = data.isAdmin
      ? "Đã tạo tài khoản quản trị viên mới."
      : "Đã tạo tài khoản học viên mới.";
    tone = "bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200";
  } else if (action === "USER_DELETED") {
    detail = "Đã xóa tài khoản vĩnh viễn; nhật ký kiểm toán được lưu giữ.";
    tone = "bg-rose-50 text-rose-700 ring-rose-200 border-rose-200";
  } else if (action === "PAYMENT_APPROVED") {
    detail =
      typeof data.amount === "number"
        ? `Đã duyệt ${data.amount.toLocaleString("vi-VN")} ₫ và kích hoạt VIP.`
        : "Đã đối soát thanh toán và kích hoạt VIP.";
    tone = "bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200";
  } else if (action === "PAYMENT_CANCELLED") {
    detail = "Đã hủy yêu cầu thanh toán chưa chuyển tiền; bảo toàn lịch sử.";
    tone = "bg-slate-100 text-slate-600 ring-slate-200 border-slate-200";
  } else if (["ADMIN_PASSWORD_RESET", "PASSWORD_RESET_COMPLETED"].includes(action)) {
    detail = "Mật khẩu đã được đổi; các phiên đăng nhập cũ đã được thu hồi an toàn.";
    tone = "bg-cyan-50 text-cyan-700 ring-cyan-200 border-cyan-200";
  } else if (["SYSTEM_SETTINGS_UPDATED", "BANK_SETTINGS_UPDATED"].includes(action)) {
    const changed = [
      ["keyChanged", "Khóa kết nối AI"],
      ["modelChanged", "Model AI"],
      ["endpointChanged", "Endpoint Base URL"],
      ["bankChanged", "Ngân hàng"],
      ["accountChanged", "Số tài khoản"],
      ["holderChanged", "Chủ tài khoản"],
    ]
      .filter(([key]) => data[key] === true)
      .map(([, label]) => label);
    detail = changed.length
      ? `Đã cập nhật: ${changed.join(", ")}. Khóa bí mật không được lưu trong nhật ký.`
      : "Đã lưu cấu hình hệ thống.";
    tone = "bg-indigo-50 text-indigo-700 ring-indigo-200 border-indigo-200";
  } else if (/^(LESSON|COURSE|VIP_PLAN|PRICING_FEE)_/.test(action)) {
    detail = action.endsWith("DELETED")
      ? "Đã xóa bản ghi; nhật ký kiểm toán được giữ lại."
      : "Đã lưu thay đổi nội dung.";
    const values = [
      ["price", "Giá"],
      ["durationDays", "Số ngày"],
      ["commissionRate", "Hoa hồng (%)"],
      ["transactionRate", "Phí GD (%)"],
      ["orderProcessingFee", "Phí đơn"],
    ]
      .filter(([key]) => typeof data[key] === "number")
      .map(([key, label]) => `${label}: ${(data[key] as number).toLocaleString("vi-VN")}`);
    if (typeof data.active === "boolean") values.push(data.active ? "Đang bật" : "Đã tắt");
    if (typeof data.isVIP === "boolean") values.push(data.isVIP ? "VIP" : "Free");
    if (values.length) detail += ` (${values.join(" · ")}).`;
    tone = action.endsWith("DELETED")
      ? "bg-rose-50 text-rose-700 ring-rose-200 border-rose-200"
      : "bg-blue-50 text-blue-700 ring-blue-200 border-blue-200";
  } else if (action === "VIDEO_UPLOADED") {
    detail =
      typeof data.bytes === "number"
        ? `Đã tải video (${(data.bytes / 1048576).toFixed(1)} MB).`
        : "Đã tải video lên.";
  } else if (
    action.startsWith("LOGIN_") ||
    action.includes("DENIED") ||
    action.includes("REJECTED") ||
    action.includes("FAILED")
  ) {
    detail = action.startsWith("LOGIN_")
      ? "Không tạo phiên đăng nhập. Danh tính hoặc mật khẩu không hợp lệ."
      : "Yêu cầu báo lỗi hoặc bị từ chối; không lưu thông tin bảo mật.";
    tone = "bg-rose-50 text-rose-700 ring-rose-200 border-rose-200";
  }

  return { title, detail, tone };
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const page = Math.max(1, Math.min(10000, Math.floor(Number(query.page) || 1)));
  const action = query.action && Object.hasOwn(actions, query.action) ? query.action : "";
  const where = action ? { action } : {};

  const [events, total, failed] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * 50,
      take: 50,
    }),
    prisma.adminAuditLog.count({ where }),
    prisma.passwordReset.count({ where: { deliveryStatus: "FAILED" } }),
  ]);

  const ids = [
    ...new Set(
      events.flatMap((event) => [
        event.actorId,
        ...(!event.action.startsWith("PAYMENT_") && event.targetId !== "default"
          ? [event.targetId]
          : []),
      ])
    ),
  ];

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });
  const people = new Map(users.map((user) => [user.id, user]));

  const paymentIds = events
    .filter((event) => event.action.startsWith("PAYMENT_"))
    .map((event) => event.targetId);
  const payments = await prisma.transaction.findMany({
    where: { id: { in: paymentIds } },
    select: { id: true, paymentCode: true },
  });
  const codes = new Map(payments.map((payment) => [payment.id, payment.paymentCode]));

  const person = (id: string) => {
    if (id === "anonymous") {
      return (
        <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-xs">
          Chưa xác minh danh tính
        </span>
      );
    }
    if (id === "system") {
      return (
        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold text-xs">
          Hệ thống tự động
        </span>
      );
    }
    const user = people.get(id);
    if (!user) {
      return (
        <span className="text-slate-400 text-xs">
          Tài khoản không còn ({id.slice(0, 8)}...)
        </span>
      );
    }
    const initials = (user.name || user.email).slice(0, 2).toUpperCase();
    return (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-slate-200">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 truncate max-w-[150px]">
            {user.name || "Chưa đặt tên"}
          </p>
          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[150px]">
            {user.email}
          </p>
        </div>
      </div>
    );
  };

  const target = (act: string, id: string) => {
    const category = act.startsWith("LESSON_")
      ? "Bài học"
      : act.startsWith("COURSE_")
      ? "Khóa học"
      : act.startsWith("VIP_PLAN_")
      ? "Gói VIP"
      : act.startsWith("PRICING_FEE_")
      ? "Biểu phí"
      : act.startsWith("VIDEO_")
      ? "Video"
      : act.startsWith("LOGIN_")
      ? "Yêu cầu đăng nhập"
      : "Thao tác quản trị";
    return (
      <div className="text-slate-700">
        <span className="font-semibold text-slate-800">{category}</span>
        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
          ID: {id.slice(0, 10)}...
        </span>
      </div>
    );
  };

  const href = (value: number) =>
    `/admin/audit?${new URLSearchParams({
      page: String(value),
      ...(action ? { action } : {}),
    })}`;

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="flex-1 h-full min-h-0 flex flex-col w-full lg:w-[70%] mx-auto space-y-3.5">
      {/* ── TIÊU ĐỀ TRANG NHẬT KÝ QUẢN TRỊ ── */}
      <AdminPageHeader
        title="Nhật Ký Quản Trị Hệ Thống"
        subtitle="Theo dõi toàn bộ lịch sử thay đổi tài khoản, VIP, thanh toán và bảo mật hệ thống."
        icon={ClipboardList}
        iconGradient="from-blue-600 to-indigo-600"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            {total.toLocaleString("vi-VN")} hoạt động
          </span>
        }
      />

      {/* Cảnh báo lỗi gửi email khôi phục mật khẩu (nếu có) */}
      {failed > 0 && (
        <div
          role="status"
          className="shrink-0 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-2xs"
        >
          <AlertCircle size={18} className="shrink-0 text-amber-600" />
          <p className="font-medium">
            Có <strong className="font-bold">{failed.toLocaleString("vi-VN")}</strong> yêu cầu
            khôi phục ghi nhận lỗi gửi email. Hãy kiểm tra cấu hình SMTP/Resend.
          </p>
        </div>
      )}

      {/* ── KHỐI BẢNG & BỘ LỌC (CHỈ CUỘN PHẦN TABLE, KHÔNG CUỘN CẢ TRANG) ── */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        {/* Thanh Lọc & Tiêu Đề Bảng (Cố định ở đầu card) */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 text-sm">Lịch sử hoạt động</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 border border-slate-200">
              Trang {page} / {totalPages}
            </span>
          </div>

          {/* Form lọc Loại thao tác */}
          <form method="GET" action="/admin/audit" className="flex items-center gap-2">
            <div className="relative">
              <select
                name="action"
                defaultValue={action}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">Tất cả thao tác</option>
                {Object.entries(actions).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <Filter size={12} />
              <span>Lọc</span>
            </button>
            {action && (
              <Link
                href="/admin/audit"
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Xóa
              </Link>
            )}
          </form>
        </div>

        {/* Khung Bảng Cuộn Độc Lập */}
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider shadow-2xs">
              <tr>
                <th className="px-4 py-3 bg-slate-50 whitespace-nowrap min-w-[130px]">
                  Thời gian (VN)
                </th>
                <th className="px-4 py-3 bg-slate-50 whitespace-nowrap min-w-[180px]">
                  Người thực hiện
                </th>
                <th className="px-4 py-3 bg-slate-50 whitespace-nowrap min-w-[150px]">
                  Thao tác
                </th>
                <th className="px-4 py-3 bg-slate-50 whitespace-nowrap min-w-[170px]">
                  Đối tượng
                </th>
                <th className="px-4 py-3 bg-slate-50 min-w-[240px]">
                  Nội dung chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    <ClipboardList size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-600 text-sm">
                      Chưa có hoạt động phù hợp
                    </p>
                    <p className="text-xs mt-1 text-slate-400">
                      Các thao tác mới sẽ xuất hiện tại đây sau khi được ghi nhận.
                    </p>
                    {(action || page > 1) && (
                      <Link
                        href="/admin/audit"
                        className="mt-3 inline-block text-xs font-bold text-blue-600 hover:underline"
                      >
                        Xem tất cả hoạt động
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const info = describe(event.action, event.details);
                  const timeFormatted = event.createdAt.toLocaleTimeString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  const dateFormatted = event.createdAt.toLocaleDateString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Cột 1: Thời gian */}
                      <td className="px-4 py-3 whitespace-nowrap align-top">
                        <div className="flex items-center gap-1 font-mono text-slate-800 font-bold">
                          <Clock size={11} className="text-slate-400 shrink-0" />
                          <span>{timeFormatted}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          {dateFormatted}
                        </span>
                      </td>

                      {/* Cột 2: Người thực hiện */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {person(event.actorId)}
                      </td>

                      {/* Cột 3: Thao tác */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${info.tone}`}
                        >
                          {info.title}
                        </span>
                      </td>

                      {/* Cột 4: Đối tượng */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {event.targetId === "default" ? (
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            Toàn hệ thống
                          </span>
                        ) : event.action.startsWith("PAYMENT_") ? (
                          <div>
                            <p className="font-semibold text-slate-800">Yêu cầu thanh toán</p>
                            <p className="font-mono text-[11px] text-blue-600 mt-0.5 font-bold">
                              {codes.get(event.targetId) || event.targetId.slice(0, 12)}
                            </p>
                          </div>
                        ) : /^(LESSON_|COURSE_|VIP_PLAN_|PRICING_FEE_|VIDEO_|LOGIN_|ADMIN_ACCESS_|ADMIN_ORIGIN_|ADMIN_OPERATION_)/.test(
                            event.action
                          ) ? (
                          target(event.action, event.targetId)
                        ) : event.actorId === event.targetId ? (
                          <span className="text-slate-500 italic text-xs">
                            Tài khoản chính mình
                          </span>
                        ) : (
                          person(event.targetId)
                        )}
                      </td>

                      {/* Cột 5: Nội dung chi tiết */}
                      <td className="px-4 py-3 align-top text-xs leading-relaxed text-slate-600">
                        {info.detail}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh Phân Trang Cố Định Ở Đáy Bảng */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 bg-slate-50/60 text-xs text-slate-500">
          <div>
            Hiển thị{" "}
            <span className="font-bold text-slate-900">
              {events.length
                ? `${(page - 1) * 50 + 1}–${(page - 1) * 50 + events.length}`
                : 0}
            </span>{" "}
            / <span className="font-bold text-slate-900">{total.toLocaleString("vi-VN")}</span> hoạt động
          </div>

          <div className="flex items-center gap-1.5">
            {page > 1 ? (
              <Link
                href={href(page - 1)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center gap-1 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Trước</span>
              </Link>
            ) : (
              <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 font-medium flex items-center gap-1 cursor-not-allowed">
                <ChevronLeft size={14} />
                <span>Trước</span>
              </span>
            )}

            <span className="px-2 font-semibold text-slate-700">
              Trang {page} / {totalPages}
            </span>

            {page * 50 < total ? (
              <Link
                href={href(page + 1)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center gap-1 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Sau</span>
                <ChevronRight size={14} />
              </Link>
            ) : (
              <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 font-medium flex items-center gap-1 cursor-not-allowed">
                <span>Sau</span>
                <ChevronRight size={14} />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chú thích bảo mật ở cuối */}
      <p className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
        <ShieldCheck size={14} className="text-slate-400 shrink-0" />
        <span>
          Nhật ký được bảo vệ toàn vẹn. Thông tin bí mật và mật khẩu không được lưu trữ trong nhật ký.
        </span>
      </p>
    </div>
  );
}
