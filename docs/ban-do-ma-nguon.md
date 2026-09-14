# Bản đồ mã nguồn AIChoShop

Danh mục 120 file TS/TSX/CSS trong `src` tại snapshot HEAD `627f099`. Mỗi file đã được quét cú pháp/import/hàm/điểm gọi dữ liệu. Cột phạm vi mô tả góc kiểm tra; không có nghĩa mọi dòng đã được đọc thủ công hoặc UI đã được chạy trên trình duyệt.

Báo cáo tổng hợp: [Phân tích chuyên sâu dự án](/D:/AIChoShop/docs/phan-tich-chuyen-sau-du-an.md).

## Các lớp kiểm tra

- Kiểm kê toàn bộ mã ứng dụng qua AST, bao gồm import, hàm, hook, fetch và liên kết.
- Đọc sâu các luồng xác thực, thanh toán, AI, quota, nội dung VIP, engine và các nhánh giao diện được dẫn chứng trong báo cáo.
- Phân tích chọn lọc parser/output, CSS và các màn hình quản trị dài; chưa kiểm thử trực quan từng trạng thái.
- 9 mô phỏng cô lập, hai fixture nghiệp vụ, 30 unit test baseline, ESLint baseline và typecheck phần source.

| File | Dòng | Client trực tiếp | Phạm vi | Hàm khai báo tiêu biểu |
|---|---:|:---:|---|---|
| [src/app/(app)/courses/CoursesClient.tsx](/D:/AIChoShop/src/app/(app)/courses/CoursesClient.tsx) | 748 | Có | Khóa học, bài giảng, quyền nội dung và tiến độ | CoursesClient |
| [src/app/(app)/courses/page.tsx](/D:/AIChoShop/src/app/(app)/courses/page.tsx) | 88 | — | Khóa học, bài giảng, quyền nội dung và tiến độ | CoursesPage |
| [src/app/(app)/dashboard/page.tsx](/D:/AIChoShop/src/app/(app)/dashboard/page.tsx) | 340 | — | Module giao diện/tiện ích: import, export, state, liên kết | DashboardPage |
| [src/app/(app)/layout.tsx](/D:/AIChoShop/src/app/(app)/layout.tsx) | 79 | — | Bố cục, điều hướng, theme hoặc thông báo | AppLayout |
| [src/app/(app)/learn/LearnClient.tsx](/D:/AIChoShop/src/app/(app)/learn/LearnClient.tsx) | 555 | Có | Khóa học, bài giảng, quyền nội dung và tiến độ | LearnClient |
| [src/app/(app)/learn/page.tsx](/D:/AIChoShop/src/app/(app)/learn/page.tsx) | 154 | — | Khóa học, bài giảng, quyền nội dung và tiến độ | LearnPage |
| [src/app/(app)/profile/page.tsx](/D:/AIChoShop/src/app/(app)/profile/page.tsx) | 128 | — | Hồ sơ, lịch sử, gói VIP, QR và polling | ProfilePage |
| [src/app/(app)/profile/ProfileClient.tsx](/D:/AIChoShop/src/app/(app)/profile/ProfileClient.tsx) | 1595 | Có | Hồ sơ, lịch sử, gói VIP, QR và polling | ProfileClient |
| [src/app/(app)/settings/page.tsx](/D:/AIChoShop/src/app/(app)/settings/page.tsx) | 43 | — | Module giao diện/tiện ích: import, export, state, liên kết | SettingsPage |
| [src/app/(app)/tools/ad-copy/page.tsx](/D:/AIChoShop/src/app/(app)/tools/ad-copy/page.tsx) | 354 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | AdCopyPage |
| [src/app/(app)/tools/appeal-generator/page.tsx](/D:/AIChoShop/src/app/(app)/tools/appeal-generator/page.tsx) | 476 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | AppealGenerator |
| [src/app/(app)/tools/chat-broadcast/page.tsx](/D:/AIChoShop/src/app/(app)/tools/chat-broadcast/page.tsx) | 330 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | ChatBroadcastPage |
| [src/app/(app)/tools/koc-planner/page.tsx](/D:/AIChoShop/src/app/(app)/tools/koc-planner/page.tsx) | 2058 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | migrateInput, MoneyInput, NumberInput, Field, SectionCard |
| [src/app/(app)/tools/page.tsx](/D:/AIChoShop/src/app/(app)/tools/page.tsx) | 194 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | ToolsPage |
| [src/app/(app)/tools/pricing-calculator/BulkPricing.tsx](/D:/AIChoShop/src/app/(app)/tools/pricing-calculator/BulkPricing.tsx) | 1069 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | makeRow, parseCsvLine, parseCsv, MoneyInput, PercentInput |
| [src/app/(app)/tools/pricing-calculator/page.tsx](/D:/AIChoShop/src/app/(app)/tools/pricing-calculator/page.tsx) | 26 | — | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | PricingCalculatorPage |
| [src/app/(app)/tools/pricing-calculator/PricingCalculatorClient.tsx](/D:/AIChoShop/src/app/(app)/tools/pricing-calculator/PricingCalculatorClient.tsx) | 1918 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | MoneyInput, NumberInput, Field, CategorySelector, Metric |
| [src/app/(app)/tools/pricing-calculator/PricingExtras.tsx](/D:/AIChoShop/src/app/(app)/tools/pricing-calculator/PricingExtras.tsx) | 256 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | EmptyCalculation, CostVisuals, CalculationSummary, SummaryValue, SavedCalculations |
| [src/app/(app)/tools/review-replier/page.tsx](/D:/AIChoShop/src/app/(app)/tools/review-replier/page.tsx) | 390 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | ReviewReplier |
| [src/app/(app)/tools/script-writer/page.tsx](/D:/AIChoShop/src/app/(app)/tools/script-writer/page.tsx) | 350 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | ScriptWriterPage |
| [src/app/(app)/tools/seo-optimizer/page.tsx](/D:/AIChoShop/src/app/(app)/tools/seo-optimizer/page.tsx) | 542 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | SeoOptimizerPage |
| [src/app/(app)/tools/tax-calculator/page.tsx](/D:/AIChoShop/src/app/(app)/tools/tax-calculator/page.tsx) | 1008 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | readTaxHistory, writeTaxHistory, MoneyInput, Field, Section |
| [src/app/(app)/tools/title-spinner/page.tsx](/D:/AIChoShop/src/app/(app)/tools/title-spinner/page.tsx) | 331 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | TitleSpinnerPage |
| [src/app/(app)/tools/video-repurposer/page.tsx](/D:/AIChoShop/src/app/(app)/tools/video-repurposer/page.tsx) | 447 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | VideoRepurposerPage |
| [src/app/actions/auth.ts](/D:/AIChoShop/src/app/actions/auth.ts) | 124 | — | Server Actions: quyền, validation, mutation, revalidation | hashPassword, registerUser, loginUser, logoutUser |
| [src/app/actions/learn.ts](/D:/AIChoShop/src/app/actions/learn.ts) | 57 | — | Server Actions: quyền, validation, mutation, revalidation | toggleLessonProgress |
| [src/app/actions/profile.ts](/D:/AIChoShop/src/app/actions/profile.ts) | 153 | — | Server Actions: quyền, validation, mutation, revalidation | hashPassword, updateUserProfile, changeUserPassword, requestVipActivation, checkCurrentUserVipStatus |
| [src/app/actions/user.ts](/D:/AIChoShop/src/app/actions/user.ts) | 20 | — | Server Actions: quyền, validation, mutation, revalidation | getUserPlan |
| [src/app/admin/layout.tsx](/D:/AIChoShop/src/app/admin/layout.tsx) | 50 | — | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | AdminLayout |
| [src/app/admin/lessons/actions.ts](/D:/AIChoShop/src/app/admin/lessons/actions.ts) | 276 | — | Server Actions: quyền, validation, mutation, revalidation | toggleLessonVip, createLesson, updateLesson, restoreDefaultLessons, deleteLesson |
| [src/app/admin/lessons/page.tsx](/D:/AIChoShop/src/app/admin/lessons/page.tsx) | 55 | — | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | AdminLessons |
| [src/app/admin/page.tsx](/D:/AIChoShop/src/app/admin/page.tsx) | 655 | — | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | timeAgo, AdminDashboard |
| [src/app/admin/pricing-fees/actions.ts](/D:/AIChoShop/src/app/admin/pricing-fees/actions.ts) | 63 | — | Server Actions: quyền, validation, mutation, revalidation | requireAdmin, nullableNumber, vietnamDate, createPricingFeeOverride, deactivatePricingFeeOverride |
| [src/app/admin/pricing-fees/page.tsx](/D:/AIChoShop/src/app/admin/pricing-fees/page.tsx) | 40 | — | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | PricingFeesAdminPage |
| [src/app/admin/pricing-fees/PricingFeeOverrideForm.tsx](/D:/AIChoShop/src/app/admin/pricing-fees/PricingFeeOverrideForm.tsx) | 44 | Có | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | PricingFeeOverrideForm, AdminField |
| [src/app/admin/sepay/actions.ts](/D:/AIChoShop/src/app/admin/sepay/actions.ts) | 262 | — | Server Actions: quyền, validation, mutation, revalidation | saveSePayConfigAction, simulateSePayWebhookAction, approveTransactionAction, deleteTransactionAction |
| [src/app/admin/sepay/page.tsx](/D:/AIChoShop/src/app/admin/sepay/page.tsx) | 63 | — | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | AdminSePayPage |
| [src/app/admin/settings/actions.ts](/D:/AIChoShop/src/app/admin/settings/actions.ts) | 157 | — | Server Actions: quyền, validation, mutation, revalidation | saveSystemSettingsAction, testOpenAiConnectionAction, changeAdminPasswordAction |
| [src/app/admin/settings/page.tsx](/D:/AIChoShop/src/app/admin/settings/page.tsx) | 27 | — | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | AdminSettingsPage |
| [src/app/admin/users/actions.ts](/D:/AIChoShop/src/app/admin/users/actions.ts) | 276 | — | Server Actions: quyền, validation, mutation, revalidation | hashPassword, toggleUserVip, updateUserVipDuration, toggleUserLock, createUserByAdmin |
| [src/app/admin/users/page.tsx](/D:/AIChoShop/src/app/admin/users/page.tsx) | 139 | — | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | AdminUsers |
| [src/app/admin/vip-plans/actions.ts](/D:/AIChoShop/src/app/admin/vip-plans/actions.ts) | 251 | — | Server Actions: quyền, validation, mutation, revalidation | getAdminVipPlans, toggleVipPlanActive, toggleVipPlanPopular, createVipPlan, updateVipPlan |
| [src/app/admin/vip-plans/page.tsx](/D:/AIChoShop/src/app/admin/vip-plans/page.tsx) | 38 | — | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | AdminVipPlansPage |
| [src/app/admin/vip-plans/VipPlansManager.tsx](/D:/AIChoShop/src/app/admin/vip-plans/VipPlansManager.tsx) | 734 | Có | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | VipPlansManager |
| [src/app/admin-login/actions.ts](/D:/AIChoShop/src/app/admin-login/actions.ts) | 25 | — | Server Actions: quyền, validation, mutation, revalidation | loginAdmin |
| [src/app/admin-login/layout.tsx](/D:/AIChoShop/src/app/admin-login/layout.tsx) | 15 | — | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | AdminLoginLayout |
| [src/app/admin-login/page.tsx](/D:/AIChoShop/src/app/admin-login/page.tsx) | 71 | Có | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | AdminLogin |
| [src/app/api/ai/route.ts](/D:/AIChoShop/src/app/api/ai/route.ts) | 597 | — | HTTP API: kiểm tra hợp đồng, quyền, dữ liệu và nhánh lỗi | POST |
| [src/app/api/ai/seo/route.ts](/D:/AIChoShop/src/app/api/ai/seo/route.ts) | 33 | — | HTTP API: kiểm tra hợp đồng, quyền, dữ liệu và nhánh lỗi | POST |
| [src/app/api/ai/usage/route.ts](/D:/AIChoShop/src/app/api/ai/usage/route.ts) | 102 | — | HTTP API: kiểm tra hợp đồng, quyền, dữ liệu và nhánh lỗi | GET, POST |
| [src/app/api/settings/openai/route.ts](/D:/AIChoShop/src/app/api/settings/openai/route.ts) | 84 | — | HTTP API: kiểm tra hợp đồng, quyền, dữ liệu và nhánh lỗi | GET, POST |
| [src/app/api/upload/video/route.ts](/D:/AIChoShop/src/app/api/upload/video/route.ts) | 70 | — | HTTP API: kiểm tra hợp đồng, quyền, dữ liệu và nhánh lỗi | POST |
| [src/app/api/vip-plans/route.ts](/D:/AIChoShop/src/app/api/vip-plans/route.ts) | 112 | — | HTTP API: kiểm tra hợp đồng, quyền, dữ liệu và nhánh lỗi | GET, POST |
| [src/app/api/vip-plans/[id]/route.ts](/D:/AIChoShop/src/app/api/vip-plans/[id]/route.ts) | 186 | — | HTTP API: kiểm tra hợp đồng, quyền, dữ liệu và nhánh lỗi | GET, PUT, PATCH, DELETE |
| [src/app/api/webhooks/sepay/route.ts](/D:/AIChoShop/src/app/api/webhooks/sepay/route.ts) | 402 | — | HTTP API: kiểm tra hợp đồng, quyền, dữ liệu và nhánh lỗi | GET, POST |
| [src/app/globals.css](/D:/AIChoShop/src/app/globals.css) | 1175 | — | CSS/theme: cấu trúc, selector và độ phụ thuộc !important | Component/const/type hoặc không có function declaration |
| [src/app/layout.tsx](/D:/AIChoShop/src/app/layout.tsx) | 61 | — | Bố cục, điều hướng, theme hoặc thông báo | RootLayout |
| [src/app/login/page.tsx](/D:/AIChoShop/src/app/login/page.tsx) | 119 | Có | Form và trạng thái đăng nhập/đăng ký | LoginPage |
| [src/app/page.tsx](/D:/AIChoShop/src/app/page.tsx) | 662 | — | Module giao diện/tiện ích: import, export, state, liên kết | LandingPage, PainCard, SmallToolCard, ReviewCard, Faq |
| [src/app/register/page.tsx](/D:/AIChoShop/src/app/register/page.tsx) | 134 | Có | Form và trạng thái đăng nhập/đăng ký | RegisterPage |
| [src/components/admin/AdminCharts.tsx](/D:/AIChoShop/src/components/admin/AdminCharts.tsx) | 971 | Có | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | AdminCharts |
| [src/components/admin/AdminNav.tsx](/D:/AIChoShop/src/components/admin/AdminNav.tsx) | 45 | Có | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | AdminNav |
| [src/components/admin/AdminPageHeader.tsx](/D:/AIChoShop/src/components/admin/AdminPageHeader.tsx) | 52 | — | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | AdminPageHeader |
| [src/components/admin/AdminTopBar.tsx](/D:/AIChoShop/src/components/admin/AdminTopBar.tsx) | 69 | Có | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | AdminTopBar |
| [src/components/admin/LessonsManager.tsx](/D:/AIChoShop/src/components/admin/LessonsManager.tsx) | 1400 | Có | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | LessonsManager |
| [src/components/admin/SePayConfigManager.tsx](/D:/AIChoShop/src/components/admin/SePayConfigManager.tsx) | 930 | Có | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | formatRelativeTime, SePayConfigManager |
| [src/components/admin/SystemSettingsManager.tsx](/D:/AIChoShop/src/components/admin/SystemSettingsManager.tsx) | 883 | Có | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | SystemSettingsManager |
| [src/components/admin/UsersManager.tsx](/D:/AIChoShop/src/components/admin/UsersManager.tsx) | 1591 | Có | Quản trị: thao tác, props, dữ liệu, biểu đồ và điều hướng | UsersManager |
| [src/components/auth/AuthModal.tsx](/D:/AIChoShop/src/components/auth/AuthModal.tsx) | 122 | Có | Form và trạng thái đăng nhập/đăng ký | AuthModal |
| [src/components/layout/footer.tsx](/D:/AIChoShop/src/components/layout/footer.tsx) | 115 | — | Bố cục, điều hướng, theme hoặc thông báo | Footer |
| [src/components/layout/header.tsx](/D:/AIChoShop/src/components/layout/header.tsx) | 87 | Có | Bố cục, điều hướng, theme hoặc thông báo | Header |
| [src/components/layout/sidebar.tsx](/D:/AIChoShop/src/components/layout/sidebar.tsx) | 286 | Có | Bố cục, điều hướng, theme hoặc thông báo | Sidebar |
| [src/components/loading-ui/text-shimmer-wave.tsx](/D:/AIChoShop/src/components/loading-ui/text-shimmer-wave.tsx) | 99 | Có | Module giao diện/tiện ích: import, export, state, liên kết | TextShimmerWave |
| [src/components/settings/SettingsManager.tsx](/D:/AIChoShop/src/components/settings/SettingsManager.tsx) | 439 | Có | Module giao diện/tiện ích: import, export, state, liên kết | SettingsManager |
| [src/components/tools/AdCopyOutput.tsx](/D:/AIChoShop/src/components/tools/AdCopyOutput.tsx) | 810 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | AdCopyOutput |
| [src/components/tools/AiUsageBadge.tsx](/D:/AIChoShop/src/components/tools/AiUsageBadge.tsx) | 290 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | AiUsageBadge |
| [src/components/tools/AppealGeneratorOutput.tsx](/D:/AIChoShop/src/components/tools/AppealGeneratorOutput.tsx) | 403 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | AppealGeneratorOutput |
| [src/components/tools/ChatBroadcastOutput.tsx](/D:/AIChoShop/src/components/tools/ChatBroadcastOutput.tsx) | 310 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | ChatBroadcastOutput |
| [src/components/tools/KocPlannerOutput.tsx](/D:/AIChoShop/src/components/tools/KocPlannerOutput.tsx) | 539 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | KocPlannerOutput |
| [src/components/tools/ReviewReplierOutput.tsx](/D:/AIChoShop/src/components/tools/ReviewReplierOutput.tsx) | 633 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | ReviewReplierOutput |
| [src/components/tools/ScriptWriterOutput.tsx](/D:/AIChoShop/src/components/tools/ScriptWriterOutput.tsx) | 863 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | ScriptWriterOutput |
| [src/components/tools/SeoOptimizerOutput.tsx](/D:/AIChoShop/src/components/tools/SeoOptimizerOutput.tsx) | 376 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | SeoOptimizerOutput |
| [src/components/tools/TaxCalculatorOutput.tsx](/D:/AIChoShop/src/components/tools/TaxCalculatorOutput.tsx) | 494 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | Row, Metric, TaxCalculatorOutput |
| [src/components/tools/TitleSpinnerOutput.tsx](/D:/AIChoShop/src/components/tools/TitleSpinnerOutput.tsx) | 316 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | TitleSpinnerOutput |
| [src/components/tools/VideoRepurposerOutput.tsx](/D:/AIChoShop/src/components/tools/VideoRepurposerOutput.tsx) | 488 | Có | Form công cụ hoặc trình bày/parser output; đối chiếu engine/API | VideoRepurposerOutput, ContentCard |
| [src/components/ui/button.tsx](/D:/AIChoShop/src/components/ui/button.tsx) | 58 | — | Module giao diện/tiện ích: import, export, state, liên kết | Button |
| [src/components/ui/text-dots.tsx](/D:/AIChoShop/src/components/ui/text-dots.tsx) | 58 | — | Module giao diện/tiện ích: import, export, state, liên kết | TextDots |
| [src/context/ThemeContext.tsx](/D:/AIChoShop/src/context/ThemeContext.tsx) | 197 | Có | Bố cục, điều hướng, theme hoặc thông báo | ThemeProvider, useTheme |
| [src/context/ToastContext.tsx](/D:/AIChoShop/src/context/ToastContext.tsx) | 306 | Có | Bố cục, điều hướng, theme hoặc thông báo | ToastProvider, useToast |
| [src/hooks/useToolGate.tsx](/D:/AIChoShop/src/hooks/useToolGate.tsx) | 110 | Có | Module giao diện/tiện ích: import, export, state, liên kết | useToolGate |
| [src/lib/ai-usage.ts](/D:/AIChoShop/src/lib/ai-usage.ts) | 374 | — | Nghiệp vụ dùng chung, dữ liệu hoặc cấu hình | getStartOfTodayVn, formatRelativeTime, summarizeAiAction, getAiUsageStats, recordAiUsage |
| [src/lib/koc-planner/engine.test.ts](/D:/AIChoShop/src/lib/koc-planner/engine.test.ts) | 71 | — | Engine tính toán, kiểu dữ liệu, biểu phí, lưu trữ hoặc test | Component/const/type hoặc không có function declaration |
| [src/lib/koc-planner/engine.ts](/D:/AIChoShop/src/lib/koc-planner/engine.ts) | 96 | — | Engine tính toán, kiểu dữ liệu, biểu phí, lưu trữ hoặc test | orderInput, calculateKocPlan |
| [src/lib/koc-planner/types.ts](/D:/AIChoShop/src/lib/koc-planner/types.ts) | 81 | — | Engine tính toán, kiểu dữ liệu, biểu phí, lưu trữ hoặc test | Component/const/type hoặc không có function declaration |
| [src/lib/pricing/engine.test.ts](/D:/AIChoShop/src/lib/pricing/engine.test.ts) | 98 | — | Engine tính toán, kiểu dữ liệu, biểu phí, lưu trữ hoặc test | Component/const/type hoặc không có function declaration |
| [src/lib/pricing/engine.ts](/D:/AIChoShop/src/lib/pricing/engine.ts) | 158 | — | Engine tính toán, kiểu dữ liệu, biểu phí, lưu trữ hoặc test | scenarioWeights, validatePricingInput, evaluatePrice, targetReached, solvePrice |
| [src/lib/pricing/registry.ts](/D:/AIChoShop/src/lib/pricing/registry.ts) | 120 | — | Engine tính toán, kiểu dữ liệu, biểu phí, lưu trữ hoặc test | getAvailableCategories, getDefaultCategoryId, getOfficialCategory, getCategoryLabel, searchable |
| [src/lib/pricing/storage.ts](/D:/AIChoShop/src/lib/pricing/storage.ts) | 67 | — | Engine tính toán, kiểu dữ liệu, biểu phí, lưu trữ hoặc test | readPricingHistory, writePricingHistory, csvCell, pricingHistoryToCsv, downloadTextFile |
| [src/lib/pricing/types.ts](/D:/AIChoShop/src/lib/pricing/types.ts) | 66 | — | Engine tính toán, kiểu dữ liệu, biểu phí, lưu trữ hoặc test | Component/const/type hoặc không có function declaration |
| [src/lib/prisma.ts](/D:/AIChoShop/src/lib/prisma.ts) | 26 | — | Nghiệp vụ dùng chung, dữ liệu hoặc cấu hình | Component/const/type hoặc không có function declaration |
| [src/lib/seo/contract.ts](/D:/AIChoShop/src/lib/seo/contract.ts) | 139 | — | SEO: session, quota, đầu vào/đầu ra, provider hoặc test | validateSeoInputs, parseSeoResult, seoToText, seoFilename, seoPrompt |
| [src/lib/seo/generate.ts](/D:/AIChoShop/src/lib/seo/generate.ts) | 24 | — | SEO: session, quota, đầu vào/đầu ra, provider hoặc test | generateSeo |
| [src/lib/seo/handler.ts](/D:/AIChoShop/src/lib/seo/handler.ts) | 143 | — | SEO: session, quota, đầu vào/đầu ra, provider hoặc test | publicError, handleSeo |
| [src/lib/seo/seo.test.ts](/D:/AIChoShop/src/lib/seo/seo.test.ts) | 79 | — | SEO: session, quota, đầu vào/đầu ra, provider hoặc test | Component/const/type hoặc không có function declaration |
| [src/lib/seo/session.ts](/D:/AIChoShop/src/lib/seo/session.ts) | 26 | — | SEO: session, quota, đầu vào/đầu ra, provider hoặc test | createSeoSession, deleteSeoSession |
| [src/lib/seo/usage-policy.ts](/D:/AIChoShop/src/lib/seo/usage-policy.ts) | 16 | — | SEO: session, quota, đầu vào/đầu ra, provider hoặc test | reservePolicy |
| [src/lib/seo/usage.ts](/D:/AIChoShop/src/lib/seo/usage.ts) | 66 | — | SEO: session, quota, đầu vào/đầu ra, provider hoặc test | seoIdentity, reserveSeo, finishSeo |
| [src/lib/sepay-server.ts](/D:/AIChoShop/src/lib/sepay-server.ts) | 175 | — | Nghiệp vụ dùng chung, dữ liệu hoặc cấu hình | getSePayConfig, updateSePayConfig, syncUserVipExpiration, syncAllExpiredVipUsers, calculateNewVipExpiration |
| [src/lib/system-settings.ts](/D:/AIChoShop/src/lib/system-settings.ts) | 243 | — | Nghiệp vụ dùng chung, dữ liệu hoặc cấu hình | getSystemSettings, updateSystemSettings, verifyAdminPassword, changeAdminPassword, getOpenAiToken |
| [src/lib/tax-calculator/engine.test.ts](/D:/AIChoShop/src/lib/tax-calculator/engine.test.ts) | 54 | — | Engine tính toán, kiểu dữ liệu, biểu phí, lưu trữ hoặc test | Component/const/type hoặc không có function declaration |
| [src/lib/tax-calculator/engine.ts](/D:/AIChoShop/src/lib/tax-calculator/engine.ts) | 100 | — | Engine tính toán, kiểu dữ liệu, biểu phí, lưu trữ hoặc test | personalProfitRate, companyIncomeRate, calculateEcommerceTax |
| [src/lib/tax-calculator/types.ts](/D:/AIChoShop/src/lib/tax-calculator/types.ts) | 51 | — | Engine tính toán, kiểu dữ liệu, biểu phí, lưu trữ hoặc test | Component/const/type hoặc không có function declaration |
| [src/lib/utils.ts](/D:/AIChoShop/src/lib/utils.ts) | 2 | — | Nghiệp vụ dùng chung, dữ liệu hoặc cấu hình | Component/const/type hoặc không có function declaration |
| [src/lib/video.ts](/D:/AIChoShop/src/lib/video.ts) | 80 | — | Nghiệp vụ dùng chung, dữ liệu hoặc cấu hình | parseVideoUrl |
| [src/lib/vip-expiration.ts](/D:/AIChoShop/src/lib/vip-expiration.ts) | 102 | — | Nghiệp vụ dùng chung, dữ liệu hoặc cấu hình | computeVipDaysLeft, isVipExpired, getVipStatusInfo |
| [src/lib/vip-plans-server.ts](/D:/AIChoShop/src/lib/vip-plans-server.ts) | 34 | — | Nghiệp vụ dùng chung, dữ liệu hoặc cấu hình | getActiveVipPlans |
| [src/lib/vip-plans.ts](/D:/AIChoShop/src/lib/vip-plans.ts) | 90 | — | Nghiệp vụ dùng chung, dữ liệu hoặc cấu hình | Component/const/type hoặc không có function declaration |
| [src/middleware.ts](/D:/AIChoShop/src/middleware.ts) | 21 | — | Chặn route admin bằng cookie; đọc sâu | middleware |
| [src/utils/supabase/client.ts](/D:/AIChoShop/src/utils/supabase/client.ts) | 9 | — | Helper Supabase; chưa thấy import sử dụng từ ứng dụng | createClient |
| [src/utils/supabase/server.ts](/D:/AIChoShop/src/utils/supabase/server.ts) | 30 | — | Helper Supabase; chưa thấy import sử dụng từ ứng dụng | createClient |

## Ngoài danh mục TS/TSX/CSS

| Thành phần | Kết quả kiểm tra |
|---|---|
| prisma/schema.prisma | 15 model; quan hệ, unique/index, cấu hình, trạng thái thanh toán |
| prisma/seed.ts | Xóa/tạo dữ liệu mẫu, 25 bài, video placeholder, moduleName |
| prisma/manual/*.sql | Cấu trúc setup SEO và pricing override; không chạy trên DB thật |
| package.json, package-lock.json | Script, dependency, lockfile; không thực hiện advisory audit toàn bộ |
| prisma7.config.ts, next.config.ts, tsconfig.json, eslint.config.mjs | Đối chiếu cấu hình với thư viện cài; tách lỗi generated types |
| .env.example, .gitignore | Mẫu env có credential cụ thể và được Git theo dõi; không chép bí mật sang báo cáo |
| src/lib/pricing/data/official-fees.json | 3.696 dòng dữ liệu ngành hàng, khoảng 775 KB; chưa đối chiếu mọi mức phí với nguồn sàn |
| public | Kiểm kê ảnh/SVG và 6 file video được Git theo dõi; không xem hết nội dung media |
| scripts, scratch cũ | Kiểm tra mục đích test/setup và fixture; không chạy script mutation DB |
| README.md, docs/seo-optimizer.md, AGENTS.md, CLAUDE.md | Tài liệu vận hành, bất đồng docs/code và quy tắc phiên bản |
| node_modules | Chỉ tham chiếu docs Next.js và cơ chế nạp Prisma config liên quan; không audit toàn bộ thư viện |
| .agents/.claude/.windsurf skills | Công cụ hỗ trợ phát triển, không tính là chức năng ứng dụng và không audit mọi skill |

## Tái lập bằng chứng

Các lệnh dưới đây chỉ thực hiện phân tích cục bộ; các probe dùng dependency giả lập hoặc engine thuần tính toán.

```powershell
node scratch/deep-review-inventory.cjs
node scratch/deep-review-probes.cjs
node --experimental-strip-types scratch/deep-review-domain-probes.mjs
node --experimental-strip-types --test src/lib/pricing/engine.test.ts src/lib/seo/seo.test.ts src/lib/koc-planner/engine.test.ts src/lib/tax-calculator/engine.test.ts
```

Không dùng probe xác nhận hành vi chưa an toàn như bộ regression test sau sửa: sau remediation cần đổi assertion thành kỳ vọng từ chối/đúng nghiệp vụ. Lưu ý các script tái tạo sẽ ghi lại file kết quả trong scratch.
