import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("superseded Faith Verified component is removed while the live trust strip remains", () => {
  assert.doesNotMatch(source, /function LandingFaithVerified\s*\(/);
  assert.match(source, /function LandingChurchTrustStrip\s*\(/);
  assert.match(source, /<LandingChurchTrustStrip\s*\/>/);
});

test("placeholder testimonials are visibly marked and cannot render in production", () => {
  assert.match(source, /PLACEHOLDER — fabricated testimonials, MUST replace before prospect-facing use/);
  assert.match(source, /const SHOW_PLACEHOLDER_TESTIMONIALS = import\.meta\.env\.DEV/);
  assert.match(source, /VITE_SHOW_PLACEHOLDER_TESTIMONIALS === "true"/);
  assert.doesNotMatch(source, /VITE_SHOW_PLACEHOLDER_TESTIMONIALS !== "false"/);
  assert.match(source, /SHOW_PLACEHOLDER_TESTIMONIALS && <LandingTestimonials\s*\/>/);
});

test("the retired Kingdom Builder teaser stays removed while Get Plugged In remains", () => {
  assert.doesNotMatch(source, /function KingdomBuilderTeaser\s*\(/);
  assert.match(source, /function GpiLandingReveal\s*\(/);
});
