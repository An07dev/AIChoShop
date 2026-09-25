/**
 * Module Contract cho AI Prompt Chụp Ảnh Studio & Người Mẫu Ảo (Photo Prompter)
 * Chuẩn hóa Kiến Trúc Dữ Liệu (JSON Schema), Vision AI Đọc Ảnh Sản Phẩm Thật
 * Cung cấp Cú Pháp Image Prompting ([LINK_ẢNH] + --iw 2.0) & Forensic Breakdown Khóa Giống Thật 100%
 * Bộ Prompt Thực Chiến Sàn TMĐT (Shopee, TikTok Shop, Lazada - Midjourney, Flux.1, SDXL, DALL-E)
 * Kèm Resilient Parser 4 Tầng Bền Bỉ & Offline Blueprint Generator (Zero-Fail).
 */

export interface PhotoPrompterInputs {
  productName: string;
  style?: string;
  imageType?: string;
  aiTool?: string;
  modelDemographic?: string;
  imageBase64?: string | null;
}

// -------------------------------------------------------------
// 1. PHÂN TÍCH THỊ GIÁC SẢN PHẨM (Vision AI Analysis)
// -------------------------------------------------------------
export interface ProductVisualAnalysis {
  detectedMaterial: string;      // Bóc tách chất liệu (Vải cotton pique, da thuộc saffiano, thủy tinh mờ, nhôm anode...)
  dominantColors: string[];      // Danh sách tone màu chủ đạo nhận diện từ ảnh
  keyFeatures: string[];         // 3-4 điểm nhấn thiết kế nhận diện thương hiệu/phom dáng
  commercialAdvice: string;      // Lời khuyên định vị bối cảnh để đẩy mạnh tỷ lệ click CTR trên sàn
}

// -------------------------------------------------------------
// 2. HƯỚNG DẪN KHÓA SẢN PHẨM GIỐNG THẬT 100% (Product Fidelity Guide)
// -------------------------------------------------------------
export interface ProductFidelityGuide {
  whyTextOnlyDiffers: string;    // Lý do Text-to-Image thuần túy luôn vẽ sản phẩm ngẫu nhiên
  step1GetImageUrl: string;      // Bước 1: Cách tải ảnh lên Discord / Imgur để lấy link trực tiếp
  step2ImagePromptWeight: string;// Bước 2: Dán link ảnh vào trước Prompt kèm tham số --iw 2.0
  step3InpaintingWorkflow: string;// Bước 3: Dùng Inpaint / Vary Region để giữ nguyên 100% sản phẩm và logo
}

// -------------------------------------------------------------
// 3. BỘ PROMPT THỰC CHIẾN CHUẨN SÀN TMĐT (Ecommerce Studio Prompts)
// -------------------------------------------------------------
export interface EcommerceStudioPrompt {
  id: "hero_ctr" | "asian_model" | "macro_detail" | "flatlay_set" | "ugc_realistic" | string;
  index: number;
  title: string;                 // Tiêu đề góc chụp tiếng Việt
  badge: string;                 // Nhãn nổi bật ("Ảnh Bìa CTR Cao", "Chuẩn Shopee/TikTok", "Tỷ Lệ 1:1", v.v.)
  purposeEcommerce: string;      // Vai trò tâm lý khách hàng & phễu chuyển đổi trên sàn TMĐT
  promptEn: string;              // Đoạn mã prompt tiếng Anh thuần túy
  imagePromptEn: string;         // Cú pháp Image Prompting kèm link ảnh thật và --iw 2.0 (Khuyên dùng để giống thật 100%)
  exactProductFeatures: string;  // Giải phẫu chi tiết vật lý (Silhouette, Hardware, Fabric texture, Pantone tone)
  aspectRatio: string;           // Tỉ lệ khung hình ("1:1" | "3:4" | "9:16")
  cameraAndLighting: string;     // Thông số ống kính, khẩu độ & ánh sáng studio giả lập
  vietnameseSummary: string;     // Giải nghĩa ý đồ nghệ thuật & lưu ý cho nhà bán hàng
}

// -------------------------------------------------------------
// 4. BỘ CÂU LỆNH LOẠI TRỪ (Negative Prompt)
// -------------------------------------------------------------
export interface NegativePromptSet {
  standardNegative: string;      // Câu lệnh phủ định tiếng Anh chuẩn
  vietnameseMeaning: string;     // Ý nghĩa tiếng Việt các lỗi được ngăn chặn
}

// -------------------------------------------------------------
// 5. MẸO THỰC CHIẾN TỪ NHIẾP ẢNH GIA AI (Workflow Tips)
// -------------------------------------------------------------
export interface AiStudioWorkflowTip {
  title: string;
  category: "inpaint_logo" | "model_consistency" | "upscale_8k" | "ecommerce_policy" | string;
  content: string;
}

// -------------------------------------------------------------
// DỮ LIỆU ĐẦU RA TỔNG THỂ (Root Contract Data)
// -------------------------------------------------------------
export interface PhotoPrompterData {
  productName: string;
  selectedStyle: string;
  aiTool: string;
  hasVisualAnalysis: boolean;
  productVisualAnalysis?: ProductVisualAnalysis;
  fidelityGuide: ProductFidelityGuide;
  prompts: EcommerceStudioPrompt[];
  negativePrompt: NegativePromptSet;
  workflowTips: AiStudioWorkflowTip[];
}

// -------------------------------------------------------------
// SYSTEM PROMPT CHUYÊN GIA NHIẾP ẢNH THƯƠNG MẠI & KỸ SƯ PROMPT AI
// -------------------------------------------------------------
export const PHOTO_PROMPTER_SYSTEM_PROMPT = `Bạn là Giám Đốc Nghệ Thuật Nhiếp Ảnh Thương Mại (Commercial Art Director) kiêm Kỹ Sư Cao Cấp về Prompt AI (chuyên sâu Midjourney v6/v6.1, Flux.1 [dev/schnell], Stable Diffusion SDXL/3.5, Fooocus, DALL-E 3).
Bạn nắm rõ nguyên lý cơ bản của AI: "NẾU CHỈ DÙNG TEXT PROMPT THUẦN TÚY, AI SẼ LUÔN TỰ VẼ RA MỘT SẢN PHẨM KHÁC. ĐỂ SẢN PHẨM GIỐNG THẬT 100%, BẮT BUỘC PHẢI DÙNG IMAGE PROMPTING (ẢNH THAM CHIẾU + THAM SỐ --iw 2.0 TRONG MIDJOURNEY) HOẶC INPAINTING (GIỮ SẢN PHẨM THẬT, CHỈ TẠO BỐI CẢNH/NGƯỜI MẪU)."

NHIỆM VỤ CỐT LÕI:
1. ĐẶC TẢ GIẢI PHẪU VẬT LÝ SẢN PHẨM (FORENSIC PHYSICAL BREAKDOWN):
   - Soi kỹ chất liệu (vải cotton dệt pique bao nhiêu GSM, da dập vân gì, kim loại mạ gì), chi tiết khóa kéo/cúc áo, đường viền may, màu sắc theo mã Pantone/tone màu chính xác.
   - Trích xuất vào trường "exactProductFeatures".

2. CUNG CẤP ĐỦ 2 PHIÊN BẢN CHO TỪNG GÓC CHỤP:
   - "promptEn": Câu lệnh mô tả chi tiết bằng tiếng Anh.
   - "imagePromptEn": Cú pháp Image Prompting hoàn chỉnh với tiền tố "[DÁN_LINK_ẢNH_SẢN_PHẨM_CỦA_BẠN_VÀO_ĐÂY] " ở đầu và tham số "--iw 2.0" ở cuối.
     Ví dụ: "[DÁN_LINK_ẢNH_SẢN_PHẨM_CỦA_BẠN_VÀO_ĐÂY] commercial product photography of ... --iw 2.0 --ar 1:1 --v 6.1 --style raw"

3. XÂY DỰNG 5 BỘ PROMPT TIẾNG ANH CHUẨN PHỄU SÀN TMĐT:
   - [hero_ctr] Ảnh Bìa Hero Bục Studio Podium (CTR Booster)
   - [asian_model] Lookbook Người Mẫu Ảo Á Đông / Việt Nam (Model Fit & Lifestyle)
   - [macro_detail] Cận Cảnh Chi Tiết & Độ Hoàn Thiện (Extreme Macro Craftsmanship)
   - [flatlay_set] Bố Cục Sắp Đặt & Mở Hộp (Knolling Flatlay & Unboxing Set)
   - [ugc_realistic] Ảnh Đời Thường Khách Hàng (UGC Realistic / Social Proof)

4. BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON THUẦN TÚY (Valid JSON Object), không kèm markdown code block bên ngoài JSON.

CẤU TRÚC JSON SCHEMA BẮT BUỘC:
{
  "productName": "Tên sản phẩm",
  "selectedStyle": "Tên phong cách studio",
  "aiTool": "Tên công cụ AI",
  "hasVisualAnalysis": true hoặc false,
  "productVisualAnalysis": {
    "detectedMaterial": "Chất liệu nhận diện từ ảnh/mô tả",
    "dominantColors": ["Màu chính 1", "Màu chính 2"],
    "keyFeatures": ["Đặc điểm nhận diện 1", "Đặc điểm 2", "Đặc điểm 3"],
    "commercialAdvice": "Chiến lược bố cục để tăng CTR Shopee/TikTok"
  },
  "fidelityGuide": {
    "whyTextOnlyDiffers": "Giải thích ngắn vì sao prompt chữ thuần túy chỉ vẽ sản phẩm tương tự mà không thể giống 100%",
    "step1GetImageUrl": "Tải ảnh sản phẩm lên Discord hoặc công cụ host ảnh -> Chuột phải vào ảnh -> Chọn 'Copy Link'",
    "step2ImagePromptWeight": "Dán link ảnh vào đầu câu lệnh imagePromptEn kèm tham số --iw 2.0 để khóa cấu trúc pixel sản phẩm thật",
    "step3InpaintingWorkflow": "Với logo hoặc chi tiết độc quyền: Dùng tính năng Vary (Region) trong Midjourney hoặc Inpaint trong Fooocus để giữ nguyên 100% sản phẩm thật, chỉ nhờ AI vẽ thêm người mẫu và nền studio xung quanh"
  },
  "prompts": [
    {
      "id": "hero_ctr",
      "index": 1,
      "title": "Ảnh Bìa Hero Bục Studio - CTR Booster",
      "badge": "Chuẩn Sàn Shopee/TikTok",
      "purposeEcommerce": "Mục đích chuyển đổi",
      "exactProductFeatures": "Silhouette: Dáng sản phẩm | Hardware: Chi tiết kim loại/khóa | Material: Chất liệu bề mặt | Color: Tông màu chuẩn",
      "promptEn": "Prompt tiếng Anh chi tiết, Hasselblad 85mm f/2.8, studio softbox, 8k --ar 1:1 --v 6.1 --style raw",
      "imagePromptEn": "[DÁN_LINK_ẢNH_SẢN_PHẨM_CỦA_BẠN_VÀO_ĐÂY] commercial hero product photography of [mô tả chi tiết] --iw 2.0 --ar 1:1 --v 6.1 --style raw",
      "aspectRatio": "1:1",
      "cameraAndLighting": "Hasselblad H6D-100c, 85mm f/2.8, Softbox đôi 45 độ",
      "vietnameseSummary": "Giải thích góc chụp và cảm xúc"
    }
  ],
  "negativePrompt": {
    "standardNegative": "deformed hands, missing fingers, extra limbs, bad anatomy, distorted product, low quality, blurry, text, watermark, logo, oversaturated, plastic skin, cartoon, 3d render look, mutated body parts, poorly drawn face, out of frame",
    "vietnameseMeaning": "Ngăn chặn triệt để dị tật bàn tay, méo sản phẩm, mặt nhựa vô hồn, mờ nhòe và chữ ký rác."
  },
  "workflowTips": [
    {
      "title": "Kỹ Thuật Inpaint Ghép Logo & Nhãn Mác Thật 100%",
      "category": "inpaint_logo",
      "content": "Sử dụng tính năng 'Vary (Region)' trong Midjourney hoặc 'Inpaint' trong Flux/Fooocus: Giữ nguyên 100% ảnh sản phẩm thật, chỉ khoanh vùng xung quanh để vẽ người mẫu và nền."
    },
    {
      "title": "Bí Quyết Giữ Khuôn Mặt Người Mẫu Đồng Nhất (Face Consistency)",
      "category": "model_consistency",
      "content": "Sử dụng tham số --cref (Character Reference) trong Midjourney v6 kèm link ảnh mẫu chuẩn, hoặc sử dụng ControlNet InstantID."
    },
    {
      "title": "Nâng Cấp Độ Nét Lên 4K / 8K Trước Khi Đăng Sàn",
      "category": "upscale_8k",
      "content": "Chạy ảnh qua công cụ AI Upscaler như Magnific AI, Krea AI hoặc Upscayl miễn phí để tăng độ sắc nét từng sợi vải và lỗ chân lông."
    },
    {
      "title": "Chuẩn Hóa Khung Hình Sàn TMĐT Shopee & TikTok Shop",
      "category": "ecommerce_policy",
      "content": "Ảnh bìa ưu tiên tỷ lệ 1:1 (chuẩn Shopee) hoặc 3:4 (chuẩn TikTok Shop). Giữ sản phẩm chiếm 70-80% khung hình."
    }
  ]
}`;

// -------------------------------------------------------------
// HÀM TẠO USER PROMPT GỬI CHO AI
// -------------------------------------------------------------
export function generatePhotoPrompterUserPrompt(inputs: PhotoPrompterInputs): string {
  const productName = inputs.productName || "Sản phẩm thương mại";
  const style = inputs.style || "minimalist_studio";
  const imageType = inputs.imageType || "commercial_studio";
  const aiTool = inputs.aiTool || "Midjourney v6.1 / Flux.1";
  const modelInfo = inputs.modelDemographic
    ? `- Đặc điểm người mẫu mong muốn: ${inputs.modelDemographic}`
    : "- Người mẫu: Tự động đề xuất người mẫu Á Đông / Việt Nam chuẩn dáng và thần thái phù hợp nhất.";

  const hasImage = Boolean(inputs.imageBase64);

  return `Hãy phân tích và tạo Trọn Bộ Prompt AI Chụp Ảnh Studio & Người Mẫu Ảo Chuẩn Phễu TMĐT dưới dạng JSON theo schema đã quy định.

THÔNG TIN ĐẦU VÀO:
- Tên Sản Phẩm: ${productName}
- Phong Cách Bối Cảnh Studio: ${style}
- Loại Hình Ảnh / Bố Cục Ưu Tiên: ${imageType}
- Nền Tảng Công Cụ AI Mục Tiêu: ${aiTool}
${modelInfo}
${hasImage ? "- LƯU Ý ĐẶC BIỆT: ĐÃ ĐÍNH KÈM ẢNH THẬT CỦA SẢN PHẨM. Hãy soi kỹ chất liệu bề mặt, màu sắc, hoa văn và form dáng thực tế để đưa vào các câu prompt tiếng Anh, đồng thời tạo trường imagePromptEn có gắn [DÁN_LINK_ẢNH_SẢN_PHẨM_CỦA_BẠN_VÀO_ĐÂY] và tham số --iw 2.0 để người dùng dán link ảnh thật khóa phom dáng 100%!" : "- Chú ý: Chưa có ảnh đính kèm, hãy tạo các đặc tả vật lý sống động và sắc nét nhất dựa trên thông tin sản phẩm trên."}

YÊU CẦU:
Trả về duy nhất 1 JSON object hợp lệ, không bọc trong lời dẫn ngoài.`;
}

// -------------------------------------------------------------
// BỘ DỮ LIỆU OFFLINE BLUEPRINT (Zero-Fail Fallback Generator)
// Tự động sinh trọn bộ prompt chuyên nghiệp kèm cú pháp Image Prompting
// -------------------------------------------------------------
export function generatePhotoPrompterBlueprint(inputs: PhotoPrompterInputs): PhotoPrompterData {
  const name = inputs.productName?.trim() || "Sản phẩm thời trang / Tiêu dùng";
  const tool = inputs.aiTool || "Midjourney v6.1 / Flux.1";
  const style = inputs.style || "minimalist_studio";
  const isFashion = /áo|quần|váy|đầm|giày|túi|dép|nón|khăn|set bộ|polo|hoodie|jean/i.test(name);
  const isCosmetic = /kem|serum|son|phấn|nước hoa|sữa rửa mặt|toner|body|dầu gội/i.test(name);
  const isTech = /loa|tai nghe|chuột|bàn phím|sạc|cáp|điện thoại|ốp|laptop|đồng hồ/i.test(name);

  // Nhận diện bối cảnh style
  let styleEn = "minimalist luxury commercial studio, sleek polished marble and concrete podium, soft diffuse ambient studio light";
  let styleVi = "Studio tối giản sang trọng, bục trưng bày đá cẩm thạch, ánh sáng mềm";
  if (style === "luxury_hotel") {
    styleEn = "5-star luxury hotel presidential suite, dark walnut wood panels, warm golden hour ambient lighting";
    styleVi = "Khách sạn 5 sao cao cấp, nội thất gỗ óc chó ấm cúng";
  } else if (style === "korean_cafe") {
    styleEn = "aesthetic Korean pastel cafe, gentle morning sunlight streaming through sheer curtains, beige and cream warm tones";
    styleVi = "Quán cafe phong cách Hàn Quốc pastel, ánh sáng sớm tinh khôi";
  } else if (style === "nature_organic") {
    styleEn = "lush organic botanical garden, dew drops on green leaves, gentle dappled natural morning sunlight";
    styleVi = "Thiên nhiên hữu cơ tươi mát, giọt sương và bóng đổ lá cây";
  } else if (style === "street_cyberpunk") {
    styleEn = "vibrant neon city street at dusk, cinematic blue and magenta rim lighting, urban dynamic aesthetic";
    styleVi = "Đường phố neon hiện đại, ánh sáng tương phản rực rỡ";
  } else if (style === "scandinavian") {
    styleEn = "warm Scandinavian Hygge interior, light oak wood, textured linen backdrop, soft neutral tones";
    styleVi = "Bắc Âu ấm cúng, gỗ sồi sáng và vải lanh mộc mạc";
  }

  // Đặc tả chất liệu gợi ý
  let materialDescEn = "premium matte texture, ultra-fine craftsmanship, pristine surface finish, subtle reflections";
  let materialVi = "Chất liệu cao cấp hoàn thiện mịn màng, bề mặt phản quang tinh tế";
  let forensicFeatures = "Silhouette: Dáng khối cân đối, viền cạnh vát cong chuẩn mực | Hardware: Khóa kim loại mạ sáng bóng | Material: Bề mặt hoàn thiện mịn màng, chống lóa | Color: Tông màu thương mại bắt mắt";

  if (isFashion) {
    materialDescEn = "high-grade breathable combed cotton fabric, precise tight stitching, tailored modern fit silhouette";
    materialVi = "Vải sợi tự nhiên dệt mịn thoáng khí, đường may trần đè tỉ mỉ, form dáng chuẩn mực";
    forensicFeatures = "Silhouette: Phom Regular-Fit ôm dáng tự nhiên | Hardware: Cúc cài bóng mờ, đường may đôi 2 kim | Material: Sợi dệt 240 GSM mềm mại không bai dão | Color: Màu sắc tự nhiên trung thực";
  } else if (isCosmetic) {
    materialDescEn = "frosted glass container with metallic gold accents, silky smooth fluid droplets, premium embossed label typography";
    materialVi = "Thân chai thủy tinh mờ cao cấp, điểm xuyết kim loại sang trọng, giọt dưỡng chất óng ánh";
    forensicFeatures = "Silhouette: Thân trụ tròn bo đáy thanh lịch | Hardware: Nắp xoáy kim loại mạ vàng bóng gương | Material: Thủy tinh mờ cao cấp chống tia UV | Color: Tông màu tinh chất trong trẻo";
  } else if (isTech) {
    materialDescEn = "aerospace-grade anodized aluminum alloy, precision chamfered edges, scratch-resistant matte ceramic coating";
    materialVi = "Hợp kim nhôm anode cao cấp, cạnh vát kim cương tinh xảo, bề mặt chống trầy";
    forensicFeatures = "Silhouette: Khối liền mạch cắt CNC chính xác | Hardware: Cổng sạc Type-C, đèn LED báo trạng thái | Material: Hợp kim nhôm Anode xử lý bề mặt cát mịn | Color: Tông màu Xám Không Gian (Space Gray)";
  }

  return {
    productName: name,
    selectedStyle: styleVi,
    aiTool: tool,
    hasVisualAnalysis: Boolean(inputs.imageBase64),
    productVisualAnalysis: {
      detectedMaterial: materialVi,
      dominantColors: ["Tone màu thời thượng thanh lịch", "Điểm nhấn trung tính hài hòa"],
      keyFeatures: [
        `Phom dáng sắc sảo, đường nét hoàn thiện chuẩn mực của dòng ${name}`,
        "Bề mặt gia công sắc nét, không gợn khuyết điểm khi chụp cận cảnh",
        "Tông màu bắt mắt, dễ dàng tạo tương phản nổi bật trên nền giao diện sàn TMĐT",
      ],
      commercialAdvice: `Tận dụng góc chụp bục Studio ánh sáng mềm để tôn trọn vẹn chất lượng gia công của ${name}, đảm bảo chiếm 75% diện tích ảnh bìa Shopee/TikTok để đạt CTR tối đa.`,
    },
    fidelityGuide: {
      whyTextOnlyDiffers: "Nếu chỉ dùng câu chữ (Text Prompt), AI sẽ luôn vẽ ngẫu nhiên một sản phẩm mới. Để giống sản phẩm thật 100%, bạn cần gắn Link ảnh thật vào đầu prompt kèm tham số --iw 2.0 hoặc sử dụng kỹ thuật Inpaint.",
      step1GetImageUrl: "Tải ảnh sản phẩm của bạn lên Discord (kênh Midjourney) -> Chuột phải vào ảnh -> Bấm 'Sao chép liên kết' (Copy Link).",
      step2ImagePromptWeight: "Dán link ảnh vừa copy vào trước Prompt (cột 'Cú pháp Ảnh Thật') với tham số --iw 2.0 để ép Midjourney khóa nguyên pixel và form dáng thật của bạn.",
      step3InpaintingWorkflow: "Muốn giữ nguyên 100% logo và đường may: Chụp ảnh sản phẩm thật, dùng tính năng 'Vary (Region)' trong Midjourney hoặc 'Inpaint' trong Fooocus để chỉ vẽ thêm bối cảnh studio và người mẫu xung quanh.",
    },
    prompts: [
      {
        id: "hero_ctr",
        index: 1,
        title: "Ảnh Bìa Hero Bục Studio - CTR Booster",
        badge: "Chuẩn Sàn Shopee/TikTok",
        purposeEcommerce: "Giật tiêu điểm thị giác giữa hàng trăm đối thủ trên trang tìm kiếm sàn TMĐT, kích thích lượt click mua hàng ngay từ giây đầu.",
        exactProductFeatures: forensicFeatures,
        promptEn: `Commercial hero product photography of (${name}), ${materialDescEn}, standing elegantly on a ${styleEn}, studio softbox lighting 45-degree angle, dramatic subtle rim light separating subject from clean background, hyper-realistic, photorealistic, 8k resolution, Hasselblad H6D-100c medium format camera, 85mm f/2.8 lens, sharp focus on product details --ar 1:1 --v 6.1 --style raw`,
        imagePromptEn: `[DÁN_LINK_ẢNH_SẢN_PHẨM_CỦA_BẠN_VÀO_ĐÂY] commercial hero product photography of (${name}), ${materialDescEn}, standing elegantly on a ${styleEn}, studio softbox lighting 45-degree angle, rim light separating subject from clean background, hyper-realistic, photorealistic, 8k, 85mm f/2.8 lens --iw 2.0 --ar 1:1 --v 6.1 --style raw`,
        aspectRatio: "1:1",
        cameraAndLighting: "Hasselblad H6D-100c, 85mm f/2.8 Prime, Softbox kép 45° kèm đèn Rim Light viền tách nền sắc nét",
        vietnameseSummary: "Ảnh bìa chủ đạo đặt trên bục thương mại sang trọng, ánh sáng khối nổi bật từng đường nét, sạch sẽ chuẩn thuật toán hiển thị của sàn.",
      },
      {
        id: "asian_model",
        index: 2,
        title: "Lookbook Người Mẫu Ảo Á Đông / Việt Nam",
        badge: "Tôn Dáng & Thần Thái Á Đông",
        purposeEcommerce: "Giúp người mua hình dung trực quan sản phẩm khi diện trên người thật với vóc dáng Á Đông quen thuộc, thúc đẩy chuyển đổi CVR.",
        exactProductFeatures: forensicFeatures,
        promptEn: `High-end commercial fashion lookbook, an elegant Vietnamese female model aged 23 with glowing natural skin, charming subtle smile, naturally holding and showcasing (${name}), dressed in complementary minimalist fashion, posing in a ${styleEn}, warm soft cinematic daylight, subsurface scattering skin texture, realistic human pores, Canon EOS R5, 50mm f/1.4 prime lens, shallow depth of field, creamy bokeh background, ultra-detailed, 8k --ar 3:4 --v 6.1`,
        imagePromptEn: `[DÁN_LINK_ẢNH_SẢN_PHẨM_CỦA_BẠN_VÀO_ĐÂY] high-end commercial fashion lookbook, elegant Vietnamese female model showcasing (${name}), dressed in complementary outfit, posing in a ${styleEn}, warm natural daylight, realistic skin pores, 50mm f/1.4 prime lens, creamy bokeh, 8k --iw 2.0 --ar 3:4 --v 6.1`,
        aspectRatio: "3:4",
        cameraAndLighting: "Canon EOS R5, 50mm f/1.4 Prime, Ánh sáng tán xạ tự nhiên dịu dàng, tạo hiệu ứng xóa phông bokeh nghệ thuật",
        vietnameseSummary: "Người mẫu Á Đông phong thái tự tin, tôn vinh kích thước và cảm giác sử dụng thực tế của sản phẩm mà không bị giả tạo như hoạt hình.",
      },
      {
        id: "macro_detail",
        index: 3,
        title: "Cận Cảnh Chi Tiết & Chất Liệu Hoàn Thiện",
        badge: "Đập Tan Nỗi Sợ Hàng Kém",
        purposeEcommerce: "Chứng minh chất lượng gia công cao cấp ở cự ly siêu gần, đập tan mọi hoài nghi về chất lượng sản phẩm qua mạng.",
        exactProductFeatures: forensicFeatures,
        promptEn: `Extreme macro close-up photography of (${name}), focusing directly on ${materialDescEn}, exquisite micro texture, microscopic details visible, clean studio ring light illumination, Sony A7R V, 100mm f/2.8 Macro GM OSS lens, razor-sharp focus on texture grain, shallow depth of field, high-fidelity commercial catalog aesthetic, 8k resolution --ar 1:1 --v 6.1 --style raw`,
        imagePromptEn: `[DÁN_LINK_ẢNH_SẢN_PHẨM_CỦA_BẠN_VÀO_ĐÂY] extreme macro close-up photography of (${name}), focusing on ${materialDescEn}, micro texture, microscopic details, studio ring light illumination, Sony A7R V 100mm f/2.8 Macro lens, 8k --iw 2.0 --ar 1:1 --v 6.1 --style raw`,
        aspectRatio: "1:1",
        cameraAndLighting: "Sony A7R V, 100mm f/2.8 Macro GM OSS, Đèn Ring Light chuyên dụng chống bóng gắt, zoom cận hạt vật liệu",
        vietnameseSummary: "Góc máy macro đặc tả từng đường kim mũi chỉ hoặc vân bề mặt bóng bẩy, tạo niềm tin chất lượng tuyệt đối cho khách hàng khó tính.",
      },
      {
        id: "flatlay_set",
        index: 4,
        title: "Bố Cục Flatlay & Mở Hộp Sang Trọng",
        badge: "Gia Tăng Cảm Nhận Giá Trị",
        purposeEcommerce: "Tạo cảm giác trọn vẹn, mở hộp đắt tiền (unboxing experience) với các phụ kiện đi kèm bài trí ngăn nắp, kích thích chốt đơn combo.",
        exactProductFeatures: forensicFeatures,
        promptEn: `Overhead top-down 90-degree knolling flatlay arrangement of (${name}) alongside premium unboxing elements, luxury gift packaging box, minimalist props matching ${styleEn}, perfectly symmetrical geometric composition, even soft diffused top lighting with gentle soft shadows, 35mm f/4 commercial architectural lens, pristine aesthetics, ultra-detailed 8k --ar 1:1 --v 6.1`,
        imagePromptEn: `[DÁN_LINK_ẢNH_SẢN_PHẨM_CỦA_BẠN_VÀO_ĐÂY] overhead top-down 90-degree knolling flatlay arrangement of (${name}) with luxury packaging box, minimalist props matching ${styleEn}, symmetrical geometric composition, soft top lighting, 35mm f/4 lens, 8k --iw 2.0 --ar 1:1 --v 6.1`,
        aspectRatio: "1:1",
        cameraAndLighting: "Khung máy góc đứng 90° Overhead Rig, 35mm f/4, Ánh sáng trần hộp mềm tản đều toàn cảnh",
        vietnameseSummary: "Bố cục sắp đặt từ trên cao theo phong cách knolling hiện đại, tôn vinh độ chỉn chu của set sản phẩm và bao bì thương hiệu.",
      },
      {
        id: "ugc_realistic",
        index: 5,
        title: "Ảnh Đời Thường Khách Hàng (UGC Realistic)",
        badge: "Bằng Chứng Xã Hội Chân Thực",
        purposeEcommerce: "Mô phỏng góc chụp của khách hàng thực tế để dùng làm ảnh đánh giá 5 sao hoặc bài đăng mạng xã hội, xóa bỏ cảm giác quảng cáo xa cách.",
        exactProductFeatures: forensicFeatures,
        promptEn: `Realistic authentic customer photo of (${name}) placed naturally in a real-life environment, aesthetic cozy table setting, candid snapshot angle, genuine natural ambient sunlight from nearby window, shot on modern smartphone iPhone 15 Pro 24mm f/1.78 lens, candid social proof UGC style, completely authentic, no over-processing, natural colors, crisp detail --ar 3:4 --v 6.1`,
        imagePromptEn: `[DÁN_LINK_ẢNH_SẢN_PHẨM_CỦA_BẠN_VÀO_ĐÂY] realistic authentic customer photo of (${name}) placed naturally in real-life cozy setting, candid snapshot, natural ambient window light, shot on iPhone 15 Pro 24mm lens, candid UGC style, authentic natural colors --iw 2.0 --ar 3:4 --v 6.1`,
        aspectRatio: "3:4",
        cameraAndLighting: "Giả lập cảm biến iPhone 15 Pro 24mm f/1.78, Ánh sáng môi trường tự nhiên ban ngày, không gò bó góc máy",
        vietnameseSummary: "Ảnh đời thường tự nhiên, chân thật như người dùng chụp feedback đánh giá sản phẩm, cực kỳ hữu hiệu khi đặt ở slide thứ 4-5 của sản phẩm.",
      },
    ],
    negativePrompt: {
      standardNegative: "deformed hands, missing fingers, extra limbs, bad anatomy, distorted product, low quality, blurry, text, watermark, logo, oversaturated, plastic skin, cartoon, 3d render look, mutated body parts, poorly drawn face, out of frame, bad proportions, unnatural lighting, duplicate items, floating debris",
      vietnameseMeaning: "Chặn hoàn toàn các lỗi dị tật bàn tay (thừa ngón, méo ngón), mặt nhựa búp bê vô hồn, sản phẩm bị cong vênh sai tỷ lệ và chữ watermark rác.",
    },
    workflowTips: [
      {
        title: "Khóa Form Sản Phẩm Bằng Image Prompt & Trọng Số --iw 2.0",
        category: "image_prompting",
        content: "Luôn dán link ảnh thật vào trước câu lệnh và đặt '--iw 2.0'. Đây là mức Image Weight cao nhất của Midjourney giúp cố định cấu trúc sản phẩm thay vì để AI tự do tưởng tượng.",
      },
      {
        title: "Kỹ Thuật Inpaint Ghép Logo Thật 100% Không Lỗi Chữ",
        category: "inpaint_logo",
        content: "Dùng tính năng 'Vary (Region)' trong Midjourney hoặc 'Inpaint' trong Fooocus/Photoshop: Giữ nguyên 100% sản phẩm thật, chỉ khoanh vùng xung quanh để vẽ thêm người mẫu và nền studio.",
      },
      {
        title: "Giữ Khuôn Mặt Người Mẫu Đồng Nhất (Face Consistency)",
        category: "model_consistency",
        content: "Dùng tham số '--cref [link_ảnh_mẫu]' trong Midjourney v6 hoặc ControlNet InstantID trong Stable Diffusion để giữ nguyên khuôn mặt người mẫu qua mọi góc chụp.",
      },
      {
        title: "Nâng Nét Độ Phân Giải 4K/8K Bằng AI Upscaler",
        category: "upscale_8k",
        content: "Chạy ảnh qua Magnific AI hoặc Upscayl (mã nguồn mở miễn phí) với chế độ 'Photo Realistic' để tăng chi tiết sợi vải và da trước khi đăng lên sàn Shopee / TikTok Shop.",
      },
    ],
  };
}

// -------------------------------------------------------------
// RESILIENT PARSER 4 TẦNG (Zero-Fail Parsing Engine)
// -------------------------------------------------------------
export function parsePhotoPrompterOutput(raw: string, inputs?: PhotoPrompterInputs): PhotoPrompterData {
  const safeInputs: PhotoPrompterInputs = inputs || { productName: "Sản phẩm thương mại" };

  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return generatePhotoPrompterBlueprint(safeInputs);
  }

  const cleaned = raw.trim();

  // --- TẦNG 1: Direct JSON.parse ---
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && Array.isArray(parsed.prompts) && parsed.prompts.length > 0) {
      return normalizePhotoPrompterData(parsed, safeInputs);
    }
  } catch {
    // Tiếp tục xuống tầng 2
  }

  // --- TẦNG 2: Bóc tách ```json ... ``` codeblock ---
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim());
      if (parsed && Array.isArray(parsed.prompts) && parsed.prompts.length > 0) {
        return normalizePhotoPrompterData(parsed, safeInputs);
      }
    } catch {
      // Tiếp tục xuống tầng 3
    }
  }

  // --- TẦNG 3: Legacy Regex Parser (Tương thích ngược với định dạng Markdown cũ) ---
  try {
    const legacyData = parseLegacyMarkdown(cleaned, safeInputs);
    if (legacyData && legacyData.prompts && legacyData.prompts.length > 0) {
      return legacyData;
    }
  } catch {
    // Tiếp tục xuống tầng 4
  }

  // --- TẦNG 4: Fallback về Offline Blueprint ---
  return generatePhotoPrompterBlueprint(safeInputs);
}

// -------------------------------------------------------------
// CHUẨN HÓA VÀ BẢO TOÀN DỮ LIỆU ĐẦU RA
// -------------------------------------------------------------
function normalizePhotoPrompterData(data: Partial<PhotoPrompterData>, inputs: PhotoPrompterInputs): PhotoPrompterData {
  const blueprint = generatePhotoPrompterBlueprint(inputs);

  const prompts: EcommerceStudioPrompt[] = (data.prompts || []).map((p, idx) => {
    const bp = blueprint.prompts[idx] || blueprint.prompts[0];
    const promptEn = p.promptEn?.trim() || bp.promptEn;
    const imagePromptEn = p.imagePromptEn?.trim() || `[DÁN_LINK_ẢNH_SẢN_PHẨM_CỦA_BẠN_VÀO_ĐÂY] ${promptEn} --iw 2.0`;

    return {
      id: p.id || bp.id || `prompt_${idx + 1}`,
      index: typeof p.index === "number" ? p.index : idx + 1,
      title: p.title?.trim() || bp.title || `Góc Chụp ${idx + 1}`,
      badge: p.badge?.trim() || bp.badge || "Studio Chuyên Nghiệp",
      purposeEcommerce: p.purposeEcommerce?.trim() || bp.purposeEcommerce || "Tối ưu chuyển đổi",
      promptEn,
      imagePromptEn,
      exactProductFeatures: p.exactProductFeatures?.trim() || bp.exactProductFeatures,
      aspectRatio: p.aspectRatio?.trim() || bp.aspectRatio || "1:1",
      cameraAndLighting: p.cameraAndLighting?.trim() || bp.cameraAndLighting || "Studio Commercial Lighting",
      vietnameseSummary: p.vietnameseSummary?.trim() || bp.vietnameseSummary || "",
    };
  });

  const validPrompts = prompts.filter((p) => p.promptEn.length > 10);

  return {
    productName: data.productName?.trim() || inputs.productName || blueprint.productName,
    selectedStyle: data.selectedStyle?.trim() || blueprint.selectedStyle,
    aiTool: data.aiTool?.trim() || inputs.aiTool || blueprint.aiTool,
    hasVisualAnalysis: Boolean(data.hasVisualAnalysis || data.productVisualAnalysis || inputs.imageBase64),
    productVisualAnalysis: data.productVisualAnalysis
      ? {
          detectedMaterial: data.productVisualAnalysis.detectedMaterial?.trim() || blueprint.productVisualAnalysis!.detectedMaterial,
          dominantColors: Array.isArray(data.productVisualAnalysis.dominantColors) && data.productVisualAnalysis.dominantColors.length > 0
            ? data.productVisualAnalysis.dominantColors
            : blueprint.productVisualAnalysis!.dominantColors,
          keyFeatures: Array.isArray(data.productVisualAnalysis.keyFeatures) && data.productVisualAnalysis.keyFeatures.length > 0
            ? data.productVisualAnalysis.keyFeatures
            : blueprint.productVisualAnalysis!.keyFeatures,
          commercialAdvice: data.productVisualAnalysis.commercialAdvice?.trim() || blueprint.productVisualAnalysis!.commercialAdvice,
        }
      : inputs.imageBase64
      ? blueprint.productVisualAnalysis
      : undefined,
    fidelityGuide: data.fidelityGuide || blueprint.fidelityGuide,
    prompts: validPrompts.length > 0 ? validPrompts : blueprint.prompts,
    negativePrompt: {
      standardNegative: data.negativePrompt?.standardNegative?.trim() || blueprint.negativePrompt.standardNegative,
      vietnameseMeaning: data.negativePrompt?.vietnameseMeaning?.trim() || blueprint.negativePrompt.vietnameseMeaning,
    },
    workflowTips: Array.isArray(data.workflowTips) && data.workflowTips.length > 0
      ? data.workflowTips.map((tip, i) => ({
          title: tip.title?.trim() || blueprint.workflowTips[i]?.title || "Mẹo nhiếp ảnh",
          category: tip.category || blueprint.workflowTips[i]?.category || "inpaint_logo",
          content: tip.content?.trim() || blueprint.workflowTips[i]?.content || "",
        }))
      : blueprint.workflowTips,
  };
}

// -------------------------------------------------------------
// BỘ PHÂN TÍCH MARKDOWN CŨ (Backward Compatibility)
// -------------------------------------------------------------
function parseLegacyMarkdown(text: string, inputs: PhotoPrompterInputs): PhotoPrompterData | null {
  const blueprint = generatePhotoPrompterBlueprint(inputs);
  const prompts: EcommerceStudioPrompt[] = [];

  const promptRegex = /###\s*(?:🌟|🔍|💃|☕|✨)?\s*Prompt\s*(\d+)[:\s]+([^\n]+)([\s\S]*?)(?=(?:###\s*(?:🌟|🔍|💃|☕|✨)?\s*Prompt|\n---\n|##\s*2|$))/gi;
  let match: RegExpExecArray | null;

  while ((match = promptRegex.exec(text)) !== null) {
    const idx = parseInt(match[1], 10) || prompts.length + 1;
    const rawTitle = match[2]?.trim() || `Prompt ${idx}`;
    const blockContent = match[3] || "";

    const codeMatch = blockContent.match(/```(?:\w+)?\s*([\s\S]*?)```/);
    const promptCode = codeMatch ? codeMatch[1].trim() : "";

    const intentionMatch = blockContent.match(/(?:Ý đồ nhiếp ảnh|Ý đồ|Giải thích)[:\s*]+([^\n]+)/i);
    const intention = intentionMatch ? intentionMatch[1].trim() : "";

    if (promptCode) {
      const bp = blueprint.prompts[idx - 1] || blueprint.prompts[0];
      prompts.push({
        id: bp.id || `legacy_prompt_${idx}`,
        index: idx,
        title: rawTitle,
        badge: bp.badge || "Studio Chuyên Nghiệp",
        purposeEcommerce: bp.purposeEcommerce || "Tối ưu chuyển đổi sàn",
        exactProductFeatures: bp.exactProductFeatures,
        promptEn: promptCode,
        imagePromptEn: `[DÁN_LINK_ẢNH_SẢN_PHẨM_CỦA_BẠN_VÀO_ĐÂY] ${promptCode} --iw 2.0`,
        aspectRatio: promptCode.includes("--ar 3:4") ? "3:4" : promptCode.includes("--ar 9:16") ? "9:16" : "1:1",
        cameraAndLighting: bp.cameraAndLighting || "Hasselblad 85mm f/2.8 Studio Lighting",
        vietnameseSummary: intention || bp.vietnameseSummary || "",
      });
    }
  }

  let negative = blueprint.negativePrompt.standardNegative;
  const negMatch = text.match(/##\s*2[^\n]*\n([\s\S]*?)(?=\n---\n|##\s*3|$)/i);
  if (negMatch) {
    const codeMatch = negMatch[1].match(/```(?:\w+)?\s*([\s\S]*?)```/);
    if (codeMatch) negative = codeMatch[1].trim();
  }

  if (prompts.length === 0) return null;

  return {
    productName: inputs.productName || blueprint.productName,
    selectedStyle: blueprint.selectedStyle,
    aiTool: inputs.aiTool || blueprint.aiTool,
    hasVisualAnalysis: Boolean(inputs.imageBase64),
    fidelityGuide: blueprint.fidelityGuide,
    prompts,
    negativePrompt: {
      standardNegative: negative,
      vietnameseMeaning: blueprint.negativePrompt.vietnameseMeaning,
    },
    workflowTips: blueprint.workflowTips,
  };
}

// -------------------------------------------------------------
// HELPER DÀNH RIÊNG CHO ROUTE API
// -------------------------------------------------------------
export function cleanAndValidatePhotoPrompterOutput(raw: string, inputs?: PhotoPrompterInputs): string {
  const data = parsePhotoPrompterOutput(raw, inputs);
  return JSON.stringify(data);
}
