-- The church-invite message was being written several times when the invite action fired repeatedly.
-- Keep the earliest copy in each conversation, then make the invite message idempotent at the database level.
delete from public.messages m
using (
  select id,
         row_number() over (partition by conversation_id, sender_id, coalesce(text, body) order by created_at, id) rn
  from public.messages
  where coalesce(text, body) like 'Hi — I''d like to invite you to bid on this project.%'
) d
where m.id = d.id and d.rn > 1;

create unique index if not exists messages_invite_once_uidx
  on public.messages (conversation_id, sender_id)
  where text like 'Hi — I''d like to invite you to bid on this project.%';
