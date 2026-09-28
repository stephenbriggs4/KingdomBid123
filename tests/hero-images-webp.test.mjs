import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const landingCss = fs.readFileSync(new URL("../src/styles/landing-v2.css", import.meta.url), "utf8");
const legacyCss = fs.readFileSync(new URL("../src/styles/legacy-route-patches.css", import.meta.url), "utf8");
const marketplaceCss = fs.readFileSync(new URL("../src/styles/marketplace-v2.css", import.meta.url), "utf8");

test("landing-v2.css references the compressed webp hero, not the old png", () => {
  assert.match(landingCss, /url\('\/images\/faithbid-landing-church\.webp'\)/);
  assert.doesNotMatch(landingCss, /faithbid-landing-church\.png/);
});

test("legacy-route-patches.css avatar crops reference the compressed webp heroes, not the old pngs", () => {
  assert.match(legacyCss, /url\("\/images\/faithbid-landing-church\.webp"\)/);
  assert.match(legacyCss, /url\("\/images\/faithbid-marketplace-church-v2\.webp"\)/);
  assert.doesNotMatch(legacyCss, /faithbid-landing-church\.png/);
  assert.doesNotMatch(legacyCss, /faithbid-marketplace-church-v2\.png/);
});

test("marketplace-v2.css references the compressed webp hero, not the old png", () => {
  assert.match(marketplaceCss, /url\('\/images\/faithbid-marketplace-church-v2\.webp'\)/);
  assert.doesNotMatch(marketplaceCss, /faithbid-marketplace-church-v2\.png/);
});

test("the old multi-megabyte png heroes were removed from public/images", () => {
  assert.equal(fs.existsSync(new URL("../public/images/faithbid-landing-church.png", import.meta.url)), false);
  assert.equal(fs.existsSync(new URL("../public/images/faithbid-marketplace-church-v2.png", import.meta.url)), false);
});

test("the compressed webp heroes exist and are under 300KB each", () => {
  const landingStat = fs.statSync(new URL("../public/images/faithbid-landing-church.webp", import.meta.url));
  const marketplaceStat = fs.statSync(new URL("../public/images/faithbid-marketplace-church-v2.webp", import.meta.url));
  assert.ok(landingStat.size < 300 * 1024, `landing hero webp is ${landingStat.size} bytes, expected < 300KB`);
  assert.ok(marketplaceStat.size < 300 * 1024, `marketplace hero webp is ${marketplaceStat.size} bytes, expected < 300KB`);
});
