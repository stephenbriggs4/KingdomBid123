create or replace function public.gpi_admin_get_organization_verification_readiness(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_admin_id uuid := auth.uid();
  v_org public.gpi_organizations%rowtype;
  v_endpoint public.gpi_organization_notification_endpoints%rowtype;
  v_has_primary boolean := false;
  v_primary_verified boolean := false;
  v_missing jsonb := '[]'::jsonb;
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then
    raise exception 'not authorized' using errcode='42501';
  end if;

  select * into v_org
  from public.gpi_organizations
  where id=p_organization_id;
  if not found then raise exception 'Organization not found' using errcode='P0002'; end if;

  select * into v_endpoint
  from public.gpi_organization_notification_endpoints
  where organization_id=p_organization_id and is_primary
  order by created_at desc
  limit 1;
  v_has_primary := found;
  v_primary_verified := v_has_primary and v_endpoint.status='verified';

  if not v_has_primary then
    v_missing := v_missing || jsonb_build_array('A primary organization contact email is required.');
  elsif not v_primary_verified then
    v_missing := v_missing || jsonb_build_array('Verify the primary organization contact email.');
  end if;
  if v_org.status='draft' and v_org.verification_revoked_at is not null then
    v_missing := v_missing || jsonb_build_array('Verification was previously revoked and cannot be restored through the initial verification action.');
  end if;
  if v_org.status='closed' then
    v_missing := v_missing || jsonb_build_array('Closed organizations cannot be verified or receive a new trusted contact route.');
  end if;

  return jsonb_build_object(
    'organization_id',v_org.id,
    'organization_status',v_org.status,
    'verified_at',v_org.verified_at,
    'verification_revoked_at',v_org.verification_revoked_at,
    'suspended_at',v_org.suspended_at,
    'suspension_reason',v_org.suspension_reason,
    'has_primary_endpoint',v_has_primary,
    'primary_endpoint_id',case when v_has_primary then v_endpoint.id else null end,
    'primary_endpoint_email',case when v_has_primary then v_endpoint.destination_email else null end,
    'primary_endpoint_status',case when v_has_primary then v_endpoint.status else null end,
    'primary_endpoint_verified_at',case when v_has_primary then v_endpoint.verified_at else null end,
    'primary_endpoint_verified',v_primary_verified,
    'can_verify_primary_endpoint',v_has_primary and not v_primary_verified and v_org.status <> 'closed',
    'can_verify_organization',v_org.status='draft' and v_org.verification_revoked_at is null and v_primary_verified,
    'can_suspend',v_org.status='verified',
    'can_reinstate',v_org.status='suspended' and v_org.verification_revoked_at is null,
    'can_revoke_verification',v_org.status='verified',
    'can_close',v_org.status <> 'closed',
    'missing',v_missing
  );
end;
$function$;

create or replace function public.gpi_admin_verify_primary_endpoint(p_organization_id uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_admin_id uuid := auth.uid();
  v_reason text := nullif(btrim(coalesce(p_reason,'')), '');
  v_org_status text;
  v_endpoint public.gpi_organization_notification_endpoints%rowtype;
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  if v_reason is null or char_length(v_reason) < 5 or char_length(v_reason) > 1000 then
    raise exception 'Verification evidence note must contain 5 to 1000 characters' using errcode='22023';
  end if;

  select status into v_org_status
  from public.gpi_organizations
  where id=p_organization_id
  for update;
  if not found then raise exception 'Organization not found' using errcode='P0002'; end if;
  if v_org_status='closed' then
    raise exception 'Closed organization cannot receive a verified contact route' using errcode='23514';
  end if;

  select * into v_endpoint
  from public.gpi_organization_notification_endpoints
  where organization_id=p_organization_id and is_primary
  order by created_at desc
  limit 1
  for update;
  if not found then
    raise exception 'Primary organization contact endpoint is required' using errcode='23514';
  end if;
  if v_endpoint.status='verified' then return v_endpoint.id; end if;
  if v_endpoint.status <> 'pending_verification' then
    raise exception 'Primary organization contact endpoint is not eligible for verification' using errcode='23514';
  end if;

  update public.gpi_organization_notification_endpoints
     set status='verified', verified_at=now(), verified_by_profile_id=v_admin_id
   where id=v_endpoint.id;

  insert into public.admin_audit_log(
    admin_id,action,target_table,target_id,reason,before_snapshot,after_snapshot,meta
  ) values (
    v_admin_id,'gpi_verify_primary_notification_endpoint','gpi_organization_notification_endpoints',v_endpoint.id::text,v_reason,
    jsonb_build_object('organization_id',p_organization_id,'status',v_endpoint.status,'is_primary',v_endpoint.is_primary),
    jsonb_build_object('organization_id',p_organization_id,'status','verified','is_primary',true),
    jsonb_build_object('source','gpi_admin_verify_primary_endpoint','destination_email_excluded',true)
  );
  return v_endpoint.id;
end;
$function$;

create or replace function public.gpi_admin_verify_organization(p_organization_id uuid)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_admin_id uuid := auth.uid();
  v_before public.gpi_organizations%rowtype;
  v_after public.gpi_organizations%rowtype;
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then raise exception 'not authorized' using errcode = '42501'; end if;
  select * into v_before from public.gpi_organizations where id = p_organization_id for update;
  if not found then raise exception 'Organization not found' using errcode = 'P0002'; end if;
  if v_before.status = 'verified' then return 'verified'; end if;
  if v_before.status <> 'draft' then raise exception 'Only a draft organization can be initially verified' using errcode = '23514'; end if;
  if v_before.verification_revoked_at is not null then raise exception 'Revoked organization requires a new review workflow before verification' using errcode = '23514'; end if;
  if not exists (
    select 1 from public.gpi_organization_notification_endpoints e
    where e.organization_id=p_organization_id and e.is_primary and e.status='verified'
  ) then
    raise exception 'A verified primary organization contact endpoint is required before organization verification' using errcode='23514';
  end if;

  update public.gpi_organizations
     set status = 'verified', verified_at = now(), verified_by_profile_id = v_admin_id
   where id = p_organization_id
   returning * into v_after;

  insert into public.admin_audit_log(admin_id, action, target_table, target_id, reason, before_snapshot, after_snapshot, meta)
  values (v_admin_id, 'gpi_verify_organization', 'gpi_organizations', p_organization_id::text, null,
    jsonb_build_object('status', v_before.status),
    jsonb_build_object('status', v_after.status, 'verified_at', v_after.verified_at),
    jsonb_build_object('source', 'gpi_admin_verify_organization','verified_primary_endpoint_required',true));
  return v_after.status;
end;
$function$;

revoke all on function public.gpi_admin_get_organization_verification_readiness(uuid) from public, anon;
revoke all on function public.gpi_admin_verify_primary_endpoint(uuid,text) from public, anon;
grant execute on function public.gpi_admin_get_organization_verification_readiness(uuid) to authenticated;
grant execute on function public.gpi_admin_verify_primary_endpoint(uuid,text) to authenticated;
