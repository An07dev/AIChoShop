import { historyCutoff, redactText, sanitizeHistoryOutput } from "./privacy/policy";
import { ERASED_ACTION, expireHistoryContent } from "./privacy/service";
import { sanitizeHistoryValue } from "./privacy/policy";
import { vnDayStart } from "./ai-quota";
import {
  AI_TOOLS,
  TOOL_NAMES,
  summarizeAiAction,
  sanitizeAiInput,
} from "./ai-tools-config";
import { isVipActive } from "@/lib/vip-expiration";
import { prisma } from "@/lib/prisma";

export { AI_TOOLS, TOOL_NAMES, summarizeAiAction, sanitizeAiInput };

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
 * Lấy toàn bộ số liệu thống kê AI của người dùng
 */
export async function getAiUsageStats(userId: string, filterTool?: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { isVIP: true, vipExpiresAt: true, dailyFreeLimit: true } });
  const where = {
    userId,
    ...(filterTool
      ? filterTool === "koc-planner"
        ? { tool: { in: ["koc-planner", "koc-calculator"] } }
        : { tool: filterTool }
      : {}),
  };
  const [todayCount, totalGenerated, activities] = await Promise.all([
    prisma.aiUsageLog.count({ where: { userId, tool: { in: AI_TOOLS }, createdAt: { gte: vnDayStart() } } }),
    prisma.aiUsageLog.count({ where }),
    prisma.aiUsageLog.findMany({ where: { ...where, action: { not: ERASED_ACTION }, createdAt: { gte: historyCutoff() } }, orderBy: { createdAt: "desc" }, take: filterTool ? 50 : 10 }),
  ]);
  return { todayCount, totalGenerated, dailyFreeLimit: user.dailyFreeLimit,
    remainingFree: isVipActive(user) ? null : Math.max(0, user.dailyFreeLimit - todayCount), isVIP: isVipActive(user),
    recentActivities: activities.map(act => ({ ...act, action: redactText(act.action), output: sanitizeHistoryOutput(act.output), input: (() => { try { return act.input ? sanitizeHistoryValue(JSON.parse(act.input)) : null; } catch { return null; } })(), time: formatRelativeTime(act.createdAt), createdAt: act.createdAt.toISOString() })) };
}

/**
 * Lưu bản ghi sử dụng AI vào Database
 */
export async function recordAiUsage(params: {
  userId: string; tool: string; input?: unknown; output?: string;
}) {
  try {
    const toolName = params.toolName || TOOL_NAMES[params.tool] || params.tool;
    const action = params.action || summarizeAiAction(params.tool, params.input);
    const inputStr = sanitizeAiInput(params.input);

    const logId = "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

    const isCalculator = ["pricing-calculator", "tax-calculator", "koc-planner", "koc-calculator"].includes(params.tool);
    const model = isCalculator ? "Thuật toán (Calculator)" : "gpt-4o-mini";

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
            model,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            costUsd: 0,
          },
        });
      } catch (ormErr) {
        await prisma.$executeRawUnsafe(
          'INSERT INTO "AiUsageLog" ("id", "userId", "tool", "toolName", "action", "input", "output", "model", "promptTokens", "completionTokens", "totalTokens", "costUsd", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, 0, NOW())',
          logId,
          params.userId,
          params.tool,
          toolName,
          action,
          inputStr,
          params.output || null,
          model
        );
      }
    } else {
      await prisma.$executeRawUnsafe(
        'INSERT INTO "AiUsageLog" ("id", "userId", "tool", "toolName", "action", "input", "output", "model", "promptTokens", "completionTokens", "totalTokens", "costUsd", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, 0, NOW())',
        logId,
        params.userId,
        params.tool,
        toolName,
        action,
        inputStr,
        params.output || null,
        model
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
