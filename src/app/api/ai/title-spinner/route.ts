import { NextResponse } from "next/server";
import { handleSpinner } from "@/lib/spinner/handler";
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ success: false, error: "Yêu cầu phải là JSON." }, { status: 415 });
  const reader = req.body?.getReader();
  if (!reader) return NextResponse.json({ success: false, error: "Thiếu dữ liệu." }, { status: 400 });
  let size = 0;
  let text = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 128_000) { await reader.cancel(); return NextResponse.json({ success: false, error: "Dữ liệu quá dài." }, { status: 413 }); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const body: unknown = JSON.parse(text);
    return handleSpinner(req, body);
  } catch { return NextResponse.json({ success: false, error: "Không đọc được dữ liệu JSON." }, { status: 400 }); }
}
