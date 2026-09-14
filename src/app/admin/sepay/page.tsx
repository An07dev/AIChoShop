
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

  const reviews = await prisma.paymentWebhookEvent.findMany({ where: { status: "REVIEW" }, orderBy: { receivedAt: "desc" }, take: 50 });

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
    <section className="rounded-2xl border bg-white p-5 space-y-3">
      <h2 className="font-bold">Giao dịch ngân hàng cần đối soát</h2>
      <p className="text-sm text-slate-500">Tối đa 50 thông báo gần nhất. Các khoản không khớp chưa được cấp VIP; không yêu cầu khách chuyển lại trước khi đối soát.</p>
      {reviews.length === 0 ? <p className="text-sm">Không có giao dịch cần đối soát.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Mã ngân hàng</th><th>Số tiền</th><th>Nội dung</th><th>Lý do</th></tr></thead><tbody>{reviews.map(event => <tr key={event.id} className="border-t"><td className="p-2 font-mono">{event.id}</td><td>{event.amount.toLocaleString("vi-VN")} đ</td><td className="max-w-xs break-words p-2">{event.content}</td><td>{event.reason}</td></tr>)}</tbody></table></div>}
    </section></div>
  );
}
