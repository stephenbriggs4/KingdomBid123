begin;

alter table public.groups
  add column if not exists posting_rule_basis text not null default 'unknown',
  add column if not exists posting_rule_finding text,
  add column if not exists posting_rules_reviewed_at date,
  add column if not exists allowed_posting_behavior text,
  add column if not exists strategic_fit_score smallint,
  add column if not exists fit_rationale text,
  add column if not exists growth_priority_tier text,
  add column if not exists admin_relationship_status text not null default 'unknown',
  add column if not exists growth_next_action text;

alter table public.groups drop constraint if exists groups_posting_rule_basis_check;
alter table public.groups add constraint groups_posting_rule_basis_check
  check (posting_rule_basis in ('confirmed','inferred','unknown'));

alter table public.groups drop constraint if exists groups_strategic_fit_score_check;
alter table public.groups add constraint groups_strategic_fit_score_check
  check (strategic_fit_score is null or strategic_fit_score between 1 and 5);

alter table public.groups drop constraint if exists groups_growth_priority_tier_check;
alter table public.groups add constraint groups_growth_priority_tier_check
  check (growth_priority_tier is null or growth_priority_tier in ('A','B','C'));

alter table public.groups drop constraint if exists groups_admin_relationship_status_check;
alter table public.groups add constraint groups_admin_relationship_status_check
  check (admin_relationship_status in ('unknown','no_relationship','passive','active'));

comment on column public.groups.posting_rule_basis is
  'Evidence strength for FaithBid-specific posting behavior: confirmed requires a published rule addressing promotion, external businesses, self-promotion, selling, links, or admin approval.';
comment on column public.groups.posting_rule_finding is
  'Group-level posting-rule finding. This is separate from strategic fit.';
comment on column public.groups.admin_relationship_status is
  'Relationship evidence from existing records or founder-provided information only. Unknown is the required default when not investigated.';

with audit_values(
  id, posting_rule_basis, posting_rule_finding, allowed_posting_behavior,
  strategic_fit_score, fit_rationale, growth_priority_tier, growth_next_action
) as (
  values
  ('2ee844cf-094e-46da-930a-a76d96837eb9'::uuid, 'inferred', 'Only a generic kindness rule was surfaced; promotional-link permission was not established.', 'Ministry-relevant, value-first content only until promotional-link permission is confirmed.', 5::smallint, 'Direct ministry audience and strong church/ministry use-case relevance.', 'A', 'Check pinned/admin guidance; prepare a ministry-use-case draft only if links are permitted.'),
  ('db3293e5-85dd-4299-924b-a3171d658e5c'::uuid, 'inferred', 'No published promotional rule surfaced.', 'Value-first Christian-business discussion only until promotional-link permission is confirmed.', 4::smallint, 'Strong Christian-business audience with plausible vendor and connector reach.', 'A', 'Verify guidance; draft a church-project education post if allowed.'),
  ('a3a4cfc3-3358-4cd5-b3bf-f5e0a732a14c'::uuid, 'confirmed', 'Short, original, on-topic content is allowed; free value must be identified; non-free promotion requires admin approval.', 'Short, original, on-topic content; identify the free value. Do not promote paid or non-free activity without admin approval.', 5::smallint, 'Excellent overlap with faith-led founders and prospective marketplace vendors.', 'A', 'Confirm the permitted advertising day; then draft a free church-project education post.'),
  ('27b4a37b-f27b-4e90-841c-f0dce44c2671'::uuid, 'confirmed', 'Promotion is conditional on registration and permitted days; donation or fundraising framing is barred.', 'Conditional promotion after registration and only on the permitted day; no donation or fundraising framing.', 5::smallint, 'Strong faith-entrepreneur audience with explicit, usable promotional pathways.', 'A', 'Confirm the promotion day and registration requirement; then draft a church/ministry project post.'),
  ('d9700f4a-914e-4336-b215-5d1d8e46cad9'::uuid, 'confirmed', 'Christian-business content is required and self-promotion is censored; testimonies are welcomed.', 'Educational Christian-business content or a permissioned testimony; no self-promotional FaithBid pitch.', 4::smallint, 'Relevant faith-business audience, best suited to permissioned proof rather than direct acquisition.', 'A', 'Wait for a real permissioned project story, then prepare a proof-led concept.'),
  ('21371240-b3b2-4ee1-8d02-2b924086b6fb'::uuid, 'inferred', 'No published promotional rule surfaced.', 'Value-first faith-and-business content until promotional-link permission is confirmed.', 5::smallint, 'Strong faith-and-entrepreneurship alignment for founder education and vendor discovery.', 'A', 'Verify guidance; then draft a founder-story or church-project education post.'),
  ('7315cc0f-f1d7-406a-badf-a901c9580fce'::uuid, 'inferred', 'No published promotional rule surfaced.', 'Neighborhood-relevant, non-commercial value only; no FaithBid promotion without admin approval.', 3::smallint, 'Local Dallas relevance, but broad neighborhood intent makes commercial fit conditional.', 'B', 'Ask whether a local ministry/service-resource post would be permitted before drafting.'),
  ('b80b007c-8b2c-4aee-a44d-ddf264a164b2'::uuid, 'confirmed', 'Marketing or AI companies and spam or selling are restricted.', 'Non-promotional discussion only; no pitching, selling, or marketing/AI framing.', 4::smallint, 'Relevant Christian-business audience, but direct product positioning conflicts with current rules.', 'B', 'Use for genuine discussion; obtain approval before any FaithBid link.'),
  ('33ef1d4b-452f-4270-8a6e-ae7ad016bdce'::uuid, 'confirmed', 'Promotions and spam are prohibited.', 'No direct promotion; value-only discussion without links unless approved.', 3::smallint, 'Audience alignment exists, but the channel is relationship/value only under current rules.', 'B', 'Keep as a listening/value channel.'),
  ('fa13b9f1-30e5-41e3-8b50-696f251105d9'::uuid, 'confirmed', 'Promotions and spam are prohibited.', 'No direct promotion; educational discussion without links unless approved.', 3::smallint, 'Relevant business audience, but acquisition use is constrained.', 'B', 'Retain as a relationship/value channel.'),
  ('94fdc00d-abf4-4990-a34d-c81e2401f7cf'::uuid, 'confirmed', 'Promotions and spam are prohibited.', 'No direct promotion; useful Christian-business discussion only.', 4::smallint, 'Strong potential vendor audience, usable mainly for non-promotional contribution.', 'B', 'Seek approval before any link or product mention.'),
  ('c6e237e8-8bb7-4c75-a589-179e5432d275'::uuid, 'inferred', 'Generic anti-spam, chain-post, and post-hijacking rules surfaced; promotional links were not specifically addressed.', 'Original value-first content may fit; no promotional link until permission is confirmed.', 4::smallint, 'Good small-business vendor relevance, subject to confirming promotional permission.', 'B', 'Verify guidance; draft a small-business problem/solution post if allowed.'),
  ('68b792eb-c484-4e0e-af03-0f0b9a2b4797'::uuid, 'inferred', 'No published promotional rule surfaced.', 'Leadership-oriented educational content until promotional-link permission is confirmed.', 4::smallint, 'Strong trust, leadership, and decision-maker thematic fit.', 'B', 'Verify guidance; draft a trust-and-procurement leadership post if allowed.'),
  ('c4c61898-562a-4430-a7e9-17ae69820dcd'::uuid, 'confirmed', 'Promotions and spam are prohibited.', 'No direct promotion; non-promotional value discussion only unless approved.', 3::smallint, 'Relevant early-stage vendor audience, but direct acquisition is barred.', 'B', 'Retain for listening and relationship value.'),
  ('2976220b-f1fb-4a23-a4a2-6a44a8029f79'::uuid, 'confirmed', 'Promotions and spam are prohibited.', 'No FaithBid promotion; organic prayer or worship participation only unless an admin approves a resource post.', 2::smallint, 'Mission-adjacent community reach, but weak marketplace-acquisition fit.', 'C', 'Deprioritize for acquisition; retain as community reach.'),
  ('c4688909-a633-4039-a3b3-ce5b6b7139a5'::uuid, 'inferred', 'No published promotional rule surfaced.', 'Broad business education only if permitted; no FaithBid link until rules are confirmed.', 2::smallint, 'Broad business reach with limited faith/ministry specificity.', 'C', 'Revisit only when a specific vendor-category gap justifies it.')
)
update public.groups g
set posting_rule_basis = a.posting_rule_basis,
    posting_rule_finding = a.posting_rule_finding,
    posting_rules_reviewed_at = date '2026-08-24',
    allowed_posting_behavior = a.allowed_posting_behavior,
    strategic_fit_score = a.strategic_fit_score,
    fit_rationale = a.fit_rationale,
    growth_priority_tier = a.growth_priority_tier,
    admin_relationship_status = 'unknown',
    growth_next_action = a.growth_next_action
from audit_values a
where g.id = a.id;

commit;
