-- Dallas pilot truth gates:
-- 1. A research lead cannot be qualified or promoted until the vendor has
--    explicitly agreed to be considered and the consent evidence is recorded.
-- 2. Pilot-excluded and out-of-scope categories are derived by the database and
--    cannot advance to sourcing. Sensitive-system access requires approval.

alter table public.growth_vendors
  add column if not exists consideration_consent_status text not null default 'not_requested',
  add column if not exists consideration_consented_at timestamptz,
  add column if not exists consideration_consent_source text,
  add column if not exists consideration_consent_reference text,
  add column if not exists consideration_consent_recorded_by uuid;

alter table public.growth_vendors
  drop constraint if exists growth_vendors_consideration_consent_status_check,
  add constraint growth_vendors_consideration_consent_status_check
    check (consideration_consent_status in ('not_requested','pending','confirmed','declined','withdrawn')),
  drop constraint if exists growth_vendors_confirmed_consent_evidence_check,
  add constraint growth_vendors_confirmed_consent_evidence_check check (
    consideration_consent_status <> 'confirmed'
    or (
      consideration_consented_at is not null
      and nullif(btrim(coalesce(consideration_consent_source, '')), '') is not null
      and nullif(btrim(coalesce(consideration_consent_reference, '')), '') is not null
      and consideration_consent_recorded_by is not null
    )
  );

comment on column public.growth_vendors.consideration_consent_status is
  'Whether the vendor explicitly agreed to be considered for FaithBid Concierge work. This is separate from evidence verification.';
comment on column public.growth_vendors.consideration_consent_reference is
  'Auditable reference to the email, call note, text, meeting note, or signed document containing the vendor agreement.';

create or replace function public.enforce_growth_vendor_qualification_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.consideration_consent_status = 'confirmed'
     and new.consideration_consented_at > now() then
    raise exception 'Vendor consideration consent cannot be dated in the future.';
  end if;

  if lower(coalesce(new.status, '')) = any (array['qualified','approved','ready','interested','converted'])
     and new.consideration_consent_status <> 'confirmed' then
    raise exception 'A Growth Engine vendor cannot be qualified until explicit agreement to be considered is confirmed.';
  end if;

  return new;
end;
$$;

drop trigger if exists growth_vendors_qualification_consent_gate on public.growth_vendors;
create trigger growth_vendors_qualification_consent_gate
before insert or update on public.growth_vendors
for each row
execute function public.enforce_growth_vendor_qualification_consent();

revoke all on function public.enforce_growth_vendor_qualification_consent()
  from public, anon, authenticated;

alter table concierge_ops.vendors
  add column if not exists consideration_consent_status text not null default 'not_requested',
  add column if not exists consideration_consented_at timestamptz,
  add column if not exists consideration_consent_source text,
  add column if not exists consideration_consent_reference text,
  add column if not exists consideration_consent_recorded_by uuid;

alter table concierge_ops.vendors
  drop constraint if exists vendors_consideration_consent_status_check,
  add constraint vendors_consideration_consent_status_check
    check (consideration_consent_status in ('not_requested','pending','confirmed','declined','withdrawn')),
  drop constraint if exists vendors_confirmed_consent_evidence_check,
  add constraint vendors_confirmed_consent_evidence_check check (
    consideration_consent_status <> 'confirmed'
    or (
      consideration_consented_at is not null
      and nullif(btrim(coalesce(consideration_consent_source, '')), '') is not null
      and nullif(btrim(coalesce(consideration_consent_reference, '')), '') is not null
      and consideration_consent_recorded_by is not null
    )
  );

comment on column concierge_ops.vendors.consideration_consent_status is
  'Required explicit vendor agreement to be considered before a full Concierge vendor record may exist.';

create or replace function concierge_ops.enforce_vendor_consideration_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.consideration_consent_status <> 'confirmed'
     or new.consideration_consented_at is null
     or nullif(btrim(coalesce(new.consideration_consent_source, '')), '') is null
     or nullif(btrim(coalesce(new.consideration_consent_reference, '')), '') is null
     or new.consideration_consent_recorded_by is null then
    raise exception 'A full Concierge vendor record requires explicit, evidenced agreement to be considered.';
  end if;

  if new.consideration_consented_at > now() then
    raise exception 'Vendor consideration consent cannot be dated in the future.';
  end if;

  return new;
end;
$$;

drop trigger if exists vendors_consideration_consent_gate on concierge_ops.vendors;
create trigger vendors_consideration_consent_gate
before insert or update on concierge_ops.vendors
for each row
execute function concierge_ops.enforce_vendor_consideration_consent();

revoke all on function concierge_ops.enforce_vendor_consideration_consent()
  from public, anon, authenticated;

create or replace function concierge_ops.enforce_growth_vendor_promotion_gate()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, concierge_ops
as $$
declare
  source_vendor public.growth_vendors%rowtype;
  source_status text;
begin
  if new.growth_vendor_id is null then
    return new;
  end if;

  select *
  into source_vendor
  from public.growth_vendors
  where id = new.growth_vendor_id;

  if not found then
    raise exception 'Growth Engine source vendor was not found.';
  end if;

  source_status := lower(coalesce(source_vendor.status, ''));

  if source_status = 'research_hold'
     or source_status <> all (array['qualified','approved','ready','interested','converted'])
     or source_vendor.consideration_consent_status <> 'confirmed'
     or source_vendor.business_identity_status <> 'verified'
     or source_vendor.website_safety_status not in ('safe','not_applicable')
     or source_vendor.licensing_status not in ('verified','not_applicable')
     or source_vendor.insurance_status <> 'verified'
     or source_vendor.references_status <> 'verified'
     or source_vendor.commercial_capacity_status <> 'verified'
     or source_vendor.church_fit_status <> 'verified'
  then
    raise exception 'Growth Engine vendor is not eligible for Concierge promotion. Confirm explicit consideration consent, complete every verification gate, and clear any research hold first.';
  end if;

  if new.consideration_consent_status <> 'confirmed'
     or new.consideration_consented_at is distinct from source_vendor.consideration_consented_at
     or new.consideration_consent_source is distinct from source_vendor.consideration_consent_source
     or new.consideration_consent_reference is distinct from source_vendor.consideration_consent_reference
     or new.consideration_consent_recorded_by is distinct from source_vendor.consideration_consent_recorded_by then
    raise exception 'Concierge vendor consent evidence must match the confirmed Growth Engine source record.';
  end if;

  return new;
end;
$$;

drop trigger if exists vendors_growth_vendor_promotion_gate on concierge_ops.vendors;
create trigger vendors_growth_vendor_promotion_gate
before insert or update of growth_vendor_id on concierge_ops.vendors
for each row
execute function concierge_ops.enforce_growth_vendor_promotion_gate();

revoke all on function concierge_ops.enforce_growth_vendor_promotion_gate()
  from public, anon, authenticated;

alter table concierge_ops.needs
  add column if not exists pilot_risk_flags text[] not null default '{}'::text[],
  add column if not exists pilot_eligibility text not null default 'review_required',
  add column if not exists pilot_hold_reason text;

alter table concierge_ops.needs
  drop constraint if exists needs_pilot_eligibility_check,
  add constraint needs_pilot_eligibility_check
    check (pilot_eligibility in ('review_required','eligible','security_review_required','excluded')),
  drop constraint if exists needs_pilot_risk_flags_check,
  add constraint needs_pilot_risk_flags_check check (
    pilot_risk_flags <@ array[
      'investment_or_financial_advice',
      'insurance_sales',
      'real_estate_brokerage',
      'healthcare_or_medical',
      'private_security',
      'unrestricted_bank_access',
      'unsupervised_children',
      'sensitive_system_access'
    ]::text[]
  );

comment on column concierge_ops.needs.pilot_risk_flags is
  'Structured Dallas pilot exclusions and the sensitive-system security-review flag.';
comment on column concierge_ops.needs.pilot_eligibility is
  'Database-derived Dallas pilot eligibility. Excluded and review-required needs cannot advance to sourcing.';
comment on column concierge_ops.needs.pilot_hold_reason is
  'Database-derived explanation for a Dallas pilot exclusion or required security review.';

create or replace function concierge_ops.classify_dallas_pilot_need()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_category text := lower(coalesce(new.primary_service_category, ''));
  v_allowed_categories constant text[] := array[
    'cleaning_and_janitorial',
    'landscaping_and_grounds',
    'finance_accounting_and_payroll',
    'it_cybersecurity_and_managed_services',
    'av_production_and_worship_technology',
    'facilities_and_maintenance'
  ];
  v_excluded_flags constant text[] := array[
    'investment_or_financial_advice',
    'insurance_sales',
    'real_estate_brokerage',
    'healthcare_or_medical',
    'private_security',
    'unrestricted_bank_access',
    'unsupervised_children'
  ];
  v_excluded_flag text;
begin
  select flag into v_excluded_flag
  from unnest(coalesce(new.pilot_risk_flags, '{}'::text[])) as flag
  where flag = any (v_excluded_flags)
  limit 1;

  if v_category = '' then
    new.pilot_eligibility := 'review_required';
    new.pilot_hold_reason := 'Select a Dallas pilot service category before sourcing.';
  elsif v_category = 'legal_risk_and_insurance' then
    new.pilot_eligibility := 'excluded';
    new.pilot_hold_reason := 'Legal services and insurance sales are excluded from the Dallas pilot.';
    new.risk_tier := 'tier_3_regulated';
    new.compliance_gate := 'declined';
  elsif v_excluded_flag is not null then
    new.pilot_eligibility := 'excluded';
    new.pilot_hold_reason := 'Excluded Dallas pilot scope: ' || replace(v_excluded_flag, '_', ' ') || '.';
    new.risk_tier := 'tier_3_regulated';
    new.compliance_gate := 'declined';
  elsif v_category <> all (v_allowed_categories) then
    new.pilot_eligibility := 'excluded';
    new.pilot_hold_reason := 'This service category is outside the six approved Dallas pilot categories.';
    new.risk_tier := 'tier_3_regulated';
    new.compliance_gate := 'declined';
  elsif 'sensitive_system_access' = any (coalesce(new.pilot_risk_flags, '{}'::text[])) then
    new.pilot_eligibility := 'security_review_required';
    new.pilot_hold_reason := 'Sensitive IT or ChMS access requires an approved security review before sourcing.';
    new.risk_tier := 'tier_3_regulated';
    if new.compliance_gate <> 'approved' then
      new.compliance_gate := 'legal_compliance_approval_required';
    end if;
  else
    new.pilot_eligibility := 'eligible';
    new.pilot_hold_reason := null;
  end if;

  return new;
end;
$$;

drop trigger if exists needs_pilot_eligibility_classification on concierge_ops.needs;
create trigger needs_pilot_eligibility_classification
before insert or update on concierge_ops.needs
for each row
execute function concierge_ops.classify_dallas_pilot_need();

revoke all on function concierge_ops.classify_dallas_pilot_need()
  from public, anon, authenticated;

create or replace function concierge_ops.enforce_need_stage()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  eligible_shortlists integer;
begin
  if new.status in (
    'ready_to_source', 'sourcing', 'shortlist_ready',
    'organization_reviewing', 'vendor_selected'
  ) then
    if new.pilot_eligibility in ('review_required','excluded') then
      raise exception 'Dallas pilot hold: %', coalesce(new.pilot_hold_reason, 'Need is not eligible for sourcing.');
    end if;

    if new.pilot_eligibility = 'security_review_required'
       and new.compliance_gate <> 'approved' then
      raise exception 'Dallas pilot hold: an approved security review is required before sourcing.';
    end if;

    if new.requesting_contact_id is null
       or new.need_type = 'unknown'
       or nullif(btrim(coalesce(new.need_brief, '')), '') is null
       or nullif(btrim(coalesce(new.desired_outcome, '')), '') is null
       or nullif(btrim(coalesce(new.must_haves, '')), '') is null
       or new.delivery_requirement = 'unknown'
       or (
         new.delivery_requirement in (
           'on_site_local', 'on_site_regional', 'on_site_nationwide', 'hybrid'
         )
         and nullif(btrim(coalesce(new.service_location, '')), '') is null
       )
       or new.risk_tier = 'unclassified'
       or new.owner_id is null
       or nullif(btrim(coalesce(new.next_action, '')), '') is null
       or new.next_action_on is null
       or (
         new.budget_status in ('confirmed', 'working_range')
         and new.budget_basis is null
       )
       or (
         new.faith_alignment_requirement in ('required', 'strongly_preferred')
         and nullif(btrim(coalesce(new.faith_fit_rationale, '')), '') is null
       ) then
      raise exception 'Need does not satisfy the Ready to Source requiredness gate';
    end if;

    if new.risk_tier = 'tier_3_regulated' and new.compliance_gate <> 'approved' then
      raise exception 'Tier 3 / regulated Need cannot advance without compliance approval';
    end if;
  end if;

  if new.status in ('organization_reviewing', 'vendor_selected') then
    select count(*) into eligible_shortlists
    from concierge_ops.matches m
    where m.need_id = new.id
      and m.stage in ('shortlisted', 'selected')
      and m.archived_at is null;

    if eligible_shortlists < 1 or new.shortlist_presented_at is null then
      raise exception 'Organization Reviewing requires a shortlisted Match and presentation timestamp';
    end if;
  end if;

  if new.status = 'vendor_selected' and new.selected_match_id is null then
    raise exception 'Vendor Selected Need requires Selected Match';
  end if;

  return new;
end;
$$;

-- Recreate to make the intended trigger order explicit: classification runs
-- before the existing stage gate because PostgreSQL orders same-kind triggers
-- alphabetically by name.
drop trigger if exists needs_pilot_eligibility_classification on concierge_ops.needs;
create trigger needs_pilot_eligibility_classification
before insert or update on concierge_ops.needs
for each row
execute function concierge_ops.classify_dallas_pilot_need();

revoke all on function concierge_ops.enforce_need_stage()
  from public, anon, authenticated;
