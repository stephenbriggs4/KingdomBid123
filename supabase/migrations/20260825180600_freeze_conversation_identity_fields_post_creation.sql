
-- ============================================================================
-- F1 fix: participant substitution -> unauthorized third-party disclosure.
--
-- kb_conversations_update_participants allows either participant to UPDATE
-- any column, including church_id/vendor_id/project_id, as long as their own
-- side of the row still satisfies the identity check. This lets a
-- participant substitute the OTHER party's id with an arbitrary valid
-- auth.users UUID, silently authorizing that third party (via
-- private.is_convo_participant, which re-reads live conversations state) to
-- SELECT the conversation, its messages, and chat-files storage objects.
--
-- Fix: freeze church_id/vendor_id/project_id after creation for ordinary
-- authenticated non-admin participants. INSERT is untouched (all three
-- fields remain freely settable at creation, required for pre-hire
-- conversations and confirm_hire's canonical Deal Room creation).
-- Null-uid (trusted/service context) and platform-admin both pass through
-- unchanged, matching the existing kb_vendor_protected_fields_guard /
-- kb_profile_protected_fields_guard pattern already live in this schema.
--
-- project_id is nullable (pre-hire conversations); IS DISTINCT FROM is used
-- throughout so NULL -> NULL is allowed and NULL -> non-null / non-null ->
-- NULL / value -> different value are all blocked identically.
--
-- No RLS change. No new table. No frontend change. No GUC. No new RPC.
-- ============================================================================

create or replace function public.kb_conversations_identity_guard()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
begin
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

  return new;
end;
$function$;

create trigger kb_conversations_identity_guard_tg
  before update on public.conversations
  for each row execute function public.kb_conversations_identity_guard();
