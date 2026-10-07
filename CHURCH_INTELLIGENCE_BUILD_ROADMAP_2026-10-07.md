# Church Intelligence — Build Roadmap

**Date:** 2026-10-07
**Status:** Planning only. No code or database changes made in this pass.
**Method:** Read every existing Church Intelligence doc in the repo and Codex's output folder, then verified the claims against the live production database and the live admin screen (signed in as platform admin), rather than trusting any single document. Several things on paper turned out to be stale.

## 0. The headline correction

The most recent written plan (`CHURCH_INTELLIGENCE_DALLAS_CENSUS_REDESIGN_MAP_2026-10-02.md`) describes the *old* six-tab version (Organizations/Research Queue/Sources/Dallas Geography/System Links/Data Health) and proposes replacing it with four tabs plus a Controls area. **That six-tab version no longer exists.** The live screen today is a single-page "Dallas Churches" directory — simpler than even that plan proposed, not more complex. Someone built past that plan without updating it. This roadmap reflects what is actually live, verified today, 2026-10-07.

## 1. What is already built and working (production, verified live)

- **Schema:** all 11 `church_intel` tables, forced RLS, the `church_intel_api_owner` role, 13 `ci_*` RPCs, each gated on `church_intel.assert_admin()` → `public.kb_is_platform_admin()`. Confirmed in the live advisor and function-body audit (2026-10-06).
- **Frontend:** `src/ChurchIntelligence.jsx` (440 lines), route `#church-intelligence`, admin-gated, lazy-loaded, in the Admin Review nav. Confirmed denies non-admin access.
- **Real data, in production, not a test project:** 40 organizations, 40 campuses, 40 sites, 40 evidence claims, 4 review cases.
- **The Dallas boundary is published and current:** `dallas-city-limits-v1`, `publication_status = 'published'`. This was an open gate as of the 2026-09-30 gold-set report; it is now closed.
- **All 40 sites have been evaluated against that boundary** (`site_geo_memberships` has 40 rows). 3 of the original 4 boundary-ambiguity review cases are resolved; 1 remains open.
- **A working, real directory UI:** search (name/street/city/ZIP), denomination filter, ZIP filter, quick filters (Basics complete / Needs information / On FaithBid), list/map toggle with a real Leaflet map of the 40 loaded churches.
- **A working church profile:** address, denomination, operating status, FaithBid-account connection state, a "Find matching account" flow (`ci_suggest_faithbid_matches`), human-confirmed linking that opens a review case, links the account, and resolves the case (`ci_set_system_link` + `ci_open_review_case` + `ci_resolve_review_case`) — all three steps verified present and correctly wired.
- **A working "Add church" flow:** `ci_create_research_bundle`, with real content/extraction hashing for provenance and `allowed_purposes: ["research"]` correctly scoped.
- **Already-built acquisition scripts** (not yet run at scale): fetch Dallas boundary (used, done), fetch Overture Places, fetch IRS Dallas Christian orgs, reconcile sources, build verification sample, build controlled batches, summarize results. These exist in `package.json` and `scripts/` but have only been exercised for the 40-record gold set.

## 2. Confirmed gaps (verified against the live code and live data, not assumed)

1. **The "1,962 church candidates found" number on the live screen is hardcoded**, not derived from any real discovery pipeline (`DALLAS_RESEARCH_SNAPSHOT.candidateCount = 1962`, frozen in `ChurchIntelligence.jsx`). It will not change no matter how many real records are loaded. This is a trust problem: staff looking at this screen are seeing a number that was true (or estimated) once, on 2026-10-03, and is now presented as live.
2. **There is no Review Queue screen.** The one open boundary review case exists in the database but is not visible or actionable anywhere in the current UI. Staff cannot currently see or resolve it without direct SQL.
3. **"Basics complete" is a weak proxy** (has an address and a denomination). It does not check Dallas boundary confirmation, evidence sufficiency, or open review cases. A record can show "Basics complete" while sitting in an unresolved boundary-review case.
4. **No pagination.** The directory read is capped at 500 rows. Fine at 40 records; will silently truncate the "Dallas total" once acquisition scales past 500.
5. **Evidence independence has not progressed.** All 40 claims still trace to exactly one source family (`manual_web_research_dallas_v1`). The second `source_registry` entry that now exists is the Dallas boundary source, not a second independent source for church identity — confirmed by directly inspecting both rows. This was the other open gate in the 2026-09-30 gold-set report, and it is still open.
6. **No Coverage & Health view** — no visibility into geographic distribution, ZIP gaps, staleness, or duplicate rate.
7. **No Controls area.** Boundary staging/publishing and source-policy management were done directly via SQL/RPC this session, not through any admin screen. Fine at this scale; will not scale to routine staff use.
8. **The church profile is a solid "Church 360-lite," not full Church 360.** It shows current evidence claims as flat key/value pairs with no source attribution, no claim status (observed/promoted/superseded), no former names, no site-level detail, no boundary-membership result, and no review history. Confirmed by reading the `OrgDetail` component directly.
9. **A specific, previously-documented contract bug may still be live:** `ci_resolve_review_case` takes `p_review_id`, and the Oct 2 doc flagged at least one call site using the wrong parameter name (`p_case_id`) elsewhere in the codebase. The call site inside `ChurchIntelligence.jsx` itself is correct (uses `p_review_id`). Any other call site should be checked before relying on it.

## 3. The two acquisition gates, and where they actually stand

The 2026-09-30 gold-set report set two conditions before full Dallas acquisition (1,922 more candidates) should start:

- **Gate 1 — published City boundary polygon: CLEARED.** Published, current, and all 40 existing sites have been evaluated against it.
- **Gate 2 — a second independent source per claim: NOT CLEARED.** Still single-source-family across all 40 records.

**Recommendation: do not start full acquisition yet.** Gate 2 is the one that actually protects data quality at scale — without it, acquiring 1,922 more records just produces 1,962 single-source, unverifiable candidates instead of 40. This should be fixed on the existing 40 first (cheap, bounded, proves the independence model actually works) before it's trusted on a much larger batch.

## 4. Recommended build sequence

This supersedes the batch numbering in the 2026-10-02 doc, since Batches 1 and much of 3 are effectively already done. Numbering restarts here against the *actual* current state.

### Step 1 — Fix the honesty gap (small, no schema change)
- Replace the hardcoded `1,962` with either a removed stat (if there is no real candidate count yet) or a live read from an actual discovery/staging table once one exists. Showing a frozen number as if it's live is worse than not showing it.
- Add a visible "last refreshed" / "as of" date next to any aggregate number, per the original redesign doc's instinct — still correct even though the rest of that doc is stale.

### Step 2 — Close the independence gate (small, bounded, data work not code)
- Run a second, independent source pass against the existing 40 records only (official church website fetched directly, or a denomination finder — exactly what the gold-set report recommended). This is scoped, cheap, and directly unblocks the real decision: whether the independence model works before trusting it at scale.
- Resolve the 1 remaining open boundary review case.

### Step 3 — Make review work visible (new, small screen)
- Add a Review Queue view: list the `review_cases` rows (currently invisible), each with plain-language reason, age, and a resolve action that calls the already-correct `ci_resolve_review_case` RPC. This is UI only — the RPC and data already exist and work.

### Step 4 — Make "verified" mean something
- Replace "Basics complete" with a real readiness check: address + denomination + confirmed-inside-Dallas boundary result + no open review case. Still achievable without new tables — it's a read-model change, not a schema change, matching what the 2026-10-02 doc correctly identified.

### Step 5 — Richer profile (medium)
- Extend the organization-detail read to include source attribution per claim, claim status, and site-level detail. The data already exists in `evidence_claims`/`source_records`/`church_sites`; the RPC and UI just don't surface it yet.

### Step 6 — Show evidence provenance on the profile
- Surface each claim's source, status (observed/promoted/superseded), and observed date on the profile, instead of a flat fact list. This is the architecture's core promise, currently invisible. Data already exists; this is a read-model and UI change, no schema change.
- Add a confirm/compare step to the FaithBid-account-link flow before it commits, now that linking will happen more often as more records load.
- Add a basic duplicate-name check to "Add church" (warn, don't block, before creating a new record).

### Step 7 — Make the map a coverage instrument
- Draw the real, published Dallas boundary polygon on the map (data already exists, currently unused).
- Color markers by status once Step 4's real status model exists.
- Add clustering (needed before the next acquisition batch, not after — a few hundred unclustered points is already unreadable).
- Add the density/gap view. This is the highest-value single feature on this whole list for actually answering "where is Dallas coverage weak."

### Step 8 — Make the filters genuinely dynamic
- Replace the raw ZIP dropdown with named Dallas areas; keep ZIP as a secondary precise filter.
- Add faceted live counts per filter option.
- Convert denomination/area/status to multi-select.
- Add 2–3 saved/preset views (Needs review, Recently added, Not yet checked against FaithBid).
- Put filter state in the URL hash.

### Step 9 — Controlled-batch acquisition (only after Steps 1–2 and ideally 7's clustering are done)
- Use the already-built `church-intel:controlled-batch` scripts to acquire the next bounded tranche (the scripts already support a "controlled batch 002" pattern with a target supported-record count). Not the full 1,922 at once — another measured batch, then another gold-set-style measurement report, same discipline as before.
- Coverage & Health view becomes worth building once there's a real batch size to measure.

### Not recommended yet
- A Controls admin screen — current SQL/RPC-direct administration is fine at this scale and building UI for it now is premature.
- Full 1,922-candidate acquisition — blocked on Step 2, not on anything technical.
- Any change to Growth Engine, Concierge, Marketplace, or GPI ownership boundaries — out of scope, and every document agrees on this.

## 4a. Addendum — deeper audit pass, same day

Added after reading `OrgDetail`, the match-to-FaithBid flow, and the Add-church flow in full, plus a live check signed in as admin.

### New findings

- **The profile shows facts with no provenance.** "At a glance" (address, denomination, status) comes straight from the organization/campus/site tables, not from `evidence_claims`. "Information on file" shows only the claims that exist — for the gold-set records, that's a single `canonical_name` claim each, per the original load. A user looking at this screen cannot tell why the system believes a church's denomination or address, which is the one thing an evidence-backed research tool is supposed to show. This is a bigger gap than a missing field; it's the core value proposition not being visible.
- **The FaithBid match-and-link flow is well-built and safe**, but one click from "possible match, 73% name similarity" straight to "linked" with no side-by-side compare step. Low volume today (40 records), but worth a confirm/compare step before this is used at scale by someone less familiar with each record.
- **No duplicate check on "Add church."** Nothing stops two staff members from creating two records for the same church under slightly different names.
- **The ZIP and denomination filters are single-select, flat lists with static labels** — not faceted (the Baptist option doesn't say how many results it would produce given the other active filters), and will become unusable once the directory holds hundreds of records instead of 40.
- **The map is a locator, not an intelligence tool.** Same-color dots, no boundary line drawn (despite the real polygon existing in the database), no clustering, no way to see coverage gaps at a glance.

## 4b. The bigger picture — what would make this tab genuinely great, not just correct

The tool's actual job is to answer, at a glance: *where does Dallas coverage stand, and what should I do next.* Right now it answers "here are 40 database rows." Two specific upgrades, both requested directly:

### The map should be a coverage instrument, not a locator
- **Draw the real, published Dallas boundary polygon on the map.** The geometry already exists in `geo_boundary_versions` and is completely unused visually. This is the single highest-leverage map upgrade — it turns "where are the dots" into "which dots are inside the line, which are near it, which are outside it."
- **Color/style markers by status** (verified / needs review / boundary-ambiguous / possibly closed) instead of one flat green dot. The map becomes a quality picture, not just a map.
- **Clustering**, for when this holds hundreds or thousands of points instead of 40.
- **A density/gap view** — which parts of Dallas have been researched and which are empty. This is the single most "intelligence" feature available: it directly answers the redesign doc's original question ("where are the geographic gaps") that nothing currently answers.
- **Click-to-filter from the map itself** — draw or click an area, filter the list to it, instead of only a ZIP dropdown.

### The filters should be genuinely dynamic, not static dropdowns
- **Faceted counts.** Every filter option should show its own live count given the other active filters — "Baptist (12)" that updates as other filters change — not independent, static dropdowns.
- **Named Dallas areas instead of raw ZIP codes** (Oak Cliff, Uptown/Downtown, East Dallas, South Dallas, North Dallas, West Dallas), with ZIP kept as a secondary, precise option underneath.
- **Multi-select**, not single-select — "Baptist and non-denominational, in Oak Cliff and South Dallas, needing review" should be one filter state, not impossible.
- **Real status filters** tied to an actual verification model (Verified / Needs review / Boundary review / Possibly closed / Outside Dallas / Missing site), replacing the current weak "Basics complete."
- **Saved/preset views** — "Needs review," "Recently added," "Not yet checked against FaithBid" — one click instead of rebuilding the same filter combination every session.
- **Filter state in the URL**, so staff can link each other directly to a specific slice instead of describing it.

## 5. Decided build order, and why

**Pass 1 — Make the screen honest.** Remove the hardcoded "candidates found" stat (Step 1), add the duplicate-name check on Add-church (part of Step 6). Small, fast, zero risk, and every later improvement sits on top of a screen that currently isn't lying about one of its own numbers.

**Pass 2 — Protect data quality before scaling.** The independence pass on the existing 40 records (Step 2). Bounded and cheap, and has to happen before the next acquisition batch regardless of anything else, so it belongs early.

**Pass 3 — The two "great tool" upgrades: map and filters (Steps 7 and 8).** Requested directly, and also the two things that most determine whether staff want to use this daily versus tolerate it. Sequenced *before* the Review Queue and verification-model work, because the map and filters are the primary interface — a better map and real faceted filters make the existing 40 records immediately more useful, while a Review Queue only pays off once there's more than one case to manage.

**Pass 4 — Make "verified" and review work real.** Review Queue (Step 3), real status model (Step 4), evidence provenance on the profile (the rest of Step 6). Now that the primary interface is strong, make the underlying trust model visible and actionable.

**Pass 5 — Richer profile depth (Step 5), then the next acquisition batch (Step 9).**

## 6. What this roadmap needs from you

Nothing is blocked on missing access or unknown information — unlike the email/backups items, everything above is ready to build. Say "go" and I'll start with Pass 1.

## 7. Progress log

**Pass 1 — done, 2026-10-07.** Removed the hardcoded `DALLAS_RESEARCH_SNAPSHOT`/"Church candidates found" stat entirely (not replaced — see §0 discussion) and the stats grid went from 4 tiles to 3, with the CSS rebalanced accordingly. Added a non-blocking duplicate-name warning to Add Church: typing a name that resembles an existing directory record shows the matching church(es) with their address, without ever gating submission. Verified live, signed in as admin: the fake stat is gone, the grid looks correct, typing "First Baptist" correctly surfaces "First Baptist Church of Dallas" with address, and Cancel closes with nothing created. Tests: 343 passing, 0 failing (one existing test updated for the intentional removal, one new test added for the duplicate check and to guard that it can never block submission). Build passes.

**Pass 2 — done, 2026-10-07.** Independent-source pass on the existing 40 records, per the gold-set report's own recommendation ("pick up a second, independent source... the church's own official site... or an official denomination finder"). Data work only, no code changed.

- Registered two new source types in `church_intel.source_registry`, each with its own `independence_family_key` so the system's own independence check recognizes them as genuinely distinct from the original `manual_web_research` pass: `church_official_website_v1` (first-party, the church's own site) and `official_directory_or_record_v1` (official denomination/conference directories or government/historic records, used when no dedicated church website could be found).
- Searched all 40 churches. **22 of 40 now have real two-source-family corroboration** (verified by query, not estimated): 16 via the church's own official website, 6 via a Texas Historical Commission record or an official denomination conference directory (North Texas Conference UMC).
- Also populated `canonical_website` (an existing, previously-empty column) for the 16 churches where an official website was confirmed.
- **18 of 40 remain single-source.** No website, government record, or denomination directory turned up for them in search. Not forced — left as-is, flagged for manual follow-up (phone, social media, or an in-person check): Calvary Philadelphia Missionary Baptist Church, Casa View Assembly of God, Dallas West Church of Christ, Friendship-West Baptist Church, Golden Gate Missionary Baptist Church, Greater Calvary Baptist Church, Greater Mount Olive Baptist Church, Greater New Bethel Baptist Church, Greater New Hope Missionary Baptist Church, Lake Highlands Baptist Church, Lakewood Presbyterian Church, Metropolitan Tabernacle Baptist Church, Mount Moriah Missionary Baptist Church, Mount Olive Lutheran Church, Mt Tabor Missionary Baptist Church, Peoples Baptist Church, St. Luke Community United Methodist Church, St. Thomas Aquinas Catholic Church.
- **Two address discrepancies found, not resolved:** search results for **Greater Calvary Baptist Church** showed a possible address of 3733 Myrtle St, conflicting with our record's 509 Forsythe Dr. **Greater New Hope Missionary Baptist Church** showed a possible alternate address of 2654 Kilburn Ave, conflicting with our record's 2303 S Tyler St. Neither was used as a source; both need a human look — this may be a second congregation with a similar name, or stale data in our record.

## 7a. Pass 3, fully designed — not a sketch

Grounded in actual checks against the live schema, not assumptions. Each design decision below is backed by a specific fact found while planning this, not a guess.

### Fact-finding that changed the plan

1. **The real Dallas boundary is 13,415 points, 359 KB of raw GeoJSON.** Checked directly (`ST_NPoints`, `ST_AsGeoJSON`). Shipping that to a browser on every load is not viable. Simplified with `ST_SimplifyPreserveTopology(boundary, 0.0003)`, it's 43 KB — visually accurate at city scale, checked at the same time. This number, not a guess, sets the simplification tolerance to use.
2. **A real status dimension already exists and is already being fetched.** `ci_list_organizations_overview` already returns `dallas_membership` (`included`/`excluded`/`review`), `open_review_case_count`, `has_promoted_claim`, and `claim_count` — the frontend just isn't using most of them. This means map coloring and status filtering need **zero backend changes** — they're a frontend read-model change against data already in hand. This also means Pass 3 no longer depends on Step 4's full rework the way I sequenced it last time; a real (if not complete) status model can ship now.
3. **`site_geo_memberships.membership_result`** already holds `included` (38), `excluded` (1), `review` (1) for the 40 loaded churches — the real signal behind `dallas_membership`.
4. **No Dallas neighborhood data exists anywhere in this codebase**, confirmed by search. "Oak Cliff / Uptown"-style names, which I proposed last time, are informal and contested at the edges — not the caliber of source this system is built around (the city boundary itself is an official GIS layer, not a hand-drawn approximation). **Corrected recommendation: use Dallas's official City Council Districts instead** — government-defined, stable, and `geo_boundary_versions.boundary_scope` is free text with no constraint limiting it to `'city'`, holding only `'city'` today. Council districts can be fetched and published through the exact same mechanism already proven for the city boundary, with **zero schema migration**.

### A. Map

1. **Boundary layer.** New RPC `ci_get_boundary_geojson(p_scope text default 'city')`, admin-gated like every other `ci_*` RPC, returns `ST_AsGeoJSON(ST_SimplifyPreserveTopology(boundary, 0.0003))` for the current published version of that scope. Fetched once per session (it changes rarely), not on every filter change. Drawn as a dashed outline, no fill, under the markers.
2. **Council district boundaries**, using the same fetch-stage-publish pipeline already built for the city boundary (`ci_stage_dallas_boundary` → `ci_publish_boundary`), 14 rows with `boundary_scope='district'`, sourced from the City of Dallas's own GIS feature service (the same ArcGIS platform that already serves the city-limits layer this system cites as `city_of_dallas_gis_city_limits`).
3. **District membership per church**, computed server-side (where PostGIS already lives) by adding one field to `ci_list_organizations_overview`: `council_district`, via `ST_Contains` against the published district boundaries. Avoids pulling a geometry library into the frontend just to do point-in-polygon math the database already does better.
4. **Marker color, from data already fetched, no backend change:**
   - Red outline / hollow — `dallas_membership = 'excluded'` (outside Dallas)
   - Amber — `dallas_membership = 'review'` (boundary ambiguous)
   - Amber-adjacent — `open_review_case_count > 0` (needs review, for a different reason)
   - Green, solid — `dallas_membership = 'included'` and `open_review_case_count = 0` and `has_promoted_claim` (closest to "verified" available today, short of the full Step 4 model)
   - Gray — everything else (candidate, nothing promoted yet)
5. **Clustering: a custom lightweight implementation, not a new dependency.** `leaflet.markercluster` is the standard answer, but this codebase deliberately runs lean — 11 runtime dependencies total. A custom grid-based clustering function (group markers within a pixel-distance threshold at the current zoom, recompute on `moveend`/`zoomend` from the already-loaded rows) does the job without adding a package or a new entry to the dependency-audit gate. Real tradeoff, stated plainly: `leaflet.markercluster` is more featureful and battle-tested; custom is more code but zero new dependency surface. I'd default to custom unless you'd rather take the dependency.
6. **Density view, honestly scoped.** The deliverable is "density of what's loaded," not "true coverage gaps" — the 1,962 candidate number that would have made a real gap analysis possible was fake and was removed in Pass 1. A heatmap of 40 hand-picked points doesn't tell you where Dallas coverage is actually weak; it tells you where this sample happened to land. Real gap analysis becomes honest once a real discovery/candidate dataset exists (the next acquisition batch, or an Overture Places pull). Implementation choice, same dependency question as clustering: `leaflet.heat` (one small new package) vs. a custom canvas-based grid-density overlay (no new dependency, more code). I'd build the toggle and the custom version now, re-evaluate once there's a real candidate baseline to compare against.
7. **Click-to-filter from the map: scoped down from "draw any shape" to "click a district."** Freeform area drawing needs `leaflet-draw` plus a point-in-polygon library (`turf.js` or similar) — a real dependency and scope jump for a feature whose main value (filter to an area) is already covered by clicking a named council district, which the district-boundary work above already requires. Freeform drawing is a legitimate later enhancement, not part of this pass.

### B. Filters

1. **Council districts replace the raw ZIP dropdown**, computed server-side per §A.3. ZIP stays available as a secondary, precise filter underneath, since it's still useful for an exact lookup.
2. **Faceted live counts: client-side, correct now, with a known expiration date.** At today's scale (≤500 rows, under the existing RPC cap), the full dataset is already loaded client-side, so computing "Baptist (12)" given other active filters is a pure `useMemo`, no backend change. **This stops being true once real pagination ships** (already flagged in §2 as a gap — the 500-row cap). When that happens, faceted counts need to move server-side into an aggregate RPC. Noting this now so it isn't a surprise later, not pretending the client-side version scales forever.
3. **Multi-select**, replacing the single-value dropdowns for denomination, district, and status — a real state-model change (arrays instead of strings) and a moderate UI rework of the filter controls, not just a copy change.
4. **Real status filters**, using the exact same five-state model as the map markers (§A.4) — one model, used consistently in two places, not two different definitions of "verified."
5. **Saved views: hardcoded presets for v1, not user-saved.** True per-admin "save this filter combination" needs somewhere to persist it — either per-browser (`localStorage`, invisible to teammates, not a real team feature) or a new small shared table (real but minor schema addition). Neither is justified yet for a 40-record directory. V1 ships 3–4 fixed presets (Needs review, Recently added, Not yet independently confirmed) with zero persistence needed; "save your own" is a legitimate later ask once there's real daily multi-staff use to justify it.
6. **Filter state in the URL hash**, following the same hash-routing pattern already used elsewhere in this app. Moderate, well-precedented, not a new pattern for this codebase.

### What Pass 3 explicitly does not include, and why
- Full Step 4 verification-readiness checklist (the five-state model above is real and backend-free, but it's not the complete minimum-record gate from the original redesign spec — that still needs its own pass).
- True gap analysis (needs a real candidate dataset first).
- Freeform map area drawing (needs new dependencies for a feature districts already mostly cover).
- User-saved custom views (needs persistence not yet justified at this scale).

## 7b. Pass 3 — done, 2026-10-07

Built in two deliberately separated pieces: everything buildable and verifiable now (this section), and council-district boundary acquisition held out as its own careful follow-up (real GIS data acquisition, not rushed alongside everything else).

**Backend:** one new RPC, `ci_get_boundary_geojson(p_scope text default 'city')`, admin-gated, returns the current published boundary as simplified GeoJSON (43KB, not the raw 359KB). Applied to production, verified by direct call.

**A real bug found and fixed during this build, worth remembering for any future `ci_*` RPC:** the new function initially failed in the browser with `permission denied for function assert_admin`, even though it matched the shape of all 13 existing RPCs. Cause: `church_intel.assert_admin()`'s own EXECUTE grant is restricted to `church_intel_api_owner` only — a NOLOGIN/NOINHERIT role nothing else can assume, by design. The 13 existing RPCs are *owned by* that role (set at original creation time, through a path this session's tools can't replicate — `ALTER FUNCTION ... OWNER TO church_intel_api_owner` fails here with "must be able to SET ROLE," confirming the lockdown is real). Fix: call `church_intel.platform_admin_actor()` directly instead — the actual check `assert_admin()` just wraps, and it already grants execute to the role this migration applies as. Same security check, no grant was loosened. **Any future Church Intelligence RPC added through this session's tools should do the same** — call `platform_admin_actor()`, not `assert_admin()` — until a path exists to create functions owned by `church_intel_api_owner` directly.

**Frontend, verified live signed in as admin:**
- Five-state status model (`churchStatus()`), one function feeding both the filter chips and the map markers. Live counts matched the data exactly: Verified 38, Boundary review 1, Outside Dallas 1, Candidate 0 — totaling 40.
- Multi-select status and denomination filters with faceted live counts, confirmed combining correctly (Verified + Baptist = 14, exact).
- Three saved-view presets, confirmed one live (correctly changed only status, left denomination alone, matching its definition).
- Filter state round-trips through the URL hash via `history.replaceState` — confirmed surviving a full page reload, confirmed never touching the app's own route listener.
- The real Dallas boundary draws on the map as a dashed outline, confirmed.
- Custom clustering (no new dependency) confirmed grouping nearby points (38 churches rendered as 27 shapes).
- Density view toggle confirmed switching the legend and rendering grid cells in place of markers.
- Tests: 349 passing, 0 failing (6 new tests added for the status model, multi-select, saved views, URL state, boundary RPC, and the no-new-dependency constraint on clustering/density). Build passes.

**Deliberately not in this pass, per the design doc's own scoping (§7a):** council district boundaries and the `council_district` overview field (held out as a careful follow-up), full Step 4 verification-readiness checklist, true gap analysis, freeform map area drawing, user-saved custom views.

## 8. New idea from this session — operational signals and vendor access

Raised directly: the tool should know when a church posts a job, announces a renovation, or has other real-world activity worth acting on, and whether vendors should get a similar church directory.

**Signals (jobs, renovations, announcements): recommended, and not new scope — the original architecture docs already named "signal systems" as a deferred later phase.** Church websites are public and small enough to fetch and classify on a schedule. Social media (Facebook/Instagram) is harder: platforms require their own API access and, generally, the account owner's permission — not something to fetch freely at scale. For v1, I'd monitor each church's own website only, store social links for humans to click, and treat automated social monitoring as a later phase gated on the church connecting their own account.

**A vendor-facing church directory: not recommended, for a reasons rooted in the data's own rights model, not caution for its own sake.** Nearly everything in Church Intelligence is evidence scoped `allowed_purposes: research, verification, internal_analytics` — explicitly not `outreach`. Exposing it to vendors would use research-purpose data for a business-development purpose the evidence was never cleared for, and would turn a consent-based Marketplace (a church posts because they want vendors) into vendor-initiated prospecting of organizations that never asked to be found. The better version of the same underlying need: a signal becomes a lead for FaithBid's own team (Growth Engine) to reach out and invite the church to post a real project, which then appears in the Marketplace the normal way. This is exactly the "Connect" step the architecture already defines — it just needs signals feeding it. Not scheduled into Passes 1–9 above; worth its own planning pass once the primary interface work (map, filters) is done.

### 8a. Signal monitoring, worked through in depth (2026-10-07, later same day)

**What's actually worth detecting.** Not everything on a church site is a signal. Narrowed to what's both detectable from public text and genuinely actionable:
- Staff/job postings (facilities, operations roles especially — correlates with vendor need)
- Capital campaigns and renovation/building announcements — the single highest-value signal for FaithBid specifically
- New campus or relocation announcements
- Explicit "we need help with [physical task]" pages — weaker, but sometimes a near-literal proxy for a FaithBid project

Deliberately excluded: leadership changes, event calendars, sermon series, general news — high volume, low relevance, would drown real signals in noise.

**Fetch cadence: weekly, not daily.** Most church sites are small and static; daily polling gains nothing and starts to look like load on a small church's shared hosting. Weekly is the right default.

**Change detection before classification.** Hash fetched content (same `content_hash` pattern already used throughout this schema). Skip the LLM pass entirely when the hash hasn't changed since last check — most weeks, most sites won't have changed. This is the main cost lever, and ideally classification runs against just the diff, not the whole page, once a change is detected.

**The classification step is a real LLM call**, not a keyword search — "does this text contain a job posting, a capital-campaign/renovation announcement, or a new-campus announcement; if yes, quote the sentence." A keyword match on "renovation" would also fire on "the renovation we completed in 2019" — noise an LLM read can tell apart and a keyword match can't.

**Data model: a new, separate concept, not a new `evidence_claims` row.** `evidence_claims` is built for durable identity facts with a promotion lifecycle (observed → promoted → superseded). A signal is time-decaying, not a fact about who the church is — forcing it into that table would be a category error and would pollute the independence/promotion model. Proposed: a small `operational_signals` table (church reference, signal type, source quote, detected date, confidence, status: `new`/`reviewed`/`dismissed`/`handed_to_growth`). Evidence-backed (always cites its source page) but outside the evidence-claim lifecycle — keeps "who is this church" and "what's happening there right now" cleanly separate, matching how the rest of the architecture already separates research state from relationship state.

**False positives are the real risk, not the fetching.** An LLM misread that says "this church needs a renovation contractor" when it doesn't is worse than no signal, because it's what triggers a human (Growth Engine) to reach out. Every signal should start `new` and require a human confirm/dismiss before anything happens — reusing the same review-case pattern already built for everything else here, not inventing a new workflow.

**Legal/ethical:** respect `robots.txt`, identify the fetch as a bot in the user-agent, keep the weekly cadence specifically so this never resembles load-testing a small church's site. Same sourcing discipline already applied in the independence pass — no directory with scraping-prohibited terms, fetching only the church's own public site.

**Social media (Facebook/Instagram): still deferred, not reconsidered.** Platforms require their own API access and generally the account owner's permission — not freely fetchable at scale. v1 stores the social links for a human to click; automated monitoring is a later phase gated on the church connecting their own account.

**Priority call:** build this after council-district work and after evidence-provenance-on-profile, not before. Those two make the existing 40-church tool more trustworthy today with no new infrastructure. Signal monitoring is the first genuinely new capability (new table, a scheduled job, a real ongoing LLM-call cost) — better to build it on a tool that's already solid than bolt it onto one still mid-upgrade. Cost is small at 40 churches with change-detection skipping unchanged pages; scales roughly linearly with church count, and a real fraction of any larger batch won't have a crawlable public site at all.
