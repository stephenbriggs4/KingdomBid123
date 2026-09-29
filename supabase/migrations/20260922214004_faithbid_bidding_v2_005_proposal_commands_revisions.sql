-- ============================================================================
-- FaithBid Bidding v2
-- Migration 005: Atomic Proposal Commands + Revision History
-- Project: knkwaphosqronbhrvlsu
-- Status: DRAFT / AUDITED / NOT APPLIED
-- Generated: 2026-09-22
--
-- DEPENDENCIES
--   001 Integrity Boundary
--   002 Vendor + Capability Core
--   003 Read-Only Query Facade
--   004 Canonical Vendor Invitation Command
--
-- PURPOSE
--   Make proposal submit/edit/withdraw/review/decline server-owned, atomic,
--   auditable, and independent of App.jsx orchestration.
--
-- IMPORTANT
--   This file has NOT been applied.
--   It does not modify App.jsx.
--   It does not enable marketplace_public or bidding_enabled.
-- ============================================================================

begin;

set local lock_timeout = '10s';
set local statement_timeout = '60s';


-- ============================================================================
-- 1. IMMUTABLE PROPOSAL REVISION HISTORY
-- One public.bids row remains the current proposal; every commercial edit is
-- preserved here as an immutable version.
-- ============================================================================

create table private.bid_revisions (
  id uuid primary key default gen_random_uuid(),
  bid_id uuid not null
    references public.bids(id) on delete cascade,
  project_id uuid not null
    references public.projects(id) on delete cascade,
  vendor_user_id uuid not null
    references auth.users(id) on delete cascade,

  revision_number integer not null
    check (revision_number > 0),

  change_kind text not null
    check (change_kind in ('submitted','edited','baseline_import')),

  amount_cents bigint not null
    check (amount_cents > 0 and amount_cents <= 1000000000),

  currency text not null default 'usd'
    check (currency = 'usd'),

  timeline text not null
    check (char_length(btrim(timeline)) between 1 and 200),

  cover_letter text not null default ''
    check (char_length(cover_letter) <= 1500),

  milestones jsonb not null default '[]'::jsonb
    check (
      jsonb_typeof(milestones) = 'array'
      and jsonb_array_length(milestones) <= 25
      and octet_length(milestones::text) <= 50000
    ),

  created_by uuid not null
    references auth.users(id) on delete restrict,

  created_at timestamptz not null default now(),

  unique (bid_id, revision_number)
);

create index bid_revisions_project_created_idx
  on private.bid_revisions(project_id, created_at desc);

create index bid_revisions_vendor_created_idx
  on private.bid_revisions(vendor_user_id, created_at desc);

revoke all on table private.bid_revisions
  from public, anon, authenticated;

-- If any legacy bids exist by the time 005 is applied, preserve their CURRENT
-- commercial terms as an explicitly-labeled baseline. This is not represented
-- as the original submission version because earlier revisions cannot be
-- reconstructed from the live schema.
insert into private.bid_revisions (
  bid_id,
  project_id,
  vendor_user_id,
  revision_number,
  change_kind,
  amount_cents,
  currency,
  timeline,
  cover_letter,
  milestones,
  created_by,
  created_at
)
select
  b.id,
  b.project_id,
  b.vendor_id,
  1,
  'baseline_import',
  round(b.amount * 100)::bigint,
  'usd',
  b.timeline,
  coalesce(b.cover_letter, ''),
  coalesce(b.milestones, '[]'::jsonb),
  b.vendor_id,
  now()
from public.bids b
on conflict (bid_id, revision_number) do nothing;


-- ============================================================================
-- 2. PRIVATE REVISION APPENDER
-- Locks the bid before assigning the next revision number.
-- ============================================================================

create or replace function private.faithbid_bidding_append_revision_v1(
  p_bid_id uuid,
  p_change_kind text,
  p_created_by uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_bid public.bids%rowtype;
  v_kind text := lower(btrim(coalesce(p_change_kind, '')));
  v_revision_number integer;
  v_revision_id uuid;
begin
  if p_bid_id is null or p_created_by is null then
    raise exception 'bid id and actor are required'
      using errcode = '22023';
  end if;

  if v_kind not in ('submitted','edited') then
    raise exception 'unsupported revision kind'
      using errcode = '22023';
  end if;

  select *
    into v_bid
  from public.bids
  where id = p_bid_id
  for update;

  if not found then
    raise exception 'bid not found'
      using errcode = 'P0002';
  end if;

  select coalesce(max(r.revision_number), 0) + 1
    into v_revision_number
  from private.bid_revisions r
  where r.bid_id = v_bid.id;

  insert into private.bid_revisions (
    bid_id,
    project_id,
    vendor_user_id,
    revision_number,
    change_kind,
    amount_cents,
    currency,
    timeline,
    cover_letter,
    milestones,
    created_by
  )
  values (
    v_bid.id,
    v_bid.project_id,
    v_bid.vendor_id,
    v_revision_number,
    v_kind,
    round(v_bid.amount * 100)::bigint,
    'usd',
    v_bid.timeline,
    coalesce(v_bid.cover_letter, ''),
    coalesce(v_bid.milestones, '[]'::jsonb),
    p_created_by
  )
  returning id into v_revision_id;

  return jsonb_build_object(
    'revision_id', v_revision_id,
    'revision_number', v_revision_number,
    'change_kind', v_kind
  );
end;
$function$;

revoke all on function private.faithbid_bidding_append_revision_v1(uuid,text,uuid)
  from public, anon, authenticated;


-- ============================================================================
-- 3. PRIVATE RELATIONSHIP SYNCHRONIZER
-- New v2 commands use vendor_profile_id + vendor_user_id explicitly.
-- ============================================================================

create or replace function private.faithbid_bidding_sync_project_vendor_link_v1(
  p_project_id uuid,
  p_church_id uuid,
  p_vendor_profile_id uuid,
  p_vendor_user_id uuid,
  p_stage text,
  p_source text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_link public.project_vendor_links%rowtype;
  v_stage text := lower(btrim(coalesce(p_stage, '')));
  v_source text := nullif(lower(btrim(coalesce(p_source, ''))), '');
begin
  if p_project_id is null
     or p_church_id is null
     or p_vendor_profile_id is null
     or p_vendor_user_id is null then
    raise exception 'project/church/vendor identity is required'
      using errcode = '22023';
  end if;

  if v_stage not in (
    'watching',
    'invited',
    'bid_received',
    'shortlisted',
    'hired',
    'declined',
    'archived'
  ) then
    raise exception 'unsupported relationship stage'
      using errcode = '22023';
  end if;

  if v_source is not null
     and v_source not in (
       'marketplace',
       'directory',
       'compare',
       'manual',
       'detail',
       'inbox'
     ) then
    raise exception 'unsupported relationship source'
      using errcode = '22023';
  end if;

  select *
    into v_link
  from public.project_vendor_links
  where project_id = p_project_id
    and vendor_user_id = p_vendor_user_id
  for update;

  if found then
    if v_link.church_id is distinct from p_church_id
       or (
         v_link.vendor_id is not null
         and v_link.vendor_id is distinct from p_vendor_profile_id
       ) then
      raise exception 'existing project/vendor relationship identity is inconsistent'
        using errcode = '23514';
    end if;

    update public.project_vendor_links
       set vendor_id = coalesce(vendor_id, p_vendor_profile_id),
           stage = v_stage,
           source = coalesce(source, v_source, 'marketplace'),
           last_activity_at = now(),
           invited_at = case
             when v_stage = 'invited' then coalesce(invited_at, now())
             else invited_at
           end,
           bid_received_at = case
             when v_stage = 'bid_received' then coalesce(bid_received_at, now())
             else bid_received_at
           end,
           shortlisted_at = case
             when v_stage = 'shortlisted' then coalesce(shortlisted_at, now())
             else shortlisted_at
           end,
           hired_at = case
             when v_stage = 'hired' then coalesce(hired_at, now())
             else hired_at
           end
     where id = v_link.id
     returning * into v_link;
  else
    insert into public.project_vendor_links (
      project_id,
      church_id,
      vendor_user_id,
      vendor_id,
      stage,
      source,
      last_activity_at,
      invited_at,
      bid_received_at,
      shortlisted_at,
      hired_at
    )
    values (
      p_project_id,
      p_church_id,
      p_vendor_user_id,
      p_vendor_profile_id,
      v_stage,
      coalesce(v_source, 'marketplace'),
      now(),
      case when v_stage = 'invited' then now() else null end,
      case when v_stage = 'bid_received' then now() else null end,
      case when v_stage = 'shortlisted' then now() else null end,
      case when v_stage = 'hired' then now() else null end
    )
    returning * into v_link;
  end if;

  return v_link.id;
end;
$function$;

revoke all on function private.faithbid_bidding_sync_project_vendor_link_v1(
  uuid,uuid,uuid,uuid,text,text
) from public, anon, authenticated;


-- ============================================================================
-- 4. SUBMIT PROPOSAL
-- One transaction now owns:
--   capability/eligibility
--   bid insert
--   revision 1
--   relationship stage
--   invitation response state
--   activity
--   durable trusted notification
-- ============================================================================

create or replace function public.faithbid_bidding_submit_bid_v1(
  p_project_id uuid,
  p_amount_cents bigint,
  p_timeline text,
  p_cover_letter text default '',
  p_milestones jsonb default '[]'::jsonb,
  p_currency text default 'usd'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_project public.projects%rowtype;
  v_vendor public.vendors%rowtype;
  v_profile public.profiles%rowtype;
  v_invite public.vendor_invites%rowtype;
  v_link public.project_vendor_links%rowtype;
  v_bid public.bids%rowtype;

  v_has_invite boolean := false;
  v_has_link boolean := false;
  v_link_was_invited boolean := false;
  v_global_bidding boolean := false;
  v_private_bid_access boolean := false;
  v_amount numeric;
  v_timeline text := btrim(coalesce(p_timeline, ''));
  v_cover_letter text := btrim(coalesce(p_cover_letter, ''));
  v_milestones jsonb := coalesce(p_milestones, '[]'::jsonb);
  v_currency text := lower(btrim(coalesce(p_currency, 'usd')));

  v_revision jsonb := '{}'::jsonb;
  v_relationship_id uuid;
  v_activity_id uuid;
  v_notification jsonb := '{}'::jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if p_project_id is null then
    raise exception 'project id is required'
      using errcode = '22023';
  end if;

  if v_currency <> 'usd' then
    raise exception 'only USD proposals are supported in bidding v2'
      using errcode = '22023';
  end if;

  if p_amount_cents is null
     or p_amount_cents <= 0
     or p_amount_cents > 1000000000 then
    raise exception 'proposal amount must be between 1 cent and 1000000000 cents'
      using errcode = '22023';
  end if;

  if char_length(v_timeline) not between 1 and 200 then
    raise exception 'proposal timeline is required and must be 200 characters or fewer'
      using errcode = '22023';
  end if;

  if char_length(v_cover_letter) > 1500 then
    raise exception 'cover letter must be 1500 characters or fewer'
      using errcode = '22023';
  end if;

  if jsonb_typeof(v_milestones) <> 'array'
     or jsonb_array_length(v_milestones) > 25
     or octet_length(v_milestones::text) > 50000 then
    raise exception 'proposal milestones are invalid'
      using errcode = '22023';
  end if;

  v_amount := p_amount_cents::numeric / 100;

  select *
    into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  if lower(btrim(coalesce(v_project.status, ''))) <> 'open' then
    raise exception 'project is not accepting proposals'
      using errcode = 'P0001';
  end if;

  select *
    into v_profile
  from public.profiles
  where id = v_actor;

  if not found or lower(btrim(coalesce(v_profile.role, ''))) <> 'vendor' then
    raise exception 'only vendor accounts can submit proposals'
      using errcode = '42501';
  end if;

  if lower(btrim(coalesce(v_profile.account_status, 'active'))) <> 'active'
     or lower(btrim(coalesce(v_profile.access_status, 'active'))) <> 'active' then
    raise exception 'vendor account is not active'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from auth.users u
    where u.id = v_actor
      and u.email_confirmed_at is not null
  ) then
    raise exception 'confirm your email before submitting a proposal'
      using errcode = '42501';
  end if;

  select *
    into v_vendor
  from public.vendors
  where user_id = v_actor;

  if not found then
    raise exception 'vendor profile not found'
      using errcode = '42501';
  end if;

  if coalesce(v_vendor.suspended, false) then
    raise exception 'vendor account is suspended'
      using errcode = '42501';
  end if;

  if not (
    lower(btrim(coalesce(v_vendor.verification_status, ''))) = 'approved'
    or (
      v_vendor.verification_status is null
      and coalesce(v_vendor.verified, false)
    )
  ) then
    raise exception 'Marketplace approval is required before bidding'
      using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.platform_settings s
    where s.key = 'bidding_enabled'
      and lower(btrim(coalesce(s.value, ''))) in ('true','1','yes','on')
  )
  into v_global_bidding;

  select *
    into v_invite
  from public.vendor_invites
  where project_id = v_project.id
    and vendor_id = v_vendor.id
  for update;

  v_has_invite := found;

  select *
    into v_link
  from public.project_vendor_links
  where project_id = v_project.id
    and vendor_user_id = v_actor
  for update;

  v_has_link := found;
  v_link_was_invited :=
    v_has_link
    and lower(btrim(coalesce(v_link.stage, ''))) = 'invited';

  v_private_bid_access :=
       coalesce(public.kb_is_platform_admin(), false)
    or (
      v_has_invite
      and lower(btrim(coalesce(v_invite.status, ''))) in ('invited','no_response')
    )
    or v_link_was_invited;

  if not v_global_bidding and not v_private_bid_access then
    raise exception 'bidding is disabled and this vendor is not invited to this project'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.bids b
    where b.project_id = v_project.id
      and b.vendor_id = v_actor
  ) then
    raise exception 'a proposal already exists for this vendor and project'
      using errcode = '23505';
  end if;

  begin
    insert into public.bids (
      project_id,
      church_id,
      vendor_id,
      vendor_user_id,
      vendor_name,
      vendor_emoji,
      category,
      amount,
      timeline,
      cover_letter,
      milestones,
      status,
      submitted_at
    )
    values (
      v_project.id,
      v_project.church_id,
      v_actor,
      v_actor,
      coalesce(nullif(btrim(v_vendor.name), ''), 'Unknown Vendor'),
      coalesce(v_vendor.emoji, '🏢'),
      coalesce(v_vendor.category, ''),
      v_amount,
      v_timeline,
      v_cover_letter,
      v_milestones,
      'pending',
      now()
    )
    returning * into v_bid;
  exception
    when unique_violation then
      raise exception 'a proposal already exists for this vendor and project'
        using errcode = '23505';
  end;

  v_revision :=
    private.faithbid_bidding_append_revision_v1(
      v_bid.id,
      'submitted',
      v_actor
    );

  v_relationship_id :=
    private.faithbid_bidding_sync_project_vendor_link_v1(
      v_project.id,
      v_project.church_id,
      v_vendor.id,
      v_actor,
      'bid_received',
      case
        when v_has_link then null
        when v_has_invite then 'manual'
        else 'marketplace'
      end
    );

  -- Preserve invitation as historical response evidence.
  if v_has_invite
     and lower(btrim(coalesce(v_invite.status, ''))) in ('invited','bid_received') then
    update public.vendor_invites
       set status = 'bid_received',
           responded_at = coalesce(responded_at, now()),
           bid_id = v_bid.id,
           response_class = 'bid_received'
     where id = v_invite.id
     returning * into v_invite;

  -- Repair legacy link-only invitations when that link was the actual
  -- project-specific authorization path.
  elsif not v_has_invite and v_link_was_invited then
    insert into public.vendor_invites (
      project_id,
      church_id,
      vendor_id,
      vendor_user_id,
      match_snapshot_id,
      status,
      invited_at,
      responded_at,
      bid_id,
      response_class,
      created_by
    )
    values (
      v_project.id,
      v_project.church_id,
      v_vendor.id,
      v_actor,
      null,
      'bid_received',
      coalesce(v_link.invited_at, now()),
      now(),
      v_bid.id,
      'bid_received',
      v_project.church_id
    )
    returning * into v_invite;
  end if;

  select a.id
    into v_activity_id
  from public.project_activity_feed a
  where a.project_id = v_project.id
    and a.kind = 'bid_received'
    and a.meta ->> 'bid_id' = v_bid.id::text
  limit 1;

  if not found then
    select public.kb_append_project_activity(
      v_project.id,
      'bid_received',
      'Proposal received',
      v_vendor.name || ' submitted a proposal.',
      jsonb_build_object(
        'source', 'faithbid_bidding_submit_bid_v1',
        'bid_id', v_bid.id::text,
        'vendor_profile_id', v_vendor.id::text,
        'vendor_user_id', v_actor::text,
        'amount_cents', p_amount_cents
      ),
      v_actor
    )
    into v_activity_id;
  end if;

  select public.kb_create_trusted_notification(
    'new_bid',
    v_bid.id
  )
  into v_notification;

  return jsonb_build_object(
    'ok', true,
    'status_code', 'PROPOSAL_SUBMITTED',
    'bid', jsonb_build_object(
      'id', v_bid.id,
      'project_id', v_bid.project_id,
      'status', v_bid.status,
      'amount_cents', p_amount_cents,
      'currency', 'usd',
      'timeline', v_bid.timeline,
      'cover_letter', v_bid.cover_letter,
      'milestones', v_bid.milestones,
      'submitted_at', v_bid.submitted_at
    ),
    'revision', v_revision,
    'relationship_id', v_relationship_id,
    'invite_id',
      case when v_invite.id is null then null else v_invite.id end,
    'activity_id', v_activity_id,
    'notification', coalesce(v_notification, '{}'::jsonb)
  );
end;
$function$;

revoke all on function public.faithbid_bidding_submit_bid_v1(
  uuid,bigint,text,text,jsonb,text
) from public, anon;

grant execute on function public.faithbid_bidding_submit_bid_v1(
  uuid,bigint,text,text,jsonb,text
) to authenticated;


-- ============================================================================
-- 5. EDIT PENDING PROPOSAL
-- Edits now preserve amount/timeline/cover letter/milestones as a revision.
-- ============================================================================

create or replace function public.faithbid_bidding_update_bid_v1(
  p_bid_id uuid,
  p_amount_cents bigint,
  p_timeline text,
  p_cover_letter text default '',
  p_milestones jsonb default '[]'::jsonb,
  p_currency text default 'usd'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_bid public.bids%rowtype;
  v_project public.projects%rowtype;
  v_profile public.profiles%rowtype;
  v_vendor public.vendors%rowtype;
  v_amount numeric;
  v_timeline text := btrim(coalesce(p_timeline, ''));
  v_cover_letter text := btrim(coalesce(p_cover_letter, ''));
  v_milestones jsonb := coalesce(p_milestones, '[]'::jsonb);
  v_currency text := lower(btrim(coalesce(p_currency, 'usd')));
  v_revision jsonb := '{}'::jsonb;
  v_changed boolean := false;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if p_bid_id is null then
    raise exception 'bid id is required'
      using errcode = '22023';
  end if;

  if v_currency <> 'usd' then
    raise exception 'only USD proposals are supported in bidding v2'
      using errcode = '22023';
  end if;

  if p_amount_cents is null
     or p_amount_cents <= 0
     or p_amount_cents > 1000000000 then
    raise exception 'proposal amount is invalid'
      using errcode = '22023';
  end if;

  if char_length(v_timeline) not between 1 and 200
     or char_length(v_cover_letter) > 1500
     or jsonb_typeof(v_milestones) <> 'array'
     or jsonb_array_length(v_milestones) > 25
     or octet_length(v_milestones::text) > 50000 then
    raise exception 'proposal terms are invalid'
      using errcode = '22023';
  end if;

  v_amount := p_amount_cents::numeric / 100;

  select *
    into v_bid
  from public.bids
  where id = p_bid_id
  for update;

  if not found then
    raise exception 'bid not found'
      using errcode = 'P0002';
  end if;

  if v_bid.vendor_id is distinct from v_actor then
    raise exception 'only the vendor may edit this proposal'
      using errcode = '42501';
  end if;

  if lower(btrim(coalesce(v_bid.status, ''))) <> 'pending' then
    raise exception 'only pending proposals may be edited'
      using errcode = 'P0001';
  end if;

  select *
    into v_project
  from public.projects
  where id = v_bid.project_id
  for update;

  if not found
     or lower(btrim(coalesce(v_project.status, ''))) <> 'open' then
    raise exception 'project is not open for proposal edits'
      using errcode = 'P0001';
  end if;

  select *
    into v_profile
  from public.profiles
  where id = v_actor;

  if not found
     or lower(btrim(coalesce(v_profile.role, ''))) <> 'vendor'
     or lower(btrim(coalesce(v_profile.account_status, 'active'))) <> 'active'
     or lower(btrim(coalesce(v_profile.access_status, 'active'))) <> 'active' then
    raise exception 'vendor account is not active'
      using errcode = '42501';
  end if;

  select *
    into v_vendor
  from public.vendors
  where user_id = v_actor;

  if not found then
    raise exception 'vendor profile not found'
      using errcode = 'P0002';
  end if;

  if coalesce(v_vendor.suspended, false) then
    raise exception 'suspended vendors may not revise proposals'
      using errcode = '42501';
  end if;

  if not (
    lower(btrim(coalesce(v_vendor.verification_status, ''))) = 'approved'
    or (
      v_vendor.verification_status is null
      and coalesce(v_vendor.verified, false)
    )
  ) then
    raise exception 'Marketplace approval is required to revise a proposal'
      using errcode = '42501';
  end if;

  v_changed :=
       v_bid.amount is distinct from v_amount
    or v_bid.timeline is distinct from v_timeline
    or coalesce(v_bid.cover_letter, '') is distinct from v_cover_letter
    or coalesce(v_bid.milestones, '[]'::jsonb) is distinct from v_milestones;

  if v_changed then
    update public.bids
       set amount = v_amount,
           timeline = v_timeline,
           cover_letter = v_cover_letter,
           milestones = v_milestones
     where id = v_bid.id
     returning * into v_bid;

    v_revision :=
      private.faithbid_bidding_append_revision_v1(
        v_bid.id,
        'edited',
        v_actor
      );
  else
    select jsonb_build_object(
      'revision_id', r.id,
      'revision_number', r.revision_number,
      'change_kind', r.change_kind
    )
    into v_revision
    from private.bid_revisions r
    where r.bid_id = v_bid.id
    order by r.revision_number desc
    limit 1;
  end if;

  return jsonb_build_object(
    'ok', true,
    'status_code', case when v_changed then 'PROPOSAL_UPDATED' else 'NO_CHANGE' end,
    'bid', jsonb_build_object(
      'id', v_bid.id,
      'status', v_bid.status,
      'amount_cents', round(v_bid.amount * 100)::bigint,
      'currency', 'usd',
      'timeline', v_bid.timeline,
      'cover_letter', v_bid.cover_letter,
      'milestones', v_bid.milestones,
      'updated_at', v_bid.updated_at
    ),
    'revision', coalesce(v_revision, '{}'::jsonb)
  );
end;
$function$;

revoke all on function public.faithbid_bidding_update_bid_v1(
  uuid,bigint,text,text,jsonb,text
) from public, anon;

grant execute on function public.faithbid_bidding_update_bid_v1(
  uuid,bigint,text,text,jsonb,text
) to authenticated;


-- ============================================================================
-- 6. WITHDRAW PROPOSAL
-- Withdrawal remains available to the proposal owner even if the account was
-- later suspended; suspension blocks new/edited work, not exit from a proposal.
-- ============================================================================

create or replace function public.faithbid_bidding_withdraw_bid_v1(
  p_bid_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_bid public.bids%rowtype;
  v_project public.projects%rowtype;
  v_vendor public.vendors%rowtype;
  v_relationship_id uuid;
  v_activity_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  select *
    into v_bid
  from public.bids
  where id = p_bid_id
  for update;

  if not found then
    raise exception 'bid not found'
      using errcode = 'P0002';
  end if;

  if v_bid.vendor_id is distinct from v_actor then
    raise exception 'only the vendor may withdraw this proposal'
      using errcode = '42501';
  end if;

  if lower(btrim(coalesce(v_bid.status, ''))) not in (
    'pending',
    'under_review',
    'withdrawn'
  ) then
    raise exception 'proposal cannot be withdrawn from its current state'
      using errcode = 'P0001';
  end if;

  select *
    into v_project
  from public.projects
  where id = v_bid.project_id
  for update;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  if lower(btrim(coalesce(v_project.status, ''))) <> 'open' then
    raise exception 'project is no longer open for proposal withdrawal'
      using errcode = 'P0001';
  end if;

  select *
    into v_vendor
  from public.vendors
  where user_id = v_actor;

  if not found then
    raise exception 'vendor profile not found'
      using errcode = 'P0002';
  end if;

  if lower(btrim(coalesce(v_bid.status, ''))) <> 'withdrawn' then
    update public.bids
       set status = 'withdrawn',
           withdrawn_at = coalesce(withdrawn_at, now())
     where id = v_bid.id
     returning * into v_bid;
  end if;

  v_relationship_id :=
    private.faithbid_bidding_sync_project_vendor_link_v1(
      v_project.id,
      v_project.church_id,
      v_vendor.id,
      v_actor,
      'archived',
      null
    );

  select a.id
    into v_activity_id
  from public.project_activity_feed a
  where a.project_id = v_project.id
    and a.kind = 'bid_withdrawn'
    and a.meta ->> 'bid_id' = v_bid.id::text
  limit 1;

  if not found then
    select public.kb_append_project_activity(
      v_project.id,
      'bid_withdrawn',
      'Proposal withdrawn',
      v_vendor.name || ' withdrew the proposal.',
      jsonb_build_object(
        'source', 'faithbid_bidding_withdraw_bid_v1',
        'bid_id', v_bid.id::text,
        'vendor_profile_id', v_vendor.id::text,
        'vendor_user_id', v_actor::text
      ),
      v_actor
    )
    into v_activity_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'status_code', 'PROPOSAL_WITHDRAWN',
    'bid_id', v_bid.id,
    'status', v_bid.status,
    'withdrawn_at', v_bid.withdrawn_at,
    'relationship_id', v_relationship_id,
    'activity_id', v_activity_id
  );
end;
$function$;

revoke all on function public.faithbid_bidding_withdraw_bid_v1(uuid)
  from public, anon;

grant execute on function public.faithbid_bidding_withdraw_bid_v1(uuid)
  to authenticated;


-- ============================================================================
-- 7. CHURCH REVIEW / SHORTLIST
-- One transition owns both bid status and project/vendor relationship stage.
-- ============================================================================

create or replace function public.faithbid_bidding_review_bid_v1(
  p_bid_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_bid public.bids%rowtype;
  v_project public.projects%rowtype;
  v_vendor public.vendors%rowtype;
  v_relationship_id uuid;
  v_activity_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  select *
    into v_bid
  from public.bids
  where id = p_bid_id
  for update;

  if not found then
    raise exception 'bid not found'
      using errcode = 'P0002';
  end if;

  select *
    into v_project
  from public.projects
  where id = v_bid.project_id
  for update;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  if v_project.church_id is distinct from v_actor then
    raise exception 'only the posting church may review this proposal'
      using errcode = '42501';
  end if;

  if lower(btrim(coalesce(v_project.status, ''))) <> 'open' then
    raise exception 'project is not open for proposal review'
      using errcode = 'P0001';
  end if;

  if lower(btrim(coalesce(v_bid.status, ''))) not in (
    'pending',
    'under_review'
  ) then
    raise exception 'proposal cannot be reviewed from its current state'
      using errcode = 'P0001';
  end if;

  select *
    into v_vendor
  from public.vendors
  where user_id = v_bid.vendor_id;

  if not found then
    raise exception 'vendor profile not found'
      using errcode = 'P0002';
  end if;

  if lower(btrim(coalesce(v_bid.status, ''))) = 'pending' then
    update public.bids
       set status = 'under_review',
           reviewed_at = coalesce(reviewed_at, now())
     where id = v_bid.id
     returning * into v_bid;
  end if;

  v_relationship_id :=
    private.faithbid_bidding_sync_project_vendor_link_v1(
      v_project.id,
      v_project.church_id,
      v_vendor.id,
      v_bid.vendor_id,
      'shortlisted',
      null
    );

  select a.id
    into v_activity_id
  from public.project_activity_feed a
  where a.project_id = v_project.id
    and a.kind = 'vendor_shortlisted'
    and a.meta ->> 'bid_id' = v_bid.id::text
  limit 1;

  if not found then
    select public.kb_append_project_activity(
      v_project.id,
      'vendor_shortlisted',
      'Proposal shortlisted',
      v_vendor.name || ' moved to church review.',
      jsonb_build_object(
        'source', 'faithbid_bidding_review_bid_v1',
        'bid_id', v_bid.id::text,
        'vendor_profile_id', v_vendor.id::text,
        'vendor_user_id', v_bid.vendor_id::text
      ),
      v_bid.vendor_id
    )
    into v_activity_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'status_code', 'PROPOSAL_UNDER_REVIEW',
    'bid_id', v_bid.id,
    'status', v_bid.status,
    'reviewed_at', v_bid.reviewed_at,
    'relationship_id', v_relationship_id,
    'activity_id', v_activity_id
  );
end;
$function$;

revoke all on function public.faithbid_bidding_review_bid_v1(uuid)
  from public, anon;

grant execute on function public.faithbid_bidding_review_bid_v1(uuid)
  to authenticated;


-- ============================================================================
-- 8. CHURCH DECLINE
-- Decline state, relationship, durable notification, and activity are atomic.
-- ============================================================================

create or replace function public.faithbid_bidding_decline_bid_v1(
  p_bid_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_bid public.bids%rowtype;
  v_project public.projects%rowtype;
  v_vendor public.vendors%rowtype;
  v_relationship_id uuid;
  v_activity_id uuid;
  v_notification jsonb := '{}'::jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  select *
    into v_bid
  from public.bids
  where id = p_bid_id
  for update;

  if not found then
    raise exception 'bid not found'
      using errcode = 'P0002';
  end if;

  select *
    into v_project
  from public.projects
  where id = v_bid.project_id
  for update;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  if v_project.church_id is distinct from v_actor then
    raise exception 'only the posting church may decline this proposal'
      using errcode = '42501';
  end if;

  if lower(btrim(coalesce(v_project.status, ''))) <> 'open' then
    raise exception 'project is not open for proposal decisions'
      using errcode = 'P0001';
  end if;

  if lower(btrim(coalesce(v_bid.status, ''))) not in (
    'pending',
    'under_review',
    'declined'
  ) then
    raise exception 'proposal cannot be declined from its current state'
      using errcode = 'P0001';
  end if;

  select *
    into v_vendor
  from public.vendors
  where user_id = v_bid.vendor_id;

  if not found then
    raise exception 'vendor profile not found'
      using errcode = 'P0002';
  end if;

  if lower(btrim(coalesce(v_bid.status, ''))) <> 'declined' then
    update public.bids
       set status = 'declined',
           declined_at = coalesce(declined_at, now())
     where id = v_bid.id
     returning * into v_bid;
  end if;

  v_relationship_id :=
    private.faithbid_bidding_sync_project_vendor_link_v1(
      v_project.id,
      v_project.church_id,
      v_vendor.id,
      v_bid.vendor_id,
      'declined',
      null
    );

  select a.id
    into v_activity_id
  from public.project_activity_feed a
  where a.project_id = v_project.id
    and a.kind = 'bid_declined'
    and a.meta ->> 'bid_id' = v_bid.id::text
  limit 1;

  if not found then
    select public.kb_append_project_activity(
      v_project.id,
      'bid_declined',
      'Proposal declined',
      v_vendor.name || ' was not selected for this project.',
      jsonb_build_object(
        'source', 'faithbid_bidding_decline_bid_v1',
        'bid_id', v_bid.id::text,
        'vendor_profile_id', v_vendor.id::text,
        'vendor_user_id', v_bid.vendor_id::text
      ),
      v_bid.vendor_id
    )
    into v_activity_id;
  end if;

  -- Existing trusted event already validates church ownership and dedupes on
  -- event/context. Calling it on idempotent retries repairs a missing legacy
  -- notification without creating duplicates.
  select public.kb_create_trusted_notification(
    'bid_declined',
    v_bid.id
  )
  into v_notification;

  return jsonb_build_object(
    'ok', true,
    'status_code', 'PROPOSAL_DECLINED',
    'bid_id', v_bid.id,
    'status', v_bid.status,
    'declined_at', v_bid.declined_at,
    'relationship_id', v_relationship_id,
    'activity_id', v_activity_id,
    'notification', coalesce(v_notification, '{}'::jsonb)
  );
end;
$function$;

revoke all on function public.faithbid_bidding_decline_bid_v1(uuid)
  from public, anon;

grant execute on function public.faithbid_bidding_decline_bid_v1(uuid)
  to authenticated;


-- ============================================================================
-- 9. AUTHORIZED REVISION-HISTORY QUERY
-- The private table remains unavailable directly to browsers.
-- ============================================================================

create or replace function public.faithbid_bidding_get_bid_revisions_v1(
  p_bid_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_bid public.bids%rowtype;
  v_project public.projects%rowtype;
  v_is_admin boolean := false;
  v_items jsonb := '[]'::jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
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

  v_is_admin := coalesce(public.kb_is_platform_admin(), false);

  if not v_is_admin
     and v_actor is distinct from v_bid.vendor_id
     and v_actor is distinct from v_project.church_id then
    raise exception 'not authorized for this proposal history'
      using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'revision_id', r.id,
        'revision_number', r.revision_number,
        'change_kind', r.change_kind,
        'amount_cents', r.amount_cents,
        'currency', r.currency,
        'timeline', r.timeline,
        'cover_letter', r.cover_letter,
        'milestones', r.milestones,
        'created_at', r.created_at
      )
      order by r.revision_number
    ),
    '[]'::jsonb
  )
  into v_items
  from private.bid_revisions r
  where r.bid_id = v_bid.id;

  return jsonb_build_object(
    'bid_id', v_bid.id,
    'project_id', v_bid.project_id,
    'current_status', v_bid.status,
    'count', jsonb_array_length(v_items),
    'revisions', v_items
  );
end;
$function$;

revoke all on function public.faithbid_bidding_get_bid_revisions_v1(uuid)
  from public, anon;

grant execute on function public.faithbid_bidding_get_bid_revisions_v1(uuid)
  to authenticated;


-- ============================================================================
-- 10. LEGACY RPC COMPATIBILITY WRAPPERS
--
-- The hidden existing App.jsx still calls the old RPC names. Replacing their
-- bodies here means old and new frontends share the same atomic command layer
-- without changing App.jsx.
--
-- NOTE:
--   One stale MyBidsScreen path performs a direct table UPDATE rather than
--   calling marketplace_service_mutate_bid. This package deliberately does NOT
--   reopen authenticated direct UPDATE on public.bids; that stale hidden path
--   remains legacy-only and is not carried into the new frontend.
-- ============================================================================

create or replace function public.marketplace_service_submit_bid(
  p_project_id uuid,
  p_amount numeric,
  p_timeline text,
  p_cover_letter text default '',
  p_milestones jsonb default '[]'::jsonb
)
returns public.bids
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_result jsonb;
  v_bid_id uuid;
  v_bid public.bids%rowtype;
begin
  if p_amount is null
     or p_amount <= 0
     or p_amount > 10000000
     or p_amount is distinct from round(p_amount, 2) then
    raise exception
      'Bid amount must be positive, no more than 10000000, and use at most two decimal places.'
      using errcode = '22023';
  end if;

  v_result := public.faithbid_bidding_submit_bid_v1(
    p_project_id,
    round(p_amount * 100)::bigint,
    p_timeline,
    coalesce(p_cover_letter, ''),
    coalesce(p_milestones, '[]'::jsonb),
    'usd'
  );

  v_bid_id := nullif(v_result -> 'bid' ->> 'id', '')::uuid;

  select *
    into v_bid
  from public.bids
  where id = v_bid_id;

  if not found then
    raise exception 'Canonical proposal submit did not return a persisted bid'
      using errcode = 'P0002';
  end if;

  return v_bid;
end;
$function$;

revoke all on function public.marketplace_service_submit_bid(
  uuid,numeric,text,text,jsonb
) from public, anon;

grant execute on function public.marketplace_service_submit_bid(
  uuid,numeric,text,text,jsonb
) to authenticated;


create or replace function public.marketplace_service_mutate_bid(
  p_bid_id uuid,
  p_action text,
  p_amount numeric default null,
  p_cover_letter text default null
)
returns public.bids
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_action text := lower(btrim(coalesce(p_action, '')));
  v_existing public.bids%rowtype;
  v_result jsonb;
  v_bid public.bids%rowtype;
begin
  select *
    into v_existing
  from public.bids
  where id = p_bid_id;

  if not found then
    raise exception 'Bid not found.'
      using errcode = 'P0002';
  end if;

  case v_action
    when 'edit' then
      if p_amount is null
         or p_amount <= 0
         or p_amount > 10000000
         or p_amount is distinct from round(p_amount, 2) then
        raise exception
          'Bid amount must be positive, no more than 10000000, and use at most two decimal places.'
          using errcode = '22023';
      end if;

      v_result := public.faithbid_bidding_update_bid_v1(
        p_bid_id,
        round(p_amount * 100)::bigint,
        v_existing.timeline,
        coalesce(p_cover_letter, ''),
        coalesce(v_existing.milestones, '[]'::jsonb),
        'usd'
      );

    when 'withdraw' then
      v_result := public.faithbid_bidding_withdraw_bid_v1(p_bid_id);

    when 'review' then
      v_result := public.faithbid_bidding_review_bid_v1(p_bid_id);

    when 'decline' then
      v_result := public.faithbid_bidding_decline_bid_v1(p_bid_id);

    else
      raise exception 'Unsupported bid action.'
        using errcode = '22023';
  end case;

  select *
    into v_bid
  from public.bids
  where id = p_bid_id;

  if not found then
    raise exception 'Canonical proposal mutation did not return a persisted bid'
      using errcode = 'P0002';
  end if;

  return v_bid;
end;
$function$;

revoke all on function public.marketplace_service_mutate_bid(
  uuid,text,numeric,text
) from public, anon;

grant execute on function public.marketplace_service_mutate_bid(
  uuid,text,numeric,text
) to authenticated;


commit;

-- ============================================================================
-- END MIGRATION 005
-- ============================================================================
