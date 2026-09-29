create or replace function public.gpi_admin_get_organization_workspace(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_admin_id uuid:=auth.uid();
  v_payload jsonb;
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  select jsonb_build_object(
    'organization', to_jsonb(org),
    'notification_endpoints', coalesce((
      select jsonb_agg(to_jsonb(e) order by e.is_primary desc,e.created_at desc)
      from public.gpi_organization_notification_endpoints e
      where e.organization_id=org.id
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'membership_id',m.id,
        'profile_id',m.profile_id,
        'membership_role',m.role,
        'active',m.active,
        'profile_email',p.email,
        'marketplace_role',p.role,
        'profile_org_name',p.org_name,
        'created_at',m.created_at,
        'updated_at',m.updated_at
      ) order by m.active desc, m.role asc, p.email asc)
      from public.gpi_organization_members m
      join public.profiles p on p.id=m.profile_id
      where m.organization_id=org.id
    ), '[]'::jsonb),
    'host_access_requests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'request_id',r.id,
        'requester_profile_id',r.requester_profile_id,
        'requester_email',p.email,
        'requester_role',p.role,
        'requester_org_name',p.org_name,
        'requested_role',r.requested_role,
        'status',r.status,
        'request_message',r.request_message,
        'organization_contact_email',r.organization_contact_email,
        'created_at',r.created_at,
        'reviewed_at',r.reviewed_at,
        'decision_reason',r.decision_reason
      ) order by r.created_at desc)
      from public.gpi_organization_access_requests r
      join public.profiles p on p.id=r.requester_profile_id
      where r.organization_id=org.id
    ), '[]'::jsonb),
    'opportunities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',o.id,'title',o.title,'status',o.status,'goal',o.goal,
        'schedule_type',o.schedule_type,'commitment_type',o.commitment_type,
        'last_confirmed_at',o.last_confirmed_at,
        'content_revision',o.content_revision,
        'reviewed_revision',o.reviewed_revision,
        'is_public_eligible',public.gpi_is_public_eligible(o.id),
        'created_at',o.created_at,'updated_at',o.updated_at
      ) order by o.updated_at desc)
      from public.gpi_opportunities o where o.organization_id=org.id
    ), '[]'::jsonb),
    'request_counts', coalesce((
      select jsonb_object_agg(status,row_count order by status)
      from (
        select q.status,count(*)::integer as row_count
        from public.gpi_connection_requests q
        join public.gpi_opportunities o on o.id=q.opportunity_id
        where o.organization_id=org.id
        group by q.status
      ) s
    ), '{}'::jsonb)
  ) into v_payload
  from public.gpi_organizations org
  where org.id=p_organization_id;
  if v_payload is null then
    raise exception 'Organization not found' using errcode='P0002';
  end if;
  return v_payload;
end;
$function$;
