begin;

alter table public.messages
  alter column text drop not null;

alter table public.messages
  drop constraint if exists kb_messages_content_present_check;

alter table public.messages
  add constraint kb_messages_content_present_check
  check (
    nullif(btrim(text), '') is not null
    or (
      nullif(btrim(file_name), '') is not null
      and (
        nullif(btrim(file_path), '') is not null
        or nullif(btrim(file_url), '') is not null
      )
    )
    or nullif(btrim(body), '') is not null
  );

create or replace function private.kb_normalize_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if nullif(btrim(new.file_name), '') is not null
     or nullif(btrim(new.file_path), '') is not null
     or nullif(btrim(new.file_url), '') is not null then
    if nullif(btrim(new.file_name), '') is null
       or (
         nullif(btrim(new.file_path), '') is null
         and nullif(btrim(new.file_url), '') is null
       ) then
      raise exception 'File messages require a file name and private path or legacy URL.' using errcode = '22023';
    end if;
    new.message_type := 'file';
    new.text := null;
  end if;

  return new;
end;
$function$;

revoke all on function private.kb_normalize_message_insert() from public, anon, authenticated;

drop trigger if exists kb_messages_normalize_insert on public.messages;
create trigger kb_messages_normalize_insert
before insert on public.messages
for each row
execute function private.kb_normalize_message_insert();

create or replace function private.kb_sync_conversation_preview_on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_preview text;
begin
  v_preview := coalesce(
    nullif(btrim(new.text), ''),
    case
      when nullif(btrim(new.file_name), '') is not null
        then '📎 ' || btrim(new.file_name)
      when new.message_type = 'call_details'
        and lower(coalesce(new.event_data->>'status', '')) = 'cancelled'
        then '☎ Call cancelled'
      when new.message_type = 'call_details'
        then '☎ Call details shared'
      when nullif(btrim(new.body), '') is not null
        then btrim(new.body)
      else 'New message'
    end
  );

  update public.conversations
  set last_message = v_preview,
      last_message_at = new.created_at
  where id = new.conversation_id
    and (
      last_message_at is null
      or new.created_at >= last_message_at
    );

  return new;
end;
$function$;

revoke all on function private.kb_sync_conversation_preview_on_message_insert() from public, anon, authenticated;

commit;
