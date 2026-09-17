import { prisma } from "@/lib/prisma";
import { dateRange, vnDate } from "./list-query";
export function reportPeriod(from: string, to: string, now = new Date()) {
    const today = new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10);
    const startDefault = new Date(vnDate(today)!.getTime() - 29 * 86400000 + 7 * 3600000).toISOString().slice(0, 10);
    const range = dateRange(from || startDefault, to || today);
    if (range.error || !range.bounds?.gte || !range.bounds.lt)
        throw Error(range.error || "Khoảng báo cáo không hợp lệ.");
    if (range.bounds.lt.getTime() - range.bounds.gte.getTime() > 366 * 86400000)
        throw Error("Mỗi báo cáo tối đa 366 ngày.");
    return { start: range.bounds.gte, end: range.bounds.lt, from: from || startDefault, to: to || today };
}
export async function getAdminReport(start: Date, end: Date, now = new Date()) {
    const eligible = { isSandbox: false, currency: "VND", type: "UPGRADE_VIP", status: { in: ["SUCCESS", "REFUNDED"] } };
    const [gross, refunds, paidCount, usersAtEnd, currentUsers, currentVip, lessons, courses, unknownPaid, unknownRefund, sandbox, statuses, grants, daily, cohorts] = await Promise.all([
        prisma.transaction.aggregate({ where: { ...eligible, paidAt: { gte: start, lt: end } }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { isSandbox: false, currency: "VND", type: "UPGRADE_VIP", status: "REFUNDED", refundedAt: { gte: start, lt: end } }, _sum: { amount: true } }),
        prisma.transaction.count({ where: { ...eligible, paidAt: { gte: start, lt: end } } }),
        prisma.user.count({ where: { createdAt: { lt: end } } }), prisma.user.count(),
        prisma.user.count({ where: { isVIP: true, OR: [{ vipExpiresAt: null }, { vipExpiresAt: { gt: now } }] } }), prisma.lesson.count(), prisma.course.count(),
        prisma.transaction.count({ where: { ...eligible, paidAt: null } }),
        prisma.transaction.count({ where: { isSandbox: false, status: "REFUNDED", refundedAt: null } }),
        prisma.transaction.count({ where: { isSandbox: true, createdAt: { gte: start, lt: end } } }),
        prisma.transaction.groupBy({ by: ["status"], where: { isSandbox: false, createdAt: { gte: start, lt: end } }, _count: { id: true } }),
        prisma.vipGrantEvent.groupBy({ by: ["source", "kind"], where: { isSandbox: false, occurredAt: { gte: start, lt: end } }, _count: { id: true } }),
        prisma.$queryRaw<{
            day: string;
            gross: number;
            refunds: number;
            count: number;
        }[]> `WITH days AS (SELECT generate_series(${start}::timestamp,(${end}::timestamp-interval '1 day'),interval '1 day') AS d),p AS (SELECT to_char("paidAt"+interval '7 hours','YYYY-MM-DD') AS day,SUM(amount)::float8 AS gross,COUNT(*)::int AS count FROM "Transaction" WHERE NOT "isSandbox" AND currency='VND' AND type='UPGRADE_VIP' AND status IN ('SUCCESS','REFUNDED') AND "paidAt">=${start} AND "paidAt"<${end} GROUP BY 1),r AS (SELECT to_char("refundedAt"+interval '7 hours','YYYY-MM-DD') AS day,SUM(amount)::float8 AS refunds FROM "Transaction" WHERE NOT "isSandbox" AND currency='VND' AND type='UPGRADE_VIP' AND status='REFUNDED' AND "refundedAt">=${start} AND "refundedAt"<${end} GROUP BY 1) SELECT to_char(d+interval '7 hours','YYYY-MM-DD') AS day,COALESCE(p.gross,0)::float8 AS gross,COALESCE(r.refunds,0)::float8 AS refunds,COALESCE(p.count,0)::int AS count FROM days LEFT JOIN p ON p.day=to_char(d+interval '7 hours','YYYY-MM-DD') LEFT JOIN r ON r.day=to_char(d+interval '7 hours','YYYY-MM-DD') ORDER BY d`,
        prisma.$queryRaw<{
            month: string;
            accounts: number;
            payers: number;
            gross: number;
        }[]> `SELECT to_char(u."createdAt"+interval '7 hours','YYYY-MM') AS month,COUNT(DISTINCT u.id)::int AS accounts,COUNT(DISTINCT CASE WHEN t.id IS NOT NULL THEN u.id END)::int AS payers,COALESCE(SUM(t.amount),0)::float8 AS gross FROM "User" u LEFT JOIN "Transaction" t ON t."userId"=u.id AND NOT t."isSandbox" AND t.currency='VND' AND t.type='UPGRADE_VIP' AND t.status IN ('SUCCESS','REFUNDED') AND t."paidAt">=${start} AND t."paidAt"<${end} WHERE u."createdAt"<${end} GROUP BY 1 ORDER BY 1 DESC LIMIT 12`
    ]);
    const grossRevenue = gross._sum.amount ?? 0, refundAmount = refunds._sum.amount ?? 0;
    return { grossRevenue, refundAmount, netRevenue: grossRevenue - refundAmount, paidCount, usersAtEnd, currentUsers, currentVip, lessons, courses, unknownPaid, unknownRefund, sandbox, statuses, grants, daily, cohorts, arpu: usersAtEnd ? (grossRevenue - refundAmount) / usersAtEnd : 0 };
}
