drop policy if exists marketplace_vendor_curation_admin_all
  on public.marketplace_vendor_curation;

drop policy if exists marketplace_vendor_curation_read_active
  on public.marketplace_vendor_curation;

create policy marketplace_vendor_curation_read_active
  on public.marketplace_vendor_curation
  for select
  to authenticated
  using (
    public.kb_is_platform_admin()
    or (
      active
      and featured_from <= now()
      and (featured_until is null or featured_until > now())
    )
  );

create policy marketplace_vendor_curation_admin_insert
  on public.marketplace_vendor_curation
  for insert
  to authenticated
  with check (public.kb_is_platform_admin());

create policy marketplace_vendor_curation_admin_update
  on public.marketplace_vendor_curation
  for update
  to authenticated
  using (public.kb_is_platform_admin())
  with check (public.kb_is_platform_admin());

create policy marketplace_vendor_curation_admin_delete
  on public.marketplace_vendor_curation
  for delete
  to authenticated
  using (public.kb_is_platform_admin());

do $$
declare
  v_select_policy_count integer;
begin
  select count(*)
    into v_select_policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'marketplace_vendor_curation'
    and cmd = 'SELECT';

  if v_select_policy_count <> 1 then
    raise exception 'Expected exactly one marketplace curation SELECT policy, found %', v_select_policy_count;
  end if;
end
$$;
