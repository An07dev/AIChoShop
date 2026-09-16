const sampleText = `## 🔍 1. BÓC TÁCH 3 TỬ HUYỆT LỚN NHẤT CỦA ĐỐI THỦ

- **Tử huyệt 1 (Lỗi sản phẩm / Chất liệu):** Áo thun của đối thủ có vải mỏng, dễ bị xù lông và chảy xệ sau khi giặt, gây mất thẩm mỹ và cảm giác không thoải mái cho khách hàng.
- **Tử huyệt 2 (Đóng gói / Giao hàng / Phụ kiện):** Hộp carton đóng gói của đối thủ quá mỏng, dễ bị rách và thiếu phụ kiện như túi zip mờ bảo vệ sản phẩm.
- **Tử huyệt 3 (Dịch vụ CSKH / Bảo hành):** Đối thủ thường từ chối trách nhiệm và không giải quyết triệt để khi khách hàng khiếu nại, gây mất lòng tin và sự bất tiện cho khách hàng.

---

## 💎 2. ĐỊNH VỊ VŨ KHÍ USP ĐỘC QUYỀN CHO SHOP BẠN

- **Tuyên ngôn định vị đập tan nỗi sợ:** "Chất liệu dày dặn, không xù lông, form áo rộng rãi thoải mái, bảo hành 1 đổi 1 tận nhà trong 30 ngày."

- **Bảng so sánh hơn hẳn (Shop Bạn vs Đối Thủ Thị Trường):**

| Tiêu chí | Đối thủ trên thị trường | Sản phẩm của Shop Bạn (Vượt trội) |
| :--- | :--- | :--- |
| **Chất liệu / Hoàn thiện** | Vải mỏng, dễ bị xù lông | Vải Cotton Compact 100% dệt dày 280gsm không xù lông, cổ áo dệt sợi co giãn kép |
| **Quy cách đóng gói** | Hộp carton sơ sài, dễ vỡ | Hộp carton cứng nắp gài, túi zip mờ bảo vệ sản phẩm |
| **Chính sách bảo hành** | Trốn tránh, đổ lỗi | Đổi mới 100% tận nhà trong 24h |

---

## 🎬 3. BỘ CÂU HOOK & KỊCH BẢN "DÌM HÀNG VĂN MINH"

- **Hook 1 (Góc Cảnh Báo):** "Bạn có chắc chắn muốn mua áo thun từ một shop không chịu trách nhiệm, khiến bạn mất thời gian và tiền bạc không?"
- **Hook 2 (Góc Đồng Cảm Thực Tế):** "Hãy tưởng tượng, bạn giặt áo thun và phát hiện cổ áo chảy xệ, bị xù lông, mất công sửa chữa ngay tại nhà?"
- **Hook 3 (Góc Vạch Trần Sự Thật):** "Hãy chọn shop chúng tôi, nơi bạn luôn được bảo hành 1 đổi 1 tận nhà trong 30 ngày, không còn lo lắng về các vấn đề chất lượng và dịch vụ."

- **Đoạn mô tả sản phẩm "Đá xéo đối thủ tinh tế":** "Áo thun Cotton Compact 280gsm của chúng tôi không chỉ mang lại cảm giác thoải mái, form áo rông rãi, mà còn được bảo hành 1 đổi 1 tận nhà trong 30 ngày. Với chất liệu dày dặn 100% Cotton, áo thun của bạn sẽ không bao giờ bị xù lông hay chảy xệ sau khi giặt. Đảm bảo bạn sẽ hài lòng với sản phẩm của chúng tôi, không cần phải lo lắng về những vấn đề thường gặp ở các shop khác."

---

## 🛡️ 4. LỜI KHUYÊN PHÒNG THỦ CHO SHOP BẠN

- **Lưu ý 1:** Tuân thủ quy trình kiểm duyệt chất liệu và hoàn thiện sản phẩm để đảm bảo chất lượng vải luôn chuẩn xác.
- **Lưu ý 2:** Đảm bảo quy trình đóng gói sản phẩm được thực hiện cẩn thận, sử dụng hộp carton và túi zip mờ để bảo vệ sản phẩm.
- **Lưu ý 3:** Đào tạo đội ngũ CSKH để họ có thể giải quyết các vấn đề của khách hàng một cách nhanh chóng và hiệu quả, đảm bảo khách hàng luôn hài lòng.
`;

function cleanQuotes(str) {
  if (!str) return "";
  return str.trim().replace(/^["“'«]|["”'»]$/g, "").trim();
}

function cleanMarkdown(str) {
  if (!str) return "";
  return str.replace(/\*\*/g, "").replace(/^[-*•]\s+/, "").trim();
}

function parseCompetitorMiner(text) {
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

  const s1 = findSection(["BÓC TÁCH", "TỬ HUYỆT"], ["ĐỊNH VỊ", "VŨ KHÍ", "USP"]);
  const s2 = findSection(["ĐỊNH VỊ", "VŨ KHÍ", "USP"], ["BỘ CÂU HOOK", "HOOK", "DÌM HÀNG"]);
  const s3 = findSection(["BỘ CÂU HOOK", "HOOK", "DÌM HÀNG"], ["LỜI KHUYÊN", "PHÒNG THỦ"]);
  const s4 = findSection(["LỜI KHUYÊN", "PHÒNG THỦ"], []);

  // 1. Phân tích 3 tử huyệt
  const flaws = [];
  if (s1) {
    const lines = s1.split("\n");
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#") || line.startsWith("*(") || line.startsWith("(")) continue;

      // Chuẩn hoá: bỏ dấu gạch đầu dòng
      const strippedBullet = line.replace(/^[-*•]\s+/, "");

      // Match: **Tử huyệt 1 (...):** nội dung hoặc **Tử huyệt 1 (...)**: nội dung hoặc Tử huyệt 1: nội dung
      let m = strippedBullet.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) {
        m = strippedBullet.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      }
      if (!m) {
        m = strippedBullet.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);
      }

      if (m) {
        const fullTitle = m[1].trim();
        const content = cleanQuotes(m[2].trim());
        
        // Trích xuất tag trong ngoặc đơn nếu có
        const tagMatch = fullTitle.match(/\(([^)]+)\)/);
        const tag = tagMatch ? tagMatch[1].trim() : "";
        const cleanTitle = fullTitle.replace(/\([^)]+\)/, "").trim();

        flaws.push({
          rawTitle: fullTitle,
          title: cleanTitle || fullTitle,
          tag: tag,
          content: content,
        });
      } else if (strippedBullet.length > 5) {
        flaws.push({
          rawTitle: `Tử huyệt ${flaws.length + 1}`,
          title: `Tử huyệt ${flaws.length + 1}`,
          tag: "",
          content: cleanQuotes(strippedBullet),
        });
      }
    }
  }

  // 2. Định vị USP & Bảng so sánh
  let uspStatement = "";
  const comparisonTable = {
    headers: [],
    rows: []
  };

  if (s2) {
    // Tìm tuyên ngôn định vị
    const stmtMatch = s2.match(/(?:Tuyên ngôn định vị[^\n:]*|Slogan[^\n:]*)\s*[:\-]\s*(?:["“]([^"”\n]+)["”]|([^\n]+))/i);
    if (stmtMatch) {
      let rawStmt = stmtMatch[1] || stmtMatch[2] || "";
      rawStmt = rawStmt.replace(/^\*\*|\*\*$/g, "").trim();
      uspStatement = cleanQuotes(rawStmt);
    }

    // Parse Markdown table
    const tableLines = s2.split("\n").filter(l => l.trim().startsWith("|") && l.trim().endsWith("|"));
    if (tableLines.length >= 2) {
      // Dòng tiêu đề
      const headerLine = tableLines[0];
      comparisonTable.headers = headerLine
        .split("|")
        .map(c => c.trim().replace(/\*\*/g, ""))
        .filter(Boolean);
      
      // Các dòng nội dung (bỏ qua dòng phân cách |:---|:---|)
      for (let i = 1; i < tableLines.length; i++) {
        const line = tableLines[i].trim();
        if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(line)) {
          continue; // Dòng phân cách
        }
        const cols = line.split("|").map(c => c.trim().replace(/\*\*/g, "")).slice(1, -1);
        if (cols.length > 0) {
          comparisonTable.rows.push({
            criteria: cols[0] || "",
            competitor: cols[1] || "",
            shopYou: cols[2] || "",
            rawCols: cols,
          });
        }
      }
    }
  }

  // 3. Hook & Kịch bản dìm hàng
  const hooks = [];
  let subtleDescription = "";

  if (s3) {
    const descMatch = s3.match(/(?:Đoạn mô tả sản phẩm[^\n:]*|Mô tả sản phẩm[^\n:]*)\s*[:\-]\s*([\s\S]*?)(?=(?:--|\n#|$))/i);
    if (descMatch) {
      let descText = descMatch[1].trim();
      descText = descText.replace(/^\*\*|\*\*$/g, "").trim();
      subtleDescription = cleanQuotes(descText);
    }

    // Các câu Hook
    const lines = s3.split("\n");
    for (let line of lines) {
      line = line.trim();
      if (/đoạn mô tả/i.test(line) || line.startsWith("#") || line.startsWith("*(") || line.startsWith("(")) continue;

      const strippedBullet = line.replace(/^[-*•]\s+/, "");

      // Match: **Hook 1 (Góc Cảnh Báo):** "..." hoặc **Hook 1**: "..."
      let m = strippedBullet.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) {
        m = strippedBullet.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      }
      if (!m) {
        m = strippedBullet.match(/^(Hook\s*\d+[^:]*|\bHook[^:]*)\s*[:\-]\s*([\s\S]+)$/i);
      }

      if (m && /hook/i.test(m[1])) {
        const fullHookLabel = m[1].trim();
        const hookText = cleanQuotes(m[2].trim());

        const angleMatch = fullHookLabel.match(/\(([^)]+)\)/);
        const angle = angleMatch ? angleMatch[1].trim() : "";
        const cleanLabel = fullHookLabel.replace(/\([^)]+\)/, "").trim();

        hooks.push({
          label: cleanLabel || fullHookLabel,
          angle: angle,
          text: hookText,
        });
      }
    }
  }

  // 4. Lời khuyên phòng thủ
  const defenseTips = [];
  if (s4) {
    const lines = s4.split("\n");
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#") || line === "---") continue;
      const bulletClean = line.replace(/^[-*•]\s+/, "").trim();
      
      // Match: **Lưu ý 1:** nội dung hoặc **Lưu ý 1**: nội dung
      let m = bulletClean.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) {
        m = bulletClean.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      }
      if (!m) {
        m = bulletClean.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);
      }

      if (m && /lưu ý|chú ý|bước|điểm|khuyên/i.test(m[1])) {
        defenseTips.push({
          title: m[1].trim(),
          content: cleanQuotes(m[2].trim()),
        });
      } else if (bulletClean.length > 5) {
        defenseTips.push({
          title: `Lưu ý ${defenseTips.length + 1}`,
          content: cleanQuotes(bulletClean.replace(/^\*\*|\*\*$/g, "")),
        });
      }
    }
  }

  return {
    flaws,
    uspStatement,
    comparisonTable,
    hooks,
    subtleDescription,
    defenseTips,
  };
}

console.log(JSON.stringify(parseCompetitorMiner(sampleText), null, 2));
