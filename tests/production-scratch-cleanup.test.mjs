import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migration = await readFile(
  new URL('../supabase/migrations/20260912203459_archive_and_remove_production_scratch_tables.sql', import.meta.url),
  'utf8',
);

test('C1 archives and verifies both scratch tables before dropping the schema', () => {
  for (const table of ['scratch._dg_final', 'scratch._dg_scratch']) {
    assert.match(migration, new RegExp(`'${table.replace('.', '\\.')}'`));
  }
  assert.match(migration, /jsonb_array_length\(a\.payload -> 'rows'\)/);
  assert.match(migration, /archive_before_removing_production_scratch_schema/);
  assert.match(migration, /drop table scratch\._dg_final;[\s\S]*drop table scratch\._dg_scratch;[\s\S]*drop schema scratch;/);
  assert.match(migration, /to_regnamespace\('scratch'\) is not null/);
});

test('the restricted recovery ledger is intentionally retained and documented', () => {
  assert.match(migration, /comment on table concierge_ops\.release_verification_fixture_archive/);
  assert.doesNotMatch(migration, /drop table concierge_ops\.release_verification_fixture_archive/i);
});
