import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/WaitlistScreen.jsx", import.meta.url), "utf8");

test("public access-form placeholders do not use named people or real-looking churches", () => {
  assert.doesNotMatch(source, /Pastor Sarah Chen|Grace Community Church|sarah@gracechurch|Alex Martinez/);
});
