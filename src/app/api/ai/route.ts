import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSystemSettings } from "@/lib/system-settings";
import { handleSeo } from "@/lib/seo/handler";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tool, inputs } = body;
    if (tool === "seo-optimizer") return handleSeo(req, inputs);

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

    const openai = new OpenAI({
      baseURL,
      apiKey,
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

      case "review-replier":
        userPrompt = `Bạn là chuyên viên Chăm sóc khách hàng xuất sắc của Shop "${inputs.shopName || "Aicho Official Store"}".
Hãy viết phản hồi cho đánh giá sau của khách hàng:
Số sao: ${inputs.rating} sao
Nội dung đánh giá của khách: "${inputs.reviewText}"

Yêu cầu:
- Nếu là đánh giá 1-3 sao (tiêu cực): Nhận lỗi chân thành, giữ thái độ lịch sự, cầu thị, xoa dịu khách hàng và đưa ra giải pháp xử lý (đổi trả, bảo hành, tặng voucher...).
- Nếu là đánh giá 4-5 sao (tích cực): Cảm ơn chân thành, tạo sự gắn kết, chúc khách hàng có trải nghiệm tốt và kêu gọi khách bấm [Theo dõi Shop] để nhận ưu đãi cho lần mua sau.
- Ngôn ngữ: Tiếng Việt, tự nhiên, ấm áp, chuyên nghiệp, không sáo rỗng.
- Độ dài: Khoảng 3 - 5 câu ngắn gọn, súc tích. Chỉ trả về nội dung câu trả lời, không thêm lời giải thích.`;
        break;

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

      default:
        return NextResponse.json({ success: false, error: "Công cụ không hợp lệ." }, { status: 400 });
    }

    let userMessageContent: any = userPrompt;

    // Xử lý ảnh nếu có
    if (tool === "appeal-generator" && inputs.imageBase64) {
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
      max_tokens: tool === "video-repurposer" ? 2500 : 1500,
    });

    return NextResponse.json({ success: true, data: completion.choices[0].message.content });

  } catch (error: any) {
    console.error("AI Error:", error);

    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = error?.message || "Đã xảy ra lỗi khi gọi AI.";
    const status = error?.status;
    const rawMsg = error?.message || "";

    // 1. Token sai hoặc không hợp lệ (401 Unauthorized)
    if (status === 401 || rawMsg.includes("Incorrect API key") || rawMsg.includes("invalid_api_key")) {
      errorCode = "INVALID_TOKEN";
      errorMessage = "OpenAI API Token không chính xác hoặc đã bị thu hồi (Lỗi 401 Unauthorized). Vui lòng kiểm tra lại Token tại trang Cài đặt hệ thống.";
    }
    // 2. Token hết hạn mức (Quota / Credits / Rate limit) (429)
    else if (status === 429 || rawMsg.includes("insufficient_quota") || rawMsg.includes("quota") || rawMsg.includes("rate limit")) {
      errorCode = "EXPIRED_QUOTA";
      errorMessage = "Tài khoản OpenAI đã hết hạn ngạch (Hết Credits/tiền) hoặc bị giới hạn lượt gọi (Lỗi 429). Vui lòng nạp thêm Credits hoặc đổi Token khác.";
    }
    // 3. Model không tồn tại hoặc không có quyền (404)
    else if (status === 404 || rawMsg.includes("model")) {
      errorCode = "MODEL_NOT_FOUND";
      errorMessage = "Model AI không tồn tại hoặc tài khoản OpenAI chưa được cấp quyền sử dụng model này (Lỗi 404).";
    }
    // 4. Máy chủ OpenAI lỗi hoặc quá tải (500, 502, 503)
    else if (status === 500 || status === 502 || status === 503) {
      errorCode = "SERVER_OVERLOAD";
      errorMessage = "Máy chủ OpenAI hiện đang bị quá tải hoặc bảo trì (Lỗi 500/503). Vui lòng thử lại sau vài giây.";
    }
    // 5. Lỗi kết nối mạng
    else if (error.code === "ECONNREFUSED" || rawMsg.includes("fetch failed")) {
      errorCode = "NETWORK_ERROR";
      errorMessage = "Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra kết nối mạng Internet hoặc cấu hình Base URL.";
    }

    return NextResponse.json(
      {
        success: false,
        code: errorCode,
        error: errorMessage,
        details: {
          rawMessage: rawMsg,
          status: status,
          actionUrl: "/admin/settings",
        },
      },
      { status: status && status >= 400 && status < 600 ? status : 500 }
    );
  }
}
