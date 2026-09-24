-- Owners can update their own project rows, but publishing (status -> 'open') must go through
-- marketplace_publish_project so its checks (private prelaunch, title/description/budget/location) run.
-- The RPC is SECURITY DEFINER, so its writes run as the function owner, not as 'authenticated'.
create or replace function public.kb_projects_block_direct_publish()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'open'
     and old.status is distinct from 'open'
     and current_user = 'authenticated'
     and not public.kb_is_platform_admin() then
    raise exception 'Projects can only be published through the publish action.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists kb_projects_block_direct_publish on public.projects;
create trigger kb_projects_block_direct_publish
  before update of status on public.projects
  for each row execute function public.kb_projects_block_direct_publish();
