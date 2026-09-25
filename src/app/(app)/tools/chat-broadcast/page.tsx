"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  MessageSquare,
  Gift,
  Store,
  Tag,
  AlertCircle,
  Clock,
  Send,
  Crown,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ChatBroadcastOutput } from "@/components/tools/ChatBroadcastOutput";
import { TextDots } from "@/components/ui/text-dots";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

import { SAMPLE_BROADCAST_DATA, parseChatBroadcastResult } from "@/lib/chat-broadcast/contract";

export interface ScenarioItem {
  id: string;
  label: string;
  shortLabel: string;
  desc: string;
  tip: string;
  category: "hot" | "retention" | "product" | "care";
}

export interface ScenarioGroup {
  id: "hot" | "retention" | "product" | "care";
  title: string;
  badge: string;
  scenarios: ScenarioItem[];
}

export const SCENARIO_GROUPS: ScenarioGroup[] = [
  {
    id: "hot",
    title: "🔥 Chốt Đơn Gấp & Kích Cầu Nóng",
    badge: "Chuyển Đổi Nhanh",
    scenarios: [
      {
        id: "cart_abandoned",
        label: "🛒 Nhắc giỏ hàng bỏ quên (Chưa thanh toán 1-7 ngày)",
        shortLabel: "🛒 Giỏ hàng",
        desc: "Tặng voucher freeship / mã giảm giá riêng đẩy khách chốt đơn giỏ hàng đang chờ",
        tip: "Hiệu quả cao nhất khi gửi sau 2-6 tiếng từ lúc khách bỏ giỏ hàng, kèm giới hạn 24h.",
        category: "hot",
      },
      {
        id: "mega_sale",
        label: "⚡ Siêu Sale Sàn / Mega Day (Ngày đôi, Payday, 15 giữa tháng)",
        shortLabel: "⚡ Siêu Sale",
        desc: "Thông báo ngày hội mua sắm, nhắc lưu trước mã độc quyền trước giờ G",
        tip: "Gửi trước 12-24h so với giờ mở bán để khách kịp bỏ hàng vào giỏ và lưu voucher.",
        category: "hot",
      },
      {
        id: "flash_sale",
        label: "⏰ Flash Sale Giờ Vàng (Số lượng giới hạn <50 suất)",
        shortLabel: "⏰ Flash Sale",
        desc: "Tạo áp lực khan hiếm và cấp bách cực cao, giá sốc chỉ trong vài giờ",
        tip: "Nhấn mạnh số lượng có hạn (chỉ 30-50 suất) để kích hoạt tâm lý sợ bỏ lỡ (FOMO).",
        category: "hot",
      },
      {
        id: "live_invite",
        label: "🔴 Mời xem Livestream (Deal độc quyền 1K & Voucher 50%)",
        shortLabel: "🔴 Livestream",
        desc: "Kéo traffic khách ruột vào phiên Live tối nay, giữ chân khách săn quà",
        tip: "Bật mí 1 phần quà bí mật hoặc mã 50% chỉ tung trên sóng trực tiếp phiên Live.",
        category: "hot",
      },
      {
        id: "clearance",
        label: "📦 Xả kho thanh lý / Cuối mùa (Giảm sâu 50-70%)",
        shortLabel: "📦 Xả kho",
        desc: "Cơ hội cuối săn hàng chính hãng giá kịch sàn trước khi hết mẫu/size",
        tip: "Nêu rõ lý do xả kho đón đợt hàng mới để tăng tính chân thật và kích thích mua gom.",
        category: "hot",
      },
      {
        id: "back_in_stock",
        label: "📦 Hàng hot về lại / Restock (Đã có hàng sau thời gian cháy hàng)",
        shortLabel: "📦 Restock hàng",
        desc: "Thông báo hàng hot hoặc size/màu khan hiếm vừa cập bến kho cho khách đã chờ",
        tip: "Nhấn mạnh số lượng đợt này về có hạn để kích hoạt mua ngay kẻo hết lần 2.",
        category: "hot",
      },
    ],
  },
  {
    id: "retention",
    title: "💎 Chăm Sóc Khách Quen & Tăng Tần Suất Mua (LTV)",
    badge: "Khách Thân Thiết",
    scenarios: [
      {
        id: "loyalty_voucher",
        label: "🎁 Tri ân khách cũ tặng voucher độc quyền (VIP Care)",
        shortLabel: "🎁 Tri ân VIP",
        desc: "Gửi lời cảm ơn chân thành từ shop và tặng mã riêng tư không công khai",
        tip: "Xưng hô thân mật, nhấn mạnh đây là món quà riêng chỉ gửi cho khách đã từng ủng hộ.",
        category: "retention",
      },
      {
        id: "repurchase",
        label: "🔄 Nhắc mua lại hàng tiêu hao (Đến chu kỳ bổ sung)",
        shortLabel: "🔄 Hàng tiêu hao",
        desc: "Ước tính khách đã dùng gần hết mỹ phẩm, bỉm sữa, gia dụng, đồ ăn...",
        tip: "Nhắc khách kiểm tra lượng dùng ở nhà và đặt sớm để không bị gián đoạn sinh hoạt.",
        category: "retention",
      },
      {
        id: "win_back",
        label: "🌿 Đánh thức khách ngủ đông (>60-90 ngày chưa mua lại)",
        shortLabel: "🌿 Khách ngủ đông",
        desc: "Hỏi thăm ấm áp, giới thiệu cải tiến mới và tặng deal Welcome Back",
        tip: "Tuyệt đối không chào mời thô bạo. Hãy bắt đầu bằng sự quan tâm và lắng nghe.",
        category: "retention",
      },
      {
        id: "vip_upgrade",
        label: "👑 Chúc mừng sinh nhật & Nâng hạng thành viên VIP",
        shortLabel: "👑 Sinh nhật VIP",
        desc: "Tặng voucher sinh nhật bất ngờ, đặc quyền VIP không điều kiện",
        tip: "Món quà sinh nhật nên có tính ứng dụng cao hoặc miễn phí ship không giới hạn giá trị.",
        category: "retention",
      },
      {
        id: "holiday_wishes",
        label: "🎊 Chúc mừng Lễ, Tết & Quà tri ân đặc biệt (Tết, 8/3, 20/10, Giáng sinh...)",
        shortLabel: "🎊 Lễ/Tết tri ân",
        desc: "Gửi lời chúc ấm áp vào dịp lễ hội kèm món quà lì xì may mắn để gắn kết tình cảm",
        tip: "Tập trung 80% lời chúc chân thành, 20% là món quà tri ân mang ý nghĩa may mắn.",
        category: "retention",
      },
    ],
  },
  {
    id: "product",
    title: "🚀 Đón Đầu Hàng Mới & Tăng Tương Tác (Upsell & Minigame)",
    badge: "Tăng Giá Trị Đơn",
    scenarios: [
      {
        id: "new_arrival",
        label: "✨ Ra mắt sản phẩm / BST mới (Đặc quyền Early Bird)",
        shortLabel: "✨ Hàng mới về",
        desc: "Ưu tiên khách ruột sở hữu mẫu mới nhất với giá dùng thử siêu hời",
        tip: "Nhấn mạnh khách cũ là những người đầu tiên được trải nghiệm mẫu mới này.",
        category: "product",
      },
      {
        id: "cross_sell",
        label: "🎯 Mua kèm deal sốc / Bán chéo phụ kiện ăn ý (Add-on Deal)",
        shortLabel: "🎯 Bán chéo phụ kiện",
        desc: "Gợi ý phụ kiện, đồ phối hợp hoàn hảo với sản phẩm khách đã mua",
        tip: "Chỉ gợi ý sản phẩm thực sự hữu ích và có tính tương thích cao với món đồ cũ.",
        category: "product",
      },
      {
        id: "minigame_gift",
        label: "🎁 Minigame tương tác & Nhận quà bí mật 0Đ (Tăng tương tác 2 chiều)",
        shortLabel: "🎁 Minigame 0Đ",
        desc: "Mời khách tham gia đoán số / câu hỏi nhận quà 0Đ hoặc voucher khủng",
        tip: "Kích thích khách nhắn tin phản hồi để mở khóa hội thoại 2 chiều, tăng tỷ lệ phản hồi chat.",
        category: "product",
      },
    ],
  },
  {
    id: "care",
    title: "🛡️ Hậu Mãi, Vận Chuyển & Xử Lý Sự Cố",
    badge: "Hậu Mãi & Đơn",
    scenarios: [
      {
        id: "review_5star",
        label: "⭐ Chăm sóc sau nhận hàng & Kích hoạt đánh giá 5 sao",
        shortLabel: "⭐ Đánh giá 5 sao",
        desc: "Hỏi thăm kiện hàng, hướng dẫn sử dụng và tặng voucher cho feedback có tâm",
        tip: "Hỏi xem đơn hàng có gặp vấn đề gì không trước, cam kết bảo hành 1:1 tận nơi.",
        category: "care",
      },
      {
        id: "delivery_failed",
        label: "🚚 Hỗ trợ đơn giao không thành công (Hẹn shipper giao lại)",
        shortLabel: "🚚 Cứu đơn shipper",
        desc: "Cứu đơn khi khách bận chưa nghe máy, tránh bị hoàn đơn về kho",
        tip: "Cung cấp số bưu cục hoặc hướng dẫn khách nhắn lại giờ rảnh để điều phối shipper.",
        category: "care",
      },
      {
        id: "order_tracking",
        label: "🚚 Xác nhận đơn hàng & Dặn dò nhận hàng (Giảm tỷ lệ bom/hủy hàng)",
        shortLabel: "🚚 Xác nhận đơn",
        desc: "Báo khách kiện hàng đã đóng gói cẩn thận, dặn dò đồng kiểm và lưu ý điện thoại nhận hàng",
        tip: "Tạo cảm giác an tâm tuyệt đối, chủ động dặn khách giữ máy để tỷ lệ giao thành công đạt 98%.",
        category: "care",
      },
      {
        id: "complaint_resolution",
        label: "🤝 Xử lý sự cố & Đổi trả 1:1 miễn phí (Biến nguy thành cơ, giữ khách VIP)",
        shortLabel: "🤝 Xử lý sự cố/Đổi trả",
        desc: "Hỗ trợ khách khi gặp sự cố hàng lỗi, vỡ hỏng, thiếu phụ kiện với thái độ cầu thị",
        tip: "Chủ động đề xuất đổi mới tận nhà không mất phí trước khi khách bấm trả hàng hoặc đánh giá xấu.",
        category: "care",
      },
    ],
  },
];

export const SCENARIOS = SCENARIO_GROUPS.flatMap((g) => g.scenarios);

const SAMPLE_DATA = {
  shopName: "Aicho Tech Official Store",
  productName: "Củ sạc nhanh GaN 65W 3 cổng Type-C & Cáp dù siêu bền",
  scenario: "loyalty_voucher",
  offer: "Voucher độc quyền AICHO50K giảm ngay 50.000đ cho đơn từ 200.000đ + Tặng 01 Túi nhung chống sốc đựng sạc cáp, chỉ áp dụng trong 24 giờ",
  channel: "both",
};

const SAMPLE_RESULT = JSON.stringify(SAMPLE_BROADCAST_DATA, null, 2);

const DRAFT_STORAGE_KEY = "aichoshop_chat_broadcast_draft_v1";

export default function ChatBroadcastPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning, showSuccess } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelReasonRef = useRef<"manual" | "timeout" | null>(null);

  // Form states
  const [shopName, setShopName] = useState("");
  const [productName, setProductName] = useState("");
  const [scenario, setScenario] = useState(SCENARIOS[1].id);
  const [offer, setOffer] = useState("");
  const [channel, setChannel] = useState("both");

  const selectedScenarioObj = SCENARIOS.find((s) => s.id === scenario) || SCENARIOS[0];

  // 1. Phục hồi bản nháp từ localStorage khi mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.productName) setProductName(parsed.productName);
        if (parsed.scenario) setScenario(parsed.scenario);
        if (parsed.offer) setOffer(parsed.offer);
        if (parsed.channel) setChannel(parsed.channel);
        if (parsed.result) setResult(parsed.result);
      }
    } catch {
      // Bỏ qua nếu môi trường không cho phép truy cập localStorage
    }
  }, []);

  // 2. Tự động lưu bản nháp vào localStorage (Debounce 500ms + Quota Protection)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (shopName || productName || offer || result) {
          localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
              shopName,
              productName,
              scenario,
              offer,
              channel,
              result,
            })
          );
        }
      } catch {
        // Fallback: nếu quota đầy do result quá lớn, ưu tiên lưu thông tin form
        try {
          localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
              shopName,
              productName,
              scenario,
              offer,
              channel,
              result: "",
            })
          );
        } catch {
          // Bỏ qua nếu Private browsing chặn hoàn toàn
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [shopName, productName, scenario, offer, channel, result]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleCancel = () => {
    cancelReasonRef.current = "manual";
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Nạp lại kết quả từ Lịch Sử hoạt động & đồng bộ ngược lại các trường trên Form
  const handleSelectHistoryOutput = (pastOutput: string) => {
    if (!pastOutput) return;
    setResult(pastOutput);
    setMobileTab("result");

    try {
      const parsed = parseChatBroadcastResult(pastOutput);
      if (parsed) {
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.productName) setProductName(parsed.productName);
        if (parsed.scenario) setScenario(parsed.scenario);
        if (parsed.channel) setChannel(parsed.channel);
      }
    } catch {
      // Bỏ qua nếu dữ liệu lịch sử không ở định dạng parse được
    }

    showSuccess("Đã tải lại kết quả từ lịch sử hoạt động!", "Lịch Sử");
  };

  const handleUseSample = () => {
    setShopName(SAMPLE_DATA.shopName);
    setProductName(SAMPLE_DATA.productName);
    setScenario(SAMPLE_DATA.scenario);
    setOffer(SAMPLE_DATA.offer);
    setChannel(SAMPLE_DATA.channel);
    setResult(SAMPLE_RESULT);
    setMobileTab("result");
    showSuccess("Đã điền dữ liệu mẫu thực chiến!", "Dữ Liệu Mẫu");
  };

  const handleResetForm = () => {
    if (shopName || productName || result) {
      const confirmed = window.confirm("Bạn có chắc chắn muốn làm mới biểu mẫu và kết quả không?");
      if (!confirmed) return;
    }
    setShopName("");
    setProductName("");
    setScenario(SCENARIOS[0].id);
    setOffer("");
    setChannel("both");
    setResult("");
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch { }
    showSuccess("Đã làm mới biểu mẫu!", "Làm Mới");
  };

  const handleGenerate = async () => {
    // Chống double-submit khi đang xử lý
    if (loading) return;

    // Kiểm tra kết nối mạng
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showAiError({
        error: "Không có kết nối mạng Internet. Vui lòng kiểm tra lại đường truyền của bạn.",
      });
      return;
    }

    const hasAccess = await checkAccess("chat-broadcast", false);
    if (!hasAccess) return;

    const trimmedShop = shopName.trim();
    const trimmedProduct = productName.trim();

    if (!trimmedShop) {
      showWarning("Vui lòng nhập tên Gian Hàng / Shop của bạn!", "Thiếu Dữ Liệu");
      return;
    }
    if (!trimmedProduct) {
      showWarning("Vui lòng nhập tên sản phẩm hoặc danh mục cần remarketing!", "Thiếu Dữ Liệu");
      return;
    }
    if (trimmedProduct.length < 2) {
      showWarning("Tên sản phẩm quá ngắn, vui lòng nhập rõ ràng hơn!", "Dữ Liệu Quá Ngắn");
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    cancelReasonRef.current = null;

    setLoading(true);
    setElapsedSeconds(0);
    setResult("");
    setMobileTab("result");

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Timeout 150s bảo đảm hệ thống có đủ thời gian phản hồi an toàn
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        cancelReasonRef.current = "timeout";
        controller.abort();
        showAiError({
          code: "TIMEOUT",
          error: "Yêu cầu soạn tin nhắn đã quá thời gian phản hồi (150s). Vui lòng thử lại sau.",
        });
      }
    }, 150000);

    const payload = {
      tool: "chat-broadcast",
      inputs: {
        shopName: trimmedShop,
        productName: trimmedProduct,
        scenario,
        offer: offer.trim() || "Voucher giảm giá độc quyền dành cho khách cũ",
        channel,
      },
    };

    // Hàm gọi API với cơ chế Auto-Retry 1 lần khi gặp lỗi mạng/server tạm thời
    const callApi = async (isRetry = false): Promise<boolean> => {
      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(payload),
        });

        // Nếu gặp mã lỗi 503 / 429 / 500 tạm thời và chưa từng retry
        if (!response.ok && (response.status === 503 || response.status === 429 || response.status === 500) && !isRetry && !controller.signal.aborted) {
          await new Promise((res) => setTimeout(res, 1500));
          if (!controller.signal.aborted) {
            return await callApi(true);
          }
        }

        const data = await response.json();

        if (data.success && data.data) {
          setResult(data.data);
          setRefreshTrigger((prev) => prev + 1);
          return true;
        } else {
          showAiError(data, "Không thể tạo kịch bản chat broadcast");
          return false;
        }
      } catch (err: any) {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          if (cancelReasonRef.current === "manual") {
            showWarning("Đã dừng quá trình soạn tin nhắn theo yêu cầu của bạn.", "Đã Hủy");
          }
          return false;
        }

        // Nếu lỗi mạng và chưa retry
        if (!isRetry && !controller.signal.aborted) {
          await new Promise((res) => setTimeout(res, 1500));
          if (!controller.signal.aborted) {
            return await callApi(true);
          }
        }

        showAiError({
          code: "NETWORK_ERROR",
          error: "Không thể kết nối đến hệ thống AI. Vui lòng kiểm tra lại mạng hoặc thử lại sau.",
        });
        return false;
      }
    };

    try {
      await callApi(false);
    } finally {
      clearTimeout(timeoutId);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto lg:flex-1 flex flex-col lg:min-h-0 lg:h-full lg:overflow-hidden pb-3">
      {/* Modals chặn quyền nếu có */}
      <GateModals />

      {/* 1. Header Navigation & Quick Actions */}
      <div className="shrink-0 mb-3 space-y-2">
        {/* Mobile Top Bar: Breadcrumb + Badges */}
        <div className="md:hidden flex items-center justify-between pb-1">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand transition-colors"
          >
            <ArrowLeft size={13} /> Kho công cụ AI
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs uppercase tracking-wider">
              <Crown size={10} className="text-amber-600 dark:text-amber-400" />
              VIP
            </span>
            <AiUsageBadge
              tool="chat-broadcast"
              refreshTrigger={refreshTrigger}
              historyOnly
              onSelectOutput={handleSelectHistoryOutput}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            {/* Desktop Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/tools" className="hover:text-emerald-600 transition-colors flex items-center gap-1 text-slate-500">
                <ArrowLeft size={13} /> Kho Công Cụ AI
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Remarketing Khách Cũ</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0">
                <MessageSquare size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    Soạn Tin Nhắn Chat Broadcast
                  </h1>
                  {/* Minimal icon-only reset button: ONLY ON MOBILE */}
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all cursor-pointer shadow-2xs active:scale-90"
                    title="Xóa Form / Đặt lại"
                    aria-label="Xóa Form"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider shrink-0">
                    <Crown size={11} className="text-amber-600 dark:text-amber-400" />
                    VIP TOOL
                  </span>
                </div>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Tạo kịch bản Shopee Chat Broadcast dưới 350 ký tự & Tin nhắn Zalo OA đắc nhân tâm kéo khách mua lại.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved exactly as original) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge
              tool="chat-broadcast"
              refreshTrigger={refreshTrigger}
              onSelectOutput={handleSelectHistoryOutput}
            />
            <button
              type="button"
              onClick={handleUseSample}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
            >
              <Sparkles size={14} /> Dữ Liệu Mẫu
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <RotateCcw size={14} /> Xóa Form
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <MobileToolTabs
        activeTab={mobileTab}
        onChangeTab={setMobileTab}
        hasResult={Boolean(result)}
        loading={loading}
        resultLabel="Tin Nhắn Broadcast"
      />

      {/* Grid 2 Cột: Cuộn độc lập trên Desktop, Chuyển tab trên Mobile */}
      <div className="lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-start lg:items-stretch">
        {/* CỘT TRÁI: FORM NHẬP LIỆU (cuộn độc lập) */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col lg:min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-28 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* Header Khối Form */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                      Thiết Lập Broadcast
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Chuẩn Remarketing
                </span>
              </div>

              {/* 1. KÊNH GỬI TIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Kênh Gửi Tin Nhắn <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel("both")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${channel === "both"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <span>💬 Cả Hai</span>
                    <span className="text-[10px] font-normal opacity-80">Shopee & Zalo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("shopee")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${channel === "shopee"
                      ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <span>🛒 Shopee</span>
                    <span className="text-[10px] font-normal opacity-80">&lt; 350 ký tự</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("zalo")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${channel === "zalo"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <span>📱 Zalo OA</span>
                    <span className="text-[10px] font-normal opacity-80">Thân tình 1:1</span>
                  </button>
                </div>
              </div>

              {/* 2. TÌNH HUỐNG GỬI TIN (18 KỊCH BẢN THỰC CHIẾN) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tình Huống Gửi Tin (Kịch Bản) <span className="text-rose-500">*</span>
                  </label>

                </div>


                {/* Dropdown Phân Nhóm Chuẩn Optgroup */}
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all cursor-pointer leading-relaxed"
                >
                  {SCENARIO_GROUPS.map((group) => (
                    <optgroup key={group.id} label={`${group.title} (${group.scenarios.length})`}>
                      {group.scenarios.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {/* Hộp Giải Thích & Mẹo Chiến Lược Tương Ứng Kịch Bản Được Chọn */}
                {selectedScenarioObj && (
                  <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800/90 text-[11px] space-y-1 animate-in fade-in duration-200">
                    <div className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      🎯 <strong className="text-slate-900 dark:text-white">{selectedScenarioObj.desc}</strong>
                    </div>
                    <div className="text-emerald-700 dark:text-emerald-400 font-medium flex items-start gap-1">
                      <span>💡</span>
                      <span>{selectedScenarioObj.tip}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. TÊN GIAN HÀNG & SẢN PHẨM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tên Shop <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="VD: Aicho Tech Store"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sản Phẩm / Ngành Hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="VD: Củ cáp sạc nhanh GaN 65W"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* 4. ƯU ĐÃI / VOUCHER / QUÀ TẶNG */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>
                    Ưu Đãi / Voucher Kèm Theo <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Lý do khách mở tin</span>
                </label>
                <textarea
                  rows={3}
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  placeholder="VD: Mã GIAM30K giảm 30.000đ cho đơn từ 150k + Tặng 01 cáp sạc ngắn, số lượng chỉ có 50 suất trong 24h..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none"
                />
              </div>

              {/* NÚT SUBMIT + HỦY */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Sparkles size={16} className="animate-spin text-white" />
                      <span>Đang Soạn ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Soạn Tin Nhắn Kéo Khách Cũ
                    </>
                  )}
                </button>

                {loading && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3.5 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                    title="Hủy yêu cầu"
                  >
                    <XCircle size={16} />
                    <span>Hủy</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ (cuộn độc lập) */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col lg:min-h-0 lg:h-full lg:overflow-hidden pb-16 lg:pb-0`}>
          <ChatBroadcastOutput
            result={result}
            loading={loading}
            shopName={shopName}
            channel={channel}
            scenario={scenario}
            onUseSample={handleUseSample}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
          />
        </div>
      </div>

      {/* Mobile Floating Sticky Action Bar (chỉ hiện khi ở tab form trên mobile) */}
      {mobileTab === "form" && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 lg:hidden shadow-lg space-y-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Sparkles size={16} className="animate-spin text-white" />
                <span>Đang Soạn Tin ({elapsedSeconds}s)...</span>
              </>
            ) : (
              <>
                <Send size={16} /> Soạn Tin Nhắn Kéo Khách Cũ
              </>
            )}
          </button>

          {loading && (
            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 text-rose-400 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <XCircle size={14} /> Hủy Yêu Cầu
            </button>
          )}
        </div>
      )}
    </div>
  );
}
