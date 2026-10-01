# FaithBid Visual / UX Audit Remediation

Date: 2026-09-30  
Branch: `audit/p1-controls-completion`  
Source audit: `VISUAL_UX_AUDIT_2026-09-30.md`

## Outcome

The audit was reread line by line and reconciled against the committed repository. Every item described as implemented below is present in one of the four local commits named in this report and is covered by source-contract tests and/or measured browser evidence. No deployment, push, production-data change, or separate FaithBid application was created. The current implementation passes the full local test suite and production build. Project-wide lint remains an existing, separately tracked debt and is not represented as passing.

## Commit reconciliation

| Commit | Scope confirmed in Git | Verification |
| --- | --- | --- |
| `baa5958` | Settings touch scrolling/tab semantics, consent copy/wrapping foundation, message-composer flex sizing, Dallas placeholder, Settings action color, shared FaithBid tokens | Source diff reviewed; targeted regression tests pass. |
| `ad668f3` | Project-card width, request failure/retry states, navigation cleanup, owner labels, trust disclosures, Compare readiness, auth redirect, support/pricing copy, similar-project placement | Source diff reviewed; targeted regression tests pass. |
| `71c1c4f` | Regression contracts for the first two implementation commits | Test diff reviewed; tests execute in the full suite. |
| `f1a9090` | Vendor-only verification guard, the measured legal-checkbox root-cause fix, and the mobile Auth-header correction | Exact 375×812 geometry measured in the running app; full suite and production build pass. |

The pre-reconciliation report had two overstatements: it said lint passed, and it treated the consent row as fixed from component wrapping alone. Both claims are corrected here.

## Implemented findings

| Audit area | Final disposition |
| --- | --- |
| Settings tab row on mobile | Added touch-safe horizontal scrolling, containment, visible edge affordance, tab semantics, selected state, and scroll-to-selected behavior. |
| Legal checkbox mobile clipping | Made the text column shrinkable and wrap-safe across every shared consent surface. |
| Project-card image collapsed to 104px | Restored a meaningful 176px desktop/laptop media column for church and vendor project cards. |
| Legacy destination stale paint | Legacy redirects now run before browser paint. Existing marketplace navigation continues to reset stale internal detail state. |
| My Work blank after timeout | Bid-load failures now become an explicit, safe, retryable state; existing records are not described as changed or lost. |
| Marketplace access check hangs | A failed access check now exits loading, remains fail-closed, explains the failure, and offers retry. |
| Duplicate React key / 500 claim | The audit's named testimonial-key diagnosis was stale; the current key already includes an index. No speculative key change was made. The full suite and build do not reproduce a 500. |
| Auth-state-blind auth page | A signed-in session cannot remain on the anonymous auth screen and returns to the role-appropriate project workspace. |
| Draft Terms / Privacy mismatch | Consent copy is now an honest early-access acknowledgement. It no longer presents draft policies as final; final policies remain an external legal-release requirement. |
| Mobile horizontal-scroll affordances | Settings includes touch scrolling and an edge fade; selected tabs center themselves. Existing responsive marketplace controls remain usable. |
| Duplicate mobile Admin Review | Removed Admin Review from the fixed bottom bar. The deliberate authenticated admin entry and internal Admin Review subnav remain. Anonymous users were never given admin access. |
| Competing visual systems | Added one FaithBid semantic color foundation and mapped shared control tokens to it. Removed the starter purple theme and automatic OS dark-theme override. Legacy aliases remain only as a compatibility layer. |
| Compare starts at 18% | Readiness is exactly 0% until at least one real project and one vendor form a decision set. |
| Post-project / owner-action ambiguity | Owner-facing `Open workspace` labels are now `Manage project`; existing canonical project routes remain unchanged. |
| Mobile tab height / hidden view buttons | Mobile project view controls remain visible and operable instead of becoming zero-size hidden focus targets. |
| Placeholder testimonial disclosure | Development-only examples now carry a prominent `Preview examples — not customer endorsements` notice and remain impossible to enable in production. |
| Invalid-link shells | Public policy and vendor-link failure states use the same FaithBid visual language, plain explanations, and a route back to FaithBid. |
| Verification copy shown to wrong role | The verification route is now vendor-only even on a direct deep link; church/member accounts return to their profile. |
| Similar projects on owner management | Similar Projects is suppressed for the project owner and remains available only where discovery is contextually useful. |
| Messages visual/mobile defects | Composer content can no longer be squeezed by attach/send controls; phone spacing and type scale were corrected. The Messages workspace retains its intentional deal-room layout. |
| Nashville placeholder | Replaced with Dallas on the Dallas pilot intake. |
| Featured/highlighted interpretation | Featured Projects and Featured Vendors now state that highlighted placement is not a FaithBid recommendation. |
| Settings primary action looks disabled | Active Settings primary actions now use FaithBid forest; disabled opacity still communicates disabled state. |

## Later-added mobile findings (§15.9a and later)

- **Terms/Privacy consent row:** the first component-only fix was insufficient. At 375px, the legacy global mobile rule `input { width: 100% !important; }` still expanded the checkbox to 258px and collapsed the label to 0px. Commit `f1a9090` gives the legal checkbox an explicit intrinsic-size exception to that winning rule. On both `#vendor-signup` and `#guest-post-project`, the checkbox now measures 16px wide, the label measures 230px wide, the row ends at x=309 inside the 375px viewport, and both policy links are visible.
- **Messages placeholder:** commit `baa5958` removes the textarea's intrinsic minimum-width squeeze, gives it the available composer column, and reduces phone-only control/padding pressure. The regression contract confirms the exact flex constraints. No production data or message was needed to test the layout contract.
- **Auth header:** commit `f1a9090` corrects the selector that previously missed the actual full wordmark, constrains the wordmark to 116px, prevents the actions from shrinking, and keeps `Back to home` on one line. At 375px the header spans x=18–342, the logo stays fully inside x=18–134, and the link produces one text line.
- **Auth bottom navigation:** no new bottom bar was added. The later audit observation is stale against the current auth boundary: logged-out Auth and logged-out About both omit authenticated app navigation, while signed-in users are redirected away from Auth. This is now consistent rather than a missing control.

## Product decisions from the audit

- **Faith Verified definition:** retained and clarified in the existing trust strip, Help glossary, and landing FAQ. It remains an additional reviewed trust signal, not a work-quality guarantee or Marketplace Approval substitute.
- **Support routing:** Help now offers Account, Marketplace, and Trust & Safety email topics, while active-project disputes stay inside the project workflow.
- **Church onboarding relationship:** the existing `title_role` intake field remains the correct minimum field; no duplicate profile concept was added.
- **Anonymous saved items:** not adopted. Canonical saves remain authenticated and owner-scoped; silently creating durable browser-only state would create privacy, synchronization, and expectation problems.
- **Join counters:** no weak raw vanity counters were introduced. Public language remains `Founding cohort — Forming` until evidence supports a count.
- **Pricing language:** standardized on current-preview truth: no posting/bid charge is advertised now, and future terms must be published before they apply. Removed the premature `No platform fee until you win` promise.
- **Dallas SEO content:** current public copy clearly identifies Dallas as the first pilot. A speculative network of city pages was not created; the audit itself marks per-city expansion as deferred.
- **QA/test record badge:** the old marketplace preview-fixture system is already removed. No badge was added to real records, and QA-only surfaces remain production-gated.
- **Separate app:** rejected. All work remains inside the existing FaithBid app, repository, authentication, deployment, and Supabase project.

## Verification evidence

- Full suite: **268 passed, 3 skipped, 0 failed** after the measured mobile corrections.
- Targeted visual/consent suite: **13 visual audit tests passed** plus the legal-consent contract.
- Lint: **not passing project-wide**; the broad pre-existing lint backlog remains a Mega Audit workstream. This visual pass does not claim to have cleared it.
- Production build: **passed**.
- Diff integrity: **passed** (`git diff --check`).
- Browser review: active Vite preview rendered the landing page, vendor application, guest church access request, Auth, and structured Help page without an error overlay. The consent and Auth fixes were verified with exact DOM geometry at 375×812.
- Production/live environment: **not changed**.
- Remote repository: **not pushed**.
- Deployment: **not performed**.

## External-only release gates

These are not code defects and cannot be truthfully completed inside the repository:

1. Legal approval and publication of final Terms and Privacy Policy.
2. Real customer testimonials, if FaithBid chooses to display testimonials in production.
3. Real usage evidence before publishing vanity counters or expansion-market claims.
4. Product approval before adding anonymous saved-item behavior or city-by-city SEO pages.

## Local commits

- `baa5958` — Unify mobile forms and FaithBid visual foundations
- `ad668f3` — Repair marketplace states and navigation clarity
- `71c1c4f` — Lock visual audit fixes with regression coverage
- `f1a9090` — Close measured mobile audit gaps

No production application is implied by these local commits.
