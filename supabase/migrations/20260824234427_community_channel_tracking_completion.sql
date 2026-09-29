alter table public.groups
  add column if not exists channel_stage text,
  add column if not exists audience_segment text,
  add column if not exists best_posting_day text,
  add column if not exists posting_cadence text;

update public.groups
set channel_stage = case
  when join_status = 'member' then 'joined'
  when join_status = 'requested' then 'pending'
  else 'discovered'
end
where channel_stage is null;

alter table public.groups alter column channel_stage set default 'discovered';
alter table public.groups alter column channel_stage set not null;
alter table public.groups drop constraint if exists groups_channel_stage_check;
alter table public.groups add constraint groups_channel_stage_check
  check (channel_stage in ('discovered','requested','pending','joined','active','dormant','left'));
alter table public.groups drop constraint if exists groups_audience_segment_check;
alter table public.groups add constraint groups_audience_segment_check
  check (audience_segment is null or audience_segment in ('church_leader','ministry_nonprofit','christian_vendor','local_community','denominational_network','low_relevance'));

create table if not exists public.growth_group_admin_relationships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  admin_name text,
  profile_url text,
  relationship_status text not null default 'unknown'
    check (relationship_status in ('unknown','cold','warm','active')),
  last_touched_at date,
  next_review_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists growth_group_admin_relationship_identity_idx
  on public.growth_group_admin_relationships (group_id, coalesce(lower(trim(profile_url)),''), coalesce(lower(trim(admin_name)),''));
create index if not exists growth_group_admin_relationship_review_idx
  on public.growth_group_admin_relationships (next_review_at)
  where next_review_at is not null;

alter table public.growth_group_admin_relationships enable row level security;
drop policy if exists growth_group_admin_relationships_admin_select on public.growth_group_admin_relationships;
create policy growth_group_admin_relationships_admin_select
  on public.growth_group_admin_relationships for select to authenticated
  using ((select public.kb_is_platform_admin()));
drop policy if exists growth_group_admin_relationships_admin_insert on public.growth_group_admin_relationships;
create policy growth_group_admin_relationships_admin_insert
  on public.growth_group_admin_relationships for insert to authenticated
  with check ((select public.kb_is_platform_admin()));
drop policy if exists growth_group_admin_relationships_admin_update on public.growth_group_admin_relationships;
create policy growth_group_admin_relationships_admin_update
  on public.growth_group_admin_relationships for update to authenticated
  using ((select public.kb_is_platform_admin()))
  with check ((select public.kb_is_platform_admin()));
drop policy if exists growth_group_admin_relationships_admin_delete on public.growth_group_admin_relationships;
create policy growth_group_admin_relationships_admin_delete
  on public.growth_group_admin_relationships for delete to authenticated
  using ((select public.kb_is_platform_admin()));
revoke all on public.growth_group_admin_relationships from public, anon;
grant select, insert, update, delete on public.growth_group_admin_relationships to authenticated;

insert into public.growth_group_admin_relationships
  (group_id, admin_name, profile_url, relationship_status, last_touched_at, notes)
select
  g.id,
  nullif(trim(g.admin_name),''),
  nullif(trim(g.admin_fb_url),''),
  case lower(coalesce(g.admin_relationship_status,'unknown'))
    when 'active' then 'active'
    when 'passive' then 'warm'
    when 'no_relationship' then 'cold'
    else 'unknown'
  end,
  g.admin_last_touched_at,
  nullif(trim(g.admin_deal_notes),'')
from public.groups g
where nullif(trim(g.admin_name),'') is not null or nullif(trim(g.admin_fb_url),'') is not null
on conflict do nothing;

alter table public.growth_drops
  add column if not exists approval_status text not null default 'draft',
  add column if not exists draft_content text,
  add column if not exists response_count integer not null default 0,
  add column if not exists review_requested_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists tracked_at timestamptz;

update public.growth_drops
set approval_status = case when status = 'posted' then 'posted' else 'approved' end
where approval_status = 'draft' and (status = 'posted' or status = 'link_generated');

alter table public.growth_drops drop constraint if exists growth_drops_approval_status_check;
alter table public.growth_drops add constraint growth_drops_approval_status_check
  check (approval_status in ('draft','review','approved','posted','tracked'));
alter table public.growth_drops drop constraint if exists growth_drops_response_count_check;
alter table public.growth_drops add constraint growth_drops_response_count_check
  check (response_count >= 0);

create or replace function private.kb_sync_growth_drop_approval_v0()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.status = 'posted' and new.approval_status not in ('posted','tracked') then
    new.approval_status := 'posted';
  end if;
  return new;
end;
$function$;

drop trigger if exists kb_growth_drop_approval_sync_v0 on public.growth_drops;
create trigger kb_growth_drop_approval_sync_v0
before insert or update of status on public.growth_drops
for each row execute function private.kb_sync_growth_drop_approval_v0();

create or replace function public.kb_admin_set_growth_drop_approval_v0(
  p_drop_id uuid,
  p_target text,
  p_draft_content text default null,
  p_response_count integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_drop public.growth_drops%rowtype;
  v_target text := lower(trim(coalesce(p_target,'')));
begin
  if not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'Content approval requires platform administrator access' using errcode = '42501';
  end if;
  if v_target not in ('draft','review','approved') then
    raise exception 'Unsupported content approval target' using errcode = '22023';
  end if;
  if p_response_count is not null and p_response_count < 0 then
    raise exception 'Response count cannot be negative' using errcode = '22023';
  end if;

  select * into v_drop from public.growth_drops where id = p_drop_id for update;
  if not found then raise exception 'Content record not found' using errcode = 'P0002'; end if;

  if v_target = 'review' and v_drop.approval_status <> 'draft' then
    raise exception 'Only a draft can enter review' using errcode = '22023';
  elsif v_target = 'approved' and v_drop.approval_status <> 'review' then
    raise exception 'Only reviewed content can be approved' using errcode = '22023';
  elsif v_target = 'draft' and v_drop.approval_status not in ('draft','review') then
    raise exception 'Posted or approved content cannot be moved back to draft' using errcode = '22023';
  end if;

  update public.growth_drops
  set approval_status = v_target,
      draft_content = coalesce(p_draft_content, draft_content),
      response_count = coalesce(p_response_count, response_count),
      review_requested_at = case when v_target = 'review' then clock_timestamp() else review_requested_at end,
      approved_at = case when v_target = 'approved' then clock_timestamp() else null end,
      approved_by = case when v_target = 'approved' then auth.uid() else null end
  where id = p_drop_id;

  return (select to_jsonb(d) from public.growth_drops d where d.id = p_drop_id);
end;
$function$;

revoke all on function public.kb_admin_set_growth_drop_approval_v0(uuid,text,text,integer) from public, anon;
grant execute on function public.kb_admin_set_growth_drop_approval_v0(uuid,text,text,integer) to authenticated, service_role;

create or replace function public.kb_admin_get_growth_channel_health_v0()
returns table (
  group_id uuid,
  posted_count bigint,
  response_count bigint,
  tracked_signup_count bigint,
  pending_content_count bigint,
  channel_health_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'Channel health requires platform administrator access' using errcode = '42501';
  end if;
  return query
  with drops as (
    select d.group_id,
      count(*) filter (where d.status = 'posted')::bigint as posted_count,
      coalesce(sum(d.response_count),0)::bigint as response_count,
      count(*) filter (where d.approval_status in ('draft','review','approved'))::bigint as pending_content_count
    from public.growth_drops d
    where d.group_id is not null
    group by d.group_id
  ), signups as (
    select w.group_id, count(*)::bigint as tracked_signup_count
    from public.waitlist w
    where w.group_id is not null and coalesce(w.attribution_verified,false)
    group by w.group_id
  )
  select g.id,
    coalesce(d.posted_count,0),
    coalesce(d.response_count,0),
    coalesce(s.tracked_signup_count,0),
    coalesce(d.pending_content_count,0),
    case
      when coalesce(s.tracked_signup_count,0) > 0 or coalesce(d.response_count,0) > 0 then 'producing'
      when g.channel_stage in ('dormant','left') and coalesce(d.posted_count,0) > 0 then 'dead_weight'
      when coalesce(d.posted_count,0) > 0 then 'neutral'
      else 'untested'
    end::text
  from public.groups g
  left join drops d on d.group_id = g.id
  left join signups s on s.group_id = g.id;
end;
$function$;

revoke all on function public.kb_admin_get_growth_channel_health_v0() from public, anon;
grant execute on function public.kb_admin_get_growth_channel_health_v0() to authenticated, service_role;

alter function public.kb_admin_get_founder_brief_v0(timestamptz)
  rename to kb_admin_get_founder_brief_staleness_20260824_v1;

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
  v_content_actions jsonb;
  v_in_review bigint;
  v_approved bigint;
  v_producing bigint;
  v_neutral bigint;
  v_dead_weight bigint;
begin
  v_brief := public.kb_admin_get_founder_brief_staleness_20260824_v1(p_as_of);

  select
    count(*) filter (where approval_status = 'review'),
    count(*) filter (where approval_status = 'approved')
  into v_in_review, v_approved
  from public.growth_drops;

  select
    count(*) filter (where channel_health_status = 'producing'),
    count(*) filter (where channel_health_status = 'neutral'),
    count(*) filter (where channel_health_status = 'dead_weight')
  into v_producing, v_neutral, v_dead_weight
  from public.kb_admin_get_growth_channel_health_v0();

  v_metrics := coalesce(v_brief->'metrics', '{}'::jsonb) || jsonb_build_object(
    'content_in_review', jsonb_build_object('value', v_in_review, 'status', 'available'),
    'approved_content_waiting_post', jsonb_build_object('value', v_approved, 'status', 'available'),
    'producing_channels', jsonb_build_object('value', v_producing, 'status', 'available'),
    'neutral_channels', jsonb_build_object('value', v_neutral, 'status', 'available'),
    'dead_weight_channels', jsonb_build_object('value', v_dead_weight, 'status', 'available')
  );

  select coalesce(jsonb_agg(jsonb_build_object(
    'action_key', 'content-approval:' || d.id::text,
    'action_type', 'content_approval',
    'priority', case when d.approval_status = 'review' then 84 else 78 end,
    'title', case when d.approval_status = 'review' then 'Review a Growth content draft' else 'Post approved Growth content manually' end,
    'reason', coalesce(g.name,d.group_name,'A Growth channel') || case when d.approval_status = 'review' then ' has a draft waiting for a human approval decision.' else ' has approved content waiting for a human to post it.' end,
    'recommended_action', case when d.approval_status = 'review' then 'Open the content record, review the exact draft, then approve or return it to draft.' else 'Open the approved record, copy its tracked link, and post manually only when the channel rules permit.' end,
    'entity_type', 'growth_drop',
    'entity_id', d.id,
    'evidence', jsonb_build_object('group_id',d.group_id,'group_name',coalesce(g.name,d.group_name),'approval_status',d.approval_status,'platform',d.platform,'audience_type',d.audience_type),
    'destination', 'growth',
    'generated_by', 'community_channel_v1'
  ) order by case when d.approval_status = 'review' then 0 else 1 end, d.created_at, d.id), '[]'::jsonb)
  into v_content_actions
  from (
    select * from public.growth_drops
    where approval_status in ('review','approved')
    order by case when approval_status = 'review' then 0 else 1 end, created_at, id
    limit 6
  ) d
  left join public.groups g on g.id = d.group_id;

  return v_brief || jsonb_build_object(
    'contract_version', 2,
    'metrics', v_metrics,
    'actions', v_content_actions || coalesce(v_brief->'actions', '[]'::jsonb)
  );
end;
$function$;

revoke all on function public.kb_admin_get_founder_brief_v0(timestamptz) from public, anon;
grant execute on function public.kb_admin_get_founder_brief_v0(timestamptz) to authenticated, service_role;
