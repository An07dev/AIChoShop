"use client";
export default function AdminDataError({ reset }: { reset: () => void }) {
  return <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
    <h2 className="text-lg font-bold">Không tải được dữ liệu quản trị</h2>
    <p className="my-3">Dữ liệu chưa được tải thành công. Hãy thử lại; nếu lỗi tiếp diễn, kiểm tra kết nối và phiên bản database trong log server.</p>
    <button onClick={reset} className="rounded-lg bg-red-800 px-4 py-2 text-white">Thử lại</button>
  </section>;
}
