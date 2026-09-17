import { getSessionUser } from "@/lib/auth/session";
import { dataErrorResponse, dataFailure } from "@/lib/db-errors";
import { eraseOwnHistory, exportOwnData } from "@/lib/privacy/service";
import { isAllowedOrigin } from "@/lib/http/origin";
import { readLimitedJson } from "@/lib/http/body";
import { RequestBodyError } from "@/lib/http/body";
import { changedAccountResponse } from "@/lib/history/owner";
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    const changed = changedAccountResponse(request, user?.id ?? null); if (changed) return changed;
    if (!user) return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    const iterator = exportOwnData(user.id);
    const first = await iterator.next(); // Catch initial DB error before download headers.
    const encoder = new TextEncoder(); let started = false;
    const stream = new ReadableStream({
      async pull(controller) {
        if (request.signal.aborted) { await iterator.return(undefined); controller.close(); return; }
        try {
          const item = started ? await iterator.next() : first; started = true;
          if (item.done) { controller.close(); return; }
          controller.enqueue(encoder.encode(JSON.stringify(item.value) + "\n"));
        } catch (error) { dataFailure(error, "export-personal-data-stream"); controller.error(new Error("Xuất dữ liệu bị gián đoạn. Hãy tải lại.")); }
      },
      async cancel() { await iterator.return(undefined); },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Content-Disposition": 'attachment; filename="aichoshop-personal-data.ndjson"', "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return dataErrorResponse(error, "export-personal-data"); }
}
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    const changed = changedAccountResponse(request, user?.id ?? null, true); if (changed) return changed;
    if (!user) return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    if (!isAllowedOrigin(request)) return Response.json({ error: "Nguồn yêu cầu không hợp lệ." }, { status: 403 });
    const body: unknown = await readLimitedJson(request, 1024);
    if (!body || typeof body !== "object" || !("confirmation" in body) || body.confirmation !== "XOA LICH SU") return Response.json({ error: "Nhập XOA LICH SU để xác nhận." }, { status: 400 });
    return Response.json({ success: true, count: await eraseOwnHistory(user.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: "Nội dung xác nhận không hợp lệ." }, { status: error.status });
    return dataErrorResponse(error, "erase-personal-history");
  }
}
