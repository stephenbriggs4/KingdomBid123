create or replace function public.marketplace_publish_project(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_project public.projects%rowtype;
  v_is_admin boolean := false;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  v_is_admin := public.kb_is_platform_admin();

  select *
  into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Project not found' using errcode = 'P0002';
  end if;

  if v_project.church_id is distinct from v_uid and not v_is_admin then
    raise exception 'Only the project owner or a platform admin can publish this project'
      using errcode = '42501';
  end if;

  if v_project.status = 'open' then
    return to_jsonb(v_project);
  end if;

  if v_project.status is null or v_project.status not in ('draft', 'review') then
    raise exception 'Only draft or review projects can be published'
      using errcode = '23514';
  end if;

  if length(trim(coalesce(v_project.title, ''))) < 5 then
    raise exception 'Project title must contain at least 5 characters'
      using errcode = '23514';
  end if;

  if length(trim(coalesce(v_project.description, ''))) < 20 then
    raise exception 'Project description must contain at least 20 characters'
      using errcode = '23514';
  end if;

  if nullif(trim(coalesce(v_project.primary_category, v_project.category, '')), '') is null then
    raise exception 'Project category is required'
      using errcode = '23514';
  end if;

  if nullif(trim(coalesce(v_project.budget, '')), '') is null
     and coalesce(v_project.budget_min, 0) <= 0
     and coalesce(v_project.budget_max, 0) <= 0 then
    raise exception 'Project budget or budget range is required'
      using errcode = '23514';
  end if;

  if coalesce(v_project.delivery_preference, 'either') <> 'remote'
     and nullif(trim(coalesce(v_project.project_city, v_project.city, '')), '') is null then
    raise exception 'Project city or service area is required'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.projects existing
    where existing.id <> v_project.id
      and existing.church_id = v_project.church_id
      and lower(trim(coalesce(existing.title, ''))) = lower(trim(v_project.title))
      and existing.status = 'open'
      and coalesce(existing.posted_at, now()) >= now() - interval '90 days'
  ) then
    raise exception 'A matching open project was already published recently'
      using errcode = '23505';
  end if;

  update public.projects
  set status = 'open',
      posted_at = now()
  where id = v_project.id
  returning * into v_project;

  return to_jsonb(v_project);
end
$function$;

revoke execute on function public.marketplace_publish_project(uuid) from public;
revoke execute on function public.marketplace_publish_project(uuid) from anon;
grant execute on function public.marketplace_publish_project(uuid) to authenticated;
grant execute on function public.marketplace_publish_project(uuid) to service_role;
