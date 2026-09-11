import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get user from cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;
  let currentUser = null;
  if (token) {
    currentUser = await prisma.user.findUnique({
      where: { id: token },
      select: { id: true, name: true, email: true, isVIP: true }
    });
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      <Sidebar user={currentUser} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={currentUser} />
        <main className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
