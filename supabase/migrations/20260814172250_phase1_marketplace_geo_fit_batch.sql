create or replace function public.kb_marketplace_geo_fit_for_project(p_project_id uuid)
returns table(vendor_id uuid, geo_fit jsonb)
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
  v_project public.projects%rowtype;
begin
  if v_uid is null then
    raise exception 'Sign in required.' using errcode='42501';
  end if;

  select * into v_project from public.projects where id=p_project_id;
  if not found then
    raise exception 'Project not found.' using errcode='P0002';
  end if;

  if not (
    public.kb_is_platform_admin()
    or public.kb_marketplace_public()
    or v_project.church_id = v_uid
  ) then
    raise exception 'Project owner or platform access required.' using errcode='42501';
  end if;

  return query
  select v.id,
         public.kb_marketplace_geo_fit(v_project.id, v.id)
  from public.vendors v
  where coalesce(v.suspended,false)=false
  order by v.id;
end;
$$;

revoke all on function public.kb_marketplace_geo_fit_for_project(uuid) from public;
grant execute on function public.kb_marketplace_geo_fit_for_project(uuid) to authenticated,service_role;
