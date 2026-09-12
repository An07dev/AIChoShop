import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var p = window.location.pathname;
                var isExempt = p === '/' || p.indexOf('/admin') === 0;
                if (!isExempt) {
                  var m = localStorage.getItem('aicho_theme_mode');
                  var c = localStorage.getItem('aicho_theme_color');
                  if (m === 'dark' || (!m && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  if (c) {
                    document.documentElement.setAttribute('data-theme-color', c);
                  } else {
                    document.documentElement.setAttribute('data-theme-color', 'blue');
                  }
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme-color', 'blue');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
