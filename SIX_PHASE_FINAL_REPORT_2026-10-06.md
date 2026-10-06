# FaithBid Six-Phase Final Report

**Date:** 2026-10-06
**Branch:** `audit/p1-controls-completion`
**Base commit:** `1eba8fc` (Hide placeholder testimonials by default)
**Uncommitted changes:** `src/App.jsx` only (not committed, not pushed, not deployed)

## Decision

**Release recommendation: HOLD** on the remaining checks below. Hire is now verified end to end in the disposable test project.

## Changes made in this pass

1. **Hire payment modal on the compact bid-review route** (`src/App.jsx`, `ProjectsScreen`)
   - Codex's patch (`hire-modal-route.patch`) applied as written.
   - One shared `stripeModalNode` now renders in the `bids`, `detail`, board, and vendor-profile routes. The board route was the gap: the compact review opens from My Projects cards there, and Hire set state with no modal.
   - `confirmHire` is still the only path that completes a hire.
   - Tests: `tests/bid-review-hire-modal-route.test.mjs` (Codex) and `tests/hire-stripe-modal-board-route.test.mjs` (checks every route that renders the review also renders the modal).
2. **My Projects filter pills** (`src/App.jsx`, `kb1005` CSS block)
   - Pills wrap their label instead of clipping or spilling out of the oval.
   - Between 821px and 1180px the side panel stacks below the list so the search and sort row fits.
   - Tests: `tests/my-projects-filter-pills-wrap.test.mjs`.

## Verification

| Check | Result |
|---|---|
| `npm test` | 339 passing, 0 failing, 7 skipped (skips need Supabase environment values) |
| `npm run build` | Passes |
| Pill layout, desktop widths 1024 / 1280 / 1366 / 1440 / 1920 | No overflow |
| Post-a-project validation (test server, empty submit, not saved) | "Add a project title." shown as role=alert |
| Pill layout, 375px | No overflow; Messages tab renders with no page overflow |
| Hire flow in the test project (QA church + QA vendor bid) | Modal appears above the review; confirming writes hired status. DB check: project `hired`, bid `hired`, $7,800. |

## Phase status

- **Phase 1, core marketplace flows:** Verified in the test project (church publish, vendor onboarding, bid submit, bid review, hire). Remaining navigation checks listed below.
- **Phase 2, Hire and payment:** Defect fixed (modal now renders on every route that shows the compact review). Verified in the test project: hire confirmed, DB status checked.
- **Phase 3, remaining launch flows:** Pending. First-run onboarding needs a disposable account; public forms were not submitted.
- **Phase 4, performance:** Build passes. Main bundle is large (about 4.16 MB minified, 1.11 MB gzip). Code splitting is ruled out by standing decision, so this is recorded as residual risk, not waived.
- **Phase 5, mobile:** My Projects and Messages checked at 375px and desktop widths. Post-a-project: required-title validation verified on the test server (empty submit shows an alert, nothing saved).
- **Phase 6, Supabase security and close-out:** Advisor findings from the earlier checkpoint are not yet classified one by one. This is required before release.

## Open items before release

1. Classification of each Supabase advisor finding (mutable search paths, executable `SECURITY DEFINER` functions, leaked-password protection, RLS without policy).
2. Remaining church and vendor navigation checks.

## Environment and safety

- Production Supabase (`knkwaphosqronbhrvlsu`): read-only checks only. No writes, no hires, no account changes.
- Test project QA church account: password reset in the disposable test project only, for the browser check. The test project is not production.
- Disposable Supabase (`uzabgpxtrhusyoqmzlwo`): schema copy and test-flow work only. No production migrations applied.
- Growth Engine and Church Toolkit: not changed.
- Admin behavior and authorization: not changed.
- Untracked files from before this pass: left in place.
- No commits, pushes, or deploys.

## Not verified in this pass

- Hire on the production database (not run, by decision).

## Supabase advisor classification (read-only)

Production security advisor: 513 findings across 5 lint types. Test project advisor: 593 findings (its schema copy includes more functions). Each lint type is classified below. No production changes were made.

| Lint | Production count | Classification | Action |
|---|---|---|---|
| `rls_enabled_no_policy` (INFO) | 126 | Expected. Private tables (for example `church_intel.*`) are deny-by-default for browser roles and reached only through audited RPCs. | None. Re-check the list before release. |
| `authenticated_security_definer_function_executable` (WARN) | 373 | Reviewed in sample and by body. The 66 functions that matched a naive "no check" pattern were re-checked with the real gate helpers. Remaining unclear: `tk_list_workflow_templates` (static catalog, safe), `marketplace_service_submit_church_feedback` (checks `auth.uid()` = hired vendor, safe), `kb_profiles_public` (public vendor fields by design). Church Intelligence `ci_*` RPCs gate on `church_intel.assert_admin()`. Toolkit `tk_*` RPCs gate on `toolkit_core.is_member` / `kids_team` / `can_read_channel`. | No change now. Full per-function review is still open. |
| `anon_security_definer_function_executable` (WARN) | 13 (18 by direct query) | Intended public surfaces: vendor reference survey and response submit (token-based), ambassador/partner/waitlist forms (validated), `tk_public_*` connect/event/group forms (validated with honeypot). | Confirm `tk_public_*_info` reads by slug are intended. |
| Anonymous-executable `private.*` functions | 5 (14 in test copy) | Three write data: `faithbid_sync_project_bids_count_v1`, `kb_seed_cohort_gated_growth_foundations_v0`, `kb_seed_real_project_milestone_tasks_v0`. Anonymous users can call them directly; the `private` schema is normally not exposed by the REST API, so the practical risk is lower, but it is defense-in-depth. | **Needs approval:** revoke `anon` execute on these three. |
| `auth_leaked_password_protection` (WARN) | 1 | Account setting, not code. Enabling it blocks known-breached passwords. | **Needs your decision** (dashboard setting). |
| `function_search_path_mutable` (WARN) | 0 in production; 3 in test copy | Test-copy only. | None for production. |

**Open before release**
1. Approve or decline revoking `anon` execute on the three writing `private.*` functions.
2. Decide on enabling leaked-password protection.
3. Confirm the `tk_public_*_info` reads by slug are intended.
4. Full review of the 373 authenticated definer functions (sampled and gated by helper; not each one line by line).

## Church navigation sweep (test server, church QA account)

| Screen | Result |
|---|---|
| My Projects (Active, Completed, Drafts, Archived, Messages) | Loads; no horizontal overflow |
| Profile (with Feedback tab) | Loads; no horizontal overflow |
| Marketplace (Vendors, Projects tabs) | Loads; no horizontal overflow |
| Church Toolkit | Test copy incomplete: `tk_my_workspaces` missing from the test schema, so it shows a connection error. Out of scope; not changed. Production Toolkit functions exist per the advisor. |

## Approved change: revoke anonymous execute on three private trigger functions

- Migration: `supabase/migrations_pending/20261006_revoke_anon_private_trigger_functions.sql` (untracked, not in the live migrations folder).
- Applied to the **test project** (`uzabgpxtrhusyoqmzlwo`). Verified: `anon` can no longer execute the three functions, and each still has its trigger attached.
- **Not applied to production.** The standing rule is no production migrations without a separate go-ahead. To apply it, say "apply to production".
- The app does not call these functions directly; they run only as triggers.

## Six-phase close-out (this pass)

**Phase 1, marketplace launch readiness:** Verified in the test project: church publish, vendor onboarding, bid submit, bid review, Hire, Confirm work started, vendor feedback. Advisor classification done (see above). Open: leaked-password setting (your decision); confirm `tk_public_*` slug reads; production revoke only on your "apply to production."

**Phase 2, first-time onboarding:** Partly verified. Vendor Charter onboarding was completed in the test project earlier. The church first-login gate is in code (App.jsx ~20606 and ~55790–55821; AccountScreens ~268). No automated test covers the first-login gate, and a fresh church first login was not browser-tested (no new accounts, by your instruction).

**Phase 3, end-to-end flows:** Church bid → review → Hire → work started → vendor feedback saved (test project; `church_feedback` row stored with tags "Clear scope" and "Organized"). Completion was set directly in the test database (no UI path found, see finding below).

**Phase 4, performance (no code splitting):** Production build: main JavaScript bundle 4,162 kB minified, 1,115 kB gzipped; 20 JavaScript chunks in total. Cold load of the signed-out landing page (production build, read-only, 3 runs): load event about 1.07 s, content visible about 1.96 s, 2 JavaScript files totalling about 4.07 MB transferred (uncompressed in the preview server).

**Phase 5, core mobile usability (375 px):** Verified with no horizontal overflow: My Projects, Messages, Marketplace, Profile, Post-a-project form (inputs inside the screen). Pill labels wrap inside their ovals.

**Phase 6, close-out:** This report, tests, and build below.

### Findings to act on

1. **No UI trigger found for marking a project complete.** `setConfirmCompleteId` is declared and read by the confirm dialog, but nothing in the source sets it. The completion dialog therefore cannot open. This blocks the normal "complete → review" path for real churches. **Needs a fix (not applied; App.jsx is a launch-critical file, so confirm before patching).**
2. Feedback dialog stayed open after a successful save in the automated run. The row was saved. Not verified visually.
3. Church Toolkit on the test copy is incomplete (`tk_my_workspaces` missing). Out of scope.

### Test-data changes made (test project only)

- QA church and QA vendor passwords reset (test accounts only; passwords kept in a local file in the temp folder).
- QA project status set to `completed` directly in the test database, because the completion control could not be found.
- One `church_feedback` row created for the QA project.

### Verification

- Performance numbers: see Phase 4.
- Tests and build: run at the end of this pass (see the result line in the session reply).

## Correction and completion-path verification

- **The earlier "no UI path to mark a project complete" finding was wrong.** Completion lives in Messages: the vendor sends the work for review ("Ready for review"), and the church accepts it ("Accept work"). The old completion dialog in App.jsx is dead code, but it does not block the real flow.
- Verified in the test project through the UI: vendor "Ready for review" set `completion_requested_at`; church "Accept work" (after the browser confirmation prompt) set `status = completed` and `completed_at`.
- The `window.confirm` prompt in `src/MessagesTab.jsx` (line 362) is a native browser dialog. Automated browser sessions can dismiss it silently, so automated checks must accept it. Real users see it normally.
- Cleanup candidate (not launch-blocking): remove the dead completion dialog and `setConfirmCompleteId` wiring in `src/App.jsx`.

## Final decisions (close-out)

- **Production revoke: APPLIED** to `knkwaphosqronbhrvlsu` (same migration as the test project). Verified: `anon` cannot execute the three `private.*` trigger functions, and each trigger is still attached.
- **Leaked-password protection: skipped.** It requires Supabase Pro. Remains a known gap.
- **Dead completion-dialog cleanup in `src/App.jsx`: deferred** to a later change. The real completion flow works.
- **First-time church onboarding (phase 2): accepted as a known gap.** The vendor onboarding is verified; the church first-login path is code-only and not browser-tested.
- **Church Toolkit: excluded** from this release decision (out of scope; not on the marketplace path).
- **Release recommendation:** Marketplace path verified end to end in the test project. Release is a go on the marketplace if the first-login gap is accepted.
