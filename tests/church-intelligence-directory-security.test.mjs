import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = relative => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const lists = read('supabase/migrations/20260930193100_church_intelligence_read_only_list_rpcs.sql');
const matches = read('supabase/migrations/20260930204500_church_intelligence_faithbid_match_suggestions.sql');
const overview = read('supabase/migrations/20260930213000_church_intelligence_directory_denomination_and_names.sql');
const component = read('src/ChurchIntelligence.jsx');
const pgtap = read('supabase/tests/church_intelligence_phase1_test.sql');

test('every new Church Intelligence RPC keeps the narrow SECURITY DEFINER contract', () => {
  for (const name of ['ci_list_review_cases', 'ci_list_sources', 'ci_list_boundary_versions', 'ci_list_system_links']) {
    assert.match(lists, new RegExp(`function public\\.${name}[^$]+security definer set search_path = ''`, 's'));
    assert.match(lists, new RegExp(`revoke execute on function public\\.${name}[^;]+from public, anon, service_role`));
    assert.match(lists, new RegExp(`grant execute on function public\\.${name}[^;]+to authenticated`));
  }
  assert.match(matches, /perform church_intel\.assert_admin\(\)/);
  assert.match(matches, /security definer set search_path = ''/);
  assert.match(matches, /grant select\(id, org_name, city, state_code, denomination, role\) on public\.profiles/);
  assert.match(matches, /create policy profiles_ci_select[\s\S]*using \(role = 'church'\)/);
  assert.match(matches, /revoke execute on function public\.ci_suggest_faithbid_matches[^;]+from public, anon, service_role/);
});

test('directory denomination remains purpose-scoped evidence, not an ungoverned canonical column', () => {
  assert.doesNotMatch(overview, /alter table church_intel\.church_organizations add column[^;]*denomination/i);
  assert.match(overview, /c\.attribute_key = 'denomination'/);
  assert.match(overview, /c\.claim_status = 'promoted'/);
  assert.match(overview, /'research' = any\(c\.allowed_purposes\)/);
  assert.match(overview, /'research' = any\(c\.current_use_ceiling\)/);
});

test('the directory overview is authenticated-only and FaithBid status ignores other system links', () => {
  assert.match(overview, /revoke execute on function public\.ci_list_organizations_overview\(integer\) from public, anon, service_role/);
  assert.match(overview, /grant execute on function public\.ci_list_organizations_overview\(integer\) to authenticated/);
  assert.match(overview, /l2\.system_key = 'faithbid_profile' and l2\.link_status = 'active'/);
});

test('human-confirmed account links carry a reversible review basis', () => {
  const linkStart = component.indexOf('const linkMatch = async');
  const linkEnd = component.indexOf('const online =', linkStart);
  const linkFlow = component.slice(linkStart, linkEnd);
  assert.match(linkFlow, /ci_open_review_case/);
  assert.match(linkFlow, /p_organization_id: orgId/);
  assert.match(linkFlow, /p_review_id: reviewId/);
  assert.match(linkFlow, /ci_resolve_review_case/);
  assert.doesNotMatch(linkFlow, /p_status: "active"[^}]+p_review_id: null/);
  const manualStart = component.indexOf('{showNewLinkModal && <NewLinkModal');
  const manualEnd = component.indexOf('</section>;', manualStart);
  const manualFlow = component.slice(manualStart, manualEnd);
  assert.match(manualFlow, /form\.status === "active" \? await callRpc\("ci_open_review_case"/);
  assert.match(manualFlow, /p_organization_id: form\.organizationId/);
  assert.match(manualFlow, /p_review_id: reviewId/);
  assert.match(manualFlow, /if \(reviewId\) await callRpc\("ci_resolve_review_case"/);
});

test('pgTAP reflects the complete 19-RPC surface and narrow Profiles columns', () => {
  assert.match(pgtap, /all 19 public CI RPCs/);
  assert.match(pgtap, /has_column_privilege\('church_intel_api_owner','public\.profiles','org_name','SELECT'\)/);
  assert.match(pgtap, /not has_column_privilege\('church_intel_api_owner','public\.profiles','email','SELECT'\)/);
  assert.match(pgtap, /not has_table_privilege\('church_intel_api_owner','public\.profiles','SELECT'\)/);
});

test('map labels treat researched names and addresses as text, never tooltip HTML', () => {
  assert.match(component, /title\.textContent = row\.canonical_name/);
  assert.match(component, /document\.createTextNode\(row\.address_line_1\)/);
  assert.doesNotMatch(component, /bindTooltip\(`<strong>\$\{row\.canonical_name\}/);
  assert.match(component, /\.catch\(\(\) => \{ if \(!cancelled\) setMapError/);
});
