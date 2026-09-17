-- Private tables are reached only through the trusted application server.
BEGIN;
DO $$
DECLARE table_name text; api_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['User','UserCredit','Progress','AiUsageLog','SeoSession','PasswordReset','AuthRateLimit','SeoUsage','SeoRun','AdminAuditLog','SystemSetting','SePayConfig','MediaAsset'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
    FOREACH api_role IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=api_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I',table_name,api_role);
      END IF;
    END LOOP;
  END LOOP;
END $$;
COMMIT;
