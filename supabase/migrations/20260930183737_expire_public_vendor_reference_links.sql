-- Public reference links are bearer credentials. Give every link a finite
-- lifetime and make completion/cancellation invalidate it immediately.

alter table public.vendor_references
  add column if not exists expires_at timestamptz;

update public.vendor_references
set expires_at = case
  when status in ('completed', 'cancelled') then coalesce(completed_at, now())
  else coalesce(created_at, now()) + interval '30 days'
end
where expires_at is null;

alter table public.vendor_references
  alter column expires_at set default (now() + interval '30 days'),
  alter column expires_at set not null;

create index if not exists vendor_references_active_token_expiry_idx
  on public.vendor_references (token, expires_at)
  where status in ('pending', 'sent');

create or replace function private.kb_expire_vendor_reference_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- The bearer-token lifetime is server-owned. Table INSERT grants must not
    -- let a vendor manufacture a longer-lived public link.
    new.expires_at := clock_timestamp() + interval '30 days';
  elsif new.status in ('completed', 'cancelled')
     and old.status is distinct from new.status then
    new.expires_at := least(new.expires_at, clock_timestamp());
  elsif new.expires_at is distinct from old.expires_at then
    -- Direct updates cannot extend or otherwise rewrite bearer-token expiry.
    new.expires_at := old.expires_at;
  end if;
  return new;
end;
$$;

revoke all on function private.kb_expire_vendor_reference_link()
  from public, anon, authenticated;

drop trigger if exists kb_expire_vendor_reference_link on public.vendor_references;
create trigger kb_expire_vendor_reference_link
  before insert or update of status, expires_at on public.vendor_references
  for each row execute function private.kb_expire_vendor_reference_link();

alter function public.kb_get_vendor_reference_survey_v2(text)
  rename to kb_get_vendor_reference_survey_v2_unexpired_legacy;
alter function public.kb_get_vendor_reference_survey(text)
  rename to kb_get_vendor_reference_survey_unexpired_legacy;
alter function public.kb_submit_vendor_reference_response_v2(text, boolean, integer, text, text, text, text)
  rename to kb_submit_vendor_reference_response_v2_unexpired_legacy;
alter function public.kb_submit_vendor_faith_reference_response_v2(text, boolean, boolean, text, text, text, text)
  rename to kb_submit_vendor_faith_reference_response_v2_unexpired_legacy;

revoke all on function public.kb_get_vendor_reference_survey_v2_unexpired_legacy(text) from public, anon, authenticated;
revoke all on function public.kb_get_vendor_reference_survey_unexpired_legacy(text) from public, anon, authenticated;
revoke all on function public.kb_submit_vendor_reference_response_v2_unexpired_legacy(text, boolean, integer, text, text, text, text) from public, anon, authenticated;
revoke all on function public.kb_submit_vendor_faith_reference_response_v2_unexpired_legacy(text, boolean, boolean, text, text, text, text) from public, anon, authenticated;

create or replace function public.kb_get_vendor_reference_survey_v2(p_token text)
returns table(
  id uuid,
  purpose text,
  client_name text,
  reference_context text,
  status text,
  vendor_name text,
  already_submitted boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.vendor_references vr
    where vr.token = p_token
      and vr.status in ('pending', 'sent')
      and vr.expires_at > statement_timestamp()
  ) then
    return;
  end if;
  return query
  select * from public.kb_get_vendor_reference_survey_v2_unexpired_legacy(p_token);
end;
$$;

create or replace function public.kb_get_vendor_reference_survey(p_token text)
returns table(
  id uuid,
  vendor_id uuid,
  client_name text,
  project_context text,
  status text,
  vendor_name text,
  already_submitted boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.vendor_references vr
    where vr.token = p_token
      and vr.status in ('pending', 'sent')
      and vr.expires_at > statement_timestamp()
  ) then
    return;
  end if;
  return query
  select * from public.kb_get_vendor_reference_survey_unexpired_legacy(p_token);
end;
$$;

create or replace function public.kb_submit_vendor_reference_response_v2(
  p_token text,
  p_would_recommend boolean,
  p_overall_rating integer,
  p_strengths text default null,
  p_concerns text default null,
  p_faith_alignment text default null,
  p_honeypot text default null
)
returns table(
  ok boolean, reason text, response_id uuid, reference_id uuid,
  already_submitted boolean, retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
    from public.vendor_references vr
    where vr.token = btrim(coalesce(p_token, ''))
      and vr.status in ('pending', 'sent')
      and vr.expires_at > statement_timestamp()
    for update;
  if not found then
    return query select false, 'invalid_token'::text, null::uuid, null::uuid, false, null::integer;
    return;
  end if;

  return query
  select * from public.kb_submit_vendor_reference_response_v2_unexpired_legacy(
    btrim(p_token), p_would_recommend, p_overall_rating, p_strengths,
    p_concerns, p_faith_alignment, p_honeypot
  );
end;
$$;

create or replace function public.kb_submit_vendor_faith_reference_response_v2(
  p_token text,
  p_christian_identity_confirmed boolean,
  p_would_recommend boolean,
  p_relationship_context text,
  p_faith_alignment text,
  p_concerns text default null,
  p_honeypot text default null
)
returns table(
  ok boolean, reason text, response_id uuid, reference_id uuid,
  already_submitted boolean, retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
    from public.vendor_references vr
    where vr.token = btrim(coalesce(p_token, ''))
      and vr.status in ('pending', 'sent')
      and vr.expires_at > statement_timestamp()
    for update;
  if not found then
    return query select false, 'invalid_token'::text, null::uuid, null::uuid, false, null::integer;
    return;
  end if;

  return query
  select * from public.kb_submit_vendor_faith_reference_response_v2_unexpired_legacy(
    btrim(p_token), p_christian_identity_confirmed, p_would_recommend,
    p_relationship_context, p_faith_alignment, p_concerns, p_honeypot
  );
end;
$$;

revoke all on function public.kb_get_vendor_reference_survey_v2(text) from public;
revoke all on function public.kb_get_vendor_reference_survey(text) from public;
revoke all on function public.kb_submit_vendor_reference_response_v2(text, boolean, integer, text, text, text, text) from public;
revoke all on function public.kb_submit_vendor_faith_reference_response_v2(text, boolean, boolean, text, text, text, text) from public;

grant execute on function public.kb_get_vendor_reference_survey_v2(text) to anon, authenticated, service_role;
grant execute on function public.kb_get_vendor_reference_survey(text) to anon, authenticated, service_role;
grant execute on function public.kb_submit_vendor_reference_response_v2(text, boolean, integer, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.kb_submit_vendor_faith_reference_response_v2(text, boolean, boolean, text, text, text, text) to anon, authenticated, service_role;
