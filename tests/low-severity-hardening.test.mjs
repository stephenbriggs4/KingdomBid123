import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const hard = read('../supabase/migrations/20260928170000_low_severity_hardening.sql');
const fix = read('../supabase/migrations/20260928171000_fix_vendor_invites_policy_recursion.sql');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

has(hard, /Vendor invitation response fields change only through the bidding workflow/, 'invite response fields are locked');
has(hard, /kb_guard_project_system_columns_v1/, 'project counters are guarded');
has(hard, /pg_trigger_depth\(\) > 1/, 'trigger-maintained counters still work');
has(hard, /match_events[\s\S]*p\.id::text = match_events\.project_id/, 'match_events must reference a real project');
has(hard, /kb_vendor_availability_public_select[\s\S]*to authenticated/, 'vendor availability is not anonymous-readable');
assert.ok(!/revoke[^;]*kb_has_private_marketplace_access/i.test(hard), 'the private-marketplace helper keeps its execute grant');
has(fix, /function public\.kb_vendor_invited_to_project_v1/, 'projects policy uses a definer helper');
assert.ok(!/from public\.vendor_invites vi[\s\S]{0,200}create policy/.test(fix.split('create policy')[1] || ''), 'projects policy no longer queries vendor_invites directly');
console.log('low-severity-hardening: ok');
