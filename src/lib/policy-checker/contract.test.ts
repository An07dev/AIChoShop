import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePolicyCheckerResult,
  cleanAndValidatePolicyOutput,
  buildPolicyCheckerPrompt,
  repairTruncatedJson,
  buildOfflinePolicyData,
  fixUnescapedQuotesInJson,
  SAMPLE_POLICY_DATA,
} from "./contract.ts";
import { sanitizePolicyInput } from "../policy-blacklist/dictionary.ts";

test("Policy Checker Contract - Parse Valid JSON Schema", () => {
  const jsonStr = JSON.stringify(SAMPLE_POLICY_DATA);
  const result = parsePolicyCheckerResult(jsonStr);

  assert.equal(result.platform, "TikTok Shop");
  assert.equal(result.audit.riskLevel, "CRITICAL");
  assert.equal(result.audit.safetyScore, 15);
  assert.ok(result.violations.length >= 5);
  assert.ok(result.rewrite.fullCleanText.length > 50);
  assert.ok(result.tips.length > 0);
  assert.ok(result.safeTags.length > 0);
});

test("Policy Checker Contract - Repair Truncated JSON (Token Cutoff)", () => {
  // Simulate AI output truncated midway
  const truncated = `{"platform":"Shopee","contentType":"Mô tả sản phẩm","audit":{"riskLevel":"HIGH","riskBadge":"⚠️ CẢNH BÁO","safetyScore":45,"summary":"Phát hiện vi phạm","violatedPolicies":["Chính sách lôi kéo"]},"violations":[{"id":1,"phrase":"Zalo","category":"Lôi kéo ngoài sàn","severity":"CRITICAL","severityBadge":"🚨 Nguy Cấp","reason":"Nhắc đến Zalo","solution":"Xóa","replacementPhrase":"Nhắn tin sàn"`;

  const repaired = repairTruncatedJson(truncated);
  assert.doesNotThrow(() => JSON.parse(repaired));

  const result = parsePolicyCheckerResult(truncated);
  assert.equal(result.platform, "Shopee");
  assert.equal(result.audit.riskLevel, "HIGH");
  assert.equal(result.violations[0].phrase, "Zalo");
});

test("Policy Checker Contract - Legacy Markdown Backward Compatibility", () => {
  const legacyMarkdown = `## 🛡️ 1. TỔNG QUAN ĐÁNH GIÁ RỦI RO
- **Mức độ rủi ro:** NGUY HIỂM - NGUY CƠ BỊ KHÓA LINK / ĂN GẬY VI PHẠM CAO
- **Tóm tắt tình trạng:** Nội dung vi phạm chính sách sàn nặng nề.
- **Các chính sách bị vi phạm:** Chính sách lôi kéo ngoài sàn; Luật Quảng Cáo

---

## ⚠️ 2. DANH SÁCH CÁC ĐIỂM VI PHẠM CẦN GỠ BỎ
| Từ ngữ / Đoạn văn vi phạm | Nhóm chính sách | Lý do thuật toán sàn gắn cờ | Giải pháp khắc phục |
| :--- | :--- | :--- | :--- |
| "Cam kết 100% trị dứt điểm" | Cam kết y tế quá mức | Không được cam kết hiệu quả y tế | Thay bằng: "Hỗ trợ cải thiện rõ rệt" |
| "Zalo: 0912.345.678" | Lôi kéo ngoài sàn | Kéo khách rời sàn | Thay bằng: "Nhắn tin qua khung chat sàn" |

---

## ✅ 3. BẢN VIẾT LẠI AN TOÀN 100% (READY TO USE)
✨ KEM DƯỠNG DA MỤN CAO CẤP ✨
Dòng kem dưỡng giúp chăm sóc và làm dịu làn da mụn hiệu quả.

---

## 💡 4. LỜI KHUYÊN TỪ CHUYÊN GIA
- Tuyệt đối không giơ bảng Zalo khi live.
- Dùng voucher sàn thay vì tặng tiền mặt.`;

  const result = parsePolicyCheckerResult(legacyMarkdown);

  assert.equal(result.audit.riskLevel, "CRITICAL");
  assert.equal(result.violations.length, 2);
  assert.equal(result.violations[0].phrase, "Cam kết 100% trị dứt điểm");
  assert.equal(result.violations[0].replacementPhrase, "Hỗ trợ cải thiện rõ rệt");
  assert.ok(result.rewrite.fullCleanText.includes("KEM DƯỠNG DA MỤN CAO CẤP"));
  assert.ok(result.tips.length >= 2);
});

test("Policy Checker Contract - Clean and Validate Output returns clean JSON string", () => {
  const jsonStr = JSON.stringify(SAMPLE_POLICY_DATA);
  const validatedStr = cleanAndValidatePolicyOutput(jsonStr);

  assert.doesNotThrow(() => JSON.parse(validatedStr));
  const parsed = JSON.parse(validatedStr);
  assert.equal(parsed.audit.safetyScore, 15);
});

test("Policy Checker Contract - Prompt Builder includes platform and text", () => {
  const prompt = buildPolicyCheckerPrompt({
    platform: "TikTok Shop",
    contentType: "Kịch bản Video",
    text: "Mỹ phẩm trị mụn số 1",
  });

  assert.ok(prompt.includes("TikTok Shop"));
  assert.ok(prompt.includes("Kịch bản Video"));
  assert.ok(prompt.includes("Mỹ phẩm trị mụn số 1"));
});

test("Policy Checker Contract - Robust JSON Recovery with Unescaped Internal Quotes", () => {
  // LLM frequently emits quotes inside string fields without escaping
  const rawWithUnescapedQuotes = `{"platform":"TikTok Shop","contentType":"Mô tả sản phẩm","audit":{"riskLevel":"CRITICAL","riskBadge":"🚨 NGUY HIỂM","safetyScore":20,"summary":"Phát hiện từ "trị dứt điểm" và "Zalo"","violatedPolicies":["Lôi kéo ngoài sàn"]},"violations":[{"id":1,"phrase":"trị dứt điểm","category":"Cam kết y tế","severity":"CRITICAL","severityBadge":"🚨 Nguy Cấp","reason":"Từ "trị dứt điểm" bị cấm tuyệt đối theo luật dược","solution":"Dùng từ "chăm sóc da"","replacementPhrase":"chăm sóc da"}],"rewrite":{"headline":"Kem dưỡng","fullCleanText":"Dòng kem dưỡng dịu nhẹ","sellingPoints":["An toàn"],"safeCta":"Bấm giỏ hàng"}}`;

  const parsed = parsePolicyCheckerResult(rawWithUnescapedQuotes);
  assert.equal(parsed.platform, "TikTok Shop");
  assert.equal(parsed.audit.riskLevel, "CRITICAL");
  assert.equal(parsed.violations[0].phrase, "trị dứt điểm");
  assert.equal(parsed.violations[0].replacementPhrase, "chăm sóc da");
});

test("Policy Checker Contract - Offline Resilience Fallback Engine", () => {
  const violatingText = "Liên hệ Zalo 0912345678 để được tư vấn, cam kết trị dứt điểm 100% không tái phát!";
  const offlineData = buildOfflinePolicyData(violatingText, "Shopee", "Mô tả sản phẩm");

  assert.equal(offlineData.platform, "Shopee");
  assert.equal(offlineData.audit.riskLevel, "CRITICAL");
  assert.ok(offlineData.violations.length >= 2);
  // Must automatically create safe rewrite
  assert.ok(offlineData.rewrite.fullCleanText.length > 0);
  assert.ok(!offlineData.rewrite.fullCleanText.includes("Zalo"));
  assert.ok(!offlineData.rewrite.fullCleanText.includes("trị dứt điểm"));
  assert.ok(offlineData.safeTags.length > 0);
  assert.ok(offlineData.forbiddenTags.length > 0);
});

test("Policy Checker Contract - Input Sanitization & Buffer Guard", () => {
  const dirtyInput = "Kem dưỡng trắng\u200B\uFEFF da <script>alert(1)</script> cực tốt <!-- comment -->";
  const sanitized = sanitizePolicyInput(dirtyInput);

  assert.ok(!sanitized.includes("\u200B"));
  assert.ok(!sanitized.includes("\uFEFF"));
  assert.ok(!sanitized.includes("<script>"));
  assert.ok(!sanitized.includes("alert(1)"));
  assert.ok(!sanitized.includes("<!--"));
  assert.ok(sanitized.includes("Kem dưỡng trắng da cực tốt"));
});

