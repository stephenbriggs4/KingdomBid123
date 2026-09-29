-- Deal Room call details are structured message events. Keeping them on the
-- existing messages table reuses the established conversation-participant RLS
-- boundary and Realtime publication instead of creating a parallel channel.
alter table public.messages
  add column if not exists message_type text not null default 'text',
  add column if not exists event_data jsonb not null default '{}'::jsonb,
  add column if not exists scheduled_for timestamptz,
  add column if not exists supersedes_message_id uuid references public.messages(id) on delete set null;
update public.messages
set message_type = 'file'
where message_type = 'text'
  and (file_path is not null or file_url is not null or file_name is not null);
alter table public.messages
  drop constraint if exists messages_message_type_check,
  add constraint messages_message_type_check
    check (message_type in ('text', 'file', 'call_details')),
  drop constraint if exists messages_call_details_shape_check,
  add constraint messages_call_details_shape_check
    check (
      message_type <> 'call_details'
      or (
        jsonb_typeof(event_data) = 'object'
        and event_data->>'status' in ('shared', 'updated', 'cancelled')
        and length(coalesce(event_data->>'url', '')) between 12 and 2048
        and event_data->>'url' = btrim(event_data->>'url')
        and event_data->>'url' ~ '^https://[^[:space:]/?#]+(?:[/?#][^[:space:]]*)?$'
        and length(coalesce(event_data->>'label', '')) <= 120
        and length(coalesce(event_data->>'note', '')) <= 500
        and length(coalesce(event_data->>'timezone', '')) <= 100
      )
    );
create index if not exists messages_call_details_conversation_created_idx
  on public.messages (conversation_id, created_at desc)
  where message_type = 'call_details';
comment on column public.messages.message_type is
  'Structured message discriminator. call_details rows render as audited Deal Room call cards.';
comment on column public.messages.event_data is
  'Versioned structured event payload. Call URLs are HTTPS-only and are never fetched for previews.';
comment on column public.messages.scheduled_for is
  'Optional canonical UTC instant for a shared call; clients localize it for the viewer.';
comment on column public.messages.supersedes_message_id is
  'Prior immutable message event replaced or cancelled by this event.';
