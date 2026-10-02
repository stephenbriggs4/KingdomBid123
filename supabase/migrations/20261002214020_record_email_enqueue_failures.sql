-- Email is secondary to the in-app notification, so enqueue failure remains
-- non-blocking. Unlike the original trigger, preserve a generic durable marker
-- on the notification and emit the detailed database error to operator logs.
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
  v_error_state text;
  v_error_message text;
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
  get stacked diagnostics
    v_error_state = returned_sqlstate,
    v_error_message = message_text;
  begin
    update public.notifications n
    set meta = coalesce(n.meta, '{}'::jsonb) || jsonb_build_object(
      'email_enqueue_failed', true,
      'email_enqueue_failed_at', clock_timestamp()
    )
    where n.id = new.id;
  exception when others then
    raise warning 'email enqueue failure marker could not be stored for notification %', new.id;
  end;
  raise warning 'email enqueue failed for notification % (SQLSTATE %): %',
    new.id, v_error_state, left(v_error_message, 300);
  return new;
end;
$$;

revoke all on function private.kb_enqueue_email_for_notification_v1()
  from public, anon, authenticated;

comment on function private.kb_enqueue_email_for_notification_v1() is
  'Non-blocking notification email enqueue. Failures are marked generically on notifications.meta and detailed only in database operator logs.';
