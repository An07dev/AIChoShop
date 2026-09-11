import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Crown, BookOpen, Sparkles, Clock, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;
  
  if (!token) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: token },
    select: { name: true, email: true, isVIP: true, createdAt: true }
  });

  if (!user) {
    redirect("/login");
  }

  // Mock data cho giao diện
  const recentActivities = [
    { id: 1, tool: "AI Tối Ưu SEO", action: "Đã tạo 5 tiêu đề ngách cho 'Áo phông nam'", time: "2 giờ trước", status: "success" },
    { id: 2, tool: "AI Kịch Bản Video", action: "Đã tạo kịch bản 15s Tiktok cho 'Son môi'", time: "Hôm qua", status: "success" },
    { id: 3, tool: "Tính Giá Bán", action: "Tính thử giá vốn 50K trên Shopee Mall", time: "Hôm qua", status: "success" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* 1. WELCOME & BANNER */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Chào mừng trở lại, <span className="text-blue-600">{user.name}</span>! 👋
          </h1>
          <p className="text-slate-500 mb-8 max-w-xl">
            Tiếp tục hành trình X10 doanh số của bạn với các công cụ AI và kiến thức thực chiến từ chuyên gia.
          </p>

          <div className="flex flex-wrap gap-4 relative z-10">
            <Link href="/learn" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
              <BookOpen size={18} /> Học tiếp bài 3
            </Link>
            <Link href="/tools" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
              <Sparkles size={18} /> Mở kho công cụ AI
            </Link>
          </div>
        </div>

        <div className="w-full md:w-80 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20 flex flex-col justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${user.isVIP ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                {user.isVIP ? <Crown size={24} className="text-amber-400" /> : <CheckCircle2 size={24} className="text-emerald-400" />}
              </div>
              <h2 className="font-bold text-slate-300">Gói tài khoản</h2>
            </div>
            
            <h3 className="text-3xl font-black mb-1">
              {user.isVIP ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">VIP Pro</span> : 'Free Plan'}
            </h3>
            
            {user.isVIP ? (
              <p className="text-sm text-slate-400 mt-2">Mở khóa toàn bộ tính năng và khóa học. Chúc bạn bùng nổ doanh số!</p>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-slate-400 mb-4">Bạn đang bị giới hạn truy cập công cụ VIP và phần nâng cao của khóa học.</p>
                <Link href="/pricing" className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                  <Crown size={16} /> Nâng cấp VIP ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. KPI / STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Lượt dùng AI hôm nay</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black text-slate-900">12</h4>
              <span className="text-sm font-medium text-slate-400">/ Không giới hạn</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Nội dung đã tạo</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black text-slate-900">45</h4>
              <span className="text-sm font-medium text-slate-400">bản ghi</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-slate-500">Tiến độ khóa học</p>
              <span className="text-sm font-bold text-slate-900">15%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2">
              <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '15%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RECENT ACTIVITY & RECOMMENDED TOOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" /> Hoạt động gần đây
            </h3>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700">Xem tất cả</button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-slate-50 transition-colors flex gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900">{activity.tool}</h4>
                    <span className="text-xs font-medium text-slate-400">{activity.time}</span>
                  </div>
                  <p className="text-sm text-slate-600">{activity.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Công cụ khuyên dùng</h3>
          </div>
          <div className="p-6 space-y-4">
            <Link href="/tools/seo-optimizer" className="block group p-4 border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">AI Tối Ưu SEO</h4>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500">Giật Top 1 tìm kiếm với bộ tiêu đề và hashtag chuẩn thuật toán.</p>
            </Link>
            
            <Link href="/tools/script-writer" className="block group p-4 border border-slate-100 rounded-2xl hover:border-purple-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">AI Kịch Bản Video</h4>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded">VIP</span>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500">Sáng tạo 3s đầu hook cực mạnh giữ chân khách hàng trên TikTok.</p>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
