-- One canonical service taxonomy for Marketplace and Concierge, plus an
-- auditable translation from Marketplace search bands to Concierge fee bands.

create table if not exists public.faithbid_service_taxonomy (
  category_key text primary key,
  marketplace_label text,
  concierge_label text,
  pilot_eligible boolean not null default false,
  excluded_during_pilot boolean not null default true,
  pilot_scope_note text not null,
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint faithbid_service_taxonomy_key_check
    check (category_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  constraint faithbid_service_taxonomy_scope_check
    check (pilot_eligible <> excluded_during_pilot),
  constraint faithbid_service_taxonomy_label_check
    check (marketplace_label is not null or concierge_label is not null)
);

insert into public.faithbid_service_taxonomy (
  category_key, marketplace_label, concierge_label, pilot_eligible,
  excluded_during_pilot, pilot_scope_note, display_order
) values
  ('cleaning_and_janitorial','Cleaning / Janitorial','Cleaning & janitorial — Dallas pilot',true,false,'Approved Dallas pilot category.',10),
  ('landscaping_and_grounds','Landscaping / Grounds','Landscaping & grounds — Dallas pilot',true,false,'Approved Dallas pilot category.',20),
  ('facilities_and_maintenance','Facilities / Handyman / HVAC','Facilities, handyman & HVAC — Dallas pilot',true,false,'Approved Dallas pilot category.',30),
  ('av_production_and_worship_technology','Tech / AV / Production','AV, media & livestream — Dallas pilot',true,false,'Approved Dallas pilot category.',40),
  ('it_cybersecurity_and_managed_services','Web & Technology','IT & ChMS — Dallas pilot',true,false,'Approved only when sensitive-system access has completed security review.',50),
  ('finance_accounting_and_payroll','Accounting & Finance','Bookkeeping, accounting & payroll — Dallas pilot',true,false,'Approved only without unrestricted bank access.',60),
  ('worship_and_music','Worship & Music',null,false,true,'Marketplace category held outside the six-category Dallas pilot.',70),
  ('creative_media','Creative Media',null,false,true,'Marketplace category held outside the six-category Dallas pilot.',80),
  ('children_and_youth_ministry','Children & Youth Ministry',null,false,true,'Held during the Dallas pilot; unsupervised work with children is explicitly excluded.',90),
  ('speaking_coaching_and_consulting','Speaking, Coaching & Consulting',null,false,true,'Marketplace category held outside the six-category Dallas pilot.',100),
  ('construction_and_trades','Construction & Renovation','Construction & trades',false,true,'Held outside the six approved Dallas pilot categories; facilities and HVAC use their distinct approved category.',110),
  ('legal_risk_and_insurance','Legal Services','Legal, risk & insurance',false,true,'Legal services and insurance sales are excluded during the Dallas pilot.',120),
  ('marketing_branding_and_communications','Marketing & Communications','Marketing, branding & communications',false,true,'Held outside the six approved Dallas pilot categories.',130),
  ('web_software_and_digital',null,'Web, software & digital',false,true,'Held outside the six approved Dallas pilot categories.',140),
  ('hr_staffing_and_leadership_search',null,'HR, staffing & leadership search',false,true,'Held outside the six approved Dallas pilot categories.',150),
  ('consulting_strategy_and_operations',null,'Consulting, strategy & operations',false,true,'Held outside the six approved Dallas pilot categories.',160),
  ('events_hospitality_and_travel',null,'Events, hospitality & travel',false,true,'Held outside the six approved Dallas pilot categories.',170),
  ('products_supplies_and_equipment',null,'Products, supplies & equipment',false,true,'Held outside the six approved Dallas pilot categories.',180),
  ('other_needs_classification',null,'Other / classify during review',false,true,'Requires classification into an approved Dallas pilot category before sourcing.',190)
on conflict (category_key) do update set
  marketplace_label = excluded.marketplace_label,
  concierge_label = excluded.concierge_label,
  pilot_eligible = excluded.pilot_eligible,
  excluded_during_pilot = excluded.excluded_during_pilot,
  pilot_scope_note = excluded.pilot_scope_note,
  display_order = excluded.display_order,
  updated_at = clock_timestamp();

alter table public.faithbid_service_taxonomy enable row level security;
drop policy if exists faithbid_service_taxonomy_public_read on public.faithbid_service_taxonomy;
create policy faithbid_service_taxonomy_public_read
  on public.faithbid_service_taxonomy for select
  to anon, authenticated
  using (true);

revoke all on table public.faithbid_service_taxonomy from public, anon, authenticated;
grant select on table public.faithbid_service_taxonomy to anon, authenticated;

alter table concierge_ops.needs
  add column if not exists marketplace_budget_band text,
  add column if not exists budget_translation_status text not null default 'not_applicable';

alter table concierge_ops.needs
  drop constraint if exists needs_marketplace_budget_band_check,
  add constraint needs_marketplace_budget_band_check check (
    marketplace_budget_band is null or marketplace_budget_band in (
      'under_500','500_to_999','1000_to_2499','2500_to_4999',
      '5000_to_9999','10000_to_24999','25000_or_more'
    )
  ),
  drop constraint if exists needs_budget_translation_status_check,
  add constraint needs_budget_translation_status_check check (
    budget_translation_status in (
      'not_applicable','translated','church_confirmation_required','church_confirmed'
    )
  );

comment on column concierge_ops.needs.marketplace_budget_band is
  'Original Marketplace search band when a church need is carried into Concierge.';
comment on column concierge_ops.needs.budget_translation_status is
  'Whether the Marketplace band translated deterministically or required the church to confirm the Concierge fee band.';

create or replace function concierge_ops.translate_marketplace_budget_band()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.marketplace_budget_band is null then
    new.budget_translation_status := 'not_applicable';
    return new;
  end if;

  if new.marketplace_budget_band in ('under_500','500_to_999','1000_to_2499','2500_to_4999') then
    new.budget_band := 'under_5000';
    new.budget_basis := 'total_project';
    new.budget_band_basis := 'organization_declared_total_project';
    new.budget_translation_status := 'translated';
  elsif new.marketplace_budget_band in ('5000_to_9999','10000_to_24999') then
    new.budget_band := '5000_to_24999';
    new.budget_basis := 'total_project';
    new.budget_band_basis := 'organization_declared_total_project';
    new.budget_translation_status := 'translated';
  elsif new.marketplace_budget_band = '25000_or_more' then
    if new.budget_band in ('25000_to_99999','100000_or_more')
       and new.budget_band_basis in (
         'organization_declared_total_project',
         'organization_declared_first_12_months'
       ) then
      new.budget_translation_status := 'church_confirmed';
    else
      new.budget_band := 'not_disclosed_or_unknown';
      new.budget_band_basis := 'manual_review';
      new.budget_translation_status := 'church_confirmation_required';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists needs_budget_band_translation on concierge_ops.needs;
create trigger needs_budget_band_translation
before insert or update of marketplace_budget_band, budget_band, budget_band_basis
on concierge_ops.needs
for each row
execute function concierge_ops.translate_marketplace_budget_band();

revoke all on function concierge_ops.translate_marketplace_budget_band()
  from public, anon, authenticated;

create or replace function concierge_ops.classify_dallas_pilot_need()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_category text := lower(coalesce(new.primary_service_category, ''));
  v_is_allowed boolean;
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
  select taxonomy.pilot_eligible
  into v_is_allowed
  from public.faithbid_service_taxonomy taxonomy
  where taxonomy.category_key = v_category;

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
  elsif coalesce(v_is_allowed, false) is false then
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

revoke all on function concierge_ops.classify_dallas_pilot_need()
  from public, anon, authenticated;
