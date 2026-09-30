import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const client = read('../src/supabaseClient.js');
const app = read('../src/App.jsx');
const idx = read('../supabase/migrations/20260928175531_fk_covering_indexes.sql');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

has(client, /REST_ROW_CAP = 1000/, 'the 1000-row API cap is named');
has(client, /"kb:rest-row-cap"/, 'row-cap hits are announced');
has(client, /content-range/, 'detection uses the PostgREST content-range header');
has(app, /logError\("rest-row-cap"/, 'the app reports a truncated list to Sentry');
for (const name of ['match_snapshots_project_church_idx', 'match_snapshots_vendor_pair_idx', 'marketplace_vendor_curation_curated_by_idx']) {
  has(idx, new RegExp(name), `index ${name} exists`);
}
console.log('row-cap-and-indexes: ok');
