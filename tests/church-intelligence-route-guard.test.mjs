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
  // Every data-fetching callback bails out before calling any RPC when the
  // caller isn't an authenticated admin.
  assert.match(component, /if\s*\(!currentUser\?\.id\s*\|\|\s*!isAdmin\)\s*return;/);
  assert.match(component, /if\s*\(!isAdmin\)\s*return <div className="ci-denied">/);
});

test("the component only reaches church_intel data through narrow admin-gated RPCs, never a private table directly", () => {
  // All reads/writes go through supabase.rpc(fn, args) via the callRpc/runAction
  // helpers -- never a direct .from("church_intel....") query from the browser.
  assert.match(component, /const callRpc = useCallback\(async \(fn, args, label\) => \{/);
  assert.match(component, /signal => supabase\.rpc\(fn, args\)\.abortSignal\(signal\)/);
  assert.match(component, /withRequestDeadline/);
  for (const rpc of [
    "ci_list_organizations_overview", "ci_get_organization",
    "ci_list_sources", "ci_suggest_faithbid_matches", "ci_create_research_bundle",
    "ci_open_review_case", "ci_resolve_review_case", "ci_set_system_link",
  ]) {
    assert.ok(component.includes(`"${rpc}"`), `expected a callRpc(...) call naming ${rpc}`);
  }
  assert.doesNotMatch(component, /\.from\(["']church_intel\./);
});

test("the Dallas census workflow stays focused on the church list instead of backend machinery", () => {
  assert.match(component, /const TABS = \[\["home","Overview"\],\["churches","All Churches"\],\["map","Map"\]\]/);
  assert.match(component, /<h1>Dallas Church Census<\/h1>/);
  assert.match(component, /Every church in Dallas, in one useful list/);
  assert.match(component, /Churches found/);
  assert.match(component, /Addresses on file/);
  assert.match(component, /Denominations known/);
  assert.match(component, /On FaithBid/);
  assert.doesNotMatch(component, /Review Queue/);
  assert.doesNotMatch(component, /Resolve \/ dismiss/);
  assert.doesNotMatch(component, /meters from the Dallas city line/);
  assert.doesNotMatch(component, /tab === "controls"/);
});

test("Church Intelligence dialogs trap keyboard focus, close on Escape, and restore focus", () => {
  const modalStart = component.indexOf("function Modal(");
  const modalEnd = component.indexOf("function Field(", modalStart);
  const modal = component.slice(modalStart, modalEnd);
  assert.match(modal, /const dialogRef = useRef\(null\)/);
  assert.match(modal, /event\.key === "Escape"/);
  assert.match(modal, /event\.key !== "Tab"/);
  assert.match(modal, /event\.shiftKey && document\.activeElement === first/);
  assert.match(modal, /document\.activeElement === last/);
  assert.match(modal, /previouslyFocused\.focus\(\)/);
  assert.match(modal, /aria-label=\{title\}/);
});
