set lock_timeout = '5s';
set statement_timeout = '30s';

alter table public.projects
  alter column status set default 'draft';

create or replace function public.kb_guard_project_status_writes()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' and new.status is distinct from 'draft' then
      raise exception 'New projects must begin in draft'
        using errcode = '42501';
    end if;

    if tg_op = 'UPDATE'
       and new.status is distinct from old.status
       and new.status = 'open' then
      raise exception 'Projects must be published through the guarded publish workflow'
        using errcode = '42501';
    end if;
  end if;

  return new;
end
$function$;

revoke all on function public.kb_guard_project_status_writes() from public;
revoke all on function public.kb_guard_project_status_writes() from anon;
revoke all on function public.kb_guard_project_status_writes() from authenticated;

drop trigger if exists kb_projects_status_write_guard on public.projects;
create trigger kb_projects_status_write_guard
before insert or update of status on public.projects
for each row execute function public.kb_guard_project_status_writes();

drop policy if exists "Authenticated can insert projects" on public.projects;
create policy "Authenticated can insert projects"
on public.projects
for insert
to authenticated
with check (
  church_id = (select auth.uid())
  and status = 'draft'
);

drop policy if exists kb_projects_insert_owner on public.projects;
create policy kb_projects_insert_owner
on public.projects
for insert
to authenticated
with check (
  (
    church_id = (select auth.uid())
    and status = 'draft'
  )
  or (select public.kb_is_platform_admin())
);

drop policy if exists kb_projects_select on public.projects;
create policy kb_projects_select
on public.projects
for select
to anon, authenticated
using (
  status = 'open'
  or church_id = (select auth.uid())
  or hired_vendor_id = (select auth.uid())
  or (select public.kb_is_platform_admin())
);
