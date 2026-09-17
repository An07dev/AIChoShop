import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AdminListControls } from "@/components/admin/AdminListControls";
import { listQuery, pageWindow, dateRange, type SearchValues } from "@/lib/admin/list-query";
import { TOOL_NAMES } from "@/lib/ai-tools-config";
import { redactText } from "@/lib/privacy/policy";
import type { Prisma } from "@prisma/client";
export const dynamic = "force-dynamic";
export const metadata = { title: "Lịch sử sử dụng công cụ" };
export default async function AdminUsage({ searchParams }: {
    searchParams: Promise<SearchValues>;
}) {
    await requireAdmin();
    const values = await searchParams, q = listQuery(values), range = dateRange(q.value("from"), q.value("to")), tool = q.value("tool"), sort = q.choice("sort", ["newest", "oldest"], "newest");
    const where: Prisma.AiUsageLogWhereInput = { ...(range.error ? { id: "" } : {}), ...(tool && { tool }), ...(range.bounds && { createdAt: range.bounds }), ...(q.q && { OR: [{ userId: q.q }, { user: { email: { contains: q.q, mode: "insensitive" } } }, { user: { name: { contains: q.q, mode: "insensitive" } } }] }) };
    const window = pageWindow(await prisma.aiUsageLog.count({ where }), q.page, q.size);
    const rows = await prisma.aiUsageLog.findMany({ where, skip: window.skip, take: window.size, orderBy: [{ createdAt: sort === "oldest" ? "asc" : "desc" }, { id: "asc" }], select: { id: true, tool: true, toolName: true, action: true, createdAt: true, user: { select: { id: true, name: true, email: true } } } });
    return <div className="space-y-4"><h1 className="text-2xl font-bold">Lịch sử sử dụng công cụ</h1><p className="text-sm text-slate-500">Nhật ký lượt sử dụng phục vụ đối soát quota; giữ cả lượt đã xóa nội dung. Không tải input/output vào danh sách quản trị.</p><AdminListControls path="/admin/usage" values={values} window={window} error={range.error} dateLabel="Ngày sử dụng (VN)" filters={[{ name: "tool", label: "Công cụ", options: [{ value: "", label: "Tất cả" }, ...Object.entries({ ...TOOL_NAMES, "koc-calculator": "Tính kế hoạch KOC" }).map(([value, label]) => ({ value, label }))] }, { name: "sort", label: "Sắp xếp", options: [{ value: "newest", label: "Mới nhất" }, { value: "oldest", label: "Cũ nhất" }] }]}/><div className="rounded-xl border bg-white p-4 overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Thời gian (VN)</th><th>Người dùng</th><th>Công cụ</th><th>Hoạt động</th></tr></thead><tbody>{rows.length ? rows.map(row => <tr key={row.id}><td className="p-3 border-t">{row.createdAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td><td className="border-t">{row.user.name || row.user.email}<div className="text-xs text-slate-500">{row.user.email}</div></td><td className="border-t">{row.toolName}</td><td className="border-t">{redactText(row.action)}</td></tr>) : <tr><td colSpan={4} className="p-6 text-center">Không có lượt sử dụng phù hợp.</td></tr>}</tbody></table></div></div>;
}
