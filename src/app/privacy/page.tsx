import Link from "next/link";
export const metadata = { title: "Chính sách dữ liệu | AIChoShop" };
export default function PrivacyPage() {
  return <main className="mx-auto max-w-3xl space-y-6 p-6 leading-7">
    <h1 className="text-3xl font-bold">Chính sách dữ liệu</h1>
    <p>Cập nhật ngày 16/09/2026. Chính sách này mô tả cách xử lý dữ liệu của phiên bản hiện tại.</p>
    <h2 className="text-xl font-bold">Dữ liệu gửi đến AI</h2>
    <p>Khi dùng công cụ AI, nội dung bạn nhập và ảnh đính kèm ở công cụ phân tích ảnh được gửi đến model AI do quản trị viên cấu hình: OpenAI, endpoint tương thích hoặc Ollama. Nhà cung cấp xử lý dữ liệu theo chính sách riêng; xóa lịch sử trên AIChoShop không xóa bản sao tại nhà cung cấp. Không nhập mật khẩu, khóa API, thông tin ngân hàng, địa chỉ hay dữ liệu riêng của khách hàng vào công cụ.</p>
    <p>Công cụ tính giá, thuế và tính ngân sách KOC chạy công thức trên trình duyệt. Nếu đăng nhập và lưu kết quả, website có thể lưu một bản lịch sử đã lược bỏ thông tin nhạy cảm trên server.</p>
    <h2 className="text-xl font-bold">Lưu dữ liệu và quyền truy cập</h2>
    <p>Tài khoản lưu email, tên và số điện thoại bạn cung cấp; mật khẩu được băm. Lịch sử input/output được giữ 90 ngày và chỉ cấp cho tài khoản sở hữu qua API. Quản trị viên có quyền nghiệp vụ và người vận hành database có thể truy cập dữ liệu phục vụ hỗ trợ. Ảnh base64 và các khóa chứa mật khẩu/token/email/điện thoại được lược bỏ khỏi lịch sử; lọc tự động không đảm bảo nhận diện mọi thông tin cá nhân trong văn bản tự do.</p>
    <p>Lịch sử trên trình duyệt tách theo tài khoản, tối đa 50 mục mỗi công cụ và 90 ngày; khách chưa đăng nhập lưu trong phiên của tab. Người có quyền dùng thiết bị hoặc công cụ phát triển trình duyệt vẫn có thể đọc dữ liệu local. Lịch sử này không được mã hóa và không tự đồng bộ giữa thiết bị.</p>
    <p>Số liệu sử dụng, trạng thái chống gửi trùng và nhật ký quản trị được giữ phục vụ quota, an toàn và truy vết. Nhật ký quản trị chỉ lưu mã tham chiếu và các trường nghiệp vụ cho phép. Giao dịch thanh toán, quyền VIP và tiến độ học không bị xóa khi xóa lịch sử công cụ. Token đặt lại mật khẩu hết hạn được dọn, phiên đăng nhập hết hạn và bộ đếm chống lạm dụng cũ được xóa qua tác vụ bảo trì.</p>
    <h2 className="text-xl font-bold">Xuất và xóa</h2>
    <p>Vào <Link href="/profile/data" className="text-blue-600 underline">Dữ liệu cá nhân và lịch sử</Link> để xuất hồ sơ, lịch sử công cụ, tiến độ, giao dịch của bạn và lịch sử trên thiết bị hiện tại; hoặc xóa nội dung lịch sử. Xóa nội dung không hoàn lại lượt AI. Dữ liệu trong backup có thể còn tồn tại đến khi bản backup được loại bỏ theo quy trình vận hành; khi restore phải chạy lại bảo trì và áp dụng lại yêu cầu xóa trước khi mở dịch vụ.</p>
    <p>Để yêu cầu xử lý tài khoản hoặc hồ sơ thanh toán, liên hệ quản trị viên qua kênh hỗ trợ chính thức của website. Trang này không cung cấp nút tự xóa tài khoản hoặc giao dịch thanh toán.</p>
  </main>;
}
