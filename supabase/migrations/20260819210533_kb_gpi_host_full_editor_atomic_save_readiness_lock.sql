create or replace function public.gpi_host_get_editor_taxonomy()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_profile_id is null then
    raise exception 'authentication required' using errcode='42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id=v_profile_id) then
    raise exception 'FaithBid profile is required' using errcode='42501';
  end if;

  select jsonb_build_object(
    'activity', coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'slug',t.slug,'label',t.label) order by t.label) from public.gpi_activity_tags t where t.active),'[]'::jsonb),
    'cause', coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'slug',t.slug,'label',t.label,'care_flagged',t.care_flagged) order by t.label) from public.gpi_cause_tags t where t.active),'[]'::jsonb),
    'audience', coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'slug',t.slug,'label',t.label) order by t.label) from public.gpi_audience_tags t where t.active),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.gpi_host_save_full_opportunity(
  p_opportunity_id uuid,
  p_organization_id uuid,
  p_payload jsonb,
  p_private_address_text text default null,
  p_virtual_join_url text default null,
  p_cause_tag_ids uuid[] default '{}'::uuid[],
  p_activity_tag_ids uuid[] default '{}'::uuid[],
  p_participant_requirements jsonb default '[]'::jsonb,
  p_population_served_ids uuid[] default '{}'::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_id uuid;
  v_revision integer;
begin
  if v_profile_id is null then
    raise exception 'authentication required' using errcode='42501';
  end if;

  v_id := public.gpi_host_save_opportunity(p_opportunity_id,p_organization_id,p_payload);
  perform public.gpi_host_set_opportunity_private_details(v_id,p_private_address_text,p_virtual_join_url);
  v_revision := public.gpi_host_set_opportunity_taxonomy(
    v_id,
    coalesce(p_cause_tag_ids,'{}'::uuid[]),
    coalesce(p_activity_tag_ids,'{}'::uuid[]),
    coalesce(p_participant_requirements,'[]'::jsonb),
    coalesce(p_population_served_ids,'{}'::uuid[])
  );

  return jsonb_build_object('opportunity_id',v_id,'content_revision',v_revision);
end;
$$;

create or replace function public.gpi_host_get_review_readiness(p_opportunity_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_op public.gpi_opportunities%rowtype;
  v_org_status text;
  v_has_membership boolean := false;
  v_activity_ok boolean := false;
  v_taxonomy_ok boolean := true;
  v_private_address_ok boolean := true;
  v_virtual_join_ok boolean := true;
  v_occurrence_ok boolean := true;
  v_occurrence_total integer := 0;
  v_future_scheduled integer := 0;
  v_missing text[] := '{}'::text[];
  v_can_submit boolean := false;
begin
  if v_profile_id is null then
    raise exception 'authentication required' using errcode='42501';
  end if;

  select o.* into v_op
  from public.gpi_opportunities o
  where o.id=p_opportunity_id;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;

  select org.status into v_org_status from public.gpi_organizations org where org.id=v_op.organization_id;
  if not found then raise exception 'Organization not found' using errcode='P0002'; end if;

  select exists(
    select 1 from public.gpi_organization_members m
    where m.organization_id=v_op.organization_id and m.profile_id=v_profile_id and m.active and m.role in ('admin','editor')
  ) into v_has_membership;
  if not v_has_membership then raise exception 'not authorized for opportunity' using errcode='42501'; end if;

  select exists(
    select 1 from public.gpi_opportunity_activity_tags x
    join public.gpi_activity_tags t on t.id=x.activity_tag_id
    where x.opportunity_id=v_op.id and t.active
  ) into v_activity_ok;

  v_taxonomy_ok := not (
    exists(select 1 from public.gpi_opportunity_activity_tags x join public.gpi_activity_tags t on t.id=x.activity_tag_id where x.opportunity_id=v_op.id and not t.active)
    or exists(select 1 from public.gpi_opportunity_cause_tags x join public.gpi_cause_tags t on t.id=x.cause_tag_id where x.opportunity_id=v_op.id and not t.active)
    or exists(select 1 from public.gpi_opportunity_participant_audiences x join public.gpi_audience_tags t on t.id=x.audience_tag_id where x.opportunity_id=v_op.id and not t.active)
    or exists(select 1 from public.gpi_opportunity_population_served x join public.gpi_audience_tags t on t.id=x.audience_tag_id where x.opportunity_id=v_op.id and not t.active)
  );

  if v_op.location_visibility='address_on_acceptance' then
    select exists(select 1 from public.gpi_opportunity_private_details p where p.opportunity_id=v_op.id and p.private_address_text is not null) into v_private_address_ok;
  end if;
  if v_op.location_mode in ('virtual','hybrid') then
    select exists(select 1 from public.gpi_opportunity_private_details p where p.opportunity_id=v_op.id and p.virtual_join_url is not null) into v_virtual_join_ok;
  end if;

  select count(*)::integer,
         count(*) filter(where x.status='scheduled' and x.starts_at>now() and (x.registration_deadline is null or x.registration_deadline>now()))::integer
  into v_occurrence_total,v_future_scheduled
  from public.gpi_opportunity_occurrences x where x.opportunity_id=v_op.id;

  if v_op.schedule_type='one_time' then
    v_occurrence_ok := v_occurrence_total=1 and v_future_scheduled=1;
  elsif v_op.schedule_type='recurring' then
    v_occurrence_ok := v_future_scheduled>=1;
  else
    v_occurrence_ok := v_occurrence_total=0;
  end if;

  if not v_activity_ok then v_missing := array_append(v_missing,'Add at least one activity tag'); end if;
  if not v_taxonomy_ok then v_missing := array_append(v_missing,'Remove retired taxonomy tags'); end if;
  if not v_private_address_ok then v_missing := array_append(v_missing,'Add the protected private location detail'); end if;
  if not v_virtual_join_ok then v_missing := array_append(v_missing,'Add the protected virtual join URL'); end if;
  if not v_occurrence_ok then
    v_missing := array_append(v_missing,case when v_op.schedule_type='one_time' then 'Add exactly one future scheduled occurrence' when v_op.schedule_type='recurring' then 'Add a future scheduled occurrence' else 'Remove occurrences from the flexible opportunity' end);
  end if;
  if v_org_status in ('suspended','closed') then v_missing := array_append(v_missing,'Organization host access is not writable'); end if;
  if v_op.status='closed' then v_missing := array_append(v_missing,'Closed opportunity cannot be submitted'); end if;
  if v_op.status='open' then v_missing := array_append(v_missing,'Edit the live opportunity before re-submitting'); end if;
  if v_op.status='requires_review' then v_missing := array_append(v_missing,'Opportunity is already awaiting FaithBid review'); end if;

  v_can_submit := cardinality(v_missing)=0;

  return jsonb_build_object(
    'opportunity_id',v_op.id,
    'status',v_op.status,
    'organization_status',v_org_status,
    'organization_verified',v_org_status='verified',
    'content_revision',v_op.content_revision,
    'activity_ok',v_activity_ok,
    'taxonomy_ok',v_taxonomy_ok,
    'private_address_ok',v_private_address_ok,
    'virtual_join_ok',v_virtual_join_ok,
    'occurrence_ok',v_occurrence_ok,
    'occurrence_total',v_occurrence_total,
    'future_scheduled_occurrence_count',v_future_scheduled,
    'can_submit',v_can_submit,
    'missing',to_jsonb(v_missing)
  );
end;
$$;

revoke all on function public.gpi_host_get_editor_taxonomy() from public,anon,authenticated;
revoke all on function public.gpi_host_save_full_opportunity(uuid,uuid,jsonb,text,text,uuid[],uuid[],jsonb,uuid[]) from public,anon,authenticated;
revoke all on function public.gpi_host_get_review_readiness(uuid) from public,anon,authenticated;
grant execute on function public.gpi_host_get_editor_taxonomy() to authenticated,service_role;
grant execute on function public.gpi_host_save_full_opportunity(uuid,uuid,jsonb,text,text,uuid[],uuid[],jsonb,uuid[]) to authenticated,service_role;
grant execute on function public.gpi_host_get_review_readiness(uuid) to authenticated,service_role;
