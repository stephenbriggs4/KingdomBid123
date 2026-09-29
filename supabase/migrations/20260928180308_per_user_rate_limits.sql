create index if not exists messages_sender_created_idx on public.messages (sender_id, created_at desc);
create index if not exists bids_vendor_user_created_idx on public.bids (vendor_user_id, created_at desc);

create or replace function private.kb_rate_limit_messages_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_recent int;
  v_files int;
begin
  if coalesce(auth.role(), '') <> 'authenticated'
     or new.sender_id is distinct from (select auth.uid())
     or coalesce(public.kb_is_platform_admin(), false) then
    return new;
  end if;

  select count(*) into v_recent
  from public.messages m
  where m.sender_id = new.sender_id and m.created_at > now() - interval '1 minute';
  if v_recent >= 30 then
    raise exception 'rate_limited: You are sending messages too quickly. Please wait a moment.'
      using errcode = 'P0001';
  end if;

  if new.file_path is not null or new.file_url is not null then
    select count(*) into v_files
    from public.messages m
    where m.sender_id = new.sender_id
      and (m.file_path is not null or m.file_url is not null)
      and m.created_at > now() - interval '1 hour';
    if v_files >= 20 then
      raise exception 'rate_limited: You have reached the hourly attachment limit. Please try again later.'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists kb_rate_limit_messages_v1 on public.messages;
create trigger kb_rate_limit_messages_v1
  before insert on public.messages
  for each row execute function private.kb_rate_limit_messages_v1();

create or replace function private.kb_rate_limit_bids_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_recent int;
begin
  if coalesce(auth.role(), '') <> 'authenticated'
     or new.vendor_user_id is distinct from (select auth.uid())
     or coalesce(public.kb_is_platform_admin(), false) then
    return new;
  end if;

  select count(*) into v_recent
  from public.bids b
  where b.vendor_user_id = new.vendor_user_id and b.created_at > now() - interval '1 hour';
  if v_recent >= 20 then
    raise exception 'rate_limited: You have reached the hourly proposal limit. Please try again later.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists kb_rate_limit_bids_v1 on public.bids;
create trigger kb_rate_limit_bids_v1
  before insert on public.bids
  for each row execute function private.kb_rate_limit_bids_v1();
