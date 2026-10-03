// R-60: fail CI on a large, unnoticed regression in shipped bundle size
// (e.g. an accidental duplicate import or an un-code-split dependency)
// rather than only ever finding out from a slow production page load.
// Budgets carry ~10-15% headroom over the size at the time this was
// written (2026-09-29) so normal feature growth doesn't trip it.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const ASSETS_DIR = path.join(DIST_DIR, "assets");

const BUDGETS = [
  { label: "main JS entry chunk", pattern: /^index-.*\.js$/, maxBytes: 1_250_000 },
  { label: "main CSS bundle", pattern: /^index-.*\.css$/, maxBytes: 150_000 },
];
const TOTAL_DIST_MAX_BYTES = 15_000_000;

function dirSizeBytes(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSizeBytes(full) : fs.statSync(full).size;
  }
  return total;
}

if (!fs.existsSync(DIST_DIR)) {
  console.error("[build-budget] dist/ not found — run `npm run build` first.");
  process.exit(1);
}

let failed = false;

for (const budget of BUDGETS) {
  const match = fs.readdirSync(ASSETS_DIR).find((name) => budget.pattern.test(name));
  if (!match) {
    console.error(`[build-budget] FAIL: no file in dist/assets matched ${budget.pattern} (${budget.label})`);
    failed = true;
    continue;
  }
  const size = zlib.gzipSync(fs.readFileSync(path.join(ASSETS_DIR, match)), { level: 9 }).length;
  const status = size <= budget.maxBytes ? "OK" : "FAIL";
  if (status === "FAIL") failed = true;
  console.log(`[build-budget] ${status}: ${budget.label} (${match}) is ${size.toLocaleString()} bytes gzipped, budget ${budget.maxBytes.toLocaleString()}`);
}

const totalSize = dirSizeBytes(DIST_DIR);
const totalStatus = totalSize <= TOTAL_DIST_MAX_BYTES ? "OK" : "FAIL";
if (totalStatus === "FAIL") failed = true;
console.log(`[build-budget] ${totalStatus}: total dist/ is ${totalSize.toLocaleString()} bytes, budget ${TOTAL_DIST_MAX_BYTES.toLocaleString()}`);

if (failed) {
  console.error("[build-budget] One or more size budgets were exceeded. If this growth is intentional, raise the budget in scripts/check-build-budget.mjs with a note explaining why.");
  process.exit(1);
}
