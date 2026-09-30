import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const mig = read('../supabase/migrations/20260928180308_per_user_rate_limits.sql');
const msgs = read('../src/MessagesTab.jsx');
const app = read('../src/App.jsx');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

has(mig, />= 30 then/, 'messages are limited per minute');
has(mig, />= 20 then[\s\S]{0,140}hourly attachment limit/, 'attachments are limited per hour');
has(mig, /kb_rate_limit_bids_v1[\s\S]{0,900}hourly proposal limit/, 'proposals are limited per hour');
has(mig, /coalesce\(auth\.role\(\), ''\) <> 'authenticated'/, 'system writes and service role are exempt');
has(mig, /kb_is_platform_admin/, 'admins are exempt');
has(msgs, /rateLimitMessage\(err\) \|\| 'Message could not be sent/, 'chat shows the friendly rate-limit message');
has(msgs, /rateLimitMessage\(err\) \|\| \(err\?\.message\?\.includes\('mime'\)/, 'attachments show the friendly rate-limit message');
has(app, /startsWith\("rate_limited:"\)/, 'proposal form shows the friendly rate-limit message');
console.log('rate-limits: ok');
