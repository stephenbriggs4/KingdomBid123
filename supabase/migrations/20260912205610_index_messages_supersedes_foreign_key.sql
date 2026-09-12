begin;

do $preflight$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.messages'::regclass
      and conname = 'messages_supersedes_message_id_fkey'
      and contype = 'f'
  ) then
    raise exception 'C4 expected messages_supersedes_message_id_fkey to exist';
  end if;
end
$preflight$;

create index messages_supersedes_message_id_idx
  on public.messages (supersedes_message_id);

do $verify$
begin
  if not exists (
    select 1
    from pg_index i
    join pg_class idx on idx.oid = i.indexrelid
    join pg_attribute a
      on a.attrelid = i.indrelid
     and a.attnum = i.indkey[0]
    where i.indrelid = 'public.messages'::regclass
      and idx.relname = 'messages_supersedes_message_id_idx'
      and a.attname = 'supersedes_message_id'
      and i.indisvalid
      and i.indisready
  ) then
    raise exception 'C4 messages supersedes index verification failed';
  end if;
end
$verify$;

commit;
