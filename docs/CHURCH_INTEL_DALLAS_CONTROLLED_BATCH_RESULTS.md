# Dallas Church Intelligence Controlled Batch 001 Results

**Measured:** October 3, 2026  
**Scope:** 100 high-quality Dallas candidates  
**Status:** Complete; proceed with controlled expansion  
**Production writes:** 0

## Plain-English result

The free acquisition method is working. Of 100 deliberately selected Dallas
records, 69 were directly verified as current churches or current church sites,
20 remained credible probable churches, 9 were held back for another check, and
2 were excluded.

That means 89 of 100 were useful current-or-probable research records. It does
**not** mean 89 records are automatically approved for public display, outreach,
export, or a canonical database write. Those permissions remain separate.

The batch also proved why FaithBid needs an evidence-backed Church Intelligence
layer instead of a spreadsheet dump:

- Five supplied websites belonged to the wrong institution or could not safely
  be attributed and were quarantined.
- Four IRS-supported matches contained identity conflicts. IRS corroboration
  helped find the organization but did not settle the current public identity.
- Three apparent records involved an unresolved church identity transition.
- City Cross had moved from its source address to a host church campus.
- Friendship-West's Kiest record was a secondary youth/ministry site, not its
  primary worship campus and not another church.
- St. Bartholomew's was a separate congregation worshiping at a host church site.
- Santa Clara's Calumet and West Davis addresses described one corner campus,
  not two churches.
- “Greater Faith Temple” at 2804 S Cockrell Hill was stale; the current site is
  American Legion Post 275 and was excluded.
- Texans on Mission was correctly excluded as a ministry headquarters rather
  than a congregation.

## Measured results

| Outcome | Count | Treatment |
| --- | ---: | --- |
| Verified current | 69 | Eligible for a later controlled admin promotion review |
| Probable current | 20 | Retain as research; obtain one stronger current source |
| Needs confirmation | 9 | Keep out of the trusted directory until resolved |
| Excluded | 2 | Preserve the source assertion and exclusion reason; do not publish as a church |

### Source-lane comparison

| Lane | Verified | Probable | Needs check | Excluded | Current/probable |
| --- | ---: | ---: | ---: | ---: | ---: |
| Overture + IRS support | 36 | 8 | 5 | 1 | 44/50 (88%) |
| Strong Overture only | 33 | 12 | 4 | 1 | 45/50 (90%) |

IRS evidence is useful corroboration, but it is not a promotion requirement and
does not guarantee a cleaner physical-site record. The Overture-only lane
performed slightly better in this batch because it was selected for complete,
high-confidence records with a public verification route. Neither lane is safe
for blind import.

The machine-generated summary remains local at
`work/dallas-church-acquisition/controlled-batch-001/measurement-summary.json`.
The ten evidence files remain beside it. These are ignored research artifacts,
not application code or production data.

## The minimum usable Dallas record

A record is ready for the trusted internal directory only when it has:

1. A current public-facing congregation name.
2. A physical worship or ministry site inside the City of Dallas polygon.
3. A clear site role: primary worship, additional campus, shared/host worship,
   or secondary ministry site.
4. At least one current, attributable evidence source supporting identity and
   location.
5. A verification date and simple state: `Verified`, `Probably active`,
   `Needs check`, or `Exclude`.
6. Purpose-scoped rights that remain attached to the evidence.

An institutional phone, website, email, service schedule, denomination, or
leader can improve the record, but none is required to invent a person or turn
research evidence into a CRM contact.

## Rules learned from the 100 records

1. **Overture confidence orders the work; it does not prove the result.**
2. **IRS support corroborates an organization, not a worship site or current
   public identity.**
3. **A current first-party source wins on current name, location, schedule, and
   site role.** Older values remain evidence or aliases rather than disappearing.
4. **Current official denominational or government evidence can verify a record
   when a first-party site is unavailable.**
5. **One current directory is not enough for direct verification.** It can keep a
   record probable, not trusted.
6. **Bad links are quarantined at the claim level.** A wrong website must not
   poison an otherwise valid church record.
7. **Organizations, congregations/campuses, and physical sites stay distinct.**
   A church can move, share a host, operate multiple sites, or use a secondary
   ministry building.
8. **Same address never means automatic duplicate.** It may be a host site,
   separate suite, multiple congregations, or alternate frontage for one campus.
9. **Non-congregation ministries and stale church POIs are excluded explicitly,**
   not silently deleted.
10. **Research evidence grants no outreach rights.** All 100 results remain
    limited to research, verification, and internal analytics.

## Expansion decision

**Proceed with the next controlled acquisition batch.**

The process is stable enough to review more high-quality Dallas candidates in
larger chunks, but not to bulk-publish or bulk-write the remaining universe. The
next batch should continue selecting complete, in-boundary records with a public
verification route while applying the rules above automatically wherever they
can be checked safely.

The simple operating flow is:

`Found → Verified/Probably active/Needs check/Exclude → approved internal promotion`

No “case management” vocabulary or boundary-review bureaucracy is needed in the
product. Complex evidence stays behind the record; staff should see the simple
answer and the reason.

## Reproduce the measurement

```powershell
npm run church-intel:controlled-report
npm run test:church-intel-acquisition
```

The report refuses to run unless all 100 original candidates have exactly one
matching source key and verification order, and every evidence batch preserves
the research-only purpose ceiling.
