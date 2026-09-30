-- The existing general messages(conversation_id, created_at desc) index already
-- serves call-event reads, so the new partial index would duplicate it.
drop index if exists public.messages_call_details_conversation_created_idx;
