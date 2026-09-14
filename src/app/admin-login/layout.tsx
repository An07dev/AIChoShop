import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng Nhập Quản Trị Viên | AIChoShop Admin",
  description: "Trang đăng nhập bảo mật dành riêng cho Quản trị viên hệ thống AIChoShop.",
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
