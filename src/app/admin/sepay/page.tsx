import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getSePayConfig } from "@/lib/sepay-server";
import { SePayConfigManager } from "@/components/admin/SePayConfigManager";
import {
  TransactionsManager,
  TransactionStatsCards,
  type TransactionStats,
} from "@/components/admin/TransactionsManager";
import { AdminListControls } from "@/components/admin/AdminListControls";
import { listQuery, pageWindow, dateRange, type SearchValues } from "@/lib/admin/list-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CreditCard } from "lucide-react";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cổng SePay & Lịch Sử Giao Dịch - AIChoShop Admin" };

export default async function AdminSePayPage({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  await requireAdmin();
  const values = await searchParams;
  const q = listQuery(values);
  const range = dateRange(q.value("from"), q.value("to"));

  const status = q.choice(
    "status",
    ["all", "PENDING", "SUCCESS", "FAILED", "REVIEW", "EXPIRED", "CANCELLED", "REFUNDED"],
    "all"
  );
  const environment = q.choice("environment", ["all", "live", "sandbox"], "all");
  const sort = q.choice("sort", ["newest", "oldest", "paid"], "newest");

  const where: Prisma.TransactionWhereInput = {
    ...(range.error ? { id: "" } : {}),
    ...(status !== "all" && { status }),
    ...(environment !== "all" && { isSandbox: environment === "sandbox" }),
    ...(range.bounds && { createdAt: range.bounds }),
    ...(q.q && {
      OR: [
        { id: { contains: q.q } },
        { paymentCode: { contains: q.q, mode: "insensitive" } },
        { user: { email: { contains: q.q, mode: "insensitive" } } },
        { user: { name: { contains: q.q, mode: "insensitive" } } },
      ],
    }),
  };

  const filteredCount = await prisma.transaction.count({ where });
  const window = pageWindow(filteredCount, q.page, q.size);

  const [config, transactions, totalAllCount, successAggregate, pendingReviewCount] =
    await Promise.all([
      getSePayConfig(),
      prisma.transaction.findMany({
        where,
        skip: window.skip,
        take: window.size,
        orderBy:
          sort === "paid"
            ? [{ paidAt: { sort: "desc", nulls: "last" } }, { id: "asc" }]
            : [{ createdAt: sort === "oldest" ? "asc" : "desc" }, { id: "asc" }],
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          paymentCode: true,
          planName: true,
          isSandbox: true,
          paidAt: true,
          createdAt: true,
          refundedAt: true,
          user: { select: { email: true, name: true } },
        },
      }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        where: { status: "SUCCESS", isSandbox: false },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.transaction.count({
        where: { status: { in: ["PENDING", "REVIEW"] }, isSandbox: false },
      }),
    ]);

  const stats: TransactionStats = {
    totalRevenue: successAggregate._sum.amount ?? 0,
    successCount: successAggregate._count._all ?? 0,
    pendingCount: pendingReviewCount,
    totalCount: totalAllCount,
  };

  const listControls = (
    <AdminListControls
      path="/admin/sepay"
      values={values}
      window={window}
      error={range.error}
      dateLabel="Ngày tạo (VN)"
      embedded={true}
      filters={[
        {
          name: "status",
          label: "Trạng thái",
          options: [
            { value: "all", label: "Tất cả trạng thái" },
            { value: "SUCCESS", label: "Thành công (SUCCESS)" },
            { value: "REVIEW", label: "Cần đối soát (REVIEW)" },
            { value: "PENDING", label: "Chờ thanh toán (PENDING)" },
            { value: "REFUNDED", label: "Đã hoàn tiền (REFUNDED)" },
            { value: "CANCELLED", label: "Đã hủy (CANCELLED)" },
            { value: "FAILED", label: "Thất bại (FAILED)" },
            { value: "EXPIRED", label: "Hết hạn (EXPIRED)" },
          ],
        },
        {
          name: "environment",
          label: "Môi trường",
          options: [
            { value: "all", label: "Tất cả môi trường" },
            { value: "live", label: "Giao dịch Thật (Live)" },
            { value: "sandbox", label: "Thử nghiệm (Sandbox)" },
          ],
        },
        {
          name: "sort",
          label: "Sắp xếp theo",
          options: [
            { value: "newest", label: "Tạo mới nhất" },
            { value: "oldest", label: "Tạo cũ nhất" },
            { value: "paid", label: "Thanh toán gần nhất" },
          ],
        },
      ]}
    />
  );

  return (
    <div className="space-y-6 w-full lg:w-[70%] mx-auto pb-12">
      {/* ── TIÊU ĐỀ TRANG CỔNG SEPAY & WEBHOOK ── */}
      <AdminPageHeader
        title="Cổng Thanh Toán SePay & Lịch Sử Nạp VIP"
        subtitle="Cấu hình tài khoản ngân hàng nhận tiền, kiểm tra Webhook nạp VIP tự động và tra cứu giao dịch chuyển khoản."
        icon={CreditCard}
        iconGradient="from-blue-600 to-cyan-600"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            Tự Động 24/7
          </span>
        }
      />

      {/* ── 1. KHỐI THỐNG KÊ DOANH THU & KPI GIAO DỊCH Ở ĐẦU TRANG ── */}
      <TransactionStatsCards stats={stats} />

      {/* ── 2. CẤU HÌNH TÀI KHOẢN NHẬN TIỀN & THỬ NGHIỆM WEBHOOK ── */}
      <SePayConfigManager
        initialConfig={{
          id: config.id,
          bankName: config.bankName,
          accountNumber: config.accountNumber,
          accountHolder: config.accountHolder,
          configured: !!config.apiKey,
          syntaxPrefix: config.syntaxPrefix,
          autoActivate: config.autoActivate,
        }}
        showHeader={false}
      />

      {/* ── 3. QUẢN LÝ LỊCH SỬ GIAO DỊCH & BỘ LỌC ── */}
      <TransactionsManager
        transactions={transactions.map((row) => ({
          ...row,
          createdAt: row.createdAt.toISOString(),
          paidAt: row.paidAt?.toISOString() ?? null,
          refundedAt: row.refundedAt?.toISOString() ?? null,
        }))}
        stats={stats}
        listControls={listControls}
      />
    </div>
  );
}
