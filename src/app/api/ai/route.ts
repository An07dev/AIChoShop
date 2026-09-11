import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tool, inputs } = body;

    // Kiểm tra trạng thái từ biến môi trường: OpenAIStatus = "true" -> dùng OpenAI, ngược lại -> dùng Ollama
    const isOpenAI = process.env.OpenAIStatus?.trim().toLowerCase() === "true";
    const isOllama = !isOpenAI;

    const baseURL = isOllama
      ? (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1")
      : undefined;

    const apiKey = isOllama
      ? "ollama"
      : (process.env.OPENAI_API_KEY?.trim().replace(/^["']|["']$/g, "") || "dummy");

    const model = isOllama
      ? (process.env.OLLAMA_MODEL || "qwen2.5:7b")
      : (process.env.OPENAI_MODEL || "gpt-4o-mini");

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
${inputs.imageBase64 ? "Tôi có đính kèm một ảnh chụp màn hình thông báo vi phạm từ sàn. Hãy phân tích kỹ hình ảnh này để tìm ra LÝ DO CHÍNH XÁC và NGUYÊN NHÂN SÂU XA mà hệ thống hoặc đội ngũ duyệt bài của sàn đã đánh gậy/vi phạm." : ""}

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
- **Chữ trên video**: "[Text nhấn mạnh USP cốt lõi]"

### [00:30 - HẾT] CALL TO ACTION: Kêu gọi chốt đơn
- **Hình ảnh / Hành động**: [Cười tươi chỉ tay xuống góc trái màn hình nơi có icon giỏ hàng]
- **Lời thoại (Voice)**: "[Câu KOC kêu gọi bấm vào giỏ hàng săn voucher ưu đãi độc quyền]"
- **Chữ trên video**: "[BẤM GIỎ HÀNG GÓC TRÁI 👇 SĂN VOUCHER]"

## Gợi ý quay dựng:
- Nhạc nền: [Gợi ý thể loại nhạc TikTok bắt trend phù hợp]
- Âm thanh: [Hiệu ứng sound effect đề xuất như Whoosh, Pop, Ting]

LƯU Ý: Trả về 100% tiếng Việt chuẩn. Không chèn tiếng Trung hoặc ngôn ngữ khác. Không đưa lời giải thích ngoài lề.`;
        break;

      case "review-replier":
        userPrompt = `Khách hàng vừa để lại đánh giá ${inputs.rating || "1 sao"} trên sàn thương mại điện tử (Shopee/TikTok Shop/Lazada) với nội dung: "${inputs.reviewContent || inputs.review}"
${inputs.issueType ? `Loại vấn đề gặp phải: ${inputs.issueType}` : ""}

Hãy đóng vai chuyên gia xử lý khủng hoảng truyền thông & chăm sóc khách hàng hàng đầu.
Hãy tạo 3 phương án phản hồi chuyên nghiệp, đắc nhân tâm nhất theo đúng cấu trúc Markdown chuẩn sau:

# Kế hoạch xử lý đánh giá tiêu cực

## 1. Phong Cách: Chân Thành & Cầu Thị (Khuyên dùng)
- **Nội dung phản hồi công khai:**
  > "[Nội dung phản hồi công khai ngắn gọn 3-4 câu: xin lỗi chân thành, nhận trách nhiệm, thông báo đã chủ động nhắn tin riêng đền bù/đổi mới 100%]"
- **Hành động hậu trường:** [Gợi ý hành động thực tế shop cần làm trong inbox hoặc vận hành, ví dụ: nhắn tin gửi voucher, gửi bù hàng ngay không cần trả lại hàng cũ]

## 2. Phong Cách: Khéo Léo & Khách Quan (Lỗi vận chuyển & bảo quản)
- **Nội dung phản hồi công khai:**
  > "[Nội dung phản hồi công khai ngắn gọn 3-4 câu: đồng cảm với sự bất tiện, khéo léo giải thích do va đập vận chuyển hoặc yếu tố khách quan, nhưng shop vẫn đứng ra chịu trách nhiệm và hỗ trợ xử lý ngay trong inbox]"
- **Hành động hậu trường:** [Gợi ý xử lý: kiểm tra camera đóng gói, gửi clip cho khách, khiếu nại đơn vị vận chuyển]

## 3. Phong Cách: Minh Bạch & Tinh Tế (Bảo vệ uy tín thương hiệu)
- **Nội dung phản hồi công khai:**
  > "[Nội dung phản hồi công khai ngắn gọn 3-4 câu: khẳng định chất lượng nguồn gốc sản phẩm chính hãng/đầy đủ tem mác có quy trình kiểm tra nghiêm ngặt, đồng thời vẫn cam kết bảo hành và hỗ trợ khách qua tin nhắn]"
- **Hành động hậu trường:** [Gợi ý cách xử lý inbox, bảo vệ shop nếu khách hiểu lầm hoặc đối thủ cạnh tranh không lành mạnh]

## Lời khuyên vàng khi xử lý đánh giá tiêu cực:
- Không bao giờ đôi co hoặc cãi vã trên bình luận công khai để giữ hình ảnh chuyên nghiệp.
- Luôn chủ động điều hướng khách vào tin nhắn riêng (Inbox) để xử lý bồi thường thỏa đáng.
- Sau khi khách đồng ý giải pháp đền bù/đổi hàng, khéo léo nhờ khách cập nhật lại đánh giá.
- Báo cáo sàn can thiệp nếu bình luận chứa từ ngữ thô tục hoặc có dấu hiệu phá hoại từ đối thủ.

LƯU Ý: Trả về 100% tiếng Việt chuẩn. Câu từ chuẩn mực, tế nhị, tạo thiện cảm lớn với khách hàng tiềm năng đang đọc đánh giá của shop.`;
        break;

      case "seo-optimizer":
        userPrompt = `Thực hiện tối ưu hóa SEO sản phẩm cho sàn Shopee/TikTok.
Tên sản phẩm cơ bản: ${inputs.productName}
Đặc điểm nổi bật (USP): ${inputs.usp}
Hãy trả về:
1. 5 biến thể Tiêu đề chuẩn SEO (tối đa 120 ký tự, kết hợp từ khoá tìm kiếm cao và USP để tăng tỷ lệ Click).
2. Mô tả sản phẩm (Khoảng 4-5 gạch đầu dòng nhấn mạnh lợi ích cốt lõi).
3. 10 Hashtag chuẩn thuật toán tìm kiếm.`;
        break;

      case "koc-planner":
        userPrompt = `Hãy lập kế hoạch phân bổ ngân sách thuê KOC (Key Opinion Consumer) trên TikTok cho:
Ngành hàng: ${inputs.category}
Ngân sách tổng: ${new Intl.NumberFormat('vi-VN').format(Number(inputs.budget))} VNĐ.

BẮT BUỘC trả về đúng cấu trúc Markdown chuẩn mẫu sau:

# Kế hoạch phân bổ ngân sách thuê KOC trên TikTok

## Tóm tắt
- **Ngành hàng**: ${inputs.category}
- **Ngân sách tổng**: ${new Intl.NumberFormat('vi-VN').format(Number(inputs.budget))} VNĐ
- **Chiến lược**: Nano-Micro Influencer
- **Trường hợp sử dụng**: Chia nhỏ rủi ro

## Chi tiết kế hoạch

### 1. Phân bổ ngân sách
- **Booking Influencer**: [X]% ([Số tiền tương ứng] VNĐ)
- **Chạy Ads**: [Y]% ([Số tiền tương ứng] VNĐ)
- **Chi phí hàng mẫu**: [Z]% ([Số tiền tương ứng] VNĐ)

### 2. Chi tiết phân bổ
- **Booking Influencer**: [Mô tả mục đích và cách làm việc với KOC]
- **Chạy Ads**: [Chiến lược chạy quảng cáo Spark Ads đẩy video lên xu hướng]
- **Chi phí hàng mẫu**: [Quy trình gửi hàng mẫu cho KOC test]

### 3. Tiêu chí chọn KOC
- **Trọng lượng nội dung**: [Số lượng followers và nội dung phù hợp]
- **Chất lượng nội dung**: [Yêu cầu chất lượng hình ảnh, kịch bản]
- **Tương tác**: [Lượt tương tác tối thiểu mỗi bài đăng]
- **Độ trung thực**: [Uy tín và niềm tin của cộng đồng]
- **Kết nối với khách hàng mục tiêu**: [Đặc điểm tệp khán giả phù hợp]

### 4. Dự phóng chỉ số
- **Views**: [Dự kiến số lượt views cho mỗi video hoặc tổng video]
- **Tỷ lệ chuyển đổi ước tính**: [Tỷ lệ %] (tương đương [Số lượng đơn] đơn hàng)

### 5. Lời kết
[Đánh giá tổng quan hiệu quả và kết luận kế hoạch]

## Lưu ý
- **Tiếp cận**: [Cách thức tiếp cận KOC nhỏ tạo quan hệ trước khi booking]
- **Tối ưu hóa**: [Cách theo dõi và điều chỉnh chiến dịch]
- **Hợp đồng**: [Đảm bảo hợp đồng cam kết bản quyền và tiến độ]

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
    const isConnectionError = error.code === "ECONNREFUSED" || error.message?.includes("fetch failed");
    const errorMessage = isConnectionError
      ? "Không thể kết nối đến Ollama. Vui lòng đảm bảo Ollama đang chạy (lệnh: ollama serve hoặc mở ứng dụng Ollama)."
      : (error.message || "Đã xảy ra lỗi khi gọi AI.");

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
