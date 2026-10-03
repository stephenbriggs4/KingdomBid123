-- DRAFT. Do not apply until the disposable replay gate passes.
-- Fixes Sentry JAVASCRIPT-REACT-35: "permission denied for function kb_submit_church_feedback".
-- The public wrapper runs as the calling user (SECURITY INVOKER), but the private
-- function's EXECUTE is revoked from authenticated. Running the wrapper as its owner
-- lets it reach the private function. The private function still checks auth.uid()
-- and the completed-project/hired-vendor rules, so no new access is granted.

create or replace function public.marketplace_service_submit_church_feedback(
  p_project_id uuid,
  p_tags text[]
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select private.kb_submit_church_feedback(p_project_id, p_tags);
$$;

revoke all on function public.marketplace_service_submit_church_feedback(uuid,text[]) from public, anon, authenticated;
grant execute on function public.marketplace_service_submit_church_feedback(uuid,text[]) to authenticated;
