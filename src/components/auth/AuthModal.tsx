"use client";

import { useState } from "react";
import { User, Lock, Mail, Phone, ArrowRight, X } from "lucide-react";
import { registerUser, loginUser } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

export function AuthModal({ isOpen, onClose, initialTab = "register" }: { isOpen: boolean; onClose: () => void; initialTab?: "login" | "register" }) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    const result = tab === "register" ? await registerUser(formData) : await loginUser(formData);

    if (result.success) {
      router.refresh(); // Refresh để update layout và header
      onClose(); // Đóng modal
    } else {
      setError(result.error || "Có lỗi xảy ra");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button 
            onClick={() => { setTab("login"); setError(""); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${tab === "login" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            Đăng nhập
          </button>
          <button 
            onClick={() => { setTab("register"); setError(""); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${tab === "register" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            Đăng ký
          </button>
          <button onClick={onClose} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-black text-slate-900">
              {tab === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
            </h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              {tab === "login" 
                ? "Đăng nhập để tiếp tục sử dụng công cụ AI." 
                : "Mở khóa khóa học và nhận lượt dùng AI miễn phí."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "register" && (
              <>
                <div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" name="name" required placeholder="Họ và tên của bạn" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="tel" name="phone" required placeholder="Số điện thoại" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" name="email" required placeholder="Email của bạn" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="password" name="password" required minLength={6} placeholder="Mật khẩu (tối thiểu 6 ký tự)" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Đang xử lý..." : (tab === "login" ? "Đăng nhập ngay" : "Tạo tài khoản")}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
