
create or replace function public.kb_admin_prepare_external_help_workspace(
  p_workspace uuid,
  p_concierge_organization uuid default null,
  p_organization_name text default null,
  p_mark_pilot boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_link private.faithbid_workspace_links%rowtype;
  v_org concierge_ops.organizations%rowtype;
  v_workspace_name text;
  v_workspace_profile_id uuid;
  v_workspace_city text;
  v_mark_pilot boolean := coalesce(p_mark_pilot, false);
begin
  if auth.uid() is null or not public.kb_is_platform_admin() then
    raise exception using errcode = '42501', message = 'Platform administrator access is required';
  end if;

  if not exists (select 1 from public.profiles p where p.id = auth.uid()) then
    raise exception using errcode = '55000', message = 'Platform administrator profile is required for Concierge ownership';
  end if;

  select w.name, w.created_by, nullif(btrim(p.city), '')
    into v_workspace_name, v_workspace_profile_id, v_workspace_city
  from toolkit_core.workspaces w
  left join public.profiles p on p.id = w.created_by
  where w.id = p_workspace;

  if not found then
    raise exception using errcode = 'P0002', message = 'Church OS workspace not found';
  end if;

  select *
    into v_link
  from private.faithbid_workspace_links
  where workspace_id = p_workspace
  for update;

  if found and v_link.link_status = 'active' then
    if p_concierge_organization is not null
       and p_concierge_organization <> v_link.concierge_organization_id then
      raise exception using errcode = '23505',
        message = 'This workspace is already linked to a different Concierge organization';
    end if;

    select *
      into v_org
    from concierge_ops.organizations
    where id = v_link.concierge_organization_id
      and archived_at is null
      and lifecycle_stage = 'active'
      and organization_type in ('church','ministry');

    if not found then
      raise exception using errcode = '55000',
        message = 'The existing workspace link points to an unavailable Concierge organization';
    end if;

    if v_mark_pilot and not v_org.pilot_cohort then
      update concierge_ops.organizations
      set pilot_cohort = true,
          pilot_cohort_entered_at = now(),
          pilot_cohort_entry_source = 'other',
          pilot_cohort_entry_reference = 'church_os_workspace:' || p_workspace::text,
          pilot_cohort_recorded_by = auth.uid()
      where id = v_org.id
      returning * into v_org;
    end if;

    return jsonb_build_object(
      'workspace_id', v_link.workspace_id,
      'concierge_organization_id', v_link.concierge_organization_id,
      'link_status', v_link.link_status,
      'link_basis', v_link.link_basis,
      'pilot_cohort', v_org.pilot_cohort
    );
  end if;

  if p_concierge_organization is not null then
    select *
      into v_org
    from concierge_ops.organizations
    where id = p_concierge_organization
      and archived_at is null
      and lifecycle_stage = 'active'
      and organization_type in ('church','ministry');

    if not found then
      raise exception using errcode = '22023',
        message = 'Supplied Concierge organization must be an active, non-archived church or ministry';
    end if;
  elsif v_workspace_profile_id is not null then
    select *
      into v_org
    from concierge_ops.organizations
    where platform_profile_id = v_workspace_profile_id
    limit 1;

    if found and (
      v_org.archived_at is not null
      or v_org.lifecycle_stage <> 'active'
      or v_org.organization_type not in ('church','ministry')
    ) then
      raise exception using errcode = '55000',
        message = 'The FaithBid church profile is already attached to a Concierge organization that is not available for External Help';
    end if;
  end if;

  if v_org.id is null then
    if v_workspace_city is null then
      raise exception using errcode = '55000',
        message = 'A church city is required before creating an active Concierge organization';
    end if;

    insert into concierge_ops.organizations (
      organization_name,
      organization_type,
      lifecycle_stage,
      pilot_cohort,
      relationship_source,
      relationship_summary,
      relationship_owner_id,
      city,
      next_follow_up_on,
      platform_profile_id,
      pilot_cohort_entered_at,
      pilot_cohort_entry_source,
      pilot_cohort_entry_reference,
      pilot_cohort_recorded_by
    ) values (
      coalesce(nullif(btrim(p_organization_name), ''), v_workspace_name),
      'church',
      'active',
      v_mark_pilot,
      'other',
      'Created from Church OS External Help workspace preparation',
      auth.uid(),
      v_workspace_city,
      current_date,
      v_workspace_profile_id,
      case when v_mark_pilot then now() else null end,
      case when v_mark_pilot then 'other' else null end,
      case when v_mark_pilot then 'church_os_workspace:' || p_workspace::text else null end,
      case when v_mark_pilot then auth.uid() else null end
    )
    returning * into v_org;
  elsif v_mark_pilot and not v_org.pilot_cohort then
    update concierge_ops.organizations
    set pilot_cohort = true,
        pilot_cohort_entered_at = now(),
        pilot_cohort_entry_source = 'other',
        pilot_cohort_entry_reference = 'church_os_workspace:' || p_workspace::text,
        pilot_cohort_recorded_by = auth.uid()
    where id = v_org.id
    returning * into v_org;
  end if;

  if exists (
    select 1
    from private.faithbid_workspace_links l
    where l.concierge_organization_id = v_org.id
      and l.workspace_id <> p_workspace
  ) then
    raise exception using errcode = '23505',
      message = 'This Concierge organization is already linked to another Church OS workspace';
  end if;

  insert into private.faithbid_workspace_links (
    workspace_id,
    concierge_organization_id,
    link_status,
    link_basis,
    linked_by
  ) values (
    p_workspace,
    v_org.id,
    'active',
    'external_help_prepared',
    auth.uid()
  )
  on conflict (workspace_id) do update
  set concierge_organization_id = excluded.concierge_organization_id,
      link_status = 'active',
      link_basis = 'external_help_prepared',
      linked_by = auth.uid(),
      updated_at = now()
  returning * into v_link;

  return jsonb_build_object(
    'workspace_id', v_link.workspace_id,
    'concierge_organization_id', v_link.concierge_organization_id,
    'link_status', v_link.link_status,
    'link_basis', v_link.link_basis,
    'pilot_cohort', v_org.pilot_cohort
  );
end;
$function$;

revoke execute on function public.kb_admin_prepare_external_help_workspace(uuid,uuid,text,boolean)
  from public, anon, service_role;
grant execute on function public.kb_admin_prepare_external_help_workspace(uuid,uuid,text,boolean)
  to authenticated;
