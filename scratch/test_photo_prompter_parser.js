const sampleText = `## 📸 1. TOP 5 BỘ PROMPT TIẾNG ANH CHUẨN STUDIO THƯƠNG MẠI
*(Copy nguyên văn đoạn mã code tiếng Anh vào Midjourney hoặc Flux để tạo ảnh chất lượng 8K)*

### 🌟 Prompt 1: Góc Chụp Toàn Cảnh (Master Hero Shot)
- **English Prompt (Ready to Copy):**
\`\`\`
A beautifully crafted leather bag with alligator embossed design in caramel brown color, lying on a natural wood surface with a soft, warm light from the ceiling. The bag is presented in a low-angle hero shot, emphasizing its luxurious texture and craftsmanship. The subtle color palette of beige and white around the bag adds to the warm and cozy Nordic atmosphere. Use an 85mm prime lens with f/1.8 aperture for a shallow depth of field, creating a bokeh effect. Octane render, photorealistic, 8k --ar 1:1 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Góc chụp từ dưới lên tạo cảm giác bề thế và cao cấp, nhấn mạnh vào chất liệu và họa tiết da bò dập vân cá sấu, tạo cảm xúc ấm cúng của phong cách Bắc Âu.]

### 🔍 Prompt 2: Góc Chụp Cận Cảnh Chi Tiết (Macro Detail Shot)
- **English Prompt (Ready to Copy):**
\`\`\`
Zoom in on the intricate texture of the alligator embossed leather in a bag with caramel brown color. The surface of the leather is captured with an 85mm prime lens at f/1.8, showing the fine details and the soft yet distinct embossed patterns. The depth of field is shallow, creating a smooth, blurred background. Octane render, photorealistic, 8k --ar 1:1 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Chú trọng vào chi tiết chất liệu và họa tiết da bò, tạo cảm giác tinh xảo và cao cấp.]

### 💃 Prompt 3: Góc Lookbook Người Mẫu (Model Lookbook Shot)
- **English Prompt (Ready to Copy):**
\`\`\`
A young Asian woman in her early 20s, wearing a light white blazer, interacts naturally with a caramel brown alligator embossed leather bag. She is standing in a cozy, Nordic-style living space with beige and white tones, where the wooden elements and linen fabrics complement the overall aesthetic. The model’s subtle makeup and elegant demeanor enhance the look of sophistication and grace. Octane render, photorealistic, 8k --ar 3:4 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Tạo hình ảnh lookbook với người mẫu tự nhiên tương tác với sản phẩm, phản ánh tinh thần phong cách Bắc Âu ấm cúng.]

### ☕ Prompt 4: Bối Cảnh Đời Sống Thực Tế (Lifestyle In-Context)
- **English Prompt (Ready to Copy):**
\`\`\`
A caramel brown alligator embossed leather bag gracefully placed in a cozy, Nordic-style living space. The room is decorated with natural wood furniture and soft, linen-covered cushions. The lighting is warm and natural, creating a cozy and inviting atmosphere. The bag is positioned on a wooden table, surrounded by elements that reflect the simplicity and warmth of the Nordic style, such as woolen blankets and wooden decor. Octane render, photorealistic, 8k --ar 1:1 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Tạo hình ảnh sản phẩm trong không gian sống thực tế, phản ánh phong cách Bắc Âu ấm cúng và tông màu be/trắng.]

### ✨ Prompt 5: Phong Cách Tối Giản Nghệ Thuật (High-end Editorial)
- **English Prompt (Ready to Copy):**
\`\`\`
A high-end editorial style shot of a caramel brown alligator embossed leather bag, placed on a minimalist wooden pedestal with soft, diffused lighting. The bag is presented with a soft, elegant tone, reminiscent of Vogue or Elle magazine covers. The composition is clean and modern, highlighting the luxurious texture and the intricate embossed patterns. Octane render, photorealistic, 8k --ar 1:1 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Tạo hình ảnh theo phong cách tạp chí thời trang, nhấn mạnh vào vẻ đẹp tinh tế và cao cấp của sản phẩm.]

---

## 🚫 2. BỘ CÂU LỆNH LOẠI TRỪ (NEGATIVE PROMPT)
*(Dán vào ô Negative Prompt / --no để ảnh không bị lỗi)*
\`\`\`
deformed hands, missing fingers, extra limbs, bad anatomy, distorted product, low quality, blurry, text, watermark, logo, oversaturated, plastic skin, cartoon, 3d render look
\`\`\`

---

## 💡 3. MẸO THỰC CHIẾN TỪ NHIẾP ẢNH GIA AI
- **Mẹo 1:** Đảm bảo rằng logo của bạn có thể được dễ dàng thêm vào hoặc thay thế bằng công cụ inpaint sau khi tạo ảnh AI.
- **Mẹo 2:** Sử dụng công cụ inpaint để xóa bỏ bất kỳ phần nào không mong muốn từ ảnh AI, ví dụ: người mẫu hoặc bối cảnh không cần thiết.
- **Mẹo 3:** Cân nhắc việc thêm một lớp mờ nhẹ cho logo hoặc sản phẩm để tránh nhìn thấy chúng quá rõ ràng trong ảnh cuối cùng, giúp hình ảnh trở nên tự nhiên hơn.
`;

function cleanQuotesAndBrackets(str) {
  if (!str) return "";
  let s = str.trim();
  s = s.replace(/^\*\*|\*\*$/g, "").trim();
  s = s.replace(/^\[|\]$/g, "").trim();
  s = s.replace(/^["“'«]|["”'»]$/g, "").trim();
  return s.trim();
}

function parsePhotoPrompter(text) {
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

  const s1 = findSection(["TOP 5 BỘ PROMPT", "BỘ PROMPT", "PROMPT TIẾNG ANH"], ["BỘ CÂU LỆNH LOẠI TRỪ", "NEGATIVE PROMPT", "MẸO THỰC CHIẾN"]);
  const s2 = findSection(["BỘ CÂU LỆNH LOẠI TRỪ", "NEGATIVE PROMPT"], ["MẸO THỰC CHIẾN", "MẸO"]);
  const s3 = findSection(["MẸO THỰC CHIẾN", "MẸO"], []);

  // 1. Phân tích 5 Prompts
  const prompts = [];
  if (s1) {
    const promptBlocks = s1.split(/(?=###\s*)/g).filter((chunk) => chunk.trim().startsWith("###"));
    
    promptBlocks.forEach((chunk, idx) => {
      const headerMatch = chunk.match(/^###\s*([^\n]+)/);
      const rawHeader = headerMatch ? headerMatch[1].trim() : `Prompt ${idx + 1}`;
      
      let title = rawHeader.replace(/^[🌟🔍💃☕✨📸📷\s]+/, "");
      
      // Trích xuất mã code trong ```...```
      const codeMatch = chunk.match(/```(?:[a-zA-Z]*\n)?([\s\S]*?)```/);
      const promptCode = codeMatch ? codeMatch[1].trim() : "";

      // Trích xuất Ý đồ nhiếp ảnh
      let intention = "";
      const lines = chunk.split("\n");
      for (const line of lines) {
        const stripped = line.replace(/^[-*•]\s+/, "").trim();
        let m = stripped.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
        if (!m) {
          m = stripped.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
        }
        if (!m) {
          m = stripped.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);
        }
        if (m && /ý đồ|ghi chú|mô tả/i.test(m[1])) {
          intention = cleanQuotesAndBrackets(m[2]);
          break;
        }
      }

      // Trích xuất Aspect Ratio nếu có (--ar 1:1, --ar 3:4, v.v.)
      const arMatch = promptCode.match(/--ar\s+([0-9:]+)/i);
      const aspectRatio = arMatch ? arMatch[1] : "1:1";

      // Trích xuất thông số kỹ thuật chính nếu có trong prompt (Lens, Render, Version)
      const lensMatch = promptCode.match(/(\b\d+mm\b(?:\s+(?:prime|macro))?(?:\s+lens)?(?:\s+f\/[0-9.]+)?)/i);
      const lensInfo = lensMatch ? lensMatch[1].trim() : "";

      const verMatch = promptCode.match(/--v\s+([0-9.]+)/i);
      const versionInfo = verMatch ? `v${verMatch[1]}` : "";

      prompts.push({
        index: idx + 1,
        rawHeader,
        title,
        promptCode,
        intention,
        aspectRatio,
        lensInfo,
        versionInfo,
      });
    });
  }

  // 2. Negative Prompt
  let negativePrompt = "";
  if (s2) {
    const negMatch = s2.match(/```(?:[a-zA-Z]*\n)?([\s\S]*?)```/);
    if (negMatch) {
      negativePrompt = negMatch[1].trim();
    } else {
      negativePrompt = s2.replace(/^\*\([^\)]+\)\*\s*/, "").replace(/^[-*•]\s*/, "").trim();
    }
  }

  // 3. Mẹo thực chiến
  const tips = [];
  if (s3) {
    const lines = s3.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed === "---") continue;
      const strippedBullet = trimmed.replace(/^[-*•]\s+/, "");
      
      let m = strippedBullet.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) {
        m = strippedBullet.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      }
      if (!m) {
        m = strippedBullet.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);
      }

      if (m && /mẹo|lưu ý|bước|tip/i.test(m[1])) {
        tips.push({
          title: m[1].replace(/^\*\*|\*\*$/g, "").trim(),
          content: cleanQuotesAndBrackets(m[2]),
        });
      } else if (strippedBullet.length > 5) {
        tips.push({
          title: `Mẹo ${tips.length + 1}`,
          content: cleanQuotesAndBrackets(strippedBullet),
        });
      }
    }
  }

  return {
    prompts,
    negativePrompt,
    tips,
  };
}

console.log(JSON.stringify(parsePhotoPrompter(sampleText), null, 2));
