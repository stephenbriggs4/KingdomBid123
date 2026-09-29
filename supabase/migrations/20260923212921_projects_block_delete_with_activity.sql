create or replace function public.kb_projects_block_delete_with_activity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'draft' then
    return old;
  end if;
  if public.kb_is_platform_admin() then
    return old;
  end if;
  if old.hired_vendor_id is not null
     or exists (select 1 from public.bids b where b.project_id = old.id)
     or exists (select 1 from public.hire_confirmations h where h.project_id = old.id) then
    raise exception 'This project has vendor activity and cannot be deleted. Cancel it instead.'
      using errcode = 'P0001';
  end if;
  return old;
end;
$$;

drop trigger if exists kb_projects_block_delete_with_activity on public.projects;
create trigger kb_projects_block_delete_with_activity
  before delete on public.projects
  for each row execute function public.kb_projects_block_delete_with_activity();
