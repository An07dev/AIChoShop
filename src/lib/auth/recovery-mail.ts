export function recoveryMailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RECOVERY_EMAIL_FROM?.trim();
  const origin = new URL(process.env.APP_URL || "http://localhost:3000");
  if (!apiKey || !from || !process.env.APP_URL || origin.username || origin.password || (origin.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname)))) throw new Error("RECOVERY_EMAIL_NOT_CONFIGURED");
  return { apiKey, from, origin: origin.origin };
}
export async function sendRecoveryMail(email: string, token: string, requestId: string) {
  const config = recoveryMailConfig();
  const link = `${config.origin}/reset-password#${token}`;
  const result = await fetch("https://api.resend.com/emails", {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `password-reset/${requestId}` },
    body: JSON.stringify({ from: config.from, to: [email], subject: "Đặt lại mật khẩu AIChoShop", text: `Bạn đã yêu cầu đặt lại mật khẩu AIChoShop.\n\nMở link sau trong 15 phút (chỉ dùng một lần):\n${link}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này. Không chia sẻ link với người khác.` }),
  });
  if (!result.ok) throw new Error("RECOVERY_EMAIL_DELIVERY_FAILED");
}
