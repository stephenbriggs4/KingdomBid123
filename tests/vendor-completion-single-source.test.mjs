import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calcVendorCompletion } from "../src/vendorCompletion.js";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const profile = readFileSync(new URL("../src/ProfileScreen.jsx", import.meta.url), "utf8");
const shared = readFileSync(new URL("../src/vendorCompletion.js", import.meta.url), "utf8");

const FULL_VENDOR = {
  name: "Acme Facilities",
  bio: "x".repeat(120),
  faith_statement: "We serve our city in faith and integrity every day.",
  city: "Dallas",
  tags: ["HVAC"],
  tagline: "Reliable facility care for churches.",
  church_sizes_served: ["small", "large"],
  service_state: "TX",
};

test("portfolio/proof completion is rewarded and moves the score", () => {
  const without = calcVendorCompletion({ ...FULL_VENDOR, _hasPortfolio: false });
  const withProof = calcVendorCompletion({ ...FULL_VENDOR, _hasPortfolio: true });
  assert.equal(withProof.pct - without.pct, 20);
  assert.equal(withProof.pct, 100);
  assert.ok(without.missing.includes("Portfolio item"));
});

test("a fully filled vendor reaches 100 and an empty vendor reaches 0", () => {
  assert.equal(calcVendorCompletion({ ...FULL_VENDOR, _hasPortfolio: true }).pct, 100);
  assert.equal(calcVendorCompletion({}).pct, 0);
  assert.equal(calcVendorCompletion(null).pct, 0);
});

test("admin-controlled status such as Faith Verified is never part of the score", () => {
  const labels = calcVendorCompletion({}).checks.map(c => c.label);
  assert.equal(labels.some(label => /verif/i.test(label)), false);
  assert.equal(
    calcVendorCompletion({ ...FULL_VENDOR, _hasPortfolio: true, verified: false, is_verified: false, isVerified: false }).pct,
    100,
  );
});

test("the score updates when portfolio data changes", () => {
  const before = calcVendorCompletion({ ...FULL_VENDOR, _hasPortfolio: false }).pct;
  const after = calcVendorCompletion({ ...FULL_VENDOR, _hasPortfolio: true }).pct;
  assert.ok(after > before);
});

test("the shared module owns the checklist and App.jsx no longer defines its own copy", () => {
  assert.match(shared, /export function calcVendorCompletion/);
  assert.doesNotMatch(app, /^function calcVendorCompletion\(/m);
  assert.match(app, /import \{ calcVendorCompletion \} from "\.\/vendorCompletion";/);
});

test("Profile and My Work both read the same canonical calculation", () => {
  assert.match(profile, /import \{ calcVendorCompletion \} from "\.\/vendorCompletion";/);
  assert.match(profile, /const completion = vendorRow\s*\?\s*calcVendorCompletion\(\{ \.\.\.vendorRow, _hasPortfolio: \(overviewStats\.portfolioCount \|\| 0\) > 0 \}\)/);
  assert.match(profile, /const pct = completion \? completion\.pct/);
  assert.match(profile, /<VendorCompletionMeter vendorRow=\{vendorRow\} portfolioCount/);
  assert.match(app, /const data = calcVendorCompletion\(\{ \.\.\.vendorRow, _hasPortfolio: portfolioCount > 0 \}\);/);
  assert.doesNotMatch(profile, /vendorRow\s*\?\s*Math\.round\(checks/);
});

test("the helper exposes an accurate remaining count and the next vendor-completable item", () => {
  const empty = calcVendorCompletion({});
  assert.equal(empty.remaining, 9);
  assert.equal(empty.next.key, "name");
  assert.equal(empty.next.label, "Business name");

  const almost = calcVendorCompletion({ ...FULL_VENDOR, _hasPortfolio: false });
  assert.equal(almost.remaining, 1);
  assert.equal(almost.next.key, "portfolio");

  const done = calcVendorCompletion({ ...FULL_VENDOR, _hasPortfolio: true });
  assert.equal(done.remaining, 0);
  assert.equal(done.next, null);
});

test("the next item is always something the vendor can complete and it follows saved data", () => {
  const vendorControlled = new Set(calcVendorCompletion({}).checks.map(c => c.key));
  assert.equal(vendorControlled.has("faith_verified"), false);
  const next = calcVendorCompletion({ ...FULL_VENDOR, tags: [], _hasPortfolio: true }).next;
  assert.equal(next.key, "tags");
  assert.equal(next.label, "Skills / specialties");
  const after = calcVendorCompletion({ ...FULL_VENDOR, tags: ["HVAC"], _hasPortfolio: true });
  assert.equal(after.next, null);
});

test("Profile reads remaining count and next step from the canonical helper, not a second checklist", () => {
  assert.match(profile, /const completion = vendorRow\s*\?\s*calcVendorCompletion\(/);
  assert.match(profile, /const remainingCount = completion \? completion\.remaining/);
  assert.match(profile, /completion\.next \?/);
  assert.match(profile, /\{remainingCount\} step/);
  // The vendor branch reads the canonical helper; only the church fallback keeps its own checklist.
  assert.match(profile, /remainingCount = completion \? completion\.remaining : checks\.filter/);
  assert.doesNotMatch(profile, /label:"Budget range"[^\n]*\n[^\n]*setTab\("vendor"\)[\s\S]{0,40}Next up/);
});
