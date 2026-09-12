import Link from "next/link";
import Image from "next/image";
import {
  Bot, Zap, ShieldAlert, Cpu, BarChart, Rocket, CheckCircle2,
  Star, Crown, TrendingUp, ArrowRight, ChevronDown,
  Target, MessageSquare, PenTool, Calculator,
  Search, Copy, Play, Shield, Users, ArrowUpRight, FileText,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { getActiveVipPlans } from "@/lib/vip-plans-server";
import { DEFAULT_VIP_PLANS } from "@/lib/vip-plans";

export const metadata = {
  title: "AIChoShop - Công Cụ AI Miễn Phí Cho Nhà Bán Hàng TMĐT",
  description: "9 công cụ AI miễn phí + Khóa học ứng dụng AI vào bán hàng Shopee, TikTok Shop. Viết SEO, mô tả sản phẩm, tạo kịch bản Reels, tính thuế TMĐT. Dùng thử ngay.",
};

export default async function LandingPage() {
  let vipPlans = [];
  try {
    vipPlans = await getActiveVipPlans();
  } catch (error) {
    console.error("Lỗi khi tải gói VIP trên landing page:", error);
    vipPlans = DEFAULT_VIP_PLANS;
  }

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden landing-page-root">

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="text-white" size={18} />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">AIChoShop</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#tools" className="hover:text-slate-900 transition-colors">Công cụ AI</a>
            <a href="#course" className="hover:text-slate-900 transition-colors">Khóa học</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Bảng giá</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline-flex text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Đăng nhập
            </Link>
            <Link href="/tools" className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-1.5">
              Dùng thử miễn phí <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="pt-28 pb-6 sm:pt-36 sm:pb-10 px-5">
        <div className="max-w-6xl mx-auto">
          {/* Centered headline */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-sm font-semibold text-blue-600 mb-4 tracking-wide uppercase">Nền tảng AI cho nhà bán hàng</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-5 tracking-tight">
              Bán hàng thông minh hơn
              <br />
              với <span className="text-blue-600">8 công cụ AI</span> miễn phí
            </h1>
            <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto leading-relaxed">
              Tự động viết SEO, tạo kịch bản Reels, tính thuế TMĐT, kháng nghị vi phạm.
              Tiết kiệm 50 triệu/tháng chi phí nhân sự.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link href="/tools" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-full font-semibold text-base hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                Dùng thử miễn phí <ArrowUpRight size={16} />
              </Link>
              <Link href="/learn" className="w-full sm:w-auto bg-slate-100 text-slate-700 px-8 py-3.5 rounded-full font-semibold text-base hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                <Play size={16} /> Xem khóa học
              </Link>
            </div>

            {/* Platform logos */}
            <div className="flex items-center justify-center gap-6 flex-wrap opacity-60">
              <span className="text-xs text-slate-400 font-medium">Hỗ trợ đa sàn:</span>
              <span className="text-sm font-bold text-slate-500 tracking-tight">Shopee</span>
              <span className="text-sm font-bold text-slate-500 tracking-tight">TikTok Shop</span>
              <span className="text-sm font-bold text-slate-500 tracking-tight">Lazada</span>
              <span className="text-sm font-bold text-slate-500 tracking-tight">Facebook</span>
            </div>
          </div>

          {/* Dashboard screenshot */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.1)]">
              <Image
                src="/dashboard-mockup.jpg"
                alt="AIChoShop Dashboard — Bảng điều khiển quản lý bán hàng AI"
                width={1400}
                height={788}
                className="rounded-xl w-full"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ──────────────────────────────────────────── */}
      <section className="py-10 px-5 border-y border-slate-100">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-6">
          <div className="text-center flex-1 min-w-[120px]">
            <div className="text-2xl font-extrabold text-slate-900">2,800+</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Seller đang dùng</div>
          </div>
          <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
          <div className="text-center flex-1 min-w-[120px]">
            <div className="text-2xl font-extrabold text-slate-900">8</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Tools AI miễn phí</div>
          </div>
          <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
          <div className="text-center flex-1 min-w-[120px]">
            <div className="text-2xl font-extrabold text-slate-900">27</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Bài học thực chiến</div>
          </div>
          <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
          <div className="text-center flex-1 min-w-[120px]">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-extrabold text-slate-900">4.9</span>
              <Star size={16} className="text-amber-400 fill-amber-400" />
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Đánh giá trung bình</div>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ────────────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-rose-600 mb-3">Vấn đề thường gặp</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
              Bạn có đang gặp những vấn đề này?
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              90% seller TMĐT gặp ít nhất 1 trong 3 vấn đề dưới đây mà không biết.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PainCard
              icon={<ShieldAlert size={22} />}
              iconColor="text-rose-600 bg-rose-50"
              title="Truy thu thuế TMĐT"
              description="Không biết tính thuế GTGT, TNCN. Một ngày bị cơ quan thuế gọi phạt hàng trăm triệu."
              solution="Tool Tính Thuế tự động — chuẩn 100%"
            />
            <PainCard
              icon={<BarChart size={22} />}
              iconColor="text-amber-600 bg-amber-50"
              title="Bán nhiều nhưng không lãi"
              description="Đơn hàng đi ầm ầm nhưng cuối tháng lỗ do phí ẩn, phí hoàn hàng ăn cụt vốn."
              solution="Tool Tính Giá Bán — không bao giờ lỗ"
            />
            <PainCard
              icon={<Cpu size={22} />}
              iconColor="text-blue-600 bg-blue-50"
              title="Nhân bản shop bị quét spam"
              description="Copy tiêu đề/mô tả sang shop mới là bị Shopee, TikTok Shop quét bay ngay lập tức."
              solution="Tool Nhân Bản Chống Spam — unique 100%"
            />
          </div>
        </div>
      </section>

      {/* ── TOOLS — Bento Grid ─────────────────────────────────── */}
      <section id="tools" className="py-20 px-5 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 mb-3">Hoàn toàn miễn phí</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
              9 công cụ AI cho nhà bán hàng
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Mỗi tool giải quyết 1 vấn đề cụ thể. Dùng ngay, không cần đăng ký.
            </p>
          </div>

          {/* Bento Grid — 3 large + 6 small = 9 tools */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Large card 1 */}
            <Link href="/tools/seo-optimizer" className="col-span-2 bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Search size={22} />
                </div>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">PHỔ BIẾN</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1.5">SEO Optimizer</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">Viết tiêu đề, mô tả sản phẩm chuẩn SEO Shopee & TikTok Shop. Tăng traffic tự nhiên, giảm chi phí quảng cáo.</p>
              <span className="text-sm font-semibold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Dùng ngay <ArrowRight size={14} /></span>
            </Link>

            {/* Large card 2 */}
            <Link href="/tools/title-spinner" className="col-span-2 bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
                  <Copy size={22} />
                </div>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">PHỔ BIẾN</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1.5">Nhân Bản Chống Spam</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">Rewrite nội dung 100% unique, lách bộ lọc spam của sàn TMĐT. Mở 10 shop clone mà không lo bị phạt.</p>
              <span className="text-sm font-semibold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Dùng ngay <ArrowRight size={14} /></span>
            </Link>

            {/* Large card 3 */}
            <Link href="/tools/product-description" className="col-span-2 bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <FileText size={22} />
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">HOT & MỚI</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1.5">AI Mô Tả Chuyển Đổi Cao</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">Cấu trúc 6 khối vàng chuẩn Top Seller (Cam kết, Nỗi đau & Giải pháp, USP, Thông số kỹ thuật) giúp x3 tỷ lệ chốt đơn.</p>
              <span className="text-sm font-semibold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Dùng ngay <ArrowRight size={14} /></span>
            </Link>

            {/* Small cards row 2 */}
            <SmallToolCard href="/tools/pricing-calculator" icon={<TrendingUp size={20} />} iconBg="bg-teal-50 text-teal-600" title="Tính Giá Bán" desc="Không bao giờ bán lỗ" />
            <SmallToolCard href="/tools/tax-calculator" icon={<Calculator size={20} />} iconBg="bg-rose-50 text-rose-600" title="Tính Thuế TMĐT" desc="Thuế GTGT, TNCN chuẩn xác" />

            {/* Small cards row 3 */}
            <SmallToolCard href="/tools/script-writer" icon={<PenTool size={20} />} iconBg="bg-amber-50 text-amber-600" title="Viết Kịch Bản" desc="Reels & TikTok viral" />
            <SmallToolCard href="/tools/review-replier" icon={<MessageSquare size={20} />} iconBg="bg-emerald-50 text-emerald-600" title="Trả Lời Đánh Giá" desc="Biến 1★ thành 5★" />
            <SmallToolCard href="/tools/appeal-generator" icon={<Shield size={20} />} iconBg="bg-indigo-50 text-indigo-600" title="Kháng Nghị Vi Phạm" desc="Tỷ lệ thành công 99%" />
            <SmallToolCard href="/tools/koc-planner" icon={<Users size={20} />} iconBg="bg-pink-50 text-pink-600" title="KOC Planner" desc="Brief & đo ROI KOC" />
          </div>

          <div className="text-center mt-10">
            <Link href="/tools" className="inline-flex items-center gap-2 bg-blue-600 text-white px-7 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors">
              Xem tất cả công cụ <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── COURSE ──────────────────────────────────────────────── */}
      <section id="course" className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left — Info */}
            <div>
              <p className="text-sm font-semibold text-blue-600 mb-3">Khóa học thực chiến</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5 leading-tight">
                Ứng dụng AI vào bán hàng
                <br />từ A đến Z
              </h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                27 bài học video HD. Học xong là làm được ngay — không cần biết lập trình,
                không cần kinh nghiệm AI. Kết hợp lý thuyết + thực hành trực tiếp trên 9 tools.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  "Viết tiêu đề SEO Shopee đánh bại đối thủ",
                  "Kịch bản Reels/TikTok viral triệu view",
                  "Nhân bản 10 shop không bị quét spam",
                  "Tính thuế TMĐT chuẩn xác, kháng nghị thành công 99%",
                  "Xây hệ thống bán hàng tự động bằng AI",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                    <span className="text-slate-700 font-medium text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <Link href="/learn" className="bg-blue-600 text-white px-7 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                  Xem khóa học <ArrowUpRight size={16} />
                </Link>
                <span className="text-sm text-slate-400 font-medium">6 bài đầu miễn phí</span>
              </div>
            </div>

            {/* Right — Course modules */}
            <div className="space-y-3">
              {[
                { n: "01", title: "Nền Tảng AI Cho Seller", lessons: 3, free: true },
                { n: "02", title: "Tối Ưu SEO & Nội Dung", lessons: 6, free: true },
                { n: "03", title: "Video Marketing & Quảng Cáo", lessons: 6, free: false },
                { n: "04", title: "Tài Chính & Pháp Lý TMĐT", lessons: 6, free: false },
                { n: "05", title: "Scale & Tự Động Hóa", lessons: 6, free: false },
              ].map((mod) => (
                <div key={mod.n} className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${mod.free ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {mod.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 text-sm">{mod.title}</div>
                    <div className="text-xs text-slate-400">{mod.lessons} bài học</div>
                  </div>
                  {mod.free ? (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">FREE</span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Crown size={10} /> VIP
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 mb-3">Đánh giá từ người dùng</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Seller tin dùng AIChoShop
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReviewCard
              name="Nguyễn Thị Mai"
              role="Seller Shopee • Thời trang"
              initial="M"
              content="Tool SEO giúp mình viết 100 tiêu đề trong 5 phút. Trước phải thuê copywriter 5 triệu/tháng, giờ tự làm hết. Đơn hàng tăng từ 20 lên 150/ngày."
              result="20 → 150 đơn/ngày"
            />
            <ReviewCard
              name="Trần Văn Hùng"
              role="Seller TikTok Shop • Mỹ phẩm"
              initial="H"
              content="Kịch bản Reels từ AI quá chuẩn. Video 15 giây mà lên 2 triệu view, doanh thu tháng tăng gấp 4. Khóa học dễ hiểu, áp dụng được ngay."
              result="Doanh thu x4"
            />
            <ReviewCard
              name="Lê Hoàng Anh"
              role="Seller Shopee • Gia dụng"
              initial="A"
              content="Bị phạt bay 2 shop vì trùng nội dung. Từ khi dùng tool Nhân Bản, mở 8 shop clone mà 0 bị phạt. Tool tính thuế cũng cứu mình khỏi bị truy thu."
              result="8 shop an toàn"
            />
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 mb-3">Bảng giá đơn giản</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
              Bắt đầu miễn phí
            </h2>
            <p className="text-slate-500">Nâng cấp VIP khi bạn muốn mở khóa toàn bộ khóa học.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Gói Tĩnh: Gói Mặc Định Free 0 đ */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="text-sm font-semibold text-slate-400 mb-1">Cơ bản</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">0đ</span>
                  <span className="text-slate-400 text-sm">/mãi mãi</span>
                </div>
                <p className="text-xs text-slate-500 mb-5 min-h-[36px]">
                  Bắt đầu trải nghiệm miễn phí các công cụ AI và bài học cơ bản.
                </p>
                <ul className="space-y-2.5 mb-7">
                  {["9 Tools AI không giới hạn", "6 bài học miễn phí", "Cập nhật tính năng mới", "Hỗ trợ cộng đồng Seller"].map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/register"
                className="block w-full text-center bg-slate-100 text-slate-700 py-3 rounded-full font-semibold hover:bg-slate-200 transition-colors text-sm"
              >
                Tạo tài khoản miễn phí
              </Link>
            </div>

            {/* Danh Sách Gói Cước VIP Cấu Hình API */}
            {vipPlans.map((plan) => {
              const features = Array.isArray(plan.features) ? plan.features : [];
              const isPopular = plan.isPopular;
              const hasDiscount = plan.originalPrice && plan.originalPrice > plan.price;
              const discountPercent = hasDiscount
                ? Math.round((1 - plan.price / plan.originalPrice) * 100)
                : 0;

              if (isPopular) {
                return (
                  <div
                    key={plan.id || plan.slug}
                    className="bg-slate-900 rounded-2xl p-6 sm:p-7 text-white relative border-2 border-blue-500 shadow-xl shadow-blue-500/10 flex flex-col justify-between"
                  >
                    {/* Badge */}
                    <div className="absolute -top-3 right-5 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {plan.tag || "Phổ biến nhất"}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-blue-300 mb-1">{plan.name}</div>
                      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                        <span className="text-3xl sm:text-4xl font-extrabold text-white">
                          {new Intl.NumberFormat("vi-VN").format(plan.price)}đ
                        </span>
                        {hasDiscount && (
                          <span className="text-slate-400 text-sm line-through">
                            {new Intl.NumberFormat("vi-VN").format(plan.originalPrice)}đ
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 mb-2">
                        {plan.period ? (plan.period.startsWith("/") ? plan.period : `/${plan.period}`) : ""}
                      </div>
                      {hasDiscount && (
                        <div className="text-emerald-400 text-xs font-semibold mb-3">
                          Tiết kiệm {discountPercent}%
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mb-5 min-h-[36px]">
                        {plan.desc}
                      </p>
                      <ul className="space-y-2.5 mb-7">
                        {features.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <Link
                        href="/register"
                        className="block w-full text-center bg-blue-600 text-white py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors text-sm shadow-md shadow-blue-600/30"
                      >
                        Nâng cấp {plan.name} →
                      </Link>
                      <p className="text-center text-[11px] text-slate-400 mt-2.5">Hoàn tiền 100% trong 7 ngày</p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={plan.id || plan.slug}
                  className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 relative flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all"
                >
                  {/* Badge */}
                  {plan.tag && (
                    <div className="absolute -top-3 right-5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                      {plan.tag}
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-semibold text-blue-600 mb-1">{plan.name}</div>
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                        {new Intl.NumberFormat("vi-VN").format(plan.price)}đ
                      </span>
                      {hasDiscount && (
                        <span className="text-slate-400 text-sm line-through">
                          {new Intl.NumberFormat("vi-VN").format(plan.originalPrice)}đ
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      {plan.period ? (plan.period.startsWith("/") ? plan.period : `/${plan.period}`) : ""}
                    </div>
                    {hasDiscount && (
                      <div className="text-emerald-600 text-xs font-semibold mb-3">
                        Tiết kiệm {discountPercent}%
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mb-5 min-h-[36px]">
                      {plan.desc}
                    </p>
                    <ul className="space-y-2.5 mb-7">
                      {features.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <Link
                      href="/register"
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-semibold transition-colors text-sm"
                    >
                      Đăng ký {plan.name} →
                    </Link>
                    <p className="text-center text-[11px] text-slate-400 mt-2.5">Hoàn tiền 100% trong 7 ngày</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">Câu hỏi thường gặp</h2>
          <div className="space-y-3">
            <Faq q="Tools AI có thực sự miễn phí không?" a="Có. 9 tools AI cơ bản hoàn toàn miễn phí, không giới hạn lượt sử dụng, không cần nhập thẻ tín dụng." />
            <Faq q="Tôi chưa biết gì về AI, có học được không?" a="Hoàn toàn được. Khóa học thiết kế cho người mới từ số 0. Chỉ cần biết dùng máy tính cơ bản, mỗi bài có video hướng dẫn từng bước." />
            <Faq q="Mua VIP rồi có được hoàn tiền không?" a="Có. Hoàn tiền 100% trong 7 ngày nếu bạn cảm thấy khóa học không phù hợp. Không hỏi lý do." />
            <Faq q="Khóa học có cập nhật không?" a="Có. Khóa học được cập nhật liên tục khi sàn có thuật toán mới. Mua 1 lần, truy cập trọn đời." />
            <Faq q="Hỗ trợ cả Shopee lẫn TikTok Shop?" a="Có. Tất cả tools đều hỗ trợ đa sàn: Shopee, TikTok Shop, Lazada, Facebook Marketplace." />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-5 leading-tight">
            Bắt đầu bán hàng thông minh
            <br />ngay hôm nay
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Dùng thử 8 công cụ AI miễn phí. Không cần thẻ tín dụng, không cam kết.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/tools" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              Dùng thử miễn phí <ArrowUpRight size={16} />
            </Link>
            <Link href="/learn" className="w-full sm:w-auto bg-white/10 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
              Xem khóa học
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* <div className="px-5 max-w-6xl mx-auto pb-6">
        <Footer />
      </div> */}

      {/* Mobile floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-3 z-50 md:hidden">
        <Link href="/tools" className="block w-full bg-blue-600 text-white text-center py-3 rounded-full font-semibold">
          Dùng thử miễn phí →
        </Link>
      </div>
    </div>
  );
}

/* ── Components ────────────────────────────────────────────────── */

function PainCard({ icon, iconColor, title, description, solution }: {
  icon: React.ReactNode; iconColor: string; title: string; description: string; solution: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconColor}`}>{icon}</div>
      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-4">{description}</p>
      <div className="flex items-start gap-2 text-sm text-blue-600 font-semibold">
        <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> {solution}
      </div>
    </div>
  );
}

function SmallToolCard({ href, icon, iconBg, title, desc }: {
  href: string; icon: React.ReactNode; iconBg: string; title: string; desc: string;
}) {
  return (
    <Link href={href} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all group">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>{icon}</div>
      <div className="font-bold text-slate-900 text-sm mb-0.5">{title}</div>
      <div className="text-xs text-slate-400">{desc}</div>
    </Link>
  );
}

function ReviewCard({ name, role, initial, content, result }: {
  name: string; role: string; initial: string; content: string; result: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{content}&rdquo;</p>
      <div className="bg-blue-50 rounded-lg px-3 py-2 mb-4">
        <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-xs">
          <TrendingUp size={14} /> Kết quả: {result}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm">{initial}</div>
        <div>
          <div className="font-semibold text-slate-900 text-sm">{name}</div>
          <div className="text-slate-400 text-xs">{role}</div>
        </div>
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
        <span className="font-semibold text-slate-900 text-sm pr-4">{q}</span>
        <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed -mt-1">{a}</div>
    </details>
  );
}
