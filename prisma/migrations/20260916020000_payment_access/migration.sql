-- Payment data is accessed through the trusted server connection only.
-- Supabase default grants otherwise expose new public tables through its API.
BEGIN;
ALTER TABLE public."Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PaymentWebhookEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Transaction", public."PaymentWebhookEvent" FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public."Transaction", public."PaymentWebhookEvent" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public."Transaction", public."PaymentWebhookEvent" FROM authenticated;
  END IF;
END $$;
COMMIT;
