
import { requireAdmin } from "@/lib/auth/session";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSePayConfig } from "@/lib/sepay-server";
import { SePayConfigManager } from "@/components/admin/SePayConfigManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cổng SePay & Webhook Nạp VIP",
  description: "Quản lý cổng thanh toán tự động SePay, cấu hình số tài khoản ngân hàng và webhook nâng cấp VIP.",
};

export default async function AdminSePayPage() {
  await requireAdmin();
  const config = await getSePayConfig();

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isVIP: true,
        },
      },
    },
  });

  const serializedTransactions = transactions.map((t) => ({
    id: t.id,
    amount: t.amount,
    status: t.status,
    type: t.type,
    sepayId: t.sepayId,
    paymentCode: t.paymentCode,
    createdAt: t.createdAt.toISOString(),
    user: t.user || {
      id: t.userId || "",
      email: "Chưa định danh",
      name: "Khách chuyển khoản",
      phone: null,
      isVIP: false,
    },
  }));

  const reviews = prisma.paymentWebhookEvent
    ? await prisma.paymentWebhookEvent.findMany({ where: { status: "REVIEW" }, orderBy: { receivedAt: "desc" }, take: 50 })
    : [];

  return (
    <div className="space-y-6"><SePayConfigManager
      initialConfig={{
        id: config.id,
        bankName: config.bankName,
        accountNumber: config.accountNumber,
        accountHolder: config.accountHolder,
        configured: Boolean(config.apiKey),
        syntaxPrefix: config.syntaxPrefix,
        autoActivate: config.autoActivate,
      }}
      recentTransactions={serializedTransactions}
    />
    </div>
  );
}
