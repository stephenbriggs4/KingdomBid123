create or replace function public.kb_conversations_identity_guard()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if v_uid is null then
    return new;
  end if;

  if public.kb_is_platform_admin() then
    return new;
  end if;

  if new.church_id is distinct from old.church_id
     or new.vendor_id is distinct from old.vendor_id
     or new.project_id is distinct from old.project_id then
    raise exception using errcode='42501', message='Conversation identity (church, vendor, project) is immutable after creation.';
  end if;

  if new.offer_amount is distinct from old.offer_amount
     or new.offer_expiry is distinct from old.offer_expiry
     or new.budget is distinct from old.budget then
    raise exception using errcode='42501', message='Offer terms are platform-managed.';
  end if;

  return new;
end;
$function$;
