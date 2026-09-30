# Unapplied migration draft archive

This directory is intentionally outside `supabase/migrations`.

On 2026-09-30, the active local migration directory was reconciled read-only
against the FaithBid Supabase migration ledger. Files with versions that were
not present in that ledger were removed from the executable migration path.
Exact duplicate drafts were deleted; 36 non-identical drafts were preserved in
`2026-09-30_unapplied/` for historical review.

These files are **not migrations** and must never be copied back into the active
directory. If a preserved idea is still needed, create a new forward-only
migration with `supabase migration new`, review it against the current schema,
and validate it in a disposable environment.

No production database object or migration-ledger row was changed during this
reconciliation.
