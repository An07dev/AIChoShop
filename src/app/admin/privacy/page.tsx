import { requireAdmin } from "@/lib/auth/session";
import { MaintenanceControls } from "./MaintenanceControls";
export default async function AdminPrivacyPage() {
  await requireAdmin();
  return <section className="max-w-3xl space-y-5 rounded-xl border bg-white p-6"><h1 className="text-2xl font-bold">Bảo trì dữ liệu riêng tư</h1>
    <p>Xóa nội dung input/output và tóm tắt của lịch sử quá 90 ngày; làm sạch ảnh base64 và các trường nhạy cảm trong lịch sử còn hạn; dọn phiên đăng nhập hết hạn, token khôi phục hết hạn và bộ đếm chống lạm dụng cũ. Giữ nguyên số liệu sử dụng, quota, quyền VIP, khóa học, tiến độ và giao dịch.</p>
    <p>Nội dung quá hạn không được cung cấp qua API lịch sử hoặc export. Tác vụ dọn nội dung cũng chạy khi lưu kết quả công cụ; nên cấu hình lệnh bảo trì chạy hàng ngày trên môi trường deploy để dọn cả khi không có người dùng.</p>
    <MaintenanceControls />
    <a href="/privacy" className="block text-blue-600 underline">Chính sách dữ liệu công khai</a>
  </section>;
}
