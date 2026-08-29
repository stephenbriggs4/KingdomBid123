-- FaithBid 0218 - Stage 3 next-gathering occurrence intent
-- Depends on Stage 2 participation relationships and occurrence composite-key hardening.

begin;

do $$
begin
  if to_regclass('public.gpi_participation_relationships') is null then
    raise exception 'Stage 2 participation relationships are required before Stage 3';
  end if;

  if to_regclass('public.gpi_opportunity_occurrences') is null then
    raise exception 'GPI opportunity occurrences are required before Stage 3';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.gpi_participation_relationships'::regclass
      and contype in ('p', 'u')
      and conkey = array[
        (select attnum from pg_attribute where attrelid = 'public.gpi_participation_relationships'::regclass and attname = 'id'),
        (select attnum from pg_attribute where attrelid = 'public.gpi_participation_relationships'::regclass and attname = 'opportunity_id')
      ]::smallint[]
  ) then
    raise exception 'Stage 2 relationship/opportunity composite key is required before Stage 3';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.gpi_opportunity_occurrences'::regclass
      and contype in ('p', 'u')
      and conkey = array[
        (select attnum from pg_attribute where attrelid = 'public.gpi_opportunity_occurrences'::regclass and attname = 'id'),
        (select attnum from pg_attribute where attrelid = 'public.gpi_opportunity_occurrences'::regclass and attname = 'opportunity_id')
      ]::smallint[]
  ) then
    raise exception 'Occurrence/opportunity composite key is required before Stage 3';
  end if;
end;
$$;

create table public.gpi_participation_occurrence_intents (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null,
  opportunity_id uuid not null,
  occurrence_id uuid not null,
  status text not null,
  planned_at timestamptz not null,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gpi_participation_occurrence_intents_relationship_fkey
    foreign key (relationship_id, opportunity_id)
    references public.gpi_participation_relationships(id, opportunity_id)
    on delete restrict,
  constraint gpi_participation_occurrence_intents_occurrence_fkey
    foreign key (occurrence_id, opportunity_id)
    references public.gpi_opportunity_occurrences(id, opportunity_id)
    on delete restrict,
  constraint gpi_participation_occurrence_intents_natural_key
    unique (relationship_id, occurrence_id),
  constraint gpi_participation_occurrence_intents_id_relationship_key
    unique (id, relationship_id),
  constraint gpi_participation_occurrence_intents_status_check
    check (status in ('planning', 'removed')),
  constraint gpi_participation_occurrence_intents_state_check
    check ((status = 'planning' and removed_at is null) or (status = 'removed' and removed_at is not null and removed_at >= planned_at)),
  constraint gpi_participation_occurrence_intents_updated_check
    check (updated_at >= created_at),
  constraint gpi_participation_occurrence_intents_planned_check
    check (planned_at >= created_at - interval '5 minutes')
);

create index gpi_participation_occurrence_intents_relationship_status_idx on public.gpi_participation_occurrence_intents (relationship_id, status, updated_at desc);
create index gpi_participation_occurrence_intents_relationship_opportunity_fk_idx on public.gpi_participation_occurrence_intents (relationship_id, opportunity_id);
create index gpi_participation_occurrence_intents_occurrence_status_idx on public.gpi_participation_occurrence_intents (occurrence_id, status);
create index gpi_participation_occurrence_intents_occurrence_opportunity_fk_idx on public.gpi_participation_occurrence_intents (occurrence_id, opportunity_id);

create table public.gpi_participation_occurrence_intent_events (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null,
  relationship_id uuid not null,
  actor_profile_id uuid not null,
  event_type text not null,
  from_status text,
  to_status text not null,
  operation_id uuid not null unique,
  created_at timestamptz not null default now(),
  constraint gpi_participation_occurrence_intent_events_intent_relationship_fkey
    foreign key (intent_id, relationship_id)
    references public.gpi_participation_occurrence_intents(id, relationship_id)
    on delete restrict,
  constraint gpi_participation_occurrence_intent_events_relationship_fkey
    foreign key (relationship_id)
    references public.gpi_participation_relationships(id)
    on delete restrict,
  constraint gpi_participation_occurrence_intent_events_actor_fkey
    foreign key (actor_profile_id)
    references public.profiles(id)
    on delete restrict,
  constraint gpi_participation_occurrence_intent_events_status_check
    check ((from_status is null or from_status in ('planning', 'removed')) and to_status in ('planning', 'removed')),
  constraint gpi_participation_occurrence_intent_events_transition_check
    check ((event_type = 'planned' and from_status is null and to_status = 'planning') or (event_type = 'planned' and from_status = 'removed' and to_status = 'planning') or (event_type = 'removed' and from_status = 'planning' and to_status = 'removed'))
);

create index gpi_participation_occurrence_intent_events_intent_created_idx on public.gpi_participation_occurrence_intent_events (intent_id, created_at desc);
create index gpi_participation_occurrence_intent_events_intent_relationship_fk_idx on public.gpi_participation_occurrence_intent_events (intent_id, relationship_id);
create index gpi_participation_occurrence_intent_events_relationship_created_idx on public.gpi_participation_occurrence_intent_events (relationship_id, created_at desc);
create index gpi_participation_occurrence_intent_events_actor_created_idx on public.gpi_participation_occurrence_intent_events (actor_profile_id, created_at desc);

alter table public.gpi_participation_occurrence_intents enable row level security;
alter table public.gpi_participation_occurrence_intent_events enable row level security;
alter table public.gpi_participation_occurrence_intents force row level security;
alter table public.gpi_participation_occurrence_intent_events force row level security;

revoke all on table public.gpi_participation_occurrence_intents from public, anon, authenticated, service_role;
revoke all on table public.gpi_participation_occurrence_intent_events from public, anon, authenticated, service_role;

create function public.gpi_service_change_occurrence_intent(
  p_profile_id uuid,
  p_relationship_id uuid,
  p_occurrence_id uuid,
  p_action text,
  p_operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_relationship public.gpi_participation_relationships%rowtype;
  v_intent public.gpi_participation_occurrence_intents%rowtype;
  v_prior record;
  v_action text := lower(btrim(coalesce(p_action, '')));
  v_event_type text;
  v_from_status text;
  v_to_status text;
  v_now timestamptz := clock_timestamp();
begin
  if p_profile_id is null or p_relationship_id is null or p_occurrence_id is null or p_operation_id is null or v_action not in ('plan', 'remove') then
    raise exception 'Invalid occurrence intent input' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text, 0));

  select e.intent_id, e.relationship_id, e.actor_profile_id, e.event_type, i.opportunity_id, i.occurrence_id, i.status, i.planned_at, i.removed_at, i.updated_at
    into v_prior
  from public.gpi_participation_occurrence_intent_events e
  join public.gpi_participation_occurrence_intents i on i.id = e.intent_id
  where e.operation_id = p_operation_id;

  if found then
    v_event_type := case when v_action = 'plan' then 'planned' else 'removed' end;
    if v_prior.relationship_id <> p_relationship_id or v_prior.actor_profile_id <> p_profile_id or v_prior.occurrence_id <> p_occurrence_id or v_prior.event_type <> v_event_type then
      raise exception 'Operation ID has already been used' using errcode = '22023';
    end if;
    return jsonb_build_object('intent_id', v_prior.intent_id, 'relationship_id', v_prior.relationship_id, 'opportunity_id', v_prior.opportunity_id, 'occurrence_id', v_prior.occurrence_id, 'status', v_prior.status, 'effective', (v_prior.status = 'planning' and exists (select 1 from public.gpi_participation_relationships r join public.gpi_opportunities o on o.id = r.opportunity_id join public.gpi_opportunity_occurrences x on x.id = v_prior.occurrence_id and x.opportunity_id = r.opportunity_id where r.id = v_prior.relationship_id and r.seeker_profile_id = p_profile_id and r.status = 'active' and o.schedule_type = 'recurring' and public.gpi_is_public_eligible(o.id) and x.status = 'scheduled' and x.starts_at > v_now and x.confirmed_at between v_now - interval '14 days' and v_now and (x.registration_deadline is null or x.registration_deadline > v_now))), 'planned_at', v_prior.planned_at, 'removed_at', v_prior.removed_at, 'updated_at', v_prior.updated_at, 'idempotent_replay', true);
  end if;

  select * into v_relationship from public.gpi_participation_relationships r where r.id = p_relationship_id for update;

  if not found or v_relationship.seeker_profile_id <> p_profile_id then
    raise exception 'Participation relationship not found' using errcode = '42501';
  end if;

  if v_action = 'plan' and v_relationship.status <> 'active' then
    raise exception 'Participation relationship is not active' using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles p join auth.users u on u.id = p.id where p.id = p_profile_id and coalesce(p.account_status, 'active') = 'active' and coalesce(p.access_status, 'active') = 'active' and u.email_confirmed_at is not null) then
    raise exception 'An active account with a confirmed email is required' using errcode = '42501';
  end if;

  if v_action = 'plan' and not exists (select 1 from public.gpi_opportunities o join public.gpi_opportunity_occurrences x on x.opportunity_id = o.id where o.id = v_relationship.opportunity_id and o.schedule_type = 'recurring' and public.gpi_is_public_eligible(o.id) and x.id = p_occurrence_id and x.status = 'scheduled' and x.starts_at > v_now and x.confirmed_at between v_now - interval '14 days' and v_now and (x.registration_deadline is null or x.registration_deadline > v_now)) then
    raise exception 'Occurrence is not currently eligible' using errcode = '22023';
  end if;

  select * into v_intent from public.gpi_participation_occurrence_intents i where i.relationship_id = p_relationship_id and i.occurrence_id = p_occurrence_id for update;

  if v_action = 'plan' then
    if not found then
      insert into public.gpi_participation_occurrence_intents (relationship_id, opportunity_id, occurrence_id, status, planned_at, created_at, updated_at) values (p_relationship_id, v_relationship.opportunity_id, p_occurrence_id, 'planning', v_now, v_now, v_now) returning * into v_intent;
      v_from_status := null; v_to_status := 'planning'; v_event_type := 'planned';
    elsif v_intent.status = 'planning' then
      return jsonb_build_object('intent_id', v_intent.id, 'relationship_id', v_intent.relationship_id, 'opportunity_id', v_intent.opportunity_id, 'occurrence_id', v_intent.occurrence_id, 'status', v_intent.status, 'effective', true, 'planned_at', v_intent.planned_at, 'removed_at', v_intent.removed_at, 'updated_at', v_intent.updated_at, 'already_in_state', true);
    else
      v_from_status := v_intent.status;
      update public.gpi_participation_occurrence_intents set status = 'planning', planned_at = v_now, removed_at = null, updated_at = v_now where id = v_intent.id returning * into v_intent;
      v_to_status := 'planning'; v_event_type := 'planned';
    end if;
  else
    if not found then
      raise exception 'Occurrence intent not found' using errcode = '22023';
    elsif v_intent.opportunity_id <> v_relationship.opportunity_id then
      raise exception 'Occurrence intent opportunity mismatch' using errcode = '42501';
    elsif v_intent.status = 'removed' then
      return jsonb_build_object('intent_id', v_intent.id, 'relationship_id', v_intent.relationship_id, 'opportunity_id', v_intent.opportunity_id, 'occurrence_id', v_intent.occurrence_id, 'status', v_intent.status, 'effective', false, 'planned_at', v_intent.planned_at, 'removed_at', v_intent.removed_at, 'updated_at', v_intent.updated_at, 'already_in_state', true);
    else
      v_from_status := v_intent.status;
      update public.gpi_participation_occurrence_intents set status = 'removed', removed_at = v_now, updated_at = v_now where id = v_intent.id returning * into v_intent;
      v_to_status := 'removed'; v_event_type := 'removed';
    end if;
  end if;

  insert into public.gpi_participation_occurrence_intent_events (intent_id, relationship_id, actor_profile_id, event_type, from_status, to_status, operation_id, created_at) values (v_intent.id, p_relationship_id, p_profile_id, v_event_type, v_from_status, v_to_status, p_operation_id, v_now);

  return jsonb_build_object('intent_id', v_intent.id, 'relationship_id', v_intent.relationship_id, 'opportunity_id', v_intent.opportunity_id, 'occurrence_id', v_intent.occurrence_id, 'status', v_intent.status, 'effective', v_intent.status = 'planning', 'planned_at', v_intent.planned_at, 'removed_at', v_intent.removed_at, 'updated_at', v_intent.updated_at, 'idempotent_replay', false);
end;
$function$;

create function public.gpi_service_get_my_occurrence_intents(
  p_profile_id uuid,
  p_relationship_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_result jsonb;
begin
  if p_profile_id is null then
    raise exception 'Profile ID is required' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('intent_id', i.id, 'relationship_id', i.relationship_id, 'opportunity_id', i.opportunity_id, 'occurrence_id', i.occurrence_id, 'status', i.status, 'effective', true, 'planned_at', i.planned_at, 'removed_at', i.removed_at, 'updated_at', i.updated_at) order by x.starts_at, i.updated_at desc), '[]'::jsonb) into v_result
  from public.gpi_participation_occurrence_intents i
  join public.gpi_participation_relationships r on r.id = i.relationship_id and r.opportunity_id = i.opportunity_id
  join public.gpi_opportunities o on o.id = i.opportunity_id
  join public.gpi_opportunity_occurrences x on x.id = i.occurrence_id and x.opportunity_id = i.opportunity_id
  where r.seeker_profile_id = p_profile_id
    and r.status = 'active'
    and i.status = 'planning'
    and (p_relationship_id is null or r.id = p_relationship_id)
    and o.schedule_type = 'recurring'
    and public.gpi_is_public_eligible(o.id)
    and x.status = 'scheduled'
    and x.starts_at > now()
    and x.confirmed_at between now() - interval '14 days' and now()
    and (x.registration_deadline is null or x.registration_deadline > now());

  return v_result;
end;
$function$;

revoke all on function public.gpi_service_change_occurrence_intent(uuid, uuid, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.gpi_service_get_my_occurrence_intents(uuid, uuid) from public, anon, authenticated;

grant execute on function public.gpi_service_change_occurrence_intent(uuid, uuid, uuid, text, uuid) to service_role;
grant execute on function public.gpi_service_get_my_occurrence_intents(uuid, uuid) to service_role;

comment on table public.gpi_participation_occurrence_intents is 'Private participant intent for one eligible recurring occurrence; not RSVP, attendance, membership, or host-visible data.';
comment on table public.gpi_participation_occurrence_intent_events is 'Append-only audit history for Stage 3 participant occurrence-intent state changes.';
comment on function public.gpi_service_change_occurrence_intent(uuid, uuid, uuid, text, uuid) is 'Service-role-only participant intent mutation for one occurrence.';
comment on function public.gpi_service_get_my_occurrence_intents(uuid, uuid) is 'Service-role-only read of caller-owned future effective occurrence intents.';

commit;
