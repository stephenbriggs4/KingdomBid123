alter table public.projects
  add column if not exists proposal_response_window_ends_at timestamptz,
  add column if not exists qualified_comparable_proposal_count integer not null default 0,
  add column if not exists liquidity_status text not null default 'not_applicable',
  add column if not exists liquidity_evaluated_at timestamptz,
  add column if not exists thin_coverage_alerted_at timestamptz,
  add column if not exists thin_coverage_resolved_at timestamptz;

alter table public.projects drop constraint if exists projects_liquidity_status_check;
alter table public.projects add constraint projects_liquidity_status_check
  check (liquidity_status in ('not_applicable','waiting_for_window','collecting','thin','healthy'));

alter table public.projects drop constraint if exists projects_qualified_comparable_proposal_count_check;
alter table public.projects add constraint projects_qualified_comparable_proposal_count_check
  check (qualified_comparable_proposal_count >= 0);

comment on column public.projects.proposal_response_window_ends_at is
  'Explicit project-level deadline after which real-project proposal liquidity may be judged thin. No platform default is inferred.';
comment on column public.projects.qualified_comparable_proposal_count is
  'Persisted count of verified, unsuspended vendor proposals with amount, timeline, and cover letter submitted by the explicit response-window deadline.';
comment on column public.projects.liquidity_status is
  'Real/open project liquidity state. Thin requires an elapsed explicit response window and fewer than two qualified comparable proposals.';

create index if not exists projects_real_liquidity_status_idx
  on public.projects (liquidity_status, proposal_response_window_ends_at)
  where record_origin = 'real' and status = 'open';

create or replace function private.kb_refresh_project_liquidity_v0(
  p_project_id uuid,
  p_as_of timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_project public.projects%rowtype;
  v_count integer := 0;
  v_state text := 'not_applicable';
  v_now timestamptz := coalesce(p_as_of, now());
begin
  select * into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then return; end if;

  if v_project.record_origin = 'real' and v_project.status = 'open' then
    if v_project.proposal_response_window_ends_at is null then
      v_state := 'waiting_for_window';
    else
      select count(distinct coalesce(v.user_id, v.id))::integer
      into v_count
      from public.bids b
      join public.vendors v
        on v.id = b.vendor_id or (b.vendor_user_id is not null and v.user_id = b.vendor_user_id)
      where b.project_id = p_project_id
        and b.status in ('pending','hired')
        and b.withdrawn_at is null
        and coalesce(b.submitted_at, b.created_at) <= v_project.proposal_response_window_ends_at
        and not coalesce(v.suspended, false)
        and (coalesce(v.verified, false) or v.verification_status = 'verified')
        and coalesce(b.amount, 0) > 0
        and nullif(trim(b.timeline), '') is not null
        and nullif(trim(b.cover_letter), '') is not null;

      if v_count >= 2 then
        v_state := 'healthy';
      elsif v_now >= v_project.proposal_response_window_ends_at then
        v_state := 'thin';
      else
        v_state := 'collecting';
      end if;
    end if;
  end if;

  update public.projects
  set qualified_comparable_proposal_count = v_count,
      liquidity_status = v_state,
      liquidity_evaluated_at = clock_timestamp(),
      thin_coverage_alerted_at = case
        when v_state = 'thin' then coalesce(thin_coverage_alerted_at, clock_timestamp())
        else thin_coverage_alerted_at
      end,
      thin_coverage_resolved_at = case
        when v_state = 'thin' then null
        when v_state = 'healthy' and thin_coverage_alerted_at is not null
          then coalesce(thin_coverage_resolved_at, clock_timestamp())
        else thin_coverage_resolved_at
      end
  where id = p_project_id;
end;
$function$;

revoke all on function private.kb_refresh_project_liquidity_v0(uuid,timestamptz) from public, anon, authenticated;

create or replace function private.kb_project_liquidity_from_project_v0()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  perform private.kb_refresh_project_liquidity_v0(new.id, clock_timestamp());
  return new;
end;
$function$;

create or replace function private.kb_project_liquidity_from_bid_v0()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'DELETE' then
    perform private.kb_refresh_project_liquidity_v0(old.project_id, clock_timestamp());
    return old;
  end if;
  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    perform private.kb_refresh_project_liquidity_v0(old.project_id, clock_timestamp());
  end if;
  perform private.kb_refresh_project_liquidity_v0(new.project_id, clock_timestamp());
  return new;
end;
$function$;

drop trigger if exists kb_projects_liquidity_refresh_v0 on public.projects;
create trigger kb_projects_liquidity_refresh_v0
after insert or update of record_origin, status, proposal_response_window_ends_at
on public.projects for each row
execute function private.kb_project_liquidity_from_project_v0();

drop trigger if exists kb_bids_liquidity_refresh_v0 on public.bids;
create trigger kb_bids_liquidity_refresh_v0
after insert or update or delete on public.bids for each row
execute function private.kb_project_liquidity_from_bid_v0();

create or replace function public.kb_admin_refresh_project_liquidity_v0(p_as_of timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_id uuid;
  v_as_of timestamptz := coalesce(p_as_of, now());
  v_refreshed integer := 0;
begin
  if not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'Project liquidity refresh requires platform administrator access' using errcode = '42501';
  end if;

  for v_id in select id from public.projects loop
    perform private.kb_refresh_project_liquidity_v0(v_id, v_as_of);
    v_refreshed := v_refreshed + 1;
  end loop;

  return jsonb_build_object(
    'refreshed', v_refreshed,
    'real_projects', (select count(*) from public.projects where record_origin = 'real'),
    'thin', (select count(*) from public.projects where record_origin = 'real' and status = 'open' and liquidity_status = 'thin'),
    'as_of', v_as_of
  );
end;
$function$;

revoke all on function public.kb_admin_refresh_project_liquidity_v0(timestamptz) from public, anon;
grant execute on function public.kb_admin_refresh_project_liquidity_v0(timestamptz) to authenticated, service_role;

create or replace function public.kb_admin_set_project_response_window_v0(
  p_project_id uuid,
  p_window_ends_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_project public.projects%rowtype;
begin
  if not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'Setting a project response window requires platform administrator access' using errcode = '42501';
  end if;

  select * into v_project from public.projects where id = p_project_id for update;
  if not found then raise exception 'Project not found' using errcode = 'P0002'; end if;
  if v_project.record_origin <> 'real' then
    raise exception 'A response window can only be set for a real project' using errcode = '22023';
  end if;

  update public.projects
  set proposal_response_window_ends_at = p_window_ends_at
  where id = p_project_id;

  perform private.kb_refresh_project_liquidity_v0(p_project_id, clock_timestamp());

  return (
    select jsonb_build_object(
      'id', id,
      'proposal_response_window_ends_at', proposal_response_window_ends_at,
      'qualified_comparable_proposal_count', qualified_comparable_proposal_count,
      'liquidity_status', liquidity_status,
      'liquidity_evaluated_at', liquidity_evaluated_at
    )
    from public.projects where id = p_project_id
  );
end;
$function$;

revoke all on function public.kb_admin_set_project_response_window_v0(uuid,timestamptz) from public, anon;
grant execute on function public.kb_admin_set_project_response_window_v0(uuid,timestamptz) to authenticated, service_role;

alter function public.kb_admin_get_founder_brief_v0(timestamptz)
  rename to kb_admin_get_founder_brief_active_bids_20260824_v1;

create or replace function public.kb_admin_get_founder_brief_v0(p_as_of timestamptz default now())
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
  v_thin bigint;
  v_collecting bigint;
  v_waiting bigint;
  v_healthy bigint;
begin
  v_brief := public.kb_admin_get_founder_brief_active_bids_20260824_v1(p_as_of);

  select
    count(*) filter (where liquidity_status = 'thin'),
    count(*) filter (where liquidity_status = 'collecting'),
    count(*) filter (where liquidity_status = 'waiting_for_window'),
    count(*) filter (where liquidity_status = 'healthy')
  into v_thin, v_collecting, v_waiting, v_healthy
  from public.projects
  where record_origin = 'real' and status = 'open';

  v_metrics := coalesce(v_brief->'metrics', '{}'::jsonb) || jsonb_build_object(
    'projects_without_vendor_coverage', jsonb_build_object('value', v_thin, 'status', 'available'),
    'thin_coverage_projects', jsonb_build_object('value', v_thin, 'status', 'available'),
    'collecting_proposals_projects', jsonb_build_object('value', v_collecting, 'status', 'available'),
    'projects_waiting_for_response_window', jsonb_build_object('value', v_waiting, 'status', 'available'),
    'healthy_liquidity_projects', jsonb_build_object('value', v_healthy, 'status', 'available')
  );

  select coalesce(jsonb_agg(jsonb_build_object(
    'action_key', 'thin-coverage:' || p.id::text,
    'action_type', 'marketplace_coverage',
    'priority', 95,
    'title', 'Rescue a real project with thin proposal coverage',
    'reason', p.title || ' has ' || p.qualified_comparable_proposal_count::text || ' qualified comparable proposal(s) after its response window closed.',
    'recommended_action', 'Review scope clarity, then shortlist and invite qualified vendors inside FaithBid.',
    'entity_type', 'project',
    'entity_id', p.id,
    'evidence', jsonb_build_object(
      'record_origin', p.record_origin,
      'liquidity_status', p.liquidity_status,
      'qualified_comparable_proposal_count', p.qualified_comparable_proposal_count,
      'target', 2,
      'proposal_response_window_ends_at', p.proposal_response_window_ends_at,
      'thin_coverage_alerted_at', p.thin_coverage_alerted_at
    ),
    'destination', 'projects',
    'generated_by', 'liquidity_v1'
  ) order by p.thin_coverage_alerted_at, p.id), '[]'::jsonb)
  into v_actions
  from public.projects p
  where p.record_origin = 'real'
    and p.status = 'open'
    and p.liquidity_status = 'thin';

  return v_brief || jsonb_build_object(
    'contract_version', 2,
    'metrics', v_metrics,
    'actions', v_actions || coalesce(v_brief->'actions', '[]'::jsonb)
  );
end;
$function$;

revoke all on function public.kb_admin_get_founder_brief_v0(timestamptz) from public, anon;
grant execute on function public.kb_admin_get_founder_brief_v0(timestamptz) to authenticated, service_role;

do $block$
declare v_id uuid;
begin
  for v_id in select id from public.projects loop
    perform private.kb_refresh_project_liquidity_v0(v_id, clock_timestamp());
  end loop;
end;
$block$;
