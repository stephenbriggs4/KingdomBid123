-- FaithBid GPI host opportunity write contract.
-- Host authority is organization membership, never Marketplace role.
-- Public seeker and platform-admin contracts remain unchanged.

create or replace function public.gpi_host_touch_opportunity_revision(p_opportunity_id uuid)
returns integer
language plpgsql
set search_path to ''
as $$
declare
  v_revision integer;
begin
  perform set_config('faithbid.gpi_revision_context', 'association_trigger', true);
  update public.gpi_opportunities
     set content_revision = content_revision + 1,
         status = case when status = 'open' then 'requires_review' else status end,
         updated_at = now()
   where id = p_opportunity_id
   returning content_revision into v_revision;
  perform set_config('faithbid.gpi_revision_context', '', true);
  if v_revision is null then
    raise exception 'Opportunity not found' using errcode = 'P0002';
  end if;
  return v_revision;
exception
  when others then
    perform set_config('faithbid.gpi_revision_context', '', true);
    raise;
end;
$$;

create or replace function public.gpi_host_assert_review_ready(p_opportunity_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_op public.gpi_opportunities%rowtype;
  v_occurrence_total integer;
begin
  select * into v_op
  from public.gpi_opportunities
  where id = p_opportunity_id;
  if not found then
    raise exception 'Opportunity not found' using errcode = 'P0002';
  end if;
  if v_op.status = 'closed' then
    raise exception 'Closed opportunity cannot be submitted for review' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.gpi_opportunity_activity_tags x
    join public.gpi_activity_tags t on t.id=x.activity_tag_id
    where x.opportunity_id=v_op.id and t.active
  ) then
    raise exception 'At least one active activity tag is required before review' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.gpi_opportunity_activity_tags x
    join public.gpi_activity_tags t on t.id=x.activity_tag_id
    where x.opportunity_id=v_op.id and not t.active
  ) or exists (
    select 1 from public.gpi_opportunity_cause_tags x
    join public.gpi_cause_tags t on t.id=x.cause_tag_id
    where x.opportunity_id=v_op.id and not t.active
  ) or exists (
    select 1 from public.gpi_opportunity_participant_audiences x
    join public.gpi_audience_tags t on t.id=x.audience_tag_id
    where x.opportunity_id=v_op.id and not t.active
  ) or exists (
    select 1 from public.gpi_opportunity_population_served x
    join public.gpi_audience_tags t on t.id=x.audience_tag_id
    where x.opportunity_id=v_op.id and not t.active
  ) then
    raise exception 'Review submission cannot use retired taxonomy tags' using errcode = '23514';
  end if;

  if v_op.location_visibility = 'address_on_acceptance'
     and not exists (
       select 1 from public.gpi_opportunity_private_details p
       where p.opportunity_id=v_op.id and p.private_address_text is not null
     ) then
    raise exception 'Protected private address is required before review' using errcode = '23514';
  end if;

  if v_op.location_mode in ('virtual','hybrid')
     and not exists (
       select 1 from public.gpi_opportunity_private_details p
       where p.opportunity_id=v_op.id and p.virtual_join_url is not null
     ) then
    raise exception 'Protected virtual join URL is required before review' using errcode = '23514';
  end if;

  if v_op.schedule_type = 'one_time' then
    select count(*) into v_occurrence_total
    from public.gpi_opportunity_occurrences x
    where x.opportunity_id=v_op.id;
    if v_occurrence_total <> 1 or not exists (
      select 1 from public.gpi_opportunity_occurrences x
      where x.opportunity_id=v_op.id
        and x.status='scheduled'
        and x.starts_at > now()
        and (x.registration_deadline is null or x.registration_deadline > now())
    ) then
      raise exception 'One-time opportunity requires exactly one future scheduled occurrence before review' using errcode = '23514';
    end if;
  elsif v_op.schedule_type = 'recurring' then
    if not exists (
      select 1 from public.gpi_opportunity_occurrences x
      where x.opportunity_id=v_op.id
        and x.status='scheduled'
        and x.starts_at > now()
        and (x.registration_deadline is null or x.registration_deadline > now())
    ) then
      raise exception 'Recurring opportunity requires a future scheduled occurrence before review' using errcode = '23514';
    end if;
  elsif exists (
    select 1 from public.gpi_opportunity_occurrences x where x.opportunity_id=v_op.id
  ) then
    raise exception 'Flexible opportunity cannot have occurrence rows' using errcode = '23514';
  end if;
end;
$$;

create or replace function public.gpi_host_get_workspace(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_membership_role text;
  v_org_id uuid;
  v_org_name text;
  v_org_description text;
  v_org_status text;
  v_result jsonb;
begin
  if v_profile_id is null then
    raise exception 'authentication required' using errcode='42501';
  end if;
  select m.role, o.id, o.name, o.description, o.status
    into v_membership_role, v_org_id, v_org_name, v_org_description, v_org_status
  from public.gpi_organization_members m
  join public.gpi_organizations o on o.id=m.organization_id
  where m.organization_id=p_organization_id
    and m.profile_id=v_profile_id and m.active;
  if not found then
    raise exception 'not authorized for organization' using errcode='42501';
  end if;

  select jsonb_build_object(
    'organization', jsonb_build_object(
      'id',v_org_id,'name',v_org_name,'description',v_org_description,'status',v_org_status,
      'membership_role',v_membership_role
    ),
    'opportunities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',x.id,'title',x.title,'status',x.status,'goal',x.goal,
        'schedule_type',x.schedule_type,'location_mode',x.location_mode,
        'content_revision',x.content_revision,'reviewed_revision',x.reviewed_revision,
        'last_confirmed_at',x.last_confirmed_at,'updated_at',x.updated_at
      ) order by x.updated_at desc)
      from public.gpi_opportunities x where x.organization_id=p_organization_id
    ),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.gpi_host_get_opportunity_editor(p_opportunity_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_org_id uuid;
  v_payload jsonb;
begin
  if v_profile_id is null then
    raise exception 'authentication required' using errcode='42501';
  end if;
  select organization_id into v_org_id
  from public.gpi_opportunities where id=p_opportunity_id;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;
  if not exists (
    select 1 from public.gpi_organization_members m
    where m.organization_id=v_org_id and m.profile_id=v_profile_id and m.active
  ) then
    raise exception 'not authorized for opportunity' using errcode='42501';
  end if;

  select jsonb_build_object(
    'opportunity',to_jsonb(o),
    'private_details',to_jsonb(pd),
    'cause_tags',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'slug',t.slug,'label',t.label) order by t.label)
      from public.gpi_opportunity_cause_tags x join public.gpi_cause_tags t on t.id=x.cause_tag_id
      where x.opportunity_id=o.id),'[]'::jsonb),
    'activity_tags',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'slug',t.slug,'label',t.label) order by t.label)
      from public.gpi_opportunity_activity_tags x join public.gpi_activity_tags t on t.id=x.activity_tag_id
      where x.opportunity_id=o.id),'[]'::jsonb),
    'participant_requirements',coalesce((select jsonb_agg(jsonb_build_object(
      'id',x.id,'audience_tag_id',t.id,'slug',t.slug,'label',t.label,
      'treatment',x.treatment,'confirmation_prompt',x.confirmation_prompt) order by t.label)
      from public.gpi_opportunity_participant_audiences x join public.gpi_audience_tags t on t.id=x.audience_tag_id
      where x.opportunity_id=o.id),'[]'::jsonb),
    'population_served',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'slug',t.slug,'label',t.label) order by t.label)
      from public.gpi_opportunity_population_served x join public.gpi_audience_tags t on t.id=x.audience_tag_id
      where x.opportunity_id=o.id),'[]'::jsonb),
    'occurrences',coalesce((select jsonb_agg(to_jsonb(x) order by x.starts_at asc)
      from public.gpi_opportunity_occurrences x where x.opportunity_id=o.id),'[]'::jsonb)
  ) into v_payload
  from public.gpi_opportunities o
  left join public.gpi_opportunity_private_details pd on pd.opportunity_id=o.id
  where o.id=p_opportunity_id;
  return v_payload;
end;
$$;

create or replace function public.gpi_host_save_opportunity(
  p_opportunity_id uuid,
  p_organization_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_org_status text;
  v_id uuid;
  v_key text;
  v_before public.gpi_opportunities%rowtype;
  v_after public.gpi_opportunities%rowtype;
  v_recurring_days smallint[];
  v_location_mode text := lower(coalesce(p_payload->>'location_mode',''));
  v_location_visibility text := lower(coalesce(p_payload->>'location_visibility',''));
  v_city_area_id uuid := nullif(p_payload->>'city_area_id','')::uuid;
  v_city_lat numeric;
  v_city_lon numeric;
  v_public_meeting_text text := nullif(btrim(coalesce(p_payload->>'public_meeting_point_text','')), '');
  v_old_meeting_text text;
  v_meeting_lat numeric;
  v_meeting_lon numeric;
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_organization_id is null or coalesce(jsonb_typeof(p_payload),'') <> 'object' then
    raise exception 'Organization id and opportunity object are required' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.gpi_organization_members m
    where m.organization_id=p_organization_id and m.profile_id=v_profile_id and m.active
      and m.role in ('admin','editor')
  ) then raise exception 'not authorized for organization' using errcode='42501'; end if;

  select status into v_org_status from public.gpi_organizations
  where id=p_organization_id for update;
  if not found then raise exception 'Organization not found' using errcode='P0002'; end if;
  if v_org_status in ('suspended','closed') then
    raise exception 'Suspended or closed organization cannot edit opportunities' using errcode='23514';
  end if;

  for v_key in select jsonb_object_keys(p_payload) loop
    if v_key <> all(array[
      'title','description','goal','opportunity_format','responsibility_level','commitment_type',
      'estimated_duration_minutes','min_age','max_age','requires_background_check','requires_orientation',
      'requires_application','requires_membership','transportation_note','schedule_type','recurring_days',
      'time_window_start','time_window_end','recurrence_note','location_mode','city_area_id','postal_code',
      'location_visibility','public_address_text','public_meeting_point_text'
    ]) then raise exception 'Unsupported host opportunity field: %',v_key using errcode='22023'; end if;
  end loop;

  if p_payload ? 'recurring_days' then
    if jsonb_typeof(p_payload->'recurring_days') <> 'array' then
      raise exception 'recurring_days must be an array' using errcode='22023';
    end if;
    select array_agg(value::smallint order by ordinal) into v_recurring_days
    from jsonb_array_elements_text(p_payload->'recurring_days') with ordinality as d(value,ordinal);
  end if;

  if v_location_mode in ('in_person','hybrid') then
    if v_city_area_id is null then raise exception 'City area is required for in-person or hybrid opportunities' using errcode='22023'; end if;
    select centroid_latitude,centroid_longitude into v_city_lat,v_city_lon
    from public.gpi_city_areas where id=v_city_area_id and active;
    if not found or v_city_lat is null or v_city_lon is null then
      raise exception 'Active city area with a usable centroid is required' using errcode='23514';
    end if;
  elsif v_location_mode='virtual' then
    v_city_area_id:=null; v_city_lat:=null; v_city_lon:=null;
  end if;

  if p_opportunity_id is null then
    insert into public.gpi_opportunities(
      organization_id,created_by_profile_id,title,description,goal,opportunity_format,responsibility_level,
      commitment_type,estimated_duration_minutes,min_age,max_age,requires_background_check,requires_orientation,
      requires_application,requires_membership,transportation_note,schedule_type,recurring_days,time_window_start,
      time_window_end,recurrence_note,location_mode,city_area_id,postal_code,approximate_latitude,approximate_longitude,
      location_visibility,public_address_text,public_meeting_point_text,public_meeting_point_latitude,public_meeting_point_longitude
    ) values (
      p_organization_id,v_profile_id,btrim(coalesce(p_payload->>'title','')),btrim(coalesce(p_payload->>'description','')),
      lower(p_payload->>'goal'),lower(p_payload->>'opportunity_format'),lower(p_payload->>'responsibility_level'),
      lower(p_payload->>'commitment_type'),nullif(p_payload->>'estimated_duration_minutes','')::integer,
      nullif(p_payload->>'min_age','')::smallint,nullif(p_payload->>'max_age','')::smallint,
      coalesce((p_payload->>'requires_background_check')::boolean,false),coalesce((p_payload->>'requires_orientation')::boolean,false),
      coalesce((p_payload->>'requires_application')::boolean,false),coalesce((p_payload->>'requires_membership')::boolean,false),
      nullif(btrim(coalesce(p_payload->>'transportation_note','')),''),lower(p_payload->>'schedule_type'),v_recurring_days,
      nullif(p_payload->>'time_window_start','')::time,nullif(p_payload->>'time_window_end','')::time,
      nullif(btrim(coalesce(p_payload->>'recurrence_note','')),''),v_location_mode,v_city_area_id,
      nullif(btrim(coalesce(p_payload->>'postal_code','')),''),v_city_lat,v_city_lon,v_location_visibility,
      nullif(btrim(coalesce(p_payload->>'public_address_text','')),''),v_public_meeting_text,null,null
    ) returning * into v_after;
    v_id:=v_after.id;
  else
    select * into v_before from public.gpi_opportunities where id=p_opportunity_id for update;
    if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;
    if v_before.organization_id <> p_organization_id then
      raise exception 'Opportunity organization is immutable' using errcode='42501';
    end if;
    if v_before.status='closed' then raise exception 'Closed opportunity cannot be edited' using errcode='23514'; end if;
    v_old_meeting_text:=v_before.public_meeting_point_text;
    if v_location_visibility='public_meeting_point' and v_public_meeting_text is not distinct from v_old_meeting_text then
      v_meeting_lat:=v_before.public_meeting_point_latitude;
      v_meeting_lon:=v_before.public_meeting_point_longitude;
    else
      v_meeting_lat:=null; v_meeting_lon:=null;
    end if;

    update public.gpi_opportunities set
      title=btrim(coalesce(p_payload->>'title','')),
      description=btrim(coalesce(p_payload->>'description','')),
      goal=lower(p_payload->>'goal'),opportunity_format=lower(p_payload->>'opportunity_format'),
      responsibility_level=lower(p_payload->>'responsibility_level'),commitment_type=lower(p_payload->>'commitment_type'),
      estimated_duration_minutes=nullif(p_payload->>'estimated_duration_minutes','')::integer,
      min_age=nullif(p_payload->>'min_age','')::smallint,max_age=nullif(p_payload->>'max_age','')::smallint,
      requires_background_check=coalesce((p_payload->>'requires_background_check')::boolean,false),
      requires_orientation=coalesce((p_payload->>'requires_orientation')::boolean,false),
      requires_application=coalesce((p_payload->>'requires_application')::boolean,false),
      requires_membership=coalesce((p_payload->>'requires_membership')::boolean,false),
      transportation_note=nullif(btrim(coalesce(p_payload->>'transportation_note','')),''),
      schedule_type=lower(p_payload->>'schedule_type'),recurring_days=v_recurring_days,
      time_window_start=nullif(p_payload->>'time_window_start','')::time,time_window_end=nullif(p_payload->>'time_window_end','')::time,
      recurrence_note=nullif(btrim(coalesce(p_payload->>'recurrence_note','')),''),location_mode=v_location_mode,
      city_area_id=v_city_area_id,postal_code=nullif(btrim(coalesce(p_payload->>'postal_code','')),''),
      approximate_latitude=v_city_lat,approximate_longitude=v_city_lon,location_visibility=v_location_visibility,
      public_address_text=nullif(btrim(coalesce(p_payload->>'public_address_text','')),''),
      public_meeting_point_text=v_public_meeting_text,
      public_meeting_point_latitude=v_meeting_lat,public_meeting_point_longitude=v_meeting_lon
    where id=p_opportunity_id returning * into v_after;
    v_id:=p_opportunity_id;
  end if;

  insert into public.admin_audit_log(admin_id,action,target_table,target_id,reason,before_snapshot,after_snapshot,meta)
  values(v_profile_id,case when p_opportunity_id is null then 'gpi_host_create_opportunity' else 'gpi_host_save_opportunity' end,
    'gpi_opportunities',v_id::text,null,
    case when p_opportunity_id is null then null else jsonb_build_object('title',v_before.title,'status',v_before.status,'content_revision',v_before.content_revision) end,
    jsonb_build_object('title',v_after.title,'status',v_after.status,'content_revision',v_after.content_revision,'organization_id',v_after.organization_id),
    jsonb_build_object('source','gpi_host_save_opportunity'));
  return v_id;
end;
$$;

create or replace function public.gpi_host_set_opportunity_taxonomy(
  p_opportunity_id uuid,
  p_cause_tag_ids uuid[],
  p_activity_tag_ids uuid[],
  p_participant_requirements jsonb,
  p_population_served_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_profile_id uuid:=auth.uid();
  v_org_id uuid;
  v_org_status text;
  v_op_status text;
  v_revision integer;
  v_participant jsonb:=coalesce(p_participant_requirements,'[]'::jsonb);
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  select o.organization_id,o.status,org.status into v_org_id,v_op_status,v_org_status
  from public.gpi_opportunities o join public.gpi_organizations org on org.id=o.organization_id
  where o.id=p_opportunity_id for update of o,org;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;
  if not exists(select 1 from public.gpi_organization_members m where m.organization_id=v_org_id and m.profile_id=v_profile_id and m.active and m.role in ('admin','editor')) then
    raise exception 'not authorized for opportunity' using errcode='42501';
  end if;
  if v_org_status in ('suspended','closed') or v_op_status='closed' then
    raise exception 'Organization or opportunity is not editable' using errcode='23514';
  end if;
  if jsonb_typeof(v_participant)<>'array' then raise exception 'Participant requirements must be an array' using errcode='22023'; end if;
  if exists(
    select 1 from jsonb_array_elements(v_participant) items(item)
    where jsonb_typeof(item)<>'object' or not(item?'audience_tag_id') or not(item?'treatment')
       or exists(select 1 from jsonb_object_keys(item) keys(key) where key<>all(array['audience_tag_id','treatment','confirmation_prompt']))
  ) then raise exception 'Invalid participant requirement object' using errcode='22023'; end if;

  delete from public.gpi_opportunity_cause_tags where opportunity_id=p_opportunity_id;
  delete from public.gpi_opportunity_activity_tags where opportunity_id=p_opportunity_id;
  delete from public.gpi_opportunity_participant_audiences where opportunity_id=p_opportunity_id;
  delete from public.gpi_opportunity_population_served where opportunity_id=p_opportunity_id;
  insert into public.gpi_opportunity_cause_tags(opportunity_id,cause_tag_id)
    select p_opportunity_id,id from unnest(coalesce(p_cause_tag_ids,'{}'::uuid[])) ids(id) group by id;
  insert into public.gpi_opportunity_activity_tags(opportunity_id,activity_tag_id)
    select p_opportunity_id,id from unnest(coalesce(p_activity_tag_ids,'{}'::uuid[])) ids(id) group by id;
  insert into public.gpi_opportunity_participant_audiences(opportunity_id,audience_tag_id,treatment,confirmation_prompt)
    select p_opportunity_id,(item->>'audience_tag_id')::uuid,lower(item->>'treatment'),nullif(btrim(coalesce(item->>'confirmation_prompt','')),'')
    from jsonb_array_elements(v_participant) items(item);
  insert into public.gpi_opportunity_population_served(opportunity_id,audience_tag_id)
    select p_opportunity_id,id from unnest(coalesce(p_population_served_ids,'{}'::uuid[])) ids(id) group by id;
  select content_revision into v_revision from public.gpi_opportunities where id=p_opportunity_id;
  insert into public.admin_audit_log(admin_id,action,target_table,target_id,meta)
  values(v_profile_id,'gpi_host_replace_opportunity_taxonomy','gpi_opportunities',p_opportunity_id::text,
    jsonb_build_object('source','gpi_host_set_opportunity_taxonomy','content_revision',v_revision));
  return v_revision;
end;
$$;

create or replace function public.gpi_host_set_opportunity_private_details(
  p_opportunity_id uuid,p_private_address_text text,p_virtual_join_url text
)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_profile_id uuid:=auth.uid();
  v_org_id uuid; v_org_status text; v_op_status text; v_revision integer;
  v_address text:=nullif(btrim(coalesce(p_private_address_text,'')),'');
  v_url text:=nullif(btrim(coalesce(p_virtual_join_url,'')),'');
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  select o.organization_id,o.status,org.status into v_org_id,v_op_status,v_org_status
  from public.gpi_opportunities o join public.gpi_organizations org on org.id=o.organization_id
  where o.id=p_opportunity_id for update of o,org;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;
  if not exists(select 1 from public.gpi_organization_members m where m.organization_id=v_org_id and m.profile_id=v_profile_id and m.active and m.role in ('admin','editor')) then
    raise exception 'not authorized for opportunity' using errcode='42501'; end if;
  if v_org_status in ('suspended','closed') or v_op_status='closed' then raise exception 'Organization or opportunity is not editable' using errcode='23514'; end if;
  if v_address is null and v_url is null then
    delete from public.gpi_opportunity_private_details where opportunity_id=p_opportunity_id;
  else
    insert into public.gpi_opportunity_private_details(opportunity_id,private_address_text,virtual_join_url)
    values(p_opportunity_id,v_address,v_url)
    on conflict(opportunity_id) do update set private_address_text=excluded.private_address_text,virtual_join_url=excluded.virtual_join_url;
  end if;
  select content_revision into v_revision from public.gpi_opportunities where id=p_opportunity_id;
  insert into public.admin_audit_log(admin_id,action,target_table,target_id,after_snapshot,meta)
  values(v_profile_id,'gpi_host_set_opportunity_private_details','gpi_opportunity_private_details',p_opportunity_id::text,
    jsonb_build_object('private_address_present',v_address is not null,'virtual_join_url_present',v_url is not null,'content_revision',v_revision),
    jsonb_build_object('source','gpi_host_set_opportunity_private_details','sensitive_values_excluded',true));
  return v_revision;
end;
$$;

create or replace function public.gpi_host_add_occurrence(
  p_opportunity_id uuid,p_starts_at timestamptz,p_ends_at timestamptz default null,p_registration_deadline timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_profile_id uuid:=auth.uid(); v_org_id uuid; v_org_status text; v_op_status text; v_id uuid; v_revision integer;
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_starts_at is null then raise exception 'Occurrence start is required' using errcode='22023'; end if;
  select o.organization_id,o.status,org.status into v_org_id,v_op_status,v_org_status
  from public.gpi_opportunities o join public.gpi_organizations org on org.id=o.organization_id
  where o.id=p_opportunity_id for update of o,org;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;
  if not exists(select 1 from public.gpi_organization_members m where m.organization_id=v_org_id and m.profile_id=v_profile_id and m.active and m.role in ('admin','editor')) then
    raise exception 'not authorized for opportunity' using errcode='42501'; end if;
  if v_org_status in ('suspended','closed') or v_op_status='closed' then raise exception 'Organization or opportunity is not editable' using errcode='23514'; end if;
  insert into public.gpi_opportunity_occurrences(opportunity_id,starts_at,ends_at,registration_deadline,confirmed_at)
  values(p_opportunity_id,p_starts_at,p_ends_at,p_registration_deadline,now()) returning id into v_id;
  v_revision:=public.gpi_host_touch_opportunity_revision(p_opportunity_id);
  insert into public.admin_audit_log(admin_id,action,target_table,target_id,after_snapshot,meta)
  values(v_profile_id,'gpi_host_add_occurrence','gpi_opportunity_occurrences',v_id::text,
    jsonb_build_object('opportunity_id',p_opportunity_id,'starts_at',p_starts_at,'ends_at',p_ends_at,'status','scheduled'),
    jsonb_build_object('source','gpi_host_add_occurrence','content_revision',v_revision));
  return v_id;
end;
$$;

create or replace function public.gpi_host_update_occurrence(
  p_occurrence_id uuid,p_starts_at timestamptz,p_ends_at timestamptz,p_status text,p_registration_deadline timestamptz,p_reconfirm boolean default false
)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_profile_id uuid:=auth.uid(); v_org_id uuid; v_org_status text; v_op_status text; v_opportunity_id uuid;
  v_before public.gpi_opportunity_occurrences%rowtype; v_after public.gpi_opportunity_occurrences%rowtype;
  v_material_changed boolean; v_revision integer;
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  select * into v_before from public.gpi_opportunity_occurrences where id=p_occurrence_id for update;
  if not found then raise exception 'Occurrence not found' using errcode='P0002'; end if;
  v_opportunity_id:=v_before.opportunity_id;
  select o.organization_id,o.status,org.status into v_org_id,v_op_status,v_org_status
  from public.gpi_opportunities o join public.gpi_organizations org on org.id=o.organization_id
  where o.id=v_opportunity_id for update of o,org;
  if not exists(select 1 from public.gpi_organization_members m where m.organization_id=v_org_id and m.profile_id=v_profile_id and m.active and m.role in ('admin','editor')) then
    raise exception 'not authorized for opportunity' using errcode='42501'; end if;
  if v_org_status in ('suspended','closed') or v_op_status='closed' then raise exception 'Organization or opportunity is not editable' using errcode='23514'; end if;
  v_material_changed:=row(p_starts_at,p_ends_at,lower(p_status),p_registration_deadline)
    is distinct from row(v_before.starts_at,v_before.ends_at,v_before.status,v_before.registration_deadline);
  update public.gpi_opportunity_occurrences set
    starts_at=p_starts_at,ends_at=p_ends_at,status=lower(p_status),registration_deadline=p_registration_deadline,
    confirmed_at=case when coalesce(p_reconfirm,false) then now() else confirmed_at end
  where id=p_occurrence_id returning * into v_after;
  if v_material_changed then v_revision:=public.gpi_host_touch_opportunity_revision(v_opportunity_id); end if;
  insert into public.admin_audit_log(admin_id,action,target_table,target_id,before_snapshot,after_snapshot,meta)
  values(v_profile_id,'gpi_host_update_occurrence','gpi_opportunity_occurrences',p_occurrence_id::text,
    jsonb_build_object('starts_at',v_before.starts_at,'ends_at',v_before.ends_at,'status',v_before.status),
    jsonb_build_object('starts_at',v_after.starts_at,'ends_at',v_after.ends_at,'status',v_after.status,'reconfirmed',coalesce(p_reconfirm,false)),
    jsonb_build_object('source','gpi_host_update_occurrence','material_changed',v_material_changed,'content_revision',v_revision));
  return v_after.status;
end;
$$;

create or replace function public.gpi_host_confirm_opportunity(p_opportunity_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_profile_id uuid:=auth.uid(); v_org_id uuid; v_org_status text; v_op_status text; v_at timestamptz:=now();
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  select o.organization_id,o.status,org.status into v_org_id,v_op_status,v_org_status
  from public.gpi_opportunities o join public.gpi_organizations org on org.id=o.organization_id
  where o.id=p_opportunity_id for update of o,org;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;
  if not exists(select 1 from public.gpi_organization_members m where m.organization_id=v_org_id and m.profile_id=v_profile_id and m.active and m.role in ('admin','editor')) then raise exception 'not authorized for opportunity' using errcode='42501'; end if;
  if v_org_status in ('suspended','closed') or v_op_status='closed' then raise exception 'Organization or opportunity cannot be confirmed' using errcode='23514'; end if;
  update public.gpi_opportunities set last_confirmed_at=v_at where id=p_opportunity_id;
  insert into public.admin_audit_log(admin_id,action,target_table,target_id,after_snapshot,meta)
  values(v_profile_id,'gpi_host_confirm_opportunity','gpi_opportunities',p_opportunity_id::text,
    jsonb_build_object('last_confirmed_at',v_at),jsonb_build_object('source','gpi_host_confirm_opportunity'));
  return v_at;
end;
$$;

create or replace function public.gpi_host_submit_for_review(p_opportunity_id uuid)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_profile_id uuid:=auth.uid(); v_org_id uuid; v_org_status text; v_op_status text;
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  select o.organization_id,o.status,org.status into v_org_id,v_op_status,v_org_status
  from public.gpi_opportunities o join public.gpi_organizations org on org.id=o.organization_id
  where o.id=p_opportunity_id for update of o,org;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;
  if not exists(select 1 from public.gpi_organization_members m where m.organization_id=v_org_id and m.profile_id=v_profile_id and m.active and m.role in ('admin','editor')) then raise exception 'not authorized for opportunity' using errcode='42501'; end if;
  if v_org_status in ('suspended','closed') then raise exception 'Suspended or closed organization cannot submit opportunities' using errcode='23514'; end if;
  if v_op_status='closed' then raise exception 'Closed opportunity cannot be submitted' using errcode='23514'; end if;
  if v_op_status='open' then raise exception 'Open opportunity must be materially edited before it can re-enter review' using errcode='23514'; end if;
  perform public.gpi_host_assert_review_ready(p_opportunity_id);
  update public.gpi_opportunities set status='requires_review',last_confirmed_at=now() where id=p_opportunity_id;
  insert into public.admin_audit_log(admin_id,action,target_table,target_id,before_snapshot,after_snapshot,meta)
  values(v_profile_id,'gpi_host_submit_for_review','gpi_opportunities',p_opportunity_id::text,
    jsonb_build_object('status',v_op_status),jsonb_build_object('status','requires_review'),jsonb_build_object('source','gpi_host_submit_for_review'));
  return 'requires_review';
end;
$$;

create or replace function public.gpi_host_withdraw_from_review(p_opportunity_id uuid)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_profile_id uuid:=auth.uid(); v_org_id uuid; v_org_status text; v_op_status text;
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  select o.organization_id,o.status,org.status into v_org_id,v_op_status,v_org_status
  from public.gpi_opportunities o join public.gpi_organizations org on org.id=o.organization_id
  where o.id=p_opportunity_id for update of o,org;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;
  if not exists(select 1 from public.gpi_organization_members m where m.organization_id=v_org_id and m.profile_id=v_profile_id and m.active and m.role in ('admin','editor')) then raise exception 'not authorized for opportunity' using errcode='42501'; end if;
  if v_org_status in ('suspended','closed') then raise exception 'Organization cannot withdraw review while suspended or closed' using errcode='23514'; end if;
  if v_op_status<>'requires_review' then raise exception 'Only an opportunity awaiting review can be withdrawn' using errcode='23514'; end if;
  update public.gpi_opportunities set status='draft',reviewed_revision=null,reviewed_by_profile_id=null,reviewed_at=null,reviewed_taxonomy_version_id=null
  where id=p_opportunity_id;
  insert into public.admin_audit_log(admin_id,action,target_table,target_id,before_snapshot,after_snapshot,meta)
  values(v_profile_id,'gpi_host_withdraw_from_review','gpi_opportunities',p_opportunity_id::text,
    jsonb_build_object('status','requires_review'),jsonb_build_object('status','draft','review_cleared',true),jsonb_build_object('source','gpi_host_withdraw_from_review'));
  return 'draft';
end;
$$;

create or replace function public.gpi_host_close_opportunity(p_opportunity_id uuid,p_reason text)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_profile_id uuid:=auth.uid(); v_org_id uuid; v_org_status text; v_op_status text;
  v_reason text:=nullif(btrim(coalesce(p_reason,'')),'');
begin
  if v_profile_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  if v_reason is null or char_length(v_reason)>1000 then raise exception 'Closure reason must contain 1 to 1000 characters' using errcode='22023'; end if;
  select o.organization_id,o.status,org.status into v_org_id,v_op_status,v_org_status
  from public.gpi_opportunities o join public.gpi_organizations org on org.id=o.organization_id
  where o.id=p_opportunity_id for update of o,org;
  if not found then raise exception 'Opportunity not found' using errcode='P0002'; end if;
  if not exists(select 1 from public.gpi_organization_members m where m.organization_id=v_org_id and m.profile_id=v_profile_id and m.active and m.role='admin') then
    raise exception 'organization admin role required' using errcode='42501'; end if;
  if v_org_status='closed' then raise exception 'Closed organization opportunity cannot be changed' using errcode='23514'; end if;
  if v_op_status='closed' then return 'closed'; end if;
  update public.gpi_opportunities set status='closed' where id=p_opportunity_id;
  insert into public.admin_audit_log(admin_id,action,target_table,target_id,reason,before_snapshot,after_snapshot,meta)
  values(v_profile_id,'gpi_host_close_opportunity','gpi_opportunities',p_opportunity_id::text,v_reason,
    jsonb_build_object('status',v_op_status),jsonb_build_object('status','closed'),jsonb_build_object('source','gpi_host_close_opportunity'));
  return 'closed';
end;
$$;

revoke all on function public.gpi_host_touch_opportunity_revision(uuid) from public,anon,authenticated;
revoke all on function public.gpi_host_assert_review_ready(uuid) from public,anon,authenticated;
grant execute on function public.gpi_host_touch_opportunity_revision(uuid) to postgres,service_role;
grant execute on function public.gpi_host_assert_review_ready(uuid) to postgres,service_role;

revoke all on function public.gpi_host_get_workspace(uuid) from public,anon;
revoke all on function public.gpi_host_get_opportunity_editor(uuid) from public,anon;
revoke all on function public.gpi_host_save_opportunity(uuid,uuid,jsonb) from public,anon;
revoke all on function public.gpi_host_set_opportunity_taxonomy(uuid,uuid[],uuid[],jsonb,uuid[]) from public,anon;
revoke all on function public.gpi_host_set_opportunity_private_details(uuid,text,text) from public,anon;
revoke all on function public.gpi_host_add_occurrence(uuid,timestamptz,timestamptz,timestamptz) from public,anon;
revoke all on function public.gpi_host_update_occurrence(uuid,timestamptz,timestamptz,text,timestamptz,boolean) from public,anon;
revoke all on function public.gpi_host_confirm_opportunity(uuid) from public,anon;
revoke all on function public.gpi_host_submit_for_review(uuid) from public,anon;
revoke all on function public.gpi_host_withdraw_from_review(uuid) from public,anon;
revoke all on function public.gpi_host_close_opportunity(uuid,text) from public,anon;

grant execute on function public.gpi_host_get_workspace(uuid) to authenticated,service_role;
grant execute on function public.gpi_host_get_opportunity_editor(uuid) to authenticated,service_role;
grant execute on function public.gpi_host_save_opportunity(uuid,uuid,jsonb) to authenticated,service_role;
grant execute on function public.gpi_host_set_opportunity_taxonomy(uuid,uuid[],uuid[],jsonb,uuid[]) to authenticated,service_role;
grant execute on function public.gpi_host_set_opportunity_private_details(uuid,text,text) to authenticated,service_role;
grant execute on function public.gpi_host_add_occurrence(uuid,timestamptz,timestamptz,timestamptz) to authenticated,service_role;
grant execute on function public.gpi_host_update_occurrence(uuid,timestamptz,timestamptz,text,timestamptz,boolean) to authenticated,service_role;
grant execute on function public.gpi_host_confirm_opportunity(uuid) to authenticated,service_role;
grant execute on function public.gpi_host_submit_for_review(uuid) to authenticated,service_role;
grant execute on function public.gpi_host_withdraw_from_review(uuid) to authenticated,service_role;
grant execute on function public.gpi_host_close_opportunity(uuid,text) to authenticated,service_role;
