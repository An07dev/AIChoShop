import { prisma } from "./prisma";
import { usdToVnd, formatVnd, formatUsd, formatTokens } from "./ai-cost";
import { TOOL_NAMES } from "./ai-tools-config";

export interface ToolCostMetric {
  tool: string;
  toolName: string;
  generationCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  costVnd: number;
  avgCostPerGenVnd: number;
  avgTokensPerGen: number;
  shareOfCostPct: number;
}

export interface VipUserMetric {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  isVIP: boolean;
  vipExpiresAt: string | null;
  planName: string;
  revenueVnd: number;
  generationCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  costVnd: number;
  netProfitVnd: number;
  grossMarginPct: number;
  healthStatus: "SUPER_PROFITABLE" | "HEALTHY" | "LOW_MARGIN" | "DEFICIT" | "FREE_TIER";
}

export interface DailyEconomicsMetric {
  date: string; // YYYY-MM-DD
  label: string; // DD/MM
  revenueVnd: number;
  costUsd: number;
  costVnd: number;
  profitVnd: number;
  generations: number;
  tokens: number;
}

export interface ModelMetric {
  model: string;
  generationCount: number;
  totalTokens: number;
  costUsd: number;
  costVnd: number;
  sharePct: number;
}

export interface AiUnitEconomicsData {
  timeframe: "7d" | "30d" | "all";
  totalRevenueVnd: number;
  totalAiCostUsd: number;
  totalAiCostVnd: number;
  grossProfitVnd: number;
  grossMarginPct: number;
  marginStatus: "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL";
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalGenerations: number;
  avgCostPerGenVnd: number;
  avgTokensPerGen: number;
  vipUsersCount: number;
  avgCostPerVipUserVnd: number;
  avgRevenuePerVipUserVnd: number;
  toolBreakdown: ToolCostMetric[];
  vipBreakdown: VipUserMetric[];
  dailyTimeline: DailyEconomicsMetric[];
  modelBreakdown: ModelMetric[];
  generatedAt: string;
}

export async function getAiUnitEconomics(
  timeframe: "7d" | "30d" | "all" = "30d"
): Promise<AiUnitEconomicsData> {
  const now = new Date();
  let startDate: Date | null = null;

  if (timeframe === "7d") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
  } else if (timeframe === "30d") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
  }

  // Truy vấn tuần tự để đảm bảo an toàn với Connection Pool (max 5)
  const transactions = await prisma.transaction.findMany({
    where: {
      status: "SUCCESS",
      ...(startDate ? { createdAt: { gte: startDate } } : {}),
    },
    select: {
      id: true,
      userId: true,
      amount: true,
      planName: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  let logs: Array<{
    id: string;
    userId: string;
    tool: string;
    toolName: string;
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    costUsd: number | null;
    createdAt: Date;
  }> = [];

  if (startDate) {
    logs = await prisma.$queryRaw`
      SELECT 
        id,
        "userId",
        tool,
        "toolName",
        CASE 
          WHEN tool IN ('pricing-calculator', 'tax-calculator', 'koc-planner', 'koc-calculator') THEN 'Thuật toán (Calculator)'
          ELSE COALESCE(model, 'gpt-4o-mini')
        END as model,
        CASE 
          WHEN tool IN ('pricing-calculator', 'tax-calculator', 'koc-planner', 'koc-calculator') THEN 0
          ELSE COALESCE("promptTokens", 0)::int
        END as "promptTokens",
        CASE 
          WHEN tool IN ('pricing-calculator', 'tax-calculator', 'koc-planner', 'koc-calculator') THEN 0
          ELSE COALESCE("completionTokens", 0)::int
        END as "completionTokens",
        CASE 
          WHEN tool IN ('pricing-calculator', 'tax-calculator', 'koc-planner', 'koc-calculator') THEN 0
          ELSE COALESCE("totalTokens", 0)::int
        END as "totalTokens",
        CASE 
          WHEN tool IN ('pricing-calculator', 'tax-calculator', 'koc-planner', 'koc-calculator') THEN 0.0
          ELSE COALESCE("costUsd", 0)::float
        END as "costUsd",
        "createdAt"
      FROM "AiUsageLog"
      WHERE "createdAt" >= ${startDate}
      ORDER BY "createdAt" ASC
    `;
  } else {
    logs = await prisma.$queryRaw`
      SELECT 
        id,
        "userId",
        tool,
        "toolName",
        CASE 
          WHEN tool IN ('pricing-calculator', 'tax-calculator', 'koc-planner', 'koc-calculator') THEN 'Thuật toán (Calculator)'
          ELSE COALESCE(model, 'gpt-4o-mini')
        END as model,
        CASE 
          WHEN tool IN ('pricing-calculator', 'tax-calculator', 'koc-planner', 'koc-calculator') THEN 0
          ELSE COALESCE("promptTokens", 0)::int
        END as "promptTokens",
        CASE 
          WHEN tool IN ('pricing-calculator', 'tax-calculator', 'koc-planner', 'koc-calculator') THEN 0
          ELSE COALESCE("completionTokens", 0)::int
        END as "completionTokens",
        CASE 
          WHEN tool IN ('pricing-calculator', 'tax-calculator', 'koc-planner', 'koc-calculator') THEN 0
          ELSE COALESCE("totalTokens", 0)::int
        END as "totalTokens",
        CASE 
          WHEN tool IN ('pricing-calculator', 'tax-calculator', 'koc-planner', 'koc-calculator') THEN 0.0
          ELSE COALESCE("costUsd", 0)::float
        END as "costUsd",
        "createdAt"
      FROM "AiUsageLog"
      ORDER BY "createdAt" ASC
    `;
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isVIP: true,
      vipExpiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // 1. Tính tổng chi phí AI và tổng số Token
  let totalAiCostUsd = 0;
  let totalTokens = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  const totalGenerations = logs.length;

  for (const log of logs) {
    const cost = Number(log.costUsd) || 0;
    const pTokens = Number(log.promptTokens) || 0;
    const cTokens = Number(log.completionTokens) || 0;
    const tTokens = Number(log.totalTokens) || (pTokens + cTokens);

    totalAiCostUsd += cost;
    totalPromptTokens += pTokens;
    totalCompletionTokens += cTokens;
    totalTokens += tTokens;
  }

  totalAiCostUsd = Number(totalAiCostUsd.toFixed(6));
  const totalAiCostVnd = usdToVnd(totalAiCostUsd);

  // 2. Tính tổng doanh thu từ Transaction (VIP / Gói dịch vụ)
  const totalRevenueVnd = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const grossProfitVnd = totalRevenueVnd - totalAiCostVnd;
  const grossMarginPct =
    totalRevenueVnd > 0 ? Number(((grossProfitVnd / totalRevenueVnd) * 100).toFixed(1)) : 0;

  let marginStatus: "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL" = "GOOD";
  if (totalRevenueVnd > 0) {
    if (grossMarginPct >= 90) marginStatus = "EXCELLENT";
    else if (grossMarginPct >= 75) marginStatus = "GOOD";
    else if (grossMarginPct >= 50) marginStatus = "WARNING";
    else marginStatus = "CRITICAL";
  } else if (totalAiCostVnd > 0) {
    marginStatus = "CRITICAL";
  }

  const avgCostPerGenVnd = totalGenerations > 0 ? Math.round(totalAiCostVnd / totalGenerations) : 0;
  const avgTokensPerGen = totalGenerations > 0 ? Math.round(totalTokens / totalGenerations) : 0;

  const vipUsers = users.filter((u) => u.isVIP);
  const vipUsersCount = vipUsers.length;
  const avgCostPerVipUserVnd =
    vipUsersCount > 0 ? Math.round(totalAiCostVnd / vipUsersCount) : 0;
  const avgRevenuePerVipUserVnd =
    vipUsersCount > 0 ? Math.round(totalRevenueVnd / vipUsersCount) : 0;

  // 3. Phân tích chi phí theo Tool
  const toolMap = new Map<
    string,
    {
      tool: string;
      toolName: string;
      count: number;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      costUsd: number;
    }
  >();

  // Khởi tạo trước tất cả các công cụ của hệ thống để bảng luôn đầy đủ danh mục
  for (const [toolKey, toolName] of Object.entries(TOOL_NAMES)) {
    if (toolKey === "koc-calculator") continue; // Gộp vào koc-planner
    toolMap.set(toolKey, {
      tool: toolKey,
      toolName,
      count: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUsd: 0,
    });
  }

  for (const log of logs) {
    let key = log.tool || "other";
    if (key === "koc-calculator") key = "koc-planner";
    const friendlyName = TOOL_NAMES[key] || (log.toolName && log.toolName !== key ? log.toolName : key);
    const existing = toolMap.get(key) || {
      tool: key,
      toolName: friendlyName,
      count: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUsd: 0,
    };

    const p = Number(log.promptTokens) || 0;
    const c = Number(log.completionTokens) || 0;
    const t = Number(log.totalTokens) || (p + c);
    const cost = Number(log.costUsd) || 0;

    existing.count += 1;
    existing.promptTokens += p;
    existing.completionTokens += c;
    existing.totalTokens += t;
    existing.costUsd += cost;

    toolMap.set(key, existing);
  }

  const toolBreakdown: ToolCostMetric[] = Array.from(toolMap.values())
    .map((item) => {
      const costVnd = usdToVnd(item.costUsd);
      const shareOfCostPct =
        totalAiCostUsd > 0
          ? Number(((item.costUsd / totalAiCostUsd) * 100).toFixed(1))
          : 0;
      return {
        tool: item.tool,
        toolName: item.toolName,
        generationCount: item.count,
        promptTokens: item.promptTokens,
        completionTokens: item.completionTokens,
        totalTokens: item.totalTokens,
        costUsd: Number(item.costUsd.toFixed(6)),
        costVnd,
        avgCostPerGenVnd: item.count > 0 ? Math.round(costVnd / item.count) : 0,
        avgTokensPerGen: item.count > 0 ? Math.round(item.totalTokens / item.count) : 0,
        shareOfCostPct,
      };
    })
    .sort((a, b) => {
      if (b.costUsd !== a.costUsd) return b.costUsd - a.costUsd;
      if (b.generationCount !== a.generationCount) return b.generationCount - a.generationCount;
      return a.toolName.localeCompare(b.toolName);
    });

  // 4. Phân tích Unit Economics theo User (VIP + Active Users)
  const userTxMap = new Map<string, { totalAmount: number; planName: string }>();
  for (const tx of transactions) {
    const existing = userTxMap.get(tx.userId) || { totalAmount: 0, planName: "" };
    existing.totalAmount += tx.amount || 0;
    if (tx.planName) existing.planName = tx.planName;
    userTxMap.set(tx.userId, existing);
  }

  const userLogsMap = new Map<
    string,
    {
      count: number;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      costUsd: number;
    }
  >();

  for (const log of logs) {
    const existing = userLogsMap.get(log.userId) || {
      count: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUsd: 0,
    };

    const p = Number(log.promptTokens) || 0;
    const c = Number(log.completionTokens) || 0;
    const t = Number(log.totalTokens) || (p + c);
    const cost = Number(log.costUsd) || 0;

    existing.count += 1;
    existing.promptTokens += p;
    existing.completionTokens += c;
    existing.totalTokens += t;
    existing.costUsd += cost;

    userLogsMap.set(log.userId, existing);
  }

  // Danh sách user cần đánh giá: Tất cả VIP user, hoặc user có phát sinh chi phí hoặc doanh thu
  const userIdsToEvaluate = new Set<string>();
  for (const u of users) {
    if (u.isVIP) userIdsToEvaluate.add(u.id);
  }
  for (const userId of userTxMap.keys()) userIdsToEvaluate.add(userId);
  for (const userId of userLogsMap.keys()) userIdsToEvaluate.add(userId);

  const userMap = new Map(users.map((u) => [u.id, u]));

  const vipBreakdown: VipUserMetric[] = Array.from(userIdsToEvaluate)
    .map((userId) => {
      const user = userMap.get(userId);
      const txData = userTxMap.get(userId) || { totalAmount: 0, planName: "" };
      const logData = userLogsMap.get(userId) || {
        count: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0,
      };

      const revenueVnd = txData.totalAmount;
      const costUsd = Number(logData.costUsd.toFixed(6));
      const costVnd = usdToVnd(costUsd);
      const netProfitVnd = revenueVnd - costVnd;

      let grossMarginPct = 0;
      let healthStatus: VipUserMetric["healthStatus"] = "FREE_TIER";

      if (revenueVnd > 0) {
        grossMarginPct = Number(((netProfitVnd / revenueVnd) * 100).toFixed(1));
        if (grossMarginPct >= 90) healthStatus = "SUPER_PROFITABLE";
        else if (grossMarginPct >= 70) healthStatus = "HEALTHY";
        else if (grossMarginPct >= 40) healthStatus = "LOW_MARGIN";
        else healthStatus = "DEFICIT";
      } else {
        if (costVnd > 0) {
          grossMarginPct = -100;
          healthStatus = "FREE_TIER";
        } else {
          grossMarginPct = 0;
          healthStatus = "HEALTHY";
        }
      }

      const planName =
        txData.planName ||
        (user?.isVIP ? "Gói VIP Hệ Thống" : "Tài Khoản Miễn Phí");

      return {
        userId,
        name: user?.name || user?.email?.split("@")[0] || "Khách Hàng",
        email: user?.email || "Chưa cập nhật",
        phone: user?.phone || null,
        isVIP: !!user?.isVIP,
        vipExpiresAt: user?.vipExpiresAt ? user.vipExpiresAt.toISOString() : null,
        planName,
        revenueVnd,
        generationCount: logData.count,
        promptTokens: logData.promptTokens,
        completionTokens: logData.completionTokens,
        totalTokens: logData.totalTokens,
        costUsd,
        costVnd,
        netProfitVnd,
        grossMarginPct,
        healthStatus,
      };
    })
    // Sắp xếp ưu tiên: User VIP chi tiêu cao nhất, hoặc phát sinh chi phí lớn nhất
    .sort((a, b) => {
      if (b.revenueVnd !== a.revenueVnd) return b.revenueVnd - a.revenueVnd;
      return b.costVnd - a.costVnd;
    });

  // 5. Timeline theo ngày (14 hoặc 30 ngày)
  const daysCount = timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 14;
  const dailyMap = new Map<
    string,
    {
      revenue: number;
      costUsd: number;
      tokens: number;
      generations: number;
    }
  >();

  // Khởi tạo các ngày trong khoảng
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    dailyMap.set(key, { revenue: 0, costUsd: 0, tokens: 0, generations: 0 });
  }

  for (const tx of transactions) {
    const key = tx.createdAt.toISOString().split("T")[0];
    const existing = dailyMap.get(key);
    if (existing) {
      existing.revenue += tx.amount || 0;
    }
  }

  for (const log of logs) {
    const key = log.createdAt.toISOString().split("T")[0];
    const existing = dailyMap.get(key);
    if (existing) {
      existing.generations += 1;
      existing.costUsd += Number(log.costUsd) || 0;
      existing.tokens += Number(log.totalTokens) || 0;
    }
  }

  const dailyTimeline: DailyEconomicsMetric[] = Array.from(dailyMap.entries()).map(
    ([dateStr, val]) => {
      const [y, m, d] = dateStr.split("-");
      const costVnd = usdToVnd(val.costUsd);
      return {
        date: dateStr,
        label: `${d}/${m}`,
        revenueVnd: val.revenue,
        costUsd: Number(val.costUsd.toFixed(6)),
        costVnd,
        profitVnd: val.revenue - costVnd,
        generations: val.generations,
        tokens: val.tokens,
      };
    }
  );

  // 6. Phân tích theo OpenAI Model
  const modelMap = new Map<string, { count: number; tokens: number; costUsd: number }>();
  for (const log of logs) {
    const model = log.model || "gpt-4o-mini";
    const existing = modelMap.get(model) || { count: 0, tokens: 0, costUsd: 0 };
    existing.count += 1;
    existing.tokens += Number(log.totalTokens) || 0;
    existing.costUsd += Number(log.costUsd) || 0;
    modelMap.set(model, existing);
  }

  const modelBreakdown: ModelMetric[] = Array.from(modelMap.entries())
    .map(([model, data]) => {
      const costVnd = usdToVnd(data.costUsd);
      const sharePct =
        totalAiCostUsd > 0
          ? Number(((data.costUsd / totalAiCostUsd) * 100).toFixed(1))
          : 0;
      return {
        model,
        generationCount: data.count,
        totalTokens: data.tokens,
        costUsd: Number(data.costUsd.toFixed(6)),
        costVnd,
        sharePct,
      };
    })
    .sort((a, b) => b.costUsd - a.costUsd);

  return {
    timeframe,
    totalRevenueVnd,
    totalAiCostUsd,
    totalAiCostVnd,
    grossProfitVnd,
    grossMarginPct,
    marginStatus,
    totalTokens,
    totalPromptTokens,
    totalCompletionTokens,
    totalGenerations,
    avgCostPerGenVnd,
    avgTokensPerGen,
    vipUsersCount,
    avgCostPerVipUserVnd,
    avgRevenuePerVipUserVnd,
    toolBreakdown,
    vipBreakdown,
    dailyTimeline,
    modelBreakdown,
    generatedAt: now.toISOString(),
  };
}
