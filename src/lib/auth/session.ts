import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashToken, SEO_SESSION_COOKIE } from "@/lib/seo/session";
import { securityEvent } from "./audit-operations";
import { isAllowedOrigin } from "@/lib/http/origin";
import { readDatabase, dataErrorResponse } from "@/lib/db-errors";

export async function getSessionUser() {
  const token = (await cookies()).get(SEO_SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  try {
    const session = await prisma.seoSession.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        expiresAt: true,
        user: { select: { id: true, role: true, isLocked: true } },
      },
    });
    if (!session || session.expiresAt <= new Date() || session.user.isLocked) return null;
    return session.user;
  } catch {
    // Khi database tạm ngưng kết nối, xem như người dùng chưa đăng nhập (khách)
    return null;
  }
}

export async function getSessionUserId() {
  try {
    return (await getSessionUser())?.id;
  } catch {
    return undefined;
  }
}

export async function requireAdmin(operation = "admin") {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    await securityEvent(user?.id || "anonymous", "ADMIN_ACCESS_DENIED", operation);
    throw new Error("Không có quyền quản trị.");
  }
  return user;
}

// Route handlers return a stable denial before reading request bodies or touching data.
export async function adminRouteGuard(request?: Request) {
  try {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    await securityEvent(user?.id || "anonymous", "ADMIN_ACCESS_DENIED", request ? `${request.method} ${new URL(request.url).pathname}` : "admin-api");
    return Response.json({ success: false, error: "Không có quyền quản trị." }, { status: 403 });
  }
  if (request && !["GET", "HEAD"].includes(request.method)) {
    if (!isAllowedOrigin(request)) {
      await securityEvent(user.id, "ADMIN_ORIGIN_DENIED", `${request.method} ${new URL(request.url).pathname}`);
      return Response.json({ success: false, error: "Nguồn yêu cầu không hợp lệ." }, { status: 403 });
    }
  }
  return null;
  } catch (error) { return dataErrorResponse(error, "admin-route-guard"); }
}
