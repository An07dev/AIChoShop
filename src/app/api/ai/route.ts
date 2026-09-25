import { classifyDatabaseError, dataErrorResponse, dataFailure } from "@/lib/db-errors";
import { AI_TOOLS, reserveAi, completeAi, releaseAi } from "@/lib/ai-quota";
import { SeoError } from "@/lib/seo/contract";
import { readLimitedJson, RequestBodyError } from "@/lib/http/body";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { executeAiWithFallback } from "@/lib/ai-fallback";
import { getAiUsageStats } from "@/lib/ai-usage";
import { handleSeo } from "@/lib/seo/handler";
import { isAllowedOrigin } from "@/lib/http/origin";
import { TITLE_SPINNER_SYSTEM_PROMPT, buildTitleSpinnerPrompt, cleanAndValidateTitleSpinnerOutput, buildOfflineTitleSpinnerData, type SpinnerPlatform } from "@/lib/title-spinner/contract";
import { AD_COPY_SYSTEM_PROMPT, buildAdCopyPrompt, cleanAndValidateAdCopyOutput, buildOfflineAdCopyData, type AdPlatform } from "@/lib/ad-copy/contract";
import { SCRIPT_WRITER_SYSTEM_PROMPT, buildScriptWriterPrompt, cleanAndValidateScriptWriterOutput, buildOfflineScriptWriterData, type ScriptFormat } from "@/lib/script-writer/contract";
import { REPURPOSER_SYSTEM_PROMPT, buildVideoRepurposerPrompt } from "@/lib/video-repurposer/contract";
import { CHAT_BROADCAST_SYSTEM_PROMPT, buildChatBroadcastPrompt } from "@/lib/chat-broadcast/contract";
import { REVIEW_REPLIER_SYSTEM_PROMPT, buildReviewReplierPrompt, cleanAndValidateReviewReplierOutput, buildOfflineReviewReplierData } from "@/lib/review-replier/contract";
import { APPEAL_GENERATOR_SYSTEM_PROMPT, buildAppealGeneratorPrompt, cleanAndValidateAppealOutput, buildOfflineAppealGeneratorData } from "@/lib/appeal-generator/contract";
import { POLICY_CHECKER_SYSTEM_PROMPT, buildPolicyCheckerPrompt, cleanAndValidatePolicyOutput, buildOfflinePolicyData } from "@/lib/policy-checker/contract";
import { UNBOXING_CARD_SYSTEM_PROMPT, buildUnboxingCardPrompt, cleanAndValidateUnboxingCardOutput, buildOfflineUnboxingCardData } from "@/lib/unboxing-card/contract";
import { ANTI_RETURN_NUDGE_SYSTEM_PROMPT, buildAntiReturnNudgePrompt, cleanAndValidateAntiReturnNudgeOutput, buildOfflineAntiReturnNudgeData } from "@/lib/anti-return-nudge/contract";
import { PRODUCT_VALIDATOR_SYSTEM_PROMPT, buildProductValidatorPrompt, cleanAndValidateProductValidatorOutput, buildOfflineProductValidatorData } from "@/lib/product-validator/contract";
import { buildCompetitorMinerPrompt, cleanAndValidateCompetitorMinerOutput, buildOfflineCompetitorMinerData } from "@/lib/competitor-miner/contract";
import { PHOTO_PROMPTER_SYSTEM_PROMPT, generatePhotoPrompterUserPrompt, generatePhotoPrompterBlueprint, cleanAndValidatePhotoPrompterOutput } from "@/lib/photo-prompter/contract";
import { OBJECTION_KILLER_SYSTEM_PROMPT, generateObjectionKillerUserPrompt, buildOfflineObjectionKillerData, cleanAndValidateObjectionKillerOutput } from "@/lib/objection-killer/contract";

export const maxDuration = 180;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let lease: string | undefined;
  try {
    if (!isAllowedOrigin(req)) throw new SeoError("INVALID_ORIGIN", "Yêu cầu không hợp lệ.", 403);
    const body = await readLimitedJson(req, 6 * 1024 * 1024) as { tool: string; inputs: Record<string, unknown> };
    if (!body || typeof body !== "object") throw new RequestBodyError("INVALID_INPUT");
    const { tool, inputs: rawInputs } = body;
    if (!AI_TOOLS.includes(tool) || !rawInputs || typeof rawInputs !== "object" || Array.isArray(rawInputs)) throw new RequestBodyError("INVALID_INPUT");
    if (JSON.stringify({ ...rawInputs, imageBase64: undefined }).length > 32_000) throw new RequestBodyError("INPUT_TOO_LARGE", 413);
    if (rawInputs.imageBase64 && (typeof rawInputs.imageBase64 !== "string" || !/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(rawInputs.imageBase64))) throw new RequestBodyError("INVALID_IMAGE");
    if (tool === "seo-optimizer") return handleSeo(req, rawInputs);
    const inputs: Record<string, string> = Object.fromEntries(Object.entries(rawInputs).map(([key, value]) => [key, typeof value === "string" ? value : value === null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value)]));
    const userId = await getSessionUserId();
    if (!userId) throw new SeoError("LOGIN_REQUIRED", "Vui lòng đăng nhập để sử dụng công cụ.", 401);

    lease = await reserveAi(userId);

    let systemPrompt = "Bạn là một chuyên gia thương mại điện tử xuất sắc tại Việt Nam, am hiểu thuật toán Shopee và TikTok Shop. Hãy trả về kết quả bằng tiếng Việt, định dạng Markdown rõ ràng, chuyên nghiệp.";
    let userPrompt = "";

    switch (tool) {
      case "appeal-generator": {
        systemPrompt = APPEAL_GENERATOR_SYSTEM_PROMPT;
        userPrompt = buildAppealGeneratorPrompt({
          platform: inputs.platform || "Shopee",
          violationType: inputs.violationType || "Nghi ngờ vi phạm tiêu chuẩn cộng đồng",
          shopName: inputs.shopName || "Gian Hàng Của Bạn",
          details: inputs.details || "",
          imageBase64: inputs.imageBase64 || null,
        });
        break;
      }
      
      case "script-writer": {
        systemPrompt = SCRIPT_WRITER_SYSTEM_PROMPT;
        userPrompt = buildScriptWriterPrompt({
          productName: inputs.productName || "",
          usp: inputs.usp || "",
          format: (inputs.format as ScriptFormat) || "both",
          scriptAngle: inputs.scriptAngle,
          priceDeal: inputs.priceDeal,
          targetAudience: inputs.targetAudience,
        });
        break;
      }

      case "review-replier": {
        systemPrompt = REVIEW_REPLIER_SYSTEM_PROMPT;
        userPrompt = buildReviewReplierPrompt({
          platform: inputs.platform || "shopee",
          shopName: inputs.shopName || "Gian Hàng Chính Hãng",
          productName: inputs.productName || "Sản phẩm đánh giá",
          rating: inputs.rating || "1 sao",
          issueType: inputs.issueType || "Hàng lỗi / Không ưng ý",
          reviewContent: inputs.reviewContent || inputs.reviewText || "",
          compensation: inputs.compensation || "",
          note: inputs.note || "",
        });
        break;
      }

      case "koc-planner":
        userPrompt = `Bạn là chuyên gia lập kế hoạch KOC (Key Opinion Consumer) cho ngành TMĐT.
Hãy lập một bản kế hoạch hợp tác KOC ngắn gọn, hiệu quả cho chiến dịch sau:
Sản phẩm: ${inputs.productName}
Ngân sách dự kiến: ${inputs.budget || "5.000.000 VNĐ"}
Mục tiêu: ${inputs.goal || "Tăng nhận diện và ra đơn hàng trên TikTok Shop"}

Yêu cầu cấu trúc:
## 1. PHÂN BỔ NGÂN SÁCH CHIẾN DỊCH
## 2. TIÊU CHÍ LỰA CHỌN KOC PHÙ HỢP
## 3. THÔNG ĐIỆP CỐT LÕI & YÊU CẦU NỘI DUNG
## 4. QUY TRÌNH HỢP TÁC & BẢO VỆ SHOP
## 5. DỰ PHÓNG CHỈ SỐ ROI & ĐƠN HÀNG

LƯU Ý: Trả về 100% tiếng Việt chuẩn. Không chèn lời chào hay giải thích ngoài lề.`;
        break;

      case "title-spinner": {
        const platform = (inputs.platform as SpinnerPlatform) || "shopee";
        systemPrompt = TITLE_SPINNER_SYSTEM_PROMPT;
        userPrompt = buildTitleSpinnerPrompt({
          platform,
          originalTitle: inputs.originalTitle || "",
          coreKeywords: inputs.coreKeywords,
        });
        break;
      }

      case "ad-copy": {
        const platform = (inputs.adPlatform as AdPlatform) || "both";
        systemPrompt = AD_COPY_SYSTEM_PROMPT;
        userPrompt = buildAdCopyPrompt({
          adPlatform: platform,
          productName: inputs.productName || "",
          price: inputs.price || "",
          usp: inputs.usp || "",
          targetAudience: inputs.targetAudience,
          campaignGoal: inputs.campaignGoal,
          promotionOffer: inputs.promotionOffer,
        });
        break;
      }

      case "chat-broadcast": {
        systemPrompt = CHAT_BROADCAST_SYSTEM_PROMPT;
        userPrompt = buildChatBroadcastPrompt({
          shopName: inputs.shopName || "",
          productName: inputs.productName || "",
          scenario: inputs.scenario || "loyalty_voucher",
          offer: inputs.offer || "",
          channel: inputs.channel || "both",
        });
        break;
      }

      case "video-repurposer": {
        systemPrompt = REPURPOSER_SYSTEM_PROMPT;
        userPrompt = buildVideoRepurposerPrompt({
          productName: ((inputs.product_name || inputs.productName) as string) || "Sản phẩm",
          videoScript: ((inputs.video_script || inputs.videoScript) as string) || "",
          brandTone: ((inputs.brand_tone || inputs.brandTone) as string) || "friendly",
          callToAction: ((inputs.call_to_action || inputs.callToAction) as string) || "Bình luận nhận link / Mua ngay",
          promotionOffer: ((inputs.promotion_offer || inputs.promotionOffer) as string) || "",
        });
        break;
      }

      case "vision-listing": {
        const platform = inputs.platform || "Shopee & TikTok Shop";
        const prodName = inputs.categoryHint?.trim() || "Sản phẩm trong ảnh";
        const audience = inputs.targetAudience?.trim() || "Khách hàng mua sắm";
        const offer = inputs.shopNote?.trim() || "Bảo hành chính hãng uy tín";

        systemPrompt = `You are a professional E-commerce Listing Specialist for Shopee, TikTok Shop and Lazada.
CRITICAL INSTRUCTIONS:
1. You MUST carefully analyze the provided product image and generate listing content specifically for: "${prodName}".
2. Target audience: "${audience}".
3. Offer & Warranty: "${offer}".
4. In "sellerAttributes", you must observe the product image to accurately identify and fill in real attributes:
   - "Chất liệu": actual material seen in the photo (e.g., Nhựa PP/ABS cao cấp, Vải Cotton 100%, Da PU, Kim loại CNC...).
   - "Màu sắc / Phân loại": exact colors and patterns visible in the image.
   - "Tính năng nổi bật": key functional features and utility visible or clearly inferred from the product design.
5. You must respond ONLY with a single valid JSON object. Do not include any text or markdown codeblocks outside JSON.
6. Your entire response must begin with { and end with }.`;

        userPrompt = `Hãy phân tích kỹ hình ảnh sản phẩm thực tế được tải lên và tạo bộ Listing chuẩn SEO cho "${prodName}":
- Tên / Ngành hàng: ${prodName}
- Nền tảng đích: ${platform}
- Khách hàng mục tiêu: ${audience}
- Ưu đãi & Bảo hành: ${offer}

YÊU CẦU: Quan sát kỹ hình ảnh để trích xuất chính xác chất liệu, màu sắc và công năng thật vào cấu trúc JSON sau:
{
  "titles": [
    {
      "id": 1,
      "platform": "Shopee & Lazada",
      "style": "SEO Tìm Kiếm Tự Nhiên (Search-Driven)",
      "targetAudience": "${audience}",
      "title": "${prodName} Cao Cấp Đa Năng - Bền Đẹp, Tiện Lợi, ${offer}",
      "hookKeywords": "${prodName}"
    },
    {
      "id": 2,
      "platform": "TikTok Shop",
      "style": "Kéo Click & Chốt Cảm Xúc (Impulse-Driven)",
      "targetAudience": "${audience}",
      "title": "🔥 ${prodName} Mẫu Mới Cực Hot - Quà Tặng Độc Quyền, Giá Sốc Hôm Nay!",
      "hookKeywords": "${prodName}"
    },
    {
      "id": 3,
      "platform": "Đấu Thầu Ads",
      "style": "Tối Ưu Quảng Cáo Tìm Kiếm (High CTR & Low CPC)",
      "targetAudience": "${audience}",
      "title": "${prodName} Giá Tốt Nhất - Giao Hỏa Tốc, Cam Kết Đổi Trả",
      "hookKeywords": "${prodName}"
    }
  ],
  "sellerAttributes": [
    { "name": "Loại sản phẩm", "value": "${prodName}", "requiredByPlatform": true },
    { "name": "Chất liệu", "value": "Chất liệu thực tế nhận diện từ ảnh", "requiredByPlatform": true },
    { "name": "Màu sắc / Phân loại", "value": "Màu sắc và họa tiết thực tế nhìn thấy trên ảnh", "requiredByPlatform": true },
    { "name": "Xuất xứ", "value": "Việt Nam", "requiredByPlatform": true },
    { "name": "Tính năng nổi bật", "value": "Công năng và tiện ích nổi bật thấy trên ảnh", "requiredByPlatform": true },
    { "name": "Bảo hành", "value": "${offer}", "requiredByPlatform": true }
  ],
  "skuSuggestions": [
    {
      "groupName": "Kích Thước / Phân Loại",
      "options": ["Mẫu Tiêu Chuẩn", "Mẫu Lớn (Nâng Cấp)"]
    },
    {
      "groupName": "Phân Loại Màu Sắc",
      "options": ["Màu Sáng", "Màu Tối", "Bản Phối Màu"]
    }
  ],
  "aidaDescription": {
    "attentionHook": "Bạn đang tìm kiếm ${prodName} chất lượng cao, thiết kế tiện dụng cho ${audience}?",
    "uspPoint": "Sản phẩm ${prodName} sở hữu thiết kế thông minh, độ hoàn thiện cao cùng chính sách ${offer}.",
    "featureBullets": [
      {
        "feature": "Chất Liệu Cao Cấp",
        "benefit": "Bền bỉ, an toàn và thân thiện cho người dùng"
      },
      {
        "feature": "Thiết Kế Tiện Dụng",
        "benefit": "Tối ưu công năng, dễ dàng sử dụng và sắp xếp gọn gàng"
      }
    ],
    "usageAndSize": [
      "Kích thước tiêu chuẩn phù hợp không gian sử dụng",
      "Dễ dàng lau chùi và bảo quản sạch sẽ"
    ],
    "guarantees": [
      "Cam kết hàng chính hãng 100% đúng mô tả và hình ảnh thực tế",
      "Bảo hành ${offer}, hỗ trợ đổi trả miễn phí trong 7 ngày nếu lỗi"
    ],
    "ctaCloser": "👉 BẤM [MUA NGAY] ĐỂ NHẬN ƯU ĐÃI VÀ VOUCHER GIẢM GIÁ ĐẶC BIỆT HÔM NAY!"
  },
  "seoTags": {
    "coreKeywords": ["${prodName}", "mua ${prodName}", "${prodName} chinh hang"],
    "hashtags": ["#${prodName.replace(/[\\s-]+/g, '')}", "#shopee", "#tiktokshop", "#trending"]
  }
}

Hãy điền các thuộc tính và mô tả thực tế của "${prodName}" từ hình ảnh. Bắt đầu bằng { ngay bây giờ:`;
        break;
      }

      case "policy-checker": {
        systemPrompt = POLICY_CHECKER_SYSTEM_PROMPT;
        userPrompt = buildPolicyCheckerPrompt(inputs as any);
        break;
      }

      case "unboxing-card": {
        systemPrompt = UNBOXING_CARD_SYSTEM_PROMPT;
        userPrompt = buildUnboxingCardPrompt({
          shopName: inputs.shopName || "Gian Hàng Chính Hãng",
          productCategory: inputs.productCategory || "Sản phẩm",
          cardTone: inputs.cardTone || "emotional",
          cardFormat: inputs.cardFormat || "postcard_a6",
          primaryGoal: inputs.primaryGoal || "anti_1_star",
          specialOffer: inputs.specialOffer || "",
        });
        break;
      }

      case "anti-return-nudge": {
        const promptData = buildAntiReturnNudgePrompt({
          shopName: inputs.shopName || "Shop",
          productName: inputs.productName || "Sản phẩm",
          codAmount: inputs.codAmount || "",
          scenario: inputs.scenario || "delivery_failed_1",
          customerReason: inputs.customerReason || "",
          compensationOffer: inputs.compensationOffer || "",
        });
        systemPrompt = promptData.systemPrompt;
        userPrompt = promptData.userPrompt;
        break;
      }

      case "product-validator": {
        const promptData = buildProductValidatorPrompt({
          productName: inputs.productName || "Sản phẩm",
          costPrice: inputs.costPrice || "",
          targetPrice: inputs.targetPrice || "",
          platform: inputs.platform || "Shopee và TikTok Shop",
          source: inputs.source || "Nhập sỉ / 1688 / Xưởng",
          notes: inputs.notes || "",
        });
        systemPrompt = promptData.systemPrompt;
        userPrompt = promptData.userPrompt;
        break;
      }

      case "competitor-miner": {
        const promptData = buildCompetitorMinerPrompt({
          productName: inputs.productName || "Sản phẩm của Shop",
          category: inputs.category || "Ngành hàng TMĐT",
          competitorReviews: inputs.competitorReviews || "Đánh giá của khách",
          shopStrength: inputs.shopStrength || "",
        });
        systemPrompt = promptData.systemPrompt;
        userPrompt = promptData.userPrompt;
        break;
      }

      case "photo-prompter": {
        systemPrompt = PHOTO_PROMPTER_SYSTEM_PROMPT;
        userPrompt = generatePhotoPrompterUserPrompt({
          productName: inputs.productName || "Sản phẩm thương mại",
          style: inputs.style || "minimalist_studio",
          imageType: inputs.imageType || "commercial_studio",
          aiTool: inputs.aiTool || "Midjourney v6.1 / Flux.1",
          modelDemographic: inputs.modelDemographic || "",
          imageBase64: inputs.imageBase64 || null,
        });
        break;
      }

      case "objection-killer": {
        systemPrompt = OBJECTION_KILLER_SYSTEM_PROMPT;
        userPrompt = generateObjectionKillerUserPrompt({
          productName: inputs.productName || "Sản phẩm",
          price: inputs.price || "",
          customerObjection: inputs.customerObjection || "Khách chê đắt hoặc đòi suy nghĩ thêm",
          flexibleOffer: inputs.flexibleOffer || "",
        });
        break;
      }

      default:
        return NextResponse.json({ success: false, error: "Công cụ không hợp lệ." }, { status: 400 });
    }

    const maxTokens = [
      "script-writer",
      "video-repurposer",
      "vision-listing",
      "unboxing-card",
      "anti-return-nudge",
      "product-validator",
      "competitor-miner",
      "photo-prompter",
      "objection-killer"
    ].includes(tool) ? 3500 : 2500;

    let result;
    try {
      result = await executeAiWithFallback({
        systemPrompt,
        userPrompt,
        imageBase64: (tool === "appeal-generator" || tool === "vision-listing" || tool === "photo-prompter") ? inputs.imageBase64 : undefined,
        tool,
        maxTokens: tool === "objection-killer" ? 1800 : tool === "vision-listing" ? 3200 : tool === "title-spinner" ? 2800 : tool === "script-writer" ? 3800 : tool === "video-repurposer" ? 3200 : tool === "ad-copy" ? 3600 : tool === "chat-broadcast" ? 2200 : tool === "review-replier" ? 3200 : tool === "appeal-generator" ? 3400 : tool === "policy-checker" ? 3600 : tool === "unboxing-card" ? 3500 : tool === "anti-return-nudge" ? 3600 : tool === "product-validator" ? 3600 : tool === "competitor-miner" ? 3800 : tool === "photo-prompter" ? 3800 : maxTokens,
        temperature: 0.7,
        responseFormat: (tool === "vision-listing" || tool === "title-spinner" || tool === "ad-copy" || tool === "script-writer" || tool === "video-repurposer" || tool === "chat-broadcast" || tool === "review-replier" || tool === "appeal-generator" || tool === "policy-checker" || tool === "unboxing-card" || tool === "anti-return-nudge" || tool === "product-validator" || tool === "competitor-miner" || tool === "photo-prompter" || tool === "objection-killer") ? "json" : undefined,
        abortSignal: req.signal,
      });
    } catch (aiError: any) {
      if (req.signal.aborted || aiError?.name === "AbortError" || aiError?.message?.includes("AbortError")) {
        throw aiError;
      }
      if (tool === "anti-return-nudge") {
        console.warn("[AI Route] anti-return-nudge AI unavailable (502/503/timeout). Activating Server-side Offline Blueprint...", aiError?.message);
        const offlineData = buildOfflineAntiReturnNudgeData({
          shopName: inputs.shopName,
          productName: inputs.productName,
          codAmount: inputs.codAmount,
          scenario: inputs.scenario,
          customerReason: inputs.customerReason,
          compensationOffer: inputs.compensationOffer,
        });
        if (lease) {
          await releaseAi(lease).catch(() => {});
          lease = undefined;
        }
        return NextResponse.json({
          success: true,
          data: JSON.stringify(offlineData),
          isOfflineFallback: true,
          fallbackUsed: true,
          provider: "offline-blueprint",
          message: "Đã kích hoạt kịch bản cứu đơn dự phòng chuẩn sàn 2026 (lượt dùng chưa bị trừ).",
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      } else if (tool === "product-validator") {
        console.warn("[AI Route] product-validator AI unavailable (502/503/timeout). Activating Server-side Offline Blueprint...", aiError?.message);
        const offlineData = buildOfflineProductValidatorData({
          productName: inputs.productName,
          costPrice: inputs.costPrice,
          targetPrice: inputs.targetPrice,
          platform: inputs.platform,
          source: inputs.source,
          notes: inputs.notes,
        });
        if (lease) {
          await releaseAi(lease).catch(() => {});
          lease = undefined;
        }
        return NextResponse.json({
          success: true,
          data: JSON.stringify(offlineData),
          isOfflineFallback: true,
          fallbackUsed: true,
          provider: "offline-blueprint",
          message: "Đã kích hoạt báo cáo thẩm định sản phẩm dự phòng chuẩn sàn 2026 (lượt dùng chưa bị trừ).",
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      } else if (tool === "appeal-generator") {
        console.warn("[AI Route] appeal-generator AI unavailable (502/503/timeout). Activating Server-side Offline Blueprint...", aiError?.message);
        const offlineData = buildOfflineAppealGeneratorData({
          platform: inputs.platform || "Shopee",
          violationType: inputs.violationType || "Nghi ngờ vi phạm tiêu chuẩn cộng đồng sàn",
          shopName: inputs.shopName || "Gian Hàng Của Bạn",
          details: inputs.details || "",
          imageBase64: inputs.imageBase64 || null,
        });
        if (lease) {
          await releaseAi(lease).catch(() => {});
          lease = undefined;
        }
        return NextResponse.json({
          success: true,
          data: JSON.stringify(offlineData),
          isOfflineFallback: true,
          fallbackUsed: true,
          provider: "offline-blueprint",
          message: "Đã kích hoạt hồ sơ kháng nghị dự phòng chuẩn pháp lý sàn 2026 (lượt dùng chưa bị trừ).",
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      } else if (tool === "review-replier") {
        console.warn("[AI Route] review-replier AI unavailable (502/503/timeout). Activating Server-side Offline Blueprint...", aiError?.message);
        const offlineData = buildOfflineReviewReplierData({
          platform: inputs.platform || "shopee",
          shopName: inputs.shopName || "Gian Hàng Chính Hãng",
          productName: inputs.productName || "Sản phẩm đánh giá",
          rating: inputs.rating || "1 sao",
          issueType: inputs.issueType || "Hàng lỗi / Không ưng ý",
          reviewContent: inputs.reviewContent || inputs.reviewText || "",
          compensation: inputs.compensation || "",
          note: inputs.note || "",
        });
        if (lease) {
          await releaseAi(lease).catch(() => {});
          lease = undefined;
        }
        return NextResponse.json({
          success: true,
          data: JSON.stringify(offlineData),
          isOfflineFallback: true,
          fallbackUsed: true,
          provider: "offline-blueprint",
          message: "Đã kích hoạt kịch bản xử lý khủng hoảng dự phòng chuẩn sàn 2026 (lượt dùng chưa bị trừ).",
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      } else if (tool === "policy-checker") {
        console.warn("[AI Route] policy-checker AI unavailable (502/503/timeout). Activating Server-side Offline Blueprint...", aiError?.message);
        const offlineData = buildOfflinePolicyData(
          inputs.text || "",
          inputs.platform || "TikTok Shop",
          inputs.contentType || "Mô tả sản phẩm"
        );
        if (lease) {
          await releaseAi(lease).catch(() => {});
          lease = undefined;
        }
        return NextResponse.json({
          success: true,
          data: JSON.stringify(offlineData),
          isOfflineFallback: true,
          fallbackUsed: true,
          provider: "offline-blueprint",
          message: "Đã kích hoạt bộ máy quét từ cấm ngoại tuyến chuẩn chính sách sàn 2026 (lượt dùng chưa bị trừ).",
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      } else if (tool === "unboxing-card") {
        console.warn("[AI Route] unboxing-card AI unavailable (502/503/timeout). Activating Server-side Offline Blueprint...", aiError?.message);
        const offlineData = buildOfflineUnboxingCardData({
          shopName: inputs.shopName || "Gian Hàng Chính Hãng",
          productCategory: inputs.productCategory || "Sản phẩm",
          cardTone: inputs.cardTone || "emotional",
          cardFormat: inputs.cardFormat || "postcard_a6",
          primaryGoal: inputs.primaryGoal || "anti_1_star",
          specialOffer: inputs.specialOffer || "",
        });
        if (lease) {
          await releaseAi(lease).catch(() => {});
          lease = undefined;
        }
        return NextResponse.json({
          success: true,
          data: JSON.stringify(offlineData),
          isOfflineFallback: true,
          fallbackUsed: true,
          provider: "offline-blueprint",
          message: "Đã kích hoạt mẫu thiệp cảm ơn dự phòng chuẩn xưởng in 2026 (lượt dùng chưa bị trừ).",
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      } else if (tool === "competitor-miner") {
        console.warn("[AI Route] competitor-miner AI unavailable (502/503/timeout). Activating Server-side Offline Blueprint...", aiError?.message);
        const offlineData = buildOfflineCompetitorMinerData({
          productName: inputs.productName,
          category: inputs.category,
          competitorReviews: inputs.competitorReviews,
          shopStrength: inputs.shopStrength,
        });
        if (lease) {
          await releaseAi(lease).catch(() => {});
          lease = undefined;
        }
        return NextResponse.json({
          success: true,
          data: JSON.stringify(offlineData),
          isOfflineFallback: true,
          fallbackUsed: true,
          provider: "offline-blueprint",
          message: "Đã kích hoạt bản phân tích đối thủ dự phòng chuẩn chiến lược TMĐT 2026 (lượt dùng chưa bị trừ).",
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      } else if (tool === "title-spinner") {
        console.warn("[AI Route] title-spinner AI unavailable (502/503/timeout). Activating Server-side Offline Blueprint...", aiError?.message);
        const offlineData = buildOfflineTitleSpinnerData({
          platform: (inputs.platform as SpinnerPlatform) || "shopee",
          originalTitle: inputs.originalTitle || "",
          coreKeywords: inputs.coreKeywords,
        });
        if (lease) {
          await releaseAi(lease).catch(() => {});
          lease = undefined;
        }
        return NextResponse.json({
          success: true,
          data: JSON.stringify(offlineData),
          isOfflineFallback: true,
          fallbackUsed: true,
          provider: "offline-blueprint",
          message: "Đã kích hoạt bộ 10 tiêu đề dự phòng chuẩn sàn 2026 (lượt dùng chưa bị trừ).",
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      } else if (tool === "ad-copy") {
        console.warn("[AI Route] ad-copy AI unavailable (502/503/timeout). Activating Server-side Offline Blueprint...", aiError?.message);
        const offlineData = buildOfflineAdCopyData({
          adPlatform: (inputs.adPlatform as AdPlatform) || "both",
          productName: inputs.productName || "",
          price: inputs.price || "",
          usp: inputs.usp || "",
          targetAudience: inputs.targetAudience,
          campaignGoal: inputs.campaignGoal,
          promotionOffer: inputs.promotionOffer,
        });
        if (lease) {
          await releaseAi(lease).catch(() => {});
          lease = undefined;
        }
        return NextResponse.json({
          success: true,
          data: JSON.stringify(offlineData),
          isOfflineFallback: true,
          fallbackUsed: true,
          provider: "offline-blueprint",
          message: "Đã kích hoạt bộ mẫu quảng cáo dự phòng chuẩn Shopee & TikTok Ads 2026 (lượt dùng chưa bị trừ).",
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      } else if (tool === "script-writer") {
        console.warn("[AI Route] script-writer AI unavailable (502/503/timeout). Activating Server-side Offline Blueprint...", aiError?.message);
        const offlineData = buildOfflineScriptWriterData({
          productName: inputs.productName || "",
          usp: inputs.usp || "",
          format: (inputs.format as ScriptFormat) || "both",
          scriptAngle: inputs.scriptAngle,
          priceDeal: inputs.priceDeal,
          targetAudience: inputs.targetAudience,
        });
        if (lease) {
          await releaseAi(lease).catch(() => {});
          lease = undefined;
        }
        return NextResponse.json({
          success: true,
          data: JSON.stringify(offlineData),
          isOfflineFallback: true,
          fallbackUsed: true,
          provider: "offline-blueprint",
          message: "Đã kích hoạt bộ kịch bản video & livestream dự phòng chuẩn sàn 2026 (lượt dùng chưa bị trừ).",
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      } else if (tool === "photo-prompter") {
        console.warn("[AI Route] photo-prompter AI unavailable (502/503/timeout). Activating Server-side Offline Blueprint...", aiError?.message);
        const offlineData = generatePhotoPrompterBlueprint({
          productName: inputs.productName || "Sản phẩm thương mại",
          style: inputs.style || "minimalist_studio",
          imageType: inputs.imageType || "commercial_studio",
          aiTool: inputs.aiTool || "Midjourney v6.1 / Flux.1",
          modelDemographic: inputs.modelDemographic || "",
          imageBase64: inputs.imageBase64 || null,
        });
        if (lease) {
          await releaseAi(lease).catch(() => {});
          lease = undefined;
        }
        return NextResponse.json({
          success: true,
          data: JSON.stringify(offlineData),
          isOfflineFallback: true,
          fallbackUsed: true,
          provider: "offline-blueprint",
          message: "Đã kích hoạt bộ Prompt Chụp Ảnh Studio & Người Mẫu Ảo dự phòng chuẩn sàn TMĐT (lượt dùng chưa bị trừ).",
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      } else if (tool === "objection-killer") {
        console.warn("[AI Route] objection-killer AI unavailable (502/503/timeout). Activating Server-side Offline Blueprint...", aiError?.message);
        const offlineData = buildOfflineObjectionKillerData({
          productName: inputs.productName || "Sản phẩm",
          price: inputs.price || "",
          customerObjection: inputs.customerObjection || "Khách chê đắt hoặc đòi suy nghĩ thêm",
          flexibleOffer: inputs.flexibleOffer || "",
        });
        if (lease) {
          await releaseAi(lease).catch(() => {});
          lease = undefined;
        }
        return NextResponse.json({
          success: true,
          data: JSON.stringify(offlineData),
          isOfflineFallback: true,
          fallbackUsed: true,
          provider: "offline-blueprint",
          message: "Đã kích hoạt kịch bản bẻ gãy từ chối dự phòng chuẩn sàn TMĐT 2026 (lượt dùng chưa bị trừ).",
        }, {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
      }
      throw aiError;
    }

    let finalOutput = result.outputText;
    if (tool === "review-replier") {
      try {
        finalOutput = cleanAndValidateReviewReplierOutput(result.outputText);
      } catch (err) {
        console.warn("review_replier_sanitize_warn", err);
      }
    } else if (tool === "appeal-generator") {
      try {
        finalOutput = cleanAndValidateAppealOutput(result.outputText);
      } catch (err) {
        console.warn("appeal_generator_sanitize_warn", err);
      }
    } else if (tool === "policy-checker") {
      try {
        finalOutput = cleanAndValidatePolicyOutput(result.outputText, inputs as any);
      } catch (err) {
        console.warn("policy_checker_sanitize_warn", err);
      }
    } else if (tool === "unboxing-card") {
      try {
        finalOutput = cleanAndValidateUnboxingCardOutput(result.outputText, inputs as any);
      } catch (err) {
        console.warn("unboxing_card_sanitize_warn", err);
      }
    } else if (tool === "anti-return-nudge") {
      try {
        finalOutput = cleanAndValidateAntiReturnNudgeOutput(result.outputText, inputs as any);
      } catch (err) {
        console.warn("anti_return_nudge_sanitize_warn", err);
      }
    } else if (tool === "product-validator") {
      try {
        finalOutput = cleanAndValidateProductValidatorOutput(result.outputText, inputs as any);
      } catch (err) {
        console.warn("product_validator_sanitize_warn", err);
      }
    } else if (tool === "competitor-miner") {
      try {
        finalOutput = cleanAndValidateCompetitorMinerOutput(result.outputText, inputs as any);
      } catch (err) {
        console.warn("competitor_miner_sanitize_warn", err);
      }
    } else if (tool === "title-spinner") {
      try {
        finalOutput = cleanAndValidateTitleSpinnerOutput(result.outputText, inputs as any);
      } catch (err) {
        console.warn("title_spinner_sanitize_warn", err);
      }
    } else if (tool === "ad-copy") {
      try {
        finalOutput = cleanAndValidateAdCopyOutput(result.outputText, inputs as any);
      } catch (err) {
        console.warn("ad_copy_sanitize_warn", err);
      }
    } else if (tool === "script-writer") {
      try {
        finalOutput = cleanAndValidateScriptWriterOutput(result.outputText, inputs as any);
      } catch (err) {
        console.warn("script_writer_sanitize_warn", err);
      }
    } else if (tool === "photo-prompter") {
      try {
        finalOutput = cleanAndValidatePhotoPrompterOutput(result.outputText, inputs as any);
      } catch (err) {
        console.warn("photo_prompter_sanitize_warn", err);
      }
    } else if (tool === "objection-killer") {
      try {
        finalOutput = cleanAndValidateObjectionKillerOutput(result.outputText, inputs as any);
      } catch (err) {
        console.warn("objection_killer_sanitize_warn", err);
      }
    }

    await completeAi(lease, {
      userId,
      tool,
      output: finalOutput,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      input: inputs,
    });
    lease = undefined;
    const usageStats = await getAiUsageStats(userId).catch(error => { dataFailure(error, "ai-result-usage-stats"); return null; });

    return NextResponse.json({
      success: true,
      data: finalOutput,
      usage: usageStats,
      usageUnavailable: usageStats === null,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed,
    }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });

  } catch (error) {
    if (lease) await releaseAi(lease).catch(() => console.error("ai_lease_release_failed", { lease }));
    if (error instanceof Error && (error.name === "AbortError" || error.message.includes("AbortError"))) {
      return NextResponse.json(
        { success: false, code: "REQUEST_ABORTED", error: "Yêu cầu đã được hủy bởi người dùng." },
        { status: 499, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (classifyDatabaseError(error)) return dataErrorResponse(error, "ai-request");
    const known = error instanceof SeoError || error instanceof RequestBodyError;
    return NextResponse.json({ success: false, code: error instanceof SeoError ? error.code : "AI_UNAVAILABLE", error: known ? error.message : "Dịch vụ AI đang gián đoạn. Vui lòng thử lại; lượt dùng chưa bị trừ." }, { status: known ? error.status : 503, headers: { "Cache-Control": "no-store" } });
  }
}
