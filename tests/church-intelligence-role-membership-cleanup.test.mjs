import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrations = path.join(root, 'supabase', 'migrations');
const cleanupName = '20261002054008_church_intelligence_final_role_membership_cleanup.sql';
const cleanup = fs.readFileSync(path.join(migrations, cleanupName), 'utf8');

test('the final CI migration revokes and verifies temporary postgres membership', () => {
  assert.match(cleanup, /revoke\s+church_intel_api_owner\s+from\s+postgres\s*;/i);
  assert.match(cleanup, /from\s+pg_auth_members\s+membership/i);
  assert.match(cleanup, /granted_role\.rolname\s*=\s*'church_intel_api_owner'/i);
  assert.match(cleanup, /member_role\.rolname\s*=\s*'postgres'/i);
  assert.match(cleanup, /raise\s+exception/i);
});

test('no later migration can silently re-grant the temporary membership', () => {
  const laterSql = fs.readdirSync(migrations)
    .filter((name) => name.endsWith('.sql') && name > cleanupName)
    .sort()
    .map((name) => fs.readFileSync(path.join(migrations, name), 'utf8'))
    .join('\n');

  assert.doesNotMatch(laterSql, /grant\s+church_intel_api_owner\s+to\s+postgres/i);
});
