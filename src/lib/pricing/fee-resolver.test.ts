import test from "node:test";
import assert from "node:assert/strict";
import { isFeeProfileStale, resolveFeeProfile, selectFeeOverride } from "./fee-resolver.ts";
import type { FeeOverrideRecord } from "./types.ts";

const overrides: FeeOverrideRecord[] = [
  { id:"old",platform:"shopee",shopType:"marketplace",categoryId:"shopee-416",commissionRate:10,transactionRate:null,orderProcessingFee:null,effectiveFrom:"2026-01-01T00:00:00Z",effectiveTo:"2026-05-31T23:59:59Z",sourceName:"Old",sourceUrl:null,note:null },
  { id:"new",platform:"shopee",shopType:"marketplace",categoryId:"shopee-416",commissionRate:12,transactionRate:7,orderProcessingFee:4000,effectiveFrom:"2026-06-01T00:00:00Z",effectiveTo:null,sourceName:"Admin",sourceUrl:"https://example.test",note:"Contract" },
];

test("resolver chọn đúng phiên bản theo ngày và giữ fallback cho trường null", () => {
  assert.equal(selectFeeOverride(overrides,"shopee","marketplace","shopee-416",new Date("2026-03-01"))?.id,"old");
  const old=resolveFeeProfile("shopee","marketplace","shopee-416",overrides,new Date("2026-03-01"));
  assert.equal(old.commissionRate,10);assert.equal(old.transactionRate,6);
  const current=resolveFeeProfile("shopee","marketplace","shopee-416",overrides,new Date("2026-09-01"));
  assert.equal(current.commissionRate,12);assert.equal(current.transactionRate,7);assert.equal(current.orderProcessingFee,4000);
  assert.equal(current.dataVersion,"admin:new");
});

test("resolver không áp biểu phí sai sàn, loại shop hoặc ngành", () => {
  assert.equal(resolveFeeProfile("shopee","mall","shopee-416",overrides,new Date("2026-09-01")).overrideId,null);
});

test("cảnh báo biểu phí quá 90 ngày", () => {
  const profile=resolveFeeProfile("shopee","marketplace","shopee-416",[],new Date("2026-09-12"));
  assert.equal(isFeeProfileStale(profile,new Date("2026-09-12")),false);
  assert.equal(isFeeProfileStale(profile,new Date("2026-12-20")),true);
});
