alter table public.notification_prefs add column if not exists email_enabled boolean not null default true;
alter table public.notification_prefs add column if not exists email_frequency text not null default 'instant';
alter table public.notification_prefs drop constraint if exists notification_prefs_email_frequency_check;
alter table public.notification_prefs add constraint notification_prefs_email_frequency_check
  check (email_frequency in ('instant','daily','off'));

create table if not exists public.email_suppressions (
  email      text primary key check (email = lower(email) and char_length(email) <= 254),
  reason     text not null check (reason in ('unsubscribed','bounced','complaint')),
  detail     text check (detail is null or char_length(detail) <= 500),
  created_at timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;
revoke all on public.email_suppressions from anon, authenticated;

create table if not exists public.email_outbox (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  template            text not null check (char_length(template) <= 60),
  subject             text not null check (char_length(subject) <= 200),
  payload             jsonb not null default '{}'::jsonb,
  dedupe_key          text not null unique check (char_length(dedupe_key) <= 200),
  digest              boolean not null default false,
  status              text not null default 'pending' check (status in ('pending','sending','sent','failed','skipped')),
  attempts            integer not null default 0,
  last_error          text check (last_error is null or char_length(last_error) <= 500),
  provider_message_id text,
  send_after          timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  sent_at             timestamptz
);
create index if not exists email_outbox_pending_idx on public.email_outbox (status, send_after) where status in ('pending','sending');
create index if not exists email_outbox_user_idx on public.email_outbox (user_id, created_at desc);
alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from anon, authenticated;

create or replace function private.kb_enqueue_email_for_notification_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template text;
  v_email text;
  v_pref public.notification_prefs%rowtype;
  v_has_pref boolean;
  v_key text;
  v_digest boolean := false;
  v_subject text;
begin
  v_template := case new.type
    when 'new_bid' then 'new_bid'
    when 'bid_declined' then 'bid_declined'
    when 'bid_accepted' then 'bid_accepted'
    when 'new_message' then case when new.title = 'New bid invitation' then 'invitation' else 'new_message' end
    when 'project_update' then 'project_update'
    when 'project_cancelled' then 'project_cancelled'
    when 'review_prompt' then 'review_prompt'
    when 'project_completion_requested' then 'completion_requested'
    when 'project_completion_changes_requested' then 'completion_changes_requested'
    when 'project_completed' then 'project_completed'
    else null
  end;
  if v_template is null or new.user_id is null then
    return new;
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = new.user_id;
  if v_email is null or exists (select 1 from public.email_suppressions s where s.email = v_email) then
    return new;
  end if;

  select * into v_pref from public.notification_prefs np where np.user_id = new.user_id;
  v_has_pref := found;
  if v_has_pref then
    if not v_pref.email_enabled or v_pref.email_frequency = 'off' then return new; end if;
    if v_template = 'new_bid' and not v_pref.new_bid then return new; end if;
    if v_template in ('new_message','invitation') and not v_pref.new_message then return new; end if;
    if v_template = 'project_update' and not v_pref.project_update then return new; end if;
    v_digest := (v_pref.email_frequency = 'daily');
  end if;

  if v_template = 'new_message' then
    v_key := 'msg:' || coalesce(new.meta ->> 'conversation_id', 'none') || ':' || new.user_id::text || ':'
             || to_char(date_trunc('hour', now()) + (floor(extract(minute from now()) / 15) * interval '15 minutes'), 'YYYYMMDDHH24MI');
  else
    v_key := 'n:' || new.id::text;
  end if;

  v_subject := left(coalesce(nullif(btrim(new.title), ''), 'FaithBid update'), 200);

  insert into public.email_outbox (user_id, template, subject, payload, dedupe_key, digest)
  values (
    new.user_id, v_template, v_subject,
    jsonb_build_object('title', new.title, 'body', new.body, 'link', new.link, 'notification_id', new.id::text),
    v_key, v_digest
  )
  on conflict (dedupe_key) do nothing;

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists kb_enqueue_email_for_notification_v1 on public.notifications;
create trigger kb_enqueue_email_for_notification_v1
  after insert on public.notifications
  for each row execute function private.kb_enqueue_email_for_notification_v1();
