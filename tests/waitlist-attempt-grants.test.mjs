import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20261001234430_revoke_waitlist_attempt_browser_grants.sql',
  import.meta.url,
);

test('waitlist abuse-control log has no direct browser table privileges', async () => {
  const migration = await readFile(migrationUrl, 'utf8');

  assert.match(
    migration,
    /revoke\s+all\s+privileges\s+on\s+table\s+public\.waitlist_submission_attempts\s+from\s+public\s*,\s*anon\s*,\s*authenticated\s*;/i,
  );
  assert.match(migration, /No direct browser access/i);
  assert.doesNotMatch(
    migration,
    /grant\s+.+\s+on\s+table\s+public\.waitlist_submission_attempts\s+to\s+(?:public|anon|authenticated)/i,
  );
});
