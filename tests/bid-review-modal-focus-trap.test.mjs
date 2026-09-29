import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("the bid review modal traps focus with the established useFocusTrap hook (previously had role=dialog/aria-modal but no real trap)", () => {
  assert.match(source, /const bidReviewTrapRef = useFocusTrap\(bidReviewModalOpen\);/);
  const modalDivStart = source.indexOf('className="modal" role="dialog" aria-modal="true" aria-label="Review bids"');
  assert.notEqual(modalDivStart, -1, "expected the bid review dialog div to still exist");
  const before = source.slice(Math.max(0, modalDivStart - 40), modalDivStart);
  assert.match(before, /ref=\{bidReviewTrapRef\}/, "the trap ref must be attached to the dialog element itself");
});

test("the bid review modal backdrop still closes on Escape and click-outside", () => {
  const start = source.indexOf("const closeBidReviewModal = () => setBidReviewModalOpen(false);");
  const block = source.slice(start, start + 400);
  assert.match(block, /onClick=\{closeBidReviewModal\}/);
  assert.match(block, /e\.key==='Escape'\)closeBidReviewModal\(\)/);
});
