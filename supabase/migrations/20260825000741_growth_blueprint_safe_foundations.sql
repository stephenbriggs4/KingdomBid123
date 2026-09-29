-- Remaining Growth Engine blueprint foundations.
-- Phase gates are enforced from real completed projects; no QA record can unlock them.

create table if not exists public.growth_template_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  persona text not null,
  context text not null,
  body text not null,
  approval_status text not null default 'draft' check (approval_status in ('draft','review','approved','retired')),
  approved_at timestamptz,
  approved_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name,persona,context)
);
comment on table public.growth_template_library is 'Human-reviewed draft library. Approved templates are starting points only and are never sent automatically.';

create table if not exists public.vendor_bench_candidates (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  qualifying_project_id uuid not null references public.projects(id) on delete restrict,
  qualification_status text not null default 'pending_human_review' check (qualification_status in ('pending_human_review','qualified','removed')),
  availability_status text not null default 'unknown' check (availability_status in ('unknown','available','unavailable','paused')),
  evidence jsonb not null default '{}'::jsonb,
  reliability_components jsonb not null default '{}'::jsonb,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(vendor_id)
);
comment on table public.vendor_bench_candidates is 'Cohort-gated vendor bench. No opaque reliability score: raw components remain visible and human qualification is required.';

create table if not exists public.project_evidence_library (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  evidence_status text not null default 'draft' check (evidence_status in ('draft','review','approved','retired')),
  consent_status text not null default 'unknown' check (consent_status in ('unknown','requested','granted','declined')),
  problem_summary text,
  selection_reason text,
  outcome_summary text,
  testimonial_text text,
  reusable_channels text[] not null default '{}',
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id)
);
comment on table public.project_evidence_library is 'Permission-aware proof library for completed real projects. Draft evidence is never outward-facing.';

create table if not exists public.vendor_reference_checks (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  reference_label text not null,
  contact_method text,
  status text not null default 'planned' check (status in ('planned','requested','completed','unable_to_verify')),
  summary text,
  permission_to_reuse boolean not null default false,
  checked_at timestamptz,
  checked_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.vendor_reference_checks is 'Admin-only reference-check evidence; absence of a record never implies a vendor was vetted.';

create table if not exists public.growth_partner_attributions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.growth_partners(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  attribution_type text not null check (attribution_type in ('church','vendor','project','introduction')),
  evidence_basis text not null,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz not null default now(),
  check (profile_id is not null or project_id is not null)
);
comment on table public.growth_partner_attributions is 'Evidence-based partner attribution. Rows require a linked profile or project and a stated basis.';

create table if not exists public.growth_time_log (
  id uuid primary key default gen_random_uuid(),
  activity_type text not null check (activity_type in ('community','project_rescue','vendor_recruiting','partner','content','referral','trust_evidence','other')),
  minutes_spent integer not null check (minutes_spent > 0 and minutes_spent <= 1440),
  group_id uuid references public.groups(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  partner_id uuid references public.growth_partners(id) on delete set null,
  outcome_note text,
  logged_for date not null default current_date,
  created_by uuid,
  created_at timestamptz not null default now()
);
comment on table public.growth_time_log is 'Manual founder-time evidence for later time-allocation analysis; no passive tracking.';

create table if not exists public.growth_quick_captures (
  id uuid primary key default gen_random_uuid(),
  capture_type text not null default 'note' check (capture_type in ('note','voice_note_reference','business_card_reference','meeting')),
  raw_note text not null,
  structured_draft jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','processed','discarded')),
  source_context text,
  captured_at timestamptz not null default now(),
  processed_at timestamptz,
  created_by uuid
);
comment on table public.growth_quick_captures is 'Fast manual capture. Voice/card entries are references only; no background recording, OCR, or contact creation occurs.';

create table if not exists public.growth_operating_documents (
  id uuid primary key default gen_random_uuid(),
  module_key text not null unique,
  how_it_works text not null,
  human_guardrail text not null,
  lifecycle_gate text,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists public.growth_compliance_guardrails (
  guardrail_key text primary key,
  rule_text text not null,
  rationale text not null,
  is_permanent boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.growth_partners add column if not exists partner_stage text not null default 'identified';
alter table public.growth_partners add column if not exists frequent_project_categories text[] not null default '{}';
alter table public.growth_partners add column if not exists trusted_vendor_candidates text[] not null default '{}';
alter table public.growth_partners add column if not exists procurement_pain_points text[] not null default '{}';
alter table public.growth_partners add column if not exists pilot_church_candidates text[] not null default '{}';
alter table public.growth_partners add column if not exists verification_objections text[] not null default '{}';
alter table public.growth_partners add column if not exists relationship_notes text;
do $do$ begin
  if not exists(select 1 from pg_constraint where conname='growth_partners_partner_stage_check') then
    alter table public.growth_partners add constraint growth_partners_partner_stage_check check (partner_stage in ('identified','discovery_conversation','pilot_interest','formal_partnership','active'));
  end if;
end $do$;

alter table public.referrals add column if not exists parent_referral_id uuid;
alter table public.referrals add column if not exists source_project_id uuid;
alter table public.referrals add column if not exists ask_type text not null default 'general';
alter table public.referrals add column if not exists ask_status text not null default 'not_started';
alter table public.referrals add column if not exists relationship_notes text;
alter table public.referrals add column if not exists next_review_at timestamptz;
do $do$ begin
  if not exists(select 1 from pg_constraint where conname='referrals_parent_referral_id_fkey') then
    alter table public.referrals add constraint referrals_parent_referral_id_fkey foreign key(parent_referral_id) references public.referrals(id) on delete set null;
  end if;
  if not exists(select 1 from pg_constraint where conname='referrals_source_project_id_fkey') then
    alter table public.referrals add constraint referrals_source_project_id_fkey foreign key(source_project_id) references public.projects(id) on delete set null;
  end if;
  if not exists(select 1 from pg_constraint where conname='referrals_ask_type_check') then
    alter table public.referrals add constraint referrals_ask_type_check check (ask_type in ('general','warm_intro'));
  end if;
  if not exists(select 1 from pg_constraint where conname='referrals_ask_status_check') then
    alter table public.referrals add constraint referrals_ask_status_check check (ask_status in ('not_started','draft_ready','asked','responded','closed'));
  end if;
end $do$;

alter table public.growth_drops add column if not exists planned_for date;
alter table public.growth_drops add column if not exists source_evidence_id uuid;
alter table public.growth_drops add column if not exists variation_key text;
do $do$ begin
  if not exists(select 1 from pg_constraint where conname='growth_drops_source_evidence_id_fkey') then
    alter table public.growth_drops add constraint growth_drops_source_evidence_id_fkey foreign key(source_evidence_id) references public.project_evidence_library(id) on delete set null;
  end if;
end $do$;

-- All new operating records are admin-only.
alter table public.growth_template_library enable row level security;
alter table public.vendor_bench_candidates enable row level security;
alter table public.project_evidence_library enable row level security;
alter table public.vendor_reference_checks enable row level security;
alter table public.growth_partner_attributions enable row level security;
alter table public.growth_time_log enable row level security;
alter table public.growth_quick_captures enable row level security;
alter table public.growth_operating_documents enable row level security;
alter table public.growth_compliance_guardrails enable row level security;

drop policy if exists growth_template_library_admin_all on public.growth_template_library;
create policy growth_template_library_admin_all on public.growth_template_library for all to authenticated using(coalesce(public.kb_is_platform_admin(),false)) with check(coalesce(public.kb_is_platform_admin(),false));
drop policy if exists vendor_bench_candidates_admin_all on public.vendor_bench_candidates;
create policy vendor_bench_candidates_admin_all on public.vendor_bench_candidates for all to authenticated using(coalesce(public.kb_is_platform_admin(),false)) with check(coalesce(public.kb_is_platform_admin(),false));
drop policy if exists project_evidence_library_admin_all on public.project_evidence_library;
create policy project_evidence_library_admin_all on public.project_evidence_library for all to authenticated using(coalesce(public.kb_is_platform_admin(),false)) with check(coalesce(public.kb_is_platform_admin(),false));
drop policy if exists vendor_reference_checks_admin_all on public.vendor_reference_checks;
create policy vendor_reference_checks_admin_all on public.vendor_reference_checks for all to authenticated using(coalesce(public.kb_is_platform_admin(),false)) with check(coalesce(public.kb_is_platform_admin(),false));
drop policy if exists growth_partner_attributions_admin_all on public.growth_partner_attributions;
create policy growth_partner_attributions_admin_all on public.growth_partner_attributions for all to authenticated using(coalesce(public.kb_is_platform_admin(),false)) with check(coalesce(public.kb_is_platform_admin(),false));
drop policy if exists growth_time_log_admin_all on public.growth_time_log;
create policy growth_time_log_admin_all on public.growth_time_log for all to authenticated using(coalesce(public.kb_is_platform_admin(),false)) with check(coalesce(public.kb_is_platform_admin(),false));
drop policy if exists growth_quick_captures_admin_all on public.growth_quick_captures;
create policy growth_quick_captures_admin_all on public.growth_quick_captures for all to authenticated using(coalesce(public.kb_is_platform_admin(),false)) with check(coalesce(public.kb_is_platform_admin(),false));
drop policy if exists growth_operating_documents_admin_all on public.growth_operating_documents;
create policy growth_operating_documents_admin_all on public.growth_operating_documents for all to authenticated using(coalesce(public.kb_is_platform_admin(),false)) with check(coalesce(public.kb_is_platform_admin(),false));
drop policy if exists growth_compliance_guardrails_admin_all on public.growth_compliance_guardrails;
create policy growth_compliance_guardrails_admin_all on public.growth_compliance_guardrails for all to authenticated using(coalesce(public.kb_is_platform_admin(),false)) with check(coalesce(public.kb_is_platform_admin(),false));

revoke all on public.growth_template_library,public.vendor_bench_candidates,public.project_evidence_library,public.vendor_reference_checks,public.growth_partner_attributions,public.growth_time_log,public.growth_quick_captures,public.growth_operating_documents,public.growth_compliance_guardrails from anon;
grant select,insert,update,delete on public.growth_template_library,public.vendor_bench_candidates,public.project_evidence_library,public.vendor_reference_checks,public.growth_partner_attributions,public.growth_time_log,public.growth_quick_captures,public.growth_operating_documents to authenticated,service_role;
grant select on public.growth_compliance_guardrails to authenticated,service_role;

insert into public.growth_compliance_guardrails(guardrail_key,rule_text,rationale) values
('no_automatic_posting','Never post to any group, page, profile, or directory without a human reviewing the exact content and performing the outward action.','Protects account access, platform terms, and trust-first founder communication.'),
('no_automatic_messaging','Never message a church, vendor, partner, group admin, or individual without human review and execution.','External relationships remain human-owned.'),
('no_member_profiling','Never inspect membership lists to infer roles, identities, faith, employment, or buying intent.','FaithBid tracks channels and consensual relationships, not passive profiles of people.'),
('no_mass_personalization','Never turn a personal-sounding template into mass-identical outreach even when individual sends are approved.','Founder-led trust depends on genuinely contextual communication.'),
('no_invented_deadlines','Never infer a response window, follow-up date, or SLA deadline when an explicit field has not been set.','Missing scheduling data must surface as missing rather than become false operational certainty.')
on conflict(guardrail_key) do update set rule_text=excluded.rule_text,rationale=excluded.rationale,updated_at=now();

insert into public.growth_operating_documents(module_key,how_it_works,human_guardrail,lifecycle_gate) values
('community_channels','Track exact channel URLs, access stage, rules evidence, content approval, manual posting, responses, and verified attribution in one channel system.','No member-list analysis, automatic posting, or automatic admin messaging.','Live now; channel effectiveness remains evidence-based.'),
('project_vendor_pipeline','Link vendor activity to real projects, use explicit proposal windows, and surface thin coverage without sending outreach.','Founder-assisted matching stays inside FaithBid; technical and price judgments remain human.','Live now for real projects; QA records are excluded.'),
('automation','Generate internal alerts, explicit-date follow-ups, tracked links, and milestone tasks.','Automation organizes and drafts; it never performs outward communication.','Live only where inputs are explicit.'),
('measurement','Read real cohort milestones, category demand, channel evidence, and manual time logs.','No missing source is silently rendered as zero or success.','Cohort comparisons stay gated until enough real completed projects exist.'),
('founder_efficiency','Use one founder queue, reviewed templates, relationship notes, and manual quick capture.','Templates create drafts, not sends; quick capture never records people passively.','Foundations live; usefulness must be proven in normal operation.'),
('referrals','Track direct and downstream referral relationships plus warm-introduction stages.','No referral request is sent automatically.','Graph foundation live; scaling analysis remains founding-cohort gated.'),
('trust_evidence','Capture consent-aware real-project proof and structured vendor reference checks.','Draft or unconsented evidence is never outward-facing.','Automatic draft capture begins only after five real project completions.'),
('content','Plan human-reviewed channel drafts, variations, tracked links, and reusable proof sources.','No calendar item posts itself and variations must remain genuinely contextual.','Core approval is live; full calendar use waits for proven cadence.'),
('partners','Track fewer, deeper partner relationships and structured discovery insights separately from community groups.','No automatic partner outreach or inferred relationship status.','Foundation live; expansion remains past-founding-cohort work.'),
('data_hygiene','Surface duplicates, missing fields, missing review dates, and lifecycle provenance.','Audits flag; they do not merge or delete records automatically.','Standing control.'),
('risk_compliance','Keep permanent never-automate boundaries visible in product data.','Guardrails require an explicit migration to change.','Standing control.'),
('handoff','Store concise operating notes with each module as it is built.','Delegation cannot broaden outward-action permissions.','Standing control.')
on conflict(module_key) do update set how_it_works=excluded.how_it_works,human_guardrail=excluded.human_guardrail,lifecycle_gate=excluded.lifecycle_gate,updated_at=now();

create or replace function private.kb_seed_cohort_gated_growth_foundations_v0()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
declare v_completed_real bigint;
begin
  if new.record_origin <> 'real' or not (new.completed_at is not null or new.status='completed') then return new; end if;
  select count(*) into v_completed_real from public.projects where record_origin='real' and (completed_at is not null or status='completed');
  if v_completed_real < 5 then return new; end if;

  insert into public.project_evidence_library(project_id,vendor_id)
  values(new.id,new.hired_vendor_id)
  on conflict(project_id) do nothing;

  if new.hired_vendor_id is not null then
    insert into public.vendor_bench_candidates(vendor_id,qualifying_project_id,evidence)
    values(new.hired_vendor_id,new.id,jsonb_build_object('project_title',new.title,'completed_at',new.completed_at,'record_origin',new.record_origin,'gate_completed_real_projects',v_completed_real))
    on conflict(vendor_id) do nothing;
  end if;
  return new;
end;
$function$;

drop trigger if exists kb_cohort_gated_growth_foundations_v0 on public.projects;
create trigger kb_cohort_gated_growth_foundations_v0
after insert or update of status,completed_at,hired_vendor_id on public.projects
for each row execute function private.kb_seed_cohort_gated_growth_foundations_v0();

create or replace function public.kb_admin_get_growth_blueprint_status_v0(p_as_of timestamptz default now())
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_real bigint; v_completed bigint; v_awarded bigint; v_two_proposals bigint;
  v_group_count bigint; v_partner_count bigint; v_referral_count bigint; v_open_tasks bigint;
  v_template_count bigint; v_evidence_count bigint; v_bench_count bigint; v_time_minutes bigint;
  v_channels jsonb; v_categories jsonb; v_hygiene jsonb; v_guardrails jsonb; v_modules jsonb;
begin
  if not coalesce(public.kb_is_platform_admin(),false) then raise exception 'Growth blueprint status requires platform administrator access' using errcode='42501'; end if;

  select count(*),count(*) filter(where completed_at is not null or status='completed'),
    count(*) filter(where hired_vendor_id is not null or hired_at is not null or status in ('hired','in_progress','completed')),
    count(*) filter(where qualified_comparable_proposal_count>=2)
  into v_real,v_completed,v_awarded,v_two_proposals
  from public.projects where record_origin='real';

  select count(*) into v_group_count from public.groups;
  select count(*) into v_partner_count from public.growth_partners;
  select count(*) into v_referral_count from public.referrals;
  select count(*) into v_open_tasks from public.project_milestone_tasks where status='open';
  select count(*) into v_template_count from public.growth_template_library where approval_status<>'retired';
  select count(*) into v_evidence_count from public.project_evidence_library where evidence_status<>'retired';
  select count(*) into v_bench_count from public.vendor_bench_candidates where qualification_status<>'removed';
  select coalesce(sum(minutes_spent),0) into v_time_minutes from public.growth_time_log where logged_for>=p_as_of::date-6;

  select coalesce(jsonb_agg(to_jsonb(h) order by case h.channel_health_status when 'producing' then 0 when 'neutral' then 1 when 'untested' then 2 else 3 end,h.posted_count desc,h.group_id),'[]'::jsonb)
  into v_channels from (select * from public.kb_admin_get_growth_channel_health_v0() limit 50) h;

  select coalesce(jsonb_agg(jsonb_build_object('category',x.category,'real_projects',x.project_count,'two_plus_proposals',x.two_proposals,'awarded',x.awarded,'completed',x.completed) order by x.project_count desc,x.category),'[]'::jsonb)
  into v_categories from (
    select coalesce(nullif(trim(coalesce(primary_category,category)),''),'Unclassified') category,
      count(*) project_count,
      count(*) filter(where qualified_comparable_proposal_count>=2) two_proposals,
      count(*) filter(where hired_vendor_id is not null or hired_at is not null or status in ('hired','in_progress','completed')) awarded,
      count(*) filter(where completed_at is not null or status='completed') completed
    from public.projects where record_origin='real'
    group by 1
  ) x;

  v_hygiene:=jsonb_build_object(
    'groups_missing_rule_review',(select count(*) from public.groups where channel_stage in ('joined','active') and posting_rules_reviewed_at is null),
    'eligible_relationships_missing_review_date',(select count(*) from private.kb_founder_staleness_queue_v0 where review_state='missing_schedule'),
    'partners_missing_structured_stage',(select count(*) from public.growth_partners where partner_stage is null),
    'real_projects_missing_response_window',(select count(*) from public.projects where record_origin='real' and status='open' and proposal_response_window_ends_at is null),
    'vendor_reference_checks_pending',(select count(*) from public.vendor_reference_checks where status in ('planned','requested'))
  );

  select coalesce(jsonb_agg(jsonb_build_object('key',guardrail_key,'rule',rule_text,'rationale',rationale,'permanent',is_permanent) order by guardrail_key),'[]'::jsonb)
  into v_guardrails from public.growth_compliance_guardrails;

  v_modules:=jsonb_build_array(
    jsonb_build_object('module','Community & Channel Tracking','functionality','Built','data_status',case when v_group_count>0 then 'Mixed real and synthetic' else 'No records' end,'lifecycle_proven','No'),
    jsonb_build_object('module','Project-Linked Vendor Pipeline','functionality','Built','data_status',case when v_real>0 then 'Real records' else 'Synthetic only' end,'lifecycle_proven',case when v_completed>0 then 'Yes' else 'No' end),
    jsonb_build_object('module','Automation Layer','functionality','Built','data_status','Mixed real and synthetic','lifecycle_proven','No'),
    jsonb_build_object('module','Measurement & Dashboard','functionality','Built foundation','data_status',case when v_real>0 then 'Real records' else 'No real cohort records' end,'lifecycle_proven',case when v_completed>=5 then 'Yes' else 'No' end),
    jsonb_build_object('module','Founder Efficiency Tools','functionality','Built foundation','data_status','Mixed real and synthetic','lifecycle_proven','No'),
    jsonb_build_object('module','Referral System','functionality','Built foundation','data_status',case when v_referral_count>0 then 'Existing records' else 'No records' end,'lifecycle_proven','No'),
    jsonb_build_object('module','Trust & Evidence Layer','functionality',case when v_completed>=5 then 'Enabled' else 'Cohort gated' end,'data_status',case when v_evidence_count>0 then 'Real records' else 'No records' end,'lifecycle_proven',case when v_completed>=5 then 'No' else 'Not yet eligible' end),
    jsonb_build_object('module','Content System','functionality','Built foundation','data_status','Mixed real and synthetic','lifecycle_proven','No'),
    jsonb_build_object('module','Partner Pipeline','functionality','Built foundation','data_status',case when v_partner_count>0 then 'Existing records' else 'No records' end,'lifecycle_proven','No'),
    jsonb_build_object('module','Data Hygiene','functionality','Built','data_status','Live audit','lifecycle_proven','Not applicable'),
    jsonb_build_object('module','Risk & Compliance','functionality','Built','data_status','Policy records','lifecycle_proven','Not applicable'),
    jsonb_build_object('module','Handoff Readiness','functionality','Built','data_status','Operating notes','lifecycle_proven','Not applicable')
  );

  return jsonb_build_object(
    'as_of',p_as_of,
    'cohort',jsonb_build_object('real_projects',v_real,'two_plus_proposals',v_two_proposals,'awarded',v_awarded,'completed',v_completed,'founding_cohort_target',5,'founding_cohort_complete',v_completed>=5),
    'gates',jsonb_build_object('vendor_bench_enabled',v_completed>=5,'trust_evidence_auto_drafts_enabled',v_completed>=5,'cohort_comparison_enabled',v_completed>=5),
    'counts',jsonb_build_object('groups',v_group_count,'partners',v_partner_count,'referrals',v_referral_count,'open_milestone_tasks',v_open_tasks,'templates',v_template_count,'evidence_records',v_evidence_count,'bench_candidates',v_bench_count,'founder_minutes_last_7_days',v_time_minutes),
    'milestone_ladder',jsonb_build_array(
      jsonb_build_object('stage','Posted','count',v_real),
      jsonb_build_object('stage','2+ proposals','count',v_two_proposals),
      jsonb_build_object('stage','Awarded','count',v_awarded),
      jsonb_build_object('stage','Completed','count',v_completed)
    ),
    'channel_health',v_channels,
    'category_performance',v_categories,
    'data_hygiene',v_hygiene,
    'guardrails',v_guardrails,
    'modules',v_modules,
    'interpretation',case when v_real=0 then 'Waiting for the first real project; QA records are excluded.' when v_completed<5 then 'Founding cohort in progress; scaling modules remain gated.' else 'Founding cohort completion gate reached; review each gated module before activation.' end
  );
end;
$function$;
revoke all on function public.kb_admin_get_growth_blueprint_status_v0(timestamptz) from public,anon;
grant execute on function public.kb_admin_get_growth_blueprint_status_v0(timestamptz) to authenticated,service_role;

create or replace function public.kb_admin_get_growth_weekly_digest_v0(p_as_of timestamptz default now())
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare v_status jsonb; v_brief jsonb;
begin
  if not coalesce(public.kb_is_platform_admin(),false) then raise exception 'Growth digest requires platform administrator access' using errcode='42501'; end if;
  v_status:=public.kb_admin_get_growth_blueprint_status_v0(p_as_of);
  v_brief:=public.kb_admin_get_founder_brief_v0(p_as_of);
  return jsonb_build_object(
    'generated_at',p_as_of,
    'delivery','in_app_only',
    'summary',jsonb_build_object('cohort',v_status->'cohort','counts',v_status->'counts','hygiene',v_status->'data_hygiene'),
    'highest_leverage_action',coalesce((v_brief->'actions')->0,'null'::jsonb),
    'guardrail','This digest organizes evidence and recommends a human action. It never sends outreach, posts content, or changes a project.'
  );
end;
$function$;
revoke all on function public.kb_admin_get_growth_weekly_digest_v0(timestamptz) from public,anon;
grant execute on function public.kb_admin_get_growth_weekly_digest_v0(timestamptz) to authenticated,service_role;
