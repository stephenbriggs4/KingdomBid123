-- Keep unresolved founder, legal, evidence, and real-deal dependencies visible
-- without allowing the application or an agent to silently decide them.

create table if not exists concierge_ops.pilot_governance_decisions (
  decision_key text primary key,
  decision_area text not null,
  decision_title text not null,
  status text not null,
  current_truth text not null,
  next_action text not null,
  source_reference text not null,
  blocks_pilot boolean not null default false,
  display_order integer not null,
  decided_value text,
  decided_at timestamptz,
  decided_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pilot_governance_decisions_key_check
    check (decision_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  constraint pilot_governance_decisions_status_check
    check (status in (
      'complete','founder_decision_required','external_evidence_required',
      'legal_review_required','document_update_required','waiting_for_real_deal'
    )),
  constraint pilot_governance_decisions_decision_check
    check (
      (status = 'complete' and decided_value is not null and decided_at is not null)
      or status <> 'complete'
    )
);

insert into concierge_ops.pilot_governance_decisions (
  decision_key,decision_area,decision_title,status,current_truth,next_action,
  source_reference,blocks_pilot,display_order,decided_value,decided_at
) values
  ('vendor_consent_and_scope','Pilot controls','Vendor consent and excluded-category enforcement','complete','Explicit vendor consideration consent and Dallas category holds are enforced in the app and database.','Monitor during every real intake; do not weaken the gates.','Strategy memo §5; implemented baseline',false,10,'Enforced in application and database',clock_timestamp()),
  ('facebook_membership_and_relevance','Growth Engine','Facebook membership and relevance audit','complete','97 joined and 3 pending Facebook groups exactly match Supabase; all 97 joined groups have rationale and priority.','Deepen the four verified DFW pilot channels; do not expand breadth by default.','Strategy memo actions 5–6',false,20,'Exact membership reconciliation completed',clock_timestamp()),
  ('service_taxonomy_and_budget','Transition','Service taxonomy and budget translation','complete','Marketplace and Concierge share one taxonomy. Six narrow Marketplace bands translate; $25,000+ requires church confirmation.','Use the canonical taxonomy and never infer a Concierge fee band from a broad Marketplace range.','Strategy memo §5 and action 14; UX blueprint §7',false,30,'Canonical taxonomy and deterministic translation enforced',clock_timestamp()),
  ('demand_deduplication','Demand','De-duplicate church and vendor demand','complete','23 church rows reconcile to 16 unique prospects; 18 vendor rows reconcile to 12 unique vendors. Research leads remain separate from bench vendors.','Re-run the founder-only summary whenever signup or Growth data changes.','Strategy memo action 3',false,40,'Founder-only conservative reconciliation live',clock_timestamp()),
  ('version_control_baseline','Operations','Maintain one recoverable application baseline','complete','The cumulative app and migrations are under Git version control with verified checkpoints.','Commit only after tests, database checks, and browser verification pass.','Strategy memo actions 12–13',false,50,'Single Codex-owned Git baseline established',clock_timestamp()),
  ('founding_five_commitments','Pilot evidence','Confirm five founding churches as commitments','external_evidence_required','There are currently zero active Concierge organizations explicitly marked as Dallas Pilot commitments. Targets and waitlist rows are not commitments.','Stephen confirms each church commitment from direct relationship evidence; then enter it in Concierge.','Strategy memo action 4',true,60,null,null),
  ('pricing_and_promises_policy','Pricing','Reconciled pricing-and-promises policy','founder_decision_required','Concierge uses church-declared fee bands; Marketplace uses a transaction percentage. No approved transition promise exists.','Stephen chooses the cross-phase promise before the first placement agreement is signed, then counsel reviews the agreement language.','Strategy memo actions 1–2 and §8',true,70,null,null),
  ('bidding_principle','Product policy','Permanent bidding principle','founder_decision_required','Concierge promises no bidding war; Marketplace bidding is currently disabled but remains a configuration switch.','Stephen decides whether no bidding is a permanent FaithBid principle and records the decision.','Strategy memo §8',true,80,null,null),
  ('give_back_reconciliation','Pricing and legal','Give-back reconciliation and founding-church true-up','legal_review_required','Concierge describes 10% of collected fees; Marketplace policy encodes 25% of net retained platform fees. Legal characterization is unresolved.','Stephen selects the intended reconciliation, then counsel reviews tax, rebate, referral-fee, and charitable implications before it is promised.','Strategy memo §5, §8, and action 11',true,90,null,null),
  ('founding_vendor_true_up','Pricing','Founding-vendor transition treatment','founder_decision_required','Concierge placement pricing may exceed later Marketplace fees for comparable work. No approved true-up exists.','Choose a credit, first-marketplace-placement waiver, or another concrete founding-vendor benefit before the first placement agreement.','Strategy memo §8',true,100,null,null),
  ('faith_alignment_legal_review','Legal','Productized faith-alignment review','legal_review_required','A human honoring a private preference and a platform filtering businesses by religion are different legal objects.','Counsel reviews the platform feature separately from the placement agreement.','Strategy memo §5 and action 11',true,110,null,null),
  ('platform_liability_review','Legal','Platform liability posture','legal_review_required','The pilot uses a personal vet-and-introduce model; the Marketplace requires platform-grade terms and disclaimers.','Counsel reviews the productized liability boundary before Marketplace launch.','Strategy memo §5 and action 11',false,120,null,null),
  ('failure_recovery_and_kill_criteria','Pilot operations','Failure recovery and kill criteria','document_update_required','The locked playbook does not yet contain an approved failure-recovery section or kill criteria.','Stephen approves the criteria before they are added as a new version of the playbook; do not edit the locked baseline silently.','Strategy memo action 8',true,130,null,null),
  ('first_real_closed_loop','Pilot execution','First real church-to-close loop','waiting_for_real_deal','The archived synthetic TEST flow proves system mechanics, not market demand or delivery success.','After the first church commitment, run one real need through selection, launch, delivery, outcome, fee, give-back, close, and archive.','Strategy memo action 7',true,140,null,null),
  ('growth_time_log_start','Pilot measurement','Start growth-time logging','waiting_for_real_deal','No real deal has begun, so no real-deal time log should be fabricated.','Start growth_time_log at the first real church action and record actual founder time only.','Strategy memo action 9',false,150,null,null),
  ('get_plugged_in_role','Portfolio strategy','Define Get Plugged In role','founder_decision_required','Get Plugged In is visible in the product, but its relationship to the Dallas pilot is not formally decided.','Stephen chooses church-acquisition wedge, separate product, or parked; then update navigation and metrics to match.','Strategy memo action 10',false,160,null,null)
on conflict (decision_key) do update set
  decision_area=excluded.decision_area,
  decision_title=excluded.decision_title,
  current_truth=excluded.current_truth,
  next_action=excluded.next_action,
  source_reference=excluded.source_reference,
  blocks_pilot=excluded.blocks_pilot,
  display_order=excluded.display_order,
  updated_at=clock_timestamp();

alter table concierge_ops.pilot_governance_decisions enable row level security;

drop policy if exists pilot_governance_decisions_admin_select on concierge_ops.pilot_governance_decisions;
create policy pilot_governance_decisions_admin_select
on concierge_ops.pilot_governance_decisions for select to authenticated
using ((select public.kb_is_platform_admin()));

drop policy if exists pilot_governance_decisions_admin_update on concierge_ops.pilot_governance_decisions;
create policy pilot_governance_decisions_admin_update
on concierge_ops.pilot_governance_decisions for update to authenticated
using ((select public.kb_is_platform_admin()))
with check ((select public.kb_is_platform_admin()));

revoke all on table concierge_ops.pilot_governance_decisions from public, anon, authenticated;
grant select, update on table concierge_ops.pilot_governance_decisions to authenticated;
