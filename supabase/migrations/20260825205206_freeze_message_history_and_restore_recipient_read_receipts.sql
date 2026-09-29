
create or replace function public.kb_messages_update_guard()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_old public.messages%rowtype;
  v_new public.messages%rowtype;
begin
  if v_uid is null then
    return new;
  end if;

  if public.kb_is_platform_admin() then
    return new;
  end if;

  if old.sender_id is not distinct from v_uid then
    raise exception using
      errcode = '42501',
      message = 'Senders cannot modify their own sent messages.';
  end if;

  if not exists (
    select 1
    from public.conversations c
    where c.id = old.conversation_id
      and (c.church_id = v_uid or c.vendor_id = v_uid)
  ) then
    raise exception using
      errcode = '42501',
      message = 'Only a conversation participant may mark a message as read.';
  end if;

  v_old := old;
  v_new := new;
  v_new.read_at := v_old.read_at;

  if v_new is distinct from v_old then
    raise exception using
      errcode = '42501',
      message = 'Sent message content and identity are immutable.';
  end if;

  if old.read_at is not null or new.read_at is null then
    raise exception using
      errcode = '42501',
      message = 'read_at may only transition once from null to a server timestamp.';
  end if;

  new.read_at := statement_timestamp();
  return new;
end;
$function$;

drop trigger if exists kb_messages_update_guard_tg on public.messages;

create trigger kb_messages_update_guard_tg
before update on public.messages
for each row execute function public.kb_messages_update_guard();

drop policy if exists kb_messages_update_author_or_admin on public.messages;
drop policy if exists kb_messages_update_recipient_read_or_admin on public.messages;

create policy kb_messages_update_recipient_read_or_admin
on public.messages
for update
to authenticated
using (
  (select public.kb_is_platform_admin())
  or (
    read_at is null
    and sender_id is distinct from (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.church_id = (select auth.uid())
          or c.vendor_id = (select auth.uid())
        )
    )
  )
)
with check (
  (select public.kb_is_platform_admin())
  or (
    sender_id is distinct from (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.church_id = (select auth.uid())
          or c.vendor_id = (select auth.uid())
        )
    )
  )
);
