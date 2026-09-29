alter table public.groups
  add column if not exists growth_last_activity_at date,
  add column if not exists growth_next_review_at date,
  add column if not exists growth_review_reason text;

alter table public.growth_partners
  add column if not exists last_activity_at date,
  add column if not exists next_review_at date,
  add column if not exists review_reason text;

alter table public.project_vendor_links
  add column if not exists next_review_at timestamptz,
  add column if not exists review_reason text;

comment on column public.groups.growth_next_review_at is
  'Explicit founder-set review date. No universal staleness interval is inferred.';
comment on column public.growth_partners.next_review_at is
  'Explicit founder-set review date. No universal staleness interval is inferred.';
comment on column public.project_vendor_links.next_review_at is
  'Explicit founder-set review timestamp. Only links belonging to Real projects enter Founder staleness actions.';

create index if not exists groups_growth_next_review_idx
  on public.groups (growth_next_review_at)
  where status = 'active' and growth_next_review_at is not null;
create index if not exists growth_partners_next_review_idx
  on public.growth_partners (next_review_at)
  where next_review_at is not null;
create index if not exists project_vendor_links_next_review_idx
  on public.project_vendor_links (next_review_at)
  where next_review_at is not null;

create or replace view private.kb_founder_staleness_queue_v0
with (security_invoker = true)
as
select
  'community'::text as pipeline,
  'group'::text as entity_type,
  g.id as entity_id,
  g.name::text as entity_name,
  coalesce(nullif(g.growth_review_reason,''), nullif(g.growth_next_action,''), 'Review this community record.')::text as reason,
  coalesce(g.growth_last_activity_at, g.admin_last_touched_at, g.posting_rules_reviewed_at, g.join_confirmed_at, g.join_requested_at)::timestamptz as last_activity_at,
  g.growth_next_review_at::timestamptz as next_review_at,
  greatest(0, current_date - g.growth_next_review_at)::integer as days_overdue,
  case when g.growth_next_review_at <= current_date then 'overdue' else 'scheduled' end::text as review_state,
  'growth'::text as destination,
  jsonb_build_object(
    'platform', g.platform,
    'join_status', g.join_status,
    'priority_tier', g.growth_priority_tier,
    'rule_basis', g.posting_rule_basis
  ) as evidence
from public.groups g
where g.status = 'active' and g.growth_next_review_at is not null

union all

select
  'partner'::text,
  'growth_partner'::text,
  gp.id,
  gp.name::text,
  coalesce(nullif(gp.review_reason,''), 'Review this partner relationship.')::text,
  coalesce(gp.last_activity_at, gp.last_contacted_at)::timestamptz,
  gp.next_review_at::timestamptz,
  greatest(0, current_date - gp.next_review_at)::integer,
  case when gp.next_review_at <= current_date then 'overdue' else 'scheduled' end::text,
  'growth'::text,
  jsonb_build_object('partner_type',gp.type,'status',gp.status,'contact_name',gp.contact_name)
from public.growth_partners gp
where gp.next_review_at is not null
  and lower(coalesce(gp.status,'active')) not in ('closed','rejected','inactive')

union all

select
  'project_vendor'::text,
  'project_vendor_link'::text,
  pvl.id,
  coalesce(p.title,'Real project vendor follow-up')::text,
  coalesce(nullif(pvl.review_reason,''), 'Review this project-linked vendor relationship.')::text,
  pvl.last_activity_at,
  pvl.next_review_at,
  greatest(0, (current_date - pvl.next_review_at::date))::integer,
  case when pvl.next_review_at <= now() then 'overdue' else 'scheduled' end::text,
  'projects'::text,
  jsonb_build_object('project_id',p.id,'project_title',p.title,'stage',pvl.stage,'vendor_id',pvl.vendor_id,'vendor_user_id',pvl.vendor_user_id)
from public.project_vendor_links pvl
join public.projects p on p.id = pvl.project_id
where p.record_origin = 'real'
  and pvl.next_review_at is not null;

revoke all on private.kb_founder_staleness_queue_v0 from public, anon, authenticated;

alter function public.kb_admin_get_founder_brief_v0(timestamptz)
  rename to kb_admin_get_founder_brief_liquidity_20260824_v1;

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
  v_stale_actions jsonb;
  v_overdue bigint;
  v_scheduled bigint;
  v_unscheduled bigint;
begin
  v_brief := public.kb_admin_get_founder_brief_liquidity_20260824_v1(p_as_of);

  select
    count(*) filter (where review_state = 'overdue'),
    count(*) filter (where review_state = 'scheduled')
  into v_overdue, v_scheduled
  from private.kb_founder_staleness_queue_v0;

  select
    (select count(*) from public.groups g
      where g.status = 'active'
        and g.growth_next_review_at is null
        and (g.join_status in ('member','requested') or g.posting_rules_reviewed_at is not null or g.growth_priority_tier = 'A'))
    +
    (select count(*) from public.growth_partners gp
      where gp.next_review_at is null
        and lower(coalesce(gp.status,'active')) not in ('closed','rejected','inactive'))
    +
    (select count(*) from public.project_vendor_links pvl
      join public.projects p on p.id = pvl.project_id
      where p.record_origin = 'real'
        and pvl.next_review_at is null
        and pvl.stage in ('invited','bid','shortlisted'))
  into v_unscheduled;

  v_metrics := coalesce(v_brief->'metrics', '{}'::jsonb) || jsonb_build_object(
    'overdue_follow_ups', jsonb_build_object('value', v_overdue, 'status', 'available'),
    'scheduled_follow_ups', jsonb_build_object('value', v_scheduled, 'status', 'available'),
    'unscheduled_relationship_records', jsonb_build_object('value', v_unscheduled, 'status', 'available')
  );

  select coalesce(jsonb_agg(jsonb_build_object(
    'action_key', 'staleness:' || q.entity_type || ':' || q.entity_id::text,
    'action_type', 'pipeline_staleness',
    'priority', least(94, 86 + q.days_overdue),
    'title', 'Review an overdue ' || replace(q.pipeline,'_',' ') || ' follow-up',
    'reason', q.entity_name || ' passed its explicit review date by ' || q.days_overdue::text || ' day(s). ' || q.reason,
    'recommended_action', 'Review the live record, update the next action, and choose the next real review date.',
    'entity_type', q.entity_type,
    'entity_id', q.entity_id,
    'evidence', q.evidence || jsonb_build_object(
      'pipeline',q.pipeline,
      'next_review_at',q.next_review_at,
      'last_activity_at',q.last_activity_at,
      'days_overdue',q.days_overdue,
      'review_state',q.review_state
    ),
    'destination', q.destination,
    'generated_by', 'staleness_v1'
  ) order by q.days_overdue desc, q.next_review_at, q.entity_id), '[]'::jsonb)
  into v_stale_actions
  from (
    select * from private.kb_founder_staleness_queue_v0
    where review_state = 'overdue'
    order by days_overdue desc, next_review_at, entity_id
    limit 6
  ) q;

  return v_brief || jsonb_build_object(
    'contract_version', 2,
    'metrics', v_metrics,
    'actions', v_stale_actions || coalesce(v_brief->'actions', '[]'::jsonb)
  );
end;
$function$;

revoke all on function public.kb_admin_get_founder_brief_v0(timestamptz) from public, anon;
grant execute on function public.kb_admin_get_founder_brief_v0(timestamptz) to authenticated, service_role;
