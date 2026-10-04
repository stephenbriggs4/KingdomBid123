-- Fixes Sentry JAVASCRIPT-REACT-35: "permission denied for function kb_submit_church_feedback".
-- The public wrapper must run as its owner so it can reach the private function,
-- whose EXECUTE privilege is intentionally unavailable to authenticated callers.
-- The private function remains the authorization boundary: it reads auth.uid()
-- and enforces the completed-project and hired-vendor requirements.

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
