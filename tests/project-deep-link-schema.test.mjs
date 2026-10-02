import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("project deep links select only columns that exist on the live projects table", () => {
  const start = source.indexOf("const target = getPendingProjectTarget()");
  const end = source.indexOf("const pendingVendor = getPendingVendorTarget()", start);
  assert.notEqual(start, -1, "expected pending-project deep-link effect");
  assert.notEqual(end, -1, "expected pending-vendor effect after project deep-link effect");
  const effect = source.slice(start, end);

  assert.match(effect, /\.from\("projects"\)/);
  assert.match(effect, /\.eq\("id", targetId\)/);
  assert.match(effect, /hired_vendor_id/);
  assert.doesNotMatch(effect, /hired_vendor_name/);
  assert.doesNotMatch(effect, /hired_bid_id/);
  assert.doesNotMatch(effect, /[,\"]amount[,\"]/);
});
