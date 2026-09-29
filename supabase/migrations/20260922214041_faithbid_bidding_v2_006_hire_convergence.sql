-- ============================================================================
-- FaithBid Bidding v2
-- Migration 006: Hire Convergence
-- Project: knkwaphosqronbhrvlsu
-- Status: DRAFT / AUDITED / NOT APPLIED
-- Generated: 2026-09-22
--
-- DEPENDENCIES
--   001 Integrity Boundary
--   002 Vendor + Capability Core
--   003 Read-Only Query Facade
--   004 Canonical Vendor Invitation Command
--   005 Atomic Proposal Commands + Revision History
--
-- PURPOSE
--   Converge the two conflicting hire-confirmation architectures into one
--   authoritative atomic selection transaction.
--
-- IMPORTANT
--   This file has NOT been applied.
--   It does not modify App.jsx.
--   It does not enable marketplace_public or bidding_enabled.
--   It does not activate Stripe or create any payment rows.
-- ============================================================================

begin;

set local lock_timeout = '10s';
set local statement_timeout = '60s';


-- ============================================================================
-- 0. FAIL-CLOSED PRE-APPLY ASSERTIONS
-- Current live table has zero rows. If that changes before application,
-- do not silently reinterpret old fee/payment rows as selection-ledger rows.
-- ============================================================================

do $$
begin
  if exists (
    select 1
    from public.hire_confirmations h
    where h.project_id is null
       or h.bid_id is null
       or h.church_id is null
       or h.vendor_id is null
       or h.amount is null
       or h.bid_amount is null
       or h.amount <= 0
       or h.bid_amount <= 0
       or h.amount is distinct from h.bid_amount
       or h.platform_fee is not null
       or lower(btrim(coalesce(h.status, ''))) <> 'recorded'
  ) then
    raise exception
      'Migration 006 preflight failed: existing hire_confirmations require manual reconciliation';
  end if;

  if exists (
    select 1
    from public.hire_confirmations h1
    join public.hire_confirmations h2
      on h2.project_id = h1.project_id
     and h2.id <> h1.id
  ) then
    raise exception
      'Migration 006 preflight failed: more than one hire confirmation exists for a project';
  end if;
end
$$;


-- ============================================================================
-- 1. HIRE_CONFIRMATIONS BECOMES A COMMERCIAL-SELECTION LEDGER
-- It is NOT a payment ledger.
-- ============================================================================

alter table public.hire_confirmations
  add column currency text not null default 'usd',
  add column accepted_revision_number integer,
  add column accepted_terms jsonb not null default '{}'::jsonb;

alter table public.hire_confirmations
  alter column church_id set not null,
  alter column vendor_id set not null,
  alter column amount set not null,
  alter column bid_amount set not null,
  alter column status set default 'recorded',
  alter column status set not null;

alter table public.hire_confirmations
  add constraint hire_confirmations_project_id_key
  unique (project_id);

alter table public.hire_confirmations
  add constraint hire_confirmations_status_check
  check (status = 'recorded');

alter table public.hire_confirmations
  add constraint hire_confirmations_amount_contract_check
  check (
    amount > 0
    and bid_amount > 0
    and amount = bid_amount
    and amount = round(amount, 2)
    and platform_fee is null
  );

alter table public.hire_confirmations
  add constraint hire_confirmations_currency_check
  check (currency = 'usd');

alter table public.hire_confirmations
  add constraint hire_confirmations_accepted_revision_check
  check (
    accepted_revision_number is null
    or accepted_revision_number > 0
  );

alter table public.hire_confirmations
  add constraint hire_confirmations_accepted_terms_check
  check (jsonb_typeof(accepted_terms) = 'object');

-- The existing UNIQUE(bid_id) constraint already owns its own unique index.
-- Remove redundant indexes around bid/project lookup.
drop index if exists public.hire_confirmations_one_per_bid_uidx;
drop index if exists public.hire_confirmations_bid_id_idx;
drop index if exists public.hire_confirmations_project_id_idx;
drop index if exists public.idx_hire_confirmations_project_id;


-- ============================================================================
-- 2. PRIVATE WINNER NOTIFICATION
-- Existing kb_create_trusted_notification does not support bid_accepted.
-- This private helper writes the same trusted-event dedupe metadata contract.
-- ============================================================================

create or replace function private.faithbid_bidding_notify_bid_accepted_v1(
  p_bid_id uuid,
  p_conversation_id uuid,
  p_actor uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_bid public.bids%rowtype;
  v_project public.projects%rowtype;
  v_inserted integer := 0;
  v_pref_allowed boolean := true;
  v_body text;
begin
  if p_bid_id is null or p_actor is null then
    raise exception 'bid id and actor are required'
      using errcode = '22023';
  end if;

  select *
    into v_bid
  from public.bids
  where id = p_bid_id;

  if not found then
    raise exception 'bid not found'
      using errcode = 'P0002';
  end if;

  select *
    into v_project
  from public.projects
  where id = v_bid.project_id;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  if v_project.church_id is distinct from p_actor then
    raise exception 'only the posting church may create the hire notification'
      using errcode = '42501';
  end if;

  if lower(btrim(coalesce(v_bid.status, ''))) <> 'hired'
     or v_project.hired_vendor_id is distinct from v_bid.vendor_id then
    raise exception 'hire state is not committed'
      using errcode = 'P0001';
  end if;

  v_pref_allowed := coalesce(
    (
      select np.bid_accepted
      from public.notification_prefs np
      where np.user_id = v_bid.vendor_id
    ),
    true
  );

  if not v_pref_allowed then
    return jsonb_build_object(
      'status_code', 'preference_disabled',
      'event', 'bid_accepted',
      'inserted_count', 0
    );
  end if;

  v_body :=
    'You were hired for '
    || coalesce(nullif(btrim(v_project.title), ''), 'a project');

  insert into public.notifications (
    user_id,
    type,
    text,
    title,
    body,
    link,
    read,
    created_at,
    meta
  )
  values (
    v_bid.vendor_id,
    'bid_accepted',
    v_body,
    'You were hired',
    v_body,
    'inbox',
    false,
    now(),
    jsonb_build_object(
      'source', 'faithbid_bidding_hire_bid_v1',
      'source_event', 'bid_accepted',
      'context_id', v_bid.id::text,
      'project_id', v_project.id::text,
      'bid_id', v_bid.id::text,
      'conversation_id',
        case
          when p_conversation_id is null then null
          else p_conversation_id::text
        end,
      'actor_id', p_actor::text
    )
  )
  on conflict do nothing;

  get diagnostics v_inserted = row_count;

  return jsonb_build_object(
    'status_code',
      case when v_inserted > 0 then 'created' else 'already_recorded' end,
    'event', 'bid_accepted',
    'inserted_count', v_inserted
  );
end;
$function$;

revoke all on function private.faithbid_bidding_notify_bid_accepted_v1(
  uuid,uuid,uuid
) from public, anon, authenticated;


-- ============================================================================
-- 3. ONE PRIVATE HIRE CORE
-- Both the new v2 command and the legacy confirm_hire compatibility wrapper
-- call this exact implementation.
-- ============================================================================

create or replace function private.faithbid_bidding_hire_core_v1(
  p_project_id uuid,
  p_bid_id uuid,
  p_actor uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_project public.projects%rowtype;
  v_bid public.bids%rowtype;
  v_vendor public.vendors%rowtype;
  v_church_profile public.profiles%rowtype;
  v_existing_hire public.hire_confirmations%rowtype;
  v_hire public.hire_confirmations%rowtype;

  v_revision_number integer;
  v_accepted_terms jsonb;

  v_conversation_id uuid;
  v_relationship_id uuid;
  v_activity_id uuid;

  v_winner_notification jsonb := '{}'::jsonb;
  v_loser_notification jsonb;

  v_loser public.bids%rowtype;
  v_loser_vendor public.vendors%rowtype;
  v_loser_vendor_found boolean := false;
  v_loser_activity_id uuid;
  v_loser_count integer := 0;
begin
  if p_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if p_project_id is null or p_bid_id is null then
    raise exception 'project and bid are required'
      using errcode = '22023';
  end if;

  -- The project row is the primary concurrency lock for hiring.
  select *
    into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  if v_project.church_id is distinct from p_actor then
    raise exception 'only the posting church may hire for this project'
      using errcode = '42501';
  end if;

  select *
    into v_bid
  from public.bids
  where id = p_bid_id
    and project_id = p_project_id
  for update;

  if not found then
    raise exception 'bid not found for this project'
      using errcode = 'P0002';
  end if;

  select *
    into v_vendor
  from public.vendors
  where user_id = v_bid.vendor_id;

  if not found then
    raise exception 'vendor profile not found'
      using errcode = 'P0002';
  end if;

  -- Idempotent retry path.
  select *
    into v_existing_hire
  from public.hire_confirmations h
  where h.project_id = v_project.id
     or h.bid_id = v_bid.id
  order by h.created_at, h.id
  limit 1
  for update;

  if found then
    if v_existing_hire.project_id is distinct from v_project.id
       or v_existing_hire.bid_id is distinct from v_bid.id
       or v_existing_hire.vendor_id is distinct from v_bid.vendor_id
       or lower(btrim(coalesce(v_project.status, ''))) <> 'hired'
       or v_project.hired_vendor_id is distinct from v_bid.vendor_id
       or lower(btrim(coalesce(v_bid.status, ''))) <> 'hired' then
      raise exception 'existing hire ledger conflicts with project/bid state'
        using errcode = '23514';
    end if;

    select c.id
      into v_conversation_id
    from public.conversations c
    where c.church_id = v_project.church_id
      and c.vendor_id = v_bid.vendor_id
      and c.project_id = v_project.id
    order by c.id
    limit 1;

    if v_conversation_id is null then
      select *
        into v_church_profile
      from public.profiles
      where id = p_actor;

      insert into public.conversations (
        project_id,
        church_id,
        vendor_id,
        church_name,
        vendor_name,
        vendor_emoji,
        status,
        project_title,
        budget,
        category,
        archived
      )
      values (
        v_project.id,
        v_project.church_id,
        v_bid.vendor_id,
        nullif(btrim(coalesce(v_church_profile.org_name, '')), ''),
        coalesce(nullif(btrim(v_vendor.name), ''), v_bid.vendor_name),
        coalesce(v_vendor.emoji, '🏢'),
        'open',
        coalesce(v_project.title, ''),
        coalesce(v_project.budget, ''),
        coalesce(v_project.category, ''),
        false
      )
      returning id into v_conversation_id;
    end if;

    v_winner_notification :=
      private.faithbid_bidding_notify_bid_accepted_v1(
        v_bid.id,
        v_conversation_id,
        p_actor
      );

    return jsonb_build_object(
      'ok', true,
      'status_code', 'HIRE_ALREADY_RECORDED',
      'project', to_jsonb(v_project),
      'bid_id', v_bid.id,
      'hire_confirmation_id', v_existing_hire.id,
      'conversation_id', v_conversation_id,
      'declined_competitor_count', 0,
      'winner_notification', v_winner_notification
    );
  end if;

  if lower(btrim(coalesce(v_project.status, ''))) <> 'open'
     or v_project.hired_vendor_id is not null then
    raise exception 'project is not eligible for hiring'
      using errcode = 'P0001';
  end if;

  if lower(btrim(coalesce(v_bid.status, ''))) not in (
    'pending',
    'under_review'
  ) then
    raise exception 'bid is not eligible for hiring'
      using errcode = 'P0001';
  end if;

  if v_bid.amount is null or v_bid.amount <= 0 then
    raise exception 'bid amount is invalid'
      using errcode = '22023';
  end if;

  if coalesce(v_vendor.suspended, false)
     or not (
       lower(btrim(coalesce(v_vendor.verification_status, ''))) = 'approved'
       or (
         v_vendor.verification_status is null
         and coalesce(v_vendor.verified, false)
       )
     ) then
    raise exception 'vendor is not eligible to be hired'
      using errcode = '42501';
  end if;

  select max(r.revision_number)
    into v_revision_number
  from private.bid_revisions r
  where r.bid_id = v_bid.id;

  v_accepted_terms := jsonb_build_object(
    'bid_id', v_bid.id::text,
    'project_id', v_bid.project_id::text,
    'vendor_user_id', v_bid.vendor_id::text,
    'amount_cents', round(v_bid.amount * 100)::bigint,
    'currency', 'usd',
    'timeline', v_bid.timeline,
    'cover_letter', coalesce(v_bid.cover_letter, ''),
    'milestones', coalesce(v_bid.milestones, '[]'::jsonb),
    'submitted_at', v_bid.submitted_at,
    'accepted_revision_number', v_revision_number
  );

  select *
    into v_church_profile
  from public.profiles
  where id = p_actor;

  -- Guarantee one project conversation before returning a hire success.
  select c.id
    into v_conversation_id
  from public.conversations c
  where c.church_id = v_project.church_id
    and c.vendor_id = v_bid.vendor_id
    and c.project_id = v_project.id
  order by c.id
  limit 1
  for update;

  if v_conversation_id is null then
    insert into public.conversations (
      project_id,
      church_id,
      vendor_id,
      church_name,
      vendor_name,
      vendor_emoji,
      status,
      project_title,
      budget,
      category,
      archived
    )
    values (
      v_project.id,
      v_project.church_id,
      v_bid.vendor_id,
      nullif(btrim(coalesce(v_church_profile.org_name, '')), ''),
      coalesce(nullif(btrim(v_vendor.name), ''), v_bid.vendor_name),
      coalesce(v_vendor.emoji, '🏢'),
      'open',
      coalesce(v_project.title, ''),
      coalesce(v_project.budget, ''),
      coalesce(v_project.category, ''),
      false
    )
    returning id into v_conversation_id;
  else
    update public.conversations
       set archived = false,
           status = 'open',
           church_name = coalesce(
             nullif(btrim(coalesce(v_church_profile.org_name, '')), ''),
             church_name
           ),
           vendor_name = coalesce(
             nullif(btrim(coalesce(v_vendor.name, '')), ''),
             vendor_name
           ),
           vendor_emoji = coalesce(v_vendor.emoji, vendor_emoji, '🏢'),
           project_title = coalesce(v_project.title, project_title, ''),
           budget = coalesce(v_project.budget, budget, ''),
           category = coalesce(v_project.category, category, '')
     where id = v_conversation_id;
  end if;

  insert into public.hire_confirmations (
    project_id,
    bid_id,
    church_id,
    vendor_id,
    amount,
    platform_fee,
    status,
    vendor_name,
    project_title,
    bid_amount,
    currency,
    accepted_revision_number,
    accepted_terms,
    created_at
  )
  values (
    v_project.id,
    v_bid.id,
    v_project.church_id,
    v_bid.vendor_id,
    v_bid.amount,
    null,
    'recorded',
    coalesce(v_bid.vendor_name, v_vendor.name, ''),
    coalesce(v_project.title, ''),
    v_bid.amount,
    'usd',
    v_revision_number,
    v_accepted_terms,
    now()
  )
  returning * into v_hire;

  -- Winner.
  update public.bids
     set status = 'hired',
         hired_at = coalesce(hired_at, now())
   where id = v_bid.id
   returning * into v_bid;

  v_relationship_id :=
    private.faithbid_bidding_sync_project_vendor_link_v1(
      v_project.id,
      v_project.church_id,
      v_vendor.id,
      v_bid.vendor_id,
      'hired',
      null
    );

  -- Competing active proposals.
  for v_loser in
    select b.*
    from public.bids b
    where b.project_id = v_project.id
      and b.id <> v_bid.id
      and lower(btrim(coalesce(b.status, ''))) in (
        'pending',
        'under_review'
      )
    order by b.id
    for update
  loop
    update public.bids
       set status = 'declined',
           declined_at = coalesce(declined_at, now())
     where id = v_loser.id
     returning * into v_loser;

    select *
      into v_loser_vendor
    from public.vendors
    where user_id = v_loser.vendor_id;

    v_loser_vendor_found := found;

    if v_loser_vendor_found then
      perform private.faithbid_bidding_sync_project_vendor_link_v1(
        v_project.id,
        v_project.church_id,
        v_loser_vendor.id,
        v_loser.vendor_id,
        'declined',
        null
      );
    end if;

    select a.id
      into v_loser_activity_id
    from public.project_activity_feed a
    where a.project_id = v_project.id
      and a.kind = 'bid_declined'
      and a.meta ->> 'bid_id' = v_loser.id::text
    limit 1;

    if not found then
      select public.kb_append_project_activity(
        v_project.id,
        'bid_declined',
        'Proposal declined',
        coalesce(
          nullif(btrim(v_loser.vendor_name), ''),
          case
            when v_loser_vendor_found then v_loser_vendor.name
            else 'A vendor'
          end
        ) || ' was not selected for this project.',
        jsonb_build_object(
          'source', 'faithbid_bidding_hire_bid_v1',
          'reason', 'another_vendor_hired',
          'bid_id', v_loser.id::text,
          'hired_bid_id', v_bid.id::text,
          'vendor_user_id', v_loser.vendor_id::text
        ),
        case
          when v_loser_vendor_found then v_loser.vendor_id
          else null
        end
      )
      into v_loser_activity_id;
    end if;

    -- Existing helper validates that the actor is the project church and
    -- dedupes by event/context.
    select public.kb_create_trusted_notification(
      'bid_declined',
      v_loser.id
    )
    into v_loser_notification;

    v_loser_count := v_loser_count + 1;
  end loop;

  update public.projects
     set status = 'hired',
         hired_vendor_id = v_bid.vendor_id,
         hired_at = coalesce(hired_at, now()),
         work_started_at = null,
         work_started_by = null,
         completion_requested_at = null,
         completion_requested_by = null,
         completed_at = null,
         completed_by = null
   where id = v_project.id
   returning * into v_project;

  v_winner_notification :=
    private.faithbid_bidding_notify_bid_accepted_v1(
      v_bid.id,
      v_conversation_id,
      p_actor
    );

  select a.id
    into v_activity_id
  from public.project_activity_feed a
  where a.project_id = v_project.id
    and a.kind = 'vendor_hired'
    and (
      a.meta ->> 'hire_confirmation_id' = v_hire.id::text
      or a.meta ->> 'bid_id' = v_bid.id::text
    )
  limit 1;

  if not found then
    select public.kb_append_project_activity(
      v_project.id,
      'vendor_hired',
      'Vendor hired',
      coalesce(nullif(btrim(v_vendor.name), ''), 'Vendor')
        || ' was selected for the project.',
      jsonb_build_object(
        'source', 'faithbid_bidding_hire_bid_v1',
        'from_status', 'open',
        'to_status', 'hired',
        'bid_id', v_bid.id::text,
        'hire_confirmation_id', v_hire.id::text,
        'vendor_profile_id', v_vendor.id::text,
        'vendor_user_id', v_bid.vendor_id::text,
        'conversation_id', v_conversation_id::text,
        'accepted_revision_number', v_revision_number
      ),
      v_bid.vendor_id
    )
    into v_activity_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'status_code', 'VENDOR_HIRED',
    'project', to_jsonb(v_project),
    'bid_id', v_bid.id,
    'hire_confirmation_id', v_hire.id,
    'conversation_id', v_conversation_id,
    'relationship_id', v_relationship_id,
    'accepted_revision_number', v_revision_number,
    'declined_competitor_count', v_loser_count,
    'activity_id', v_activity_id,
    'winner_notification', v_winner_notification
  );

exception
  when unique_violation then
    raise exception 'hire already exists for this project or bid'
      using errcode = '23505';
end;
$function$;

revoke all on function private.faithbid_bidding_hire_core_v1(
  uuid,uuid,uuid
) from public, anon, authenticated;


-- ============================================================================
-- 4. NEW V2 HIRE COMMAND
-- ============================================================================

create or replace function public.faithbid_bidding_hire_bid_v1(
  p_project_id uuid,
  p_bid_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  return private.faithbid_bidding_hire_core_v1(
    p_project_id,
    p_bid_id,
    v_actor
  );
end;
$function$;

revoke all on function public.faithbid_bidding_hire_bid_v1(uuid,uuid)
  from public, anon;

grant execute on function public.faithbid_bidding_hire_bid_v1(uuid,uuid)
  to authenticated;


-- ============================================================================
-- 5. LEGACY COMPATIBILITY: EXISTING APP STILL CALLS confirm_hire
-- Keep the exact argument order and old `success` field while routing the old
-- frontend through the same new private core. App.jsx does not need editing.
-- ============================================================================

create or replace function public.confirm_hire(
  p_bid_id uuid,
  p_project_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_result jsonb;
begin
  if v_actor is null then
    raise exception 'Sign in to hire a vendor.'
      using errcode = '42501';
  end if;

  v_result :=
    private.faithbid_bidding_hire_core_v1(
      p_project_id,
      p_bid_id,
      v_actor
    );

  return v_result || jsonb_build_object('success', true);
end;
$function$;

revoke all on function public.confirm_hire(uuid,uuid)
  from public, anon;

grant execute on function public.confirm_hire(uuid,uuid)
  to authenticated, service_role;


-- ============================================================================
-- 6. RETIRE THE CONFLICTING FEE-LEDGER WRITER
--
-- Live audit found:
--   - no active App.jsx caller (only a dead helper definition)
--   - no database-function caller
--   - no active Edge Function caller
--
-- Keep the function body in place as rollback/reference evidence, but remove
-- executable application/service access. The owner/postgres role can still
-- inspect or intentionally invoke it during controlled administration.
-- ============================================================================

revoke all on function public.kb_create_hire_confirmation(uuid,uuid)
  from public, anon, authenticated, service_role;

comment on function public.kb_create_hire_confirmation(uuid,uuid) is
  'DEPRECATED by FaithBid Bidding v2 Migration 006. Do not use. Hire selection is recorded atomically by faithbid_bidding_hire_bid_v1 / confirm_hire compatibility wrapper. Payment rails are separate.';


commit;

-- ============================================================================
-- END MIGRATION 006
-- ============================================================================
