create or replace function public.kb_marketplace_vendor_distances_for_church()
returns table(vendor_id uuid, distance_miles numeric)
language plpgsql
stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_place_id uuid;
begin
  if v_uid is null then raise exception 'Sign in required.' using errcode='42501'; end if;
  select p.place_id into v_place_id
  from public.profiles p
  where p.id=v_uid and p.role in ('church','individual');
  if v_place_id is null then return; end if;
  return query
  select v.id,
         round((extensions.st_distance(church_place.location,vendor_place.location)/1609.344)::numeric,1)
  from public.vendors v
  join public.geo_places vendor_place on vendor_place.id=v.base_place_id
  join public.geo_places church_place on church_place.id=v_place_id
  where coalesce(v.suspended,false)=false
    and church_place.location is not null
    and vendor_place.location is not null
    and (lower(coalesce(v.verification_status,''))='approved' or (v.verification_status is null and v.verified=true))
  order by extensions.st_distance(church_place.location,vendor_place.location),v.id;
end;
$$;
comment on function public.kb_marketplace_vendor_distances_for_church() is
  'Returns physical vendor distance from the signed-in church profile location. Returns no rows when the church has no canonical place.';
revoke all on function public.kb_marketplace_vendor_distances_for_church() from public, anon;
grant execute on function public.kb_marketplace_vendor_distances_for_church() to authenticated;
do $$ begin
  if to_regprocedure('public.kb_marketplace_vendor_distances_for_church()') is null then
    raise exception 'Marketplace nearby-sort function was not created';
  end if;
end $$;
