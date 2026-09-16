-- Additive, repeatable upgrade for course publishing, learning progress and private media ownership.
-- Apply only after a database backup. This script does not delete course, lesson or progress data.

DO $$ BEGIN
  CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MediaAssetStatus" AS ENUM ('UPLOADED', 'ATTACHED', 'ORPHANED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
UPDATE "Course" SET "publishedAt" = COALESCE("publishedAt", "createdAt") WHERE "status" = 'PUBLISHED';

ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "mediaAssetId" TEXT;

ALTER TABLE "Progress" ADD COLUMN IF NOT EXISTS "positionSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Progress" ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER;
ALTER TABLE "Progress" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Progress" ADD COLUMN IF NOT EXISTS "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Progress" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
UPDATE "Progress" SET "completedAt" = COALESCE("completedAt", "updatedAt") WHERE "completed" = true;

CREATE TABLE IF NOT EXISTS "MediaAsset" (
  "id" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "uploadedBy" TEXT NOT NULL,
  "status" "MediaAssetStatus" NOT NULL DEFAULT 'UPLOADED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_filename_key" ON "MediaAsset"("filename");
CREATE INDEX IF NOT EXISTS "Course_status_createdAt_idx" ON "Course"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Lesson_courseId_status_order_idx" ON "Lesson"("courseId", "status", "order");
CREATE INDEX IF NOT EXISTS "Lesson_mediaAssetId_idx" ON "Lesson"("mediaAssetId");
CREATE INDEX IF NOT EXISTS "Progress_userId_lastViewedAt_idx" ON "Progress"("userId", "lastViewedAt");
CREATE INDEX IF NOT EXISTS "MediaAsset_status_createdAt_idx" ON "MediaAsset"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "MediaAsset_uploadedBy_createdAt_idx" ON "MediaAsset"("uploadedBy", "createdAt");

DO $$ BEGIN
  ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedBy_fkey"
    FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_mediaAssetId_fkey"
    FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_durationSeconds_check"
    CHECK ("durationSeconds" IS NULL OR "durationSeconds" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Progress" ADD CONSTRAINT "Progress_positionSeconds_check"
    CHECK ("positionSeconds" >= 0 AND ("durationSeconds" IS NULL OR "durationSeconds" >= 0));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

