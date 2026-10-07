import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = relative => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const migration = read('supabase/migrations/20261007171800_church_intelligence_council_districts.sql');
const auditFix = read('supabase/migrations/20261007172057_fix_council_district_rpc_audit_path.sql');
const fetcher = read('scripts/fetch-dallas-council-districts.mjs');
const component = read('src/ChurchIntelligence.jsx');

test('council districts use the existing stage-publish pipeline without a new table or column', () => {
  assert.match(migration, /create or replace function public\.ci_stage_dallas_boundary\(/);
  assert.match(migration, /create or replace function public\.ci_publish_boundary\(/);
  assert.match(migration, /p_boundary_scope text/);
  assert.match(migration, /p_council_district integer/);
  assert.match(migration, /boundary_scope in \('city','county','metro','district'\)/);
  assert.match(migration, /ci_boundary_district_metadata_ck/);
  assert.match(migration, /transformation_metadata->>'council_district'/);
  assert.doesNotMatch(migration, /create table/i);
  assert.doesNotMatch(migration, /add column/i);
});

test('district acquisition keeps native EPSG:2276 authority and excludes officeholder names', () => {
  assert.match(fetcher, /CouncilAreas\/MapServer\/0/);
  assert.match(fetcher, /outFields: 'OBJECTID,COUNCIL,DISTRICT'/);
  assert.match(fetcher, /Deliberately no outSR/);
  assert.match(fetcher, /wkid !== 2276/);
  assert.match(fetcher, /Expected 14 council districts/);
  assert.match(fetcher, /officeholder_field_stored: false/);
  assert.doesNotMatch(fetcher, /outFields:[^\n]*COUNCILPER/);
});

test('overview assigns district server-side with ST_Contains', () => {
  assert.match(migration, /'council_district'/);
  assert.match(migration, /extensions\.st_contains\(/);
  assert.match(migration, /extensions\.st_makepoint\(/);
  assert.match(component, /p_include_council_district: true/);
});

test('district boundary read uses the direct platform-admin gate', () => {
  const start = migration.indexOf('create or replace function public.ci_get_boundary_geojson');
  const end = migration.indexOf('create or replace function public.ci_list_organizations_overview', start);
  const rpc = migration.slice(start, end);
  const stageStart = migration.indexOf('create or replace function public.ci_stage_dallas_boundary');
  const stageEnd = migration.indexOf('create or replace function public.ci_publish_boundary', stageStart);
  const stageRpc = migration.slice(stageStart, stageEnd);
  assert.match(rpc, /church_intel\.platform_admin_actor\(\)/);
  assert.doesNotMatch(rpc, /church_intel\.assert_admin\(\)/);
  assert.match(rpc, /FeatureCollection/);
  assert.match(stageRpc, /church_intel\.platform_admin_actor\(\)/);
  assert.doesNotMatch(stageRpc, /church_intel\.assert_admin\(\)/);
});

test('district writes preserve audit events without widening the locked audit helper', () => {
  assert.match(auditFix, /insert into public\.admin_audit_log/);
  assert.match(auditFix, /church_intel\.boundary_staged/);
  assert.match(auditFix, /church_intel\.boundary_published/);
  assert.doesNotMatch(auditFix, /grant execute on function church_intel\.audit/);
  assert.doesNotMatch(auditFix, /perform\s+church_intel\.audit\(/);
});

test('council district is the primary geographic filter and ZIP remains precise', () => {
  assert.match(component, /const \[districtFilters, setDistrictFilters\] = useState/);
  assert.match(component, /Council district/);
  assert.match(component, /Precise ZIP/);
  assert.match(component, /params\.set\("district"/);
  assert.match(component, /matchesDistrictFn/);
  assert.match(component, /onDistrictToggle/);
  assert.match(component, /Council District \$\{district\}/);
  assert.match(component, /ciDistrictPane/);
});
