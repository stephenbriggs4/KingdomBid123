
drop policy if exists kb_project_vendor_links_involved on public.project_vendor_links;

create policy kb_project_vendor_links_select_involved
  on public.project_vendor_links
  for select
  to authenticated
  using (
    church_id = (select auth.uid())
    or vendor_user_id = (select auth.uid())
    or public.kb_is_platform_admin()
  );

create policy kb_project_vendor_links_insert_church
  on public.project_vendor_links
  for insert
  to authenticated
  with check (
    church_id = (select auth.uid())
    or public.kb_is_platform_admin()
  );

create policy kb_project_vendor_links_update_church
  on public.project_vendor_links
  for update
  to authenticated
  using (
    church_id = (select auth.uid())
    or public.kb_is_platform_admin()
  )
  with check (
    church_id = (select auth.uid())
    or public.kb_is_platform_admin()
  );

create policy kb_project_vendor_links_delete_church
  on public.project_vendor_links
  for delete
  to authenticated
  using (
    church_id = (select auth.uid())
    or public.kb_is_platform_admin()
  );
