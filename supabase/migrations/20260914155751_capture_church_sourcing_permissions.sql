alter table concierge_ops.needs
  add column church_sourcing_permission_status text not null default 'not_requested',
  add column referral_contact_permission_status text not null default 'not_applicable',
  add column church_identity_permission_status text not null default 'not_requested',
  add column public_sourcing_permission_status text not null default 'not_requested',
  add column church_sourcing_permission_recorded_at timestamptz,
  add column church_sourcing_permission_source text,
  add column church_sourcing_permission_reference text,
  add column church_sourcing_permission_recorded_by uuid references public.profiles(id) on delete set null;

alter table concierge_ops.needs
  add constraint needs_church_sourcing_permission_status_check
    check (church_sourcing_permission_status in ('not_requested','granted','declined','revoked')),
  add constraint needs_referral_contact_permission_status_check
    check (referral_contact_permission_status in ('not_applicable','not_requested','granted','declined','revoked')),
  add constraint needs_church_identity_permission_status_check
    check (church_identity_permission_status in ('not_requested','granted','declined','revoked')),
  add constraint needs_public_sourcing_permission_status_check
    check (public_sourcing_permission_status in ('not_requested','granted','declined','revoked')),
  add constraint needs_church_sourcing_permission_source_check
    check (
      church_sourcing_permission_source is null
      or church_sourcing_permission_source in ('meeting_notes','email','text_message','phone_call','other')
    );

create or replace function concierge_ops.enforce_church_sourcing_permissions()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_any_permission_granted boolean :=
    new.church_sourcing_permission_status = 'granted'
    or new.referral_contact_permission_status = 'granted'
    or new.church_identity_permission_status = 'granted'
    or new.public_sourcing_permission_status = 'granted';
begin
  if v_any_permission_granted and (
    new.church_sourcing_permission_recorded_at is null
    or new.church_sourcing_permission_recorded_at > clock_timestamp()
    or nullif(btrim(coalesce(new.church_sourcing_permission_source, '')), '') is null
    or nullif(btrim(coalesce(new.church_sourcing_permission_reference, '')), '') is null
    or new.church_sourcing_permission_recorded_by is null
  ) then
    raise exception 'Granted church sourcing permissions require the recorded time, source, reference, and recorder';
  end if;

  if (
    new.referral_contact_permission_status = 'granted'
    or new.church_identity_permission_status = 'granted'
    or new.public_sourcing_permission_status = 'granted'
  ) and new.church_sourcing_permission_status <> 'granted' then
    raise exception 'Specific outreach or disclosure permission requires church permission to source the need';
  end if;

  if new.status in ('ready_to_source','sourcing','shortlist_ready','organization_reviewing','vendor_selected')
     and new.church_sourcing_permission_status <> 'granted' then
    raise exception 'Church permission to source is required before this need can advance to sourcing';
  end if;

  return new;
end;
$$;

drop trigger if exists needs_enforce_church_sourcing_permissions on concierge_ops.needs;
create trigger needs_enforce_church_sourcing_permissions
before insert or update of
  status,
  church_sourcing_permission_status,
  referral_contact_permission_status,
  church_identity_permission_status,
  public_sourcing_permission_status,
  church_sourcing_permission_recorded_at,
  church_sourcing_permission_source,
  church_sourcing_permission_reference,
  church_sourcing_permission_recorded_by
on concierge_ops.needs
for each row execute function concierge_ops.enforce_church_sourcing_permissions();

create or replace function concierge_ops.create_intake_bundle(p_payload jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_contact_id uuid;
  v_need_id uuid;
  v_operator_id uuid := auth.uid();
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
    raise exception using errcode = '42501', message = 'Platform administrator access is required';
  end if;
  if v_organization_name is null then raise exception 'Organization name is required'; end if;
  if v_contact_first_name is null and v_contact_last_name is null then raise exception 'Primary contact first or last name is required'; end if;
  if v_need_title is null then raise exception 'Need title is required'; end if;

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
  if v_budget_band <> 'not_disclosed_or_unknown' and v_budget_status not in ('confirmed', 'working_range') then
    raise exception 'A declared budget band requires Confirmed or Working Range budget status';
  end if;

  insert into concierge_ops.organizations (
    organization_name, organization_type, website, city, state_region, country,
    lifecycle_stage, pilot_cohort, relationship_source, relationship_summary
  ) values (
    v_organization_name, nullif(btrim(p_payload ->> 'organization_type'), ''),
    nullif(btrim(p_payload ->> 'website'), ''), nullif(btrim(p_payload ->> 'city'), ''),
    nullif(btrim(p_payload ->> 'state_region'), ''),
    coalesce(nullif(btrim(p_payload ->> 'country'), ''), 'United States'),
    'discovery', coalesce((p_payload ->> 'pilot_cohort')::boolean, false),
    nullif(btrim(p_payload ->> 'relationship_source'), ''),
    nullif(btrim(p_payload ->> 'relationship_summary'), '')
  ) returning id into v_organization_id;

  insert into concierge_ops.people (
    first_name, last_name, title_role, decision_role, email, phone, preferred_channel,
    contact_status, is_primary_contact, contact_notes, organization_id
  ) values (
    v_contact_first_name, v_contact_last_name, nullif(btrim(p_payload ->> 'contact_title_role'), ''),
    coalesce(nullif(btrim(p_payload ->> 'contact_decision_role'), ''), 'unknown'),
    nullif(btrim(p_payload ->> 'contact_email'), ''), nullif(btrim(p_payload ->> 'contact_phone'), ''),
    coalesce(nullif(btrim(p_payload ->> 'contact_preferred_channel'), ''), 'unknown'),
    'unverified', true, nullif(btrim(p_payload ->> 'contact_notes'), ''), v_organization_id
  ) returning id into v_contact_id;

  update concierge_ops.organizations set primary_contact_id = v_contact_id where id = v_organization_id;

  insert into concierge_ops.needs (
    organization_id, need_title, need_origin, need_type, service_frequency,
    primary_service_category, service_detail, need_brief, desired_outcome, must_haves,
    nice_to_haves, urgency, target_decision_on, target_start_on, budget_status,
    budget_basis, budget_band, budget_band_basis, delivery_requirement, service_location,
    faith_alignment_requirement, faith_fit_rationale, risk_tier, compliance_gate, status,
    next_action, next_action_on, requesting_contact_id, decision_maker_ids,
    church_sourcing_permission_status, referral_contact_permission_status,
    church_identity_permission_status, public_sourcing_permission_status,
    church_sourcing_permission_recorded_at, church_sourcing_permission_source,
    church_sourcing_permission_reference, church_sourcing_permission_recorded_by
  ) values (
    v_organization_id, v_need_title, nullif(btrim(p_payload ->> 'need_origin'), ''), v_need_type,
    coalesce(nullif(btrim(p_payload ->> 'service_frequency'), ''), 'unknown'),
    nullif(btrim(p_payload ->> 'primary_service_category'), ''),
    nullif(btrim(p_payload ->> 'service_detail'), ''), nullif(btrim(p_payload ->> 'need_brief'), ''),
    nullif(btrim(p_payload ->> 'desired_outcome'), ''), nullif(btrim(p_payload ->> 'must_haves'), ''),
    nullif(btrim(p_payload ->> 'nice_to_haves'), ''),
    coalesce(nullif(btrim(p_payload ->> 'urgency'), ''), 'standard'),
    nullif(p_payload ->> 'target_decision_on', '')::date, nullif(p_payload ->> 'target_start_on', '')::date,
    v_budget_status, v_budget_basis, v_budget_band, v_budget_band_basis,
    coalesce(nullif(btrim(p_payload ->> 'delivery_requirement'), ''), 'unknown'),
    nullif(btrim(p_payload ->> 'service_location'), ''),
    coalesce(nullif(btrim(p_payload ->> 'faith_alignment_requirement'), ''), 'unknown'),
    coalesce(nullif(btrim(p_payload ->> 'faith_fit_rationale'), ''), ''),
    'unclassified', 'standard', 'intake', nullif(btrim(p_payload ->> 'next_action'), ''),
    nullif(p_payload ->> 'next_action_on', '')::date, v_contact_id,
    case when coalesce(nullif(btrim(p_payload ->> 'contact_decision_role'), ''), 'unknown') = 'decision_maker'
      then array[v_contact_id] else '{}'::uuid[] end,
    coalesce(nullif(btrim(p_payload ->> 'church_sourcing_permission_status'), ''), 'not_requested'),
    coalesce(nullif(btrim(p_payload ->> 'referral_contact_permission_status'), ''), 'not_applicable'),
    coalesce(nullif(btrim(p_payload ->> 'church_identity_permission_status'), ''), 'not_requested'),
    coalesce(nullif(btrim(p_payload ->> 'public_sourcing_permission_status'), ''), 'not_requested'),
    nullif(p_payload ->> 'church_sourcing_permission_recorded_at', '')::timestamptz,
    nullif(btrim(p_payload ->> 'church_sourcing_permission_source'), ''),
    nullif(btrim(p_payload ->> 'church_sourcing_permission_reference'), ''),
    case when nullif(btrim(p_payload ->> 'church_sourcing_permission_status'), '') = 'granted'
      or nullif(btrim(p_payload ->> 'referral_contact_permission_status'), '') = 'granted'
      or nullif(btrim(p_payload ->> 'church_identity_permission_status'), '') = 'granted'
      or nullif(btrim(p_payload ->> 'public_sourcing_permission_status'), '') = 'granted'
      then v_operator_id else null end
  ) returning id into v_need_id;

  return jsonb_build_object(
    'organization_id', v_organization_id, 'contact_id', v_contact_id, 'need_id', v_need_id,
    'organization_name', v_organization_name, 'need_title', v_need_title, 'status', 'intake'
  );
end;
$$;

comment on column concierge_ops.needs.church_sourcing_permission_status is
  'Need-specific church permission for FaithBid to source vendors. Required before Ready to Source; does not imply referral contact, identity disclosure, or public posting permission.';
comment on column concierge_ops.needs.church_identity_permission_status is
  'Separate permission to identify the church to prospective vendors. Never inferred from general sourcing permission.';
comment on column concierge_ops.needs.public_sourcing_permission_status is
  'Separate permission to post or source the need in public communities. Never inferred from general sourcing permission.';
