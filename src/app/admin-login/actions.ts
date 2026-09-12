"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminPassword } from "@/lib/system-settings";

export async function loginAdmin(formData: FormData) {
  const password = (formData.get("password") as string)?.trim() || "";
  
  const isValid = await verifyAdminPassword(password);
  if (isValid) {
    const cookieStore = await cookies();
    cookieStore.set("admin_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    
    redirect("/admin");
  } else {
    return { error: "Mật khẩu quản trị không chính xác!" };
  }
}
