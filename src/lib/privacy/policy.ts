export const HISTORY_DAYS = 90;
export const HISTORY_LIMIT = 50;
export const HISTORY_MAX_BYTES = 512 * 1024;
export function historyCutoff(now = new Date()) { return new Date(now.getTime() - HISTORY_DAYS * 86400000); }
const sensitiveKey = /password|token|secret|api.?key|authorization|email|phone|mobile|address|customer.?name|full.?name|recipient|bank.?account|account.?number/i;
export function redactText(text: string): string {
  return text.replace(/data:[^\s"']*;base64,[a-z0-9+/=]+/gi, "[ảnh đã lược bỏ]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email đã ẩn]")
    .replace(/(?:\+84|0084|0)(?:[ .-]?\d){9,10}\b/g, "[điện thoại đã ẩn]");
}
export function sanitizeHistoryValue(value: unknown, depth = 0): unknown {
  if (depth > 12) return "[dữ liệu quá sâu]";
  if (typeof value === "string") {
    if (/^(?:data:.*;base64,|[a-z0-9+/]{300,}={0,2}$)/i.test(value)) return "[ảnh/dữ liệu nhị phân đã lược bỏ]";
    return redactText(value).slice(0, 16000);
  }
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.slice(0, 100).map(item => sanitizeHistoryValue(item, depth + 1));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).slice(0, 100).map(([key, item]) => [key, sensitiveKey.test(key) ? "[đã ẩn]" : sanitizeHistoryValue(item, depth + 1)]));
  return null;
}
export function serializeHistoryInput(input: unknown): string | null {
  if (input === undefined || input === null) return null;
  const clean = sanitizeHistoryValue(input);
  const json = JSON.stringify(clean);
  // Keep valid JSON. Never truncate JSON in the middle of a snapshot.
  return json.length <= 24000 ? json : JSON.stringify({ omitted: true, reason: "Nội dung vượt giới hạn lưu lịch sử" });
}
export function sanitizeHistoryOutput(output?: string | null): string | null {
  if (!output) return null;
  try { return JSON.stringify(sanitizeHistoryValue(JSON.parse(output))); }
  catch { return redactText(output).slice(0, 24000); }
}
