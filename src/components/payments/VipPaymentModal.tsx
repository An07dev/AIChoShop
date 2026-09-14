"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkPaymentIntentStatus } from "@/app/actions/profile";
import type { PaymentIntentView } from "@/lib/payments/service";

function bankCode(name: string) {
  const value = name.toLowerCase().replace(/\s/g, "");
  const codes: Record<string, string> = { mbbank: "MB", mb: "MB", vietcombank: "VCB", techcombank: "TCB", acb: "ACB", vpbank: "VPB", tpbank: "TPB", bidv: "BIDV", agribank: "VBA", sacombank: "STB", hdbank: "HDB", vib: "VIB", shb: "SHB" };
  return codes[value] || name;
}

const messages: Record<string, string> = {
  PENDING: "Đang chờ ngân hàng xác nhận. Chỉ chuyển khoản một lần, đúng số tiền và nội dung bên dưới.",
  SUCCESS: "Thanh toán thành công. Quyền VIP đã được cập nhật, bao gồm thời hạn gia hạn.",
  REVIEW: "Đã nhận thông báo ngân hàng nhưng cần đối soát. Vui lòng không chuyển thêm tiền cho yêu cầu này.",
  EXPIRED: "Yêu cầu đã hết hạn. Nếu chưa chuyển tiền, hãy đóng và tạo yêu cầu mới. Nếu đã chuyển, hãy liên hệ hỗ trợ kèm mã thanh toán.",
  CANCELLED: "Yêu cầu đã được hủy. Vui lòng không chuyển tiền theo mã này.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem kết quả.",
  NOT_FOUND: "Không tìm thấy yêu cầu thanh toán của tài khoản này.",
};

export function VipPaymentModal({ intent, onClose }: { intent: PaymentIntentView; onClose: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState("PENDING");
  const [notice, setNotice] = useState("");
  const [qrFailed, setQrFailed] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [onClose]);

  useEffect(() => {
    let closed = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const result = await checkPaymentIntentStatus(intent.id);
        if (closed) return;
        setStatus(result.status);
        setNotice("");
        if (result.status === "SUCCESS") { router.refresh(); return; }
        if (["EXPIRED", "CANCELLED", "UNAUTHORIZED", "NOT_FOUND"].includes(result.status)) return;
      } catch {
        if (closed) return;
        setNotice("Chưa kiểm tra được trạng thái. Hệ thống sẽ thử lại; vui lòng không chuyển thêm tiền.");
        if (Date.now() >= new Date(intent.expiresAt).getTime()) { setStatus("EXPIRED"); return; }
      }
      if (!closed) timer = setTimeout(poll, 3000);
    };
    timer = setTimeout(poll, 0);
    return () => { closed = true; clearTimeout(timer); };
  }, [intent.id, intent.expiresAt, router]);

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setNotice("Đã sao chép."); }
    catch { setNotice("Không thể sao chép tự động. Bạn có thể chọn và sao chép nội dung hiển thị."); }
  };
  const qr = `https://img.vietqr.io/image/${encodeURIComponent(bankCode(intent.bankName))}-${encodeURIComponent(intent.accountNumber)}-compact2.png?amount=${intent.amount}&addInfo=${encodeURIComponent(intent.paymentCode)}&accountName=${encodeURIComponent(intent.accountHolder)}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-6" onClick={onClose}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="vip-payment-title" className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xl space-y-5" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4">
          <h2 id="vip-payment-title" className="text-lg font-bold">Thanh toán {intent.planName}</h2>
          <button ref={closeButton} type="button" onClick={onClose} className="rounded-lg border px-3 py-2">Đóng</button>
        </div>
        <p role="status" className="text-sm">{messages[status] || "Đang đối soát thanh toán."}</p>
        {status === "PENDING" && !qrFailed && <Image unoptimized src={qr} alt="QR chuyển khoản cho yêu cầu thanh toán này" width={300} height={300} className="mx-auto rounded-xl" onError={() => setQrFailed(true)} />}
        {qrFailed && status === "PENDING" && <p className="text-sm text-amber-700">Không tải được QR. Bạn có thể chuyển khoản bằng thông tin bên dưới.</p>}
        <dl className="space-y-3 text-sm">
          <div><dt className="text-slate-500">Ngân hàng / Chủ tài khoản</dt><dd className="font-semibold">{intent.bankName} / {intent.accountHolder}</dd></div>
          <div className="flex justify-between gap-3"><div><dt className="text-slate-500">Số tài khoản</dt><dd className="font-mono select-all">{intent.accountNumber}</dd></div><button type="button" onClick={() => copy(intent.accountNumber)}>Sao chép</button></div>
          <div><dt className="text-slate-500">Số tiền</dt><dd className="text-xl font-bold">{intent.amount.toLocaleString("vi-VN")} đ</dd></div>
          <div className="flex justify-between gap-3 rounded-xl bg-amber-50 text-slate-950 p-3"><div><dt>Nội dung chuyển khoản</dt><dd className="font-mono font-bold select-all break-all">{intent.paymentCode}</dd></div><button type="button" onClick={() => copy(intent.paymentCode)}>Sao chép</button></div>
          <div><dt className="text-slate-500">Hạn thanh toán</dt><dd>{new Date(intent.expiresAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} (giờ Việt Nam)</dd></div>
        </dl>
        {notice && <p role="status" className="text-sm text-slate-500">{notice}</p>}
      </div>
    </div>
  );
}
