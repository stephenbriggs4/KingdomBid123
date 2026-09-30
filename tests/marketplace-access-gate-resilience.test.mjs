import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("marketplace access reads have a deadline and abortable Supabase requests", () => {
  assert.match(source, /label: "Marketplace access check"/);
  const gateStart = source.indexOf("const loadGate = async");
  const gateBlock = source.slice(gateStart, gateStart + 7000);
  assert.ok((gateBlock.match(/\.abortSignal\(signal\)/g) || []).length >= 5);
});

test("an unavailable gate remains pending and offers retry instead of becoming a denial", () => {
  assert.match(source, /setMarketplaceGateError\("FaithBid could not verify marketplace access/);
  assert.match(source, /setMarketplaceGateRetry\(value=>value\+1\)/);
  const catchStart = source.indexOf('logError("private-marketplace-access-read"');
  const catchBlock = source.slice(catchStart, catchStart + 600);
  assert.doesNotMatch(catchBlock, /setMarketplaceGateLoaded\(true\)/);
});
