"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, UserPlus, Crown } from "lucide-react";
import { getUserPlan } from "@/app/actions/user";
import { AuthModal } from "@/components/auth/AuthModal";

export function useToolGate() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVIPModal, setShowVIPModal] = useState(false);

  const checkAccess = async (toolId: string, isVIPOnly: boolean = false) => {
    const plan = await getUserPlan();

    // Nếu Tool yêu cầu VIP
    if (isVIPOnly) {
      if (!plan.isLogged) {
        setShowLoginModal(true);
        return false;
      }
      if (!plan.isVIP) {
        setShowVIPModal(true);
        return false;
      }
      return true;
    }

    // Nếu Tool miễn phí
    if (plan.isLogged) {
      // Đã đăng nhập -> dùng tẹt ga
      return true;
    } else {
      // Ẩn danh -> Dùng 2 lần
      let usages = 0;
      const key = `anon_usages_${toolId}`;
      const storedUsages = localStorage.getItem(key);
      if (storedUsages) {
        usages = parseInt(storedUsages);
      }

      if (usages >= 2) {
        setShowLoginModal(true);
        return false;
      }

      // Tăng bộ đếm
      localStorage.setItem(key, (usages + 1).toString());
      return true;
    }
  };

  const GateModals = () => (
    <>
      <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} initialTab="register" />

      {showVIPModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowVIPModal(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-br from-amber-500 to-yellow-600 p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <Crown size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-white">Tính năng VIP</h3>
            </div>
            <div className="p-8 text-center">
              <p className="text-slate-600 mb-6 font-medium leading-relaxed">
                Đây là công cụ Premium mạnh mẽ. Vui lòng nâng cấp VIP để sử dụng không giới hạn.
              </p>
              <Link href="/pricing" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-amber-500/30 mb-3">
                <Crown size={20} /> Nâng cấp VIP ngay
              </Link>
              <button onClick={() => setShowVIPModal(false)} className="text-slate-400 text-sm font-medium hover:text-slate-600">
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return { checkAccess, GateModals };
}
