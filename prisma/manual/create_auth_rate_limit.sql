BEGIN;
CREATE TABLE IF NOT EXISTS public."AuthRateLimit" (
  "id" TEXT PRIMARY KEY,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "AuthRateLimit_expiresAt_idx" ON public."AuthRateLimit"("expiresAt");
ALTER TABLE public."AuthRateLimit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."AuthRateLimit" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."AuthRateLimit" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."AuthRateLimit" FROM authenticated;
  END IF;
END $$;
COMMIT;
