# FaithBid — Comprehensive Product, UX, and Engineering Handoff

**Prepared:** September 16, 2026  
**Repository:** `C:\Users\StephenBriggs\kingdombid`  
**Branch:** `audit/p1-controls-completion`  
**Current frozen commit:** `4d40f79` — `Refine landing hero and project previews`  
**Current `App.jsx`:** 52,318 lines  
**Latest delivered file:** `C:\Users\StephenBriggs\Downloads\FAITHBID_APP_0956_LANDING_HERO_PROJECT_PREVIEW_CUMULATIVE_App.jsx`

## 1. Read this first

FaithBid is moving from a heavily built, all-purpose interface toward a simpler Dallas-pilot product. The correct strategy is **not** to discard the backend. The database, authentication, consent controls, project lifecycle, bids, conversations, notifications, hire records, archival protections, and governance controls represent valuable work and should remain intact unless a specific defect is proven.

The recommended approach is:

1. Preserve the trusted backend and canonical workflow states.
2. Treat the existing UI as a source of working behaviors, not as the design that must survive.
3. Rebuild each visible surface one at a time around the smallest pilot workflow.
4. Keep illustrative preview content completely separate from real Supabase inventory.
5. Do not redesign every tab simultaneously. Finish Marketplace first, then project detail, then decide the future of Deal Rooms.

In short: **keep the engine; replace the dashboard.**

## 2. Product direction and founder intent

FaithBid is an invite-first marketplace for churches and Christian professionals. The near-term product is a small Dallas pilot, not an open national marketplace. Stephen will choose which churches to approach. The application should make those few approved churches feel supported and confident without exposing internal operational complexity.

The primary pilot journey should feel this simple:

1. A church posts a real need.
2. Relevant vendors can discover it or be invited.
3. A vendor opens a clear project page and decides whether to respond.
4. The church compares responses and starts a conversation.
5. A selected vendor and church have one simple shared workspace for messages, files, decisions, and next steps.
6. Internal controls continue to enforce consent, category eligibility, archival safety, and honest marketplace status behind the scenes.

The application should not expose every possible workflow state simply because the backend supports it.

## 3. Non-negotiable truth and governance rules

- `LAUNCHED = false` and pre-launch language must remain intact until explicitly changed.
- Do not fabricate live vendors, projects, ratings, reviews, traction, outcomes, or church participation.
- Illustrative preview records must be unmistakably illustrative, remain browser-only, and never write to Supabase or count as live inventory.
- Preserve the explicit vendor-consent gate.
- Preserve excluded-category holds and legal/insurance safeguards at both app and database boundaries.
- Do not resolve or rewrite rows marked `founder_decision_required` or `legal_review_required` in `concierge_ops.pilot_governance_decisions`.
- Do not expose a church's identity to vendors unless the existing consent/permission boundary allows it.
- Do not weaken RLS or use client-side hiding as authorization.
- Any future UPDATE-only migration must assert that the expected row count changed so silent zero-row updates cannot ship.
- Verification fixtures must remain clearly marked, archived first, and excluded from live counts.

## 4. Current code and recovery state

Recent checkpoints, newest first:

- `4d40f79` — refined landing hero hierarchy and added a new illustrative project-preview detail experience.
- `d001e9d` — built crowded draggable Marketplace previews with 24 illustrative projects and 16 illustrative vendors.
- `c7a1b92` — exposed Marketplace previews on the local project route.
- `57c230d` — restored preview project cards.
- `e45422f` — polished the photographic landing hero.
- `1da461e` — hardened saved vendors.
- `7a92381` — hardened Marketplace ordering controls.
- `3cb6f3b` — improved Marketplace semantic search.

The working tree was clean after `4d40f79` except for the user-owned, untracked directory `src/Claude outputs/`. Do not add, delete, or rewrite that directory unless Stephen explicitly requests it.

The latest production build passed. It emitted only the existing large-chunk warning.

## 5. What was most recently changed

### Landing hero

- The desktop landing navigation now pairs the FB monogram with a modest serif `FaithBid` wordmark.
- The large centered FaithBid logo lockup was removed from the hero.
- `FAITH FOUNDED. SERVICE DRIVEN.` became a small eyebrow above the headline.
- `Where calling meets craft.` is now intended to be the single dominant hero statement.
- The hero was changed to a full viewport minimum height.
- The wide-monitor photo position was aligned to the laptop crop (`center 61%`) so more of the church remains visible instead of the monitor showing a more aggressively cropped image.
- The desktop wordmark is hidden below 600px so the mobile nav can use the monogram without crowding.
- Routes, CTA actions, launch behavior, and telemetry were not intentionally changed.

### Marketplace preview inventory

- The local development preview has 24 illustrative project records and 16 illustrative vendor records.
- Featured rows use drag-to-scroll behavior and arrow controls.
- Card geometry was aligned between the featured rail and all-project grid.
- Preview fixtures are local-only and must stay isolated from live Supabase data.
- The old development-preview banner was removed to reclaim vertical space.

### Illustrative project detail

- Clicking an illustrative project can open a new clean preview detail surface.
- The preview detail includes an explicit `Illustrative preview · Not a live project` truth label.
- It shows the image, category, status, title, location, timeline, description, budget, response snapshot, expected scope, and a short explanation of how real projects work.
- This is a design prototype only. It is not the final live project-detail implementation.

## 6. Logo and brand cleanup — still required

Logo work has accumulated through several iterations and needs a deliberate consolidation pass. Current public assets include:

- `public/logos/faithbid-final-wordmark.png`
- `public/logos/faithbid-fb-monogram.png`
- `public/logos/faithbid-logo-dark.png`
- `public/logos/faithbid-logo-full.png`
- `public/logos/faithbid-logo-mark.png`
- `public/logos/faithbid-logo-home.png`
- `public/logos/faithbid-wordmark-black-v2.png`
- older `kingdom-logo-*` assets

### Recommended logo system

Use only three intentional brand presentations:

1. **Desktop public navigation:** FB monogram + `FaithBid` wordmark, side by side.
2. **Mobile public navigation:** FB monogram only when space is tight.
3. **Authenticated application navigation and sign-in:** the black `FaithBid` wordmark without a tagline, with the monogram used only where a compact mark is needed.

The photographic hero should not repeat a large brand logo. Its job is to carry the headline.

### Logo cleanup tasks

1. Inventory every logo reference before deleting anything.
2. Choose one monogram master and one wordmark master from the approved final logo.
3. Export transparent SVGs if a clean vector master is available; otherwise use tightly cropped transparent PNGs.
4. Remove any baked-in gray or white canvas around the art rather than hiding it with CSS.
5. Standardize optical size, not just numeric width. The monogram and wordmark must feel related at laptop, monitor, and phone widths.
6. Create shared `BrandMark` and `BrandWordmark` components instead of repeated ad hoc `<img>` blocks.
7. Replace references surface by surface: landing nav, sign-in, authenticated nav, footer, email/print surfaces.
8. Only after all references are verified should unused legacy logo assets be archived or removed.

### Acceptance criteria for logo cleanup

- No logo has a gray rectangle or unwanted canvas behind it.
- The nav logo has identical optical scale on laptop and wide monitor.
- The desktop public nav spells `FaithBid`; mobile can collapse to the monogram.
- Sign-in uses the same wordmark family as the landing nav.
- The hero contains one dominant statement and no redundant large logo.
- No old KingdomBid mark appears anywhere visible.

## 7. Project-card image correction — high priority

Stephen's requested direction is explicit: **project cards must use the original project pictures stored with the project in Supabase, not Get Plugged In images and not unrelated category stock images.**

### Exact current problem

The code already preserves these possible persisted fields in `normalizeProjectEntity()`:

- `hero_image`
- `image_url`
- `thumb_url`
- `media`
- `gallery`

However, the current `getProjectHeroImage()` resolver ignores those stored fields and returns a category-level `CATEGORY_HERO` stock image. Separately, the browser-only preview fixtures use `/gpi/volunteer.jpg`, `/gpi/creative.jpg`, `/gpi/professional.jpg`, `/gpi/worship.jpg`, `/gpi/mentoring.jpg`, and `/gpi/outreach.jpg`. Those `/gpi/*` files are Get Plugged In imagery and should not be the visual source for project cards.

There is also an older comment saying project image slots were intentionally reset until a church-first photo library was rebuilt. That historical reset should no longer control real project cards once the project itself has valid media.

### Required resolution order

For every real project card and project detail page, resolve media in this order:

1. Valid persisted project `hero_image`.
2. Valid persisted project `image_url`.
3. Valid persisted project `thumb_url`.
4. First valid item in persisted `media` or `gallery`.
5. A restrained neutral/category fallback only if the project has no uploaded image.

Do not use Get Plugged In imagery as a project fallback.

### Supabase checks before implementation

Before changing code, re-verify the live `public.projects` shape and sample rows. Determine whether the stored value is:

- a complete public URL,
- a Supabase Storage object path requiring `getPublicUrl`, or
- a private object path requiring a short-lived signed URL.

Then confirm that every project query used by Marketplace selects the canonical image fields. A correct resolver cannot display an image field that the query omitted.

If project media is private, do not make the bucket public merely for convenience. Generate signed URLs through the existing safe media boundary and keep storage policies scoped to the owning church and authorized viewers.

### Preview fixtures

The preview inventory should eventually use either:

- a dedicated `/marketplace-preview/*` asset set, or
- neutral generated project-context images clearly isolated from Get Plugged In.

Preview fixtures must continue to carry the illustrative truth label and must never be inserted into Supabase.

### Image acceptance criteria

- A real project with a Supabase image shows that exact image on every card surface and detail surface.
- The same project never changes to a random category photo between views.
- A project without an image shows one intentional neutral fallback.
- `/gpi/*` does not appear in Marketplace project-card or project-detail image resolution.
- Broken or unauthorized URLs degrade to the neutral fallback without breaking card layout.
- Laptop, wide monitor, and mobile preserve consistent crops with `object-fit: cover` and intentional `object-position`.

## 8. Project cards and project-detail UX recommendation

### Recommendation: use a dedicated project page as the primary experience

A dedicated page is better than a modal for FaithBid's real project details.

Why:

- Project details are decision-heavy and will eventually include scope, budget, timeline, attachments, questions, saved state, proposals, and permissions.
- A real route or route-like state can be linked, refreshed, bookmarked, and restored after sign-in.
- It works better on mobile than a large modal.
- Browser back behavior is predictable.
- It gives accessibility tools a stable document structure.
- It can grow without turning into an oversized pop-up.

A small **quick-view drawer** can be added later for fast browsing, but it should not become the canonical project experience. The card arrow/title should open the full page. The optional quick view should have a clear `View full project` action.

### The new live project page should start simple

Do not port the existing overbuilt project-detail screen wholesale. Build a clean V1 with:

1. Back to Marketplace.
2. Real project image.
3. Category and honest project status.
4. Project title.
5. Location, timeline, and budget.
6. Short overview.
7. Scope/deliverables.
8. Attachments if present.
9. Church identity only at the consent level allowed for that viewer.
10. One role-appropriate primary action:
    - vendor: respond, ask a question, or sign in;
    - church: edit/manage the project;
    - unrelated viewer: no privileged action.
11. One small trust/safety note.

Do not put project operations, milestone management, dispute handling, internal quality scores, pipeline analytics, all bid details, and every lifecycle action above the fold.

### Preserve from the existing backend

- project IDs and ownership;
- lifecycle/status fields;
- category eligibility and excluded-category holds;
- church-identity consent rules;
- saved-project records;
- bids and proposal ownership;
- conversations and vendor/project pair logic;
- notifications;
- hire confirmations;
- project activity/audit history;
- archival behavior;
- existing safe navigation targets used after authentication.

### Project-detail implementation sequence

1. Document the canonical live project data contract.
2. Build one new `MarketplaceProjectDetail` component against normalized real data.
3. Add a stable project URL/hash state such as `#projects/<project-id>` or the closest compatible route supported by the existing navigator.
4. Wire all project cards to that one destination.
5. Keep the old detail component available behind a temporary fallback until the new page passes the complete pilot flow.
6. Verify church, vendor, admin, signed-out, missing-project, archived-project, and unauthorized-project behavior.
7. Remove the old presentation only after parity is proven.

## 9. Marketplace redesign boundary

Marketplace should remain the current focus. Its header, search, category row, featured rail, and main card grid are the strongest direction established so far.

The next work should refine the body without destabilizing the header Stephen approved.

### Keep

- the shared photographic/search-first header;
- the existing live category taxonomy: All services, Facilities, Creative, Technology, Marketing, Finance, Events, Ministry Support;
- featured/newest/nearby concepts, with unavailable modes honestly disabled;
- accessible card buttons and links;
- real saved-vendor persistence;
- truthful empty states;
- local illustrative preview separation;
- laptop/monitor geometry parity as a required acceptance check.

### Simplify

- reduce competing labels and internal state language;
- avoid exposing operational jargon on public/browse cards;
- keep one clear card action;
- use consistent card dimensions between rails and grids;
- keep the featured rail draggable with visible keyboard/arrow alternatives;
- remove old Marketplace CSS only after every live surface has moved to the new components.

### Featured logic still needing product definition

- `Featured` needs an explicit curation/sponsorship rule and must be flagged for founder decision if commercial placement is involved.
- `Newest` should use an agreed timestamp, preferably profile admission/join date rather than arbitrary activity unless clearly labeled.
- `Nearby` requires a canonical church location and real distance calculation.
- `Best match` must retain a documented scoring definition; do not silently change weights.
- `Faith Verified` versus `Marketplace Approved` remains a naming/governance decision. Do not invent a new tier.

## 10. Deal Rooms recommendation

Stephen believes the current Deal Rooms experience is overbuilt and may not want it as a top-level tab. That instinct is reasonable for the pilot.

### Recommendation

**Preserve the Deal Room backend, but remove the obligation to preserve the current Deal Room UI.**

For the pilot, make the shared workspace contextual:

- Before a relationship exists: use the project page and a simple question/response flow.
- Once a conversation, invitation, bid, or hire exists: expose a `Messages` or `Project workspace` action from the relevant project.
- After hire: the same workspace can show messages, essential files, the agreed scope, and the single next action.

This makes Deal Rooms a capability, not necessarily a permanent top-level destination.

### Do not delete yet

Do not delete or rewrite the underlying tables/functions for:

- conversations;
- messages;
- project-vendor links;
- invites;
- bids;
- hire confirmations;
- project workspace/operations snapshots;
- notifications;
- files and signed URLs;
- activity feeds;
- lifecycle transitions;
- dispute records.

These are hard-won backend capabilities. The UI can become dramatically simpler while continuing to use them.

### Pilot alternatives to evaluate

**Option A — Contextual workspace (recommended):** remove Deal Rooms from the primary nav, and open the workspace from a project card/detail, My Projects, or notifications.

**Option B — Rename to Messages:** keep a top-level destination but strip it down to conversation list + selected conversation, with project context shown inside.

**Option C — Keep Deal Rooms:** only if pilot testing proves users need a separate hub. If retained, rebuild it from zero around active relationships, not every internal state.

### Recommended pilot V1 workspace

- relationship/project header;
- conversation;
- essential attachments;
- concise agreed-scope summary;
- one `Next step` area;
- role-appropriate action;
- archived/completed state.

Hide advanced operations until they are needed. Do not present a miniature project-management suite to a church using FaithBid for the first time.

## 11. Backend-preserving UI rebuild strategy

The safest rebuild pattern is an adapter layer:

1. Keep `normalizeProjectEntity`, vendor normalization, canonical deal-state derivation, permission checks, and Supabase service functions.
2. Define small view models for each new surface.
3. Make new components consume those view models instead of reading dozens of raw fields directly.
4. Route actions through existing service functions rather than embedding new database writes in visual components.
5. Put the new UI behind a temporary internal feature flag or component boundary.
6. Verify against live/rolled-back synthetic data before removing old components.

Suggested view models:

- `MarketplaceProjectCardModel`
- `MarketplaceProjectDetailModel`
- `MarketplaceVendorCardModel`
- `ProjectRelationshipSummaryModel`
- `ProjectWorkspaceModel`

Each should contain only what the screen needs. This reduces the chance that the new UI becomes as overbuilt as the old one.

## 12. Recommended order of work

### Phase 0 — protect the current baseline

- Confirm commit `4d40f79` exists locally.
- Preserve `FAITHBID_APP_0956_LANDING_HERO_PROJECT_PREVIEW_CUMULATIVE_App.jsx` in Downloads.
- Do not stage `src/Claude outputs/` accidentally.
- Re-verify the development server and current routes before new edits.

### Phase 1 — logo cleanup

- Inventory references.
- Select canonical monogram and wordmark.
- Fix transparent bounds.
- Add reusable brand components.
- Apply to landing nav, sign-in, authenticated nav, and footer.
- Verify laptop, wide monitor, and phone.

### Phase 2 — real project media

- Inspect live project rows and Storage URLs.
- Confirm all project queries include media fields.
- Change `getProjectHeroImage()` to prefer persisted project media.
- Remove `/gpi/*` from project previews/cards.
- Add one neutral fallback.
- Prove a real Supabase project image across card and detail views.

### Phase 3 — new live project detail

- Freeze the old detail component.
- Build the simple dedicated page against the real project model.
- Wire card navigation.
- Verify permissions and all role states.
- Keep an optional quick-view drawer as future enhancement, not the primary surface.

### Phase 4 — finish Marketplace body

- Finalize card content density.
- Verify feature/newest/nearby behavior.
- Verify saving, sorting, filtering, keyboard access, drag behavior, empty states, and matching laptop/monitor geometry.
- Remove preview-specific visual compromises that should not ship to pilot users.

### Phase 5 — decide Deal Rooms navigation

- Observe the pilot workflow and choose contextual workspace, Messages, or a rebuilt hub.
- Default recommendation: remove Deal Rooms from the primary nav and reach it contextually.
- Rebuild the workspace presentation while preserving the backend.

### Phase 6 — clean legacy UI/CSS

- Remove retired components only after new flows pass.
- Consolidate typography to Bodoni Moda + DM Sans.
- Reduce legacy CSS and inline style overrides.
- Verify no old brand marks or old dark cards remain.

## 13. Acceptance matrix for every major UI pass

Every new Marketplace/project/workspace item should be checked at:

- laptop: approximately 1366×768 or 1440×900;
- wide monitor: 1920×1080 and, when relevant, 2560×1440;
- phone: approximately 390×844.

Also verify:

- no horizontal overflow;
- keyboard access and visible focus;
- reduced-motion behavior;
- loading, empty, error, unauthorized, archived, and missing-record states;
- honest copy for pre-launch and illustrative content;
- no console errors;
- production build;
- Supabase row ownership and RLS behavior for any changed data path;
- no regression to consent, excluded-category, fixture, or governance controls.

## 14. Immediate next task recommendation

The next agent should **not** start by redesigning Deal Rooms. Start with the two foundations that affect every visible surface:

1. Complete the logo inventory and canonical brand-component cleanup.
2. Correct the project-image resolver and query contract so real Supabase project photos become the single source for real Marketplace cards and the new project page.

Then build the simplified dedicated project-detail page. This will establish the design language and interaction model that a later contextual project workspace can inherit.

## 15. Concise decisions for Stephen

- **Keep the backend?** Yes. It is valuable and includes safety controls that should not be rebuilt casually.
- **Start the UI/UX over?** Yes, selectively—Marketplace/project detail first, then the shared workspace.
- **Project page or pop-up?** Dedicated project page as the canonical experience. Consider a small quick-view drawer later.
- **Keep Deal Rooms as a top-level tab?** Probably not for the pilot. Preserve its backend and expose the workspace contextually from a project, My Projects, or notifications.
- **Use Supabase project pictures?** Yes. Persisted project media must outrank all stock/category fallbacks.
- **Use Get Plugged In pictures for project cards?** No.
- **Delete existing Deal Room/project backend?** No.
- **Redesign everything at once?** No. Finish one complete church/vendor journey at a time.

## 16. Installation command for the current cumulative App.jsx

```powershell
Copy-Item "$env:USERPROFILE\Downloads\FAITHBID_APP_0956_LANDING_HERO_PROJECT_PREVIEW_CUMULATIVE_App.jsx" ".\src\App.jsx" -Force
npm run dev -- --port 5174 --strictPort
```

---

This document is context and recommended direction. It does not authorize changes to founder/legal governance decisions, live Supabase records, or access policies without Stephen's explicit instruction.
