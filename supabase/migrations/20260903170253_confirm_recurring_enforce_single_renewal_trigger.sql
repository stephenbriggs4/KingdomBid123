CREATE OR REPLACE FUNCTION concierge_ops.confirm_recurring(p_engagement_id uuid, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
    if v_eng.renewal_fee_triggered_on is not null then
      raise exception 'A renewal fee has already been triggered for this engagement and cannot be triggered a second time';
    end if;
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
$function$
