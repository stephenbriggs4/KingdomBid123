# Dallas Church Acquisition Runbook

## Purpose

This is a free, read-only research pipeline for expanding the Dallas Church
Intelligence directory beyond its initial records. It does not connect to
Supabase, create canonical churches, merge records, contact anyone, or write to
production.

The output is deliberately simple:

1. `new-churches` — plausible new Dallas churches ready for human verification.
2. `likely-duplicates` — possible matches to an existing church or another
   Overture record. Nothing is auto-merged.
3. `needs-more-information` — missing, low-confidence, or closed records that
   should not be promoted without another check.

## Source and scope

- Source: Overture Maps Places, release `2026-09-23.1`, schema v2.0.0.
- Category rule: `taxonomy.hierarchy` must contain
  `christian_place_of_worship`.
- Geography rule: the place point must fall inside the official City of Dallas
  polygon. The native EPSG:2276 download remains authoritative; the WGS84 copy
  is a clearly labeled derivative used only by this local screening step.
- Effective rights: `research`, `verification`, and `internal_analytics` only.
  Outreach, export, and redistribution are not inferred from Overture evidence.

Overture is a discovery source, not proof that the list is complete. Its own
documentation warns that Places can contain duplicates, stale places, and
missing properties. Complete Dallas coverage therefore requires later
comparison against additional independent sources and human verification.

## Run locally

All generated files stay under `work/` and remain outside the application.
`uv` supplies a temporary pinned DuckDB runtime; it does not add a package to
the FaithBid frontend and does not require WSL.

```powershell
npm run church-intel:fetch-dallas-boundary
npm run church-intel:fetch-overture
npm run church-intel:classify-dallas
npm run test:church-intel-acquisition
```

Review `work/dallas-church-acquisition/results/manifest.json` first, then the
three CSV files. `research-bundles.json` is only a future import staging
artifact. It explicitly requires human verification and must not be applied to
production by this pipeline.

## Validated Dallas run — October 2, 2026

The pinned Overture release produced 4,336 Christian-place records in the broad
Dallas download box. Applying the official City of Dallas polygon left 1,891
records inside the city. Comparing those records with the current 40-record
Church Intelligence starter set produced:

| Result | Count | Meaning |
| --- | ---: | --- |
| Apparent new churches | 1,480 | Complete enough for a second-source or human verification pass |
| Possible duplicates | 227 | 202 repeated Overture addresses and 25 matches to an existing FaithBid research address |
| Needs more information | 184 | Low confidence, incomplete address, closed status, or address/point disagreement |

Problem counts can overlap within the 184-record bucket. These figures are a
measured acquisition result, not a certified Dallas church count. No record was
written to Supabase, and no operational FaithBid system was changed.

The practical next step is not to hand-review 1,891 rows blindly. First inspect
a stratified verification set from all three buckets, measure the error and
duplicate rates, then reconcile against at least one independent source family.
Only records that pass that evidence check should enter the canonical Dallas
directory through an admin-controlled import.

## Pass/fail checks

- Only current v2 taxonomy is used; the removed `categories` property is not.
- Non-Christian places, generic religious organizations, seminaries, and
  wedding chapels are not swept in by a broad keyword query.
- Bounding-box results outside City of Dallas are excluded.
- Existing-address and strong nearby-name matches are isolated as possible
  duplicates.
- Low-confidence, incomplete, and permanently closed records remain visible in
  `needs-more-information`.
- Every proposed bundle preserves the research-only purpose ceiling.
- No script imports the Supabase client or calls an RPC/table.

## What comes next

After the first run, measure the candidate counts and manually inspect a
representative sample from all three lists. Only after that review should an
admin-controlled import path be considered. Additional free/official source
families should then be compared to find Dallas churches Overture missed; they
must remain separate evidence rather than being silently blended into Overture.
