"use server";

import { redirect } from "next/navigation";
import { loginUser } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth/session";
import { deleteSeoSession } from "@/lib/seo/session";
import { securityEvent } from "@/lib/auth/audit-operations";

export async function loginAdmin(formData: FormData) {
  const result = await loginUser(formData);
  if (!result.success) return { error: result.error };
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") {
    await securityEvent(user?.id || "anonymous", "ADMIN_ACCESS_DENIED", "loginAdmin");
    await deleteSeoSession();
    return { error: "Tài khoản không có quyền quản trị." };
  }
  redirect("/admin");
}
