import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("the mobile landing nav drawer traps Tab at its boundaries (Escape + initial focus already existed)", () => {
  // Live-verified in the browser at mobile viewport: opened the drawer,
  // focused its last item ("Sign In"), pressed Tab, confirmed it wrapped
  // to the first item ("Request Church Access") instead of escaping into
  // the background landing page; Escape closed the drawer.
  const start = source.indexOf("window.requestAnimationFrame(() => drawerRef.current?.focus?.());");
  assert.notEqual(start, -1);
  const block = source.slice(start, start + 1100);
  assert.match(block, /onKeyDownTrap/);
  assert.match(block, /document\.addEventListener\('keydown', onKeyDownTrap\);/);
  assert.match(block, /document\.removeEventListener\('keydown', onKeyDownTrap\);/);
});

test("the guest 'create your account to publish' modal traps focus and closes on Escape", () => {
  assert.match(source, /const pendingDataTrapRef = useFocusTrap\(!!pendingData\);/);
  const effectStart = source.indexOf("if (!pendingData) return undefined;");
  assert.notEqual(effectStart, -1);
  const block = source.slice(effectStart, effectStart + 300);
  assert.match(block, /e\.key === 'Escape' && !submitting/);
  assert.match(block, /document\.addEventListener\('keydown', onKeyDown\);/);
  assert.match(source, /<div ref=\{pendingDataTrapRef\} style=\{\{ width: "100%", maxWidth: 440/);
});
