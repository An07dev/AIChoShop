import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResolvedAiConfig, getCircuitStatus } from "@/lib/ai-fallback";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const checks: {
    database: { status: "healthy" | "unhealthy"; latencyMs?: number; error?: string };
    ai: {
      openai: { configured: boolean; model: string; active: boolean; circuit: "CLOSED" | "OPEN" | "HALF_OPEN" };
      ollama: { status: "online" | "offline"; url: string; models?: string[]; latencyMs?: number; error?: string; circuit: "CLOSED" | "OPEN" | "HALF_OPEN" };
    };
    memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number };
  } = {
    database: { status: "unhealthy" },
    ai: {
      openai: { configured: false, model: "", active: false, circuit: getCircuitStatus("openai") },
      ollama: { status: "offline", url: "", circuit: getCircuitStatus("ollama") },
    },
    memory: {
      rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
    },
  };

  // 1. Kiểm tra Database
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "healthy",
      latencyMs: Date.now() - dbStart,
    };
  } catch (dbErr: unknown) {
    checks.database = {
      status: "unhealthy",
      error: dbErr instanceof Error ? dbErr.message : "Database connection failed",
    };
  }

  // 2. Kiểm tra Cấu hình AI (OpenAI & Ollama)
  try {
    const { config, isOpenAiActive } = await getResolvedAiConfig();
    checks.ai.openai = {
      configured: Boolean(config.openaiApiKey && !["dummy", "123123"].includes(config.openaiApiKey)),
      model: config.openaiModel,
      active: isOpenAiActive,
      circuit: getCircuitStatus("openai"),
    };
    checks.ai.ollama.url = config.ollamaBaseUrl;

    // Ping nhẹ Ollama với timeout 1.5s
    const ollamaPingStart = Date.now();
    try {
      const ollamaBase = config.ollamaBaseUrl.replace(/\/v1\/?$/, "");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const ollamaRes = await fetch(`${ollamaBase}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        const models = Array.isArray(data.models) ? data.models.map((m: { name?: string }) => m.name || "").filter(Boolean) : [];
        checks.ai.ollama = {
          status: "online",
          url: config.ollamaBaseUrl,
          models,
          latencyMs: Date.now() - ollamaPingStart,
          circuit: getCircuitStatus("ollama"),
        };
      } else {
        checks.ai.ollama = {
          status: "offline",
          url: config.ollamaBaseUrl,
          error: `HTTP ${ollamaRes.status}`,
          circuit: getCircuitStatus("ollama"),
        };
      }
    } catch {
      checks.ai.ollama = {
        status: "offline",
        url: config.ollamaBaseUrl,
        error: "Ollama Local chưa được khởi chạy tại 127.0.0.1:11434",
        circuit: getCircuitStatus("ollama"),
      };
    }
  } catch (err: unknown) {
    console.error("[Health Check AI Error]:", err);
  }

  const isHealthy = checks.database.status === "healthy";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      totalLatencyMs: Date.now() - started,
      checks,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
