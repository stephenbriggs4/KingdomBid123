import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const migrationSource = fs.readFileSync(new URL('../supabase/migrations/20260914163038_require_reachable_primary_contact.sql', import.meta.url), 'utf8');

test('church intake requires a reachable primary contact', () => {
  assert.match(appSource, /Enter an email address or phone number so FaithBid can reach the primary contact/);
  assert.match(appSource, /contact_preferred_channel === "email" && !form\.contact_email\.trim\(\)/);
  assert.match(appSource, /\["phone", "text"\]\.includes\(form\.contact_preferred_channel\) && !form\.contact_phone\.trim\(\)/);
});

test('database protects active primary-contact reachability', () => {
  assert.match(migrationSource, /enforce_organization_primary_contact_reachability/);
  assert.match(migrationSource, /An active organization primary contact requires an email address or phone number/);
  assert.match(migrationSource, /before insert or update of primary_contact_id, archived_at/);
  assert.match(migrationSource, /before update of email, phone, archived_at/);
});
