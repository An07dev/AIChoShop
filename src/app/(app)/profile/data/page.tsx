import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PersonalDataControls } from "./PersonalDataControls";
export default async function PersonalDataPage() {
  if (!await getSessionUser()) redirect("/login");
  return <section className="mx-auto w-full max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
    <h1 className="text-2xl font-bold">Dữ liệu cá nhân và lịch sử</h1>
    <p>Nội dung lịch sử AI được giữ 90 ngày. Lịch sử định giá, thuế và KOC trên thiết bị này được tách theo tài khoản, tối đa 50 mục mỗi công cụ trong 90 ngày.</p>
    <p>Xóa lịch sử sẽ xóa input, output và tóm tắt nội dung đã lưu. Số lượt sử dụng, tài khoản, quyền VIP, tiến độ học và giao dịch thanh toán được giữ nguyên. Một kết quả AI đang xử lý có thể tạo lịch sử mới sau khi bạn xóa.</p>
    <PersonalDataControls />
    <a href="/privacy" className="inline-block text-blue-600 underline">Xem chính sách dữ liệu</a>
  </section>;
}
