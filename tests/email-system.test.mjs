import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const mig = read('../supabase/migrations/20260928182514_email_system.sql');
const wlMig = read('../supabase/migrations/20260928182805_waitlist_email_log.sql');
const leaseMig = read('../supabase/migrations/20260930183715_lease_email_outbox_claims.sql');
const worker = read('../supabase/functions/email-worker/index.ts');
const waitlist = read('../supabase/functions/send-waitlist-email/index.ts');
const settings = read('../src/SettingsScreen.jsx');
const unsub = read('../src/UnsubscribeScreen.jsx');
const app = read('../src/App.jsx');
const doc = read('../docs/EMAIL_SETUP.md');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

// database
has(mig, /alter table public\.email_outbox enable row level security/, 'outbox is service-role only');
has(mig, /alter table public\.email_suppressions enable row level security/, 'suppression list is service-role only');
has(mig, /revoke all on public\.email_outbox from anon, authenticated/, 'clients cannot touch the outbox');
has(mig, /email_frequency in \('instant','daily','off'\)/, 'preferences support instant, daily and off');
has(mig, /exists \(select 1 from public\.email_suppressions/, 'suppressed addresses are never queued');
has(mig, /'msg:' \|\| coalesce\(new\.meta ->> 'conversation_id'/, 'message emails are throttled per conversation');
has(mig, /exception when others then[\s\S]{0,160}return new;/, 'email failures never block the in-app notification');
has(wlMig, /waitlist_email_log/, 'waitlist sends are logged');

// worker
has(worker, /if \(!RESEND_API_KEY \|\| !RESEND_FROM_EMAIL\) return json\(200, \{ ok: true, configured: false/, 'worker is inert until the provider is configured');
has(worker, /safeEqual\(req\.headers\.get\("x-worker-secret"\)/, 'processing requires the worker secret');
has(worker, /List-Unsubscribe-Post/, 'one-click unsubscribe header is sent');
has(worker, /if \(req\.method === "GET"\) return json\(200, \{ ok: true, valid: true \}\); \/\/ GET never changes anything/, 'GET never unsubscribes (mail scanners prefetch links)');
has(worker, /email\.bounced[\s\S]{0,200}email\.complained/, 'bounces and complaints are handled');
has(worker, /svix-signature/, 'the webhook verifies signatures');
has(leaseMig, /for update skip locked/, 'outbox claims serialize competing workers without blocking');
has(leaseMig, /claim_expires_at/, 'worker claims have an expiry and can be recovered');
has(leaseMig, /grant execute[\s\S]*to service_role/, 'only the service role may claim outbox rows');
has(worker, /rpc\("kb_claim_email_outbox_v1"/, 'worker uses the database claim primitive');
has(worker, /eq\("worker_id", workerId\)/, 'worker completion is scoped to its own lease');
has(worker, /esc\(row\.subject\)/, 'user-authored text is escaped in emails');

// waitlist function
has(waitlist, /if \(!entry\) return accepted\(req\)/, 'non-members receive the same opaque acceptance response');
has(waitlist, /MAX_SENDS = 5/, 'waitlist sends are capped');
has(waitlist, /if \(suppressed\) return accepted\(req\)/, 'suppressed addresses are respected without exposing status');
has(waitlist, /ALLOWED_ORIGINS\.has/, 'CORS permits only configured FaithBid origins');
has(waitlist, /\{ accepted: true \}, 202/, 'public responses do not reveal delivery or waitlist state');

// app
has(settings, /email_frequency/, 'Settings saves the email frequency');
has(settings, /One daily summary/, 'Settings offers a daily summary');
has(unsub, /method: "POST"/, 'the unsubscribe page only changes settings on an explicit click');
has(app, /"about","help","unsubscribe","privacy"/, 'the unsubscribe route is registered');
has(doc, /never change it once emails are out/i, 'the setup guide warns about the unsubscribe secret');
for (const t of ['confirm-signup', 'reset-password', 'change-email']) {
  has(read(`../supabase/email-templates/${t}.html`), /\{\{ \.(ConfirmationURL) \}\}/, `${t} template uses the Supabase confirmation link`);
}
console.log('email-system: ok');
