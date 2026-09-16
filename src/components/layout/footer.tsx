import Link from "next/link";
import { MapPin, Mail, Phone, Bot } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 mt-12 rounded-2xl overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-br from-blue-600 to-violet-600 p-2 rounded-xl group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all">
                <Bot className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
                AIChoShop
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Nền tảng tiên phong cung cấp giải pháp Trí tuệ nhân tạo (AI) giúp các nhà bán hàng Shopee, TikTok, Facebook tự động hóa quy trình, x10 hiệu suất và đột phá doanh thu.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white mb-4">Hệ Sinh Thái</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/learn" className="text-sm hover:text-blue-400 transition-colors">Masterclass Bán Hàng AI</Link>
              </li>
              <li>
                <Link href="/tools" className="text-sm hover:text-blue-400 transition-colors">Kho Mini-Tools AI (19 Tools)</Link>
              </li>
              <li>
                <Link href="/tools/unboxing-card" className="text-sm hover:text-blue-400 transition-colors">AI Thư Cảm Ơn Nhét Hộp</Link>
              </li>
              <li>
                <Link href="/tools/anti-return-nudge" className="text-sm hover:text-blue-400 transition-colors">AI Chống Hoàn Hàng COD</Link>
              </li>
              <li>
                <Link href="/tools/chat-broadcast" className="text-sm hover:text-blue-400 transition-colors">Chat Broadcast & Zalo</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-white mb-4">Hỗ Trợ Khách Hàng</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm hover:text-blue-400 transition-colors">Trung tâm trợ giúp</Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-blue-400 transition-colors">Chính sách bảo mật</Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-blue-400 transition-colors">Điều khoản dịch vụ</Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-blue-400 transition-colors">Hướng dẫn thanh toán</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white mb-4">Liên Hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <MapPin size={18} className="shrink-0 text-blue-400" />
                <span>123 Đường Công Nghệ, Phường Đổi Mới, Quận Sáng Tạo, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <Phone size={18} className="shrink-0 text-blue-400" />
                <span>Hotline: 0123 456 789</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <Mail size={18} className="shrink-0 text-blue-400" />
                <span>Email: hotro@aichoshop.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} AIChoShop. Bản quyền thuộc về AIChoShop Việt Nam.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Thanh toán an toàn qua</span>
            <div className="h-6 px-2 bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold text-slate-400">SePay</div>
            <div className="h-6 px-2 bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold text-slate-400">VietQR</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
