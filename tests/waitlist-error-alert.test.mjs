import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/WaitlistScreen.jsx", import.meta.url), "utf8");

test("request-access validation errors are announced to screen readers", () => {
  assert.match(source, /setErr\("Please fill in the required fields\."\)/);
  assert.match(source, /\{err \? \(\s*\n\s*<div role="alert"/);
});
