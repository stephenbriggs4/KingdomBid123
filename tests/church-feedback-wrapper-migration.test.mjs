import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const migration = fs.readFileSync(
  path.join(
    root,
    "supabase/migrations/20261004050843_harden_church_feedback_wrapper_execution.sql",
  ),
  "utf8",
);
const original = fs.readFileSync(
  path.join(root, "supabase/migrations/20260917215849_kb_church_feedback_contextual_profile_reviews.sql"),
  "utf8",
);

test("the feedback wrapper migration keeps a narrow SECURITY DEFINER boundary", () => {
  assert.match(migration, /security definer\s+set search_path = ''/i);
  assert.match(
    migration,
    /revoke all on function public\.marketplace_service_submit_church_feedback\(uuid,text\[\]\) from public, anon, authenticated;/,
  );
  assert.match(
    migration,
    /grant execute on function public\.marketplace_service_submit_church_feedback\(uuid,text\[\]\) to authenticated;/,
  );
  assert.doesNotMatch(migration, /grant .* to anon|grant .* to public/i);
});

test("the delegated private function still authenticates and authorizes the caller", () => {
  assert.match(original, /v_uid uuid := auth\.uid\(\);/);
  assert.match(original, /if v_uid is null then/);
  assert.match(original, /if v_project\.hired_vendor_id is distinct from v_uid then/);
  assert.match(original, /lower\(coalesce\(v_project\.status,''\)\) <> 'completed'/);
});
