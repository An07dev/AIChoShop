"use server";
import { limitAuthAttempts } from "@/lib/auth/rate-limit";
import { requestRecovery, consumeRecovery } from "@/lib/auth/recovery";
import { recoveryMailConfig } from "@/lib/auth/recovery-mail";

export async function requestPasswordRecovery(form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, message: "Vui lòng nhập email hợp lệ." };
  try { recoveryMailConfig(); } catch { return { success: false, message: "Chức năng gửi email khôi phục chưa được cấu hình. Vui lòng liên hệ quản trị viên." }; }
  try {
    await limitAuthAttempts("recovery", email);
    await requestRecovery(email);
    return { success: true, message: "Nếu email thuộc tài khoản hợp lệ, bạn sẽ nhận được link đặt lại mật khẩu. Hãy kiểm tra cả thư rác." };
  } catch { return { success: false, message: "Chưa thể tiếp nhận yêu cầu. Vui lòng thử lại sau 15 phút." }; }
}
export async function resetPasswordWithLink(form: FormData) {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (password !== form.get("confirmPassword")) return { success: false, message: "Hai mật khẩu chưa khớp." };
  try {
    await limitAuthAttempts("recovery", `token:${token.slice(0, 64)}`);
    await consumeRecovery(token, password);
    return { success: true, message: "Đã đổi mật khẩu và đăng xuất các phiên cũ. Bạn có thể đăng nhập lại." };
  } catch { return { success: false, message: "Link đã hết hạn, đã sử dụng hoặc mật khẩu không hợp lệ. Mật khẩu cần 6–256 ký tự." }; }
}
