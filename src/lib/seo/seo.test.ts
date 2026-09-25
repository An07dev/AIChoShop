import test from "node:test";
import assert from "node:assert/strict";
import {
  validateSeoInputs,
  parseSeoResult,
  seoPrompt,
  seoFilename,
  seoToText,
  charCount,
  type SeoResult,
  SEO_SCHEMA,
} from "./contract.ts";
import { generateSeo } from "./generate.ts";
import { reservePolicy } from "./usage-policy.ts";

const sampleInputs = validateSeoInputs({
  platform: "shopee",
  productName: " Áo phông nam áo thun ",
  usp: "Cotton, co giãn, thấm hút mồ hôi, thoáng mát",
  policies: "Đổi trả 7 ngày",
});

const richSampleOutput: SeoResult = {
  seoScore: {
    score: 98,
    grade: "XUẤT SẮC",
    checklist: [
      { item: "Chứa từ khóa chính ở đầu tiêu đề", passed: true },
      { item: "Độ dài tiêu đề tối ưu cho Shopee (≤ 120 ký tự)", passed: true },
      { item: "Mô tả chuẩn phễu chuyển đổi AIDA", passed: true },
      { item: "Không chứa từ ngữ vi phạm chính sách sàn", passed: true },
    ],
    safetyPassed: true,
  },
  titles: [
    "Áo polo nam ngắn tay cổ bẻ vải cá sấu gai cao cấp cotton 100% co giãn 4 chiều",
    "🔥 Áo polo nam công sở lịch lãm chất cá sấu gai tổ ong thấm hút mồ hôi bo cổ bền đẹp",
    "Áo thun có cổ nam basic phong cách trẻ trung năng động vải cá sấu không bai dão",
    "Áo phông nam cổ bẻ cao cấp form chuẩn size M đến XXL tôn dáng nam tính",
    "Áo polo nam ngắn tay vải cotton cá sấu gai co giãn 4 chiều mềm mát chính hãng",
  ],
  richTitles: [
    {
      id: 1,
      style: "SEO Thuật Toán (Search-Driven)",
      tag: "Đẩy Top Sàn",
      title: "Áo polo nam ngắn tay cổ bẻ vải cá sấu gai cao cấp cotton 100% co giãn 4 chiều",
      charCount: 77,
      hookKeywords: "áo polo nam",
      targetAudience: "Khách gõ tìm kiếm tự nhiên",
    },
    {
      id: 2,
      style: "Kéo Click CTR (Impulse/Curiosity)",
      tag: "Tăng CTR",
      title: "🔥 Áo polo nam công sở lịch lãm chất cá sấu gai tổ ong thấm hút mồ hôi bo cổ bền đẹp",
      charCount: 82,
      hookKeywords: "áo polo nam công sở",
      targetAudience: "Khách săn deal",
    },
    {
      id: 3,
      style: "Đấu Thầu Quảng Cáo (High Ads Quality)",
      tag: "Chuẩn Ads",
      title: "Áo thun có cổ nam basic phong cách trẻ trung năng động vải cá sấu không bai dão",
      charCount: 79,
      hookKeywords: "áo thun có cổ nam",
      targetAudience: "Khách tìm kiếm từ khóa ngách",
    },
    {
      id: 4,
      style: "Đột Phá USP (Lợi Thế Độc Quyền)",
      tag: "Độc Quyền",
      title: "Áo phông nam cổ bẻ cao cấp form chuẩn size M đến XXL tôn dáng nam tính",
      charCount: 73,
      hookKeywords: "form chuẩn tôn dáng",
      targetAudience: "Khách chú trọng form dáng",
    },
    {
      id: 5,
      style: "Toàn Diện & Chốt Đơn (Conversion Master)",
      tag: "Chốt Đơn",
      title: "Áo polo nam ngắn tay vải cotton cá sấu gai co giãn 4 chiều mềm mát chính hãng",
      charCount: 76,
      hookKeywords: "cotton cá sấu chính hãng",
      targetAudience: "Khách kỹ tính",
    },
  ],
  descriptionAida: {
    attentionHook: "Bạn đang tìm kiếm một chiếc áo polo nam lịch lãm thoáng mát?",
    uspStory: "Chất liệu cotton cá sấu gai tổ ong 100% tự nhiên co giãn 4 chiều.",
    featureBullets: [
      { feature: "Vải cá sấu gai", benefit: "Mềm mát, thoáng khí" },
      { feature: "Form Regular Fit", benefit: "Tôn dáng nam tính" },
    ],
    sizeAndSpecs: ["Size M: 50-60kg", "Size L: 60-70kg"],
    commitments: ["Cam kết hình ảnh thực tế", "Đổi size trong 7 ngày"],
    ctaCloser: "👉 BẤM MUA NGAY ĐỂ NHẬN ƯU ĐÃI!",
  },
  descriptions: [
    { title: "✨ ĐIỂM NHẤN ĐẶC QUYỀN (USP)", content: "Chất liệu cotton cá sấu gai tổ ong." },
    { title: "💎 THIẾT KẾ & TÍNH NĂNG VƯỢT TRỘI", content: "Form Regular Fit tôn dáng." },
  ],
  keywordMatrix: {
    coreKeywords: ["áo polo nam", "áo thun có cổ"],
    longtailKeywords: ["áo polo nam vải cá sấu", "áo polo nam công sở"],
    hashtags: ["#aopolonam", "#aothuncoco", "#thoitrangnam", "#aophongnam", "#chinhhang", "#shopee", "#tiktokshop", "#freeship", "#trending", "#xuhuong"],
  },
  hashtags: ["#aopolonam", "#aothuncoco", "#thoitrangnam", "#aophongnam", "#chinhhang", "#shopee", "#tiktokshop", "#freeship", "#trending", "#xuhuong"],
};

test("validateSeoInputs chuẩn hóa input, cắt khoảng trắng và kiểm tra trường bắt buộc", () => {
  assert.equal(sampleInputs.productName, "Áo phông nam áo thun");
  assert.equal(sampleInputs.platform, "shopee");
  assert.equal(sampleInputs.policies, "Đổi trả 7 ngày");

  // Từ chối thiếu USP, thiếu productName, sai platform hoặc vượt giới hạn
  for (const bad of [
    null,
    {},
    { ...sampleInputs, usp: "   " },
    { ...sampleInputs, productName: "" },
    { ...sampleInputs, brand: 123 },
    { ...sampleInputs, productName: "a".repeat(201) },
    { ...sampleInputs, platform: "lazada" },
  ]) {
    assert.throws(() => validateSeoInputs(bad));
  }
});

test("seoPrompt cấu hình đúng theo từng sàn TMĐT và hướng dẫn JSON Schema", () => {
  const shopeePrompt = seoPrompt(sampleInputs);
  assert.ok(shopeePrompt.includes("Shopee"));
  assert.ok(shopeePrompt.includes("120 ký tự"));
  assert.ok(shopeePrompt.includes(sampleInputs.usp));
  assert.ok(shopeePrompt.includes(sampleInputs.productName));

  const tiktokInputs = validateSeoInputs({ ...sampleInputs, platform: "tiktok" });
  const tiktokPrompt = seoPrompt(tiktokInputs);
  assert.ok(tiktokPrompt.includes("TikTok Shop"));
  assert.ok(tiktokPrompt.includes("79 ký tự"));
});

test("SEO_SCHEMA tuân thủ định dạng OpenAI Strict Mode", () => {
  assert.equal(SEO_SCHEMA.type, "object");
  assert.equal(SEO_SCHEMA.additionalProperties, false);
  assert.ok(Array.isArray(SEO_SCHEMA.required));
  assert.ok(SEO_SCHEMA.required.includes("seoScore"));
  assert.ok(SEO_SCHEMA.required.includes("titles"));
  assert.ok(SEO_SCHEMA.required.includes("descriptionAida"));
  assert.ok(SEO_SCHEMA.required.includes("keywordMatrix"));
});

test("parseSeoResult bóc tách hoàn chỉnh dữ liệu cấu trúc phong phú từ AI", () => {
  const parsed = parseSeoResult(richSampleOutput, "shopee", sampleInputs);

  assert.equal(parsed.titles.length, 5);
  assert.equal(parsed.richTitles?.length, 5);
  assert.equal(parsed.richTitles?.[0].tag, "Đẩy Top Sàn");
  assert.ok(parsed.richTitles?.[0].targetAudience);

  assert.ok(parsed.seoScore);
  assert.equal(parsed.seoScore.score, 98);
  assert.equal(parsed.seoScore.grade, "XUẤT SẮC");
  assert.equal(parsed.seoScore.safetyPassed, true);
  assert.equal(parsed.seoScore.checklist.length, 4);

  assert.ok(parsed.descriptionAida);
  assert.equal(parsed.descriptionAida.featureBullets?.length, 2);
  assert.ok(parsed.descriptionAida.attentionHook);

  assert.ok(parsed.keywordMatrix);
  assert.ok(parsed.keywordMatrix.coreKeywords.length > 0);
  assert.ok(parsed.keywordMatrix.longtailKeywords.length > 0);
  assert.equal(parsed.hashtags.length, 10);
});

test("parseSeoResult có cơ chế Self-healing (tự phục hồi & điền fallback khi AI thiếu trường)", () => {
  // Khi AI trả về JSON rỗng hoặc thiếu trường, parser tự động tạo fallback đầy đủ, không bao giờ để crash
  const healed = parseSeoResult("{}", "shopee", sampleInputs);
  assert.equal(healed.titles.length, 5);
  assert.equal(healed.richTitles?.length, 5);
  assert.ok(healed.descriptions.length > 0);
  assert.ok(healed.hashtags.length >= 10);
  assert.ok(healed.seoScore);
  assert.equal(healed.seoScore.score, 98);
});

test("parseSeoResult tự động sửa lỗi Markdown blocks và chuỗi JSON bị bọc văn bản", () => {
  const markdownWrapped = `\`\`\`json
${JSON.stringify(richSampleOutput)}
\`\`\``;
  const parsed = parseSeoResult(markdownWrapped, "shopee", sampleInputs);
  assert.equal(parsed.titles.length, 5);
  assert.equal(parsed.titles[0], richSampleOutput.titles[0]);
});

test("Tiện ích đếm ký tự Unicode, định dạng Text và tên file", () => {
  assert.equal(charCount("a\u0301"), 1); // Unicode tổ hợp
  assert.equal(charCount("Áo thun nam"), 11);

  const filename = seoFilename(sampleInputs);
  assert.match(filename, /SEO_shopee_Ao-phong-nam|SEO_shopee_Áo phông nam/i);

  const text = seoToText(richSampleOutput);
  assert.ok(text.includes("BỘ LISTING SEO SẢN PHẨM CHUẨN SÀN"));
  assert.ok(text.includes(richSampleOutput.titles[0]));
  assert.ok(text.includes("#aopolonam"));
  assert.ok(text.includes("MA TRẬN TỪ KHÓA TÌM KIẾM"));
});

test("generateSeo tự động retry sửa lỗi khi lần đầu đầu ra rỗng hoặc lỗi", async () => {
  let calls = 0;
  let tokens = 0;
  const completer = async () => {
    calls++;
    return {
      content: calls === 1 ? "" : JSON.stringify(richSampleOutput),
      finishReason: calls === 1 ? "error" : "stop",
      inputTokens: 10,
      outputTokens: 20,
    };
  };

  const result = await generateSeo(sampleInputs, completer, (inp, out) => {
    tokens += inp + out;
  });

  assert.equal(calls, 2);
  assert.equal(tokens, 60);
  assert.equal(result.titles.length, 5);
});

test("reservePolicy quản lý quota, chống spam rate-limit và lease lock", () => {
  const now = new Date();
  const state = { successes: 0, attempts: 0, windowStart: now, leaseUntil: null };

  // Lần đầu hợp lệ
  assert.equal(reservePolicy(state, true, now).attempts, 1);

  // Người dùng ẩn danh hết 2 lượt miễn phí
  assert.throws(() => reservePolicy({ ...state, successes: 2 }, true, now), /Đăng nhập/);

  // Người dùng đăng nhập có quota cao hơn
  assert.equal(reservePolicy({ ...state, successes: 10 }, false, now).attempts, 1);

  // Chặn khi đang có lease xử lý dở
  assert.throws(
    () => reservePolicy({ ...state, leaseUntil: new Date(now.getTime() + 5000) }, true, now),
    /đang được xử lý/
  );

  // Chặn rate limit khi bấm quá nhanh (>2 lần trong 1 phút)
  assert.throws(() => reservePolicy({ ...state, attempts: 3 }, true, now), /quá nhanh/);
});

