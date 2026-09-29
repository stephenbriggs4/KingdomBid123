import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

// Regression test for a real dev-server-breaking bug: App.jsx has TWO
// "function App() {" declarations that read identically at their tail end
// (a Church Toolkit-internal SCREENS map ending "...me: MePage};\nfunction
// App() {" INSIDE the giant FaithBidChurchOS IIFE, and the real top-level
// "export default function App() {" right after the IIFE closes). An exact
// string Edit targeting "insert before function App() {" can silently match
// the wrong (IIFE-internal) one, trapping a top-level helper inside a closure
// invisible to the real App()/NotificationBell that call it -- exactly what
// happened to subscribeToNotificationsChannel (R-56) here. Vite's dev
// transform surfaced it as "subscribeToNotificationsChannel is not defined"
// and a blank app (production `vite build` did NOT catch this).
test("subscribeToNotificationsChannel is defined after Church OS closes, not trapped inside its IIFE", () => {
  const churchOsEndIdx = source.indexOf("END CHURCH OS");
  const defIdx = source.indexOf("function subscribeToNotificationsChannel(userId, onChange)");
  assert.notEqual(churchOsEndIdx, -1, "expected to find the END CHURCH OS marker");
  assert.notEqual(defIdx, -1, "expected to find the subscribeToNotificationsChannel definition");
  assert.ok(
    defIdx > churchOsEndIdx,
    "subscribeToNotificationsChannel must be defined AFTER the Church OS IIFE closes (real top-level scope), not before it (trapped inside the IIFE's closure)",
  );
});
