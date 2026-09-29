create or replace function public.gpi_lock_connection_request_seeker_identity()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_email text;
  v_confirmed boolean := false;
begin
  if tg_op='UPDATE' and new.seeker_profile_id is distinct from old.seeker_profile_id then
    if old.seeker_profile_id is null and new.seeker_profile_id is not null then
      select lower(u.email), (u.email_confirmed_at is not null)
        into v_email, v_confirmed
      from auth.users u
      join public.profiles p on p.id=u.id
      where u.id=new.seeker_profile_id;

      if not found
         or not v_confirmed
         or old.seeker_email is null
         or v_email is distinct from lower(old.seeker_email) then
        raise exception 'Seeker profile linkage does not match the confirmed FaithBid email' using errcode='42501';
      end if;
    else
      raise exception 'Seeker profile linkage is immutable' using errcode='42501';
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.gpi_service_submit_connection_request_v2(
  p_opportunity_id uuid,
  p_occurrence_id uuid,
  p_normalized_email text,
  p_email_fingerprint bytea,
  p_fingerprint_key_version smallint,
  p_consent_accepted boolean,
  p_participant_requirement_ids uuid[],
  p_age_range_affirmed boolean,
  p_process_opt_outs text[],
  p_seeker_profile_id uuid default null::uuid
)
returns table(request_id uuid, request_status text, deduplicated boolean)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_request_id uuid;
  v_policy text;
  v_required integer;
  v_affirmed integer;
  v_min smallint;
  v_max smallint;
  v_bg boolean;
  v_orient boolean;
  v_apply boolean;
  v_member boolean;
  v_opt text[]:=coalesce(p_process_opt_outs,'{}'::text[]);
  v_req uuid[]:=coalesce(p_participant_requirement_ids,'{}'::uuid[]);
  v_profile_email text;
  v_profile_email_confirmed boolean:=false;
  v_endpoint uuid;
  v_now timestamptz:=now();
  v_existing public.gpi_connection_requests%rowtype;
  v_existing_eligible boolean:=false;
begin
  if not coalesce(p_consent_accepted,false) then
    raise exception 'Current contact consent is required' using errcode='22023';
  end if;
  if p_opportunity_id is null or p_normalized_email is null
     or p_email_fingerprint is null or octet_length(p_email_fingerprint)<>32
     or p_fingerprint_key_version is null or p_fingerprint_key_version<1 then
    raise exception 'Trusted submission fields are missing or invalid' using errcode='22023';
  end if;
  if p_normalized_email<>lower(btrim(p_normalized_email)) then
    raise exception 'Normalized email is required' using errcode='22023';
  end if;

  if p_seeker_profile_id is not null then
    select lower(u.email),(u.email_confirmed_at is not null)
      into v_profile_email,v_profile_email_confirmed
    from auth.users u
    join public.profiles p on p.id=u.id
    where u.id=p_seeker_profile_id;
    if not found or not v_profile_email_confirmed or v_profile_email is distinct from p_normalized_email then
      raise exception 'Authenticated seeker identity does not match the confirmed FaithBid email' using errcode='42501';
    end if;
  end if;

  if exists(select 1 from unnest(v_opt) o(value) where value not in ('background_check','orientation','application','membership')) then
    raise exception 'Unknown process requirement opt-out' using errcode='22023';
  end if;

  select min_age,max_age,requires_background_check,requires_orientation,requires_application,requires_membership
    into v_min,v_max,v_bg,v_orient,v_apply,v_member
  from public.gpi_opportunities
  where id=p_opportunity_id;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;

  if (v_bg and 'background_check'=any(v_opt))
     or (v_orient and 'orientation'=any(v_opt))
     or (v_apply and 'application'=any(v_opt))
     or (v_member and 'membership'=any(v_opt)) then
    raise exception 'A required process was declined' using errcode='23514';
  end if;

  select count(*) into v_required
  from public.gpi_opportunity_participant_audiences
  where opportunity_id=p_opportunity_id and treatment='confirmation_required';

  select count(distinct id) into v_affirmed from unnest(v_req) r(id);
  if v_affirmed<>v_required or exists(
    select 1 from unnest(v_req) r(id)
    where not exists(
      select 1
      from public.gpi_opportunity_participant_audiences a
      where a.id=r.id and a.opportunity_id=p_opportunity_id and a.treatment='confirmation_required'
    )
  ) then
    raise exception 'Every current participant requirement must be affirmed exactly once' using errcode='23514';
  end if;

  if (v_min is not null or v_max is not null) and not coalesce(p_age_range_affirmed,false) then
    raise exception 'Age-range affirmation is required' using errcode='23514';
  end if;

  select version into v_policy
  from public.gpi_consent_policies
  where active and effective_at<=v_now;
  if not found then raise exception 'No active contact-consent policy' using errcode='23514'; end if;

  begin
    insert into public.gpi_connection_requests(
      opportunity_id,occurrence_id,seeker_profile_id,seeker_email,seeker_email_fingerprint,
      fingerprint_key_version,consent_policy_version,consent_given_at,verification_expires_at
    )
    values(
      p_opportunity_id,p_occurrence_id,p_seeker_profile_id,p_normalized_email,p_email_fingerprint,
      p_fingerprint_key_version,v_policy,v_now,v_now+interval '24 hours'
    )
    returning id into v_request_id;
  exception when unique_violation then
    select q.* into v_existing
    from public.gpi_connection_requests q
    where q.seeker_email_fingerprint=p_email_fingerprint
      and q.opportunity_id=p_opportunity_id
      and q.occurrence_dedupe_key=coalesce(p_occurrence_id,'00000000-0000-0000-0000-000000000001'::uuid)
      and q.status in ('pending_verification','submitted','notified','next_step_provided')
    order by q.created_at desc
    limit 1
    for update;

    if not found then raise; end if;

    if p_seeker_profile_id is not null then
      if v_existing.seeker_profile_id is not null and v_existing.seeker_profile_id is distinct from p_seeker_profile_id then
        raise exception 'Active request belongs to another FaithBid profile' using errcode='42501';
      end if;

      if v_existing.seeker_profile_id is null then
        update public.gpi_connection_requests
           set seeker_profile_id=p_seeker_profile_id
         where id=v_existing.id;
        v_existing.seeker_profile_id:=p_seeker_profile_id;
      end if;

      if v_existing.status='pending_verification' then
        v_existing_eligible:=public.gpi_is_public_eligible(v_existing.opportunity_id)
          and (
            v_existing.occurrence_id is null
            or exists(
              select 1
              from public.gpi_opportunity_occurrences x
              where x.id=v_existing.occurrence_id
                and x.opportunity_id=v_existing.opportunity_id
                and x.status='scheduled'
                and x.starts_at>v_now
                and x.confirmed_at between v_now-interval '14 days' and v_now
                and (x.registration_deadline is null or x.registration_deadline>v_now)
            )
          );

        update public.gpi_notification_deliveries
           set status='failed',next_attempt_at=null,last_error_code='account_verified_in_app'
         where connection_request_id=v_existing.id
           and notification_type='verify_contact'
           and status in ('pending','sending');
        update public.gpi_action_tokens
           set revoked_at=v_now
         where connection_request_id=v_existing.id
           and purpose='verify_contact'
           and revoked_at is null;

        if v_existing_eligible then
          select e.id into v_endpoint
          from public.gpi_opportunities o
          join public.gpi_organization_notification_endpoints e
            on e.organization_id=o.organization_id and e.is_primary and e.status='verified'
          where o.id=v_existing.opportunity_id;
          if v_endpoint is null then
            raise exception 'Verified primary organization endpoint is unavailable' using errcode='23514';
          end if;

          update public.gpi_connection_requests
             set status='submitted',submitted_at=v_now,contact_verified_at=v_now,notification_queued_at=v_now
           where id=v_existing.id;

          insert into public.gpi_notification_deliveries(
            connection_request_id,organization_endpoint_id,notification_type,idempotency_key,status,next_attempt_at
          )
          values(v_existing.id,v_endpoint,'org_request','org_request/'||v_existing.id::text,'pending',v_now)
          on conflict(idempotency_key) do nothing;
        else
          update public.gpi_connection_requests
             set status='request_invalidated',submitted_at=v_now,contact_verified_at=v_now,
                 notification_queued_at=v_now,closed_at=v_now,close_reason='opportunity_no_longer_available'
           where id=v_existing.id;

          insert into public.gpi_notification_deliveries(
            connection_request_id,notification_type,idempotency_key,status,next_attempt_at
          )
          values(v_existing.id,'request_invalidated','request_invalidated/'||v_existing.id::text,'pending',v_now)
          on conflict(idempotency_key) do nothing;
        end if;
      end if;
    end if;

    select q.id,q.status into v_request_id,request_status
    from public.gpi_connection_requests q where q.id=v_existing.id;
    request_id:=v_request_id;
    deduplicated:=true;
    return next;
    return;
  end;

  insert into public.gpi_connection_request_confirmations(
    connection_request_id,confirmation_type,participant_audience_requirement_id,prompt_snapshot
  )
  select v_request_id,'participant_audience',a.id,a.confirmation_prompt
  from public.gpi_opportunity_participant_audiences a
  where a.id=any(v_req);

  if v_min is not null or v_max is not null then
    insert into public.gpi_connection_request_confirmations(
      connection_request_id,confirmation_type,age_min_snapshot,age_max_snapshot,prompt_snapshot
    )
    values(v_request_id,'age_range',v_min,v_max,'I confirm that I meet the listed age requirement.');
  end if;

  if p_seeker_profile_id is not null then
    select e.id into v_endpoint
    from public.gpi_opportunities o
    join public.gpi_organization_notification_endpoints e
      on e.organization_id=o.organization_id and e.is_primary and e.status='verified'
    where o.id=p_opportunity_id;
    if v_endpoint is null then raise exception 'Verified primary organization endpoint is unavailable' using errcode='23514'; end if;

    update public.gpi_connection_requests
       set status='submitted',submitted_at=v_now,contact_verified_at=v_now,notification_queued_at=v_now
     where id=v_request_id;
    insert into public.gpi_notification_deliveries(
      connection_request_id,organization_endpoint_id,notification_type,idempotency_key,status,next_attempt_at
    )
    values(v_request_id,v_endpoint,'org_request','org_request/'||v_request_id::text,'pending',v_now);
    return query select v_request_id,'submitted'::text,false;
    return;
  end if;

  insert into public.gpi_notification_deliveries(
    connection_request_id,notification_type,idempotency_key,status,next_attempt_at
  )
  values(v_request_id,'verify_contact','verify_contact/'||v_request_id::text,'pending',v_now);
  return query select v_request_id,'pending_verification'::text,false;
end;
$function$;

create or replace function public.gpi_seeker_get_request(p_request_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
  v_profile_id uuid:=auth.uid();
  v_result jsonb;
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;

  select jsonb_build_object(
    'request',jsonb_build_object(
      'request_id',q.id,'status',q.status,'opportunity_id',q.opportunity_id,'opportunity_title',o.title,
      'organization_id',o.organization_id,'organization_name',org.name,'goal',o.goal,'schedule_type',o.schedule_type,
      'location_mode',o.location_mode,'location_visibility',o.location_visibility,
      'occurrence_id',q.occurrence_id,'occurrence_starts_at',x.starts_at,'occurrence_ends_at',x.ends_at,
      'created_at',q.created_at,'submitted_at',q.submitted_at,'notified_at',q.notified_at,
      'org_responded_at',q.org_responded_at,'next_step_provided_at',q.next_step_provided_at,
      'response_due_at',q.response_due_at,'outcome_due_at',q.outcome_due_at,'closed_at',q.closed_at,
      'close_reason',q.close_reason,'details_released',q.private_details_release_authorized_at is not null
    ),
    'confirmations',coalesce((
      select jsonb_agg(jsonb_build_object(
        'confirmation_type',c.confirmation_type,'prompt',c.prompt_snapshot,
        'age_min',c.age_min_snapshot,'age_max',c.age_max_snapshot
      ) order by c.affirmed_at)
      from public.gpi_connection_request_confirmations c
      where c.connection_request_id=q.id
    ),'[]'::jsonb),
    'next_step',case when q.private_details_release_authorized_at is not null then (
      select jsonb_build_object('instructions',n.instructions,'created_at',n.created_at,'updated_at',n.updated_at)
      from public.gpi_connection_request_next_steps n where n.connection_request_id=q.id
    ) else null end,
    'released_details',case when q.private_details_release_authorized_at is not null then (
      select jsonb_strip_nulls(jsonb_build_object(
        'private_address_text',case
          when o.location_mode in ('in_person','hybrid') and o.location_visibility='address_on_acceptance'
          then p.private_address_text else null end,
        'virtual_join_url',case
          when o.location_mode in ('virtual','hybrid')
          then p.virtual_join_url else null end
      ))
      from public.gpi_opportunity_private_details p
      where p.opportunity_id=q.opportunity_id
    ) else null end
  ) into v_result
  from public.gpi_connection_requests q
  join public.gpi_opportunities o on o.id=q.opportunity_id
  join public.gpi_organizations org on org.id=o.organization_id
  left join public.gpi_opportunity_occurrences x on x.id=q.occurrence_id
  where q.id=p_request_id and q.seeker_profile_id=v_profile_id;

  if v_result is null then raise exception 'request not found or not authorized' using errcode='42501'; end if;
  return v_result;
end;
$function$;

create or replace function public.gpi_service_get_released_details(p_raw_session text)
returns table(connection_request_id uuid, next_step_instructions text, private_address_text text, virtual_join_url text)
language plpgsql
security definer
set search_path to ''
as $function$
declare v_request_id uuid;
begin
  select r.connection_request_id into v_request_id
  from public.gpi_resolve_action_session(p_raw_session,'seeker_outcome') r;

  return query
  select q.id,n.instructions,
         case when o.location_mode in ('in_person','hybrid') and o.location_visibility='address_on_acceptance'
              then p.private_address_text else null end,
         case when o.location_mode in ('virtual','hybrid')
              then p.virtual_join_url else null end
  from public.gpi_connection_requests q
  join public.gpi_opportunities o on o.id=q.opportunity_id
  join public.gpi_connection_request_next_steps n on n.connection_request_id=q.id
  left join public.gpi_opportunity_private_details p on p.opportunity_id=q.opportunity_id
  where q.id=v_request_id and q.status='next_step_provided'
    and q.private_details_release_authorized_at is not null;

  if not found then raise exception 'Next-step details are not authorized for release' using errcode='42501'; end if;
end;
$function$;

create or replace function public.gpi_admin_list_action_queue_v2(p_queue_key text default null::text, p_limit integer default 75)
returns table(queue_key text, priority integer, severity text, entity_type text, entity_id uuid, related_organization_id uuid, organization_name text, title text, current_status text, reason text, recommended_action text, action_function text, due_at timestamp with time zone, last_activity_at timestamp with time zone, payload jsonb)
language plpgsql
stable security definer
set search_path to ''
as $function$
declare v_admin_id uuid:=auth.uid();
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then raise exception 'not authorized' using errcode='42501'; end if;
  return query
  select q.queue_key,q.priority,q.severity,q.entity_type,q.entity_id,q.related_organization_id,
         q.organization_name,q.title,q.current_status,q.reason,q.recommended_action,q.action_function,
         q.due_at,q.last_activity_at,q.payload
  from public.gpi_admin_list_action_queue(p_queue_key,p_limit) q
  where not (q.queue_key='opportunity_needs_review' and q.current_status='draft')
    and not (
      q.queue_key='notification_delivery_attention'
      and coalesce(q.payload->>'last_error_code','') in ('handled_in_workspace','account_verified_in_app')
    );
end;
$function$;
