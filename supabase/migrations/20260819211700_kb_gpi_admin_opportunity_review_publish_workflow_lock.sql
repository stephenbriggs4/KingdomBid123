create or replace function public.gpi_admin_list_action_queue_v2(
  p_queue_key text default null,
  p_limit integer default 75
)
returns table(
  queue_key text,
  priority integer,
  severity text,
  entity_type text,
  entity_id uuid,
  related_organization_id uuid,
  organization_name text,
  title text,
  current_status text,
  reason text,
  recommended_action text,
  action_function text,
  due_at timestamptz,
  last_activity_at timestamptz,
  payload jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then
    raise exception 'not authorized' using errcode='42501';
  end if;

  return query
  select q.queue_key,q.priority,q.severity,q.entity_type,q.entity_id,q.related_organization_id,
         q.organization_name,q.title,q.current_status,q.reason,q.recommended_action,q.action_function,
         q.due_at,q.last_activity_at,q.payload
  from public.gpi_admin_list_action_queue(p_queue_key,p_limit) q
  where not (q.queue_key='opportunity_needs_review' and q.current_status='draft');
end;
$$;

revoke all on function public.gpi_admin_list_action_queue_v2(text,integer) from public, anon;
grant execute on function public.gpi_admin_list_action_queue_v2(text,integer) to authenticated;

create or replace function public.gpi_admin_get_action_queue_summary_v2()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then
    raise exception 'not authorized' using errcode='42501';
  end if;

  return coalesce((
    select jsonb_build_object(
      'generated_at',now(),
      'total_count',coalesce(sum(q.row_count),0)::integer,
      'critical_count',coalesce(sum(q.row_count) filter (where q.severity='critical'),0)::integer,
      'high_count',coalesce(sum(q.row_count) filter (where q.severity='high'),0)::integer,
      'medium_count',coalesce(sum(q.row_count) filter (where q.severity='medium'),0)::integer,
      'by_queue',coalesce(jsonb_object_agg(q.queue_key,q.row_count order by q.queue_key),'{}'::jsonb)
    )
    from (
      select l.queue_key,l.severity,count(*)::integer as row_count
      from public.gpi_admin_list_action_queue_v2(null::text,0) l
      group by l.queue_key,l.severity
    ) q
  ), jsonb_build_object(
    'generated_at',now(),
    'total_count',0,
    'critical_count',0,
    'high_count',0,
    'medium_count',0,
    'by_queue','{}'::jsonb
  ));
end;
$$;

revoke all on function public.gpi_admin_get_action_queue_summary_v2() from public, anon;
grant execute on function public.gpi_admin_get_action_queue_summary_v2() to authenticated;

create or replace function public.gpi_admin_get_publish_readiness(p_opportunity_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_op public.gpi_opportunities%rowtype;
  v_org_status text;
  v_active_taxonomy integer;
  v_primary_endpoint_ok boolean;
  v_city_ok boolean;
  v_activity_ok boolean;
  v_taxonomy_ok boolean;
  v_goal_taxonomy_ok boolean;
  v_private_address_ok boolean;
  v_virtual_join_ok boolean;
  v_occurrence_ok boolean;
  v_reviewed_current boolean;
  v_freshness_ok boolean;
  v_review_ready boolean;
  v_publish_gate_ready boolean;
  v_can_publish boolean;
  v_occurrence_total integer := 0;
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then
    raise exception 'not authorized' using errcode='42501';
  end if;

  select * into v_op from public.gpi_opportunities where id=p_opportunity_id;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;

  select status into v_org_status from public.gpi_organizations where id=v_op.organization_id;
  select id into v_active_taxonomy from public.gpi_taxonomy_versions where status='active';

  v_primary_endpoint_ok := exists(
    select 1 from public.gpi_organization_notification_endpoints e
    where e.organization_id=v_op.organization_id and e.is_primary and e.status='verified'
  );

  v_city_ok := v_op.city_area_id is null or exists(
    select 1 from public.gpi_city_areas c where c.id=v_op.city_area_id and c.active
  );

  v_activity_ok := exists(
    select 1 from public.gpi_opportunity_activity_tags x
    join public.gpi_activity_tags t on t.id=x.activity_tag_id
    where x.opportunity_id=v_op.id and t.active
  );

  v_taxonomy_ok := not exists(
    select 1 from public.gpi_opportunity_activity_tags x join public.gpi_activity_tags t on t.id=x.activity_tag_id
    where x.opportunity_id=v_op.id and not t.active
  ) and not exists(
    select 1 from public.gpi_opportunity_cause_tags x join public.gpi_cause_tags t on t.id=x.cause_tag_id
    where x.opportunity_id=v_op.id and not t.active
  ) and not exists(
    select 1 from public.gpi_opportunity_participant_audiences x join public.gpi_audience_tags t on t.id=x.audience_tag_id
    where x.opportunity_id=v_op.id and not t.active
  ) and not exists(
    select 1 from public.gpi_opportunity_population_served x join public.gpi_audience_tags t on t.id=x.audience_tag_id
    where x.opportunity_id=v_op.id and not t.active
  );

  v_goal_taxonomy_ok := not (
    v_op.goal='connect' and (
      exists(select 1 from public.gpi_opportunity_population_served x where x.opportunity_id=v_op.id)
      or exists(
        select 1 from public.gpi_opportunity_cause_tags x
        join public.gpi_cause_tags t on t.id=x.cause_tag_id
        where x.opportunity_id=v_op.id and t.care_flagged
      )
    )
  );

  v_private_address_ok := v_op.location_visibility <> 'address_on_acceptance' or exists(
    select 1 from public.gpi_opportunity_private_details p
    where p.opportunity_id=v_op.id and p.private_address_text is not null
  );

  v_virtual_join_ok := v_op.location_mode not in ('virtual','hybrid') or exists(
    select 1 from public.gpi_opportunity_private_details p
    where p.opportunity_id=v_op.id and p.virtual_join_url is not null
  );

  if v_op.schedule_type='one_time' then
    select count(*) into v_occurrence_total from public.gpi_opportunity_occurrences x where x.opportunity_id=v_op.id;
    v_occurrence_ok := v_occurrence_total=1 and exists(
      select 1 from public.gpi_opportunity_occurrences x
      where x.opportunity_id=v_op.id and x.status='scheduled' and x.starts_at>now()
        and x.confirmed_at between now()-interval '14 days' and now()
        and (x.registration_deadline is null or x.registration_deadline>now())
    );
  elsif v_op.schedule_type='recurring' then
    v_occurrence_ok := exists(
      select 1 from public.gpi_opportunity_occurrences x
      where x.opportunity_id=v_op.id and x.status='scheduled' and x.starts_at>now()
        and x.confirmed_at between now()-interval '14 days' and now()
        and (x.registration_deadline is null or x.registration_deadline>now())
    );
  else
    v_occurrence_ok := not exists(select 1 from public.gpi_opportunity_occurrences x where x.opportunity_id=v_op.id);
  end if;

  v_reviewed_current := v_active_taxonomy is not null
    and v_op.reviewed_revision is not distinct from v_op.content_revision
    and v_op.reviewed_taxonomy_version_id is not distinct from v_active_taxonomy
    and v_op.reviewed_at is not null;

  v_freshness_ok := v_op.last_confirmed_at between now()-interval '30 days' and now();

  v_review_ready := v_op.status='requires_review'
    and v_activity_ok and v_taxonomy_ok and v_goal_taxonomy_ok
    and v_private_address_ok and v_virtual_join_ok and v_occurrence_ok;

  v_publish_gate_ready := v_org_status='verified'
    and v_primary_endpoint_ok and v_active_taxonomy is not null
    and v_reviewed_current and v_freshness_ok and v_city_ok
    and v_activity_ok and v_taxonomy_ok and v_goal_taxonomy_ok
    and v_private_address_ok and v_virtual_join_ok and v_occurrence_ok;

  v_can_publish := v_op.status in ('draft','requires_review') and v_publish_gate_ready;

  return jsonb_build_object(
    'opportunity_id',v_op.id,
    'status',v_op.status,
    'content_revision',v_op.content_revision,
    'reviewed_revision',v_op.reviewed_revision,
    'organization_verified',v_org_status='verified',
    'verified_primary_endpoint',v_primary_endpoint_ok,
    'active_taxonomy',v_active_taxonomy is not null,
    'reviewed_current',v_reviewed_current,
    'freshness_ok',v_freshness_ok,
    'city_ok',v_city_ok,
    'activity_ok',v_activity_ok,
    'taxonomy_ok',v_taxonomy_ok,
    'goal_taxonomy_ok',v_goal_taxonomy_ok,
    'private_address_ok',v_private_address_ok,
    'virtual_join_ok',v_virtual_join_ok,
    'occurrence_ok',v_occurrence_ok,
    'review_ready',v_review_ready,
    'publish_gate_ready',v_publish_gate_ready,
    'can_publish',v_can_publish,
    'review_missing',to_jsonb(array_remove(array[
      case when v_op.status<>'requires_review' then 'Host has not submitted this revision for FaithBid review.' end,
      case when not v_activity_ok then 'Add at least one active activity tag.' end,
      case when not v_taxonomy_ok then 'Remove retired taxonomy tags.' end,
      case when not v_goal_taxonomy_ok then 'Connect opportunities cannot use care-only causes or population-served targeting.' end,
      case when not v_private_address_ok then 'Add the protected private address.' end,
      case when not v_virtual_join_ok then 'Add the protected virtual join URL.' end,
      case when not v_occurrence_ok then 'Fix the actual occurrence schedule before review.' end
    ]::text[],null)),
    'publish_missing',to_jsonb(array_remove(array[
      case when v_org_status<>'verified' then 'Verify the organization.' end,
      case when not v_primary_endpoint_ok then 'Verify the primary organization notification endpoint.' end,
      case when v_active_taxonomy is null then 'Activate a taxonomy version.' end,
      case when not v_reviewed_current then 'Review the current content revision and active taxonomy.' end,
      case when not v_freshness_ok then 'Confirm the opportunity is current.' end,
      case when not v_city_ok then 'Use an active city area.' end,
      case when not v_activity_ok then 'Add at least one active activity tag.' end,
      case when not v_taxonomy_ok then 'Remove retired taxonomy tags.' end,
      case when not v_goal_taxonomy_ok then 'Fix incompatible Connect taxonomy.' end,
      case when not v_private_address_ok then 'Add the protected private address.' end,
      case when not v_virtual_join_ok then 'Add the protected virtual join URL.' end,
      case when not v_occurrence_ok then 'Fix or reconfirm the future occurrence.' end
    ]::text[],null))
  );
end;
$$;

revoke all on function public.gpi_admin_get_publish_readiness(uuid) from public, anon;
grant execute on function public.gpi_admin_get_publish_readiness(uuid) to authenticated;

create or replace function public.gpi_admin_request_opportunity_changes(
  p_opportunity_id uuid,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
  v_before public.gpi_opportunities%rowtype;
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  if v_reason is null or char_length(v_reason) < 5 or char_length(v_reason) > 1000 then
    raise exception 'Change request reason must contain 5 to 1000 characters' using errcode='22023';
  end if;

  select * into v_before from public.gpi_opportunities where id=p_opportunity_id for update;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;
  if v_before.status <> 'requires_review' then
    raise exception 'Only an opportunity awaiting review can be sent back for changes' using errcode='23514';
  end if;

  update public.gpi_opportunities
  set status='draft', reviewed_revision=null, reviewed_by_profile_id=null,
      reviewed_at=null, reviewed_taxonomy_version_id=null
  where id=p_opportunity_id;

  insert into public.admin_audit_log(
    admin_id,action,target_table,target_id,reason,before_snapshot,after_snapshot,meta
  ) values (
    v_admin_id,'gpi_request_opportunity_changes','gpi_opportunities',p_opportunity_id::text,v_reason,
    jsonb_build_object('status',v_before.status,'content_revision',v_before.content_revision,'reviewed_revision',v_before.reviewed_revision),
    jsonb_build_object('status','draft','content_revision',v_before.content_revision,'review_cleared',true),
    jsonb_build_object('source','gpi_admin_request_opportunity_changes')
  );

  return 'draft';
end;
$$;

revoke all on function public.gpi_admin_request_opportunity_changes(uuid,text) from public, anon;
grant execute on function public.gpi_admin_request_opportunity_changes(uuid,text) to authenticated;

create or replace function public.gpi_host_get_latest_review_feedback(p_opportunity_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_org_id uuid;
  v_status text;
  v_revision integer;
  v_result jsonb;
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;

  select organization_id,status,content_revision into v_org_id,v_status,v_revision
  from public.gpi_opportunities where id=p_opportunity_id;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;

  if not exists(
    select 1 from public.gpi_organization_members m
    where m.organization_id=v_org_id and m.profile_id=v_profile_id and m.active
  ) then raise exception 'not authorized for opportunity' using errcode='42501'; end if;

  if v_status <> 'draft' then return null; end if;

  select jsonb_build_object(
    'reason',a.reason,
    'requested_at',a.created_at,
    'content_revision',v_revision
  ) into v_result
  from public.admin_audit_log a
  where a.action='gpi_request_opportunity_changes'
    and a.target_table='gpi_opportunities'
    and a.target_id=p_opportunity_id::text
    and a.after_snapshot->>'content_revision'=v_revision::text
  order by a.created_at desc
  limit 1;

  return v_result;
end;
$$;

revoke all on function public.gpi_host_get_latest_review_feedback(uuid) from public, anon;
grant execute on function public.gpi_host_get_latest_review_feedback(uuid) to authenticated;
