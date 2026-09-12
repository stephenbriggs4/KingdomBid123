import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migration = await readFile(
  new URL('../supabase/migrations/20260912204855_relocate_pg_net_extension_registration.sql', import.meta.url),
  'utf8',
);

test('C2 refuses to relocate pg_net while a request is queued', () => {
  assert.match(migration, /select count\(\*\) into queued_requests from net\.http_request_queue/);
  assert.match(migration, /if queued_requests <> 0 then/);
});

test('C2 preserves responses and restores the pg_net API and grants', () => {
  assert.match(migration, /create temporary table pg_net_response_backup on commit drop as/);
  assert.match(migration, /insert into net\._http_response/);
  assert.match(migration, /if restored_count <> backup_count then/);
  assert.match(migration, /to_regprocedure\('net\.http_get/);
  assert.match(migration, /has_function_privilege\('service_role'/);
});

test('C2 recreates the extension registration outside public', () => {
  assert.match(migration, /drop extension pg_net;[\s\S]*create extension pg_net with schema extensions;/);
  assert.match(migration, /extension_schema is distinct from 'extensions'/);
});
