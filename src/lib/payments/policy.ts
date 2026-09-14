export type BankEvent = {
  id: string;
  amount: number;
  accountNumber: string;
  content: string;
  transferType: "in" | "out";
};

export type IntentSnapshot = {
  paymentCode: string | null;
  planId: string | null;
  planName: string | null;
  amount: number;
  durationDays: number | null;
  currency: string;
  accountNumber: string | null;
  expiresAt: Date | null;
  status: string;
};

export function normalizeAccount(value: string) { return value.replace(/\s/g, "").toUpperCase(); }

export function parseBankEvent(body: unknown): BankEvent {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("INVALID_PAYLOAD");
  const value = body as Record<string, unknown>;
  const id = typeof value.id === "number" && Number.isSafeInteger(value.id) && value.id >= 0 ? String(value.id) : value.id;
  if (typeof id !== "string" || !/^\d{1,30}$/.test(id)) throw new Error("INVALID_EVENT_ID");
  const amount = typeof value.transferAmount === "string" && /^\d+$/.test(value.transferAmount) ? Number(value.transferAmount) : value.transferAmount;
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount <= 0 || amount > 2147483647) throw new Error("INVALID_AMOUNT");
  if (typeof value.accountNumber !== "string" || !/^[A-Z0-9]{4,50}$/.test(normalizeAccount(value.accountNumber))) throw new Error("INVALID_ACCOUNT");
  if (value.transferType !== "in" && value.transferType !== "out") throw new Error("INVALID_DIRECTION");
  if (typeof value.content !== "string" || value.content.length > 4000) throw new Error("INVALID_CONTENT");
  return { id: `sepay:${id.replace(/^0+(?=\d)/, "")}`, amount, accountNumber: normalizeAccount(value.accountNumber), content: value.content.trim(), transferType: value.transferType };
}

export function extractPaymentCode(content: string): string | null {
  const matches = [...content.toUpperCase().matchAll(/(?:^|[^A-Z0-9])(ACS[A-F0-9]{16})(?=$|[^A-Z0-9])/g)].map(match => match[1]);
  const unique = [...new Set(matches)];
  return unique.length === 1 ? unique[0] : null;
}

// Null duration denotes lifetime only for a complete server-created snapshot.
export function paymentReviewReason(intent: IntentSnapshot, event: BankEvent, now: Date, allowExpired = false) {
  if (!intent.paymentCode || !intent.planId || !intent.planName || !intent.expiresAt || intent.currency !== "VND") return "LEGACY_OR_INVALID_INTENT";
  if (intent.durationDays !== null && (!Number.isSafeInteger(intent.durationDays) || intent.durationDays < 0 || intent.durationDays > 36500)) return "INVALID_DURATION";
  if (event.transferType !== "in") return "OUTGOING_TRANSFER";
  if (extractPaymentCode(event.content) !== intent.paymentCode) return "CODE_MISMATCH";
  if (!intent.accountNumber || event.accountNumber !== normalizeAccount(intent.accountNumber)) return "ACCOUNT_MISMATCH";
  if (event.amount !== intent.amount) return "AMOUNT_MISMATCH";
  if (intent.status === "SUCCESS") return "ALREADY_PAID";
  if (!["PENDING", "REVIEW", "EXPIRED"].includes(intent.status)) return "INTENT_CLOSED";
  if (!allowExpired && intent.expiresAt <= now) return "INTENT_EXPIRED";
  return null;
}

export function nextVipExpiry(current: { isVIP: boolean; vipExpiresAt: Date | null }, durationDays: number | null, now: Date) {
  if (durationDays !== null && (!Number.isSafeInteger(durationDays) || durationDays < 0 || durationDays > 36500)) throw new Error("INVALID_DURATION");
  if (durationDays === null || durationDays === 0 || (current.isVIP && current.vipExpiresAt === null)) return null;
  const start = current.isVIP && current.vipExpiresAt && current.vipExpiresAt > now ? current.vipExpiresAt : now;
  return new Date(start.getTime() + durationDays * 86400000);
}
