-- Existing rows are validated; invalid historical data aborts this migration.
-- No row is deleted or rewritten to make a constraint pass.
BEGIN;
SET LOCAL lock_timeout = '10s';
ALTER TABLE "User" ADD CONSTRAINT "User_dailyFreeLimit_check" CHECK ("dailyFreeLimit" >= 0);
ALTER TABLE "UserCredit" ADD CONSTRAINT "UserCredit_balance_check" CHECK (balance >= 0);
ALTER TABLE "VipPlan" ADD CONSTRAINT "VipPlan_values_check" CHECK (price >= 0 AND "originalPrice" >= 0 AND ("durationDays" IS NULL OR "durationDays" BETWEEN 0 AND 36500));
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_order_check" CHECK ("order" > 0);
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_sizeBytes_check" CHECK ("sizeBytes" > 0);
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_dailyFreeLimit_check" CHECK ("defaultDailyFreeLimit" >= 0);
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_values_check" CHECK (amount >= 0 AND ("durationDays" IS NULL OR "durationDays" BETWEEN 0 AND 36500));
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_status_check" CHECK (status IN ('PENDING','SUCCESS','FAILED','REVIEW','EXPIRED','CANCELLED','REFUNDED'));
ALTER TABLE "PaymentWebhookEvent" ADD CONSTRAINT "PaymentWebhookEvent_values_check" CHECK (amount > 0 AND "transferType" IN ('in','out') AND status IN ('RECEIVED','APPLIED','REVIEW','IGNORED'));
ALTER TABLE "SeoRun" ADD CONSTRAINT "SeoRun_status_check" CHECK (status IN ('pending','success','failed'));
ALTER TABLE "SeoRun" ADD CONSTRAINT "SeoRun_metrics_check" CHECK ("inputTokens" >= 0 AND "outputTokens" >= 0 AND "durationMs" >= 0);
ALTER TABLE "SeoUsage" ADD CONSTRAINT "SeoUsage_counts_check" CHECK (successes >= 0 AND attempts >= 0);
CREATE INDEX "Lesson_courseId_order_idx" ON "Lesson"("courseId", "order");
CREATE INDEX "AiUsageLog_userId_tool_createdAt_idx" ON "AiUsageLog"("userId", tool, "createdAt");
CREATE INDEX "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");
CREATE INDEX "SeoRun_subject_status_createdAt_idx" ON "SeoRun"(subject, status, "createdAt");
CREATE INDEX "Transaction_status_createdAt_idx" ON "Transaction"(status, "createdAt");
CREATE INDEX "PaymentWebhookEvent_transactionId_status_receivedAt_idx" ON "PaymentWebhookEvent"("transactionId", status, "receivedAt");
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"(action, "createdAt");
COMMIT;
