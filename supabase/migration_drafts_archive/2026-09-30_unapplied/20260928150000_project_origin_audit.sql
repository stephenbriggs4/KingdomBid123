-- R-32: classifying a project as real / qa (Test) / synthetic (Demo) / unclassified
-- now requires a reason and leaves an audit-log entry. Same signature and return type.
create or replace function public.kb_admin_set_project_record_origin_v0(
  p_project_id uuid,
  p_record_origin text,
  p_reason text default null
) returns public.projects
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_origin text := lower(trim(coalesce(p_record_origin, '')));
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_before text;
  v_project public.projects;
begin
  if not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'Project provenance requires platform administrator access'
      using errcode = '42501';
  end if;

  if v_origin not in ('real', 'synthetic', 'qa', 'unclassified') then
    raise exception 'Invalid project record origin'
      using errcode = '22023';
  end if;

  if v_reason is null or char_length(v_reason) < 5 then
    raise exception 'A reason of at least 5 characters is required'
      using errcode = '22023';
  end if;

  select record_origin into v_before from public.projects where id = p_project_id;
  if not found then
    raise exception 'Project not found' using errcode = 'P0002';
  end if;

  update public.projects
     set record_origin = v_origin
   where id = p_project_id
   returning * into v_project;

  insert into public.admin_audit_log (admin_id, action, target_table, target_id, reason, before_snapshot, after_snapshot)
  values (
    (select auth.uid()),
    'set_project_record_origin',
    'projects',
    p_project_id::text,
    v_reason,
    jsonb_build_object('record_origin', v_before),
    jsonb_build_object('record_origin', v_origin)
  );

  return v_project;
end;
$$;
