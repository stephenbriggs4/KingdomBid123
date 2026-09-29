import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("BidAcceptedModal (Vendor hired) adds a focus trap (Escape was already wired up)", () => {
  const start = source.indexOf("function BidAcceptedModal(");
  const end = source.indexOf("\nfunction ", start + 10);
  const component = source.slice(start, end);
  assert.match(component, /const bidAcceptedTrapRef = useFocusTrap\(true\);/);
  assert.match(component, /<div ref=\{bidAcceptedTrapRef\} style=\{\{background:"#fff",borderRadius:24,width:"100%",maxWidth:500/);
});

test("VendorWinModal (Bid accepted) adds a focus trap (Escape was already wired up)", () => {
  const start = source.indexOf("function VendorWinModal(");
  const end = source.indexOf("\nfunction ", start + 10);
  const component = source.slice(start, end);
  assert.match(component, /const vendorWinTrapRef = useFocusTrap\(true\);/);
  assert.match(component, /<div ref=\{vendorWinTrapRef\} style=\{\{background:"#fff",borderRadius:24,width:"100%",maxWidth:480/);
});

test("ConfirmModal (shared 'replaces window.confirm' dialog, 7 call sites) adds a Tab trap without disturbing its existing auto-focus/restore logic", () => {
  const start = source.indexOf("function ConfirmModal(");
  const end = source.indexOf("\nfunction ", start + 10);
  const component = source.slice(start, end);
  // The deliberate confirm-button auto-focus and focus-restore-on-close
  // logic must still be present and untouched.
  assert.match(component, /if \(confirmBtnRef\.current\) confirmBtnRef\.current\.focus\(\);/);
  assert.match(component, /if \(previouslyFocused && typeof previouslyFocused\.focus === 'function'\)/);
  // New: a dedicated Tab-wrap effect, not the generic useFocusTrap (which
  // would steal that intentional initial focus).
  assert.match(component, /const dialogRef = React\.useRef\(null\);/);
  assert.match(component, /if \(e\.key !== 'Tab'\) return;/);
  assert.match(component, /<div ref=\{dialogRef\} style=\{\{background:"#fff",borderRadius:18/);
});
