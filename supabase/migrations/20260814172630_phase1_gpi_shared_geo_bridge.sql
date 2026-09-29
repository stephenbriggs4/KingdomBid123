alter table public.gpi_city_areas add column if not exists geo_place_id uuid references public.geo_places(id) on delete set null;
create unique index if not exists gpi_city_areas_geo_place_unique on public.gpi_city_areas(geo_place_id) where geo_place_id is not null;

update public.gpi_city_areas c
set geo_place_id = p.id
from public.gpi_markets m, public.geo_places p, public.geo_markets gm
where c.market_id=m.id
  and p.market_id=gm.id
  and m.slug=gm.slug
  and lower(btrim(p.city))=lower(btrim(c.label))
  and p.state_code='TX'
  and c.geo_place_id is distinct from p.id;

create or replace function public.gpi_service_search_public_opportunities_geo_v3(
  p_discovery_interest_keys text[] default '{}'::text[],
  p_city_area_id uuid default null,
  p_city_query text default null,
  p_market_slug text default 'dallas_fort_worth',
  p_schedule_types text[] default null,
  p_limit integer default 24
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_query text := btrim(coalesce(p_city_query,''));
  v_base jsonb;
  v_results jsonb := '[]'::jsonb;
  v_place public.geo_places%rowtype;
  v_geo_market public.geo_markets%rowtype;
  v_city_area_id uuid;
  v_location_status text := 'default_market';
  v_local_market_available boolean := true;
begin
  if p_city_area_id is not null then
    select c.geo_place_id into v_place.id
    from public.gpi_city_areas c
    where c.id=p_city_area_id and c.active;

    select public.gpi_service_search_public_opportunities_v2(
      p_discovery_interest_keys,
      p_city_area_id,
      p_market_slug,
      p_schedule_types,
      p_limit
    ) into v_base;

    return v_base || jsonb_build_object(
      'location_status','exact_supported',
      'requested_location',nullif(v_query,''),
      'local_market_available',true
    );
  end if;

  if v_query = '' then
    select public.gpi_service_search_public_opportunities_v2(
      p_discovery_interest_keys,
      null,
      p_market_slug,
      p_schedule_types,
      p_limit
    ) into v_base;
    return v_base || jsonb_build_object(
      'location_status','default_market',
      'requested_location',null,
      'local_market_available',true
    );
  end if;

  select p.* into v_place
  from public.geo_places p
  where p.active
    and (
      lower(btrim(p.display_label)) = lower(v_query)
      or lower(regexp_replace(p.display_label,'[^a-zA-Z0-9]+','','g')) = lower(regexp_replace(v_query,'[^a-zA-Z0-9]+','','g'))
      or lower(btrim(p.city)) = lower(v_query)
    )
  order by case when lower(btrim(p.display_label))=lower(v_query) then 0 else 1 end, p.id
  limit 1;

  if found then
    if v_place.market_id is not null then
      select * into v_geo_market from public.geo_markets where id=v_place.market_id and active;
    end if;

    select c.id into v_city_area_id
    from public.gpi_city_areas c
    join public.gpi_markets gm on gm.id=c.market_id and gm.active
    where c.active
      and c.geo_place_id=v_place.id
      and (v_geo_market.slug is null or gm.slug=v_geo_market.slug)
    order by c.id
    limit 1;

    if v_city_area_id is not null and v_geo_market.slug is not null then
      select public.gpi_service_search_public_opportunities_v2(
        p_discovery_interest_keys,
        v_city_area_id,
        v_geo_market.slug,
        p_schedule_types,
        p_limit
      ) into v_base;
      return v_base || jsonb_build_object(
        'location_status','exact_supported',
        'requested_location',v_query,
        'resolved_place',jsonb_build_object('id',v_place.id,'label',v_place.display_label,'city',v_place.city,'state_code',v_place.state_code,'market_slug',v_geo_market.slug),
        'local_market_available',true
      );
    end if;

    v_location_status := 'unsupported_market';
    v_local_market_available := false;
  else
    v_location_status := 'unmapped';
    v_local_market_available := false;
  end if;

  -- Preserve existing matching/taxonomy behavior but never leak DFW local
  -- results into an unsupported city. Only location-independent virtual rows survive.
  select public.gpi_service_search_public_opportunities_v2(
    p_discovery_interest_keys,
    null,
    'dallas_fort_worth',
    p_schedule_types,
    p_limit
  ) into v_base;

  select coalesce(jsonb_agg(x.elem order by x.ord),'[]'::jsonb)
  into v_results
  from jsonb_array_elements(coalesce(v_base->'results','[]'::jsonb)) with ordinality as x(elem,ord)
  where lower(coalesce(x.elem->'opportunity'->>'location_mode',''))='virtual';

  v_base := jsonb_set(v_base,'{results}',v_results,true);
  v_base := jsonb_set(v_base,'{result_count}',to_jsonb(jsonb_array_length(v_results)),true);
  v_base := jsonb_set(v_base,'{fallback_tier}',to_jsonb(case when jsonb_array_length(v_results)>0 then 'virtual_only' else 'empty' end::text),true);
  v_base := v_base || jsonb_build_object(
    'location_status',v_location_status,
    'requested_location',v_query,
    'resolved_place',case when v_place.id is null then null else jsonb_build_object('id',v_place.id,'label',v_place.display_label,'city',v_place.city,'state_code',v_place.state_code) end,
    'local_market_available',v_local_market_available,
    'market',null,
    'selected_city_area',null
  );
  return v_base;
end;
$$;

revoke all on function public.gpi_service_search_public_opportunities_geo_v3(text[],uuid,text,text,text[],integer) from public;
grant execute on function public.gpi_service_search_public_opportunities_geo_v3(text[],uuid,text,text,text[],integer) to service_role;
