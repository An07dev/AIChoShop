import test from "node:test";
import assert from "node:assert/strict";
import { extractPaymentCode, nextVipExpiry, parseBankEvent, paymentReviewReason, type BankEvent, type IntentSnapshot } from "./policy.ts";
import { isVipActive } from "../vip-expiration.ts";
import { readLimitedJson } from "../http/body.ts";

const now = new Date("2026-09-14T00:00:00Z");
const code = "ACS0123456789ABCDEF";
const intent: IntentSnapshot = { paymentCode: code, planId: "plan", planName: "Month", amount: 299000, durationDays: 30, currency: "VND", accountNumber: "123456789", expiresAt: new Date(now.getTime() + 1800000), status: "PENDING" };
const event: BankEvent = { id: "sepay:1", amount: 299000, accountNumber: "123456789", content: `Transfer ${code}`, transferType: "in" };

test("bank payload requires stable ID, positive integer amount and explicit direction", () => {
  const payload = { id: 1, transferAmount: 299000, accountNumber: "123456789", content: code, transferType: "in" };
  assert.equal(parseBankEvent(payload).id, "sepay:1");
  assert.equal(parseBankEvent({ ...payload, id: "0001" }).id, "sepay:1");
  for (const patch of [{ id: undefined }, { id: "NaN" }, { transferAmount: 0 }, { transferAmount: -1 }, { transferAmount: 1.5 }, { transferAmount: Infinity }, { transferAmount: "1abc" }, { transferType: undefined }, { transferType: "credit" }, { accountNumber: null }, { content: "x".repeat(4001) }]) {
    assert.throws(() => parseBankEvent({ ...payload, ...patch }));
  }
});
test("codes require exact boundaries; names, emails and ambiguous codes never match", () => {
  assert.equal(extractPaymentCode(`Bank: ${code.toLowerCase()}.CT`), code);
  for (const content of ["VIP 0901234567", "person@example.test", "LE VAN AN", `X${code}`, `${code}0`, `${code} ACS1111111111111111`]) assert.equal(extractPaymentCode(content), null);
});
test("only exact account, amount and code are payable", () => {
  assert.equal(paymentReviewReason(intent, event, now), null);
  assert.equal(paymentReviewReason(intent, { ...event, amount: 1 }, now), "AMOUNT_MISMATCH");
  assert.equal(paymentReviewReason(intent, { ...event, amount: 300000 }, now), "AMOUNT_MISMATCH");
  assert.equal(paymentReviewReason(intent, { ...event, accountNumber: "999999999" }, now), "ACCOUNT_MISMATCH");
  assert.equal(paymentReviewReason(intent, { ...event, content: "another code" }, now), "CODE_MISMATCH");
  assert.equal(paymentReviewReason(intent, { ...event, transferType: "out" }, now), "OUTGOING_TRANSFER");
});
test("legacy, closed, already-paid and expired intents do not auto-activate", () => {
  assert.equal(paymentReviewReason({ ...intent, paymentCode: null }, event, now), "LEGACY_OR_INVALID_INTENT");
  assert.equal(paymentReviewReason({ ...intent, status: "CANCELLED" }, event, now), "INTENT_CLOSED");
  assert.equal(paymentReviewReason({ ...intent, status: "SUCCESS" }, event, now), "ALREADY_PAID");
  assert.equal(paymentReviewReason({ ...intent, expiresAt: now }, event, now), "INTENT_EXPIRED");
  assert.equal(paymentReviewReason({ ...intent, expiresAt: now }, event, now, true), null);
});
test("renewal extends current expiry, expired accounts start now, lifetime is preserved", () => {
  const future = new Date(now.getTime() + 10 * 86400000);
  assert.equal(nextVipExpiry({ isVIP: true, vipExpiresAt: future }, 30, now)?.getTime(), now.getTime() + 40 * 86400000);
  assert.equal(nextVipExpiry({ isVIP: true, vipExpiresAt: new Date(0) }, 30, now)?.getTime(), now.getTime() + 30 * 86400000);
  assert.equal(nextVipExpiry({ isVIP: true, vipExpiresAt: null }, 30, now), null);
  assert.equal(nextVipExpiry({ isVIP: false, vipExpiresAt: null }, 0, now), null);
  assert.throws(() => nextVipExpiry({ isVIP: false, vipExpiresAt: null }, -30, now));
});
test("VIP checks enforce expiry without a database cleanup job", () => {
  assert.equal(isVipActive({ isVIP: true, vipExpiresAt: now }, now), false);
  assert.equal(isVipActive({ isVIP: true, vipExpiresAt: "invalid" }, now), false);
  assert.equal(isVipActive({ isVIP: true, vipExpiresAt: null }, now), true);
  assert.equal(isVipActive({ isVIP: false, vipExpiresAt: null }, now), false);
});
test("request body limit counts actual bytes even without Content-Length", async () => {
  assert.deepEqual(await readLimitedJson(new Request("https://app.test", { method: "POST", body: '{"ok":true}' }), 20), { ok: true });
  await assert.rejects(readLimitedJson(new Request("https://app.test", { method: "POST", body: "x".repeat(21) }), 20), /BODY_TOO_LARGE/);
  await assert.rejects(readLimitedJson(new Request("https://app.test", { method: "POST", body: "{" }), 20), /INVALID_JSON/);
});
