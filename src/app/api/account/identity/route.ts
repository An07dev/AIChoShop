import { getSessionUser } from "@/lib/auth/session";
import { dataErrorResponse } from "@/lib/db-errors";
export async function GET() {
  try { return Response.json({ userId: (await getSessionUser())?.id ?? null }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return dataErrorResponse(error, "account-identity"); }
}
