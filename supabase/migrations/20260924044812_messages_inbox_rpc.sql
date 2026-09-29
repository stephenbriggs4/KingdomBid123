create index if not exists messages_unread_idx on public.messages (conversation_id) where read_at is null;

create or replace function public.faithbid_messages_inbox_v1(p_limit integer default 100)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_agg(to_jsonb(r) order by r.last_message_at desc nulls last), '[]'::jsonb)
  from (
    select
      c.id,
      c.project_id,
      c.project_title,
      c.church_id,
      c.vendor_id,
      c.church_name,
      c.vendor_name,
      c.status,
      coalesce(c.archived, false) as archived,
      c.last_message,
      c.last_message_at,
      (
        select count(*) from public.messages m
        where m.conversation_id = c.id
          and m.read_at is null
          and m.sender_id is distinct from auth.uid()
      ) as unread_count,
      p.status as project_status
    from public.conversations c
    left join public.projects p on p.id = c.project_id
    where c.church_id = auth.uid() or c.vendor_id = auth.uid()
    order by c.last_message_at desc nulls last
    limit greatest(1, least(coalesce(p_limit, 100), 200))
  ) r
$$;

revoke all on function public.faithbid_messages_inbox_v1(integer) from public;
grant execute on function public.faithbid_messages_inbox_v1(integer) to authenticated;
