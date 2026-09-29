import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync(new URL("../src/index.css", import.meta.url), "utf8");

test("a global :focus-visible safety net restores keyboard focus visibility app-wide", () => {
  assert.match(css, /html body :focus-visible\s*\{/);
  const ruleMatch = css.match(/html body :focus-visible\s*\{([^}]*)\}/);
  assert.ok(ruleMatch, "expected the :focus-visible rule block");
  assert.match(ruleMatch[1], /outline:\s*2px solid #b88a38\s*!important/);
  assert.match(ruleMatch[1], /outline-offset:\s*2px\s*!important/);
});
