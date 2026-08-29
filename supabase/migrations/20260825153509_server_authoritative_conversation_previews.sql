begin;

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

drop trigger if exists kb_messages_sync_conversation_preview on public.messages;
create trigger kb_messages_sync_conversation_preview
after insert on public.messages
for each row
execute function private.kb_sync_conversation_preview_on_message_insert();

with latest as (
  select distinct on (m.conversation_id)
    m.conversation_id,
    m.created_at,
    coalesce(
      nullif(btrim(m.text), ''),
      case
        when nullif(btrim(m.file_name), '') is not null
          then '📎 ' || btrim(m.file_name)
        when m.message_type = 'call_details'
          and lower(coalesce(m.event_data->>'status', '')) = 'cancelled'
          then '☎ Call cancelled'
        when m.message_type = 'call_details'
          then '☎ Call details shared'
        else 'New message'
      end
    ) as preview
  from public.messages m
  order by m.conversation_id, m.created_at desc, m.id desc
)
update public.conversations c
set last_message = l.preview,
    last_message_at = l.created_at
from latest l
where c.id = l.conversation_id
  and (
    c.last_message is distinct from l.preview
    or c.last_message_at is distinct from l.created_at
  );

commit;
