import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const component = fs.readFileSync(new URL("../src/ChurchIntelligence.jsx", import.meta.url), "utf8");

test("church-intelligence is a protected, lazy-loaded route wired into the admin nav", () => {
  assert.match(source, /PROTECTED_ROUTES = \[[^\]]*"church-intelligence"/);
  assert.match(source, /APP_HASH_ROUTES = Object\.freeze\(\[[\s\S]{0,2000}"church-intelligence"/);
  assert.match(source, /const ChurchIntelligence = kbLazyWithSingleReload\(\(\) => import\("\.\/ChurchIntelligence\.jsx"\), "church_intelligence"\)/);
});

test("the ChurchIntelligence component denies non-admins before fetching or rendering real data", () => {
  assert.match(component, /if\(!currentUser\?\.id\|\|!isAdmin\)return;/);
  assert.match(component, /if\(!isAdmin\)return <div className="ci-denied">/);
});

test("the component only calls the narrow ci_list_organizations RPC, never a private church_intel table directly", () => {
  assert.match(component, /supabase\.rpc\("ci_list_organizations"/);
  assert.doesNotMatch(component, /from\(["']church_intel\./);
});
