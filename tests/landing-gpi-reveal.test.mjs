import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("Get Plugged In teaser sits between trust and pricing", () => {
  assert.match(source, /<LandingChurchTrustStrip\s*\/>\s*<GpiLandingReveal nav=\{nav\}\s*\/>\s*\{\/\* ── PRICING/);
});

test("Get Plugged In copy is honest about its prelaunch state", () => {
  assert.match(source, /FaithBid is more than a marketplace\./);
  assert.match(source, /Get Plugged In is taking shape/);
  assert.match(source, /Preview Get Plugged In/);
  assert.doesNotMatch(source, /FaithBid is becoming something bigger\./);
});
