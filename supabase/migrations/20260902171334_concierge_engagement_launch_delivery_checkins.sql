-- FaithBid Concierge engagement launch and delivery check-ins.
-- Keeps the locked eight-table architecture by storing an append-only JSONB
-- event ledger on the Engagement while retaining queryable current-state fields.

alter table concierge_ops.engagements
  add column launch_confirmation_reference text,
  add column launch_summary text,
  add column church_start_confirmed_on date,
  add column vendor_start_confirmed_on date,
  add column delivery_health text not null default 'not_started',
  add column latest_check_in_on date,
  add column next_check_in_on date,
  add column latest_check_in_summary text,
  add column current_milestone text,
  add column milestone_status text not null default 'not_set',
  add column milestone_due_on date,
  add column delivery_next_action text,
  add column delivery_next_action_on date,
  add column delivery_check_ins jsonb not null default '[]'::jsonb;

alter table concierge_ops.engagements
  add constraint engagements_delivery_health_check
    check (delivery_health in ('not_started','on_track','watch','at_risk','paused')),
  add constraint engagements_milestone_status_check
    check (milestone_status in ('not_set','planned','in_progress','complete','blocked')),
  add constraint engagements_delivery_check_ins_array_check
    check (jsonb_typeof(delivery_check_ins) = 'array'),
  add constraint engagements_launched_truth_check
    check (
      status not in ('active','at_risk','completed','closed')
      or (
        actual_start_on is not null
        and church_start_confirmed_on is not null
        and vendor_start_confirmed_on is not null
        and nullif(btrim(launch_confirmation_reference), '') is not null
      )
    ),
  add constraint engagements_at_risk_requires_issue_check
    check (
      status <> 'at_risk'
      or nullif(btrim(issue_escalation_summary), '') is not null
    ),
  add constraint engagements_check_in_schedule_check
    check (
      latest_check_in_on is null
      or next_check_in_on is null
      or next_check_in_on >= latest_check_in_on
    );

create index engagements_next_check_in_idx
  on concierge_ops.engagements (next_check_in_on, status)
  where archived_at is null and status in ('active','at_risk');

create or replace function concierge_ops.launch_engagement(
  p_engagement_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
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
$$;

create or replace function concierge_ops.record_delivery_check_in(
  p_engagement_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
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
$$;

revoke execute on function concierge_ops.launch_engagement(uuid, jsonb) from public, anon;
grant execute on function concierge_ops.launch_engagement(uuid, jsonb) to authenticated, service_role;
revoke execute on function concierge_ops.record_delivery_check_in(uuid, jsonb) from public, anon;
grant execute on function concierge_ops.record_delivery_check_in(uuid, jsonb) to authenticated, service_role;

create or replace view concierge_ops.engagement_details
with (security_invoker = true)
as
select
  e.id,
  e.selected_match_id,
  e.status,
  e.agreement_selection_on,
  e.planned_start_on,
  e.planned_completion_on,
  e.actual_start_on,
  e.actual_completion_on,
  e.agreed_project_service_value_cents,
  e.value_basis,
  e.issue_escalation_summary,
  e.proof_disqualifier,
  e.proof_disqualifier_resolved_on,
  e.outcome_review_status,
  e.outcome_review_on,
  e.outcome_assessment,
  e.organization_satisfaction,
  e.vendor_performance,
  e.would_recommend_again,
  e.outcome_summary,
  e.lessons_learned,
  e.introduction_fee_triggered_on,
  e.introduction_invoice_status,
  e.introduction_invoice_on,
  e.introduction_amount_invoiced_cents,
  e.introduction_gross_collected_cents,
  e.introduction_refunds_credits_cents,
  e.introduction_taxes_collected_cents,
  e.introduction_net_collected_cents,
  e.introduction_latest_collection_on,
  e.recurring_confirmation_status,
  e.recurring_confirmed_on,
  e.renewal_fee_triggered_on,
  e.renewal_invoice_status,
  e.renewal_invoice_on,
  e.renewal_amount_invoiced_cents,
  e.renewal_gross_collected_cents,
  e.renewal_refunds_credits_cents,
  e.renewal_taxes_collected_cents,
  e.renewal_net_collected_cents,
  e.renewal_latest_collection_on,
  e.give_back_rate_basis_points,
  e.total_net_fees_collected_cents,
  e.give_back_eligible_cents,
  e.give_back_recipient_type,
  e.give_back_recipient,
  e.recipient_verification_status,
  e.give_back_status,
  e.actual_give_back_cents,
  e.give_back_paid_on,
  e.payment_reference,
  e.acknowledgment_received_on,
  e.hire_confirmation_id,
  e.payment_plan_id,
  e.vendor_vetting_decision_at_selection,
  e.created_at,
  e.updated_at,
  e.archived_at,
  m.need_id,
  m.vendor_id,
  n.organization_id,
  n.need_title,
  n.need_type,
  n.service_frequency,
  o.organization_name,
  v.vendor_name,
  m.placement_agreement_status,
  m.placement_agreement_reference,
  md.introduction_fee_tier,
  m.agreed_introduction_fee_cents,
  m.renewal_fee_applies,
  m.agreed_renewal_fee_cents,
  m.renewal_trigger_terms,
  e.outcome_review_status = 'complete'
    and e.outcome_assessment in ('excellent','successful')
    and e.would_recommend_again in ('yes','with_conditions')
    and e.vendor_vetting_decision_at_selection in ('approved','approved_with_conditions')
    and e.proof_disqualifier = 'none'
    and e.status in ('completed','closed') as proven_evidence_flag,
  exists (
    select 1 from concierge_ops.needs follow_on
    where follow_on.originating_engagement_id = e.id
      and follow_on.archived_at is null
  ) as repeat_need_generated,
  e.launch_confirmation_reference,
  e.launch_summary,
  e.church_start_confirmed_on,
  e.vendor_start_confirmed_on,
  e.delivery_health,
  e.latest_check_in_on,
  e.next_check_in_on,
  e.latest_check_in_summary,
  e.current_milestone,
  e.milestone_status,
  e.milestone_due_on,
  e.delivery_next_action,
  e.delivery_next_action_on,
  e.delivery_check_ins,
  jsonb_array_length(e.delivery_check_ins) as delivery_event_count
from concierge_ops.engagements e
join concierge_ops.matches m on m.id = e.selected_match_id
join concierge_ops.match_details md on md.id = m.id
join concierge_ops.needs n on n.id = m.need_id
join concierge_ops.organizations o on o.id = n.organization_id
join concierge_ops.vendors v on v.id = m.vendor_id;

revoke all on concierge_ops.engagement_details from public, anon;
grant select on concierge_ops.engagement_details to authenticated, service_role;
