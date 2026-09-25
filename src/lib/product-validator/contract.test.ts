import test from "node:test";
import assert from "node:assert/strict";
import {
  parseProductValidator,
  cleanAndValidateProductValidatorOutput,
  buildOfflineProductValidatorData,
  buildProductValidatorPrompt,
  extractPriceNumber,
  formatVnd,
  SAMPLE_PRODUCT_VALIDATOR_DATA,
  SAMPLE_PRODUCT_VALIDATOR_INPUT,
} from "./contract.ts";

test("Product Validator - Price Extractor & Formatter", () => {
  assert.equal(extractPriceNumber("68.000đ"), 68000);
  assert.equal(extractPriceNumber("189k"), 189000);
  assert.equal(extractPriceNumber("250.000"), 250000);
  assert.equal(formatVnd(189000), "189.000đ");
});

test("Product Validator - Parse Valid JSON Data", () => {
  const jsonStr = JSON.stringify(SAMPLE_PRODUCT_VALIDATOR_DATA);
  const result = parseProductValidator(jsonStr);

  assert.equal(result.productName, "Đèn ngủ hoàng hôn LED RGB đổi 16 màu kèm loa Bluetooth");
  assert.equal(result.overallScore, 68);
  assert.equal(result.verdict, "CÂN NHẮC KỸ");
  assert.ok(result.financials.maxBreakevenCpa);
  assert.equal(result.criteriaList.length, 5);
  assert.ok(result.pitfalls[0].estimatedLoss);
  assert.ok(result.pitfalls[0].platformTrigger);
  assert.ok(result.differentiation[0].suggestedAddOn);
  assert.ok(result.differentiation[0].pricingStrategy);
  assert.ok(result.roadmap.phases && result.roadmap.phases.length === 3);
  assert.ok(result.roadmap.liquidationPlan);
});

test("Product Validator - Offline Blueprint Generation (Resilience Layer)", () => {
  const offline = buildOfflineProductValidatorData({
    productName: "Quạt mini tích điện cầm tay gấp gọn",
    costPrice: "50.000đ",
    targetPrice: "160.000đ",
    platform: "TikTok Shop",
    source: "Nhập 1688",
    notes: "Có pin sạc 4000mAh, nặng 220g",
  });

  assert.equal(offline.productName, "Quạt mini tích điện cầm tay gấp gọn");
  assert.ok(offline.overallScore > 0);
  assert.ok(offline.verdict);
  assert.ok(offline.financials.estimatedPlatformFee.includes("14%"));
  assert.ok(offline.financials.maxBreakevenCpa);
  assert.equal(offline.criteriaList.length, 5);
  assert.ok(offline.pitfalls.length >= 3);
  assert.ok(offline.pitfalls[0].estimatedLoss);
  assert.ok(offline.pitfalls[0].platformTrigger);
  assert.ok(offline.differentiation.length >= 2);
  assert.ok(offline.differentiation[0].suggestedAddOn);
  assert.ok(offline.differentiation[0].pricingStrategy);
  assert.ok(offline.roadmap.stopLossCondition);
  assert.ok(offline.roadmap.phases && offline.roadmap.phases.length === 3);
  assert.ok(offline.roadmap.liquidationPlan);
});

test("Product Validator - Markdown JSON Extraction", () => {
  const markdownWrapped = "```json\n" + JSON.stringify(SAMPLE_PRODUCT_VALIDATOR_DATA) + "\n```";
  const result = parseProductValidator(markdownWrapped);

  assert.equal(result.productName, "Đèn ngủ hoàng hôn LED RGB đổi 16 màu kèm loa Bluetooth");
  assert.equal(result.overallScore, 68);
  assert.equal(result.criteriaList.length, 5);
});

test("Product Validator - Truncated JSON Fallback & Token Repair", () => {
  const truncated = `{"productName":"Sản phẩm test","overallScore":75,"verdict":"KHUYÊN NÊN LÀM","criteriaList":[{"id":"c1","name":"Dung lượng","category":"market","score":8,"maxScore":10,"status":"EXCELLENT","statusBadge":"Tốt","expertComment":"Nhu cầu cao","actionAdvice":"Làm ngay"}`;
  const result = parseProductValidator(truncated, { productName: "Sản phẩm test" });

  assert.equal(result.productName, "Sản phẩm test");
  assert.ok(result.overallScore);
  assert.ok(result.financials.maxBreakevenCpa);
  assert.ok(result.criteriaList.length > 0);
});

test("Product Validator - Legacy Markdown Backward Compatibility", () => {
  const legacyMarkdown = `## 📊 1. BẢNG ĐIỂM TIỀM NĂNG SẢN PHẨM (THANG ĐIỂM 100)
- **Điểm tổng quan:** 80/100 Điểm — KHUYÊN NÊN LÀM
- **Đánh giá ngắn gọn:** Sản phẩm rất tiềm năng trên TikTok Shop.

| Tiêu chí thẩm định | Điểm (1-10) | Nhận xét chi tiết từ chuyên gia |
| :--- | :--- | :--- |
| **Dung lượng & Nhu cầu tìm kiếm** | 9/10 | Nhu cầu mua cực lớn |
| **Mức độ bão hòa & Cạnh tranh giá** | 7/10 | Chưa có nhiều đối thủ lớn |
| **Biên lợi nhuận thực tế sau phí & ads** | 8/10 | Biên lãi dày thoải mái chạy ads |

---

## ⚠️ 2. CẢNH BÁO TỬ HUYỆT VẬN HÀNH & RỦI RO ẨN
- **Rủi ro cước cân nặng:** Hộp nhỏ nhẹ không lo cước.
- **Rủi ro tỷ lệ hoàn hàng:** Tỷ lệ hoàn thấp dưới 8%.

---

## 🎯 4. KẾT LUẬN & LỘ TRÌNH TEST ĐƠN AN TOÀN
- **Khuyến nghị số lượng nhập thử nghiệm:** 50 cái
- **Ngân sách Ads tối đa cho phép:** 50.000đ/đơn
- **Lời khuyên vàng từ chuyên gia:** Hãy tập trung làm video thật chỉn chu.
`;

  const result = parseProductValidator(legacyMarkdown, { productName: "Sản phẩm cũ" });
  assert.equal(result.overallScore, 80);
  assert.equal(result.verdict, "KHUYÊN NÊN LÀM");
  assert.ok(result.criteriaList.length >= 3);
  assert.ok(result.pitfalls.length >= 2);
  assert.equal(result.roadmap.initialUnits, "50 cái");
  assert.equal(result.roadmap.maxAdSpendPerOrder, "50.000đ/đơn");
});

test("Product Validator - Route Output Validator", () => {
  const jsonStr = JSON.stringify(SAMPLE_PRODUCT_VALIDATOR_DATA);
  const validated = cleanAndValidateProductValidatorOutput(jsonStr, SAMPLE_PRODUCT_VALIDATOR_INPUT);
  assert.doesNotThrow(() => JSON.parse(validated));
  const parsed = JSON.parse(validated);
  assert.equal(parsed.productName, "Đèn ngủ hoàng hôn LED RGB đổi 16 màu kèm loa Bluetooth");
});
