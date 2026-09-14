import test from "node:test";
import assert from "node:assert/strict";
import { validateSeoInputs, parseSeoResult, seoPrompt, seoFilename, seoToText, charCount, type SeoResult } from "./contract.ts";
import { generateSeo } from "./generate.ts";
import { reservePolicy } from "./usage-policy.ts";

const inputs = validateSeoInputs({ platform: "shopee", productName: " Áo phông nam áo thun ", usp: "Cotton, co giãn, thấm hút mồ hôi, thoáng mát" });
const output: SeoResult = {
  titles: ["Áo phông nam cotton co giãn", "Áo phông nam cotton thấm hút mồ hôi", "Áo phông nam thoáng mát chất liệu cotton", "Áo phông nam co giãn thoải mái", "Áo phông nam cotton mặc hàng ngày"],
  descriptions: [{ title: "Chất liệu", content: "Cotton thoáng mát." }, { title: "Co giãn", content: "Thoải mái vận động." }, { title: "Thấm hút", content: "Thấm hút mồ hôi." }],
  hashtags: ["#aophong", "#aothun", "#aophongnam", "#aothunnam", "#cotton", "#aocotton", "#aonam", "#thoangmat", "#cogian", "#tham hut".replace(" ", "")],
};

test("USP đến prompt, tùy chọn trống không được tự thêm cam kết", () => {
  assert.equal(inputs.productName, "Áo phông nam áo thun");
  assert.ok(seoPrompt(inputs).includes(inputs.usp));
  assert.ok(!seoPrompt(inputs).includes("undefined"));
  assert.equal(inputs.policies, "");
  assert.match(seoPrompt(inputs), /Không tự thêm/);
});

test("từ chối thiếu USP, sai kiểu, quá dài và nền tảng không hỗ trợ", () => {
  for (const bad of [null, {}, { ...inputs, usp: " " }, { ...inputs, brand: 12 }, { ...inputs, productName: "a".repeat(201) }, { ...inputs, platform: "lazada" }]) assert.throws(() => validateSeoInputs(bad));
});

test("JSON hợp lệ, unicode tiếng Việt và export giữ nguyên nội dung", () => {
  assert.deepEqual(parseSeoResult(JSON.stringify(output), "shopee"), output);
  assert.equal(charCount("a\u0301"), 1);
  assert.match(seoFilename(inputs), /Áo phông nam/);
  assert.ok(seoToText(output).includes(output.titles[0]));
});

test("chặn kết quả thiếu, rỗng, trùng, sai định dạng và tiêu đề vượt độ dài", () => {
  for (const bad of ["not json", null, {}, { ...output, titles: output.titles.slice(0, 3) }, { ...output, titles: Array(5).fill(output.titles[0]) }, { ...output, descriptions: [] }, { ...output, descriptions: [{ title: "", content: "" }] }, { ...output, hashtags: [] }, { ...output, titles: ["a".repeat(121), ...output.titles.slice(1)] }]) assert.throws(() => parseSeoResult(bad, "shopee"));
  assert.throws(() => parseSeoResult({ ...output, titles: ["a".repeat(80), ...output.titles.slice(1)] }, "tiktok"));
});

test("hashtag trùng không phân biệt hoa thường được bỏ, không đủ 10 phải tạo lại", () => {
  assert.equal(parseSeoResult({ ...output, hashtags: [...output.hashtags, "#AOPHONG"] }, "shopee").hashtags.length, 10);
  assert.throws(() => parseSeoResult({ ...output, hashtags: Array(10).fill("#aophong") }, "shopee"));
  assert.equal(parseSeoResult({ ...output, hashtags: ["Áo phông nam", ...output.hashtags.slice(1)] }, "shopee").hashtags[0], "#Áophôngnam");
});

test("chặn chữ khác ngôn ngữ, hashtag không liên quan và cam kết tự thêm", () => {
  assert.throws(() => parseSeoResult({ ...output, descriptions: [{ title: "Chất liệu", content: "Cotton 自由自在" }, ...output.descriptions.slice(1)] }, "shopee", inputs));
  assert.throws(() => parseSeoResult({ ...output, hashtags: ["#quangcao", ...output.hashtags.slice(1)] }, "shopee", inputs));
  assert.throws(() => parseSeoResult({ ...output, descriptions: [{ title: "Bảo hành", content: "Bảo hành 12 tháng" }, ...output.descriptions.slice(1)] }, "shopee", inputs));
});

test("AI sai đầu ra được sửa tối đa một lần và cộng usage cả hai lần", async () => {
  let calls = 0;
  let tokens = 0;
  const result = await generateSeo(inputs, async () => ({ content: ++calls === 1 ? "{}" : JSON.stringify(output), finishReason: "stop", inputTokens: 5, outputTokens: 10 }), (i, o) => { tokens += i + o; });
  assert.deepEqual(result, output);
  assert.equal(calls, 2);
  assert.equal(tokens, 30);
});

test("không chấp nhận kết quả bị cắt hoặc từ chối, không lặp vô hạn", async () => {
  let calls = 0;
  await assert.rejects(generateSeo(inputs, async () => { calls++; return { content: JSON.stringify(output), finishReason: "length", inputTokens: 0, outputTokens: 0 }; }, () => {}));
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(generateSeo(inputs, async () => { calls++; return { content: null, refused: true, finishReason: "stop", inputTokens: 0, outputTokens: 0 }; }, () => {}));
  assert.equal(calls, 1);
});

test("quota, đồng thời, cửa sổ rate limit và phục hồi lease", () => {
  const now = new Date();
  const state = { successes: 0, attempts: 0, windowStart: now, leaseUntil: null };
  assert.equal(reservePolicy(state, true, now).attempts, 1);
  assert.throws(() => reservePolicy({ ...state, successes: 2 }, true, now), /Đăng nhập/);
  assert.equal(reservePolicy({ ...state, successes: 200 }, false, now).attempts, 1);
  assert.throws(() => reservePolicy({ ...state, leaseUntil: new Date(now.getTime() + 1000) }, true, now), /đang được xử lý/);
  assert.throws(() => reservePolicy({ ...state, attempts: 3 }, true, now), /quá nhanh/);
  assert.equal(reservePolicy({ ...state, attempts: 3, windowStart: new Date(now.getTime() - 61000), leaseUntil: new Date(now.getTime() - 1) }, true, now).attempts, 1);
  assert.equal(state.successes, 0, "reserve does not consume success quota");
});
