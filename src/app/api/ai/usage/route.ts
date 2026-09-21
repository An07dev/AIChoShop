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

    const token = await getSessionUserId();

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    if (!isAllowedOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const body = await readLimitedJson(req, 32768) as Record<string, any>;
    const { tool, toolName, action, input, output } = body;

    if (!["pricing-calculator", "tax-calculator", "koc-planner", "koc-calculator"].includes(tool)) {
      return NextResponse.json(
        { error: "Missing required parameter: tool" },
        { status: 400 }
      );
    }

    const result = await recordAiUsage({
      userId: token,
      tool,
      toolName,
      action,
      input,
      output,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in POST /api/ai/usage:", error);
    return NextResponse.json(
      { error: error instanceof RequestBodyError ? error.message : "Dịch vụ đang gián đoạn" },
      { status: 500 }
    );
  }
}
