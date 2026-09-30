import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { basename, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const activeDir = resolve(root, "supabase/migrations");
const archiveDir = resolve(root, "supabase/migration_drafts_archive/2026-09-30_unapplied");
const sqlFiles = (dir) => readdirSync(dir).filter((name) => name.endsWith(".sql")).sort();

const active = sqlFiles(activeDir);
const archived = sqlFiles(archiveDir);
const versions = active.map((name) => name.split("_", 1)[0]);

assert.equal(new Set(active).size, active.length, "active migration filenames must be unique");
assert.equal(new Set(versions).size, versions.length, "active migration versions must be unique");
assert.equal(archived.length, 36, "the reviewed unapplied draft archive must remain complete");

const overlap = archived.filter((name) => active.includes(name));
assert.deepEqual(overlap, [], `archived drafts must not be executable migrations: ${overlap.join(", ")}`);

for (const required of [
  "harden_legal_consent_provenance.sql",
  "lease_email_outbox_claims.sql",
  "expire_public_vendor_reference_links.sql",
]) {
  assert.ok(active.some((name) => name.endsWith(required)), `missing forward migration: ${basename(required)}`);
}

console.log(`migration-integrity: ok (${active.length} active, ${archived.length} archived drafts)`);
