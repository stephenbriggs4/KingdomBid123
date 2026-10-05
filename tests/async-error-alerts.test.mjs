import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const accountScreens = readFileSync(new URL("../src/AccountScreens.jsx", import.meta.url), "utf8");

test("the vendor bid submission error is announced to screen readers", () => {
  assert.match(app, /\{err \? \(\s*\n?\s*<div role="alert" style=\{\{padding:'10px 12px', borderRadius:10/);
});

test("the password-reset error is announced to screen readers", () => {
  assert.match(accountScreens, /\{error && <div role="alert" style=\{\{padding:"12px 16px"/);
});
