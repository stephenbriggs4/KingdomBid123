import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

// R-65 (2026-09-29): GpiLandingReveal is currently built but deliberately
// not rendered anywhere -- confirmed via src/Claude outputs/
// FaithBid_Landing_Redesign_Spec.md, which explicitly says "do NOT delete;
// §6 revives it" as part of a planned (not-yet-executed) landing redesign.
// This isn't a stale assertion about code that changed shape; it's a real
// pending feature. Marked todo instead of silently deleted or force-passed,
// so it surfaces again once the landing redesign actually wires it in.
test("Get Plugged In teaser sits between trust and pricing (pending landing redesign, see FaithBid_Landing_Redesign_Spec.md §6)", { skip: "GpiLandingReveal is intentionally unrendered pending the landing redesign; do not delete this test, revive it when that work lands" }, () => {
  assert.match(source, /<LandingChurchTrustStrip\s*\/>\s*<GpiLandingReveal nav=\{nav\}\s*\/>\s*\{\/\* ── PRICING/);
});

test("Get Plugged In copy is honest about its prelaunch state", () => {
  assert.match(source, /FaithBid is more than a marketplace\./);
  assert.match(source, /Get Plugged In is taking shape/);
  assert.match(source, /Preview Get Plugged In/);
  assert.doesNotMatch(source, /FaithBid is becoming something bigger\./);
});
