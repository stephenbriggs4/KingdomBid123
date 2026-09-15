import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("final proof uses marketplace cards with explicit example labels", () => {
  const section = source.match(/<section className="landing-final-proof fb-final-access-v2">([\s\S]*?)<\/section>/)?.[1] || "";
  assert.equal((section.match(/<FaithBidCard11A/g) || []).length, 2);
  assert.equal((section.match(/topLabel="Example — not a live listing"/g) || []).length, 2);
  assert.doesNotMatch(section, /rating|reviewLabel|matchPercent|church_name/i);
});

test("final proof preserves one clear access action and no live-result claim", () => {
  const section = source.match(/<section className="landing-final-proof fb-final-access-v2">([\s\S]*?)<\/section>/)?.[1] || "";
  assert.match(section, /Real projects only appear after a church chooses to publish/);
  assert.equal((section.match(/Reserve church access/g) || []).length, 1);
});
