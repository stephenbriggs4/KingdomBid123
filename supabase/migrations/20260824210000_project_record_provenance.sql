begin;

alter table public.projects
  add column if not exists record_origin text;

update public.projects
set record_origin = 'qa'
where record_origin is null;

alter table public.projects
  alter column record_origin set default 'unclassified',
  alter column record_origin set not null;

alter table public.projects
  drop constraint if exists projects_record_origin_check;

alter table public.projects
  add constraint projects_record_origin_check
  check (record_origin in ('real', 'synthetic', 'qa', 'unclassified'));

comment on column public.projects.record_origin is
  'Administrator-controlled provenance. Only real records count toward operating cohort metrics; new records remain unclassified until reviewed.';

create or replace function private.kb_guard_project_record_origin_v0()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' then
    new.record_origin := coalesce(new.record_origin, 'unclassified');
    if new.record_origin <> 'unclassified'
       and current_user <> 'postgres'
       and not coalesce(public.kb_is_platform_admin(), false) then
      raise exception 'Project provenance requires platform administrator access'
        using errcode = '42501';
    end if;
  elsif new.record_origin is distinct from old.record_origin
        and current_user <> 'postgres'
        and not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'Project provenance requires platform administrator access'
      using errcode = '42501';
  end if;
  return new;
end;
$function$;

revoke all on function private.kb_guard_project_record_origin_v0() from public, anon, authenticated;

drop trigger if exists kb_guard_project_record_origin_v0 on public.projects;
create trigger kb_guard_project_record_origin_v0
before insert or update of record_origin on public.projects
for each row execute function private.kb_guard_project_record_origin_v0();

create or replace function public.kb_admin_set_project_record_origin_v0(
  p_project_id uuid,
  p_record_origin text,
  p_reason text default null
)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_origin text := lower(trim(coalesce(p_record_origin, '')));
  v_project public.projects;
begin
  if not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'Project provenance requires platform administrator access'
      using errcode = '42501';
  end if;

  if v_origin not in ('real', 'synthetic', 'qa', 'unclassified') then
    raise exception 'Invalid project record origin'
      using errcode = '22023';
  end if;

  update public.projects
  set record_origin = v_origin
  where id = p_project_id
  returning * into v_project;

  if not found then
    raise exception 'Project not found'
      using errcode = 'P0002';
  end if;

  return v_project;
end;
$function$;

revoke all on function public.kb_admin_set_project_record_origin_v0(uuid,text,text) from public, anon;
grant execute on function public.kb_admin_set_project_record_origin_v0(uuid,text,text) to authenticated, service_role;

do $migration$
begin
  if to_regprocedure('public.kb_admin_get_founder_brief_v0(timestamp with time zone)') is not null
     and to_regprocedure('public.kb_admin_get_founder_brief_legacy_20260824(timestamp with time zone)') is null then
    alter function public.kb_admin_get_founder_brief_v0(timestamp with time zone)
      rename to kb_admin_get_founder_brief_legacy_20260824;
  end if;
end
$migration$;

revoke all on function public.kb_admin_get_founder_brief_legacy_20260824(timestamp with time zone)
  from public, anon, authenticated, service_role;

create or replace function public.kb_admin_get_founder_brief_v0(
  p_as_of timestamp with time zone default now()
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_brief jsonb;
  v_metrics jsonb;
  v_actions jsonb;
  v_market_health jsonb;
  v_real_total bigint;
  v_open bigint;
  v_hired bigint;
  v_in_progress bigint;
  v_completed bigint;
  v_without_coverage bigint;
begin
  v_brief := public.kb_admin_get_founder_brief_legacy_20260824(p_as_of);

  select
    count(*),
    count(*) filter (where status = 'open'),
    count(*) filter (where status = 'hired'),
    count(*) filter (where status = 'in_progress'),
    count(*) filter (where status = 'completed' and completed_at is not null)
  into v_real_total, v_open, v_hired, v_in_progress, v_completed
  from public.projects
  where record_origin = 'real';

  select count(*)
  into v_without_coverage
  from public.projects p
  where p.record_origin = 'real'
    and p.status = 'open'
    and not exists (
      select 1 from public.project_vendor_links pvl
      where pvl.project_id = p.id
        and pvl.stage in ('invited','bid','shortlisted','hired')
    )
    and not exists (
      select 1 from public.bids b
      where b.project_id = p.id
        and b.status in ('pending','hired')
    );

  v_metrics := coalesce(v_brief->'metrics', '{}'::jsonb)
    || jsonb_build_object(
      'real_project_records', jsonb_build_object('value', v_real_total, 'status', 'available'),
      'open_projects', jsonb_build_object('value', v_open, 'status', 'available'),
      'hired_projects', jsonb_build_object('value', v_hired, 'status', 'available'),
      'in_progress_projects', jsonb_build_object('value', v_in_progress, 'status', 'available'),
      'completed_projects', jsonb_build_object('value', v_completed, 'status', 'available'),
      'projects_without_vendor_coverage', jsonb_build_object('value', v_without_coverage, 'status', 'available')
    );

  select coalesce(jsonb_agg(action_item order by action_index), '[]'::jsonb)
  into v_actions
  from jsonb_array_elements(coalesce(v_brief->'actions', '[]'::jsonb)) with ordinality as actions(action_item, action_index)
  where action_item->>'action_type' <> 'marketplace_coverage'
     or exists (
       select 1
       from public.projects p
       where p.id = nullif(action_item->>'entity_id', '')::uuid
         and p.record_origin = 'real'
     );

  with demand as (
    select
      coalesce(nullif(p.primary_category,''), nullif(p.category,''), 'Uncategorized') as category,
      coalesce(nullif(p.project_state,''), nullif(p.project_city,''), nullif(p.city,''), 'Unspecified') as geography,
      count(*)::bigint as open_projects,
      count(*) filter (
        where exists (
          select 1 from public.bids b
          where b.project_id = p.id and b.status in ('pending','hired')
        )
      )::bigint as projects_with_active_bids
    from public.projects p
    where p.record_origin = 'real' and p.status = 'open'
    group by 1,2
  ), health as (
    select
      d.*,
      (
        select count(*)::bigint
        from public.vendors v
        where not coalesce(v.suspended,false)
          and (coalesce(v.verified,false) or v.verification_status = 'verified')
          and coalesce(nullif(v.primary_category,''), nullif(v.category,''), 'Uncategorized') = d.category
          and (d.geography = 'Unspecified' or v.service_state = d.geography or v.service_city = d.geography)
      ) as available_vendors
    from demand d
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'category', category,
    'geography', geography,
    'open_projects', open_projects,
    'available_vendors', available_vendors,
    'projects_with_active_bids', projects_with_active_bids,
    'coverage_status', case
      when available_vendors = 0 or projects_with_active_bids = 0 then 'critical'
      when open_projects > available_vendors * 2 then 'thin'
      else 'balanced'
    end,
    'status', 'available'
  ) order by
    case when available_vendors = 0 or projects_with_active_bids = 0 then 0 when open_projects > available_vendors * 2 then 1 else 2 end,
    open_projects desc
  ), '[]'::jsonb)
  into v_market_health
  from (select * from health order by open_projects desc limit 8) ranked_health;

  return v_brief
    || jsonb_build_object(
      'contract_version', 2,
      'project_provenance_scope', 'real_only',
      'metrics', v_metrics,
      'market_health', v_market_health,
      'actions', v_actions
    );
end;
$function$;

revoke all on function public.kb_admin_get_founder_brief_v0(timestamp with time zone) from public, anon;
grant execute on function public.kb_admin_get_founder_brief_v0(timestamp with time zone) to authenticated, service_role;

commit;
