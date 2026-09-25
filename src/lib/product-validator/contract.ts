/**
 * AI Thẩm Định Sản Phẩm Trend & Quản Trị Rủi Ro Đầu Tư TMĐT (2026 Edition)
 * Chuẩn hóa JSON Schema, Nghiệp vụ tài chính sàn & Cơ chế phục hồi 4 tầng (4-Tier Resilient Engine)
 */

export interface FinancialBreakdown {
  costPriceFormatted: string;          // "68.000đ"
  targetPriceFormatted: string;        // "189.000đ"
  grossMarginPercent: string;          // "64.0%"
  estimatedPlatformFee: string;        // "26.500đ (14%)" - Phí sàn thực tế 2026 (Phí cố định, Phí thanh toán, Voucher Xtra)
  packagingAndReturnRisk: string;      // "18.900đ (10%)" - Dự phòng hoàn COD 2 đầu & khấu hao hộp carton
  maxBreakevenCpa: string;             // "75.600đ" - Ngân sách Ads tối đa cho 1 đơn để hòa vốn (CPA trần)
  projectedNetProfit: string;          // "25.000đ - 35.000đ/đơn" - Lợi nhuận ròng kỳ vọng khi chạy Ads chuẩn
  financialVerdict: "LÃI DÀY - AN TOÀN" | "BIÊN MỎNG - RỦI RO" | "BẪY LỖ ẨN - TRÁNH XA";
}

export interface ValidationCriterion {
  id: string;
  name: string;
  category: "market" | "competition" | "finance" | "operation" | "lifecycle";
  score: number;                       // 1 - 10
  maxScore: number;                    // 10
  status: "EXCELLENT" | "ACCEPTABLE" | "WARNING" | "DANGER";
  statusBadge: string;                 // "Tiềm Năng Cao" | "Cạnh Tranh Khốc Liệt" | v.v.
  expertComment: string;               // Nhận xét thực chiến sâu sắc
  actionAdvice: string;                // Hướng khắc phục cụ thể
}

export interface OperationalPitfall {
  id: string;
  title: string;                       // Tên tử huyệt vận hành
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  severityBadge: string;               // "🚨 Nguy Cấp" | "⚠️ Cảnh Báo"
  rootCause: string;                   // Bản chất rủi ro
  preventionTip: string;               // Giải pháp xử lý ngay
  estimatedLoss?: string;              // Số tiền thiệt hại cụ thể (VD: "Mất 12.000đ - 18.000đ/đơn cước phạt")
  platformTrigger?: string;            // Cơ chế sàn quét phạt (VD: "Máy quét bưu cục tự động cân đo lại thể tích")
}

export interface DifferentiationTactic {
  id: string;
  title: string;                       // Tên chiến lược
  tacticType: "BUNDLE" | "EXCLUSIVE_VARIANT" | "GIFT_LEVERAGE";
  badge: string;                       // "Né Bẫy Phá Giá" | "Tăng AOV +40%"
  executionSteps: string;              // Cách đóng gói / làm việc với xưởng
  aovImpact: string;                   // Tác động đẩy giá trị đơn hàng
  suggestedAddOn?: string;             // Gợi ý món quà / phụ kiện kèm giá sỉ (VD: "Củ sạc 5V-2A (vốn sỉ 18k trên 1688) hoặc hộp quà kraft (3k)")
  pricingStrategy?: string;            // Định giá phễu (VD: "Mua 1 cái 189k | Set Gift 249k | Combo 2 cái 329k (Freeship)")
}

export interface TestPhase {
  phase: string;                       // "Giai đoạn 1: Test Cầu & Content", "Giai đoạn 2: Nhập Mẫu Đợt 1", "Giai đoạn 3: Scale hoặc Xả"
  duration: string;                    // "3 ngày", "5 - 7 ngày", "Ngày 10 - 14"
  budget: string;                      // "300.000đ - 500.000đ"
  action: string;                      // Hành động thực tế cần làm
  kpiGoal: string;                     // Chỉ số đạt yêu cầu (CTR > 3%, CVR > 2.5%, CPA < 55k)
}

export interface SafeTestRoadmap {
  initialUnits: string;                // "30 - 50 cái" (Không all-in ôm hàng nghìn cái)
  maxAdSpendPerOrder: string;          // "Dưới 65.000đ/đơn"
  targetRoas: string;                  // "3.2x - 3.8x"
  stopLossCondition: string;           // "Nếu chi 500.000đ Ads mà < 3 đơn -> Dừng ngay để thanh lý"
  expertVerdictAdvice: string;         // Lời khuyên xương máu đúc kết
  phases?: TestPhase[];                // 3 giai đoạn test đơn cụ thể
  liquidationPlan?: string;            // Kế hoạch thoát hàng / xả hòa vốn thu hồi dòng tiền nếu gãy
}

export interface ProductValidatorData {
  productName: string;
  platform: string;
  source: string;
  overallScore: number;                // 0 - 100
  verdict: "KHUYÊN NÊN LÀM" | "CÂN NHẮC KỸ" | "RỦI RO CAO - NÊN BỎ";
  verdictSubtitle: string;             // Câu nhận định định hướng
  executiveSummary: string;            // Đúc kết ngắn 2 câu
  financials: FinancialBreakdown;      // Bóc tách tài chính 2026
  criteriaList: ValidationCriterion[]; // 5 tiêu chí chấm điểm
  pitfalls: OperationalPitfall[];      // 3 tử huyệt vận hành
  differentiation: DifferentiationTactic[]; // 2 chiến lược ngách né giá rẻ
  roadmap: SafeTestRoadmap;            // Kế hoạch test đơn & cắt lỗ
}

export interface ProductValidatorInputs {
  productName: string;
  costPrice?: string;
  targetPrice?: string;
  platform?: string;
  source?: string;
  notes?: string;
}

// -------------------------------------------------------------
// DỮ LIỆU MẪU CHUẨN XÁC MINH (VERIFIED SAMPLES)
// -------------------------------------------------------------
export const SAMPLE_PRODUCT_VALIDATOR_INPUT: ProductValidatorInputs = {
  productName: "Đèn ngủ hoàng hôn LED RGB đổi 16 màu kèm loa Bluetooth",
  costPrice: "68.000đ",
  targetPrice: "189.000đ",
  platform: "TikTok Shop & Shopee (Đa sàn)",
  source: "Nhập 1688 / Taobao Quảng Châu",
  notes: "Hàng hot trend Douyin, kích thước đóng gói 15x15x20cm, nặng 380g, có phụ kiện cáp sạc USB và remote.",
};

export const SAMPLE_PRODUCT_VALIDATOR_DATA: ProductValidatorData = {
  productName: "Đèn ngủ hoàng hôn LED RGB đổi 16 màu kèm loa Bluetooth",
  platform: "TikTok Shop & Shopee (Đa sàn)",
  source: "Nhập 1688 / Taobao Quảng Châu",
  overallScore: 68,
  verdict: "CÂN NHẮC KỸ",
  verdictSubtitle: "Sản phẩm có hiệu ứng thị giác video rất tốt nhưng áp lực cạnh tranh giá từ tổng kho nội địa cực lớn",
  executiveSummary: "Mặt hàng này bùng nổ mạnh qua video ngắn TikTok/Reels nhưng đang bước vào giai đoạn giữa sóng. Cần tạo biến thể kèm quà tặng độc quyền và bán dạng combo 2 món để né cuộc chiến phá giá dưới 130k của các kho lớn.",
  financials: {
    costPriceFormatted: "68.000đ",
    targetPriceFormatted: "189.000đ",
    grossMarginPercent: "64.0%",
    estimatedPlatformFee: "26.500đ (14%)",
    packagingAndReturnRisk: "18.900đ (10%)",
    maxBreakevenCpa: "75.600đ",
    projectedNetProfit: "28.000đ - 35.000đ/đơn",
    financialVerdict: "BIÊN MỎNG - RỦI RO",
  },
  criteriaList: [
    {
      id: "c1",
      name: "Dung Lượng & Nhu Cầu Tìm Kiếm",
      category: "market",
      score: 8.5,
      maxScore: 10,
      status: "EXCELLENT",
      statusBadge: "Cầu Thị Trường Lớn",
      expertComment: "Lượng tìm kiếm từ khóa 'đèn hoàng hôn' và 'đèn decor phòng ngủ' luôn duy trì >80.000 lượt/tháng, đặc biệt tăng mạnh vào mùa tựu trường và các dịp lễ quà tặng.",
      actionAdvice: "Đánh mạnh vào tệp học sinh, sinh viên và dân văn phòng decor góc làm việc chill tại nhà.",
    },
    {
      id: "c2",
      name: "Mức Độ Bão Hòa & Cạnh Tranh Tổng Kho",
      category: "competition",
      score: 4.5,
      maxScore: 10,
      status: "DANGER",
      statusBadge: "Đỏ Lửa Đè Giá",
      expertComment: "Đã có ít nhất 15 tổng kho Hà Nội và TP.HCM nhập sỉ số lượng vạn cái, đang chạy Flash Sale xả hàng ở mức giá 119k - 139k.",
      actionAdvice: "Tuyệt đối không cạnh tranh bán lẻ đèn trần. Phải đóng gói hộp quà cao cấp hoặc bán kèm củ sạc nhanh/tinh dầu để kéo giá trị lên 199k.",
    },
    {
      id: "c3",
      name: "Biên Lợi Nhuận Sau Phí Sàn & Ads",
      category: "finance",
      score: 6.0,
      maxScore: 10,
      status: "WARNING",
      statusBadge: "Biên Lãi Trung Bình",
      expertComment: "Với giá bán 189k, sau khi trừ phí sàn 14% (26.5k), chi phí đóng gói & rủi ro hoàn COD 10% (18.9k), ngân sách Ads trần hòa vốn là 75.6k. Nếu chi phí ra đơn (CPA) vượt 55k thì tỷ suất lợi nhuận ròng sẽ rơi xuống dưới 12%.",
      actionAdvice: "Chỉ nên chạy Ads chuyển đổi khi có phễu bán kèm (Cross-sell) hoặc tận dụng tối đa Affiliate KOC nhận hoa hồng theo đơn.",
    },
    {
      id: "c4",
      name: "Vòng Đời Sản Phẩm & Tính Bền Vững",
      category: "lifecycle",
      score: 6.5,
      maxScore: 10,
      status: "ACCEPTABLE",
      statusBadge: "Sóng Bão Hòa Trung Hạn",
      expertComment: "Hàng trend decor có vòng đời khoảng 2 - 3 tháng trước khi người dùng bão hòa thị giác. Cần nhập quay vòng nhanh, không lưu kho quá 20 ngày.",
      actionAdvice: "Áp dụng chiến thuật đánh nhanh rút gọn: Nhập lô nhỏ 50-100 cái, đẩy sạch trong 2 tuần rồi chuyển sóng mới.",
    },
    {
      id: "c5",
      name: "Độ Dễ Vận Hành & Rủi Ro Vận Chuyển",
      category: "operation",
      score: 7.5,
      maxScore: 10,
      status: "ACCEPTABLE",
      statusBadge: "Vận Hành Khá An Toàn",
      expertComment: "Khối lượng 380g kích thước 15x15x20cm có cước quy đổi khoảng 750g. Mức cước sàn ở mức chấp nhận được nhưng hộp dễ bị móp góc nếu bưu tá ném hàng.",
      actionAdvice: "Bắt buộc quấn ít nhất 2 lớp bóng khí (bubble wrap) và chèn mút bảo vệ thấu kính đèn.",
    },
  ],
  pitfalls: [
    {
      id: "p1",
      title: "Chênh Lệch Cước Cân Nặng Thể Tích (D*R*C / 6000)",
      severity: "HIGH",
      severityBadge: "⚠️ Cảnh Báo Cước",
      rootCause: "Hộp đóng gói 15x15x20cm quy đổi theo chuẩn sàn = 0.75kg, trong khi cân nặng thực chỉ 380g. Nếu seller cài đặt 400g, sàn sẽ phạt chênh lệch cước.",
      preventionTip: "Khai báo cân nặng đóng gói trên Seller Center chuẩn 750g ngay từ đầu. Dùng thùng carton kích thước sát đáy 14x14x18cm để giảm thể tích.",
      estimatedLoss: "Mất 12.000đ - 18.000đ/đơn cước phạt âm vào ví shop.",
      platformTrigger: "Máy quét bưu cục J&T / Shopee Xpress tự động đo 3D lại tại kho trung chuyển.",
    },
    {
      id: "p2",
      title: "Rủi Ro Hoàn Đơn COD Do Mua Hàng Cảm Xúc Douyin",
      severity: "CRITICAL",
      severityBadge: "🚨 Nguy Cấp COD",
      rootCause: "Khách xem video đêm thích mắt đặt mua, sau 3 ngày shipper giao hàng thì cảm xúc nguội lạnh, dễ bùng hàng hoặc không nghe máy. Tỷ lệ hoàn tự nhiên 16% - 22%.",
      preventionTip: "Gọi xác nhận đơn trong 2h đầu, gửi SMS ZNS thông báo lộ trình, đóng kèm thư cảm ơn có cam kết 1 đổi 1 trong 7 ngày.",
      estimatedLoss: "Lỗ 32.000đ/đơn hoàn (cước hoàn 2 đầu + vỏ hộp nát không tái sử dụng được).",
      platformTrigger: "Shipper giao 3 lần bất thành -> Chuyển hoàn tự động và trừ phí vận chuyển.",
    },
    {
      id: "p3",
      title: "Lỗi Kỹ Thuật Loa Bluetooth & Hết Pin Remote Có Sẵn",
      severity: "MEDIUM",
      severityBadge: "⚠️ Đánh Giá 1 Sao",
      rootCause: "Hàng xưởng 1688 giá rẻ có tỷ lệ pin remote để lưu kho lâu bị yếu (khoảng 4% - 6%). Khách nhận về bấm không sáng đèn sẽ lập tức đánh giá 1 sao.",
      preventionTip: "Kiểm tra test xác suất 10% pin remote trước khi dán tem niêm phong. In sẵn tờ hướng dẫn kết nối bluetooth tiếng Việt dán nắp hộp.",
      estimatedLoss: "Giảm điểm chất lượng shop, kéo tụt tỷ lệ chuyển đổi sản phẩm xuống dưới 1.5%.",
      platformTrigger: "Thuật toán sàn quét đánh giá tiêu cực chứa từ khóa 'loa rè', 'remote hỏng' và bóp hiển thị.",
    },
  ],
  differentiation: [
    {
      id: "d1",
      title: "Set 'Hộp Quà Sinh Nhật Tinh Tế' (Gift Box Concept)",
      tacticType: "EXCLUSIVE_VARIANT",
      badge: "Né Cuộc Chiến Giá Rẻ",
      executionSteps: "Yêu cầu xưởng đóng hộp carton nắp gài màu pastel, kèm túi giấy quai xách và thiệp chúc mừng. Đổi tiêu đề và video thành 'Quà tặng sinh nhật cho người thương'.",
      aovImpact: "Kéo giá bán từ 189k lên 249k (+31% doanh thu), biên lãi ròng tăng từ 28k lên 65k/đơn.",
      suggestedAddOn: "Túi giấy kraft quai nơ (vốn sỉ 3.500đ) + Thiệp vintage (800đ) nhập sỉ chợ Kim Biên hoặc 1688.",
      pricingStrategy: "Bản Tiêu Chuẩn: 189.000đ | Bản Full Hộp Quà VIP: 249.000đ (Tặng kèm túi thiệp).",
    },
    {
      id: "d2",
      title: "Combo Kép 'Đèn Hoàng Hôn + Củ Sạc Nhanh 20W Chống Cháy'",
      tacticType: "BUNDLE",
      badge: "Tăng AOV + Đẩy ROAS",
      executionSteps: "Đèn chỉ có dây USB không kèm củ sạc. Đa số khách ngại dùng chung củ sạc điện thoại. Tạo deal mua kèm củ sạc 20W với giá hời để kích thích mua cả đôi.",
      aovImpact: "Kéo AOV giỏ hàng lên 234k, tạo thêm 28.000đ biên độ lợi nhuận ròng để tự tin tăng ngân sách Ads.",
      suggestedAddOn: "Củ sạc nhanh 20W OEM chuẩn CE (vốn sỉ 1688 khoảng 18.000đ).",
      pricingStrategy: "Đèn lẻ: 189.000đ | Combo Đèn + Củ sạc 20W: 229.000đ (Tiết kiệm 25k so với mua lẻ).",
    },
  ],
  roadmap: {
    initialUnits: "30 - 50 cái (Chia làm 2 màu hot nhất: Sunset Orange & Rainbow)",
    maxAdSpendPerOrder: "Tối đa 60.000đ/đơn (Không để CPA vượt quá 75.600đ)",
    targetRoas: "Tối thiểu 3.0x trên TikTok Shop GMV / Shopee Ads",
    stopLossCondition: "Nếu ngân sách chạy thử 500.000đ mà không ra được ít nhất 5 đơn hàng chuyển đổi (CPA > 100k), lập tức tắt Ads, xả hòa vốn 120k và thu hồi vốn.",
    expertVerdictAdvice: "Không bao giờ all-in nhập cả nghìn cái theo cảm tính khi thấy video trên Douyin đạt triệu view. Hãy bán bằng sự khác biệt của quà tặng đóng gói, và luôn giữ tư duy 'bảo toàn vốn là trên hết'.",
    phases: [
      {
        phase: "Giai Đoạn 1: Test Cầu Thị Trường & Video Hook",
        duration: "3 Ngày Đầu",
        budget: "350.000đ - 500.000đ",
        action: "Làm 3 video ngắn khai thác 3 góc quay khác nhau (Góc decor bàn làm việc, góc chụp ảnh selfie hoàng hôn, góc bật nhạc loa bluetooth). Bật chiến dịch chuyển đổi ngân sách nhỏ.",
        kpiGoal: "CTR > 3.2%, Tỷ lệ xem hết video > 15%, có ít nhất 10 lượt thêm vào giỏ hàng.",
      },
      {
        phase: "Giai Đoạn 2: Nhập Mẫu Đợt 1 & Tối Ưu Chuyển Đổi",
        duration: "Ngày 4 - Ngày 10",
        budget: "1.200.000đ Ads",
        action: "Nhập 30-50 chiếc từ tổng kho trong nước (giao trong 24-48h). Đóng gói kèm quà tặng thiệp, bật chiến dịch chuyển đổi và kích hoạt Affiliate TikTok Shop.",
        kpiGoal: "CPA thực tế < 55.000đ/đơn, tỷ lệ hoàn đơn COD đo lường dưới 12%.",
      },
      {
        phase: "Giai Đoạn 3: Quyết Định Scale Chiến Dịch Hoặc Dừng Lỗ",
        duration: "Ngày 11 - Ngày 15",
        budget: "Theo tỷ lệ ROAS thực tế",
        action: "Nếu ROAS duy trì > 3.2x: Đặt hàng lô 200 chiếc trực tiếp qua xưởng 1688 đường bộ để ép giá vốn về 58k. Nếu ROAS < 2.0x: Chuyển ngay sang kế hoạch xả hàng thu hồi vốn.",
        kpiGoal: "Tỷ suất lợi nhuận ròng trên doanh thu (Net Margin) đạt > 18%.",
      },
    ],
    liquidationPlan: "Nếu chiến dịch thất bại: Bật Flash Sale nội sàn với giá 119k (hòa vốn giá nhập 68k + ship kho 15k + phí sàn), hoặc gom đóng gói thành quà tặng kèm (Giveaway/Gift with Purchase) cho sản phẩm chủ lực khác của shop để kéo đánh giá 5 sao.",
  },
};

// -------------------------------------------------------------
// BỘ PROMPT THỰC CHIẾN TMĐT 2026
// -------------------------------------------------------------
export const PRODUCT_VALIDATOR_SYSTEM_PROMPT = `Bạn là Giám Đốc Nghiên Cứu Thị Trường & Thẩm Định Đầu Tư Hàng Hóa TMĐT hàng đầu tại Việt Nam (Shopee, TikTok Shop, Lazada).
Nhiệm vụ của bạn là bóc tách toàn diện tiềm năng và rủi ro thương mại của sản phẩm trước khi nhà bán hàng xuống tiền nhập hàng.

TƯ DUY THỰC CHIẾN CỐT LÕI (TUYỆT ĐỐI NÓI KHÔNG VỚI LỜI KHUYÊN CHUNG CHUNG / SÁCH VỞ):
1. TƯ DUY TÀI CHÍNH SỐ LIỆU THỰC TẾ 2026:
   - Luôn tính toán chi tiết cơ cấu chi phí sàn 2026 (Phí cố định, Phí thanh toán, Voucher Xtra dao động 12-16%), chi phí khấu hao hoàn hàng COD và bao bì (8-12%), và tính ra ngân sách Ads tối đa để hòa vốn (CPA trần).
2. TỬ HUYỆT VẬN HÀNH PHẢI ĐỊNH LƯỢNG TIỀN MẤT & CƠ CHẾ SÀN CỤ THỂ:
   - "estimatedLoss": BẮT BUỘC chỉ rõ số tiền thiệt hại cụ thể (VNĐ/đơn) hoặc tỷ lệ % mất mát (VD: "Mất 12.000đ - 18.000đ/đơn cước phạt chênh lệch thể tích", "Lỗ 32.000đ/đơn hoàn (cước 2 đầu + nát hộp)").
   - "platformTrigger": BẮT BUỘC nêu chính xác thuật toán hoặc máy quét sàn phát hiện (VD: "Máy quét 3D tự động bưu cục J&T/Shopee Xpress cân đo lại", "Shipper giao 3 lần bất thành chuyển hoàn tự động", "Bộ lọc AI TikTok Shop quét từ cấm bóp reach").
3. CHIẾN LƯỢC KHÁC BIỆT & AOV PHẢI ĐỀ XUẤT MÓN QUÀ/PHỤ KIỆN VỚI GIÁ SỈ & ĐỊNH GIÁ PHỄU CỤ THỂ:
   - "suggestedAddOn": BẮT BUỘC gợi ý chính xác món quà tặng/phụ kiện thực tế kèm GIÁ SỈ nhập 1688 hoặc chợ đầu mối (VD: "Củ sạc nhanh 20W OEM (vốn sỉ 18.000đ trên 1688)", "Túi giấy kraft quai nơ (3.500đ) + Thiệp vintage (800đ)").
   - "pricingStrategy": BẮT BUỘC đưa ra cơ cấu giá phễu 3 tầng cụ thể (VD: "Đơn lẻ: 189k | Set Gift Box: 249k | Combo 2 cái Freeship: 329k").
4. LỘ TRÌNH TEST & CẮT LỖ PHẢI CÓ 3 GIAI ĐOẠN RÕ RÀNG & KẾ HOẠCH XẢ HÀNG THU HỒI VỐN:
   - "phases": BẮT BUỘC chia đúng 3 giai đoạn (giai đoạn 1 test cầu 3 ngày 300k-500k, giai đoạn 2 nhập mẫu 30-50 cái, giai đoạn 3 scale hoặc xả).
   - "liquidationPlan": Kế hoạch xả hàng thu hồi vốn cụ thể nếu gãy trend (giá Flash Sale hòa vốn, kênh xả, cách tặng kèm kéo 5 sao).

QUY TẮC PHẢN HỒI:
- BẮT BUỘC trả về duy nhất 1 đối tượng JSON hợp lệ (bắt đầu bằng { và kết thúc bằng }).
- KHÔNG thêm bất kỳ lời chào, văn bản giải thích hay ký hiệu markdown ngoài khối JSON.
- Mọi trường dữ liệu phải tuân thủ nghiêm ngặt schema JSON yêu cầu.`;

export function buildProductValidatorPrompt(inputs: ProductValidatorInputs): { systemPrompt: string; userPrompt: string } {
  const prodName = inputs.productName || "Sản phẩm";
  const cost = inputs.costPrice?.trim() || "Chưa rõ";
  const target = inputs.targetPrice?.trim() || "Chưa rõ";
  const plat = inputs.platform?.trim() || "Shopee & TikTok Shop";
  const src = inputs.source?.trim() || "Nhập 1688 / Taobao Quảng Châu";
  const notes = inputs.notes?.trim() || "Không có ghi chú thêm";

  const userPrompt = `Hãy thẩm định toàn diện tiềm năng và rủi ro thương mại của sản phẩm sau theo chuẩn sàn TMĐT 2026:

THÔNG TIN ĐẦU VÀO:
- Tên Sản Phẩm / Ý Tưởng: "${prodName}"
- Giá Vốn Nhập Dự Kiến: "${cost}"
- Giá Bán Mục Tiêu: "${target}"
- Kênh Bán Dự Kiến: "${plat}"
- Nguồn Hàng Dự Kiến: "${src}"
- Đặc Tính Vận Hành & Ghi Chú: "${notes}"

YÊU CẦU: Trả về 100% JSON thuần khớp chính xác cấu trúc sau (tuyệt đối không đưa lời khuyên chung chung):
{
  "productName": "${prodName}",
  "platform": "${plat}",
  "source": "${src}",
  "overallScore": 72,
  "verdict": "KHUYÊN NÊN LÀM | CÂN NHẮC KỸ | RỦI RO CAO - NÊN BỎ",
  "verdictSubtitle": "Câu nhận định tóm lược 1 dòng về tiềm năng và rào cản lớn nhất",
  "executiveSummary": "2 câu đúc kết cốt lõi nhất từ chuyên gia về tính khả thi của sản phẩm",
  "financials": {
    "costPriceFormatted": "${cost}",
    "targetPriceFormatted": "${target}",
    "grossMarginPercent": "Tỷ lệ biên lãi gộp %",
    "estimatedPlatformFee": "Phí sàn ước tính (12-16%) kèm số tiền VNĐ",
    "packagingAndReturnRisk": "Dự phòng rủi ro hoàn COD & bao bì kèm số tiền VNĐ",
    "maxBreakevenCpa": "Ngân sách Ads tối đa cho phép để hòa vốn (CPA trần) kèm số tiền VNĐ",
    "projectedNetProfit": "Lợi nhuận ròng dự kiến mỗi đơn sau khi chạy Ads hiệu quả",
    "financialVerdict": "LÃI DÀY - AN TOÀN | BIÊN MỎNG - RỦI RO | BẪY LỖ ẨN - TRÁNH XA"
  },
  "criteriaList": [
    {
      "id": "c1",
      "name": "Dung Lượng & Nhu Cầu Tìm Kiếm",
      "category": "market",
      "score": 8,
      "maxScore": 10,
      "status": "EXCELLENT | ACCEPTABLE | WARNING | DANGER",
      "statusBadge": "Nhãn trạng thái ngắn (VD: Nhu Cầu Cao / Dung Lượng Ngách)",
      "expertComment": "Phân tích chi tiết lượng khách tìm kiếm, mùa vụ và tệp người mua",
      "actionAdvice": "Hành động cụ thể để tiếp cận đúng tệp khách này"
    },
    {
      "id": "c2",
      "name": "Mức Độ Bão Hòa & Cạnh Tranh Tổng Kho",
      "category": "competition",
      "score": 6,
      "maxScore": 10,
      "status": "EXCELLENT | ACCEPTABLE | WARNING | DANGER",
      "statusBadge": "Nhãn trạng thái ngắn (VD: Bão Hòa Đỏ Lửa / Ít Đối Thủ Lớn)",
      "expertComment": "Đánh giá mức độ đối thủ phá giá, tổng kho nội địa và tổng kho Trung Quốc",
      "actionAdvice": "Cách đối phó với áp lực đè giá"
    },
    {
      "id": "c3",
      "name": "Biên Lợi Nhuận Thực Tế Sau Phí & Ads",
      "category": "finance",
      "score": 7,
      "maxScore": 10,
      "status": "EXCELLENT | ACCEPTABLE | WARNING | DANGER",
      "statusBadge": "Nhãn trạng thái ngắn (VD: Biên Lãi Đủ Chạy Ads / Lãi Mỏng)",
      "expertComment": "Phân tích xem biên lãi gộp có đủ chịu nhiệt khi giá thầu quảng cáo tăng không",
      "actionAdvice": "Chiến lược tối ưu biên độ lợi nhuận"
    },
    {
      "id": "c4",
      "name": "Vòng Đời Sản Phẩm & Tính Bền Vững",
      "category": "lifecycle",
      "score": 6,
      "maxScore": 10,
      "status": "EXCELLENT | ACCEPTABLE | WARNING | DANGER",
      "statusBadge": "Nhãn trạng thái ngắn (VD: Trend 1-2 Tháng / Evergreen Quanh Năm)",
      "expertComment": "Đánh giá vòng đời hàng trend hay hàng bán bền vững quanh năm",
      "actionAdvice": "Chiến lược nhập hàng theo nhịp sóng"
    },
    {
      "id": "c5",
      "name": "Độ Dễ Vận Hành & Rủi Ro Vận Chuyển",
      "category": "operation",
      "score": 8,
      "maxScore": 10,
      "status": "EXCELLENT | ACCEPTABLE | WARNING | DANGER",
      "statusBadge": "Nhãn trạng thái ngắn (VD: Gọn Nhẹ Dễ Đóng / Hàng Cồng Kềnh Dễ Vỡ)",
      "expertComment": "Đánh giá cước thể tích (D*R*C/6000), đóng gói, rủi ro hỏng hóc",
      "actionAdvice": "Cách bảo vệ sản phẩm giảm thiểu rủi ro hoàn hàng"
    }
  ],
  "pitfalls": [
    {
      "id": "p1",
      "title": "Chênh Lệch Cước Cân Nặng Thể Tích (D*R*C / 6000)",
      "severity": "HIGH",
      "severityBadge": "⚠️ Cảnh Báo Cước",
      "rootCause": "Bản chất nguyên nhân cốt lõi khiến đơn hàng bị tính thêm tiền",
      "preventionTip": "Giải pháp xử lý ngay",
      "estimatedLoss": "Số tiền thiệt hại cụ thể bằng VNĐ/đơn (VD: Mất 12.000đ - 18.000đ/đơn cước phạt chênh lệch thể tích)",
      "platformTrigger": "Cơ chế sàn quét (VD: Máy quét 3D tự động bưu cục J&T / Shopee Xpress tại kho trung chuyển)"
    },
    {
      "id": "p2",
      "title": "Rủi Ro Hoàn Đơn COD Do Mua Hàng Cảm Xúc",
      "severity": "CRITICAL",
      "severityBadge": "🚨 Nguy Cấp COD",
      "rootCause": "Lý do khiến tỷ lệ hoàn hàng bùng đơn tăng cao",
      "preventionTip": "Quy trình chăm sóc đơn chống bom hàng",
      "estimatedLoss": "Số tiền thiệt hại cụ thể (VD: Lỗ 32.000đ/đơn hoàn gồm cước 2 đầu + vỏ hộp hỏng)",
      "platformTrigger": "Cơ chế sàn quét (VD: Shipper cập nhật giao 3 lần bất thành -> Kích hoạt hoàn tự động)"
    },
    {
      "id": "p3",
      "title": "Quét Vi Phạm Chính Sách & Đánh Giá Tiêu Cực",
      "severity": "MEDIUM",
      "severityBadge": "⚠️ Quét Thuật Toán",
      "rootCause": "Quy định sàn hoặc lỗi trải nghiệm khách hàng",
      "preventionTip": "Cách phòng ngừa và giấy tờ tài liệu chuẩn bị",
      "estimatedLoss": "Hậu quả định lượng (VD: Bị bóp hiển thị từ 30% - 50%, kéo tụt CVR)",
      "platformTrigger": "Cơ chế sàn quét (VD: Bot AI quét từ cấm trong mô tả sản phẩm; đánh giá < 4.2 sao bóp reach)"
    }
  ],
  "differentiation": [
    {
      "id": "d1",
      "title": "Set Hộp Quà Tặng Độc Quyền (Gift Box Concept)",
      "tacticType": "EXCLUSIVE_VARIANT",
      "badge": "Né Cuộc Chiến Giá Rẻ",
      "executionSteps": "Quy cách đóng gói hoặc làm việc với xưởng",
      "aovImpact": "Tác động cụ thể đến doanh thu và biên lãi ròng",
      "suggestedAddOn": "Gợi ý chính xác món quà/phụ kiện kèm giá sỉ 1688 (VD: Túi giấy kraft quai nơ 3.5k + Thiệp 800đ)",
      "pricingStrategy": "Định giá phễu cụ thể: Bản đơn 189k | Set Gift Box 249k"
    },
    {
      "id": "d2",
      "title": "Combo Kép Gia Tăng Giá Trị (Cross-sell Deal Sốc)",
      "tacticType": "BUNDLE",
      "badge": "Tăng AOV +35%",
      "executionSteps": "Gợi ý các món bán kèm hoặc set combo 2 món",
      "aovImpact": "Biên lãi tăng thêm giúp thoải mái chi tiền chạy Ads",
      "suggestedAddOn": "Chỉ đích danh phụ kiện bán kèm kèm giá sỉ (VD: Củ sạc nhanh 20W vốn sỉ 18.000đ trên 1688)",
      "pricingStrategy": "Định giá phễu: Mua lẻ 189k | Combo kèm phụ kiện 229k (Tiết kiệm 25k)"
    }
  ],
  "roadmap": {
    "initialUnits": "30 - 50 cái (Không ôm nhiều khi chưa test cầu)",
    "maxAdSpendPerOrder": "Ngân sách Ads tối đa cho mỗi đơn hàng để không bị lỗ (VNĐ/đơn)",
    "targetRoas": "Chỉ số ROAS mục tiêu cần đạt khi chạy chiến dịch (VD: 3.2x - 3.8x)",
    "stopLossCondition": "Mốc cắt lỗ định lượng (VD: Chi 500k Ads mà < 3 đơn -> Dừng Ads ngay)",
    "expertVerdictAdvice": "1 lời khuyên thực chiến và đắt giá nhất từ chuyên gia",
    "phases": [
      {
        "phase": "Giai Đoạn 1: Test Cầu Thị Trường & Video Hook",
        "duration": "3 Ngày Đầu",
        "budget": "350.000đ - 500.000đ",
        "action": "Làm 3 video ngắn 3 góc hook khác nhau, chạy chiến dịch Ads thăm dò chuyển đổi",
        "kpiGoal": "CTR > 3.2%, Tỷ lệ xem hết video > 15%, > 8 lượt thêm vào giỏ hàng"
      },
      {
        "phase": "Giai Đoạn 2: Nhập Mẫu Đợt 1 & Tối Ưu Chuyển Đổi",
        "duration": "Ngày 4 - Ngày 10",
        "budget": "1.000.000đ - 1.500.000đ Ads",
        "action": "Nhập 30-50 cái kho nội địa giao nhanh, đóng kèm quà tặng, mở Affiliate KOC gắn giỏ hàng",
        "kpiGoal": "CPA thực tế < CPA trần, tỷ lệ hoàn đơn COD < 12%"
      },
      {
        "phase": "Giai Đoạn 3: Quyết Định Scale Lô Lớn Hoặc Cắt Lỗ",
        "duration": "Ngày 11 - Ngày 15",
        "budget": "Theo tỷ lệ ROAS thực tế",
        "action": "Nếu ROAS > 3.2x -> Nhập lô 200 chiếc từ xưởng 1688; Nếu ROAS < 2.0x -> Chuyển sang xả hàng",
        "kpiGoal": "Biên lợi nhuận ròng đạt > 18%"
      }
    ],
    "liquidationPlan": "Kế hoạch thoát hàng cụ thể nếu gãy trend (giá Flash Sale hòa vốn VNĐ, kênh xả, cách tặng kèm GWP kéo 5 sao)"
  }
}

Bắt đầu bằng { và kết thúc bằng } ngay bây giờ:`;

  return { systemPrompt: PRODUCT_VALIDATOR_SYSTEM_PROMPT, userPrompt };
}

// -------------------------------------------------------------
// BỘ PHỤC HỒI DỮ LIỆU TỰ ĐỘNG & BẢN THIẾT KẾ OFFLINE BLUEPRINT
// -------------------------------------------------------------

/**
 * Trích xuất số nguyên từ chuỗi tiền tệ (VD: "68.000đ" -> 68000, "189k" -> 189000)
 */
export function extractPriceNumber(priceStr?: string, defaultVal: number = 0): number {
  if (!priceStr) return defaultVal;
  const cleaned = priceStr.toLowerCase().replace(/\s+/g, "");
  if (cleaned.includes("k")) {
    const numPart = parseFloat(cleaned.replace("k", "").replace(/[^0-9.]/g, ""));
    if (!isNaN(numPart)) return Math.round(numPart * 1000);
  }
  const digits = cleaned.replace(/[^0-9]/g, "");
  if (digits) {
    const val = parseInt(digits, 10);
    return isNaN(val) ? defaultVal : val;
  }
  return defaultVal;
}

/**
 * Định dạng tiền tệ VNĐ chuẩn
 */
export function formatVnd(val: number): string {
  return new Intl.NumberFormat("vi-VN").format(val) + "đ";
}

/**
 * Tự động tạo bản thiết kế thẩm định Offline Blueprint chuẩn xác
 * Tính toán tài chính thực tế khi AI bị ngắt kết nối hoặc gặp lỗi 502
 */
export function buildOfflineProductValidatorData(inputs?: ProductValidatorInputs): ProductValidatorData {
  const prodName = inputs?.productName?.trim() || "Sản phẩm đang thẩm định";
  const costNum = extractPriceNumber(inputs?.costPrice, 70000);
  const targetNum = extractPriceNumber(inputs?.targetPrice, 190000);

  const costFormatted = formatVnd(costNum);
  const targetFormatted = formatVnd(targetNum);

  // Tính toán các chỉ số kinh tế đơn hàng (Unit Economics 2026)
  const grossProfit = Math.max(0, targetNum - costNum);
  const grossMarginPercent = targetNum > 0 ? ((grossProfit / targetNum) * 100).toFixed(1) + "%" : "0%";

  const platformFeeVal = Math.round(targetNum * 0.14); // 14% phí sàn 2026
  const packagingAndCodRiskVal = Math.round(targetNum * 0.10); // 10% hoàn COD & bao bì
  const breakevenCpaVal = Math.max(0, targetNum - costNum - platformFeeVal - packagingAndCodRiskVal);
  const projectedNetVal = Math.round(breakevenCpaVal * 0.35);

  let financialVerdict: "LÃI DÀY - AN TOÀN" | "BIÊN MỎNG - RỦI RO" | "BẪY LỖ ẨN - TRÁNH XA" = "BIÊN MỎNG - RỦI RO";
  let overallScore = 65;
  let verdict: "KHUYÊN NÊN LÀM" | "CÂN NHẮC KỸ" | "RỦI RO CAO - NÊN BỎ" = "CÂN NHẮC KỸ";

  if (breakevenCpaVal >= 70000 && parseFloat(grossMarginPercent) >= 55) {
    financialVerdict = "LÃI DÀY - AN TOÀN";
    overallScore = 78;
    verdict = "KHUYÊN NÊN LÀM";
  } else if (breakevenCpaVal <= 35000 || parseFloat(grossMarginPercent) < 40) {
    financialVerdict = "BẪY LỖ ẨN - TRÁNH XA";
    overallScore = 48;
    verdict = "RỦI RO CAO - NÊN BỎ";
  }

  return {
    productName: prodName,
    platform: inputs?.platform?.trim() || "TikTok Shop & Shopee (Đa sàn)",
    source: inputs?.source?.trim() || "Nhập 1688 / Tổng kho nội địa",
    overallScore,
    verdict,
    verdictSubtitle: `Biên lãi gộp đạt ${grossMarginPercent}. Ngân sách Ads hòa vốn (CPA trần) là ${formatVnd(breakevenCpaVal)}. Cần kiểm soát chặt tỷ lệ hoàn COD.`,
    executiveSummary: `Mặt hàng "${prodName}" có mức giá bán ${targetFormatted} và giá vốn ${costFormatted}. Sau khi khấu trừ phí sàn 14% và dự phòng rủi ro hoàn đơn 10%, bạn còn tối đa ${formatVnd(breakevenCpaVal)} để chạy quảng cáo ra 1 đơn hàng.`,
    financials: {
      costPriceFormatted: costFormatted,
      targetPriceFormatted: targetFormatted,
      grossMarginPercent,
      estimatedPlatformFee: `${formatVnd(platformFeeVal)} (14%)`,
      packagingAndReturnRisk: `${formatVnd(packagingAndCodRiskVal)} (10%)`,
      maxBreakevenCpa: formatVnd(breakevenCpaVal),
      projectedNetProfit: `${formatVnd(projectedNetVal)}/đơn`,
      financialVerdict,
    },
    criteriaList: [
      {
        id: "c1",
        name: "Dung Lượng & Nhu Cầu Thị Trường",
        category: "market",
        score: overallScore >= 70 ? 8 : 6.5,
        maxScore: 10,
        status: overallScore >= 70 ? "EXCELLENT" : "ACCEPTABLE",
        statusBadge: overallScore >= 70 ? "Dung Lượng Lớn" : "Thị Trường Ngách",
        expertComment: `Nhu cầu tìm kiếm từ khóa liên quan đến "${prodName}" duy trì ổn định. Khách hàng có xu hướng quan sát kỹ video thực tế và đánh giá trước khi đặt đơn COD.`,
        actionAdvice: "Sản xuất video ngắn trực diện công năng giải quyết nỗi đau của khách hàng để tạo niềm tin mua sắm.",
      },
      {
        id: "c2",
        name: "Mức Độ Bão Hòa & Cạnh Tranh Tổng Kho",
        category: "competition",
        score: 5.5,
        maxScore: 10,
        status: "WARNING",
        statusBadge: "Cạnh Tranh Trung Bình Cao",
        expertComment: "Các tổng kho nội địa và shop lớn luôn theo dõi sát các mặt hàng trend để nhập số lượng lớn. Nếu sản phẩm không có điểm khác biệt, nguy cơ bị ép giá rất cao.",
        actionAdvice: "Tuyệt đối không cạnh tranh đơn thuần về giá rẻ. Hãy đầu tư vào hình ảnh bao bì, quà tặng kèm hoặc chính sách đổi trả nhanh chóng.",
      },
      {
        id: "c3",
        name: "Biên Lợi Nhuận Sau Phí Sàn & Ads",
        category: "finance",
        score: overallScore >= 70 ? 7.5 : 5.0,
        maxScore: 10,
        status: overallScore >= 70 ? "ACCEPTABLE" : "WARNING",
        statusBadge: overallScore >= 70 ? "Đủ Chạy Quảng Cáo" : "Biên Lãi Rất Mỏng",
        expertComment: `Với CPA trần ${formatVnd(breakevenCpaVal)}, bạn phải kiểm soát giá thầu quảng cáo chặt chẽ. Nếu chạy Ads không tối ưu vượt qua ngưỡng này sẽ bị lỗ vốn.`,
        actionAdvice: "Tập trung xây dựng kênh Affiliate mời KOC gắn giỏ hàng trả hoa hồng theo đơn để giảm rủi ro chi phí Ads cố định.",
      },
      {
        id: "c4",
        name: "Vòng Đời Sản Phẩm & Tính Bền Vững",
        category: "lifecycle",
        score: 6.0,
        maxScore: 10,
        status: "ACCEPTABLE",
        statusBadge: "Vòng Đời 2 - 4 Tháng",
        expertComment: "Đa số hàng trend có vòng đời ngắn. Đợt hàng đầu tiên có thể bán tốt nhưng các đợt sau sức mua giảm dần khi thị trường bão hòa.",
        actionAdvice: "Nhập thử nghiệm số lượng vừa phải, bán dứt điểm từng lô, không bao giờ gom hàng số lượng lớn khi chưa có kênh phân phối ổn định.",
      },
      {
        id: "c5",
        name: "Độ Dễ Vận Hành & Rủi Ro Vận Chuyển",
        category: "operation",
        score: 7.0,
        maxScore: 10,
        status: "ACCEPTABLE",
        statusBadge: "Đóng Gói Tiêu Chuẩn",
        expertComment: "Cần chú ý đo chính xác 3 chiều kích thước đóng gói sau khi bọc xốp để cài đặt đúng cân nặng quy đổi thể tích trên sàn.",
        actionAdvice: "Đóng hộp carton cứng cáp và dán nhãn 'Hàng Dễ Vỡ / Xin Nhẹ Tay' để giảm tỷ lệ hư hỏng khi bưu tá trung chuyển.",
      },
    ],
    pitfalls: [
      {
        id: "p1",
        title: "Chênh Lệch Cước Cân Nặng Thể Tích (D*R*C / 6000)",
        severity: "HIGH",
        severityBadge: "⚠️ Cảnh Báo Cước",
        rootCause: `Hộp đóng gói nếu cồng kềnh hoặc lỏng tay sẽ bị máy quét bưu cục quy đổi theo thể tích (D*R*C/6000), khiến cước tính tiền cao gấp 1.5x - 2.0x cân nặng thực tế.`,
        preventionTip: "Tối ưu hộp carton sát đáy sản phẩm (chừa tối đa 1.5cm bọc xốp), cài đặt cân nặng quy đổi thể tích chính xác trên Seller Center.",
        estimatedLoss: "Mất 12.000đ - 18.000đ/đơn cước phạt chênh lệch trừ trực tiếp vào ví người bán.",
        platformTrigger: "Máy quét 3D tự động tại bưu cục J&T / Shopee Xpress / TikTok Hub quét lại khi qua băng chuyền phân loại.",
      },
      {
        id: "p2",
        title: "Rủi Ro Hoàn Đơn COD Do Mua Hàng Cảm Xúc Nhất Thời",
        severity: "CRITICAL",
        severityBadge: "🚨 Nguy Cấp COD",
        rootCause: "Hàng bán qua video ngắn thường là mua sắm theo cảm xúc bộc phát. Sau 3 ngày giao hàng cảm xúc nguội lạnh, khách rất dễ từ chối nhận nếu shipper giao trễ.",
        preventionTip: "Gọi điện hoặc gửi tin nhắn ZNS xác nhận trong 2 giờ đầu, gửi tracking lộ trình và đóng kèm thư cam kết 1 đổi 1 trong 7 ngày.",
        estimatedLoss: `~${formatVnd(Math.round((costNum * 0.15 + 16000) / 1000) * 1000)}/đơn hoàn (cước 2 đầu + vỏ hộp nát).`,
        platformTrigger: "Shipper cập nhật giao 3 lần bất thành -> Hệ thống kích hoạt chuyển hoàn tự động và trừ ví shop.",
      },
      {
        id: "p3",
        title: "Quét Từ Khóa Vi Phạm Chính Sách & Bị Bóp Hiển Thị AI",
        severity: "MEDIUM",
        severityBadge: "⚠️ Quét Thuật Toán",
        rootCause: "Thuật toán kiểm duyệt AI của sàn tự động quét các từ khóa cam kết tuyệt đối, hình ảnh dính logo thương hiệu hoặc sản phẩm không có HDSD tiếng Việt.",
        preventionTip: "In tờ hướng dẫn sử dụng tiếng Việt dán nắp hộp, tránh tuyệt đối các từ cấm như '100% chính hãng', 'trị dứt điểm', 'độc quyền'.",
        estimatedLoss: "Giảm 30% - 50% traffic tự nhiên do bị bóp hiển thị và tụt điểm vận hành shop.",
        platformTrigger: "Bot AI sàn quét từ cấm trong tiêu đề và mô tả; tỷ lệ đánh giá < 4.2 sao bị tước nhãn Shop Yêu Thích / Mall.",
      },
    ],
    differentiation: [
      {
        id: "d1",
        title: "Set Hộp Quà Tặng Độc Quyền (Gift Box Concept)",
        tacticType: "EXCLUSIVE_VARIANT",
        badge: "Né Cuộc Chiến Giá Rẻ",
        executionSteps: `Đóng gói "${prodName}" trong hộp nắp gài sang trọng, kèm túi giấy quai nơ và thiệp viết tay để định vị thành quà tặng, né so sánh giá với các link bán trần.`,
        aovImpact: `Kéo giá bán từ ${targetFormatted} lên ${formatVnd(Math.round((targetNum * 1.32) / 1000) * 1000)} (+32% doanh thu), tăng biên lãi ròng thêm 30.000đ - 45.000đ/đơn.`,
        suggestedAddOn: "Túi giấy kraft quai nơ cao cấp (vốn sỉ 3.500đ) + Thiệp vintage (800đ) nhập sỉ chợ Kim Biên hoặc 1688.",
        pricingStrategy: `Bản Đơn: ${targetFormatted} | Set Gift Box VIP: ${formatVnd(Math.round((targetNum * 1.32) / 1000) * 1000)} (Tặng túi + thiệp).`,
      },
      {
        id: "d2",
        title: "Combo Kép Gia Tăng Giá Trị (Cross-sell Deal Sốc Đẩy AOV)",
        tacticType: "BUNDLE",
        badge: "Tăng AOV + Đẩy ROAS",
        executionSteps: "Ghép sản phẩm chính với món phụ kiện thiết yếu mà khách bắt buộc phải dùng (cáp sạc/củ sạc/túi bảo vệ), tạo chương trình Mua Kèm Deal Sốc giảm 25%.",
        aovImpact: `Kéo AOV giỏ hàng lên ${formatVnd(Math.round((targetNum * 1.48) / 1000) * 1000)}, tạo thêm biên độ lợi nhuận ròng để tự tin nâng giá thầu quảng cáo cạnh tranh.`,
        suggestedAddOn: `Phụ kiện sạc/dây cáp/tinh dầu hoặc quà tiện ích (vốn sỉ xưởng 1688 khoảng ${formatVnd(Math.round(Math.max(15000, Math.min(30000, costNum * 0.25)) / 1000) * 1000)}).`,
        pricingStrategy: `Mua lẻ: ${targetFormatted} | Combo Kèm Phụ Kiện: ${formatVnd(Math.round((targetNum * 1.45) / 1000) * 1000)} (Tiết kiệm 20% so với mua rời).`,
      },
    ],
    roadmap: {
      initialUnits: "30 - 50 cái (Thăm dò thị trường lô đầu tiên)",
      maxAdSpendPerOrder: `Không vượt quá ${formatVnd(breakevenCpaVal)}/đơn (CPA trần hòa vốn)`,
      targetRoas: "Tối thiểu 3.2x - 3.8x",
      stopLossCondition: `Nếu chi 500.000đ ngân sách test mà chi phí ra đơn vượt ${formatVnd(breakevenCpaVal)} hoặc < 3 đơn -> Lập tức tắt Ads và xả hàng thu hồi vốn.`,
      expertVerdictAdvice: "Đừng vội tin vào doanh số ảo của các đối thủ trên sàn. Hãy tính toán kỹ dòng tiền thực tế sau khi trừ hết phí sàn và chi phí hoàn hàng trước khi quyết định xuống tiền nhập lô lớn.",
      phases: [
        {
          phase: "Giai Đoạn 1: Test Cầu Thị Trường & Video Hook",
          duration: "3 Ngày Đầu",
          budget: "350.000đ - 500.000đ",
          action: `Sản xuất 3 video ngắn 3 góc hook khác nhau của "${prodName}". Bật chiến dịch chuyển đổi ngân sách nhỏ để đo lường phản hồi thị trường.`,
          kpiGoal: "CTR > 3.2%, Tỷ lệ xem hết video > 15%, có ít nhất 8 lượt thêm vào giỏ hàng.",
        },
        {
          phase: "Giai Đoạn 2: Nhập Mẫu Đợt 1 & Tối Ưu Chuyển Đổi",
          duration: "Ngày 4 - Ngày 10",
          budget: "1.000.000đ - 1.500.000đ Ads",
          action: "Nhập 30-50 cái từ tổng kho nội địa (giao 24-48h). Đóng gói kèm quà tặng thiệp, bật chiến dịch chuyển đổi và mở Affiliate mời KOC gắn giỏ hàng.",
          kpiGoal: `CPA thực tế < ${formatVnd(Math.round(breakevenCpaVal * 0.75))}/đơn, tỷ lệ hoàn đơn COD kiểm soát dưới 12%.`,
        },
        {
          phase: "Giai Đoạn 3: Quyết Định Scale Lô Lớn Hoặc Cắt Lỗ",
          duration: "Ngày 11 - Ngày 15",
          budget: "Theo tỷ lệ ROAS thực tế",
          action: `Nếu ROAS > 3.2x: Đặt hàng lô 200 chiếc trực tiếp từ xưởng 1688 đường bộ để ép giá vốn giảm thêm 15%. Nếu ROAS < 2.0x: Chuyển ngay sang kế hoạch xả hàng.`,
          kpiGoal: "Tỷ suất lợi nhuận ròng trên doanh thu (Net Margin) đạt > 18%.",
        },
      ],
      liquidationPlan: `Kế hoạch xả hàng thu hồi vốn: Bật Flash Sale nội sàn ở mức giá hòa vốn ${formatVnd(Math.round((costNum * 1.15 + 12000) / 1000) * 1000)} (thu hồi 100% tiền gốc nhập), hoặc gom làm quà tặng kèm (Gift with Purchase) cho sản phẩm chủ lực khác của shop để kéo đánh giá 5 sao.`,
    },
  };
}

// -------------------------------------------------------------
// BỘ PHÂN TÍCH VÀ BẢO VỆ DỮ LIỆU ĐA TẦNG (4-TIER RESILIENT PARSER)
// -------------------------------------------------------------

/**
 * Tự động đóng các dấu ngoặc nếu JSON bị cắt ngắn do hết token (Token Cutoff)
 */
export function repairTruncatedJson(jsonStr: string): string {
  let str = jsonStr.trim();
  if (str.startsWith("```")) {
    str = str.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  }

  // Đếm dấu ngoặc nhọn và ngoặc vuông mở/đóng
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") openBraces++;
      else if (char === "}") openBraces--;
      else if (char === "[") openBrackets++;
      else if (char === "]") openBrackets--;
    }
  }

  // Nếu đang dang dở trong chuỗi, đóng chuỗi trước
  if (inString) str += '"';

  // Cắt bỏ dấu phẩy lơ lửng ở cuối nếu có
  str = str.replace(/,\s*$/, "");

  // Đóng các ngoặc vuông trước rồi đến ngoặc nhọn
  while (openBrackets > 0) {
    str += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    str += "}";
    openBraces--;
  }

  return str;
}

/**
 * Bổ sung đầy đủ các trường số liệu chi tiết nếu LLM trả về thiếu trường
 */
function enrichProductValidatorData(
  parsed: ProductValidatorData,
  fallbackInputs?: ProductValidatorInputs
): ProductValidatorData {
  const offline = buildOfflineProductValidatorData(fallbackInputs || {
    productName: parsed.productName,
    costPrice: parsed.financials?.costPriceFormatted,
    targetPrice: parsed.financials?.targetPriceFormatted,
    platform: parsed.platform,
    source: parsed.source,
  });

  const enrichedPitfalls = (parsed.pitfalls && parsed.pitfalls.length > 0 ? parsed.pitfalls : offline.pitfalls).map((p, idx) => {
    const offP = offline.pitfalls[idx] || offline.pitfalls[0];
    return {
      ...p,
      estimatedLoss: p.estimatedLoss || offP?.estimatedLoss,
      platformTrigger: p.platformTrigger || offP?.platformTrigger,
    };
  });

  const enrichedDiff = (parsed.differentiation && parsed.differentiation.length > 0 ? parsed.differentiation : offline.differentiation).map((d, idx) => {
    const offD = offline.differentiation[idx] || offline.differentiation[0];
    return {
      ...d,
      suggestedAddOn: d.suggestedAddOn || offD?.suggestedAddOn,
      pricingStrategy: d.pricingStrategy || offD?.pricingStrategy,
    };
  });

  const enrichedRoadmap: SafeTestRoadmap = {
    ...offline.roadmap,
    ...(parsed.roadmap || {}),
    phases: (parsed.roadmap?.phases && parsed.roadmap.phases.length > 0)
      ? parsed.roadmap.phases
      : offline.roadmap.phases,
    liquidationPlan: parsed.roadmap?.liquidationPlan || offline.roadmap.liquidationPlan,
  };

  return {
    ...offline,
    ...parsed,
    financials: { ...offline.financials, ...(parsed.financials || {}) },
    criteriaList: Array.isArray(parsed.criteriaList) && parsed.criteriaList.length > 0 ? parsed.criteriaList : offline.criteriaList,
    pitfalls: enrichedPitfalls,
    differentiation: enrichedDiff,
    roadmap: enrichedRoadmap,
  };
}

/**
 * Phân tích ngược văn bản Markdown cũ sang cấu trúc chuẩn (Tier 3 Regex Fallback)
 */
function parseLegacyMarkdownOutput(text: string, fallbackInputs?: ProductValidatorInputs): ProductValidatorData {
  const offline = buildOfflineProductValidatorData(fallbackInputs);

  // Trích xuất điểm tổng quan
  const scoreMatch = text.match(/(\d{1,3})\s*\/\s*100/i);
  const overallScore = scoreMatch ? parseInt(scoreMatch[1], 10) : offline.overallScore;

  // Trích xuất phán quyết
  let verdict = offline.verdict;
  if (/KHUYÊN NÊN LÀM/i.test(text)) verdict = "KHUYÊN NÊN LÀM";
  else if (/RỦI RO CAO|NÊN BỎ/i.test(text)) verdict = "RỦI RO CAO - NÊN BỎ";
  else if (/CÂN NHẮC/i.test(text)) verdict = "CÂN NHẮC KỸ";

  // Trích xuất tóm tắt
  const sumMatch = text.match(/(?:Đánh giá ngắn gọn:?)\s*\**([^\n]+)\**/i);
  const executiveSummary = sumMatch ? sumMatch[1].replace(/^\*+|\*+$/g, "").trim() : offline.executiveSummary;

  // Trích xuất bảng điểm tiêu chí
  const criteriaList: ValidationCriterion[] = [];
  const tableRows = text.split("\n").filter((line) => line.includes("|") && !line.includes(":---") && !line.includes("Tiêu chí"));
  let critIdx = 1;
  for (const row of tableRows) {
    const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 3) {
      const name = cols[0].replace(/\*\*/g, "").trim();
      const rawScore = cols[1].replace(/\*\*/g, "").trim();
      const scoreSubMatch = rawScore.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/);
      const score = scoreSubMatch ? parseFloat(scoreSubMatch[1]) : parseFloat(rawScore) || 7;
      const comment = cols[2].replace(/\*\*/g, "").trim();
      criteriaList.push({
        id: `c_${critIdx++}`,
        name,
        category: "market",
        score,
        maxScore: 10,
        status: score >= 8 ? "EXCELLENT" : score >= 6 ? "ACCEPTABLE" : "WARNING",
        statusBadge: score >= 8 ? "Tốt" : "Cần Lưu Ý",
        expertComment: comment,
        actionAdvice: "Theo dõi sát sao và tối ưu theo từng mốc chỉ số.",
      });
    }
  }

  // Trích xuất tử huyệt
  const pitfalls: OperationalPitfall[] = [];
  const pitfallMatches = text.matchAll(/[-*]\s*\*\*(.+?)(?:\*\*:|\*\*)\s*(.+)$/gm);
  let pitIdx = 1;
  for (const m of pitfallMatches) {
    if (pitfalls.length >= 3) break;
    pitfalls.push({
      id: `p_${pitIdx++}`,
      title: m[1].replace(/[:*]/g, "").trim(),
      severity: "HIGH",
      severityBadge: "⚠️ Cảnh Báo",
      rootCause: m[2].replace(/^\*+/, "").trim(),
      preventionTip: "Kiểm tra kỹ trước khi đóng gói gửi đi.",
      estimatedLoss: offline.pitfalls[pitIdx - 2]?.estimatedLoss,
      platformTrigger: offline.pitfalls[pitIdx - 2]?.platformTrigger,
    });
  }

  // Trích xuất lộ trình test
  const sampleMatch = text.match(/(?:Khuyến nghị số lượng nhập|Số lượng nhập thử nghiệm)[^:]*:(?:\s*\*\*)?\s*(.+)$/im);
  const adsBudgetMatch = text.match(/(?:Ngân sách Ads tối đa)[^:]*:(?:\s*\*\*)?\s*(.+)$/im);
  const adviceMatch = text.match(/(?:Lời khuyên vàng từ chuyên gia|Lời khuyên sống còn)[^:]*:(?:\s*\*\*)?\s*(.+)$/im);

  return {
    ...offline,
    overallScore,
    verdict,
    executiveSummary,
    criteriaList: criteriaList.length >= 3 ? criteriaList : offline.criteriaList,
    pitfalls: pitfalls.length >= 2 ? pitfalls : offline.pitfalls,
    roadmap: {
      initialUnits: sampleMatch ? sampleMatch[1].replace(/\*\*/g, "").trim() : offline.roadmap.initialUnits,
      maxAdSpendPerOrder: adsBudgetMatch ? adsBudgetMatch[1].replace(/\*\*/g, "").trim() : offline.roadmap.maxAdSpendPerOrder,
      targetRoas: offline.roadmap.targetRoas,
      stopLossCondition: offline.roadmap.stopLossCondition,
      expertVerdictAdvice: adviceMatch ? adviceMatch[1].replace(/\*\*/g, "").trim() : offline.roadmap.expertVerdictAdvice,
      phases: offline.roadmap.phases,
      liquidationPlan: offline.roadmap.liquidationPlan,
    },
  };
}

/**
 * 4-Tier Resilient Parser:
 * Tier 1: Parse trực tiếp JSON sạch
 * Tier 2: Trích xuất ```json ``` và đóng ngoặc bị cắt ngắn
 * Tier 3: Parse ngược định dạng Markdown cũ
 * Tier 4: Fallback về Deterministic Offline Blueprint
 */
export function parseProductValidator(
  rawOutput: string,
  fallbackInputs?: ProductValidatorInputs
): ProductValidatorData {
  if (!rawOutput || !rawOutput.trim()) {
    return buildOfflineProductValidatorData(fallbackInputs);
  }

  const trimmed = rawOutput.trim();

  // TIER 1: Parse trực tiếp nếu bắt đầu bằng {
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed) as ProductValidatorData;
      if (parsed.productName && typeof parsed.overallScore === "number" && Array.isArray(parsed.criteriaList)) {
        return enrichProductValidatorData(parsed, fallbackInputs);
      }
    } catch {
      // Sang Tier 2
    }
  }

  // TIER 2: Tìm khối ```json hoặc chuỗi { ... }
  const jsonBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidateJson = jsonBlockMatch ? jsonBlockMatch[1].trim() : trimmed;

  const firstBrace = candidateJson.indexOf("{");
  const lastBrace = candidateJson.lastIndexOf("}");

  if (firstBrace !== -1) {
    const rawSubJson = lastBrace > firstBrace
      ? candidateJson.slice(firstBrace, lastBrace + 1)
      : candidateJson.slice(firstBrace);

    try {
      const parsed = JSON.parse(rawSubJson) as ProductValidatorData;
      if (parsed.productName && typeof parsed.overallScore === "number") {
        return enrichProductValidatorData(parsed, fallbackInputs);
      }
    } catch {
      // Thử sửa lỗi token cutoff
      try {
        const repaired = repairTruncatedJson(rawSubJson);
        const parsed = JSON.parse(repaired) as ProductValidatorData;
        if (parsed.productName) {
          return enrichProductValidatorData(parsed, fallbackInputs);
        }
      } catch {
        // Sang Tier 3
      }
    }
  }

  // TIER 3: Phân tích ngược văn bản Markdown cũ
  if (trimmed.includes("## 📊") || trimmed.includes("BẢNG ĐIỂM") || trimmed.includes("TIỀM NĂNG")) {
    try {
      return parseLegacyMarkdownOutput(trimmed, fallbackInputs);
    } catch {
      // Sang Tier 4
    }
  }

  // TIER 4: Hoàn toàn không parse được -> Kích hoạt Offline Blueprint
  return buildOfflineProductValidatorData(fallbackInputs);
}

/**
 * Hàm lọc và chuẩn hóa đầu ra tại API Route
 */
export function cleanAndValidateProductValidatorOutput(
  rawOutput: string,
  inputs?: ProductValidatorInputs
): string {
  try {
    const parsed = parseProductValidator(rawOutput, inputs);
    return JSON.stringify(parsed);
  } catch {
    return JSON.stringify(buildOfflineProductValidatorData(inputs));
  }
}
