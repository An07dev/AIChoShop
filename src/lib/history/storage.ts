import { HISTORY_LIMIT, HISTORY_MAX_BYTES, historyCutoff, sanitizeHistoryValue } from "../privacy/policy";
export const HISTORY_KEYS = ["aichoshop_pricing_calculations_v1", "aicho_tax_calculator_history", "aichoshop_koc_plans_v2"] as const;
export const ACTIVE_OWNER_KEY = "aichoshop_active_history_owner";
export type HistoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function historyKey(owner: string, tool: string) { return `aichoshop:history:v2:${encodeURIComponent(owner)}:${tool}`; }
function validateItems(value: unknown, now = new Date()): unknown[] {
  if (!Array.isArray(value)) throw Error("Lịch sử không đúng định dạng.");
  const cutoff = historyCutoff(now).getTime();
  return value.filter(item => {
    if (!item || typeof item !== "object") return false;
    const row = item as { id?: unknown; createdAt?: unknown; input?: unknown };
    const time = typeof row.createdAt === "string" ? Date.parse(row.createdAt) : NaN;
    return typeof row.id === "string" && row.id.length <= 200 && !!row.input && typeof row.input === "object" && Number.isFinite(time) && time >= cutoff && time <= now.getTime() + 60000;
  }).slice(0, HISTORY_LIMIT);
}
// The old shared keys are never read/imported into an account: their owner is unknown.
export function accountStorage(raw: HistoryStorage, owner: string, active: () => boolean, notify: (message: string) => void): HistoryStorage {
  function key(tool: string) {
    if (!HISTORY_KEYS.includes(tool as typeof HISTORY_KEYS[number])) throw Error("Công cụ lưu trữ không hợp lệ.");
    if (!active()) throw Error("Tài khoản đã thay đổi. Hãy tải lại trang trước khi lưu lịch sử.");
    return historyKey(owner, tool);
  }
  return {
    getItem(tool) {
      try {
        const text = raw.getItem(key(tool));
        if (!text) return "[]";
        if (new TextEncoder().encode(text).byteLength > HISTORY_MAX_BYTES) throw Error("Lịch sử vượt giới hạn dung lượng.");
        const envelope = JSON.parse(text);
        if (envelope.version !== 2 || envelope.owner !== owner || !Array.isArray(envelope.items)) throw Error("Không đọc được phiên bản lịch sử. Dữ liệu cũ chưa được chuyển vào tài khoản này.");
        const items = validateItems(envelope.items).map(item => sanitizeHistoryValue(item));
        if (JSON.stringify(items) !== JSON.stringify(envelope.items)) {
          try { raw.setItem(key(tool), JSON.stringify({ version: 2, owner, items })); }
          catch { notify("Lịch sử quá hạn đã được ẩn nhưng trình duyệt không cho phép dọn dữ liệu trên thiết bị."); }
        }
        return JSON.stringify(items);
      } catch (error) { notify(error instanceof Error ? error.message : "Không đọc được lịch sử trình duyệt."); return "[]"; }
    },
    setItem(tool, text) {
      try {
        const physical = key(tool);
        const items = validateItems(JSON.parse(text)).map(item => sanitizeHistoryValue(item));
        const envelope = JSON.stringify({ version: 2, owner, items });
        if (new TextEncoder().encode(envelope).byteLength > HISTORY_MAX_BYTES) throw Error("Lịch sử vượt 512 KiB. Hãy xuất và xóa bớt các mục cũ.");
        raw.setItem(physical, envelope);
      } catch (error) { const message = error instanceof Error && error.name !== "QuotaExceededError" ? error.message : "Trình duyệt không còn dung lượng lưu lịch sử. Hãy xuất hoặc xóa bớt dữ liệu."; notify(message); throw Error(message); }
    },
    removeItem(tool) { raw.removeItem(key(tool)); },
  };
}
