import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("the hire confirmation renders from both full and compact bid review routes", () => {
  assert.match(source, /const stripeModalNode = stripeModal \? \(/);
  assert.match(source, /if\(view==="bids"\)[\s\S]*?\{stripeModalNode\}/);
  assert.match(
    source,
    /if\(view==="detail" && selectedProject\)[^\n]*\{bidReviewModalNode\}\{stripeModalNode\}/,
  );
});

test("the shared hire confirmation still commits through confirmHire", () => {
  assert.match(source, /onSuccess=\{\(\)=>confirmHire\(stripeModal\?\.bid\?\.id\)\}/);
});
