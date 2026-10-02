import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("App and NotificationBell share a single Realtime channel instead of opening one each", () => {
  assert.match(source, /function subscribeToNotificationsChannel\(userId, onChange\)/);
  assert.match(source, /supabase\.channel\(`kb-notifs-\$\{userId\}-\$\{__kbNotifChannelState\.sessionId\}-\$\{generation\}`\)/);
  // The two old per-component channel names must be gone.
  assert.doesNotMatch(source, /supabase\.channel\("unread_msgs_"/);
  assert.doesNotMatch(source, /supabase\.channel\("notifs_"\+currentUser\.id\)/);
});

test("the shared registry and channel identity survive Vite hot reloads", () => {
  assert.match(source, /Symbol\.for\('faithbid\.notification-channel-state'\)/);
  assert.match(source, /globalThis\[__kbNotifChannelStateKey\] \|\|/);
  assert.match(source, /registry: new Map\(\)/);
  assert.match(source, /generation: 0/);
  assert.match(source, /sessionId: globalThis\.crypto\?\.randomUUID\?\.\(\)/);
  assert.match(source, /const __kbNotifChannelRegistry = __kbNotifChannelState\.registry/);
  assert.match(source, /\+\+__kbNotifChannelState\.generation/);
  assert.doesNotMatch(source, /let __kbNotifChannelGeneration = 0/);
});

test("both consumers route through the shared subscription helper", () => {
  const matches = source.match(/subscribeToNotificationsChannel\(currentUser\.id,/g) || [];
  assert.equal(matches.length, 2, "expected exactly 2 call sites (App's unread effect + NotificationBell)");
});

test("the shared channel is ref-counted so it tears down only after the last consumer unmounts", () => {
  assert.match(source, /entry\.refCount \+= 1/);
  assert.match(source, /entry\.refCount = Math\.max\(0, entry\.refCount - 1\)/);
  assert.match(source, /if \(entry\.refCount <= 0 && !entry\.closing\)/);
  assert.match(source, /if \(released\) return/);
  assert.match(source, /supabase\.removeChannel\(entry\.channel\)/);
  assert.doesNotMatch(source, /entry\.channel\.unsubscribe\(\)/);
});

test("notification failures are contained outside the screen boundary", () => {
  assert.match(source, /class NavUtilityBoundary extends React\.Component/);
  assert.match(source, /<NavUtilityBoundary resetKey=\{currentUser\.id\}><NotificationBell/);
});
