import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("the project completion caption counts the same rows as the percentage", () => {
  assert.match(app, /const completionPct = countableRows\.length \? Math\.round\(\(countableRows\.filter\(p=>p\.completed\)\.length \/ countableRows\.length\) \* 100\) : 0;/);
  assert.match(app, /\{countableRows\.filter\(p=>p\.completed\)\.length\} completed of \{countableRows\.length\}/);
  assert.doesNotMatch(app, /\{groups\.completed\.length\} completed of \{rows\.length\} total projects/);
});
