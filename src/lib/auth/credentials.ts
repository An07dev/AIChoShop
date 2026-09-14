import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

export async function replacePassword(userId: string, password: string, expectedPassword?: string) {
  if (typeof password !== "string" || password.length < 6 || password.length > 256) throw new Error("Mật khẩu phải có từ 6 đến 256 ký tự.");
  const next = await hashPassword(password);
  await prisma.$transaction(async tx => {
    const updated = await tx.user.updateMany({
      where: { id: userId, ...(expectedPassword !== undefined && { password: expectedPassword, isLocked: false }) },
      data: { password: next },
    });
    if (updated.count !== 1) throw new Error("Tài khoản đã thay đổi. Vui lòng thử lại.");
    await tx.seoSession.deleteMany({ where: { userId } });
  });
}
