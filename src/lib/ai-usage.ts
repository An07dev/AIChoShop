import { prisma } from "@/lib/prisma";

export const TOOL_NAMES: Record<string, string> = {
  "seo-optimizer": "AI Tối Ưu SEO",
  "script-writer": "AI Kịch Bản Video",
  "appeal-generator": "AI Kháng Nghị Vi Phạm",
  "ad-copy": "AI Mẫu Quảng Cáo Ads",
  "review-replier": "AI Xử Lý Đánh Giá",
  "chat-broadcast": "Chat Broadcast & Zalo",
  "title-spinner": "Nhân Bản Tiêu Đề",
  "video-repurposer": "AI Biến Video 5 Kênh",
  "koc-planner": "AI Kế Hoạch KOC",
  "pricing-calculator": "Tính Giá Bán",
  "tax-calculator": "Tính Thuế TMĐT",
};

/**
 * Lấy mốc 00:00:00 của ngày hôm nay theo múi giờ Việt Nam (GMT+7)
 */
export function getStartOfTodayVn(): Date {
  const now = new Date();
  const vnDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${vnDateStr}T00:00:00+07:00`);
}

/**
 * Định dạng thời gian thân thiện (tiếng Việt)
 */
export function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay === 1) return "Hôm qua";
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Tự động tạo tóm tắt hành động từ công cụ và thông số đầu vào
 */
export function summarizeAiAction(tool: string, inputs: any): string {
  switch (tool) {
    case "seo-optimizer":
      return inputs?.productName
        ? `Tối ưu SEO & Hashtag cho "${inputs.productName}"`
        : "Tối ưu SEO & Hashtag sản phẩm";

    case "script-writer":
      return inputs?.productName
        ? `Kịch bản video TikTok: "${inputs.productName}"`
        : "Tạo kịch bản video TikTok/Reels";

    case "appeal-generator":
      return inputs?.shopName
        ? `Đơn kháng nghị vi phạm: Shop ${inputs.shopName}`
        : "Tạo đơn kháng nghị vi phạm sàn TMĐT";

    case "ad-copy":
      return inputs?.productName
        ? `Mẫu quảng cáo Ads: "${inputs.productName}"`
        : "Tạo mẫu quảng cáo & Hook 3s đa kênh";

    case "review-replier":
      return inputs?.shopName
        ? `Phản hồi đánh giá ${inputs.rating || 5} sao: Shop ${inputs.shopName}`
        : `Phản hồi đánh giá ${inputs?.rating || 5} sao của khách`;

    case "chat-broadcast":
      return inputs?.shopName
        ? `Tin nhắn CSKH / Broadcast: Shop ${inputs.shopName}`
        : "Soạn kịch bản tin nhắn chăm sóc khách hàng";

    case "title-spinner":
      return inputs?.originalTitle
        ? `Xoay tiêu đề: "${inputs.originalTitle.slice(0, 45)}${inputs.originalTitle.length > 45 ? "..." : ""}"`
        : "Nhân bản tiêu đề chống spam";

    case "video-repurposer":
      return inputs?.videoTopic
        ? `Tái bản video 5 kênh: "${inputs.videoTopic.slice(0, 40)}${inputs.videoTopic.length > 40 ? "..." : ""}"`
        : "Tái bản video 5 kênh đa nền tảng";

    case "pricing-calculator":
      return inputs?.productName
        ? `Định giá sản phẩm "${inputs.productName}"`
        : "Định giá bán & tối ưu lợi nhuận";

    case "tax-calculator":
      return inputs?.title || (inputs?.payerType
        ? `Tính thuế TMĐT ${inputs.payerType === "company" ? "Doanh nghiệp" : inputs.payerType === "individual" ? "Cá nhân KD" : "Hộ kinh doanh"} (${inputs.taxYear || 2026})`
        : "Tính thuế TMĐT 2026");

    default:
      return `Sử dụng công cụ ${TOOL_NAMES[tool] || tool}`;
  }
}

/**
 * Lấy toàn bộ số liệu thống kê AI của người dùng
 */
export async function getAiUsageStats(userId: string, filterTool?: string) {
  try {
    const startOfToday = getStartOfTodayVn();

    const userPromise = prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isVIP: true },
    });

    let todayCount = 0;
    let totalGenerated = 0;
    let rawActivities: any[] = [];

    const fetchStatsViaSql = async () => {
      try {
        const [todayRes, totalRes, actRes]: [any, any, any] = await Promise.all([
          prisma.$queryRawUnsafe(
            'SELECT COUNT(*)::int as count FROM "AiUsageLog" WHERE "userId" = $1 AND "createdAt" >= $2',
            userId,
            startOfToday
          ),
          filterTool
            ? prisma.$queryRawUnsafe(
                'SELECT COUNT(*)::int as count FROM "AiUsageLog" WHERE "userId" = $1 AND "tool" = $2',
                userId,
                filterTool
              )
            : prisma.$queryRawUnsafe(
                'SELECT COUNT(*)::int as count FROM "AiUsageLog" WHERE "userId" = $1',
                userId
              ),
          filterTool
            ? prisma.$queryRawUnsafe(
                'SELECT id, tool, "toolName", action, input, output, "createdAt" FROM "AiUsageLog" WHERE "userId" = $1 AND "tool" = $2 ORDER BY "createdAt" DESC LIMIT 50',
                userId,
                filterTool
              )
            : prisma.$queryRawUnsafe(
                'SELECT id, tool, "toolName", action, input, output, "createdAt" FROM "AiUsageLog" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 10',
                userId
              ),
        ]);
        todayCount = Number(todayRes?.[0]?.count) || 0;
        totalGenerated = Number(totalRes?.[0]?.count) || 0;
        rawActivities = actRes || [];
      } catch (sqlErr) {
        console.warn("SQL fallback query error:", sqlErr);
      }
    };

    if (typeof (prisma as any).aiUsageLog?.count === "function") {
      try {
        const whereClause: any = { userId };
        if (filterTool) {
          whereClause.tool = filterTool;
        }

        [todayCount, totalGenerated, rawActivities] = await Promise.all([
          (prisma as any).aiUsageLog.count({
            where: {
              userId,
              createdAt: { gte: startOfToday },
            },
          }),
          (prisma as any).aiUsageLog.count({
            where: whereClause,
          }),
          (prisma as any).aiUsageLog.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: filterTool ? 50 : 10,
            select: {
              id: true,
              tool: true,
              toolName: true,
              action: true,
              input: true,
              output: true,
              createdAt: true,
            },
          }),
        ]);
      } catch (ormErr) {
        console.warn("ORM aiUsageLog query failed, using SQL fallback:", ormErr);
        await fetchStatsViaSql();
      }
    } else {
      await fetchStatsViaSql();
    }

    const user = await userPromise;

    let globalDefaultLimit = 12;
    try {
      const setting: any = await prisma.$queryRawUnsafe(
        'SELECT "defaultDailyFreeLimit" FROM "SystemSetting" WHERE id = \'default\' LIMIT 1;'
      );
      if (setting?.[0]?.defaultDailyFreeLimit !== undefined) {
        globalDefaultLimit = Number(setting[0].defaultDailyFreeLimit) || 12;
      }
    } catch {}

    let dailyLimit = globalDefaultLimit;
    try {
      const rawUser: any = await (prisma as any).$queryRawUnsafe(
        'SELECT "dailyFreeLimit" FROM "User" WHERE id = $1',
        userId
      );
      if (rawUser && rawUser[0] && rawUser[0].dailyFreeLimit !== undefined) {
        dailyLimit = Number(rawUser[0].dailyFreeLimit) ?? globalDefaultLimit;
      }
    } catch {
      dailyLimit = globalDefaultLimit;
    }

    const remainingFree = user?.isVIP ? null : Math.max(0, dailyLimit - todayCount);

    const recentActivities = rawActivities.map((act) => {
      let parsedInput = null;
      if (act.input) {
        try {
          parsedInput = typeof act.input === "string" ? JSON.parse(act.input) : act.input;
        } catch {
          parsedInput = act.input;
        }
      }
      return {
        id: act.id,
        tool: act.tool,
        toolName: act.toolName,
        action: act.action,
        input: parsedInput,
        output: act.output,
        time: formatRelativeTime(act.createdAt),
        createdAt: act.createdAt instanceof Date ? act.createdAt.toISOString() : new Date(act.createdAt).toISOString(),
      };
    });

    return {
      todayCount,
      totalGenerated,
      dailyFreeLimit: dailyLimit,
      remainingFree,
      isVIP: !!user?.isVIP,
      recentActivities,
    };
  } catch (error) {
    console.error("Error fetching AI usage stats:", error);
    let fallbackLimit = 12;
    try {
      const setting: any = await prisma.$queryRawUnsafe(
        'SELECT "defaultDailyFreeLimit" FROM "SystemSetting" WHERE id = \'default\' LIMIT 1;'
      );
      if (setting?.[0]?.defaultDailyFreeLimit !== undefined) {
        fallbackLimit = Number(setting[0].defaultDailyFreeLimit) || 12;
      }
    } catch {}
    return {
      todayCount: 0,
      totalGenerated: 0,
      dailyFreeLimit: fallbackLimit,
      remainingFree: fallbackLimit,
      isVIP: false,
      recentActivities: [],
    };
  }
}

/**
 * Lưu bản ghi sử dụng AI vào Database
 */
export async function recordAiUsage(params: {
  userId: string;
  tool: string;
  toolName?: string;
  action?: string;
  input?: any;
  output?: string;
}) {
  try {
    const toolName = params.toolName || TOOL_NAMES[params.tool] || params.tool;
    const action = params.action || summarizeAiAction(params.tool, params.input);
    const inputStr = typeof params.input === "string" ? params.input : JSON.stringify(params.input || {});

    const logId = "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

    if ((prisma as any).aiUsageLog?.create) {
      try {
        await (prisma as any).aiUsageLog.create({
          data: {
            id: logId,
            userId: params.userId,
            tool: params.tool,
            toolName,
            action,
            input: inputStr,
            output: params.output || null,
          },
        });
      } catch (ormErr) {
        await prisma.$executeRawUnsafe(
          'INSERT INTO "AiUsageLog" ("id", "userId", "tool", "toolName", "action", "input", "output", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
          logId,
          params.userId,
          params.tool,
          toolName,
          action,
          inputStr,
          params.output || null
        );
      }
    } else {
      await prisma.$executeRawUnsafe(
        'INSERT INTO "AiUsageLog" ("id", "userId", "tool", "toolName", "action", "input", "output", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
        logId,
        params.userId,
        params.tool,
        toolName,
        action,
        inputStr,
        params.output || null
      );
    }

    const startOfToday = getStartOfTodayVn();
    let todayCount = 1;
    let totalGenerated = 1;
    try {
      const [todayRes, totalRes]: [any, any] = await Promise.all([
        prisma.$queryRawUnsafe(
          'SELECT COUNT(*)::int as count FROM "AiUsageLog" WHERE "userId" = $1 AND "createdAt" >= $2',
          params.userId,
          startOfToday
        ),
        prisma.$queryRawUnsafe(
          'SELECT COUNT(*)::int as count FROM "AiUsageLog" WHERE "userId" = $1',
          params.userId
        ),
      ]);
      todayCount = Number(todayRes?.[0]?.count) || 1;
      totalGenerated = Number(totalRes?.[0]?.count) || 1;
    } catch {}

    return {
      success: true,
      logId,
      todayCount,
      totalGenerated,
    };
  } catch (error) {
    console.error("Error saving AI usage log:", error);
    return { success: false, error: "Failed to record AI usage" };
  }
}
