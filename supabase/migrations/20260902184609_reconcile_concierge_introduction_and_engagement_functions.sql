-- Reconciliation migration: register three concierge_ops functions that were
-- already applied live (finalize_introduction, launch_engagement,
-- record_delivery_check_in) but had no corresponding entry in
-- supabase_migrations.schema_migrations. All statements are idempotent
-- (CREATE OR REPLACE / conditional revoke+grant) and byte-match the
-- definitions already running in production, so this changes zero behavior
-- and only closes the gap between migration history and live reality.

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

create or replace function concierge_ops.launch_engagement(p_engagement_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $function$
declare
  v_engagement concierge_ops.engagements%rowtype;
  v_match concierge_ops.matches%rowtype;
  v_need concierge_ops.needs%rowtype;
  v_today date := current_date;
  v_now timestamptz := now();
  v_actual_start date;
  v_church_confirmed date;
  v_vendor_confirmed date;
  v_next_check_in date;
  v_reference text;
  v_summary text;
  v_event jsonb;
begin
  if not (select public.kb_is_platform_admin()) then
    raise exception 'Platform admin access required';
  end if;

  select * into v_engagement
  from concierge_ops.engagements
  where id = p_engagement_id and archived_at is null
  for update;
  if not found then raise exception 'Engagement not found'; end if;

  select * into v_match
  from concierge_ops.matches
  where id = v_engagement.selected_match_id and archived_at is null
  for update;
  if not found then raise exception 'Selected Match not found'; end if;

  select * into v_need
  from concierge_ops.needs
  where id = v_match.need_id and archived_at is null
  for update;
  if not found then raise exception 'Need not found'; end if;

  if v_engagement.status <> 'preparing' then
    raise exception 'Only a preparing Engagement can be launched';
  end if;
  if v_match.stage <> 'selected'
     or v_need.status <> 'vendor_selected'
     or v_need.selected_match_id <> v_match.id then
    raise exception 'The selected Match and Need must remain aligned before launch';
  end if;

  v_actual_start := nullif(p_payload->>'actual_start_on', '')::date;
  v_church_confirmed := nullif(p_payload->>'church_start_confirmed_on', '')::date;
  v_vendor_confirmed := nullif(p_payload->>'vendor_start_confirmed_on', '')::date;
  v_next_check_in := nullif(p_payload->>'next_check_in_on', '')::date;
  v_reference := nullif(btrim(coalesce(p_payload->>'launch_confirmation_reference', '')), '');
  v_summary := nullif(btrim(coalesce(p_payload->>'launch_summary', '')), '');

  if v_actual_start is null or v_actual_start > v_today then
    raise exception 'Launch requires a real start date that is not in the future';
  end if;
  if v_actual_start < v_engagement.agreement_selection_on then
    raise exception 'The actual start cannot predate the recorded selection';
  end if;
  if v_church_confirmed is null or v_vendor_confirmed is null
     or v_church_confirmed > v_today or v_vendor_confirmed > v_today then
    raise exception 'Both church and vendor start confirmations are required';
  end if;
  if v_church_confirmed < v_engagement.agreement_selection_on
     or v_vendor_confirmed < v_engagement.agreement_selection_on then
    raise exception 'Start confirmations cannot predate the recorded selection';
  end if;
  if v_reference is null or v_summary is null then
    raise exception 'Launch confirmation requires a written reference and summary';
  end if;
  if v_next_check_in is null or v_next_check_in < v_today then
    raise exception 'Schedule the first delivery check-in for today or later';
  end if;

  v_event := jsonb_build_object(
    'event_id', pg_catalog.gen_random_uuid(),
    'event_type', 'launch_confirmed',
    'recorded_at', v_now,
    'recorded_by', auth.uid(),
    'effective_on', v_actual_start,
    'summary', v_summary,
    'confirmation_reference', v_reference,
    'next_check_in_on', v_next_check_in
  );

  update concierge_ops.engagements
  set status = 'active',
      actual_start_on = v_actual_start,
      launch_confirmation_reference = v_reference,
      launch_summary = v_summary,
      church_start_confirmed_on = v_church_confirmed,
      vendor_start_confirmed_on = v_vendor_confirmed,
      delivery_health = 'on_track',
      next_check_in_on = v_next_check_in,
      delivery_next_action = 'Complete the first delivery check-in',
      delivery_next_action_on = v_next_check_in,
      delivery_check_ins = delivery_check_ins || jsonb_build_array(v_event)
  where id = v_engagement.id;

  update concierge_ops.needs
  set next_action = 'Complete the first delivery check-in',
      next_action_on = v_next_check_in
  where id = v_need.id;

  return jsonb_build_object(
    'engagement_id', v_engagement.id,
    'status', 'active',
    'actual_start_on', v_actual_start,
    'next_check_in_on', v_next_check_in,
    'event_type', 'launch_confirmed'
  );
end;
$function$;

revoke execute on function concierge_ops.launch_engagement(uuid, jsonb) from public, anon;
grant execute on function concierge_ops.launch_engagement(uuid, jsonb) to authenticated, service_role;

create or replace function concierge_ops.record_delivery_check_in(p_engagement_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $function$
declare
  v_engagement concierge_ops.engagements%rowtype;
  v_match concierge_ops.matches%rowtype;
  v_today date := current_date;
  v_now timestamptz := now();
  v_check_in_on date;
  v_next_check_in date;
  v_next_action_on date;
  v_health text;
  v_summary text;
  v_milestone text;
  v_milestone_status text;
  v_milestone_due date;
  v_issue text;
  v_next_action text;
  v_new_status text;
  v_event jsonb;
  v_event_count integer;
begin
  if not (select public.kb_is_platform_admin()) then
    raise exception 'Platform admin access required';
  end if;

  select * into v_engagement
  from concierge_ops.engagements
  where id = p_engagement_id and archived_at is null
  for update;
  if not found then raise exception 'Engagement not found'; end if;

  if v_engagement.status not in ('active','at_risk') then
    raise exception 'Delivery check-ins require an active or at-risk Engagement';
  end if;

  select * into v_match
  from concierge_ops.matches
  where id = v_engagement.selected_match_id and archived_at is null;
  if not found then raise exception 'Selected Match not found'; end if;

  v_check_in_on := nullif(p_payload->>'check_in_on', '')::date;
  v_next_check_in := nullif(p_payload->>'next_check_in_on', '')::date;
  v_next_action_on := nullif(p_payload->>'next_action_on', '')::date;
  v_health := nullif(p_payload->>'delivery_health', '');
  v_summary := nullif(btrim(coalesce(p_payload->>'summary', '')), '');
  v_milestone := nullif(btrim(coalesce(p_payload->>'current_milestone', '')), '');
  v_milestone_status := coalesce(nullif(p_payload->>'milestone_status', ''), 'not_set');
  v_milestone_due := nullif(p_payload->>'milestone_due_on', '')::date;
  v_issue := nullif(btrim(coalesce(p_payload->>'issue_summary', '')), '');
  v_next_action := nullif(btrim(coalesce(p_payload->>'next_action', '')), '');

  if v_check_in_on is null or v_check_in_on < v_engagement.actual_start_on or v_check_in_on > v_today then
    raise exception 'Check-in date must fall between the real start and today';
  end if;
  if v_engagement.latest_check_in_on is not null and v_check_in_on < v_engagement.latest_check_in_on then
    raise exception 'A new check-in cannot predate the latest recorded check-in';
  end if;
  if v_health not in ('on_track','watch','at_risk','paused') then
    raise exception 'Choose a valid delivery health';
  end if;
  if v_summary is null then
    raise exception 'A factual delivery summary is required';
  end if;
  if v_milestone_status not in ('not_set','planned','in_progress','complete','blocked') then
    raise exception 'Choose a valid milestone status';
  end if;
  if v_milestone_status <> 'not_set' and v_milestone is null then
    raise exception 'Named milestone details are required for this milestone status';
  end if;
  if (v_health in ('at_risk','paused') or v_milestone_status = 'blocked') and v_issue is null then
    raise exception 'At-risk, paused, or blocked delivery requires an issue summary';
  end if;
  if v_next_action is null or v_next_action_on is null or v_next_action_on < v_check_in_on then
    raise exception 'Record a next action and a due date on or after the check-in';
  end if;
  if v_next_check_in is null or v_next_check_in < v_check_in_on then
    raise exception 'Schedule the next check-in on or after this check-in';
  end if;

  v_new_status := case
    when v_health in ('at_risk','paused') or v_milestone_status = 'blocked' then 'at_risk'
    else 'active'
  end;

  v_event := jsonb_build_object(
    'event_id', pg_catalog.gen_random_uuid(),
    'event_type', 'delivery_check_in',
    'recorded_at', v_now,
    'recorded_by', auth.uid(),
    'check_in_on', v_check_in_on,
    'delivery_health', v_health,
    'summary', v_summary,
    'current_milestone', v_milestone,
    'milestone_status', v_milestone_status,
    'milestone_due_on', v_milestone_due,
    'issue_summary', v_issue,
    'next_action', v_next_action,
    'next_action_on', v_next_action_on,
    'next_check_in_on', v_next_check_in
  );

  update concierge_ops.engagements
  set status = v_new_status,
      delivery_health = v_health,
      latest_check_in_on = v_check_in_on,
      next_check_in_on = v_next_check_in,
      latest_check_in_summary = v_summary,
      current_milestone = v_milestone,
      milestone_status = v_milestone_status,
      milestone_due_on = v_milestone_due,
      issue_escalation_summary = case when v_new_status = 'at_risk' then v_issue else null end,
      delivery_next_action = v_next_action,
      delivery_next_action_on = v_next_action_on,
      delivery_check_ins = delivery_check_ins || jsonb_build_array(v_event)
  where id = v_engagement.id
  returning jsonb_array_length(delivery_check_ins) into v_event_count;

  update concierge_ops.needs
  set next_action = v_next_action,
      next_action_on = v_next_action_on
  where id = v_match.need_id;

  return jsonb_build_object(
    'engagement_id', v_engagement.id,
    'status', v_new_status,
    'delivery_health', v_health,
    'latest_check_in_on', v_check_in_on,
    'next_check_in_on', v_next_check_in,
    'event_count', v_event_count
  );
end;
$function$;

revoke execute on function concierge_ops.record_delivery_check_in(uuid, jsonb) from public, anon;
grant execute on function concierge_ops.record_delivery_check_in(uuid, jsonb) to authenticated, service_role;
