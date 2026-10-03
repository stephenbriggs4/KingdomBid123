# Database Restore Runbook

Purpose: recover FaithBid production data after loss or corruption.

## Current state (verify before relying on this)

- The production Supabase project is on the Free plan. Free projects do not include automated daily backups or point-in-time recovery.
- A restore has never been tested end to end.
- Owner and expected recovery time: **to be assigned by the founder.** Do not treat any recovery time as known until a restore has been rehearsed.

## Before any restore

1. Stop writes: put the marketplace and sign-up flows into maintenance (or announce a pause to pilot churches and vendors).
2. Record the exact time of the incident and the last known good state.
3. Take a fresh export of whatever is still readable, even if it is damaged.

## Restore options

1. **Paid tier with backups or point-in-time recovery** (preferred once upgraded): use the Supabase dashboard restore function for the project, to a timestamp before the incident.
2. **Logical export/import from a backup file** (only if a dump exists): restore into a new project first, verify, then point the app at it.
3. **Re-create from source** (last resort): the migrations in `supabase/migrations` rebuild schema only, not data.

## Verify after restore

- Row counts for `profiles`, `vendors`, `projects`, `bids`, `church_feedback`, and `email_outbox` match the expected baseline.
- Sign in as a church test account and a vendor test account.
- Open My Projects and the marketplace; confirm no blank screens.
- Confirm RLS still blocks anonymous reads of private rows (run the database acceptance suite).

## Rehearsal (required before pilot launch)

Restore a copy into a disposable project, run the verification checklist, and record the elapsed time here. Until this is done, the recovery time is unknown.

| Date | Operator | Source timestamp | Elapsed time | Result |
|---|---|---|---|---|
| _not yet run_ | | | | |
