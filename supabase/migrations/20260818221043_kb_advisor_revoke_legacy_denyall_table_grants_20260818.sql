-- These tables already deny anon/auth row access because RLS is enabled with no policies.
-- Remove unnecessary table grants so a future policy cannot accidentally expose them without an explicit grant decision.
-- Trusted SECURITY DEFINER/service-role backend access is unaffected.
REVOKE ALL PRIVILEGES ON TABLE public."Reviews" FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public._dg_final FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public._dg_scratch FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.facebook_priority_targets FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.instagram_catalog FROM anon, authenticated;
