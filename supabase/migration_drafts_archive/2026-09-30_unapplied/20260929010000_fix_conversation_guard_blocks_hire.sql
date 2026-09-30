-- Fixes a live bug found while testing R-46 end-to-end: hiring a vendor was
-- completely broken. faithbid_bidding_hire_core_v1 (SECURITY DEFINER, owned by
-- postgres) legitimately syncs conversations.budget when a bid is hired, but
-- kb_conversations_identity_guard only exempted platform admins and a null
-- auth.uid(), not trusted internal writers. auth.uid() still resolves to the
-- calling church's JWT even inside a definer function, so every real hire by a
-- non-admin church raised "Offer terms are platform-managed." and aborted.
-- Fix: also exempt writes where current_user is not the client role (authenticated
-- role) or the anon role — i.e. writes coming from a SECURITY DEFINER function
-- rather than a direct PostgREST request. A direct client PATCH to conversations
-- is still blocked exactly as before.
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
