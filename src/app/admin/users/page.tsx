import { prisma } from "@/lib/prisma";
import { UsersManager } from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVIP: true,
        isLocked: true,
        createdAt: true,
        userCredit: {
          select: { balance: true },
        },
      },
    });

    const serializedUsers = users.map((u) => ({
      ...u,
      createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
    }));

    return <UsersManager initialUsers={serializedUsers} />;
  } catch (error: any) {
    console.error("ADMIN USERS ERROR:", error);
    return (
      <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-200">
        <h2 className="text-xl font-bold mb-2">Error loading users:</h2>
        <pre className="text-sm whitespace-pre-wrap">{error?.stack || error?.message || String(error)}</pre>
      </div>
    );
  }
}

