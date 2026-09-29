-- ============================================================================
-- FaithBid Bidding v2
-- Migration 002: Vendor + Capability Core
-- Project: knkwaphosqronbhrvlsu
-- Status: DRAFT / AUDITED / NOT APPLIED
-- Generated: 2026-09-22
--
-- DEPENDENCY
--   Designed to follow Migration 001.
--
-- PURPOSE
--   Give the redesigned frontend one server-owned definition of:
--     - Marketplace Approved
--     - Faith Verified
--     - pricing tier
--     - project visibility
--     - project-specific bid permission
--     - bid edit/withdraw permissions
--     - church review/hire permissions
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
-- 1. INTERNAL VENDOR CONTEXT
-- Marketplace admission and Faith Verification are deliberately separate.
-- Pricing tier is sourced from profiles.vendor_tier, not legacy vendors.tier.
-- ============================================================================

create or replace function private.faithbid_bidding_vendor_context_v1(
  p_vendor_user_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_profile public.profiles%rowtype;
  v_vendor public.vendors%rowtype;
  v_has_profile boolean := false;
  v_has_vendor boolean := false;
  v_profile_active boolean := false;
  v_marketplace_approved boolean := false;
  v_faith_verified boolean := false;
  v_pricing_tier text := 'free';
begin
  if p_vendor_user_id is null then
    return jsonb_build_object(
      'has_profile', false,
      'has_vendor_profile', false,
      'vendor_user_id', null,
      'vendor_profile_id', null,
      'role', null,
      'profile_active', false,
      'onboarding_complete', false,
      'private_marketplace_access', false,
      'marketplace_approved', false,
      'faith_verified', false,
      'suspended', false,
      'pricing_tier', 'free',
      'vendor_name', null,
      'category', null,
      'rating', null,
      'reviews_count', 0
    );
  end if;

  select *
    into v_profile
  from public.profiles
  where id = p_vendor_user_id;

  v_has_profile := found;

  select *
    into v_vendor
  from public.vendors
  where user_id = p_vendor_user_id;

  v_has_vendor := found;

  if v_has_profile then
    v_profile_active :=
      lower(btrim(coalesce(v_profile.account_status, 'active'))) = 'active'
      and lower(btrim(coalesce(v_profile.access_status, 'active'))) = 'active';

    v_pricing_tier :=
      case lower(btrim(coalesce(v_profile.vendor_tier, 'free')))
        when 'pro' then 'pro'
        else 'free'
      end;
  end if;

  if v_has_vendor then
    v_marketplace_approved :=
      lower(btrim(coalesce(v_vendor.verification_status, ''))) = 'approved'
      or (
        v_vendor.verification_status is null
        and coalesce(v_vendor.verified, false)
      );

    -- Canonical current Faith Verification flag.
    v_faith_verified := coalesce(v_vendor.verified, false);
  end if;

  return jsonb_build_object(
    'has_profile', v_has_profile,
    'has_vendor_profile', v_has_vendor,
    'vendor_user_id', p_vendor_user_id,
    'vendor_profile_id', case when v_has_vendor then v_vendor.id else null end,
    'role', case when v_has_profile then lower(btrim(coalesce(v_profile.role, ''))) else null end,
    'profile_active', v_profile_active,
    'onboarding_complete', case when v_has_profile then coalesce(v_profile.onboarding_complete, false) else false end,
    'private_marketplace_access', case when v_has_profile then coalesce(v_profile.private_marketplace_access, false) else false end,
    'marketplace_approved', v_marketplace_approved,
    'faith_verified', v_faith_verified,
    'suspended', case when v_has_vendor then coalesce(v_vendor.suspended, false) else false end,
    'pricing_tier', v_pricing_tier,
    'vendor_name', case when v_has_vendor then v_vendor.name else null end,
    'category', case when v_has_vendor then v_vendor.category else null end,
    'rating', case when v_has_vendor then v_vendor.rating else null end,
    'reviews_count', case when v_has_vendor then coalesce(v_vendor.reviews_count, 0) else 0 end
  );
end;
$function$;

revoke all on function private.faithbid_bidding_vendor_context_v1(uuid)
  from public, anon, authenticated;


-- ============================================================================
-- 2. PROJECT-SPECIFIC CAPABILITY QUERY
-- This is intentionally a query facade, not a mutation path.
-- ============================================================================

create or replace function public.faithbid_bidding_get_project_context_v1(
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
  v_profile public.profiles%rowtype;
  v_project public.projects%rowtype;
  v_vendor_ctx jsonb := '{}'::jsonb;
  v_existing_bid jsonb;
  v_existing_bid_status text := '';
  v_role text := '';
  v_is_admin boolean := false;
  v_email_confirmed boolean := false;
  v_profile_active boolean := false;
  v_has_vendor boolean := false;
  v_marketplace_approved boolean := false;
  v_faith_verified boolean := false;
  v_vendor_suspended boolean := false;
  v_private_marketplace_access boolean := false;
  v_marketplace_public boolean := false;
  v_bidding_enabled boolean := false;
  v_project_linked boolean := false;
  v_project_invited boolean := false;
  v_is_project_owner boolean := false;
  v_is_hired_vendor boolean := false;
  v_can_enter_marketplace boolean := false;
  v_can_view boolean := false;
  v_can_bid boolean := false;
  v_can_edit_bid boolean := false;
  v_can_withdraw_bid boolean := false;
  v_can_review_bids boolean := false;
  v_can_hire_bid boolean := false;
  v_can_message boolean := false;
  v_bid_block_code text := null;
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
    into v_profile
  from public.profiles
  where id = v_actor;

  v_role :=
    case
      when found then lower(btrim(coalesce(v_profile.role, '')))
      else ''
    end;

  v_profile_active :=
    case
      when v_profile.id is null then false
      else
        lower(btrim(coalesce(v_profile.account_status, 'active'))) = 'active'
        and lower(btrim(coalesce(v_profile.access_status, 'active'))) = 'active'
    end;

  v_private_marketplace_access :=
    case
      when v_profile.id is null then false
      else coalesce(v_profile.private_marketplace_access, false)
    end;

  v_vendor_ctx := private.faithbid_bidding_vendor_context_v1(v_actor);
  v_has_vendor := coalesce((v_vendor_ctx ->> 'has_vendor_profile')::boolean, false);
  v_marketplace_approved := coalesce((v_vendor_ctx ->> 'marketplace_approved')::boolean, false);
  v_faith_verified := coalesce((v_vendor_ctx ->> 'faith_verified')::boolean, false);
  v_vendor_suspended := coalesce((v_vendor_ctx ->> 'suspended')::boolean, false);

  v_is_admin := coalesce(public.kb_is_platform_admin(), false);

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
    where s.key = 'marketplace_public'
      and lower(btrim(coalesce(s.value, ''))) in ('true','1','yes','on')
  )
  into v_marketplace_public;

  select exists (
    select 1
    from public.platform_settings s
    where s.key = 'bidding_enabled'
      and lower(btrim(coalesce(s.value, ''))) in ('true','1','yes','on')
  )
  into v_bidding_enabled;

  select *
    into v_project
  from public.projects
  where id = p_project_id;

  if not found then
    return jsonb_build_object(
      'project', null,
      'viewer', jsonb_build_object(
        'user_id', v_actor,
        'role', nullif(v_role, ''),
        'vendor', v_vendor_ctx
      ),
      'access', jsonb_build_object(
        'marketplace_public', v_marketplace_public,
        'bidding_enabled', v_bidding_enabled,
        'private_marketplace_access', v_private_marketplace_access,
        'project_linked', false,
        'project_invited', false
      ),
      'bid', null,
      'capabilities', jsonb_build_object(
        'can_enter_marketplace', (
          v_is_admin
          or v_marketplace_public
          or v_private_marketplace_access
        ),
        'can_view_project', false,
        'can_bid', false,
        'can_edit_bid', false,
        'can_withdraw_bid', false,
        'can_review_bids', false,
        'can_hire_bid', false,
        'can_message', false
      ),
      'reasons', jsonb_build_object(
        'bid_block_code', 'PROJECT_NOT_FOUND'
      )
    );
  end if;

  v_is_project_owner := v_project.church_id = v_actor;
  v_is_hired_vendor := v_project.hired_vendor_id = v_actor;

  select exists (
    select 1
    from public.project_vendor_links l
    where l.project_id = v_project.id
      and l.vendor_user_id = v_actor
      and l.stage <> 'archived'
  )
  into v_project_linked;

  select (
    exists (
      select 1
      from public.project_vendor_links l
      where l.project_id = v_project.id
        and l.vendor_user_id = v_actor
        and l.stage = 'invited'
    )
    or exists (
      select 1
      from public.vendor_invites i
      where i.project_id = v_project.id
        and i.vendor_user_id = v_actor
        and i.status in ('invited','no_response')
    )
  )
  into v_project_invited;

  select to_jsonb(b)
    into v_existing_bid
  from public.bids b
  where b.project_id = v_project.id
    and b.vendor_id = v_actor
  limit 1;

  v_existing_bid_status :=
    lower(btrim(coalesce(v_existing_bid ->> 'status', '')));

  v_can_enter_marketplace :=
       v_is_admin
    or v_marketplace_public
    or v_private_marketplace_access
    or v_is_project_owner
    or v_is_hired_vendor
    or v_project_linked
    or v_project_invited
    or v_existing_bid is not null;

  -- Security-definer query functions must perform their own visibility check.
  -- Private marketplace shell access alone does NOT reveal a specific project.
  v_can_view :=
       v_is_admin
    or v_is_project_owner
    or v_is_hired_vendor
    or v_existing_bid is not null
    or (
      lower(btrim(coalesce(v_project.status, ''))) = 'open'
      and (
        v_marketplace_public
        or v_project_linked
        or v_project_invited
      )
    );

  v_can_bid :=
       v_can_view
    and v_role = 'vendor'
    and v_has_vendor
    and v_profile_active
    and v_email_confirmed
    and v_marketplace_approved
    and not v_vendor_suspended
    and lower(btrim(coalesce(v_project.status, ''))) = 'open'
    and v_existing_bid is null
    and (
      v_bidding_enabled
      or v_project_invited
      or v_is_admin
    );

  v_can_edit_bid :=
       v_existing_bid is not null
    and v_existing_bid_status = 'pending'
    and lower(btrim(coalesce(v_project.status, ''))) = 'open'
    and v_profile_active
    and v_marketplace_approved
    and not v_vendor_suspended;

  v_can_withdraw_bid :=
       v_existing_bid is not null
    and v_existing_bid_status in ('pending','under_review')
    and lower(btrim(coalesce(v_project.status, ''))) = 'open';

  v_can_review_bids :=
    (v_is_admin or v_is_project_owner)
    and lower(btrim(coalesce(v_project.status, ''))) = 'open';

  v_can_hire_bid := v_can_review_bids;

  v_can_message :=
       v_is_admin
    or v_is_project_owner
    or v_is_hired_vendor
    or v_existing_bid is not null
    or v_project_linked
    or v_project_invited
    or (
      v_role = 'vendor'
      and v_can_view
      and lower(btrim(coalesce(v_project.status, ''))) = 'open'
      and v_profile_active
      and v_email_confirmed
      and v_marketplace_approved
      and not v_vendor_suspended
    );

  if not v_can_bid then
    v_bid_block_code :=
      case
        when not v_can_view then 'PROJECT_NOT_VISIBLE'
        when v_role <> 'vendor' or not v_has_vendor then 'NOT_VENDOR'
        when not v_profile_active then 'ACCOUNT_INACTIVE'
        when not v_email_confirmed then 'EMAIL_NOT_CONFIRMED'
        when v_vendor_suspended then 'VENDOR_SUSPENDED'
        when not v_marketplace_approved then 'VENDOR_NOT_MARKETPLACE_APPROVED'
        when lower(btrim(coalesce(v_project.status, ''))) <> 'open' then 'PROJECT_NOT_OPEN'
        when v_existing_bid is not null then 'ALREADY_BID'
        when not v_bidding_enabled and not v_project_invited and not v_is_admin
          then case
            when v_marketplace_public then 'BIDDING_DISABLED'
            else 'PROJECT_INVITE_REQUIRED'
          end
        else 'BID_NOT_AVAILABLE'
      end;
  end if;

  return jsonb_build_object(
    'project',
      case
        when v_can_view then jsonb_build_object(
          'id', v_project.id,
          'church_id', v_project.church_id,
          'title', v_project.title,
          'category', v_project.category,
          'status', v_project.status,
          'record_origin', v_project.record_origin,
          'budget', v_project.budget,
          'budget_min', v_project.budget_min,
          'budget_max', v_project.budget_max,
          'project_city', v_project.project_city,
          'project_state', v_project.project_state,
          'posted_at', v_project.posted_at,
          'hired_vendor_id', v_project.hired_vendor_id,
          'hired_at', v_project.hired_at,
          'proposal_response_window_ends_at', v_project.proposal_response_window_ends_at,
          'qualified_comparable_proposal_count', v_project.qualified_comparable_proposal_count,
          'liquidity_status', v_project.liquidity_status
        )
        else null
      end,
    'viewer', jsonb_build_object(
      'user_id', v_actor,
      'role', nullif(v_role, ''),
      'is_admin', v_is_admin,
      'profile_active', v_profile_active,
      'email_confirmed', v_email_confirmed,
      'vendor', v_vendor_ctx
    ),
    'access', jsonb_build_object(
      'marketplace_public', v_marketplace_public,
      'bidding_enabled', v_bidding_enabled,
      'private_marketplace_access', v_private_marketplace_access,
      'project_linked', v_project_linked,
      'project_invited', v_project_invited,
      'is_project_owner', v_is_project_owner,
      'is_hired_vendor', v_is_hired_vendor
    ),
    'bid',
      case
        when v_existing_bid is null then null
        else jsonb_build_object(
          'id', nullif(v_existing_bid ->> 'id', '')::uuid,
          'status', v_existing_bid_status,
          'submitted_at', v_existing_bid ->> 'submitted_at'
        )
      end,
    'capabilities', jsonb_build_object(
      'can_enter_marketplace', v_can_enter_marketplace,
      'can_view_project', v_can_view,
      'can_bid', v_can_bid,
      'can_edit_bid', v_can_edit_bid,
      'can_withdraw_bid', v_can_withdraw_bid,
      'can_review_bids', v_can_review_bids,
      'can_hire_bid', v_can_hire_bid,
      'can_message', v_can_message
    ),
    'reasons', jsonb_build_object(
      'bid_block_code', v_bid_block_code
    )
  );
end;
$function$;

revoke all on function public.faithbid_bidding_get_project_context_v1(uuid)
  from public, anon;
grant execute on function public.faithbid_bidding_get_project_context_v1(uuid)
  to authenticated;


commit;

-- ============================================================================
-- END MIGRATION 002
-- ============================================================================
