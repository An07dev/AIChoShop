"use client";

import Link from "next/link";
import {
  Calculator,
  ShieldAlert,
  Video,
  MessageSquareWarning,
  Megaphone,
  Presentation,
  ArrowRight,
  Cpu,
  Layers,
  Flame,
  Send,
  Share2,
  Sparkles,
  HeartHandshake,
  PackageCheck,
  TrendingUp,
  Target,
  Camera,
  MessageSquareCheck,
} from "lucide-react";

export default function ToolsPage() {
  const toolStages = [
    {
      stage: "Giai đoạn 1: Chuẩn bị & Tài chính",
      description: "Xác định biên độ lợi nhuận và nghĩa vụ thuế trước khi nhập hàng.",
      tools: [
        {
          id: "product-validator",
          name: "AI Thẩm Định Sản Phẩm Trend & Rủi Ro",
          description: "Chấm điểm tiềm năng 1-100, bóc tách rủi ro chôn vốn, cước cân nặng ẩn và tính biên lợi nhuận trước khi nhập.",
          icon: <TrendingUp size={32} className="text-amber-500" />,
          color: "bg-amber-50 border-amber-100 hover:border-amber-300",
          isFree: false,
        },
        {
          id: "pricing-calculator",
          name: "Tính Giá Bán Sản Phẩm",
          description: "Công cụ tính giá bán tối ưu (Markup) dựa trên % phí sàn, % ads, và lợi nhuận mong muốn thực tế.",
          icon: <Calculator size={32} className="text-emerald-500" />,
          color: "bg-emerald-50 border-emerald-100 hover:border-emerald-300",
          isFree: true,
        },
        {
          id: "tax-calculator",
          name: "Tính Thuế TMĐT",
          description: "Tự động tính thuế GTGT và TNCN phải nộp, giảm rủi ro bị cơ quan thuế truy thu pháp lý.",
          icon: <Calculator size={32} className="text-rose-500" />,
          color: "bg-rose-50 border-rose-100 hover:border-rose-300",
          isFree: true,
        }
      ]
    },
    {
      stage: "Giai đoạn 2: Tối ưu SEO & Phủ sóng",
      description: "Đăng sản phẩm chuẩn thuật toán Sàn để lên Top 1 tìm kiếm tự nhiên.",
      tools: [
        {
          id: "competitor-miner",
          name: "AI Đọc Vị Đối Thủ & Săn Tử Huyệt",
          description: "Bóc tách review 1-3 sao cay đắng của đối thủ, tìm vũ khí USP độc quyền và kịch bản video dìm hàng văn minh.",
          icon: <Target size={32} className="text-rose-500" />,
          color: "bg-rose-50 border-rose-100 hover:border-rose-300",
          isFree: false,
        },
        {
          id: "photo-prompter",
          name: "AI Prompt Chụp Ảnh Studio & Mẫu Ảo",
          description: "Tạo 5 bộ prompt tiếng Anh chuẩn Midjourney v6 / Flux.1 tiết kiệm hàng chục triệu tiền thuê mẫu và studio.",
          icon: <Camera size={32} className="text-violet-500" />,
          color: "bg-violet-50 border-violet-100 hover:border-violet-300",
          isFree: false,
        },
        {
          id: "vision-listing",
          name: "AI Phân Tích Ảnh (Vision)",
          description: "Upload ảnh sản phẩm, AI tự động quét nhận diện và sinh toàn bộ tiêu đề SEO, bảng thông số và bài mô tả AIDA.",
          icon: <Sparkles size={32} className="text-amber-500" />,
          color: "bg-amber-50 border-amber-100 hover:border-amber-300",
          isFree: false,
        },
        {
          id: "seo-optimizer",
          name: "AI Tối Ưu SEO",
          description: "Sinh 5 tiêu đề giật tít và mô tả chứa hashtag chuẩn thuật toán tìm kiếm.",
          icon: <Megaphone size={32} className="text-blue-500" />,
          color: "bg-blue-50 border-blue-100 hover:border-blue-300",
          isFree: true,
        },
        {
          id: "title-spinner",
          name: "Nhân Bản Chống Spam",
          description: "Xào nấu tiêu đề, mô tả để lập nhiều shop clone đánh du kích mà không bị phạt trùng lặp.",
          icon: <Cpu size={32} className="text-teal-500" />,
          color: "bg-teal-50 border-teal-100 hover:border-teal-300",
          isFree: false,
        }
      ]
    },
    {
      stage: "Giai đoạn 3: Marketing & Kéo Traffic",
      description: "Đổ lượng truy cập (Traffic) khổng lồ vào Shop bằng Quảng cáo Ads, Video ngắn và KOC.",
      tools: [
        {
          id: "ad-copy",
          name: "AI Mẫu Quảng Cáo Ads",
          description: "Tạo ma trận từ khóa đấu thầu Shopee Ads và 5 câu Hook 3s kèm Caption kéo giỏ hàng TikTok Spark Ads.",
          icon: <Flame size={32} className="text-orange-500" />,
          color: "bg-orange-50 border-orange-100 hover:border-orange-300",
          isFree: false,
        },
        {
          id: "script-writer",
          name: "AI Kịch Bản Video/Live",
          description: "Chỉ cần nhập tên sản phẩm, AI sẽ sinh ra kịch bản quay TikTok Reels với 3s đầu Hook gắt, giữ chân khách.",
          icon: <Video size={32} className="text-purple-500" />,
          color: "bg-purple-50 border-purple-100 hover:border-purple-300",
          isFree: false,
        },
        {
          id: "koc-planner",
          name: "AI Lập Kế Hoạch KOC",
          description: "Nhập ngân sách, AI sẽ phân bổ chiến lược nên thuê KOC hay KOL, ước tính tỷ lệ chuyển đổi ROI thực tế nhất.",
          icon: <Presentation size={32} className="text-indigo-500" />,
          color: "bg-indigo-50 border-indigo-100 hover:border-indigo-300",
          isFree: false,
        },
        {
          id: "video-repurposer",
          name: "AI Biến Video Thành 5 Kênh",
          description: "Chuyển 1 kịch bản video TikTok thành 5 định dạng: Facebook Group Seeding, Fanpage Ads, Carousel Album, Review SEO & Zalo OA.",
          icon: <Share2 size={32} className="text-pink-500" />,
          color: "bg-pink-50 border-pink-100 hover:border-pink-300",
          isFree: false,
        }
      ]
    },
    {
      stage: "Giai đoạn 4: Vận hành, Remarketing & Xử lý rủi ro",
      description: "Chăm sóc khách hàng, kéo khách cũ mua lại và giải quyết các biến cố vi phạm.",
      tools: [
        {
          id: "objection-killer",
          name: "Bẻ Gãy Từ Chối & Chốt Đơn 1-1",
          description: "Xử lý mượt mà câu nói 'đắt quá', 'suy nghĩ thêm' trong tin nhắn chat sàn, chốt khách ngay trong 3 phút.",
          icon: <MessageSquareCheck size={32} className="text-emerald-500" />,
          color: "bg-emerald-50 border-emerald-100 hover:border-emerald-300",
          isFree: false,
        },
        {
          id: "policy-checker",
          name: "AI Soi Từ Cấm & Vi Phạm Sàn",
          description: "Rà soát từ cấm theo luật kiểm duyệt TikTok Shop, Shopee, chấm điểm rủi ro và tự động viết lại bản an toàn.",
          icon: <ShieldAlert size={32} className="text-red-500" />,
          color: "bg-red-50 border-red-100 hover:border-red-300",
          isFree: true,
        },
        {
          id: "chat-broadcast",
          name: "Chat Broadcast & Zalo",
          description: "Soạn tin nhắn Shopee Chat Broadcast dưới 350 ký tự và Zalo OA đắc nhân tâm kéo khách mua lại không bị spam.",
          icon: <Send size={32} className="text-emerald-500" />,
          color: "bg-emerald-50 border-emerald-100 hover:border-emerald-300",
          isFree: false,
        },
        {
          id: "review-replier",
          name: "AI Xử Lý Khủng Hoảng",
          description: "Paste đánh giá 1 sao của khách vào, AI sẽ viết đoạn phản hồi 'đắc nhân tâm' nhất để xoa dịu và cứu uy tín.",
          icon: <MessageSquareWarning size={32} className="text-amber-500" />,
          color: "bg-amber-50 border-amber-100 hover:border-amber-300",
          isFree: true,
        },
        {
          id: "appeal-generator",
          name: "AI Kháng Nghị Vi Phạm",
          description: "Tự động viết đơn xin mở khóa shop/sản phẩm với văn phong thuyết phục, bám sát chính sách của Sàn.",
          icon: <ShieldAlert size={32} className="text-rose-500" />,
          color: "bg-rose-50 border-rose-100 hover:border-rose-300",
          isFree: false,
        },
        {
          id: "unboxing-card",
          name: "AI Thư Cảm Ơn Nhét Hộp",
          description: "Thiết kế thiệp cảm ơn 2 mặt: Cài khiên chắn chống 1 sao, kéo đánh giá 5 sao kèm ảnh và kết nối Zalo OA an toàn.",
          icon: <HeartHandshake size={32} className="text-pink-500" />,
          color: "bg-pink-50 border-pink-100 hover:border-pink-300",
          isFree: false,
        },
        {
          id: "anti-return-nudge",
          name: "AI Chống Hoàn Hàng COD",
          description: "Ma trận kịch bản cứu đơn: Nhắc khách nhận hàng, cứu đơn khi khách bấm hủy và xử lý khi shipper báo giao thất bại.",
          icon: <PackageCheck size={32} className="text-teal-500" />,
          color: "bg-teal-50 border-teal-100 hover:border-teal-300",
          isFree: false,
        }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
          Hành Trình Tự Động Hóa E-commerce
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-3xl">
          Lộ trình 19 công cụ được sắp xếp từ A-Z theo vòng đời kinh doanh của một nhà bán hàng chuyên nghiệp. Khám phá và sử dụng theo thứ tự để đạt hiệu quả cao nhất.
        </p>
      </div>

      <div className="space-y-8 sm:space-y-12">
        {toolStages.map((stage, stageIndex) => (
          <div key={stageIndex} className="relative">
            {/* Stage Header */}
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900 dark:bg-brand text-white font-black flex items-center justify-center shrink-0 shadow-md text-sm sm:text-base">
                {stageIndex + 1}
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">{stage.stage}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">{stage.description}</p>
              </div>
            </div>

            {/* Tools Grid for this stage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pl-0 sm:pl-14">
              {stage.tools.map((tool) => (
                <Link href={`/tools/${tool.id}`} key={tool.id} className="block group">
                  <div className={`h-full p-4 sm:p-6 rounded-2xl border transition-all duration-300 bg-white dark:bg-slate-900 ${tool.color} dark:border-slate-800 shadow-xs hover:shadow-md flex flex-col relative overflow-hidden`}>
                    
                    {!tool.isFree ? (
                      <div className="absolute top-0 right-0">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-bl-xl shadow-xs flex items-center gap-1 uppercase tracking-wider">
                          <span>👑</span> VIP TOOL
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-0 right-0">
                        <div className="bg-emerald-500 text-white text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-bl-xl shadow-xs flex items-center gap-1 uppercase tracking-wider">
                          FREE TOOL
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3 sm:mb-4 mt-1 sm:mt-2">
                      <div className="p-2.5 sm:p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-100 dark:border-slate-700/60 group-hover:scale-105 transition-transform">
                        {tool.icon}
                      </div>
                    </div>
                    
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 flex-1">
                      {tool.description}
                    </p>
                    
                    <div className="flex items-center text-xs sm:text-sm font-bold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mt-auto">
                      Mở công cụ <ArrowRight size={15} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Connecting line to next stage (except last one, visible only on sm+) */}
            {stageIndex < toolStages.length - 1 && (
              <div className="hidden sm:block absolute left-5 top-12 bottom-0 h-[calc(100%+3rem)] w-0.5 bg-slate-200 dark:bg-slate-800 -z-10"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
