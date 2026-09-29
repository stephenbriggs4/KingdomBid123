
-- Correction: the INSERT branch used coalesce(new.account_status, 'active'),
-- which only replaces NULL and lets a client set account_status to any
-- arbitrary string (e.g. 'privileged'). Force it unconditionally instead,
-- matching the treatment of every other trust field.
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
