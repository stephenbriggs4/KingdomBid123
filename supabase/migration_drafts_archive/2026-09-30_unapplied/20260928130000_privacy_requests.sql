-- R-28: account deletion / data export / correction requests.
-- Requests are filed by the signed-in user and worked by a platform admin under
-- the Data Deletion Request Process. Nothing here deletes data automatically.

create table if not exists public.privacy_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  email        text not null check (char_length(email) between 3 and 254),
  kind         text not null check (kind in ('deletion','export','correction')),
  details      text check (details is null or char_length(details) <= 2000),
  status       text not null default 'open' check (status in ('open','in_progress','completed','declined')),
  admin_notes  text check (admin_notes is null or char_length(admin_notes) <= 4000),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  resolved_by  uuid references auth.users(id) on delete set null
);

-- One active request per person per kind.
create unique index if not exists privacy_requests_one_active
  on public.privacy_requests (user_id, kind) where status in ('open','in_progress') and user_id is not null;
create index if not exists privacy_requests_status_idx on public.privacy_requests (status, created_at desc);

alter table public.privacy_requests enable row level security;

drop policy if exists privacy_requests_own_read on public.privacy_requests;
create policy privacy_requests_own_read on public.privacy_requests
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists privacy_requests_admin_read on public.privacy_requests;
create policy privacy_requests_admin_read on public.privacy_requests
  for select to authenticated
  using ((select coalesce(public.kb_is_platform_admin(), false)));

revoke all on public.privacy_requests from anon, authenticated;
grant select on public.privacy_requests to authenticated;

create or replace function public.kb_submit_privacy_request(p_kind text, p_details text default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_kind not in ('deletion','export','correction') then
    raise exception 'invalid request kind' using errcode = '22023';
  end if;
  select lower(email) into v_email from auth.users where id = v_uid;
  if v_email is null then
    raise exception 'account email missing' using errcode = '22023';
  end if;
  begin
    insert into public.privacy_requests (user_id, email, kind, details)
    values (v_uid, v_email, p_kind, nullif(left(btrim(coalesce(p_details, '')), 2000), ''))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'You already have an open % request.', p_kind using errcode = '23505';
  end;
  return v_id;
end;
$$;

create or replace function public.kb_admin_list_privacy_requests()
returns setof public.privacy_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return query select * from public.privacy_requests order by (status in ('open','in_progress')) desc, created_at desc limit 500;
end;
$$;

create or replace function public.kb_admin_resolve_privacy_request(p_id uuid, p_status text, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_status not in ('in_progress','completed','declined') then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  update public.privacy_requests
     set status = p_status,
         admin_notes = nullif(left(btrim(coalesce(p_notes, '')), 4000), ''),
         resolved_at = case when p_status in ('completed','declined') then now() else null end,
         resolved_by = case when p_status in ('completed','declined') then (select auth.uid()) else null end
   where id = p_id;
  if not found then
    raise exception 'request not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.kb_submit_privacy_request(text, text) from public, anon;
revoke all on function public.kb_admin_list_privacy_requests() from public, anon;
revoke all on function public.kb_admin_resolve_privacy_request(uuid, text, text) from public, anon;
grant execute on function public.kb_submit_privacy_request(text, text) to authenticated;
grant execute on function public.kb_admin_list_privacy_requests() to authenticated;
grant execute on function public.kb_admin_resolve_privacy_request(uuid, text, text) to authenticated;
