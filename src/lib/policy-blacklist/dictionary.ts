export type Severity = "CRITICAL" | "HIGH" | "MEDIUM";

export interface BlacklistRule {
  id: string;
  pattern: RegExp;
  category: "EXTERNAL_TRANSACTION" | "MEDICAL_CURE" | "SUPERLATIVE" | "SENSITIVE_BRAND" | "GIMMICK";
  categoryLabel: string;
  severity: Severity;
  reason: string;
  suggestion: string;
}

export const BLACKLIST_RULES: BlacklistRule[] = [
  // 1. Lôi kéo giao dịch ngoài sàn (CRITICAL - Sàn quét phát khóa sản phẩm hoặc ăn gậy ngay)
  {
    id: "ext-zalo",
    pattern: /\b(zalo|da-lo|z.a.l.o|zalo\s*me|za\s*lo)\b/gi,
    category: "EXTERNAL_TRANSACTION",
    categoryLabel: "Lôi kéo ngoài sàn",
    severity: "CRITICAL",
    reason: "Nhắc đến Zalo bị các sàn (TikTok Shop, Shopee) coi là hành vi dẫn dắt khách hàng ra ngoài sàn để trốn phí.",
    suggestion: "Dùng từ 'nhắn tin cho shop', 'inbox trực tiếp qua khung chat của sàn'.",
  },
  {
    id: "ext-phone",
    pattern: /(?:(?:\+|00)84|0)[1-9][0-9]{8,9}|\b(?:hotline|sđt|sdt|liên\s*hệ|lh|call|alo)\s*[:.-]?\s*[0-9\s.]{8,15}\b/gi,
    category: "EXTERNAL_TRANSACTION",
    categoryLabel: "Lôi kéo ngoài sàn",
    severity: "CRITICAL",
    reason: "Để lại số điện thoại / Hotline cá nhân vi phạm chính sách bảo mật thông tin và kéo khách rời sàn.",
    suggestion: "Xóa số điện thoại, hướng dẫn khách nhấn nút 'Chat ngay' trên sàn.",
  },
  {
    id: "ext-bank",
    pattern: /\b(chuyển\s*khoản|stk|số\s*tài\s*khoản|ck\s*trước|bắn\s*tiền|momo|ngân\s*hàng)\b/gi,
    category: "EXTERNAL_TRANSACTION",
    categoryLabel: "Lôi kéo ngoài sàn",
    severity: "CRITICAL",
    reason: "Yêu cầu chuyển khoản trước hoặc cung cấp thông tin tài khoản ngân hàng riêng vi phạm nghiêm trọng quy chế thanh toán.",
    suggestion: "Khuyên khách chọn phương thức thanh toán an toàn được sàn hỗ trợ (COD, thẻ, ví sàn).",
  },
  {
    id: "ext-fb",
    pattern: /\b(facebook|fb|fanpage|insta|instagram|tiktok\s*shop|shopee|lazada)\b/gi,
    category: "EXTERNAL_TRANSACTION",
    categoryLabel: "Lôi kéo ngoài sàn",
    severity: "CRITICAL",
    reason: "Nhắc đến tên mạng xã hội hoặc sàn thương mại điện tử đối thủ cạnh tranh.",
    suggestion: "Chỉ nhắc đến 'Shop của chúng mình' hoặc 'Cửa hàng chính hãng'.",
  },

  // 2. Cam kết tuyệt đối / Y tế / Thuốc (HIGH/CRITICAL - Rất dễ bị gậy pháp lý và khóa vĩnh viễn)
  {
    id: "med-cure-100",
    pattern: /\b(trị\s*dứt\s*điểm|khỏi\s*100%|khỏi\s*hẳn|chữa\s*dứt\s*điểm|trị\s*tận\s*gốc|hết\s*100%|vĩnh\s*viễn\s*không\s*tái\s*phát)\b/gi,
    category: "MEDICAL_CURE",
    categoryLabel: "Cam kết tuyệt đối / Y tế",
    severity: "CRITICAL",
    reason: "Luật quảng cáo và quy định sàn nghiêm cấm cam kết khỏi 100% hoặc trị dứt điểm (chỉ bác sĩ/thuốc kê đơn mới có chỉ định).",
    suggestion: "Thay bằng 'hỗ trợ cải thiện rõ rệt', 'giúp làm dịu và phục hồi tự nhiên'.",
  },
  {
    id: "med-drug",
    pattern: /\b(thuốc\s*chữa|thần\s*dược|thần\s*thánh|đặc\s*trị|thuốc\s*tiên|chữa\s*bách\s*bệnh)\b/gi,
    category: "MEDICAL_CURE",
    categoryLabel: "Cam kết tuyệt đối / Y tế",
    severity: "HIGH",
    reason: "Mỹ phẩm hoặc thực phẩm chức năng dùng từ 'thuốc', 'đặc trị' sẽ bị tính là quảng cáo sai công dụng và bị xóa link.",
    suggestion: "Thay bằng 'tinh chất chuyên sâu', 'giải pháp chăm sóc chuyên biệt'.",
  },

  // 3. Từ ngữ so sánh nhất / Khẳng định tuyệt đối (HIGH - Dính luật cạnh tranh không lành mạnh)
  {
    id: "sup-number1",
    pattern: /\b(số\s*1\s*việt\s*nam|số\s*1\s*thế\s*giới|tốt\s*nhất\s*thị\s*trường|top\s*1\s*việt\s*nam|duy\s*nhất\s*tại\s*việt\s*nam|rẻ\s*nhất\s*vịnh\s*bắc\s*bộ)\b/gi,
    category: "SUPERLATIVE",
    categoryLabel: "Khẳng định so sánh nhất",
    severity: "HIGH",
    reason: "Dùng từ 'số 1', 'tốt nhất', 'duy nhất' mà không có giấy chứng nhận cơ quan nhà nước sẽ bị phạt vi phạm Luật Quảng cáo.",
    suggestion: "Thay bằng 'thuộc dòng cao cấp được yêu thích', 'được đông đảo khách hàng tin dùng'.",
  },
  {
    id: "sup-guarantee",
    pattern: /\b(cam\s*kết\s*100%|hoàn\s*tiền\s*gấp\s*(?:đôi|ba|10)|đảm\s*bảo\s*tuyệt\s*đối)\b/gi,
    category: "SUPERLATIVE",
    categoryLabel: "Cam kết quá mức",
    severity: "MEDIUM",
    reason: "Cam kết phóng đại dễ bị thuật toán AI gắn cờ lừa dối người tiêu dùng.",
    suggestion: "Thay bằng 'chính sách đổi trả linh hoạt theo quy định', 'đồng hành hỗ trợ tận tâm'.",
  },

  // 4. Nhãn hiệu quốc tế nhạy cảm (HIGH - Nguy cơ dính quét hàng nhái/fake)
  {
    id: "brand-replica",
    pattern: /\b(gucci|chanel|louis\s*vuitton|lv|dior|nike|adidas|hermes|rolex|apple|iphone|samsung)\b/gi,
    category: "SENSITIVE_BRAND",
    categoryLabel: "Thương hiệu lớn nhạy cảm",
    severity: "HIGH",
    reason: "Nếu không có giấy ủy quyền đại lý phân phối chính hãng, nhắc tên các nhãn hiệu lớn này sẽ bị tự động khóa vì nghi ngờ hàng giả/nhái.",
    suggestion: "Thay bằng 'phong cách thể thao năng động', 'kiểu dáng thời thượng, thanh lịch'.",
  },

  // 5. Chiêu trò giật gân, lừa đảo (CRITICAL / HIGH)
  {
    id: "gimmick-free",
    pattern: /\b(tặng\s*tiền\s*mặt|trúng\s*thưởng\s*100%|miễn\s*phí\s*trọn\s*đời|nhận\s*thưởng\s*tiền|bấm\s*link\s*nhận\s*quà)\b/gi,
    category: "GIMMICK",
    categoryLabel: "Chiêu trò giật gân",
    severity: "HIGH",
    reason: "Chiêu trò tặng tiền hoặc trúng thưởng 100% bị xếp vào nhóm hành vi câu kéo click gian lận.",
    suggestion: "Thay bằng 'ưu đãi quà tặng độc quyền trong hôm nay', 'chương trình tri ân dành riêng cho bạn'.",
  },
];

export interface ScanMatch {
  ruleId: string;
  matchedText: string;
  index: number;
  length: number;
  category: string;
  categoryLabel: string;
  severity: Severity;
  reason: string;
  suggestion: string;
}

export interface ScanReport {
  text: string;
  matches: ScanMatch[];
  score: number; // 0 - 100 (100 là an toàn tuyệt đối)
  riskLevel: "SAFE" | "WARNING" | "DANGER";
  totalViolations: number;
}

export function scanTextForViolations(text: string): ScanReport {
  if (!text || typeof text !== "string") {
    return {
      text: "",
      matches: [],
      score: 100,
      riskLevel: "SAFE",
      totalViolations: 0,
    };
  }

  const matches: ScanMatch[] = [];

  for (const rule of BLACKLIST_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        ruleId: rule.id,
        matchedText: match[0],
        index: match.index,
        length: match[0].length,
        category: rule.category,
        categoryLabel: rule.categoryLabel,
        severity: rule.severity,
        reason: rule.reason,
        suggestion: rule.suggestion,
      });
      // Avoid infinite loop if regex is zero-width
      if (match.index === regex.lastIndex) regex.lastIndex++;
    }
  }

  // Sắp xếp các điểm vi phạm theo vị trí xuất hiện trong text
  matches.sort((a, b) => a.index - b.index);

  // Tính điểm phạt (Penalty)
  let penalty = 0;
  for (const m of matches) {
    if (m.severity === "CRITICAL") penalty += 35;
    else if (m.severity === "HIGH") penalty += 20;
    else penalty += 10;
  }

  const score = Math.max(0, 100 - penalty);
  let riskLevel: "SAFE" | "WARNING" | "DANGER" = "SAFE";

  if (matches.some((m) => m.severity === "CRITICAL") || score < 50) {
    riskLevel = "DANGER";
  } else if (matches.length > 0 || score < 85) {
    riskLevel = "WARNING";
  }

  return {
    text,
    matches,
    score,
    riskLevel,
    totalViolations: matches.length,
  };
}
