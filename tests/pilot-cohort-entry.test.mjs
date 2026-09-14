import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const migrationSource = fs.readFileSync(new URL('../supabase/migrations/20260914163518_require_pilot_cohort_entry_evidence.sql', import.meta.url), 'utf8');

test('ordinary intake does not silently enroll a church in the pilot', () => {
  assert.match(appSource, /Pilot entry is separate:/);
  assert.doesNotMatch(appSource, /checked=\{form\.pilot_cohort\}/);
});

test('pilot entry uses an evidence workflow instead of a one-click boolean', () => {
  assert.match(appSource, /FBConciergePilotEntryModal/);
  assert.match(appSource, /pilot_cohort_entry_reference/);
  assert.match(appSource, /pilot_cohort_recorded_by: currentUser\?\.id \|\| null/);
  assert.match(appSource, /Record entry/);
});

test('database rejects active pilot membership without explicit evidence', () => {
  assert.match(migrationSource, /Active Dallas Pilot membership requires explicit entry evidence/);
  assert.match(migrationSource, /organizations_active_pilot_cohort_evidence_check/);
  assert.match(migrationSource, /pilot_cohort_recorded_by uuid references public\.profiles\(id\)/);
});
