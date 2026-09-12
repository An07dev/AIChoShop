import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSystemSettings } from "@/lib/system-settings";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tool, inputs } = body;

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

      case "seo-optimizer":
        userPrompt = `Bạn là chuyên gia SEO E-commerce (Shopee & TikTok Shop).
Hãy tối ưu tiêu đề và viết lại bài mô tả sản phẩm sau để lên top tìm kiếm:
Tên sản phẩm gốc: ${inputs.productName}
Các tính năng / USP: ${inputs.features}
Từ khóa chính mong muốn: ${inputs.keywords || "tự động phân tích"}

Yêu cầu đầu ra (Định dạng Markdown):
### 1. GỢI Ý 3 TIÊU ĐỀ CHUẨN SEO (Dưới 120 ký tự):
(Cấu trúc: [Loại SP] + [Thương hiệu/Điểm nổi bật] + [Tính năng/Công dụng] + [Mã SP/Kích cỡ] + [Freeship/Chính hãng])
- Tiêu đề 1: ...
- Tiêu đề 2: ...
- Tiêu đề 3: ...

### 2. MÔ TẢ SẢN PHẨM TỐI ƯU SEO & CHUYỂN ĐỔI:
- Trình bày dạng bullet points ngắn gọn, chia đề mục rõ ràng (Điểm nổi bật, Thông số, Hướng dẫn sử dụng, Cam kết).
- Lồng ghép từ khóa tự nhiên, không spam.
- Đính kèm 8 - 10 hashtag chuẩn SEO ở cuối bài.`;
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

      case "product-description": {
        const mode = inputs.mode || "seo-full";
        const platform = inputs.platform || "shopee";
        const tone = inputs.tone || "expert";
        const brand = inputs.brand ? inputs.brand.trim() : "";
        const shop = inputs.shopName ? inputs.shopName.trim() : (brand || "[TÊN SHOP]");
        const brandDisplay = brand ? `${brand}` : shop;
        const productName = inputs.productName || "Sản phẩm";
        const usp = inputs.usp || "";
        const specs = inputs.specs || "";
        const gift = inputs.gift ? inputs.gift.trim() : (inputs.guarantee ? inputs.guarantee.trim() : "");
        const painPoint = inputs.painPoint ? inputs.painPoint.trim() : "";

        // Kiểm tra người dùng có nhập Quà tặng và Nỗi đau không
        const hasGift = Boolean(gift && gift.length > 0);
        const hasPainPoint = Boolean(painPoint && painPoint.length > 0);

        // Định hướng sàn TMĐT
        let platformGuide = "";
        if (platform === "shopee") {
          platformGuide = "Tối ưu chuẩn SEO sàn SHOPEE: Tập trung từ khóa tìm kiếm tự nhiên, tối ưu cho Shopee Mall/Shop Yêu Thích, kêu gọi áp mã Freeship Xtra và Voucher Giảm Giá Shop.";
        } else if (platform === "tiktok") {
          platformGuide = "Tối ưu cho TIKTOK SHOP: Phong cách trực quan, tối ưu cho người xem chuyển từ Video/Livestream sang Giỏ hàng, câu từ ngắn gọn, kêu gọi bấm vào Giỏ Hàng Góc Trái.";
        } else if (platform === "lazada") {
          platformGuide = "Tối ưu chuẩn sàn LAZADA: Phong cách chuẩn LazMall, nhấn mạnh Hoàn Tiền Max, Voucher Tích Lũy và chính sách giao hàng nhanh.";
        } else {
          platformGuide = "Tối ưu ĐA SÀN (Shopee, TikTok Shop, Lazada): Ngôn từ trung tính, linh hoạt sử dụng được trên mọi sàn thương mại điện tử.";
        }

        // Định hướng tông giọng
        let toneGuide = "";
        if (tone === "friendly") {
          toneGuide = "Tông giọng: THÂN THIỆN & GẦN GŨI (Như một người bạn thân nhiệt tình review và chia sẻ bí quyết mua sắm).";
        } else if (tone === "humorous") {
          toneGuide = "Tông giọng: HÀI HƯỚC, BẮT TREND & DUYÊN DÁNG (Dùng từ ngữ dí dỏm, viral, giúp người đọc cảm thấy vui vẻ, thoải mái).";
        } else if (tone === "luxury") {
          toneGuide = "Tông giọng: SANG TRỌNG, ĐẲNG CẤP & TINH TẾ (Ngôn từ trau chuốt, tôn vinh giá trị và phong cách sống của người sở hữu).";
        } else {
          toneGuide = "Tông giọng: CHUYÊN GIA UY TÍN & ĐÁNG TIN CẬY (Phân tích mạch lạc, am hiểu sâu sắc, tạo niềm tin tuyệt đối về chất lượng).";
        }

        // Dữ liệu chung
        const dataHeader = `DỮ LIỆU ĐẦU VÀO:
- Tên sản phẩm: ${productName}
- Thương hiệu / Brand: ${brand || "Chính hãng"}
- Tên Shop: ${shop}
- Điểm nổi bật (USP): ${usp}
${hasPainPoint ? `- Nỗi đau / Tình huống khách gặp phải: ${painPoint}` : "- Nỗi đau: (Người bán KHÔNG nhập -> BỎ QUA HOÀN TOÀN KHỐI NỖI ĐAU)"}
${hasGift ? `- Quà tặng kèm & Cam kết: ${gift}` : "- Quà tặng: (Người bán KHÔNG CÓ QUÀ TẶNG -> BỎ QUA HOÀN TOÀN MỤC QUÀ TẶNG)"}
- Thông số kỹ thuật: ${specs || "Thông số tiêu chuẩn chất lượng cao"}
- Nền tảng: ${platform.toUpperCase()}
- ${platformGuide}
- ${toneGuide}

ĐIỀU KIỆN LỌC BẮT BUỘC (RẤT QUAN TRỌNG):
${
  !hasGift
    ? "⚠️ LƯU Ý VỀ QUÀ TẶNG: Người bán KHÔNG nhập quà tặng. TUYỆT ĐỐI CẤM xuất hiện từ 'TẶNG KÈM', 'QUÀ TẶNG' trong toàn bài (kể cả 'Tặng kèm: không có' hay 'quà tặng: không' cũng TUYỆT ĐỐI CẤM KHÔNG ĐƯỢC XUẤT HIỆN)."
    : `✅ QUÀ TẶNG: Đưa quà tặng "${gift}" vào đúng vị trí nổi bật.`
}
${
  !hasPainPoint
    ? "⚠️ LƯU Ý VỀ NỖI ĐAU: Người bán KHÔNG nhập nỗi đau / tình huống. TUYỆT ĐỐI CẤM viết khối '⚡ BẠN ĐANG GẶP PHẢI TÌNH TRẠNG NÀY?' hay '📖 BẠN CÓ TỪNG RƠI VÀO CẢNH NÀY?'. Không bịa chuyện tiêu cực. Sau khối Cam kết vàng, chuyển thẳng sang khối '🔥 ĐIỂM KHÁC BIỆT VƯỢT TRỘI'."
    : `✅ NỖI ĐAU: Khai thác nỗi đau "${painPoint}" làm móc câu giữ chân khách.`
}

QUY TẮC AN TOÀN SÀN & TRÌNH BÀY:
- Dùng icon (🌟, ⚡, 🛡️, 📦, 🔥, 🎁) ngắt dòng hợp lý, tuyệt đối không viết đoạn văn dài quá 3 dòng.
- TUYỆT ĐỐI KHÔNG DÙNG TỪ CẤM CỦA SÀN: cấm dùng 'trị dứt điểm', 'vĩnh viễn', 'số 1', 'duy nhất', 'độc quyền', 'tốt nhất', '100% không tái phát' (tránh bị sàn quét khóa sản phẩm).
- Dùng dấu phân cách '---' giữa các phần để bài viết thoáng mắt, dễ đọc trên điện thoại.
- Trả về 100% tiếng Việt chuẩn, không thêm lời chào mở đầu hay giải thích kết bài ngoài lề.`;

        // Kịch bản theo từng chế độ
        if (mode === "mobile-short") {
          // CHẾ ĐỘ 2: NGẮN GỌN MOBILE-FIRST
          userPrompt = `Bạn là chuyên gia Copywriting Mobile-First hàng đầu. Khách hàng trên điện thoại chỉ có 3-5 giây để lướt, hãy tạo bản mô tả NGẮN GỌN - TRỰC DIỆN - TẬP TRUNG BULLET POINTS cho sản phẩm sau:

${dataHeader}

CẤU TRÚC BẮT BUỘC (MOBILE-FIRST):
⚡ TOP 3 ĐIỂM ĐẮT GIÁ NHẤT:
- [Tính năng 1 in đậm]: [Lợi ích trong 1 câu ngắn gọn]
- [Tính năng 2 in đậm]: [Lợi ích trong 1 câu ngắn gọn]
- [Tính năng 3 in đậm]: [Lợi ích trong 1 câu ngắn gọn]

---
🛡️ CHÍNH SÁCH BẢO HÀNH & ĐẶC QUYỀN HÔM NAY:
${hasGift ? `- 🎁 TẶNG KÈM: ${gift}\n` : ""}- Bảo hành 1 ĐỔI 1 tận nhà trong 30 ngày nếu có lỗi từ nhà sản xuất.
- Đóng gói bọc bóng khí chống sốc 3 lớp, giao hỏa tốc.

---
📋 THÔNG SỐ RÚT GỌN:
${specs ? specs : "- Kích thước & Trọng lượng nhỏ gọn, tiện mang theo\n- Điện áp / Công suất tiêu chuẩn tối ưu\n- Chất liệu cao cấp bền bỉ theo thời gian"}

---
🛡️ CHÍNH SÁCH MUA HÀNG AN TÂM:
- Kiểm tra hàng trước khi thanh toán / Quay video mở hàng để được xử lý ngay lập tức.
- Bấm [THEO DÕI SHOP] ngay để nhận voucher giảm giá cho đơn hàng này!

---
🏷️ HASHTAG:
[8-10 hashtag ngắn gọn bám sát từ khóa tìm kiếm của sản phẩm]`;
        } else if (mode === "storytelling") {
          // CHẾ ĐỘ 3: STORYTELLING CẢM XÚC
          userPrompt = `Bạn là bậc thầy Kể chuyện Bán hàng (Storytelling Copywriting). Hãy viết bản mô tả sản phẩm chạm sâu vào cảm xúc:

${dataHeader}

CẤU TRÚC BẮT BUỘC (STORYTELLING):
${
  hasPainPoint
    ? `📖 BẠN CÓ TỪNG RƠI VÀO CẢNH NÀY?
[Kể một lát cắt câu chuyện ngắn 2-3 câu thật chân thực, gợi cảm giác khó chịu/mệt mỏi/bối rối mà khách thường gặp khi chưa có sản phẩm: "${painPoint}"]
👉 Và đó chính là lý do ${productName} từ ${brandDisplay} ra đời để đồng hành cùng bạn!`
    : `✨ KHỞI ĐẦU TRẢI NGHIỆM TIỆN NGHI CÙNG ${productName.toUpperCase()}:
[Viết đoạn mở đầu 2-3 câu khơi gợi sự hứng khởi, nâng tầm phong cách sống tiện ích khi sở hữu sản phẩm ${productName} từ ${brandDisplay}]`
}

---
✨ SỰ THAY ĐỔI KHI BẠN SỞ HỮU ${productName.toUpperCase()}:
- [Khoảnh khắc trải nghiệm 1]: [Mô tả cảm giác thoải mái/tiết kiệm thời gian...]
- [Khoảnh khắc trải nghiệm 2]: [Mô tả sự tự tin, an tâm...]
- [Khoảnh khắc trải nghiệm 3]: [Giá trị nhận lại vượt xa số tiền bỏ ra...]

---
🔥 ĐIỂM KHÁC BIỆT MÀ BẠN SẼ YÊU THÍCH:
- ${usp}

---
📋 THÔNG TIN KỸ THUẬT:
${specs ? specs : "- Thông số chi tiết từ nhà sản xuất"}

---
💎 LỜI HỨA DANH DỰ TỪ ${shop.toUpperCase()}:
- Cam kết hàng chuẩn mô tả, hỗ trợ đổi trả tận tình nếu không hài lòng.
${hasGift ? `- 🎁 TẶNG KÈM: ${gift}\n` : ""}- Bấm theo dõi shop để cùng nhau tạo nên những trải nghiệm mua sắm tuyệt vời!

---
🏷️ BỘ HASHTAG LAN TỎA:
[10-12 hashtag cảm xúc và từ khóa tìm kiếm sản phẩm]`;
        } else if (mode === "flash-sale") {
          // CHẾ ĐỘ 4: FLASH SALE & FOMO KHẨN CẤP
          userPrompt = `Bạn là chuyên gia Săn Sale & Kích thích mua hàng cấp tốc (FOMO Copywriting). Hãy viết một bản mô tả tạo động lực hành động NGAY BÂY GIỜ, tận dụng tâm lý sợ bỏ lỡ cơ hội:

${dataHeader}

CẤU TRÚC BẮT BUỘC (FLASH SALE & FOMO):
🚨 CẢNH BÁO DEAL CHỚP NHOÁNG - DUY NHẤT HÔM NAY! 🚨
- Ưu đãi giảm sốc có hạn: Áp dụng cho 50 đơn hàng đầu tiên trong ngày!
${hasGift ? `- 🎁 QUÀ TẶNG ĐỘC QUYỀN: ${gift} (Số lượng quà có hạn, hết quà tự động về giá gốc)` : "- Trợ giá sốc trực tiếp từ shop (Số lượng có hạn, hết suất tự động về giá gốc)"}

---
🔥 3 LÝ DO BẠN NÊN MUA NGAY ĐƠN HÀNG NÀY:
- 1. GIẢI PHÁP ĐỘT PHÁ: ${hasPainPoint ? painPoint : usp}
- 2. ĐỘ BỀN & CHẤT LƯỢNG: Chuẩn chính hãng từ ${brandDisplay}
- 3. TIẾT KIỆM TỐI ĐA: Mua đúng đợt trợ giá tốt nhất của ${shop}

---
📋 THÔNG SỐ SẢN PHẨM:
${specs ? specs : "- Thông số kỹ thuật chuẩn hãng"}

---
⚡ HƯỚNG DẪN SĂN DEAL TỐI ƯU CHI PHÍ:
- Bước 1: Bấm [Lưu Mã Giảm Giá] của Shop & Mã Freeship của Sàn.
- Bước 2: Chọn đúng phân loại màu sắc/kích thước mong muốn.
- Bước 3: Bấm [Mua Ngay] trước khi hết thời gian Flash Sale!

---
🛡️ CAM KẾT CHÍNH HÃNG:
- Dù là hàng Flash Sale trợ giá, quyền lợi bảo hành 1 ĐỔI 1 trong 30 ngày vẫn giữ nguyên 100%!

---
🏷️ HASHTAG SĂN SALE:
[10-12 hashtag hot sale, săn deal và từ khóa sản phẩm]`;
        } else {
          // CHẾ ĐỘ 1: CHUẨN SEO & ĐẦY ĐỦ (MẶC ĐỊNH)
          const blocks = [
            `🌟 CAM KẾT VÀNG TỪ ${shop.toUpperCase()} 🌟
- Bảo hành 1 ĐỔI 1 trong 30 ngày nếu phát sinh lỗi từ nhà sản xuất.
- Sản phẩm được kiểm tra kỹ càng và bọc chống sốc 3 lớp trước khi giao.
- Hỗ trợ đổi trả miễn phí tận nhà nếu không vừa ý hoặc hàng không đúng mô tả.${
              hasGift ? `\n- 🎁 TẶNG KÈM: ${gift}` : ""
            }`,

            hasPainPoint
              ? `---
⚡ BẠN ĐANG GẶP PHẢI TÌNH TRẠNG NÀY?
[Dựa trên nỗi đau: "${painPoint}", viết 2-3 câu khơi gợi đúng tình huống khó chịu, nhức nhối đời thường mà khách gặp phải]
👉 ${productName} từ ${brandDisplay} chính là "vị cứu tinh" giúp giải quyết triệt để vấn đề ngay lập tức!`
              : null,

            `---
🔥 ĐIỂM KHÁC BIỆT VƯỢT TRỘI:
[Liệt kê từ 4 đến 5 tính năng kèm lợi ích thực tế dựa trên: "${usp}", định dạng: - [TÊN TÍNH NĂNG/USP]: [LỢI ÍCH CỤ THỂ, TẠI SAO KHÁCH CẦN, GIẢI QUYẾT ĐƯỢC GÌ TRONG ĐỜI SỐNG]]`,

            `---
📋 THÔNG SỐ KỸ THUẬT:
${specs ? `[Trình bày rõ ràng, gạch đầu dòng các thông số sau: ${specs}]` : "[Thông số kỹ thuật rõ ràng: Công suất / Kích thước / Chất liệu / Dung tích / Điện áp / Xuất xứ...]"}`,

            `---
📖 HƯỚNG DẪN SỬ DỤNG & LƯU Ý ĐỂ ĐẠT HIỆU QUẢ TỐT NHẤT:
1. [Bước 1...]
2. [Bước 2...]
3. [Bước 3...]
*Lưu ý: [1 mẹo nhỏ bảo quản hoặc sử dụng để sản phẩm bền lâu nhất]*`,

            `---
🛡️ CHÍNH SÁCH ĐỔI TRẢ & LỜI KÊU GỌI:
- Khách hàng vui lòng QUAY VIDEO MỞ HÀNG để được hỗ trợ nhanh nhất nếu có sự cố vận chuyển.
- Bấm [THEO DÕI SHOP] ngay để nhận mã giảm giá 10k - 20k cho đơn hàng này!`,

            `---
🏷️ BỘ HASHTAG CHUẨN SEO:
[10-12 hashtag liên quan trực tiếp đến từ khóa tìm kiếm của sản phẩm trên sàn]`,
          ]
            .filter(Boolean)
            .join("\n\n");

          userPrompt = `Bạn là chuyên gia Copywriting TMĐT hàng đầu. Hãy tạo một bản mô tả sản phẩm chuẩn SEO và tối ưu chuyển đổi:

${dataHeader}

KỊCH BẢN CẤU TRÚC BẮT BUỘC:
${blocks}`;
        }
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
      max_tokens: 1500,
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
