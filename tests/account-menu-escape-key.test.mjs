import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("the account/mobile-nav menu closes on Escape regardless of where focus is, and returns it to the trigger", () => {
  // The menu's own onKeyDown only fires when focus is already inside it
  // (opening the menu never moves focus there), so this needs a
  // document-level listener like the notification bell's, not just the
  // inner onKeyDown alone.
  assert.match(source, /if \(!menuOpen && !mobileNavOpen\) return;/);
  const start = source.indexOf("if (!menuOpen && !mobileNavOpen) return;");
  const block = source.slice(start, start + 500);
  assert.match(block, /e\.key !== "Escape"/);
  assert.match(block, /setMenuOpen\(false\)/);
  assert.match(block, /setMobileNavOpen\(false\)/);
  assert.match(block, /document\.querySelector\("\.kb-topnav-menu-trigger"\)\?\.focus\(\)/);
  assert.match(block, /document\.addEventListener\("keydown", onKeyDown\)/);
});
