import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const profile = readFileSync(new URL("../src/ProfileScreen.jsx", import.meta.url), "utf8");

test("profile tab buttons do not shrink, so the strip scrolls instead of squeezing labels on phones", () => {
  assert.match(profile, /tabsWrap:\{[^}]*overflowX:"auto"/);
  assert.match(profile, /tab:\(active\)=>\(\{[^}]*whiteSpace:"nowrap",flexShrink:0\}\)/);
});
