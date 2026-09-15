import type { Prisma } from "@prisma/client";

export async function guardAdminAccountChange(tx: Prisma.TransactionClient, actorId: string, targetId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(71420932)`;
  const actor = await tx.user.findUnique({ where: { id: actorId } });
  if (!actor || actor.role !== "ADMIN" || actor.isLocked) throw new Error("Phiên quản trị không còn hợp lệ.");
  if (actorId === targetId) throw new Error("Không thể tự khóa hoặc xóa tài khoản quản trị đang đăng nhập.");
  const target = await tx.user.findUnique({ where: { id: targetId } });
  if (!target) throw new Error("Tài khoản không tồn tại.");
  if (target.role === "ADMIN" && !target.isLocked && await tx.user.count({ where: { role: "ADMIN", isLocked: false } }) <= 1) {
    throw new Error("Không thể vô hiệu hóa quản trị viên cuối cùng.");
  }
}
