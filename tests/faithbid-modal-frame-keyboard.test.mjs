import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("FaithBidModalFrame (shared by the completed-project review and vendor-feedback dialogs) traps focus and closes on Escape", () => {
  // Previously had role="dialog" aria-modal="true" but zero keyboard
  // handling at all -- no Escape, no focus trap. Fixing it once here
  // covers both call sites (review + feedback modals).
  const start = source.indexOf("function FaithBidModalFrame(");
  assert.notEqual(start, -1);
  const end = source.indexOf("\nfunction ", start + 10);
  const component = source.slice(start, end === -1 ? start + 1200 : end);
  assert.match(component, /const trapRef = useFocusTrap\(true\);/);
  assert.match(component, /if \(e\.key === 'Escape'\) onClose\?\.\(\);/);
  assert.match(component, /document\.addEventListener\('keydown', onKeyDown\);/);
  assert.match(component, /<div ref=\{trapRef\} role="dialog" aria-modal="true" aria-label=\{title\}/);
});

test("both FaithBidModalFrame call sites still exist (review + vendor-feedback modals)", () => {
  const matches = source.match(/<FaithBidModalFrame/g) || [];
  assert.equal(matches.length, 2);
});
