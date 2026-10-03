# Dallas Church Intelligence Gold-Set Results

**Measured:** October 3, 2026  
**Scope:** 50 deliberately mixed Dallas research records  
**Status:** Complete; safe to proceed to a controlled verification batch  
**Production writes:** 0

## Plain-English result

The free Dallas discovery approach works well enough to continue, but the raw
records cannot be dumped straight into the master directory.

- Overture is a strong discovery source. Fourteen of 15 Overture-only records
  were verified or remained credible current churches.
- IRS support is useful corroboration. Fourteen of 15 Overture records that also
  matched an IRS organization were verified or remained credible.
- IRS-only addresses are poor church-site evidence. Only three of ten were useful
  Dallas leads or matches; four were outside the City of Dallas, one was not a
  church site, and two remained unresolved.
- A shared street address does **not** mean two records are duplicates. Three of
  five duplicate candidates were confirmed as separate congregations, different
  suites, or contaminated source data. The other two remain unresolved.
- Low-information records should stay out of the trusted directory until checked.
  Two of five were probable current churches; three were stale or still lacked
  current-site evidence.

This is enough evidence to move from a 50-record experiment to a controlled
100-record verification batch. It is not evidence that all 1,891 Overture points
are churches or that Dallas has exactly 1,891 churches.

## Measured results

| Lane | Sample | Result | What it means |
| --- | ---: | --- | --- |
| Overture + IRS support | 15 | 14 current/probable; 1 unresolved | Strong first batch source combination |
| Overture only | 15 | 14 current/probable; 1 identity conflict | Strong discovery source, still requires identity checks |
| Same-address candidates | 5 | 3 confirmed distinct/contaminated; 2 unresolved | Never auto-merge on address |
| Low-information Overture | 5 | 2 probable; 3 not ready | Hold until stronger evidence exists |
| IRS-only possible missing | 10 | 3 useful leads/matches; 4 outside city; 1 non-site; 2 unresolved | Use for gap finding, never as a physical-site source by itself |

The sample was intentionally weighted toward difficult cases. These lane-specific
rates are useful; one blended “accuracy percentage” would be misleading.

The machine-generated rollup is written locally to
`work/dallas-church-acquisition/verification-sample/measurement-summary.json`.
The four evidence batches remain beside it. Those local files are deliberately
ignored by Git because they are research artifacts, not application code.

## Rules learned from real Dallas records

These rules now govern the Dallas acquisition pipeline:

1. **One building may contain multiple churches.** An address match creates a
   same-site relationship to investigate; it never performs a merge.
2. **Suites matter.** Different suites at one street address remain separate sites.
3. **Current identity beats a historic building name.** Old names may survive as
   evidence or aliases, but not as a second current church.
4. **A source-link conflict is a quarantine signal.** If a record's website,
   phone, or email belongs to a different church, do not promote or merge it.
5. **Postal “Dallas” is not City of Dallas.** Physical coordinates must fall
   inside the stored City polygon. University Park, Irving, Mesquite, Duncanville,
   and other municipalities stay out even when the mailing address says Dallas.
6. **An IRS address is an organization address, not automatically a worship site.**
7. **An active congregation with no published meeting place is retained as a
   congregation lead, not invented into a physical site.**
8. **Address corrections preserve history.** Current first-party or official
   denominational evidence can correct Overture/IRS, but the old observation is
   not erased.
9. **Research rights do not become outreach rights.** Every result remains limited
   to research, verification, and internal analytics. Outreach, export, and
   redistribution stay prohibited until separately authorized by valid evidence.

## What changed in the pipeline

- Repeated Overture addresses are now labeled `unresolved_same_site` with the
  plain reason “possible duplicate or shared site.”
- No same-address record is merged, discarded, or treated as a confirmed duplicate.
- A reproducible report command now requires exactly one result for all 50 cases.
- The report command fails if a result batch loses its research-only purpose limits.
- Tests cover the same-site rule, complete sample coverage, and rights enforcement.

Run locally:

```powershell
npm run church-intel:verification-report
npm run test:church-intel-acquisition
```

## Decision

**Proceed to the first controlled 100-record verification batch.**

The batch should contain the highest-quality, complete, in-boundary records from
the two lanes that measured well: Overture records with IRS support and strong
Overture-only records. IRS-only physical-site creation, low-information records,
and unresolved same-site records should not enter this first batch.

The batch is a research list, not an import. Nothing becomes canonical, public,
exportable, or outreach-ready merely by appearing in it.

## What comes next

1. Generate the deterministic next-100 verification list.
2. Verify current identity, public name, physical Dallas site, and one usable
   institutional contact route where public evidence permits it.
3. Measure corrections, closures, shared-site relationships, and unresolved rows.
4. Repeat in controlled batches, applying the measured rules each time.
5. Only after the controlled process is stable should verified records flow into
   the private Church Intelligence domain through the approved admin path.

The end goal remains every operating Christian congregation physically located
inside the City of Dallas—not every organization with “Dallas” in its mailing
address, and not a pile of unverified directory rows.
