-- FaithBid Concierge — close-the-loop RPCs + two integrity hardenings.
-- All functions are security-invoker and admin-gated; existing RLS stays authoritative.

create or replace function concierge_ops.review_outcome(p_engagement_id uuid, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare
  v_eng concierge_ops.engagements%rowtype;
  v_match concierge_ops.matches%rowtype;
  v_today date := current_date;
  v_status text;
  v_assessment text;
  v_wra text;
  v_summary text;
  v_lessons text;
  v_sat int;
  v_perf int;
  v_disq text;
  v_issue text;
  v_mark_completed boolean;
  v_completion date;
begin
  if not public.kb_is_platform_admin() then raise exception 'Platform admin access required'; end if;

  select * into v_eng from concierge_ops.engagements where id = p_engagement_id and archived_at is null for update;
  if not found then raise exception 'Engagement not found'; end if;
  select * into v_match from concierge_ops.matches where id = v_eng.selected_match_id;
  if not found then raise exception 'Selected Match not found'; end if;

  if v_eng.status not in ('active','at_risk','completed') then
    raise exception 'Outcome review requires an active, at-risk, or completed Engagement';
  end if;

  v_status := coalesce(nullif(p_payload->>'outcome_review_status',''),'complete');
  v_assessment := nullif(p_payload->>'outcome_assessment','');
  v_wra := nullif(p_payload->>'would_recommend_again','');
  v_summary := nullif(btrim(coalesce(p_payload->>'outcome_summary','')),'');
  v_lessons := nullif(btrim(coalesce(p_payload->>'lessons_learned','')),'');
  v_sat := nullif(p_payload->>'organization_satisfaction','')::int;
  v_perf := nullif(p_payload->>'vendor_performance','')::int;
  v_disq := coalesce(nullif(p_payload->>'proof_disqualifier',''),'none');
  v_issue := nullif(btrim(coalesce(p_payload->>'issue_escalation_summary','')),'');
  v_mark_completed := coalesce((p_payload->>'mark_completed')::boolean, false);
  v_completion := nullif(p_payload->>'actual_completion_on','')::date;

  if v_status not in ('complete','unable_to_complete') then
    raise exception 'Outcome review must be complete or unable_to_complete';
  end if;
  if v_status = 'complete' then
    if v_assessment is null or v_wra is null or v_summary is null then
      raise exception 'A complete outcome review requires assessment, recommendation, and a summary';
    end if;
    if v_sat is null or v_perf is null then
      raise exception 'A complete outcome review requires church satisfaction and vendor performance ratings';
    end if;
  elsif v_summary is null then
    raise exception 'An unable-to-complete review requires a summary explanation';
  end if;
  if v_disq <> 'none' and v_issue is null then
    raise exception 'A proof disqualifier requires an issue/escalation summary';
  end if;
  if v_mark_completed then
    if v_completion is null or v_completion > v_today or v_completion < v_eng.actual_start_on then
      raise exception 'Completion date must be real, not in the future, and on or after the start';
    end if;
  end if;

  update concierge_ops.engagements set
    outcome_review_status = v_status,
    outcome_review_on = v_today,
    outcome_assessment = v_assessment,
    organization_satisfaction = v_sat,
    vendor_performance = v_perf,
    would_recommend_again = v_wra,
    outcome_summary = v_summary,
    lessons_learned = v_lessons,
    proof_disqualifier = v_disq,
    issue_escalation_summary = case when v_disq <> 'none' then v_issue else issue_escalation_summary end,
    status = case when v_mark_completed then 'completed' else status end,
    actual_completion_on = case when v_mark_completed then v_completion else actual_completion_on end
  where id = v_eng.id;

  return jsonb_build_object(
    'engagement_id', v_eng.id,
    'outcome_review_status', v_status,
    'outcome_assessment', v_assessment,
    'status', case when v_mark_completed then 'completed' else v_eng.status end
  );
end;
$function$;
revoke execute on function concierge_ops.review_outcome(uuid, jsonb) from public, anon;
grant execute on function concierge_ops.review_outcome(uuid, jsonb) to authenticated, service_role;

create or replace function concierge_ops.confirm_recurring(p_engagement_id uuid, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare
  v_eng concierge_ops.engagements%rowtype;
  v_match concierge_ops.matches%rowtype;
  v_today date := current_date;
  v_decision text;
  v_confirmed_on date;
  v_trigger_renewal boolean;
  v_renewal_triggered date;
begin
  if not public.kb_is_platform_admin() then raise exception 'Platform admin access required'; end if;

  select * into v_eng from concierge_ops.engagements where id = p_engagement_id and archived_at is null for update;
  if not found then raise exception 'Engagement not found'; end if;
  select * into v_match from concierge_ops.matches where id = v_eng.selected_match_id;
  if not found then raise exception 'Selected Match not found'; end if;

  if v_eng.status not in ('active','at_risk','completed') then
    raise exception 'Recurring confirmation requires an active, at-risk, or completed Engagement';
  end if;

  v_decision := nullif(p_payload->>'recurring_confirmation_status','');
  v_confirmed_on := coalesce(nullif(p_payload->>'recurring_confirmed_on','')::date, v_today);
  v_trigger_renewal := coalesce((p_payload->>'trigger_renewal_fee')::boolean, false);

  if v_decision not in ('confirmed_ongoing','ended_or_not_ongoing','waived') then
    raise exception 'Choose a valid recurring confirmation outcome';
  end if;
  if v_confirmed_on > v_today or v_confirmed_on < v_eng.actual_start_on then
    raise exception 'Confirmation date must be real, not in the future, and on or after the start';
  end if;

  if v_decision = 'confirmed_ongoing' and v_trigger_renewal then
    if v_match.renewal_fee_applies <> 'yes_terms_agreed' or v_match.agreed_renewal_fee_cents is null then
      raise exception 'A renewal fee can only be triggered when terms were accepted in writing before introduction';
    end if;
    v_renewal_triggered := v_today;
  end if;

  update concierge_ops.engagements set
    recurring_confirmation_status = v_decision,
    recurring_confirmed_on = case when v_decision = 'confirmed_ongoing' then v_confirmed_on else recurring_confirmed_on end,
    renewal_fee_triggered_on = coalesce(v_renewal_triggered, renewal_fee_triggered_on)
  where id = v_eng.id;

  return jsonb_build_object(
    'engagement_id', v_eng.id,
    'recurring_confirmation_status', v_decision,
    'renewal_fee_triggered', v_renewal_triggered is not null,
    'renewal_fee_triggered_on', v_renewal_triggered
  );
end;
$function$;
revoke execute on function concierge_ops.confirm_recurring(uuid, jsonb) from public, anon;
grant execute on function concierge_ops.confirm_recurring(uuid, jsonb) to authenticated, service_role;

create or replace function concierge_ops.record_fee_collection(p_engagement_id uuid, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare
  v_eng concierge_ops.engagements%rowtype;
  v_match concierge_ops.matches%rowtype;
  v_today date := current_date;
  v_scope text;
  v_inv_status text;
  v_inv_on date;
  v_gross bigint;
  v_refunds bigint;
  v_taxes bigint;
  v_collected_on date;
  v_new_total_net bigint;
begin
  if not public.kb_is_platform_admin() then raise exception 'Platform admin access required'; end if;

  select * into v_eng from concierge_ops.engagements where id = p_engagement_id and archived_at is null for update;
  if not found then raise exception 'Engagement not found'; end if;
  select * into v_match from concierge_ops.matches where id = v_eng.selected_match_id;
  if not found then raise exception 'Selected Match not found'; end if;

  v_scope := nullif(p_payload->>'fee_scope','');
  if v_scope not in ('introduction','renewal') then
    raise exception 'Fee scope must be introduction or renewal';
  end if;

  v_inv_status := nullif(p_payload->>'invoice_status','');
  if v_inv_status not in ('not_invoiced','invoiced','partially_paid','paid','written_off','not_applicable') then
    raise exception 'Choose a valid invoice status';
  end if;
  v_inv_on := nullif(p_payload->>'invoice_on','')::date;
  v_gross := coalesce(nullif(p_payload->>'gross_collected_cents','')::bigint, 0);
  v_refunds := coalesce(nullif(p_payload->>'refunds_credits_cents','')::bigint, 0);
  v_taxes := coalesce(nullif(p_payload->>'taxes_collected_cents','')::bigint, 0);
  v_collected_on := nullif(p_payload->>'latest_collection_on','')::date;

  if v_inv_status in ('invoiced','partially_paid','paid') and v_inv_on is null then
    v_inv_on := v_today;
  end if;
  if v_inv_status in ('partially_paid','paid') and v_collected_on is null then
    v_collected_on := v_today;
  end if;

  if v_scope = 'introduction' then
    update concierge_ops.engagements set
      introduction_invoice_status = v_inv_status,
      introduction_invoice_on = case when v_inv_status in ('invoiced','partially_paid','paid') then v_inv_on else introduction_invoice_on end,
      introduction_amount_invoiced_cents = case
        when v_inv_status in ('invoiced','partially_paid','paid') then coalesce(v_match.agreed_introduction_fee_cents, 0)
        else introduction_amount_invoiced_cents end,
      introduction_gross_collected_cents = v_gross,
      introduction_refunds_credits_cents = v_refunds,
      introduction_taxes_collected_cents = v_taxes,
      introduction_latest_collection_on = case when v_gross > 0 then coalesce(v_collected_on, v_today) else introduction_latest_collection_on end
    where id = v_eng.id;
  else
    if v_eng.renewal_fee_triggered_on is null and v_inv_status in ('invoiced','partially_paid','paid') then
      raise exception 'A renewal fee must be triggered (recurring confirmed) before it can be invoiced';
    end if;
    update concierge_ops.engagements set
      renewal_invoice_status = v_inv_status,
      renewal_invoice_on = case when v_inv_status in ('invoiced','partially_paid','paid') then v_inv_on else renewal_invoice_on end,
      renewal_amount_invoiced_cents = case
        when v_inv_status in ('invoiced','partially_paid','paid') then coalesce(v_match.agreed_renewal_fee_cents, 0)
        else renewal_amount_invoiced_cents end,
      renewal_gross_collected_cents = v_gross,
      renewal_refunds_credits_cents = v_refunds,
      renewal_taxes_collected_cents = v_taxes,
      renewal_latest_collection_on = case when v_gross > 0 then coalesce(v_collected_on, v_today) else renewal_latest_collection_on end
    where id = v_eng.id;
  end if;

  select total_net_fees_collected_cents into v_new_total_net from concierge_ops.engagements where id = v_eng.id;

  if v_new_total_net > 0 then
    update concierge_ops.engagements set
      give_back_status = case when give_back_status = 'not_eligible_no_collection' then 'awaiting_recipient' else give_back_status end
    where id = v_eng.id;
  end if;

  return jsonb_build_object(
    'engagement_id', v_eng.id,
    'fee_scope', v_scope,
    'invoice_status', v_inv_status,
    'total_net_fees_collected_cents', v_new_total_net
  );
end;
$function$;
revoke execute on function concierge_ops.record_fee_collection(uuid, jsonb) from public, anon;
grant execute on function concierge_ops.record_fee_collection(uuid, jsonb) to authenticated, service_role;

create or replace function concierge_ops.record_give_back(p_engagement_id uuid, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare
  v_eng concierge_ops.engagements%rowtype;
  v_today date := current_date;
  v_recipient_type text;
  v_recipient text;
  v_verification text;
  v_status text;
  v_actual bigint;
  v_paid_on date;
  v_payment_ref text;
  v_ack_on date;
  v_issue text;
  v_eligible bigint;
begin
  if not public.kb_is_platform_admin() then raise exception 'Platform admin access required'; end if;

  select * into v_eng from concierge_ops.engagements where id = p_engagement_id and archived_at is null for update;
  if not found then raise exception 'Engagement not found'; end if;

  v_recipient_type := nullif(p_payload->>'give_back_recipient_type','');
  v_recipient := nullif(btrim(coalesce(p_payload->>'give_back_recipient','')),'');
  v_verification := coalesce(nullif(p_payload->>'recipient_verification_status',''), v_eng.recipient_verification_status);
  v_status := nullif(p_payload->>'give_back_status','');
  v_actual := nullif(p_payload->>'actual_give_back_cents','')::bigint;
  v_paid_on := nullif(p_payload->>'give_back_paid_on','')::date;
  v_payment_ref := nullif(btrim(coalesce(p_payload->>'payment_reference','')),'');
  v_ack_on := nullif(p_payload->>'acknowledgment_received_on','')::date;
  v_issue := nullif(btrim(coalesce(p_payload->>'issue_escalation_summary','')),'');

  if v_recipient_type is not null and v_recipient_type not in ('buyer_organization','selected_ministry_or_cause') then
    raise exception 'Choose a valid give-back recipient type';
  end if;
  if v_verification not in ('not_started','pending','verified','not_eligible','waived') then
    raise exception 'Choose a valid recipient verification status';
  end if;
  if v_status is null or v_status not in ('not_eligible_no_collection','awaiting_recipient','ready','paid','held_or_issue','not_applicable_no_revenue') then
    raise exception 'Choose a valid give-back status';
  end if;

  select give_back_eligible_cents into v_eligible from concierge_ops.engagements where id = v_eng.id;

  if v_status in ('ready','paid') and v_verification <> 'verified' then
    raise exception 'Give-back cannot be ready or paid before the recipient is verified';
  end if;
  if v_status in ('ready','paid') and (v_recipient_type is null or v_recipient is null) then
    raise exception 'Give-back ready or paid requires a named, typed recipient';
  end if;
  if v_status = 'paid' then
    if v_actual is null then v_actual := v_eligible; end if;
    if v_actual <= 0 then raise exception 'A paid give-back requires a positive amount'; end if;
    if v_actual > v_eligible then raise exception 'Give-back cannot exceed the eligible amount (rate x net collected)'; end if;
    if v_paid_on is null then v_paid_on := v_today; end if;
    if v_payment_ref is null then raise exception 'A paid give-back requires a payment reference'; end if;
  end if;
  if v_status = 'held_or_issue' and v_issue is null then
    raise exception 'A held give-back requires an issue/escalation summary';
  end if;

  update concierge_ops.engagements set
    give_back_recipient_type = coalesce(v_recipient_type, give_back_recipient_type),
    give_back_recipient = coalesce(v_recipient, give_back_recipient),
    recipient_verification_status = v_verification,
    give_back_status = v_status,
    actual_give_back_cents = case when v_status = 'paid' then v_actual else actual_give_back_cents end,
    give_back_paid_on = case when v_status = 'paid' then v_paid_on else give_back_paid_on end,
    payment_reference = case when v_status = 'paid' then v_payment_ref else payment_reference end,
    acknowledgment_received_on = coalesce(v_ack_on, acknowledgment_received_on),
    issue_escalation_summary = case when v_status = 'held_or_issue' then v_issue else issue_escalation_summary end
  where id = v_eng.id;

  return jsonb_build_object(
    'engagement_id', v_eng.id,
    'give_back_status', v_status,
    'give_back_eligible_cents', v_eligible,
    'actual_give_back_cents', case when v_status = 'paid' then v_actual else v_eng.actual_give_back_cents end
  );
end;
$function$;
revoke execute on function concierge_ops.record_give_back(uuid, jsonb) from public, anon;
grant execute on function concierge_ops.record_give_back(uuid, jsonb) to authenticated, service_role;

create or replace function concierge_ops.close_engagement(p_engagement_id uuid, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare
  v_eng concierge_ops.engagements%rowtype;
begin
  if not public.kb_is_platform_admin() then raise exception 'Platform admin access required'; end if;

  select * into v_eng from concierge_ops.engagements where id = p_engagement_id and archived_at is null for update;
  if not found then raise exception 'Engagement not found'; end if;

  if v_eng.status not in ('active','at_risk','completed') then
    raise exception 'Only an active, at-risk, or completed Engagement can be closed';
  end if;
  if v_eng.outcome_review_status not in ('complete','unable_to_complete') then
    raise exception 'Close requires a finished outcome review';
  end if;
  if v_eng.recurring_confirmation_status = 'pending_check_in' then
    raise exception 'Close requires the recurring status to be resolved at a check-in';
  end if;
  if v_eng.introduction_invoice_status not in ('paid','written_off','not_applicable') then
    raise exception 'Close requires the introduction fee to be paid, written off, or not applicable';
  end if;
  if v_eng.renewal_invoice_status not in ('paid','written_off','not_applicable') then
    raise exception 'Close requires the renewal fee to be paid, written off, or not applicable';
  end if;
  if v_eng.give_back_status not in ('paid','held_or_issue','not_applicable_no_revenue','not_eligible_no_collection') then
    raise exception 'Close requires the give-back to be resolved';
  end if;

  update concierge_ops.engagements set status = 'closed' where id = v_eng.id;

  return jsonb_build_object('engagement_id', v_eng.id, 'status', 'closed');
end;
$function$;
revoke execute on function concierge_ops.close_engagement(uuid, jsonb) from public, anon;
grant execute on function concierge_ops.close_engagement(uuid, jsonb) to authenticated, service_role;

create or replace function concierge_ops.enforce_match_integrity()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
declare
  need_row concierge_ops.needs%rowtype;
  vendor_row concierge_ops.vendors%rowtype;
  source_need_id uuid;
  project_check_blockers integer;
  vendor_evidence_blockers integer;
  provisional_intro bigint;
  provisional_renewal bigint;
begin
  select * into need_row from concierge_ops.needs where id = new.need_id;
  select * into vendor_row from concierge_ops.vendors where id = new.vendor_id;

  if new.originating_sourcing_activity_id is not null then
    select need_id into source_need_id
    from concierge_ops.sourcing_activities
    where id = new.originating_sourcing_activity_id;
    if source_need_id is distinct from new.need_id then
      raise exception 'Originating Sourcing Activity must belong to the Match Need';
    end if;
  end if;

  if new.introduced_at is not null then
    if new.stage not in ('shortlisted', 'selected') then
      raise exception 'Introduction requires a shortlisted or selected Match';
    end if;
    if new.placement_agreement_status not in ('accepted_in_writing', 'waived_by_founder') then
      raise exception 'Introduction requires an accepted or founder-waived agreement';
    end if;

    if new.placement_agreement_status = 'accepted_in_writing'
       and nullif(btrim(new.placement_agreement_reference), '') is null then
      raise exception 'Accepted agreement requires a reference';
    end if;

    if new.placement_agreement_status = 'waived_by_founder'
       and (
         nullif(btrim(new.fee_exception_reason), '') is null
         or new.fee_approved_by is null
         or new.fee_approved_on is null
       ) then
      raise exception 'Founder waiver requires reason, approver, and approval date';
    end if;

    if new.agreed_introduction_fee_cents is null
       and new.placement_agreement_status <> 'waived_by_founder' then
      raise exception 'Introduction requires an agreed introduction fee';
    end if;

    if new.renewal_fee_applies <> 'no'
       and (
         new.agreed_renewal_fee_cents is null
         or nullif(btrim(new.renewal_trigger_terms), '') is null
       ) then
      raise exception 'Potential recurring work requires pre-agreed renewal amount and terms';
    end if;

    if vendor_row.vetting_decision not in ('approved', 'approved_with_conditions') then
      raise exception 'Introduction requires approved Vendor vetting';
    end if;

    if vendor_row.relationship_status = 'do_not_use' then
      raise exception 'A Do Not Use Vendor cannot be introduced';
    end if;

    if need_row.compliance_gate = 'declined' then
      raise exception 'A declined compliance gate blocks introduction';
    end if;

    if need_row.risk_tier = 'tier_3_regulated'
       and need_row.compliance_gate <> 'approved' then
      raise exception 'Tier 3 / regulated work requires affirmative compliance approval';
    end if;
  end if;

  if new.stage in ('shortlisted', 'selected') then
    if vendor_row.relationship_status in ('inactive', 'do_not_use')
       or new.vendor_interest not in ('interested', 'maybe')
       or new.project_availability = 'unavailable'
       or new.must_have_fit not in ('meets', 'partially_meets')
       or new.overall_fit not in ('strong', 'viable')
       or vendor_row.vetting_decision not in ('approved', 'approved_with_conditions') then
      raise exception 'Match does not satisfy shortlist eligibility';
    end if;

    select count(*) into project_check_blockers
    from concierge_ops.vetting_checks vc
    where vc.match_id = new.id
      and vc.archived_at is null
      and (
        vc.review_status <> 'complete'
        or vc.outcome in ('concern', 'failed')
        or (vc.expires_on is not null and vc.expires_on < current_date)
      );

    if project_check_blockers > 0 then
      raise exception 'Match has incomplete, adverse, or expired project-specific vetting';
    end if;

    select count(*) into vendor_evidence_blockers
    from concierge_ops.vetting_checks vc
    where vc.vendor_id = new.vendor_id
      and vc.archived_at is null
      and vc.review_status = 'complete'
      and (
        vc.outcome in ('concern', 'failed')
        or (vc.expires_on is not null and vc.expires_on < current_date)
      );

    if vendor_evidence_blockers > 0 then
      raise exception 'Vendor has adverse or expired vetting evidence and cannot be shortlisted until it is resolved';
    end if;
  end if;

  if new.stage = 'selected' then
    if new.selected_or_closed_at is null or need_row.selected_match_id is distinct from new.id then
      raise exception 'Selected Match requires selection date and reciprocal Need selection';
    end if;
    if new.introduced_at is null then
      raise exception 'Selected Match requires a valid recorded introduction';
    end if;
  end if;

  provisional_intro := case need_row.budget_band
    when 'under_5000' then 25000
    when '5000_to_24999' then 75000
    when '25000_to_99999' then 150000
    else null
  end;
  provisional_renewal := case
    when provisional_intro is null then null
    else round(provisional_intro::numeric * 0.5)::bigint
  end;

  if tg_op = 'UPDATE'
     and old.introduced_at is not null
     and (
       old.agreed_introduction_fee_cents is distinct from new.agreed_introduction_fee_cents
       or old.renewal_fee_applies is distinct from new.renewal_fee_applies
       or old.agreed_renewal_fee_cents is distinct from new.agreed_renewal_fee_cents
       or old.renewal_trigger_terms is distinct from new.renewal_trigger_terms
       or old.placement_agreement_status is distinct from new.placement_agreement_status
       or old.placement_agreement_reference is distinct from new.placement_agreement_reference
     ) then
    raise exception 'Fee and agreement terms are frozen after introduction';
  end if;

  if new.introduced_at is not null and new.placement_agreement_status <> 'waived_by_founder' then
    if (
      (provisional_intro is not null and new.agreed_introduction_fee_cents is distinct from provisional_intro)
      or (
        new.renewal_fee_applies <> 'no'
        and provisional_renewal is not null
        and new.agreed_renewal_fee_cents is distinct from provisional_renewal
      )
      or need_row.budget_band in ('100000_or_more', 'not_disclosed_or_unknown')
    ) and (
      nullif(btrim(coalesce(new.fee_exception_reason, '')), '') is null
      or new.fee_approved_by is null
      or new.fee_approved_on is null
    ) then
      raise exception 'Manual or modified fee requires reason, founder approver, and date';
    end if;
  end if;

  return new;
end;
$function$;

create or replace function concierge_ops.resync_vendor_proof_from_engagement()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
declare
  v_vendor_id uuid;
  v_vendor concierge_ops.vendors%rowtype;
  qualifying_count integer;
  category_count integer;
begin
  select vendor_id into v_vendor_id from concierge_ops.matches where id = new.selected_match_id;
  if v_vendor_id is null then return new; end if;

  select * into v_vendor from concierge_ops.vendors where id = v_vendor_id and archived_at is null;
  if not found then return new; end if;
  if v_vendor.proof_level not in ('proven_one_successful_engagement','proven_repeat_success') then
    return new;
  end if;

  select count(*),
         count(*) filter (where n.primary_service_category = any(v_vendor.proven_service_categories))
    into qualifying_count, category_count
  from concierge_ops.engagements e
  join concierge_ops.matches m on m.id = e.selected_match_id
  join concierge_ops.needs n on n.id = m.need_id
  where m.vendor_id = v_vendor_id
    and e.archived_at is null
    and e.status in ('completed','closed')
    and e.outcome_review_status = 'complete'
    and e.outcome_assessment in ('excellent','successful')
    and e.would_recommend_again in ('yes','with_conditions')
    and e.vendor_vetting_decision_at_selection in ('approved','approved_with_conditions')
    and e.proof_disqualifier = 'none';

  if (v_vendor.proof_level = 'proven_one_successful_engagement' and qualifying_count < 1)
     or (v_vendor.proof_level = 'proven_repeat_success' and qualifying_count < 2)
     or category_count < 1 then
    update concierge_ops.vendors set
      proof_level = case when new.proof_disqualifier <> 'none' then 'performance_concern' else 'not_yet_proven' end,
      proven_service_categories = '{}',
      proof_decision_date = null,
      proof_decision_by = null
    where id = v_vendor_id;
  end if;

  return new;
end;
$function$;

drop trigger if exists engagements_proof_resync on concierge_ops.engagements;
create trigger engagements_proof_resync
  after update of outcome_assessment, would_recommend_again, outcome_review_status, status, vendor_vetting_decision_at_selection, proof_disqualifier
  on concierge_ops.engagements
  for each row
  execute function concierge_ops.resync_vendor_proof_from_engagement();
