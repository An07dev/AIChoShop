import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSePayConfig } from "@/lib/sepay-server";
import { SePayConfigManager } from "@/components/admin/SePayConfigManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cấu hình SePay & Webhook Nạp VIP | AIChoShop Admin",
  description: "Quản lý cổng thanh toán tự động SePay, cấu hình số tài khoản ngân hàng và webhook nâng cấp VIP.",
};

export default async function AdminSePayPage() {
  const config = await getSePayConfig();

  const transactions = await prisma.transaction.findMany({
    where: {
      type: "UPGRADE_VIP",
    },
    orderBy: { createdAt: "desc" },
    take: 20,
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
    createdAt: t.createdAt.toISOString(),
    user: t.user,
  }));

  return (
    <SePayConfigManager
      initialConfig={{
        id: config.id,
        bankName: config.bankName,
        accountNumber: config.accountNumber,
        accountHolder: config.accountHolder,
        apiKey: config.apiKey,
        syntaxPrefix: config.syntaxPrefix,
        autoActivate: config.autoActivate,
      }}
      recentTransactions={serializedTransactions}
    />
  );
}
