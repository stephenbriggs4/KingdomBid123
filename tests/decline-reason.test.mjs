import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const mig = read('../supabase/migrations/20260928220000_bid_decline_reason.sql');
const app = read('../src/App.jsx');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

has(mig, /add column if not exists decline_reason text/, 'bids store a decline reason');
has(mig, /drop function if exists public\.faithbid_bidding_decline_bid_v1\(uuid\)/, 'the old one-argument function is replaced, not overloaded');
has(mig, /p_reason text default null/, 'the reason is optional');
has(mig, /only the posting church may decline/, 'only the posting church can decline');
has(app, /reasonLabel="Reason for the vendor \(optional\)"/, 'church is asked for an optional reason');
has(app, /p_reason: typeof declineReason === "string"/, 'the reason is sent to the RPC');
has(app, /The church said: &ldquo;\{bid\.decline_reason\}&rdquo;/, 'the vendor sees the reason');
has(app, /Next step: browse other open projects/, 'the vendor is given a next step');
has(app, /onClick=\{reasonLabel \? \(\(\) => onConfirm\(buildReason\(\)\)\) : onConfirm\}/, 'other confirm dialogs behave exactly as before');
console.log('decline-reason: ok');
