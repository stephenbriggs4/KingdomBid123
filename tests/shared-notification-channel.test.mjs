import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("App and NotificationBell share a single Realtime channel instead of opening one each", () => {
  assert.match(source, /function subscribeToNotificationsChannel\(userId, onChange\)/);
  assert.match(source, /supabase\.channel\(`kb-notifs-shared-\$\{userId\}`\)/);
  // The two old per-component channel names must be gone.
  assert.doesNotMatch(source, /supabase\.channel\("unread_msgs_"/);
  assert.doesNotMatch(source, /supabase\.channel\("notifs_"\+currentUser\.id\)/);
});

test("both consumers route through the shared subscription helper", () => {
  const matches = source.match(/subscribeToNotificationsChannel\(currentUser\.id,/g) || [];
  assert.equal(matches.length, 2, "expected exactly 2 call sites (App's unread effect + NotificationBell)");
});

test("the shared channel is ref-counted so it tears down only after the last consumer unmounts", () => {
  assert.match(source, /entry\.refCount \+= 1/);
  assert.match(source, /entry\.refCount -= 1/);
  assert.match(source, /if \(entry\.refCount <= 0\)/);
});
