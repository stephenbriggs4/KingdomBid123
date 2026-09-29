create extension if not exists postgis with schema extensions;

create table if not exists public.geo_markets (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  label text not null,
  country_code text not null default 'US',
  state_codes text[] not null default '{}'::text[],
  centroid_latitude numeric,
  centroid_longitude numeric,
  centroid extensions.geography(point,4326),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint geo_markets_slug_check check (slug = lower(btrim(slug)) and slug ~ '^[a-z0-9_]+$'),
  constraint geo_markets_country_code_check check (country_code ~ '^[A-Z]{2}$'),
  constraint geo_markets_lat_check check (centroid_latitude is null or centroid_latitude between -90 and 90),
  constraint geo_markets_long_check check (centroid_longitude is null or centroid_longitude between -180 and 180)
);

create table if not exists public.geo_places (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  city text not null,
  state_code text not null,
  country_code text not null default 'US',
  display_label text not null,
  market_id uuid references public.geo_markets(id) on delete set null,
  latitude numeric,
  longitude numeric,
  location extensions.geography(point,4326),
  active boolean not null default true,
  source text not null default 'faithbid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint geo_places_slug_check check (slug = lower(btrim(slug)) and slug ~ '^[a-z0-9-]+$'),
  constraint geo_places_state_code_check check (state_code ~ '^[A-Z]{2}$'),
  constraint geo_places_country_code_check check (country_code ~ '^[A-Z]{2}$'),
  constraint geo_places_lat_check check (latitude is null or latitude between -90 and 90),
  constraint geo_places_long_check check (longitude is null or longitude between -180 and 180),
  constraint geo_places_coords_pair_check check ((latitude is null) = (longitude is null))
);

create unique index if not exists geo_places_city_state_country_unique
  on public.geo_places (lower(btrim(city)), upper(btrim(state_code)), upper(btrim(country_code)));
create index if not exists geo_places_market_idx on public.geo_places(market_id) where active;
create index if not exists geo_places_location_gix on public.geo_places using gist(location) where location is not null;
create index if not exists geo_markets_centroid_gix on public.geo_markets using gist(centroid) where centroid is not null;

alter table public.geo_markets enable row level security;
alter table public.geo_places enable row level security;

revoke all on table public.geo_markets from anon, authenticated;
revoke all on table public.geo_places from anon, authenticated;
grant select, insert, update, delete on table public.geo_markets to service_role;
grant select, insert, update, delete on table public.geo_places to service_role;

create policy geo_markets_admin_all on public.geo_markets
  for all to authenticated
  using (public.kb_is_platform_admin())
  with check (public.kb_is_platform_admin());

create policy geo_places_admin_all on public.geo_places
  for all to authenticated
  using (public.kb_is_platform_admin())
  with check (public.kb_is_platform_admin());

grant select, insert, update, delete on table public.geo_markets to authenticated;
grant select, insert, update, delete on table public.geo_places to authenticated;

create or replace function public.kb_geo_set_point_fields()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if tg_table_name = 'geo_places' then
    if new.latitude is null or new.longitude is null then
      new.location := null;
    else
      new.location := extensions.st_setsrid(extensions.st_makepoint(new.longitude::double precision, new.latitude::double precision), 4326)::extensions.geography;
    end if;
  elsif tg_table_name = 'geo_markets' then
    if new.centroid_latitude is null or new.centroid_longitude is null then
      new.centroid := null;
    else
      new.centroid := extensions.st_setsrid(extensions.st_makepoint(new.centroid_longitude::double precision, new.centroid_latitude::double precision), 4326)::extensions.geography;
    end if;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

revoke all on function public.kb_geo_set_point_fields() from public, anon, authenticated;
grant execute on function public.kb_geo_set_point_fields() to service_role;

create trigger geo_markets_set_point_fields
before insert or update of centroid_latitude, centroid_longitude on public.geo_markets
for each row execute function public.kb_geo_set_point_fields();

create trigger geo_places_set_point_fields
before insert or update of latitude, longitude on public.geo_places
for each row execute function public.kb_geo_set_point_fields();

insert into public.geo_markets (slug, label, country_code, state_codes, centroid_latitude, centroid_longitude, active)
select
  m.slug,
  m.label,
  'US',
  array['TX']::text[],
  avg(c.centroid_latitude),
  avg(c.centroid_longitude),
  true
from public.gpi_markets m
left join public.gpi_city_areas c on c.market_id = m.id and c.active
where m.slug = 'dallas_fort_worth'
group by m.slug, m.label
on conflict (slug) do update set
  label = excluded.label,
  state_codes = excluded.state_codes,
  centroid_latitude = excluded.centroid_latitude,
  centroid_longitude = excluded.centroid_longitude,
  active = excluded.active;

insert into public.geo_places (slug, city, state_code, country_code, display_label, market_id, latitude, longitude, active, source)
select
  c.slug || '-tx',
  c.label,
  'TX',
  'US',
  c.label || ', TX',
  gm.id,
  c.centroid_latitude,
  c.centroid_longitude,
  c.active,
  'gpi_seed'
from public.gpi_city_areas c
join public.gpi_markets m on m.id = c.market_id
join public.geo_markets gm on gm.slug = m.slug
where m.slug = 'dallas_fort_worth'
on conflict (slug) do update set
  city = excluded.city,
  state_code = excluded.state_code,
  country_code = excluded.country_code,
  display_label = excluded.display_label,
  market_id = excluded.market_id,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  active = excluded.active;

create or replace function public.kb_geo_search_places(p_query text, p_limit integer default 8)
returns table(
  id uuid,
  slug text,
  city text,
  state_code text,
  country_code text,
  display_label text,
  market_id uuid,
  market_slug text,
  market_label text,
  latitude numeric,
  longitude numeric
)
language sql
stable
security definer
set search_path to ''
as $$
  with q as (
    select lower(regexp_replace(btrim(coalesce(p_query,'')), '[^a-zA-Z0-9]+', ' ', 'g')) as needle,
           greatest(1, least(coalesce(p_limit,8), 20)) as lim
  )
  select
    p.id,
    p.slug,
    p.city,
    p.state_code,
    p.country_code,
    p.display_label,
    p.market_id,
    m.slug as market_slug,
    m.label as market_label,
    p.latitude,
    p.longitude
  from public.geo_places p
  left join public.geo_markets m on m.id = p.market_id and m.active
  cross join q
  where p.active
    and q.needle <> ''
    and lower(regexp_replace(p.display_label, '[^a-zA-Z0-9]+', ' ', 'g')) like '%' || q.needle || '%'
  order by
    case when lower(p.display_label) = lower(btrim(p_query)) then 0 else 1 end,
    case when lower(p.city) = lower(btrim(p_query)) then 0 else 1 end,
    p.display_label,
    p.id
  limit (select lim from q);
$$;

revoke all on function public.kb_geo_search_places(text, integer) from public;
grant execute on function public.kb_geo_search_places(text, integer) to anon, authenticated, service_role;
