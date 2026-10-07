# FaithBid Context Handoff — 2026-10-07

**Branch:** `audit/p1-controls-completion`
**HEAD:** `2c1f201`
**Base:** `1eba8fc` (the state at the start of this session)
**Pushed to:** `https://github.com/stephenbriggs4/KingdomBid123.git`
**Tracked tree:** clean. Untracked files from before this session (CONTEXT_HANDOFF_*.md, audit docs, `audit_assets/`, `work/`, `src/Claude outputs/`, etc.) left untouched throughout.
**Tests:** 350 passing, 0 failing, 7 skipped (skips need live Supabase env values).
**Build:** passes.

This is a long session. Everything below actually happened and was verified — nothing here is aspirational. Where something was checked live in a browser or against the database, that's stated explicitly.

---

## 1. Six-phase launch audit — closed out

Commits `a6097dc` through `c4c8fc8`, plus follow-on fixes through `0122f80`.

- **Hire payment modal bug (real, fixed):** the Stripe fee confirmation modal only rendered on two of four routes that show the compact bid-review panel (the My Projects board and vendor-profile routes were missing it — Hire set state and nothing appeared). Fixed by one shared `stripeModalNode`, rendered on all four. Verified end-to-end in the disposable test project (`uzabgpxtrhusyoqmzlwo`): hire confirmed, DB checked (`project.status = hired`, `bid.status = hired`, $7,800).
- **My Projects filter pills:** were spilling text outside their ovals at laptop/monitor widths. Fixed, then separately **compacted** per explicit request (`1cac5d6`) — pills now size to their label instead of stretching across a fixed grid.
- **Dead code removed:** the unreachable project-completion dialog in `App.jsx` (`205fbf8`) — the *real* completion flow is in Messages (vendor "Ready for review" → church "Accept work"), verified working; the dialog code was simply never wired to anything.
- **Production security revoke, applied:** three `private.*` trigger functions (`faithbid_sync_project_bids_count_v1`, `kb_seed_cohort_gated_growth_foundations_v0`, `kb_seed_real_project_milestone_tasks_v0`) were callable by anonymous users. Revoked on production (`knkwaphosqronbhrvlsu`), verified the triggers still fire (trigger execution doesn't depend on caller EXECUTE grants). Migration file: `supabase/migrations_pending/20261006_revoke_anon_private_trigger_functions.sql`.
- **Sign-up consent gap, fixed (`b6ae30e`):** the public `#auth` screen had a "Create an account" option with **no consent checkbox and no consent record** — real compliance exposure. Fixed by showing that option only for invited sign-up (which has its own consent flow); public sign-up still works through the consent-gated Request Access and waitlist paths. Verified signed out.
- **Image/CSS weight reduced:** the Church OS parchment texture, 1.68MB → ~100KB, lossless-looking (opaque texture, no alpha channel, re-encoded JPEG, visually checked side-by-side) (`fd62177`). Byte-for-byte duplicate CSS rules removed from the main stylesheets, safe-by-construction (`f3b06b5`).
- **Full platform audit record:** `SIX_PHASE_FINAL_REPORT_2026-10-06.md` has the complete findings log, including the Supabase advisor classification, migration-drift check (found four Church Intelligence migrations already live on production — confirmed intentional via the original handoff doc, not a slip), and a dependency-audit note (two known `image-size`/`pptxgenjs` advisories, already formally reviewed and time-boxed in `scripts/check-dependency-audit.mjs`, expiring 2026-12-01 — re-review needed by then).

### Still open from this thread, all needing you specifically
- **Production backups: none exist.** Free plan. Confirmed directly in the Supabase dashboard.
- **Sentry: not wired to the real deployed site.** Only `development`/`qa`/`e2e` environments have ever sent an event — confirmed via the environment filter dropdown. The real production app has likely never had `VITE_SENTRY_DSN` set at deploy time (that's a host-platform env var, not something in this repo).
- **Where the real site is hosted: unknown.** No Vercel/Netlify/Render config anywhere in the repo; the only CI workflow just runs tests. Needed to fix the Sentry gap above.
- **Email worker: confirmed broken, not yet fixed.** `email-worker` Edge Function is deployed but **no cron job anywhere calls it** — confirmed via `cron.job`. 9 real emails have sat in `email_outbox` as `pending`, zero attempts, up to 9 days old. Fix needs the worker's existing secret (can't verify if Resend/`EMAIL_WORKER_SECRET` are even configured — CLI isn't logged in here) — **you said Resend isn't set up yet and won't be for a while, so this is correctly on hold, not forgotten.**
- **Supabase Pro:** declined (cost decision). Blocks backups and leaked-password protection.

---

## 2. Church Intelligence — the Dallas Church Census

This is the big thread. Full technical detail lives in **`CHURCH_INTELLIGENCE_BUILD_ROADMAP_2026-10-07.md`** — read that file first in any follow-up session, it is the source of truth, not this summary.

### What it actually is, as of right now
An internal, admin-only screen at `#church-intelligence` (visible in the Admin Review nav). Real schema, real RPCs, real data — not a prototype. 40 real Dallas churches loaded in **production** (`knkwaphosqronbhrvlsu`, not a test project).

### What got done today, in order

**Independence pass (Pass 2).** The 40-church gold set (loaded before this session) all traced to one research source, which the system's own rules treat as unpromotable to outreach-grade. Web-researched all 40, found a second independent source (the church's own website, or an official denomination/government record) for 22 of them — verified by query, not estimated. The other 18 got nothing forced; they're flagged by name in the roadmap doc for a human follow-up (phone/social). Two address discrepancies found in search were flagged, not silently resolved. Registered two new source types in `church_intel.source_registry` to make this provable going forward.

**Pass 1 (small, fast):** removed a hardcoded, frozen "1,962 candidates found" stat that was presented as live and never actually changed. Added a non-blocking duplicate-name warning to the "Add church" form.

**Pass 3 (map + filters — the big one):** Built against real schema facts, not assumptions:
- A real **status model** (Verified / Needs review / Boundary review / Outside Dallas / Candidate), derived entirely from fields the directory RPC already returned but the UI wasn't using — zero backend change needed for this part. One function (`churchStatus()`) feeds both the filter chips and the map marker colors.
- The **real published Dallas city-limits boundary** now draws on the map (new RPC `ci_get_boundary_geojson`, simplified from 359KB/13,415 points down to ~43KB — both numbers checked directly, not guessed).
- **Custom clustering** and a **density-view toggle**, both built with **zero new npm dependencies** on purpose (this codebase runs lean — 11 runtime deps).
- **Multi-select filters** (status, denomination) with **live faceted counts**, **3 saved-view presets**, and **filter state that round-trips through the URL hash** — all verified live, signed in as admin, against the real 40-church dataset (counts matched exactly every time: Verified 38 / Boundary review 1 / Outside Dallas 1 = 40; Verified+Baptist = 14).

**A real permissions bug found and fixed mid-build, worth remembering:** any new `ci_*` RPC added through this session's tools will fail with `permission denied for function assert_admin`, because `church_intel.assert_admin()`'s own grant is locked to `church_intel_api_owner` — a NOLOGIN/NOINHERIT role that **cannot be assumed even via `ALTER FUNCTION ... OWNER TO`** from this session's DB connection (confirmed: `must be able to SET ROLE`, this is a real, working lockdown, not a bug to route around by loosening grants). **The fix: call `church_intel.platform_admin_actor()` directly instead of `church_intel.assert_admin()`** — it's the actual check the thin wrapper delegates to, and it already grants execute to the role this session's migrations apply as. Same security check, nothing loosened. Documented in `supabase/migrations/20261007120000_church_intelligence_boundary_geojson_read.sql`.

### Deliberately not done yet (scoped out on purpose, not forgotten)
- **Council district boundaries.** Designed in full (reuses the exact same fetch/stage/publish pipeline already proven for the city boundary, `boundary_scope='district'`, zero schema migration needed — the column is already free text). Held out of Pass 3 specifically because real GIS acquisition deserves its own careful verification pass, not a rush alongside everything else. This is the next concrete Church Intelligence step if you want to continue that thread.
- Full verification-readiness model (the five-state model above is real but not the complete minimum-record gate from the original design spec).
- True coverage-gap analysis (needs a real candidate/discovery dataset first — the fake 1,962 number that would have made this possible was removed, correctly, in Pass 1).
- Evidence provenance shown on the church profile (sources, claim status, history) — the data exists, the UI doesn't surface it yet. This was flagged as the single biggest trust gap found in the whole audit: the tool currently shows facts with no way to see why it believes them.
- Review Queue as a visible screen (one real open review case exists right now and is invisible in the UI without direct SQL).

### A locked product decision from this session, worth remembering
You asked about operational signals (church website/social monitoring for job postings, renovations) and a vendor-facing church directory. Decided:
- **Website signal monitoring: a good idea, not yet built.** Church websites are public and fetchable on a schedule; social media (Facebook/Instagram) isn't freely scrapable without the account owner's own API connection, so that part is deferred.
- **A vendor-facing directory: recommended against**, and this isn't just caution — almost all the evidence in Church Intelligence is rights-scoped to `research/verification/internal_analytics`, explicitly **not** `outreach`. Handing it to vendors would use research-purpose data for business prospecting it was never cleared for, and would undercut the consent-based Marketplace model (a church posts because *they* want vendors). The better version: a signal becomes a lead for FaithBid's own Growth Engine to reach out, and if the church agrees, a real project gets posted the normal way. Full reasoning is in the roadmap doc §8.

---

## 3. A tooling note for whoever picks this up

Partway through this session, the **Bash tool stopped resolving basic commands** (`node`, `grep`, even `ls`) while `git` kept working through it. Never diagnosed further — just switched to the **PowerShell tool** for all shell work and it was reliable the rest of the session. If Bash misbehaves again, don't fight it, switch tools.

---

## 4. Recommended next steps, in order

1. **If continuing Church Intelligence:** council district boundary acquisition (the one deferred piece of Pass 3), or evidence provenance on the profile (the biggest trust gap found).
2. **If continuing the visual/UX audit:** `VISUAL_UX_AUDIT_2026-09-30.md` has more items after the two checked today (one fixed — mobile Settings tabs; one already fixed by earlier work — vendor sign-up consent checkbox). Next most concrete: the My Projects/My Work list-view card proportions, and the "My Work" blank-screen-with-no-error-state. About half of this document's findings turned out stale on re-check this session — verify live before touching anything, same as today.
3. **Needs you, not more of my work:** hosting platform identification (to fix the Sentry gap), and the email-worker fix once Resend is actually configured.
