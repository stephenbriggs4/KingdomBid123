import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("public vendor profile never shows invented capabilities", () => {
  assert.doesNotMatch(app, /'Church-focused service', 'Project planning', 'Clear handoff'/);
  assert.match(app, /const vendorDetailScopeItems = \(vendorDetailOfferings\.length \? vendorDetailOfferings : \[vendorDetailCategory\]\.filter\(Boolean\)\)\.slice\(0,6\);/);
});
