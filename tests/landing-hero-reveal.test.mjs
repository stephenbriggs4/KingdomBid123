import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../src/styles/landing-v2.css", import.meta.url), "utf8");

test("hero chevron targets the honest example reveal", () => {
  assert.match(source, /onClick=\{scrollToExampleReveal\}/);
  assert.match(source, /id="landing-example-reveal"/);
  assert.equal((source.match(/topLabel="Example — not a live listing"/g) || []).length >= 4, true);
});

test("reveal uses marketplace cards and respects reduced motion", () => {
  const component = source.match(/function LandingExampleReveal[\s\S]*?function LandingScreen/)?.[0] || "";
  assert.equal((component.match(/<FaithBidCard11A/g) || []).length, 2);
  assert.doesNotMatch(component, /rating|reviewLabel|matchPercent|named church/i);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /\.fb-example-reveal__cards \{ opacity: 1; transform: none; transition: none; \}/);
});
