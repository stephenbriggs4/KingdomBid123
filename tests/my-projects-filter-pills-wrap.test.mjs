import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const app = readFileSync(join(here, "..", "src", "App.jsx"), "utf8");

test("My Projects filter pills wrap their label instead of spilling out of the oval", () => {
  assert.match(app, /\.kb1005-filter-cell\{height:auto;min-height:50px;min-width:0;padding:8px 12px;border-radius:999px;white-space:normal;/);
  assert.match(app, /\.kb1005-filter-cell>span:not\(\.kb1005-filter-count\)\{min-width:0;overflow-wrap:anywhere\}/);
});

test("My Projects side panel stacks below the list between 821px and 1180px so the toolbar fits", () => {
  assert.match(app, /@media\(min-width:821px\) and \(max-width:1180px\)\{\.kb1005-layout\{grid-template-columns:minmax\(0,1fr\)\}\}/);
});
