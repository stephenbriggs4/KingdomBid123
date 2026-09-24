-- Users could self-grant private_marketplace_access (the pilot gate) via a plain own-row UPDATE.
-- Lock the gate/billing columns to admins on both INSERT and UPDATE.
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
    if v_uid is null then return new; end if;
    v_is_admin := public.kb_is_platform_admin();
    if v_is_admin then return new; end if;
    new.church_verified := false;
    new.founding_vendor := false;
    new.onboarding_complete := false;
    new.account_status := 'active';
    new.access_status := null;
    new.vendor_pro_intent := false;
    new.vendor_pro_intent_at := null;
    new.vendor_pro_billing := null;
    new.vendor_tier := null;
    new.private_marketplace_access := false;
    new.nda_required := null;
    return new;
  end if;

  if v_uid is null then return new; end if;
  v_is_admin := public.kb_is_platform_admin();
  if v_is_admin then return new; end if;

  if v_uid = old.id then
    if new.role is distinct from old.role
       or new.church_verified is distinct from old.church_verified
       or new.founding_vendor is distinct from old.founding_vendor
       or new.account_status is distinct from old.account_status
       or new.access_status is distinct from old.access_status
       or new.vendor_tier is distinct from old.vendor_tier
       or new.private_marketplace_access is distinct from old.private_marketplace_access
       or new.nda_required is distinct from old.nda_required
       or new.vendor_pro_billing is distinct from old.vendor_pro_billing
       or new.vendor_pro_intent is distinct from old.vendor_pro_intent
       or new.vendor_pro_intent_at is distinct from old.vendor_pro_intent_at then
      raise exception using errcode='42501', message='Profile trust, role, access, and billing fields are platform-managed.';
    end if;
  end if;
  return new;
end;
$function$;

-- Legacy table readable by anon while the marketplace is private; vendor_portfolio_items has the gated policies.
drop policy if exists "Public can view portfolio items" on public.vendor_portfolio;

