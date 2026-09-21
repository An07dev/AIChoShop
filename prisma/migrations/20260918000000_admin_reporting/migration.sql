BEGIN;
SET LOCAL lock_timeout='10s';
ALTER TABLE "Transaction" ADD COLUMN "isSandbox" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "refundedAt" TIMESTAMP(3);
CREATE INDEX "Transaction_isSandbox_status_paidAt_idx" ON "Transaction"("isSandbox",status,"paidAt");
CREATE INDEX "Transaction_isSandbox_refundedAt_idx" ON "Transaction"("isSandbox","refundedAt");
CREATE TABLE "VipGrantEvent" (
 id TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,source TEXT NOT NULL,kind TEXT NOT NULL,"transactionId" TEXT,"actorId" TEXT,"isSandbox" BOOLEAN NOT NULL DEFAULT false,"occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "VipGrantEvent_source_check" CHECK(source IN ('PAYMENT','MANUAL')),
 CONSTRAINT "VipGrantEvent_kind_check" CHECK(kind IN ('NEW','RENEWAL','REVOKED'))
);
CREATE UNIQUE INDEX "VipGrantEvent_transactionId_key" ON "VipGrantEvent"("transactionId");
CREATE INDEX "VipGrantEvent_occurredAt_source_kind_idx" ON "VipGrantEvent"("occurredAt",source,kind);
CREATE INDEX "VipGrantEvent_userId_occurredAt_idx" ON "VipGrantEvent"("userId","occurredAt");
ALTER TABLE "VipGrantEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "VipGrantEvent" FROM PUBLIC;
DO $$ DECLARE api_role text; BEGIN FOREACH api_role IN ARRAY ARRAY['anon','authenticated'] LOOP IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=api_role) THEN EXECUTE format('REVOKE ALL ON "VipGrantEvent" FROM %I',api_role); END IF; END LOOP; END $$;
-- Existing payments without paidAt and historical VIP grants are not fabricated.
COMMIT;
