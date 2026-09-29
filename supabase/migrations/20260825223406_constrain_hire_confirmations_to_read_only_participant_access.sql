
drop policy if exists kb_hire_confirmations_involved on public.hire_confirmations;

create policy kb_hire_confirmations_select_involved_or_admin
on public.hire_confirmations
for select
to authenticated
using (
  church_id = (select auth.uid())
  or vendor_id = (select auth.uid())
  or (select public.kb_is_platform_admin())
);

revoke all privileges on table public.hire_confirmations from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.hire_confirmations from authenticated;
grant select on table public.hire_confirmations to authenticated;
