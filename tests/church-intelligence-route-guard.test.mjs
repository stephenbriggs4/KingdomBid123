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
  assert.match(component, /Filter by ZIP code/);
  assert.match(component, /aria-label="Directory view"/);
  assert.doesNotMatch(component, /const TABS =/);
  assert.doesNotMatch(component, />Progress<\/button>/);
  assert.doesNotMatch(component, /Resolve \/ dismiss/);
  assert.doesNotMatch(component, /meters from the Dallas city line/);
  assert.doesNotMatch(component, /tab === "controls"/);
});

test("R-2026-10-07 Pass 3: one status model feeds both the filter chips and the map markers", () => {
  // The whole point is a single definition of status, derived from fields
  // the overview RPC already returns -- not two different "verified"s in
  // two different places.
  assert.match(component, /function churchStatus\(row\)/);
  const statusFnBody = component.slice(component.indexOf("function churchStatus"), component.indexOf("function churchStatus") + 400);
  assert.match(statusFnBody, /dallas_membership/);
  assert.match(statusFnBody, /open_review_case_count/);
  assert.match(statusFnBody, /has_promoted_claim/);
  // Used by the directory rows...
  assert.match(component, /style=\{\{ background: STATUS_META\[status\]\.color \}\}/);
  // ...and by the map markers -- same function, not a re-derivation.
  const mapStart = component.indexOf("function DallasMap(");
  assert.ok(mapStart > 0, "DallasMap not found");
  assert.match(component.slice(mapStart), /churchStatus\(row\)/);
  // The old weak "basics complete = has address + denomination" quick
  // filter is gone as a filter mechanism (the label survives only as a
  // coverage-stat tile name, asserted above).
  assert.doesNotMatch(component, /const QUICK_FILTERS = \[/);
  assert.doesNotMatch(component, /hasMissingDetails/);
});

test("R-2026-10-07 Pass 3: filters are multi-select with faceted counts, not single-value dropdowns", () => {
  assert.match(component, /const \[statusFilters, setStatusFilters\] = useState/);
  assert.match(component, /const \[denominationFilters, setDenominationFilters\] = useState/);
  assert.match(component, /const toggleStatusFilter = /);
  assert.match(component, /const toggleDenominationFilter = /);
  assert.match(component, /const statusCounts = useMemo/);
  assert.match(component, /const denominationCounts = useMemo/);
  // Faceted counts are client-side and only honest under the RPC's cap --
  // this must stay documented, not silently assumed to scale.
  assert.match(component, /Honest only while the directory stays under/);
});

test("R-2026-10-07 Pass 3: saved views are fixed presets, not a new persistence layer", () => {
  assert.match(component, /const SAVED_VIEWS = \[/);
  assert.match(component, /Needs review/);
  assert.match(component, /Not yet checked against FaithBid/);
  // No new table, no localStorage persistence claimed for this -- just a
  // shorthand for filter states the existing controls already support.
  assert.doesNotMatch(component, /localStorage/);
});

test("R-2026-10-07 Pass 3: filter state round-trips through the URL hash without touching app routing", () => {
  assert.match(component, /function parseHashParams\(/);
  assert.match(component, /function writeHashParams\(/);
  // history.replaceState, never location.hash=, so this can never fire the
  // app-level hashchange route listener in App.jsx.
  assert.match(component, /window\.history\.replaceState\(/);
  assert.doesNotMatch(component, /window\.location\.hash\s*=/);
});

test("R-2026-10-07 Pass 3: the map draws the real published boundary via a dedicated admin-gated RPC, not a hardcoded shape", () => {
  assert.match(component, /ci_get_boundary_geojson/);
  assert.match(component, /boundary\?\.geometry/);
  // Boundary is its own effect, independent of the rows/clustering effect,
  // so panning or filtering never re-fetches or re-draws it.
  const boundaryEffectIndex = component.indexOf("boundaryLayerRef.current = L.geoJSON");
  assert.ok(boundaryEffectIndex > 0, "boundary layer effect not found");
});

test("R-2026-10-07 Pass 3: clustering and the density view are custom, not a new npm dependency", () => {
  assert.match(component, /function clusterPoints\(/);
  assert.match(component, /function densityCells\(/);
  assert.doesNotMatch(component, /import\(["']leaflet\.markercluster["']\)/);
  assert.doesNotMatch(component, /import\(["']leaflet\.heat["']\)/);
  // The density view is honestly scoped as "what's loaded," never promoted
  // to a claim about coverage gaps.
  assert.match(component, /Deliberately not called a "gap" view/);
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
