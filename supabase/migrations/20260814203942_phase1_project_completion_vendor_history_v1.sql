create or replace function public.kb_project_completion_vendor_history()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.status='completed'
     and old.status is distinct from new.status
     and new.hired_vendor_id is not null
     and not exists (
       select 1 from public.project_activity_feed a
       where a.project_id=new.id and a.kind='project_completed'
     ) then
    update public.vendors
    set projects_count=coalesce(projects_count,0)+1,
        completed_project_count=coalesce(completed_project_count,0)+1
    where user_id=new.hired_vendor_id;
  end if;
  return new;
end;
$function$;

drop trigger if exists kb_projects_completion_vendor_history on public.projects;
create trigger kb_projects_completion_vendor_history
after update of status on public.projects
for each row execute function public.kb_project_completion_vendor_history();
