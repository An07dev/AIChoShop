import { NextResponse } from "next/server";
import { handleSeo } from "@/lib/seo/handler";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ success: false, error: "Yêu cầu phải là JSON." }, { status: 415 });
  }
  // Bound streamed bodies too; Content-Length alone is not reliable.
  const reader = req.body?.getReader();
  if (!reader) return NextResponse.json({ success: false, error: "Thiếu dữ liệu." }, { status: 400 });
  let size = 0;
  let text = "";
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 32_000) {
      await reader.cancel();
      return NextResponse.json({ success: false, error: "Dữ liệu quá dài." }, { status: 413 });
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  let body;
  try { body = JSON.parse(text); }
  catch { return NextResponse.json({ success: false, error: "JSON không hợp lệ." }, { status: 400 }); }
  return handleSeo(req, body);
}
