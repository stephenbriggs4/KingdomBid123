-- FaithBid + Church OS — External Help v1
-- Migration 1: private bridge schema, RPC boundary, Concierge status sync
-- Target project: knkwaphosqronbhrvlsu
-- IMPORTANT: this file is generated for review only until explicitly applied.

create table private.faithbid_workspace_links (
  workspace_id uuid primary key
    references toolkit_core.workspaces(id) on delete cascade,

  concierge_organization_id uuid not null unique
    references concierge_ops.organizations(id) on delete restrict,

  link_status text not null default 'active'
    check (link_status in ('active','inactive')),

  link_basis text not null
    check (link_basis in ('pilot_manual','external_help_prepared')),

  linked_by uuid null
    references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.external_help_cases (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null
    references toolkit_core.workspaces(id) on delete cascade,

  created_by uuid not null
    references auth.users(id) on delete restrict,

  source_surface text not null
    check (source_surface in ('sunday','marketing','events','vault','facilities','manual')),

  source_entity_type text not null,
  source_entity_id uuid null,
  source_subkey text null,

  title text not null check (btrim(title) <> ''),
  service_category text not null
    check (
      btrim(service_category) <> ''
      and concierge_ops.service_categories_are_valid(array[service_category])
    ),
  external_safe_description text not null
    check (btrim(external_safe_description) <> ''),
  desired_outcome text null,
  must_haves text null,

  urgency text not null default 'standard'
    check (urgency in ('critical','time_sensitive','standard','exploratory')),

  target_decision_on date null,
  target_start_on date null,
  service_location text null,

  delivery_requirement text not null default 'unknown'
    check (delivery_requirement in (
      'on_site_local','on_site_regional','on_site_nationwide','remote','hybrid','unknown'
    )),

  budget_status text not null default 'unknown'
    check (budget_status in ('confirmed','working_range','not_set','declined_to_share','unknown')),

  budget_band text not null default 'not_disclosed_or_unknown'
    check (budget_band in (
      'under_5000','5000_to_24999','25000_to_99999','100000_or_more','not_disclosed_or_unknown'
    )),

  faith_alignment_requirement text not null default 'unknown'
    check (faith_alignment_requirement in (
      'required','strongly_preferred','preferred','not_material','unknown'
    )),

  resolution_path text not null default 'concierge'
    check (resolution_path in ('concierge','marketplace')),

  stage text not null default 'draft'
    check (stage in (
      'draft','help_requested','under_review','sourcing','providers_ready',
      'church_reviewing','selected','preparing','active','completed',
      'blocked','closed','cancelled'
    )),

  sourcing_permission_status text not null default 'not_requested'
    check (sourcing_permission_status in ('not_requested','granted','declined','revoked')),

  church_identity_permission_status text not null default 'not_requested'
    check (church_identity_permission_status in ('not_requested','granted','declined','revoked')),

  public_sourcing_permission_status text not null default 'not_requested'
    check (public_sourcing_permission_status in ('not_requested','granted','declined','revoked')),

  brief_confirmed_at timestamptz null,
  brief_confirmed_by uuid null references auth.users(id) on delete set null,

  concierge_need_id uuid null unique
    references concierge_ops.needs(id) on delete set null,

  concierge_engagement_id uuid null unique
    references concierge_ops.engagements(id) on delete set null,

  preferred_match_id uuid null
    references concierge_ops.matches(id) on delete set null,
  preferred_match_recorded_at timestamptz null,
  preferred_match_recorded_by uuid null
    references auth.users(id) on delete set null,

  next_action text null,
  next_action_owner text not null default 'church'
    check (next_action_owner in ('church','faithbid','provider','none')),

  requested_at timestamptz null,
  last_changed_at timestamptz not null default now(),
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (target_start_on is null or target_decision_on is null or target_start_on >= target_decision_on),

  check (
    (source_surface = 'sunday'
      and source_entity_type = 'service_plan'
      and source_entity_id is not null
      and source_subkey is not null)
    or
    (source_surface = 'manual'
      and source_entity_type = 'manual_need'
      and source_entity_id is null
      and source_subkey is null)
    or
    source_surface in ('marketing','events','vault','facilities')
  ),

  check (
    (sourcing_permission_status <> 'granted')
    or (brief_confirmed_at is not null and brief_confirmed_by is not null and requested_at is not null)
  )
);

create index external_help_cases_workspace_stage_idx
  on private.external_help_cases (workspace_id, stage, last_changed_at desc);

create index external_help_cases_source_idx
  on private.external_help_cases (
    workspace_id, source_surface, source_entity_type, source_entity_id, source_subkey
  );

create index external_help_cases_action_owner_idx
  on private.external_help_cases (workspace_id, next_action_owner, stage, last_changed_at desc);

alter table private.faithbid_workspace_links enable row level security;
alter table private.external_help_cases enable row level security;

revoke all on table private.faithbid_workspace_links from public, anon, authenticated, service_role;
revoke all on table private.external_help_cases from public, anon, authenticated, service_role;


create function private.kb_external_help_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.kb_external_help_touch_updated_at() from public, anon, authenticated, service_role;

create trigger trg_faithbid_workspace_links_touch_updated_at
before update on private.faithbid_workspace_links
for each row execute function private.kb_external_help_touch_updated_at();

create trigger trg_external_help_cases_touch_updated_at
before update on private.external_help_cases
for each row execute function private.kb_external_help_touch_updated_at();


create function private.kb_external_help_workspace_role(p_workspace uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select wm.role
  from toolkit_core.workspace_members wm
  where wm.workspace_id = p_workspace
    and wm.user_id = auth.uid()
    and wm.status = 'active'
  limit 1
$$;

revoke all on function private.kb_external_help_workspace_role(uuid) from public, anon, authenticated, service_role;


create function private.kb_external_help_case_json(p_case uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', c.id,
    'workspace_id', c.workspace_id,
    'source_surface', c.source_surface,
    'source_entity_type', c.source_entity_type,
    'source_entity_id', c.source_entity_id,
    'source_subkey', c.source_subkey,
    'title', c.title,
    'service_category', c.service_category,
    'external_safe_description', c.external_safe_description,
    'desired_outcome', c.desired_outcome,
    'must_haves', c.must_haves,
    'urgency', c.urgency,
    'target_decision_on', c.target_decision_on,
    'target_start_on', c.target_start_on,
    'service_location', c.service_location,
    'delivery_requirement', c.delivery_requirement,
    'budget_status', c.budget_status,
    'budget_band', c.budget_band,
    'faith_alignment_requirement', c.faith_alignment_requirement,
    'resolution_path', c.resolution_path,
    'stage', c.stage,
    'sourcing_permission_status', c.sourcing_permission_status,
    'church_identity_permission_status', c.church_identity_permission_status,
    'public_sourcing_permission_status', c.public_sourcing_permission_status,
    'brief_confirmed_at', c.brief_confirmed_at,
    'preferred_match_id', c.preferred_match_id,
    'preferred_match_recorded_at', c.preferred_match_recorded_at,
    'next_action', c.next_action,
    'next_action_owner', c.next_action_owner,
    'requested_at', c.requested_at,
    'last_changed_at', c.last_changed_at,
    'resolved_at', c.resolved_at,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  )
  from private.external_help_cases c
  where c.id = p_case
$$;

revoke all on function private.kb_external_help_case_json(uuid) from public, anon, authenticated, service_role;


create function public.kb_external_help_save_draft(
  p_ws uuid,
  p_case uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_case private.external_help_cases%rowtype;
  v_extra_key text;
  v_surface text;
  v_entity_type text;
  v_entity_id uuid;
  v_subkey text;
  v_title text;
  v_category text;
  v_description text;
  v_desired_outcome text;
  v_must_haves text;
  v_urgency text;
  v_target_decision date;
  v_target_start date;
  v_location text;
  v_delivery text;
  v_budget_status text;
  v_budget_band text;
  v_faith text;
  v_plan_start timestamptz;
  v_role_name text;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  v_role := private.kb_external_help_workspace_role(p_ws);
  if v_role is null or v_role not in ('owner','pastor','admin','leader') then
    raise exception using errcode = '42501', message = 'This workspace role cannot prepare an External Help request';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'External Help payload must be a JSON object';
  end if;

  select keys.key into v_extra_key
  from jsonb_object_keys(p_payload) as keys(key)
  where keys.key not in (
    'source_surface','source_entity_type','source_entity_id','source_subkey',
    'title','service_category','external_safe_description','desired_outcome',
    'must_haves','urgency','target_decision_on','target_start_on',
    'service_location','delivery_requirement','budget_status','budget_band',
    'faith_alignment_requirement'
  )
  limit 1;

  if v_extra_key is not null then
    raise exception using errcode = '22023',
      message = format('Unsupported External Help field: %s', v_extra_key);
  end if;

  v_surface := lower(btrim(coalesce(p_payload->>'source_surface','')));
  v_entity_type := lower(btrim(coalesce(p_payload->>'source_entity_type','')));
  v_subkey := nullif(btrim(p_payload->>'source_subkey'), '');
  v_title := nullif(btrim(p_payload->>'title'), '');
  v_category := lower(btrim(coalesce(p_payload->>'service_category','')));
  v_description := nullif(btrim(p_payload->>'external_safe_description'), '');
  v_desired_outcome := nullif(btrim(p_payload->>'desired_outcome'), '');
  v_must_haves := nullif(btrim(p_payload->>'must_haves'), '');
  v_urgency := lower(btrim(coalesce(p_payload->>'urgency','standard')));
  v_location := nullif(btrim(p_payload->>'service_location'), '');
  v_delivery := lower(btrim(coalesce(p_payload->>'delivery_requirement','unknown')));
  v_budget_status := lower(btrim(coalesce(p_payload->>'budget_status','unknown')));
  v_budget_band := lower(btrim(coalesce(p_payload->>'budget_band','not_disclosed_or_unknown')));
  v_faith := lower(btrim(coalesce(p_payload->>'faith_alignment_requirement','unknown')));

  begin
    v_entity_id := nullif(p_payload->>'source_entity_id','')::uuid;
    v_target_decision := nullif(p_payload->>'target_decision_on','')::date;
    v_target_start := nullif(p_payload->>'target_start_on','')::date;
  exception when invalid_text_representation or invalid_datetime_format or datetime_field_overflow then
    raise exception using errcode = '22023', message = 'One or more External Help identifiers or dates are invalid';
  end;

  if v_title is null then
    raise exception using errcode = '22023', message = 'A need title is required';
  end if;
  if v_description is null then
    raise exception using errcode = '22023', message = 'An external-safe description is required';
  end if;
  if not concierge_ops.service_categories_are_valid(array[v_category]) then
    raise exception using errcode = '22023', message = 'Unsupported FaithBid service category';
  end if;
  if v_urgency not in ('critical','time_sensitive','standard','exploratory') then
    raise exception using errcode = '22023', message = 'Invalid urgency';
  end if;
  if v_delivery not in ('on_site_local','on_site_regional','on_site_nationwide','remote','hybrid','unknown') then
    raise exception using errcode = '22023', message = 'Invalid delivery requirement';
  end if;
  if v_budget_status not in ('confirmed','working_range','not_set','declined_to_share','unknown') then
    raise exception using errcode = '22023', message = 'Invalid budget status';
  end if;
  if v_budget_band not in ('under_5000','5000_to_24999','25000_to_99999','100000_or_more','not_disclosed_or_unknown') then
    raise exception using errcode = '22023', message = 'Invalid budget band';
  end if;
  if v_faith not in ('required','strongly_preferred','preferred','not_material','unknown') then
    raise exception using errcode = '22023', message = 'Invalid faith-alignment requirement';
  end if;

  if v_surface = 'sunday' then
    if v_entity_type <> 'service_plan' or v_entity_id is null or v_subkey is null or v_subkey not like 'role:%' then
      raise exception using errcode = '22023', message = 'Sunday External Help must reference a service plan and role';
    end if;

    select sp.starts_at
      into v_plan_start
    from toolkit_core.service_plans sp
    where sp.id = v_entity_id
      and sp.workspace_id = p_ws;

    if not found then
      raise exception using errcode = '22023', message = 'The referenced Sunday plan does not belong to this workspace';
    end if;

    select sr.name
      into v_role_name
    from toolkit_core.service_roles sr
    where sr.plan_id = v_entity_id
      and lower(btrim(sr.name)) = lower(btrim(substr(v_subkey, 6)))
    limit 1;

    if v_role_name is null then
      raise exception using errcode = '22023', message = 'The referenced Sunday role does not exist on this service plan';
    end if;

    if not (
      lower(v_role_name) like '%sound%'
      or lower(v_role_name) like '%audio%'
      or lower(v_role_name) ~ '(^|[^a-z0-9])av([^a-z0-9]|$)'
      or lower(v_role_name) like '%video%'
      or lower(v_role_name) like '%livestream%'
      or lower(v_role_name) like '%live stream%'
      or lower(v_role_name) like '%lighting%'
      or lower(v_role_name) like '%production%'
    ) then
      raise exception using errcode = '22023', message = 'This Sunday role is not eligible for the External Help pilot';
    end if;

    if v_category <> 'av_production_and_worship_technology' then
      raise exception using errcode = '22023', message = 'Sunday External Help is limited to AV / production during the Dallas pilot';
    end if;

    v_subkey := 'role:' || lower(regexp_replace(btrim(v_role_name), '[[:space:]]+', ' ', 'g'));
    v_target_start := v_plan_start::date;

  elsif v_surface = 'manual' then
    if v_entity_type <> 'manual_need' or v_entity_id is not null or v_subkey is not null then
      raise exception using errcode = '22023', message = 'Manual External Help source fields are invalid';
    end if;

  else
    raise exception using errcode = '22023', message = 'This Church OS surface is not enabled for External Help v1';
  end if;

  if v_target_start is not null and v_target_decision is not null and v_target_start < v_target_decision then
    raise exception using errcode = '22023', message = 'Target start date cannot be before the decision date';
  end if;

  if p_case is null then
    insert into private.external_help_cases (
      workspace_id, created_by,
      source_surface, source_entity_type, source_entity_id, source_subkey,
      title, service_category, external_safe_description, desired_outcome, must_haves,
      urgency, target_decision_on, target_start_on, service_location, delivery_requirement,
      budget_status, budget_band, faith_alignment_requirement,
      resolution_path, stage, sourcing_permission_status,
      church_identity_permission_status, public_sourcing_permission_status,
      next_action, next_action_owner, last_changed_at
    ) values (
      p_ws, auth.uid(),
      v_surface, v_entity_type, v_entity_id, v_subkey,
      v_title, v_category, v_description, v_desired_outcome, v_must_haves,
      v_urgency, v_target_decision, v_target_start, v_location, v_delivery,
      v_budget_status, v_budget_band, v_faith,
      'concierge', 'draft', 'not_requested',
      'not_requested', 'not_requested',
      'Review this brief before requesting FaithBid help.', 'church', now()
    )
    returning * into v_case;
  else
    select *
      into v_case
    from private.external_help_cases
    where id = p_case
      and workspace_id = p_ws
    for update;

    if not found then
      raise exception using errcode = 'P0002', message = 'External Help case not found';
    end if;
    if v_case.stage <> 'draft' or v_case.concierge_need_id is not null then
      raise exception using errcode = '55000', message = 'Only an unsubmitted draft can be edited';
    end if;

    update private.external_help_cases
    set source_surface = v_surface,
        source_entity_type = v_entity_type,
        source_entity_id = v_entity_id,
        source_subkey = v_subkey,
        title = v_title,
        service_category = v_category,
        external_safe_description = v_description,
        desired_outcome = v_desired_outcome,
        must_haves = v_must_haves,
        urgency = v_urgency,
        target_decision_on = v_target_decision,
        target_start_on = v_target_start,
        service_location = v_location,
        delivery_requirement = v_delivery,
        budget_status = v_budget_status,
        budget_band = v_budget_band,
        faith_alignment_requirement = v_faith,
        resolution_path = 'concierge',
        sourcing_permission_status = 'not_requested',
        church_identity_permission_status = 'not_requested',
        public_sourcing_permission_status = 'not_requested',
        brief_confirmed_at = null,
        brief_confirmed_by = null,
        requested_at = null,
        next_action = 'Review this brief before requesting FaithBid help.',
        next_action_owner = 'church',
        last_changed_at = now()
    where id = v_case.id
    returning * into v_case;
  end if;

  return private.kb_external_help_case_json(v_case.id);
end;
$$;


create function public.kb_external_help_request(p_case uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_case private.external_help_cases%rowtype;
  v_role text;
  v_link private.faithbid_workspace_links%rowtype;
  v_need_id uuid;
  v_budget_basis text;
  v_budget_band_basis text;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select *
    into v_case
  from private.external_help_cases
  where id = p_case
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'External Help case not found';
  end if;

  v_role := private.kb_external_help_workspace_role(v_case.workspace_id);
  if v_role is null or v_role not in ('owner','pastor','admin') then
    raise exception using errcode = '42501', message = 'This workspace role cannot request FaithBid help';
  end if;

  if v_case.concierge_need_id is not null then
    return private.kb_external_help_case_json(v_case.id);
  end if;

  if v_case.stage <> 'draft' then
    raise exception using errcode = '55000', message = 'Only a draft External Help case can be requested';
  end if;

  select *
    into v_link
  from private.faithbid_workspace_links
  where workspace_id = v_case.workspace_id
    and link_status = 'active';

  if not found then
    raise exception using errcode = '55000', message = 'This Church OS workspace is not prepared for FaithBid External Help';
  end if;

  if v_case.source_surface not in ('sunday','manual') then
    raise exception using errcode = '55000', message = 'This Church OS surface is not enabled for External Help v1';
  end if;

  if not concierge_ops.service_categories_are_valid(array[v_case.service_category]) then
    raise exception using errcode = '22023', message = 'Unsupported FaithBid service category';
  end if;

  update private.external_help_cases
  set sourcing_permission_status = 'granted',
      brief_confirmed_at = now(),
      brief_confirmed_by = auth.uid(),
      requested_at = now(),
      last_changed_at = now()
  where id = v_case.id
  returning * into v_case;

  if v_case.budget_band = 'not_disclosed_or_unknown' then
    v_budget_basis := null;
    v_budget_band_basis := 'manual_review';
  else
    v_budget_basis := 'total_project';
    v_budget_band_basis := 'organization_declared_total_project';
  end if;

  insert into concierge_ops.needs (
    organization_id,
    need_title,
    need_origin,
    need_type,
    service_frequency,
    primary_service_category,
    secondary_service_categories,
    service_detail,
    need_brief,
    desired_outcome,
    must_haves,
    nice_to_haves,
    urgency,
    target_decision_on,
    target_start_on,
    budget_status,
    budget_basis,
    budget_band,
    budget_band_basis,
    delivery_requirement,
    service_location,
    faith_alignment_requirement,
    faith_fit_rationale,
    risk_tier,
    compliance_gate,
    status,
    owner_id,
    next_action,
    next_action_on,
    shortlist_target,
    requesting_contact_id,
    decision_maker_ids,
    church_sourcing_permission_status,
    referral_contact_permission_status,
    church_identity_permission_status,
    public_sourcing_permission_status,
    church_sourcing_permission_recorded_at,
    church_sourcing_permission_source,
    church_sourcing_permission_reference,
    church_sourcing_permission_recorded_by
  ) values (
    v_link.concierge_organization_id,
    v_case.title,
    'organization_request',
    'one_time_project',
    'unknown',
    v_case.service_category,
    '{}'::text[],
    v_case.external_safe_description,
    v_case.external_safe_description,
    v_case.desired_outcome,
    v_case.must_haves,
    null,
    v_case.urgency,
    v_case.target_decision_on,
    v_case.target_start_on,
    v_case.budget_status,
    v_budget_basis,
    v_case.budget_band,
    v_budget_band_basis,
    v_case.delivery_requirement,
    v_case.service_location,
    v_case.faith_alignment_requirement,
    '',
    'unclassified',
    'standard',
    'intake',
    null,
    'Review confirmed Church OS help request',
    current_date,
    3,
    null,
    '{}'::uuid[],
    'granted',
    'not_applicable',
    'not_requested',
    'not_requested',
    now(),
    'other',
    'church_os_external_help:' || v_case.id::text,
    auth.uid()
  )
  returning id into v_need_id;

  update private.external_help_cases
  set concierge_need_id = v_need_id,
      stage = 'help_requested',
      next_action = 'FaithBid is reviewing your request.',
      next_action_owner = 'faithbid',
      last_changed_at = now()
  where id = v_case.id;

  return private.kb_external_help_case_json(v_case.id);
end;
$$;


create function public.kb_external_help_list(p_ws uuid)
returns table (
  id uuid,
  source_surface text,
  source_entity_type text,
  source_entity_id uuid,
  source_subkey text,
  title text,
  service_category text,
  stage text,
  next_action text,
  next_action_owner text,
  requested_at timestamptz,
  last_changed_at timestamptz,
  resolved_at timestamptz,
  preferred_match_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
     or private.kb_external_help_workspace_role(p_ws) is null then
    raise exception using errcode = '42501', message = 'Active workspace membership is required';
  end if;

  return query
  select
    c.id,
    c.source_surface,
    c.source_entity_type,
    c.source_entity_id,
    c.source_subkey,
    c.title,
    c.service_category,
    c.stage,
    c.next_action,
    c.next_action_owner,
    c.requested_at,
    c.last_changed_at,
    c.resolved_at,
    c.preferred_match_id
  from private.external_help_cases c
  where c.workspace_id = p_ws
  order by c.last_changed_at desc, c.created_at desc;
end;
$$;


create function public.kb_external_help_get(p_case uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_case private.external_help_cases%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select *
    into v_case
  from private.external_help_cases
  where id = p_case;

  if not found then
    raise exception using errcode = 'P0002', message = 'External Help case not found';
  end if;

  if private.kb_external_help_workspace_role(v_case.workspace_id) is null then
    raise exception using errcode = '42501', message = 'Active workspace membership is required';
  end if;

  return private.kb_external_help_case_json(v_case.id);
end;
$$;


create function public.kb_external_help_shortlist(p_case uuid)
returns table (
  match_id uuid,
  vendor_name text,
  platform_vendor_id uuid,
  overall_fit text,
  fit_rationale text,
  recommendation_summary text,
  shortlist_rank smallint,
  quote_status text,
  quoted_amount_cents bigint,
  quote_basis text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_case private.external_help_cases%rowtype;
  v_need_status text;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select *
    into v_case
  from private.external_help_cases
  where id = p_case;

  if not found then
    raise exception using errcode = 'P0002', message = 'External Help case not found';
  end if;

  if private.kb_external_help_workspace_role(v_case.workspace_id) is null then
    raise exception using errcode = '42501', message = 'Active workspace membership is required';
  end if;

  if v_case.concierge_need_id is null then
    raise exception using errcode = '55000', message = 'This External Help case has no Concierge need';
  end if;

  select n.status
    into v_need_status
  from concierge_ops.needs n
  where n.id = v_case.concierge_need_id
    and n.archived_at is null;

  if not found then
    raise exception using errcode = 'P0002', message = 'Linked Concierge need not found';
  end if;

  if v_need_status not in ('shortlist_ready','organization_reviewing') then
    raise exception using errcode = '55000', message = 'Providers are not ready for church review';
  end if;

  return query
  select
    m.id,
    v.vendor_name,
    v.platform_vendor_id,
    m.overall_fit,
    m.fit_rationale,
    m.recommendation_summary,
    m.shortlist_rank,
    m.quote_status,
    m.quoted_amount_cents,
    m.quote_basis
  from concierge_ops.matches m
  join concierge_ops.vendors v on v.id = m.vendor_id
  where m.need_id = v_case.concierge_need_id
    and m.stage in ('shortlisted','selected')
    and m.archived_at is null
    and v.archived_at is null
  order by m.shortlist_rank nulls last, m.updated_at desc;
end;
$$;


create function public.kb_external_help_record_preference(
  p_case uuid,
  p_match uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_case private.external_help_cases%rowtype;
  v_role text;
  v_need concierge_ops.needs%rowtype;
  v_match concierge_ops.matches%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select *
    into v_case
  from private.external_help_cases
  where id = p_case
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'External Help case not found';
  end if;

  v_role := private.kb_external_help_workspace_role(v_case.workspace_id);
  if v_role is null or v_role not in ('owner','pastor','admin') then
    raise exception using errcode = '42501', message = 'This workspace role cannot select a preferred provider';
  end if;

  if v_case.concierge_need_id is null then
    raise exception using errcode = '55000', message = 'This External Help case has no Concierge need';
  end if;

  select *
    into v_need
  from concierge_ops.needs
  where id = v_case.concierge_need_id
    and archived_at is null
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Linked Concierge need not found';
  end if;

  if v_need.status not in ('shortlist_ready','organization_reviewing') then
    raise exception using errcode = '55000', message = 'The provider shortlist is not open for church selection';
  end if;

  select *
    into v_match
  from concierge_ops.matches
  where id = p_match
    and need_id = v_case.concierge_need_id
    and stage = 'shortlisted'
    and archived_at is null
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'The selected provider is not an active shortlisted match for this need';
  end if;

  update private.external_help_cases
  set preferred_match_id = v_match.id,
      preferred_match_recorded_at = now(),
      preferred_match_recorded_by = auth.uid(),
      stage = 'selected',
      next_action = 'FaithBid is finalizing the introduction.',
      next_action_owner = 'faithbid',
      last_changed_at = now()
  where id = v_case.id;

  update concierge_ops.needs
  set next_action = 'Church selected a provider through External Help; finalize the introduction.',
      next_action_on = current_date
  where id = v_need.id;

  return private.kb_external_help_case_json(v_case.id);
end;
$$;


create function public.kb_admin_prepare_external_help_workspace(
  p_workspace uuid,
  p_concierge_organization uuid default null,
  p_organization_name text default null,
  p_mark_pilot boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link private.faithbid_workspace_links%rowtype;
  v_org concierge_ops.organizations%rowtype;
  v_workspace_name text;
  v_mark_pilot boolean := coalesce(p_mark_pilot, false);
begin
  if auth.uid() is null or not public.kb_is_platform_admin() then
    raise exception using errcode = '42501', message = 'Platform administrator access is required';
  end if;

  select w.name
    into v_workspace_name
  from toolkit_core.workspaces w
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
  elsif found then
    select *
      into v_org
    from concierge_ops.organizations
    where id = v_link.concierge_organization_id
      and archived_at is null
      and lifecycle_stage = 'active'
      and organization_type in ('church','ministry');

    if not found then
      v_org.id := null;
    end if;
  end if;

  if v_org.id is null then
    insert into concierge_ops.organizations (
      organization_name,
      organization_type,
      lifecycle_stage,
      pilot_cohort,
      relationship_source,
      relationship_summary,
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
$$;


create function private.kb_external_help_sync_need()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_case private.external_help_cases%rowtype;
  v_stage text;
  v_owner text;
  v_action text;
  v_terminal boolean := false;
  v_has_live_engagement boolean := false;
begin
  select *
    into v_case
  from private.external_help_cases
  where concierge_need_id = new.id
  for update;

  if not found then
    return new;
  end if;

  if new.status = 'organization_reviewing'
     and v_case.preferred_match_id is not null
     and v_case.stage = 'selected' then
    return new;
  end if;

  case new.status
    when 'intake' then
      v_stage := 'help_requested';
      v_owner := 'faithbid';
      v_action := 'FaithBid is reviewing your request.';
    when 'clarifying' then
      v_stage := 'under_review';
      v_owner := 'faithbid';
      v_action := 'FaithBid is clarifying the request.';
    when 'ready_to_source' then
      v_stage := 'under_review';
      v_owner := 'faithbid';
      v_action := 'FaithBid is preparing to source providers.';
    when 'sourcing' then
      v_stage := 'sourcing';
      v_owner := 'faithbid';
      v_action := 'FaithBid is sourcing providers.';
    when 'shortlist_ready' then
      v_stage := 'providers_ready';
      v_owner := 'church';
      v_action := 'Providers are ready for your review.';
    when 'organization_reviewing' then
      v_stage := 'church_reviewing';
      v_owner := 'church';
      v_action := 'Review the provider shortlist in FaithBid.';
    when 'vendor_selected' then
      v_stage := 'selected';
      v_owner := 'faithbid';
      v_action := 'FaithBid is finalizing the introduction.';
    when 'closed_unfilled' then
      v_stage := 'closed';
      v_owner := 'none';
      v_action := 'FaithBid closed this request without a provider.';
      v_terminal := true;
    when 'cancelled' then
      v_stage := 'cancelled';
      v_owner := 'none';
      v_action := 'This help request was cancelled.';
      v_terminal := true;
    else
      return new;
  end case;

  if v_terminal and v_case.concierge_engagement_id is not null then
    select exists (
      select 1
      from concierge_ops.engagements e
      where e.id = v_case.concierge_engagement_id
        and e.archived_at is null
        and e.status not in ('completed','closed','cancelled')
    ) into v_has_live_engagement;
  end if;

  update private.external_help_cases
  set stage = v_stage,
      next_action = v_action,
      next_action_owner = v_owner,
      last_changed_at = now(),
      resolved_at = case
        when v_terminal and not v_has_live_engagement then coalesce(resolved_at, now())
        when not v_terminal then null
        else resolved_at
      end
  where id = v_case.id;

  return new;
end;
$$;

revoke all on function private.kb_external_help_sync_need() from public, anon, authenticated, service_role;


create function private.kb_external_help_sync_engagement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_need_id uuid;
  v_case private.external_help_cases%rowtype;
  v_stage text;
  v_owner text;
  v_action text;
  v_terminal boolean := false;
begin
  select m.need_id
    into v_need_id
  from concierge_ops.matches m
  where m.id = new.selected_match_id;

  if v_need_id is null then
    return new;
  end if;

  select *
    into v_case
  from private.external_help_cases
  where concierge_need_id = v_need_id
  for update;

  if not found then
    return new;
  end if;

  case new.status
    when 'preparing' then
      v_stage := 'preparing';
      v_owner := 'faithbid';
      v_action := 'FaithBid is preparing the engagement.';
    when 'active' then
      v_stage := 'active';
      v_owner := 'faithbid';
      v_action := 'The outside-help engagement is active.';
    when 'at_risk' then
      v_stage := 'blocked';
      v_owner := 'faithbid';
      v_action := 'FaithBid is resolving an issue with this engagement.';
    when 'completed' then
      v_stage := 'completed';
      v_owner := 'none';
      v_action := 'Work completed.';
      v_terminal := true;
    when 'closed' then
      v_stage := 'closed';
      v_owner := 'none';
      v_action := 'This outside-help case is closed.';
      v_terminal := true;
    when 'cancelled' then
      v_stage := 'cancelled';
      v_owner := 'none';
      v_action := 'This outside-help engagement was cancelled.';
      v_terminal := true;
    else
      return new;
  end case;

  update private.external_help_cases
  set concierge_engagement_id = new.id,
      stage = v_stage,
      next_action = v_action,
      next_action_owner = v_owner,
      last_changed_at = now(),
      resolved_at = case when v_terminal then coalesce(resolved_at, now()) else null end
  where id = v_case.id;

  return new;
end;
$$;

revoke all on function private.kb_external_help_sync_engagement() from public, anon, authenticated, service_role;


create trigger trg_external_help_sync_need
after insert or update of status on concierge_ops.needs
for each row execute function private.kb_external_help_sync_need();

create trigger trg_external_help_sync_engagement
after insert or update of status on concierge_ops.engagements
for each row execute function private.kb_external_help_sync_engagement();


revoke all on function public.kb_external_help_save_draft(uuid, uuid, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.kb_external_help_request(uuid) from public, anon, authenticated, service_role;
revoke all on function public.kb_external_help_list(uuid) from public, anon, authenticated, service_role;
revoke all on function public.kb_external_help_get(uuid) from public, anon, authenticated, service_role;
revoke all on function public.kb_external_help_shortlist(uuid) from public, anon, authenticated, service_role;
revoke all on function public.kb_external_help_record_preference(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.kb_admin_prepare_external_help_workspace(uuid, uuid, text, boolean) from public, anon, authenticated, service_role;

grant execute on function public.kb_external_help_save_draft(uuid, uuid, jsonb) to authenticated;
grant execute on function public.kb_external_help_request(uuid) to authenticated;
grant execute on function public.kb_external_help_list(uuid) to authenticated;
grant execute on function public.kb_external_help_get(uuid) to authenticated;
grant execute on function public.kb_external_help_shortlist(uuid) to authenticated;
grant execute on function public.kb_external_help_record_preference(uuid, uuid) to authenticated;
grant execute on function public.kb_admin_prepare_external_help_workspace(uuid, uuid, text, boolean) to authenticated;

comment on table private.faithbid_workspace_links is
  'Private one-to-one bridge from a Church OS workspace to the FaithBid Concierge organization used for External Help.';

comment on table private.external_help_cases is
  'Private Church OS -> FaithBid Concierge bridge. Contains only the external-safe brief and simplified return status; never a Marketplace project.';

comment on function public.kb_external_help_request(uuid) is
  'Explicit church confirmation gate. Creates at most one Concierge need and records sourcing permission; does not grant church identity disclosure or public sourcing permission.';

comment on function public.kb_external_help_record_preference(uuid, uuid) is
  'Records a church provider preference only. Does not select the Concierge match, finalize placement, set fees, or create an engagement.';
