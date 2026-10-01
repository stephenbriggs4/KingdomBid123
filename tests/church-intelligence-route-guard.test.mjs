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
    "ci_list_review_cases", "ci_list_sources", "ci_list_boundary_versions", "ci_list_system_links",
    "ci_suggest_faithbid_matches", "ci_create_research_bundle", "ci_promote_claim",
    "ci_open_review_case", "ci_resolve_review_case", "ci_apply_source_policy_restriction",
    "ci_stage_dallas_boundary", "ci_publish_boundary", "ci_set_system_link",
  ]) {
    assert.ok(component.includes(`"${rpc}"`), `expected a callRpc(...) call naming ${rpc}`);
  }
  assert.doesNotMatch(component, /\.from\(["']church_intel\./);
});

test("data health distinguishes verified runtime evidence from designed or unpopulated controls", () => {
  const foundationChecksBlock = component.slice(component.indexOf("const foundationChecks"), component.indexOf("], [online"));
  assert.match(foundationChecksBlock, /"Private RPC boundary"/);
  assert.match(foundationChecksBlock, /"Canonical hierarchy", "Designed"/);
  assert.match(foundationChecksBlock, /"Dallas geography"/);
  // The boundary row must be driven by real published-boundary state, not a hardcoded string.
  assert.match(foundationChecksBlock, /publishedBoundaries > 0 \? "Published" : "Not published"/);
});
