const sampleText = `## 🧠 1. GIẢI MÃ TÂM LÝ ẨN SAU LỜI TỪ CHỐI
- **Nỗi sợ thực sự của khách:** Khách lo ngại mua phải sản phẩm đắt mà không xứng đáng hoặc hàng giả, kém chất lượng. Họ cũng quan ngại so sánh giá với shop khác, lo lắng mua không phải là lựa chọn tốt nhất.
- **Sai lầm nhân viên thường mắc:** Đơn giản chỉ ra giá thấp hơn của shop kia mà không chứng minh được giá trị vượt trội của sản phẩm, khiến khách cảm thấy bị ép mua.

---

## 💬 2. BA PHƯƠNG ÁN PHẢN HỒI BẺ GÃY TỪ CHỐI TỨC THÌ
### 💎 Phương Án 1: Đánh Vào Giá Trị Vượt Trội (Value Focus - Khuyên Dùng)
- **Mẫu tin nhắn:** 
  \`\`\`markdown
  Anh/chị ơi, em hiểu hoàn toàn tâm lý của Anh/Chị. Nồi chiên không dầu điện tử 6L của shop chúng em không chỉ chất lượng vượt trội hơn so với nhiều sản phẩm cùng loại mà còn bền gấp đôi. Với mức giá 890k, em đảm bảo rằng Anh/Chị sẽ hài lòng với quyết định mua hàng của mình. 
  \`\`\`
- **Thời điểm áp dụng:** Dành cho khách chê đắt nhưng thực sự thích sản phẩm.

### ⚡ Phương Án 2: Tung Deal Khan Hiếm 15 Phút (Urgency & Exclusive Offer)
- **Mẫu tin nhắn:** 
  \`\`\`markdown
  Anh/chị, em có một ưu đãi đặc biệt chỉ trong 15 phút nữa. Nếu Anh/chị đặt hàng ngay bây giờ, em sẽ tặng kèm kẹp gắp inox 304 và voucher giảm 40k cho Anh/chị. Chỉ còn 15 phút nữa, đừng bỏ lỡ cơ hội tiết kiệm 40k nhé!
  \`\`\`
- **Thời điểm áp dụng:** Dành cho khách đòi 'suy nghĩ thêm' hoặc so sánh giá.

### 🛡️ Phương Án 3: Đảo Ngược Rủi Ro Tuyệt Đối (Zero-Risk Reversal)
- **Mẫu tin nhắn:** 
  \`\`\`markdown
  Anh/chị ơi, em rất hiểu Anh/chị lo lắng về chất lượng. Shop chúng em cam kết bảo hành 12 tháng 1 đổi 1 tại nhà, đồng thời chịu 100% phí ship nếu Anh/chị không hài lòng. Em xin đảm bảo, Anh/chị sẽ không phải lo lắng về bất kỳ rủi ro nào.
  \`\`\`
- **Thời điểm áp dụng:** Dành cho khách sợ hàng không giống ảnh hoặc sợ bị lừa.

---

## 🚀 3. KỸ THUẬT "CÂU HỎI MỞ" BUỘC KHÁCH PHẢI TRẢ LỜI
- **Câu hỏi lựa chọn 1:** 
  \`\`\`markdown
  Em có thể giúp Anh/chị chọn màu sắc và kích thước phù hợp không? Điều này sẽ giúp Anh/chị quyết định nhanh hơn.
  \`\`\`
- **Câu hỏi lựa chọn 2:** 
  \`\`\`markdown
  Em có thể gửi thêm địa chỉ nhận hàng cho em, để em kịp thời gửi hàng cho Anh/chị?
  \`\`\`

---

## ⏱️ 4. NGUYÊN TẮC VÀNG KHI TRỰC CHAT SÀN
- **3 mẹo giúp tỷ lệ chốt đơn (Conversion Rate) trên khung chat tăng từ 15% lên 40%:**
  1. **Luôn đồng cảm và tạo sự tin tưởng:** Đồng cảm với khách hàng để làm giảm sự đề phòng và tạo cảm giác an tâm.
  2. **Cung cấp thông tin chi tiết và minh bạch:** Giải thích rõ về giá trị sản phẩm, ưu đãi và cam kết bảo hành để khách hàng hiểu rõ.
  3. **Đặt câu hỏi mở:** Hỏi khách hàng về nhu cầu và mong muốn để gợi ý họ đưa ra quyết định, thay vì để họ im lặng.
`;

function cleanQuotesAndCode(str) {
  if (!str) return "";
  let s = str.trim();
  const codeMatch = s.match(/```(?:[a-zA-Z]*\n)?([\s\S]*?)```/);
  if (codeMatch) {
    s = codeMatch[1].trim();
  }
  s = s.replace(/^\*\*|\*\*$/g, "").trim();
  s = s.replace(/^\[|\]$/g, "").trim();
  s = s.replace(/^["“'«]|["”'»]$/g, "").trim();
  return s.trim();
}

function parseObjectionKiller(text) {
  if (!text) return null;

  const findSection = (keywords, nextKeywords = []) => {
    let bestStart = -1;
    let headerLen = 0;
    for (const kw of keywords) {
      const match = text.match(new RegExp(`^[ \\t]*(?:##|#)\\s*[^\\n]*?${kw}[^\\n]*$`, "im"));
      if (match && match.index !== undefined) {
        bestStart = match.index;
        headerLen = match[0].length;
        break;
      }
    }
    if (bestStart === -1) return "";

    const contentStart = text.slice(bestStart + headerLen);
    let endIdx = contentStart.length;

    for (const nextKw of nextKeywords) {
      const nextMatch = contentStart.match(new RegExp(`^[ \\t]*(?:---|##|#)\\s*[^\\n]*?${nextKw}`, "im"));
      if (nextMatch && nextMatch.index !== undefined && nextMatch.index < endIdx) {
        endIdx = nextMatch.index;
      }
    }
    return contentStart.slice(0, endIdx).trim();
  };

  const s1 = findSection(["GIẢI MÃ TÂM LÝ", "TÂM LÝ ẨN"], ["BA PHƯƠNG ÁN", "PHƯƠNG ÁN PHẢN HỒI", "KỸ THUẬT"]);
  const s2 = findSection(["BA PHƯƠNG ÁN", "PHƯƠNG ÁN PHẢN HỒI"], ["KỸ THUẬT", "CÂU HỎI MỞ", "NGUYÊN TẮC"]);
  const s3 = findSection(["KỸ THUẬT", "CÂU HỎI MỞ"], ["NGUYÊN TẮC VÀNG", "NGUYÊN TẮC"]);
  const s4 = findSection(["NGUYÊN TẮC VÀNG", "NGUYÊN TẮC"], []);

  // 1. Tâm lý khách
  const psychology = {
    realFear: "",
    staffMistake: "",
  };

  if (s1) {
    const lines = s1.split("\n");
    for (const line of lines) {
      const stripped = line.replace(/^[-*•]\s+/, "").trim();
      let m = stripped.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) m = stripped.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      if (!m) m = stripped.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);

      if (m) {
        if (/nỗi sợ|sợ thực sự|lo ngại/i.test(m[1])) {
          psychology.realFear = cleanQuotesAndCode(m[2]);
        } else if (/sai lầm|thường mắc|tránh/i.test(m[1])) {
          psychology.staffMistake = cleanQuotesAndCode(m[2]);
        }
      }
    }
  }

  // 2. 3 Phương án phản hồi
  const responseOptions = [];
  if (s2) {
    const optionBlocks = s2.split(/(?=###\s*)/g).filter((chunk) => chunk.trim().startsWith("###"));

    optionBlocks.forEach((chunk, idx) => {
      const headerMatch = chunk.match(/^###\s*([^\n]+)/);
      const rawHeader = headerMatch ? headerMatch[1].trim() : `Phương Án ${idx + 1}`;
      const title = rawHeader.replace(/^[💎⚡🛡️🚀💡\s]+/, "");

      let message = "";
      let timing = "";

      const msgMatch = chunk.match(/(?:Mẫu tin nhắn|Tin nhắn|Kịch bản)[^\n:]*[:\-]\s*([\s\S]*?)(?=(?:-\s*\*\*Thời điểm|---|$))/i);
      if (msgMatch) {
        message = cleanQuotesAndCode(msgMatch[1]);
      } else {
        const codeMatch = chunk.match(/```(?:[a-zA-Z]*\n)?([\s\S]*?)```/);
        if (codeMatch) message = codeMatch[1].trim();
      }

      const timingMatch = chunk.match(/(?:Thời điểm áp dụng|Thời điểm|Áp dụng khi|Đối tượng)[^\n:]*[:\-]\s*([^\n]+(?:\n[^\n#\-]+)?)/i);
      if (timingMatch) {
        timing = cleanQuotesAndCode(timingMatch[1]);
      }

      // Xác định badge ngắn & phong cách
      let badge = "Khuyên Dùng";
      if (/khan hiếm|15 phút|deal/i.test(title)) {
        badge = "Deal 15 Phút";
      } else if (/đảo ngược|rủi ro|bảo hành|đổi trả/i.test(title)) {
        badge = "Xóa Sạch Rủi Ro";
      } else if (/giá trị/i.test(title)) {
        badge = "Giá Trị Vượt Trội";
      }

      responseOptions.push({
        index: idx + 1,
        rawHeader,
        title,
        badge,
        message,
        timing,
        charCount: message.length,
      });
    });
  }

  // 3. Kỹ thuật câu hỏi mở
  const openQuestions = [];
  if (s3) {
    const qMatches = s3.split(/(?=(?:[-*•]\s*\*\*|###\s*))/g);
    for (const qChunk of qMatches) {
      const trimmed = qChunk.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed === "---") continue;

      const labelMatch = trimmed.match(/^[-*•]?\s*(?:\*\*)?([^:\n]+?)(?:\*\*)?\s*:\s*([\s\S]+)$/);
      if (labelMatch) {
        const label = labelMatch[1].trim();
        const content = cleanQuotesAndCode(labelMatch[2]);
        if (content) {
          openQuestions.push({
            label,
            question: content,
          });
        }
      }
    }
  }

  // 4. Nguyên tắc vàng
  const goldenRules = [];
  if (s4) {
    const lines = s4.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed === "---") continue;
      if (/3 mẹo|nguyên tắc vàng/i.test(trimmed) && !trimmed.includes("**")) continue;

      const stripped = trimmed.replace(/^(?:\d+[\.\)]|\-|\*|•)\s+/, "").trim();
      let m = stripped.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) m = stripped.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      if (!m) m = stripped.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);

      if (m) {
        const content = cleanQuotesAndCode(m[2]);
        if (content) {
          goldenRules.push({
            title: m[1].replace(/^\*\*|\*\*$/g, "").trim(),
            content,
          });
        }
      } else if (stripped.length > 5 && !/tỷ lệ chốt đơn/i.test(stripped)) {
        goldenRules.push({
          title: `Nguyên tắc ${goldenRules.length + 1}`,
          content: cleanQuotesAndCode(stripped),
        });
      }
    }
  }

  return {
    psychology,
    responseOptions,
    openQuestions,
    goldenRules,
    raw: text,
  };
}

console.log(JSON.stringify(parseObjectionKiller(sampleText), null, 2));
