import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const draft = fs.readFileSync(
  path.join(root, "docs/pending_migrations/church_feedback_wrapper_security_definer.sql"),
  "utf8",
);
const original = fs.readFileSync(
  path.join(root, "supabase/migrations/20260917215849_kb_church_feedback_contextual_profile_reviews.sql"),
  "utf8",
);

test("the pending feedback wrapper keeps a narrow SECURITY DEFINER boundary", () => {
  assert.match(draft, /^-- DRAFT\. Do not apply until the disposable replay gate passes\./);
  assert.match(draft, /security definer\s+set search_path = ''/i);
  assert.match(
    draft,
    /revoke all on function public\.marketplace_service_submit_church_feedback\(uuid,text\[\]\) from public, anon, authenticated;/,
  );
  assert.match(
    draft,
    /grant execute on function public\.marketplace_service_submit_church_feedback\(uuid,text\[\]\) to authenticated;/,
  );
  assert.doesNotMatch(draft, /grant .* to anon|grant .* to public/i);
});

test("the delegated private function still authenticates and authorizes the caller", () => {
  assert.match(original, /v_uid uuid := auth\.uid\(\);/);
  assert.match(original, /if v_uid is null then/);
  assert.match(original, /if v_project\.hired_vendor_id is distinct from v_uid then/);
  assert.match(original, /lower\(coalesce\(v_project\.status,''\)\) <> 'completed'/);
});
