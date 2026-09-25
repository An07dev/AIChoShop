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
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL found");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const adminEmail = "admin@aichoshop.com";
    const adminPass = "Admin@2026!";

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { email: adminEmail },
    });

    if (existing) {
      console.log("Admin account already exists:", existing.email);
      // Ensure role is ADMIN
      if (existing.role !== "ADMIN" || existing.isLocked) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: "ADMIN", isLocked: false, isVIP: true },
        });
        console.log("Updated existing account to ADMIN role.");
      }
      // Also update password to known password
      const hashedPassword = await hashPassword(adminPass);
      await prisma.user.update({
        where: { id: existing.id },
        data: { password: hashedPassword },
      });
      console.log("Reset password for admin account successfully.");
    } else {
      const hashedPassword = await hashPassword(adminPass);
      const newAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: "Quản Trị Viên",
          role: "ADMIN",
          isVIP: true,
          dailyFreeLimit: 999999,
          isLocked: false,
        },
      });
      console.log("Created new ADMIN account:", newAdmin.email, "id:", newAdmin.id);
    }

    // Also check SystemSetting
    const setting = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });
    if (!setting) {
      await prisma.systemSetting.create({
        data: {
          id: "default",
          adminPassword: await hashPassword(adminPass),
        },
      });
      console.log("Initialized default SystemSetting.");
    }
  } catch (err) {
    console.error("Error creating admin:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
