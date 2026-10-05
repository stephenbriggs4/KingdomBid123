import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("sign-in error banner is announced as an alert", () => {
  assert.match(app, /const errBanner=error\?\(\s*\n?\s*<div role="alert" style=\{\{padding:"12px 16px",background:"rgba\(239,68,68,0\.08\)"/);
});

test("sign-in success message is announced politely as a status", () => {
  assert.match(app, /\):successMsg\?\(\s*\n?\s*<div role="status" style=\{\{padding:"12px 16px",background:"rgba\(34,197,94,0\.08\)"/);
});
