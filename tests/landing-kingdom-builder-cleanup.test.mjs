import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("dead Kingdom Builder landing teaser is removed", () => {
  assert.doesNotMatch(source, /function KingdomBuilderTeaser\s*\(/);
  assert.doesNotMatch(source, /but that happens after signup, not as the main pitch here/);
});

test("the separate join route remains untouched", () => {
  assert.match(source, /function JoinScreen\s*\(/);
  assert.match(source, /function KingdomBuilderSection\s*\(/);
});
