import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("SuccessMomentModal traps focus and closes on Escape (previously had only a mouse-clickable close button)", () => {
  const start = source.indexOf("function SuccessMomentModal(");
  assert.notEqual(start, -1);
  const end = source.indexOf("\nfunction ", start + 10);
  const component = source.slice(start, end === -1 ? start + 1200 : end);
  assert.match(component, /const successMomentTrapRef = useFocusTrap\(!!moment\);/);
  assert.match(component, /e\.key === 'Escape' && typeof onClose === 'function'/);
  assert.match(component, /document\.addEventListener\('keydown', onKeyDown\);/);
  assert.match(component, /<div ref=\{successMomentTrapRef\} className="kbm-overlay" role="dialog" aria-modal="true"/);
});
