import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const migration = readFileSync(
  new URL('../supabase/migrations/20260914161929_capture_church_sourcing_permissions.sql', import.meta.url),
  'utf8',
);

test('church intake captures separate sourcing and disclosure permissions', () => {
  assert.match(app, /church_sourcing_permission_status: "not_requested"/);
  assert.match(app, /referral_contact_permission_status: "not_applicable"/);
  assert.match(app, /Permission to source vendors for this need/);
  assert.match(app, /Permission to contact a referred vendor/);
  assert.match(app, /Permission to identify the church to vendors/);
  assert.match(app, /Permission to post the need publicly/);
  assert.match(app, /approval to source does not permit FaithBid to name the church, contact a referred vendor, or post publicly/);
});

test('ready-to-source review requires permission evidence', () => {
  assert.match(app, /form\.church_sourcing_permission_status === "granted"/);
  assert.match(app, /Granted sourcing permission has a date, source, reference, and recorder/);
  assert.match(app, /church_sourcing_permission_recorded_by: \[form\.church_sourcing_permission_status/);
  assert.match(app, /church_sourcing_permission_status,referral_contact_permission_status,church_identity_permission_status,public_sourcing_permission_status/);
});

test('database rejects bypasses and preserves scoped permission', () => {
  assert.match(migration, /create or replace function concierge_ops\.enforce_church_sourcing_permissions\(\)/i);
  assert.match(migration, /Specific outreach or disclosure permission requires church permission to source the need/);
  assert.match(migration, /new\.status in \('ready_to_source','sourcing','shortlist_ready','organization_reviewing','vendor_selected'\)/);
  assert.match(migration, /Church permission to source is required before this need can advance to sourcing/);
  assert.match(migration, /Granted church sourcing permissions require the recorded time, source, reference, and recorder/);
  assert.match(migration, /v_operator_id uuid := auth\.uid\(\)/);
});
