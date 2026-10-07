import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const app = read("../src/App.jsx");
const settings = read("../src/SettingsScreen.jsx");
const consent = read("../src/LegalConsent.jsx");
const waitlist = read("../src/WaitlistScreen.jsx");
const messages = read("../src/MessagesTab.jsx");
const compare = read("../src/WorkspaceScreens.jsx");
const tokens = read("../src/index.css");
const landingStyles = read("../src/styles/landing-v2.css");
const legacyPatches = read("../src/styles/legacy-route-patches.css");

test("mobile settings tabs expose touch scrolling and real tab semantics", () => {
  assert.match(settings, /WebkitOverflowScrolling:"touch"/);
  assert.match(settings, /touchAction:"pan-x pan-y"/);
  assert.match(settings, /role="tablist" aria-label="Settings sections"/);
  assert.match(settings, /role="tab" aria-selected=/);
});

// R-2026-10-07 (VISUAL_UX_AUDIT_2026-09-30.md 15.3): the properties above
// (WebkitOverflowScrolling/touchAction) were already present and gave false
// confidence -- a simulated touch swipe on the live row still produced zero
// scrollLeft movement, matching the original audit finding exactly, even
// with those properties set. Every tab (including Danger Zone, which holds
// Sign Out) must be reachable with zero scroll gesture of any kind, not
// just theoretically scrollable.
test("mobile settings tabs wrap instead of relying on horizontal scroll to reach Danger Zone", () => {
  const mobileBlock = legacyPatches.slice(
    legacyPatches.indexOf("@media(max-width:760px){"),
    legacyPatches.indexOf("Admin viewport safety retained"),
  );
  assert.match(mobileBlock, /\.kb-settings-tabs\{[^}]*flex-wrap:wrap!important/);
  assert.match(mobileBlock, /\.kb-settings-tabs\{[^}]*overflow-x:visible!important/);
});

test("legal acknowledgement wraps safely and describes draft early-access policy honestly", () => {
  assert.match(consent, /minWidth: 0, flex: "1 1 auto"/);
  assert.match(consent, /className="kb-legal-consent-control"/);
  assert.match(tokens, /\.kb-legal-consent-row > \.kb-legal-consent-control[\s\S]*inline-size: 16px !important/);
  assert.match(consent, /current early-access/);
  assert.match(consent, /Final policies will be presented before general activation/);
  assert.doesNotMatch(consent, /I agree to FaithBid/);
});

test("Dallas acquisition forms do not suggest Nashville", () => {
  assert.match(waitlist, /placeholder="Dallas"/);
  assert.doesNotMatch(waitlist, /placeholder="Nashville"/);
});

test("marketplace gate failures terminate loading and My Work failures are retryable", () => {
  assert.match(app, /setMarketplaceGateError\([\s\S]{0,180}setMarketplaceGateLoaded\(true\)/);
  assert.match(app, /Your work couldn't load/);
  assert.match(app, /Retry My Work/);
});

test("mobile navigation does not duplicate Admin Review", () => {
  const bottomNav = app.slice(app.indexOf('<nav className="mobile-bottom-nav"'), app.indexOf('<ClickDebugOverlay'));
  assert.doesNotMatch(bottomNav, /Admin Review/);
});

test("project cards retain meaningful imagery and mobile controls remain operable", () => {
  assert.match(app, /\.kb1004-project-card\{[\s\S]{0,120}grid-template-columns:168px/);
  assert.match(app, /\.kb1005-project-card\{[\s\S]{0,120}grid-template-columns:168px/);
  assert.match(app, /kb1004-view-toggle\{display:flex\}/);
  assert.match(app, /kb1005-view-toggle\{display:flex\}/);
});

test("compare readiness starts at zero without a decision set", () => {
  assert.match(compare, /const hasDecisionSet = projectCount > 0 && vendorCount > 0/);
  assert.match(compare, /: 0;/);
});

test("mobile message composer cannot be squeezed below its content column", () => {
  assert.match(messages, /\.mt-compose textarea\{flex:1;min-width:0;width:100%/);
  assert.match(messages, /@media\(max-width:560px\)\{\.mt-compose/);
});

test("trust and merchandising copy keeps human decision boundaries visible", () => {
  assert.match(app, /Highlighted placement is not a FaithBid recommendation/);
  assert.match(app, /Preview examples — not customer endorsements/);
  assert.match(app, /!viewerCanManageProject && \(similarProjectsLoading/);
});

test("global tokens use the FaithBid palette instead of starter purple and forced dark mode", () => {
  assert.match(tokens, /--fb-forest: #1c2814/);
  assert.match(tokens, /--accent: var\(--fb-forest\)/);
  assert.doesNotMatch(tokens, /#aa3bff|#c084fc|color-scheme: light dark/);
});

test("signed-in users cannot remain on the anonymous auth screen", () => {
  assert.match(app, /if \(!authReady \|\| !currentUser \|\| screen !== "auth"\) return/);
  assert.match(app, /const fallbackSubTab = fallbackScreen === "projects"/);
});

test("mobile auth chrome keeps its wordmark and actions on one readable row", () => {
  assert.match(landingStyles, /\.fb-auth-brand \.kb-brand-logo-full[\s\S]*width: 116px !important/);
  assert.match(landingStyles, /\.fb-auth-home-link[^}]*white-space: nowrap/);
  assert.match(landingStyles, /\.fb-auth-top-actions \{ flex: 0 0 auto/);
  assert.match(app, /currentUser && screen !== "landing" && screen !== "auth"/);
});

test("church accounts cannot render the vendor-only verification flow", () => {
  assert.match(app, /screen==="verify-profile" && authReady && \(role==="vendor"/);
  assert.match(app, /LegacyDestinationRedirect nav=\{nav\} role=\{role\} kind="profile"/);
});
