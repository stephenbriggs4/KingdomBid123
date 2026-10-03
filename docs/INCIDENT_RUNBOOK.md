# Incident Runbook

One page. Use it when the marketplace, sign-up, messaging, or email is failing, or when a key may have leaked.

## Who acts

- **Incident lead:** the founder (Stephen Briggs) until a second person is named here: _to be named_.
- **Support inbox:** `support@faithbid.com`. Owner and response window: _to be named_.

## Severity

- **Sev 1:** sign-in is down, data is exposed, or a leaked key is in use. Act immediately.
- **Sev 2:** marketplace or My Projects is blank or slow for most users. Act the same day.
- **Sev 3:** a single screen or flow is broken for a few users. Fix in the normal cycle.

## First 15 minutes

1. Confirm the problem: open the production site in a private window, sign in as a test account, and reproduce.
2. Check error reporting (Sentry), if `VITE_SENTRY_DSN` is set for production. If it is not set, say so in the incident note.
3. Post a short status note to pilot churches and vendors if the impact is Sev 1 or 2.

## Pausing new sign-ups or the marketplace

- Use the existing feature gates and launch flags in the code, not an ad hoc change to production data.
- Record which flag was changed, by whom, and when.

## Rolling back a deploy

1. Identify the last good commit on `main`.
2. Redeploy that commit through the same hosting path used for the last release.
3. Confirm the site is back and record the commit hash.

## Rotating a leaked key

1. Revoke or rotate the key in the provider dashboard first (Supabase, Resend, Sentry, or the hosting provider).
2. Update the value in the hosting environment, not in the repository.
3. Check the audit log for use of the old key before the rotation time.
4. Note what was exposed, where, and for how long.

## After the incident

- Write a short note: timeline, cause, impact, fix, and what changes to prevent a repeat.
- Add any new check to the test suite if the failure could recur.
