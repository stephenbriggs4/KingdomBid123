import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");

test("Hire again carries the vendor into Post Project without writing project data", () => {
  assert.match(source, /const KB_HIRE_AGAIN_SEED_KEY = 'kb:hireAgainSeed';/);
  assert.match(
    source,
    /sessionStorage\.setItem\(KB_HIRE_AGAIN_SEED_KEY, JSON\.stringify\(\{ vendorName: b\.vendor_name \|\| "your past partner", category: b\.category \|\| "" \}\)\)/,
  );
  assert.match(source, /nav\("projects"\);/);
  assert.match(source, /setTimeout\(\(\) => document\.dispatchEvent\(new CustomEvent\("kb:post-project"\)\), 300\)/);
});

test("Post Project consumes the Hire Again seed once and prefills vendor context", () => {
  assert.match(source, /const raw = sessionStorage\.getItem\(KB_HIRE_AGAIN_SEED_KEY\);/);
  assert.match(source, /sessionStorage\.removeItem\(KB_HIRE_AGAIN_SEED_KEY\);/);
  assert.match(source, /`Follow-up work with \$\{hireAgainSeed\.vendorName\}`/);
  assert.match(source, /seed\.primary_category \|\| hireAgainSeed\?\.category/);
});
