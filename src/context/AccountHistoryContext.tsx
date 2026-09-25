"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { accountStorage, ACTIVE_OWNER_KEY, type HistoryStorage } from "@/lib/history/storage";
const Context = createContext<{ storage: HistoryStorage; owner: string; ready: boolean; fetch: typeof fetch } | null>(null);
export function AccountHistoryProvider({ owner, children }: { owner: string | null; children: React.ReactNode }) {
  const identity = owner ?? "guest";
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let live = true;
    const check = async () => {
      try { const response = await fetch("/api/account/identity", { cache: "no-store" });
        if (!response.ok) { if (live) { setBlocked(true); setNotice("Không xác minh được tài khoản. Hãy tải lại trang."); } return; }
        const data = await response.json();
        if (live && (data.userId ?? "guest") !== identity) { localStorage.setItem(ACTIVE_OWNER_KEY, data.userId ?? "guest"); setBlocked(true); }
        else if (live) { localStorage.setItem(ACTIVE_OWNER_KEY, identity); setReady(true); }
      } catch { if (live) { setBlocked(true); setNotice("Mất kết nối khi xác minh tài khoản. Hãy tải lại trang."); } }
    };
    void check();
    const onStorage = (event: StorageEvent) => { if (event.key === ACTIVE_OWNER_KEY && event.newValue !== identity) setBlocked(true); };
    const onFocus = () => { void check(); };
    window.addEventListener("storage", onStorage); window.addEventListener("focus", onFocus);
    const timer = window.setInterval(check, 30000);
    return () => { live = false; window.removeEventListener("storage", onStorage); window.removeEventListener("focus", onFocus); window.clearInterval(timer); };
  }, [identity]);
  const historyFetch = useCallback<typeof fetch>(async (input, init) => {
    if (blocked) throw Error("Tài khoản đã thay đổi. Hãy tải lại trang.");
    const headers = new Headers(init?.headers); headers.set("X-History-Owner", identity);
    const response = await fetch(input, { ...init, headers, cache: "no-store" });
    if (response.status === 409 && response.headers.get("X-Account-Changed") === "true") { setBlocked(true); throw Error("Tài khoản đã thay đổi. Hãy tải lại trang."); }
    if (!response.ok) { const body = await response.clone().json().catch(() => null); throw Error(body?.error || "Không tải hoặc lưu được lịch sử server."); }
    return response;
  }, [identity, blocked]);
  const storage = useMemo(() => accountStorage({
    getItem: key => (owner ? localStorage : sessionStorage).getItem(key),
    setItem: (key, value) => (owner ? localStorage : sessionStorage).setItem(key, value),
    removeItem: key => (owner ? localStorage : sessionStorage).removeItem(key),
  }, identity, () => !blocked && localStorage.getItem(ACTIVE_OWNER_KEY) === identity, setNotice), [identity, owner, blocked]);
  if (blocked) return <section role="alert" className="m-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-slate-900"><h2 className="font-bold">Cần xác minh lại tài khoản</h2><p className="my-3">{notice || "Bạn đã đăng xuất hoặc đổi tài khoản ở cửa sổ khác. Nội dung cũ đã được ẩn để tránh dùng nhầm dữ liệu."}</p><button className="rounded-lg bg-blue-600 p-3 text-white" onClick={() => window.location.reload()}>Tải lại trang</button></section>;
  return <Context.Provider value={{ storage, owner: identity, ready, fetch: historyFetch }}><div key={identity} className="contents">{notice && <div role="alert" className="m-3 rounded-lg bg-amber-50 p-3 text-amber-900">{notice}</div>}{children}</div></Context.Provider>;
}
const fallbackValue = {
  storage: {
    getItem: (tool: string) => {
      if (typeof window === "undefined") return "[]";
      try {
        return sessionStorage.getItem(`aichoshop:history:v2:guest:${tool}`) || "[]";
      } catch {
        return "[]";
      }
    },
    setItem: (tool: string, text: string) => {
      if (typeof window === "undefined") return;
      try {
        sessionStorage.setItem(`aichoshop:history:v2:guest:${tool}`, text);
      } catch {}
    },
    removeItem: (tool: string) => {
      if (typeof window === "undefined") return;
      try {
        sessionStorage.removeItem(`aichoshop:history:v2:guest:${tool}`);
      } catch {}
    },
  },
  owner: "guest",
  ready: true,
  fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
};

export function useAccountStorage() {
  const value = useContext(Context);
  if (!value) {
    return fallbackValue;
  }
  return value;
}

