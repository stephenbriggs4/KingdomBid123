drop policy if exists vendor_service_areas_select_involved on public.vendor_service_areas;
create policy vendor_service_areas_select_involved
on public.vendor_service_areas for select
to authenticated
using (
  public.kb_is_platform_admin()
  or exists (
    select 1 from public.vendors v
    where v.id = vendor_service_areas.vendor_id
      and v.user_id = (select auth.uid())
  )
  or public.kb_marketplace_public()
);

drop policy if exists vendor_service_areas_write_own on public.vendor_service_areas;
create policy vendor_service_areas_write_own
on public.vendor_service_areas for all
to authenticated
using (
  public.kb_is_platform_admin()
  or exists (
    select 1 from public.vendors v
    where v.id = vendor_service_areas.vendor_id
      and v.user_id = (select auth.uid())
  )
)
with check (
  public.kb_is_platform_admin()
  or exists (
    select 1 from public.vendors v
    where v.id = vendor_service_areas.vendor_id
      and v.user_id = (select auth.uid())
  )
);
