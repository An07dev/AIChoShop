import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildOfflineScriptWriterData,
  cleanAndValidateScriptWriterOutput,
  parseScriptWriterResult,
  charCount,
} from "./contract.ts";

describe("Script Writer Offline Blueprint & Validator Tests", () => {
  it("hàm charCount đo chính xác số ký tự", () => {
    assert.equal(charCount("Kịch bản video"), 14);
    assert.equal(charCount(""), 0);
  });

  it("buildOfflineScriptWriterData sinh kịch bản video ngắn và live đầy đủ khi format = 'both'", () => {
    const offline = buildOfflineScriptWriterData({
      productName: "Nồi Chiên Không Dầu Điện Tử 6L",
      usp: "Công nghệ Rapid Air giảm 85% dầu mỡ, lòng nồi chống dính ceramic",
      format: "both",
      priceDeal: "Giá gốc 1.890k -> Deal Live 1.150k tặng kèm sách công thức",
    });

    assert.equal(offline.format, "both");
    assert.ok(offline.videoScripts);
    assert.equal(offline.videoScripts.length, 2);
    assert.ok(offline.videoScripts[0].scenes.length >= 4);

    assert.ok(offline.liveScript);
    assert.equal(offline.liveScript.stages.length, 4);
    assert.ok(offline.liveScript.fomoTactics.length >= 3);
    assert.equal(offline.policyCompliance.safeScore, 98);
  });

  it("buildOfflineScriptWriterData chỉ sinh videoScripts khi format = 'video_short'", () => {
    const offline = buildOfflineScriptWriterData({
      productName: "Tai Nghe ANC",
      usp: "Chống ồn 35dB",
      format: "video_short",
    });

    assert.equal(offline.format, "video_short");
    assert.ok(offline.videoScripts);
    assert.equal(offline.liveScript, undefined);
  });

  it("buildOfflineScriptWriterData chỉ sinh liveScript khi format = 'livestream'", () => {
    const offline = buildOfflineScriptWriterData({
      productName: "Áo Thun Unisex",
      usp: "Cotton 100%",
      format: "livestream",
    });

    assert.equal(offline.format, "livestream");
    assert.equal(offline.videoScripts, undefined);
    assert.ok(offline.liveScript);
    assert.equal(offline.liveScript.stages.length, 4);
  });

  it("cleanAndValidateScriptWriterOutput trả về chuỗi JSON hợp lệ khi nhận dữ liệu rỗng", () => {
    const validated = cleanAndValidateScriptWriterOutput("", {
      productName: "Sản phẩm thử nghiệm",
      usp: "Chất lượng cao",
      format: "both",
    });

    assert.ok(validated);
    const parsed = JSON.parse(validated);
    assert.ok(parsed.videoScripts || parsed.liveScript);
  });
});
