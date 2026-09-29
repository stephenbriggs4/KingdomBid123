-- ============================================================================
-- FaithBid Bidding v2
-- Migration 003: Read-Only Query Facade
-- Project: knkwaphosqronbhrvlsu
-- Status: DRAFT / AUDITED / NOT APPLIED
-- Generated: 2026-09-22
--
-- DEPENDENCIES
--   Migration 001: bid lifecycle timestamp columns
--   Migration 002: canonical vendor-context helper
--
-- PURPOSE
--   Give the new frontend stable read DTOs for:
--     - church proposal review
--     - vendor proposal station
--     - vendor invitation queue
--
-- IMPORTANT
--   This file has NOT been applied.
--   It contains no business-state mutation.
--   It does not modify App.jsx.
-- ============================================================================

begin;

set local lock_timeout = '10s';
set local statement_timeout = '60s';


-- ============================================================================
-- 1. CHURCH/ADMIN: PROJECT PROPOSALS
-- No algorithmic "winner" or ranking score is returned.
-- ============================================================================

create or replace function public.faithbid_bidding_get_project_bids_v1(
  p_project_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_project public.projects%rowtype;
  v_is_admin boolean := false;
  v_counts jsonb := '{}'::jsonb;
  v_proposals jsonb := '[]'::jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if p_project_id is null then
    raise exception 'project id is required'
      using errcode = '22023';
  end if;

  select *
    into v_project
  from public.projects
  where id = p_project_id;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  v_is_admin := coalesce(public.kb_is_platform_admin(), false);

  if not v_is_admin and v_project.church_id is distinct from v_actor then
    raise exception 'not authorized for this project'
      using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total', count(*),
    'active', count(*) filter (where b.status in ('pending','under_review')),
    'pending', count(*) filter (where b.status = 'pending'),
    'under_review', count(*) filter (where b.status = 'under_review'),
    'withdrawn', count(*) filter (where b.status = 'withdrawn'),
    'declined', count(*) filter (where b.status = 'declined'),
    'hired', count(*) filter (where b.status = 'hired')
  )
  into v_counts
  from public.bids b
  where b.project_id = v_project.id;

  select coalesce(
    jsonb_agg(q.payload order by q.submitted_at desc nulls last, q.bid_id),
    '[]'::jsonb
  )
  into v_proposals
  from (
    select
      b.id as bid_id,
      b.submitted_at,
      jsonb_build_object(
        'bid', jsonb_build_object(
          'id', b.id,
          'project_id', b.project_id,
          'status', b.status,
          'amount_cents',
            case
              when b.amount is null then null
              else round(b.amount * 100)::bigint
            end,
          'currency', 'usd',
          'timeline', b.timeline,
          'cover_letter', coalesce(b.cover_letter, ''),
          'milestones', coalesce(b.milestones, '[]'::jsonb),
          'created_at', b.created_at,
          'submitted_at', b.submitted_at,
          'updated_at', b.updated_at,
          'withdrawn_at', b.withdrawn_at,
          'reviewed_at', b.reviewed_at,
          'declined_at', b.declined_at,
          'hired_at', b.hired_at
        ),
        'vendor', jsonb_build_object(
          'vendor_profile_id', v.id,
          'vendor_user_id', b.vendor_id,
          'name', coalesce(v.name, b.vendor_name),
          'category', coalesce(v.category, b.category),
          'rating', v.rating,
          'reviews_count', coalesce(v.reviews_count, 0),
          'marketplace_approved',
            case
              when v.id is null then false
              else (
                lower(btrim(coalesce(v.verification_status, ''))) = 'approved'
                or (
                  v.verification_status is null
                  and coalesce(v.verified, false)
                )
              )
            end,
          'faith_verified', coalesce(v.verified, false),
          'suspended', coalesce(v.suspended, false)
        ),
        'relationship',
          case
            when l.id is null then null
            else jsonb_build_object(
              'id', l.id,
              'stage', l.stage,
              'source', l.source,
              'invited_at', l.invited_at,
              'bid_received_at', l.bid_received_at,
              'shortlisted_at', l.shortlisted_at,
              'hired_at', l.hired_at,
              'last_activity_at', l.last_activity_at
            )
          end,
        'conversation', jsonb_build_object(
          'conversation_id', c.id
        ),
        'capabilities', jsonb_build_object(
          'can_review',
            lower(btrim(coalesce(v_project.status, ''))) = 'open'
            and b.status = 'pending',
          'can_decline',
            lower(btrim(coalesce(v_project.status, ''))) = 'open'
            and b.status in ('pending','under_review'),
          'can_hire',
            lower(btrim(coalesce(v_project.status, ''))) = 'open'
            and b.status in ('pending','under_review'),
          'can_message', true
        )
      ) as payload
    from public.bids b
    left join public.vendors v
      on v.user_id = b.vendor_id
    left join public.project_vendor_links l
      on l.project_id = b.project_id
     and l.vendor_user_id = b.vendor_id
    left join public.conversations c
      on c.project_id = b.project_id
     and c.church_id = v_project.church_id
     and c.vendor_id = b.vendor_id
    where b.project_id = v_project.id
  ) q;

  return jsonb_build_object(
    'project', jsonb_build_object(
      'id', v_project.id,
      'church_id', v_project.church_id,
      'title', v_project.title,
      'category', v_project.category,
      'status', v_project.status,
      'record_origin', v_project.record_origin,
      'proposal_response_window_ends_at', v_project.proposal_response_window_ends_at,
      'qualified_comparable_proposal_count', v_project.qualified_comparable_proposal_count,
      'liquidity_status', v_project.liquidity_status
    ),
    'counts', coalesce(v_counts, '{}'::jsonb),
    'proposals', coalesce(v_proposals, '[]'::jsonb)
  );
end;
$function$;

revoke all on function public.faithbid_bidding_get_project_bids_v1(uuid)
  from public, anon;
grant execute on function public.faithbid_bidding_get_project_bids_v1(uuid)
  to authenticated;


-- ============================================================================
-- 2. VENDOR: MY PROPOSALS
-- ============================================================================

create or replace function public.faithbid_bidding_get_my_bids_v1()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_vendor_ctx jsonb := '{}'::jsonb;
  v_items jsonb := '[]'::jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  v_vendor_ctx := private.faithbid_bidding_vendor_context_v1(v_actor);

  select coalesce(
    jsonb_agg(q.payload order by q.submitted_at desc nulls last, q.bid_id),
    '[]'::jsonb
  )
  into v_items
  from (
    select
      b.id as bid_id,
      b.submitted_at,
      jsonb_build_object(
        'bid', jsonb_build_object(
          'id', b.id,
          'project_id', b.project_id,
          'status', b.status,
          'amount_cents',
            case
              when b.amount is null then null
              else round(b.amount * 100)::bigint
            end,
          'currency', 'usd',
          'timeline', b.timeline,
          'cover_letter', coalesce(b.cover_letter, ''),
          'milestones', coalesce(b.milestones, '[]'::jsonb),
          'created_at', b.created_at,
          'submitted_at', b.submitted_at,
          'updated_at', b.updated_at,
          'withdrawn_at', b.withdrawn_at,
          'reviewed_at', b.reviewed_at,
          'declined_at', b.declined_at,
          'hired_at', b.hired_at
        ),
        'project', jsonb_build_object(
          'id', p.id,
          'church_id', p.church_id,
          'title', p.title,
          'category', p.category,
          'status', p.status,
          'budget', p.budget,
          'budget_min', p.budget_min,
          'budget_max', p.budget_max,
          'project_city', p.project_city,
          'project_state', p.project_state,
          'proposal_response_window_ends_at', p.proposal_response_window_ends_at
        ),
        'conversation', jsonb_build_object(
          'conversation_id', c.id
        ),
        'capabilities', jsonb_build_object(
          'can_edit',
            b.status = 'pending'
            and lower(btrim(coalesce(p.status, ''))) = 'open'
            and coalesce((v_vendor_ctx ->> 'profile_active')::boolean, false)
            and coalesce((v_vendor_ctx ->> 'marketplace_approved')::boolean, false)
            and not coalesce((v_vendor_ctx ->> 'suspended')::boolean, false),
          'can_withdraw',
            b.status in ('pending','under_review')
            and lower(btrim(coalesce(p.status, ''))) = 'open',
          'can_message', true
        )
      ) as payload
    from public.bids b
    join public.projects p
      on p.id = b.project_id
    left join public.conversations c
      on c.project_id = b.project_id
     and c.church_id = p.church_id
     and c.vendor_id = v_actor
    where b.vendor_id = v_actor
  ) q;

  return jsonb_build_object(
    'vendor', v_vendor_ctx,
    'count', jsonb_array_length(coalesce(v_items, '[]'::jsonb)),
    'proposals', coalesce(v_items, '[]'::jsonb)
  );
end;
$function$;

revoke all on function public.faithbid_bidding_get_my_bids_v1()
  from public, anon;
grant execute on function public.faithbid_bidding_get_my_bids_v1()
  to authenticated;


-- ============================================================================
-- 3. VENDOR: UNIFIED INVITATION QUEUE
--
-- This intentionally merges both legacy invitation representations:
--   vendor_invites
--   project_vendor_links(stage='invited')
--
-- The live system currently has 4 invited project_vendor_links and
-- 0 vendor_invites, so a vendor_invites-only query would incorrectly
-- show an empty invitation station.
-- ============================================================================

create or replace function public.faithbid_bidding_get_my_invites_v1()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_vendor_ctx jsonb := '{}'::jsonb;
  v_email_confirmed boolean := false;
  v_bidding_enabled boolean := false;
  v_items jsonb := '[]'::jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  v_vendor_ctx := private.faithbid_bidding_vendor_context_v1(v_actor);

  select exists (
    select 1
    from auth.users u
    where u.id = v_actor
      and u.email_confirmed_at is not null
  )
  into v_email_confirmed;

  select exists (
    select 1
    from public.platform_settings s
    where s.key = 'bidding_enabled'
      and lower(btrim(coalesce(s.value, ''))) in ('true','1','yes','on')
  )
  into v_bidding_enabled;

  with candidate_projects as (
    select i.project_id
    from public.vendor_invites i
    where i.vendor_user_id = v_actor

    union

    select l.project_id
    from public.project_vendor_links l
    where l.vendor_user_id = v_actor
      and l.stage = 'invited'
  ),
  resolved as (
    select
      cp.project_id,
      p.church_id,
      p.title,
      p.category,
      p.status as project_status,
      p.budget,
      p.budget_min,
      p.budget_max,
      p.project_city,
      p.project_state,
      p.proposal_response_window_ends_at,

      vi.id as invite_id,
      vi.status as invite_status,
      vi.invited_at as invite_invited_at,
      vi.responded_at,
      vi.declined_at,
      vi.decline_reason,
      vi.bid_id as invite_bid_id,
      vi.no_response_after_at as invite_no_response_after_at,
      vi.response_class,
      vi.match_snapshot_id,

      l.id as project_vendor_link_id,
      l.stage as link_stage,
      l.source as link_source,
      l.invited_at as link_invited_at,

      b.id as bid_id,
      b.status as bid_status,

      c.id as conversation_id,

      coalesce(
        vi.no_response_after_at,
        public.kb_add_business_days(l.invited_at, 3)
      ) as effective_no_response_after_at
    from candidate_projects cp
    join public.projects p
      on p.id = cp.project_id

    left join lateral (
      select i.*
      from public.vendor_invites i
      where i.project_id = cp.project_id
        and i.vendor_user_id = v_actor
      order by i.invited_at desc, i.created_at desc, i.id desc
      limit 1
    ) vi on true

    left join public.project_vendor_links l
      on l.project_id = cp.project_id
     and l.vendor_user_id = v_actor

    left join public.bids b
      on b.project_id = cp.project_id
     and b.vendor_id = v_actor

    left join public.conversations c
      on c.project_id = cp.project_id
     and c.church_id = p.church_id
     and c.vendor_id = v_actor
  ),
  shaped as (
    select
      r.*,
      case
        when r.bid_id is not null then 'bid_received'
        when r.invite_status is not null and r.invite_status <> 'invited'
          then r.invite_status
        when r.link_stage is not null and r.link_stage <> 'invited'
          then r.link_stage
        when r.effective_no_response_after_at is not null
             and r.effective_no_response_after_at <= now()
          then 'no_response'
        else 'invited'
      end as effective_status,

      case
        when r.invite_id is not null and r.project_vendor_link_id is not null
          then 'both'
        when r.invite_id is not null
          then 'vendor_invite'
        else 'project_vendor_link'
      end as source_kind,

      (
        lower(btrim(coalesce(r.project_status, ''))) = 'open'
        and v_email_confirmed
        and coalesce((v_vendor_ctx ->> 'profile_active')::boolean, false)
        and coalesce((v_vendor_ctx ->> 'has_vendor_profile')::boolean, false)
        and coalesce((v_vendor_ctx ->> 'marketplace_approved')::boolean, false)
        and not coalesce((v_vendor_ctx ->> 'suspended')::boolean, false)
        and r.bid_id is null
        and (
          v_bidding_enabled
          or r.invite_status in ('invited','no_response')
          or r.link_stage = 'invited'
          or coalesce(public.kb_is_platform_admin(), false)
        )
      ) as can_bid
    from resolved r
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'invite_id', s.invite_id,
        'project_vendor_link_id', s.project_vendor_link_id,
        'source_kind', s.source_kind,
        'stored_invite_status', s.invite_status,
        'relationship_stage', s.link_stage,
        'effective_status', s.effective_status,
        'invited_at', coalesce(s.invite_invited_at, s.link_invited_at),
        'no_response_after_at', s.effective_no_response_after_at,
        'responded_at', s.responded_at,
        'declined_at', s.declined_at,
        'decline_reason', s.decline_reason,
        'response_class', s.response_class,
        'match_snapshot_id', s.match_snapshot_id,
        'bid_id', s.bid_id,
        'bid_status', s.bid_status,
        'conversation_id', s.conversation_id,
        'can_bid', s.can_bid,
        'project', jsonb_build_object(
          'id', s.project_id,
          'church_id', s.church_id,
          'title', s.title,
          'category', s.category,
          'status', s.project_status,
          'budget', s.budget,
          'budget_min', s.budget_min,
          'budget_max', s.budget_max,
          'project_city', s.project_city,
          'project_state', s.project_state,
          'proposal_response_window_ends_at', s.proposal_response_window_ends_at
        )
      )
      order by coalesce(s.invite_invited_at, s.link_invited_at) desc nulls last,
               s.project_id
    ),
    '[]'::jsonb
  )
  into v_items
  from shaped s;

  return jsonb_build_object(
    'vendor', v_vendor_ctx,
    'count', jsonb_array_length(coalesce(v_items, '[]'::jsonb)),
    'invitations', coalesce(v_items, '[]'::jsonb)
  );
end;
$function$;

revoke all on function public.faithbid_bidding_get_my_invites_v1()
  from public, anon;
grant execute on function public.faithbid_bidding_get_my_invites_v1()
  to authenticated;


commit;

-- ============================================================================
-- END MIGRATION 003
-- ============================================================================
