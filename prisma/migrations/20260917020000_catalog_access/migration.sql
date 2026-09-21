-- Public catalog metadata is served through the application DTO, not raw REST
-- table grants, which would expose draft/VIP lesson content and media references.
BEGIN;
DO $$
DECLARE table_name text; api_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['Course','Lesson','Tool','VipPlan','PricingFeeOverride'] LOOP
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
