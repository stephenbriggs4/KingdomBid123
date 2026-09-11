import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const projectsSource = readFileSync(new URL('../src/ProjectsScreen.jsx', import.meta.url), 'utf8');
const governanceSql = readFileSync(new URL('../supabase/migrations/20260910163000_pilot_governance_decision_ledger.sql', import.meta.url), 'utf8');
const fixtureCleanupSql = readFileSync(new URL('../supabase/migrations/20260911024500_archive_release_verification_marketplace_fixture.sql', import.meta.url), 'utf8');

test('uncontacted vendor state uses neutral conversation language', () => {
  assert.match(appSource, /not_contacted:[^\n]+label:"No conversation yet"/);
  assert.doesNotMatch(appSource, /statusLabel:[^\n]+"Not contacted"/);
  assert.doesNotMatch(projectsSource, /\|\| 'Not contacted'/);
});

test('founder and legal governance decisions remain explicitly unresolved', () => {
  assert.match(governanceSql, /founder_decision_required/);
  assert.match(governanceSql, /legal_review_required/);
  assert.doesNotMatch(appSource, /from\("pilot_governance_decisions"\)\.update/);
});

test('release verification fixture is archived by provenance rather than hard-coded ids', () => {
  assert.match(fixtureCleanupSql, /release_verification_fixture_archive/);
  assert.match(fixtureCleanupSql, /source = 'codex-freeze-verification'/);
  assert.match(fixtureCleanupSql, /record_origin = 'qa'/);
  assert.doesNotMatch(fixtureCleanupSql, /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
});
