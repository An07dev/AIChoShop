import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { SettingsManager } from "@/components/settings/SettingsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cài Đặt Hệ Thống - AIChoShop",
  description: "Tùy chỉnh giao diện sáng/tối, màu sắc chủ đạo và quản lý mật khẩu tài khoản người dùng tại AIChoShop.",
};

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: token },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVIP: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <SettingsManager user={user} />
    </div>
  );
}
