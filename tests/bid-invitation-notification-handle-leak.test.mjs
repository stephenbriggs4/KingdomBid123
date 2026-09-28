import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(
  new URL("../supabase/migrations/20260928212124_fix_bid_invitation_notification_handle_leak.sql", import.meta.url),
  "utf8",
);

test("kb_create_trusted_notification guards the bid-invitation actor name against a handle-like org_name", () => {
  assert.match(migration, /create or replace function public\.kb_is_handle_like_name/);
  assert.match(migration, /when public\.kb_is_handle_like_name\(v_actor_profile ->> 'org_name'\) then null/);
  assert.match(migration, /when public\.kb_is_handle_like_name\(v_conversation ->> 'church_name'\) then null/);
  assert.match(migration, /'A church'/);
});

test("the handle-detector regex matches the client-side isHandleLikeChurchName pattern", () => {
  const isHandleLikeChurchName = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return false;
    return /^[a-z0-9._-]+$/.test(raw) && /[0-9._-]/.test(raw);
  };
  assert.equal(isHandleLikeChurchName("stephenbriggs0128"), true);
  assert.equal(isHandleLikeChurchName("Grace Community Church"), false);
  assert.equal(isHandleLikeChurchName(""), false);
});
