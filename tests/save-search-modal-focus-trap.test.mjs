import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("the Save search modal traps focus (previously had an autoFocus input but no Tab trap)", () => {
  assert.match(source, /const saveSearchTrapRef = useFocusTrap\(!!saveSearchModal\);/);
  assert.match(source, /<div ref=\{saveSearchTrapRef\} className="modal" role="dialog" aria-modal="true" aria-label="Save search"/);
});
