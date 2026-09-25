import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseAdCopyResult,
  buildAdCopyPrompt,
  formatShopeeBulkKeywords,
  charCount,
  type AdCopyInputs,
  buildOfflineAdCopyData,
  cleanAndValidateAdCopyOutput,
} from "./contract.ts";

describe("AI Mẫu Quảng Cáo (Ad Copy) Contract & Parser Tests", () => {
  it("xây dựng user prompt đúng với mục tiêu chiến dịch và ưu đãi", () => {
    const inputs: AdCopyInputs = {
      adPlatform: "both",
      productName: "Tai nghe Bluetooth chống ồn ANC AirPro 5",
      price: "389.000đ",
      usp: "Chống ồn 35dB, Pin 30h",
      campaignGoal: "conversion",
      promotionOffer: "Voucher giảm 50k & Freeship Xtra",
    };

    const prompt = buildAdCopyPrompt(inputs);
    assert.ok(prompt.includes("Tai nghe Bluetooth chống ồn ANC AirPro 5"));
    assert.ok(prompt.includes("Tối ưu Tỷ lệ Chuyển Đổi & ROAS"));
    assert.ok(prompt.includes("Voucher giảm 50k & Freeship Xtra"));
    assert.ok(prompt.includes("shopeeAds"));
    assert.ok(prompt.includes("tiktokAds"));
  });

  it("parse thành công chuỗi JSON hợp lệ", () => {
    const validJson = JSON.stringify({
      platform: "both",
      campaignGoal: "Tối ưu chuyển đổi",
      shopeeAds: {
        keywordMatrix: {
          exactMatch: [{ keyword: "tai nghe anc", suggestedBid: "1.800đ", searchIntent: "Ý định mua cao" }],
          broadMatch: [{ keyword: "tai nghe bluetooth", suggestedBid: "900đ", searchIntent: "Traffic rẻ" }],
          misspelledOrNiche: [{ keyword: "tai nge anc", suggestedBid: "500đ", searchIntent: "Ít cạnh tranh" }],
          negativeKeywords: ["cũ", "thanh lý", "hàng nhái", "miễn phí"],
        },
        headlines: [
          {
            id: 1,
            label: "Mẫu 1",
            angle: "Deal sốc",
            headline: "Tai Nghe ANC AirPro 5 - Flash Sale Giảm 45%",
            charCount: 43,
            isSafeLength: true,
            hookBenefit: "Deal sốc",
          },
        ],
        biddingStrategy: {
          recommendedInitialBid: "1.200đ",
          peakHourMultiplier: "Tăng 30%",
          optimizationTip: "Kiểm tra sau 3 ngày",
        },
      },
      tiktokAds: {
        hooks: [
          {
            id: 1,
            angle: "Nỗi đau",
            visualAction: "Bịt tai cau có trong quán ồn ào",
            textOverlay: "ĐỪNG MUA tai nghe nếu bạn ghét tiếng ồn!",
            audioVoiceover: "Có phải bạn từng mua tai nghe nhưng vẫn nghe trọn tiếng ồn?",
          },
        ],
        captions: [
          {
            id: 1,
            title: "Mẫu 1",
            angle: "Review tính năng",
            caption: "Bật chống ồn ANC là cách ly âm thanh tức thì!",
            ctaBadge: "Bấm giỏ hàng màu vàng góc trái săn deal",
          },
        ],
        hashtags: ["#tainghe", "#anc", "#review"],
        conversionTip: "Nhấn mạnh giỏ hàng góc trái",
      },
      policyCompliance: {
        safeScore: 99,
        bannedWordsAvoided: ["cam kết 100%"],
        warningNotes: ["An toàn chính sách"],
      },
    });

    const parsed = parseAdCopyResult(validJson, "both");
    assert.equal(parsed.platform, "both");
    assert.ok(parsed.shopeeAds);
    assert.equal(parsed.shopeeAds.keywordMatrix.exactMatch.length, 1);
    assert.equal(parsed.shopeeAds.keywordMatrix.exactMatch[0].keyword, "tai nghe anc");
    assert.equal(parsed.shopeeAds.keywordMatrix.negativeKeywords.length, 4);
    assert.equal(parsed.shopeeAds.headlines[0].isSafeLength, true);

    assert.ok(parsed.tiktokAds);
    assert.equal(parsed.tiktokAds.hooks.length, 1);
    assert.equal(parsed.tiktokAds.hooks[0].visualAction, "Bịt tai cau có trong quán ồn ào");
    assert.equal(parsed.policyCompliance.safeScore, 99);
  });

  it("parse thành công JSON được bọc trong Markdown Code Block", () => {
    const wrapped = `Dưới đây là kết quả phân tích:
\`\`\`json
{
  "platform": "shopee",
  "campaignGoal": "Gom traffic",
  "shopeeAds": {
    "keywordMatrix": {
      "exactMatch": [{ "keyword": "giày nam", "suggestedBid": "1.500đ", "searchIntent": "Mua ngay" }],
      "broadMatch": [],
      "misspelledOrNiche": [],
      "negativeKeywords": ["giày cũ"]
    },
    "headlines": [],
    "biddingStrategy": {
      "recommendedInitialBid": "1.000đ",
      "peakHourMultiplier": "Tăng 20%",
      "optimizationTip": "Chặn từ khóa cũ"
    }
  },
  "policyCompliance": {
    "safeScore": 96,
    "bannedWordsAvoided": [],
    "warningNotes": []
  }
}
\`\`\`
Hy vọng bạn hài lòng!`;

    const parsed = parseAdCopyResult(wrapped, "shopee");
    assert.equal(parsed.platform, "shopee");
    assert.ok(parsed.shopeeAds);
    assert.equal(parsed.shopeeAds.keywordMatrix.exactMatch[0].keyword, "giày nam");
    assert.equal(parsed.shopeeAds.keywordMatrix.negativeKeywords[0], "giày cũ");
  });

  it("fallback an toàn khi nhận văn bản Markdown tự do truyền thống", () => {
    const legacyMarkdown = `### MA TRẬN TỪ KHÓA ĐẤU THẦU SHOPEE ADS

#### Nhóm 1: Từ Khóa Chính Xác (Exact Match)
- tai nghe bluetooth anc: 1.200đ - 1.800đ
- tai nghe airpro 5: 1.500đ - 2.200đ

#### Nhóm 2: Từ Khóa Mở Rộng (Broad Match)
- tai nghe bluetooth: 800đ - 1.200đ

#### Nhóm 3: Từ Khóa Ngách & Lỗi Gõ
- tai nge bluetooth: 450đ - 700đ

### TIÊU ĐỀ QUẢNG CÁO TỐI ƯU CTR (< 60 KÝ TỰ)
- Mẫu 1 (Đẩy Thẳng Flash Sale): Tai Nghe Bluetooth ANC AirPro 5 - Flash Sale Giảm 45%

### 5 CÂU HOOK 3 GIÂY ĐẦU VIDEO (TIKTOK ADS)
- Hook 1 (Nỗi đau): "Bỏ cả triệu mua tai nghe mà tạp âm ồn ào không chịu nổi? Thử ngay em này!"

### MẪU CAPTION QUẢNG CÁO KÈM CTA GIỎ HÀNG
- Mẫu Caption 1 (Tập trung tính năng):
Chống ồn đỉnh chóp - Bật ANC một phát là êm ngay!
#tainghe #anc`;

    const parsed = parseAdCopyResult(legacyMarkdown, "both");
    assert.ok(parsed.shopeeAds);
    assert.equal(parsed.shopeeAds.keywordMatrix.exactMatch.length, 2);
    assert.equal(parsed.shopeeAds.keywordMatrix.exactMatch[0].keyword, "tai nghe bluetooth anc");
    assert.equal(parsed.shopeeAds.keywordMatrix.broadMatch.length, 1);
    assert.equal(parsed.shopeeAds.keywordMatrix.misspelledOrNiche.length, 1);
    assert.equal(parsed.shopeeAds.headlines.length, 1);
    assert.equal(parsed.shopeeAds.headlines[0].charCount, 53);
    assert.equal(parsed.shopeeAds.headlines[0].isSafeLength, true);

    assert.ok(parsed.tiktokAds);
    assert.equal(parsed.tiktokAds.hooks.length, 1);
    assert.ok(parsed.tiktokAds.hooks[0].visualAction);
    assert.equal(parsed.tiktokAds.captions.length, 1);
    assert.ok(parsed.tiktokAds.hashtags.includes("#tainghe"));
  });

  it("hàm formatShopeeBulkKeywords trả về đúng chuỗi phân cách bởi dấu xuống dòng", () => {
    const kws = [
      { keyword: "tai nghe bluetooth", suggestedBid: "1.000đ", searchIntent: "Mua" },
      { keyword: "tai nghe anc", suggestedBid: "2.000đ", searchIntent: "Mua" },
    ];
    const bulk = formatShopeeBulkKeywords(kws);
    assert.equal(bulk, "tai nghe bluetooth\ntai nghe anc");
  });

  it("hàm charCount đo chính xác số ký tự", () => {
    assert.equal(charCount("  Tai Nghe AirPro 5  "), 17);
    assert.equal(charCount(""), 0);
  });

  it("buildOfflineAdCopyData sinh đầy đủ dữ liệu dự phòng chuẩn Shopee và TikTok Ads", () => {
    const offline = buildOfflineAdCopyData({
      adPlatform: "both",
      productName: "Tai Nghe AirPro 5",
      price: "350.000đ",
      usp: "Chống ồn 35dB, pin trâu 30h",
    });
    assert.ok(offline);
    assert.ok(offline.shopeeAds);
    assert.equal(offline.shopeeAds.headlines.length, 3);
    assert.ok(offline.shopeeAds.keywordMatrix.exactMatch.length >= 4);
    assert.ok(offline.shopeeAds.keywordMatrix.negativeKeywords.length >= 6);
    assert.ok(offline.tiktokAds);
    assert.equal(offline.tiktokAds.hooks.length, 5);
    assert.equal(offline.tiktokAds.captions.length, 5);
    assert.equal(offline.policyCompliance.safeScore, 98);
  });

  it("cleanAndValidateAdCopyOutput trả về chuỗi JSON hợp lệ kể cả khi input rỗng", () => {
    const validated = cleanAndValidateAdCopyOutput("", {
      adPlatform: "shopee",
      productName: "Áo Polo Nam",
      price: "199.000đ",
      usp: "Vải cá sấu thoáng khí",
    });
    assert.ok(validated);
    const parsed = JSON.parse(validated);
    assert.ok(parsed.shopeeAds);
  });
});

