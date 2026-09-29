import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("the post-project preview modal traps focus (its Escape handler previously never fired in practice)", () => {
  // The overlay div had onKeyDown Escape handling on itself, but nothing
  // ever moved focus into it on open -- the "Preview" button that opens it
  // is a sibling, not a descendant, so the keydown never bubbled there.
  // Live-verified: opening Preview now moves focus inside (the × close
  // button), Escape closes it, and focus returns to the Preview button.
  assert.match(source, /const previewTrapRef = useFocusTrap\(showPreview\);/);
  assert.match(source, /<div ref=\{previewTrapRef\} className="post-project-preview-overlay"/);
});
