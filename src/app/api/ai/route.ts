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
        userPrompt = `Viết một kịch bản video ngắn TikTok (độ dài khoảng 30-45 giây).
Sản phẩm: ${inputs.productName}
Điểm nổi bật (USP): ${inputs.usp}
Yêu cầu cấu trúc:
- [00:00 - 00:03] HOOK: Câu mở đầu gây sốc, giữ chân người xem lập tức.
- [00:03 - 00:15] NỖI ĐAU: Khơi gợi vấn đề của khách hàng.
- [00:15 - 00:30] GIẢI PHÁP: Đưa sản phẩm vào và nhấn mạnh USP.
- [00:30 - CÒN LẠI] CALL TO ACTION: Kêu gọi mua hàng vào giỏ hàng.
Trình bày dưới dạng markdown rõ ràng.`;
        break;

      case "review-replier":
        userPrompt = `Khách hàng vừa để lại đánh giá 1 sao (hoặc tiêu cực) với nội dung: "${inputs.reviewContent || inputs.review}"
Hãy viết một mẫu phản hồi khách hàng công khai trên Shopee/TikTok.
Yêu cầu:
- Độ dài: Ngắn gọn (tối đa 4 câu).
- Giọng điệu: Chuyên nghiệp, nhún nhường, nhận lỗi về phía Shop (hoặc đổ lỗi cho vận chuyển một cách khéo léo).
- Kêu gọi khách kiểm tra tin nhắn Inbox để được hoàn tiền hoặc đổi trả miễn phí.
- Mục đích chính là để những khách hàng khác đọc được thấy Shop rất có trách nhiệm.`;
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
        userPrompt = `Hãy lập một kế hoạch phân bổ ngân sách thuê KOC (Key Opinion Consumer) trên TikTok.
Ngành hàng: ${inputs.category}
Ngân sách tổng: ${new Intl.NumberFormat('vi-VN').format(Number(inputs.budget))} VNĐ.
Yêu cầu:
- Sử dụng chiến lược Nano-Micro Influencer (chia nhỏ rủi ro).
- Phân bổ ngân sách theo tỷ lệ phần trăm (Booking bao nhiêu, Chạy Ads bao nhiêu, Chi phí hàng mẫu bao nhiêu).
- Đề xuất tiêu chí chọn KOC cho ngành hàng này.
- Dự phóng chỉ số (Views, Tỷ lệ chuyển đổi ước tính).`;
        break;

      case "title-spinner":
        userPrompt = `Tôi muốn nhân bản sản phẩm trên Shopee để chống bị quét spam trùng lặp nội dung.
Tiêu đề gốc: "${inputs.originalTitle}"
Hãy tạo 10 biến thể tiêu đề (Spin content). Yêu cầu:
- Giữ nguyên các từ khoá chính quan trọng nhất.
- Đảo vị trí từ ngữ, thay đổi các từ khóa phụ (như thêm: Chính hãng, Freeship, Cao cấp, Giá xưởng...).
- Các tiêu đề không được giống nhau hoàn toàn nhưng vẫn phải tự nhiên, thu hút người click.`;
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
