-- Additive upgrade for an existing database. Apply to staging first after backup.
-- Legacy transactions retain NULL snapshots; they must never auto-grant VIP.
BEGIN;
ALTER TABLE "Transaction"
  ADD COLUMN IF NOT EXISTS "paymentCode" TEXT,
  ADD COLUMN IF NOT EXISTS "planId" TEXT,
  ADD COLUMN IF NOT EXISTS "planName" TEXT,
  ADD COLUMN IF NOT EXISTS "durationDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND',
  ADD COLUMN IF NOT EXISTS "bankName" TEXT,
  ADD COLUMN IF NOT EXISTS "accountNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "accountHolder" TEXT,
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_paymentCode_key" ON "Transaction"("paymentCode");
CREATE INDEX IF NOT EXISTS "Transaction_userId_status_createdAt_idx" ON "Transaction"("userId", "status", "createdAt");
CREATE TABLE IF NOT EXISTS "PaymentWebhookEvent" (
  "id" TEXT PRIMARY KEY,
  "provider" TEXT NOT NULL DEFAULT 'sepay',
  "amount" INTEGER NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "transferType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reason" TEXT,
  "transactionId" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  CONSTRAINT "PaymentWebhookEvent_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_status_receivedAt_idx" ON "PaymentWebhookEvent"("status", "receivedAt");
COMMIT;
