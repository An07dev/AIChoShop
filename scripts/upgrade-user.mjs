import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomBytes, scrypt } from "node:crypto";
import dotenv from "dotenv";

dotenv.config();

const derive = (password, salt) =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await derive(password, salt);
  return `scrypt-v1$${salt}$${derived.toString("hex")}`;
}

async function main() {
  const targetEmail = "levananbg03@gmail.com";
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("No DATABASE_URL found");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: targetEmail, mode: "insensitive" } },
    });

    if (existing) {
      console.log("Tìm thấy tài khoản hiện tại:", existing.email, "ID:", existing.id);
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: "ADMIN",
          isVIP: true,
          dailyFreeLimit: 999999,
          isLocked: false,
          vipExpiresAt: new Date("2099-12-31T23:59:59.000Z"),
        },
      });

      await prisma.adminAuditLog.create({
        data: {
          actorId: existing.id,
          action: "VIP_CHANGED",
          targetId: existing.id,
          details: JSON.stringify({ isVIP: true, role: "ADMIN", reason: "Nâng cấp Super Admin toàn quyền" }),
        },
      });

      console.log("SUCCESS_UPGRADED:", {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        isVIP: updated.isVIP,
        vipExpiresAt: updated.vipExpiresAt,
        dailyFreeLimit: updated.dailyFreeLimit,
        isLocked: updated.isLocked,
      });
    } else {
      console.log("Tài khoản chưa tồn tại. Đang tạo mới tài khoản ADMIN...");
      const defaultPass = "Admin@2026!";
      const hashedPassword = await hashPassword(defaultPass);
      const created = await prisma.user.create({
        data: {
          email: targetEmail,
          password: hashedPassword,
          name: "Lê Văn An (Super Admin)",
          role: "ADMIN",
          isVIP: true,
          dailyFreeLimit: 999999,
          isLocked: false,
          vipExpiresAt: new Date("2099-12-31T23:59:59.000Z"),
        },
      });

      console.log("SUCCESS_CREATED:", {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
        isVIP: created.isVIP,
        defaultPassword: defaultPass,
      });
    }
  } catch (err) {
    console.error("Lỗi khi xử lý:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
