drop policy if exists "vendors can view projects they are invited to" on public.projects;

create policy "vendors can view projects they are invited to"
on public.projects
for select
to authenticated
using (
  status = 'open'
  and (
    exists (
      select 1
      from public.vendor_invites
      where vendor_invites.project_id = projects.id
        and vendor_invites.vendor_user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.project_vendor_links
      where project_vendor_links.project_id = projects.id
        and project_vendor_links.vendor_user_id = (select auth.uid())
    )
  )
);
