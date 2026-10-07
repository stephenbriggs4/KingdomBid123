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

test("the Dallas workflow is one directory-first search experience instead of an operations dashboard", () => {
  assert.match(component, /const QUICK_FILTERS = \[/);
  assert.match(component, /useState\("list"\)/);
  assert.match(component, /<h1>Dallas Churches<\/h1>/);
  assert.match(component, /Find a Dallas church/);
  assert.match(component, /Search by church name, street, city, or ZIP code/);
  assert.match(component, /Loaded in FaithBid/);
  assert.match(component, /Basics complete/);
  assert.match(component, /Connected accounts/);
  // R-2026-10-07: "Church candidates found" was a frozen, hardcoded number
  // (DALLAS_RESEARCH_SNAPSHOT.candidateCount) presented as if it were live.
  // Removed rather than fixed -- a stat nobody can act on and that lies about
  // being current is worse than no stat.
  assert.doesNotMatch(component, /Church candidates found/);
  assert.doesNotMatch(component, /DALLAS_RESEARCH_SNAPSHOT/);
  assert.match(component, /Filter by denomination/);
  assert.match(component, /Filter by ZIP code/);
  assert.match(component, /aria-label="Directory view"/);
  assert.doesNotMatch(component, /const TABS =/);
  assert.doesNotMatch(component, />Progress<\/button>/);
  assert.doesNotMatch(component, /Review Queue/);
  assert.doesNotMatch(component, /Resolve \/ dismiss/);
  assert.doesNotMatch(component, /meters from the Dallas city line/);
  assert.doesNotMatch(component, /tab === "controls"/);
});

test("Add church warns on a likely duplicate name without blocking submission", () => {
  const modalStart = component.indexOf("function NewOrgModal(");
  assert.ok(modalStart > 0, "NewOrgModal not found");
  const modal = component.slice(modalStart);
  assert.match(component, /function normalizeChurchName\(value\)/);
  assert.match(modal, /const possibleDuplicates = useMemo\(/);
  assert.match(modal, /ci-dup-warning/);
  assert.match(modal, /Already in the directory\?/);
  // Must never factor into whether the form can submit -- it is a warning, not a gate.
  const canSubmitLine = modal.match(/const canSubmit = [^\n]+/)?.[0] || "";
  assert.doesNotMatch(canSubmitLine, /possibleDuplicates/);
});

test("FaithBid account matching stays inside church detail instead of cluttering every directory row", () => {
  const detailStart = component.indexOf("function OrgDetail(");
  const detailEnd = component.indexOf("function DallasMap(", detailStart);
  const detail = component.slice(detailStart, detailEnd);
  assert.match(detail, /Find matching account/);
  assert.match(detail, /Possible FaithBid accounts/);
  assert.match(detail, /Link this account/);

  const listStart = component.indexOf('<div className="ci-church-list">');
  const listEnd = component.indexOf('<Empty eyebrow="No matches"', listStart);
  const list = component.slice(listStart, listEnd);
  assert.doesNotMatch(list, /Find FaithBid account/);
  assert.doesNotMatch(list, /Link this account/);
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
