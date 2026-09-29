alter table public.vendors add column if not exists website text;
alter table public.vendors add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.vendors add column if not exists contact_preference text not null default 'platform_messages';

alter table public.vendors drop constraint if exists vendors_contact_preference_check;
alter table public.vendors add constraint vendors_contact_preference_check
  check (contact_preference in ('platform_messages','email','phone'));

create or replace function private.kb_validate_vendor_links_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  k text;
  v text;
begin
  if new.website is not null then
    new.website := nullif(btrim(new.website), '');
  end if;
  if new.website is not null and (char_length(new.website) > 300 or new.website !~* '^https?://[^\s/$.?#][^\s]*$') then
    raise exception 'Website must be a full http(s) address' using errcode = '22023';
  end if;

  if new.social_links is null or jsonb_typeof(new.social_links) <> 'object' then
    new.social_links := '{}'::jsonb;
  end if;
  for k, v in select key, value #>> '{}' from jsonb_each(new.social_links) loop
    if k not in ('facebook','instagram','linkedin','youtube','x') then
      raise exception 'Unsupported social link: %', k using errcode = '22023';
    end if;
    if v is null or char_length(v) > 300 or v !~* '^https?://[^\s/$.?#][^\s]*$' then
      raise exception 'Social links must be full http(s) addresses' using errcode = '22023';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists kb_validate_vendor_links_v1 on public.vendors;
create trigger kb_validate_vendor_links_v1
  before insert or update of website, social_links on public.vendors
  for each row execute function private.kb_validate_vendor_links_v1();

create table if not exists public.vendor_private_contact (
  vendor_id  uuid primary key references public.vendors(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  phone      text check (phone is null or char_length(phone) between 7 and 30),
  updated_at timestamptz not null default now()
);
alter table public.vendor_private_contact enable row level security;

drop policy if exists vendor_private_contact_owner on public.vendor_private_contact;
create policy vendor_private_contact_owner on public.vendor_private_contact
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.vendors v where v.id = vendor_id and v.user_id = (select auth.uid()))
  );

drop policy if exists vendor_private_contact_admin on public.vendor_private_contact;
create policy vendor_private_contact_admin on public.vendor_private_contact
  for select to authenticated
  using ((select coalesce(public.kb_is_platform_admin(), false)));

revoke all on public.vendor_private_contact from anon;
grant select, insert, update, delete on public.vendor_private_contact to authenticated;

create or replace function public.kb_vendor_phone_for_church_v1(p_vendor_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_phone text;
begin
  if v_uid is null then return null; end if;
  select c.phone into v_phone
  from public.vendor_private_contact c
  join public.vendors v on v.id = c.vendor_id
  where c.vendor_id = p_vendor_id
    and v.contact_preference = 'phone'
    and exists (
      select 1 from public.projects p
      where p.church_id = v_uid and p.hired_vendor_id = v.user_id
    );
  return v_phone;
end;
$$;
revoke all on function public.kb_vendor_phone_for_church_v1(uuid) from public, anon;
grant execute on function public.kb_vendor_phone_for_church_v1(uuid) to authenticated;

create table if not exists public.vendor_credentials (
  id               uuid primary key default gen_random_uuid(),
  vendor_id        uuid not null references public.vendors(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  kind             text not null check (kind in ('insurance','license')),
  status           text not null default 'submitted' check (status in ('submitted','verified','rejected')),
  reference_number text check (reference_number is null or char_length(reference_number) <= 80),
  expires_on       date,
  document_path    text check (document_path is null or char_length(document_path) <= 300),
  admin_notes      text check (admin_notes is null or char_length(admin_notes) <= 2000),
  submitted_at     timestamptz not null default now(),
  verified_at      timestamptz,
  verified_by      uuid references auth.users(id) on delete set null,
  unique (vendor_id, kind)
);
create index if not exists vendor_credentials_status_idx on public.vendor_credentials (status, submitted_at desc);
create index if not exists vendor_credentials_user_idx on public.vendor_credentials (user_id);
create index if not exists vendor_credentials_verified_by_idx on public.vendor_credentials (verified_by) where verified_by is not null;

alter table public.vendor_credentials enable row level security;

drop policy if exists vendor_credentials_owner_read on public.vendor_credentials;
create policy vendor_credentials_owner_read on public.vendor_credentials
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists vendor_credentials_admin_read on public.vendor_credentials;
create policy vendor_credentials_admin_read on public.vendor_credentials
  for select to authenticated using ((select coalesce(public.kb_is_platform_admin(), false)));

revoke all on public.vendor_credentials from anon, authenticated;
grant select on public.vendor_credentials to authenticated;

create or replace function public.kb_vendor_submit_credential_v1(
  p_kind text,
  p_reference text,
  p_expires_on date,
  p_document_path text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_vendor uuid;
  v_id uuid;
begin
  if v_uid is null then raise exception 'sign in required' using errcode = '28000'; end if;
  if p_kind not in ('insurance','license') then raise exception 'invalid credential kind' using errcode = '22023'; end if;
  select id into v_vendor from public.vendors where user_id = v_uid;
  if v_vendor is null then raise exception 'vendor profile required' using errcode = '42501'; end if;
  if p_document_path is not null and p_document_path not like v_uid::text || '/%' then
    raise exception 'document must be in your own folder' using errcode = '42501';
  end if;
  if p_expires_on is not null and p_expires_on < current_date then
    raise exception 'expiry date is in the past' using errcode = '22023';
  end if;

  insert into public.vendor_credentials (vendor_id, user_id, kind, status, reference_number, expires_on, document_path)
  values (v_vendor, v_uid, p_kind, 'submitted', nullif(btrim(coalesce(p_reference,'')), ''), p_expires_on, p_document_path)
  on conflict (vendor_id, kind) do update
    set status = 'submitted',
        reference_number = excluded.reference_number,
        expires_on = excluded.expires_on,
        document_path = coalesce(excluded.document_path, public.vendor_credentials.document_path),
        submitted_at = now(),
        verified_at = null,
        verified_by = null,
        admin_notes = null
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.kb_vendor_submit_credential_v1(text, text, date, text) from public, anon;
grant execute on function public.kb_vendor_submit_credential_v1(text, text, date, text) to authenticated;

create or replace function public.kb_admin_list_vendor_credentials_v1()
returns table (
  id uuid, vendor_id uuid, vendor_name text, kind text, status text, reference_number text,
  expires_on date, document_path text, admin_notes text, submitted_at timestamptz, verified_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return query
    select c.id, c.vendor_id, v.name, c.kind, c.status, c.reference_number, c.expires_on,
           c.document_path, c.admin_notes, c.submitted_at, c.verified_at
    from public.vendor_credentials c
    join public.vendors v on v.id = c.vendor_id
    order by (c.status = 'submitted') desc, c.submitted_at desc
    limit 500;
end;
$$;

create or replace function public.kb_admin_decide_vendor_credential_v1(p_id uuid, p_status text, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before text;
  v_uid uuid := (select auth.uid());
begin
  if not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_status not in ('verified','rejected') then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  select status into v_before from public.vendor_credentials where id = p_id;
  if not found then raise exception 'credential not found' using errcode = 'P0002'; end if;

  update public.vendor_credentials
     set status = p_status,
         admin_notes = nullif(left(btrim(coalesce(p_notes,'')), 2000), ''),
         verified_at = case when p_status = 'verified' then now() else null end,
         verified_by = case when p_status = 'verified' then v_uid else null end
   where id = p_id;

  insert into public.admin_audit_log (admin_id, action, target_table, target_id, reason, before_snapshot, after_snapshot)
  values (v_uid, 'decide_vendor_credential', 'vendor_credentials', p_id::text,
          nullif(left(btrim(coalesce(p_notes,'')), 2000), ''),
          jsonb_build_object('status', v_before), jsonb_build_object('status', p_status));
end;
$$;
revoke all on function public.kb_admin_list_vendor_credentials_v1() from public, anon;
revoke all on function public.kb_admin_decide_vendor_credential_v1(uuid, text, text) from public, anon;
grant execute on function public.kb_admin_list_vendor_credentials_v1() to authenticated;
grant execute on function public.kb_admin_decide_vendor_credential_v1(uuid, text, text) to authenticated;

create or replace function public.kb_vendor_public_credentials_v1(p_vendor_id uuid)
returns table (kind text, expires_on date, verified_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.kind, c.expires_on, c.verified_at
  from public.vendor_credentials c
  where c.vendor_id = p_vendor_id
    and c.status = 'verified'
    and (c.expires_on is null or c.expires_on >= current_date)
    and (select auth.uid()) is not null;
$$;
revoke all on function public.kb_vendor_public_credentials_v1(uuid) from public, anon;
grant execute on function public.kb_vendor_public_credentials_v1(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vendor-credentials', 'vendor-credentials', false, 10485760,
        array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = 10485760,
      allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp'];

drop policy if exists vendor_credentials_objects_owner_write on storage.objects;
create policy vendor_credentials_objects_owner_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vendor-credentials' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists vendor_credentials_objects_owner_read on storage.objects;
create policy vendor_credentials_objects_owner_read on storage.objects
  for select to authenticated
  using (bucket_id = 'vendor-credentials'
         and ((storage.foldername(name))[1] = (select auth.uid())::text
              or (select coalesce(public.kb_is_platform_admin(), false))));

drop policy if exists vendor_credentials_objects_owner_delete on storage.objects;
create policy vendor_credentials_objects_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'vendor-credentials' and (storage.foldername(name))[1] = (select auth.uid())::text);
