CREATE TABLE IF NOT EXISTS "PricingFeeOverride" (
  "id" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "shopType" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "commissionRate" DOUBLE PRECISION,
  "transactionRate" DOUBLE PRECISION,
  "orderProcessingFee" INTEGER,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "note" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PricingFeeOverride_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PricingFeeOverride_platform_shopType_categoryId_active_idx"
ON "PricingFeeOverride"("platform", "shopType", "categoryId", "active");
