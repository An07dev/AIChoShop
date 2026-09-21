export function changedAccountResponse(request: Request, userId: string | null, required = false): Response | null {
  const expected = request.headers.get("X-History-Owner") ?? new URL(request.url).searchParams.get("owner");
  if ((required && !expected) || (expected && expected !== (userId ?? "guest"))) return Response.json({ success: false, code: "ACCOUNT_CHANGED", error: "Tài khoản đã thay đổi. Hãy tải lại trang trước khi dùng lịch sử." }, { status: 409, headers: { "Cache-Control": "no-store", "X-Account-Changed": "true" } });
  return null;
}
