import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../supabase/migrations/20260930183737_expire_public_vendor_reference_links.sql", import.meta.url), "utf8");

assert.match(sql, /add column if not exists expires_at timestamptz/);
assert.match(sql, /interval '30 days'/);
assert.match(sql, /status in \('completed', 'cancelled'\)/);
assert.match(sql, /if tg_op = 'INSERT'[\s\S]*new\.expires_at := clock_timestamp\(\) \+ interval '30 days'/);
assert.match(sql, /new\.expires_at := old\.expires_at/);
assert.match(sql, /status in \('pending', 'sent'\)[\s\S]*expires_at > statement_timestamp\(\)/);
assert.match(sql, /rename to kb_get_vendor_reference_survey_v2_unexpired_legacy/);
assert.match(sql, /rename to kb_submit_vendor_reference_response_v2_unexpired_legacy/);
assert.match(sql, /revoke all on function public\.kb_get_vendor_reference_survey_v2_unexpired_legacy[\s\S]*from public, anon, authenticated/);
assert.match(sql, /return query select false, 'invalid_token'::text/);
assert.match(sql, /for update;[\s\S]*if not found then/);

console.log("vendor-reference-expiry: ok");
