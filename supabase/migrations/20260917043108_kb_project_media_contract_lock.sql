begin;

alter table public.projects
  add column if not exists hero_image_path text;

comment on column public.projects.hero_image_path is
  'Private storage object path in bucket project-media. Canonical source for a project hero image; never a public URL.';

alter table public.projects
  drop constraint if exists projects_hero_image_path_project_prefix;

alter table public.projects
  add constraint projects_hero_image_path_project_prefix
  check (
    hero_image_path is null
    or (
      length(hero_image_path) between 1 and 500
      and hero_image_path like id::text || '/%'
      and hero_image_path !~ '(^|/)\.\.(/|$)'
    )
  ) not valid;

alter table public.projects
  validate constraint projects_hero_image_path_project_prefix;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-media',
  'project-media',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.kb_project_id_from_media_path(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(coalesce(p_name,''), '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then split_part(p_name, '/', 1)::uuid
    else null
  end;
$$;

create or replace function private.kb_can_manage_project_media(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'auth'
as $$
  select auth.uid() is not null
    and (
      public.kb_is_platform_admin()
      or exists (
        select 1
        from public.projects p
        where p.id = p_project_id
          and p.church_id = auth.uid()
      )
    );
$$;

create or replace function private.kb_can_read_project_media(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'auth'
as $$
  select auth.uid() is not null
    and (
      public.kb_is_platform_admin()
      or exists (
        select 1
        from public.projects p
        where p.id = p_project_id
          and (
            p.church_id = auth.uid()
            or p.hired_vendor_id = auth.uid()
            or (p.status = 'open' and public.kb_marketplace_public())
            or exists (
              select 1
              from public.vendor_invites vi
              where vi.project_id = p.id
                and vi.vendor_user_id = auth.uid()
            )
            or exists (
              select 1
              from public.project_vendor_links pvl
              where pvl.project_id = p.id
                and (
                  pvl.church_id = auth.uid()
                  or pvl.vendor_user_id = auth.uid()
                )
            )
          )
      )
    );
$$;

revoke all on function private.kb_project_id_from_media_path(text) from public;
revoke all on function private.kb_can_manage_project_media(uuid) from public;
revoke all on function private.kb_can_read_project_media(uuid) from public;

grant execute on function private.kb_project_id_from_media_path(text) to authenticated, service_role;
grant execute on function private.kb_can_manage_project_media(uuid) to authenticated, service_role;
grant execute on function private.kb_can_read_project_media(uuid) to authenticated, service_role;

create or replace function public.kb_set_project_hero_image(
  p_project_id uuid,
  p_path text
)
returns public.projects
language plpgsql
security definer
set search_path = 'public', 'auth'
as $$
declare
  v_project public.projects;
  v_path text := nullif(btrim(coalesce(p_path, '')), '');
begin
  if not private.kb_can_manage_project_media(p_project_id) then
    raise exception 'not authorized to manage project media'
      using errcode = '42501';
  end if;

  if v_path is not null then
    if length(v_path) > 500
       or v_path not like p_project_id::text || '/%'
       or v_path ~ '(^|/)\.\.(/|$)' then
      raise exception 'invalid project media path'
        using errcode = '22023';
    end if;
  end if;

  update public.projects
     set hero_image_path = v_path
   where id = p_project_id
   returning * into v_project;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  return v_project;
end;
$$;

revoke all on function public.kb_set_project_hero_image(uuid,text) from public;
grant execute on function public.kb_set_project_hero_image(uuid,text) to authenticated, service_role;

-- Keep the storage surface narrowly scoped to this private bucket.
drop policy if exists project_media_read_allowed on storage.objects;
drop policy if exists project_media_insert_owner on storage.objects;
drop policy if exists project_media_update_owner on storage.objects;
drop policy if exists project_media_delete_owner on storage.objects;

create policy project_media_read_allowed
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-media'
  and private.kb_can_read_project_media(private.kb_project_id_from_media_path(name))
);

create policy project_media_insert_owner
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-media'
  and private.kb_can_manage_project_media(private.kb_project_id_from_media_path(name))
);

create policy project_media_update_owner
on storage.objects
for update
to authenticated
using (
  bucket_id = 'project-media'
  and private.kb_can_manage_project_media(private.kb_project_id_from_media_path(name))
)
with check (
  bucket_id = 'project-media'
  and private.kb_can_manage_project_media(private.kb_project_id_from_media_path(name))
);

create policy project_media_delete_owner
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-media'
  and private.kb_can_manage_project_media(private.kb_project_id_from_media_path(name))
);

commit;
