import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("the delete/cancel-project confirm modal traps focus and closes on Escape (previously had zero keyboard handling)", () => {
  // Before this fix the backdrop was role="presentation" with no onKeyDown
  // and no focus trap -- a keyboard user opening this destructive-action
  // dialog had no way to back out except finding the Cancel button with a
  // mouse.
  assert.match(source, /const confirmActionTrapRef = useFocusTrap\(!!confirmAction\);/);
  assert.match(source, /<div ref=\{confirmActionTrapRef\} className="modal" role="dialog"/, "the trap ref must be attached to the dialog element itself");

  const effectStart = source.indexOf("if (!confirmAction) return undefined;");
  assert.notEqual(effectStart, -1);
  const block = source.slice(effectStart, effectStart + 400);
  assert.match(block, /e\.key !== 'Escape' \|\| actionBusy/);
  assert.match(block, /setConfirmAction\(null\)/);
  assert.match(block, /document\.addEventListener\('keydown', onKeyDown\)/);
});
