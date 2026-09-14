import { SeoError } from "./contract.ts";

export const ANON_LIMIT = 2;
export const WINDOW_MS = 60_000;
export const LEASE_MS = 150_000;
export type UsageState = { successes: number; attempts: number; windowStart: Date; leaseUntil: Date | null };

export function reservePolicy(state: UsageState, anonymous: boolean, now: Date) {
  if (state.leaseUntil && state.leaseUntil > now) throw new SeoError("IN_PROGRESS", "Một yêu cầu đang được xử lý. Vui lòng chờ kết quả.", 409);
  if (anonymous && state.successes >= ANON_LIMIT) throw new SeoError("LOGIN_REQUIRED", "Bạn đã dùng hết 2 lượt miễn phí. Đăng nhập để tiếp tục.", 401);
  const reset = now.getTime() - state.windowStart.getTime() >= WINDOW_MS;
  const attempts = reset ? 0 : state.attempts;
  if (attempts >= (anonymous ? 3 : 6)) throw new SeoError("RATE_LIMITED", "Bạn thao tác quá nhanh. Vui lòng chờ một phút rồi thử lại.", 429);
  return { attempts: attempts + 1, windowStart: reset ? now : state.windowStart, leaseUntil: new Date(now.getTime() + LEASE_MS) };
}
