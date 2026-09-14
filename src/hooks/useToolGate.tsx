"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Crown } from "lucide-react";
import { getUserPlan } from "@/app/actions/user";
import { AuthModal } from "@/components/auth/AuthModal";

export function useToolGate() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [vipModalReason, setVipModalReason] = useState<"vip_tool" | "limit_reached">("vip_tool");
  const [currentLimit, setCurrentLimit] = useState<number>(12);

  const checkAccess = useCallback(async (toolId: string, isVIPOnly: boolean = false) => {
    const plan = await getUserPlan();

    // Nếu Tool yêu cầu VIP
    if (isVIPOnly) {
      if (!plan.isLogged) {
        setShowLoginModal(true);
        return false;
      }
      if (!plan.isVIP) {
        setVipModalReason("vip_tool");
        setShowVIPModal(true);
        return false;
      }
      return true;
    }

    // Nếu Tool miễn phí
    if (plan.isLogged) {
      if (!plan.isVIP) {
        try {
          const res = await fetch("/api/ai/usage");
          if (res.ok) {
            const data = await res.json();
            if (data.dailyFreeLimit) {
              setCurrentLimit(data.dailyFreeLimit);
            }
            if (data.remainingFree !== null && data.remainingFree !== undefined && data.remainingFree <= 0) {
              setVipModalReason("limit_reached");
              setShowVIPModal(true);
              return false;
            }
          }
        } catch {
          // ignore error
        }
      }
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
  }, []);

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
              <h3 className="text-2xl font-black text-white">
                {vipModalReason === "limit_reached" ? "Hết Lượt Dùng Hôm Nay" : "Tính Năng VIP"}
              </h3>
            </div>
            <div className="p-8 text-center">
              <p className="text-slate-600 mb-6 font-medium leading-relaxed text-sm">
                {vipModalReason === "limit_reached"
                  ? `Tài khoản miễn phí có ${currentLimit} lượt dùng mỗi ngày và bạn đã sử dụng hết lượt hôm nay. Hãy nâng cấp VIP để sử dụng không giới hạn!`
                  : "Đây là công cụ Premium mạnh mẽ. Vui lòng nâng cấp VIP để sử dụng không giới hạn."}
              </p>
              <Link href="/profile#pricing-section" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 py-4 rounded-xl font-black text-lg transition-all shadow-lg shadow-amber-500/30 mb-3">
                <Crown size={20} className="fill-slate-950" /> Nâng cấp VIP ngay
              </Link>
              <button onClick={() => setShowVIPModal(false)} className="text-slate-400 text-sm font-medium hover:text-slate-600 cursor-pointer">
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
