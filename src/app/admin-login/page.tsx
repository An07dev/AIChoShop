"use client";

import { useState } from "react";
import { loginAdmin } from "./actions";
import { ShieldAlert, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    try {
      const result = await loginAdmin(formData);
      if (result?.error) setError(result.error);
      else if (result?.success) {
        router.replace("/admin");
        router.refresh();
      }
    } catch {
      setError("Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 admin-root">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Admin Khu Vực Mật</h1>
          <p className="text-slate-500 mt-2">Đăng nhập bằng tài khoản có quyền quản trị.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-bold text-slate-700 mb-2">Email quản trị</label>
            <input id="admin-email" name="email" type="email" autoComplete="username" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Mật khẩu Admin
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                name="password"
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-medium"
                placeholder="Nhập mật khẩu..."
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm font-medium text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center"
          >
            {loading ? "Đang xác thực..." : "Đăng nhập Hệ thống"}
          </button>
        </form>
      </div>
    </div>
  );
}
