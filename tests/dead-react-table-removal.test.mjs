import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("the unused DataTable component (and its @tanstack/react-table usage) was removed from App.jsx", () => {
  assert.doesNotMatch(source, /function DataTable\(/);
  assert.doesNotMatch(source, /@tanstack\/react-table/);
  assert.doesNotMatch(source, /useReactTable\(/);
});

test("@tanstack/react-table is no longer a declared dependency", () => {
  assert.equal(pkg.dependencies["@tanstack/react-table"], undefined);
});
