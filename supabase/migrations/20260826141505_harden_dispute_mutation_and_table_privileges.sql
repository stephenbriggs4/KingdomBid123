-- Keep dispute case history participant-readable but admin-controlled after creation.
-- Participants may still open disputes through the existing INSERT policy.
drop policy if exists kb_disputes_update_involved on public.disputes;
drop policy if exists kb_disputes_delete_involved on public.disputes;

create policy kb_disputes_update_admin
on public.disputes
for update
to authenticated
using ((select public.kb_is_platform_admin()))
with check ((select public.kb_is_platform_admin()));

create policy kb_disputes_delete_admin
on public.disputes
for delete
to authenticated
using ((select public.kb_is_platform_admin()));

-- TRUNCATE is table-wide and is not governed by row-level security.
-- Browser-facing roles never need it on either table.
revoke truncate on table public.disputes from anon, authenticated;
revoke truncate on table public.platform_settings from anon, authenticated;
