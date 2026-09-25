import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeScript } from "@/components/ThemeScript";

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
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} font-sans antialiased h-full`}>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
