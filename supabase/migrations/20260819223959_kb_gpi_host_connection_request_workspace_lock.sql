create or replace function public.gpi_host_list_connection_requests(
  p_organization_id uuid,
  p_queue text default 'active',
  p_limit integer default 60
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_profile_id uuid:=auth.uid();
  v_queue text:=lower(btrim(coalesce(p_queue,'active')));
  v_limit integer:=greatest(1,least(coalesce(p_limit,60),100));
  v_result jsonb;
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  if not public.gpi_host_has_organization_role(p_organization_id,array['admin','editor']::text[]) then
    raise exception 'not authorized for organization' using errcode='42501';
  end if;
  if v_queue not in ('active','new','awaiting_seeker','closed','all') then
    raise exception 'Unknown connection request queue' using errcode='22023';
  end if;

  with visible as (
    select q.*,o.title as opportunity_title,o.goal,o.schedule_type,x.starts_at as occurrence_starts_at
    from public.gpi_connection_requests q
    join public.gpi_opportunities o on o.id=q.opportunity_id
    left join public.gpi_opportunity_occurrences x on x.id=q.occurrence_id
    where o.organization_id=p_organization_id
      and q.status <> 'pending_verification'
      and q.status <> 'verification_expired'
  ), filtered as (
    select * from visible
    where v_queue='all'
      or (v_queue='active' and status in ('submitted','notified','next_step_provided'))
      or (v_queue='new' and status in ('submitted','notified'))
      or (v_queue='awaiting_seeker' and status='next_step_provided')
      or (v_queue='closed' and status in ('notification_failed','declined','unavailable','org_no_response','request_invalidated','seeker_confirmed','seeker_did_not_connect','seeker_no_confirmation'))
  )
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'active_count',(select count(*)::integer from visible where status in ('submitted','notified','next_step_provided')),
      'new_count',(select count(*)::integer from visible where status in ('submitted','notified')),
      'awaiting_seeker_count',(select count(*)::integer from visible where status='next_step_provided'),
      'closed_count',(select count(*)::integer from visible where status in ('notification_failed','declined','unavailable','org_no_response','request_invalidated','seeker_confirmed','seeker_did_not_connect','seeker_no_confirmation'))
    ),
    'requests',coalesce((
      select jsonb_agg(jsonb_build_object(
        'request_id',f.id,
        'opportunity_id',f.opportunity_id,
        'opportunity_title',f.opportunity_title,
        'goal',f.goal,
        'schedule_type',f.schedule_type,
        'occurrence_id',f.occurrence_id,
        'occurrence_starts_at',f.occurrence_starts_at,
        'status',f.status,
        'submitted_at',f.submitted_at,
        'notified_at',f.notified_at,
        'org_responded_at',f.org_responded_at,
        'next_step_provided_at',f.next_step_provided_at,
        'response_due_at',f.response_due_at,
        'outcome_due_at',f.outcome_due_at,
        'closed_at',f.closed_at,
        'close_reason',f.close_reason,
        'seeker_contact_available',(f.contact_release_authorized_at is not null),
        'seeker_email',case when f.contact_release_authorized_at is not null then f.seeker_email else null end,
        'created_at',f.created_at,
        'updated_at',f.updated_at
      ) order by coalesce(f.submitted_at,f.created_at) desc,f.id desc)
      from (select * from filtered order by coalesce(submitted_at,created_at) desc,id desc limit v_limit) f
    ),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.gpi_host_get_connection_request(p_request_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_profile_id uuid:=auth.uid();
  v_result jsonb;
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;

  select jsonb_build_object(
    'request',jsonb_build_object(
      'request_id',q.id,'status',q.status,'opportunity_id',q.opportunity_id,'opportunity_title',o.title,
      'organization_id',o.organization_id,'organization_name',org.name,'goal',o.goal,'schedule_type',o.schedule_type,
      'occurrence_id',q.occurrence_id,'occurrence_starts_at',x.starts_at,'occurrence_ends_at',x.ends_at,
      'submitted_at',q.submitted_at,'notified_at',q.notified_at,'org_responded_at',q.org_responded_at,
      'next_step_provided_at',q.next_step_provided_at,'response_due_at',q.response_due_at,'outcome_due_at',q.outcome_due_at,
      'closed_at',q.closed_at,'close_reason',q.close_reason,'created_at',q.created_at,'updated_at',q.updated_at,
      'seeker_contact_available',(q.contact_release_authorized_at is not null),
      'seeker_email',case when q.contact_release_authorized_at is not null then q.seeker_email else null end
    ),
    'confirmations',coalesce((
      select jsonb_agg(jsonb_build_object(
        'confirmation_type',c.confirmation_type,
        'prompt',c.prompt_snapshot,
        'age_min',c.age_min_snapshot,
        'age_max',c.age_max_snapshot,
        'affirmed_at',c.affirmed_at
      ) order by c.affirmed_at,c.id)
      from public.gpi_connection_request_confirmations c where c.connection_request_id=q.id
    ),'[]'::jsonb),
    'process_requirements',jsonb_build_object(
      'background_check',o.requires_background_check,
      'orientation',o.requires_orientation,
      'application',o.requires_application,
      'membership',o.requires_membership
    ),
    'next_step',(
      select case when n.connection_request_id is null then null else jsonb_build_object('instructions',n.instructions,'created_at',n.created_at,'updated_at',n.updated_at) end
      from public.gpi_connection_request_next_steps n where n.connection_request_id=q.id
    )
  ) into v_result
  from public.gpi_connection_requests q
  join public.gpi_opportunities o on o.id=q.opportunity_id
  join public.gpi_organizations org on org.id=o.organization_id
  join public.gpi_organization_members m on m.organization_id=o.organization_id and m.profile_id=v_profile_id and m.active and m.role in ('admin','editor')
  left join public.gpi_opportunity_occurrences x on x.id=q.occurrence_id
  where q.id=p_request_id
    and q.status not in ('pending_verification','verification_expired');

  if v_result is null then raise exception 'not authorized for connection request' using errcode='42501'; end if;
  return v_result;
end;
$$;

create or replace function public.gpi_host_mark_connection_request_seen(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  v_profile_id uuid:=auth.uid();
  v_request public.gpi_connection_requests%rowtype;
  v_now timestamptz:=now();
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  select q.* into v_request
  from public.gpi_connection_requests q
  join public.gpi_opportunities o on o.id=q.opportunity_id
  join public.gpi_organization_members m on m.organization_id=o.organization_id and m.profile_id=v_profile_id and m.active and m.role in ('admin','editor')
  where q.id=p_request_id for update of q;
  if not found then raise exception 'not authorized for connection request' using errcode='42501'; end if;

  if v_request.status='submitted' then
    update public.gpi_connection_requests
       set status='notified',notified_at=v_now,response_due_at=v_now+interval '72 hours'
     where id=v_request.id;
    update public.gpi_notification_deliveries
       set status='failed',next_attempt_at=null,last_error_code='handled_in_workspace'
     where connection_request_id=v_request.id and notification_type='org_request' and status in ('pending','sending');
    update public.gpi_action_tokens set revoked_at=v_now
     where connection_request_id=v_request.id and purpose='org_response' and revoked_at is null;
    update public.gpi_action_sessions set revoked_at=v_now
     where connection_request_id=v_request.id and purpose='org_response' and revoked_at is null;
    return 'notified';
  end if;
  if v_request.status in ('notified','next_step_provided','declined','unavailable','org_no_response','notification_failed','request_invalidated','seeker_confirmed','seeker_did_not_connect','seeker_no_confirmation') then
    return v_request.status;
  end if;
  raise exception 'Request is not available to the organization' using errcode='23514';
end;
$$;

create or replace function public.gpi_host_respond_to_connection_request(
  p_request_id uuid,
  p_response text,
  p_next_step_instructions text default null
)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  v_profile_id uuid:=auth.uid();
  v_request public.gpi_connection_requests%rowtype;
  v_response text:=lower(btrim(coalesce(p_response,'')));
  v_instructions text:=case when p_next_step_instructions is null then null else btrim(p_next_step_instructions) end;
  v_now timestamptz:=now();
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  if v_response not in ('next_step_provided','declined','unavailable') then raise exception 'Unknown organization response' using errcode='22023'; end if;

  select q.* into v_request
  from public.gpi_connection_requests q
  join public.gpi_opportunities o on o.id=q.opportunity_id
  join public.gpi_organization_members m on m.organization_id=o.organization_id and m.profile_id=v_profile_id and m.active and m.role in ('admin','editor')
  where q.id=p_request_id for update of q;
  if not found then raise exception 'not authorized for connection request' using errcode='42501'; end if;

  if v_request.status=v_response then return v_request.status; end if;
  if v_request.status<>'notified' or v_request.response_due_at is null or v_request.response_due_at<=v_now then
    raise exception 'Request is no longer awaiting an organization response' using errcode='23514';
  end if;

  if v_response='next_step_provided' then
    if v_instructions is null or char_length(v_instructions) not between 10 and 4000 then
      raise exception 'Next-step instructions must contain 10 to 4000 trimmed characters' using errcode='22023';
    end if;
    update public.gpi_connection_requests
       set status='next_step_provided',org_responded_at=v_now,next_step_provided_at=v_now,
           contact_release_authorized_at=v_now,private_details_release_authorized_at=v_now,
           outcome_due_at=v_now+interval '14 days'
     where id=v_request.id;
    insert into public.gpi_connection_request_next_steps(connection_request_id,instructions,created_at,updated_at)
    values(v_request.id,v_instructions,v_now,v_now)
    on conflict(connection_request_id) do update set instructions=excluded.instructions,updated_at=excluded.updated_at;
    insert into public.gpi_notification_deliveries(connection_request_id,notification_type,idempotency_key,status,next_attempt_at)
    values(v_request.id,'seeker_outcome','seeker_outcome/'||v_request.id::text,'pending',v_now)
    on conflict(idempotency_key) do nothing;
  else
    if v_instructions is not null and v_instructions<>'' then raise exception 'Negative responses cannot include next-step instructions' using errcode='22023'; end if;
    update public.gpi_connection_requests
       set status=v_response,org_responded_at=v_now,closed_at=v_now,
           close_reason=case v_response when 'declined' then 'organization_declined' else 'opportunity_unavailable' end
     where id=v_request.id;
  end if;

  update public.gpi_action_tokens set revoked_at=v_now
   where connection_request_id=v_request.id and purpose='org_response' and revoked_at is null;
  update public.gpi_action_sessions set revoked_at=v_now
   where connection_request_id=v_request.id and purpose='org_response' and revoked_at is null;
  return v_response;
end;
$$;

create or replace function public.gpi_admin_list_action_queue_v2(p_queue_key text default null,p_limit integer default 75)
returns table(queue_key text,priority integer,severity text,entity_type text,entity_id uuid,related_organization_id uuid,organization_name text,title text,current_status text,reason text,recommended_action text,action_function text,due_at timestamptz,last_activity_at timestamptz,payload jsonb)
language plpgsql
stable
security definer
set search_path=''
as $$
declare v_admin_id uuid:=auth.uid();
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then raise exception 'not authorized' using errcode='42501'; end if;
  return query
  select q.queue_key,q.priority,q.severity,q.entity_type,q.entity_id,q.related_organization_id,q.organization_name,q.title,q.current_status,q.reason,q.recommended_action,q.action_function,q.due_at,q.last_activity_at,q.payload
  from public.gpi_admin_list_action_queue(p_queue_key,p_limit) q
  where not (q.queue_key='opportunity_needs_review' and q.current_status='draft')
    and not (q.queue_key='notification_delivery_attention' and coalesce(q.payload->>'last_error_code','')='handled_in_workspace');
end;
$$;

revoke all on function public.gpi_host_list_connection_requests(uuid,text,integer) from public,anon;
revoke all on function public.gpi_host_get_connection_request(uuid) from public,anon;
revoke all on function public.gpi_host_mark_connection_request_seen(uuid) from public,anon;
revoke all on function public.gpi_host_respond_to_connection_request(uuid,text,text) from public,anon;
grant execute on function public.gpi_host_list_connection_requests(uuid,text,integer) to authenticated,service_role;
grant execute on function public.gpi_host_get_connection_request(uuid) to authenticated,service_role;
grant execute on function public.gpi_host_mark_connection_request_seen(uuid) to authenticated,service_role;
grant execute on function public.gpi_host_respond_to_connection_request(uuid,text,text) to authenticated,service_role;
