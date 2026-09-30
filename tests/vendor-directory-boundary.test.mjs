import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const migration = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260912155042_restrict_vendor_directory_reads_to_admitted_rows.sql"),
  "utf8",
);

test("the browser directory excludes rejected, suspended, and status-bearing legacy rows", () => {
  assert.match(app, /if \(vendor\?\.suspended === true\) return false;/);
  assert.match(app, /if \(status === KB_VENDOR_ADMISSION_STATUS\.REJECTED\) return false;/);
  assert.match(app, /rawStatus == null && vendor\?\.verified === true/);
  assert.match(app, /verification_status\.eq\.\$\{KB_VENDOR_ADMISSION_STATUS\.APPROVED\},and\(verification_status\.is\.null,verified\.eq\.true\)/);
  assert.match(app, /\.eq\('suspended', false\)/);
});

test("RLS exposes only admitted, unsuspended vendors to the public marketplace", () => {
  assert.match(migration, /create policy kb_vendors_select_anon[\s\S]*?to anon[\s\S]*?public\.kb_marketplace_public\(\)/i);
  assert.match(migration, /not coalesce\(suspended, false\)/i);
  assert.match(migration, /lower\(coalesce\(verification_status, ''\)\) = 'approved'/i);
  assert.match(migration, /verification_status is null[\s\S]*?coalesce\(verified, false\)/i);
});

test("owners and admins retain private review access", () => {
  assert.match(migration, /create policy kb_vendors_select_authenticated[\s\S]*?user_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /or public\.kb_is_platform_admin\(\)/i);
});
