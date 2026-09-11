"use client";

import Link from "next/link";
import { Calculator, ShieldAlert, Video, MessageSquareWarning, Megaphone, Presentation, ArrowRight, Cpu, Layers } from "lucide-react";

export default function ToolsPage() {
  const toolStages = [
    {
      stage: "Giai đoạn 1: Chuẩn bị & Tài chính",
      description: "Xác định biên độ lợi nhuận và nghĩa vụ thuế trước khi nhập hàng.",
      tools: [
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
      description: "Đổ lượng truy cập (Traffic) khổng lồ vào Shop bằng Video ngắn và KOC.",
      tools: [
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
        }
      ]
    },
    {
      stage: "Giai đoạn 4: Vận hành & Xử lý rủi ro",
      description: "Chăm sóc khách hàng và giải quyết các biến cố (Bị khóa Shop, Rate 1 sao).",
      tools: [
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
        }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Hành Trình Tự Động Hóa E-commerce</h1>
        <p className="text-slate-500 text-lg max-w-3xl">Lộ trình 8 công cụ được sắp xếp từ A-Z theo vòng đời kinh doanh của một nhà bán hàng chuyên nghiệp. Khám phá và sử dụng theo thứ tự để đạt hiệu quả cao nhất.</p>
      </div>

      <div className="space-y-12">
        {toolStages.map((stage, stageIndex) => (
          <div key={stageIndex} className="relative">
            {/* Stage Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center shrink-0 shadow-lg">
                {stageIndex + 1}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{stage.stage}</h2>
                <p className="text-slate-500 text-sm mt-1">{stage.description}</p>
              </div>
            </div>

            {/* Tools Grid for this stage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-14">
              {stage.tools.map((tool) => (
                <Link href={`/tools/${tool.id}`} key={tool.id} className="block group">
                  <div className={`h-full p-6 rounded-2xl border transition-all duration-300 bg-white ${tool.color} shadow-sm hover:shadow-md flex flex-col relative overflow-hidden`}>
                    
                    {!tool.isFree && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm">
                          VIP ONLY
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4 mt-2">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        {tool.icon}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                      {tool.description}
                    </p>
                    
                    <div className="flex items-center text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors mt-auto">
                      Mở công cụ <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Connecting line to next stage (except last one) */}
            {stageIndex < toolStages.length - 1 && (
              <div className="absolute left-5 top-12 bottom-0 h-[calc(100%+3rem)] w-0.5 bg-slate-200 -z-10"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
