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
npm run church-intel:fetch-irs
npm run church-intel:reconcile-sources
npm run church-intel:verification-sample
npm run church-intel:verification-report
npm run church-intel:controlled-batch
npm run church-intel:controlled-report
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

The included IRS cross-check is that first independent source family. It uses
the official Texas Exempt Organizations Business Master File and limits the
extract to Dallas filing addresses with Christianity, Protestant, or Roman
Catholic NTEE codes (`X20`, `X21`, `X22`). IRS matches strengthen organization
identity; IRS-only rows remain possible organizations, never assumed church
sites. The IRS explicitly says filing addresses may be headquarters and that
churches which never applied for recognition are absent from this dataset.

The validated IRS run found 831 Dallas-filed Christian organizations. Of
those, 188 strongly matched a current Overture/FaithBid research record and 54
had ambiguous possible matches. The remaining 589 were split into 114
church-like physical-address leads and 475 organization-only leads. None of the
114 are counted as Dallas church sites until their address is geocoded, tested
against the City polygon, and verified as an operating congregation.

The verification-sample command turns the large acquisition result into one
plain 50-case working list: 15 IRS-supported Overture churches, 15
Overture-only churches, 5 possible duplicates, 5 incomplete records, and 10
possible IRS-only church leads. It is deterministic, contains no automatic
approvals, and exists to measure error before any controlled import.

The verification-report command refuses to produce a measurement unless every
gold-set case has exactly one result and every result batch preserves the
research-only purpose ceiling. Its output remains local under `work/`.

The controlled-batch command uses those measured results to create a simple
`verify-next-100` list. It selects 50 complete Overture records independently
supported by IRS organization evidence and 50 strong Overture-only records with
a public verification route. It excludes source records already used in the
completed gold set. The list is not an import and grants no canonical-write,
outreach, export, or redistribution permission.

## Controlled batch 001 result — October 3, 2026

All 100 candidates were researched and reconciled back to their exact source
keys. The measured result was 69 verified current, 20 probable current, 9 held
for another check, and 2 excluded. The Overture + IRS lane produced 44 of 50
current-or-probable records; the strong Overture-only lane produced 45 of 50.

The small difference confirms that IRS evidence is useful corroboration, not a
requirement for a usable church candidate. It also confirms that neither lane is
safe for blind import. Five bad or unattributable website links were quarantined,
and the review found moves, name changes, a shared host site, a secondary
ministry site, a same-campus dual address, identity conflicts, and a stale church
record whose current occupant is not a church.

The complete measured interpretation is in
`docs/CHURCH_INTEL_DALLAS_CONTROLLED_BATCH_RESULTS.md`. The reproducible local
summary is generated with `npm run church-intel:controlled-report`.

An exact address match is only a **same-site signal**, not proof of a duplicate.
Dallas congregations frequently share buildings or occupy different suites in
the same building. The classifier therefore labels repeated addresses as an
unresolved same-site relationship and never merges or discards either record.

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

Continue through the remaining high-quality candidates in controlled batches,
using the measured evidence rules above. Verified records can later enter a
separate admin-controlled promotion pass; probable and unresolved records stay
research-only. Additional free/official source families should be compared to
find Dallas churches Overture missed, and each source must remain separate
evidence rather than being silently blended into Overture.
