import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const migrationsUrl = new URL('../supabase/migrations/', import.meta.url);
const enforcementStart = '20260911161655';

test('new UPDATE-only migrations assert their affected row count', () => {
  const candidates = readdirSync(migrationsUrl)
    .filter(name => name.endsWith('.sql') && name.slice(0, 14) >= enforcementStart)
    .map(name => ({ name, sql: readFileSync(new URL(name, migrationsUrl), 'utf8') }))
    .filter(({ sql }) => /^\s*update\s+/im.test(sql))
    .filter(({ sql }) => !/^\s*(create|alter|drop|insert|delete|truncate)\s+/im.test(sql));

  assert.ok(candidates.length > 0, 'expected the verified truth-label migration to exercise this guard');

  for (const { name, sql } of candidates) {
    assert.match(sql, /get diagnostics\s+\w+\s*=\s*row_count/i, `${name} must capture ROW_COUNT`);
    assert.match(sql, /raise exception/i, `${name} must fail on an unexpected row count`);
  }
});

test('Deal Room audit fixture cleanup is provenance-bound and recoverable', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/20260911161650_archive_deal_room_ui_audit_fixture.sql', import.meta.url),
    'utf8',
  );

  assert.match(sql, /Deal Room UI Audit Test Project/);
  assert.match(sql, /internal UI\/QA auditing/);
  assert.match(sql, /release_verification_fixture_archive/);
  assert.match(sql, /protected_record_count <> 0/);
  assert.doesNotMatch(sql, /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
});
