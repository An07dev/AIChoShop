import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getSePayConfig } from "@/lib/sepay-server";
import { SePayConfigManager } from "@/components/admin/SePayConfigManager";
import { TransactionsManager } from "@/components/admin/TransactionsManager";
import { AdminListControls } from "@/components/admin/AdminListControls";
import { listQuery, pageWindow, dateRange, type SearchValues } from "@/lib/admin/list-query";
import type { Prisma } from "@prisma/client";
export const dynamic = "force-dynamic";
export const metadata = { title: "Cổng thanh toán và giao dịch" };
export default async function AdminSePayPage({ searchParams }: {
    searchParams: Promise<SearchValues>;
}) {
    await requireAdmin();
    const values = await searchParams, q = listQuery(values), range = dateRange(q.value("from"), q.value("to"));
    const status = q.choice("status", ["all", "PENDING", "SUCCESS", "FAILED", "REVIEW", "EXPIRED", "CANCELLED", "REFUNDED"], "all"), environment = q.choice("environment", ["all", "live", "sandbox"], "all"), sort = q.choice("sort", ["newest", "oldest", "paid"], "newest");
    const where: Prisma.TransactionWhereInput = { ...(range.error ? { id: "" } : {}), ...(status !== "all" && { status }), ...(environment !== "all" && { isSandbox: environment === "sandbox" }), ...(range.bounds && { createdAt: range.bounds }), ...(q.q && { OR: [{ id: { contains: q.q } }, { paymentCode: { contains: q.q, mode: "insensitive" } }, { user: { email: { contains: q.q, mode: "insensitive" } } }, { user: { name: { contains: q.q, mode: "insensitive" } } }] }) };
    const window = pageWindow(await prisma.transaction.count({ where }), q.page, q.size);
    const [config, transactions] = await Promise.all([getSePayConfig(), prisma.transaction.findMany({ where, skip: window.skip, take: window.size, orderBy: sort === "paid" ? [{ paidAt: { sort: "desc", nulls: "last" } }, { id: "asc" }] : [{ createdAt: sort === "oldest" ? "asc" : "desc" }, { id: "asc" }], select: { id: true, amount: true, currency: true, status: true, paymentCode: true, planName: true, isSandbox: true, paidAt: true, createdAt: true, user: { select: { email: true, name: true } } } })]);
    return <div className="space-y-6"><SePayConfigManager initialConfig={{ id: config.id, bankName: config.bankName, accountNumber: config.accountNumber, accountHolder: config.accountHolder, configured: !!config.apiKey, syntaxPrefix: config.syntaxPrefix, autoActivate: config.autoActivate }}/>
 <AdminListControls path="/admin/sepay" values={values} window={window} error={range.error} dateLabel="Ngày tạo (VN)" filters={[
            { name: "status", label: "Trạng thái", options: ["all", "PENDING", "SUCCESS", "FAILED", "REVIEW", "EXPIRED", "CANCELLED", "REFUNDED"].map(value => ({ value, label: value === "all" ? "Tất cả" : value })) },
            { name: "environment", label: "Môi trường", options: [{ value: "all", label: "Tất cả" }, { value: "live", label: "Thật" }, { value: "sandbox", label: "Thử nghiệm" }] },
            { name: "sort", label: "Sắp xếp", options: [{ value: "newest", label: "Tạo mới nhất" }, { value: "oldest", label: "Tạo cũ nhất" }, { value: "paid", label: "Thanh toán mới nhất" }] }
        ]}/><TransactionsManager transactions={transactions.map(row => ({ ...row, createdAt: row.createdAt.toISOString(), paidAt: row.paidAt?.toISOString() ?? null }))}/></div>;
}
