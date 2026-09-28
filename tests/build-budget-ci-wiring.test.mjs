import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const ci = fs.readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");

test("package.json exposes a test:build-budget script pointing at the checker", () => {
  assert.equal(pkg.scripts["test:build-budget"], "node scripts/check-build-budget.mjs");
});

test("CI runs the build budget check right after building, before the test suites", () => {
  const buildIdx = ci.indexOf("npm run build");
  const budgetIdx = ci.indexOf("npm run test:build-budget");
  const hardeningIdx = ci.indexOf("npm run test:hardening");
  assert.ok(buildIdx !== -1 && budgetIdx !== -1 && hardeningIdx !== -1, "expected all three steps present in ci.yml");
  assert.ok(buildIdx < budgetIdx && budgetIdx < hardeningIdx, "expected order: build -> budget check -> test suites");
});

test("the checker script exists and exports size budgets with headroom over current output", () => {
  const script = fs.readFileSync(new URL("../scripts/check-build-budget.mjs", import.meta.url), "utf8");
  assert.match(script, /maxBytes: 4_500_000/);
  assert.match(script, /maxBytes: 1_050_000/);
  assert.match(script, /TOTAL_DIST_MAX_BYTES = 15_000_000/);
});
