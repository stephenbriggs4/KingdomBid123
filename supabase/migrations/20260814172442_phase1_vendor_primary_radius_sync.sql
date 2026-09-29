create or replace function public.kb_vendor_sync_primary_service_radius(p_radius_miles integer default null)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
  v_vendor public.vendors%rowtype;
  v_model text;
  v_radius integer;
begin
  if v_uid is null then
    raise exception 'Sign in required.' using errcode='42501';
  end if;

  select * into v_vendor
  from public.vendors v
  where v.user_id=v_uid
  order by v.created_at nulls last, v.id
  limit 1
  for update;

  if not found then
    raise exception 'Vendor profile not found.' using errcode='P0002';
  end if;

  v_model := lower(btrim(coalesce(v_vendor.service_model,'remote')));

  if v_model in ('remote','virtual','nationwide') then
    delete from public.vendor_service_areas a
    where a.vendor_id=v_vendor.id and a.coverage_type='radius';
    return jsonb_build_object('status','remote','vendor_id',v_vendor.id,'radius_miles',null,'place_id',v_vendor.base_place_id);
  end if;

  v_radius := coalesce(p_radius_miles, v_vendor.service_radius_miles);
  if v_radius is null or v_radius < 1 or v_radius > 1000 then
    raise exception 'Service radius must be between 1 and 1000 miles.' using errcode='22023';
  end if;

  delete from public.vendor_service_areas a
  where a.vendor_id=v_vendor.id and a.coverage_type='radius';

  if v_vendor.base_place_id is null then
    return jsonb_build_object(
      'status','location_unresolved',
      'vendor_id',v_vendor.id,
      'radius_miles',v_radius,
      'place_id',null
    );
  end if;

  insert into public.vendor_service_areas(vendor_id,coverage_type,place_id,radius_miles,active)
  values(v_vendor.id,'radius',v_vendor.base_place_id,v_radius,true);

  return jsonb_build_object(
    'status','synced',
    'vendor_id',v_vendor.id,
    'radius_miles',v_radius,
    'place_id',v_vendor.base_place_id
  );
end;
$$;

revoke all on function public.kb_vendor_sync_primary_service_radius(integer) from public;
grant execute on function public.kb_vendor_sync_primary_service_radius(integer) to authenticated,service_role;
