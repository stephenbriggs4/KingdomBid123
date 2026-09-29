import assert from "node:assert/strict";
import fs from "node:fs";

// R-65 (2026-09-29): this test's original assertions targeted a "Workspace"
// dropdown containing an "Admin operations" mobile-nav submenu -- both were
// retired (see App.jsx's "1008: Workspace dropdown retired; its
// destinations now live contextually" comment). The destinations it used to
// check (Concierge Pilot Operations, Growth Engine, QA Console) are real
// and still present, just reachable through AdminReviewSubnav's tabs
// instead. Rewritten against the current architecture, and extended to
// cover the Church Intelligence tab that didn't exist when this was
// written.
const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../docs/admin-navigation-contract.md", import.meta.url), "utf8");

assert.equal((app.match(/label:"Admin Review"/g) || []).length, 2, "both role navs must identify the review surface exactly once each");
assert.match(app, /Workspace dropdown retired; its destinations now live contextually/, "expected the retirement comment documenting where the old Workspace menu used to be");

assert.match(app, /function AdminReviewSubnav\(/);
const subnavStart = app.indexOf("function AdminReviewSubnav(");
const subnavTabsLine = app.slice(subnavStart, subnavStart + 400);
for (const [id, label] of [["admin", "Review"], ["concierge", "Concierge"], ["growth", "Growth Engine"], ["church-intelligence", "Church Intelligence"], ["qa", "QA Console"]]) {
  assert.match(subnavTabsLine, new RegExp(`\\['${id}',\\s*'${label}'\\]`), `expected AdminReviewSubnav to include the ${label} tab`);
}

const accountStart = app.indexOf('{label:"My Profile"');
const accountEnd = app.indexOf('].map((item)=>(', accountStart);
assert.ok(accountStart > -1 && accountEnd > accountStart, "account menu block must remain identifiable");
const accountMenu = app.slice(accountStart, accountEnd);
assert.doesNotMatch(accountMenu, /Growth Engine|Concierge/, "operational tools must not be duplicated in the account menu");

assert.match(contract, /Admin Review/);
assert.match(contract, /AdminReviewSubnav/);
assert.match(contract, /founder-owned/);

console.log("B4d navigation contract passed: Admin Review is the single entry point, AdminReviewSubnav carries every operational tab, and Concierge is not duplicated in the account menu.");
