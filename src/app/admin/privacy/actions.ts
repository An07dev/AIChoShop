"use server";
import { requireAdmin } from "@/lib/auth/session";
import { cleanupPrivateContent } from "@/lib/privacy/service";
import { dataFailure } from "@/lib/db-errors";
export async function runPrivacyMaintenance() {
  const admin = await requireAdmin("privacy-maintenance");
  try {
    const result = await cleanupPrivateContent(new Date(), admin.id);
    return { success: true as const, result };
  } catch (error) { const failure = dataFailure(error, "privacy-maintenance"); return { success: false as const, error: failure.message }; }
}
