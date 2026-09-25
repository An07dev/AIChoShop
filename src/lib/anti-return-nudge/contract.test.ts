import test from "node:test";
import assert from "node:assert/strict";
import {
  parseAntiReturnNudge,
  cleanAndValidateAntiReturnNudgeOutput,
  buildOfflineAntiReturnNudgeData,
  SAMPLE_ANTI_RETURN_DATA,
  SAMPLE_ANTI_RETURN_INPUT,
} from "./contract.ts";

test("Anti-Return Nudge - Parse Valid JSON Data", () => {
  const jsonStr = JSON.stringify(SAMPLE_ANTI_RETURN_DATA);
  const result = parseAntiReturnNudge(jsonStr);

  assert.equal(result.shopName, "Aicho Tech Store");
  assert.equal(result.productName, "Tai nghe Bluetooth chống ồn chủ động ANC AichoPods Pro");
  assert.ok(result.chatMessages.length >= 2);
  assert.ok(result.callScript.intro);
  assert.ok(result.callScript.handling);
  assert.ok(result.callScript.closing);
  assert.ok(result.planB.sellerCenterSteps.length >= 2);
  assert.ok(result.psychology.length >= 2);
  assert.ok(result.emergencyChecklist.length >= 2);
});

test("Anti-Return Nudge - Offline Blueprint Generation (Resilience Layer)", () => {
  const offline = buildOfflineAntiReturnNudgeData({
    shopName: "Mẹ & Bé Store",
    productName: "Bình Sữa Cổ Rộng Siêu Mềm",
    codAmount: "350.000đ",
    scenario: "delayed_shipment",
    customerReason: "Giao lâu quá không muốn nhận nữa",
    compensationOffer: "Tặng thêm núm ti thay thế",
  });

  assert.equal(offline.shopName, "Mẹ & Bé Store");
  assert.equal(offline.productName, "Bình Sữa Cổ Rộng Siêu Mềm");
  assert.ok(offline.scenarioName);
  assert.ok(offline.chatMessages.length >= 2);
  assert.ok(offline.callScript.intro.includes("Mẹ & Bé Store"));
  assert.ok(offline.smsScript.content.length > 20);
  assert.ok(offline.planB.sellerCenterSteps.length >= 2);
  assert.ok(offline.psychology.length >= 2);
  assert.ok(offline.emergencyChecklist.length >= 2);
});

test("Anti-Return Nudge - Markdown JSON Extraction", () => {
  const markdownWrapped = "```json\n" + JSON.stringify(SAMPLE_ANTI_RETURN_DATA) + "\n```";
  const result = parseAntiReturnNudge(markdownWrapped);

  assert.equal(result.shopName, "Aicho Tech Store");
  assert.ok(result.chatMessages.length >= 2);
});

test("Anti-Return Nudge - Truncated JSON Fallback & Recovery", () => {
  const truncated = `{"shopName":"Shop Test","productName":"Áo Thun","scenario":"delivery_failed_1","chatMessages":[{"sampleNumber":"Mẫu 1","title":"Khẩn cấp","badge":"⚡ Nóng","content":"Dạ chào bạn`;
  const result = parseAntiReturnNudge(truncated, { shopName: "Shop Test", productName: "Áo Thun", scenario: "delivery_failed_1" });

  assert.ok(result.shopName);
  assert.ok(result.productName);
  assert.ok(result.chatMessages.length > 0);
  assert.ok(result.callScript.intro);
});

test("Anti-Return Nudge - Route Output Validator", () => {
  const jsonStr = JSON.stringify(SAMPLE_ANTI_RETURN_DATA);
  const validated = cleanAndValidateAntiReturnNudgeOutput(jsonStr, SAMPLE_ANTI_RETURN_INPUT);
  assert.doesNotThrow(() => JSON.parse(validated));
  const parsed = JSON.parse(validated);
  assert.equal(parsed.shopName, "Aicho Tech Store");
});
