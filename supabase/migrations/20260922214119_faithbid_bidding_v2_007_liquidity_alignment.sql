-- ============================================================================
-- FaithBid Bidding v2
-- Migration 007: Liquidity Alignment + Time-Driven Refresh
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
--   006 Hire Convergence
--
-- PURPOSE
--   Correct the current proposal-liquidity semantics and make deadline
--   transitions time-driven instead of event-only.
--
-- IMPORTANT
--   This file has NOT been applied.
--   It does not modify App.jsx.
--   It does not enable marketplace_public or bidding_enabled.
--   It does not create bids, hires, payment plans, or Stripe transactions.
-- ============================================================================

begin;

set local lock_timeout = '10s';
set local statement_timeout = '60s';


-- ============================================================================
-- 1. SNAPSHOT OBJECTIVE MARKETPLACE ELIGIBILITY AT PROPOSAL SUBMISSION
--
-- Why:
--   The current liquidity function reads CURRENT vendor verification/suspension
--   state, which can retroactively rewrite historical proposal coverage.
--
--   These fields preserve what was true when the proposal entered the market.
-- ============================================================================

alter table public.bids
  add column marketplace_approved_at_submission boolean not null default false,
  add column faith_verified_at_submission boolean not null default false,
  add column vendor_suspended_at_submission boolean not null default false,
  add column liquidity_qualified_at_submission boolean not null default false,
  add column liquidity_snapshot_basis text not null default 'captured_at_submission',
  add column liquidity_snapshot_captured_at timestamptz not null default now();

alter table public.bids
  add constraint bids_liquidity_snapshot_basis_check
  check (
    liquidity_snapshot_basis in (
      'captured_at_submission',
      'migration_backfill_current_state'
    )
  );

comment on column public.bids.marketplace_approved_at_submission is
  'Snapshot: vendor satisfied FaithBid Marketplace admission at proposal submission time.';

comment on column public.bids.faith_verified_at_submission is
  'Snapshot: optional Faith Verified trust state at proposal submission time; not an eligibility requirement.';

comment on column public.bids.vendor_suspended_at_submission is
  'Snapshot: vendor suspension state at proposal submission time.';

comment on column public.bids.liquidity_qualified_at_submission is
  'Snapshot: proposal objectively counted as a qualified marketplace response at submission. Later church decisions do not retroactively erase it; vendor withdrawal does.';


-- ============================================================================
-- 2. SERVER-OWNED SUBMISSION SNAPSHOT TRIGGER
-- Works for both the legacy submit RPC and the proposed v2 submit command.
-- ============================================================================

create or replace function private.faithbid_capture_bid_liquidity_snapshot_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_vendor public.vendors%rowtype;
  v_marketplace_approved boolean := false;
  v_faith_verified boolean := false;
  v_suspended boolean := false;
begin
  select *
    into v_vendor
  from public.vendors
  where user_id = coalesce(new.vendor_user_id, new.vendor_id)
  limit 1;

  if found then
    v_marketplace_approved :=
      lower(btrim(coalesce(v_vendor.verification_status, ''))) = 'approved'
      or (
        v_vendor.verification_status is null
        and coalesce(v_vendor.verified, false)
      );

    v_faith_verified := coalesce(v_vendor.verified, false);
    v_suspended := coalesce(v_vendor.suspended, false);
  end if;

  new.marketplace_approved_at_submission := v_marketplace_approved;
  new.faith_verified_at_submission := v_faith_verified;
  new.vendor_suspended_at_submission := v_suspended;
  new.liquidity_snapshot_basis := 'captured_at_submission';
  new.liquidity_snapshot_captured_at := clock_timestamp();

  -- "Qualified comparable proposal" is an objective market-response test.
  -- Cover letter is intentionally NOT required because the live/v2 submission
  -- contract allows it to be blank. Faith Verified is also intentionally not
  -- required because it is optional trust, not Marketplace admission.
  new.liquidity_qualified_at_submission :=
       v_marketplace_approved
    and not v_suspended
    and coalesce(new.amount, 0) > 0
    and nullif(btrim(coalesce(new.timeline, '')), '') is not null;

  return new;
end;
$function$;

revoke all on function private.faithbid_capture_bid_liquidity_snapshot_v1()
  from public, anon, authenticated;

drop trigger if exists faithbid_bids_liquidity_snapshot_v1
  on public.bids;

create trigger faithbid_bids_liquidity_snapshot_v1
before insert on public.bids
for each row
execute function private.faithbid_capture_bid_liquidity_snapshot_v1();


-- ============================================================================
-- 3. BACKFILL ANY PRE-007 BIDS
--
-- Live audit currently shows zero bid rows, but this block makes the migration
-- fail-safe if legitimate bids appear before 007 is ever applied.
-- ============================================================================

update public.bids b
set marketplace_approved_at_submission =
      (
        lower(btrim(coalesce(v.verification_status, ''))) = 'approved'
        or (
          v.verification_status is null
          and coalesce(v.verified, false)
        )
      ),
    faith_verified_at_submission = coalesce(v.verified, false),
    vendor_suspended_at_submission = coalesce(v.suspended, false),
    liquidity_qualified_at_submission =
      (
        (
          lower(btrim(coalesce(v.verification_status, ''))) = 'approved'
          or (
            v.verification_status is null
            and coalesce(v.verified, false)
          )
        )
        and not coalesce(v.suspended, false)
        and coalesce(b.amount, 0) > 0
        and nullif(btrim(coalesce(b.timeline, '')), '') is not null
      ),
    liquidity_snapshot_basis = 'migration_backfill_current_state',
    liquidity_snapshot_captured_at = clock_timestamp()
from public.vendors v
where v.user_id = coalesce(b.vendor_user_id, b.vendor_id);


-- ============================================================================
-- 4. REPLACE THE EXISTING LIQUIDITY ENGINE IN PLACE
--
-- Existing triggers already call private.kb_refresh_project_liquidity_v0().
-- Replacing the body fixes all existing trigger callers without rewiring them.
--
-- Canonical meaning after 007:
--
-- qualified_comparable_proposal_count =
--   objective qualified marketplace proposals submitted by the response-window
--   deadline, excluding vendor-withdrawn proposals.
--
-- A church review/decline/hire decision does NOT erase historical market
-- response. Current hire eligibility remains governed by the bidding/hire
-- capability rules, not this historical coverage metric.
-- ============================================================================

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
  v_prior_state text := 'not_applicable';
  v_now timestamptz := coalesce(p_as_of, now());
begin
  select *
    into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    return;
  end if;

  v_prior_state := coalesce(v_project.liquidity_status, 'not_applicable');

  if v_project.record_origin = 'real' then

    if v_project.proposal_response_window_ends_at is not null then
      select count(*)::integer
        into v_count
      from public.bids b
      where b.project_id = v_project.id
        and coalesce(b.liquidity_qualified_at_submission, false)
        and lower(btrim(coalesce(b.status, ''))) <> 'withdrawn'
        and b.withdrawn_at is null
        and coalesce(b.submitted_at, b.created_at)
              <= v_project.proposal_response_window_ends_at;
    else
      v_count := 0;
    end if;

    if lower(btrim(coalesce(v_project.status, ''))) <> 'open' then
      -- Preserve historical proposal count after award/completion while making
      -- current-market liquidity explicitly non-applicable.
      v_state := 'not_applicable';

    elsif v_project.proposal_response_window_ends_at is null then
      v_state := 'waiting_for_window';

    elsif v_count >= 2 then
      v_state := 'healthy';

    elsif v_now >= v_project.proposal_response_window_ends_at then
      v_state := 'thin';

    else
      v_state := 'collecting';
    end if;

  else
    -- Synthetic / QA / unclassified records must never contaminate real
    -- marketplace liquidity or founding-cohort proof.
    v_count := 0;
    v_state := 'not_applicable';
  end if;

  update public.projects
     set qualified_comparable_proposal_count = v_count,
         liquidity_status = v_state,
         liquidity_evaluated_at = v_now,

         -- Each new thin episode gets its own alert timestamp.
         thin_coverage_alerted_at = case
           when v_state = 'thin'
                and v_prior_state <> 'thin'
             then v_now
           when v_state = 'thin'
             then coalesce(thin_coverage_alerted_at, v_now)
           else thin_coverage_alerted_at
         end,

         -- Leaving thin for any reason resolves the current thin episode.
         -- If a later response-window extension eventually becomes thin again,
         -- the alert timestamp above is refreshed for that new episode.
         thin_coverage_resolved_at = case
           when v_state = 'thin'
             then null
           when v_prior_state = 'thin'
                and v_state <> 'thin'
             then v_now
           else thin_coverage_resolved_at
         end
   where id = v_project.id;
end;
$function$;

revoke all on function private.kb_refresh_project_liquidity_v0(uuid,timestamptz)
  from public, anon, authenticated;


-- ============================================================================
-- 5. INDEX THE TIME-DRIVEN DEADLINE QUEUE
-- ============================================================================

create index if not exists projects_real_open_liquidity_deadline_idx
  on public.projects (proposal_response_window_ends_at, id)
  where record_origin = 'real'
    and status = 'open'
    and proposal_response_window_ends_at is not null;


-- ============================================================================
-- 6. DUE-DEADLINE REFRESHER
--
-- The old model is event-driven only. A project can cross its deadline with no
-- write event and remain "collecting" forever.
--
-- This helper refreshes only real/open projects whose deadline has arrived and
-- whose last evaluation was before the deadline or whose status still says it
-- is waiting/collecting.
-- ============================================================================

create or replace function private.faithbid_refresh_due_liquidity_v1(
  p_as_of timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_as_of timestamptz := coalesce(p_as_of, now());
  v_project_id uuid;
  v_refreshed integer := 0;
begin
  for v_project_id in
    select p.id
    from public.projects p
    where p.record_origin = 'real'
      and p.status = 'open'
      and p.proposal_response_window_ends_at is not null
      and p.proposal_response_window_ends_at <= v_as_of
      and (
        p.liquidity_evaluated_at is null
        or p.liquidity_evaluated_at < p.proposal_response_window_ends_at
        or p.liquidity_status in ('waiting_for_window','collecting')
      )
    order by p.proposal_response_window_ends_at, p.id
  loop
    perform private.kb_refresh_project_liquidity_v0(
      v_project_id,
      v_as_of
    );
    v_refreshed := v_refreshed + 1;
  end loop;

  return jsonb_build_object(
    'refreshed', v_refreshed,
    'as_of', v_as_of,
    'thin', (
      select count(*)
      from public.projects
      where record_origin = 'real'
        and status = 'open'
        and liquidity_status = 'thin'
    ),
    'healthy', (
      select count(*)
      from public.projects
      where record_origin = 'real'
        and status = 'open'
        and liquidity_status = 'healthy'
    ),
    'collecting', (
      select count(*)
      from public.projects
      where record_origin = 'real'
        and status = 'open'
        and liquidity_status = 'collecting'
    )
  );
end;
$function$;

revoke all on function private.faithbid_refresh_due_liquidity_v1(timestamptz)
  from public, anon, authenticated;


-- ============================================================================
-- 7. ONE-TIME RECOMPUTE UNDER THE CORRECTED CONTRACT
-- Recalculates real projects only. Current live audit has zero real projects.
-- ============================================================================

do $$
declare
  v_project_id uuid;
begin
  for v_project_id in
    select p.id
    from public.projects p
    where p.record_origin = 'real'
    order by p.id
  loop
    perform private.kb_refresh_project_liquidity_v0(
      v_project_id,
      clock_timestamp()
    );
  end loop;
end
$$;


-- ============================================================================
-- 8. TIME-DRIVEN REFRESH
--
-- Supabase pg_cron is already enabled and active in this project.
-- Hourly is sufficient because this is an operational coverage metric, not a
-- hard bid-closing deadline.
-- ============================================================================

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select j.jobid
    from cron.job j
    where j.jobname = 'faithbid-project-liquidity-refresh-v1'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'faithbid-project-liquidity-refresh-v1',
    '12 * * * *',
    'select private.faithbid_refresh_due_liquidity_v1();'
  );
end
$$;


commit;

-- ============================================================================
-- END MIGRATION 007
-- ============================================================================
