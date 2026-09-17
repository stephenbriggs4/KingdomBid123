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

## 2A. Source hierarchy and how to resolve conflicts

This handoff reconciles the main materials Stephen supplied rather than treating every document as equally current.

Use this order when two sources disagree:

1. Stephen's latest explicit direction in the active conversation.
2. Current live Supabase truth and the running application.
3. The governance ledger, especially anything marked `founder_decision_required`, `legal_review_required`, or `waiting_for_real_deal`.
4. The Dallas Pilot Playbook for the manual concierge operating process.
5. The Dallas Pilot Strategy Memo for analysis, transition risks, and proposals that still require adoption.
6. The latest landing and Marketplace redesign specifications for approved visual direction.
7. Older audits and source snapshots, which are evidence to re-verify rather than instructions to replay.

The documents most relevant to the current state are:

- `FaithBid_Dallas_Pilot_Playbook_6.docx`
- `FaithBid_Dallas_Pilot_Strategy_Memo_v4.md`
- `FaithBid_UX_Remediation_Blueprint_v2.md`
- `FaithBid_Master_Audit_Prompt_for_Codex.md`
- `FaithBid_Deep_Audit_Prompt_for_Codex_2026-09-12.md`
- the two Marketplace redesign specifications
- `FaithBid_Landing_Redesign_Spec.md`
- `FaithBid_Church_Overview_Updated.docx`
- `FaithBid Final Logo.png`
- the current source, migrations, and governance ledger

The playbook is an operating guide, not legal, tax, or accounting advice. The strategy memo explicitly identifies analysis and proposals that Stephen must accept, reject, or modify. Never convert a memo recommendation into code, public copy, pricing, or a resolved governance row without a separate decision.

## 2B. Dallas pilot operating model

The first phase is a **white-glove concierge pilot for a handful of Dallas churches**, intentionally manual so the founders can learn the real matching process before automating it. The first five churches should be described as **Founding Pilot Churches**, not legal partners and not guaranteed customers.

What a Founding Pilot Church receives:

- white-glove attention;
- a curated process around one or more real needs;
- honest explanations of vendor status and fees;
- the ability to shape the product through feedback;
- no exclusivity and no obligation to select a vendor;
- no guarantee that FaithBid will always find an acceptable match.

What FaithBid asks from a pilot church:

- one real need when available;
- honest requirements, budget range, timing, and decision authority;
- explicit permission before contacting a referral or using the church's name;
- honest feedback after the shortlist, launch, and outcome;
- testimonials, referrals, names, and logos only after a successful outcome and only with a separate explicit permission request.

Do not promise pilot churches permanent discounts, special give-back percentages, guaranteed placements, or permanent benefits that have not been approved.

The pilot's strategic purpose is larger than five placements. Every manual placement should create durable assets the marketplace can inherit:

- reusable vetted vendor supply;
- real demand and category evidence;
- matching rules;
- proof requirements;
- failure cases;
- time-to-match data;
- consent patterns;
- outcome evidence;
- churches and vendors who may become reference customers.

The guiding strategic test from the memo is: **does doing this by hand deposit a durable asset the software will inherit?**

## 2C. Church discovery and sourcing model

The playbook intentionally puts relationships ahead of broad Facebook searching.

At every church discovery conversation, FaithBid should seek two things:

1. A real need, even if it is still rough.
2. A referral to a vendor the church already trusts and would vouch for.

The original six concierge starting categories are:

- cleaning;
- landscaping and grounds;
- bookkeeping and fund accounting;
- IT and church-management-system support;
- AV, media, and livestream;
- facilities, handyman, and HVAC.

The preferred first sourcing move varies by category:

- Cleaning and landscaping: church-to-church and denominational referrals.
- Bookkeeping: church treasurer referrals, fund-accounting searches, and Kingdom Advisors.
- IT and ChMS: the church's software platform and certified-partner directories.
- AV/media: specialized Facebook communities and creator networks.
- Facilities/HVAC: church referrals, congregation relationships, and existing service contractors.

Facebook is a reach and backup channel, not proof of vendor quality. Group size is less important than actual relevance and results. Before posting:

- the need must be real and paid;
- the church must have approved public sourcing;
- location, scope, and recurring/one-time language must be accurate;
- the post must not identify the church without permission;
- the group's current rules must be checked;
- the public post should move to a private conversation before details or negotiation.

Never post a hypothetical opportunity as though it exists. Never treat a Facebook response as a vetted vendor. Do not create a full vendor record until a real conversation has happened and the vendor has agreed to be considered.

The historical group inventory and church-research counts have changed during this project. At one verified checkpoint there were 16 deduplicated church prospects, 0 confirmed Founding Pilot Churches, and 4 verified DFW-relevant groups; Highland Park had a verified website while Park Cities did not. Stephen also joined additional groups afterward. Treat every count as a dated snapshot and re-verify the current Facebook membership before using it operationally. The long-term Growth Engine requirement is to capture every group Stephen is actually in, without falsely marking unverified groups as joined or pilot-relevant.

## 2D. Vendor truth labels and vetting

The pilot draws an important distinction:

- **Lead:** a person or business discovered through research, referral, or outreach. Not yet a vendor.
- **Agreed to be considered:** the lead has had a real conversation and consented to enter the process.
- **Approved or Marketplace Approved:** FaithBid reviewed the vendor and the available evidence. This is not a performance guarantee.
- **Faith Verified:** a deeper faith-alignment review signal. Its exact relationship to Marketplace Approved is still not fully settled as product language and should not be invented casually.
- **Proven:** earned only after a real completed engagement with positive evidence on file. It must never be manually implied before that outcome exists.

The church always retains the final contracting decision. The careful line established in the playbook is:

> FaithBid reviews available evidence and fit requirements, but the church remains responsible for its own contracting decision. FaithBid does not guarantee vendor performance or results.

That statement belongs in terms or the placement agreement, not repeated as visual clutter on every card.

Vetting must be proportionate to the work. Evidence can include references, insurance, licensing, business standing, category capability, and faith-alignment material where appropriate. An expired or adverse item should block approval or shortlisting until resolved.

The following categories or conditions must be held during the pilot unless Stephen and the appropriate compliance/legal reviewer approve them:

- legal services;
- investment or financial advice;
- insurance sales;
- real-estate brokerage;
- healthcare or medical services;
- private security;
- bookkeeping with unrestricted bank-account access;
- anyone with unsupervised access to children;
- IT or ChMS work touching sensitive systems without approved security review.

The application and database now contain explicit consent and category/risk gates. Preserve them. Do not let a manually selected low-risk label bypass a category that should be held.

## 2E. Canonical concierge operating flow

The playbook's ten-step operating sequence remains the clearest model for the internal concierge process:

1. **Intake:** create the organization, responsible contact, and real need.
2. **Review:** classify faith alignment, risk, category, location, budget confidence, next action, and sourcing readiness.
3. **Sourcing and shortlist:** vet candidates, record fit honestly, and present one recommendation plus one or two credible backups.
4. **Introduction and placement agreement:** only after the church chooses; record written church selection, exact pre-agreed vendor terms, and fee source.
5. **Launch:** only when work actually begins; capture real start confirmations and a check-in date.
6. **Delivery check-ins:** record health, facts, issues, and next action.
7. **Recurring confirmation:** trigger a renewal only if it was pre-agreed and the church confirms continuation at or after the agreed review date.
8. **Fees:** record invoicing and collection against the pre-agreed amount.
9. **Give-back:** calculate only from net money actually collected, verify the recipient, and retain payment evidence.
10. **Outcome and close:** record an honest outcome before closing or supporting a future Proven status.

The church declares the budget. For one-time work, the relevant amount is the total project cost. For recurring work, the concierge uses the first 12 months. If a budget could fall into two concierge bands, the playbook says to use the higher band. A vendor quote must not change the concierge fee band.

The shortlist is not a long directory. Lead with FaithBid's actual recommendation, explain why, provide one or two backups, walk the church through it, and obtain the selection in writing.

Agreement acceptance permits an introduction; it does not by itself mean the introduction fee is earned. The manual guardrail remains: do not invoice until the church and vendor have a real written commitment to proceed, such as an accepted proposal, signed contract, purchase order, or equivalent.

## 2F. Pricing and give-back — where the product actually landed

This area must not be summarized as though one universal pricing model has been approved. There are three layers of truth.

### Layer 1 — Dallas concierge playbook terms

The playbook's provisional internal Dallas Pilot Version 1 uses a fee paid by the vendor under a separate agreement, based on the church-declared budget band rather than the vendor's quote:

| Church-declared budget | Introduction fee | Optional pre-agreed renewal fee |
| --- | ---: | ---: |
| Under $5,000 | $250 | $125 |
| $5,000–$24,999 | $750 | $375 |
| $25,000–$99,999 | $1,500 | $750 |
| $100,000+ or undisclosed | Individually reviewed | Individually reviewed |

Other playbook terms:

- the exact fee is accepted in writing before introduction;
- accepting terms permits introduction, but the fee is earned only after a real written commitment to proceed;
- no fee is owed when the opportunity falls apart before any real work commitment;
- if a commitment existed but work never occurred, the playbook says not to collect on undelivered work and to credit/refund with a recorded reason;
- no introduction fee applies to a church/vendor relationship that already existed before FaithBid;
- the attribution window is 12 months and must be written into the agreement;
- a renewal can occur only once, only if accepted up front, and only after the agreed review point or the pilot's 90-day default when no initial period was named;
- the playbook describes a give-back equal to 10% of net vendor fees FaithBid actually collects.

These are **provisional concierge operating terms**, not permission to advertise a universal Marketplace rate.

### Layer 2 — older encoded Marketplace policy

The database and legacy constants previously encoded a different model:

- free Marketplace tier: 10% of payments through FaithBid, capped at $400;
- pro tier: 5%, with a lower cap in older policy/code versions;
- church rebate: 25% of FaithBid's net retained platform fee after finality conditions;
- payment trigger and finality rules tied to platform payments rather than the concierge placement agreement.

That model conflicts with the concierge on fee basis, fee flow, magnitude, renewal treatment, and give-back percentage. It also created potential founding-church and founding-vendor inequity.

### Layer 3 — current public position

**The current public position is Program under review.** The live code now says:

- churches are not charged a posting fee in the current preview;
- vendors can join and bid without charge in the current preview;
- FaithBid is not currently advertising a standard platform fee, paid vendor plan, or automatic church give-back;
- any future rates, caps, triggers, timing, refund/reversal rules, and give-back terms must be published before they apply.

This is where the public product landed. It is the correct public posture until the founder and legal decisions are resolved.

The code still contains legacy fee and rebate constants, including 10%/5% platform-fee logic and a 25% church-rebate constant. Treat those as legacy/internal policy artifacts that must not leak back into prospect-facing copy or silently activate financial behavior.

### Pricing decisions that remain open

Do not resolve these in code or prose:

- the reconciled pricing-and-promises policy across concierge and Marketplace;
- whether the long-run fee basis is flat budget-band pricing or a transaction percentage;
- whether no-bidding is a permanent FaithBid principle;
- the legal and tax character of any church give-back;
- the reconciliation between the concierge 10% give-back and the older Marketplace 25% rebate model;
- founding-church true-up treatment;
- founding-vendor credit, waiver, or other transition benefit;
- renewal treatment in the long-run Marketplace;
- refund/reversal rules and payment finality;
- public paid-plan structure.

The governance ledger correctly keeps these as founder/legal decisions. Do not mark them completed merely because the public pages now say under review.

Before collecting the first fee or paying the first give-back, the placement agreement and financial handling need real legal and accounting review. Discovery, sourcing, and vetting can proceed before that review.

## 2G. Transition from concierge to Marketplace

The strategy memo's central conclusion is that concierge should come first and Marketplace should be the long-run product. The transition should happen category by category rather than by flipping the entire platform on at once.

A category is ready to graduate when it has:

- sufficient vetted and ideally proven vendor supply;
- repeat demand;
- a matching rule that has stopped changing;
- clear evidence and risk requirements;
- a workflow that no longer depends on undocumented founder improvisation.

Cleaning was suggested as a possible first narrow vertical because it can have faster cycles, recurring demand, and lower regulatory complexity. That was strategic opinion, not a founder decision.

The strategy memo also warns against the concierge trap: manual service can become permanent unless repeat tasks are measured and productization triggers are set. Track what is done by hand, how long it takes, and what repeated three times should become a software candidate.

The pilot cannot validate the full Marketplace economics. Five placements may generate useful learning but not a statistically meaningful financial signal. Judge the early pilot primarily on learning, repeatability, time-to-shortlist, trust, outcomes, and whether churches/vendors would use FaithBid again.

Important unanswered strategic questions remain:

- failure-recovery rules when a placement goes badly;
- explicit pilot kill criteria;
- the counterfactual: would this introduction have happened without FaithBid?;
- whether Get Plugged In is a church-acquisition wedge, a separate product, or parked;
- how pilot Proven status and evidence translate into Marketplace ranking;
- how institutional church accounts survive staff turnover;
- whether the company permanently rejects bidding wars despite the FaithBid name.

## 2H. First five churches and operator discipline

The first five relationships should remain mostly manual on purpose. Track at minimum:

- church conversations;
- qualified needs;
- qualified vendors and their source;
- time from intake to shortlist;
- engagements actually started;
- fees accepted and fees actually collected;
- church and vendor satisfaction;
- repeat or recurring business.

Also track consent that does not yet have a reliable screen: permission to contact referrals, use a church's name, create a vendor record, request a testimonial, or use a church logo.

Before Church 1:

- run the full process with clearly labeled TEST records;
- do not send a real invoice, collect real money, or make a real give-back;
- archive test records and keep the audit trail;
- prepare a match-specific versioned placement agreement with the fee, renewal terms, 12-month attribution window, pre-existing-relationship exclusion, no-start treatment, and refund approach;
- keep that agreement labeled as an internal operating draft until professionally reviewed;
- decide invoicing/payment mechanics and how give-back obligations will be segregated;
- manually verify the real written work commitment before the first invoice.

The archived synthetic TEST flow proves mechanics, not market demand or delivery success. The governance ledger correctly keeps the first real church-to-close loop as `waiting_for_real_deal`.

## 2I. Landing-page direction from the supplied specifications

The public landing page should remain calm, photographic, church-first, and honest rather than hype-heavy.

Settled direction:

- photographic white/warm hero;
- `Where calling meets craft.` as the dominant statement;
- `Faith founded. Service driven.` as a small subordinate kicker, not a second hero logo;
- church access as the primary CTA and vendor application as the secondary CTA;
- hero then How It Works then A Glimpse Inside;
- a clear pre-launch/illustrative boundary;
- no invented testimonials, ratings, named churches, or outcome claims;
- preserve routes, `enterAccessFlow`, telemetry, auth, and `LAUNCHED = false` behavior;
- responsive parity across laptop, wide monitor, and phone;
- Bodoni Moda for display and DM Sans for body/UI as the target type system;
- ivory, green, and restrained gold as the core palette;
- the Faith Verified process should remain because trust is central, but its presentation should be simpler, tighter, and less box-heavy;
- public pricing and give-back language remains under review.

The older landing spec said to keep a centered wordmark lockup. Stephen's later direction superseded it: spell FaithBid in the desktop nav, remove the large centered hero wordmark, and let the headline carry the hero.

Any sample Marketplace content on the landing page must visually read as a product preview and must be labeled as illustrative rather than live inventory.

## 2J. Marketplace direction from the supplied specifications

The Marketplace redesign was a deliberate teardown of the old heavy/cinematic treatment.

Settled direction:

- preserve real data loading, Supabase queries, filters, saves, conversations, bids, and permission rules;
- remove/retire the old video hero, dark overlay, vine divider, and oversized decorative presentation;
- use a distinct photographic Marketplace header, separate from the public landing hero image;
- retain the approved search-first header and category row;
- use the live category taxonomy: All services, Facilities, Creative, Technology, Marketing, Finance, Events, Ministry Support;
- church users default to browsing vendors; vendor users default to browsing projects;
- featured rail with pointer drag, movement threshold, click suppression, arrow controls, and keyboard fallback;
- responsive all-results grid;
- light image-led cards rather than the old dark card style;
- truthful budget ranges, never corrupted computed values;
- church identity protected until permission allows disclosure;
- no fabricated stats or live inventory;
- clean empty/loading/error states;
- isolated Marketplace styling so legacy overrides do not keep breaking the new design;
- laptop and wide-monitor layouts must feel like the same composition, not a centered narrow island on a larger screen.

The first Marketplace spec's simple header recommendation was later superseded by Stephen's approval of the photographic search-first header. When the two specs differ, follow the later approved visual implementation and Stephen's live feedback.

The Marketplace body is not finished merely because preview cards render. Real inventory, real project imagery, detail navigation, save behavior, sort/filter behavior, and role/privacy states still require end-to-end verification.

## 2K. Audit state and known technical history

The deep verification audit found the core authorization model sound in the high-privilege functions it inspected. Platform-admin checks use server-controlled `app_metadata`, owner/admin checks are enforced on the server, hire confirmation checks project ownership, project publication is owner/admin gated, and bid submission checks authentication, confirmed email, approved vendor status, suspension state, project state, and bidding/invitation rules. Do not weaken those server-side checks during a UI rewrite.

RLS-enabled tables with no direct policies were determined to be an intentional deny-by-default/RPC-first pattern in the inspected areas, not an invitation to add broad client access. Preserve that pattern unless a specific data path proves it needs a narrowly scoped policy.

Several high-risk audit items were already addressed and should not be reopened without live evidence:

- release-verification marketplace fixtures were cleaned up;
- orphaned `hire_confirmations` were archived/removed with a hardened archive-first cleanup routine;
- the root cause around missing hire-confirmation referential integrity was addressed;
- fabricated Marketplace listings were removed from real routes;
- public give-back percentage claims were moved to under-review language;
- vendor relationship logic and Deal Room visual states received targeted fixes, but any claim marked previously fixed should still be live spot-checked;
- explicit vendor consent and excluded-category enforcement were added at app/database boundaries;
- taxonomy/budget translation and the governance ledger were created;
- the project-card budget corruption issue was identified and addressed in prior audit work;
- contrast work and several P3 security/hygiene items were handled;
- leaked-password protection was correctly documented as unavailable on the current Supabase plan rather than falsely marked fixed;
- Section A and the audit's verified-fixed Section D were intentionally not reworked.

Known P2/backlog themes that remain relevant:

- consolidate to one serif and one sans-serif family;
- define intentional photographic browse headers versus cream workspace headers;
- share one high-quality empty-state pattern;
- clarify Concierge/admin navigation;
- prevent Workspace-label truncation;
- keep mobile labels accessible;
- continue simplifying overbuilt customer-facing surfaces without weakening internal controls.

Get Plugged In remains a fully built but strategically unresolved second product. Its pictures must not be repurposed as Marketplace project imagery. Its role and nav prominence remain founder decisions.

The Marketplace's remaining practical bottleneck is real admitted supply and real published demand, not the existence of card UI. At the audit checkpoint there were vendor-role profiles but no eligible `public.vendors` inventory. Re-verify current counts before acting. The project-publication model itself remains a founder decision even though the owner/admin-gated publication function exists.

## 2L. Church one-pager message

The updated church overview establishes the clearest church-facing story:

- FaithBid helps churches find and vet providers for operational needs;
- the pilot is high-touch and initially free to the church;
- the church tells FaithBid what it needs;
- FaithBid finds, reviews, and introduces a short list rather than creating search-engine overload;
- the church keeps the final selection and contract decision;
- FaithBid follows through;
- early categories include websites, livestream/sound, bookkeeping, branding, IT, cleaning, landscaping, and services FaithBid can evaluate responsibly;
- give-back language should stay general unless and until the final program is approved;
- the founding churches receive attention and help shape the product;
- discovery questions about past vendor experiences, selection, recurring spend, upcoming needs, faith fit, decision authority, risk/time savings, and referrals should remain available, including on a second page if needed.

The one-pager's earlier specific or semi-specific give-back language should always be checked against the current `Program under review` public position before reuse.

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

### Approved source artwork and current visible defect

Stephen's approved source is `C:\Users\StephenBriggs\Downloads\FaithBid Final Logo.png`. It contains:

- the interlocking FB monogram;
- the FaithBid serif wordmark;
- the tagline `FAITH FOUNDED. SERVICE DRIVEN.`

The current top-left landing implementation is **not yet a faithful final lockup**. It renders `faithbid-fb-monogram.png` and then types `FaithBid` separately as a CSS-styled text span. The monogram export has a large square transparent canvas around the artwork, so normal CSS width values do not equal the visible mark's optical width. This is why the top-left brand has repeatedly appeared too small, cropped, misaligned, or surrounded by what looked like an incorrect background at different sizes. The current wordmark text also approximates the approved artwork rather than using a properly cropped canonical wordmark asset.

Treat the current top-left landing logo as unfinished even if it looks acceptable at one viewport. It must be fixed at the asset level and then verified on the actual photographic background at laptop, monitor, and phone widths.

### Recommended logo system

Use only three intentional brand presentations:

1. **Desktop public navigation:** FB monogram + `FaithBid` wordmark, side by side.
2. **Mobile public navigation:** FB monogram only when space is tight.
3. **Authenticated application navigation and sign-in:** the black `FaithBid` wordmark without a tagline, with the monogram used only where a compact mark is needed.

The photographic hero should not repeat a large brand logo. Its job is to carry the headline.

### Logo cleanup tasks

1. Inventory every logo reference before deleting anything.
2. Choose one monogram master and one wordmark master from the approved final logo.
3. Export transparent SVGs if a clean vector master is available; otherwise create tightly cropped transparent PNGs from the approved source. Remove excess transparent bounds as well as any opaque white/gray canvas.
4. Remove any baked-in gray or white canvas around the art rather than hiding it with CSS.
5. Standardize optical size, not just numeric width. The monogram and wordmark must feel related at laptop, monitor, and phone widths.
6. Create shared `BrandMark` and `BrandWordmark` components instead of repeated ad hoc `<img>` blocks.
7. Replace references surface by surface: landing nav, sign-in, authenticated nav, footer, email/print surfaces.
8. Only after all references are verified should unused legacy logo assets be archived or removed.

### Acceptance criteria for logo cleanup

- No logo has a gray rectangle or unwanted canvas behind it.
- No logo relies on a huge transparent square that makes its visible size inconsistent.
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
