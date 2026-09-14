"use server";

import { isVipActive } from "@/lib/vip-expiration";

import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function getUserPlan() {

  const token = await getSessionUserId();
  if (!token) return { isLogged: false, isVIP: false };

  const user = await prisma.user.findUnique({
    where: { id: token },
    select: { isVIP: true, vipExpiresAt: true, isLocked: true }
  });

  if (!user || user.isLocked) return { isLogged: false, isVIP: false, isLocked: !!user?.isLocked };

  return { isLogged: true, isVIP: isVipActive(user), isLocked: false };
}
