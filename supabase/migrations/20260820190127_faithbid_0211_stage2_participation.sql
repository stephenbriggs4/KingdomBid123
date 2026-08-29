-- FaithBid 0211 - Stage 2 recurring participation
-- REVIEW DRAFT ONLY. NOT APPLIED TO ANY SUPABASE PROJECT.
-- Generated against the live primary GPI schema inspected 2026-08-20.
-- The first consent-policy row must be inserted separately after its exact UI copy
-- and body hash are approved. This migration intentionally invents no consent copy.

begin;

-- -----------------------------------------------------------------------------
-- Supporting relational keys
-- -----------------------------------------------------------------------------

alter table public.gpi_opportunities
  add constraint gpi_opportunities_id_organization_id_key
  unique (id, organization_id);

alter table public.gpi_connection_requests
  add constraint gpi_connection_requests_id_seeker_opportunity_key
  unique (id, seeker_profile_id, opportunity_id);

-- -----------------------------------------------------------------------------
-- Consent policies
-- -----------------------------------------------------------------------------

create table public.gpi_participation_consent_policies (
  version text primary key,
  body_hash text not null,
  effective_at timestamptz not null,
  retired_at timestamptz,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint gpi_participation_consent_policies_version_check
    check (version = btrim(version) and char_length(version) between 1 and 80),
  constraint gpi_participation_consent_policies_body_hash_check
    check (body_hash ~ '^[0-9a-f]{64}$'),
  constraint gpi_participation_consent_policies_dates_check
    check (retired_at is null or retired_at >= effective_at),
  constraint gpi_participation_consent_policies_active_check
    check (not active or retired_at is null)
);

-- -----------------------------------------------------------------------------
-- Participation relationships and append-only events
-- -----------------------------------------------------------------------------

create table public.gpi_participation_relationships (
  id uuid primary key default gen_random_uuid(),
  seeker_profile_id uuid not null,
  organization_id uuid not null,
  opportunity_id uuid not null,
  source_connection_request_id uuid not null,
  consent_policy_version text not null,
  consent_given_at timestamptz not null,
  status text not null default 'active',
  paused_at timestamptz,
  ended_at timestamptz,
  ended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gpi_participation_relationships_profile_fkey
    foreign key (seeker_profile_id)
    references public.profiles(id) on delete restrict,
  constraint gpi_participation_relationships_opportunity_org_fkey
    foreign key (opportunity_id, organization_id)
    references public.gpi_opportunities(id, organization_id) on delete restrict,
  constraint gpi_participation_relationships_source_fkey
    foreign key (
      source_connection_request_id,
      seeker_profile_id,
      opportunity_id
    )
    references public.gpi_connection_requests(
      id,
      seeker_profile_id,
      opportunity_id
    ) on delete restrict,
  constraint gpi_participation_relationships_policy_fkey
    foreign key (consent_policy_version)
    references public.gpi_participation_consent_policies(version) on delete restrict,
  constraint gpi_participation_relationships_id_opportunity_key
    unique (id, opportunity_id),
  constraint gpi_participation_relationships_status_check
    check (status in ('active', 'paused', 'ended')),
  constraint gpi_participation_relationships_ended_reason_check
    check (
      ended_reason is null
      or ended_reason in (
        'participant_stopped',
        'opportunity_closed',
        'opportunity_ineligible',
        'account_restricted'
      )
    ),
  constraint gpi_participation_relationships_state_check
    check (
      (status = 'active' and paused_at is null and ended_at is null and ended_reason is null)
      or
      (status = 'paused' and paused_at is not null and ended_at is null and ended_reason is null)
      or
      (status = 'ended' and ended_at is not null and ended_reason is not null)
    ),
  constraint gpi_participation_relationships_consent_time_check
    check (
      consent_given_at >= created_at - interval '5 minutes'
      and consent_given_at <= created_at + interval '5 minutes'
    ),
  constraint gpi_participation_relationships_updated_time_check
    check (updated_at >= created_at),
  constraint gpi_participation_relationships_pause_time_check
    check (paused_at is null or paused_at >= created_at),
  constraint gpi_participation_relationships_end_time_check
    check (ended_at is null or ended_at >= created_at)
);

create unique index gpi_participation_relationships_current_key
  on public.gpi_participation_relationships (seeker_profile_id, opportunity_id)
  where status in ('active', 'paused');

create index gpi_participation_relationships_profile_created_idx
  on public.gpi_participation_relationships (seeker_profile_id, created_at desc);

create index gpi_participation_relationships_org_opportunity_status_idx
  on public.gpi_participation_relationships
  (organization_id, opportunity_id, status);

create index gpi_participation_relationships_active_count_idx
  on public.gpi_participation_relationships (organization_id, opportunity_id)
  where status = 'active';

create index gpi_participation_relationships_source_idx
  on public.gpi_participation_relationships (source_connection_request_id);

create index gpi_participation_relationships_policy_idx
  on public.gpi_participation_relationships (consent_policy_version);

create index gpi_participation_relationships_opportunity_org_fk_idx
  on public.gpi_participation_relationships (opportunity_id, organization_id);

create index gpi_participation_relationships_source_fk_idx
  on public.gpi_participation_relationships (
    source_connection_request_id,
    seeker_profile_id,
    opportunity_id
  );

create table public.gpi_participation_events (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null,
  actor_profile_id uuid,
  actor_type text not null,
  event_type text not null,
  from_status text,
  to_status text not null,
  operation_id uuid not null unique,
  reason text,
  created_at timestamptz not null default now(),
  constraint gpi_participation_events_relationship_fkey
    foreign key (relationship_id)
    references public.gpi_participation_relationships(id) on delete restrict,
  constraint gpi_participation_events_actor_fkey
    foreign key (actor_profile_id)
    references public.profiles(id) on delete restrict,
  constraint gpi_participation_events_actor_check
    check (
      (actor_type = 'participant' and actor_profile_id is not null)
      or (actor_type = 'system' and actor_profile_id is null)
    ),
  constraint gpi_participation_events_reason_check
    check (
      reason is null
      or reason in (
        'participant_stopped',
        'opportunity_closed',
        'opportunity_ineligible',
        'account_restricted'
      )
    ),
  constraint gpi_participation_events_transition_check
    check (
      (event_type = 'opted_in' and from_status is null and to_status = 'active')
      or (event_type = 'paused' and from_status = 'active' and to_status = 'paused')
      or (event_type = 'resumed' and from_status = 'paused' and to_status = 'active')
      or (
        event_type = 'ended'
        and from_status in ('active', 'paused')
        and to_status = 'ended'
        and reason is not null
      )
    )
);

create index gpi_participation_events_relationship_created_idx
  on public.gpi_participation_events (relationship_id, created_at desc);

create index gpi_participation_events_actor_created_idx
  on public.gpi_participation_events (actor_profile_id, created_at desc)
  where actor_profile_id is not null;

-- -----------------------------------------------------------------------------
-- Separate Stage 2 notification ledger
-- -----------------------------------------------------------------------------

create table public.gpi_participation_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null,
  opportunity_id uuid not null,
  occurrence_id uuid not null,
  notification_type text not null default 'next_gathering',
  channel text not null default 'email',
  status text not null default 'pending',
  idempotency_key text not null unique,
  attempt_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  worker_id uuid,
  claimed_at timestamptz,
  provider_message_id text,
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gpi_participation_deliveries_relationship_opportunity_fkey
    foreign key (relationship_id, opportunity_id)
    references public.gpi_participation_relationships(id, opportunity_id)
    on delete restrict,
  constraint gpi_participation_deliveries_occurrence_opportunity_fkey
    foreign key (occurrence_id, opportunity_id)
    references public.gpi_opportunity_occurrences(id, opportunity_id)
    on delete restrict,
  constraint gpi_participation_deliveries_natural_key
    unique (relationship_id, occurrence_id, notification_type, channel),
  constraint gpi_participation_deliveries_type_check
    check (notification_type = 'next_gathering'),
  constraint gpi_participation_deliveries_channel_check
    check (channel = 'email'),
  constraint gpi_participation_deliveries_status_check
    check (status in ('pending', 'sending', 'sent', 'failed', 'canceled')),
  constraint gpi_participation_deliveries_attempt_check
    check (attempt_count between 0 and 5),
  constraint gpi_participation_deliveries_idempotency_check
    check (
      idempotency_key =
        'participation:' || relationship_id::text || ':' || occurrence_id::text || ':email:v1'
    ),
  constraint gpi_participation_deliveries_claim_check
    check (
      (status = 'sending' and worker_id is not null and claimed_at is not null)
      or (status <> 'sending' and worker_id is null and claimed_at is null)
    ),
  constraint gpi_participation_deliveries_sent_check
    check (
      (status = 'sent' and sent_at is not null)
      or (status <> 'sent' and sent_at is null)
    ),
  constraint gpi_participation_deliveries_error_code_check
    check (
      last_error_code is null
      or (
        last_error_code = btrim(last_error_code)
        and char_length(last_error_code) between 1 and 100
      )
    ),
  constraint gpi_participation_deliveries_updated_check
    check (updated_at >= created_at)
);

create index gpi_participation_deliveries_worker_idx
  on public.gpi_participation_notification_deliveries
  (next_attempt_at, created_at)
  where status in ('pending', 'failed');

create index gpi_participation_deliveries_relationship_idx
  on public.gpi_participation_notification_deliveries
  (relationship_id, created_at desc);

create index gpi_participation_deliveries_occurrence_idx
  on public.gpi_participation_notification_deliveries (occurrence_id);

create index gpi_participation_deliveries_relationship_opportunity_fk_idx
  on public.gpi_participation_notification_deliveries (
    relationship_id,
    opportunity_id
  );

create index gpi_participation_deliveries_occurrence_opportunity_fk_idx
  on public.gpi_participation_notification_deliveries (
    occurrence_id,
    opportunity_id
  );

-- -----------------------------------------------------------------------------
-- Closed-table boundary
-- -----------------------------------------------------------------------------

alter table public.gpi_participation_consent_policies enable row level security;
alter table public.gpi_participation_relationships enable row level security;
alter table public.gpi_participation_events enable row level security;
alter table public.gpi_participation_notification_deliveries enable row level security;

alter table public.gpi_participation_consent_policies force row level security;
alter table public.gpi_participation_relationships force row level security;
alter table public.gpi_participation_events force row level security;
alter table public.gpi_participation_notification_deliveries force row level security;

revoke all on table public.gpi_participation_consent_policies
  from public, anon, authenticated, service_role;
revoke all on table public.gpi_participation_relationships
  from public, anon, authenticated, service_role;
revoke all on table public.gpi_participation_events
  from public, anon, authenticated, service_role;
revoke all on table public.gpi_participation_notification_deliveries
  from public, anon, authenticated, service_role;

-- The service role receives EXECUTE on the SECURITY DEFINER functions below,
-- not direct table privileges. This preserves the closed-table boundary even if
-- a service key is used through PostgREST.

-- -----------------------------------------------------------------------------
-- Participant service functions - callable only with the service role
-- -----------------------------------------------------------------------------

create function public.gpi_service_opt_in_recurring_updates(
  p_profile_id uuid,
  p_opportunity_id uuid,
  p_source_connection_request_id uuid,
  p_consent_policy_version text,
  p_operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_request public.gpi_connection_requests%rowtype;
  v_organization_id uuid;
  v_relationship public.gpi_participation_relationships%rowtype;
  v_prior record;
  v_now timestamptz := clock_timestamp();
begin
  if p_profile_id is null or p_opportunity_id is null
     or p_source_connection_request_id is null
     or nullif(btrim(p_consent_policy_version), '') is null
     or p_operation_id is null then
    raise exception 'Missing required participation input' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_operation_id::text, 0)
  );

  select e.relationship_id, e.actor_profile_id, e.event_type
    into v_prior
  from public.gpi_participation_events e
  where e.operation_id = p_operation_id;

  if found then
    if v_prior.actor_profile_id <> p_profile_id or v_prior.event_type <> 'opted_in' then
      raise exception 'Operation ID has already been used' using errcode = '22023';
    end if;

    select * into strict v_relationship
    from public.gpi_participation_relationships r
    where r.id = v_prior.relationship_id;

    return jsonb_build_object(
      'relationship_id', v_relationship.id,
      'opportunity_id', v_relationship.opportunity_id,
      'status', v_relationship.status,
      'consent_given_at', v_relationship.consent_given_at,
      'idempotent_replay', true
    );
  end if;

  select * into v_request
  from public.gpi_connection_requests cr
  where cr.id = p_source_connection_request_id
  for update;

  if not found
     or v_request.seeker_profile_id is distinct from p_profile_id
     or v_request.opportunity_id is distinct from p_opportunity_id
     or v_request.status <> 'seeker_confirmed'
     or v_request.seeker_confirmed_at is null then
    raise exception 'A matching confirmed connection is required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = p_profile_id
      and coalesce(p.account_status, 'active') = 'active'
      and coalesce(p.access_status, 'active') = 'active'
      and u.email_confirmed_at is not null
  ) then
    raise exception 'An active account with a confirmed email is required'
      using errcode = '42501';
  end if;

  select o.organization_id into v_organization_id
  from public.gpi_opportunities o
  where o.id = p_opportunity_id
    and o.schedule_type = 'recurring';

  if not found or not public.gpi_is_public_eligible(p_opportunity_id) then
    raise exception 'Recurring opportunity is not currently eligible' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.gpi_participation_consent_policies cp
    where cp.version = btrim(p_consent_policy_version)
      and cp.active
      and cp.effective_at <= v_now
      and cp.retired_at is null
  ) then
    raise exception 'Participation consent policy is not active' using errcode = '22023';
  end if;

  begin
    insert into public.gpi_participation_relationships (
      seeker_profile_id,
      organization_id,
      opportunity_id,
      source_connection_request_id,
      consent_policy_version,
      consent_given_at,
      status,
      created_at,
      updated_at
    ) values (
      p_profile_id,
      v_organization_id,
      p_opportunity_id,
      p_source_connection_request_id,
      btrim(p_consent_policy_version),
      v_now,
      'active',
      v_now,
      v_now
    ) returning * into v_relationship;
  exception when unique_violation then
    raise exception 'A current recurring-update preference already exists'
      using errcode = '23505';
  end;

  insert into public.gpi_participation_events (
    relationship_id,
    actor_profile_id,
    actor_type,
    event_type,
    from_status,
    to_status,
    operation_id,
    created_at
  ) values (
    v_relationship.id,
    p_profile_id,
    'participant',
    'opted_in',
    null,
    'active',
    p_operation_id,
    v_now
  );

  return jsonb_build_object(
    'relationship_id', v_relationship.id,
    'opportunity_id', v_relationship.opportunity_id,
    'status', v_relationship.status,
    'consent_given_at', v_relationship.consent_given_at,
    'idempotent_replay', false
  );
end;
$function$;

create function public.gpi_service_change_recurring_updates(
  p_profile_id uuid,
  p_relationship_id uuid,
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
  v_prior record;
  v_action text := lower(btrim(coalesce(p_action, '')));
  v_event_type text;
  v_from_status text;
  v_to_status text;
  v_now timestamptz := clock_timestamp();
begin
  if p_profile_id is null or p_relationship_id is null
     or v_action not in ('pause', 'resume', 'stop')
     or p_operation_id is null then
    raise exception 'Invalid recurring-update action' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_operation_id::text, 0)
  );

  select e.relationship_id, e.actor_profile_id, e.event_type
    into v_prior
  from public.gpi_participation_events e
  where e.operation_id = p_operation_id;

  if found then
    v_event_type := case v_action
      when 'pause' then 'paused'
      when 'resume' then 'resumed'
      else 'ended'
    end;

    if v_prior.relationship_id <> p_relationship_id
       or v_prior.actor_profile_id <> p_profile_id
       or v_prior.event_type <> v_event_type then
      raise exception 'Operation ID has already been used' using errcode = '22023';
    end if;

    select * into strict v_relationship
    from public.gpi_participation_relationships r
    where r.id = p_relationship_id;

    return jsonb_build_object(
      'relationship_id', v_relationship.id,
      'opportunity_id', v_relationship.opportunity_id,
      'status', v_relationship.status,
      'updated_at', v_relationship.updated_at,
      'idempotent_replay', true
    );
  end if;

  select * into v_relationship
  from public.gpi_participation_relationships r
  where r.id = p_relationship_id
  for update;

  if not found or v_relationship.seeker_profile_id <> p_profile_id then
    raise exception 'Participation relationship not found' using errcode = '42501';
  end if;

  v_from_status := v_relationship.status;

  if v_action = 'pause' and v_from_status = 'active' then
    v_event_type := 'paused';
    v_to_status := 'paused';
    update public.gpi_participation_relationships
    set status = 'paused', paused_at = v_now, updated_at = v_now
    where id = p_relationship_id
    returning * into v_relationship;
  elsif v_action = 'resume' and v_from_status = 'paused' then
    if not exists (
      select 1
      from public.gpi_opportunities o
      join public.profiles p on p.id = p_profile_id
      join auth.users u on u.id = p.id
      where o.id = v_relationship.opportunity_id
        and o.schedule_type = 'recurring'
        and coalesce(p.account_status, 'active') = 'active'
        and coalesce(p.access_status, 'active') = 'active'
        and u.email_confirmed_at is not null
        and public.gpi_is_public_eligible(o.id)
    ) then
      raise exception 'Recurring opportunity is not currently eligible' using errcode = '22023';
    end if;
    v_event_type := 'resumed';
    v_to_status := 'active';
    update public.gpi_participation_relationships
    set status = 'active', paused_at = null, updated_at = v_now
    where id = p_relationship_id
    returning * into v_relationship;
  elsif v_action = 'stop' and v_from_status in ('active', 'paused') then
    v_event_type := 'ended';
    v_to_status := 'ended';
    update public.gpi_participation_relationships
    set status = 'ended', ended_at = v_now,
        ended_reason = 'participant_stopped', updated_at = v_now
    where id = p_relationship_id
    returning * into v_relationship;
  else
    raise exception 'Invalid participation state transition' using errcode = '22023';
  end if;

  insert into public.gpi_participation_events (
    relationship_id,
    actor_profile_id,
    actor_type,
    event_type,
    from_status,
    to_status,
    operation_id,
    reason,
    created_at
  ) values (
    p_relationship_id,
    p_profile_id,
    'participant',
    v_event_type,
    v_from_status,
    v_to_status,
    p_operation_id,
    case when v_event_type = 'ended' then 'participant_stopped' else null end,
    v_now
  );

  return jsonb_build_object(
    'relationship_id', v_relationship.id,
    'opportunity_id', v_relationship.opportunity_id,
    'status', v_relationship.status,
    'updated_at', v_relationship.updated_at,
    'idempotent_replay', false
  );
end;
$function$;

create function public.gpi_service_get_my_participation(
  p_profile_id uuid,
  p_relationship_id uuid default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'relationship_id', r.id,
        'opportunity_id', r.opportunity_id,
        'organization_id', r.organization_id,
        'status', r.status,
        'consent_given_at', r.consent_given_at,
        'paused_at', r.paused_at,
        'ended_at', r.ended_at,
        'created_at', r.created_at,
        'updated_at', r.updated_at,
        'next_occurrence', case when x.id is null then null else jsonb_build_object(
          'id', x.id,
          'starts_at', x.starts_at,
          'ends_at', x.ends_at,
          'registration_deadline', x.registration_deadline
        ) end
      ) order by r.created_at desc
    ),
    '[]'::jsonb
  )
  from public.gpi_participation_relationships r
  left join lateral (
    select o.id, o.starts_at, o.ends_at, o.registration_deadline
    from public.gpi_opportunity_occurrences o
    where o.opportunity_id = r.opportunity_id
      and o.status = 'scheduled'
      and o.starts_at > now()
      and o.confirmed_at between now() - interval '14 days' and now()
      and (o.registration_deadline is null or o.registration_deadline > now())
      and public.gpi_is_public_eligible(r.opportunity_id)
    order by o.starts_at
    limit 1
  ) x on true
  where r.seeker_profile_id = p_profile_id
    and (p_relationship_id is null or r.id = p_relationship_id)
$function$;

-- -----------------------------------------------------------------------------
-- Count-only host RPC
-- -----------------------------------------------------------------------------

create function public.gpi_host_get_participation_summary(
  p_organization_id uuid,
  p_opportunity_id uuid
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
  if auth.uid() is null
     or not public.gpi_host_has_organization_role(
       p_organization_id,
       array['admin', 'editor']::text[]
     ) then
    raise exception 'Not authorized for this organization' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'organization_id', o.organization_id,
    'opportunity_id', o.id,
    'opportunity_title', o.title,
    'schedule_type', o.schedule_type,
    'public_eligible', public.gpi_is_public_eligible(o.id),
    'active_consent_count', (
      select count(*)::integer
      from public.gpi_participation_relationships r
      where r.organization_id = o.organization_id
        and r.opportunity_id = o.id
        and r.status = 'active'
    ),
    'next_occurrence', (
      select jsonb_build_object(
        'id', x.id,
        'starts_at', x.starts_at,
        'ends_at', x.ends_at
      )
      from public.gpi_opportunity_occurrences x
      where x.opportunity_id = o.id
        and x.status = 'scheduled'
        and x.starts_at > now()
        and x.confirmed_at between now() - interval '14 days' and now()
        and (x.registration_deadline is null or x.registration_deadline > now())
        and public.gpi_is_public_eligible(o.id)
      order by x.starts_at
      limit 1
    )
  ) into v_result
  from public.gpi_opportunities o
  where o.id = p_opportunity_id
    and o.organization_id = p_organization_id
    and o.schedule_type = 'recurring';

  if v_result is null then
    raise exception 'Recurring opportunity not found' using errcode = '22023';
  end if;

  return v_result;
end;
$function$;

-- -----------------------------------------------------------------------------
-- Queue, claim, pre-send validation, result recording, and reconciliation
-- -----------------------------------------------------------------------------

create function public.gpi_service_queue_participation_notifications(
  p_now timestamptz default now(),
  p_horizon interval default interval '7 days',
  p_limit integer default 500
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_count integer;
begin
  if p_now is null
     or p_horizon <= interval '0 seconds'
     or p_horizon > interval '31 days'
     or p_limit not between 1 and 5000 then
    raise exception 'Invalid participation queue window' using errcode = '22023';
  end if;

  with candidates as (
    select r.id as relationship_id, r.opportunity_id, x.id as occurrence_id
    from public.gpi_participation_relationships r
    join public.gpi_opportunities opportunity
      on opportunity.id = r.opportunity_id
     and opportunity.schedule_type = 'recurring'
    join public.profiles profile on profile.id = r.seeker_profile_id
    join auth.users account on account.id = profile.id
    join lateral (
      select o.id
      from public.gpi_opportunity_occurrences o
      where o.opportunity_id = r.opportunity_id
        and o.status = 'scheduled'
        and o.starts_at > p_now
        and o.starts_at <= p_now + p_horizon
        and o.confirmed_at between p_now - interval '14 days' and p_now
        and (o.registration_deadline is null or o.registration_deadline > p_now)
      order by o.starts_at
      limit 1
    ) x on true
    where r.status = 'active'
      and coalesce(profile.account_status, 'active') = 'active'
      and coalesce(profile.access_status, 'active') = 'active'
      and account.email_confirmed_at is not null
      and public.gpi_is_public_eligible(r.opportunity_id)
    order by r.created_at, r.id
    limit p_limit
  )
  insert into public.gpi_participation_notification_deliveries (
    relationship_id,
    opportunity_id,
    occurrence_id,
    notification_type,
    channel,
    status,
    idempotency_key,
    next_attempt_at,
    created_at,
    updated_at
  )
  select
    c.relationship_id,
    c.opportunity_id,
    c.occurrence_id,
    'next_gathering',
    'email',
    'pending',
    'participation:' || c.relationship_id::text || ':' || c.occurrence_id::text || ':email:v1',
    p_now,
    p_now,
    p_now
  from candidates c
  on conflict (relationship_id, occurrence_id, notification_type, channel)
  do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

create function public.gpi_service_claim_participation_notifications(
  p_worker_id uuid,
  p_limit integer default 50
)
returns table (
  delivery_id uuid,
  relationship_id uuid,
  seeker_profile_id uuid,
  opportunity_id uuid,
  occurrence_id uuid,
  starts_at timestamptz,
  attempt_count integer
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_worker_id is null or p_limit not between 1 and 250 then
    raise exception 'Invalid notification claim input' using errcode = '22023';
  end if;

  return query
  with candidates as (
    select d.id
    from public.gpi_participation_notification_deliveries d
    where d.status in ('pending', 'failed')
      and d.next_attempt_at <= clock_timestamp()
      and d.attempt_count < 5
    order by d.next_attempt_at, d.created_at
    for update skip locked
    limit p_limit
  ), claimed as (
    update public.gpi_participation_notification_deliveries d
    set status = 'sending',
        worker_id = p_worker_id,
        claimed_at = clock_timestamp(),
        last_attempt_at = clock_timestamp(),
        attempt_count = d.attempt_count + 1,
        updated_at = clock_timestamp(),
        last_error_code = null
    from candidates c
    where d.id = c.id
    returning d.*
  )
  select
    d.id,
    d.relationship_id,
    r.seeker_profile_id,
    d.opportunity_id,
    d.occurrence_id,
    x.starts_at,
    d.attempt_count
  from claimed d
  join public.gpi_participation_relationships r on r.id = d.relationship_id
  join public.gpi_opportunity_occurrences x on x.id = d.occurrence_id
  order by d.claimed_at, d.id;
end;
$function$;

create function public.gpi_service_prepare_participation_send(
  p_delivery_id uuid,
  p_worker_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_delivery public.gpi_participation_notification_deliveries%rowtype;
  v_profile_id uuid;
  v_starts_at timestamptz;
  v_eligible boolean := false;
  v_now timestamptz := clock_timestamp();
begin
  select * into v_delivery
  from public.gpi_participation_notification_deliveries d
  where d.id = p_delivery_id
  for update;

  if not found or v_delivery.status <> 'sending'
     or v_delivery.worker_id is distinct from p_worker_id then
    raise exception 'Notification claim is not owned by this worker' using errcode = '42501';
  end if;

  select r.seeker_profile_id, x.starts_at,
    (
      r.status = 'active'
      and coalesce(p.account_status, 'active') = 'active'
      and coalesce(p.access_status, 'active') = 'active'
      and u.email_confirmed_at is not null
      and o.schedule_type = 'recurring'
      and public.gpi_is_public_eligible(o.id)
      and x.status = 'scheduled'
      and x.starts_at > v_now
      and x.confirmed_at between v_now - interval '14 days' and v_now
      and (x.registration_deadline is null or x.registration_deadline > v_now)
    )
  into v_profile_id, v_starts_at, v_eligible
  from public.gpi_participation_relationships r
  join public.profiles p on p.id = r.seeker_profile_id
  join auth.users u on u.id = p.id
  join public.gpi_opportunities o
    on o.id = r.opportunity_id
  join public.gpi_opportunity_occurrences x
    on x.id = v_delivery.occurrence_id
   and x.opportunity_id = r.opportunity_id
  where r.id = v_delivery.relationship_id;

  if not coalesce(v_eligible, false) then
    update public.gpi_participation_notification_deliveries
    set status = 'canceled', worker_id = null, claimed_at = null,
        last_error_code = 'no_longer_eligible', updated_at = v_now
    where id = p_delivery_id;

    return jsonb_build_object('eligible', false, 'delivery_id', p_delivery_id);
  end if;

  return jsonb_build_object(
    'eligible', true,
    'delivery_id', p_delivery_id,
    'seeker_profile_id', v_profile_id,
    'opportunity_id', v_delivery.opportunity_id,
    'occurrence_id', v_delivery.occurrence_id,
    'starts_at', v_starts_at
  );
end;
$function$;

create function public.gpi_service_mark_participation_notification(
  p_delivery_id uuid,
  p_worker_id uuid,
  p_result text,
  p_provider_message_id text default null,
  p_error_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_delivery public.gpi_participation_notification_deliveries%rowtype;
  v_result text := lower(btrim(coalesce(p_result, '')));
  v_now timestamptz := clock_timestamp();
begin
  if v_result not in ('sent', 'failed', 'canceled') then
    raise exception 'Invalid notification result' using errcode = '22023';
  end if;

  select * into v_delivery
  from public.gpi_participation_notification_deliveries d
  where d.id = p_delivery_id
  for update;

  if not found or v_delivery.status <> 'sending'
     or v_delivery.worker_id is distinct from p_worker_id then
    raise exception 'Notification claim is not owned by this worker' using errcode = '42501';
  end if;

  if v_result = 'sent' and nullif(btrim(coalesce(p_provider_message_id, '')), '') is null then
    raise exception 'Provider message ID is required for sent result' using errcode = '22023';
  end if;

  if v_result = 'failed' and nullif(btrim(coalesce(p_error_code, '')), '') is null then
    raise exception 'Sanitized error code is required for failed result' using errcode = '22023';
  end if;

  update public.gpi_participation_notification_deliveries
  set status = v_result,
      worker_id = null,
      claimed_at = null,
      provider_message_id = case when v_result = 'sent' then btrim(p_provider_message_id) else null end,
      last_error_code = case
        when v_result in ('failed', 'canceled') then left(btrim(p_error_code), 100)
        else null
      end,
      sent_at = case when v_result = 'sent' then v_now else null end,
      next_attempt_at = case
        when v_result = 'failed' and v_delivery.attempt_count < 5
          then v_now + make_interval(
            mins => least(
              60,
              (5 * (2 ^ greatest(v_delivery.attempt_count - 1, 0)))::integer
            )
          )
        else v_delivery.next_attempt_at
      end,
      updated_at = v_now
  where id = p_delivery_id
  returning * into v_delivery;

  return jsonb_build_object(
    'delivery_id', v_delivery.id,
    'status', v_delivery.status,
    'attempt_count', v_delivery.attempt_count,
    'sent_at', v_delivery.sent_at,
    'next_attempt_at', v_delivery.next_attempt_at
  );
end;
$function$;

create function public.gpi_service_reconcile_participation_eligibility(
  p_limit integer default 500
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_count integer;
begin
  if p_limit not between 1 and 5000 then
    raise exception 'Invalid reconciliation limit' using errcode = '22023';
  end if;

  with candidates as (
    select r.id, r.status as from_status,
      case
        when coalesce(p.account_status, 'active') <> 'active'
          or coalesce(p.access_status, 'active') <> 'active'
          then 'account_restricted'
        when o.status = 'closed' then 'opportunity_closed'
        else 'opportunity_ineligible'
      end as reason
    from public.gpi_participation_relationships r
    join public.gpi_opportunities o on o.id = r.opportunity_id
    join public.profiles p on p.id = r.seeker_profile_id
    where r.status in ('active', 'paused')
      and (
        coalesce(p.account_status, 'active') <> 'active'
        or coalesce(p.access_status, 'active') <> 'active'
        or o.schedule_type <> 'recurring'
        or not public.gpi_is_public_eligible(o.id)
      )
    order by r.updated_at, r.id
    for update of r skip locked
    limit p_limit
  ), updated as (
    update public.gpi_participation_relationships r
    set status = 'ended',
        ended_at = clock_timestamp(),
        ended_reason = c.reason,
        updated_at = clock_timestamp()
    from candidates c
    where r.id = c.id
    returning r.id, c.from_status, c.reason, r.updated_at
  )
  insert into public.gpi_participation_events (
    relationship_id,
    actor_profile_id,
    actor_type,
    event_type,
    from_status,
    to_status,
    operation_id,
    reason,
    created_at
  )
  select
    u.id,
    null,
    'system',
    'ended',
    u.from_status,
    'ended',
    gen_random_uuid(),
    u.reason,
    u.updated_at
  from updated u;

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

-- -----------------------------------------------------------------------------
-- Function grants. New functions are executable by PUBLIC by default, so revoke
-- every signature explicitly before granting the intended role.
-- -----------------------------------------------------------------------------

revoke all on function public.gpi_service_opt_in_recurring_updates(uuid, uuid, uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.gpi_service_change_recurring_updates(uuid, uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.gpi_service_get_my_participation(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.gpi_service_queue_participation_notifications(timestamptz, interval, integer)
  from public, anon, authenticated;
revoke all on function public.gpi_service_claim_participation_notifications(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.gpi_service_prepare_participation_send(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.gpi_service_mark_participation_notification(uuid, uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function public.gpi_service_reconcile_participation_eligibility(integer)
  from public, anon, authenticated;
revoke all on function public.gpi_host_get_participation_summary(uuid, uuid)
  from public, anon;

grant execute on function public.gpi_service_opt_in_recurring_updates(uuid, uuid, uuid, text, uuid)
  to service_role;
grant execute on function public.gpi_service_change_recurring_updates(uuid, uuid, text, uuid)
  to service_role;
grant execute on function public.gpi_service_get_my_participation(uuid, uuid)
  to service_role;
grant execute on function public.gpi_service_queue_participation_notifications(timestamptz, interval, integer)
  to service_role;
grant execute on function public.gpi_service_claim_participation_notifications(uuid, integer)
  to service_role;
grant execute on function public.gpi_service_prepare_participation_send(uuid, uuid)
  to service_role;
grant execute on function public.gpi_service_mark_participation_notification(uuid, uuid, text, text, text)
  to service_role;
grant execute on function public.gpi_service_reconcile_participation_eligibility(integer)
  to service_role;
grant execute on function public.gpi_host_get_participation_summary(uuid, uuid)
  to authenticated, service_role;

comment on table public.gpi_participation_relationships is
  'Private recurring-update consent periods; not membership or attendance.';
comment on table public.gpi_participation_events is
  'Append-only audit history for Stage 2 participation state changes.';
comment on table public.gpi_participation_notification_deliveries is
  'Idempotent Stage 2 email delivery ledger; stores no email addresses.';
comment on function public.gpi_host_get_participation_summary(uuid, uuid) is
  'Authorized host aggregate only; never returns participant identities.';

commit;

-- Post-apply requirements (not part of this draft execution):
-- 1. Insert the approved consent policy with the exact body hash.
-- 2. Deploy gpi-participation-auth with authenticated-user JWT validation.
-- 3. Configure the queue/reconcile scheduler and sender worker.
-- 4. Run authorization, concurrency, lifecycle, notification, and regression tests.
-- 5. Run Supabase security and performance advisors before production approval.


