
-- FaithBid Prelaunch Beta Access Blueprint v1.5
-- Section 13, Step 14: server-enforced project removal/restoration with audit.

create or replace function public.marketplace_admin_moderate_project(
  p_project_id uuid,
  p_action text,
  p_reason text
)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_action text := lower(btrim(coalesce(p_action,'')));
  v_reason text := btrim(coalesce(p_reason,''));
  v_before public.projects%rowtype;
  v_after public.projects%rowtype;
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then
    raise exception using errcode='42501', message='Platform admin access is required.';
  end if;
  if char_length(v_reason) < 5 or char_length(v_reason) > 500 then
    raise exception using errcode='22023', message='A moderation reason between 5 and 500 characters is required.';
  end if;

  select p.* into v_before from public.projects p where p.id=p_project_id for update;
  if not found then raise exception using errcode='P0002', message='Project not found.'; end if;

  if v_action='remove' then
    if lower(coalesce(v_before.status,'')) <> 'open' then
      raise exception using errcode='P0001', message='Only an open project can be removed.';
    end if;
    update public.projects set status='removed' where id=v_before.id returning * into v_after;
  elsif v_action='restore' then
    if lower(coalesce(v_before.status,'')) <> 'removed' then
      raise exception using errcode='P0001', message='Only a removed project can be restored.';
    end if;
    if char_length(btrim(coalesce(v_before.title,''))) < 5
       or char_length(btrim(coalesce(v_before.description,''))) < 20
       or btrim(coalesce(v_before.category,''))=''
       or (btrim(coalesce(v_before.budget,''))='' and coalesce(v_before.budget_min,0)<=0 and coalesce(v_before.budget_max,0)<=0)
       or (lower(coalesce(v_before.delivery_preference,'')) <> 'remote' and btrim(coalesce(v_before.project_city,v_before.city,''))='') then
      raise exception using errcode='23514', message='Project no longer meets publish requirements.';
    end if;
    if exists(
      select 1 from public.projects p
      where p.id<>v_before.id and p.church_id=v_before.church_id and p.status='open'
        and lower(btrim(p.title))=lower(btrim(v_before.title))
        and coalesce(p.posted_at,now()) >= now()-interval '90 days'
    ) then
      raise exception using errcode='23505', message='A matching open project already exists.';
    end if;
    update public.projects set status='open',posted_at=coalesce(posted_at,now())
    where id=v_before.id returning * into v_after;
  else
    raise exception using errcode='22023', message='Unsupported moderation action.';
  end if;

  insert into public.admin_audit_log(
    admin_id,action,target_table,target_id,reason,before_snapshot,after_snapshot,meta
  ) values (
    v_admin_id,'project_'||v_action,'projects',v_before.id::text,v_reason,
    to_jsonb(v_before),to_jsonb(v_after),jsonb_build_object('source','marketplace_admin_moderate_project')
  );

  return v_after;
end;
$$;

revoke all on function public.marketplace_admin_moderate_project(uuid,text,text) from public, anon;
grant execute on function public.marketplace_admin_moderate_project(uuid,text,text) to authenticated, service_role;
