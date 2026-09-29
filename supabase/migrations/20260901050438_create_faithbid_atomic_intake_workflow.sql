-- FaithBid Concierge Operations
-- Atomic organization + primary contact + need intake workflow

create or replace function concierge_ops.create_intake_bundle(p_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_contact_id uuid;
  v_need_id uuid;
  v_organization_name text := nullif(btrim(p_payload ->> 'organization_name'), '');
  v_contact_first_name text := nullif(btrim(p_payload ->> 'contact_first_name'), '');
  v_contact_last_name text := nullif(btrim(p_payload ->> 'contact_last_name'), '');
  v_need_title text := nullif(btrim(p_payload ->> 'need_title'), '');
  v_need_type text := coalesce(nullif(btrim(p_payload ->> 'need_type'), ''), 'unknown');
  v_budget_status text := coalesce(nullif(btrim(p_payload ->> 'budget_status'), ''), 'unknown');
  v_budget_band text := coalesce(nullif(btrim(p_payload ->> 'budget_band'), ''), 'not_disclosed_or_unknown');
  v_budget_basis text;
  v_budget_band_basis text;
begin
  if not public.kb_is_platform_admin() then
    raise exception using
      errcode = '42501',
      message = 'Platform administrator access is required';
  end if;

  if v_organization_name is null then
    raise exception 'Organization name is required';
  end if;

  if v_contact_first_name is null and v_contact_last_name is null then
    raise exception 'Primary contact first or last name is required';
  end if;

  if v_need_title is null then
    raise exception 'Need title is required';
  end if;

  if v_budget_band = 'not_disclosed_or_unknown' then
    v_budget_band_basis := 'manual_review';
    v_budget_basis := null;
  elsif v_need_type in ('recurring_service', 'hybrid') then
    v_budget_band_basis := 'organization_declared_first_12_months';
    v_budget_basis := 'annual';
  else
    v_budget_band_basis := 'organization_declared_total_project';
    v_budget_basis := 'total_project';
  end if;

  if v_budget_band <> 'not_disclosed_or_unknown'
     and v_budget_status not in ('confirmed', 'working_range') then
    raise exception 'A declared budget band requires Confirmed or Working Range budget status';
  end if;

  insert into concierge_ops.organizations (
    organization_name,
    organization_type,
    website,
    city,
    state_region,
    country,
    lifecycle_stage,
    pilot_cohort,
    relationship_source,
    relationship_summary
  ) values (
    v_organization_name,
    nullif(btrim(p_payload ->> 'organization_type'), ''),
    nullif(btrim(p_payload ->> 'website'), ''),
    nullif(btrim(p_payload ->> 'city'), ''),
    nullif(btrim(p_payload ->> 'state_region'), ''),
    coalesce(nullif(btrim(p_payload ->> 'country'), ''), 'United States'),
    'discovery',
    coalesce((p_payload ->> 'pilot_cohort')::boolean, false),
    nullif(btrim(p_payload ->> 'relationship_source'), ''),
    nullif(btrim(p_payload ->> 'relationship_summary'), '')
  ) returning id into v_organization_id;

  insert into concierge_ops.people (
    first_name,
    last_name,
    title_role,
    decision_role,
    email,
    phone,
    preferred_channel,
    contact_status,
    is_primary_contact,
    contact_notes,
    organization_id
  ) values (
    v_contact_first_name,
    v_contact_last_name,
    nullif(btrim(p_payload ->> 'contact_title_role'), ''),
    coalesce(nullif(btrim(p_payload ->> 'contact_decision_role'), ''), 'unknown'),
    nullif(btrim(p_payload ->> 'contact_email'), ''),
    nullif(btrim(p_payload ->> 'contact_phone'), ''),
    coalesce(nullif(btrim(p_payload ->> 'contact_preferred_channel'), ''), 'unknown'),
    'unverified',
    true,
    nullif(btrim(p_payload ->> 'contact_notes'), ''),
    v_organization_id
  ) returning id into v_contact_id;

  update concierge_ops.organizations
  set primary_contact_id = v_contact_id
  where id = v_organization_id;

  insert into concierge_ops.needs (
    organization_id,
    need_title,
    need_origin,
    need_type,
    service_frequency,
    primary_service_category,
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
    next_action,
    next_action_on,
    requesting_contact_id,
    decision_maker_ids
  ) values (
    v_organization_id,
    v_need_title,
    nullif(btrim(p_payload ->> 'need_origin'), ''),
    v_need_type,
    coalesce(nullif(btrim(p_payload ->> 'service_frequency'), ''), 'unknown'),
    nullif(btrim(p_payload ->> 'primary_service_category'), ''),
    nullif(btrim(p_payload ->> 'service_detail'), ''),
    nullif(btrim(p_payload ->> 'need_brief'), ''),
    nullif(btrim(p_payload ->> 'desired_outcome'), ''),
    nullif(btrim(p_payload ->> 'must_haves'), ''),
    nullif(btrim(p_payload ->> 'nice_to_haves'), ''),
    coalesce(nullif(btrim(p_payload ->> 'urgency'), ''), 'standard'),
    nullif(p_payload ->> 'target_decision_on', '')::date,
    nullif(p_payload ->> 'target_start_on', '')::date,
    v_budget_status,
    v_budget_basis,
    v_budget_band,
    v_budget_band_basis,
    coalesce(nullif(btrim(p_payload ->> 'delivery_requirement'), ''), 'unknown'),
    nullif(btrim(p_payload ->> 'service_location'), ''),
    coalesce(nullif(btrim(p_payload ->> 'faith_alignment_requirement'), ''), 'unknown'),
    coalesce(nullif(btrim(p_payload ->> 'faith_fit_rationale'), ''), ''),
    'unclassified',
    'standard',
    'intake',
    nullif(btrim(p_payload ->> 'next_action'), ''),
    nullif(p_payload ->> 'next_action_on', '')::date,
    v_contact_id,
    case
      when coalesce(nullif(btrim(p_payload ->> 'contact_decision_role'), ''), 'unknown') = 'decision_maker'
      then array[v_contact_id]
      else '{}'::uuid[]
    end
  ) returning id into v_need_id;

  return jsonb_build_object(
    'organization_id', v_organization_id,
    'contact_id', v_contact_id,
    'need_id', v_need_id,
    'organization_name', v_organization_name,
    'need_title', v_need_title,
    'status', 'intake'
  );
end;
$$;

revoke all on function concierge_ops.create_intake_bundle(jsonb)
from public, anon, authenticated;

grant execute on function concierge_ops.create_intake_bundle(jsonb)
to authenticated, service_role;
