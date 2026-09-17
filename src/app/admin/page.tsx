import { requireAdmin } from "@/lib/auth/session";
import { getAdminReport, reportPeriod } from "@/lib/admin/reporting";
import { listQuery, type SearchValues } from "@/lib/admin/list-query";
import Link from "next/link";
import Form from "next/form";
import { AdminReportChart } from "@/components/admin/AdminReportChart";
export const dynamic = "force-dynamic";
export const metadata = { title: "Báo cáo quản trị" };
const money = (value: number) => `${Math.round(value).toLocaleString("vi-VN")} đ`;
export default async function AdminDashboard({ searchParams }: {
    searchParams: Promise<SearchValues>;
}) {
    await requireAdmin();
    const values = await searchParams, q = listQuery(values);
    let period;
    try {
        period = reportPeriod(q.value("from"), q.value("to"));
    }
    catch (error) {
        return <div><h1 className="text-2xl font-bold">Báo cáo quản trị</h1><p role="alert">{error instanceof Error ? error.message : "Khoảng báo cáo không hợp lệ."}</p><Link href="/admin">Về báo cáo 30 ngày</Link></div>;
    }
    const report = await getAdminReport(period.start, period.end);
    return <div className="space-y-6"><h1 className="text-2xl font-bold">Báo cáo quản trị</h1><Form key={`${period.from}:${period.to}`} action="/admin" scroll={false} className="flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4"><label>Từ ngày<input type="date" name="from" defaultValue={period.from} className="block rounded border p-2"/></label><label>Đến hết ngày<input type="date" name="to" defaultValue={period.to} className="block rounded border p-2"/></label><button className="rounded bg-blue-600 px-4 py-2 text-white">Xem báo cáo</button><Link href="/admin">30 ngày gần nhất</Link></Form>
 <p className="text-sm text-slate-600">Kỳ {period.from} → {period.to} · Múi giờ Việt Nam (UTC+7). Doanh thu chỉ tính thanh toán VIP thật bằng VND; ghi nhận theo paidAt. Hoàn tiền toàn phần ghi nhận theo refundedAt.</p>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{ title: "Doanh thu gộp trong kỳ", value: money(report.grossRevenue) }, { title: "Hoàn tiền trong kỳ", value: money(report.refundAmount) }, { title: "Doanh thu sau hoàn tiền", value: money(report.netRevenue) }, { title: "Lượt thanh toán trong kỳ", value: String(report.paidCount) }, { title: "Tài khoản hiện tại", value: String(report.currentUsers) }, { title: "VIP còn hạn hiện tại", value: String(report.currentVip) }, { title: "Khóa học / bài học", value: `${report.courses} / ${report.lessons}` }, { title: "ARPU trong kỳ", value: money(report.arpu) }].map(card => <div key={card.title} className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">{card.title}</p><p className="mt-2 text-2xl font-bold">{card.value}</p></div>)}</div>
 <p className="text-xs text-slate-500">ARPU = doanh thu sau hoàn tiền trong kỳ / {report.usersAtEnd} tài khoản còn trong database, đăng ký trước khi kết thúc kỳ (bao gồm admin). Không phải doanh thu trên người trả tiền.</p>
 {(report.unknownPaid > 0 || report.unknownRefund > 0) && <p role="status" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">Dữ liệu cần đối soát: {report.unknownPaid} giao dịch thiếu paidAt, {report.unknownRefund} hoàn tiền thiếu refundedAt. Không tự gán ngày tạo thay ngày thanh toán/hoàn tiền.</p>}
 <section className="rounded-xl border bg-white p-4"><h2 className="font-bold">Trạng thái yêu cầu tạo trong kỳ</h2><div className="flex flex-wrap gap-4 mt-3">{report.statuses.map(row => <span key={row.status}>{row.status}: {row._count.id}</span>)}<span>Thử nghiệm đã loại khỏi doanh thu: {report.sandbox}</span></div></section>
 <section className="rounded-xl border bg-white p-4"><h2 className="font-bold">Sự kiện quyền VIP trong kỳ</h2><p className="text-xs text-slate-500">Tách cấp mới, gia hạn và thu hồi theo nguồn thanh toán/quản trị. Chỉ có sự kiện từ khi triển khai phiên bản này; không suy ngược lịch sử từ quyền hiện tại.</p><div className="flex flex-wrap gap-4 mt-3">{report.grants.length ? report.grants.map(row => <span key={`${row.source}:${row.kind}`}>{row.source} · {row.kind}: {row._count.id}</span>) : <span>Chưa có sự kiện trong kỳ.</span>}</div></section>
 <AdminReportChart days={report.daily}/>
 <section className="rounded-xl border bg-white p-4 overflow-auto"><h2 className="font-bold mb-3">Doanh thu theo ngày</h2><table className="w-full text-left text-sm"><thead><tr>{["Ngày (VN)", "Gộp", "Hoàn tiền", "Sau hoàn tiền", "Lượt trả tiền"].map(title => <th key={title} className="p-2">{title}</th>)}</tr></thead><tbody>{report.daily.map(row => <tr key={row.day}><td className="p-2">{row.day}</td><td>{money(row.gross)}</td><td>{money(row.refunds)}</td><td>{money(row.gross - row.refunds)}</td><td>{row.count}</td></tr>)}</tbody></table></section>
 <section className="rounded-xl border bg-white p-4 overflow-auto"><h2 className="font-bold mb-3">Nhóm tài khoản theo tháng đăng ký</h2><p className="text-xs mb-3 text-slate-500">12 tháng có tài khoản gần nhất trong dữ liệu còn giữ. Người trả tiền và doanh thu gộp được tính trong kỳ đang chọn; không phải tỷ lệ giữ chân.</p><table className="w-full text-left text-sm"><thead><tr>{["Tháng đăng ký", "Tài khoản", "Người trả tiền trong kỳ", "Doanh thu gộp trong kỳ"].map(title => <th key={title} className="p-2">{title}</th>)}</tr></thead><tbody>{report.cohorts.map(row => <tr key={row.month}><td className="p-2">{row.month}</td><td>{row.accounts}</td><td>{row.payers}</td><td>{money(row.gross)}</td></tr>)}</tbody></table></section>
 <div className="flex flex-wrap gap-4 text-blue-700">{[["/admin/users", "Người dùng"], ["/admin/lessons", "Bài học"], ["/admin/sepay", "Giao dịch"], ["/admin/usage", "Lịch sử sử dụng"], ["/admin/vip-plans", "Gói VIP"]].map(([href, label]) => <Link key={href} href={href}>{label} →</Link>)}</div></div>;
}
