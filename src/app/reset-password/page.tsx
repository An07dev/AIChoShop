import { RecoveryForm } from "@/components/auth/RecoveryForm";
export const metadata = { title: "Đặt lại mật khẩu | AIChoShop", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default function ResetPasswordPage() { return <RecoveryForm reset />; }
