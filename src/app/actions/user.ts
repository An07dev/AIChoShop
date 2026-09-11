"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getUserPlan() {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;
  if (!token) return { isLogged: false, isVIP: false };

  const user = await prisma.user.findUnique({
    where: { id: token },
    select: { isVIP: true }
  });

  if (!user) return { isLogged: false, isVIP: false };

  return { isLogged: true, isVIP: user.isVIP };
}
