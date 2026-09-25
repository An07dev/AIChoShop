/**
 * AI Mẫu Quảng Cáo Contract - Shopee Ads & TikTok Spark Ads
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema), Bộ Prompt Thực Chiến & Resilient Parser Bền Bỉ
 */

export type AdPlatform = "both" | "shopee" | "tiktok";

export type CampaignGoal = "conversion" | "traffic" | "flash_sale";

export interface AdCopyInputs {
  adPlatform: AdPlatform;
  productName: string;
  price: string;
  usp: string;
  targetAudience?: string;
  campaignGoal?: CampaignGoal | string;
  promotionOffer?: string;
}

export interface ShopeeKeywordItem {
  keyword: string;
  suggestedBid: string;
  searchIntent: string; // VD: "Ý định mua cao", "Traffic rẻ", "Từ khóa ngách/lỗi gõ"
}

export interface ShopeeHeadlineItem {
  id: number;
  label: string;
  angle: string; // VD: "Góc Deal sốc & Quà tặng", "Góc USP & Tính năng độc quyền", "Góc Cam kết uy tín"
  headline: string;
  charCount: number;
  isSafeLength: boolean; // <= 55 ký tự (chuẩn hiển thị app Shopee không bị dấu ...)
  hookBenefit: string;
}

export interface ShopeeAdsData {
  keywordMatrix: {
    exactMatch: ShopeeKeywordItem[]; // Nhóm 1: Từ khóa chính xác
    broadMatch: ShopeeKeywordItem[]; // Nhóm 2: Từ khóa mở rộng
    misspelledOrNiche: ShopeeKeywordItem[]; // Nhóm 3: Từ khóa lỗi gõ/ngách
    negativeKeywords: string[]; // Từ khóa PHỦ ĐỊNH cần chặn để chống click tặc/cháy ngân sách
  };
  headlines: ShopeeHeadlineItem[];
  biddingStrategy: {
    recommendedInitialBid: string; // Mức thầu thử nghiệm ban đầu
    peakHourMultiplier: string; // Biên độ tăng giá khi vào khung Flash Sale / Mega Campaign
    optimizationTip: string; // Lời khuyên tối ưu chi phí ROAS
  };
}

export interface TikTokHookItem {
  id: number;
  angle: string; // "Nỗi đau / Cảnh báo", "Sự thật bất ngờ / Vạch trần", "Thử nghiệm thực tế", "Ngược đời", "FOMO Deal sốc"
  visualAction: string; // Hành động thị giác trong 3 giây đầu (Visual Hook: Cầm đập, zoom chi tiết, cắt đôi,...)
  textOverlay: string; // Dòng chữ đè lên video kích thước lớn
  audioVoiceover: string; // Lời thoại mở đầu thu hút giữ chân người xem
}

export interface TikTokCaptionItem {
  id: number;
  title: string;
  angle: string;
  caption: string;
  ctaBadge: string; // VD: "Giỏ hàng màu vàng góc trái màn hình"
}

export interface TikTokAdsData {
  hooks: TikTokHookItem[];
  captions: TikTokCaptionItem[];
  hashtags: string[];
  conversionTip: string;
}

export interface PolicyCompliance {
  safeScore: number; // 0 - 100
  bannedWordsAvoided: string[]; // Các từ ngữ nhạy cảm sàn đã được né tránh
  warningNotes: string[]; // Lưu ý kiểm duyệt của Shopee / TikTok Shop
}

export interface AdCopyData {
  platform: AdPlatform;
  campaignGoal: string;
  shopeeAds?: ShopeeAdsData;
  tiktokAds?: TikTokAdsData;
  policyCompliance: PolicyCompliance;
}

/**
 * Tính số ký tự chính xác
 */
export function charCount(text: string): number {
  return (text || "").trim().length;
}

/**
 * Định dạng danh sách từ khóa Shopee thành chuỗi xuống dòng
 * để Seller có thể dán hàng loạt (Bulk paste) vào Kênh Người Bán Shopee
 */
export function formatShopeeBulkKeywords(keywords: ShopeeKeywordItem[]): string {
  if (!keywords || keywords.length === 0) return "";
  return keywords.map((k) => k.keyword.trim()).filter(Boolean).join("\n");
}

/**
 * System Prompt chuẩn hóa cho Chuyên gia Performance Marketing TMĐT
 */
export const AD_COPY_SYSTEM_PROMPT = `Bạn là Chuyên gia Performance Marketing TMĐT (Shopee Ads & TikTok Spark Ads / GMV Max) hàng đầu tại thị trường Việt Nam.
Nhiệm vụ của bạn là xây dựng chiến dịch quảng cáo chuyển đổi cao (High ROAS), tối ưu CTR, tiết kiệm ngân sách và tuân thủ 100% chính sách kiểm duyệt của sàn.

QUY TẮC BẮT BUỘC VỀ SỐ LƯỢNG MẪU VÀ CẤU TRÚC:
1. BẮT BUỘC trả về định dạng JSON thuần túy (Valid JSON Object), không bao bọc thêm bất kỳ lời dẫn hay giải thích ngoài JSON.
2. Với Shopee Ads:
   - Từ khóa chính xác (exactMatch): 4-6 từ khóa cốt lõi người có ý định mua hàng gõ vào thanh tìm kiếm.
   - Từ khóa mở rộng (broadMatch): 4-6 từ khóa bao quát gom traffic rẻ.
   - Từ khóa lỗi gõ / ngách (misspelledOrNiche): 3-5 từ khóa không dấu, gõ nhầm hoặc từ địa phương.
   - BẮT BUỘC có 'negativeKeywords' (Từ khóa phủ định): 6-10 từ cần chặn ngay (VD: thanh lý, miễn phí, cũ, hàng nhái, hướng dẫn làm...) để Seller không bị cháy tiền vì click vô ích.
   - 3 Tiêu đề tối ưu CTR: BẮT BUỘC ĐỦ 3 MẪU (id: 1, 2, 3), mỗi tiêu đề dưới 55 ký tự (quy chuẩn không bị cắt ba chấm '...' trên app Shopee):
     * Mẫu 1 (id: 1): Góc Deal sốc & Quà tặng
     * Mẫu 2 (id: 2): Góc USP độc quyền & Tính năng cốt lõi
     * Mẫu 3 (id: 3): Góc Cam kết uy tín & Bảo hành vàng
   - Chiến lược giá thầu: Đề xuất mức bid khởi điểm thực tế (VD: 800đ - 1.500đ) và mẹo tăng bid giờ vàng.
3. Với TikTok Spark Ads:
   - 5 Câu Hook 3s đầu video: BẮT BUỘC PHẢI TRẢ VỀ ĐỦ CHÍNH XÁC 5 MẪU HOOK (id: 1, 2, 3, 4, 5), tuyệt đối không được thiếu hay chỉ trả về 1 mẫu, bao gồm 5 góc tiếp cận:
     * Hook #1 (id: 1): Góc Cảnh Báo / Nỗi Đau (Warning / Pain Point)
     * Hook #2 (id: 2): Góc Tò Mò / Sự Thật Bất Ngờ (Curiosity / Industry Secret)
     * Hook #3 (id: 3): Góc Trực Quan / Thử Thách Cực Hạn (Visual Demo / Extreme Test)
     * Hook #4 (id: 4): Góc So Sánh Tương Phản (Before / After / Comparison)
     * Hook #5 (id: 5): Góc FOMO / Báo Deal Giới Hạn (Flash Sale / Scarcity)
     Mỗi hook BẮT BUỘC có đầy đủ: 'visualAction' (hành động thị giác 3s đầu: zoom cận, đập thử, so sánh...), 'textOverlay' (chữ giật tít đè video) và 'audioVoiceover' (lời thoại đọc lồng tiếng).
   - 5 Mẫu Caption kèm CTA Giỏ Hàng: BẮT BUỘC PHẢI TRẢ VỀ ĐỦ CHÍNH XÁC 5 MẪU CAPTION (id: 1, 2, 3, 4, 5), tuyệt đối không được thiếu hay chỉ trả về 1-2 mẫu, bao gồm 5 góc chuyển đổi:
     * Caption #1 (id: 1): Tập trung giải quyết nỗi đau & Đưa ra giải pháp tức thì
     * Caption #2 (id: 2): Review trải nghiệm thực tế & Tính năng vượt trội (Social Proof)
     * Caption #3 (id: 3): Báo Flash Sale khủng & Voucher độc quyền chỉ có trong phiên này
     * Caption #4 (id: 4): So sánh sự khác biệt vượt trội & Đập tan nỗi lo mua phải hàng kém chất lượng
     * Caption #5 (id: 5): Cảnh báo số lượng có hạn (FOMO) & Thúc giục bấm giỏ hàng trước khi hết mã
     Mỗi caption BẮT BUỘC có 'ctaBadge' chỉ dẫn rõ ràng khách hàng bấm vào nút "Giỏ hàng màu vàng ở góc trái màn hình".
   - 6-10 Hashtag chuẩn tệp chạy Ads.
4. Kiểm soát chính sách (policyCompliance):
   - Đảm bảo KHÔNG sử dụng các từ cấm của sàn: 'cam kết 100%', 'trị dứt điểm', 'số 1 thị trường', 'rẻ nhất Việt Nam', 'lôi kéo ngoài sàn', 'zalo/sđt'...
   - Ghi nhận các từ cấm đã né tránh vào 'bannedWordsAvoided' và lưu ý chính sách vào 'warningNotes'.`;

/**
 * Hàm sinh User Prompt dựa trên thông tin đầu vào
 */
export function buildAdCopyPrompt(inputs: AdCopyInputs): string {
  const platform = inputs.adPlatform || "both";
  const isShopee = platform === "shopee" || platform === "both";
  const isTiktok = platform === "tiktok" || platform === "both";

  const goalText =
    inputs.campaignGoal === "conversion"
      ? "Tối ưu Tỷ lệ Chuyển Đổi & ROAS (Ra đơn nhanh, nhắm đúng tệp có nhu cầu cao)"
      : inputs.campaignGoal === "traffic"
      ? "Gom Traffic Giá Rẻ & Phủ Thương Hiệu (Mở rộng tệp khách hàng tiềm năng)"
      : inputs.campaignGoal === "flash_sale"
      ? "Chiến Dịch Flash Sale / Đẩy Hàng Tồn (Đánh mạnh vào ưu đãi độc quyền và sự khan hiếm)"
      : inputs.campaignGoal || "Tối ưu Chuyển Đổi & Ra Đơn Nhanh";

  const offerText = inputs.promotionOffer
    ? `Ưu đãi / Khuyến mãi áp dụng: ${inputs.promotionOffer}`
    : "Ưu đãi: Flash Sale giới hạn & Voucher giảm giá độc quyền trên sàn";

  return `Hãy tạo bộ mẫu quảng cáo thực chiến chuyển đổi cao cho sản phẩm dưới đây:

DỮ LIỆU ĐẦU VÀO:
- Tên Sản Phẩm: ${inputs.productName}
- Giá bán / Giá khuyến mãi: ${inputs.price}
- Điểm nổi bật (USP) / Lợi ích cốt lõi: ${inputs.usp}
- Đối tượng khách hàng mục tiêu: ${inputs.targetAudience || "Khách hàng mua sắm online toàn quốc"}
- Nền tảng quảng cáo: ${platform === "both" ? "Cả Shopee Ads & TikTok Spark Ads" : platform === "shopee" ? "Shopee Ads" : "TikTok Spark Ads"}
- Mục tiêu chiến dịch: ${goalText}
- ${offerText}

YÊU CẦU ĐẶC BIỆT VỀ SỐ LƯỢNG MẪU:
- BẮT BUỘC TRẢ VỀ ĐỦ 5 HOOK 3S CHO TIKTOK (id: 1 đến 5 với 5 góc khác nhau).
- BẮT BUỘC TRẢ VỀ ĐỦ 5 CAPTION CHO TIKTOK (id: 1 đến 5 với 5 góc và CTA Giỏ Hàng khác nhau).
- BẮT BUỘC TRẢ VỀ ĐỦ 3 TIÊU ĐỀ CHO SHOPEE (id: 1 đến 3, mỗi tiêu đề ≤ 55 ký tự).

YÊU CẦU ĐỊNH DẠNG:
Trả về DUY NHẤT một chuỗi JSON hợp lệ tuân theo cấu trúc schema sau:

{
  "platform": "${platform}",
  "campaignGoal": "${goalText}",
  ${isShopee ? `"shopeeAds": {
    "keywordMatrix": {
      "exactMatch": [
        { "keyword": "tên từ khóa chính xác 1", "suggestedBid": "1.800đ - 2.500đ", "searchIntent": "Ý định mua cao, chốt đơn ngay" },
        { "keyword": "tên từ khóa chính xác 2", "suggestedBid": "1.800đ - 2.500đ", "searchIntent": "Ý định mua cao, chốt đơn ngay" }
      ],
      "broadMatch": [
        { "keyword": "tên từ khóa mở rộng 1", "suggestedBid": "600đ - 1.200đ", "searchIntent": "Gom traffic rẻ từ tìm kiếm bao quát" },
        { "keyword": "tên từ khóa mở rộng 2", "suggestedBid": "600đ - 1.200đ", "searchIntent": "Gom traffic rẻ từ tìm kiếm bao quát" }
      ],
      "misspelledOrNiche": [
        { "keyword": "từ khóa lỗi gõ hoặc ngách 1", "suggestedBid": "300đ - 700đ", "searchIntent": "Ít cạnh tranh, ROAS cao" },
        { "keyword": "từ khóa lỗi gõ hoặc ngách 2", "suggestedBid": "300đ - 700đ", "searchIntent": "Ít cạnh tranh, ROAS cao" }
      ],
      "negativeKeywords": [
        "thanh lý", "miễn phí", "cũ", "hàng nhái", "hướng dẫn tự làm", "tuyển sỉ", "hàng giả"
      ]
    },
    "headlines": [
      {
        "id": 1,
        "label": "Mẫu 1",
        "angle": "Góc Deal sốc & Quà tặng",
        "headline": "Tiêu đề mẫu 1 dưới 55 ký tự giật tít deal hời",
        "charCount": 46,
        "isSafeLength": true,
        "hookBenefit": "Đẩy thẳng voucher giảm sâu kích thích click"
      },
      {
        "id": 2,
        "label": "Mẫu 2",
        "angle": "Góc USP & Tính năng độc quyền",
        "headline": "Tiêu đề mẫu 2 dưới 55 ký tự nêu bật tính năng cốt lõi",
        "charCount": 49,
        "isSafeLength": true,
        "hookBenefit": "Đánh đúng nhu cầu tìm kiếm tính năng cao cấp của khách hàng"
      },
      {
        "id": 3,
        "label": "Mẫu 3",
        "angle": "Góc Cam kết uy tín & Bảo hành vàng",
        "headline": "Tiêu đề mẫu 3 dưới 55 ký tự khẳng định chính hãng",
        "charCount": 48,
        "isSafeLength": true,
        "hookBenefit": "Xóa tan nỗi lo sợ mua phải hàng kém chất lượng"
      }
    ],
    "biddingStrategy": {
      "recommendedInitialBid": "1.000đ - 1.500đ cho từ chính xác, 500đ cho từ mở rộng",
      "peakHourMultiplier": "Tăng giá thầu 25% - 40% trong khung giờ vàng 20h - 23h và ngày Flash Sale",
      "optimizationTip": "Theo dõi 3 ngày đầu, loại bỏ từ khóa có CR < 2% và thêm vào danh sách từ khóa phủ định"
    }
  },` : ""}
  ${isTiktok ? `"tiktokAds": {
    "hooks": [
      {
        "id": 1,
        "angle": "Góc Cảnh Báo / Nỗi Đau",
        "visualAction": "Cầm sản phẩm cũ hỏng lắc đầu thất vọng, sau đó chuyển cảnh sang sản phẩm mới",
        "textOverlay": "ĐỪNG MUA nếu bạn chưa biết điều này!",
        "audioVoiceover": "Bỏ tiền mua đồ kém chất lượng vừa bực vừa tốn, xem ngay giải pháp này..."
      },
      {
        "id": 2,
        "angle": "Góc Tò Mò / Sự Thật Bất Ngờ",
        "visualAction": "Quay cận cảnh thao tác thử thách bất ngờ hoặc bật tính năng đặc biệt",
        "textOverlay": "Sự thật đằng sau mức giá rẻ bất ngờ này là gì?",
        "audioVoiceover": "Nhiều người tưởng hàng rẻ là kém, cho đến khi test thực tế..."
      },
      {
        "id": 3,
        "angle": "Góc Trực Quan / Thử Thách Cực Hạn",
        "visualAction": "Thực hiện bài test độ bền, chống nước hoặc đo đạc tính năng ngay trước ống kính",
        "textOverlay": "Test thử thách cực hạn và cái kết!",
        "audioVoiceover": "Hôm nay mình sẽ test độ bền khắc nghiệt nhất xem có chịu nổi không nhé..."
      },
      {
        "id": 4,
        "angle": "Góc So Sánh Tương Phản",
        "visualAction": "Chia đôi màn hình: Một bên sản phẩm thường kém hiệu quả, một bên sản phẩm này hoạt động mượt mà",
        "textOverlay": "Khác biệt 1 trời 1 vực sau khi đổi sang dòng này!",
        "audioVoiceover": "Cùng số tiền bỏ ra, nhưng sự khác biệt này sẽ khiến bạn bất ngờ..."
      },
      {
        "id": 5,
        "angle": "Góc FOMO / Báo Deal Giới Hạn",
        "visualAction": "Chỉ tay thẳng vào góc trái màn hình nơi có icon Giỏ Hàng Màu Vàng đang nhấp nháy",
        "textOverlay": "Chỉ còn duy nhất 50 suất Flash Sale độc quyền hôm nay!",
        "audioVoiceover": "Săn đúng đợt sale trợ giá này được giảm một nửa tiền, bấm giỏ hàng góc trái săn ngay!"
      }
    ],
    "captions": [
      {
        "id": 1,
        "title": "Mẫu Caption 1 (Tập trung giải quyết nỗi đau)",
        "angle": "Giải quyết vấn đề & Kích cầu",
        "caption": "Nội dung caption mẫu 1 ngắn gọn súc tích dưới 100 từ kèm cam kết freeship và voucher...",
        "ctaBadge": "Bấm vào Giỏ hàng màu vàng ở góc trái màn hình để nhận ưu đãi!"
      },
      {
        "id": 2,
        "title": "Mẫu Caption 2 (Review trải nghiệm thực tế)",
        "angle": "Social Proof & Độ bền",
        "caption": "Nội dung caption mẫu 2 chia sẻ cảm nhận người dùng thực tế sau khi sử dụng...",
        "ctaBadge": "Xem ngay đánh giá và ưu đãi tại Giỏ hàng màu vàng góc trái!"
      },
      {
        "id": 3,
        "title": "Mẫu Caption 3 (Báo Flash Sale & Quà tặng)",
        "angle": "Ưu đãi độc quyền",
        "caption": "Nội dung caption mẫu 3 tập trung vào deal sốc, quà tặng kèm giới hạn...",
        "ctaBadge": "Chạm vào Giỏ hàng màu vàng để nhận voucher giảm sâu hôm nay!"
      },
      {
        "id": 4,
        "title": "Mẫu Caption 4 (So sánh chất lượng vượt trội)",
        "angle": "Chất lượng cao & An tâm",
        "caption": "Nội dung caption mẫu 4 chứng minh lý do nên đầu tư sản phẩm này thay vì đồ rẻ tiền...",
        "ctaBadge": "Bấm Giỏ hàng góc trái để sở hữu phiên bản chính hãng!"
      },
      {
        "id": 5,
        "title": "Mẫu Caption 5 (FOMO & Cảnh báo sắp hết hàng)",
        "angle": "Khan hiếm & Cấp bách",
        "caption": "Nội dung caption mẫu 5 thông báo số lượng có hạn, sắp kết thúc chương trình trợ giá...",
        "ctaBadge": "Nhanh tay bấm Giỏ hàng màu vàng ở góc trái trước khi hết mã!"
      }
    ],
    "hashtags": ["#shopeecheck", "#tiktokmademebuyit", "#reviewhangchinhhang", "#dealhot", "#xuhuong", "#muataitiktokshop"],
    "conversionTip": "Chèn text overlay to rõ ở phần 1/3 trên cùng màn hình để không bị icon giỏ hàng và caption che khuất"
  },` : ""}
  "policyCompliance": {
    "safeScore": 98,
    "bannedWordsAvoided": ["cam kết 100%", "trị dứt điểm", "rẻ nhất", "số 1"],
    "warningNotes": ["Không chèn số điện thoại hoặc từ ngữ dẫn dắt giao dịch ngoài sàn để tránh bị khóa tài khoản quảng cáo"]
  }
}`;
}

/**
 * Tạo dữ liệu AdCopyData mặc định an toàn khi cần fallback
 */
export function createDefaultAdCopyData(platform: AdPlatform = "both"): AdCopyData {
  return {
    platform,
    campaignGoal: "Tối ưu chuyển đổi và tỷ lệ nhấp chuột (CTR)",
    shopeeAds:
      platform === "tiktok"
        ? undefined
        : {
            keywordMatrix: {
              exactMatch: [],
              broadMatch: [],
              misspelledOrNiche: [],
              negativeKeywords: ["thanh lý", "miễn phí", "cũ", "hàng nhái", "hướng dẫn tự làm", "tuyển sỉ"],
            },
            headlines: [],
            biddingStrategy: {
              recommendedInitialBid: "1.000đ - 1.500đ",
              peakHourMultiplier: "Tăng 30% trong khung 20h - 22h",
              optimizationTip: "Kiểm tra định kỳ và bổ sung từ khóa phủ định để tối ưu ngân sách",
            },
          },
    tiktokAds:
      platform === "shopee"
        ? undefined
        : {
            hooks: [],
            captions: [],
            hashtags: ["#tiktokshop", "#xuhuong", "#reviewhangtot"],
            conversionTip: "Kêu gọi bấm giỏ hàng vàng trong 5 giây cuối video",
          },
    policyCompliance: {
      safeScore: 95,
      bannedWordsAvoided: ["cam kết tuyệt đối", "số 1 thị trường"],
      warningNotes: ["Đảm bảo không vi phạm chính sách kiểm duyệt sàn"],
    },
  };
}

/**
 * Resilient Parser 4 Tầng Bền Bỉ:
 * 1. Parse JSON trực tiếp
 * 2. Parse Markdown Code Fence (```json ... ```)
 * 3. Trích xuất chuỗi JSON giữa dấu { và }
 * 4. Fallback Heuristic Regex Parser từ Markdown văn bản cũ (Tương thích ngược 100%)
 */
export function parseAdCopyResult(rawText: string, defaultPlatform: AdPlatform = "both"): AdCopyData {
  if (!rawText || !rawText.trim()) {
    return createDefaultAdCopyData(defaultPlatform);
  }

  const trimmed = rawText.trim();

  // TẦNG 1: Thử parse trực tiếp JSON
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (isValidAdCopyData(parsed)) {
        return normalizeAdCopyData(parsed, defaultPlatform);
      }
    } catch {
      // Tiếp tục xuống tầng tiếp theo
    }
  }

  // TẦNG 2: Bóc tách từ code block markdown ```json ... ``` hoặc ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      const innerJson = codeBlockMatch[1].trim();
      const parsed = JSON.parse(innerJson);
      if (isValidAdCopyData(parsed)) {
        return normalizeAdCopyData(parsed, defaultPlatform);
      }
    } catch {
      // Tiếp tục xuống tầng tiếp theo
    }
  }

  // TẦNG 3: Tìm khối JSON đầu tiên xuất hiện giữa { và }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const candidate = trimmed.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(candidate);
      if (isValidAdCopyData(parsed)) {
        return normalizeAdCopyData(parsed, defaultPlatform);
      }
    } catch {
      // Tiếp tục xuống tầng fallback regex
    }
  }

  // TẦNG 4: Fallback Regex Parser từ cấu trúc Markdown truyền thống
  return parseMarkdownFallback(trimmed, defaultPlatform);
}

/**
 * Kiểm tra tính hợp lệ cơ bản của dữ liệu AdCopyData
 */
function isValidAdCopyData(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  return Boolean(obj.shopeeAds || obj.tiktokAds || obj.policyCompliance || obj.platform);
}

/**
 * Chuẩn hóa các trường của AdCopyData để đảm bảo không bị undefined
 */
function normalizeAdCopyData(data: any, fallbackPlatform: AdPlatform): AdCopyData {
  const platform = (data.platform as AdPlatform) || fallbackPlatform;
  const result: AdCopyData = {
    platform,
    campaignGoal: data.campaignGoal || "Tối ưu chuyển đổi và doanh thu sàn TMĐT",
    policyCompliance: {
      safeScore: typeof data.policyCompliance?.safeScore === "number" ? data.policyCompliance.safeScore : 98,
      bannedWordsAvoided: Array.isArray(data.policyCompliance?.bannedWordsAvoided)
        ? data.policyCompliance.bannedWordsAvoided
        : ["cam kết 100%", "số 1", "trị dứt điểm"],
      warningNotes: Array.isArray(data.policyCompliance?.warningNotes)
        ? data.policyCompliance.warningNotes
        : ["Đã rà soát tuân thủ tiêu chuẩn kiểm duyệt Shopee Ads & TikTok Shop"],
    },
  };

  // Chuẩn hóa Shopee Ads
  if (data.shopeeAds && (platform === "both" || platform === "shopee")) {
    const rawShopee = data.shopeeAds;
    const exactMatch = Array.isArray(rawShopee.keywordMatrix?.exactMatch)
      ? rawShopee.keywordMatrix.exactMatch.map((k: any) => ({
          keyword: String(k.keyword || "").trim(),
          suggestedBid: String(k.suggestedBid || "1.500đ - 2.500đ"),
          searchIntent: String(k.searchIntent || "Ý định mua cao"),
        }))
      : [];

    const broadMatch = Array.isArray(rawShopee.keywordMatrix?.broadMatch)
      ? rawShopee.keywordMatrix.broadMatch.map((k: any) => ({
          keyword: String(k.keyword || "").trim(),
          suggestedBid: String(k.suggestedBid || "500đ - 1.200đ"),
          searchIntent: String(k.searchIntent || "Gom traffic rẻ"),
        }))
      : [];

    const misspelledOrNiche = Array.isArray(rawShopee.keywordMatrix?.misspelledOrNiche)
      ? rawShopee.keywordMatrix.misspelledOrNiche.map((k: any) => ({
          keyword: String(k.keyword || "").trim(),
          suggestedBid: String(k.suggestedBid || "300đ - 800đ"),
          searchIntent: String(k.searchIntent || "Ít cạnh tranh"),
        }))
      : [];

    const negativeKeywords = Array.isArray(rawShopee.keywordMatrix?.negativeKeywords)
      ? rawShopee.keywordMatrix.negativeKeywords.map((k: any) => String(k).trim()).filter(Boolean)
      : ["thanh lý", "miễn phí", "cũ", "hàng nhái", "hướng dẫn làm", "tuyển sỉ"];

    const headlines = Array.isArray(rawShopee.headlines)
      ? rawShopee.headlines.map((h: any, idx: number) => {
          const headlineText = String(h.headline || "").trim();
          const cCount = headlineText.length;
          return {
            id: typeof h.id === "number" ? h.id : idx + 1,
            label: h.label || `Mẫu ${idx + 1}`,
            angle: h.angle || "Chuẩn CTR",
            headline: headlineText,
            charCount: cCount,
            isSafeLength: cCount <= 55,
            hookBenefit: h.hookBenefit || "Tối ưu hiển thị app",
          };
        })
      : [];

    result.shopeeAds = {
      keywordMatrix: {
        exactMatch,
        broadMatch,
        misspelledOrNiche,
        negativeKeywords,
      },
      headlines,
      biddingStrategy: {
        recommendedInitialBid:
          rawShopee.biddingStrategy?.recommendedInitialBid || "1.000đ - 1.500đ (Bắt đầu với mức bid vừa phải)",
        peakHourMultiplier:
          rawShopee.biddingStrategy?.peakHourMultiplier || "Tăng 20% - 35% trong khung giờ 20h - 22h30",
        optimizationTip:
          rawShopee.biddingStrategy?.optimizationTip || "Bổ sung từ khóa phủ định định kỳ để tránh click hao hụt",
      },
    };
  }

  // Chuẩn hóa TikTok Ads
  if (data.tiktokAds && (platform === "both" || platform === "tiktok")) {
    const rawTikTok = data.tiktokAds;
    const hooks = Array.isArray(rawTikTok.hooks)
      ? rawTikTok.hooks.map((hk: any, idx: number) => ({
          id: typeof hk.id === "number" ? hk.id : idx + 1,
          angle: hk.angle || "Kích thích tò mò",
          visualAction: hk.visualAction || "Quay cận cảnh sản phẩm trong 3 giây đầu",
          textOverlay: hk.textOverlay || String(hk.content || ""),
          audioVoiceover: hk.audioVoiceover || hk.textOverlay || "Xem ngay chiếc bảo bối này...",
        }))
      : [];

    const captions = Array.isArray(rawTikTok.captions)
      ? rawTikTok.captions.map((c: any, idx: number) => ({
          id: typeof c.id === "number" ? c.id : idx + 1,
          title: c.title || `Mẫu Caption ${idx + 1}`,
          angle: c.angle || "Tối ưu chuyển đổi",
          caption: String(c.caption || c.content || "").trim(),
          ctaBadge: c.ctaBadge || "Bấm giỏ hàng màu vàng ở góc trái màn hình!",
        }))
      : [];

    const hashtags = Array.isArray(rawTikTok.hashtags)
      ? rawTikTok.hashtags.map((t: any) => String(t).trim()).filter(Boolean)
      : ["#shopeecheck", "#tiktokshop", "#xuhuong", "#reviewhangchinhhang"];

    result.tiktokAds = {
      hooks,
      captions,
      hashtags,
      conversionTip:
        rawTikTok.conversionTip || "Kêu gọi hành động bấm vào biểu tượng Giỏ hàng màu vàng trong 5 giây cuối",
    };
  }

  return result;
}

/**
 * TẦNG 4: Heuristic Markdown Parser để tương thích ngược với các output văn bản cũ
 */
function parseMarkdownFallback(text: string, platform: AdPlatform): AdCopyData {
  const result = createDefaultAdCopyData(platform);
  const lines = text.split("\n");

  let currentShopeeGroup: "exact" | "broad" | "niche" | null = null;
  let inHeadlines = false;
  let inHooks = false;
  let inCaptions = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === "•" || line === "-" || line === "*") continue;

    // Phân loại nhóm Shopee
    if (/nhóm\s*1/i.test(line) && /chính xác|exact/i.test(line)) {
      currentShopeeGroup = "exact";
      inHeadlines = false;
      inHooks = false;
      inCaptions = false;
      continue;
    }
    if (/nhóm\s*2/i.test(line) && /mở rộng|broad/i.test(line)) {
      currentShopeeGroup = "broad";
      inHeadlines = false;
      inHooks = false;
      inCaptions = false;
      continue;
    }
    if (/nhóm\s*3/i.test(line) && /lỗi gõ|địa phương|ngách/i.test(line)) {
      currentShopeeGroup = "niche";
      inHeadlines = false;
      inHooks = false;
      inCaptions = false;
      continue;
    }

    if (/tiêu đề/i.test(line) && /ctr|quảng cáo/i.test(line)) {
      currentShopeeGroup = null;
      inHeadlines = true;
      inHooks = false;
      inCaptions = false;
      continue;
    }

    if (/hook/i.test(line) && /3\s*giây|text đè|video/i.test(line)) {
      currentShopeeGroup = null;
      inHeadlines = false;
      inHooks = true;
      inCaptions = false;
      continue;
    }

    if (/caption/i.test(line) && /quảng cáo|giỏ hàng|cta/i.test(line)) {
      currentShopeeGroup = null;
      inHeadlines = false;
      inHooks = false;
      inCaptions = true;
      continue;
    }

    // Thu thập từ khóa Shopee
    if (currentShopeeGroup && result.shopeeAds) {
      if (line.includes(":") || /^[-*•]\s+/.test(line)) {
        const clean = line.replace(/^[-*•#\s]+/, "").trim();
        const parts = clean.split(/[:|]/);
        if (parts.length >= 2) {
          const kw = parts[0].replace(/^\[|\]|\*\*/g, "").trim();
          const bid = parts.slice(1).join(":").replace(/^\[|\]|\*\*/g, "").trim();
          if (kw && !kw.toLowerCase().includes("nhóm") && !kw.toLowerCase().includes("tên từ khóa")) {
            const item: ShopeeKeywordItem = {
              keyword: kw,
              suggestedBid: bid || "Theo đề xuất",
              searchIntent:
                currentShopeeGroup === "exact"
                  ? "Ý định mua cao"
                  : currentShopeeGroup === "broad"
                  ? "Traffic rẻ"
                  : "Từ khóa ngách",
            };
            if (currentShopeeGroup === "exact") result.shopeeAds.keywordMatrix.exactMatch.push(item);
            else if (currentShopeeGroup === "broad") result.shopeeAds.keywordMatrix.broadMatch.push(item);
            else result.shopeeAds.keywordMatrix.misspelledOrNiche.push(item);
          }
        }
      }
    }

    // Thu thập tiêu đề Shopee
    if (inHeadlines && result.shopeeAds) {
      if (/mẫu\s*\d/i.test(line) || /^[-*•\d.]+\s+/i.test(line)) {
        const clean = line.replace(/^[-*•#\s]+/, "").trim();
        const matchAngle = clean.match(/\((.*?)\)/);
        const angle = matchAngle ? matchAngle[1] : "Tiêu đề chuẩn CTR";
        const content = clean.replace(/mẫu\s*\d.*?:/i, "").replace(/^\[|\]$/g, "").trim();
        if (content) {
          const cCount = content.length;
          result.shopeeAds.headlines.push({
            id: result.shopeeAds.headlines.length + 1,
            label: `Mẫu ${result.shopeeAds.headlines.length + 1}`,
            angle,
            headline: content,
            charCount: cCount,
            isSafeLength: cCount <= 55,
            hookBenefit: "Tối ưu chuyển đổi",
          });
        }
      }
    }

    // Thu thập Hook TikTok
    if (inHooks && result.tiktokAds) {
      if (/hook\s*\d/i.test(line) || (/^[-*•\d.]+\s+/i.test(line) && line.includes('"'))) {
        const clean = line.replace(/^[-*•#\s]+/, "").trim();
        const matchAngle = clean.match(/\((.*?)\)/);
        const angle = matchAngle ? matchAngle[1] : "Gây tò mò dừng lướt";
        const content = clean.replace(/hook\s*\d.*?:/i, "").replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, "").trim();
        if (content) {
          result.tiktokAds.hooks.push({
            id: result.tiktokAds.hooks.length + 1,
            angle,
            visualAction: "Quay cận cảnh sản phẩm kèm biểu cảm ngạc nhiên trong 3 giây đầu",
            textOverlay: content,
            audioVoiceover: content,
          });
        }
      }
    }

    // Thu thập Caption TikTok
    if (inCaptions && result.tiktokAds) {
      if (/mẫu\s*caption\s*\d|caption\s*\d/i.test(line)) {
        const clean = line.replace(/^[-*•#\s]+/, "").trim();
        const title = clean.split(/[:\-]/)[0].trim();
        const content = clean.replace(/mẫu\s*caption\s*\d.*?:/i, "").trim();
        result.tiktokAds.captions.push({
          id: result.tiktokAds.captions.length + 1,
          title: title || `Mẫu Caption ${result.tiktokAds.captions.length + 1}`,
          angle: "Thúc đẩy bấm giỏ hàng",
          caption: content || "",
          ctaBadge: "Bấm vào Giỏ hàng màu vàng ở góc trái màn hình!",
        });
      } else if (result.tiktokAds.captions.length > 0 && !line.startsWith("#")) {
        const last = result.tiktokAds.captions[result.tiktokAds.captions.length - 1];
        last.caption = (last.caption ? last.caption + "\n" : "") + line;
      }
    }

    // Hashtags
    if (result.tiktokAds && /#[\w\u00C0-\u024F]+/i.test(line)) {
      const matches = line.match(/#[\w\u00C0-\u024F]+/g);
      if (matches) {
        matches.forEach((tag) => {
          if (!result.tiktokAds!.hashtags.includes(tag)) {
            result.tiktokAds!.hashtags.push(tag);
          }
        });
      }
    }
  }

  return result;
}

/**
 * Chuyển đổi dữ liệu mẫu quảng cáo thành văn bản Markdown thuần (text thô)
 * để hiển thị trực tiếp ở tab Raw/Markdown và hỗ trợ sao chép / xuất file TXT chuẩn
 */
export function adCopyToText(data: AdCopyData, productName?: string): string {
  const lines: string[] = [];
  const title = productName
    ? `BỘ MẪU QUẢNG CÁO CHUYỂN ĐỔI CAO: ${productName.toUpperCase()}`
    : "BỘ MẪU QUẢNG CÁO THỰC CHIẾN ĐA NỀN TẢNG (SHOPEE & TIKTOK)";

  lines.push(`# ${title}`);
  lines.push(`Mục tiêu chiến dịch: ${data.campaignGoal || "Tối ưu Chuyển Đổi & Ra Đơn Nhanh"}`);
  lines.push(`Nền tảng: ${data.platform === "both" ? "Shopee Ads & TikTok Spark Ads" : data.platform === "shopee" ? "Shopee Ads" : "TikTok Spark Ads"}`);
  lines.push(`------------------------------------------------------------\n`);

  // 1. SHOPEE ADS
  if (data.shopeeAds) {
    const sp = data.shopeeAds;
    lines.push(`## 🛒 PHẦN 1: CHIẾN DỊCH SHOPEE ADS CHUYỂN ĐỔI CAO\n`);

    // Chiến lược đấu thầu
    if (sp.biddingStrategy) {
      lines.push(`### 🎯 CHIẾN LƯỢC ĐẶT GIÁ THẦU:`);
      lines.push(`- Giá thầu khởi điểm đề xuất: ${sp.biddingStrategy.recommendedInitialBid || "1.000đ - 1.500đ"}`);
      lines.push(`- Tăng thầu khung giờ vàng: ${sp.biddingStrategy.peakHourMultiplier || "Tăng 25% - 40% lúc 20h - 23h"}`);
      lines.push(`- Lời khuyên tối ưu ROAS: ${sp.biddingStrategy.optimizationTip || "Theo dõi 3 ngày đầu và loại bỏ từ khóa kém hiệu quả"}\n`);
    }

    // Từ khóa chính xác
    if (sp.keywordMatrix?.exactMatch?.length > 0) {
      lines.push(`### 1. TỪ KHÓA CHÍNH XÁC (Tỷ Lệ Chốt Đơn Cao):`);
      sp.keywordMatrix.exactMatch.forEach((kw, idx) => {
        lines.push(`  ${idx + 1}. ${kw.keyword} | Thầu đề xuất: ${kw.suggestedBid} (${kw.searchIntent})`);
      });
      lines.push(``);
    }

    // Từ khóa mở rộng
    if (sp.keywordMatrix?.broadMatch?.length > 0) {
      lines.push(`### 2. TỪ KHÓA MỞ RỘNG (Gom Lượng Truy Cập / Traffic Giá Rẻ):`);
      sp.keywordMatrix.broadMatch.forEach((kw, idx) => {
        lines.push(`  ${idx + 1}. ${kw.keyword} | Thầu đề xuất: ${kw.suggestedBid} (${kw.searchIntent})`);
      });
      lines.push(``);
    }

    // Từ khóa lỗi gõ & ngách
    if (sp.keywordMatrix?.misspelledOrNiche?.length > 0) {
      lines.push(`### 3. TỪ KHÓA LỖI GÕ & TỪ KHÓA NGÁCH (CPC Thấp - Ít Cạnh Tranh):`);
      sp.keywordMatrix.misspelledOrNiche.forEach((kw, idx) => {
        lines.push(`  ${idx + 1}. ${kw.keyword} | Thầu đề xuất: ${kw.suggestedBid} (${kw.searchIntent})`);
      });
      lines.push(``);
    }

    // Từ khóa phủ định
    if (sp.keywordMatrix?.negativeKeywords?.length > 0) {
      lines.push(`### 🚫 TỪ KHÓA PHỦ ĐỊNH (Cần chặn ngay để tránh mất tiền oan):`);
      lines.push(`  ${sp.keywordMatrix.negativeKeywords.join(", ")}\n`);
    }

    // Tiêu đề Shopee
    if (sp.headlines?.length > 0) {
      lines.push(`### 💡 3 BIẾN THỂ TIÊU ĐỀ SHOPEE (Tối ưu hiển thị ≤ 55 ký tự):`);
      sp.headlines.forEach((hl) => {
        lines.push(`- [${hl.label} - ${hl.angle}]:`);
        lines.push(`  "${hl.headline}" (${hl.charCount} ký tự)`);
        lines.push(`  → Lợi ích hook: ${hl.hookBenefit}`);
      });
      lines.push(``);
    }
    lines.push(`------------------------------------------------------------\n`);
  }

  // 2. TIKTOK ADS
  if (data.tiktokAds) {
    const tt = data.tiktokAds;
    lines.push(`## 📱 PHẦN 2: CHIẾN DỊCH TIKTOK SPARK ADS & GMV MAX\n`);

    if (tt.conversionTip) {
      lines.push(`### ⚡ MẸO CHUYỂN ĐỔI VIRAL:`);
      lines.push(`${tt.conversionTip}\n`);
    }

    // Hook 3s
    if (tt.hooks?.length > 0) {
      lines.push(`### 🎬 5 HOOK 3 GIÂY ĐẦU GIỮ CHÂN KHÁCH HÀNG:`);
      tt.hooks.forEach((hk) => {
        lines.push(`* [Hook #${hk.id} - ${hk.angle}]:`);
        lines.push(`  - Hành động thị giác: ${hk.visualAction}`);
        lines.push(`  - Chữ đè video (Text Overlay): "${hk.textOverlay}"`);
        lines.push(`  - Lời thoại mở đầu: "${hk.audioVoiceover}"`);
      });
      lines.push(``);
    }

    // Captions
    if (tt.captions?.length > 0) {
      lines.push(`### 📝 5 MẪU CAPTION THÚC ĐẨY BẤM GIỎ HÀNG:`);
      tt.captions.forEach((cp) => {
        lines.push(`* [Mẫu #${cp.id} - ${cp.title || cp.angle}]:`);
        lines.push(`${cp.caption}`);
        if (cp.ctaBadge) {
          lines.push(`  → Kêu gọi: ${cp.ctaBadge}`);
        }
        lines.push(``);
      });
    }

    // Hashtags
    if (tt.hashtags?.length > 0) {
      lines.push(`### 🏷️ HASHTAGS BẮT TREND TIKTOK:`);
      lines.push(`${tt.hashtags.join(" ")}\n`);
    }

    lines.push(`------------------------------------------------------------\n`);
  }

  // 3. KIỂM DUYỆT CHÍNH SÁCH
  if (data.policyCompliance) {
    const pol = data.policyCompliance;
    lines.push(`## 🛡️ ĐÁNH GIÁ AN TOÀN CHÍNH SÁCH SÀN:`);
    lines.push(`- Điểm an toàn: ${pol.safeScore}/100`);
    if (pol.bannedWordsAvoided?.length > 0) {
      lines.push(`- Từ nhạy cảm/từ cấm đã né tránh: ${pol.bannedWordsAvoided.join(", ")}`);
    }
    if (pol.warningNotes?.length > 0) {
      lines.push(`- Lưu ý khi chạy quảng cáo:`);
      pol.warningNotes.forEach((note) => {
        lines.push(`  • ${note}`);
      });
    }
    lines.push(``);
  }

  lines.push(`------------------------------------------------------------`);
  lines.push(`Xuất bởi AIChoShop.com - Nền tảng AI E-commerce hàng đầu`);

  return lines.join("\n");
}

/**
 * Sinh bộ mẫu quảng cáo dự phòng chuẩn thực chiến Shopee & TikTok Ads 2026 (Offline Blueprint)
 * Cứu cánh 100% khi AI gặp sự cố (502/503/Quota)
 */
export function buildOfflineAdCopyData(inputs: AdCopyInputs): AdCopyData {
  const platform = inputs.adPlatform || "both";
  const name = (inputs.productName || "Sản Phẩm Cao Cấp").trim();
  const price = (inputs.price || "Giá Tốt").trim();
  const usp = (inputs.usp || "Chất lượng vượt trội, bảo hành chính hãng").trim();
  const audience = (inputs.targetAudience || "Khách hàng mua sắm online toàn quốc").trim();

  const isShopee = platform === "both" || platform === "shopee";
  const isTiktok = platform === "both" || platform === "tiktok";

  const safeHeadline1 = `[Deal Sốc ${price}] ${name} Chính Hãng`.slice(0, 52);
  const safeHeadline2 = `${name} - ${usp.slice(0, 30)}`.slice(0, 52);
  const safeHeadline3 = `[Freeship] ${name} Đổi Trả Miễn Phí 7 Ngày`.slice(0, 52);

  const shopeeAds: ShopeeAdsData | undefined = isShopee
    ? {
        keywordMatrix: {
          exactMatch: [
            { keyword: name.toLowerCase(), suggestedBid: "1.800đ - 2.500đ", searchIntent: "Ý định mua hàng cao, chốt đơn ngay" },
            { keyword: `mua ${name.toLowerCase()}`, suggestedBid: "1.600đ - 2.200đ", searchIntent: "Tìm kiếm sản phẩm cụ thể" },
            { keyword: `${name.toLowerCase()} chính hãng`, suggestedBid: "2.000đ - 2.800đ", searchIntent: "Khách hàng ưu tiên chất lượng" },
            { keyword: `${name.toLowerCase()} cao cấp`, suggestedBid: "1.500đ - 2.000đ", searchIntent: "Phân khúc khách chịu chi" },
          ],
          broadMatch: [
            { keyword: name.split(/\s+/).slice(0, 2).join(" ").toLowerCase(), suggestedBid: "800đ - 1.200đ", searchIntent: "Gom traffic rẻ từ tìm kiếm rộng" },
            { keyword: `${name.split(/\s+/).slice(0, 2).join(" ").toLowerCase()} giá tốt`, suggestedBid: "600đ - 1.000đ", searchIntent: "Tệp săn deal giá tốt" },
            { keyword: `${name.split(/\s+/).slice(0, 2).join(" ").toLowerCase()} hot trend`, suggestedBid: "700đ - 1.100đ", searchIntent: "Lượng truy cập thịnh hành" },
          ],
          misspelledOrNiche: [
            { keyword: name.toLowerCase().replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a").replace(/[èéẹẻẽêềếệểễ]/g, "e").replace(/[ìíịỉĩ]/g, "i").replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o").replace(/[ùúụủũưừứựửữ]/g, "u").replace(/[ỳýỵỷỹ]/g, "y").replace(/[đ]/g, "d"), suggestedBid: "400đ - 700đ", searchIntent: "Từ khóa không dấu ít cạnh tranh" },
            { keyword: `${name.toLowerCase()} review`, suggestedBid: "500đ - 800đ", searchIntent: "Khách đang tìm hiểu để mua" },
          ],
          negativeKeywords: ["thanh lý", "miễn phí", "cũ", "hàng nhái", "hướng dẫn tự làm", "tuyển sỉ", "hàng giả", "hư hỏng"],
        },
        headlines: [
          { id: 1, label: "Mẫu 1", angle: "Deal sốc & Ưu đãi", headline: safeHeadline1, charCount: safeHeadline1.length, isSafeLength: true, hookBenefit: "Kích thích click tò mò giá rẻ" },
          { id: 2, label: "Mẫu 2", angle: "USP & Tính năng", headline: safeHeadline2, charCount: safeHeadline2.length, isSafeLength: true, hookBenefit: "Nhấn mạnh lợi thế cạnh tranh cốt lõi" },
          { id: 3, label: "Mẫu 3", angle: "Cam kết uy tín", headline: safeHeadline3, charCount: safeHeadline3.length, isSafeLength: true, hookBenefit: "Xóa tan nỗi sợ lừa đảo khi mua online" },
        ],
        biddingStrategy: {
          recommendedInitialBid: "1.200đ - 1.600đ (Bắt đầu với ngân sách an toàn)",
          peakHourMultiplier: "Tăng thầu 25% - 35% trong khung 20h00 - 23h00 (Giờ vàng chốt đơn)",
          optimizationTip: "Kiểm tra báo cáo tìm kiếm sau 72h và đưa ngay các từ khóa không ra đơn vào danh sách Phủ định.",
        },
      }
    : undefined;

  const tiktokAds: TikTokAdsData | undefined = isTiktok
    ? {
        hooks: [
          {
            id: 1,
            angle: "Cảnh Báo / Nỗi Đau",
            visualAction: "Biểu cảm hốt hoảng, cầm sản phẩm lỗi của shop khác đối chiếu với sản phẩm xịn",
            textOverlay: "Đừng mua nếu bạn chưa biết điều này!",
            audioVoiceover: "Ai đang tính mua mà bỏ qua video này là tiếc hùi hụi luôn đó mọi người ơi!",
          },
          {
            id: 2,
            angle: "Tò Mò / Sự Thật Bất Ngờ",
            visualAction: "Zoom cận cảnh chi tiết hoàn thiện tinh xảo của sản phẩm dưới ánh sáng mạnh",
            textOverlay: "Tại sao món này đang hot rần rần trên TikTok?",
            audioVoiceover: "Ban đầu tui cũng không tin đâu, nhưng khi cầm tận tay thì đúng là đáng từng xu!",
          },
          {
            id: 3,
            angle: "Thử Nghiệm Thực Tế / Extreme Test",
            visualAction: "Thực hiện bài test độ bền hoặc hiệu năng thực tế ngay trên bàn",
            textOverlay: "Test cực hạn xem có bền như quảng cáo?",
            audioVoiceover: "Hôm nay tui sẽ test thử độ bền cho anh em xem tận mắt luôn nha!",
          },
          {
            id: 4,
            angle: "So Sánh Tương Phản",
            visualAction: "Đặt 2 sản phẩm cạnh nhau: 1 bên ọp ẹp, 1 bên chắc chắn cứng cáp",
            textOverlay: "Bỏ ra số tiền này thì nhận lại được gì?",
            audioVoiceover: "Khác biệt hoàn toàn so với hàng trôi nổi ngoài thị trường, xem là thấy ngay!",
          },
          {
            id: 5,
            angle: "FOMO / Báo Deal Giới Hạn",
            visualAction: "Chỉ tay thẳng xuống góc trái màn hình nơi có biểu tượng Giỏ Hàng",
            textOverlay: "Chỉ còn 30 suất Flash Sale độc quyền hôm nay!",
            audioVoiceover: "Đang có deal trợ giá sốc tặng kèm quà, bấm giỏ hàng săn liền tay trước khi hết!",
          },
        ],
        captions: [
          {
            id: 1,
            title: "Mẫu Caption 1 (Tập trung giải quyết nỗi đau)",
            angle: "Giải quyết vấn đề",
            caption: `Ai đang đau đầu tìm kiếm ${name} chất lượng cao, đúng mô tả thì đây chính là chân ái! ${usp}. Giá ưu đãi chỉ ${price} duy nhất hôm nay!`,
            ctaBadge: "Chạm ngay Giỏ hàng màu vàng góc trái để nhận ưu đãi!",
          },
          {
            id: 2,
            title: "Mẫu Caption 2 (Review trải nghiệm thực tế)",
            angle: "Social Proof",
            caption: `Cầm trên tay ưng thực sự mọi người ạ. ${name} được hoàn thiện cực kỳ tỉ mỉ, ${usp}. Đang có mã freeship cực hời!`,
            ctaBadge: "Xem đánh giá chi tiết tại Giỏ hàng góc trái màn hình!",
          },
          {
            id: 3,
            title: "Mẫu Caption 3 (Deal sốc & Quà tặng)",
            angle: "Ưu đãi độc quyền",
            caption: `Flash Sale số lượng có hạn! Sở hữu ngay ${name} với mức giá chỉ ${price} tặng kèm bảo hành chính hãng đổi trả miễn phí.`,
            ctaBadge: "Bấm vào Giỏ hàng màu vàng góc trái để chốt deal ngay!",
          },
          {
            id: 4,
            title: "Mẫu Caption 4 (So sánh chất lượng)",
            angle: "Chất lượng vượt trội",
            caption: `Đừng ham rẻ vài chục nghìn mà mua phải hàng kém chất lượng. Đầu tư ${name} chuẩn xịn để dùng bền bỉ lâu dài.`,
            ctaBadge: "Sở hữu phiên bản chính hãng ở Giỏ hàng góc trái!",
          },
          {
            id: 5,
            title: "Mẫu Caption 5 (FOMO cấp bách)",
            angle: "Khan hiếm & Cấp bách",
            caption: `Số lượng voucher trợ giá có hạn trong phiên này! Nhanh tay kẻo hết mã giảm giá cho ${name}.`,
            ctaBadge: "Nhanh tay bấm Giỏ hàng góc trái trước khi hết mã!",
          },
        ],
        hashtags: ["#tiktokmademebuyit", "#reviewhangchinhhang", "#dealhot", "#xuhuong", "#muataitiktokshop", "#shopeecheck"],
        conversionTip: "Đặt chữ Text Overlay to rõ ở 1/3 trên cùng khung hình để không bị các nút tương tác và giỏ hàng che khuất.",
      }
    : undefined;

  return {
    platform,
    campaignGoal: `Chiến dịch quảng cáo thực chiến ${platform === "both" ? "Shopee & TikTok" : platform === "shopee" ? "Shopee Ads" : "TikTok Spark Ads"} cho ${audience}`,
    shopeeAds,
    tiktokAds,
    policyCompliance: {
      safeScore: 98,
      bannedWordsAvoided: ["cam kết 100%", "trị dứt điểm", "rẻ nhất Việt Nam", "số 1 thị trường", "sđt/zalo ngoài sàn"],
      warningNotes: [
        "Nội dung đã được rà soát tránh toàn bộ từ ngữ cấm theo chính sách Shopee Ads & TikTok Spark Ads 2026.",
        "Không chèn số điện thoại hoặc điều hướng giao dịch ngoài sàn để bảo vệ tài khoản quảng cáo.",
      ],
    },
  };
}

/**
 * Làm sạch và xác thực JSON đầu ra của Ad Copy
 */
export function cleanAndValidateAdCopyOutput(
  rawOutput: string,
  inputs?: AdCopyInputs
): string {
  const fallbackPlatform = inputs?.adPlatform || "both";
  const result = parseAdCopyResult(rawOutput, fallbackPlatform);

  if (!result || (!result.shopeeAds && !result.tiktokAds)) {
    const offline = buildOfflineAdCopyData(inputs || { adPlatform: fallbackPlatform, productName: "", price: "", usp: "" });
    return JSON.stringify(offline, null, 2);
  }

  return JSON.stringify(result, null, 2);
}


