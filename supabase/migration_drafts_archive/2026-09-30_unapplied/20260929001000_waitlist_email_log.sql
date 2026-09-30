-- R-50: bookkeeping for waitlist confirmation emails so the public send-waitlist-email
-- function cannot be used as a mail relay (only real waitlist rows, capped and spaced).
create table if not exists public.waitlist_email_log (
  email           text not null check (email = lower(email) and char_length(email) <= 254),
  role            text not null check (role in ('church','vendor')),
  send_count      integer not null default 0,
  last_sent_at    timestamptz,
  last_message_id text,
  primary key (email, role)
);
alter table public.waitlist_email_log enable row level security;
revoke all on public.waitlist_email_log from anon, authenticated;
-- service role only (no policies)
