-- Supabase recommends SECURITY DEFINER helpers used only by RLS live outside exposed schemas.
CREATE SCHEMA IF NOT EXISTS private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.is_convo_participant(uuid) SET SCHEMA private;
ALTER FUNCTION public.kb_can_access_project_ops(uuid) SET SCHEMA private;

-- Keep only the roles that need these helpers during policy evaluation / trusted backend work.
REVOKE EXECUTE ON FUNCTION private.is_convo_participant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_convo_participant(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION private.kb_can_access_project_ops(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.kb_can_access_project_ops(uuid) TO authenticated, service_role;
