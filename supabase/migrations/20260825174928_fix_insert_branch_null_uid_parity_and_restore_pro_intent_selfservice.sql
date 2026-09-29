
-- ============================================================================
-- Corrective migration, narrowly scoped per audit checkpoint.
--
-- 1. kb_vendor_protected_fields_guard / kb_profile_protected_fields_guard:
--    add the null-uid passthrough to the INSERT branch, matching the
--    passthrough the UPDATE branch already had. Root cause: the trusted
--    waitlist-conversion service-role INSERT path (auth.uid()=null,
--    kb_is_platform_admin()=false under a service-role JWT) was being
--    treated as a hostile self-service insert and having its trust fields
--    neutralized. This is a parity fix only -- no new authorization
--    mechanism, no GUC, no session flag. Proven safe against anon/public
--    write paths: profiles has no anon INSERT grant; vendors has a legacy
--    anon INSERT table grant but zero anon-scoped RLS policy for INSERT,
--    so RLS denies it regardless of trigger behavior; no anon-callable
--    SECURITY DEFINER function inserts into either table.
--
-- 2. kb_profile_protected_fields_guard UPDATE branch: remove
--    vendor_pro_intent, vendor_pro_intent_at, vendor_pro_billing from the
--    protected-field comparison. These are self-submitted pre-launch
--    interest/preference fields (Pricing screen "mark intent so admin can
--    see who wants Pro"), not platform trust or entitlement -- they never
--    grant vendor_tier and Stripe is not wired. vendor_tier remains
--    protected and untouched.
--
-- No change to onboarding_complete: confirmed live, it was never in the
-- UPDATE protected-field list. Prior report claiming otherwise was a
-- reporting error, not a live database state; no-op avoided.
--
-- No change to: role, church_verified, founding_vendor, account_status,
-- access_status, vendor_tier protection in profiles; verified,
-- verification_status, founding_vendor, suspended, tier, and all other
-- vendor trust fields; project_vendor_links policies.
-- ============================================================================

create or replace function public.kb_vendor_protected_fields_guard()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
begin
  if tg_op = 'INSERT' then
    if v_uid is null then
      return new;
    end if;

    v_is_admin := public.kb_is_platform_admin();
    if v_is_admin then
      return new;
    end if;

    -- Non-admin, non-null-uid self-service insert: force every
    -- trust/verification field to a safe baseline, no matter what the
    -- client sent.
    new.verified := false;
    new.verification_status := null;
    new.verified_at := null;
    new.founding_vendor := false;
    new.suspended := false;
    new.tier := coalesce(new.tier, 'Basic');
    new.rating := null;
    new.reviews_count := 0;
    new.projects_count := 0;
    new.elder_endorsed := false;
    new.elder_endorsement_status := null;
    new.elder_endorsement := null;
    new.completed_project_count := 0;
    new.reference_count := 0;
    new.response_speed_label := null;
    return new;
  end if;

  -- UPDATE path (unchanged from before this migration).
  if v_uid is null then
    return new;
  end if;

  v_is_admin := public.kb_is_platform_admin();
  if v_is_admin then
    return new;
  end if;

  if v_uid = old.user_id then
    if new.user_id is distinct from old.user_id
       or new.verified is distinct from old.verified
       or new.verification_status is distinct from old.verification_status
       or new.verified_at is distinct from old.verified_at
       or new.founding_vendor is distinct from old.founding_vendor
       or new.suspended is distinct from old.suspended
       or new.tier is distinct from old.tier
       or new.rating is distinct from old.rating
       or new.reviews_count is distinct from old.reviews_count
       or new.projects_count is distinct from old.projects_count
       or new.elder_endorsed is distinct from old.elder_endorsed
       or new.elder_endorsement_status is distinct from old.elder_endorsement_status
       or new.elder_endorsement is distinct from old.elder_endorsement
       or new.completed_project_count is distinct from old.completed_project_count
       or new.reference_count is distinct from old.reference_count
       or new.response_speed_label is distinct from old.response_speed_label then
      raise exception using errcode='42501', message='Vendor trust and verification fields are platform-managed.';
    end if;
  end if;

  return new;
end;
$function$;


create or replace function public.kb_profile_protected_fields_guard()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
begin
  if tg_op = 'INSERT' then
    if v_uid is null then
      return new;
    end if;

    v_is_admin := public.kb_is_platform_admin();
    if v_is_admin then
      return new;
    end if;

    -- role is allowed to be chosen at signup; everything else is
    -- platform-managed regardless of what the client sends.
    new.church_verified := false;
    new.founding_vendor := false;
    new.onboarding_complete := false;
    new.account_status := 'active';
    new.access_status := null;
    new.vendor_pro_intent := false;
    new.vendor_pro_intent_at := null;
    new.vendor_pro_billing := null;
    new.vendor_tier := null;
    return new;
  end if;

  -- UPDATE path.
  if v_uid is null then
    return new;
  end if;

  v_is_admin := public.kb_is_platform_admin();
  if v_is_admin then
    return new;
  end if;

  if v_uid = old.id then
    if new.role is distinct from old.role
       or new.church_verified is distinct from old.church_verified
       or new.founding_vendor is distinct from old.founding_vendor
       or new.account_status is distinct from old.account_status
       or new.access_status is distinct from old.access_status
       or new.vendor_tier is distinct from old.vendor_tier then
      raise exception using errcode='42501', message='Profile trust, role, and billing fields are platform-managed.';
    end if;
  end if;

  return new;
end;
$function$;
