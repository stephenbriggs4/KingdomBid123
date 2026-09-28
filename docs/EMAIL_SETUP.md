# FaithBid email setup

Everything in the app and database for email is built and deployed. **Nothing sends until you finish the steps below.**
Until then, notification emails queue harmlessly in `email_outbox`, the `email-worker` reports `configured:false`, and
the `send-waitlist-email` function answers `email_provider_not_configured`.

## What exists

| Piece | Where | What it does |
|---|---|---|
| `email_outbox`, `email_suppressions`, `waitlist_email_log` | database | Queue, do-not-email list, and waitlist send log (service role only) |
| Notification trigger | database | Every in-app notification of a supported type queues one email, respecting the person's Settings |
| `email-worker` | Edge Function | Sends the queue through Resend, one-click unsubscribe, bounce/complaint webhook, daily digest |
| `send-waitlist-email` | Edge Function | Waitlist confirmation (only to real waitlist addresses; 5 sends max, 2 minutes apart) |
| Unsubscribe page | app route `#unsubscribe` | The visible page linked from every email |
| Email preferences | Settings → Notifications | Send instantly, daily summary, or do not email |
| Auth email templates | `supabase/email-templates/` | Branded confirm-signup, reset-password, change-email |

Emails covered: bid invitation, new proposal, proposal declined/accepted, new message (max one per conversation
per 15 minutes), project update, project closed, work ready for review, changes requested, project completed,
review prompt, waitlist confirmation, plus the Supabase Auth emails below.

## Step 1 — Choose the sender and verify the domain (you)

1. Create a Resend account and add the domain **faithbid.com** (or a subdomain such as `mail.faithbid.com`, recommended).
2. Add the DNS records Resend shows you at your DNS host:
   - **SPF** (TXT) and **DKIM** (CNAME/TXT) records exactly as shown.
   - **DMARC** (TXT on `_dmarc`): start with `v=DMARC1; p=none; rua=mailto:dmarc@faithbid.com` and tighten to `quarantine` after a few clean weeks.
3. Wait for Resend to show the domain as **Verified**. Send a test from Resend's dashboard and check it lands in the inbox, not spam. A tool such as mail-tester.com should score 9+/10.

## Step 2 — Set the function secrets (you)

Supabase Dashboard → Edge Functions → Secrets (or `supabase secrets set ...`). Generate the random values yourself (32+ characters).

| Secret | Value |
|---|---|
| `RESEND_API_KEY` | Resend API key (send-only) |
| `RESEND_FROM_EMAIL` | e.g. `FaithBid <hello@mail.faithbid.com>` (must be on the verified domain) |
| `FAITHBID_PUBLIC_URL` | The live site address, e.g. `https://faithbid.com` (no trailing slash) |
| `FAITHBID_SUPPORT_EMAIL` | `support@faithbid.com` |
| `EMAIL_WORKER_SECRET` | random string; the scheduler sends it in `x-worker-secret` |
| `EMAIL_UNSUB_SECRET` | random string; signs unsubscribe links (never change it once emails are out, or old links stop working) |
| `RESEND_WEBHOOK_SECRET` | the `whsec_...` signing secret Resend gives you in Step 4 |

## Step 3 — Schedule the worker (you, once)

In the Supabase SQL editor. First store the worker secret in Vault, then schedule two jobs (every 2 minutes for instant emails, once a day for summaries; the digest runs at 14:00 UTC = 9 AM Central):

```sql
select vault.create_secret('<the same value as EMAIL_WORKER_SECRET>', 'email_worker_secret');

select cron.schedule('faithbid-email-instant', '*/2 * * * *', $$
  select net.http_post(
    url := 'https://knkwaphosqronbhrvlsu.supabase.co/functions/v1/email-worker/process',
    headers := jsonb_build_object('content-type','application/json',
      'x-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'email_worker_secret')),
    body := '{"mode":"instant"}'::jsonb);
$$);

select cron.schedule('faithbid-email-digest', '0 14 * * *', $$
  select net.http_post(
    url := 'https://knkwaphosqronbhrvlsu.supabase.co/functions/v1/email-worker/process',
    headers := jsonb_build_object('content-type','application/json',
      'x-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'email_worker_secret')),
    body := '{"mode":"digest"}'::jsonb);
$$);
```

To stop all sending at any time: `select cron.unschedule('faithbid-email-instant');` (queued mail simply waits).

## Step 4 — Bounce and complaint handling (you)

Resend → Webhooks → add endpoint `https://knkwaphosqronbhrvlsu.supabase.co/functions/v1/email-worker/webhook`,
events `email.bounced` and `email.complained`. Copy its signing secret into `RESEND_WEBHOOK_SECRET`.
Bounced/complaining addresses go on `email_suppressions` and are never mailed again.

## Step 5 — Supabase Auth emails (you) — R-47

Supabase's built-in sender is rate-limited and not for production.

1. Dashboard → Authentication → **SMTP Settings** → enable custom SMTP using Resend:
   host `smtp.resend.com`, port `465`, username `resend`, password = your Resend API key, sender = the same verified address.
2. Authentication → **Email Templates**: paste the three files from `supabase/email-templates/`
   (Confirm signup, Reset password, Change email address).
3. Authentication → **URL Configuration**: set **Site URL** to the live site, and add both the live site and `http://localhost:5173` to **Redirect URLs**.
4. Authentication → Sign in / Providers → Email: keep **Confirm email** on.
5. Authentication → Password: turn on **Leaked password protection** (R-06).

## Step 6 — Test on a staging project first (recommended)

1. Trigger each event (post → invite → bid → decline → message → complete) with two test accounts.
2. Check `select status, count(*) from email_outbox group by 1;`, then confirm the inbox result and the unsubscribe link.
3. Click Unsubscribe: `notification_prefs.email_enabled` should become `false` and the next event should queue nothing.
4. Send to a bounce test address (Resend provides `bounced@resend.dev`) and confirm it lands in `email_suppressions`.

## Operating notes

- Failed sends retry up to 5 times with growing delays, then stay `failed` with `last_error` set.
- A person with no Settings row receives emails by default (all are activity on their own account). Newsletter/marketing mail is a separate preference and is not sent by this system.
- Do not add marketing email to this pipeline without the separate opt-in the consent copy calls for.
