import { historyCutoff, redactText, sanitizeHistoryOutput } from "./privacy/policy";
import { expireHistoryContent } from "./privacy/service";
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
    prisma.aiUsageLog.findMany({ where: { ...where, createdAt: { gte: historyCutoff() } }, orderBy: { createdAt: "desc" }, take: filterTool ? 50 : 10 }),
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
  const log = await prisma.$transaction(async tx => {
    await expireHistoryContent(tx);
    return tx.aiUsageLog.create({ data: {
    userId: params.userId, tool: params.tool,
    toolName: TOOL_NAMES[params.tool] || params.tool,
    action: redactText(summarizeAiAction(params.tool, params.input)).slice(0, 300),
    input: sanitizeAiInput(params.input), output: sanitizeHistoryOutput(params.output),
    } });
  });
  const [todayCount, totalGenerated] = await Promise.all([
    prisma.aiUsageLog.count({ where: { userId: params.userId, tool: { in: AI_TOOLS }, createdAt: { gte: vnDayStart() } } }),
    prisma.aiUsageLog.count({ where: { userId: params.userId } }),
  ]);
  return { success: true, logId: log.id, todayCount, totalGenerated };
}
