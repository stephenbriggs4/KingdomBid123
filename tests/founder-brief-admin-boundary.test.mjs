import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20261001232009_harden_founder_brief_admin_access.sql"),
  "utf8",
);

test("the public founder brief enforces the platform-admin decision internally", () => {
  assert.match(migration, /create function public\.kb_admin_get_founder_brief_v0[\s\S]*security definer[\s\S]*set search_path\s*=\s*''/i);
  assert.match(migration, /if not coalesce\(public\.kb_is_platform_admin\(\), false\) then[\s\S]*errcode\s*=\s*'42501'/i);
  assert.match(migration, /revoke all on function public\.kb_admin_get_founder_brief_v0\(timestamptz\)[\s\S]*from public, anon, authenticated, service_role/i);
  assert.match(migration, /grant execute on function public\.kb_admin_get_founder_brief_v0\(timestamptz\)[\s\S]*to authenticated, service_role/i);
});

test("historical founder-brief composition functions are no longer callable APIs", () => {
  for (const name of [
    "active_bids_20260824_v1",
    "channel_20260824_v2",
    "liquidity_20260824_v1",
    "provenance_20260824_v1",
    "staleness_20260824_v1",
  ]) {
    assert.match(
      migration,
      new RegExp(`revoke all on function public\\.kb_admin_get_founder_brief_${name}\\(timestamptz\\)[\\s\\S]*?from public, anon, authenticated, service_role`, "i"),
    );
  }
  assert.match(migration, /revoke all on function public\.kb_admin_get_founder_brief_unchecked_20261001\(timestamptz\)[\s\S]*from public, anon, authenticated, service_role/i);
});
