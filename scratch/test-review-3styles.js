// Test parsing logic from ReviewReplierOutput.tsx
const mockAiResponse = `## 1. Phong Cách Chân Thành & Cầu Thị (Khuyên Dùng)
- **Phản hồi công khai**: Dạ Shop xin chân thành xin lỗi bạn về trải nghiệm không tốt vừa qua ạ. Shop đã kiểm tra lại và thấy đúng là có sự nhầm lẫn trong khâu phân loại hàng. Shop xin phép được gửi bù lại sản phẩm đúng màu và tặng bạn 1 voucher 50k vào tin nhắn riêng ạ.
- **Hành động hậu trường**: Chủ động nhắn tin cho khách gửi mã voucher 50k và tạo đơn bù hàng mới 0đ qua bưu cục ngoài sàn.

## 2. Phong Cách Khéo Léo & Khách Quan (Lỗi Vận Chuyển)
- **Phản hồi công khai**: Dạ Shop rất tiếc khi kiện hàng đến tay bạn trong tình trạng hộp bị móp méo như vậy ạ. Lúc gửi đi từ kho, Shop đã bọc 3 lớp bóng khí rất kỹ, tuy nhiên trong quá trình vận chuyển bưu tá có thể đã sơ ý làm ảnh hưởng. Dù vậy Shop vẫn xin chịu trách nhiệm đổi mới hoàn toàn miễn phí cho bạn ạ.
- **Hành động hậu trường**: Yêu cầu bên vận chuyển bồi hoàn và gửi sản phẩm mới nguyên seal cho khách.

## 3. Phong Cách Minh Bạch & Bảo Vệ Thương Hiệu (Khẳng Định Uy Tín)
- **Phản hồi công khai**: Dạ Shop cảm ơn bạn đã gửi phản hồi. Shop xin khẳng định 100% sản phẩm là hàng chính hãng có đầy đủ giấy tờ kiểm định. Để bạn yên tâm tuyệt đối, Shop sẵn sàng thu hồi lại sản phẩm và hoàn tiền 100% nếu bạn không hài lòng về chất lượng ạ.
- **Hành động hậu trường**: Chụp ảnh hóa đơn VAT và giấy chứng nhận ủy quyền gửi qua inbox cho khách xem.

## Lời khuyên vàng khi xử lý đánh giá
- Phản hồi trong vòng 1-2 giờ đầu tiên để giảm thiểu bức xúc.
- Tuyệt đối không tranh cãi gay gắt trên bình luận công khai.
- Nhờ khách sửa lại đánh giá sau khi đã hỗ trợ xong.`;

function parseReviewReplier(result) {
  const lines = result.split("\n");
  const styles = [];
  let currentStyle = null;
  let currentSection = null;
  let isAdviceBlock = false;
  const rawAdviceLines = [];

  const flushCurrent = () => {
    if (currentStyle && (currentStyle.reply || currentStyle.rawText)) {
      const id = styles.length + 1;
      const title = currentStyle.title || `Phương án ${id}`;
      let type = "general";
      let badge = "Đề Xuất";

      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("chân thành") || lowerTitle.includes("cầu thị")) {
        type = "apologetic";
        badge = "Khuyên Dùng";
      } else if (lowerTitle.includes("khéo léo") || lowerTitle.includes("vận chuyển") || lowerTitle.includes("khách quan")) {
        type = "delivery";
        badge = "Lỗi Vận Chuyển";
      } else if (lowerTitle.includes("minh bạch") || lowerTitle.includes("uy tín") || lowerTitle.includes("thương hiệu")) {
        type = "brand";
        badge = "Bảo Vệ Thương Hiệu";
      } else if (id === 1) {
        type = "apologetic";
        badge = "Phương Án 1";
      } else if (id === 2) {
        type = "delivery";
        badge = "Phương Án 2";
      } else if (id === 3) {
        type = "brand";
        badge = "Phương Án 3";
      }

      styles.push({
        id,
        title,
        badge,
        type,
        reply: currentStyle.reply ? currentStyle.reply.trim() : (currentStyle.rawText || "").trim(),
        action: currentStyle.action ? currentStyle.action.trim() : "",
        rawText: (currentStyle.rawText || "").trim(),
      });
      currentStyle = null;
      currentSection = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("```")) continue;

    if (/^#+\s*(?:Lời khuyên|Tips|Lưu ý|Chiến lược)/i.test(trimmed)) {
      flushCurrent();
      isAdviceBlock = true;
      continue;
    }

    if (isAdviceBlock) {
      const cleanAdvice = trimmed.replace(/^[-*•\d\.\)]\s*/, "").replace(/\*+/g, "").trim();
      if (cleanAdvice) {
        rawAdviceLines.push(cleanAdvice);
      }
      continue;
    }

    const headerMatch =
      trimmed.match(/^(?:#{2,4}\s+|\*{2}|\b)(?:\d+[\.\:\-]\s*)?(?:Phong [Cc]ách|Phương [Áá]n|Câu [Tt]rả [Ll]ời|Cách|Lựa [Cc]họn)[\:\s]*(.+?)(?:\*{2})?$/i) ||
      trimmed.match(/^#{2,4}\s+(\d+[\.\:\-]\s*.+)$/);

    if (headerMatch) {
      flushCurrent();
      const rawTitle = headerMatch[1].replace(/\*+/g, "").trim();
      currentStyle = {
        title: rawTitle,
        reply: "",
        action: "",
        rawText: "",
      };
      currentSection = null;
      continue;
    }

    if (!currentStyle && styles.length === 0 && (trimmed.startsWith(">") || trimmed.includes("Dạ Shop") || trimmed.includes("Chào bạn"))) {
      currentStyle = {
        title: "Phong Cách Chân Thành & Cầu Thị",
        reply: "",
        action: "",
        rawText: "",
      };
      currentSection = "reply";
    }

    if (currentStyle) {
      const replyMatch = trimmed.match(/^[-*•\s]*(?:\*\*|\*)?(?:Nội dung phản hồi|Phản hồi công khai|Phản hồi|Câu trả lời)[^:\n\r]*[:\-]\s*(.*)$/i);
      if (replyMatch) {
        currentSection = "reply";
        let content = replyMatch[1].replace(/^\*\*|\*\*$/g, "").trim();
        if (content.startsWith(">")) content = content.replace(/^>\s*/, "").trim();
        if (content) {
          currentStyle.reply = currentStyle.reply ? `${currentStyle.reply} ${content}` : content;
        }
        continue;
      }

      const actionMatch = trimmed.match(/^[-*•\s]*(?:\*\*|\*)?(?:Hành động hậu trường|Hành động|Hậu trường|Xử lý inbox|Gợi ý)[^:\n\r]*[:\-]\s*(.*)$/i);
      if (actionMatch) {
        currentSection = "action";
        let content = actionMatch[1].replace(/^\*\*|\*\*$/g, "").trim();
        if (content) {
          currentStyle.action = currentStyle.action ? `${currentStyle.action} ${content}` : content;
        }
        continue;
      }

      if (trimmed.startsWith(">")) {
        const quoteText = trimmed.replace(/^>\s*/, "").replace(/^["'“”]|["'“”]$/g, "").trim();
        currentStyle.reply = currentStyle.reply ? `${currentStyle.reply} ${quoteText}` : quoteText;
        continue;
      }

      if (currentSection === "reply") {
        currentStyle.reply = currentStyle.reply ? `${currentStyle.reply} ${trimmed}` : trimmed;
      } else if (currentSection === "action") {
        currentStyle.action = currentStyle.action ? `${currentStyle.action} ${trimmed}` : trimmed;
      } else {
        currentStyle.rawText = currentStyle.rawText ? `${currentStyle.rawText}\n${line}` : line;
      }
    }
  }

  flushCurrent();

  return {
    count: styles.length,
    styles,
    adviceCount: rawAdviceLines.length,
  };
}

const parsed = parseReviewReplier(mockAiResponse);
console.log("Parsed styles count:", parsed.count);
parsed.styles.forEach((s) => {
  console.log(`- [${s.badge}] ${s.title}:`);
  console.log(`  Reply: ${s.reply.slice(0, 50)}...`);
  console.log(`  Action: ${s.action.slice(0, 50)}...`);
});
console.log("Advice count:", parsed.adviceCount);
