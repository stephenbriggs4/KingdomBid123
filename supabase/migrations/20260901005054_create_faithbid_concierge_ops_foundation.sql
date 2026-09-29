-- FaithBid Concierge Operations
-- Draft migration 001: eight-table foundation, integrity gates, RLS, and admin views
-- Target project: KingdomBid (knkwaphosqronbhrvlsu), PostgreSQL 17
-- State: DRAFT ONLY. Do not apply before backup, review, and verification.

begin;

create schema if not exists concierge_ops;

comment on schema concierge_ops is
  'Founder-operated FaithBid concierge workflow. Private from marketplace users.';

revoke all on schema concierge_ops from public, anon;

-- ---------------------------------------------------------------------------
-- Shared safe helpers
-- ---------------------------------------------------------------------------

create or replace function concierge_ops.normalize_domain(raw_url text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(btrim(coalesce(raw_url, ''))), '^https?://', ''),
        '^www\.',
        ''
      ),
      '/.*$',
      ''
    ),
    ''
  );
$$;

create or replace function concierge_ops.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function concierge_ops.normalize_domain(text) from public, anon;
revoke all on function concierge_ops.set_updated_at() from public, anon;

-- ---------------------------------------------------------------------------
-- Table 1: Organizations
-- ---------------------------------------------------------------------------

create table concierge_ops.organizations (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null check (btrim(organization_name) <> ''),
  organization_type text not null check (organization_type in (
    'church', 'ministry', 'christian_nonprofit', 'christian_school',
    'network_or_denomination', 'other'
  )),
  website text,
  canonical_domain text generated always as
    (concierge_ops.normalize_domain(website)) stored,
  city text,
  state_region text,
  country text not null default 'United States',
  lifecycle_stage text not null default 'prospect' check (lifecycle_stage in (
    'prospect', 'discovery', 'active', 'dormant', 'do_not_pursue'
  )),
  pilot_cohort boolean not null default false,
  relationship_owner_id uuid references public.profiles(id) on delete set null,
  relationship_source text not null check (relationship_source in (
    'founder_relationship', 'organization_referral', 'vendor_referral',
    'network_or_denomination', 'growth_engine', 'event', 'inbound', 'other'
  )),
  last_meaningful_touch_at timestamptz,
  next_follow_up_on date,
  relationship_summary text,
  discovery_completed_on date,
  current_vendor_sourcing_methods text[] not null default '{}'::text[]
    check (current_vendor_sourcing_methods <@ array[
      'past_relationships', 'organization_referrals', 'network_or_denomination',
      'staff_research', 'search_or_web', 'bid_or_rfp', 'other'
    ]::text[]),
  procurement_pain_themes text[] not null default '{}'::text[]
    check (procurement_pain_themes <@ array[
      'trust', 'quality', 'price', 'responsiveness', 'faith_alignment',
      'speed', 'discovery', 'scope_clarity', 'accountability', 'other'
    ]::text[]),
  decision_approval_process text,
  faith_alignment_default text not null default 'unknown' check (faith_alignment_default in (
    'required_often', 'category_dependent', 'preferred',
    'usually_not_material', 'unknown'
  )),
  recurring_service_categories text[] not null default '{}'::text[],
  procurement_value_signal text not null default 'not_discussed' check (procurement_value_signal in (
    'clear_willingness', 'possible', 'low_or_unclear', 'not_discussed'
  )),
  platform_profile_id uuid references public.profiles(id) on delete set null,
  growth_church_id uuid references public.growth_churches(id) on delete set null,
  primary_contact_id uuid,
  referred_by_organization_id uuid references concierge_ops.organizations(id) on delete set null,
  referred_by_person_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint organizations_not_self_referred check (
    referred_by_organization_id is null or referred_by_organization_id <> id
  )
);

create unique index organizations_platform_profile_uidx
  on concierge_ops.organizations (platform_profile_id)
  where platform_profile_id is not null;
create unique index organizations_growth_church_uidx
  on concierge_ops.organizations (growth_church_id)
  where growth_church_id is not null;
create unique index organizations_domain_uidx
  on concierge_ops.organizations (canonical_domain)
  where canonical_domain is not null and archived_at is null;
create index organizations_owner_idx
  on concierge_ops.organizations (relationship_owner_id);
create index organizations_referrer_idx
  on concierge_ops.organizations (referred_by_organization_id);
create index organizations_follow_up_idx
  on concierge_ops.organizations (next_follow_up_on)
  where next_follow_up_on is not null and archived_at is null;
create index organizations_lifecycle_idx
  on concierge_ops.organizations (lifecycle_stage, updated_at desc)
  where archived_at is null;

-- ---------------------------------------------------------------------------
-- Table 2: Vendors (private operating extension/intelligence record)
-- ---------------------------------------------------------------------------

create table concierge_ops.vendors (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null check (btrim(vendor_name) <> ''),
  legal_business_name text,
  website text,
  canonical_domain text generated always as
    (concierge_ops.normalize_domain(website)) stored,
  service_categories text[] not null default '{}'::text[],
  capabilities_summary text,
  delivery_modes text[] not null default '{}'::text[] check (delivery_modes <@ array[
    'local_on_site', 'regional_on_site', 'nationwide_on_site', 'remote'
  ]::text[]),
  headquarters_city text,
  headquarters_state_region text,
  typical_project_minimum_cents bigint check (
    typical_project_minimum_cents is null or typical_project_minimum_cents >= 0
  ),
  typical_project_maximum_cents bigint check (
    typical_project_maximum_cents is null or typical_project_maximum_cents >= 0
  ),
  church_ministry_experience text not null default 'unknown' check (church_ministry_experience in (
    'extensive', 'some', 'none_known', 'unknown'
  )),
  relationship_status text not null default 'discovered' check (relationship_status in (
    'discovered', 'contacted', 'qualified', 'active_bench', 'inactive', 'do_not_use'
  )),
  relationship_owner_id uuid references public.profiles(id) on delete set null,
  relationship_source text not null check (relationship_source in (
    'founder_or_congregation', 'organization_referral', 'vendor_referral',
    'growth_engine', 'direct_research', 'inbound', 'other'
  )),
  last_meaningful_touch_at timestamptz,
  next_follow_up_on date,
  current_capacity_note text,
  capacity_checked_on date,
  vetting_decision text not null default 'not_reviewed' check (vetting_decision in (
    'not_reviewed', 'in_review', 'approved', 'approved_with_conditions',
    'not_approved', 'review_expired'
  )),
  vetting_decision_date date,
  vetting_review_due_on date,
  vetting_summary text,
  proof_level text not null default 'not_yet_proven' check (proof_level in (
    'not_yet_proven', 'proven_one_successful_engagement',
    'proven_repeat_success', 'performance_concern'
  )),
  proven_service_categories text[] not null default '{}'::text[],
  proof_decision_date date,
  proof_decision_by uuid references public.profiles(id) on delete set null,
  internal_restrictions_concerns text,
  platform_vendor_id uuid references public.vendors(id) on delete set null,
  growth_vendor_id uuid references public.growth_vendors(id) on delete set null,
  primary_contact_id uuid,
  referred_by_person_id uuid,
  referred_by_organization_id uuid references concierge_ops.organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint vendors_project_range_check check (
    typical_project_minimum_cents is null
    or typical_project_maximum_cents is null
    or typical_project_minimum_cents <= typical_project_maximum_cents
  ),
  constraint vendors_vetting_decision_fields_check check (
    vetting_decision in ('not_reviewed', 'in_review', 'review_expired')
    or (
      vetting_decision_date is not null
      and nullif(btrim(coalesce(vetting_summary, '')), '') is not null
    )
  ),
  constraint vendors_proof_fields_check check (
    (proof_level in ('not_yet_proven', 'performance_concern'))
    or (
      cardinality(proven_service_categories) > 0
      and proof_decision_date is not null
      and proof_decision_by is not null
    )
  )
);

create unique index vendors_platform_vendor_uidx
  on concierge_ops.vendors (platform_vendor_id)
  where platform_vendor_id is not null;
create unique index vendors_growth_vendor_uidx
  on concierge_ops.vendors (growth_vendor_id)
  where growth_vendor_id is not null;
create unique index vendors_domain_uidx
  on concierge_ops.vendors (canonical_domain)
  where canonical_domain is not null and archived_at is null;
create index vendors_owner_idx on concierge_ops.vendors (relationship_owner_id);
create index vendors_proof_decision_by_idx on concierge_ops.vendors (proof_decision_by);
create index vendors_referring_org_idx on concierge_ops.vendors (referred_by_organization_id);
create index vendors_relationship_idx
  on concierge_ops.vendors (relationship_status, updated_at desc)
  where archived_at is null;
create index vendors_vetting_due_idx
  on concierge_ops.vendors (vetting_review_due_on)
  where vetting_review_due_on is not null and archived_at is null;

-- ---------------------------------------------------------------------------
-- Table 3: People
-- ---------------------------------------------------------------------------

create table concierge_ops.people (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  full_name text generated always as
    (nullif(btrim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '')) stored,
  external_affiliation text,
  title_role text,
  decision_role text not null default 'unknown' check (decision_role in (
    'decision_maker', 'influencer', 'coordinator', 'finance_or_legal',
    'technical_evaluator', 'other', 'unknown'
  )),
  email text,
  normalized_email text generated always as (nullif(lower(btrim(email)), '')) stored,
  phone text,
  preferred_channel text not null default 'unknown' check (preferred_channel in (
    'email', 'phone', 'text', 'video', 'other', 'unknown'
  )),
  contact_status text not null default 'unverified' check (contact_status in (
    'active', 'former', 'unverified', 'do_not_contact'
  )),
  is_primary_contact boolean not null default false,
  contact_notes text,
  organization_id uuid references concierge_ops.organizations(id) on delete restrict,
  vendor_id uuid references concierge_ops.vendors(id) on delete restrict,
  platform_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint people_name_present_check check (
    coalesce(nullif(btrim(first_name), ''), nullif(btrim(last_name), '')) is not null
  ),
  constraint people_affiliation_check check (
    organization_id is not null
    or vendor_id is not null
    or nullif(btrim(external_affiliation), '') is not null
    or platform_profile_id is not null
  )
);

create unique index people_email_uidx
  on concierge_ops.people (normalized_email)
  where normalized_email is not null and archived_at is null;
create index people_organization_idx on concierge_ops.people (organization_id);
create index people_vendor_idx on concierge_ops.people (vendor_id);
create index people_platform_profile_idx on concierge_ops.people (platform_profile_id);
create unique index people_primary_organization_uidx
  on concierge_ops.people (organization_id)
  where organization_id is not null and is_primary_contact and archived_at is null;
create unique index people_primary_vendor_uidx
  on concierge_ops.people (vendor_id)
  where vendor_id is not null and is_primary_contact and archived_at is null;

alter table concierge_ops.organizations
  add constraint organizations_primary_contact_fkey
  foreign key (primary_contact_id) references concierge_ops.people(id) on delete set null,
  add constraint organizations_referred_by_person_fkey
  foreign key (referred_by_person_id) references concierge_ops.people(id) on delete set null;

alter table concierge_ops.vendors
  add constraint vendors_primary_contact_fkey
  foreign key (primary_contact_id) references concierge_ops.people(id) on delete set null,
  add constraint vendors_referred_by_person_fkey
  foreign key (referred_by_person_id) references concierge_ops.people(id) on delete set null;

create index organizations_primary_contact_idx on concierge_ops.organizations (primary_contact_id);
create index organizations_referred_by_person_idx on concierge_ops.organizations (referred_by_person_id);
create index vendors_primary_contact_idx on concierge_ops.vendors (primary_contact_id);
create index vendors_referred_by_person_idx on concierge_ops.vendors (referred_by_person_id);

-- ---------------------------------------------------------------------------
-- Table 4: Needs
-- ---------------------------------------------------------------------------

create table concierge_ops.needs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references concierge_ops.organizations(id) on delete restrict,
  need_title text not null check (btrim(need_title) <> ''),
  need_origin text not null check (need_origin in (
    'organization_request', 'discovery_identified', 'recurring_need',
    'faithbid_proactive', 'referral', 'other'
  )),
  need_type text not null default 'unknown' check (need_type in (
    'one_time_project', 'recurring_service', 'hybrid', 'unknown'
  )),
  service_frequency text not null default 'unknown' check (service_frequency in (
    'weekly', 'monthly', 'quarterly', 'annual', 'seasonal',
    'as_needed', 'other', 'unknown'
  )),
  primary_service_category text not null,
  secondary_service_categories text[] not null default '{}'::text[],
  service_detail text not null check (btrim(service_detail) <> ''),
  need_brief text,
  desired_outcome text,
  must_haves text,
  nice_to_haves text,
  urgency text not null default 'standard' check (urgency in (
    'critical', 'time_sensitive', 'standard', 'exploratory'
  )),
  target_decision_on date,
  target_start_on date,
  budget_status text not null default 'unknown' check (budget_status in (
    'confirmed', 'working_range', 'not_set', 'declined_to_share', 'unknown'
  )),
  budget_basis text check (budget_basis in (
    'total_project', 'monthly', 'annual', 'hourly', 'per_event', 'other'
  )),
  budget_minimum_cents bigint check (budget_minimum_cents is null or budget_minimum_cents >= 0),
  budget_maximum_cents bigint check (budget_maximum_cents is null or budget_maximum_cents >= 0),
  budget_band text not null default 'not_disclosed_or_unknown' check (budget_band in (
    'under_5000', '5000_to_24999', '25000_to_99999',
    '100000_or_more', 'not_disclosed_or_unknown'
  )),
  budget_band_basis text not null default 'manual_review' check (budget_band_basis in (
    'organization_declared_total_project',
    'organization_declared_first_12_months',
    'manual_review'
  )),
  delivery_requirement text not null default 'unknown' check (delivery_requirement in (
    'on_site_local', 'on_site_regional', 'on_site_nationwide',
    'remote', 'hybrid', 'unknown'
  )),
  service_location text,
  faith_alignment_requirement text not null default 'unknown' check (faith_alignment_requirement in (
    'required', 'strongly_preferred', 'preferred', 'not_material', 'unknown'
  )),
  faith_fit_rationale text not null default '',
  risk_tier text not null default 'unclassified' check (risk_tier in (
    'tier_1', 'tier_2', 'tier_3_regulated', 'unclassified'
  )),
  compliance_gate text not null default 'standard' check (compliance_gate in (
    'standard', 'category_sop_required', 'legal_compliance_approval_required',
    'approved', 'declined'
  )),
  status text not null default 'intake' check (status in (
    'intake', 'clarifying', 'ready_to_source', 'sourcing', 'shortlist_ready',
    'organization_reviewing', 'vendor_selected', 'closed_unfilled', 'cancelled'
  )),
  owner_id uuid references public.profiles(id) on delete set null,
  next_action text,
  next_action_on date,
  shortlist_target smallint not null default 3 check (shortlist_target between 1 and 20),
  closure_reason text check (closure_reason in (
    'no_qualified_provider', 'budget', 'timing', 'scope_changed',
    'organization_solved_elsewhere', 'organization_stopped_responding',
    'faithbid_declined', 'other'
  )),
  closure_notes text,
  requesting_contact_id uuid references concierge_ops.people(id) on delete set null,
  decision_maker_ids uuid[] not null default '{}'::uuid[],
  platform_project_id uuid references public.projects(id) on delete set null,
  selected_match_id uuid,
  originating_engagement_id uuid,
  ready_to_source_at timestamptz,
  sourcing_started_at timestamptz,
  shortlist_presented_at timestamptz,
  selected_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint needs_budget_range_check check (
    budget_minimum_cents is null
    or budget_maximum_cents is null
    or budget_minimum_cents <= budget_maximum_cents
  ),
  constraint needs_recurring_frequency_check check (
    need_type not in ('recurring_service', 'hybrid')
    or service_frequency <> 'unknown'
  ),
  constraint needs_tier_3_gate_check check (
    risk_tier <> 'tier_3_regulated'
    or compliance_gate in (
      'category_sop_required', 'legal_compliance_approval_required',
      'approved', 'declined'
    )
  ),
  constraint needs_terminal_fields_check check (
    status not in ('closed_unfilled', 'cancelled')
    or (closed_at is not null and closure_reason is not null)
  )
);

create index needs_organization_idx on concierge_ops.needs (organization_id);
create index needs_requesting_contact_idx on concierge_ops.needs (requesting_contact_id);
create index needs_owner_idx on concierge_ops.needs (owner_id);
create index needs_platform_project_idx on concierge_ops.needs (platform_project_id);
create index needs_decision_makers_gin_idx on concierge_ops.needs using gin (decision_maker_ids);
create index needs_status_next_action_idx
  on concierge_ops.needs (status, next_action_on)
  where archived_at is null;
create index needs_compliance_idx
  on concierge_ops.needs (risk_tier, compliance_gate)
  where archived_at is null;
create unique index needs_active_title_uidx
  on concierge_ops.needs (organization_id, lower(btrim(need_title)))
  where archived_at is null and status not in ('closed_unfilled', 'cancelled');

-- ---------------------------------------------------------------------------
-- Table 5: Sourcing Activities
-- ---------------------------------------------------------------------------

create table concierge_ops.sourcing_activities (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references concierge_ops.needs(id) on delete restrict,
  status text not null default 'planned' check (status in (
    'planned', 'executed', 'awaiting_results', 'closed', 'cancelled_or_blocked'
  )),
  planned_on date,
  executed_at timestamptz,
  closed_at timestamptz,
  source_system text not null check (source_system in (
    'growth_engine_or_supabase', 'existing_vendor_bench',
    'partner_or_referral', 'direct_research', 'other'
  )),
  source_entity_type text not null check (source_entity_type in (
    'group_or_community', 'account_or_page', 'partner_or_person',
    'vendor', 'directory_or_search', 'other'
  )),
  platform text check (platform in (
    'facebook', 'instagram', 'linkedin', 'reddit', 'directory',
    'email', 'phone', 'in_person', 'other'
  )),
  supabase_source_table text check (supabase_source_table in (
    'groups', 'instagram_catalog', 'facebook_priority_targets', 'other_verified'
  )),
  supabase_source_id text,
  source_name_snapshot text not null check (btrim(source_name_snapshot) <> ''),
  source_url_snapshot text,
  reach_snapshot bigint check (reach_snapshot is null or reach_snapshot >= 0),
  growth_category_snapshot text,
  action_type text not null check (action_type in (
    'reviewed_or_searched', 'join_requested', 'admin_contacted',
    'opportunity_posted', 'referral_requested', 'vendor_contacted', 'other'
  )),
  outreach_reference text,
  result_notes text,
  responses integer not null default 0 check (responses >= 0),
  candidate_leads integer not null default 0 check (candidate_leads >= 0),
  zero_result_reason text check (zero_result_reason in (
    'no_response', 'low_quality', 'wrong_audience', 'posting_not_allowed',
    'source_inactive', 'timing', 'other'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint sourcing_growth_identity_check check (
    source_system <> 'growth_engine_or_supabase'
    or (supabase_source_table is not null and nullif(btrim(supabase_source_id), '') is not null)
  ),
  constraint sourcing_execution_time_check check (
    status not in ('executed', 'awaiting_results', 'closed') or executed_at is not null
  ),
  constraint sourcing_closed_time_check check (
    status <> 'closed' or closed_at is not null
  ),
  constraint sourcing_zero_result_check check (
    status <> 'closed' or candidate_leads > 0 or zero_result_reason is not null
  )
);

create index sourcing_need_idx on concierge_ops.sourcing_activities (need_id);
create index sourcing_status_planned_idx
  on concierge_ops.sourcing_activities (status, planned_on)
  where archived_at is null;
create index sourcing_source_identity_idx
  on concierge_ops.sourcing_activities (supabase_source_table, supabase_source_id)
  where supabase_source_id is not null;

-- ---------------------------------------------------------------------------
-- Table 6: Matches
-- ---------------------------------------------------------------------------

create table concierge_ops.matches (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references concierge_ops.needs(id) on delete restrict,
  vendor_id uuid not null references concierge_ops.vendors(id) on delete restrict,
  originating_sourcing_activity_id uuid
    references concierge_ops.sourcing_activities(id) on delete set null,
  stage text not null default 'identified' check (stage in (
    'identified', 'outreach', 'interested', 'evaluating',
    'shortlisted', 'selected', 'closed'
  )),
  disposition text check (disposition in (
    'passed_by_faithbid', 'declined_by_vendor', 'declined_by_organization',
    'unresponsive', 'need_cancelled', 'duplicate', 'other'
  )),
  contacted_at timestamptz,
  responded_at timestamptz,
  shortlisted_at timestamptz,
  introduced_at timestamptz,
  selected_or_closed_at timestamptz,
  vendor_interest text not null default 'unknown' check (vendor_interest in (
    'unknown', 'interested', 'maybe', 'declined', 'no_response'
  )),
  project_availability text not null default 'unknown' check (project_availability in (
    'unknown', 'available', 'limited', 'unavailable'
  )),
  earliest_available_start_on date,
  quote_status text not null default 'not_requested' check (quote_status in (
    'not_requested', 'requested', 'received', 'vendor_declined'
  )),
  quoted_amount_cents bigint check (quoted_amount_cents is null or quoted_amount_cents >= 0),
  quote_basis text check (quote_basis in (
    'total_project', 'monthly', 'annual', 'hourly', 'per_event', 'other'
  )),
  quote_notes text,
  must_have_fit text not null default 'not_assessed' check (must_have_fit in (
    'not_assessed', 'meets', 'partially_meets', 'does_not_meet'
  )),
  overall_fit text not null default 'not_assessed' check (overall_fit in (
    'not_assessed', 'strong', 'viable', 'weak'
  )),
  fit_rationale text,
  concerns text,
  shortlist_rank smallint check (shortlist_rank is null or shortlist_rank between 1 and 50),
  recommendation_summary text,
  organization_feedback text,
  agreed_introduction_fee_cents bigint check (
    agreed_introduction_fee_cents is null or agreed_introduction_fee_cents >= 0
  ),
  renewal_fee_applies text not null default 'no' check (renewal_fee_applies in (
    'no', 'potential_recurring', 'yes_terms_agreed'
  )),
  agreed_renewal_fee_cents bigint check (
    agreed_renewal_fee_cents is null or agreed_renewal_fee_cents >= 0
  ),
  renewal_trigger_terms text,
  placement_agreement_status text not null default 'not_discussed' check (
    placement_agreement_status in (
      'not_discussed', 'proposed', 'accepted_in_writing', 'waived_by_founder',
      'regulatory_review_required', 'not_permitted'
    )
  ),
  placement_agreement_reference text,
  fee_exception_reason text,
  fee_approved_by uuid references public.profiles(id) on delete set null,
  fee_approved_on date,
  project_vendor_link_id uuid references public.project_vendor_links(id) on delete set null,
  match_snapshot_id uuid references public.match_snapshots(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint matches_closed_disposition_check check (
    stage <> 'closed' or disposition is not null
  ),
  constraint matches_quote_fields_check check (
    quote_status <> 'received'
    or (quoted_amount_cents is not null and quote_basis is not null)
  ),
  constraint matches_shortlist_fields_check check (
    stage not in ('shortlisted', 'selected')
    or (
      shortlisted_at is not null
      and nullif(btrim(recommendation_summary), '') is not null
      and nullif(btrim(fit_rationale), '') is not null
    )
  ),
  constraint matches_renewal_terms_check check (
    renewal_fee_applies = 'no'
    or (
      agreed_renewal_fee_cents is not null
      and nullif(btrim(renewal_trigger_terms), '') is not null
    )
  ),
  constraint matches_renewal_less_than_intro_check check (
    agreed_renewal_fee_cents is null
    or agreed_introduction_fee_cents is null
    or agreed_renewal_fee_cents < agreed_introduction_fee_cents
  )
);

create unique index matches_need_vendor_uidx
  on concierge_ops.matches (need_id, vendor_id)
  where archived_at is null;
create unique index matches_project_vendor_link_uidx
  on concierge_ops.matches (project_vendor_link_id)
  where project_vendor_link_id is not null;
create unique index matches_snapshot_uidx
  on concierge_ops.matches (match_snapshot_id)
  where match_snapshot_id is not null;
create index matches_need_idx on concierge_ops.matches (need_id);
create index matches_vendor_idx on concierge_ops.matches (vendor_id);
create index matches_source_activity_idx on concierge_ops.matches (originating_sourcing_activity_id);
create index matches_fee_approved_by_idx on concierge_ops.matches (fee_approved_by);
create index matches_stage_idx
  on concierge_ops.matches (stage, updated_at desc)
  where archived_at is null;

alter table concierge_ops.needs
  add constraint needs_selected_match_fkey
  foreign key (selected_match_id) references concierge_ops.matches(id) on delete set null;

create unique index needs_selected_match_uidx
  on concierge_ops.needs (selected_match_id)
  where selected_match_id is not null;

-- ---------------------------------------------------------------------------
-- Table 7: Vetting Checks
-- ---------------------------------------------------------------------------

create table concierge_ops.vetting_checks (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references concierge_ops.vendors(id) on delete restrict,
  match_id uuid references concierge_ops.matches(id) on delete restrict,
  check_type text not null check (check_type in (
    'business_identity_or_registration', 'insurance', 'license_or_certification',
    'references', 'portfolio_or_work_samples', 'church_or_ministry_experience',
    'reputation_or_public_record', 'faith_alignment', 'data_security_or_privacy',
    'financial_or_legal_standing', 'safety_or_background_requirement',
    'category_specific_technical_check', 'other'
  )),
  review_status text not null default 'not_started' check (review_status in (
    'not_started', 'in_progress', 'complete'
  )),
  outcome text check (outcome in ('passed', 'concern', 'failed', 'not_applicable')),
  requested_on date,
  completed_on date,
  expires_on date,
  reviewer_id uuid references public.profiles(id) on delete set null,
  evidence_method text not null check (evidence_method in (
    'public_registry', 'document_reviewed', 'reference_call', 'interview',
    'portfolio', 'public_research', 'other'
  )),
  evidence_source text,
  evidence_reference text,
  evidence_summary text,
  concern_exception_notes text,
  follow_up_on date,
  authoritative_registry_verified boolean not null default false,
  registry_verification_on date,
  vendor_reference_check_id uuid references public.vendor_reference_checks(id) on delete set null,
  vendor_verification_id uuid references public.vendor_verifications(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint vetting_completion_check check (
    review_status <> 'complete'
    or (
      outcome is not null
      and completed_on is not null
      and reviewer_id is not null
      and nullif(btrim(evidence_summary), '') is not null
    )
  ),
  constraint vetting_concern_notes_check check (
    outcome not in ('concern', 'failed', 'not_applicable')
    or nullif(btrim(concern_exception_notes), '') is not null
  ),
  constraint vetting_registry_check check (
    not authoritative_registry_verified or registry_verification_on is not null
  )
);

create index vetting_vendor_idx on concierge_ops.vetting_checks (vendor_id);
create index vetting_match_idx on concierge_ops.vetting_checks (match_id);
create index vetting_reviewer_idx on concierge_ops.vetting_checks (reviewer_id);
create index vetting_reference_check_idx on concierge_ops.vetting_checks (vendor_reference_check_id);
create index vetting_verification_idx on concierge_ops.vetting_checks (vendor_verification_id);
create index vetting_status_expiry_idx
  on concierge_ops.vetting_checks (review_status, expires_on)
  where archived_at is null;

-- ---------------------------------------------------------------------------
-- Table 8: Engagements
-- ---------------------------------------------------------------------------

create table concierge_ops.engagements (
  id uuid primary key default gen_random_uuid(),
  selected_match_id uuid not null unique references concierge_ops.matches(id) on delete restrict,
  status text not null default 'preparing' check (status in (
    'preparing', 'active', 'at_risk', 'completed', 'closed', 'cancelled'
  )),
  agreement_selection_on date not null,
  planned_start_on date,
  planned_completion_on date,
  actual_start_on date,
  actual_completion_on date,
  agreed_project_service_value_cents bigint check (
    agreed_project_service_value_cents is null or agreed_project_service_value_cents >= 0
  ),
  value_basis text check (value_basis in (
    'total_project', 'monthly', 'annual', 'hourly', 'per_event', 'other'
  )),
  issue_escalation_summary text,
  proof_disqualifier text not null default 'none' check (proof_disqualifier in (
    'none', 'unresolved_material_complaint', 'vendor_failure_refund',
    'fraud_or_misrepresentation', 'safety_issue', 'other'
  )),
  proof_disqualifier_resolved_on date,
  outcome_review_status text not null default 'not_due' check (outcome_review_status in (
    'not_due', 'due', 'in_progress', 'complete', 'unable_to_complete'
  )),
  outcome_review_on date,
  outcome_assessment text check (outcome_assessment in (
    'excellent', 'successful', 'mixed', 'unsuccessful'
  )),
  organization_satisfaction smallint check (organization_satisfaction between 1 and 5),
  vendor_performance smallint check (vendor_performance between 1 and 5),
  would_recommend_again text check (would_recommend_again in (
    'yes', 'with_conditions', 'no', 'insufficient_evidence'
  )),
  outcome_summary text,
  lessons_learned text,
  introduction_fee_triggered_on date,
  introduction_invoice_status text not null default 'not_invoiced' check (
    introduction_invoice_status in (
      'not_invoiced', 'invoiced', 'partially_paid', 'paid', 'written_off', 'not_applicable'
    )
  ),
  introduction_invoice_on date,
  introduction_amount_invoiced_cents bigint not null default 0 check (
    introduction_amount_invoiced_cents >= 0
  ),
  introduction_gross_collected_cents bigint not null default 0 check (
    introduction_gross_collected_cents >= 0
  ),
  introduction_refunds_credits_cents bigint not null default 0 check (
    introduction_refunds_credits_cents >= 0
  ),
  introduction_taxes_collected_cents bigint not null default 0 check (
    introduction_taxes_collected_cents >= 0
  ),
  introduction_net_collected_cents bigint generated always as (
    greatest(
      0::bigint,
      introduction_gross_collected_cents
      - introduction_refunds_credits_cents
      - introduction_taxes_collected_cents
    )
  ) stored,
  introduction_latest_collection_on date,
  recurring_confirmation_status text not null default 'pending_check_in' check (
    recurring_confirmation_status in (
      'not_applicable', 'pending_check_in', 'confirmed_ongoing',
      'ended_or_not_ongoing', 'waived'
    )
  ),
  recurring_confirmed_on date,
  renewal_fee_triggered_on date,
  renewal_invoice_status text not null default 'not_invoiced' check (
    renewal_invoice_status in (
      'not_invoiced', 'invoiced', 'partially_paid', 'paid', 'written_off', 'not_applicable'
    )
  ),
  renewal_invoice_on date,
  renewal_amount_invoiced_cents bigint not null default 0 check (
    renewal_amount_invoiced_cents >= 0
  ),
  renewal_gross_collected_cents bigint not null default 0 check (
    renewal_gross_collected_cents >= 0
  ),
  renewal_refunds_credits_cents bigint not null default 0 check (
    renewal_refunds_credits_cents >= 0
  ),
  renewal_taxes_collected_cents bigint not null default 0 check (
    renewal_taxes_collected_cents >= 0
  ),
  renewal_net_collected_cents bigint generated always as (
    greatest(
      0::bigint,
      renewal_gross_collected_cents
      - renewal_refunds_credits_cents
      - renewal_taxes_collected_cents
    )
  ) stored,
  renewal_latest_collection_on date,
  give_back_rate_basis_points integer not null default 1000 check (
    give_back_rate_basis_points between 0 and 10000
  ),
  total_net_fees_collected_cents bigint generated always as (
    greatest(
      0::bigint,
      introduction_gross_collected_cents
      - introduction_refunds_credits_cents
      - introduction_taxes_collected_cents
    )
    + greatest(
      0::bigint,
      renewal_gross_collected_cents
      - renewal_refunds_credits_cents
      - renewal_taxes_collected_cents
    )
  ) stored,
  give_back_eligible_cents bigint generated always as (
    round(
      (
        greatest(
          0::bigint,
          introduction_gross_collected_cents
          - introduction_refunds_credits_cents
          - introduction_taxes_collected_cents
        )
        + greatest(
          0::bigint,
          renewal_gross_collected_cents
          - renewal_refunds_credits_cents
          - renewal_taxes_collected_cents
        )
      )::numeric * give_back_rate_basis_points::numeric / 10000::numeric
    )::bigint
  ) stored,
  give_back_recipient_type text check (give_back_recipient_type in (
    'buyer_organization', 'selected_ministry_or_cause'
  )),
  give_back_recipient text,
  recipient_verification_status text not null default 'not_started' check (
    recipient_verification_status in (
      'not_started', 'pending', 'verified', 'not_eligible', 'waived'
    )
  ),
  give_back_status text not null default 'not_eligible_no_collection' check (
    give_back_status in (
      'not_eligible_no_collection', 'awaiting_recipient', 'ready',
      'paid', 'held_or_issue', 'not_applicable_no_revenue'
    )
  ),
  actual_give_back_cents bigint not null default 0 check (actual_give_back_cents >= 0),
  give_back_paid_on date,
  payment_reference text,
  acknowledgment_received_on date,
  hire_confirmation_id uuid references public.hire_confirmations(id) on delete set null,
  payment_plan_id uuid references public.project_payment_plans(id) on delete set null,
  vendor_vetting_decision_at_selection text not null check (
    vendor_vetting_decision_at_selection in ('approved', 'approved_with_conditions')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint engagements_value_amount_requires_basis_check check (
    agreed_project_service_value_cents is null or value_basis is not null
  ),
  constraint engagements_outcome_review_check check (
    outcome_review_status <> 'complete'
    or (
      outcome_review_on is not null
      and outcome_assessment is not null
      and would_recommend_again is not null
      and nullif(btrim(outcome_summary), '') is not null
    )
  ),
  constraint engagements_proof_issue_summary_check check (
    proof_disqualifier = 'none' or nullif(btrim(issue_escalation_summary), '') is not null
  ),
  constraint engagements_intro_invoice_check check (
    introduction_invoice_status not in ('invoiced', 'partially_paid', 'paid')
    or (introduction_invoice_on is not null and introduction_amount_invoiced_cents > 0)
  ),
  constraint engagements_intro_collection_check check (
    introduction_invoice_status not in ('partially_paid', 'paid')
    or (
      introduction_gross_collected_cents > 0
      and introduction_latest_collection_on is not null
    )
  ),
  constraint engagements_intro_collection_not_over_invoiced_check check (
    introduction_gross_collected_cents <= introduction_amount_invoiced_cents
  ),
  constraint engagements_recurring_confirmation_check check (
    recurring_confirmation_status <> 'confirmed_ongoing'
    or recurring_confirmed_on is not null
  ),
  constraint engagements_renewal_trigger_check check (
    renewal_fee_triggered_on is null
    or recurring_confirmation_status = 'confirmed_ongoing'
  ),
  constraint engagements_renewal_invoice_check check (
    renewal_invoice_status not in ('invoiced', 'partially_paid', 'paid')
    or (
      renewal_fee_triggered_on is not null
      and renewal_invoice_on is not null
      and renewal_amount_invoiced_cents > 0
    )
  ),
  constraint engagements_renewal_collection_check check (
    renewal_invoice_status not in ('partially_paid', 'paid')
    or (renewal_gross_collected_cents > 0 and renewal_latest_collection_on is not null)
  ),
  constraint engagements_renewal_collection_not_over_invoiced_check check (
    renewal_gross_collected_cents <= renewal_amount_invoiced_cents
  ),
  constraint engagements_give_back_cap_check check (
    actual_give_back_cents <= round(
      (
        greatest(
          0::bigint,
          introduction_gross_collected_cents
          - introduction_refunds_credits_cents
          - introduction_taxes_collected_cents
        )
        + greatest(
          0::bigint,
          renewal_gross_collected_cents
          - renewal_refunds_credits_cents
          - renewal_taxes_collected_cents
        )
      )::numeric * give_back_rate_basis_points::numeric / 10000::numeric
    )::bigint
  ),
  constraint engagements_give_back_paid_check check (
    give_back_status <> 'paid'
    or (
      actual_give_back_cents > 0
      and give_back_paid_on is not null
      and nullif(btrim(payment_reference), '') is not null
      and recipient_verification_status = 'verified'
    )
  )
);

create unique index engagements_hire_confirmation_uidx
  on concierge_ops.engagements (hire_confirmation_id)
  where hire_confirmation_id is not null;
create unique index engagements_payment_plan_uidx
  on concierge_ops.engagements (payment_plan_id)
  where payment_plan_id is not null;
create index engagements_status_idx
  on concierge_ops.engagements (status, updated_at desc)
  where archived_at is null;
create index engagements_outcome_queue_idx
  on concierge_ops.engagements (outcome_review_status, planned_completion_on)
  where archived_at is null;
create index engagements_give_back_queue_idx
  on concierge_ops.engagements (give_back_status, updated_at)
  where archived_at is null;

alter table concierge_ops.needs
  add constraint needs_originating_engagement_fkey
  foreign key (originating_engagement_id)
  references concierge_ops.engagements(id) on delete set null;

create index needs_originating_engagement_idx
  on concierge_ops.needs (originating_engagement_id);

-- ---------------------------------------------------------------------------
-- Controlled vocabularies shared by Needs, Vendors, and Organizations
-- ---------------------------------------------------------------------------

create or replace function concierge_ops.service_categories_are_valid(values_to_check text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(values_to_check, '{}'::text[]) <@ array[
    'construction_and_trades',
    'facilities_and_maintenance',
    'av_production_and_worship_technology',
    'it_cybersecurity_and_managed_services',
    'web_software_and_digital',
    'marketing_branding_and_communications',
    'finance_accounting_and_payroll',
    'legal_risk_and_insurance',
    'hr_staffing_and_leadership_search',
    'consulting_strategy_and_operations',
    'events_hospitality_and_travel',
    'products_supplies_and_equipment',
    'other_needs_classification'
  ]::text[];
$$;

revoke all on function concierge_ops.service_categories_are_valid(text[]) from public, anon;

alter table concierge_ops.organizations
  add constraint organizations_service_categories_check
  check (concierge_ops.service_categories_are_valid(recurring_service_categories));

alter table concierge_ops.vendors
  add constraint vendors_service_categories_check
  check (concierge_ops.service_categories_are_valid(service_categories)),
  add constraint vendors_proven_categories_check
  check (concierge_ops.service_categories_are_valid(proven_service_categories));

alter table concierge_ops.needs
  add constraint needs_primary_category_check
  check (concierge_ops.service_categories_are_valid(array[primary_service_category])),
  add constraint needs_secondary_categories_check
  check (concierge_ops.service_categories_are_valid(secondary_service_categories));

-- ---------------------------------------------------------------------------
-- Cross-record integrity triggers
-- ---------------------------------------------------------------------------

create or replace function concierge_ops.enforce_organization_stage()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.lifecycle_stage = 'active'
     and new.relationship_source in ('organization_referral', 'vendor_referral')
     and new.referred_by_organization_id is null
     and new.referred_by_person_id is null then
    raise exception 'Referral-sourced Organization requires a referring Organization or Person';
  end if;

  if new.primary_contact_id is not null and not exists (
    select 1 from concierge_ops.people p
    where p.id = new.primary_contact_id
      and p.organization_id = new.id
      and p.is_primary_contact
      and p.archived_at is null
  ) then
    raise exception 'Organization primary contact must be its active primary Person';
  end if;

  if new.lifecycle_stage = 'active' and (
    new.relationship_owner_id is null
    or (
      nullif(btrim(coalesce(new.city, '')), '') is null
      and new.canonical_domain is null
    )
    or (
      new.primary_contact_id is null
      and nullif(btrim(coalesce(new.relationship_summary, '')), '') is null
    )
    or new.next_follow_up_on is null
  ) then
    raise exception 'Active Organization is missing owner, dedupe location/domain, contact context, or next follow-up';
  end if;
  return new;
end;
$$;

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

create or replace function concierge_ops.enforce_sourcing_stage()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('executed', 'awaiting_results', 'closed') and (
    new.executed_at is null
    or new.platform is null
    or nullif(btrim(coalesce(new.source_name_snapshot, '')), '') is null
  ) then
    raise exception 'Executed Sourcing Activity requires platform, execution time, and source snapshot';
  end if;
  return new;
end;
$$;

create or replace function concierge_ops.enforce_vendor_proof()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  qualifying_count integer;
  supported_category_count integer;
begin
  if new.proof_level in (
    'proven_one_successful_engagement', 'proven_repeat_success'
  ) then
    select count(*), count(*) filter (
      where n.primary_service_category = any(new.proven_service_categories)
    )
    into qualifying_count, supported_category_count
    from concierge_ops.engagements e
    join concierge_ops.matches m on m.id = e.selected_match_id
    join concierge_ops.needs n on n.id = m.need_id
    where m.vendor_id = new.id
      and e.archived_at is null
      and e.status in ('completed', 'closed')
      and e.outcome_review_status = 'complete'
      and e.outcome_assessment in ('excellent', 'successful')
      and e.would_recommend_again in ('yes', 'with_conditions')
      and e.vendor_vetting_decision_at_selection in ('approved', 'approved_with_conditions')
      and e.proof_disqualifier = 'none';

    if new.proof_level = 'proven_one_successful_engagement' and qualifying_count < 1 then
      raise exception 'Proven — One Successful Engagement requires qualifying evidence';
    end if;

    if new.proof_level = 'proven_repeat_success' and qualifying_count < 2 then
      raise exception 'Proven — Repeat Success requires at least two qualifying Engagements';
    end if;

    if supported_category_count < 1 then
      raise exception 'Proven service categories require qualifying category-specific evidence';
    end if;
  end if;
  return new;
end;
$$;

create or replace function concierge_ops.enforce_vendor_relationships()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.primary_contact_id is not null and not exists (
    select 1 from concierge_ops.people p
    where p.id = new.primary_contact_id
      and p.vendor_id = new.id
      and p.is_primary_contact
      and p.archived_at is null
  ) then
    raise exception 'Vendor primary contact must be its active primary Person';
  end if;
  return new;
end;
$$;

create or replace function concierge_ops.validate_need_people()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  missing_count integer;
  wrong_org_count integer;
begin
  if new.requesting_contact_id is not null and not exists (
    select 1
    from concierge_ops.people p
    where p.id = new.requesting_contact_id
      and p.organization_id = new.organization_id
      and p.archived_at is null
  ) then
    raise exception 'Requesting contact must belong to the Need organization';
  end if;

  select count(*) into missing_count
  from unnest(new.decision_maker_ids) person_id
  where not exists (
    select 1 from concierge_ops.people p
    where p.id = person_id and p.archived_at is null
  );

  if missing_count > 0 then
    raise exception 'Every decision maker must reference an active concierge person';
  end if;

  if cardinality(new.decision_maker_ids) <> (
    select count(distinct person_id) from unnest(new.decision_maker_ids) person_id
  ) then
    raise exception 'Decision maker list cannot contain duplicates';
  end if;

  select count(*) into wrong_org_count
  from unnest(new.decision_maker_ids) person_id
  join concierge_ops.people p on p.id = person_id
  where p.organization_id is distinct from new.organization_id;

  if wrong_org_count > 0 then
    raise exception 'Every decision maker must belong to the Need organization';
  end if;

  return new;
end;
$$;

create or replace function concierge_ops.enforce_need_budget_freeze()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.budget_band is distinct from new.budget_band
     or old.budget_band_basis is distinct from new.budget_band_basis then
    if exists (
      select 1 from concierge_ops.matches m
      where m.need_id = old.id and m.introduced_at is not null
    ) then
      raise exception 'Need budget band and basis are frozen after the first introduction';
    end if;
  end if;
  return new;
end;
$$;

create or replace function concierge_ops.enforce_match_integrity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  need_row concierge_ops.needs%rowtype;
  vendor_row concierge_ops.vendors%rowtype;
  source_need_id uuid;
  project_check_blockers integer;
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
$$;

create or replace function concierge_ops.enforce_engagement_integrity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  match_row concierge_ops.matches%rowtype;
  vendor_decision text;
begin
  select * into match_row
  from concierge_ops.matches
  where id = new.selected_match_id;

  if match_row.stage <> 'selected' then
    raise exception 'Engagement requires a selected Match';
  end if;

  select vetting_decision into vendor_decision
  from concierge_ops.vendors
  where id = match_row.vendor_id;

  if tg_op = 'INSERT' then
    if vendor_decision not in ('approved', 'approved_with_conditions') then
      raise exception 'Engagement requires approved Vendor vetting at selection';
    end if;
    new.vendor_vetting_decision_at_selection := vendor_decision;
  elsif new.vendor_vetting_decision_at_selection is distinct from old.vendor_vetting_decision_at_selection then
    raise exception 'Vetting decision snapshot cannot be changed';
  end if;

  if new.introduction_amount_invoiced_cents > 0
     and match_row.agreed_introduction_fee_cents is not null
     and new.introduction_amount_invoiced_cents <> match_row.agreed_introduction_fee_cents then
    raise exception 'Introduction invoice must equal the agreed introduction fee';
  end if;

  if new.renewal_amount_invoiced_cents > 0 then
    if match_row.renewal_fee_applies = 'no' then
      raise exception 'Renewal invoice is not allowed when renewal does not apply';
    end if;
    if match_row.agreed_renewal_fee_cents is null
       or new.renewal_amount_invoiced_cents <> match_row.agreed_renewal_fee_cents then
      raise exception 'Renewal invoice must equal the pre-agreed renewal fee';
    end if;
  end if;

  if new.give_back_status in ('ready', 'paid')
     and new.recipient_verification_status <> 'verified' then
    raise exception 'Give-back cannot be ready or paid before recipient verification';
  end if;

  if new.status = 'active'
     and new.actual_start_on is null
     and new.planned_start_on is null then
    raise exception 'Active Engagement requires a planned or actual start date';
  end if;

  if new.status = 'completed' then
    if exists (
      select 1
      from concierge_ops.needs n
      where n.id = match_row.need_id
        and n.need_type = 'one_time_project'
    ) and new.actual_completion_on is null then
      raise exception 'Completed one-time Engagement requires actual completion date';
    end if;
  end if;

  if new.status = 'closed' then
    if new.outcome_review_status not in ('complete', 'unable_to_complete')
       or (
         new.outcome_review_status = 'unable_to_complete'
         and nullif(btrim(coalesce(new.outcome_summary, '')), '') is null
       )
       or new.introduction_invoice_status not in ('paid', 'written_off', 'not_applicable')
       or new.recurring_confirmation_status = 'pending_check_in'
       or new.renewal_invoice_status not in ('paid', 'written_off', 'not_applicable')
       or new.give_back_status not in (
         'paid', 'held_or_issue', 'not_applicable_no_revenue', 'not_eligible_no_collection'
       )
       or (
         new.give_back_status = 'held_or_issue'
         and nullif(btrim(coalesce(new.issue_escalation_summary, '')), '') is null
       ) then
      raise exception 'Closed Engagement does not satisfy outcome, fee, recurring, or give-back reconciliation gates';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function concierge_ops.validate_need_people() from public, anon;
revoke all on function concierge_ops.enforce_organization_stage() from public, anon;
revoke all on function concierge_ops.enforce_need_stage() from public, anon;
revoke all on function concierge_ops.enforce_sourcing_stage() from public, anon;
revoke all on function concierge_ops.enforce_vendor_proof() from public, anon;
revoke all on function concierge_ops.enforce_vendor_relationships() from public, anon;
revoke all on function concierge_ops.enforce_need_budget_freeze() from public, anon;
revoke all on function concierge_ops.enforce_match_integrity() from public, anon;
revoke all on function concierge_ops.enforce_engagement_integrity() from public, anon;

create trigger needs_validate_people
before insert or update of organization_id, requesting_contact_id, decision_maker_ids
on concierge_ops.needs
for each row execute function concierge_ops.validate_need_people();

create trigger organizations_stage_gate
before insert or update
on concierge_ops.organizations
for each row execute function concierge_ops.enforce_organization_stage();

create trigger vendors_proof_gate
before insert or update of proof_level, proven_service_categories, proof_decision_date, proof_decision_by
on concierge_ops.vendors
for each row execute function concierge_ops.enforce_vendor_proof();

create trigger vendors_relationship_gate
before insert or update of primary_contact_id
on concierge_ops.vendors
for each row execute function concierge_ops.enforce_vendor_relationships();

create trigger needs_stage_gate
before insert or update
on concierge_ops.needs
for each row execute function concierge_ops.enforce_need_stage();

create trigger sourcing_stage_gate
before insert or update
on concierge_ops.sourcing_activities
for each row execute function concierge_ops.enforce_sourcing_stage();

create trigger needs_freeze_budget_after_introduction
before update of budget_band, budget_band_basis
on concierge_ops.needs
for each row execute function concierge_ops.enforce_need_budget_freeze();

create trigger matches_integrity_gate
before insert or update
on concierge_ops.matches
for each row execute function concierge_ops.enforce_match_integrity();

create trigger engagements_integrity_gate
before insert or update
on concierge_ops.engagements
for each row execute function concierge_ops.enforce_engagement_integrity();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations', 'vendors', 'people', 'needs', 'sourcing_activities',
    'matches', 'vetting_checks', 'engagements'
  ] loop
    execute format(
      'create trigger %I before update on concierge_ops.%I '
      || 'for each row execute function concierge_ops.set_updated_at()',
      table_name || '_set_updated_at',
      table_name
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin-only derived views
-- ---------------------------------------------------------------------------

create view concierge_ops.match_fee_terms
with (security_invoker = true)
as
select
  m.id as match_id,
  n.budget_band as need_budget_band,
  case n.budget_band
    when 'under_5000' then 'tier_a'
    when '5000_to_24999' then 'tier_b'
    when '25000_to_99999' then 'tier_c'
    when '100000_or_more' then 'tier_d'
    else 'manual_review'
  end as introduction_fee_tier,
  case n.budget_band
    when 'under_5000' then 25000::bigint
    when '5000_to_24999' then 75000::bigint
    when '25000_to_99999' then 150000::bigint
    else null::bigint
  end as provisional_introduction_fee_cents,
  case n.budget_band
    when 'under_5000' then 12500::bigint
    when '5000_to_24999' then 37500::bigint
    when '25000_to_99999' then 75000::bigint
    else null::bigint
  end as provisional_renewal_fee_cents
from concierge_ops.matches m
join concierge_ops.needs n on n.id = m.need_id;

create view concierge_ops.match_details
with (security_invoker = true)
as
select
  m.*,
  n.organization_id,
  n.need_title,
  n.need_type,
  n.service_frequency,
  ft.need_budget_band,
  ft.introduction_fee_tier,
  ft.provisional_introduction_fee_cents,
  ft.provisional_renewal_fee_cents,
  v.vendor_name,
  v.vetting_decision as current_vendor_vetting_decision,
  o.organization_name
from concierge_ops.matches m
join concierge_ops.needs n on n.id = m.need_id
join concierge_ops.organizations o on o.id = n.organization_id
join concierge_ops.vendors v on v.id = m.vendor_id
join concierge_ops.match_fee_terms ft on ft.match_id = m.id;

create view concierge_ops.engagement_details
with (security_invoker = true)
as
select
  e.*,
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
  (
    e.outcome_review_status = 'complete'
    and e.outcome_assessment in ('excellent', 'successful')
    and e.would_recommend_again in ('yes', 'with_conditions')
    and e.vendor_vetting_decision_at_selection in ('approved', 'approved_with_conditions')
    and e.proof_disqualifier = 'none'
    and e.status in ('completed', 'closed')
  ) as proven_evidence_flag,
  exists (
    select 1 from concierge_ops.needs follow_on
    where follow_on.originating_engagement_id = e.id
      and follow_on.archived_at is null
  ) as repeat_need_generated
from concierge_ops.engagements e
join concierge_ops.matches m on m.id = e.selected_match_id
join concierge_ops.match_details md on md.id = m.id
join concierge_ops.needs n on n.id = m.need_id
join concierge_ops.organizations o on o.id = n.organization_id
join concierge_ops.vendors v on v.id = m.vendor_id;

create view concierge_ops.validation_issues
with (security_invoker = true)
as
select 'referral_source_missing_referrer'::text as issue_code,
       'organizations'::text as entity_table, o.id as entity_id,
       'error'::text as severity,
       'Referral source requires a referring Organization or Person.'::text as detail
from concierge_ops.organizations o
where o.relationship_source in ('organization_referral', 'vendor_referral')
  and o.referred_by_organization_id is null
  and o.referred_by_person_id is null
  and o.archived_at is null
union all
select 'budget_fields_missing', 'needs', n.id, 'error',
       'Budget fields do not support the selected budget status/band.'
from concierge_ops.needs n
where n.archived_at is null and (
  (n.budget_status in ('confirmed', 'working_range') and n.budget_basis is null)
  or (n.budget_status = 'confirmed' and n.budget_maximum_cents is null)
  or (
    n.budget_band <> 'not_disclosed_or_unknown'
    and n.budget_band_basis = 'manual_review'
  )
)
union all
select 'tier_3_not_approved', 'needs', n.id, 'blocker',
       'Tier 3 / regulated Need is not approved.'
from concierge_ops.needs n
where n.risk_tier = 'tier_3_regulated'
  and n.compliance_gate <> 'approved'
  and n.archived_at is null
union all
select 'growth_source_missing_identity', 'sourcing_activities', s.id, 'error',
       'Growth Engine source lacks its source-table identity.'
from concierge_ops.sourcing_activities s
where s.source_system = 'growth_engine_or_supabase'
  and (s.supabase_source_table is null or nullif(btrim(s.supabase_source_id), '') is null)
  and s.archived_at is null
union all
select 'do_not_use_vendor_active_match', 'matches', m.id, 'blocker',
       'Do Not Use Vendor has an active Match.'
from concierge_ops.matches m
join concierge_ops.vendors v on v.id = m.vendor_id
where v.relationship_status = 'do_not_use'
  and m.stage <> 'closed'
  and m.archived_at is null
union all
select 'shortlisted_with_inadequate_vetting', 'matches', m.id, 'blocker',
       'Shortlisted/selected Match lacks current approved Vendor vetting.'
from concierge_ops.matches m
join concierge_ops.vendors v on v.id = m.vendor_id
where m.stage in ('shortlisted', 'selected')
  and v.vetting_decision not in ('approved', 'approved_with_conditions')
  and m.archived_at is null
union all
select 'shortlisted_project_check_blocker', 'matches', m.id, 'blocker',
       'Shortlisted/selected Match has incomplete, adverse, or expired project-specific vetting.'
from concierge_ops.matches m
where m.stage in ('shortlisted', 'selected')
  and exists (
    select 1 from concierge_ops.vetting_checks vc
    where vc.match_id = m.id
      and vc.archived_at is null
      and (
        vc.review_status <> 'complete'
        or vc.outcome in ('concern', 'failed')
        or (vc.expires_on is not null and vc.expires_on < current_date)
      )
  )
  and m.archived_at is null
union all
select 'introduction_before_agreement', 'matches', m.id, 'blocker',
       'Introduction exists without a valid agreement state/reference.'
from concierge_ops.matches m
where m.introduced_at is not null
  and (
    m.placement_agreement_status not in ('accepted_in_writing', 'waived_by_founder')
    or (
      m.placement_agreement_status = 'accepted_in_writing'
      and nullif(btrim(m.placement_agreement_reference), '') is null
    )
  )
  and m.archived_at is null
union all
select 'renewal_terms_missing', 'matches', m.id, 'blocker',
       'Recurring Match lacks pre-agreed renewal amount or trigger terms.'
from concierge_ops.matches m
where m.renewal_fee_applies <> 'no'
  and (m.agreed_renewal_fee_cents is null or nullif(btrim(m.renewal_trigger_terms), '') is null)
  and m.archived_at is null
union all
select 'renewal_without_ongoing_confirmation', 'engagements', e.id, 'blocker',
       'Renewal activity exists without confirmed ongoing service.'
from concierge_ops.engagements e
where (
    e.renewal_fee_triggered_on is not null
    or e.renewal_invoice_status not in ('not_invoiced', 'not_applicable')
    or e.renewal_gross_collected_cents > 0
  )
  and e.recurring_confirmation_status <> 'confirmed_ongoing'
  and e.archived_at is null
union all
select 'selected_match_relationship_mismatch', 'needs', n.id, 'blocker',
       'Selected Match does not belong to this Need or is not selected.'
from concierge_ops.needs n
left join concierge_ops.matches m on m.id = n.selected_match_id
where n.selected_match_id is not null
  and (m.id is null or m.need_id <> n.id or m.stage <> 'selected')
  and n.archived_at is null
union all
select 'paid_invoice_missing_collection', 'engagements', e.id, 'error',
       'Paid invoice lacks collection amount/date.'
from concierge_ops.engagements e
where (
    (
      e.introduction_invoice_status = 'paid'
      and (e.introduction_gross_collected_cents <= 0 or e.introduction_latest_collection_on is null)
    ) or (
      e.renewal_invoice_status = 'paid'
      and (e.renewal_gross_collected_cents <= 0 or e.renewal_latest_collection_on is null)
    )
  )
  and e.archived_at is null
union all
select 'give_back_not_ready', 'engagements', e.id, 'blocker',
       'Give-back is ready/paid without collection and verified recipient.'
from concierge_ops.engagements e
where e.give_back_status in ('ready', 'paid')
  and (
    e.total_net_fees_collected_cents <= 0
    or e.recipient_verification_status <> 'verified'
    or nullif(btrim(e.give_back_recipient), '') is null
  )
  and e.archived_at is null
union all
select 'give_back_exceeds_eligibility', 'engagements', e.id, 'blocker',
       'Actual contractual give-back exceeds eligible amount.'
from concierge_ops.engagements e
where e.actual_give_back_cents > e.give_back_eligible_cents
  and e.archived_at is null
union all
select 'proven_without_qualifying_engagement', 'vendors', v.id, 'error',
       'Proven Vendor lacks a qualifying successful Engagement.'
from concierge_ops.vendors v
where v.proof_level in ('proven_one_successful_engagement', 'proven_repeat_success')
  and not exists (
    select 1 from concierge_ops.engagement_details ed
    where ed.vendor_id = v.id and ed.proven_evidence_flag
  )
  and v.archived_at is null
union all
select 'proven_category_mismatch', 'vendors', v.id, 'error',
       'Proven categories are not supported by a qualifying Engagement category.'
from concierge_ops.vendors v
where v.proof_level in ('proven_one_successful_engagement', 'proven_repeat_success')
  and not exists (
    select 1
    from concierge_ops.engagement_details ed
    join concierge_ops.needs n on n.id = ed.need_id
    where ed.vendor_id = v.id
      and ed.proven_evidence_flag
      and n.primary_service_category = any(v.proven_service_categories)
  )
  and v.archived_at is null
union all
select 'possible_duplicate_organization', 'organizations', o.id, 'warning',
       'Another active Organization has the same normalized name and geography.'
from concierge_ops.organizations o
where o.archived_at is null and exists (
  select 1 from concierge_ops.organizations other
  where other.id <> o.id
    and other.archived_at is null
    and lower(btrim(other.organization_name)) = lower(btrim(o.organization_name))
    and lower(btrim(coalesce(other.city, ''))) = lower(btrim(coalesce(o.city, '')))
    and lower(btrim(coalesce(other.state_region, ''))) = lower(btrim(coalesce(o.state_region, '')))
)
union all
select 'possible_duplicate_vendor', 'vendors', v.id, 'warning',
       'Another active Vendor has the same normalized name and geography.'
from concierge_ops.vendors v
where v.archived_at is null and exists (
  select 1 from concierge_ops.vendors other
  where other.id <> v.id
    and other.archived_at is null
    and lower(btrim(other.vendor_name)) = lower(btrim(v.vendor_name))
    and lower(btrim(coalesce(other.headquarters_city, ''))) = lower(btrim(coalesce(v.headquarters_city, '')))
    and lower(btrim(coalesce(other.headquarters_state_region, ''))) =
        lower(btrim(coalesce(v.headquarters_state_region, '')))
)
union all
select 'sensitive_data_review', 'vetting_checks', vc.id, 'blocker',
       'Vetting text may contain prohibited sensitive data; founder review required.'
from concierge_ops.vetting_checks vc
where concat_ws(' ', vc.evidence_summary, vc.concern_exception_notes) ~* 
  '(social security|ssn|criminal history report|medical record|passport|driver.?s license)'
  and vc.archived_at is null;

-- ---------------------------------------------------------------------------
-- RLS and least-privilege grants
-- ---------------------------------------------------------------------------

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations', 'vendors', 'people', 'needs', 'sourcing_activities',
    'matches', 'vetting_checks', 'engagements'
  ] loop
    execute format('alter table concierge_ops.%I enable row level security', table_name);
    execute format('alter table concierge_ops.%I force row level security', table_name);

    execute format(
      'create policy %I on concierge_ops.%I for select to authenticated '
      || 'using ((select public.kb_is_platform_admin()))',
      table_name || '_platform_admin_select', table_name
    );
    execute format(
      'create policy %I on concierge_ops.%I for insert to authenticated '
      || 'with check ((select public.kb_is_platform_admin()))',
      table_name || '_platform_admin_insert', table_name
    );
    execute format(
      'create policy %I on concierge_ops.%I for update to authenticated '
      || 'using ((select public.kb_is_platform_admin())) '
      || 'with check ((select public.kb_is_platform_admin()))',
      table_name || '_platform_admin_update', table_name
    );
  end loop;
end;
$$;

revoke all on all tables in schema concierge_ops from public, anon, authenticated;
revoke all on all functions in schema concierge_ops from public, anon, authenticated;

grant usage on schema concierge_ops to authenticated, service_role;

grant select, insert, update on
  concierge_ops.organizations,
  concierge_ops.vendors,
  concierge_ops.people,
  concierge_ops.needs,
  concierge_ops.sourcing_activities,
  concierge_ops.matches,
  concierge_ops.vetting_checks,
  concierge_ops.engagements
to authenticated;

grant select on
  concierge_ops.match_fee_terms,
  concierge_ops.match_details,
  concierge_ops.engagement_details,
  concierge_ops.validation_issues
to authenticated;

grant execute on function concierge_ops.normalize_domain(text) to authenticated, service_role;
grant execute on function concierge_ops.service_categories_are_valid(text[]) to authenticated, service_role;

grant all privileges on all tables in schema concierge_ops to service_role;
grant execute on all functions in schema concierge_ops to service_role;

alter default privileges in schema concierge_ops
  revoke all on tables from public, anon, authenticated;
alter default privileges in schema concierge_ops
  revoke all on functions from public, anon, authenticated;

-- Custom schema exposure in the Data API is a reviewed Dashboard/API setting,
-- not silently changed by this migration.

commit;
