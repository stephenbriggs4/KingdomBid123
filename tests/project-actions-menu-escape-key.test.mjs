import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("the per-project \"more actions\" (kb1005) menu closes on Escape and returns focus to its trigger", () => {
  // Third instance of the same bug class found this session (after the
  // notification bell and the account/mobile-nav menu): only a mouse
  // outside-click handler existed, no keyboard way to dismiss the menu.
  const anchor = "same gap as the notification bell / account menu";
  assert.match(source, new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const start = source.indexOf(anchor);
  const block = source.slice(start, start + 700);
  assert.match(block, /e\.key !== 'Escape'/);
  assert.match(block, /setMenuProjectId\(null\)/);
  assert.match(block, /document\.querySelector\('\.kb1005-more\[aria-expanded="true"\]'\)\?\.focus\(\)/);
  assert.match(block, /document\.addEventListener\('keydown', onKeyDown\)/);
});
