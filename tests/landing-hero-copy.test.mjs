import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("landing hero uses the approved concise headline without changing the lockup", () => {
  assert.match(source, />Where calling meets craft\.<\/h1>/);
  assert.match(source, /faithbid-final-wordmark\.png/);
  assert.match(source, /FaithBid — Faith founded\. Service driven\./);
});

test("landing hero subtitle has explicit prelaunch and launched copy", () => {
  assert.match(source, /const LANDING_HERO_SUBTITLE = LAUNCHED/);
  assert.match(source, /Our first Dallas pilot is forming now\./);
  assert.match(source, /Now serving Dallas–Fort Worth\./);
  assert.match(source, /from AV to accounting/);
  assert.match(source, /Businesses find work that matters\./);
});
