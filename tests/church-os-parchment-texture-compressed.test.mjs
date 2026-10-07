import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const app = readFileSync(join(here, "..", "src", "App.jsx"), "utf8");
const root = join(here, "..");

test("Church OS canvas texture uses the compressed JPEG, not the old 1.6MB PNG", () => {
  assert.match(app, /background-image:url\("\/textures\/church-os-parchment\.jpg"\)/);
  assert.doesNotMatch(app, /church-os-parchment\.png/);
});

test("Church OS canvas texture file is small (opaque background texture, safe to compress)", () => {
  const stat = statSync(join(root, "public", "textures", "church-os-parchment.jpg"));
  assert.ok(stat.size < 300_000, `expected the compressed texture to stay well under 300KB, got ${stat.size} bytes`);
});
