import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

// R-65 (2026-09-29): the wordmark asset is no longer a separate
// /logos/faithbid-final-wordmark.png file -- it's embedded directly as a
// base64 data URI (FAITHBID_LOGO_FULL, "embedded here so the cumulative
// App.jsx remains self-contained"). The kicker text also dropped the
// "FaithBid — " prefix, since the wordmark image above it already shows
// "FaithBid" -- the prefix was redundant, not missing.
test("landing hero uses the approved concise headline without changing the lockup", () => {
  assert.match(source, />Where calling meets craft\.<\/h1>/);
  assert.match(source, /const FAITHBID_LOGO_FULL = "data:image\/png;base64,/);
  assert.match(source, /maskImage: `url\(\$\{FAITHBID_LOGO_FULL\}\)`/);
  assert.match(source, /Faith founded\. Service driven\./);
});

// R-65 (2026-09-29): "Our first Dallas pilot is forming now." was reworded
// to "our first Dallas pilot takes shape" (same fix as landing-footer /
// public-entry-ux). "from AV to accounting" was trimmed out of the launched
// copy entirely -- shorter subtitle, not a missing feature.
test("landing hero subtitle has explicit prelaunch and launched copy", () => {
  assert.match(source, /const LANDING_HERO_SUBTITLE = LAUNCHED/);
  assert.match(source, /our first Dallas pilot takes shape/);
  assert.match(source, /Now serving Dallas–Fort Worth\./);
  assert.match(source, /Businesses find work that matters\./);
});
