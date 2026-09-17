import { classifyDatabaseError, dataErrorResponse, dataFailure } from "@/lib/db-errors";
import { AI_TOOLS, reserveAi, completeAi, releaseAi } from "@/lib/ai-quota";
import { SeoError } from "@/lib/seo/contract";
import { readLimitedJson, RequestBodyError } from "@/lib/http/body";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import OpenAI from "openai";
import { getSystemSettings } from "@/lib/system-settings";
import { getAiUsageStats } from "@/lib/ai-usage";
import { handleSeo } from "@/lib/seo/handler";
import { isAllowedOrigin } from "@/lib/http/origin";

export async function POST(req: Request) {
  let lease: string | undefined;
  try {
    if (!isAllowedOrigin(req)) throw new SeoError("INVALID_ORIGIN", "Yêu cầu không hợp lệ.", 403);
    const body = await readLimitedJson(req, 6 * 1024 * 1024) as { tool: string; inputs: Record<string, unknown> };
    if (!body || typeof body !== "object") throw new RequestBodyError("INVALID_INPUT");
    const { tool, inputs: rawInputs } = body;
    if (!AI_TOOLS.includes(tool) || !rawInputs || typeof rawInputs !== "object" || Array.isArray(rawInputs)) throw new RequestBodyError("INVALID_INPUT");
    if (JSON.stringify({ ...rawInputs, imageBase64: undefined }).length > 32_000) throw new RequestBodyError("INPUT_TOO_LARGE", 413);
    if (rawInputs.imageBase64 && (typeof rawInputs.imageBase64 !== "string" || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(rawInputs.imageBase64))) throw new RequestBodyError("INVALID_IMAGE");
    if (tool === "seo-optimizer") return handleSeo(req, rawInputs);
    const inputs: Record<string, string> = Object.fromEntries(Object.entries(rawInputs).map(([key, value]) => [key, typeof value === "string" ? value : value === null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value)]));
    const userId = await getSessionUserId();
    if (!userId) throw new SeoError("LOGIN_REQUIRED", "Vui lòng đăng nhập để sử dụng công cụ.", 401);

    // Lấy cấu hình hệ thống từ Database (ưu tiên CSDL, không phụ thuộc file .env)
    const systemConfig = await getSystemSettings();

    const isOpenAI = systemConfig.isOpenAiActive ?? (process.env.OpenAIStatus?.trim().toLowerCase() === "true");
    const isOllama = !isOpenAI;

    const baseURL = isOllama
      ? (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1")
      : (systemConfig.openaiBaseUrl?.trim() || undefined);

    const apiKey = isOllama
      ? "ollama"
      : (systemConfig.openaiApiKey?.trim() || process.env.OPENAI_API_KEY?.trim().replace(/^["']|["']$/g, "") || "");

    const model = isOllama
      ? (process.env.OLLAMA_MODEL || "qwen2.5:7b")
      : (systemConfig.openaiModel?.trim() || process.env.OPENAI_MODEL || "gpt-4o-mini");

    if (isOpenAI && (!apiKey || apiKey === "dummy" || apiKey.trim().length === 0)) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_TOKEN",
          error: "Hệ thống chưa cấu hình OpenAI API Key (Token). Vui lòng vào Quản trị viên -> Cài đặt hệ thống để nhập Token.",
          details: {
            reason: "API key is missing or empty in database",
            actionUrl: "/admin/settings",
          },
        },
        { status: 400 }
      );
    }

    lease = await reserveAi(userId);

    const openai = new OpenAI({
      baseURL,
      apiKey, timeout: 100_000, maxRetries: 0,
    });

    let systemPrompt = "Bạn là một chuyên gia thương mại điện tử xuất sắc tại Việt Nam, am hiểu thuật toán Shopee và TikTok Shop. Hãy trả về kết quả bằng tiếng Việt, định dạng Markdown rõ ràng, chuyên nghiệp.";
    let userPrompt = "";

    switch (tool) {
      case "appeal-generator":
        userPrompt = `Bạn là chuyên gia Xử lý vi phạm và Kháng nghị cho các nhà bán hàng (Seller) trên nền tảng ${inputs.platform || "TMĐT"}.
Tên Shop: ${inputs.shopName}
${inputs.violationType ? `Loại vi phạm: ${inputs.violationType}` : ""}
${inputs.details ? `Giải trình/Nguyên nhân từ Shop: ${inputs.details}` : ""}
${inputs.imageBase64 ? "Tôi có đính kèm một ảnh chụp màn hình thông báo vi phạm từ sàn. Hãy phân tích kỹ hình ảnh này để tìm ra LÝ DO CHÍNH XAC và NGUYÊN NHÂN SÂU XA mà hệ thống hoặc đội ngũ duyệt bài của sàn đã đánh gậy/vi phạm." : ""}

Hãy cung cấp kết quả theo cấu trúc sau (Định dạng Markdown rõ ràng):

### 1. PHÂN TÍCH VI PHẠM (Dành cho Seller hiểu)
- **Vấn đề cốt lõi:** (Lý do thực sự khiến sàn phạt, ví dụ: thuật toán quét nhầm từ khóa, hình ảnh có logo hãng, tỷ lệ phản hồi chậm...)
- **Cách khắc phục:** (Seller cần làm gì ngay lập tức để không bị khóa vĩnh viễn, ví dụ: gỡ sản phẩm, che logo, nhắn tin xin lỗi khách...)

### 2. MẪU ĐƠN KHÁNG NGHỊ CHUẨN (Copy & Paste)
- Viết một mẫu đơn khiếu nại (appeal) chuyên nghiệp, ngôn từ lịch sự, nhún nhường, cầu thị nhưng kiên quyết bảo vệ quyền lợi hợp pháp.
- Dài khoảng 200 - 300 chữ (nhân viên hỗ trợ rất lười đọc dài).
- Nếu là lỗi do sàn quét nhầm (VD: AI quét nhầm hàng fake): Phải nêu bật được bằng chứng mình có (hóa đơn, giấy ủy quyền...) và yêu cầu xem xét lại.
- Nếu là lỗi do seller sơ ý (VD: Giao chậm): Nêu lý do khách quan hợp lý, nhận trách nhiệm, và đưa ra CAM KẾT hành động cụ thể để không tái phạm.`;
        break;
      
      case "script-writer":
        userPrompt = `Bạn là chuyên gia sáng tạo kịch bản video ngắn TikTok Shop/Reels hàng đầu cho ngành TMĐT.
Hãy viết 3 kịch bản video ngắn khác nhau (thời lượng 30 - 45 giây) cho sản phẩm sau để nhà bán hàng lựa chọn:
Sản phẩm: ${inputs.productName}
Điểm nổi bật (USP): ${inputs.usp}

Yêu cầu 3 kịch bản theo 3 góc tiếp cận (Angles):
- Kịch bản 1: Góc Nỗi Đau & Đồng Cảm (Đánh trúng vấn đề nhức nhối thường ngày của khách hàng).
- Kịch bản 2: Góc Giật Tít & Tò Mò (Mở đầu gây sốc, đảo ngược suy nghĩ hoặc so sánh tương phản).
- Kịch bản 3: Góc Review Thực Tế & Trải Nghiệm (Đóng vai khách hàng trải nghiệm thực tế, đập hộp test USP).

Mỗi kịch bản BẮT BUỘC trình bày theo đúng định dạng bảng phân cảnh chuyên nghiệp sau:

# KỊCH BẢN [Số]: [Tên kịch bản theo góc tiếp cận]
- **Thời lượng**: 30 - 45 giây

### [00:00 - 00:03] HOOK: Giữ chân 3 giây đầu
- **Hình ảnh / Hành động**: [KOC làm gì trước ống kính, góc máy cận/toàn, đạo cụ]
- **Lời thoại (Voice)**: "[Câu KOC nói mở đầu gây tò mò, giữ chân người xem]"
- **Chữ trên video**: "[Chữ to nổi bật xuất hiện trên màn hình giật tít]"

### [00:03 - 00:15] NỖI ĐAU: Khơi gợi vấn đề
- **Hình ảnh / Hành động**: [Biểu cảm khó chịu, cảnh quay minh họa vấn đề khách gặp phải]
- **Lời thoại (Voice)**: "[Câu KOC nói chạm trúng nỗi đau/khó chịu của người xem]"
- **Chữ trên video**: "[Tóm tắt vấn đề bằng text ngắn gọn]"

### [00:15 - 00:30] GIẢI PHÁP: Giới thiệu USP
- **Hình ảnh / Hành động**: [Cảnh test sản phẩm thực tế, zoom cận vào chất liệu/tính năng vượt trội]
- **Lời thoại (Voice)**: "[Câu KOC nói làm nổi bật điểm mạnh USP giải quyết triệt để vấn đề]"
- **Chữ trên video**: "[In hoa điểm khác biệt nổi bật nhất]"

### [00:30 - 00:45] CTA: Kêu gọi hành động chốt đơn
- **Hình ảnh / Hành động**: [KOC cầm sản phẩm chỉ tay vào góc trái màn hình, nhấp nháy ưu đãi]
- **Lời thoại (Voice)**: "[Câu KOC kêu gọi bấm vào giỏ hàng ngay vì deal hời/quà tặng có hạn]"
- **Chữ trên video**: "[MUA NGAY TRONG GIỎ HÀNG / FREESHIP HÔM NAY]"

LƯU Ý: Tuyệt đối không thêm lời dẫn, trả về đúng 3 kịch bản theo định dạng trên.`;
        break;

      case "review-replier": {
        const reviewText = inputs.reviewContent || inputs.reviewText || "";
        const rating = inputs.rating || "1 sao";
        const issueType = inputs.issueType ? `\nVấn đề gặp phải: ${inputs.issueType}` : "";
        const note = inputs.note ? `\nBối cảnh/Ghi chú từ Shop: ${inputs.note}` : "";
        const shopName = inputs.shopName || "Aicho Official Store";

        systemPrompt = "Bạn là chuyên gia Chăm sóc khách hàng và Xử lý khủng hoảng truyền thông TMĐT hàng đầu tại Việt Nam (Shopee, TikTok Shop, Lazada). Nhiệm vụ của bạn là luôn cung cấp chính xác 3 PHƯƠNG ÁN PHẢN HỒI (3 câu trả lời) theo 3 phong cách khác nhau cho nhà bán hàng lựa chọn.";

        userPrompt = `Hãy đóng vai Trưởng bộ phận CSKH của shop "${shopName}".
Xử lý đánh giá sau đây của khách hàng:
- Mức sao: ${rating}
- Nội dung đánh giá của khách: "${reviewText}"${issueType}${note}

YÊU CẦU BẮT BUỘC:
Bạn PHẢI đưa ra ĐỦ 3 CÂU TRẢ LỜI (3 PHƯƠNG ÁN PHẢN HỒI) theo 3 phong cách tâm lý khác nhau để chủ shop lựa chọn, kèm theo hướng dẫn hành động hậu trường (xử lý inbox) cho từng phương án.

Hãy trình bày chính xác theo đúng cấu trúc Markdown dưới đây (không thêm lời chào hay giải thích ngoài lề):

## 1. Phong Cách Chân Thành & Cầu Thị (Khuyên Dùng)
- **Phản hồi công khai**: [Viết câu trả lời công khai từ 3-5 câu: Thừa nhận thiếu sót một cách chân thành, lịch sự, nhún nhường, hạ nhiệt bức xúc của khách, xin lỗi vì trải nghiệm không vui, cam kết đền bù/đổi trả 100% miễn phí và tha thiết mời khách kiểm tra tin nhắn riêng]
- **Hành động hậu trường**: [Hướng dẫn cụ thể chủ shop nhắn tin riêng cho khách nói gì, tặng voucher bù đắp bao nhiêu hoặc gửi quà đền bù thế nào]

## 2. Phong Cách Khéo Léo & Khách Quan (Lỗi Vận Chuyển / Ngoại Cảnh)
- **Phản hồi công khai**: [Viết câu trả lời công khai từ 3-5 câu: Khéo léo phân trần sự cố có thể do quá trình vận chuyển quăng quật hoặc yếu tố khách quan, nhưng khẳng định Shop chịu 100% trách nhiệm hỗ trợ không để khách chịu thiệt, đồng thời hướng dẫn khách cách xử lý nhanh]
- **Hành động hậu trường**: [Kiểm tra lại camera đóng gói, gửi khiếu nại lên đơn vị vận chuyển của sàn, đồng thời chủ động liên hệ gửi sản phẩm mới nguyên vẹn cho khách]

## 3. Phong Cách Minh Bạch & Bảo Vệ Thương Hiệu (Khẳng Định Uy Tín)
- **Phản hồi công khai**: [Viết câu trả lời công khai từ 3-5 câu: Lịch sự, chuyên nghiệp, giải thích rõ ràng về quy chuẩn chất lượng/nguồn gốc sản phẩm để người mua khác hiểu đúng, đồng thời sẵn sàng thu hồi sản phẩm và hoàn tiền 100% nếu khách không hài lòng]
- **Hành động hậu trường**: [Chuẩn bị sẵn hình ảnh hóa đơn VAT, chứng từ hoặc clip kiểm tra hàng để gửi riêng cho khách xem, giải tỏa hiểu lầm một cách văn minh]

## Lời khuyên vàng khi xử lý đánh giá
- Phản hồi trong vòng 1-2 giờ đầu tiên để ngăn chặn khách chia sẻ đánh giá tiêu cực lên mạng xã hội.
- Tuyệt đối không tranh cãi gay gắt hay đổ lỗi cho khách hàng trên bình luận công khai.
- Sau khi đã hỗ trợ khách đổi mới hoặc đền bù hài lòng qua tin nhắn riêng, hãy khéo léo nhờ khách chỉnh sửa lại đánh giá thành 5 sao.
- Báo cáo sàn can thiệp nếu phát hiện đánh giá có dấu hiệu cạnh tranh không lành mạnh từ đối thủ.`;
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

      case "title-spinner":
        userPrompt = `Tôi muốn nhân bản sản phẩm trên Shopee để chống bị quét spam trùng lặp nội dung.
Tiêu đề gốc: "${inputs.originalTitle}"
Hãy tạo đúng 10 biến thể tiêu đề (Spin content). Yêu cầu:
- Giữ nguyên các từ khoá chính quan trọng nhất.
- Đảo vị trí từ ngữ, thay đổi các từ khóa phụ (như thêm: Chính hãng, Freeship, Cao cấp, Giá xưởng...).
- Các tiêu đề không được giống nhau hoàn toàn nhưng vẫn phải tự nhiên, thu hút người click và dưới 120 ký tự.
- Trình bày danh sách đánh số rõ ràng từ 1 đến 10 (mỗi dòng một tiêu đề theo định dạng: "1. [Nội dung tiêu đề]"), không thêm lời chào hay kết bài rườm rà.`;
        break;

      case "ad-copy": {
        const platform = inputs.adPlatform || "both";
        const isShopee = platform === "shopee" || platform === "both";
        const isTiktok = platform === "tiktok" || platform === "both";

        systemPrompt = "Bạn là chuyên gia Performance Marketing hàng đầu chuyên tối ưu chuyển đổi quảng cáo trên Shopee Ads và TikTok Ads tại thị trường Việt Nam. Hãy trả về kết quả bằng tiếng Việt, định dạng Markdown rõ ràng, chuyên nghiệp.";

        const platformTitle = platform === "both" 
          ? "SHOPEE ADS & TIKTOK SPARK ADS" 
          : platform === "shopee" 
          ? "SHOPEE ADS" 
          : "TIKTOK SPARK ADS";

        userPrompt = `Nhiệm vụ của bạn là tạo chiến dịch quảng cáo chuyển đổi cao cho sản phẩm dưới đây dựa trên nền tảng được chọn: ${platformTitle}.

DỮ LIỆU ĐẦU VÀO:
- Tên Sản Phẩm: ${inputs.productName}
- Giá bán / Giá khuyến mãi: ${inputs.price}
- Điểm nổi bật (USP) / Giải quyết vấn đề gì: ${inputs.usp}
- Đối tượng nhắm tới: ${inputs.targetAudience}
- Nền tảng: ${platformTitle}

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (MARKDOWN CHUẨN XÁC, KHÔNG LỒNG THẺ THỪA):
${isShopee ? `
## 🛒 PHẦN 1: CHIẾN DỊCH SHOPEE ADS TỐI ƯU TÌM KIẾM

### 📌 Nhóm 1: Từ khóa chính xác (Exact Match) - Ý định mua cao
(Liệt kê 4-6 từ khóa cốt lõi người dùng gõ khi đã sẵn sàng mua hàng, mỗi dòng theo đúng định dạng: - Tên từ khóa: Mức giá thầu)
- [Tên từ khóa]: [Giá thầu đề xuất: 2.000đ - 3.500đ]

### 📌 Nhóm 2: Từ khóa mở rộng (Broad Match) - Gom traffic giá rẻ
(Liệt kê 4-6 từ khóa bao quát, từ khóa giải pháp)
- [Tên từ khóa]: [Giá thầu đề xuất: 500đ - 1.500đ]

### 📌 Nhóm 3: Từ khóa lỗi gõ / từ địa phương / từ khóa ngách
(Liệt kê 3-5 từ khóa không dấu, gõ sai chính tả phổ biến, từ địa phương ít cạnh tranh)
- [Tên từ khóa]: [Giá thầu đề xuất: 200đ - 800đ]

### 🎯 3 MẪU TIÊU ĐỀ QUẢNG CÁO TỐI ƯU CTR (Dưới 60 ký tự):
(Giật tít thu hút người mua click, tận dụng số liệu, deal hot, bảo hành, cam kết. Tuyệt đối không quá 60 ký tự mỗi tiêu đề):
- Mẫu 1 (Góc Deal sốc & Quà tặng): [Nội dung tiêu đề dưới 60 ký tự]
- Mẫu 2 (Góc USP & Tính năng độc quyền): [Nội dung tiêu đề dưới 60 ký tự]
- Mẫu 3 (Góc Cam kết uy tín & Chính hãng): [Nội dung tiêu đề dưới 60 ký tự]
` : ""}
${isTiktok ? `
## 🎵 PHẦN ${isShopee ? "2" : "1"}: CHIẾN DỊCH TIKTOK SPARK ADS TỐI ƯU GIỎ HÀNG

### ⚡ 5 CÂU HOOK TEXT ĐÈ VIDEO (Overlay Text trong 3 giây đầu):
(Đánh trúng nỗi đau, gây tò mò cực độ, khiến người xem dừng lướt):
- Hook 1 (Góc Cảnh báo / Ngăn cản): "[Câu Hook kích thích]"
- Hook 2 (Góc Sự thật bất ngờ / Vạch trần): "[Câu Hook kích thích]"
- Hook 3 (Góc Đổi đời sau khi dùng): "[Câu Hook kích thích]"
- Hook 4 (Góc So sánh tương phản): "[Câu Hook kích thích]"
- Hook 5 (Góc Tò mò cực đỉnh): "[Câu Hook kích thích]"

### 📝 3 MẪU CAPTION QUẢNG CÁO KÈM CALL-TO-ACTION (CTA):
(Dưới 100 chữ, ngắn gọn, súc tích, thúc đẩy bấm vào biểu tượng Giỏ hàng màu vàng ở góc trái màn hình):
- Mẫu Caption 1 (Tập trung giải quyết nỗi đau): [Nội dung caption]
- Mẫu Caption 2 (Review nhanh tính năng đỉnh): [Nội dung caption]
- Mẫu Caption 3 (Cảnh báo sắp hết Flash Sale): [Nội dung caption]

### 🏷️ 5 HASHTAG CHẠY ADS CHUẨN TỆP:
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5
` : ""}

Quy tắc:
- Không thêm lời dẫn rườm rà.
- Trả về nội dung thực chiến, áp dụng được ngay.`;
        break;
      }

      case "chat-broadcast": {
        const channel = inputs.channel || "both";
        const isShopee = channel === "shopee" || channel === "both";
        const isZalo = channel === "zalo" || channel === "both";

        const scenarioMap: Record<string, string> = {
          cart_abandoned: "Nhắc giỏ hàng bỏ quên (Khách đã thêm vào giỏ nhưng chưa thanh toán)",
          loyalty_voucher: "Tri ân khách cũ tặng voucher độc quyền (Chăm sóc khách đã từng mua hàng)",
          repurchase: "Nhắc mua lại hàng tiêu hao (Đã đến chu kỳ cần bổ sung / thay mới sản phẩm)",
          mega_sale: "Thông báo Mega Sale / Flash Sale độc quyền cho khách thân thiết",
        };

        const scenarioText = scenarioMap[inputs.scenario] || inputs.scenario || "Tri ân khách hàng cũ";

        systemPrompt = "Bạn là chuyên gia CRM và Chăm sóc Khách hàng TMĐT (Retention Marketing) hàng đầu. Hãy viết kịch bản tin nhắn remarketing gửi cho khách hàng cũ để kéo họ quay lại mua hàng mà KHÔNG GÂY CẢM GIÁC LÀM PHIỀN HOẶC SPAM. Hãy trả về kết quả bằng tiếng Việt, định dạng Markdown rõ ràng, chuyên nghiệp.";

        userPrompt = `Hãy viết các mẫu tin nhắn remarketing gửi khách cũ theo thông tin sau:

DỮ LIỆU ĐẦU VÀO:
- Tên Gian Hàng / Shop: ${inputs.shopName}
- Tên Sản Phẩm / Danh Mục: ${inputs.productName}
- Tình huống gửi: ${scenarioText}
- Ưu đãi / Voucher / Quà tặng: ${inputs.offer}
- Kênh gửi: ${channel === "both" ? "Shopee Chat Broadcast & Zalo" : channel === "shopee" ? "Shopee Chat Broadcast" : "Zalo OA & Zalo Cá Nhân"}

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (MARKDOWN CHUẨN):
${isShopee ? `
## 💬 KỊCH BẢN SHOPEE CHAT BROADCAST (TỐI ƯU GIAO DIỆN CHAT SÀN)
Quy chuẩn nghiêm ngặt:
- Độ dài: CỰC KỲ SÚC TÍCH (DƯỚI 350 KÝ TỰ mỗi mẫu tin để hiển thị trọn vẹn trên popup chat sàn Shopee mà không bị ẩn 'Xem thêm').
- Tính CẤP BÁCH: Mã giảm giá có hạn số lượng, sắp hết hạn trong 24h.
- Lời kêu gọi: Hướng dẫn khách bấm vào giỏ hàng hoặc bấm lưu voucher ngay kèm theo tin nhắn.

Hãy cung cấp 3 biến thể:
### Mẫu 1 (Trực diện & Cấp bách):
[Nội dung tin nhắn dưới 350 ký tự]

### Mẫu 2 (Thân thiện & Tri ân đặc quyền):
[Nội dung tin nhắn dưới 350 ký tự]

### Mẫu 3 (Kích thích tò mò & Giới hạn số lượng):
[Nội dung tin nhắn dưới 350 ký tự]
` : ""}
${isZalo ? `
## 📱 KỊCH BẢN ZALO OA & ZALO CÁ NHÂN (CHĂM SÓC KHÁCH HÀNG THÂN THIẾT)
Quy chuẩn nghiêm ngặt:
- Văn phong: Thân tình, ấm áp, lịch sự, xưng hô "Em/Shop" và "Anh/Chị".
- Luôn có phần HỎI THĂM TRẢI NGHIỆM sử dụng đơn hàng cũ trước khi giới thiệu ưu đãi mới (tuyệt đối không vào đề bán hàng ngay).
- Kêu gọi khách phản hồi tin nhắn để được gửi mã riêng hoặc hỗ trợ miễn phí vận chuyển.

Hãy cung cấp 3 biến thể:
### Mẫu 1 (Hỏi thăm chân thành & Tặng quà tri ân):
[Nội dung tin nhắn]

### Mẫu 2 (Nhắc chu kỳ sử dụng & Ưu đãi thành viên VIP):
[Nội dung tin nhắn]

### Mẫu 3 (Hỗ trợ riêng 1:1 & Giữ voucher độc quyền):
[Nội dung tin nhắn]
` : ""}

### 💡 LỜI KHUYÊN GỬI TIN HIỆU QUẢ TỪ CHUYÊN GIA:
- Khung giờ vàng gửi tin có tỷ lệ mở cao nhất.
- Tần suất gửi phù hợp để tránh bị khách chặn (block).`;
        break;
      }

      case "video-repurposer": {
        const toneMap: Record<string, string> = {
          gen_z: "Hài hước, bắt trend, Gen Z năng động, từ ngữ viral tự nhiên",
          expert: "Chuyên gia uy tín, chuyên sâu, phân tích logic, khách quan và đáng tin cậy",
          friendly: "Tâm sự gần gũi, chân thật, như bạn thân chia sẻ trải nghiệm đời thường",
        };

        const toneText = toneMap[inputs.brand_tone] || inputs.brand_tone || "Tâm sự gần gũi";
        const ctaText = inputs.call_to_action || "Bình luận nhận link / Mua ngay";
        const productName = inputs.product_name || "Sản phẩm";
        const videoScript = inputs.video_script || "";

        systemPrompt = `Bạn là Giám đốc Sáng tạo Nội dung Đa kênh (Omnichannel Content Strategist).
Nhiệm vụ của bạn là nhận vào kịch bản/lời thoại của 1 video ngắn (TikTok/Reels) và chuyển đổi thành 5 ĐỊNH DẠNG NỘI DUNG CHUYÊN BIỆT cho 5 kênh khác nhau, tuân thủ nghiêm ngặt văn hóa người dùng của từng nền tảng:
---
ĐỊNH DẠNG 1: BÀI ĐĂNG FACEBOOK GROUP (Phong cách Seeding / Tâm sự thật)
- Không dùng từ ngữ bán hàng lộ liễu, không chèn link trực tiếp (tránh bị admin duyệt bài).
- Viết dưới dạng chia sẻ kinh nghiệm thực tế, tự nhận mình từng gặp vấn đề gì -> đã tìm ra giải pháp này ra sao.
- Cuối bài: Kêu gọi thảo luận tự nhiên ("Có bác nào dùng dòng này chưa cho em xin thêm review?", "Bác nào cần link em để dưới cmt nhé").
---
ĐỊNH DẠNG 2: BÀI ĐĂNG FANPAGE FACEBOOK (Tối ưu Click & Inbox)
- Dòng 1-2: Giật tít cực mạnh, chạm nỗi đau hoặc gây tò mò.
- Thân bài: 3-4 gạch đầu dòng ngắn gọn với icon bắt mắt.
- Cuối bài: Call-to-action dứt khoát (Nhắn tin nhận ưu đãi / Bấm vào link đặt hàng).
---
ĐỊNH DẠNG 3: KỊCH BẢN CHUỖI ẢNH CAROUSEL (Dành cho Lemon8 / Facebook Album / Instagram)
- Chuyển nội dung video thành kịch bản 5 Slide ảnh ngắn:
  * Slide 1 (Bìa): Tiêu đề giật tít dạng "Tips / Cách làm / Sai lầm".
  * Slide 2, 3, 4: Mỗi slide là 1 bước hoặc 1 ưu điểm cụ thể (dưới 20 từ mỗi slide).
  * Slide 5: Tổng kết + Kêu gọi thả tim & Lưu lại (Save) bài viết.
---
ĐỊNH DẠNG 4: BÀI VIẾT REVIEW CHUẨN SEO (Đăng Website / Blog Affiliate)
- Đặt tiêu đề chuẩn SEO Google (chứa tên sản phẩm + từ khóa tìm kiếm).
- Cấu trúc: Giới thiệu -> Đánh giá trải nghiệm thực tế -> Bảng Ưu & Nhược điểm (Pros & Cons) -> Lời khuyên ai nên mua.
---
ĐỊNH DẠNG 5: TIN NHẮN ZALO OA / TIN NHẮN CHĂM SÓC KHÁCH HÀNG
- Độ dài ngắn gọn, thân mật, xưng hô "Em - Anh/Chị".
- Tóm tắt giá trị lớn nhất từ video và gửi tặng riêng một ưu đãi/voucher bí mật.`;

        userPrompt = `Hãy chuyển đổi kịch bản video sau đây thành 5 ĐỊNH DẠNG NỘI DUNG CHUYÊN BIỆT:

DỮ LIỆU ĐẦU VÀO:
- Tên sản phẩm: ${productName}
- Kịch bản video gốc:
"""
${videoScript}
"""
- Mục tiêu kêu gọi (CTA): ${ctaText}
- Văn phong: ${toneText}

YÊU CẦU ĐẦU RA (MARKDOWN CHUẨN XÁC VỚI TIÊU ĐỀ VÀ PHÂN ĐOẠN RÕ RÀNG):

## 👥 ĐỊNH DẠNG 1: BÀI ĐĂNG FACEBOOK GROUP (Seeding / Tâm Sự Thực Tế)
[Bài viết phong cách tâm sự chia sẻ thật, không quảng cáo lộ liễu, kết bài kêu gọi thảo luận/hỏi cmt tự nhiên]

---

## 📢 ĐỊNH DẠNG 2: BÀI ĐĂNG FANPAGE FACEBOOK (Tối Ưu Click & Inbox)
[Giật tít mạnh mẽ 1-2 dòng đầu, 3-4 gạch đầu dòng icon bắt mắt, CTA dứt khoát inbox/click link]

---

## 📸 ĐỊNH DẠNG 3: KỊCH BẢN CHUỖI ẢNH CAROUSEL (Lemon8 / Facebook Album / Instagram)
[Kịch bản chi tiết 5 slide ngắn gọn, súc tích:
- Slide 1 (Bìa): [Tiêu đề giật tít]
- Slide 2: [Ý 1 - dưới 20 từ]
- Slide 3: [Ý 2 - dưới 20 từ]
- Slide 4: [Ý 3 - dưới 20 từ]
- Slide 5: [Tổng kết + Kêu gọi Thả tim & Lưu lại (Save)]]

---

## 📝 ĐỊNH DẠNG 4: BÀI VIẾT REVIEW CHUẨN SEO (Website / Blog Affiliate)
[Tiêu đề chuẩn SEO Google, Mở bài lôi cuốn, Đánh giá trải nghiệm thực tế, Bảng Ưu & Nhược điểm, Lời khuyên ai nên mua]

---

## 💬 ĐỊNH DẠNG 5: TIN NHẮN ZALO OA / CHĂM SÓC KHÁCH HÀNG
[Ngắn gọn, xưng hô Em - Anh/Chị, tóm tắt giá trị lớn nhất từ video + voucher/ưu đãi bí mật]
`;
        break;
      }

      case "vision-listing": {
        const platform = inputs.platform || "Shopee và TikTok Shop";
        const categoryHint = inputs.categoryHint ? `Ngành hàng dự kiến: ${inputs.categoryHint}` : "";
        const targetAudience = inputs.targetAudience ? `Khách hàng mục tiêu: ${inputs.targetAudience}` : "";
        const shopNote = inputs.shopNote ? `Ghi chú / Ưu đãi của Shop: ${inputs.shopNote}` : "";

        userPrompt = `Bạn là chuyên gia Listing & Tối ưu chuyển đổi sản phẩm E-commerce (Shopee, TikTok Shop, Lazada).
Hãy quan sát thật kỹ hình ảnh sản phẩm được cung cấp (chất liệu, màu sắc, chi tiết đường may/phụ kiện, kiểu dáng, tính năng nổi bật) và thông tin sau:
- Nền tảng đích: ${platform}
${categoryHint}
${targetAudience}
${shopNote}

Hãy sinh nội dung Listing hoàn chỉnh và chuyên nghiệp theo ĐÚNG định dạng Markdown sau:

---

## 🏷️ 1. TIÊU ĐỀ CHUẨN SEO (3 BIẾN THỂ TỐI ƯU CẠNH TRANH)
> Công thức chuẩn: [Tên Sản Phẩm] + [Thương hiệu/Chất liệu] + [Công năng/Tính năng vượt trội] + [Kiểu dáng/Mã phân loại] (dưới 120 ký tự)

- **Biến thể 1 (Chuẩn SEO Tìm kiếm tự nhiên - Shopee/Lazada):**
  [Viết tiêu đề dài, chứa từ khóa chính + từ khóa phụ + mã kích thước/màu sắc]
- **Biến thể 2 (Kéo Click & Bắt Trend - TikTok Shop/Live):**
  [Viết tiêu đề giật tít, kèm icon bắt mắt, kích thích bấm vào xem ngay]
- **Biến thể 3 (Tối ưu Chạy Ads đấu thầu từ khóa):**
  [Tiêu đề ngắn gọn, tập trung chính xác vào Search Intent của người có nhu cầu mua ngay]

---

## 📋 2. BẢNG THÔNG SỐ KỸ THUẬT (ATTRIBUTES CHO SELLER CENTER)
*(Copy/paste nhanh vào các trường thuộc tính bắt buộc khi đăng sản phẩm)*

| Thuộc tính | Giá trị chi tiết từ ảnh |
| :--- | :--- |
| **Loại sản phẩm** | [Tên loại sản phẩm chính xác] |
| **Chất liệu** | [Phân tích chất liệu quan sát được từ ảnh] |
| **Màu sắc / Họa tiết** | [Tất cả phối màu quan sát thấy] |
| **Phong cách** | [Trẻ trung, công sở, sang trọng, streetwear...] |
| **Xuất xứ** | [Việt Nam / Quảng Châu / Tùy chọn] |
| **Tính năng nổi bật** | [Chống nước, thoáng khí, co giãn, đa năng...] |
| **Đối tượng phù hợp** | [Nam/Nữ, học sinh, sinh viên, văn phòng...] |

---

## 📝 3. BÀI VIẾT MÔ TẢ CHUYỂN ĐỔI CAO (CÔNG THỨC AIDA)

### ✨ [ĐIỂM NHẤN ĐẶC QUYỀN CỦA SẢN PHẨM - USP]
[Mở đầu 2-3 câu khơi gợi sự quan tâm và nêu bật giải pháp giải quyết nỗi đau của khách hàng]

### 💎 CHI TIẾT TÍNH NĂNG & THIẾT KẾ
- **Chất liệu & Độ hoàn thiện:** [Mô tả chi tiết cảm giác sờ, bề mặt chất liệu, độ bền từ ảnh]
- **Kiểu dáng & Tiện ích:** [Mô tả form dáng, khả năng phối đồ hoặc công dụng thực tế]
- **Độ ứng dụng:** [Dùng khi nào, ở đâu, tình huống thực tế]

### 📏 BẢNG QUY ĐỔI KÍCH CỠ / HƯỚNG DẪN CHỌN SIZE
- Size S / M / L / XL hoặc kích thước chi tiết phù hợp với cân nặng/chiều cao tiêu chuẩn Việt Nam.

### 🛡️ CAM KẾT VÀNG TỪ SHOP
- Đổi trả trong 7 ngày nếu lỗi từ nhà sản xuất hoặc không đúng hình ảnh.
- Hàng luôn có sẵn, đóng gói kỹ càng và giao nhanh trong 24h.
- Tư vấn nhiệt tình 24/7 qua khung chat của sàn.

---

## 🔍 4. BỘ HASHTAG & TỪ KHÓA TÌM KIẾM
- **Từ khóa hạt nhân (Search Intent cao):** [5-7 từ khóa chính]
- **Hashtag chuẩn SEO Sàn:** #[TừKhóa1] #[TừKhóa2] #[TừKhóa3] #[TừKhóa4] #[TừKhóa5] #[TừKhóa6] #[TừKhóa7] #[TừKhóa8]
`;
        break;
      }

      case "policy-checker": {
        const platform = inputs.platform || "TikTok Shop và Shopee";
        const contentType = inputs.contentType || "Mô tả sản phẩm";
        const contentText = inputs.text || "";

        userPrompt = `Bạn là Trưởng ban Kiểm duyệt Chính sách Nội dung & Tuân thủ Sàn E-commerce hàng đầu (Shopee, TikTok Shop, Facebook Ads) tại Việt Nam.
Hãy kiểm tra và rà soát kỹ lưỡng đoạn nội dung sau:
- Nền tảng: ${platform}
- Loại nội dung: ${contentType}
- Nội dung cần quét:
"""
${contentText}
"""

Nhiệm vụ của bạn:
1. Đánh giá Mức độ rủi ro (AN TOÀN / CẢNH BÁO NHẸ / NGUY HIỂM - CHẮC CHẮN ĂN GẬY).
2. Liệt kê chi tiết mọi từ ngữ, câu văn vi phạm hoặc tiềm ẩn nguy cơ dính quét thuật toán AI của sàn (Lôi kéo ngoài sàn, SĐT, Zalo, cam kết 100%, trị dứt điểm, từ ngữ so sánh nhất 'số 1', thương hiệu quốc tế chưa ủy quyền, chiêu trò giật gân, v.v.).
3. Giải thích LÝ DO TẠI SAO thuật toán quét của sàn sẽ phạt.
4. **ĐẶC BIỆT QUAN TRỌNG:** Viết lại toàn bộ đoạn văn bản thành một BẢN HOÀN CHỈNH AN TOÀN 100% (Safe Version), vừa giữ nguyên ý nghĩa thuyết phục, cuốn hút, vừa né hoàn toàn mọi từ ngữ nhạy cảm để Seller chỉ cần bấm Copy là đăng ngay không sợ bị khóa sản phẩm!

Hãy trình bày theo ĐÚNG cấu trúc Markdown chuẩn xác sau:

---

## 🛡️ 1. TỔNG QUAN ĐÁNH GIÁ RỦI RO
- **Mức độ rủi ro:** [AN TOÀN / CẢNH BÁO NHẸ / NGUY HIỂM - RỦI RO CAO]
- **Tóm tắt tình trạng:** [1-2 câu kết luận tổng quát về khả năng bị phạt]
- **Các chính sách bị vi phạm:** [Liệt kê các điều khoản sàn có liên quan]

---

## ⚠️ 2. DANH SÁCH CÁC ĐIỂM VI PHẠM CẦN GỠ BỎ
| Từ ngữ / Đoạn văn vi phạm | Nhóm chính sách | Lý do thuật toán sàn gắn cờ | Giải pháp khắc phục |
| :--- | :--- | :--- | :--- |
| "[Từ vi phạm 1]" | [Nhóm vi phạm] | [Giải thích ngắn gọn] | [Từ thay thế an toàn] |
| "[Từ vi phạm 2]" | [Nhóm vi phạm] | [Giải thích ngắn gọn] | [Từ thay thế an toàn] |

---

## ✅ 3. BẢN VIẾT LẠI AN TOÀN 100% (READY TO USE)
*(Nội dung đã được biên tập lại an toàn, xóa bỏ từ cấm nhưng vẫn giữ trọn sức hút bán hàng. Bấm Sao Chép để dùng ngay!)*

[Nội dung bản viết lại hoàn chỉnh ở đây]

---

## 💡 4. LỜI KHUYÊN TỪ CHUYÊN GIA
- [3 lời khuyên thực chiến cho Seller khi đăng sản phẩm thuộc ngành hàng này trên ${platform}]
`;
        break;
      }

      case "unboxing-card": {
        const toneMap: Record<string, string> = {
          emotional: "Chân thành, ấm áp, chạm đến cảm xúc, sự biết ơn sâu sắc của thương hiệu/startup Việt",
          friendly_witty: "Trẻ trung, hài hước, năng động Gen Z, hóm hỉnh và gần gũi",
          premium_elegant: "Sang trọng, quý phái, thanh lịch, xưng hô Quý Khách chuẩn thương hiệu cao cấp",
          cute_cheerful: "Đáng yêu, ngọt ngào, tươi vui, hợp ngành mẹ & bé, quà tặng, phụ kiện",
        };

        const formatMap: Record<string, string> = {
          postcard_a6: "Bưu thiếp A6 (10 x 15 cm) - Tiêu chuẩn sang trọng, phổ biến nhất",
          mini_card: "Thẻ Card visit mini (9 x 5.4 cm) - Nhỏ gọn, tiết kiệm chi phí in ấn",
          voucher_tag: "Tag treo / Thẻ đính kèm nơ hộp quà - Tinh tế và bất ngờ",
        };

        const toneText = toneMap[inputs.cardTone] || inputs.cardTone || "Chân thành, ấm áp";
        const formatText = formatMap[inputs.cardFormat] || inputs.cardFormat || "Bưu thiếp A6";
        const shopName = inputs.shopName || "Gian Hàng Chính Hãng";
        const category = inputs.productCategory || "Sản phẩm";
        const offer = inputs.specialOffer || "Voucher giảm 20k cho đơn sau & Quà tặng bất ngờ khi quét mã bảo hành";

        systemPrompt = "Bạn là chuyên gia hàng đầu về Trải Nghiệm Khách Hàng (Customer Experience), Nghệ thuật Đóng Gói (Unboxing Experience) và Chiến Lược Giữ Chân Khách Hàng (Retention Marketing) trên các sàn TMĐT Việt Nam (Shopee, TikTok Shop, Lazada). Bạn chuyên thiết kế các mẫu thư cảm ơn in nhét trong kiện hàng vừa chạm sâu vào cảm xúc người nhận, vừa tạo 'khiên chắn bảo vệ shop trước đánh giá 1 sao', vừa kích thích khách chụp ảnh/quay video feedback 5 sao, đồng thời khéo léo kéo tệp khách hàng về kênh chăm sóc Zalo OA đúng luật sàn mà không bao giờ bị coi là vi phạm.";

        userPrompt = `Hãy thiết kế một bản Thư Cảm Ơn Nhét Hộp Hàng hoàn chỉnh chuẩn quy cách in ấn cho đơn hàng TMĐT với các thông số sau:

DỮ LIỆU ĐẦU VÀO:
- Tên Shop / Thương hiệu: ${shopName}
- Ngành hàng / Sản phẩm: ${category}
- Phong cách ngôn từ (Tone): ${toneText}
- Định dạng thẻ in: ${formatText}
- Quà tặng / Ưu đãi tri ân: ${offer}

YÊU CẦU ĐẦU RA BẰNG MARKDOWN CHUYÊN NGHIỆP, RÕ RÀNG THEO CẤU TRÚC:

## 🎴 1. MẶT TRƯỚC (BÌA THIỆP - FIRST IMPRESSION)
*(Hiển thị ngay khi khách vừa mở nắp thùng hàng, gây bất ngờ và kích thích đọc tiếp)*
- **Tiêu đề đập vào mắt:** [1 câu giật tít ngắn gọn, ấm áp hoặc bất ngờ]
- **Lời tựa (Sub-headline):** [1-2 câu chào mừng khách hàng đã nhận được món quà này]
- **Điểm nhấn thiết kế (Visual Note):** [Gợi ý icon hoặc chi tiết minh họa trang trí]

---

## 💌 2. MẶT SAU (NỘI DUNG THƯ TRI ÂN ĐẮC NHÂN TÂM)
*(Nội dung chính được trình bày tinh tế, vừa vặn trên mặt sau của thẻ)*

### 🌹 Lời Tri Ân Từ Trái Tim Đội Ngũ
[Đoạn văn từ 3-5 câu: Bày tỏ lòng biết ơn sâu sắc vì giữa hàng ngàn sự lựa chọn ngoài kia, khách hàng đã trao niềm tin cho ${shopName}. Kể lại sự tỉ mỉ, trân trọng của các bạn nhân viên đóng gói khi chuẩn bị gói hàng này cho khách]

### 🛡️ KHIÊN CHẮN 1 SAO (Anti-1-Star Shield)
*(Bắt buộc: Lời nhắc khéo léo, nhún nhường để ngăn chặn đánh giá 1 sao khi có sự cố vận chuyển/nhầm lẫn)*
[Đoạn văn 2-3 câu: "Nếu trong quá trình vận chuyển đường dài hoặc đóng gói có bất kỳ điều gì sơ suất khiến bạn chưa hài lòng, xin bạn ĐỪNG VỘI ĐÁNH GIÁ 1 SAO làm tổn thương công sức của các bạn đóng gói. Xin hãy dành cho ${shopName} cơ hội được chịu trách nhiệm và sửa sai bằng cách nhắn tin ngay qua khung chat sàn để được ĐỔI MỚI 100% MIỄN PHÍ hoặc HOÀN TIỀN trong 24 giờ."]

### ⭐ NAM CHÂM KÉO REVIEW 5 SAO (Review Magnet)
*(Thúc đẩy khách hào hứng chụp ảnh, quay video feedback 5 sao lung linh)*
[Đoạn kêu gọi hấp dẫn: Hướng dẫn khách chụp ảnh hoặc quay clip unboxing xinh xắn kèm đánh giá 5 sao để nhận ngay phần quà tri ân đặc biệt hoặc voucher mua sắm cho đơn hàng tiếp theo]

### 📲 CỔNG QUÉT QR CHĂM SÓC KHÁCH HÀNG AN TOÀN (Safe QR / Zalo OA)
*(Khéo léo chuyển đổi data khách về Zalo OA hợp lệ theo quy định sàn thông qua lý do Bảo hành/Tích điểm)*
- **Khung quét mã QR:** [Gợi ý khung text đặt cạnh mã QR in trên thẻ]
- **Lời dẫn an toàn sàn:** "Quét mã QR để KÍCH HOẠT BẢO HÀNH ĐIỆN TỬ CHÍNH HÃNG 1 ĐỔI 1 & NHẬN QUÀ BÍ MẬT DÀNH RIÊNG CHO KHÁCH HÀNG THÂN THIẾT CỦA ${shopName.toUpperCase()}"

---

## 🖨️ 3. QUY CHUẨN IN ẤN & TỐI ƯU CHI PHÍ THỰC CHIẾN
- **Quy cách kích thước in:** [Thông số mm chuẩn xưởng in cho ${formatText}]
- **Chất liệu giấy đề xuất:** [Gợi ý loại giấy (ví dụ C300 cán màng mờ hoặc Giấy Kraft) và ưu nhược điểm]
- **Ước tính chi phí in tại xưởng Việt Nam:** [Khoảng giá in theo số lượng 500 - 2.000 tấm]
- **Mẹo nhỏ từ chuyên gia:** [1 mẹo thực chiến giúp tấm thiệp phát huy 200% tác dụng khi xếp vào hộp hàng]
`;
        break;
      }

      case "anti-return-nudge": {
        const scenarioMap: Record<string, string> = {
          just_ordered: "Khách vừa bấm đặt hàng COD (Xác nhận đơn & tạo trách nhiệm nhận hàng)",
          cancel_requested: "Khách bấm Yêu cầu hủy đơn trước khi giao (Cứu đơn khẩn cấp)",
          delivery_failed_1: "Shipper báo Giao không thành công lần 1 / Thuê bao (Cứu đơn hoàn)",
          delayed_shipment: "Đơn hàng bị trễ do kho vận/thời tiết (Trấn an khách tránh hủy)",
          expensive_cod: "Đơn COD giá trị cao trên 500.000đ (Lọc đơn ảo & xác thực ý định mua)",
        };

        const scenarioText = scenarioMap[inputs.scenario] || inputs.scenario || "Xác nhận đơn hàng COD";
        const shopName = inputs.shopName || "Shop";
        const productName = inputs.productName || "Sản phẩm";
        const codAmount = inputs.codAmount ? `${inputs.codAmount}đ` : "Đơn hàng COD";
        const customerReason = inputs.customerReason ? `Lý do/Phản hồi từ khách: ${inputs.customerReason}` : "";
        const offer = inputs.compensationOffer ? `Ưu đãi/Phương án cứu đơn: ${inputs.compensationOffer}` : "Hỗ trợ đổi size/màu miễn phí, tặng quà độc quyền trong kiện hàng";

        systemPrompt = "Bạn là Chuyên gia Vận hành Đơn hàng TMĐT và Xử lý Khủng hoảng Hoàn Hàng (COD & Return Defense) hàng đầu tại Việt Nam. Bạn thấu hiểu tâm lý mua sắm bốc đồng, nỗi sợ bị lừa và lý do 'bom hàng' của người mua trên TikTok Shop, Shopee và Lazada. Bạn chuyên viết các kịch bản tin nhắn và lời thoại gọi điện đắc nhân tâm, vừa khéo léo bảo vệ dòng tiền cho shop, vừa biến khách hàng do dự thành khách hàng hào hứng nhận kiện hàng.";

        userPrompt = `Hãy xây dựng bộ kịch bản cứu đơn và chống hoàn hàng COD toàn diện theo thông tin sau:

DỮ LIỆU ĐẦU VÀO:
- Tên Gian Hàng / Shop: ${shopName}
- Tên Sản Phẩm: ${productName}
- Giá trị thu hộ COD: ${codAmount}
- Tình huống xử lý: ${scenarioText}
${customerReason}
- Ưu đãi / Phương án hỗ trợ nếu cần: ${offer}

YÊU CẦU ĐẦU RA BẰNG MARKDOWN CHUYÊN NGHIỆP, RÕ RÀNG THEO CẤU TRÚC:

## 💬 1. KỊCH BẢN TIN NHẮN CHAT SÀN (SHOPEE / TIKTOK SHOP)
*(Tin nhắn gửi trực tiếp qua khung chat sàn cho khách hàng)*

### 📱 Mẫu 1: Ngắn Gọn & Hiển Thị Hoàn Hảo (Dưới 350 ký tự)
*(Bắt buộc: Cực kỳ súc tích để khách nhìn thấy toàn bộ trên màn hình thông báo điện thoại mà không phải bấm 'Xem thêm')*
[Nội dung tin nhắn dưới 350 ký tự: Chào khách xưng tên thân thiện, thông báo trạng thái đơn, nêu bật quyền lợi đặc biệt của khách khi nhận kiện hàng này, dặn dò mở máy nhận hàng]

### 🎁 Mẫu 2: Đánh Vào Quyền Lợi & Tạo Trách Nhiệm (Kèm Quà Tặng / Cam Kết)
[Nội dung tin nhắn: Nhắc đến phần quà bất ngờ đã được đóng gói kỹ lưỡng bên trong gói hàng dành riêng cho khách, cam kết cho phép đồng kiểm / hỗ trợ đổi mới 1-1 nếu không vừa, khiến khách cảm thấy được quan tâm đặc biệt và ngại từ chối nhận]

---

## 📞 2. KỊCH BẢN GỌI ĐIỆN THOẠI / SMS TRỰC TIẾP
*(Dành cho nhân viên CSKH khi gọi điện thoại xác nhận hoặc nhắn SMS/Zalo trực tiếp)*

### 🎙️ Lời Thoại Cuộc Gọi (Kịch bản 45 giây)
- **Lời mở đầu:** "[Chào khách ấm áp, xưng tên shop, xác nhận tên khách hàng một cách tự nhiên nhất]"
- **Xử lý tình huống:** "[Câu nói tháo gỡ lo lắng hoặc hỗ trợ lý do khách đưa ra, ví dụ: đổi giờ giao thuận tiện, đổi địa chỉ nhận, trấn an về chất lượng hàng]"
- **Chốt hẹn giao hàng:** "[Câu chốt giờ shipper giao lại để khách chủ động chuẩn bị tiền mặt và nghe máy]"

### 📩 Mẫu SMS / Zalo Nhắn Tin Nhanh (Dưới 160 ký tự)
[Mẫu tin nhắn SMS ngắn gọn thông báo kiện hàng quan trọng đang trên đường tới, xin phép nhờ khách chú ý cuộc gọi của shipper]

---

## 🛡️ 3. KẾ HOẠCH HÀNH ĐỘNG DỰ PHÒNG TRÊN SELLER CENTER (PLAN B)
- **Thao tác trên hệ thống sàn:** [Hướng dẫn chủ shop thao tác cụ thể trên giao diện Seller Center để hoãn hoàn hàng / yêu cầu giao lại lần 2, lần 3]
- **Phối hợp với Shipper / Bưu cục:** [Mẹo liên hệ bưu cục phát hoặc tổng đài vận chuyển để thúc đẩy shipper mang hàng đi giao lại thay vì vội bấm 'Khách không nghe máy']

---

## 🧠 4. BÍ QUYẾT TÂM LÝ HỌC CHỐNG BOM HÀNG TỪ CHUYÊN GIA
- [3 mẹo tâm lý học thực chiến giúp tỷ lệ nhận hàng tăng vọt 20-30%, ví dụ: Tạo cảm giác chờ đợi háo hức, Kỹ thuật ràng buộc cam kết nhỏ, Nhắc nhở văn minh về công sức người lao động]
`;
        break;
      }

      case "product-validator": {
        const productName = inputs.productName || "Sản phẩm";
        const costPrice = inputs.costPrice ? `${inputs.costPrice}đ` : "Chưa rõ";
        const targetPrice = inputs.targetPrice ? `${inputs.targetPrice}đ` : "Chưa rõ";
        const platform = inputs.platform || "Shopee và TikTok Shop";
        const source = inputs.source || "Nhập sỉ / Xưởng Việt Nam";
        const notes = inputs.notes ? `Ghi chú chi tiết: ${inputs.notes}` : "";

        systemPrompt = "Bạn là Giám đốc Nghiên cứu Thị trường & Thẩm định Sản phẩm TMĐT hàng đầu tại Việt Nam (Shopee, TikTok Shop, Lazada). Bạn có tư duy tài chính sắc bén, am hiểu sâu sắc về biên độ lợi nhuận, chi phí sàn ẩn (phí cố định, phí dịch vụ, voucher, tỷ lệ hoàn hàng, phí quảng cáo), các rủi ro vận hành (cồng kềnh, dễ vỡ, vi phạm chính sách) và phân biệt rõ giữa sản phẩm Trend ngắn hạn bẫy vốn và sản phẩm Evergreen bền vững.";

        userPrompt = `Hãy thẩm định toàn diện tiềm năng và rủi ro thương mại của sản phẩm sau đây trước khi nhà bán hàng xuống tiền nhập hàng:

DỮ LIỆU ĐẦU VÀO:
- Tên Sản Phẩm / Ý Tưởng: ${productName}
- Giá vốn nhập dự kiến: ${costPrice}
- Giá bán mục tiêu: ${targetPrice}
- Kênh bán dự kiến: ${platform}
- Nguồn hàng: ${source}
${notes}

YÊU CẦU ĐẦU RA BẰNG MARKDOWN CHUYÊN NGHIỆP, RÕ RÀNG THEO CẤU TRÚC:

## 📊 1. BẢNG ĐIỂM TIỀM NĂNG SẢN PHẨM (THANG ĐIỂM 100)
- **Điểm tổng quan:** [X/100 Điểm] — [KHUYÊN NÊN LÀM / CÂN NHẮC KỸ / RỦI RO CAO - NÊN BỎ]
- **Đánh giá ngắn gọn:** [2 câu kết luận thực tế nhất]

| Tiêu chí thẩm định | Điểm (1-10) | Nhận xét chi tiết từ chuyên gia |
| :--- | :--- | :--- |
| **Dung lượng & Nhu cầu tìm kiếm** | [X/10] | [Phân tích lượng khách cần mua] |
| **Mức độ bão hòa & Cạnh tranh giá** | [X/10] | [Đối thủ phá giá, tổng kho có làm không] |
| **Biên lợi nhuận thực tế sau phí & ads** | [X/10] | [Sau khi trừ phí sàn 12-16% + Ads + Hoàn hàng còn lãi không] |
| **Vòng đời & Tính bền vững** | [X/10] | [Hàng Trend ngắn hạn <1 tháng hay Evergreen quanh năm] |
| **Độ dễ vận hành & Rủi ro vận chuyển** | [X/10] | [Cồng kềnh ăn cước, bể vỡ, hạn sử dụng] |

---

## ⚠️ 2. CẢNH BÁO TỬ HUYỆT VẬN HÀNH & RỦI RO ẨN
- **Rủi ro cước cân nặng / Thể tích (Volumetric Weight):** [Đánh giá kích thước đóng gói so với giá trị món hàng]
- **Rủi ro tỷ lệ hoàn hàng (COD Risk):** [Sản phẩm này khách có dễ bom hay từ chối nhận không?]
- **Rủi ro chính sách & Vi phạm sàn:** [Nghi vấn dính bản quyền thương hiệu, từ cấm y tế hoặc hạn chế quảng cáo]

---

## 💡 3. CHIẾN LƯỢC BIẾN THỂ NGÁCH & NÉ BẪY GIÁ RẺ
- **Biến thể độc quyền (Differentiating Angle):** [Gợi ý cải tiến màu sắc, chất liệu hoặc quà tặng độc quyền để né cuộc chiến phá giá của các tổng kho]
- **Gợi ý Combo / Upsell đẩy giá trị giỏ hàng (AOV):** [Gợi ý 1-2 món bán kèm để tăng giá trị đơn hàng]

---

## 🎯 4. KẾT LUẬN & LỘ TRÌNH TEST ĐƠN AN TOÀN
- **Khuyến nghị số lượng nhập thử nghiệm:** [Số lượng cái nên nhập đợt 1 để test thị trường]
- **Ngân sách Ads tối đa cho phép:** [Chi phí quảng cáo tối đa cho mỗi đơn để không bị lỗ vốn]
- **Lời khuyên vàng từ chuyên gia:** [1 lời khuyên sống còn cho mặt hàng này]
`;
        break;
      }

      case "competitor-miner": {
        const productName = inputs.productName || "Sản phẩm của Shop";
        const reviews = inputs.competitorReviews || "Đánh giá của khách";
        const category = inputs.category || "Ngành hàng TMĐT";
        const strength = inputs.shopStrength ? `Thế mạnh của Shop: ${inputs.shopStrength}` : "";

        systemPrompt = "Bạn là Chuyên gia Chiến lược Định vị Thương hiệu và Phân tích Đối thủ Cạnh tranh (Competitive Intelligence) TMĐT hàng đầu Việt Nam. Bạn có biệt tài 'đọc vị' tâm lý khách hàng từ những lời chê bai cay đắng nhất dành cho đối thủ, biến điểm yếu chí mạng của đối thủ thành vũ khí USP (Unique Selling Proposition) độc quyền và xây dựng các thông điệp truyền thông dìm hàng đối thủ một cách văn minh, tinh tế mà không bao giờ vi phạm luật quảng cáo.";

        userPrompt = `Hãy phân tích tập trung các phản hồi tiêu cực / đánh giá chê của khách hàng về đối thủ sau đây để tìm ra vũ khí cạnh tranh cho sản phẩm của tôi:

DỮ LIỆU ĐẦU VÀO:
- Tên Sản Phẩm của Shop tôi: ${productName}
- Ngành hàng: ${category}
${strength}
- Danh sách Đánh giá / Review chê của khách về đối thủ:
"""
${reviews}
"""

YÊU CẦU ĐẦU RA BẰNG MARKDOWN CHUYÊN NGHIỆP, RÕ RÀNG THEO CẤU TRÚC:

## 🔍 1. BÓC TÁCH 3 TỬ HUYỆT LỚN NHẤT CỦA ĐỐI THỦ
*(Những điểm khách hàng thất vọng và ức chế nhất khi mua của đối thủ)*
- **Tử huyệt 1 (Lỗi sản phẩm / Chất liệu):** [Bóc tách lỗi kèm phân tích vì sao khách thất vọng]
- **Tử huyệt 2 (Đóng gói / Giao hàng / Phụ kiện):** [Lỗi bao bì móp méo, thiếu phụ kiện hoặc hướng dẫn]
- **Tử huyệt 3 (Dịch vụ CSKH / Bảo hành):** [Thái độ phục vụ hoặc sự vô trách nhiệm của đối thủ]

---

## 💎 2. ĐỊNH VỊ VŨ KHÍ USP ĐỘC QUYỀN CHO SHOP BẠN
- **Tuyên ngôn định vị đập tan nỗi sợ:** "[1 câu slogan/tuyên ngôn ngắn gọn khẳng định shop bạn giải quyết triệt để lỗi của đối thủ]"
- **Bảng so sánh hơn hẳn (Shop Bạn vs Đối Thủ Thị Trường):**

| Tiêu chí | Đối thủ trên thị trường | Sản phẩm của Shop Bạn (Vượt trội) |
| :--- | :--- | :--- |
| **Chất liệu / Hoàn thiện** | [Điểm yếu của họ] | [Điểm mạnh cam kết của bạn] |
| **Quy cách đóng gói** | [Hộp sơ sài, dễ vỡ] | [Hộp cứng chống sốc, niêm phong kỹ] |
| **Chính sách bảo hành** | [Trốn tránh, đổ lỗi] | [Đổi mới 100% tận nhà trong 24h] |

---

## 🎬 3. BỘ CÂU HOOK & KỊCH BẢN "DÌM HÀNG VĂN MINH"
*(Đánh trúng nỗi đau khách hàng đã từng trải nghiệm ở shop khác mà không nêu tên đối thủ)*
- **Hook 1 (Góc Cảnh Báo):** "[Câu hook 3s đầu video/livestream]"
- **Hook 2 (Góc Đồng Cảm Thực Tế):** "[Câu hook 3s đầu video/livestream]"
- **Hook 3 (Góc Vạch Trần Sự Thật):** "[Câu hook 3s đầu video/livestream]"
- **Đoạn mô tả sản phẩm "Đá xéo đối thủ tinh tế":** [Đoạn văn 3-4 câu chèn vào bài mô tả sản phẩm để khách đọc xong là không dám mua của đối thủ nữa]

---

## 🛡️ 4. LỜI KHUYÊN PHÒNG THỦ CHO SHOP BẠN
- [3 lưu ý nghiêm ngặt trong khâu sản xuất và đóng gói để shop bạn không bao giờ giẫm vào vết xe đổ của đối thủ]
`;
        break;
      }

      case "photo-prompter": {
        const productName = inputs.productName || "Sản phẩm";
        const style = inputs.style || "minimalist_studio";
        const imageType = inputs.imageType || "product_flatlay";
        const aiTool = inputs.aiTool || "Midjourney v6 / Flux.1";
        const modelInfo = inputs.modelDemographic ? `Người mẫu: ${inputs.modelDemographic}` : "";

        const styleMap: Record<string, string> = {
          minimalist_studio: "Studio tối giản sang trọng, bục podium bê tông/đá cẩm thạch, ánh sáng mềm",
          luxury_hotel: "Khách sạn 5 sao cao cấp, nội thất gỗ óc chó và ánh sáng ấm áp",
          korean_cafe: "Quán cafe phong cách Hàn Quốc pastel, ánh sáng tự nhiên qua ô cửa sổ",
          street_cyberpunk: "Đường phố hiện đại, ánh sáng neon rực rỡ, năng động trẻ trung",
          nature_organic: "Thiên nhiên tươi mát, lá cây xanh, ánh nắng mặt trời buổi sáng, phong cách hữu cơ",
          scandinavian: "Bắc Âu ấm cúng, tông màu be/trắng, chất liệu vải lanh và gỗ sồi",
        };

        const styleText = styleMap[style] || style;

        systemPrompt = `Bạn là Chuyên gia Nhiếp ảnh Thương mại (Commercial Product Photography) kiêm Kỹ sư Prompt AI hàng đầu thế giới chuyên về các nền tảng tạo ảnh: Midjourney, Flux.1, Stable Diffusion (SDXL, SD 3.5), Fooocus, DALL-E 3, Google Imagen 3, Ideogram v2, Leonardo.ai và Adobe Firefly. Bạn am hiểu sâu sắc các thông số ống kính máy ảnh (35mm, 50mm, 85mm prime lens, 100mm macro), khẩu độ (f/1.4, f/2.8), kỹ thuật chiếu sáng studio (softbox, rim light, Rembrandt lighting, caustic reflection) và cấu trúc câu lệnh prompt tiếng Anh chuyên nghiệp tối ưu riêng cho công cụ "${aiTool}" (ví dụ: Midjourney thêm tham số --ar, --v 6.1; Flux/DALL-E dùng câu mô tả tự nhiên phong phú; SDXL/Fooocus thêm trigger tags chuẩn xác) giúp các nhà bán hàng tạo ra ảnh sản phẩm và lookbook người mẫu chân thực 100%.`;

        userPrompt = `Hãy tạo 5 bộ Prompt AI tiếng Anh chuyên nghiệp chuẩn xưởng ảnh thương mại cho sản phẩm sau:

DỮ LIỆU ĐẦU VÀO:
- Tên Sản Phẩm & Chi Tiết: ${productName}
- Phong cách bối cảnh: ${styleText}
- Loại hình ảnh: ${imageType}
- Nền tảng AI: ${aiTool}
${modelInfo}

YÊU CẦU ĐẦU RA BẰNG MARKDOWN CHUYÊN NGHIỆP, RÕ RÀNG THEO CẤU TRÚC:

## 📸 1. TOP 5 BỘ PROMPT TIẾNG ANH CHUẨN STUDIO THƯƠNG MẠI
*(Copy nguyên văn đoạn mã code tiếng Anh vào Midjourney hoặc Flux để tạo ảnh chất lượng 8K)*

### 🌟 Prompt 1: Góc Chụp Toàn Cảnh (Master Hero Shot)
- **English Prompt (Ready to Copy):**
\`\`\`
[Viết prompt tiếng Anh cực kỳ chi tiết bao gồm chủ thể, bối cảnh, ánh sáng, góc máy 85mm f/1.8, màu sắc, octane render, photorealistic, 8k --ar 1:1 --v 6.0]
\`\`\`
- **Ý đồ nhiếp ảnh:** [Giải thích ngắn bằng tiếng Việt về góc chụp và cảm xúc mang lại]

### 🔍 Prompt 2: Góc Chụp Cận Cảnh Chi Tiết (Macro Detail Shot)
- **English Prompt (Ready to Copy):**
\`\`\`
[Viết prompt tiếng Anh chi tiết zoom cận vào chất liệu, đường nét gia công tinh xảo, độ sâu trường ảnh nông bokeh mờ mịt --ar 1:1 --v 6.0]
\`\`\`
- **Ý đồ nhiếp ảnh:** [Giải thích ngắn bằng tiếng Việt]

### 💃 Prompt 3: Góc Lookbook Người Mẫu (Model Lookbook Shot)
- **English Prompt (Ready to Copy):**
\`\`\`
[Viết prompt tiếng Anh mô tả người mẫu tương tác tự nhiên với sản phẩm, thần thái cuốn hút, trang phục phối hợp hoàn hảo --ar 3:4 --v 6.0]
\`\`\`
- **Ý đồ nhiếp ảnh:** [Giải thích ngắn bằng tiếng Việt]

### ☕ Prompt 4: Bối Cảnh Đời Sống Thực Tế (Lifestyle In-Context)
- **English Prompt (Ready to Copy):**
\`\`\`
[Viết prompt tiếng Anh mô tả sản phẩm đặt trong không gian sống thực tế theo đúng phong cách ${styleText}, ánh nắng tự nhiên ấm áp --ar 1:1 --v 6.0]
\`\`\`
- **Ý đồ nhiếp ảnh:** [Giải thích ngắn bằng tiếng Việt]

### ✨ Prompt 5: Phong Cách Tối Giản Nghệ Thuật (High-end Editorial)
- **English Prompt (Ready to Copy):**
\`\`\`
[Viết prompt tiếng Anh theo phong cách tạp chí thời trang Vogue/Elle, ánh sáng bóng đổ nghệ thuật, bục trưng bày điêu khắc --ar 1:1 --v 6.0]
\`\`\`
- **Ý đồ nhiếp ảnh:** [Giải thích ngắn bằng tiếng Việt]

---

## 🚫 2. BỘ CÂU LỆNH LOẠI TRỪ (NEGATIVE PROMPT)
*(Dán vào ô Negative Prompt / --no để ảnh không bị lỗi)*
\`\`\`
deformed hands, missing fingers, extra limbs, bad anatomy, distorted product, low quality, blurry, text, watermark, logo, oversaturated, plastic skin, cartoon, 3d render look
\`\`\`

---

## 💡 3. MẸO THỰC CHIẾN TỪ NHIẾP ẢNH GIA AI
- [3 mẹo ghép logo hoặc inpaint sản phẩm thật vào ảnh AI để đăng lên sàn chuẩn xác 100%]
`;
        break;
      }

      case "objection-killer": {
        const productName = inputs.productName || "Sản phẩm";
        const price = inputs.price ? `${inputs.price}đ` : "Giá niêm yết";
        const objection = inputs.customerObjection || "Khách chê đắt hoặc đòi suy nghĩ thêm";
        const offer = inputs.flexibleOffer ? `Ưu đãi shop có thể nhượng bộ: ${inputs.flexibleOffer}` : "Voucher 20k, tặng quà bí mật, hỗ trợ đổi size miễn phí";

        systemPrompt = "Bạn là Chuyên gia Đào tạo Bán hàng & Trực Chat CSKH (Live Chat Sales Closing Specialist) hàng đầu tại Việt Nam. Bạn nắm rõ tâm lý do dự, tiếc tiền và sợ bị hớ của người mua online. Bạn chuyên sáng tạo các câu trả lời tin nhắn bẻ gãy mọi lời từ chối theo phong cách 'vừa đắc nhân tâm, vừa khéo léo tạo áp lực chốt đơn nhẹ nhàng', giúp nhân viên trực chat biến khách hàng đang muốn rời đi thành người bấm nút Đặt Hàng trong vòng 3 phút.";

        userPrompt = `Hãy xây dựng bộ kịch bản bẻ gãy lời từ chối và chốt đơn ngay lập tức cho tình huống sau:

DỮ LIỆU ĐẦU VÀO:
- Tên Sản Phẩm: ${productName}
- Mức Giá Hiện Tại: ${price}
- Lời Từ Chối / Thắc Mắc của Khách: "${objection}"
- Ưu đãi linh hoạt Shop có thể hỗ trợ: ${offer}

YÊU CẦU ĐẦU RA BẰNG MARKDOWN CHUYÊN NGHIỆP, RÕ RÀNG THEO CẤU TRÚC:

## 🧠 1. GIẢI MÃ TÂM LÝ ẨN SAU LỜI TỪ CHỐI
- **Nỗi sợ thực sự của khách:** [Phân tích ngắn gọn lý do ngầm khiến khách chần chừ]
- **Sai lầm nhân viên thường mắc:** [Điều tuyệt đối không nên nói khi gặp câu này]

---

## 💬 2. BA PHƯƠNG ÁN PHẢN HỒI BẺ GÃY TỪ CHỐI TỨC THÌ
*(Mỗi phương án từ 2-4 câu súc tích, văn phong thân thiện, xưng hô Em - Anh/Chị, tối ưu cho khung chat sàn)*

### 💎 Phương Án 1: Đánh Vào Giá Trị Vượt Trội (Value Focus - Khuyên Dùng)
- **Mẫu tin nhắn:** "[Nội dung tin nhắn: Đồng cảm với khách, chứng minh sản phẩm bền gấp đôi / chất lượng vượt trội nên tính ra rẻ hơn nhiều lần]"
- **Thời điểm áp dụng:** Dành cho khách chê đắt nhưng thực sự thích sản phẩm.

### ⚡ Phương Án 2: Tung Deal Khan Hiếm 15 Phút (Urgency & Exclusive Offer)
- **Mẫu tin nhắn:** "[Nội dung tin nhắn: Dành riêng 1 suất quà tặng hoặc voucher đặc quyền chỉ có hiệu lực ngay trong phiên chat này]"
- **Thời điểm áp dụng:** Dành cho khách đòi 'suy nghĩ thêm' hoặc so sánh giá.

### 🛡️ Phương Án 3: Đảo Ngược Rủi Ro Tuyệt Đối (Zero-Risk Reversal)
- **Mẫu tin nhắn:** "[Nội dung tin nhắn: Cam kết hỗ trợ đổi trả tận nhà, chịu 100% phí ship nếu không ưng ý, xóa sạch nỗi sợ mua online]"
- **Thời điểm áp dụng:** Dành cho khách sợ hàng không giống ảnh hoặc sợ bị lừa.

---

## 🚀 3. KỸ THUẬT "CÂU HỎI MỞ" BUỘC KHÁCH PHẢI TRẢ LỜI
*(Ngăn chặn tình trạng khách xem xong im lặng bỏ đi - Ghosting)*
- **Câu hỏi lựa chọn 1:** "[Câu hỏi hướng khách chọn màu/size thay vì suy nghĩ có mua hay không]"
- **Câu hỏi lựa chọn 2:** "[Câu hỏi chốt địa chỉ nhận hàng thuận tiện]"

---

## ⏱️ 4. NGUYÊN TẮC VÀNG KHI TRỰC CHAT SÀN
- [3 mẹo giúp tỷ lệ chốt đơn (Conversion Rate) trên khung chat tăng từ 15% lên 40%]
`;
        break;
      }

      default:
        return NextResponse.json({ success: false, error: "Công cụ không hợp lệ." }, { status: 400 });
    }

    let userMessageContent: string | OpenAI.Chat.Completions.ChatCompletionContentPart[] = userPrompt;

    // Xử lý ảnh nếu có
    if ((tool === "appeal-generator" || tool === "vision-listing") && inputs.imageBase64) {
      const isVisionModel = model.includes("vision") || model.includes("vl") || model.includes("llava") || model.includes("gpt-4");
      if (isVisionModel) {
        userMessageContent = [
          { type: "text", text: userPrompt },
          { 
            type: "image_url", 
            image_url: { 
              url: inputs.imageBase64 
            } 
          }
        ];
      } else {
        userMessageContent = userPrompt + "\n\n(Lưu ý: Đang sử dụng model văn bản. Vui lòng phân tích dựa trên mô tả chi tiết của Seller).";
      }
    }

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessageContent }
      ],
      temperature: 0.7,
      max_tokens: [
        "video-repurposer",
        "vision-listing",
        "unboxing-card",
        "anti-return-nudge",
        "product-validator",
        "competitor-miner",
        "photo-prompter",
        "objection-killer"
      ].includes(tool) ? 2500 : 1500,
    });

    const choice = completion.choices[0];
    const outputText = choice?.message?.content?.trim();
    if (!outputText || choice?.message.refusal || choice.finish_reason !== "stop") throw new SeoError("INVALID_AI_OUTPUT", "AI chưa tạo được kết quả hoàn chỉnh. Lượt dùng chưa bị trừ.", 502);
    await completeAi(lease, {
      userId,
      tool,
      output: outputText,
      model,
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
      input: inputs,
    });
    lease = undefined;
    const usageStats = await getAiUsageStats(userId).catch(error => { dataFailure(error, "ai-result-usage-stats"); return null; });

    return NextResponse.json({
      success: true,
      data: outputText,
      usage: usageStats,
      usageUnavailable: usageStats === null,
    });

  } catch (error) {
    if (lease) await releaseAi(lease).catch(() => console.error("ai_lease_release_failed", { lease }));
    if (classifyDatabaseError(error)) return dataErrorResponse(error, "ai-request");
    const known = error instanceof SeoError || error instanceof RequestBodyError;
    return NextResponse.json({ success: false, code: error instanceof SeoError ? error.code : "AI_UNAVAILABLE", error: known ? error.message : "Dịch vụ AI đang gián đoạn. Vui lòng thử lại; lượt dùng chưa bị trừ." }, { status: known ? error.status : 503, headers: { "Cache-Control": "no-store" } });
  }
}
