import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { readLimitedJson, RequestBodyError } from "@/lib/http/body";
import { getAiUsageStats, recordAiUsage } from "@/lib/ai-usage";
import { isAllowedOrigin } from "@/lib/http/origin";
import { dataErrorResponse } from "@/lib/db-errors";
import { changedAccountResponse } from "@/lib/history/owner";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const changed = changedAccountResponse(req, user?.id ?? null); if (changed) return changed;
    if (!user) return NextResponse.json({ isLogged: false, isVIP: false, todayCount: 0, totalGenerated: 0, recentActivities: [] }, { headers });
    const tool = req.nextUrl.searchParams.get("tool") || undefined;
    if (tool && !/^[a-z-]{1,50}$/.test(tool)) return NextResponse.json({ error: "Công cụ không hợp lệ." }, { status: 400, headers });
    return NextResponse.json({ isLogged: true, ...(await getAiUsageStats(user.id, tool)) }, { headers });
  } catch (error) { return dataErrorResponse(error, "get-ai-history"); }
}
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const changed = changedAccountResponse(req, user?.id ?? null, true); if (changed) return changed;
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401, headers });
    if (!isAllowedOrigin(req)) return NextResponse.json({ error: "Nguồn yêu cầu không hợp lệ." }, { status: 403, headers });
    const body: unknown = await readLimitedJson(req, 32768);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new RequestBodyError("INVALID_INPUT");
    const value = body as Record<string, unknown>;
    if (typeof value.tool !== "string" || !["pricing-calculator", "tax-calculator", "koc-planner"].includes(value.tool) || (value.output !== undefined && typeof value.output !== "string")) throw new RequestBodyError("INVALID_INPUT");
    return NextResponse.json(await recordAiUsage({ userId: user.id, tool: value.tool === "koc-planner" ? "koc-calculator" : value.tool, input: value.input, output: value.output as string | undefined }), { headers });
  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ success: false, error: error.message }, { status: error.status, headers });
    return dataErrorResponse(error, "save-calculation-history");
  }
}
