export type DataFailure = { code: string; message: string; status: number };
function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value = error as { code?: unknown; cause?: unknown; meta?: { code?: unknown } };
  if (value.code === "P2010" && typeof value.meta?.code === "string") return value.meta.code;
  return typeof value.code === "string" ? value.code : errorCode(value.cause);
}
export function classifyDatabaseError(error: unknown): DataFailure | null {
  const code = errorCode(error);
  const known: Record<string, DataFailure> = {
    DATABASE_UNAVAILABLE: { code: "DATABASE_UNAVAILABLE", message: "Không kết nối được database. Vui lòng thử lại sau.", status: 503 },
    DATABASE_SCHEMA_MISMATCH: { code: "DATABASE_SCHEMA_MISMATCH", message: "Cấu trúc database chưa khớp phiên bản ứng dụng. Vui lòng liên hệ quản trị viên.", status: 503 },
    DATA_CONFLICT: { code: "DATA_CONFLICT", message: "Dữ liệu không hợp lệ hoặc đã thay đổi. Hãy tải lại và kiểm tra thông tin.", status: 409 },
    DATA_BUSY: { code: "DATA_BUSY", message: "Dữ liệu đang được cập nhật. Vui lòng thử lại.", status: 409 },
  };
  if (code && known[code]) return known[code];
  if (error instanceof Error && error.name === "PrismaClientValidationError") return known.DATABASE_SCHEMA_MISMATCH;
  if (["P1000", "P1001", "P1002", "P1008", "P1010", "P1011", "P1017", "P2024", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "08006", "08001", "53300", "57P01", "42501"].includes(code ?? ""))
    return { code: "DATABASE_UNAVAILABLE", message: "Không kết nối được database. Vui lòng thử lại sau.", status: 503 };
  if (error instanceof Error && /tenant\/user|Can't reach database|ENOTFOUND|getaddrinfo|connection.*refused|connect ETIMEDOUT/i.test(error.message))
    return { code: "DATABASE_UNAVAILABLE", message: "Không kết nối được database. Vui lòng thử lại sau.", status: 503 };
  if (["P2021", "P2022", "42P01", "42703"].includes(code ?? ""))
    return { code: "DATABASE_SCHEMA_MISMATCH", message: "Cấu trúc database chưa khớp phiên bản ứng dụng. Vui lòng liên hệ quản trị viên.", status: 503 };
  if (["P2002", "P2003", "P2004", "P2025", "23505", "23503", "23514", "23P01"].includes(code ?? ""))
    return { code: "DATA_CONFLICT", message: "Dữ liệu không hợp lệ hoặc đã thay đổi. Hãy tải lại và kiểm tra thông tin.", status: 409 };
  if (["P2034", "40001", "40P01", "55P03"].includes(code ?? ""))
    return { code: "DATA_BUSY", message: "Dữ liệu đang được cập nhật. Vui lòng thử lại.", status: 409 };
  return null;
}
export function safeOperationMessage(error: unknown, fallback: string): string {
  const failure = classifyDatabaseError(error); if (failure) return failure.message;
  if (error instanceof Error && !errorCode(error) && error.message.length < 200 && !/\n|postgres(?:ql)?:|https?:|SELECT |INSERT |UPDATE |DELETE |prisma\.|api.?key|password|token|ENOENT/i.test(error.message)) return error.message;
  return fallback;
}
// Never log query arguments, provider messages, stack traces or credentials.
export function dataFailure(error: unknown, operation: string): DataFailure {
  const failure = classifyDatabaseError(error) ?? { code: "INTERNAL_ERROR", message: "Không thể xử lý yêu cầu. Vui lòng thử lại.", status: 500 };
  console.error("operation_failed", { operation, code: failure.code });
  return failure;
}
export function dataErrorResponse(error: unknown, operation: string): Response {
  const failure = dataFailure(error, operation);
  return Response.json({ success: false, code: failure.code, error: failure.message }, { status: failure.status, headers: { "Cache-Control": "no-store" } });
}
export async function readDatabase<T>(operation: string, work: () => Promise<T>): Promise<T> {
  try { return await work(); }
  catch (error) { const failure = dataFailure(error, operation); throw Object.assign(new Error(failure.message), { code: failure.code }); }
}
