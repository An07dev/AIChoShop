import { createHash, timingSafeEqual } from "node:crypto";
import { getSePayConfig } from "@/lib/sepay-server";
import { parseBankEvent } from "@/lib/payments/policy";
import { processBankEvent } from "@/lib/payments/service";
import { readLimitedJson, RequestBodyError } from "@/lib/http/body";

export const dynamic = "force-dynamic";

export async function GET() { return Response.json({ status: "ok" }); }

export async function POST(request: Request) {
  try {
    const config = await getSePayConfig();
    const expected = config.apiKey?.trim();
    if (!expected) return Response.json({ success: false, error: "PAYMENT_NOT_CONFIGURED" }, { status: 503 });
    const authorization = request.headers.get("authorization") || "";
    const supplied = authorization.match(/^(?:Apikey|Bearer)\s+(.+)$/i)?.[1]?.trim() || request.headers.get("x-api-key")?.trim() || "";
    const digest = (value: string) => createHash("sha256").update(value).digest();
    if (!supplied || !timingSafeEqual(digest(supplied), digest(expected))) return Response.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    const body = await readLimitedJson(request, 32768);
    let event;
    try { event = parseBankEvent(body); }
    catch { return Response.json({ success: false, error: "INVALID_BANK_EVENT" }, { status: 400 }); }
    const result = await processBankEvent(event, config.autoActivate);
    // Acknowledge only after the event is durably applied, ignored or queued for review.
    return Response.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ success: false, error: error.message }, { status: error.status });
    if (error instanceof Error && error.message === "EVENT_ID_CONFLICT") return Response.json({ success: false, error: "EVENT_ID_CONFLICT" }, { status: 409 });
    console.error("SePay event processing failed; provider should retry.");
    return Response.json({ success: false, error: "PAYMENT_PROCESSING_FAILED" }, { status: 503 });
  }
}
