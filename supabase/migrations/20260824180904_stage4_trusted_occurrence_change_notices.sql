begin;

create table public.gpi_occurrence_change_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  opportunity_id uuid not null,
  occurrence_id uuid not null,
  event_type text not null check (
    event_type in ('occurrence_canceled', 'occurrence_marked_full', 'occurrence_rescheduled')
  ),
  actor_profile_id uuid,
  actor_kind text not null check (actor_kind in ('host', 'platform_admin', 'service')),
  old_starts_at timestamptz not null,
  new_starts_at timestamptz not null,
  old_ends_at timestamptz,
  new_ends_at timestamptz,
  old_status text not null,
  new_status text not null,
  prior_was_next boolean not null default false,
  created_at timestamptz not null default now(),
  constraint gpi_occurrence_change_events_event_opportunity_key unique (id, opportunity_id),
  constraint gpi_occurrence_change_events_occurrence_fkey
    foreign key (occurrence_id, opportunity_id)
    references public.gpi_opportunity_occurrences (id, opportunity_id)
    on delete restrict,
  constraint gpi_occurrence_change_events_opportunity_fkey
    foreign key (opportunity_id, organization_id)
    references public.gpi_opportunities (id, organization_id)
    on delete restrict,
  constraint gpi_occurrence_change_events_actor_fkey
    foreign key (actor_profile_id)
    references public.profiles (id)
    on delete restrict,
  constraint gpi_occurrence_change_events_actor_check check (
    (actor_kind = 'service' and actor_profile_id is null)
    or (actor_kind in ('host', 'platform_admin') and actor_profile_id is not null)
  ),
  constraint gpi_occurrence_change_events_old_time_check check (
    old_ends_at is null or old_ends_at > old_starts_at
  ),
  constraint gpi_occurrence_change_events_new_time_check check (
    new_ends_at is null or new_ends_at > new_starts_at
  ),
  constraint gpi_occurrence_change_events_shape_check check (
    (
      event_type = 'occurrence_canceled'
      and old_status = 'scheduled'
      and new_status = 'canceled'
    )
    or (
      event_type = 'occurrence_marked_full'
      and old_status = 'scheduled'
      and new_status = 'full'
    )
    or (
      event_type = 'occurrence_rescheduled'
      and old_status = 'scheduled'
      and new_status = 'scheduled'
      and row(old_starts_at, old_ends_at) is distinct from row(new_starts_at, new_ends_at)
    )
  )
);

create table public.gpi_occurrence_change_recipients (
  event_id uuid not null,
  relationship_id uuid not null,
  opportunity_id uuid not null,
  recipient_reason text not null check (
    recipient_reason in ('planning_intent', 'prior_next_gathering')
  ),
  created_at timestamptz not null default now(),
  constraint gpi_occurrence_change_recipients_pkey primary key (event_id, relationship_id),
  constraint gpi_occurrence_change_recipients_event_fkey
    foreign key (event_id, opportunity_id)
    references public.gpi_occurrence_change_events (id, opportunity_id)
    on delete restrict,
  constraint gpi_occurrence_change_recipients_relationship_fkey
    foreign key (relationship_id, opportunity_id)
    references public.gpi_participation_relationships (id, opportunity_id)
    on delete restrict
);

create index gpi_occurrence_change_events_occurrence_created_idx
  on public.gpi_occurrence_change_events (occurrence_id, opportunity_id, created_at desc);

create index gpi_occurrence_change_events_opportunity_created_idx
  on public.gpi_occurrence_change_events (opportunity_id, created_at desc);

create index gpi_occurrence_change_events_opportunity_org_fk_idx
  on public.gpi_occurrence_change_events (opportunity_id, organization_id);

create index gpi_occurrence_change_events_actor_fk_idx
  on public.gpi_occurrence_change_events (actor_profile_id)
  where actor_profile_id is not null;

create index gpi_occurrence_change_recipients_relationship_created_idx
  on public.gpi_occurrence_change_recipients (relationship_id, created_at desc);

create index gpi_occurrence_change_recipients_event_opportunity_fk_idx
  on public.gpi_occurrence_change_recipients (event_id, opportunity_id);

create index gpi_occurrence_change_recipients_relationship_opportunity_fk_idx
  on public.gpi_occurrence_change_recipients (relationship_id, opportunity_id);

alter table public.gpi_occurrence_change_events enable row level security;
alter table public.gpi_occurrence_change_events force row level security;
alter table public.gpi_occurrence_change_recipients enable row level security;
alter table public.gpi_occurrence_change_recipients force row level security;

revoke all on table public.gpi_occurrence_change_events
  from public, anon, authenticated, service_role;
revoke all on table public.gpi_occurrence_change_recipients
  from public, anon, authenticated, service_role;

create function public.gpi_capture_occurrence_change_notices()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := now();
  v_event_type text;
  v_event_id uuid;
  v_organization_id uuid;
  v_actor_profile_id uuid := auth.uid();
  v_actor_kind text;
  v_prior_eligible boolean := false;
  v_prior_was_next boolean := false;
  v_has_recipients boolean := false;
begin
  if tg_op <> 'UPDATE' or old.status <> 'scheduled' then
    return new;
  end if;

  if new.status = 'canceled' and old.status is distinct from new.status then
    v_event_type := 'occurrence_canceled';
  elsif new.status = 'full' and old.status is distinct from new.status then
    v_event_type := 'occurrence_marked_full';
  elsif new.status = 'scheduled'
    and row(old.starts_at, old.ends_at) is distinct from row(new.starts_at, new.ends_at) then
    v_event_type := 'occurrence_rescheduled';
  else
    return new;
  end if;

  select o.organization_id
    into v_organization_id
  from public.gpi_opportunities o
  where o.id = old.opportunity_id
    and o.schedule_type = 'recurring';

  if not found then
    return new;
  end if;

  v_prior_eligible :=
    public.gpi_is_public_eligible(old.opportunity_id)
    and old.status = 'scheduled'
    and old.starts_at > v_now
    and old.confirmed_at between v_now - interval '14 days' and v_now
    and (old.registration_deadline is null or old.registration_deadline > v_now);

  if not v_prior_eligible then
    return new;
  end if;

  v_prior_was_next := not exists (
    select 1
    from public.gpi_opportunity_occurrences x
    where x.opportunity_id = old.opportunity_id
      and x.id <> old.id
      and x.status = 'scheduled'
      and x.starts_at > v_now
      and x.confirmed_at between v_now - interval '14 days' and v_now
      and (x.registration_deadline is null or x.registration_deadline > v_now)
      and row(x.starts_at, x.id) < row(old.starts_at, old.id)
  );

  select exists (
    select 1
    from public.gpi_participation_relationships r
    where r.opportunity_id = old.opportunity_id
      and r.status = 'active'
      and (
        v_prior_was_next
        or exists (
          select 1
          from public.gpi_participation_occurrence_intents i
          where i.relationship_id = r.id
            and i.opportunity_id = r.opportunity_id
            and i.occurrence_id = old.id
            and i.status = 'planning'
        )
      )
  ) into v_has_recipients;

  if not v_has_recipients then
    return new;
  end if;

  if v_actor_profile_id is null then
    v_actor_kind := 'service';
  elsif
    coalesce(lower(auth.jwt() -> 'app_metadata' ->> 'admin') = 'true', false)
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) in (
      'admin', 'super_admin', 'platform_admin'
    )
    or exists (
      select 1
      from jsonb_array_elements_text(
        coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb)
      ) as platform_role(value)
      where lower(platform_role.value) in ('admin', 'super_admin', 'platform_admin')
    ) then
    v_actor_kind := 'platform_admin';
  else
    v_actor_kind := 'host';
  end if;

  insert into public.gpi_occurrence_change_events (
    organization_id,
    opportunity_id,
    occurrence_id,
    event_type,
    actor_profile_id,
    actor_kind,
    old_starts_at,
    new_starts_at,
    old_ends_at,
    new_ends_at,
    old_status,
    new_status,
    prior_was_next,
    created_at
  ) values (
    v_organization_id,
    old.opportunity_id,
    old.id,
    v_event_type,
    v_actor_profile_id,
    v_actor_kind,
    old.starts_at,
    new.starts_at,
    old.ends_at,
    new.ends_at,
    old.status,
    new.status,
    v_prior_was_next,
    v_now
  ) returning id into v_event_id;

  insert into public.gpi_occurrence_change_recipients (
    event_id,
    relationship_id,
    opportunity_id,
    recipient_reason,
    created_at
  )
  select
    v_event_id,
    r.id,
    r.opportunity_id,
    case when exists (
      select 1
      from public.gpi_participation_occurrence_intents i
      where i.relationship_id = r.id
        and i.opportunity_id = r.opportunity_id
        and i.occurrence_id = old.id
        and i.status = 'planning'
    ) then 'planning_intent' else 'prior_next_gathering' end,
    v_now
  from public.gpi_participation_relationships r
  where r.opportunity_id = old.opportunity_id
    and r.status = 'active'
    and (
      v_prior_was_next
      or exists (
        select 1
        from public.gpi_participation_occurrence_intents i
        where i.relationship_id = r.id
          and i.opportunity_id = r.opportunity_id
          and i.occurrence_id = old.id
          and i.status = 'planning'
      )
    )
  order by r.id;

  return new;
end;
$function$;

revoke all on function public.gpi_capture_occurrence_change_notices()
  from public, anon, authenticated, service_role;

create trigger gpi_occurrences_15_stage4_notices
before update on public.gpi_opportunity_occurrences
for each row
execute function public.gpi_capture_occurrence_change_notices();

create function public.gpi_service_get_my_occurrence_change_notices(
  p_profile_id uuid,
  p_relationship_id uuid default null,
  p_limit integer default 20
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_result jsonb;
begin
  if p_profile_id is null then
    raise exception 'Profile ID is required' using errcode = '22023';
  end if;

  select coalesce(
    jsonb_agg(x.notice order by x.created_at desc, x.event_id desc),
    '[]'::jsonb
  ) into v_result
  from (
    select
      e.id as event_id,
      e.created_at,
      jsonb_build_object(
        'event_id', e.id,
        'relationship_id', r.id,
        'opportunity_id', e.opportunity_id,
        'occurrence_id', e.occurrence_id,
        'event_type', e.event_type,
        'old_starts_at', e.old_starts_at,
        'new_starts_at', e.new_starts_at,
        'old_ends_at', e.old_ends_at,
        'new_ends_at', e.new_ends_at,
        'old_status', e.old_status,
        'new_status', e.new_status,
        'prior_was_next', e.prior_was_next,
        'created_at', e.created_at,
        'opportunity_title', o.title,
        'organization_name', org.name,
        'current_next_occurrence', case when nx.id is null then null else jsonb_build_object(
          'id', nx.id,
          'starts_at', nx.starts_at,
          'ends_at', nx.ends_at,
          'registration_deadline', nx.registration_deadline
        ) end
      ) as notice
    from public.gpi_occurrence_change_recipients n
    join public.gpi_occurrence_change_events e
      on e.id = n.event_id and e.opportunity_id = n.opportunity_id
    join public.gpi_participation_relationships r
      on r.id = n.relationship_id and r.opportunity_id = n.opportunity_id
    join public.gpi_opportunities o on o.id = e.opportunity_id
    join public.gpi_organizations org on org.id = e.organization_id
    left join lateral (
      select x.id, x.starts_at, x.ends_at, x.registration_deadline
      from public.gpi_opportunity_occurrences x
      where x.opportunity_id = e.opportunity_id
        and x.status = 'scheduled'
        and x.starts_at > now()
        and x.confirmed_at between now() - interval '14 days' and now()
        and (x.registration_deadline is null or x.registration_deadline > now())
        and public.gpi_is_public_eligible(e.opportunity_id)
      order by x.starts_at, x.id
      limit 1
    ) nx on true
    where r.seeker_profile_id = p_profile_id
      and (p_relationship_id is null or r.id = p_relationship_id)
      and e.created_at >= now() - interval '180 days'
    order by e.created_at desc, e.id desc
    limit v_limit
  ) x;

  return v_result;
end;
$function$;

revoke all on function public.gpi_service_get_my_occurrence_change_notices(uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.gpi_service_get_my_occurrence_change_notices(uuid, uuid, integer)
  to service_role;

comment on table public.gpi_occurrence_change_events is
  'Append-only safe facts for participant-relevant recurring occurrence changes; contains no recipient identity or protected logistics.';
comment on table public.gpi_occurrence_change_recipients is
  'Private affected-relationship snapshot for Stage 4 in-product change notices; not a host roster or delivery receipt.';
comment on function public.gpi_capture_occurrence_change_notices() is
  'Trigger-only atomic capture of eligible recurring occurrence changes and affected private relationships.';
comment on function public.gpi_service_get_my_occurrence_change_notices(uuid, uuid, integer) is
  'Service-role-only read of safe Stage 4 notices belonging to one verified profile.';

commit;
