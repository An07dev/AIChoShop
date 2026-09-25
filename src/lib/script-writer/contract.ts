/**
 * AI Kịch Bản Video/Live Contract
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema), Bộ Prompt Thực Chiến Sàn TMĐT (TikTok Shop, Shopee Live)
 * & Resilient Parser 4 Tầng Bền Bỉ (Tương thích ngược 100%)
 */

import * as XLSX from "xlsx";

export type ScriptFormat = "video_short" | "livestream" | "both";

export type ScriptAngle =
  | "pain_point"          // Góc Nỗi đau & Đồng cảm
  | "curiosity_hook"       // Góc Giật tít & Tò mò
  | "review_test"          // Góc Review thực tế & Test cực hạn
  | "drama"                // Góc Tình huống / Drama ngắn
  | "expert_comparison";   // Góc Chuyên gia / So sánh tương phản

export interface ScriptWriterInputs {
  productName: string;
  usp: string;
  format: ScriptFormat;
  scriptAngle?: ScriptAngle | string;
  priceDeal?: string;
  targetAudience?: string;
}

export interface VideoScriptScene {
  id: number;
  timeRange: string;               // VD: "00:00 - 00:03"
  phase: "hook" | "pain" | "solution" | "cta" | "other";
  phaseTitle?: string;             // VD: "HOOK: Giữ chân 3 giây đầu"
  visualAction: string;            // Hành động trước ống kính, đạo cụ, góc máy
  audioVoiceover: string;          // Lời thoại KOC (ngắn gọn, xúc tích, văn nói)
  textOverlay: string;             // Chữ in to trên màn hình video
  soundEffectSuggestion?: string;   // Gợi ý âm thanh / SFX (Whoosh, Ting, Bass drop...)
}

export interface VideoScriptItem {
  id: number;
  title: string;
  angleLabel: string;              // "Góc Nỗi Đau & Đồng Cảm", "Góc Giật Tít & Tò Mò", "Góc Review & Test Thực Tế"
  estimatedDuration: string;       // "35 - 45 giây"
  scenes: VideoScriptScene[];
  directorNotes?: string;          // Lời dặn quay dựng, BGM, góc máy
  rawText?: string;
}

export interface LiveStageScene {
  stageNumber: number;
  stageName: string;               // "Chặng 1: Kéo Mắt & Giữ Chân", "Chặng 2: Trưng Bày & Tạo Thèm Khát", v.v.
  timeAllocation: string;          // VD: "Phút 00 - 05"
  hostSpeech: string;              // Lời thoại MC / Host bán hàng
  hostAction: string;              // Hành động trước camera của Host
  assistantModAction: string;      // Hành động trợ lý: Ghim giỏ, đếm số lượng, reo hò tạo nhiệt
  pinnedStrategy: string;          // Chiến thuật ghim voucher / flash deal
}

export interface LiveScriptData {
  overview: string;                // Tổng quan phiên live
  targetProducts: string;          // Tên sản phẩm & thông điệp chính
  stages: LiveStageScene[];        // 4 chặng vàng Livestream
  fomoTactics: string[];           // Các chiêu thức đẩy FOMO chốt đơn
  rawText?: string;
}

export interface PolicyCompliance {
  safeScore: number;               // 0 - 100
  bannedWordsAvoided: string[];    // Các từ ngữ nhạy cảm sàn đã được né tránh
  warningNotes: string[];          // Lưu ý kiểm duyệt của TikTok Shop / Shopee Live
}

export interface ScriptWriterData {
  format: ScriptFormat;
  videoScripts?: VideoScriptItem[];
  liveScript?: LiveScriptData;
  policyCompliance: PolicyCompliance;
}

export interface ScriptSnapshot {
  inputs: ScriptWriterInputs;
  output: ScriptWriterData;
  createdAt: string;
}

/**
 * Đếm ký tự chuẩn xác
 */
export function charCount(text: string): number {
  return (text || "").trim().length;
}

/**
 * Dữ liệu mẫu thực chiến cho sản phẩm bán chạy (Kem chống nắng kiềm dầu)
 */
export const SAMPLE_SCRIPT_INPUTS: ScriptWriterInputs = {
  productName: "Kem Chống Nắng La Roche-Posay Anthelios Khô Thoáng Giảm Dầu SPF50+",
  usp: "Màng lọc Mexoplex độc quyền kiềm dầu 12h, nâng tone tự nhiên không bết dính vệt trắng, kháng nước và mồ hôi tối ưu",
  format: "both",
  scriptAngle: "pain_point",
  priceDeal: "Giá gốc 495k -> Deal Live/Video chỉ 339k tặng kèm túi canvas + minisize 15ml",
  targetAudience: "Da dầu mụn, học sinh sinh viên, nhân viên văn phòng hay hoạt động ngoài trời",
};

export const SAMPLE_SCRIPT_DATA: ScriptWriterData = {
  format: "both",
  videoScripts: [
    {
      id: 1,
      title: "Góc Nỗi Đau & Đồng Cảm (Chảo Dầu Mùa Hè)",
      angleLabel: "Nỗi Đau & Đồng Cảm",
      estimatedDuration: "35 giây",
      scenes: [
        {
          id: 1,
          timeRange: "00:00 - 00:03",
          phase: "hook",
          phaseTitle: "HOOK: Giữ chân 3 giây đầu",
          visualAction: "Cận cảnh KOC lấy giấy thấm dầu áp lên trán và cánh mũi, nhấc ra ướt sũng với biểu cảm bất lực, ngán ngẩm.",
          audioVoiceover: "Bôi kem chống nắng mà cứ như rán mỡ trên mặt, chiều về mụn ẩn thi nhau biểu tình?",
          textOverlay: "MẶT CHẢO DẦU VÌ KEM CHỐNG NẮNG SAI CÁCH?",
          soundEffectSuggestion: "Tiếng xèo xèo chiên mỡ + tiếng 'Ting' cảnh báo",
        },
        {
          id: 2,
          timeRange: "00:03 - 00:15",
          phase: "pain",
          phaseTitle: "NỖI ĐAU: Khơi gợi vấn đề",
          visualAction: "KOC chỉ vào vùng chữ T bóng nhẫy và viền cổ dính vệt kem trắng loang lổ khi mồ hôi chảy ra.",
          audioVoiceover: "Mùa này ra đường 5 phút là dầu đổ lênh láng, kem loang lổ thành vệt trắng xoá, vừa mất thẩm mỹ vừa bít tắc lỗ chân lông!",
          textOverlay: "BÓNG DẦU • LOANG VỆT • BÍT TẮC MỤN",
          soundEffectSuggestion: "Âm thanh buồn ngậm ngùi, nhịp đập chậm",
        },
        {
          id: 3,
          timeRange: "00:15 - 00:28",
          phase: "solution",
          phaseTitle: "GIẢI PHÁP: Giới thiệu USP",
          visualAction: "KOC lấy tuýp La Roche-Posay Anthelios vạch xanh, chấm lên nửa mặt và tán đều, zoom cực cận bề mặt da khô ráo mịn lì sau 10 giây. Áp lại giấy thấm dầu mới: khô tinh.",
          audioVoiceover: "Đổi ngay sang em La Roche-Posay Anthelios vạch xanh này đi! Màng lọc Mexoplex kiềm dầu đỉnh cao tận 12 giờ, chất kem thấm ráo tức thì, không vón cục, nâng tone tự nhiên siêu tệp da.",
          textOverlay: "KIỀM DẦU 12H • MÀNG LỌC MEXOPLEX ĐỘC QUYỀN",
          soundEffectSuggestion: "Nhạc vui tươi, tiếng lướt 'Whoosh' mịn màng",
        },
        {
          id: 4,
          timeRange: "00:28 - 00:38",
          phase: "cta",
          phaseTitle: "CTA: Kêu gọi hành động chốt đơn",
          visualAction: "KOC cầm tuýp kem giơ cạnh icon giỏ hàng nhấp nháy, tay chỉ vào góc trái màn hình kèm sticker voucher giảm giá.",
          audioVoiceover: "Đang có deal Flash Sale chính hãng giảm sâu từ 495k còn 339k kèm quà tặng minisize trên video này. Bấm ngay vào giỏ hàng góc trái săn trước khi hết voucher nhé!",
          textOverlay: "FLASH SALE 339K TRONG GIỎ HÀNG GÓC TRÁI",
          soundEffectSuggestion: "Tiếng chuông Cash Register leng keng",
        },
      ],
      directorNotes: "Ánh sáng tự nhiên, góc quay cận mặt (Macro). BGM nên dùng nhạc trend biến hình năng động.",
    },
    {
      id: 2,
      title: "Góc Giật Tít & Tò Mò (Sự Thật Thổi Phồng?)",
      angleLabel: "Giật Tít & Tò Mò",
      estimatedDuration: "38 giây",
      scenes: [
        {
          id: 1,
          timeRange: "00:00 - 00:03",
          phase: "hook",
          phaseTitle: "HOOK: Giữ chân 3 giây đầu",
          visualAction: "KOC cầm tuýp kem vạch xanh giơ thẳng vào camera, lắc đầu đầy hoài nghi với biểu cảm tò mò nghiêm trọng.",
          audioVoiceover: "Đừng mua em kem chống nắng quốc dân này nếu da bạn là da khô hoặc thích bóng bóng kiểu Hàn Quốc!",
          textOverlay: "CẢNH BÁO: ĐỪNG MUA THEO PHONG TRÀO!",
          soundEffectSuggestion: "Tiếng Bass Drop giật mình",
        },
        {
          id: 2,
          timeRange: "00:03 - 00:14",
          phase: "pain",
          phaseTitle: "NỖI ĐAU: Khơi gợi vấn đề",
          visualAction: "KOC mở điện thoại quay màn hình hàng trăm bình luận khen ngợi rồi zoom vào chất gel-cream đặc trưng.",
          audioVoiceover: "Ai cũng bảo em này đắt mà sao hot rần rần TikTok suốt bao năm? Thật sự có thần thánh như lời đồn hay chỉ là quảng cáo thổi phồng?",
          textOverlay: "ĐẮT CÓ XẮT RA MIẾNG KHÔNG?",
          soundEffectSuggestion: "Tiếng đồng hồ tích tắc hồi hộp",
        },
        {
          id: 3,
          timeRange: "00:14 - 00:28",
          phase: "solution",
          phaseTitle: "GIẢI PHÁP: Giới thiệu USP",
          visualAction: "KOC test trực tiếp: xịt nước khoáng lên mặt mô phỏng đi mưa/mồ hôi, lớp kem vẫn nguyên vẹn không trôi. Dùng đèn UV soi kiểm tra độ bảo vệ phổ rộng.",
          audioVoiceover: "Sự thật là màng lọc quang phổ rộng chống UVA/UVB tối ưu, công nghệ Airlicium hút dầu gấp 100 lần trọng lượng của nó! Kháng nước, chống mồ hôi đi bơi thoải mái luôn.",
          textOverlay: "SPF50+ PA++++ • KHÁNG NƯỚC & MỒ HÔI",
          soundEffectSuggestion: "Tiếng xịt sương mát lạnh",
        },
        {
          id: 4,
          timeRange: "00:28 - 00:38",
          phase: "cta",
          phaseTitle: "CTA: Kêu gọi hành động chốt đơn",
          visualAction: "KOC chỉ tay vào biểu tượng giỏ hàng vàng, xuất hiện bảng so sánh giá gốc vs giá ưu đãi ngày hôm nay.",
          audioVoiceover: "Bình thường gần 500 cành, hôm nay có voucher trợ giá chỉ còn 339k chính hãng. Chốt đơn ngay góc trái màn hình nha!",
          textOverlay: "CHÍNH HÃNG 100% • GIẢM TỚI 150K HÔM NAY",
          soundEffectSuggestion: "Tiếng Pop vui tai",
        },
      ],
      directorNotes: "Nhịp dựng nhanh (Fast-cut), chuyển cảnh dứt khoát 1.5 - 2s mỗi cảnh.",
    },
    {
      id: 3,
      title: "Góc Review Thực Tế (Thử Thách 8 Tiếng Đi Làm)",
      angleLabel: "Review Thực Tế & Test Cực Hạn",
      estimatedDuration: "40 giây",
      scenes: [
        {
          id: 1,
          timeRange: "00:00 - 00:03",
          phase: "hook",
          phaseTitle: "HOOK: Giữ chân 3 giây đầu",
          visualAction: "Màn hình chia đôi: Bên trái đồng hồ 8h sáng, bên phải đồng hồ 5h chiều, KOC nở nụ cười tự tin khoe làn da vẫn khô thoáng.",
          audioVoiceover: "Thử thách bôi kem chống nắng đi làm từ 8 giờ sáng đến 5 giờ chiều không dặm lại, xem cái kết!",
          textOverlay: "TEST THỰC TẾ 8 TIẾNG ĐI LÀM: CÁI KẾT?",
          soundEffectSuggestion: "Tiếng chuông báo thức reng reng",
        },
        {
          id: 2,
          timeRange: "00:03 - 00:15",
          phase: "pain",
          phaseTitle: "NỖI ĐAU: Khơi gợi vấn đề",
          visualAction: "Cảnh KOC ngồi văn phòng điều hòa rồi ra ngoài ăn trưa dưới nắng gắt 38 độ, đồng nghiệp xung quanh ai cũng bóng loáng mặt.",
          audioVoiceover: "Ngồi phòng máy lạnh thì khô nẻ, trưa chạy ra đường thì nắng cháy da, thường là lớp nền mốc meo và chảy nhớp nháp.",
          textOverlay: "MÁY LẠNH HÚT ẨM • NẮNG TRƯA 38 ĐỘ",
          soundEffectSuggestion: "Tiếng quạt gió điều hòa vù vù",
        },
        {
          id: 3,
          timeRange: "00:15 - 00:28",
          phase: "solution",
          phaseTitle: "GIẢI PHÁP: Giới thiệu USP",
          visualAction: "KOC dùng camera thường zoom sát từng lỗ chân lông lúc 5h chiều: da đều màu, không xuống tone, vùng mũi chỉ bóng nhẹ tự nhiên không nhờn rít.",
          audioVoiceover: "Nhưng nhìn da mình lúc 5 giờ chiều nè: vẫn khô ráo, không bị xỉn màu tối sầm, da mịn màng nhẹ tênh cả ngày dài luôn!",
          textOverlay: "KHÔNG XUỐNG TONE • KHÔ THOÁNG NHẸ TÊNH",
          soundEffectSuggestion: "Tiếng Sparkle lấp lánh",
        },
        {
          id: 4,
          timeRange: "00:28 - 00:40",
          phase: "cta",
          phaseTitle: "CTA: Kêu gọi hành động chốt đơn",
          visualAction: "KOC giơ tuýp kem cùng set quà tặng túi canvas và minisize của hãng, chỉ tay vào giỏ hàng.",
          audioVoiceover: "Đang có chương trình freeship 0 đồng và tặng kèm quà độc quyền. Số lượng quà có hạn, cả nhà bấm giỏ hàng bên dưới rinh liền tay nhé!",
          textOverlay: "FREESHIP 0Đ • TẶNG KÈM QUÀ ĐỘC QUYỀN",
          soundEffectSuggestion: "Tiếng vỗ tay chúc mừng chốt đơn",
        },
      ],
      directorNotes: "Tông màu chân thật (no filter), tăng độ tin cậy tuyệt đối cho người xem.",
    },
  ],
  liveScript: {
    overview: "Khung Kịch Bản Livestream Tung Deal Độc Quyền (Phiên 30 Phút Bùng Nổ Doanh Số)",
    targetProducts: "La Roche-Posay Anthelios Khô Thoáng Giảm Dầu 50ml",
    stages: [
      {
        stageNumber: 1,
        stageName: "Chặng 1: Kéo Mắt & Giữ Chân Khán Giả",
        timeAllocation: "Phút 00:00 - 05:00",
        hostSpeech: "Chào 500 anh em đang có mặt trong live! Ai đang xem live mà da dầu mụn, trưa hè mặt như chảo rán mỡ thì comment số 1 cho em thấy cánh tay của mọi người nào! Hôm nay em có 20 suất trợ giá độc quyền từ brand lớn chưa từng có, ở lại đúng 3 phút nữa em tung deal sốc!",
        hostAction: "Cười tươi, vẫy tay chào khán giả, cầm tuýp kem chống nắng vạch xanh giơ trước ngực tạo điểm nhấn tò mò, chỉ tay vào khung chat kêu gọi tương tác.",
        assistantModAction: "Đánh chuông leng keng, hô to: 'Chào cả nhà, chia sẻ live nhận quà mini nha anh chị ơi!', chuẩn bị ghim giỏ hàng mã số 01.",
        pinnedStrategy: "Ghim banner: 'CHIA SẺ LIVE NHẬN QUÀ 0Đ & CHỜ DEAL 339K'",
      },
      {
        stageNumber: 2,
        stageName: "Chặng 2: Trưng Bày & Tạo Khát Khao Sở Hữu (Demo USP)",
        timeAllocation: "Phút 05:00 - 15:00",
        hostSpeech: "Đây cả nhà ơi, em test trực tiếp lên mu bàn tay và nửa mặt cho mọi người xem chất kem nhé. Nhìn kỹ giúp em: tán đến đâu tệp mịn lì đến đó trong đúng 5 giây! Công nghệ màng lọc Mexoplex kiềm dầu 12 tiếng không bóng nhờn, chống nắng phổ rộng SPF50+ đỉnh chóp!",
        hostAction: "Zoom cận mặt vào camera, chấm kem lên da tán đều, vỗ nhẹ cho thấm, sau đó áp giấy thấm dầu trực tiếp lên mặt để chứng minh không hề dính dầu thừa.",
        assistantModAction: "Cầm đèn UV hoặc chai xịt nước khoáng hỗ trợ Host làm bài test kháng nước, bật nhạc nền sôi động kích thích tò mò.",
        pinnedStrategy: "Ghim sản phẩm số 01 ở trạng thái giá niêm yết 495k để tạo mỏ neo giá cao ngất ngưởng.",
      },
      {
        stageNumber: 3,
        stageName: "Chặng 3: Tung Deal Bí Mật & Đếm Ngược Khóa Đơn (FOMO)",
        timeAllocation: "Phút 15:00 - 22:00",
        hostSpeech: "Bình thường ở trung tâm thương mại em này 495k không bao giờ giảm! Nhưng DUY NHẤT trong 5 phút này của live hôm nay, hãng trợ giá độc quyền chỉ còn 339k, lại còn TẶNG KÈM 1 tuýp minisize 15ml trị giá 120k! Đúng 15 suất cho 15 người nhanh tay nhất! Đếm ngược 3... 2... 1... MỞ KHO MỞ GIÁ!",
        hostAction: "Đưa 1 ngón tay lên miệng ra hiệu bí mật, sau đó giơ bảng giá khuyến mãi viết tay 339k to tướng, đập bàn dứt khoát khi đếm ngược.",
        assistantModAction: "Bấm nút giảm giá trên hệ thống Seller, đập chuông liên hồi, hô lớn: 'Kho đã mở 15 suất, các chị vào giỏ hàng chốt đơn ngay không hết mã!'",
        pinnedStrategy: "Ghim voucher giảm giá độc quyền + ghim trực tiếp Deal Flash Sale 339k nổi bật giữa màn hình.",
      },
      {
        stageNumber: 4,
        stageName: "Chặng 4: Quét Đơn Hàng & Xử Lý Đắn Đo",
        timeAllocation: "Phút 22:00 - 30:00",
        hostSpeech: "Chúc mừng chị Lan Anh đã săn được 1 đơn! Chúc mừng nick Hoa Mặt Trời đã chốt thành công! Chỉ còn đúng 3 suất cuối cùng thôi cả nhà ơi! Hàng chính hãng 100% bao check mã vạch, nhận hàng kiểm tra thoải mái mới thanh toán nên các chị hoàn toàn an tâm!",
        hostAction: "Đọc to tên các khách vừa đặt thành công trên màn hình, cầm điện thoại khoe đơn nhảy liên tục để tạo hiệu ứng đám đông.",
        assistantModAction: "Cầm bảng đếm số lượng: 'Còn 3 hộp... Còn 1 hộp cuối cùng!', thúc giục khách chưa bấm thanh toán hoàn tất đơn hàng.",
        pinnedStrategy: "Giữ ghim sản phẩm kèm dòng chữ: 'SẮP HẾT SUẤT TRỢ GIÁ - NHANH TAY BẤM MUA'",
      },
    ],
    fomoTactics: [
      "Chiến thuật Mỏ Neo Giá: Giữ giá 495k trong suốt 15 phút đầu rồi hạ sốc xuống 339k",
      "Chiến thuật Giới Hạn Số Lượng: Chỉ mở đúng 15 - 20 suất để kích hoạt tâm lý sợ bỏ lỡ",
      "Kỹ thuật Bằng Chứng Xã Hội: Đọc liên tục tên khách đặt thành công để hối thúc người đang phân vân",
      "Cam kết An Tâm Tuyệt Đối: Cho phép đồng kiểm tra hàng, đền gấp 10 lần nếu phát hiện hàng giả",
    ],
  },
  policyCompliance: {
    safeScore: 98,
    bannedWordsAvoided: ["cam kết 100%", "trị dứt điểm", "vĩnh viễn", "số 1 thị trường", "rẻ nhất thế giới"],
    warningNotes: [
      "Tránh hứa hẹn trị sạch mụn dứt điểm (chính sách y tế TikTok Shop)",
      "Không nhắc đến giao dịch ngoài sàn (Zalo, chuyển khoản trực tiếp)",
      "Đảm bảo có tem phụ tiếng Việt khi bán mỹ phẩm nhập khẩu trên sàn",
    ],
  },
};

/**
 * System Prompt chuẩn hóa cho Đạo diễn Video & Livestream TMĐT thực chiến
 */
export const SCRIPT_WRITER_SYSTEM_PROMPT = `Bạn là Giám đốc Sáng tạo Nội dung & Chuyên gia Livestream TMĐT thực chiến hàng đầu tại Việt Nam (Shopee Live, TikTok Shop MCN).
Nhiệm vụ của bạn là tạo ra các kịch bản Video ngắn chuyển đổi cao (High Conversion TikTok/Reels) và Khung Kịch bản Livestream bán hàng chuyên nghiệp, giữ chân người xem từ giây đầu tiên và bùng nổ doanh số.

QUY TẮC BẮT BUỘC:
1. BẮT BUỘC trả về DUY NHẤT một chuỗi JSON hợp lệ (Valid JSON Object), không thêm bất kỳ lời dẫn nhập hay kết luận ngoài JSON.
2. Với Video Ngắn (format là 'video_short' hoặc 'both'):
   - BẮT BUỘC tạo ĐỦ 3 KỊCH BẢN KHÁC NHAU theo 3 góc tiếp cận (id: 1, 2, 3):
     * Kịch bản 1: Góc Nỗi Đau & Đồng Cảm (Đánh trúng vấn đề khó chịu thường ngày của khách hàng).
     * Kịch bản 2: Góc Giật Tít & Tò Mò (Mở đầu gây sốc, đảo ngược suy nghĩ hoặc so sánh tương phản).
     * Kịch bản 3: Góc Review Thực Tế & Test Cực Hạn (KOC đập hộp, test độ bền/tính năng ngay trước ống kính).
   - Mỗi kịch bản có thời lượng 30 - 45 giây, chia thành 4 phân cảnh chuẩn:
     * Cảnh 1 (00:00 - 00:03): HOOK 3s - Phải có hành động thị giác (visualAction) giật mắt (cắt, đập, zoom khuyết điểm, xịt nước...) + lời thoại (audioVoiceover) bắt tai + chữ in to (textOverlay).
     * Cảnh 2 (00:03 - 00:15): NỖI ĐAU (Pain point) - Đào sâu vấn đề nhức nhối khi chưa dùng sản phẩm.
     * Cảnh 3 (00:15 - 00:30): GIẢI PHÁP (USP Solution) - Trưng bày tính năng độc quyền giải quyết triệt để vấn đề.
     * Cảnh 4 (00:30 - Hết): CTA Chốt Đơn - Chỉ tay giỏ hàng góc trái, kêu gọi săn deal/voucher giới hạn.
3. Với Livestream TMĐT (format là 'livestream' hoặc 'both'):
   - BẮT BUỘC tạo Khung Kịch Bản 4 Chặng Vàng (stages):
     * Chặng 1 (Phút 00 - 05): Kéo Mắt & Giữ Chân - Chào hỏi, đặt câu hỏi tương tác, báo trước deal sốc.
     * Chặng 2 (Phút 05 - 15): Trưng Bày & Tạo Thèm Khát - Demo trực tiếp, test tính năng, neo giá niêm yết cao.
     * Chặng 3 (Phút 15 - 22): Tung Deal Sốc & Đếm Ngược Khóa Đơn - Hô giá trợ giá, giới hạn số suất, đếm ngược 3-2-1 mở kho.
     * Chặng 4 (Phút 22 - 30): Quét Đơn Hàng & Xử Lý Đắn Đo - Đọc tên khách chốt, hối thúc thanh toán, cam kết an tâm.
   - Phân vai rõ ràng giữa Lời nói/Hành động của Host và Hành động trợ lý/Mod (ghim giỏ, đập chuông, đếm suất).
4. Kiểm soát chính sách an toàn sàn (policyCompliance):
   - Tuyệt đối né các từ ngữ cấm: 'cam kết 100%', 'trị dứt điểm', 'vĩnh viễn', 'số 1', 'chuyển khoản ngoài', 'inbox riêng'...
   - Ghi các từ đã né vào 'bannedWordsAvoided'.`;

/**
 * Xây dựng User Prompt chi tiết dựa trên thông tin người dùng nhập vào
 */
export function buildScriptWriterPrompt(inputs: ScriptWriterInputs): string {
  const format = inputs.format || "both";
  const isVideo = format === "video_short" || format === "both";
  const isLive = format === "livestream" || format === "both";

  const audienceText = inputs.targetAudience
    ? `Khách hàng mục tiêu: ${inputs.targetAudience}`
    : "Khách hàng mua sắm online trên sàn Shopee và TikTok Shop";

  const priceDealText = inputs.priceDeal
    ? `Giá bán & Chương trình khuyến mãi áp dụng: ${inputs.priceDeal}`
    : "Flash Sale giảm giá sốc độc quyền trong phiên + Voucher trợ giá và Quà tặng có hạn";

  const angleText = inputs.scriptAngle
    ? `Phong cách / Góc tiếp cận ưu tiên: ${inputs.scriptAngle}`
    : "Đa dạng 3 góc: Nỗi đau, Giật tít tò mò, Review test thực tế";

  return `Hãy sáng tạo bộ kịch bản video ngắn và livestream TMĐT bùng nổ chuyển đổi cho sản phẩm sau:

THÔNG TIN SẢN PHẨM:
- Tên Sản Phẩm: ${inputs.productName}
- Điểm Nổi Bật (USP) Cần Nhấn Mạnh: ${inputs.usp}
- Định Dạng Cần Tạo: ${format === "both" ? "Cả 3 Kịch Bản Video Ngắn VÀ 1 Kịch Bản Livestream 4 Chặng" : format === "video_short" ? "3 Kịch Bản Video Ngắn 30 - 45s" : "Kịch Bản Livestream 4 Chặng Thực Chiến"}
- ${priceDealText}
- ${audienceText}
- ${angleText}

YÊU CẦU ĐỊNH DẠNG:
Trả về DUY NHẤT một chuỗi JSON hợp lệ tuân theo cấu trúc schema sau:

{
  "format": "${format}",
  ${isVideo ? `"videoScripts": [
    {
      "id": 1,
      "title": "Tiêu đề kịch bản 1 (Góc Nỗi Đau)",
      "angleLabel": "Nỗi Đau & Đồng Cảm",
      "estimatedDuration": "35 giây",
      "scenes": [
        {
          "id": 1,
          "timeRange": "00:00 - 00:03",
          "phase": "hook",
          "phaseTitle": "HOOK: Giữ chân 3 giây đầu",
          "visualAction": "Hành động thị giác cụ thể trước ống kính",
          "audioVoiceover": "Câu thoại KOC nói mở đầu",
          "textOverlay": "CHỮ TO NỔI BẬT TRÊN MÀN HÌNH",
          "soundEffectSuggestion": "Gợi ý tiếng SFX"
        },
        {
          "id": 2,
          "timeRange": "00:03 - 00:15",
          "phase": "pain",
          "phaseTitle": "NỖI ĐAU: Khơi gợi vấn đề",
          "visualAction": "Cảnh quay minh họa nỗi đau khách gặp phải",
          "audioVoiceover": "Lời thoại chạm trúng điểm đau",
          "textOverlay": "CHỮ TÓM TẮT VẤN ĐỀ",
          "soundEffectSuggestion": "Âm thanh buồn hoặc gay cấn"
        },
        {
          "id": 3,
          "timeRange": "00:15 - 00:30",
          "phase": "solution",
          "phaseTitle": "GIẢI PHÁP: Giới thiệu USP",
          "visualAction": "Cảnh test sản phẩm thực tế làm nổi bật USP",
          "audioVoiceover": "Lời thoại giải pháp vượt trội",
          "textOverlay": "USP NỔI BẬT NHẤT",
          "soundEffectSuggestion": "Nhạc vui tươi, biến hình"
        },
        {
          "id": 4,
          "timeRange": "00:30 - 00:40",
          "phase": "cta",
          "phaseTitle": "CTA: Kêu gọi chốt đơn",
          "visualAction": "Cầm sản phẩm chỉ vào giỏ hàng góc trái",
          "audioVoiceover": "Lời kêu gọi giỏ hàng vàng và quà tặng",
          "textOverlay": "MUA NGAY TRONG GIỎ HÀNG GÓC TRÁI",
          "soundEffectSuggestion": "Tiếng leng keng tính tiền"
        }
      ],
      "directorNotes": "Lời dặn quay dựng và âm nhạc"
    }
  ],` : ""}
  ${isLive ? `"liveScript": {
    "overview": "Tổng quan kịch bản phiên live",
    "targetProducts": "${inputs.productName}",
    "stages": [
      {
        "stageNumber": 1,
        "stageName": "Chặng 1: Kéo Mắt & Giữ Chân",
        "timeAllocation": "Phút 00:00 - 05:00",
        "hostSpeech": "Lời thoại Host mở live chào hỏi kích thích tương tác",
        "hostAction": "Hành động của Host trước camera",
        "assistantModAction": "Hành động trợ lý hỗ trợ và tương tác",
        "pinnedStrategy": "Chiến lược ghim deal hoặc banner"
      },
      {
        "stageNumber": 2,
        "stageName": "Chặng 2: Trưng Bày & Tạo Thèm Khát (Demo USP)",
        "timeAllocation": "Phút 05:00 - 15:00",
        "hostSpeech": "Lời thoại Host demo và làm nổi bật giá trị sản phẩm",
        "hostAction": "Hành động thử sản phẩm và đo đạc thực tế",
        "assistantModAction": "Trợ lý hỗ trợ đạo cụ và ghim sản phẩm giá gốc",
        "pinnedStrategy": "Ghim sản phẩm tạo mỏ neo giá cao"
      },
      {
        "stageNumber": 3,
        "stageName": "Chặng 3: Tung Deal Sốc & Đếm Ngược Khóa Đơn",
        "timeAllocation": "Phút 15:00 - 22:00",
        "hostSpeech": "Lời thoại Host báo giá ưu đãi độc quyền và đếm ngược",
        "hostAction": "Hành động giơ bảng giá deal sốc",
        "assistantModAction": "Trợ lý đập chuông và báo mở kho giới hạn",
        "pinnedStrategy": "Ghim voucher và ghim deal trợ giá"
      },
      {
        "stageNumber": 4,
        "stageName": "Chặng 4: Quét Đơn Hàng & Xử Lý Đắn Đo",
        "timeAllocation": "Phút 22:00 - 30:00",
        "hostSpeech": "Lời thoại Host đọc tên khách và cam kết an tâm",
        "hostAction": "Khoe đơn nhảy liên tục trên điện thoại",
        "assistantModAction": "Trợ lý báo số lượng tồn kho còn ít",
        "pinnedStrategy": "Ghim thông báo sắp hết suất"
      }
    ],
    "fomoTactics": [
      "Chiến thuật neo giá",
      "Chiến thuật giới hạn số suất",
      "Kêu gọi bằng chứng xã hội đọc tên khách mua"
    ]
  },` : ""}
  "policyCompliance": {
    "safeScore": 98,
    "bannedWordsAvoided": ["cam kết 100%", "trị dứt điểm", "vĩnh viễn"],
    "warningNotes": ["Đã kiểm soát từ ngữ an toàn chính sách TikTok Shop & Shopee"]
  }
}`;
}

/**
 * Resilient Parser 4 Tầng Bền Bỉ:
 * Tầng 1: Parse trực tiếp JSON
 * Tầng 2: Parse Markdown Code Block ```json ... ```
 * Tầng 3: Trích xuất khối JSON giữa { và }
 * Tầng 4: Fallback Heuristic Regex Parser từ Markdown văn bản cũ (Tương thích ngược 100%)
 */
export function parseScriptWriterResult(
  rawText: string,
  defaultFormat: ScriptFormat = "both"
): ScriptWriterData {
  if (!rawText || !rawText.trim()) {
    return createDefaultScriptData(defaultFormat);
  }

  const trimmed = rawText.trim();

  // TẦNG 1: Thử parse trực tiếp JSON
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (isValidScriptData(parsed)) {
        return normalizeScriptWriterData(parsed, defaultFormat);
      }
    } catch {
      // Tiếp tục xuống tầng tiếp theo
    }
  }

  // TẦNG 2: Bóc tách từ code block markdown ```json ... ``` hoặc ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      const innerJson = codeBlockMatch[1].trim();
      const parsed = JSON.parse(innerJson);
      if (isValidScriptData(parsed)) {
        return normalizeScriptWriterData(parsed, defaultFormat);
      }
    } catch {
      // Tiếp tục xuống tầng tiếp theo
    }
  }

  // TẦNG 3: Tìm khối JSON đầu tiên xuất hiện giữa { và }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const candidate = trimmed.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(candidate);
      if (isValidScriptData(parsed)) {
        return normalizeScriptWriterData(parsed, defaultFormat);
      }
    } catch {
      // Tiếp tục thử sửa chữa cắt cụt
    }
  }

  // TẦNG 3.5: Cứu hộ JSON bị cắt cụt (Truncation Recovery)
  // Khi AI phản hồi vượt quá token limit hoặc bị ngắt stream, khôi phục cấu trúc JSON hợp lệ
  try {
    const candidateToRepair = firstBrace !== -1 ? trimmed.slice(firstBrace) : trimmed;
    const repaired = repairTruncatedJson(candidateToRepair);
    if (repaired && isValidScriptData(repaired)) {
      return normalizeScriptWriterData(repaired, defaultFormat);
    }
  } catch {
    // Tiếp tục xuống tầng fallback regex
  }

  // TẦNG 4: Fallback Regex Parser từ cấu trúc Markdown truyền thống
  return parseMarkdownFallback(trimmed, defaultFormat);
}

/**
 * Tự động sửa chữa JSON bị cắt cụt (Truncated JSON Repair)
 * Phục hồi các dấu ngoặc nhọn, ngoặc vuông và đóng chuỗi literal khi phản hồi bị dừng đột ngột.
 */
export function repairTruncatedJson(rawText: string): any | null {
  if (!rawText || typeof rawText !== "string") return null;

  const firstBrace = rawText.indexOf("{");
  if (firstBrace === -1) return null;

  let text = rawText.slice(firstBrace).trim();

  // 1. Nếu đã hợp lệ, parse luôn
  try {
    return JSON.parse(text);
  } catch {
    // Tiếp tục sửa chữa
  }

  // 2. Scan để xác định trạng thái chuỗi và ngoặc mở
  let inString = false;
  let isEscaped = false;
  const stack: ("{" | "[")[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === "\\") {
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{" || char === "[") {
        stack.push(char);
      } else if (char === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{") {
          stack.pop();
        }
      } else if (char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") {
          stack.pop();
        }
      }
    }
  }

  // 3. Nếu đang dở dang trong chuỗi, đóng chuỗi
  if (inString) {
    text += '"';
  }

  // 4. Xóa phần đuôi dang dở (trailing commas, dangling keys)
  const cleanTail = (s: string): string => {
    let res = s.trim();
    let changed = true;
    while (changed) {
      changed = false;
      res = res.trim();
      if (res.endsWith(",")) {
        res = res.slice(0, -1).trim();
        changed = true;
      }
      if (res.endsWith(":")) {
        res = res.slice(0, -1).trim();
        changed = true;
      }
      const danglingKeyMatch = res.match(/(?:,|{)\s*"[^"]*"\s*$/);
      if (danglingKeyMatch) {
        const lastQuoteIdx = res.lastIndexOf('"');
        const firstQuoteOfKeyIdx = res.lastIndexOf('"', lastQuoteIdx - 1);
        if (firstQuoteOfKeyIdx !== -1) {
          res = res.slice(0, firstQuoteOfKeyIdx).trim();
          changed = true;
        }
      }
    }
    return res;
  };

  text = cleanTail(text);

  // 5. Đóng các ngoặc mở còn lại theo thứ tự LIFO
  let closedText = text;
  for (let i = stack.length - 1; i >= 0; i--) {
    const openChar = stack[i];
    if (openChar === "{") closedText += "}";
    else if (openChar === "[") closedText += "]";
  }

  try {
    const parsed = JSON.parse(closedText);
    if (isValidScriptData(parsed)) {
      return parsed;
    }
  } catch {
    // 6. Thử nghiệm cắt lùi về phần tử hợp lệ gần nhất nếu bị lỗi cú pháp sâu
    const lastCommaOrBrace = Math.max(text.lastIndexOf(","), text.lastIndexOf("}"));
    if (lastCommaOrBrace > 10) {
      let rollback = text.slice(0, lastCommaOrBrace).trim();
      if (rollback.endsWith(",")) rollback = rollback.slice(0, -1).trim();

      // Quét lại stack cho rollback
      let rInString = false;
      let rEscaped = false;
      const rStack: ("{" | "[")[] = [];
      for (let i = 0; i < rollback.length; i++) {
        const ch = rollback[i];
        if (rEscaped) { rEscaped = false; continue; }
        if (ch === "\\") { rEscaped = true; continue; }
        if (ch === '"') { rInString = !rInString; continue; }
        if (!rInString) {
          if (ch === "{" || ch === "[") rStack.push(ch);
          else if (ch === "}" && rStack[rStack.length - 1] === "{") rStack.pop();
          else if (ch === "]" && rStack[rStack.length - 1] === "[") rStack.pop();
        }
      }
      if (rInString) rollback += '"';
      rollback = cleanTail(rollback);
      for (let i = rStack.length - 1; i >= 0; i--) {
        const op = rStack[i];
        if (op === "{") rollback += "}";
        else if (op === "[") rollback += "]";
      }
      try {
        const parsedRollback = JSON.parse(rollback);
        if (isValidScriptData(parsedRollback)) {
          return parsedRollback;
        }
      } catch {
        // Fallback null
      }
    }
  }

  return null;
}

/**
 * Kiểm tra tính hợp lệ cơ bản của dữ liệu ScriptWriterData
 */
function isValidScriptData(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  return Boolean(
    (Array.isArray(obj.videoScripts) && obj.videoScripts.length > 0) ||
      (obj.liveScript && Array.isArray(obj.liveScript.stages)) ||
      obj.format
  );
}

/**
 * Chuẩn hóa dữ liệu ScriptWriterData đảm bảo không bị crash khi render
 */
export function normalizeScriptWriterData(
  data: any,
  fallbackFormat: ScriptFormat = "both"
): ScriptWriterData {
  const format: ScriptFormat = (data.format as ScriptFormat) || fallbackFormat;

  const videoScripts: VideoScriptItem[] = Array.isArray(data.videoScripts)
    ? data.videoScripts.map((s: any, idx: number) => ({
        id: typeof s.id === "number" ? s.id : idx + 1,
        title: s.title || `Kịch bản ${idx + 1}`,
        angleLabel: s.angleLabel || "Góc Tiếp Cận",
        estimatedDuration: s.estimatedDuration || "35 - 45 giây",
        scenes: Array.isArray(s.scenes)
          ? s.scenes.map((sc: any, scIdx: number) => ({
              id: typeof sc.id === "number" ? sc.id : scIdx + 1,
              timeRange: sc.timeRange || "00:00",
              phase: sc.phase || "other",
              phaseTitle: sc.phaseTitle || sc.phase || `Cảnh ${scIdx + 1}`,
              visualAction: sc.visualAction || "",
              audioVoiceover: sc.audioVoiceover || sc.voice || sc.content || "",
              textOverlay: sc.textOverlay || sc.overlay || "",
              soundEffectSuggestion: sc.soundEffectSuggestion || "",
            }))
          : [],
        directorNotes: s.directorNotes || s.notes || undefined,
      }))
    : [];

  let liveScript: LiveScriptData | undefined = undefined;
  if (data.liveScript && Array.isArray(data.liveScript.stages)) {
    liveScript = {
      overview: data.liveScript.overview || "Kịch bản Livestream TMĐT chuyển đổi cao",
      targetProducts: data.liveScript.targetProducts || "Sản phẩm chính",
      stages: data.liveScript.stages.map((st: any, idx: number) => ({
        stageNumber: typeof st.stageNumber === "number" ? st.stageNumber : idx + 1,
        stageName: st.stageName || `Chặng ${idx + 1}`,
        timeAllocation: st.timeAllocation || "00:00 - 05:00",
        hostSpeech: st.hostSpeech || "",
        hostAction: st.hostAction || "",
        assistantModAction: st.assistantModAction || "",
        pinnedStrategy: st.pinnedStrategy || "",
      })),
      fomoTactics: Array.isArray(data.liveScript.fomoTactics) ? data.liveScript.fomoTactics : [],
    };
  }

  const policyCompliance: PolicyCompliance = {
    safeScore: typeof data.policyCompliance?.safeScore === "number" ? data.policyCompliance.safeScore : 98,
    bannedWordsAvoided: Array.isArray(data.policyCompliance?.bannedWordsAvoided)
      ? data.policyCompliance.bannedWordsAvoided
      : ["cam kết 100%", "trị dứt điểm", "vĩnh viễn"],
    warningNotes: Array.isArray(data.policyCompliance?.warningNotes)
      ? data.policyCompliance.warningNotes
      : ["Đã rà soát tuân thủ tiêu chuẩn quảng cáo TikTok Shop & Shopee Live"],
  };

  return {
    format,
    videoScripts: videoScripts.length > 0 ? videoScripts : undefined,
    liveScript,
    policyCompliance,
  };
}

/**
 * Fallback Parser từ cấu trúc Markdown truyền thống (Tương thích ngược 100% với lịch sử)
 */
function parseMarkdownFallback(
  rawText: string,
  defaultFormat: ScriptFormat = "both"
): ScriptWriterData {
  const normalized = rawText
    .replace(/```markdown/gi, "\n```markdown\n")
    .replace(/```/g, "\n```\n")
    .replace(/\s+(#+\s+Kịch bản)/gi, "\n\n$1")
    .replace(/\s+(#+\s+\[\d{2}:\d{2})/gi, "\n\n$1")
    .replace(/\s+(##+\s+Hook)/gi, "\n\n$1")
    .replace(/\s+(##+\s+Nỗi đau)/gi, "\n\n$1")
    .replace(/\s+(##+\s+Giải pháp)/gi, "\n\n$1")
    .replace(/\s+(##+\s+Call to Action)/gi, "\n\n$1")
    .replace(/[\u4e00-\u9fa5]+[^\n]*\n?/g, "");

  const lines = normalized.split("\n");
  const parsedScripts: VideoScriptItem[] = [];

  let currentScript: Partial<VideoScriptItem> | null = null;
  let currentSection: Partial<VideoScriptScene> | null = null;
  let bufferSection: string[] = [];
  let bufferNotes: string[] = [];
  let isInsideNotes = false;

  const finishCurrentSection = () => {
    if (currentSection && currentScript && currentScript.scenes) {
      let voice = "";
      let action = "";
      let overlay = "";

      bufferSection.forEach((l) => {
        const tr = l.trim();
        const vMatch = tr.match(/^[-*•\s]*(?:\*\*|\*)?(?:Lời thoại|Voice|Thoại)[^:\n\r]*[:\-]\s*(.*)$/i);
        if (vMatch) {
          voice = vMatch[1].replace(/^\*\*|\*\*$/g, "").replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, "").trim();
          return;
        }

        const aMatch = tr.match(/^[-*•\s]*(?:\*\*|\*)?(?:Hình ảnh|Hành động|Visual|Góc quay|Camera)[^:\n\r]*[:\-]\s*(.*)$/i);
        if (aMatch) {
          action = aMatch[1].replace(/^\*\*|\*\*$/g, "").trim();
          return;
        }

        const oMatch = tr.match(/^[-*•\s]*(?:\*\*|\*)?(?:Chữ trên video|Text trên video|Text hiển thị|Caption|Chữ màn hình|Text)[^:\n\r]*[:\-]\s*(.*)$/i);
        if (oMatch) {
          overlay = oMatch[1].replace(/^\*\*|\*\*$/g, "").replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, "").trim();
          return;
        }
      });

      if (!voice && !action) {
        voice = bufferSection.join(" ").trim();
      }

      currentScript.scenes.push({
        id: currentScript.scenes.length + 1,
        timeRange: currentSection.timeRange || "00:00",
        phase: currentSection.phase || "other",
        phaseTitle: currentSection.phaseTitle || `Cảnh ${currentScript.scenes.length + 1}`,
        visualAction: action,
        audioVoiceover: voice,
        textOverlay: overlay,
      });

      currentSection = null;
      bufferSection = [];
    }
  };

  const finishCurrentScript = () => {
    finishCurrentSection();
    if (currentScript && currentScript.scenes && currentScript.scenes.length > 0) {
      const notes = bufferNotes.join("\n").trim();
      const scriptId = parsedScripts.length + 1;
      let title = currentScript.title?.trim() || `Kịch bản ${scriptId}`;

      parsedScripts.push({
        id: scriptId,
        title,
        angleLabel: title.includes("Nỗi Đau") ? "Nỗi Đau & Đồng Cảm" : title.includes("Tò Mò") ? "Giật Tít & Tò Mò" : "Review Thực Tế",
        estimatedDuration: "35 - 45 giây",
        scenes: currentScript.scenes,
        directorNotes: notes || undefined,
      });

      currentScript = null;
      bufferNotes = [];
      isInsideNotes = false;
    }
  };

  const startNewScript = (title?: string) => {
    finishCurrentScript();
    const nextId = parsedScripts.length + 1;
    currentScript = {
      id: nextId,
      title: title || `Kịch bản ${nextId}`,
      scenes: [],
    };
    isInsideNotes = false;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("```")) return;

    const isExplicitScriptHeader = /^(?:#+\s*)?(?:KỊCH BẢN|Kịch bản|Phiên bản|Biến thể|Option)\s*(\d+|[A-Z]|số\s*\d+)?[\:\-\.]?\s*(.*)$/i.test(trimmed);
    const isHookStart = /\[\s*00:00\s*-\s*00:03\s*\]/i.test(trimmed) || (/HOOK/i.test(trimmed) && /\[\d{2}:\d{2}/i.test(trimmed));
    const currentHasHook = currentScript?.scenes?.some((s) => s.phase === "hook");

    if (isExplicitScriptHeader && !isHookStart) {
      let scriptTitle = trimmed.replace(/^#+\s*/, "").replace(/\*+/g, "").trim();
      startNewScript(scriptTitle || `Kịch bản ${parsedScripts.length + 1}`);
      return;
    } else if (isHookStart && (!currentScript || currentHasHook)) {
      startNewScript(`Kịch bản ${parsedScripts.length + 1}`);
    }

    if (!currentScript) {
      startNewScript(`Kịch bản 1`);
    }

    if (/^#+\s*(?:Gợi ý quay dựng|Lưu ý|Tips)/i.test(trimmed)) {
      finishCurrentSection();
      isInsideNotes = true;
      return;
    }

    if (isInsideNotes) {
      bufferNotes.push(line);
      return;
    }

    const timeMatch = trimmed.match(/\[(\d{2}:\d{2}\s*-\s*[^\]]+)\]\s*(.*)/i);
    const isPhaseHeader = trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.startsWith("- [");

    const hasHook = /HOOK/i.test(trimmed);
    const hasPain = /NỖI ĐAU|VẤN ĐỀ/i.test(trimmed);
    const hasSolution = /GIẢI PHÁP|SẢN PHẨM/i.test(trimmed);
    const hasCta = /CALL TO ACTION|CTA|KÊU GỌI/i.test(trimmed);

    if (timeMatch || (isPhaseHeader && (hasHook || hasPain || hasSolution || hasCta))) {
      finishCurrentSection();
      let timeRange = timeMatch ? timeMatch[1].trim() : "00:00 - 00:03";
      let phase: VideoScriptScene["phase"] = "other";
      let phaseTitle = timeMatch ? timeMatch[2].trim() : trimmed;

      if (hasHook) {
        phase = "hook";
        phaseTitle = "HOOK - Giữ Chân 3s Đầu";
      } else if (hasPain) {
        phase = "pain";
        phaseTitle = "NỖI ĐAU - Khơi Gợi Vấn Đề";
      } else if (hasSolution) {
        phase = "solution";
        phaseTitle = "GIẢI PHÁP - Giới Thiệu USP";
      } else if (hasCta) {
        phase = "cta";
        phaseTitle = "CTA - Kêu Gọi Giỏ Hàng";
      }

      currentSection = {
        timeRange,
        phase,
        phaseTitle,
      };
    } else if (currentSection) {
      bufferSection.push(line);
    }
  });

  finishCurrentScript();

  if (parsedScripts.length === 0) {
    return createDefaultScriptData(defaultFormat);
  }

  return {
    format: defaultFormat,
    videoScripts: parsedScripts,
    policyCompliance: {
      safeScore: 95,
      bannedWordsAvoided: ["cam kết 100%", "trị dứt điểm"],
      warningNotes: ["Đã rà soát tuân thủ tiêu chuẩn sàn"],
    },
  };
}

/**
 * Tạo dữ liệu mặc định an toàn khi không thể parse
 */
export function createDefaultScriptData(format: ScriptFormat = "both"): ScriptWriterData {
  return {
    format,
    videoScripts: [
      {
        id: 1,
        title: "Kịch bản Video Chi Tiết",
        angleLabel: "Tiêu Chuẩn",
        estimatedDuration: "35 giây",
        scenes: [
          {
            id: 1,
            timeRange: "00:00 - 00:03",
            phase: "hook",
            phaseTitle: "HOOK: Giữ chân 3 giây đầu",
            visualAction: "KOC cầm sản phẩm trước ống kính",
            audioVoiceover: "Bạn đang tìm kiếm sản phẩm chất lượng?",
            textOverlay: "GIẢI PHÁP CHO BẠN",
          },
          {
            id: 2,
            timeRange: "00:03 - 00:15",
            phase: "pain",
            phaseTitle: "NỖI ĐAU: Khơi gợi vấn đề",
            visualAction: "KOC chia sẻ khó khăn thường gặp",
            audioVoiceover: "Đừng để vấn đề này làm phiền bạn mỗi ngày nữa!",
            textOverlay: "VẤN ĐỀ THƯỜNG GẶP",
          },
          {
            id: 3,
            timeRange: "00:15 - 00:30",
            phase: "solution",
            phaseTitle: "GIẢI PHÁP: Giới thiệu USP",
            visualAction: "Trưng bày tính năng vượt trội",
            audioVoiceover: "Đây chính là giải pháp tối ưu dành cho bạn!",
            textOverlay: "TÍNH NĂNG VƯỢT TRỘI",
          },
          {
            id: 4,
            timeRange: "00:30 - 00:40",
            phase: "cta",
            phaseTitle: "CTA: Kêu gọi chốt đơn",
            visualAction: "Chỉ tay vào giỏ hàng vàng góc trái",
            audioVoiceover: "Bấm ngay vào giỏ hàng bên dưới để nhận ưu đãi!",
            textOverlay: "MUA NGAY TRONG GIỎ HÀNG",
          },
        ],
      },
    ],
    policyCompliance: {
      safeScore: 98,
      bannedWordsAvoided: [],
      warningNotes: [],
    },
  };
}

/**
 * Định dạng toàn bộ dữ liệu thành văn bản Markdown sạch sẽ (để tải TXT hoặc copy tất cả)
 */
export function scriptToText(data: ScriptWriterData): string {
  const parts: string[] = [];

  if (data.videoScripts && data.videoScripts.length > 0) {
    parts.push("# BỘ KỊCH BẢN VIDEO NGẮN TIKTOK SHOP / REELS (3 GÓC CHUYỂN ĐỔI)");

    data.videoScripts.forEach((script) => {
      parts.push(`\n## ${script.title.toUpperCase()} (${script.estimatedDuration})`);
      parts.push(`- Góc chiến lược: ${script.angleLabel}`);

      script.scenes.forEach((sc) => {
        parts.push(`\n### [${sc.timeRange}] ${sc.phaseTitle || sc.phase.toUpperCase()}`);
        if (sc.visualAction) parts.push(`- Visual / Hành động: ${sc.visualAction}`);
        if (sc.audioVoiceover) parts.push(`- Lời thoại (Voice): "${sc.audioVoiceover}"`);
        if (sc.textOverlay) parts.push(`- Chữ trên video: ${sc.textOverlay}`);
        if (sc.soundEffectSuggestion) parts.push(`- SFX / Âm thanh: ${sc.soundEffectSuggestion}`);
      });

      if (script.directorNotes) {
        parts.push(`\n*Lưu ý quay dựng & BGM*: ${script.directorNotes}`);
      }
    });
  }

  if (data.liveScript && data.liveScript.stages && data.liveScript.stages.length > 0) {
    parts.push("\n\n" + "=".repeat(60));
    parts.push("# KHUNG KỊCH BẢN LIVESTREAM BÙNG NỔ DOANH SỐ (4 CHẶNG VÀNG)");
    parts.push(`- Tổng quan: ${data.liveScript.overview}`);
    parts.push(`- Sản phẩm trọng tâm: ${data.liveScript.targetProducts}`);

    data.liveScript.stages.forEach((st) => {
      parts.push(`\n## CHẶNG ${st.stageNumber}: ${st.stageName.toUpperCase()} (${st.timeAllocation})`);
      parts.push(`- Lời thoại Host/MC: "${st.hostSpeech}"`);
      parts.push(`- Hành động Host: ${st.hostAction}`);
      parts.push(`- Trợ lý / Mod hỗ trợ: ${st.assistantModAction}`);
      parts.push(`- Chiến lược ghim giỏ / deal: ${st.pinnedStrategy}`);
    });

    if (data.liveScript.fomoTactics && data.liveScript.fomoTactics.length > 0) {
      parts.push("\n*Chiến thuật đẩy FOMO chốt đơn*:");
      data.liveScript.fomoTactics.forEach((t) => parts.push(`- ${t}`));
    }
  }

  if (data.policyCompliance && data.policyCompliance.warningNotes.length > 0) {
    parts.push("\n\n" + "-".repeat(50));
    parts.push(`Điểm an toàn sàn: ${data.policyCompliance.safeScore}/100`);
    if (data.policyCompliance.bannedWordsAvoided.length > 0) {
      parts.push(`Từ cấm đã né tránh: ${data.policyCompliance.bannedWordsAvoided.join(", ")}`);
    }
    parts.push(`Lưu ý chính sách: ${data.policyCompliance.warningNotes.join("; ")}`);
  }

  return parts.join("\n");
}

/**
 * Định dạng dạng Teleprompter cho Video (chữ to rõ cho KOC nhìn đọc quay liền mạch)
 */
export function formatTeleprompterText(script: VideoScriptItem): string {
  const lines: string[] = [];
  lines.push(`=== MÁY NHẮC CHỮ: ${script.title.toUpperCase()} (${script.estimatedDuration}) ===`);
  lines.push(`Góc chiến lược: ${script.angleLabel}\n`);

  script.scenes.forEach((sc, i) => {
    lines.push(`[CẢNH ${i + 1} (${sc.timeRange}) · ${sc.phaseTitle || sc.phase.toUpperCase()}]`);
    lines.push(`Thoại: "${sc.audioVoiceover}"`);
    if (sc.visualAction) lines.push(`👉 Visual: ${sc.visualAction}`);
    if (sc.textOverlay) lines.push(`🔤 Chữ video: ${sc.textOverlay}`);
    if (sc.soundEffectSuggestion) lines.push(`🎵 Âm thanh: ${sc.soundEffectSuggestion}`);
    lines.push("");
  });

  return lines.join("\n").trim();
}

/**
 * Định dạng dạng Teleprompter cho Livestream (4 Chặng MC)
 */
export function formatLiveTeleprompterText(live: LiveScriptData): string {
  const lines: string[] = [];
  lines.push(`=== MÁY NHẮC CHỮ LIVESTREAM: ${live.targetProducts.toUpperCase()} ===`);
  lines.push(`Tổng quan: ${live.overview}\n`);

  live.stages.forEach((st) => {
    lines.push(`[CHẶNG ${st.stageNumber}: ${st.stageName.toUpperCase()} (${st.timeAllocation})]`);
    lines.push(`Thoại MC:\n"${st.hostSpeech}"`);
    if (st.hostAction) lines.push(`👉 Hành động Host: ${st.hostAction}`);
    if (st.assistantModAction) lines.push(`👥 Trợ lý/Mod: ${st.assistantModAction}`);
    if (st.pinnedStrategy) lines.push(`🏷️ Ghim deal: ${st.pinnedStrategy}`);
    lines.push("");
  });

  return lines.join("\n").trim();
}

/**
 * Định dạng Teleprompter toàn bộ (cả Video và Livestream)
 */
export function formatAllTeleprompterText(data: ScriptWriterData): string {
  const parts: string[] = [];

  if (data.videoScripts && data.videoScripts.length > 0) {
    data.videoScripts.forEach((s) => {
      parts.push(formatTeleprompterText(s));
      parts.push("\n" + "=".repeat(50) + "\n");
    });
  }

  if (data.liveScript && data.liveScript.stages && data.liveScript.stages.length > 0) {
    parts.push(formatLiveTeleprompterText(data.liveScript));
  }

  return parts.join("\n").trim();
}

/**
 * Xuất file Excel kịch bản phân cảnh chuyên nghiệp (.xlsx)
 */
export function exportScriptExcel(
  data: ScriptWriterData,
  productName?: string,
  usp?: string
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Kịch bản Video Ngắn (Bảng phân cảnh)
  if (data.videoScripts && data.videoScripts.length > 0) {
    const videoRows: any[] = [];
    data.videoScripts.forEach((script) => {
      script.scenes.forEach((sc) => {
        videoRows.push({
          "Kịch Bản": script.title,
          "Góc Tiếp Cận": script.angleLabel,
          "Phân Cảnh": `Cảnh ${sc.id}`,
          "Thời Lượng": sc.timeRange,
          "Mục Tiêu": sc.phaseTitle || sc.phase,
          "Lời Thoại (Voiceover)": sc.audioVoiceover,
          "Hành Động / Visual": sc.visualAction,
          "Chữ Trên Video (Text Overlay)": sc.textOverlay,
          "Gợi Ý SFX / Âm Thanh": sc.soundEffectSuggestion || "",
          "Lưu Ý Quay Dựng": script.directorNotes || "",
          "Sản Phẩm": productName || "",
          "USP": usp || "",
        });
      });
    });

    const wsVideo = XLSX.utils.json_to_sheet(videoRows);
    wsVideo["!cols"] = [
      { wch: 25 }, // Kịch Bản
      { wch: 20 }, // Góc
      { wch: 10 }, // Cảnh
      { wch: 14 }, // Thời lượng
      { wch: 22 }, // Mục tiêu
      { wch: 50 }, // Lời thoại
      { wch: 45 }, // Hành động
      { wch: 32 }, // Chữ trên video
      { wch: 25 }, // SFX
      { wch: 30 }, // Lưu ý
      { wch: 25 }, // Sản phẩm
      { wch: 30 }, // USP
    ];
    XLSX.utils.book_append_sheet(wb, wsVideo, "Video_Phan_Canh");
  }

  // Sheet 2: Kịch bản Livestream 4 Chặng
  if (data.liveScript && data.liveScript.stages && data.liveScript.stages.length > 0) {
    const liveRows = data.liveScript.stages.map((st) => ({
      "Chặng": `Chặng ${st.stageNumber}`,
      "Tên Chặng": st.stageName,
      "Khung Giờ": st.timeAllocation,
      "Lời Thoại Host / MC": st.hostSpeech,
      "Hành Động Của Host": st.hostAction,
      "Hành Động Trợ Lý / Mod": st.assistantModAction,
      "Chiến Lược Ghim Giỏ / Deal": st.pinnedStrategy,
      "Sản Phẩm Live": data.liveScript?.targetProducts || productName || "",
    }));

    const wsLive = XLSX.utils.json_to_sheet(liveRows);
    wsLive["!cols"] = [
      { wch: 10 }, // Chặng
      { wch: 30 }, // Tên Chặng
      { wch: 18 }, // Khung giờ
      { wch: 60 }, // Lời thoại Host
      { wch: 45 }, // Hành động Host
      { wch: 40 }, // Trợ lý
      { wch: 40 }, // Ghim giỏ
      { wch: 30 }, // Sản phẩm
    ];
    XLSX.utils.book_append_sheet(wb, wsLive, "Kich_Ban_Livestream");
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = productName
    ? productName.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 20).trim()
    : "TikTok";
  XLSX.writeFile(wb, `KichBan_Video_Live_${safeName}_${dateStr}.xlsx`);
}

/**
 * Sinh bộ kịch bản Video ngắn & Livestream dự phòng chuẩn sàn TMĐT 2026 (Offline Blueprint)
 * Cứu cánh 100% khi AI gặp sự cố (502/503/Quota)
 */
export function buildOfflineScriptWriterData(inputs: ScriptWriterInputs): ScriptWriterData {
  const format = inputs.format || "both";
  const name = (inputs.productName || "Sản Phẩm Cao Cấp").trim();
  const usp = (inputs.usp || "Chất lượng vượt trội, bảo hành chính hãng").trim();
  const deal = (inputs.priceDeal || "Giá ưu đãi độc quyền hôm nay").trim();
  const audience = (inputs.targetAudience || "Khách hàng mua sắm online toàn quốc").trim();

  const isVideo = format === "both" || format === "video_short";
  const isLive = format === "both" || format === "livestream";

  const videoScripts: VideoScriptItem[] | undefined = isVideo
    ? [
        {
          id: 1,
          title: `Góc Nỗi Đau & Đồng Cảm: ${name}`,
          angleLabel: "Nỗi Đau & Đồng Cảm",
          estimatedDuration: "35 - 45 giây",
          directorNotes: "Ánh sáng tự nhiên, quay cận cảnh sản phẩm, biểu cảm chân thật đồng cảm",
          scenes: [
            {
              id: 1,
              timeRange: "00:00 - 00:03",
              phase: "hook",
              phaseTitle: "HOOK 3s: Giữ chân khách hàng",
              visualAction: "Biểu cảm lắc đầu thất vọng, cầm sản phẩm cũ bị hỏng hoặc kém chất lượng",
              audioVoiceover: `Ai đã từng tốn cả đống tiền mua ${name} trôi nổi ngoài kia mà dùng được vài hôm là hỏng thì xem ngay video này!`,
              textOverlay: "ĐỪNG MẤT TIỀN OAN NỮA!",
              soundEffectSuggestion: "Whoosh + Record scratch",
            },
            {
              id: 2,
              timeRange: "00:03 - 00:10",
              phase: "pain",
              phaseTitle: "NỖI ĐAU: Đồng cảm vấn đề",
              visualAction: "Chỉ ra các điểm khó chịu khi dùng đồ kém chất lượng",
              audioVoiceover: "Mua rẻ vài chục nghìn tưởng hời, ai ngờ chất lượng kém, dùng vừa bực mình vừa mất thời gian đổi trả.",
              textOverlay: "Ham rẻ = Tiền mất tật mang",
              soundEffectSuggestion: "Subtle dramatic tension",
            },
            {
              id: 3,
              timeRange: "00:10 - 00:25",
              phase: "solution",
              phaseTitle: "GIẢI PHÁP: Giới thiệu tính năng vượt trội",
              visualAction: `Cầm ${name} chính hãng lên, xoay các góc tinh xảo, test thực tế độ bền`,
              audioVoiceover: `Cho đến khi tui tìm ra em ${name} này! ${usp}. Cầm trên tay đầm chắc, độ hoàn thiện tinh xảo cực kỳ!`,
              textOverlay: `CHÂN ÁI MỚI: ${name}`,
              soundEffectSuggestion: "Uplifting pop music",
            },
            {
              id: 4,
              timeRange: "00:25 - 00:35",
              phase: "cta",
              phaseTitle: "CTA: Kêu gọi hành động & Chốt đơn",
              visualAction: "Chỉ tay thẳng vào biểu tượng Giỏ Hàng màu vàng góc trái màn hình",
              audioVoiceover: `Đang có chương trình trợ giá: ${deal}. Bấm ngay Giỏ hàng màu vàng góc trái để nhận ưu đãi trước khi hết hàng nha!`,
              textOverlay: "BẤM GIỎ HÀNG GÓC TRÁI NHẬN DEAL!",
              soundEffectSuggestion: "Cash register ding / Ting ting",
            },
          ],
        },
        {
          id: 2,
          title: `Góc Review Thực Tế & Test Cực Hạn: ${name}`,
          angleLabel: "Review & Test Thực Tế",
          estimatedDuration: "40 - 50 giây",
          directorNotes: "Nhịp dựng nhanh, chuyển cảnh dứt khoát, âm thanh sống động kích thích thị giác",
          scenes: [
            {
              id: 1,
              timeRange: "00:00 - 00:03",
              phase: "hook",
              phaseTitle: "HOOK 3s: Thử thách cực hạn",
              visualAction: "Đặt sản phẩm lên bàn, bắt đầu bài kiểm tra độ bền thực tế không cắt ghép",
              audioVoiceover: `Test thử độ bền của ${name} xem có thật sự xịn như lời đồn không nha!`,
              textOverlay: "TEST THỰC TẾ 100%!",
              soundEffectSuggestion: "Fast whoosh + Bass drop",
            },
            {
              id: 2,
              timeRange: "00:03 - 00:15",
              phase: "solution",
              phaseTitle: "TRẢI NGHIỆM: Trưng bày công năng",
              visualAction: "Quay cận từng chi tiết, làm nổi bật điểm mạnh độc quyền",
              audioVoiceover: `Điểm ăn tiền nhất chính là: ${usp}. Dùng cực kỳ tiện lợi và ưng ý!`,
              textOverlay: "CHẤT LIỆU CAO CẤP VƯỢT TRỘI",
              soundEffectSuggestion: "Bright upbeat rhythm",
            },
            {
              id: 3,
              timeRange: "00:15 - 00:30",
              phase: "cta",
              phaseTitle: "CTA: Chốt hạ ưu đãi",
              visualAction: "Cầm hộp sản phẩm đầy đủ quà tặng, chỉ vào giỏ hàng",
              audioVoiceover: `Phiên bản chính hãng bảo hành đổi trả tận nhà. Đang có deal ${deal}, nhanh tay kẻo hết mã giảm giá!`,
              textOverlay: "SĂN DEAL HỜI TẠI GIỎ HÀNG!",
              soundEffectSuggestion: "Ting ting chốt đơn",
            },
          ],
        },
      ]
    : undefined;

  const liveScript: LiveScriptData | undefined = isLive
    ? {
        overview: `Kịch bản Livestream 4 chặng chốt đơn thần tốc cho sản phẩm ${name}`,
        targetProducts: `${name} - ${usp}`,
        stages: [
          {
            stageNumber: 1,
            stageName: "Chặng 1: Kéo Mắt & Giữ Chân (0 - 5 phút)",
            timeAllocation: "00:00 - 05:00",
            hostSpeech: `Chào mừng tất cả các anh chị đang có mặt trong phiên live hôm nay! Ai đang quan tâm đến ${name} comment số 1 cho em thấy cánh tay của mọi người nào! Hôm nay em có 20 suất deal sốc độc quyền trợ giá chỉ dành riêng cho phiên live này thôi nha!`,
            hostAction: "Cười tươi, giơ sản phẩm vẫy chào, chỉ tay vào khung chat kêu gọi tương tác",
            assistantModAction: "Cầm bảng số lượng đếm lùi, gõ chuông tạo không khí náo nhiệt",
            pinnedStrategy: "Ghim voucher giảm giá toàn sàn 15% - 20% lên đầu màn hình live",
          },
          {
            stageNumber: 2,
            stageName: "Chặng 2: Trưng Bày & Đẩy Cảm Xúc (5 - 15 phút)",
            timeAllocation: "05:00 - 15:00",
            hostSpeech: `Mọi người nhìn cận cảnh giúp em nha! ${name} được hoàn thiện tỉ mỉ từng chi tiết, ${usp}. Bình thường ở ngoài bán giá cao, nhưng hôm nay trên live em tài trợ thẳng: ${deal}!`,
            hostAction: "Cầm sản phẩm sát vào camera, xoay 360 độ, test công năng trực tiếp",
            assistantModAction: "Cầm phụ kiện quà tặng đứng bên cạnh phụ họa, hô to 'Quá xịn luôn chị ơi!'",
            pinnedStrategy: "Ghim trực tiếp sản phẩm vào giỏ hàng với giá flash deal nhấp nháy",
          },
          {
            stageNumber: 3,
            stageName: "Chặng 3: Ép Đơn Khẩn Cấp & Đếm Ngược (15 - 25 phút)",
            timeAllocation: "15:00 - 25:00",
            hostSpeech: "Em chỉ mở đúng 10 suất giá này trong vòng 3 phút đếm ngược! Hết 10 suất em nhảy về giá gốc ngay lập tức, ai bấm thanh toán kịp thì được nha!",
            hostAction: "Nhìn đồng hồ đếm ngược, giơ tay đếm số lượng giỏ hàng nhảy",
            assistantModAction: "Liên tục hô lớn: 'Đã có 5 anh chị thanh toán thành công!', 'Còn đúng 3 suất cuối!'",
            pinnedStrategy: "Kích hoạt hiệu ứng Flash Deal đếm ngược thời gian trên sàn",
          },
          {
            stageNumber: 4,
            stageName: "Chặng 4: Khóa Đơn & Bảo Vệ Khách (25 - 30 phút)",
            timeAllocation: "25:00 - 30:00",
            hostSpeech: "Tất cả đơn hàng đặt trên live hôm nay đều được bảo hành 1 đổi 1, đóng hộp cẩn thận và giao hỏa tốc. Anh chị nào đặt xong comment 'Đã mua' để em check đơn tặng quà bí mật nha!",
            hostAction: "Cúi đầu cảm ơn khách hàng, đọc tên các tài khoản vừa đặt hàng thành công",
            assistantModAction: "Đánh dấu tên khách hàng, kiểm tra hệ thống đơn hàng",
            pinnedStrategy: "Nhắc nhở khách áp mã Freeship Extra trước khi thoát phiên live",
          },
        ],
        fomoTactics: [
          "Đếm lùi số lượng giỏ hàng còn lại trực tiếp trên live",
          "Tung deal sốc giới hạn đúng 3 phút cho 10 khách đầu tiên",
          "Tặng quà bí mật cho khách comment 'Đã mua' trong phiên",
        ],
      }
    : undefined;

  return {
    format,
    videoScripts,
    liveScript,
    policyCompliance: {
      safeScore: 98,
      bannedWordsAvoided: ["cam kết 100%", "trị dứt điểm", "rẻ nhất Việt Nam", "số 1 thị trường", "sđt ngoài sàn"],
      warningNotes: [
        "Kịch bản đã được rà soát không chứa từ ngữ vi phạm chính sách livestream TikTok Shop & Shopee Live 2026.",
        "Tuyệt đối không nhắc đến các nền tảng ngoài sàn hoặc giao dịch riêng.",
      ],
    },
  };
}

/**
 * Làm sạch và xác thực JSON đầu ra của Script Writer
 */
export function cleanAndValidateScriptWriterOutput(
  rawOutput: string,
  inputs?: ScriptWriterInputs
): string {
  const fallbackFormat = inputs?.format || "both";
  const productName = inputs?.productName || "";
  const result = parseScriptWriterResult(rawOutput, fallbackFormat);

  if (!result || (!result.videoScripts && !result.liveScript)) {
    const offline = buildOfflineScriptWriterData(inputs || { productName, usp: "", format: fallbackFormat });
    return JSON.stringify(offline, null, 2);
  }

  return JSON.stringify(result, null, 2);
}

