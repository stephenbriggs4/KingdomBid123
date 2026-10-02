-- This audit-only attempt log is written and read exclusively by the
-- SECURITY DEFINER public-intake RPCs. It inherited the project's permissive
-- public-schema default table ACL when it was created, even though RLS has no
-- client policies. Keep both barriers explicit so a future policy cannot
-- accidentally turn this abuse-control ledger into a browser API.
revoke all privileges on table public.waitlist_submission_attempts
  from public, anon, authenticated;

comment on table public.waitlist_submission_attempts is
  'Private abuse-control log for public intake RPCs. No direct browser access; use the approved SECURITY DEFINER intake functions.';
