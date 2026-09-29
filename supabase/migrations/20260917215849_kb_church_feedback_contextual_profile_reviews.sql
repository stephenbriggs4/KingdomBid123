create table public.church_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  church_id uuid not null references auth.users(id) on delete cascade,
  vendor_user_id uuid not null references auth.users(id) on delete cascade,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint church_feedback_project_vendor_key unique (project_id, vendor_user_id),
  constraint church_feedback_tags_count_check check (cardinality(tags) between 1 and 5)
);

create index church_feedback_vendor_created_idx on public.church_feedback (vendor_user_id, created_at desc);
create index church_feedback_church_created_idx on public.church_feedback (church_id, created_at desc);

alter table public.church_feedback enable row level security;

create policy kb_church_feedback_select_participants
on public.church_feedback
for select
to authenticated
using (
  vendor_user_id = (select auth.uid())
  or church_id = (select auth.uid())
  or public.kb_is_platform_admin()
);

grant select on public.church_feedback to authenticated;
revoke insert, update, delete on public.church_feedback from anon, authenticated;

create or replace function private.kb_submit_church_feedback(
  p_project_id uuid,
  p_tags text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_project public.projects%rowtype;
  v_tags text[] := coalesce(p_tags, '{}'::text[]);
  v_feedback_id uuid;
begin
  if v_uid is null then
    raise exception 'Sign in required.' using errcode='42501';
  end if;

  if p_project_id is null then
    raise exception 'A completed project is required.' using errcode='22023';
  end if;

  if cardinality(v_tags) < 1 or cardinality(v_tags) > 5
     or exists (
       select 1
       from unnest(v_tags) as tag
       where nullif(btrim(tag),'') is null or char_length(btrim(tag)) > 40
     ) then
    raise exception 'Choose between 1 and 5 feedback tags of 40 characters or fewer.' using errcode='22023';
  end if;

  select * into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Project not found.' using errcode='P0002';
  end if;

  if lower(coalesce(v_project.status,'')) <> 'completed'
     or v_project.completed_at is null
     or v_project.hired_vendor_id is null then
    raise exception 'This project is not eligible for feedback yet.' using errcode='23514';
  end if;

  if v_project.hired_vendor_id is distinct from v_uid then
    raise exception 'Only the hired vendor can leave church feedback for this project.' using errcode='42501';
  end if;

  insert into public.church_feedback(project_id, church_id, vendor_user_id, tags)
  values(v_project.id, v_project.church_id, v_uid, v_tags)
  on conflict (project_id, vendor_user_id)
  do update set tags = excluded.tags, updated_at = now()
  returning id into v_feedback_id;

  return v_feedback_id;
end;
$$;

revoke all on function private.kb_submit_church_feedback(uuid,text[]) from public;

create or replace function public.marketplace_service_submit_church_feedback(
  p_project_id uuid,
  p_tags text[]
)
returns uuid
language sql
set search_path = ''
as $$
  select private.kb_submit_church_feedback(p_project_id, p_tags);
$$;

revoke all on function public.marketplace_service_submit_church_feedback(uuid,text[]) from public, anon;
grant execute on function public.marketplace_service_submit_church_feedback(uuid,text[]) to authenticated;
