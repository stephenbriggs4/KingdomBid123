-- Fixes "infinite recursion detected in policy for relation vendor_invites".
-- vendor_invites INSERT/UPDATE policies read projects; the projects SELECT policy read
-- vendor_invites, so any church write to vendor_invites failed. The projects policy now
-- asks a security-definer helper (which bypasses RLS on vendor_invites) instead.

create or replace function public.kb_vendor_invited_to_project_v1(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.vendor_invites vi
    where vi.project_id = p_project
      and vi.vendor_user_id = (select auth.uid())
      and vi.status = any (array['invited','no_response','bid_received','declined'])
  );
$$;

revoke all on function public.kb_vendor_invited_to_project_v1(uuid) from public, anon;
grant execute on function public.kb_vendor_invited_to_project_v1(uuid) to authenticated;

drop policy if exists kb_projects_select_authenticated on public.projects;
create policy kb_projects_select_authenticated on public.projects
  for select to authenticated
  using (
    public.kb_is_platform_admin()
    or hired_vendor_id = (select auth.uid())
    or church_id = (select auth.uid())
    or (public.kb_marketplace_public() and status = 'open')
    or (
      status = 'open'
      and (
        public.kb_vendor_invited_to_project_v1(projects.id)
        or exists (
          select 1
          from public.project_vendor_links pvl
          where pvl.project_id = projects.id
            and pvl.vendor_user_id = (select auth.uid())
            and pvl.stage = any (array['watching','invited','bid_received','shortlisted','hired','declined'])
        )
      )
    )
  );
