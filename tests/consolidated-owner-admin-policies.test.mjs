import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20261002213837_consolidate_owner_admin_read_policies.sql',
  import.meta.url,
);

test('owner and admin reads share one permissive SELECT policy', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  for (const table of ['privacy_requests', 'vendor_credentials', 'vendor_private_contact']) {
    assert.match(sql, new RegExp(`create policy ${table}_owner_or_admin_read`, 'i'));
  }
  assert.equal(
    (sql.match(/create policy vendor_private_contact_owner_or_admin_read/gi) || []).length,
    1,
  );
  assert.match(sql, /user_id\s*=\s*\(select auth\.uid\(\)\)[\s\S]*or\s+\(select coalesce\(public\.kb_is_platform_admin\(\), false\)\)/i);
});

test('private vendor contact owner writes retain their original constraints', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /create policy vendor_private_contact_owner_insert[\s\S]*for insert to authenticated[\s\S]*v\.id = vendor_id[\s\S]*v\.user_id = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /create policy vendor_private_contact_owner_update[\s\S]*for update to authenticated[\s\S]*using \(user_id = \(select auth\.uid\(\)\)\)[\s\S]*with check/i);
  assert.match(sql, /create policy vendor_private_contact_owner_delete[\s\S]*for delete to authenticated[\s\S]*using \(user_id = \(select auth\.uid\(\)\)\)/i);
  assert.doesNotMatch(sql, /create policy vendor_private_contact_owner\s+[\s\S]*for all/i);
});
