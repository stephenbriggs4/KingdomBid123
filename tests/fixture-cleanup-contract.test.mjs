import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260912195814_repair_orphaned_hires_and_harden_fixture_cleanup.sql"),
  "utf8",
);

test("B1 archives the two exact orphaned hire fixtures before deleting them", () => {
  assert.match(sql, /bb433e98-bdca-4fa8-80e9-2283c73d893f/);
  assert.match(sql, /b38a6233-a4ac-4db5-a308-895be9ecfd34/);
  assert.ok(sql.indexOf("insert into concierge_ops.release_verification_fixture_archive") < sql.indexOf("delete from public.hire_confirmations h"));
  assert.match(sql, /B1 archive verification failed/);
  assert.match(sql, /get diagnostics v_deleted_count = row_count/);
});

test("hire confirmations cannot outlive their project or bid", () => {
  assert.match(sql, /foreign key \(project_id\) references public\.projects\(id\)[\s\S]*?on delete restrict/);
  assert.match(sql, /foreign key \(bid_id\) references public\.bids\(id\)[\s\S]*?on delete restrict/);
  assert.match(sql, /validate constraint hire_confirmations_project_id_fkey/);
  assert.match(sql, /validate constraint hire_confirmations_bid_id_fkey/);
  assert.match(sql, /alter column project_id set not null/);
  assert.match(sql, /alter column bid_id set not null/);
});

test("the reusable routine is private, QA-gated, archive-first, and covers the acceptance tables", () => {
  assert.match(sql, /create or replace function private\.kb_archive_and_delete_marketplace_fixture_v1/);
  assert.match(sql, /p_archive_reason !~ '\^qa_fixture_cleanup:'/);
  assert.match(sql, /record_origin in \('qa', 'synthetic'\)/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /revoke all on function private\.kb_archive_and_delete_marketplace_fixture_v1[\s\S]*?from public, anon, authenticated/);
  for (const table of ["projects", "bids", "vendors", "conversations", "notifications", "hire_confirmations", "project_activity_feed"]) {
    assert.match(sql, new RegExp(`public\\.${table}`));
  }
  assert.match(sql, /review\/payment\/rebate rows require separate handling/);
  assert.match(sql, /Fixture cleanup postcondition failed/);
});
