import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../src/styles/landing-v2.css", import.meta.url), "utf8");

test("landing keeps the illustrative example reveal after the how-it-works jump", () => {
  assert.match(source, /onClick=\{scrollToHowItWorks\} aria-label="Learn how FaithBid works"/);
  assert.match(source, /id="landing-example-reveal"/);
  assert.match(source, /aria-label="Illustrative example of three FaithBid vendor profile cards"/);
  assert.equal((source.match(/— Example church review/g) || []).length, 1);
});

test("reveal uses three editorial cards and respects reduced motion", () => {
  const component = source.match(/const LANDING_GLIMPSE_CARDS[\s\S]*?const LANDING_PRECISION_POLISH_CSS/)?.[0] || "";
  assert.equal((component.match(/position: "(left|center|right)"/g) || []).length, 3);
  assert.doesNotMatch(component, /matchPercent|named church|rating:\s*\d/i);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /\.kb-landing-glimpse\.is-motion-ready:not\(\.is-revealed\) \.kb-landing-glimpse__item/);
});
