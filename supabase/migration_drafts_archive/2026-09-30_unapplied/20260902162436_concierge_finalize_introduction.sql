-- Atomically finalize a Concierge placement after the church selects a vendor.
-- The function is security-invoker: existing admin-only RLS remains authoritative.

create or replace function concierge_ops.finalize_introduction(
  p_match_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_match concierge_ops.matches%rowtype;
  v_need concierge_ops.needs%rowtype;
  v_vendor concierge_ops.vendors%rowtype;
  v_engagement concierge_ops.engagements%rowtype;
  v_now timestamptz := now();
  v_today date := current_date;
  v_intro_fee bigint;
  v_renewal_fee bigint;
  v_renewal_applies text;
  v_agreement_reference text;
  v_organization_feedback text;
  v_renewal_terms text;
  v_exception_reason text;
  v_planned_start date;
  v_service_value bigint;
  v_value_basis text;
begin
  if not (select public.kb_is_platform_admin()) then
    raise exception 'Platform admin access required';
  end if;

  select * into v_match
  from concierge_ops.matches
  where id = p_match_id and archived_at is null
  for update;
  if not found then raise exception 'Match not found'; end if;

  select * into v_need
  from concierge_ops.needs
  where id = v_match.need_id and archived_at is null
  for update;
  if not found then raise exception 'Need not found'; end if;

  select * into v_vendor
  from concierge_ops.vendors
  where id = v_match.vendor_id and archived_at is null
  for update;
  if not found then raise exception 'Vendor not found'; end if;

  if v_match.stage <> 'shortlisted' then
    raise exception 'Only a shortlisted Match can be selected and introduced';
  end if;
  if v_need.status <> 'organization_reviewing' or v_need.shortlist_presented_at is null then
    raise exception 'The church must be reviewing a presented shortlist before selection';
  end if;
  if v_need.selected_match_id is not null and v_need.selected_match_id <> v_match.id then
    raise exception 'This Need already has a different selected Match';
  end if;
  if v_vendor.vetting_decision not in ('approved', 'approved_with_conditions')
     or v_vendor.relationship_status in ('inactive', 'do_not_use') then
    raise exception 'The selected Vendor is not currently eligible for introduction';
  end if;
  if v_need.compliance_gate = 'declined'
     or (v_need.risk_tier = 'tier_3_regulated' and v_need.compliance_gate <> 'approved') then
    raise exception 'Compliance clearance is required before introduction';
  end if;

  v_intro_fee := nullif(p_payload->>'agreed_introduction_fee_cents', '')::bigint;
  v_renewal_applies := coalesce(nullif(p_payload->>'renewal_fee_applies', ''), 'no');
  v_renewal_fee := nullif(p_payload->>'agreed_renewal_fee_cents', '')::bigint;
  v_agreement_reference := nullif(btrim(coalesce(p_payload->>'placement_agreement_reference', '')), '');
  v_organization_feedback := nullif(btrim(coalesce(p_payload->>'organization_feedback', '')), '');
  v_renewal_terms := nullif(btrim(coalesce(p_payload->>'renewal_trigger_terms', '')), '');
  v_exception_reason := nullif(btrim(coalesce(p_payload->>'fee_exception_reason', '')), '');
  v_planned_start := nullif(p_payload->>'planned_start_on', '')::date;
  v_service_value := nullif(p_payload->>'agreed_project_service_value_cents', '')::bigint;
  v_value_basis := nullif(p_payload->>'value_basis', '');

  if v_intro_fee is null or v_intro_fee < 0 then
    raise exception 'A non-negative introduction fee must be accepted before introduction';
  end if;
  if v_agreement_reference is null then
    raise exception 'Written agreement acceptance requires a reference';
  end if;
  if v_organization_feedback is null then
    raise exception 'Record how the church confirmed its vendor selection';
  end if;
  if v_renewal_applies not in ('no', 'potential_recurring', 'yes_terms_agreed') then
    raise exception 'Invalid renewal fee setting';
  end if;
  if v_renewal_applies <> 'no' and (v_renewal_fee is null or v_renewal_terms is null) then
    raise exception 'Recurring work requires a pre-agreed renewal fee and trigger terms';
  end if;
  if v_service_value is not null and v_value_basis is null then
    raise exception 'Service value requires a value basis';
  end if;

  update concierge_ops.matches
  set agreed_introduction_fee_cents = v_intro_fee,
      renewal_fee_applies = v_renewal_applies,
      agreed_renewal_fee_cents = case when v_renewal_applies = 'no' then null else v_renewal_fee end,
      renewal_trigger_terms = case when v_renewal_applies = 'no' then null else v_renewal_terms end,
      placement_agreement_status = 'accepted_in_writing',
      placement_agreement_reference = v_agreement_reference,
      organization_feedback = v_organization_feedback,
      fee_exception_reason = v_exception_reason,
      fee_approved_by = case when v_exception_reason is null then null else auth.uid() end,
      fee_approved_on = case when v_exception_reason is null then null else v_today end,
      introduced_at = v_now
  where id = v_match.id;

  update concierge_ops.needs
  set selected_match_id = v_match.id,
      selected_at = v_now
  where id = v_need.id;

  update concierge_ops.matches
  set stage = 'selected',
      selected_or_closed_at = v_now
  where id = v_match.id;

  update concierge_ops.needs
  set status = 'vendor_selected',
      next_action = 'Prepare launch and confirm the service start',
      next_action_on = coalesce(v_planned_start, v_today)
  where id = v_need.id;

  insert into concierge_ops.engagements (
    selected_match_id,
    status,
    agreement_selection_on,
    planned_start_on,
    agreed_project_service_value_cents,
    value_basis,
    introduction_fee_triggered_on,
    recurring_confirmation_status,
    vendor_vetting_decision_at_selection
  ) values (
    v_match.id,
    'preparing',
    v_today,
    v_planned_start,
    v_service_value,
    v_value_basis,
    v_today,
    case when v_renewal_applies = 'no' then 'not_applicable' else 'pending_check_in' end,
    v_vendor.vetting_decision
  ) returning * into v_engagement;

  return jsonb_build_object(
    'match_id', v_match.id,
    'need_id', v_need.id,
    'vendor_id', v_vendor.id,
    'engagement_id', v_engagement.id,
    'introduced_at', v_now,
    'status', v_engagement.status
  );
end;
$function$;

revoke execute on function concierge_ops.finalize_introduction(uuid, jsonb) from public, anon;
grant execute on function concierge_ops.finalize_introduction(uuid, jsonb) to authenticated, service_role;
