import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AIChoShop - Nền tảng AI cho Nhà Bán Hàng",
  description: "Ứng dụng AI từ A-Z cho nhà bán hàng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} font-sans antialiased h-full`}>
      <body className="min-h-full flex flex-col text-slate-900 bg-white">
        {children}
      </body>
    </html>
  );
}
