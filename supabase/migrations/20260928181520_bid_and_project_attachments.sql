create or replace function public.kb_can_view_project_files_v1(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(public.kb_is_platform_admin(), false)
    or exists (
      select 1 from public.projects p
      where p.id = p_project
        and (p.church_id = (select auth.uid()) or p.hired_vendor_id = (select auth.uid()))
    )
    or public.kb_vendor_invited_to_project_v1(p_project)
    or exists (
      select 1 from public.bids b
      where b.project_id = p_project and b.vendor_user_id = (select auth.uid())
    );
$$;
revoke all on function public.kb_can_view_project_files_v1(uuid) from public, anon;
grant execute on function public.kb_can_view_project_files_v1(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('bid-attachments', 'bid-attachments', false, 15728640, array[
    'application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg','image/png','image/webp','text/plain','text/csv']),
  ('project-files', 'project-files', false, 15728640, array[
    'application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg','image/png','image/webp','text/plain','text/csv'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.bid_attachments (
  id             uuid primary key default gen_random_uuid(),
  bid_id         uuid not null references public.bids(id) on delete cascade,
  vendor_user_id uuid not null references auth.users(id) on delete cascade,
  church_id      uuid references auth.users(id) on delete set null,
  file_path      text not null unique check (char_length(file_path) <= 300),
  file_name      text not null check (char_length(file_name) between 1 and 200),
  mime_type      text check (mime_type is null or char_length(mime_type) <= 120),
  size_bytes     bigint check (size_bytes is null or size_bytes between 1 and 15728640),
  created_at     timestamptz not null default now()
);
create index if not exists bid_attachments_bid_idx on public.bid_attachments (bid_id);
create index if not exists bid_attachments_vendor_idx on public.bid_attachments (vendor_user_id);
create index if not exists bid_attachments_church_idx on public.bid_attachments (church_id) where church_id is not null;

create or replace function private.kb_bid_attachment_guard_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_bid record;
  v_count int;
begin
  select b.vendor_user_id, b.church_id into v_bid from public.bids b where b.id = new.bid_id;
  if not found or v_bid.vendor_user_id is distinct from new.vendor_user_id then
    raise exception 'You can only attach files to your own proposals' using errcode = '42501';
  end if;
  if new.file_path not like new.vendor_user_id::text || '/%' then
    raise exception 'Files must be stored in your own folder' using errcode = '42501';
  end if;
  select count(*) into v_count from public.bid_attachments where bid_id = new.bid_id;
  if v_count >= 5 then
    raise exception 'A proposal can have at most 5 attachments' using errcode = '54000';
  end if;
  new.church_id := v_bid.church_id;
  return new;
end;
$$;
drop trigger if exists kb_bid_attachment_guard_v1 on public.bid_attachments;
create trigger kb_bid_attachment_guard_v1
  before insert on public.bid_attachments
  for each row execute function private.kb_bid_attachment_guard_v1();

alter table public.bid_attachments enable row level security;
drop policy if exists bid_attachments_insert_own on public.bid_attachments;
create policy bid_attachments_insert_own on public.bid_attachments
  for insert to authenticated with check (vendor_user_id = (select auth.uid()));
drop policy if exists bid_attachments_select_involved on public.bid_attachments;
create policy bid_attachments_select_involved on public.bid_attachments
  for select to authenticated
  using (vendor_user_id = (select auth.uid()) or church_id = (select auth.uid()) or (select coalesce(public.kb_is_platform_admin(), false)));
drop policy if exists bid_attachments_delete_own on public.bid_attachments;
create policy bid_attachments_delete_own on public.bid_attachments
  for delete to authenticated using (vendor_user_id = (select auth.uid()));
revoke all on public.bid_attachments from anon;
grant select, insert, delete on public.bid_attachments to authenticated;

drop policy if exists bid_attachments_objects_insert on storage.objects;
create policy bid_attachments_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bid-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists bid_attachments_objects_select on storage.objects;
create policy bid_attachments_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'bid-attachments' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select coalesce(public.kb_is_platform_admin(), false))
    or exists (select 1 from public.bid_attachments ba where ba.file_path = storage.objects.name and ba.church_id = (select auth.uid()))
  ));
drop policy if exists bid_attachments_objects_delete on storage.objects;
create policy bid_attachments_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'bid-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create table if not exists public.project_attachments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  church_id   uuid not null references auth.users(id) on delete cascade,
  file_path   text not null unique check (char_length(file_path) <= 300),
  file_name   text not null check (char_length(file_name) between 1 and 200),
  mime_type   text check (mime_type is null or char_length(mime_type) <= 120),
  size_bytes  bigint check (size_bytes is null or size_bytes between 1 and 15728640),
  created_at  timestamptz not null default now()
);
create index if not exists project_attachments_project_idx on public.project_attachments (project_id);
create index if not exists project_attachments_church_idx on public.project_attachments (church_id);

create or replace function private.kb_project_attachment_guard_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_count int;
begin
  if not exists (select 1 from public.projects p where p.id = new.project_id and p.church_id = new.church_id) then
    raise exception 'You can only attach files to your own projects' using errcode = '42501';
  end if;
  if new.file_path not like new.church_id::text || '/%' then
    raise exception 'Files must be stored in your own folder' using errcode = '42501';
  end if;
  select count(*) into v_count from public.project_attachments where project_id = new.project_id;
  if v_count >= 10 then
    raise exception 'A project can have at most 10 attachments' using errcode = '54000';
  end if;
  return new;
end;
$$;
drop trigger if exists kb_project_attachment_guard_v1 on public.project_attachments;
create trigger kb_project_attachment_guard_v1
  before insert on public.project_attachments
  for each row execute function private.kb_project_attachment_guard_v1();

alter table public.project_attachments enable row level security;
drop policy if exists project_attachments_insert_owner on public.project_attachments;
create policy project_attachments_insert_owner on public.project_attachments
  for insert to authenticated with check (church_id = (select auth.uid()));
drop policy if exists project_attachments_select_visible on public.project_attachments;
create policy project_attachments_select_visible on public.project_attachments
  for select to authenticated using (public.kb_can_view_project_files_v1(project_id));
drop policy if exists project_attachments_delete_owner on public.project_attachments;
create policy project_attachments_delete_owner on public.project_attachments
  for delete to authenticated using (church_id = (select auth.uid()));
revoke all on public.project_attachments from anon;
grant select, insert, delete on public.project_attachments to authenticated;

drop policy if exists project_files_objects_insert on storage.objects;
create policy project_files_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists project_files_objects_select on storage.objects;
create policy project_files_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'project-files' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.project_attachments pa where pa.file_path = storage.objects.name and public.kb_can_view_project_files_v1(pa.project_id))
  ));
drop policy if exists project_files_objects_delete on storage.objects;
create policy project_files_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
