import test from "node:test";
import assert from "node:assert/strict";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const live = Boolean(url && anonKey);

const PRIVATE_TABLES = ["email_outbox", "admin_audit_log", "legal_consents"];

async function anonGet(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  return res;
}

for (const table of PRIVATE_TABLES) {
  test(`anonymous key cannot read private table ${table}`, { skip: !live && "set SUPABASE_URL and SUPABASE_ANON_KEY to run" }, async () => {
    const res = await anonGet(table);
    if (res.status === 200) {
      const rows = await res.json();
      assert.deepEqual(rows, [], `${table} returned rows to an anonymous request`);
    } else {
      assert.ok([401, 403, 404].includes(res.status), `unexpected status ${res.status} for ${table}`);
    }
  });
}

test("anonymous key cannot read the church_intel schema through the REST API", { skip: !live && "set SUPABASE_URL and SUPABASE_ANON_KEY to run" }, async () => {
  const res = await fetch(`${url}/rest/v1/organizations?select=id&limit=1`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Accept-Profile": "church_intel" },
  });
  assert.ok(res.status !== 200 || (await res.json()).length === 0, "church_intel rows were readable anonymously");
});
