create or replace function public.kb_parse_city_state(p_text text)
returns table(city text, state_code text)
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_parts text[];
  v_state text;
  v_abbr text;
begin
  v_parts := array(
    select btrim(x) from unnest(string_to_array(coalesce(p_text, ''), ',')) as x where btrim(x) <> ''
  );
  if coalesce(array_length(v_parts, 1), 0) = 0 then
    return;
  end if;
  city := v_parts[1];
  state_code := null;
  if array_length(v_parts, 1) >= 2 then
    v_state := upper(btrim(regexp_replace(v_parts[2], '\s*[0-9]{5}(-[0-9]{4})?\s*$', '')));
    select t.abbr into v_abbr
    from (values
      ('ALABAMA','AL'),('ALASKA','AK'),('ARIZONA','AZ'),('ARKANSAS','AR'),('CALIFORNIA','CA'),
      ('COLORADO','CO'),('CONNECTICUT','CT'),('DELAWARE','DE'),('FLORIDA','FL'),('GEORGIA','GA'),
      ('HAWAII','HI'),('IDAHO','ID'),('ILLINOIS','IL'),('INDIANA','IN'),('IOWA','IA'),
      ('KANSAS','KS'),('KENTUCKY','KY'),('LOUISIANA','LA'),('MAINE','ME'),('MARYLAND','MD'),
      ('MASSACHUSETTS','MA'),('MICHIGAN','MI'),('MINNESOTA','MN'),('MISSISSIPPI','MS'),('MISSOURI','MO'),
      ('MONTANA','MT'),('NEBRASKA','NE'),('NEVADA','NV'),('NEW HAMPSHIRE','NH'),('NEW JERSEY','NJ'),
      ('NEW MEXICO','NM'),('NEW YORK','NY'),('NORTH CAROLINA','NC'),('NORTH DAKOTA','ND'),('OHIO','OH'),
      ('OKLAHOMA','OK'),('OREGON','OR'),('PENNSYLVANIA','PA'),('RHODE ISLAND','RI'),('SOUTH CAROLINA','SC'),
      ('SOUTH DAKOTA','SD'),('TENNESSEE','TN'),('TEXAS','TX'),('UTAH','UT'),('VERMONT','VT'),
      ('VIRGINIA','VA'),('WASHINGTON','WA'),('WEST VIRGINIA','WV'),('WISCONSIN','WI'),('WYOMING','WY'),
      ('DISTRICT OF COLUMBIA','DC')
    ) as t(name, abbr)
    where t.name = v_state or t.abbr = v_state
    limit 1;
    state_code := v_abbr;
  end if;
  return next;
end;
$$;

create or replace function public.kb_geo_resolve_vendor_base_place()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  v_city text;
  v_state text;
  v_src text;
  v_pc text;
  v_ps text;
begin
  if nullif(btrim(coalesce(new.service_state, '')), '') is null then
    v_src := coalesce(nullif(btrim(coalesce(new.service_city, '')), ''), nullif(btrim(coalesce(new.city, '')), ''));
    if v_src is not null then
      select p.city, p.state_code into v_pc, v_ps from public.kb_parse_city_state(v_src) as p;
      if v_ps is not null then
        new.service_state := v_ps;
        new.service_city := v_pc;
      end if;
    end if;
  end if;

  if new.base_place_id is not null then return new; end if;
  v_city := nullif(btrim(coalesce(new.service_city, new.city, '')), '');
  v_state := upper(nullif(btrim(coalesce(new.service_state, '')), ''));
  if v_city is null or v_state is null then return new; end if;
  select p.id into new.base_place_id
  from public.geo_places p
  where p.active and lower(btrim(p.city)) = lower(v_city) and p.state_code = v_state and p.country_code = 'US'
  order by p.id limit 1;
  return new;
end;
$$;

create or replace function public.kb_geo_resolve_profile_place()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  v_place public.geo_places%rowtype;
  v_city text;
  v_state text;
  v_pc text;
  v_ps text;
begin
  if new.place_id is not null
     and (tg_op = 'INSERT' or old.place_id is distinct from new.place_id) then
    select * into v_place
    from public.geo_places p
    where p.id = new.place_id and p.active;
    if found then
      new.city := v_place.city;
      new.state_code := v_place.state_code;
      return new;
    end if;
    new.place_id := null;
  end if;

  v_city := nullif(btrim(coalesce(new.city, '')), '');
  v_state := upper(nullif(btrim(coalesce(new.state_code, '')), ''));

  if v_state is null and v_city is not null then
    select p.city, p.state_code into v_pc, v_ps from public.kb_parse_city_state(v_city) as p;
    if v_ps is not null then
      v_city := v_pc;
      v_state := v_ps;
      new.city := v_city;
    end if;
  end if;
  new.state_code := v_state;

  if v_city is null or v_state is null then
    new.place_id := null;
    return new;
  end if;

  select p.id into new.place_id
  from public.geo_places p
  where p.active
    and lower(btrim(p.city)) = lower(v_city)
    and p.state_code = v_state
    and p.country_code = 'US'
  order by p.id
  limit 1;

  return new;
end;
$$;

create or replace function public.kb_vendor_sync_profile_location()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is not null and new.service_city is not null and new.service_state is not null then
    update public.profiles
       set city = new.service_city,
           state_code = new.service_state
     where id = new.user_id
       and coalesce(btrim(city), '') = ''
       and state_code is null;
  end if;
  return new;
end;
$$;

drop trigger if exists vendors_sync_profile_location on public.vendors;
create trigger vendors_sync_profile_location
  after insert or update of service_city, service_state on public.vendors
  for each row execute function public.kb_vendor_sync_profile_location();

revoke all on function public.kb_vendor_sync_profile_location() from public, anon, authenticated;
revoke all on function public.kb_parse_city_state(text) from public;
grant execute on function public.kb_parse_city_state(text) to anon, authenticated;

update public.vendors set city = city where city is not null and (service_state is null or service_city is null);
update public.profiles set city = city where city is not null and state_code is null;
