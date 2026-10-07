import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = relative => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const migration = read('supabase/migrations/20261007174554_church_intelligence_completion_and_signals.sql');
const serviceAuth = read('supabase/migrations/20261007192206_church_intelligence_signal_worker_service_auth.sql');
const decisions = read('supabase/migrations/20261007192632_church_intelligence_evidence_independence_decisions.sql');
const component = read('src/ChurchIntelligence.jsx');
const worker = read('supabase/functions/church-website-signal-worker/index.ts');

test('admin reads are paginated, purpose scoped, and directly platform-admin gated', () => {
  for (const name of ['ci_list_organizations_overview_page', 'ci_get_organization_profile', 'ci_get_health_summary', 'ci_list_operational_signals']) {
    const start = migration.indexOf(`function public.${name}`);
    assert.ok(start >= 0, `${name} exists`);
    const next = migration.indexOf('create function public.', start + 20);
    const rpc = migration.slice(start, next < 0 ? undefined : next);
    assert.match(rpc, /church_intel\.platform_admin_actor\(\)/);
    assert.doesNotMatch(rpc, /church_intel\.assert_admin\(\)/);
  }
  assert.match(migration, /p_offset integer default 0/);
  assert.match(component, /do \{[\s\S]*p_offset: offset[\s\S]*\} while \(offset < total\)/);
  assert.match(component, /As of:/);
});

test('readiness and profile provenance use the roadmap truth contract', () => {
  assert.match(migration, /address_line_1 is not null and b\.denomination is not null and b\.dallas_membership='included' and b\.open_review_case_count=0/);
  assert.match(component, /Evidence & provenance/);
  assert.match(component, /source\?\.display_name/);
  assert.match(component, /Evidence observed/);
  assert.match(component, /Sites & boundary membership/);
  assert.match(component, /Review history/);
});

test('website signals are separate, source-linked, and human reviewed', () => {
  assert.match(migration, /create table church_intel\.operational_signals/);
  assert.match(migration, /'new','reviewed','dismissed','handed_to_growth'/);
  assert.match(migration, /source_content_hash/);
  assert.match(component, /Human review required/);
  assert.match(component, /Nothing is sent to Growth Engine automatically/);
  assert.match(component, /Verify on church website/);
  assert.match(component, /ci_review_operational_signal/);
});

test('website worker is bounded, robots-aware, hash-skipping, and uses a strict LLM schema', () => {
  assert.match(worker, /FaithBidChurchIntelBot\/1\.0/);
  assert.match(worker, /robots\.txt/);
  assert.match(worker, /MAX_TARGETS = 10/);
  assert.match(worker, /MAX_PAGES = 5/);
  assert.match(worker, /contentHash === target\.last_content_hash/);
  assert.match(worker, /api\.openai\.com\/v1\/responses/);
  assert.match(worker, /type: "json_schema"/);
  assert.match(worker, /strict: true/);
  assert.match(worker, /Exclude leadership biographies, ordinary events, sermons/);
  assert.doesNotMatch(worker, /signals\.push\([^)]*keyword/i);
});

test('service-only worker RPCs are not ci-prefixed and remain service-role only', () => {
  assert.match(serviceAuth, /drop function if exists public\.ci_list_signal_targets/);
  assert.match(serviceAuth, /create function public\.church_signal_worker_targets/);
  assert.match(serviceAuth, /create function public\.church_record_website_scan/);
  assert.match(serviceAuth, /grant execute[^;]+to service_role/);
  assert.match(serviceAuth, /revoke all[^;]+from public,anon,authenticated/);
});

test('single-source acceptance has an explicit per-organization ledger and admin RPC', () => {
  assert.match(decisions, /create table church_intel\.evidence_independence_decisions/);
  assert.match(decisions, /accepted_for_controlled_acquisition/);
  assert.match(decisions, /allowed_scope[^\n]+research[^\n]+verification[^\n]+internal_analytics/);
  assert.match(decisions, /function public\.ci_set_evidence_independence_decision/);
  assert.match(decisions, /church_intel\.platform_admin_actor\(\)/);
  assert.doesNotMatch(decisions, /insert into church_intel\.evidence_independence_decisions[\s\S]+select f\.id/);
});
