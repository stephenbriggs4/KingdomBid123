alter table public.projects add column if not exists project_place_id uuid references public.geo_places(id) on delete set null;
create index if not exists projects_project_place_idx on public.projects(project_place_id) where project_place_id is not null;

create table if not exists public.vendor_service_areas (
  id uuid primary key default extensions.gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  coverage_type text not null,
  place_id uuid references public.geo_places(id) on delete cascade,
  market_id uuid references public.geo_markets(id) on delete cascade,
  state_code text,
  radius_miles integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_service_areas_type_check check (coverage_type in ('radius','place','market','state','nationwide')),
  constraint vendor_service_areas_state_check check (state_code is null or state_code ~ '^[A-Z]{2}$'),
  constraint vendor_service_areas_radius_check check (radius_miles is null or radius_miles between 1 and 1000),
  constraint vendor_service_areas_shape_check check (
    (coverage_type='radius' and place_id is not null and radius_miles is not null and market_id is null and state_code is null)
    or (coverage_type='place' and place_id is not null and radius_miles is null and market_id is null and state_code is null)
    or (coverage_type='market' and market_id is not null and place_id is null and radius_miles is null and state_code is null)
    or (coverage_type='state' and state_code is not null and place_id is null and radius_miles is null and market_id is null)
    or (coverage_type='nationwide' and place_id is null and radius_miles is null and market_id is null and state_code is null)
  )
);

create unique index if not exists vendor_service_areas_place_unique
  on public.vendor_service_areas(vendor_id,coverage_type,place_id)
  where coverage_type in ('radius','place') and active;
create unique index if not exists vendor_service_areas_market_unique
  on public.vendor_service_areas(vendor_id,market_id)
  where coverage_type='market' and active;
create unique index if not exists vendor_service_areas_state_unique
  on public.vendor_service_areas(vendor_id,state_code)
  where coverage_type='state' and active;
create unique index if not exists vendor_service_areas_nationwide_unique
  on public.vendor_service_areas(vendor_id)
  where coverage_type='nationwide' and active;
create index if not exists vendor_service_areas_vendor_idx on public.vendor_service_areas(vendor_id) where active;

alter table public.vendor_service_areas enable row level security;
revoke all on table public.vendor_service_areas from anon, authenticated;
grant select, insert, update, delete on table public.vendor_service_areas to service_role;
grant select, insert, update, delete on table public.vendor_service_areas to authenticated;

create policy vendor_service_areas_select_involved on public.vendor_service_areas
for select to authenticated
using (
  public.kb_is_platform_admin()
  or exists (select 1 from public.vendors v where v.id=vendor_service_areas.vendor_id and v.user_id=auth.uid())
  or public.kb_marketplace_public()
);

create policy vendor_service_areas_write_own on public.vendor_service_areas
for all to authenticated
using (
  public.kb_is_platform_admin()
  or exists (select 1 from public.vendors v where v.id=vendor_service_areas.vendor_id and v.user_id=auth.uid())
)
with check (
  public.kb_is_platform_admin()
  or exists (select 1 from public.vendors v where v.id=vendor_service_areas.vendor_id and v.user_id=auth.uid())
);

insert into public.platform_settings(key,value,updated_at)
values ('marketplace_geo_required','false',now())
on conflict (key) do nothing;

create or replace function public.kb_geo_resolve_project_place()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $$
declare
  v_city text;
  v_state text;
begin
  v_city := nullif(btrim(coalesce(new.project_city,new.city,'')), '');
  v_state := upper(nullif(btrim(coalesce(new.project_state,'')), ''));
  if v_city is null or v_state is null then
    if tg_op='INSERT' or new.project_city is distinct from old.project_city or new.city is distinct from old.city or new.project_state is distinct from old.project_state then
      new.project_place_id := null;
    end if;
    return new;
  end if;
  select p.id into new.project_place_id
  from public.geo_places p
  where p.active and lower(btrim(p.city))=lower(v_city) and p.state_code=v_state and p.country_code='US'
  order by p.id limit 1;
  return new;
end;
$$;
revoke all on function public.kb_geo_resolve_project_place() from public,anon,authenticated;
grant execute on function public.kb_geo_resolve_project_place() to service_role;

create trigger projects_resolve_geo_place
before insert or update of project_city,city,project_state on public.projects
for each row execute function public.kb_geo_resolve_project_place();

create or replace function public.kb_geo_resolve_vendor_base_place()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $$
declare
  v_city text;
  v_state text;
begin
  if new.base_place_id is not null then return new; end if;
  v_city := nullif(btrim(coalesce(new.service_city,new.city,'')), '');
  v_state := upper(nullif(btrim(coalesce(new.service_state,'')), ''));
  if v_city is null or v_state is null then return new; end if;
  select p.id into new.base_place_id
  from public.geo_places p
  where p.active and lower(btrim(p.city))=lower(v_city) and p.state_code=v_state and p.country_code='US'
  order by p.id limit 1;
  return new;
end;
$$;
revoke all on function public.kb_geo_resolve_vendor_base_place() from public,anon,authenticated;
grant execute on function public.kb_geo_resolve_vendor_base_place() to service_role;

create trigger vendors_resolve_geo_base
before insert or update of city,service_city,service_state,base_place_id on public.vendors
for each row execute function public.kb_geo_resolve_vendor_base_place();

create or replace function public.kb_marketplace_geo_fit(p_project_id uuid, p_vendor_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  p public.projects%rowtype;
  v public.vendors%rowtype;
  pp public.geo_places%rowtype;
  vp public.geo_places%rowtype;
  v_project_mode text;
  v_vendor_mode text;
  v_distance_miles numeric;
  v_has_explicit_areas boolean := false;
  v_fit text := 'unknown';
  v_reason text := 'Location coverage is not fully configured yet.';
begin
  select * into p from public.projects where id=p_project_id;
  if not found then return jsonb_build_object('eligibility','unknown','reason','Project not found.'); end if;
  select * into v from public.vendors where id=p_vendor_id;
  if not found then return jsonb_build_object('eligibility','unknown','reason','Vendor not found.'); end if;

  v_project_mode := lower(btrim(coalesce(p.delivery_preference,'either')));
  v_vendor_mode := lower(btrim(coalesce(v.service_model,'both')));

  if v_project_mode='remote' then
    if v_vendor_mode in ('remote','both','national','nationwide') then
      return jsonb_build_object('eligibility','eligible','fit_tier','remote','reason','Remote-compatible project and vendor.','distance_miles',null);
    end if;
    return jsonb_build_object('eligibility','unknown','fit_tier','delivery_review','reason','Vendor is not marked remote-capable.','distance_miles',null);
  end if;

  if v_vendor_mode='remote' then
    return jsonb_build_object('eligibility','ineligible','fit_tier','remote_only','reason','On-site project; vendor is remote-only.','distance_miles',null);
  end if;

  if p.project_place_id is not null then select * into pp from public.geo_places where id=p.project_place_id; end if;
  if v.base_place_id is not null then select * into vp from public.geo_places where id=v.base_place_id; end if;

  select exists(select 1 from public.vendor_service_areas a where a.vendor_id=v.id and a.active) into v_has_explicit_areas;

  if exists(select 1 from public.vendor_service_areas a where a.vendor_id=v.id and a.active and a.coverage_type='nationwide') then
    return jsonb_build_object('eligibility','eligible','fit_tier','nationwide','reason','Vendor explicitly serves on-site projects nationwide.','distance_miles',null);
  end if;

  if pp.id is not null then
    if exists(select 1 from public.vendor_service_areas a where a.vendor_id=v.id and a.active and a.coverage_type='place' and a.place_id=pp.id) then
      return jsonb_build_object('eligibility','eligible','fit_tier','exact_place','reason','Project is in an explicitly served city.','distance_miles',0);
    end if;
    if pp.market_id is not null and exists(select 1 from public.vendor_service_areas a where a.vendor_id=v.id and a.active and a.coverage_type='market' and a.market_id=pp.market_id) then
      return jsonb_build_object('eligibility','eligible','fit_tier','market','reason','Project is inside an explicitly served metro market.','distance_miles',null);
    end if;
    if exists(select 1 from public.vendor_service_areas a where a.vendor_id=v.id and a.active and a.coverage_type='state' and a.state_code=pp.state_code) then
      return jsonb_build_object('eligibility','eligible','fit_tier','state','reason','Vendor explicitly serves this state.','distance_miles',null);
    end if;
    select round((extensions.st_distance(origin.location, pp.location) / 1609.344)::numeric,1)
      into v_distance_miles
    from public.vendor_service_areas a
    join public.geo_places origin on origin.id=a.place_id
    where a.vendor_id=v.id and a.active and a.coverage_type='radius'
      and origin.location is not null and pp.location is not null
      and extensions.st_dwithin(origin.location, pp.location, a.radius_miles * 1609.344)
    order by extensions.st_distance(origin.location, pp.location)
    limit 1;
    if v_distance_miles is not null then
      return jsonb_build_object('eligibility','eligible','fit_tier','radius','reason','Project is inside the vendor service radius.','distance_miles',v_distance_miles);
    end if;
  end if;

  if not v_has_explicit_areas and pp.id is not null and vp.id is not null and pp.id=vp.id then
    return jsonb_build_object('eligibility','eligible','fit_tier','same_place','reason','Project and vendor share the same canonical city.','distance_miles',0);
  end if;

  if v_has_explicit_areas and pp.id is not null then
    return jsonb_build_object('eligibility','ineligible','fit_tier','outside_coverage','reason','Project is outside the vendor''s configured on-site service area.','distance_miles',null);
  end if;

  return jsonb_build_object('eligibility',v_fit,'fit_tier','unknown','reason',v_reason,'distance_miles',null);
end;
$$;

revoke all on function public.kb_marketplace_geo_fit(uuid,uuid) from public;
grant execute on function public.kb_marketplace_geo_fit(uuid,uuid) to authenticated,service_role;
