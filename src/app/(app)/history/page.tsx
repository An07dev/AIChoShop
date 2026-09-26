import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import HistoryClient, { type HistoryRecord } from "./HistoryClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kho Lưu Trữ & Quản Lý Nội Dung AI | AIChoShop",
  description: "Tra cứu lại toàn bộ tiêu đề SEO, kịch bản video, thư cảm ơn và đơn kháng nghị đã tạo bằng AI.",
};

export default async function HistoryPage() {
  const token = await getSessionUserId();

  if (!token) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: token },
    select: { id: true, name: true, email: true, isVIP: true, isLocked: true },
  });

  if (!user || user.isLocked) {
    redirect("/login");
  }

  const logs = await prisma.aiUsageLog.findMany({
    where: {
      userId: user.id,
      output: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tool: true,
      toolName: true,
      action: true,
      input: true,
      output: true,
      createdAt: true,
    },
    take: 300,
  });

  const serializedLogs: HistoryRecord[] = logs.map((log) => ({
    id: log.id,
    tool: log.tool,
    toolName: log.toolName,
    action: log.action,
    input: log.input,
    output: log.output,
    createdAt: log.createdAt.toISOString(),
  }));

  return <HistoryClient initialLogs={serializedLogs} user={user} />;
}
