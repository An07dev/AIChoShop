export const AI_TOOLS = [
  "seo-optimizer",
  "script-writer",
  "appeal-generator",
  "ad-copy",
  "review-replier",
  "chat-broadcast",
  "title-spinner",
  "video-repurposer",
  "koc-planner",
  "vision-listing",
  "policy-checker",
  "unboxing-card",
  "anti-return-nudge",
  "product-validator",
  "competitor-miner",
  "photo-prompter",
  "objection-killer",
  "product-launchpad",
];

export const TOOL_NAMES: Record<string, string> = {
  "product-launchpad": "AI Ra Mắt Sản Phẩm (Launchpad)",
  "seo-optimizer": "AI Tối Ưu SEO",
  "script-writer": "AI Kịch Bản Video",
  "appeal-generator": "AI Kháng Nghị Vi Phạm",
  "ad-copy": "AI Mẫu Quảng Cáo Ads",
  "review-replier": "AI Xử Lý Đánh Giá",
  "chat-broadcast": "Chat Broadcast & Zalo",
  "title-spinner": "Nhân Bản Tiêu Đề",
  "video-repurposer": "AI Biến Video 5 Kênh",
  "koc-planner": "Lập Kế Hoạch KOC Campaign",
  "koc-calculator": "Lập Kế Hoạch KOC Campaign",
  "vision-listing": "AI Phân Tích Ảnh (Vision)",
  "policy-checker": "AI Soi Từ Cấm Sàn",
  "unboxing-card": "AI Thư Cảm Ơn Nhét Hộp",
  "anti-return-nudge": "AI Chống Hoàn Hàng COD",
  "product-validator": "AI Thẩm Định Sản Phẩm",
  "competitor-miner": "AI Đọc Vị Đối Thủ",
  "photo-prompter": "AI Prompt Studio Ảnh",
  "objection-killer": "AI Bẻ Gãy Từ Chối 1-1",
  "pricing-calculator": "Tính Giá Bán",
  "tax-calculator": "Tính Thuế TMĐT",
};

/**
 * Làm sạch và chuẩn hóa dữ liệu đầu vào trước khi lưu trữ
 * Lược bỏ ảnh base64 lớn để tránh phình database
 */
export { serializeHistoryInput as sanitizeAiInput } from "./privacy/policy";

/**
 * Tự động tạo tóm tắt hành động từ công cụ và thông số đầu vào
 */
export function summarizeAiAction(tool: string, value: unknown): string {
  const inputs = value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typeof item === "string" ? item : typeof item === "number" ? String(item) : ""])) : {};
  switch (tool) {
    case "seo-optimizer":
      return inputs?.productName
        ? `Tối ưu SEO & Hashtag cho "${inputs.productName}"`
        : "Tối ưu SEO & Hashtag sản phẩm";

    case "script-writer":
      return inputs?.productName
        ? `Kịch bản video TikTok: "${inputs.productName}"`
        : "Tạo kịch bản video TikTok/Reels";

    case "appeal-generator":
      return inputs?.shopName
        ? `Đơn kháng nghị vi phạm: Shop ${inputs.shopName}`
        : "Tạo đơn kháng nghị vi phạm sàn TMĐT";

    case "ad-copy":
      return inputs?.productName
        ? `Mẫu quảng cáo Ads: "${inputs.productName}"`
        : "Tạo mẫu quảng cáo & Hook 3s đa kênh";

    case "review-replier":
      return inputs?.shopName
        ? `Phản hồi đánh giá ${inputs.rating || 5} sao: Shop ${inputs.shopName}`
        : `Phản hồi đánh giá ${inputs?.rating || 5} sao của khách`;

    case "chat-broadcast":
      return inputs?.shopName
        ? `Tin nhắn CSKH / Broadcast: Shop ${inputs.shopName}`
        : "Soạn kịch bản tin nhắn chăm sóc khách hàng";

    case "title-spinner":
      return inputs?.originalTitle
        ? `Xoay tiêu đề: "${inputs.originalTitle.slice(0, 45)}${inputs.originalTitle.length > 45 ? "..." : ""}"`
        : "Nhân bản tiêu đề chống spam";

    case "video-repurposer": {
      const name = inputs?.product_name || inputs?.productName || inputs?.videoTopic;
      return name
        ? `Tái bản video 5 kênh: "${String(name).slice(0, 40)}${String(name).length > 40 ? "..." : ""}"`
        : "Tái bản video 5 kênh đa nền tảng";
    }

    case "koc-planner":
    case "koc-calculator":
      return (inputs?.campaignName || inputs?.productName)
        ? `Kế hoạch KOC: "${String(inputs.campaignName || inputs.productName).slice(0, 35)}"`
        : "Lập kế hoạch & tính ngân sách KOC";

    case "pricing-calculator":
      return inputs?.productName
        ? `Định giá sản phẩm "${inputs.productName}"`
        : "Định giá bán & tối ưu lợi nhuận";

    case "tax-calculator":
      return inputs?.title || (inputs?.payerType
        ? `Tính thuế TMĐT ${inputs.payerType === "company" ? "Doanh nghiệp" : inputs.payerType === "individual" ? "Cá nhân KD" : "Hộ kinh doanh"} (${inputs.taxYear || 2026})`
        : "Tính thuế TMĐT 2026");

    case "vision-listing":
      return inputs?.categoryHint
        ? `Quét ảnh & viết Listing ngành "${inputs.categoryHint}"`
        : "Phân tích ảnh sản phẩm & tạo Listing chuẩn SEO";

    case "policy-checker":
      return inputs?.contentType
        ? `Rà soát từ cấm & an toàn cho "${inputs.contentType}"`
        : inputs?.text
          ? `Soi từ cấm: "${String(inputs.text).slice(0, 30)}..."`
          : "Soi từ cấm & vi phạm sàn TMĐT";

    case "unboxing-card":
      return inputs?.shopName
        ? `Thư cảm ơn nhét hộp: Shop ${inputs.shopName}`
        : "Tạo thư cảm ơn nhét hộp & nam châm 5 sao";

    case "anti-return-nudge":
      return inputs?.productName
        ? `Kịch bản chống hoàn/cứu đơn: "${inputs.productName.slice(0, 35)}"`
        : "Kịch bản chống bom hàng & cứu đơn COD";

    case "product-validator":
      return inputs?.productName
        ? `Thẩm định tiềm năng & rủi ro: "${inputs.productName.slice(0, 35)}"`
        : "Thẩm định sản phẩm trend & rủi ro";

    case "competitor-miner":
      return inputs?.productName
        ? `Bóc tách đối thủ & tìm USP: "${inputs.productName.slice(0, 35)}"`
        : "Đọc vị đối thủ & săn tử huyệt tìm USP";

    case "photo-prompter":
      return inputs?.productName
        ? `Tạo Prompt chụp studio: "${inputs.productName.slice(0, 35)}"`
        : "AI Studio Prompt chụp ảnh sản phẩm";

    case "objection-killer":
      return inputs?.productName
        ? `Bẻ gãy lời từ chối: "${inputs.productName.slice(0, 35)}"`
        : "Bẻ gãy lời từ chối & chốt đơn 1-1";

    case "product-launchpad":
      return inputs?.productName
        ? `Chiến dịch ra mắt 5-in-1: "${inputs.productName.slice(0, 35)}"`
        : "Chiến dịch ra mắt sản phẩm 5-in-1";

    default:
      return `Sử dụng công cụ ${TOOL_NAMES[tool] || tool}`;
  }
}
