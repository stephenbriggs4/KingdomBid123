import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../src/styles/landing-v2.css", import.meta.url), "utf8");

test("landing keeps the honest example reveal after the how-it-works jump", () => {
  assert.match(source, /onClick=\{scrollToHowItWorks\} aria-label="Learn how FaithBid works"/);
  assert.match(source, /id="landing-example-reveal"/);
  assert.equal((source.match(/Example vendor profiles — illustrative, not live listings\./g) || []).length, 1);
});

test("reveal uses three marketplace-style cards and respects reduced motion", () => {
  const component = source.match(/function LandingExampleReveal[\s\S]*?function LandingScreen/)?.[0] || "";
  assert.equal((component.match(/callout:\{ type:/g) || []).length, 3);
  assert.match(source, /function LandingVendorPreviewCard[\s\S]*?className="kb-marketplace-vendor-card"/);
  assert.doesNotMatch(component, /matchPercent|named church|rating:\s*\d/i);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /\.fb-product-peek\.is-motion-ready:not\(\.is-revealed\) \.fb-product-peek__card-wrap/);
});
