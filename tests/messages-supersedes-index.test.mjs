import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migration = await readFile(
  new URL('../supabase/migrations/20260912205610_index_messages_supersedes_foreign_key.sql', import.meta.url),
  'utf8',
);

test('C4 creates a covering index for the messages supersedes foreign key', () => {
  assert.match(migration, /messages_supersedes_message_id_fkey/);
  assert.match(
    migration,
    /create index messages_supersedes_message_id_idx\s+on public\.messages \(supersedes_message_id\)/,
  );
  assert.match(migration, /a\.attname = 'supersedes_message_id'/);
  assert.match(migration, /i\.indisvalid[\s\S]*i\.indisready/);
});
