BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PricingFeeOverride_valid_values_check'
      AND conrelid = '"PricingFeeOverride"'::regclass
  ) THEN
    ALTER TABLE "PricingFeeOverride" ADD CONSTRAINT "PricingFeeOverride_valid_values_check" CHECK (
      ("commissionRate" IS NULL OR "commissionRate" BETWEEN 0 AND 100)
      AND ("transactionRate" IS NULL OR "transactionRate" BETWEEN 0 AND 100)
      AND ("orderProcessingFee" IS NULL OR "orderProcessingFee" >= 0)
      AND ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom")
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PricingFeeOverride_no_active_overlap_excl'
      AND conrelid = '"PricingFeeOverride"'::regclass
  ) THEN
    ALTER TABLE "PricingFeeOverride" ADD CONSTRAINT "PricingFeeOverride_no_active_overlap_excl"
      EXCLUDE USING gist (
        "platform" WITH =,
        "shopType" WITH =,
        "categoryId" WITH =,
        tsrange("effectiveFrom", COALESCE("effectiveTo", 'infinity'::timestamp), '[]') WITH &&
      ) WHERE (active);
  END IF;
END $$;
COMMIT;
