import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const migrationSource = fs.readFileSync(new URL('../supabase/migrations/20260914195307_require_intake_follow_up.sql', import.meta.url), 'utf8');

test('new church intake requires an actionable dated follow-up', () => {
  assert.match(appSource, /Assign the concrete next action before saving this intake/);
  assert.match(appSource, /Set the next action date before saving this intake/);
  assert.match(appSource, /The next action date cannot be in the past/);
  assert.match(appSource, /input\("Next action", "next_action", \{ required: true/);
  assert.match(appSource, /input\("Next action date", "next_action_on", \{ required: true/);
});

test('database protects intake follow-up without trapping overdue records', () => {
  assert.match(migrationSource, /Intake and clarifying needs require a next action and date/);
  assert.match(migrationSource, /A newly assigned next action date cannot be in the past/);
  assert.match(migrationSource, /tg_op = 'INSERT' or new\.next_action_on is distinct from old\.next_action_on/);
});
