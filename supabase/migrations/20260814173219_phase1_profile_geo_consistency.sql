create or replace function public.kb_geo_resolve_profile_place()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $$
declare
  v_place public.geo_places%rowtype;
  v_city text;
  v_state text;
begin
  if new.place_id is not null
     and (tg_op='INSERT' or old.place_id is distinct from new.place_id) then
    select * into v_place
    from public.geo_places p
    where p.id=new.place_id and p.active;
    if found then
      new.city := v_place.city;
      new.state_code := v_place.state_code;
      return new;
    end if;
    new.place_id := null;
  end if;

  v_city := nullif(btrim(coalesce(new.city,'')), '');
  v_state := upper(nullif(btrim(coalesce(new.state_code,'')), ''));
  new.state_code := v_state;

  if v_city is null or v_state is null then
    new.place_id := null;
    return new;
  end if;

  select p.id into new.place_id
  from public.geo_places p
  where p.active
    and lower(btrim(p.city))=lower(v_city)
    and p.state_code=v_state
    and p.country_code='US'
  order by p.id
  limit 1;

  return new;
end;
$$;

revoke all on function public.kb_geo_resolve_profile_place() from public,anon,authenticated;
grant execute on function public.kb_geo_resolve_profile_place() to service_role;

create trigger profiles_resolve_geo_place
before insert or update of city,state_code,place_id on public.profiles
for each row execute function public.kb_geo_resolve_profile_place();
