const fs = require('node:fs');
const files = JSON.parse(fs.readFileSync('scratch/deep-review-inventory.json', 'utf8'));
function area(file) {
  if (file.includes('/api/')) return 'HTTP API: kiểm tra hợp đồng, quyền, dữ liệu và nhánh lỗi';
  if (file.includes('/actions/') || file.endsWith('/actions.ts')) return 'Server Actions: quyền, validation, mutation, revalidation';
  if (file.includes('/lib/seo/')) return 'SEO: session, quota, đầu vào/đầu ra, provider hoặc test';
  if (/\/lib\/(pricing|tax-calculator|koc-planner)\//.test(file)) return 'Engine tính toán, kiểu dữ liệu, biểu phí, lưu trữ hoặc test';
  if (file.includes('/lib/')) return 'Nghiệp vụ dùng chung, dữ liệu hoặc cấu hình';
  if (file.includes('/tools/')) return 'Form công cụ hoặc trình bày/parser output; đối chiếu engine/API';
  if (file.includes('/admin') || file.includes('/components/admin/')) return 'Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng';
  if (file.includes('/profile/')) return 'Hồ sơ, lịch sử, gói VIP, QR và polling';
  if (file.includes('/courses/') || file.includes('/learn/')) return 'Khóa học, bài giảng, quyền nội dung và tiến độ';
  if (file.includes('/layout') || file.includes('/context/')) return 'Bố cục, điều hướng, theme hoặc thông báo';
  if (file.includes('/auth/') || file.includes('/login/') || file.includes('/register/')) return 'Form và trạng thái đăng nhập/đăng ký';
  if (file.includes('/supabase/')) return 'Helper Supabase; chưa thấy import sử dụng từ ứng dụng';
  if (file.endsWith('middleware.ts')) return 'Chặn route admin bằng cookie; đọc sâu';
  if (file.endsWith('.css')) return 'CSS/theme: cấu trúc, selector và độ phụ thuộc !important';
  return 'Module giao diện/tiện ích: import, export, state, liên kết';
}
const lines = [
  '# Bản đồ mã nguồn AIChoShop', '',
  'Danh mục 120 file TS/TSX/CSS trong `src` tại snapshot HEAD `627f099`. Mỗi file đã được quét cú pháp/import/hàm/điểm gọi dữ liệu. Cột phạm vi mô tả góc kiểm tra; không có nghĩa mọi dòng đã được đọc thủ công hoặc UI đã được chạy trên trình duyệt.', '',
  'Báo cáo tổng hợp: [Phân tích chuyên sâu dự án](/D:/AIChoShop/docs/phan-tich-chuyen-sau-du-an.md).', '',
  '## Các lớp kiểm tra', '',
  '- Kiểm kê toàn bộ mã ứng dụng qua AST, bao gồm import, hàm, hook, fetch và liên kết.',
  '- Đọc sâu các luồng xác thực, thanh toán, AI, quota, nội dung VIP, engine và các nhánh giao diện được dẫn chứng trong báo cáo.',
  '- Phân tích chọn lọc parser/output, CSS và các màn hình quản trị dài; chưa kiểm thử trực quan từng trạng thái.',
  '- 9 mô phỏng cô lập, hai fixture nghiệp vụ, 30 unit test baseline, ESLint baseline và typecheck phần source.', '',
  '| File | Dòng | Client trực tiếp | Phạm vi | Hàm khai báo tiêu biểu |',
  '|---|---:|:---:|---|---|',
];
for (const f of files) {
  lines.push(`| [${f.file}](/D:/AIChoShop/${f.file}) | ${f.lines} | ${f.client ? 'Có' : '—'} | ${area(f.file)} | ${f.functions.slice(0, 5).map(x => x.name).join(', ') || 'Component/const/type hoặc không có function declaration'} |`);
}
lines.push('', '## Ngoài danh mục TS/TSX/CSS', '',
  '| Thành phần | Kết quả kiểm tra |', '|---|---|',
  '| prisma/schema.prisma | 15 model; quan hệ, unique/index, cấu hình, trạng thái thanh toán |',
  '| prisma/seed.ts | Xóa/tạo dữ liệu mẫu, 25 bài, video placeholder, moduleName |',
  '| prisma/manual/*.sql | Cấu trúc setup SEO và pricing override; không chạy trên DB thật |',
  '| package.json, package-lock.json | Script, dependency, lockfile; không thực hiện advisory audit toàn bộ |',
  '| prisma7.config.ts, next.config.ts, tsconfig.json, eslint.config.mjs | Đối chiếu cấu hình với thư viện cài; tách lỗi generated types |',
  '| .env.example, .gitignore | Mẫu env có credential cụ thể và được Git theo dõi; không chép bí mật sang báo cáo |',
  '| src/lib/pricing/data/official-fees.json | 3.696 dòng dữ liệu ngành hàng, khoảng 775 KB; chưa đối chiếu mọi mức phí với nguồn sàn |',
  '| public | Kiểm kê ảnh/SVG và 6 file video được Git theo dõi; không xem hết nội dung media |',
  '| scripts, scratch cũ | Kiểm tra mục đích test/setup và fixture; không chạy script mutation DB |',
  '| README.md, docs/seo-optimizer.md, AGENTS.md, CLAUDE.md | Tài liệu vận hành, bất đồng docs/code và quy tắc phiên bản |',
  '| node_modules | Chỉ tham chiếu docs Next.js và cơ chế nạp Prisma config liên quan; không audit toàn bộ thư viện |',
  '| .agents/.claude/.windsurf skills | Công cụ hỗ trợ phát triển, không tính là chức năng ứng dụng và không audit mọi skill |', '',
  '## Tái lập bằng chứng', '',
  'Các lệnh dưới đây chỉ thực hiện phân tích cục bộ; các probe dùng dependency giả lập hoặc engine thuần tính toán.', '',
  '```powershell',
  'node scratch/deep-review-inventory.cjs',
  'node scratch/deep-review-probes.cjs',
  'node --experimental-strip-types scratch/deep-review-domain-probes.mjs',
  'node --experimental-strip-types --test src/lib/pricing/engine.test.ts src/lib/seo/seo.test.ts src/lib/koc-planner/engine.test.ts src/lib/tax-calculator/engine.test.ts',
  '```', '',
  'Không dùng probe xác nhận hành vi chưa an toàn như bộ regression test sau sửa: sau remediation cần đổi assertion thành kỳ vọng từ chối/đúng nghiệp vụ. Lưu ý các script tái tạo sẽ ghi lại file kết quả trong scratch.', '');
fs.writeFileSync('docs/ban-do-ma-nguon.md', lines.join('\n'));
console.log(`Wrote file map with ${files.length} entries.`);
