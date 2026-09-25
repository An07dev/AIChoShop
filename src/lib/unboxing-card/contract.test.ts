import test from "node:test";
import assert from "node:assert/strict";
import {
  parseUnboxingCardResult,
  cleanAndValidateUnboxingCardOutput,
  buildUnboxingCardPrompt,
  repairTruncatedJson,
  buildOfflineUnboxingCardData,
  fixUnescapedQuotesInJson,
  SAMPLE_CARD_DATA,
  SAMPLE_CARD_INPUT,
} from "./contract.ts";
import type { UnboxingCardInputs } from "./contract.ts";

test("Unboxing Card Contract - Parse Valid JSON Schema", () => {
  const jsonStr = JSON.stringify(SAMPLE_CARD_DATA);
  const result = parseUnboxingCardResult(jsonStr);

  assert.equal(result.shopName, "Aicho Official Store");
  assert.equal(result.cardFormat, "Bưu Thiếp A6 (10 x 15 cm)");
  assert.equal(result.front.headline, "MÓN QUÀ NÀY ĐƯỢC CHUẨN BỊ DÀNH RIÊNG CHO BẠN!");
  assert.ok(result.front.visualDesignNotes.length > 0);
  assert.equal(result.back.anti1StarShield.heading, "ĐỪNG VỘI ĐÁNH GIÁ 1 SAO BẠN NHÉ!");
  assert.ok(result.back.anti1StarShield.message.includes("100%"));
  assert.ok(result.back.reviewMagnet.incentive.includes("30.000đ"));
  assert.ok(result.back.safeQrPortal.purpose.includes("Bảo hành") || result.back.safeQrPortal.purpose.includes("bảo hành"));
  assert.equal(result.printSpecs.recommendedPaper, "Giấy Couche 300gsm (C300) cán màng mờ 2 mặt - Chống thấm nước, cứng cáp sang trọng");
  assert.ok(result.marketingAdvice.length >= 3);
});

test("Unboxing Card Contract - Repair Truncated JSON (Token Cutoff)", () => {
  // Simulate truncated JSON midway
  const truncated = `{"shopName":"Shop Mẹ & Bé","cardFormat":"Postcard A6","cardTone":"Đáng yêu","primaryGoal":"Chống 1 sao","front":{"headline":"CẢM ƠN MẸ VÀ BÉ ĐÃ GHÉ THĂM!","subheadline":"Món quà nhỏ với tình yêu to lớn","badgeText":"MẸ VÀ BÉ CHÍNH HÃNG","visualDesignNotes":["Tone pastel xanh bơ"],"openHook":"Lật mặt sau để xem quà ➔"},"back":{"heartfeltLetter":"Chào mẹ yêu dấu, từng món đồ sơ sinh đều được giặt hấp thơm tho...","anti1StarShield":{"heading":"MẸ ĐỪNG VỘI ĐÁNH GIÁ 1 SAO NHA","message":"Nếu đồ có vấn đề gì, shop xin đổi trả miễn phí","supportCta":"Bấm chat ngay"`;

  const repaired = repairTruncatedJson(truncated);
  assert.doesNotThrow(() => JSON.parse(repaired));

  const result = parseUnboxingCardResult(truncated);
  assert.equal(result.shopName, "Shop Mẹ & Bé");
  assert.equal(result.front.headline, "CẢM ƠN MẸ VÀ BÉ ĐÃ GHÉ THĂM!");
  assert.equal(result.back.anti1StarShield.heading, "MẸ ĐỪNG VỘI ĐÁNH GIÁ 1 SAO NHA");
});

test("Unboxing Card Contract - Fix Unescaped Quotes inside JSON String", () => {
  const badJson = `{"shopName":"Aicho Store","cardFormat":"A6","front":{"headline":"MÓN QUÀ "ĐẶC BIỆT" DÀNH CHO BẠN","subheadline":"Chào mừng bạn","badgeText":"AICHO","visualDesignNotes":[],"openHook":"Mở ra xem"},"back":{"heartfeltLetter":"Cảm ơn bạn!","anti1StarShield":{"heading":"ĐỪNG ĐÁNH GIÁ 1 SAO","message":"Cam kết "1 đổi 1" miễn phí","supportCta":"Chat ngay"},"reviewMagnet":{"heading":"REVIEW 5 SAO","incentive":"Voucher 20k","instruction":"Chụp hình"},"safeQrPortal":{"purpose":"Bảo hành","qrCaption":"Quét QR","safeNotice":"Bảo hành chính hãng"},"fullBackText":"Nội dung"}}`;

  const fixed = fixUnescapedQuotesInJson(badJson);
  assert.doesNotThrow(() => JSON.parse(fixed));

  const result = parseUnboxingCardResult(badJson);
  assert.equal(result.shopName, "Aicho Store");
  assert.ok(result.front.headline.includes("ĐẶC BIỆT"));
});

test("Unboxing Card Contract - Legacy Markdown Backward Compatibility", () => {
  const legacyMarkdown = `## 🎴 1. MẶT TRƯỚC (BÌA THIỆP GÂY ẤN TƯỢNG)
- **Tiêu đề đập vào mắt:** MÓN QUÀ NÀY DÀNH TẶNG RIÊNG CHO BẠN!
- **Lời tựa mở đầu:** Cảm ơn bạn đã lựa chọn chúng mình hôm nay.
- **Điểm nhấn thiết kế:** Tone màu be ấm áp kết hợp viền gold sang trọng.

---

## 💌 2. MẶT SAU (TÂM THƯ & KHIÊN CHẮN 1 SAO)

### 🌹 Lời Tri Ân Chân Thành
Chào bạn thương! Mỗi đơn hàng được gửi đi là cả một niềm trân trọng từ đội ngũ Aicho.

### 🛡️ KHIÊN CHẮN 1 SAO
Nếu có bất kỳ sơ suất nào, xin ĐỪNG VỘI ĐÁNH GIÁ 1 SAO. Hãy nhắn cho shop để được đổi trả miễn phí 100%!

### ⭐ NAM CHÂM KÉO REVIEW 5 SAO
Hãy quay video mở hộp và tặng 5 sao để nhận ngay voucher 30k cho đơn tiếp theo nhé!

### 📲 CỔNG QUÉT QR BẢO HÀNH AN TOÀN
Quét mã QR để kích hoạt bảo hành điện tử chính hãng 12 tháng.

---

## 🖨️ 3. QUY CHUẨN XƯỞNG IN (PRINTING SPECS)
- Khổ in: Bưu thiếp A6 (105 x 148 mm)
- Chất liệu: Giấy C300 cán màng mờ 2 mặt`;

  const result = parseUnboxingCardResult(legacyMarkdown);

  assert.equal(result.front.headline, "MÓN QUÀ NÀY DÀNH TẶNG RIÊNG CHO BẠN!");
  assert.equal(result.front.subheadline, "Cảm ơn bạn đã lựa chọn chúng mình hôm nay.");
  assert.ok(result.back.heartfeltLetter.includes("Chào bạn thương!"));
  assert.ok(result.back.anti1StarShield.message.includes("ĐỪNG VỘI ĐÁNH GIÁ 1 SAO"));
  assert.ok(result.back.reviewMagnet.instruction.includes("voucher 30k"));
  assert.ok(result.back.safeQrPortal.safeNotice.includes("kích hoạt bảo hành điện tử"));
});

test("Unboxing Card Contract - Offline Blueprint Engine Fallback", () => {
  const inputs: UnboxingCardInputs = {
    shopName: "Gia Dụng Thông Minh ZenLife",
    productCategory: "Thiết bị nhà bếp thông minh",
    cardTone: "premium_elegant",
    cardFormat: "postcard_a6",
    primaryGoal: "warranty_crm",
    specialOffer: "Tặng voucher 50k & Ebook 100 công thức nấu ăn",
  };

  const offlineData = buildOfflineUnboxingCardData(inputs);

  assert.equal(offlineData.shopName, "Gia Dụng Thông Minh ZenLife");
  assert.ok(offlineData.front.headline.includes("ZENLIFE"));
  assert.ok(offlineData.back.heartfeltLetter.includes("Thiết bị nhà bếp thông minh"));
  assert.ok(offlineData.back.reviewMagnet.incentive.includes("Tặng voucher 50k"));
  assert.ok(offlineData.printSpecs.recommendedPaper.includes("Couche 300gsm"));
});

test("Unboxing Card Contract - Build Prompt contains key e-commerce requirements", () => {
  const prompt = buildUnboxingCardPrompt(SAMPLE_CARD_INPUT);

  assert.ok(prompt.includes("Aicho Official Store"));
  assert.ok(prompt.includes("Thời trang thiết kế nữ"));
  assert.ok(prompt.includes("Khiên Chắn 1 Sao"));
  assert.ok(prompt.includes("Bưu Thiếp A6"));
  assert.ok(prompt.includes("JSON"));
});

test("Unboxing Card Contract - Clean and Validate Output returns valid JSON string", () => {
  const jsonStr = JSON.stringify(SAMPLE_CARD_DATA);
  const validated = cleanAndValidateUnboxingCardOutput(jsonStr);

  assert.doesNotThrow(() => JSON.parse(validated));
  const parsed = JSON.parse(validated);
  assert.equal(parsed.shopName, "Aicho Official Store");
  assert.equal(parsed.front.headline, SAMPLE_CARD_DATA.front.headline);
});

test("Unboxing Card Contract - Extreme Corrupt Input & Null Defense", () => {
  // Pass completely invalid strings or primitive garbage
  const corruptOutput = cleanAndValidateUnboxingCardOutput("<<<CORRUPT_LLM_ERROR>>>", {
    shopName: "Safe Shop",
    productCategory: "Quần áo",
    cardTone: "emotional",
    cardFormat: "postcard_a6",
  });

  assert.doesNotThrow(() => JSON.parse(corruptOutput));
  const parsed = JSON.parse(corruptOutput);
  assert.ok(parsed.front.headline);
  assert.ok(parsed.back.anti1StarShield.heading);
  assert.ok(parsed.printSpecs.recommendedPaper);
});
