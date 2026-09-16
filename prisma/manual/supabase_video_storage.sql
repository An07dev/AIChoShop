-- Additive, repeatable upgrade from local media files to Supabase Storage metadata.
-- Existing MediaAsset rows remain LOCAL and existing lesson URLs keep working.

DO $$ BEGIN
  CREATE TYPE "MediaStorageProvider" AS ENUM ('LOCAL', 'SUPABASE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "storageProvider" "MediaStorageProvider" NOT NULL DEFAULT 'LOCAL';
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "storageBucket" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "storagePath" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_storagePath_key" ON "MediaAsset"("storagePath");

DO $$ BEGIN
  ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_remote_location_check"
    CHECK ("storageProvider" = 'LOCAL' OR ("storageBucket" IS NOT NULL AND "storagePath" IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
