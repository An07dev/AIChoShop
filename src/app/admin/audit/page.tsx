import Link from "next/link";
import { History, ShieldCheck, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export const metadata = { title: "Nhật ký quản trị | AIChoShop" };

const actions: Record<string, string> = {
  PERSONAL_HISTORY_ERASED: "Xóa nội dung lịch sử cá nhân",
  PRIVACY_MAINTENANCE: "Bảo trì dữ liệu riêng tư",
  VIP_EXPIRED: "VIP hết hạn",
  VIP_PLAN_SEEDED: "Khởi tạo gói VIP mặc định",
  SYSTEM_SETTINGS_UPDATED: "Cập nhật cấu hình AI", BANK_SETTINGS_UPDATED: "Cập nhật ngân hàng",
  LESSON_CREATED: "Thêm bài học", LESSON_UPDATED: "Cập nhật bài học", LESSON_DELETED: "Xóa bài học",
  COURSE_CREATED: "Thêm khóa học", COURSE_UPDATED: "Cập nhật khóa học", COURSE_DELETED: "Xóa khóa học",
  VIP_PLAN_CREATED: "Thêm gói VIP", VIP_PLAN_UPDATED: "Cập nhật gói VIP", VIP_PLAN_DELETED: "Xóa gói VIP",
  PRICING_FEE_CREATED: "Thêm biểu phí", PRICING_FEE_UPDATED: "Cập nhật biểu phí", PRICING_FEE_DELETED: "Xóa biểu phí",
  VIDEO_UPLOADED: "Tải video lên", LOGIN_FAILED: "Đăng nhập thất bại", LOGIN_RATE_LIMITED: "Đăng nhập quá giới hạn",
  ADMIN_ACCESS_DENIED: "Truy cập bị từ chối", ADMIN_ORIGIN_DENIED: "Nguồn yêu cầu bị từ chối",
  ADMIN_OPERATION_REJECTED: "Thao tác không được chấp nhận", ADMIN_OPERATION_FAILED: "Thao tác gặp lỗi",
  VIP_CHANGED: "Thay đổi VIP", USER_CREATED: "Tạo tài khoản", USER_DELETED: "Xóa tài khoản",
  USER_LOCK_CHANGED: "Thay đổi khóa tài khoản", USER_QUOTA_CHANGED: "Đổi hạn mức AI",
  GLOBAL_QUOTA_CHANGED: "Đổi hạn mức chung", ADMIN_PASSWORD_RESET: "Đặt lại mật khẩu",
  PASSWORD_RESET_COMPLETED: "Khôi phục mật khẩu", PAYMENT_APPROVED: "Duyệt thanh toán", PAYMENT_CANCELLED: "Hủy yêu cầu thanh toán",
};
function describe(action: string, raw: string | null) {
  let data: Record<string, unknown> = {};
  try { const parsed: unknown = JSON.parse(raw || "{}"); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed as Record<string, unknown>; } catch {}
  let title = actions[action] || "Thao tác khác";
  let detail = "Thao tác đã được ghi nhận.";
  let tone = "bg-blue-50 text-blue-700 ring-blue-100";
  if (action === "VIP_CHANGED" && typeof data.isVIP === "boolean") {
    title = data.isVIP ? "Bật / cập nhật VIP" : "Tắt VIP";
    detail = data.isVIP ? "Tài khoản có trạng thái VIP sau thao tác." : "Tài khoản chuyển về trạng thái Free.";
    tone = data.isVIP ? "bg-amber-50 text-amber-800 ring-amber-100" : "bg-slate-100 text-slate-600 ring-slate-200";
  } else if (action === "USER_LOCK_CHANGED" && typeof data.isLocked === "boolean") {
    title = data.isLocked ? "Khóa tài khoản" : "Mở khóa tài khoản";
    detail = data.isLocked ? "Đã khóa tài khoản và thu hồi phiên đăng nhập." : "Tài khoản được phép đăng nhập trở lại.";
    tone = data.isLocked ? "bg-rose-50 text-rose-700 ring-rose-100" : "bg-emerald-50 text-emerald-700 ring-emerald-100";
  } else if (["USER_QUOTA_CHANGED", "GLOBAL_QUOTA_CHANGED"].includes(action)) {
    const limit = action === "GLOBAL_QUOTA_CHANGED" ? data.limit : data.dailyFreeLimit;
    detail = typeof limit === "number" ? `Hạn mức mới: ${limit.toLocaleString("vi-VN")} lượt AI/ngày.` : "Đã cập nhật hạn mức sử dụng AI.";
  } else if (action === "USER_CREATED") detail = data.isAdmin ? "Đã tạo tài khoản quản trị viên." : "Đã tạo tài khoản người dùng.";
  else if (action === "USER_DELETED") { detail = "Đã xóa tài khoản; nhật ký vẫn được lưu."; tone = "bg-rose-50 text-rose-700 ring-rose-100"; }
  else if (action === "PAYMENT_APPROVED") detail = typeof data.amount === "number" ? `Đã duyệt ${data.amount.toLocaleString("vi-VN")} đ và cấp quyền VIP.` : "Đã đối soát thanh toán và cấp quyền VIP.";
  else if (action === "PAYMENT_CANCELLED") detail = "Đã hủy yêu cầu chưa thanh toán, giữ lại lịch sử.";
  else if (["ADMIN_PASSWORD_RESET", "PASSWORD_RESET_COMPLETED"].includes(action)) detail = "Mật khẩu đã được đổi; các phiên đăng nhập cũ đã thu hồi.";
  else if (["SYSTEM_SETTINGS_UPDATED", "BANK_SETTINGS_UPDATED"].includes(action)) {
    const changed = [["keyChanged", "khóa kết nối"], ["modelChanged", "model AI"], ["endpointChanged", "địa chỉ kết nối"], ["bankChanged", "ngân hàng"], ["accountChanged", "tài khoản nhận tiền"], ["holderChanged", "chủ tài khoản"]].filter(([key]) => data[key] === true).map(([, label]) => label);
    detail = changed.length ? `Đã cập nhật ${changed.join(", ")}. Giá trị bí mật không được lưu trong nhật ký.` : "Đã lưu cấu hình hệ thống.";
  } else if (/^(LESSON|COURSE|VIP_PLAN|PRICING_FEE)_/.test(action)) {
    detail = action.endsWith("DELETED") ? "Đã xóa bản ghi; nhật ký được giữ lại." : "Đã lưu thay đổi.";
    const values = [["price", "Giá gói"], ["durationDays", "Số ngày"], ["commissionRate", "Phí hoa hồng (%)"], ["transactionRate", "Phí giao dịch (%)"], ["orderProcessingFee", "Phí xử lý đơn"]].filter(([key]) => typeof data[key] === "number").map(([key, label]) => `${label}: ${(data[key] as number).toLocaleString("vi-VN")}`);
    if (typeof data.active === "boolean") values.push(data.active ? "Đang bật" : "Đã tắt");
    if (typeof data.isVIP === "boolean") values.push(data.isVIP ? "Bài học VIP" : "Bài học Free");
    if (values.length) detail += ` ${values.join(" · ")}.`;
  } else if (action === "VIDEO_UPLOADED") detail = typeof data.bytes === "number" ? `Đã tải video (${(data.bytes / 1048576).toFixed(1)} MB).` : "Đã tải video lên.";
  else if (action.startsWith("LOGIN_") || action.includes("DENIED") || action.includes("REJECTED") || action.includes("FAILED")) {
    detail = action.startsWith("LOGIN_") ? "Không tạo phiên đăng nhập. Danh tính chưa được xác minh." : "Yêu cầu báo lỗi hoặc bị từ chối; xem các bản ghi thay đổi liên quan. Không lưu thông tin bí mật.";
    tone = "bg-rose-50 text-rose-700 ring-rose-100";
  }
  return { title, detail, tone };
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; action?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const page = Math.max(1, Math.min(10000, Math.floor(Number(query.page) || 1)));
  const action = query.action && Object.hasOwn(actions, query.action) ? query.action : "";
  const where = action ? { action } : {};
  const [events, total, failed] = await Promise.all([
    prisma.adminAuditLog.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 50, take: 50 }),
    prisma.adminAuditLog.count({ where }),
    prisma.passwordReset.count({ where: { deliveryStatus: "FAILED" } }),
  ]);
  const ids = [...new Set(events.flatMap(event => [event.actorId, ...(!event.action.startsWith("PAYMENT_") && event.targetId !== "default" ? [event.targetId] : [])]))];
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } });
  const people = new Map(users.map(user => [user.id, user]));
  const paymentIds = events.filter(event => event.action.startsWith("PAYMENT_")).map(event => event.targetId);
  const payments = await prisma.transaction.findMany({ where: { id: { in: paymentIds } }, select: { id: true, paymentCode: true } });
  const codes = new Map(payments.map(payment => [payment.id, payment.paymentCode]));
  const person = (id: string) => {
    if (id === "anonymous") return <span className="text-slate-500">Chưa xác minh danh tính</span>;
    if (id === "system") return <span className="text-slate-500">Hệ thống tự động</span>;
    const user = people.get(id);
    return <div className="min-w-0"><p className="font-semibold text-slate-800 break-words">{user?.name || user?.email || "Tài khoản không còn trong hệ thống"}</p>{user?.email && user.name && <p className="mt-1 text-xs text-slate-500 break-all">{user.email}</p>}<details className="mt-1 text-xs text-slate-400"><summary className="cursor-pointer hover:text-slate-600">Xem mã tài khoản</summary><span className="block mt-1 break-all font-mono">{id}</span></details></div>;
  };
  const target = (action: string, id: string) => {
    const category = action.startsWith("LESSON_") ? "Bài học" : action.startsWith("COURSE_") ? "Khóa học" : action.startsWith("VIP_PLAN_") ? "Gói VIP" : action.startsWith("PRICING_FEE_") ? "Biểu phí" : action.startsWith("VIDEO_") ? "Video" : action.startsWith("LOGIN_") ? "Yêu cầu đăng nhập" : "Thao tác quản trị";
    return <div className="text-slate-600">{category}<details className="mt-1 text-xs text-slate-400"><summary className="cursor-pointer">Xem mã tham chiếu</summary><span className="block break-all mt-1">{id}</span></details></div>;
  };
  const href = (value: number) => `/admin/audit?${new URLSearchParams({ page: String(value), ...(action ? { action } : {}) })}`;
  return <div className="mx-auto w-full max-w-7xl space-y-6">
    <div className="flex items-start gap-4"><div className="rounded-2xl bg-blue-600 p-3 text-white shadow-sm"><History size={25} /></div><div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Nhật ký quản trị</h1><p className="mt-1.5 text-sm text-slate-500">Theo dõi các thay đổi tài khoản và thanh toán trong hệ thống.</p></div></div>
    {failed > 0 && <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle size={20} className="shrink-0" /><p>Có {failed.toLocaleString("vi-VN")} yêu cầu khôi phục ghi nhận lỗi gửi email. Hãy kiểm tra cấu hình dịch vụ email.</p></div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Lịch sử hoạt động <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{total.toLocaleString("vi-VN")}</span></h2><p className="mt-1 text-xs text-slate-500">Mới nhất trước · Giờ Việt Nam</p></div><form className="flex flex-wrap items-end gap-2"><label className="text-xs font-medium text-slate-600">Loại thao tác<select name="action" defaultValue={action} className="mt-1 block max-w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-800"><option value="">Tất cả thao tác</option>{Object.entries(actions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Lọc</button></form></div>
      {!events.length ? <div className="px-5 py-16 text-center"><History size={36} className="mx-auto text-slate-300" /><h3 className="mt-4 font-semibold text-slate-700">Chưa có hoạt động phù hợp</h3><p className="mt-2 text-sm text-slate-500">Các thao tác mới sẽ xuất hiện tại đây sau khi được ghi nhận.</p>{(action || page > 1) && <Link href="/admin/audit" className="mt-4 inline-block text-sm font-semibold text-blue-600">Xem tất cả hoạt động</Link>}</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="hidden bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-header-group"><tr>{["Thời gian", "Người thực hiện", "Thao tác", "Đối tượng", "Nội dung"].map(label => <th key={label} className="px-5 py-4">{label}</th>)}</tr></thead><tbody className="block divide-y divide-slate-100 lg:table-row-group">{events.map(event => {
        const info = describe(event.action, event.details);
        return <tr key={event.id} className="grid gap-4 p-5 hover:bg-slate-50/60 sm:grid-cols-2 lg:table-row lg:p-0"><td className="align-top lg:px-5 lg:py-5"><time dateTime={event.createdAt.toISOString()} className="font-semibold text-slate-800">{event.createdAt.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</time><p className="mt-1 text-xs text-slate-500">{event.createdAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p></td><td className="align-top lg:px-5 lg:py-5"><span className="mb-1 block text-xs text-slate-400 lg:hidden">Người thực hiện</span>{person(event.actorId)}</td><td className="align-top lg:px-5 lg:py-5"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${info.tone}`}>{info.title}</span></td><td className="align-top lg:px-5 lg:py-5"><span className="mb-1 block text-xs text-slate-400 lg:hidden">Đối tượng</span>{event.targetId === "default" ? <span className="font-medium text-slate-700">Toàn hệ thống</span> : event.action.startsWith("PAYMENT_") ? <div><p className="font-semibold text-slate-800">Yêu cầu thanh toán</p><p className="mt-1 break-all text-xs text-slate-500">{codes.get(event.targetId) || event.targetId}</p></div> : /^(LESSON_|COURSE_|VIP_PLAN_|PRICING_FEE_|VIDEO_|LOGIN_|ADMIN_ACCESS_|ADMIN_ORIGIN_|ADMIN_OPERATION_)/.test(event.action) ? target(event.action, event.targetId) : event.actorId === event.targetId ? <span className="text-slate-600">Tài khoản của chính mình</span> : person(event.targetId)}</td><td className="text-sm leading-6 text-slate-600 sm:col-span-2 lg:max-w-xs lg:px-5 lg:py-5 lg:align-top">{info.detail}</td></tr>;
      })}</tbody></table></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500"><span>{events.length ? `${(page - 1) * 50 + 1}–${(page - 1) * 50 + events.length} / ${total} hoạt động` : "0 hoạt động trên trang này"}</span><div className="flex items-center gap-3">{page > 1 && <Link aria-label="Trang trước" href={href(page - 1)} className="rounded-lg border p-2 hover:bg-slate-50"><ChevronLeft size={16} /></Link>}<span>Trang {page}</span>{page * 50 < total && <Link aria-label="Trang sau" href={href(page + 1)} className="rounded-lg border p-2 hover:bg-slate-50"><ChevronRight size={16} /></Link>}</div></div>
    </section>
    <p className="flex items-start gap-2 text-xs leading-5 text-slate-400"><ShieldCheck size={16} className="mt-0.5 shrink-0" />Nhật ký được lưu từ khi tính năng được triển khai. Tên và email hiển thị theo thông tin tài khoản hiện tại.</p>
  </div>;
}
