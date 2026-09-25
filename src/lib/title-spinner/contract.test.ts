import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildOfflineTitleSpinnerData,
  cleanAndValidateTitleSpinnerOutput,
  parseTitleSpinnerResult,
  charCount,
} from "./contract.ts";

describe("Title Spinner Offline Blueprint & Validator Tests", () => {
  it("hàm charCount đo chính xác độ dài ký tự", () => {
    assert.equal(charCount("Áo thun nam"), 11);
    assert.equal(charCount(""), 0);
  });

  it("buildOfflineTitleSpinnerData sinh đúng 10 biến thể tiêu đề chuẩn sàn", () => {
    const offline = buildOfflineTitleSpinnerData({
      platform: "shopee",
      originalTitle: "Áo Polo Nam Cổ Bẻ Cao Cấp",
      coreKeywords: "áo polo nam",
    });

    assert.equal(offline.platform, "shopee");
    assert.equal(offline.titles.length, 10);
    assert.ok(offline.averageUniqueness >= 80);
    assert.ok(offline.safeCount >= 9);

    // Kiểm tra từng tiêu đề tuân thủ giới hạn Shopee (120 ký tự)
    offline.titles.forEach((t) => {
      assert.ok(t.charCount <= 120, `Tiêu đề vượt quá 120 ký tự: ${t.title}`);
      assert.ok(t.title.length > 10);
    });
  });

  it("buildOfflineTitleSpinnerData tuân thủ giới hạn 79 ký tự cho TikTok Shop", () => {
    const offline = buildOfflineTitleSpinnerData({
      platform: "tiktok",
      originalTitle: "Kem Chống Nắng Nâng Tone Kiềm Dầu SPF50+ La Roche-Posay Chính Hãng",
    });

    assert.equal(offline.platform, "tiktok");
    assert.equal(offline.titles.length, 10);
    offline.titles.forEach((t) => {
      assert.ok(t.charCount <= 79, `Tiêu đề TikTok vượt quá 79 ký tự: ${t.title}`);
    });
  });

  it("cleanAndValidateTitleSpinnerOutput tự động khôi phục offline blueprint khi nhận dữ liệu rỗng", () => {
    const validated = cleanAndValidateTitleSpinnerOutput("", {
      platform: "shopee",
      originalTitle: "Tai Nghe Bluetooth AirPro 5",
    });

    assert.ok(validated);
    const parsed = JSON.parse(validated);
    assert.equal(parsed.titles.length, 10);
  });
});
