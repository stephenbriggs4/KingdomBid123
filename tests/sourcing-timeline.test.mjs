import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const migrationSource = fs.readFileSync(new URL('../supabase/migrations/20260914170500_require_sourcing_timeline.sql', import.meta.url), 'utf8');

test('ready-to-source review requires a coherent church timeline', () => {
  assert.match(appSource, /Target decision date is set/);
  assert.match(appSource, /Target start date is set/);
  assert.match(appSource, /Target decision date is not in the past/);
  assert.match(appSource, /Target start date is on or after the decision date/);
});

test('database blocks missing or reversed sourcing dates', () => {
  assert.match(migrationSource, /Sourcing requires a decision date and a start date on or after it/);
  assert.match(migrationSource, /A need cannot enter sourcing with a decision date in the past/);
  assert.match(migrationSource, /v_entering_sourcing/);
});
