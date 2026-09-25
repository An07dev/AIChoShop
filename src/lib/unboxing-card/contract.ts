/**
 * Module Contract cho AI Thư Cảm Ơn Nhét Hộp (Unboxing Card Generator)
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema), Bộ Prompt Thực Chiến Sàn TMĐT 2026 (Shopee, TikTok Shop, Lazada)
 * & Resilient Parser 4 Tầng Bền Bỉ (Tương thích ngược 100% với dữ liệu Markdown lịch sử cũ)
 */

export interface UnboxingCardInputs {
  shopName: string;
  productCategory: string;
  cardTone: "emotional" | "friendly_witty" | "premium_elegant" | "cute_cheerful" | string;
  cardFormat: "postcard_a6" | "mini_card" | "voucher_tag" | string;
  primaryGoal?: "anti_1_star" | "review_booster" | "repurchase" | "warranty_crm" | string;
  specialOffer?: string;
}

export interface CardFrontSide {
  headline: string; // Tiêu đề giật tít đập vào mắt (Catchy & emotional)
  subheadline: string; // Lời tựa chào mừng ấm áp
  badgeText: string; // Huy hiệu nhận diện (e.g. "OFFICIAL STORE", "HANDMADE WITH LOVE")
  visualDesignNotes: string[]; // Tone màu chủ đạo, gợi ý họa tiết trang trí xưởng in
  openHook: string; // Câu dẫn kích thích khách lật mặt sau
}

export interface Anti1StarShield {
  heading: string; // "ĐỪNG VỘI ĐÁNH GIÁ 1 SAO"
  message: string; // Lời thấu cảm & cam kết đổi mới/hoàn tiền 100% trong 24h
  supportCta: string; // Hướng dẫn nhắn qua khung chat sàn để được ưu tiên xử lý hỏa tốc
}

export interface ReviewMagnet {
  heading: string; // "NAM CHÂM REVIEW 5 SAO"
  incentive: string; // Quà tặng hoặc voucher giảm giá cho đơn hàng tiếp theo
  instruction: string; // Lời kêu gọi chụp ảnh / quay video đập hộp feedback
}

export interface SafeQrPortal {
  purpose: string; // Mục đích chính: "Kích hoạt bảo hành điện tử chính hãng" hoặc "Quà tri ân VIP"
  qrCaption: string; // Lời dẫn ngắn cạnh khung mã QR
  safeNotice: string; // Cam kết bảo vệ gian hàng tuân thủ quy chế sàn
}

export interface CardBackSide {
  heartfeltLetter: string; // Tâm thư tri ân từ trái tim đội ngũ (3-5 câu sâu sắc)
  anti1StarShield: Anti1StarShield;
  reviewMagnet: ReviewMagnet;
  safeQrPortal: SafeQrPortal;
  usageTips?: string[]; // 2-3 mẹo vặt sử dụng/bảo quản theo ngành hàng
  fullBackText: string; // Toàn bộ văn bản mặt sau hoàn chỉnh để copy 1-chạm
}

export interface PrintSpecs {
  formatName: string;
  dimensionsMm: string; // Kích thước mm chuẩn xưởng in (e.g. "105 x 148 mm - Khổ A6")
  bleedNote: string; // Lưu ý xén lề file thiết kế (e.g. "Thêm 2mm mỗi cạnh: 109 x 152 mm")
  recommendedPaper: string; // Giấy Couche 300gsm (C300) cán màng mờ 2 mặt
  colorMode: string; // "Hệ màu CMYK (Độ phân giải 300 DPI)"
  estimatedCost: string; // Dự toán chi phí xưởng VN (e.g. "300đ - 450đ/tấm từ 1.000 tấm")
  proPackagingTip: string; // Mẹo kẹp thiệp, xịt hương nước hoa unboxing đa giác quan
}

export interface UnboxingCardData {
  shopName: string;
  cardFormat: string;
  cardTone: string;
  primaryGoal: string;
  front: CardFrontSide;
  back: CardBackSide;
  printSpecs: PrintSpecs;
  marketingAdvice: string[]; // 3-4 chiến lược giữ chân khách & tăng LTV
}

// -------------------------------------------------------------
// DỮ LIỆU MẪU CHUẨN THỰC CHIẾN (SAMPLE DATA)
// -------------------------------------------------------------
export const SAMPLE_CARD_INPUT: UnboxingCardInputs = {
  shopName: "Aicho Official Store",
  productCategory: "Thời trang thiết kế nữ & Phụ kiện cao cấp",
  cardTone: "emotional",
  cardFormat: "postcard_a6",
  primaryGoal: "anti_1_star",
  specialOffer: "Voucher giảm 30.000đ cho đơn hàng sau + Quà tặng kẹp tóc ngọc trai đính kèm",
};

export const SAMPLE_CARD_DATA: UnboxingCardData = {
  shopName: "Aicho Official Store",
  cardFormat: "Bưu Thiếp A6 (10 x 15 cm)",
  cardTone: "Chân Thành & Cảm Động",
  primaryGoal: "Chống 1 sao & Kéo review 5 sao",
  front: {
    headline: "MÓN QUÀ NÀY ĐƯỢC CHUẨN BỊ DÀNH RIÊNG CHO BẠN!",
    subheadline: "Cảm ơn bạn vì đã tin tưởng lựa chọn AICHO giữa muôn vàn thương hiệu ngoài kia. Hãy mở ra để khám phá điều đặc biệt bên trong nhé!",
    badgeText: "AICHO OFFICIAL • HANDMADE WITH LOVE",
    visualDesignNotes: [
      "Tone màu chủ đạo: Hồng Pastel phối viền Vàng Gold ánh kim trang nhã",
      "Họa tiết hoa thanh nhã dập nổi nhẹ góc dưới bên phải, tạo cảm giác sang trọng như thư tay thời trang",
      "Bố cục chữ tối giản, font chữ Serif kết hợp Handwriting bay bổng",
    ],
    openHook: "Lật mặt sau để nhận quà tri ân & kích hoạt bảo hành điện tử chính hãng ➔",
  },
  back: {
    heartfeltLetter:
      "Chào bạn yêu dấu! Khi bạn cầm trên tay kiện hàng này, từng đường kim mũi chỉ và nếp gấp đều được đội ngũ AICHO nâng niu đóng gói bằng tất cả sự tận tụy. Chúng mình hiểu rằng bạn không chỉ mua một bộ trang phục, mà là gửi gắm cả niềm vui và sự tự tin. Cảm ơn bạn đã tiếp thêm ngọn lửa nhiệt huyết cho chúng mình trên hành trình tôn vinh nét đẹp người phụ nữ Việt!",
    anti1StarShield: {
      heading: "ĐỪNG VỘI ĐÁNH GIÁ 1 SAO BẠN NHÉ!",
      message:
        "Nếu trong quá trình vận chuyển đường xa có bất kỳ điều gì sơ suất khiến bạn chưa thực sự hài lòng (nhầm size, lỗi vải hay hộp hàng móp méo), xin bạn ĐỪNG VỘI ĐÁNH GIÁ 1 SAO làm tổn thương công sức của các bạn thợ may và đóng gói. Xin hãy dành cho AICHO cơ hội được chịu trách nhiệm và sửa sai bằng cách nhắn tin ngay qua khung chat sàn để được ĐỔI MỚI 100% HOÀN TOÀN MIỄN PHÍ hoặc HOÀN TIỀN trong 24 giờ!",
      supportCta: "Bấm nút 'Chat ngay' trên sàn để gặp đội ngũ hỗ trợ hỏa tốc trong 5 phút.",
    },
    reviewMagnet: {
      heading: "CHỤP ẢNH XINH - NHẬN VOUCHER 30K LIỀN TAY",
      incentive: "Voucher giảm 30.000đ đơn tiếp theo + Quà tặng kẹp tóc ngọc trai đính kèm",
      instruction:
        "Bạn ưng ý với sản phẩm chứ? Hãy chia sẻ niềm vui ấy bằng cách chụp ảnh hoặc quay clip diện đồ thật xinh kèm đánh giá 5 sao nhé! Đừng quên lưu lại món quà kẹp tóc ngọc trai đính kèm trong hộp quà này nha!",
    },
    safeQrPortal: {
      purpose: "Kích hoạt bảo hành đổi size 7 ngày & Tích điểm VIP",
      qrCaption: "[QUÉT MÃ QR BẢO HÀNH ĐIỆN TỬ TẠI ĐÂY]",
      safeNotice:
        "Quét mã QR để kích hoạt quyền lợi BẢO HÀNH ĐỔI TRẢ MIỄN PHÍ TẬN NHÀ & nhận mã ưu đãi bí mật độc quyền dành riêng cho khách hàng thân thiết AICHO.",
    },
    usageTips: [
      "Nên giặt tay ở lần giặt đầu tiên với nước mát để giữ sợi vải mềm mịn lâu dài.",
      "Ủi hơi nước ở nhiệt độ vừa phải để nếp váy luôn vào form chuẩn đẹp.",
      "Hỗ trợ đổi size tận nhà trong 7 ngày nếu mặc chưa vừa vặn.",
    ],
    fullBackText: `GỬI NGƯỜI BẠN ĐẶC BIỆT CỦA AICHO,

Khi bạn cầm trên tay kiện hàng này, từng đường kim mũi chỉ và nếp gấp đều được đội ngũ AICHO nâng niu đóng gói bằng tất cả sự tận tụy. Cảm ơn bạn đã tin tưởng trao gửi niềm vui và phong cách cho chúng mình!

🛡️ NẾU CÓ BẤT KỲ ĐIỀU GÌ CHƯA HÀI LÒNG:
Xin bạn ĐỪNG VỘI ĐÁNH GIÁ 1 SAO làm tổn thương công sức của các bạn đóng gói. Hãy nhắn tin ngay qua khung chat của sàn, AICHO cam kết ĐỔI MỚI 100% MIỄN PHÍ TẬN NHÀ hoặc HOÀN TIỀN trong 24 giờ!

⭐ CHIA SẺ NIỀM VUI ĐẬP HỘP:
Nếu bạn hài lòng, hãy tặng chúng mình đánh giá 5 sao kèm clip unboxing thật xinh nhé! Món quà kẹp tóc ngọc trai cao cấp trong hộp hàng và Voucher giảm 30.000đ đơn sau là món quà tri ân gửi tặng riêng bạn.

📲 QUÉT MÃ QR ĐỂ KÍCH HOẠT BẢO HÀNH ĐỔI TRẢ 7 NGÀY & NHẬN ƯU ĐÃI THÀNH VIÊN VIP!
Cảm ơn bạn và chúc bạn luôn rạng rỡ, tự tin mỗi ngày!`,
  },
  printSpecs: {
    formatName: "Bưu Thiếp A6 (105 x 148 mm)",
    dimensionsMm: "105 x 148 mm",
    bleedNote: "Tràn lề 2mm mỗi cạnh: file thiết kế 109 x 152 mm, đặt nội dung an toàn cách mép 4mm",
    recommendedPaper: "Giấy Couche 300gsm (C300) cán màng mờ 2 mặt - Chống thấm nước, cứng cáp sang trọng",
    colorMode: "Hệ màu CMYK (Độ phân giải 300 DPI)",
    estimatedCost: "Khoảng 320đ - 450đ/tấm khi in số lượng từ 1.000 tấm tại các xưởng in Offset Việt Nam",
    proPackagingTip: "Dùng kẹp gỗ nhỏ gài thiệp vào nơ hộp quà hoặc túi zip sản phẩm. Xịt nhẹ một làn hương nước hoa tinh tế lên thiệp trước khi đóng nắp thùng để tạo trải nghiệm Unboxing đa giác quan bùng nổ!",
  },
  marketingAdvice: [
    "Luôn in mã QR dẫn về cổng bảo hành điện tử chính thức hoặc Zalo OA để chăm sóc khách hàng trọn đời đúng luật sàn.",
    "Tạo tính khan hiếm cho voucher (thời hạn 30 ngày) để kích hoạt khách hàng quay lại mua lần 2 nhanh nhất.",
    "Khối 'Khiên chắn 1 sao' giúp giảm tới 80% tỷ lệ đánh giá tiêu cực do lỗi vô ý của đơn vị vận chuyển.",
  ],
};

// -------------------------------------------------------------
// BỘ PROMPT THỰC CHIẾN SÀN TMĐT 2026 (SYSTEM & USER PROMPTS)
// -------------------------------------------------------------
export const UNBOXING_CARD_SYSTEM_PROMPT = `Bạn là Giám Đốc Trải Nghiệm Khách Hàng (Chief Customer Officer) và Chuyên Gia Retention Marketing hàng đầu về Nghệ Thuật Đóng Gói (Unboxing Experience) trên các sàn TMĐT Việt Nam (Shopee, TikTok Shop, Lazada).

NHIỆM VỤ CỐT LÕI:
Thiết kế bộ Thư Cảm Ơn Nhét Hộp (Unboxing Thank You Card) 2 mặt chuẩn quy cách xưởng in ấn với 3 mục tiêu chiến lược:
1. TẠO CẢM XÚC CHẠM ĐẾN TRÁI TIM: Khiến khách cảm thấy quyết định mua hàng là hoàn toàn đúng đắn, xây dựng tình yêu thương hiệu ngay từ giây đầu tiên mở hộp.
2. CÀI ĐẶT "KHIÊN CHẮN 1 SAO" (Anti-1-Star Shield): Ngăn chặn 80% đánh giá 1-2 sao bốc đồng do sơ suất vận chuyển/giao hàng. Cam kết giải quyết 1 đổi 1 hoặc hoàn tiền trong 24h qua khung chat sàn.
3. KÉO ĐÁNH GIÁ 5 SAO KÈM CLIP UNBOXING (Review Magnet): Thúc đẩy khách chụp ảnh, quay video feedback 5 sao để nhận quà tri ân / voucher đơn kế tiếp.
4. CHUYỂN ĐỔI DATA KHÁCH AN TOÀN TUÂN THỦ LUẬT SÀN (Safe QR Portal): Hợp thức hóa mã QR bằng 'Kích hoạt Bảo hành điện tử' hoặc 'Tích điểm VIP', tuyệt đối không dùng ngôn từ vi phạm lôi kéo ngoài sàn thô thiển.

QUY TẮC BẮT BUỘC:
- Trả về DUY NHẤT một chuỗi JSON hợp lệ theo đúng cấu trúc Schema quy định.
- Không bọc văn bản giải thích bên ngoài JSON.`;

export function buildUnboxingCardPrompt(inputs: UnboxingCardInputs): string {
  const toneMap: Record<string, string> = {
    emotional: "Chân thành, ấm áp, chạm đến cảm xúc, tâm sự của startup/người làm nghề tận tụy",
    friendly_witty: "Trẻ trung, hóm hỉnh, Gen Z vui nhộn, tạo tiếng cười sảng khoái khi đập hộp",
    premium_elegant: "Sang trọng, quý phái, đẳng cấp, xưng hô Quý Khách chuẩn thương hiệu cao cấp",
    cute_cheerful: "Đáng yêu, ngọt ngào, tươi vui, hợp ngành mẹ & bé, phụ kiện, quà lưu niệm",
  };

  const formatMap: Record<string, { name: string; size: string }> = {
    postcard_a6: { name: "Bưu Thiếp A6", size: "105 x 148 mm" },
    mini_card: { name: "Card Visit Mini", size: "90 x 54 mm" },
    voucher_tag: { name: "Tag Treo / Thẻ Đính Kèm Nơ", size: "60 x 100 mm" },
  };

  const goalMap: Record<string, string> = {
    anti_1_star: "Tập trung tối đa vào Khiên Chắn 1 Sao (Hóa giải bức xúc, cam kết 1 đổi 1 trong 24h, bảo vệ gian hàng)",
    review_booster: "Tập trung kéo Feedback 5 sao kèm hình ảnh & Video đập hộp trên sàn",
    repurchase: "Tập trung kích thích mua lại lần 2 bằng Secret Voucher độc quyền có hạn sử dụng",
    warranty_crm: "Tập trung hướng dẫn quét QR kích hoạt bảo hành điện tử chính hãng và tích điểm VIP",
  };

  const toneText = toneMap[inputs.cardTone] || inputs.cardTone || "Chân thành, ấm áp";
  const formatInfo = formatMap[inputs.cardFormat] || { name: inputs.cardFormat || "Bưu Thiếp A6", size: "105 x 148 mm" };
  const goalText = goalMap[inputs.primaryGoal || "anti_1_star"] || "Cân bằng giữa chống 1 sao và kéo review 5 sao";
  const shopName = inputs.shopName || "Gian Hàng Chính Hãng";
  const category = inputs.productCategory || "Sản phẩm thương mại";
  const offer = inputs.specialOffer || "Voucher giảm giá cho đơn hàng tiếp theo và quà tặng bất ngờ đính kèm";

  return `Hãy thiết kế một bản Thư Cảm Ơn Nhét Hộp Hàng hoàn chỉnh chuẩn xưởng in cho đơn hàng TMĐT với các thông số sau:

THÔNG TIN ĐẦU VÀO:
- Tên Shop / Thương hiệu: ${shopName} (BẮT BUỘC: Luôn dùng đúng tên shop "${shopName}" cho 'badgeText' và trong toàn bộ nội dung thư cảm ơn)
- Ngành hàng / Sản phẩm: ${category}
- Phong cách ngôn từ (Tone): ${toneText}
- Khổ thẻ in: ${formatInfo.name} (${formatInfo.size})
- Mục tiêu ưu tiên: ${goalText}
- Quà tặng / Ưu đãi tri ân: ${offer}

YÊU CẦU ĐẦU RA JSON BẮT BUỘC:
Trả về đối tượng JSON đúng cấu trúc sau:
{
  "shopName": "${shopName}",
  "cardFormat": "${formatInfo.name} (${formatInfo.size})",
  "cardTone": "${toneText}",
  "primaryGoal": "${goalText}",
  "front": {
    "headline": "Tiêu đề đập vào mắt bìa trước (Ngắn gọn, giật tít ấm áp hoặc bất ngờ)",
    "subheadline": "Lời tựa mở đầu chào mừng khách hàng (1-2 câu sâu sắc)",
    "badgeText": "${shopName.toUpperCase()} • OFFICIAL STORE",
    "visualDesignNotes": [
      "Tone màu chủ đạo gợi ý cho xưởng in",
      "Gợi ý họa tiết trang trí hoặc viền bo",
      "Font chữ và phong cách trình bày"
    ],
    "openHook": "Câu kêu gọi lật mặt sau"
  },
  "back": {
    "heartfeltLetter": "Tâm thư tri ân chân thành từ đội ngũ (3-5 câu truyền cảm xúc, kể về sự nâng niu khi đóng gói)",
    "anti1StarShield": {
      "heading": "Tiêu đề khiên chắn 1 sao (VD: ĐỪNG VỘI ĐÁNH GIÁ 1 SAO BẠN NHÉ!)",
      "message": "Lời cam kết đổi trả 100% miễn phí trong 24h nếu có sự cố vận chuyển hoặc nhầm lẫn",
      "supportCta": "Hướng dẫn nhắn qua khung chat sàn để được giải quyết hỏa tốc"
    },
    "reviewMagnet": {
      "heading": "Tiêu đề nam châm 5 sao (VD: CHỤP ẢNH XINH - NHẬN VOUCHER LIỀN TAY)",
      "incentive": "Chi tiết ưu đãi voucher/quà tặng đính kèm",
      "instruction": "Lời kêu gọi quay clip unboxing và đánh giá 5 sao trên sàn"
    },
    "safeQrPortal": {
      "purpose": "Mục đích quét mã (Kích hoạt bảo hành điện tử chính hãng hoặc Tích điểm VIP)",
      "qrCaption": "Lời dẫn trên khung QR",
      "safeNotice": "Lời dẫn đảm bảo 100% tuân thủ chính sách sàn, không bị phạt kéo khách ngoài sàn"
    },
    "usageTips": [
      "Mẹo sử dụng hoặc bảo quản nhanh #1 theo đặc thù ngành hàng ${category}",
      "Mẹo sử dụng hoặc bảo quản nhanh #2"
    ],
    "fullBackText": "Toàn văn bản mặt sau hoàn chỉnh, định dạng đẹp đẽ, sẵn sàng copy 1 chạm"
  },
  "printSpecs": {
    "formatName": "${formatInfo.name}",
    "dimensionsMm": "${formatInfo.size}",
    "bleedNote": "Lưu ý tràn lề 2mm mỗi cạnh cho file in xưởng",
    "recommendedPaper": "Chất liệu giấy đề xuất (e.g. C300 cán màng mờ, Giấy Kraft...)",
    "colorMode": "Hệ màu CMYK (Độ phân giải 300 DPI)",
    "estimatedCost": "Chi phí in ước tính tại xưởng Việt Nam theo số lượng 1.000 tấm",
    "proPackagingTip": "Mẹo xếp thiệp vào hộp, cách xịt hương thơm đa giác quan"
  },
  "marketingAdvice": [
    "Lời khuyên thực chiến #1 giúp tăng tỷ lệ giữ chân khách và hạn chế hoàn hàng",
    "Lời khuyên thực chiến #2",
    "Lời khuyên thực chiến #3"
  ]
}

BẮT ĐẦU BẰNG { VÀ KẾT THÚC BẰNG }`;
}

// -------------------------------------------------------------
// BỘ PARSER 4 TẦNG BỀN BỈ (4-TIER RESILIENT PARSER)
// -------------------------------------------------------------

/**
 * Chuẩn hóa các ký tự điều khiển (newline, tab) chưa được escape bên trong chuỗi JSON
 */
export function escapeControlCharsInJsonStrings(str: string): string {
  if (!str) return "";
  let result = "";
  let inString = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escape) {
      result += ch;
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      result += ch;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString) {
      if (ch === "\n") {
        result += "\\n";
        continue;
      }
      if (ch === "\r") {
        result += "\\r";
        continue;
      }
      if (ch === "\t") {
        result += "\\t";
        continue;
      }
    }
    result += ch;
  }
  return result;
}

/**
 * Tự động sửa các dấu nháy kép unescaped bên trong string values của JSON
 */
export function fixUnescapedQuotesInJson(jsonStr: string): string {
  if (!jsonStr) return "";

  let result = "";
  let inString = false;
  let inKey = false;
  let escape = false;
  const contextStack: ("OBJECT" | "ARRAY")[] = [];
  let expectValue = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];

    if (escape) {
      result += ch;
      escape = false;
      continue;
    }

    if (ch === "\\") {
      result += ch;
      escape = true;
      continue;
    }

    if (!inString) {
      if (ch === "{") {
        contextStack.push("OBJECT");
        expectValue = false;
        result += ch;
        continue;
      } else if (ch === "}") {
        if (contextStack.length > 0 && contextStack[contextStack.length - 1] === "OBJECT") {
          contextStack.pop();
        }
        expectValue = false;
        result += ch;
        continue;
      } else if (ch === "[") {
        contextStack.push("ARRAY");
        expectValue = true;
        result += ch;
        continue;
      } else if (ch === "]") {
        if (contextStack.length > 0 && contextStack[contextStack.length - 1] === "ARRAY") {
          contextStack.pop();
        }
        expectValue = false;
        result += ch;
        continue;
      } else if (ch === ":") {
        expectValue = true;
        result += ch;
        continue;
      } else if (ch === ",") {
        const currentCtx = contextStack[contextStack.length - 1];
        expectValue = currentCtx === "ARRAY";
        result += ch;
        continue;
      } else if (ch === '"') {
        inString = true;
        const currentCtx = contextStack[contextStack.length - 1];
        inKey = currentCtx === "OBJECT" && !expectValue;
        result += ch;
        continue;
      } else {
        result += ch;
        continue;
      }
    }

    // Đang ở trong chuỗi (inString === true)
    if (ch === '"') {
      let nextIdx = i + 1;
      while (nextIdx < jsonStr.length && /\s/.test(jsonStr[nextIdx])) {
        nextIdx++;
      }
      const nextChar = nextIdx < jsonStr.length ? jsonStr[nextIdx] : "";

      if (inKey) {
        if (nextChar === ":") {
          inString = false;
          inKey = false;
          result += ch;
        } else {
          result += '\\"';
        }
        continue;
      }

      const currentCtx = contextStack[contextStack.length - 1];
      const isValidEnd =
        (currentCtx === "ARRAY" && (nextChar === "," || nextChar === "]" || nextChar === "")) ||
        (currentCtx === "OBJECT" && (nextChar === "," || nextChar === "}" || nextChar === "")) ||
        !currentCtx;

      if (isValidEnd) {
        if (nextChar === ",") {
          let afterCommaIdx = nextIdx + 1;
          while (afterCommaIdx < jsonStr.length && /\s/.test(jsonStr[afterCommaIdx])) {
            afterCommaIdx++;
          }
          const charAfterComma = afterCommaIdx < jsonStr.length ? jsonStr[afterCommaIdx] : "";
          const isValidNextToken =
            charAfterComma === '"' ||
            charAfterComma === "{" ||
            charAfterComma === "[" ||
            charAfterComma === "}" ||
            charAfterComma === "]" ||
            /\d|-|t|f|n/.test(charAfterComma);

          if (!isValidNextToken) {
            result += '\\"';
            continue;
          }
        }

        inString = false;
        result += ch;
      } else {
        result += '\\"';
      }
      continue;
    }

    result += ch;
  }

  return result;
}

/**
 * Làm sạch chuỗi JSON thô trước khi phân tích
 */
export function sanitizeRawJsonString(raw: string): string {
  if (!raw) return "";
  let cleaned = raw.trim();

  // Xóa Byte Order Mark (BOM) & zero-width spaces
  cleaned = cleaned.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Bóc tách markdown codeblock nếu có
  const codeblockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeblockMatch && codeblockMatch[1]) {
    cleaned = codeblockMatch[1].trim();
  } else {
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
  }
  cleaned = cleaned.trim();

  // Loại bỏ lời dẫn phía trước (tìm '{' đầu tiên) và lời kết phía sau (tìm '}' cuối cùng)
  const firstOpen = cleaned.indexOf("{");
  const lastClose = cleaned.lastIndexOf("}");
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  } else if (firstOpen !== -1) {
    cleaned = cleaned.substring(firstOpen);
  }

  // Chuẩn hóa ký tự điều khiển unescaped bên trong string values
  const withEscapedControls = escapeControlCharsInJsonStrings(cleaned);

  try {
    JSON.parse(withEscapedControls);
    return withEscapedControls;
  } catch {
    const withFixedQuotes = fixUnescapedQuotesInJson(withEscapedControls);
    return withFixedQuotes;
  }
}

/**
 * Thuật toán cứu vãn JSON dở dang khi bị đứt token (Stack-based Resilient Parser)
 */
export function repairTruncatedJson(jsonStr: string): string {
  if (!jsonStr) return "";
  let str = jsonStr.trim();

  // Xóa BOM
  str = str.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Bóc tách markdown codeblock nếu có
  const codeblockMatch = str.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
  if (codeblockMatch && codeblockMatch[1]) {
    str = codeblockMatch[1].trim();
  }

  const firstOpen = str.indexOf("{");
  if (firstOpen === -1) return str;

  str = str.substring(firstOpen);
  str = fixUnescapedQuotesInJson(str);
  str = escapeControlCharsInJsonStrings(str);

  // Nếu bị đứt ngang ở một key hoặc dấu phẩy cuối
  str = str.replace(/,\s*"[^"]*":?\s*"?$/, "");

  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === "{" || ch === "[") {
        stack.push(ch);
      } else if (ch === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{") {
          stack.pop();
        }
      } else if (ch === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") {
          stack.pop();
        }
      }
    }
  }

  if (inString) {
    str += '"';
  }

  str = str.replace(/,\s*$/, "");

  while (stack.length > 0) {
    const open = stack.pop();
    str = str.replace(/,\s*$/, "");
    if (open === "{") {
      str += "}";
    } else if (open === "[") {
      str += "]";
    }
  }

  str = str.replace(/,\s*([}\]])/g, "$1");

  return str;
}

/**
 * TẦNG 3: Phân tích kết quả Markdown định dạng cũ (Legacy Markdown Parser)
 * Hỗ trợ 100% dữ liệu lịch sử cũ
 */
export function parseLegacyMarkdownToCardData(
  markdown: string,
  inputs?: UnboxingCardInputs
): UnboxingCardData {
  const rawText = markdown || "";
  const shopName = inputs?.shopName || "Gian Hàng Chính Hãng";
  const cardFormat = inputs?.cardFormat || "Bưu Thiếp A6 (10 x 15 cm)";
  const cardTone = inputs?.cardTone || "Chân thành, ấm áp";

  const frontMatch = rawText.match(/##\s*[🎴1\.\s]*MẶT TRƯỚC[\s\S]*?(?=(?:---|##\s*[💌2\.\s]*MẶT SAU|$))/i);
  const backMatch = rawText.match(/##\s*[💌2\.\s]*MẶT SAU[\s\S]*?(?=(?:---|##\s*[🖨️3\.\s]*QUY CHUẨN|##\s*3|$))/i);
  const printMatch = rawText.match(/##\s*[🖨️3\.\s]*QUY CHUẨN[\s\S]*?(?=$)/i);

  const rawFront = frontMatch ? frontMatch[0].trim() : "";
  const rawBack = backMatch ? backMatch[0].trim() : "";
  const rawPrint = printMatch ? printMatch[0].trim() : "";

  // Bóc tách mặt trước
  const headlineMatch = rawFront.match(/(?:Tiêu đề đập vào mắt|Tiêu đề)[^:]*:\s*([^\n]+)/i);
  const subMatch = rawFront.match(/(?:Lời tựa|Sub-headline)[^:]*:\s*([^\n]+)/i);
  const visualMatch = rawFront.match(/(?:Điểm nhấn thiết kế|Visual Note)[^:]*:\s*([^\n]+)/i);

  const headline = headlineMatch
    ? headlineMatch[1].replace(/[*_]/g, "").trim()
    : "MÓN QUÀ NÀY ĐƯỢC CHUẨN BỊ DÀNH RIÊNG CHO BẠN!";
  const subheadline = subMatch
    ? subMatch[1].replace(/[*_]/g, "").trim()
    : "Cảm ơn bạn vì đã tin tưởng lựa chọn chúng mình giữa muôn vàn thương hiệu ngoài kia.";
  const visualNote = visualMatch ? visualMatch[1].replace(/[*_]/g, "").trim() : "";

  // Bóc tách mặt sau
  const heartMatch = rawBack.match(/###\s*[🌹\s]*Lời Tri Ân[\s\S]*?(?=(?:###|$))/i);
  const shieldMatch = rawBack.match(/###\s*[🛡️\s]*KHIÊN CHẮN 1 SAO[\s\S]*?(?=(?:###|$))/i);
  const starMatch = rawBack.match(/###\s*[⭐\s]*NAM CHÂM KÉO REVIEW[\s\S]*?(?=(?:###|$))/i);
  const qrMatch = rawBack.match(/###\s*[📲\s]*CỔNG QUÉT QR[\s\S]*?(?=(?:---|##|$))/i);

  const heartfeltLetter = heartMatch
    ? heartMatch[0].replace(/###\s*[^\n]+\n+/, "").replace(/[*_]/g, "").trim()
    : `Chào bạn yêu quý, từng sản phẩm gửi đến bạn đều chứa trọn sự tận tâm và tỉ mỉ của đội ngũ ${shopName}. Cảm ơn bạn đã đồng hành cùng chúng mình!`;

  const shieldText = shieldMatch
    ? shieldMatch[0].replace(/###\s*[^\n]+\n+/, "").replace(/[*_]/g, "").trim()
    : "Nếu có bất kỳ sơ suất nào trong quá trình vận chuyển, xin ĐỪNG VỘI ĐÁNH GIÁ 1 SAO. Hãy nhắn tin ngay cho shop để được đổi mới 100% miễn phí trong 24 giờ!";

  const starText = starMatch
    ? starMatch[0].replace(/###\s*[^\n]+\n+/, "").replace(/[*_]/g, "").trim()
    : "Nếu bạn hài lòng, hãy chia sẻ đánh giá 5 sao kèm hình ảnh/video xinh xắn để nhận ngay Voucher ưu đãi cho đơn hàng tiếp theo nhé!";

  const qrText = qrMatch
    ? qrMatch[0].replace(/###\s*[^\n]+\n+/, "").replace(/[*_]/g, "").trim()
    : "Quét mã QR để Kích hoạt Bảo hành điện tử chính hãng 1 đổi 1 và nhận quà tri ân thành viên VIP.";

  return {
    shopName,
    cardFormat,
    cardTone,
    primaryGoal: "Chống 1 sao & Kéo review 5 sao",
    front: {
      headline,
      subheadline,
      badgeText: `${shopName.toUpperCase()} • OFFICIAL`,
      visualDesignNotes: visualNote ? [visualNote] : ["Tone màu trang nhã chuẩn ngành hàng", "Họa tiết tinh tế xưởng in"],
      openHook: "Lật mặt sau để xem quà tri ân & hướng dẫn kích hoạt bảo hành ➔",
    },
    back: {
      heartfeltLetter,
      anti1StarShield: {
        heading: "ĐỪNG VỘI ĐÁNH GIÁ 1 SAO BẠN NHÉ!",
        message: shieldText,
        supportCta: "Nhắn tin qua khung chat sàn để được đổi mới 100% miễn phí trong 24h.",
      },
      reviewMagnet: {
        heading: "CHỤP ẢNH XINH - NHẬN QUÀ 5 SAO",
        incentive: "Voucher ưu đãi cho đơn hàng kế tiếp",
        instruction: starText,
      },
      safeQrPortal: {
        purpose: "Kích hoạt bảo hành điện tử chính hãng",
        qrCaption: "[QUÉT MÃ QR BẢO HÀNH ĐIỆN TỬ TẠI ĐÂY]",
        safeNotice: qrText,
      },
      usageTips: [
        "Kiểm tra kỹ kiện hàng ngay khi nhận để được hỗ trợ tốt nhất.",
        "Giữ lại bao bì trong 7 ngày đầu để thuận tiện đổi size nếu cần.",
      ],
      fullBackText: rawBack || `${heartfeltLetter}\n\n${shieldText}\n\n${starText}\n\n${qrText}`,
    },
    printSpecs: {
      formatName: cardFormat,
      dimensionsMm: "105 x 148 mm",
      bleedNote: "Tràn lề 2mm mỗi cạnh (109 x 152 mm)",
      recommendedPaper: "Giấy C300 cán màng mờ 2 mặt",
      colorMode: "Hệ màu CMYK (Độ phân giải 300 DPI)",
      estimatedCost: "Khoảng 350đ - 500đ/tấm khi in số lượng 1.000 tấm",
      proPackagingTip: "Kẹp thiệp vào nơ gói hàng hoặc túi zip sản phẩm, xịt nhẹ một làn hương thơm tạo ấn tượng giác quan.",
    },
    marketingAdvice: [
      "Luôn dùng lời dẫn QR kích hoạt bảo hành điện tử để hợp thức hóa việc chăm sóc khách hàng đúng quy chế sàn.",
      "Cam kết đổi mới 100% giúp hóa giải đến 80% nguy cơ đánh giá tiêu cực từ khách hàng khó tính.",
      "Tặng quà hoặc voucher đơn kế tiếp để thúc đẩy tỷ lệ mua lại (Repeat Purchase Rate).",
    ],
  };
}

/**
 * TẦNG 4: Offline Blueprint Engine Fallback
 * Khi mất kết nối mạng hoặc API AI quá tải, tự động sinh bản thiết kế thiệp hoàn chỉnh theo ngành hàng
 */
export function buildOfflineUnboxingCardData(inputs?: UnboxingCardInputs): UnboxingCardData {
  const shopName = inputs?.shopName?.trim() || "Gian Hàng Chính Hãng";
  const category = inputs?.productCategory?.trim() || "Sản phẩm";
  const format = inputs?.cardFormat === "mini_card" ? "Card Visit Mini (90 x 54 mm)" : inputs?.cardFormat === "voucher_tag" ? "Tag Treo (60 x 100 mm)" : "Bưu Thiếp A6 (105 x 148 mm)";
  const offer = inputs?.specialOffer?.trim() || "Voucher giảm 20.000đ đơn tiếp theo và quà tặng bất ngờ đính kèm";

  return {
    shopName,
    cardFormat: format,
    cardTone: inputs?.cardTone || "Chân thành, ấm áp",
    primaryGoal: inputs?.primaryGoal || "Chống 1 sao & Kéo review 5 sao",
    front: {
      headline: `MÓN QUÀ NÀY ĐƯỢC ${shopName.toUpperCase()} CHUẨN BỊ DÀNH RIÊNG CHO BẠN!`,
      subheadline: `Cảm ơn bạn đã trao gửi niềm tin giữa muôn ngàn sự lựa chọn ngoài kia. Hãy mở ra để khám phá điều tuyệt vời bên trong nhé!`,
      badgeText: `${shopName.toUpperCase()} • CHÍNH HÃNG`,
      visualDesignNotes: [
        "Tone màu trang nhã, ấm áp, đồng bộ với bộ nhận diện của thương hiệu",
        "Viền bo mềm mại hoặc họa tiết hoa văn tối giản phong cách xưởng in cao cấp",
        "Font chữ thanh lịch, dễ đọc, tạo cảm giác thư tay thân tình",
      ],
      openHook: "Lật mặt sau để xem lời tri ân & kích hoạt bảo hành ➔",
    },
    back: {
      heartfeltLetter:
        `Gửi người bạn thân thiết của ${shopName}! Khi bạn cầm trên tay kiện hàng này, từng chi tiết nhỏ đều được chúng mình đóng gói với tất cả sự nâng niu và biết ơn. Chúng mình hy vọng ${category} này sẽ mang lại niềm vui và sự hài lòng trọn vẹn cho bạn!`,
      anti1StarShield: {
        heading: "ĐỪNG VỘI ĐÁNH GIÁ 1 SAO BẠN NHÉ!",
        message:
          `Nếu trong quá trình vận chuyển đường xa có bất kỳ điều gì sơ suất khiến bạn chưa hài lòng, xin bạn ĐỪNG VỘI ĐÁNH GIÁ 1 SAO làm tổn thương công sức của các bạn đóng gói. Xin hãy dành cho ${shopName} cơ hội được chịu trách nhiệm bằng cách nhắn tin ngay qua khung chat sàn để được ĐỔI MỚI 100% MIỄN PHÍ hoặc HOÀN TIỀN trong 24 giờ!`,
        supportCta: "Bấm nút 'Chat ngay' trên sàn để gặp bộ phận hỗ trợ khách hàng trong 5 phút.",
      },
      reviewMagnet: {
        heading: "CHỤP ẢNH XINH - NHẬN QUÀ 5 SAO",
        incentive: offer,
        instruction:
          "Bạn ưng ý với sản phẩm chứ? Hãy chia sẻ niềm vui bằng cách chụp ảnh hoặc quay clip unboxing thật xinh kèm đánh giá 5 sao để nhận ngay voucher tri ân từ shop nhé!",
      },
      safeQrPortal: {
        purpose: "Kích hoạt bảo hành điện tử & Tích điểm VIP",
        qrCaption: "[QUÉT MÃ QR BẢO HÀNH ĐIỆN TỬ TẠI ĐÂY]",
        safeNotice:
          `Quét mã QR để kích hoạt BẢO HÀNH CHÍNH HÃNG 1 ĐỔI 1 & NHẬN QUÀ BÍ MẬT DÀNH RIÊNG CHO KHÁCH HÀNG THÂN THIẾT CỦA ${shopName.toUpperCase()}.`,
      },
      usageTips: [
        "Kiểm tra kỹ phụ kiện và quà tặng kèm theo trong kiện hàng.",
        "Liên hệ ngay khung chat nếu cần hướng dẫn sử dụng chi tiết.",
      ],
      fullBackText: `GỬI KHÁCH HÀNG THÂN THIẾT CỦA ${shopName.toUpperCase()},\n\nKhi bạn cầm trên tay kiện hàng này, từng chi tiết nhỏ đều được chúng mình đóng gói với tất cả sự trân trọng. Cảm ơn bạn vì đã luôn đồng hành cùng ${shopName}!\n\n🛡️ NẾU CÓ BẤT KỲ ĐIỀU GÌ CHƯA HÀI LÒNG:\nXin bạn ĐỪNG VỘI ĐÁNH GIÁ 1 SAO. Hãy nhắn tin ngay qua khung chat của sàn, chúng mình cam kết ĐỔI MỚI 100% MIỄN PHÍ hoặc HOÀN TIỀN trong 24 giờ!\n\n⭐ CHIA SẺ NIỀM VUI UNBOXING:\nNếu bạn yêu thích sản phẩm, hãy chụp ảnh/quay video feedback 5 sao để nhận ngay ${offer}!\n\n📲 QUÉT MÃ QR ĐỂ KÍCH HOẠT BẢO HÀNH CHÍNH HÃNG & TÍCH ĐIỂM VIP!`,
    },
    printSpecs: {
      formatName: format,
      dimensionsMm: inputs?.cardFormat === "mini_card" ? "90 x 54 mm" : inputs?.cardFormat === "voucher_tag" ? "60 x 100 mm" : "105 x 148 mm",
      bleedNote: "Tràn lề 2mm mỗi cạnh cho file in xưởng",
      recommendedPaper: "Giấy Couche 300gsm (C300) cán màng mờ 2 mặt - Chống thấm nước, cứng cáp",
      colorMode: "Hệ màu CMYK (Độ phân giải 300 DPI)",
      estimatedCost: "Khoảng 300đ - 450đ/tấm khi in từ 1.000 tấm tại xưởng in Offset",
      proPackagingTip: "Kẹp thiệp vào nơ gói hàng hoặc túi zip sản phẩm, xịt nhẹ một làn hương thơm tạo ấn tượng unboxing đa giác quan.",
    },
    marketingAdvice: [
      "Luôn dùng lời dẫn QR kích hoạt bảo hành điện tử để hợp thức hóa việc chăm sóc khách hàng đúng quy chế sàn.",
      "Cam kết đổi mới 100% giúp hóa giải đến 80% nguy cơ đánh giá tiêu cực do lỗi vận chuyển.",
      "Tặng quà hoặc voucher đơn kế tiếp để thúc đẩy tỷ lệ mua lại (Repeat Purchase Rate).",
    ],
  };
}

/**
 * Chuẩn hóa dữ liệu object sau khi parse JSON thành công
 */
export function normalizeUnboxingCardData(
  parsed: any,
  inputs?: UnboxingCardInputs
): UnboxingCardData {
  if (!parsed || typeof parsed !== "object") {
    return buildOfflineUnboxingCardData(inputs);
  }

  // Ưu tiên inputs.shopName từ form của người dùng; fallback về parsed.shopName
  const shopName = String(inputs?.shopName || parsed.shopName || "Gian Hàng Chính Hãng").trim();
  const cardFormat = String(parsed.cardFormat || inputs?.cardFormat || "Bưu Thiếp A6 (10 x 15 cm)").trim();
  const cardTone = String(parsed.cardTone || inputs?.cardTone || "Chân thành, ấm áp").trim();
  const primaryGoal = String(parsed.primaryGoal || inputs?.primaryGoal || "Chống 1 sao & Kéo review 5 sao").trim();

  const rawFront = typeof parsed.front === "object" && parsed.front !== null ? parsed.front : {};
  const rawBadge = String(rawFront.badgeText || "").trim();
  let badgeText = "";
  if (!rawBadge) {
    badgeText = `${shopName.toUpperCase()} • OFFICIAL STORE`;
  } else if (!rawBadge.toLowerCase().includes(shopName.toLowerCase())) {
    badgeText = `${shopName.toUpperCase()} • ${rawBadge.replace(/^[•\s-]+|[•\s-]+$/g, "")}`;
  } else {
    badgeText = rawBadge;
  }

  const front: CardFrontSide = {
    headline: String(rawFront.headline || "MÓN QUÀ NÀY ĐƯỢC CHUẨN BỊ DÀNH RIÊNG CHO BẠN!").trim(),
    subheadline: String(rawFront.subheadline || "Cảm ơn bạn vì đã tin tưởng lựa chọn chúng mình giữa muôn vàn thương hiệu ngoài kia.").trim(),
    badgeText,
    visualDesignNotes: Array.isArray(rawFront.visualDesignNotes)
      ? rawFront.visualDesignNotes.map(String).filter(Boolean)
      : ["Tone màu trang nhã chuẩn thương hiệu", "Họa tiết tinh tế xưởng in"],
    openHook: String(rawFront.openHook || "Lật mặt sau để xem quà tri ân & kích hoạt bảo hành ➔").trim(),
  };

  const rawBack = typeof parsed.back === "object" && parsed.back !== null ? parsed.back : {};
  const rawShield = typeof rawBack.anti1StarShield === "object" && rawBack.anti1StarShield !== null ? rawBack.anti1StarShield : {};
  const rawStar = typeof rawBack.reviewMagnet === "object" && rawBack.reviewMagnet !== null ? rawBack.reviewMagnet : {};
  const rawQr = typeof rawBack.safeQrPortal === "object" && rawBack.safeQrPortal !== null ? rawBack.safeQrPortal : {};

  const back: CardBackSide = {
    heartfeltLetter: String(
      rawBack.heartfeltLetter ||
        `Chào bạn yêu quý, từng sản phẩm gửi đến bạn đều chứa trọn sự tận tâm của đội ngũ ${shopName}. Cảm ơn bạn đã đồng hành cùng chúng mình!`
    ).trim(),
    anti1StarShield: {
      heading: String(rawShield.heading || "ĐỪNG VỘI ĐÁNH GIÁ 1 SAO BẠN NHÉ!").trim(),
      message: String(
        rawShield.message ||
          "Nếu trong quá trình vận chuyển đường xa có bất kỳ điều gì sơ suất khiến bạn chưa hài lòng, xin bạn ĐỪNG VỘI ĐÁNH GIÁ 1 SAO. Hãy nhắn tin ngay qua khung chat sàn để được ĐỔI MỚI 100% MIỄN PHÍ trong 24 giờ!"
      ).trim(),
      supportCta: String(rawShield.supportCta || "Nhắn tin qua khung chat sàn để được hỗ trợ hỏa tốc.").trim(),
    },
    reviewMagnet: {
      heading: String(rawStar.heading || "CHỤP ẢNH XINH - NHẬN VOUCHER 5 SAO").trim(),
      incentive: String(rawStar.incentive || inputs?.specialOffer || "Voucher ưu đãi cho đơn hàng tiếp theo").trim(),
      instruction: String(
        rawStar.instruction ||
          "Hãy chia sẻ niềm vui đập hộp bằng cách chụp ảnh hoặc quay video feedback 5 sao để nhận quà tri ân từ shop nhé!"
      ).trim(),
    },
    safeQrPortal: {
      purpose: String(rawQr.purpose || "Kích hoạt bảo hành điện tử chính hãng").trim(),
      qrCaption: String(rawQr.qrCaption || "[QUÉT MÃ QR BẢO HÀNH ĐIỆN TỬ TẠI ĐÂY]").trim(),
      safeNotice: String(
        rawQr.safeNotice ||
          "Quét mã QR để kích hoạt BẢO HÀNH CHÍNH HÃNG 1 ĐỔI 1 & NHẬN ƯU ĐÃI THÀNH VIÊN THÂN THIẾT."
      ).trim(),
    },
    usageTips: Array.isArray(rawBack.usageTips)
      ? rawBack.usageTips.map(String)
      : ["Kiểm tra kiện hàng cẩn thận khi nhận.", "Liên hệ khung chat sàn nếu cần hỗ trợ đổi size."],
    fullBackText: String(rawBack.fullBackText || "").trim() ||
      `${rawBack.heartfeltLetter || ""}\n\n${rawShield.message || ""}\n\n${rawStar.instruction || ""}\n\n${rawQr.safeNotice || ""}`.trim(),
  };

  const rawPrint = typeof parsed.printSpecs === "object" && parsed.printSpecs !== null ? parsed.printSpecs : {};
  const printSpecs: PrintSpecs = {
    formatName: String(rawPrint.formatName || cardFormat).trim(),
    dimensionsMm: String(rawPrint.dimensionsMm || "105 x 148 mm").trim(),
    bleedNote: String(rawPrint.bleedNote || "Tràn lề 2mm mỗi cạnh (109 x 152 mm)").trim(),
    recommendedPaper: String(rawPrint.recommendedPaper || "Giấy Couche 300gsm (C300) cán màng mờ 2 mặt").trim(),
    colorMode: "Hệ màu CMYK (Độ phân giải 300 DPI)",
    estimatedCost: String(rawPrint.estimatedCost || "Khoảng 320đ - 450đ/tấm từ 1.000 tấm").trim(),
    proPackagingTip: String(
      rawPrint.proPackagingTip ||
        "Kẹp thiệp vào nơ gói hàng hoặc túi zip sản phẩm, xịt nhẹ một làn hương thơm tạo ấn tượng unboxing đa giác quan."
    ).trim(),
  };

  const marketingAdvice: string[] = Array.isArray(parsed.marketingAdvice)
    ? parsed.marketingAdvice.map(String)
    : [
        "Luôn dùng lời dẫn QR kích hoạt bảo hành điện tử để hợp thức hóa việc chăm sóc khách hàng đúng quy chế sàn.",
        "Cam kết đổi mới 100% giúp hóa giải đến 80% nguy cơ đánh giá tiêu cực do lỗi vận chuyển.",
        "Tặng quà hoặc voucher đơn kế tiếp để thúc đẩy tỷ lệ mua lại (Repeat Purchase Rate).",
      ];

  return {
    shopName,
    cardFormat,
    cardTone,
    primaryGoal,
    front,
    back,
    printSpecs,
    marketingAdvice,
  };
}

/**
 * Parser chính 4 tầng bền bỉ cho Unboxing Card Generator
 */
export function parseUnboxingCardResult(
  rawResult: string,
  inputs?: UnboxingCardInputs
): UnboxingCardData {
  if (!rawResult || !rawResult.trim()) {
    if (inputs?.shopName && inputs.shopName.trim()) {
      return buildOfflineUnboxingCardData(inputs);
    }
    return SAMPLE_CARD_DATA;
  }

  const sanitized = sanitizeRawJsonString(rawResult);

  // TẦNG 1: Native JSON Parse
  try {
    const parsed = JSON.parse(sanitized);
    if (parsed && (parsed.front || parsed.back || parsed.headline)) {
      return normalizeUnboxingCardData(parsed, inputs);
    }
  } catch {
    // Chuyển sang Tầng 2
  }

  // TẦNG 2: Stack-based Truncated JSON Repair
  try {
    const repaired = repairTruncatedJson(rawResult);
    const parsed = JSON.parse(repaired);
    if (parsed && (parsed.front || parsed.back || parsed.headline)) {
      return normalizeUnboxingCardData(parsed, inputs);
    }
  } catch {
    // Chuyển sang Tầng 3
  }

  // TẦNG 3: Legacy Markdown Fallback (Hỗ trợ 100% dữ liệu lịch sử)
  if (
    rawResult.includes("MẶT TRƯỚC") ||
    rawResult.includes("MẶT SAU") ||
    rawResult.includes("QUY CHUẨN") ||
    rawResult.includes("## 1.") ||
    rawResult.includes("## 2.")
  ) {
    try {
      const legacyData = parseLegacyMarkdownToCardData(rawResult, inputs);
      if (legacyData && (legacyData.front.headline || legacyData.back.heartfeltLetter)) {
        return legacyData;
      }
    } catch {
      // Chuyển sang Tầng 4
    }
  }

  // TẦNG 4: Offline Blueprint Engine Fallback
  try {
    return buildOfflineUnboxingCardData(inputs);
  } catch {
    return SAMPLE_CARD_DATA;
  }
}

/**
 * Làm sạch, xác thực và chuẩn hóa JSON đầu ra ngay tại API Router trước khi lưu DB/trả về client
 */
export function cleanAndValidateUnboxingCardOutput(
  rawText: string,
  inputs?: UnboxingCardInputs
): string {
  if (!rawText || !rawText.trim()) {
    try {
      return JSON.stringify(buildOfflineUnboxingCardData(inputs));
    } catch {
      return JSON.stringify(SAMPLE_CARD_DATA);
    }
  }

  try {
    const data = parseUnboxingCardResult(rawText, inputs);
    return JSON.stringify(data);
  } catch (err) {
    console.error("cleanAndValidateUnboxingCardOutput_error", err);
    try {
      return JSON.stringify(buildOfflineUnboxingCardData(inputs));
    } catch {
      return JSON.stringify(SAMPLE_CARD_DATA);
    }
  }
}
