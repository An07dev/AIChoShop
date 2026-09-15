"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { requestPasswordRecovery, resetPasswordWithLink } from "@/app/actions/recovery";

export function RecoveryForm({ reset = false }: { reset?: boolean }) {
  const tokenInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  useEffect(() => {
    if (reset) {
      if (window.location.hash && tokenInput.current) tokenInput.current.value = window.location.hash.slice(1);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [reset]);
  return <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
    <section className="w-full max-w-md rounded-2xl bg-white border p-6 shadow-sm space-y-5">
      <h1 className="text-2xl font-bold">{reset ? "Đặt lại mật khẩu" : "Quên mật khẩu"}</h1>
      <p className="text-sm text-slate-600">{reset ? "Link có hiệu lực 15 phút và chỉ dùng được một lần." : "Nhập email của tài khoản để nhận link đặt lại mật khẩu."}</p>
      <form className="space-y-4" onSubmit={async event => {
        event.preventDefault();
        if (pending) return;
        const form = new FormData(event.currentTarget);
        setPending(true);
        try { setResult(await (reset ? resetPasswordWithLink(form) : requestPasswordRecovery(form))); }
        catch { setResult({ success: false, message: "Kết nối bị gián đoạn. Vui lòng thử lại." }); }
        finally { setPending(false); }
      }}>
        {reset ? <>
          <input ref={tokenInput} type="hidden" name="token" />
          <label className="block text-sm font-medium">Mật khẩu mới<input className="mt-1 w-full border rounded-lg p-3" name="password" type="password" autoComplete="new-password" required minLength={6} maxLength={256} /></label>
          <label className="block text-sm font-medium">Nhập lại mật khẩu<input className="mt-1 w-full border rounded-lg p-3" name="confirmPassword" type="password" autoComplete="new-password" required minLength={6} maxLength={256} /></label>
        </> : <label className="block text-sm font-medium">Email<input className="mt-1 w-full border rounded-lg p-3" name="email" type="email" autoComplete="email" required maxLength={254} /></label>}
        <button disabled={pending || (reset && result?.success === true)} className="w-full rounded-lg bg-blue-600 text-white p-3 font-semibold disabled:opacity-50">{pending ? "Đang xử lý…" : reset ? "Lưu mật khẩu mới" : "Gửi yêu cầu"}</button>
      </form>
      {result && <p role="status" className={result.success ? "text-sm text-green-700" : "text-sm text-red-700"}>{result.message}</p>}
      <Link className="block text-sm text-blue-700" href="/login">Quay lại đăng nhập</Link>
    </section>
  </main>;
}
