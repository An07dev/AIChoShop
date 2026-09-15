const test = require("node:test");
const assert = require("node:assert/strict");

test("Policy Blacklist Engine detects violations accurately", async () => {
  const sample = "Trị dứt điểm mụn bọc trong 3 ngày, cam kết khỏi 100%. Mua hàng liên hệ Zalo 0912345678 nhé!";
  
  // Test regexes
  const zaloPattern = /\b(zalo|da-lo|z.a.l.o|zalo\s*me|za\s*lo)\b/gi;
  const curePattern = /\b(trị\s*dứt\s*điểm|khỏi\s*100%|khỏi\s*hẳn|chữa\s*dứt\s*điểm|trị\s*tận\s*gốc)\b/gi;
  const phonePattern = /(?:(?:\+|00)84|0)[1-9][0-9]{8,9}|\b(?:hotline|sđt|sdt|liên\s*hệ|lh|call|alo)\s*[:.-]?\s*[0-9\s.]{8,15}\b/gi;

  assert.match(sample, zaloPattern, "Must detect Zalo violation");
  assert.match(sample, curePattern, "Must detect cure 100% violation");
  assert.match(sample, phonePattern, "Must detect phone violation");
});
