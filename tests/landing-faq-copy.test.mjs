import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("landing FAQ answers the four missing pilot trust questions", () => {
  for (const question of [
    "What is the difference between Marketplace Approved and Faith Verified?",
    "When will the Dallas pilot open?",
    "What happens to my information if the pilot does not reach my area?",
    "Is there a cost to apply for Faith Verified if I am not accepted?",
  ]) assert.match(source, new RegExp(question.replace(/[?]/g, "\\?")));
});

test("trust answers preserve decision and pricing honesty", () => {
  assert.match(source, /Neither status guarantees project fit or work quality/);
  assert.match(source, /does not currently charge to apply for Faith Verified/);
  assert.match(source, /request removal by contacting \$\{BRAND\.supportEmail\}/);
});

test("the fourth prelaunch tile uses a countable noun-and-label shape", () => {
  assert.match(source, /\{num:"2", label:"Distinct trust signals"\}/);
  assert.doesNotMatch(source, /\{num:"Evidence", label:"Trust before claims"\}/);
});
