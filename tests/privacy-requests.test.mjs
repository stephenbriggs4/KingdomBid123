import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const settings = read('../src/SettingsScreen.jsx');
const admin = read('../src/AdminScreen.jsx');
const panel = read('../src/AdminPrivacyRequests.jsx');
const mig = read('../supabase/migrations/20260928130000_privacy_requests.sql');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

has(settings, /rpc\("kb_submit_privacy_request"/, 'settings files requests through the RPC');
has(settings, /Request account deletion/, 'settings offers a real deletion request');
has(settings, /Request my data/, 'settings offers a data export request');
assert.ok(!/Contact support to delete/.test(settings), 'old support-email toast is gone');
has(admin, /adminView==="privacy" && <AdminPrivacyRequests/, 'admin renders the privacy requests view');
has(admin, /id:"privacy",\s+label:"Privacy Requests"/, 'admin nav lists Privacy Requests');
has(panel, /rpc\("kb_admin_list_privacy_requests"\)/, 'admin panel lists via admin-only RPC');
has(panel, /rpc\("kb_admin_resolve_privacy_request"/, 'admin panel resolves via admin-only RPC');
has(mig, /kb_is_platform_admin/, 'admin RPCs check platform admin');
has(mig, /revoke all on public\.privacy_requests from anon, authenticated/, 'no direct table writes');
has(mig, /privacy_requests_one_active/, 'one active request per person per kind');
console.log('privacy-requests: ok');
