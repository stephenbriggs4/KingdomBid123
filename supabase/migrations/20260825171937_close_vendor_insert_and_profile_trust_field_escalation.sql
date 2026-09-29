
-- ============================================================================
-- Fix: vendor self-approval via INSERT, and unguarded profile trust fields.
--
-- Root cause: kb_vendor_protected_fields_guard_tg only fired BEFORE UPDATE.
-- A signed-in user could INSERT their own vendors row with
-- verification_status='approved', founding_vendor=true, verified=true,
-- which marketplace_service_submit_bid() treats as bid-eligible.
-- profiles had no equivalent guard at all on any trust field.
-- ============================================================================

-- 1. Extend the vendor guard to also run BEFORE INSERT, forcing trust fields
--    to safe defaults regardless of what the client supplies. Admins are
--    unaffected (kb_is_platform_admin() short-circuits as before).
create or replace function public.kb_vendor_protected_fields_guard()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
begin
  v_is_admin := public.kb_is_platform_admin();

  if tg_op = 'INSERT' then
    if v_is_admin then
      return new;
    end if;
    -- Non-admin self-service insert: force every trust/verification field
    -- to a safe baseline, no matter what the client sent.
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

  -- UPDATE path (unchanged behavior from before this migration).
  if v_uid is null then
    return new;
  end if;

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

drop trigger if exists kb_vendor_protected_fields_guard_tg on public.vendors;
create trigger kb_vendor_protected_fields_guard_tg
  before insert or update on public.vendors
  for each row execute function public.kb_vendor_protected_fields_guard();


-- 2. New guard on profiles: locks trust/status fields against self-service
--    writes on both INSERT and UPDATE, except `role` which must remain
--    settable at signup (INSERT) but becomes locked afterward (UPDATE),
--    consistent with handoff §4.3 (role escalation is a known invariant
--    to protect once the CHECK constraint is ever relaxed).
create or replace function public.kb_profile_protected_fields_guard()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
begin
  v_is_admin := public.kb_is_platform_admin();

  if tg_op = 'INSERT' then
    if v_is_admin then
      return new;
    end if;
    -- role is allowed to be chosen at signup; everything else is
    -- platform-managed regardless of what the client sends.
    new.church_verified := false;
    new.founding_vendor := false;
    new.onboarding_complete := false;
    new.account_status := coalesce(new.account_status, 'active');
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

  if v_is_admin then
    return new;
  end if;

  if v_uid = old.id then
    if new.role is distinct from old.role
       or new.church_verified is distinct from old.church_verified
       or new.founding_vendor is distinct from old.founding_vendor
       or new.account_status is distinct from old.account_status
       or new.access_status is distinct from old.access_status
       or new.vendor_pro_intent is distinct from old.vendor_pro_intent
       or new.vendor_pro_intent_at is distinct from old.vendor_pro_intent_at
       or new.vendor_pro_billing is distinct from old.vendor_pro_billing
       or new.vendor_tier is distinct from old.vendor_tier then
      raise exception using errcode='42501', message='Profile trust, role, and billing fields are platform-managed.';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists kb_profile_protected_fields_guard_tg on public.profiles;
create trigger kb_profile_protected_fields_guard_tg
  before insert or update on public.profiles
  for each row execute function public.kb_profile_protected_fields_guard();
