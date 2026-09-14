import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAiUsageStats, recordAiUsage } from "@/lib/ai-usage";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/usage
 * Lấy số liệu: Lượt dùng hôm nay, Tổng nội dung đã tạo, Hoạt động gần đây của User hiện tại
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) {
      return NextResponse.json({
        isLogged: false,
        isVIP: false,
        todayCount: 0,
        totalGenerated: 0,
        recentActivities: [],
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: token },
      select: { id: true, isVIP: true, isLocked: true },
    });

    if (!user || user.isLocked) {
      return NextResponse.json({
        isLogged: false,
        isVIP: false,
        todayCount: 0,
        totalGenerated: 0,
        recentActivities: [],
      });
    }

    const stats = await getAiUsageStats(user.id);

    return NextResponse.json({
      isLogged: true,
      ...stats,
    });
  } catch (error: any) {
    console.error("Error in GET /api/ai/usage:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/usage
 * Ghi nhận một lần sử dụng công cụ AI (dành cho client hoặc công cụ phụ trợ)
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { tool, toolName, action, input, output } = body;

    if (!tool) {
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
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}
