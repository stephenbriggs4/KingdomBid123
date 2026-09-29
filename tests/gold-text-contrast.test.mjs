import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

// R-70 (contrast check): --gold (#E8E0D0) is a light decorative accent
// calibrated for dark surfaces (e.g. the navy/photographic landing hero,
// where it passes WCAG AA at 9.83:1). Several rules reused it as *text*
// color on light card/form backgrounds instead -- against white, cream, or
// --gold-pale it computes to roughly 1.2-1.3:1, i.e. the text is nearly
// invisible. --gold-text (#6B5B3E) is the established dark-gold token
// already used 30+ times elsewhere specifically for readable text on light
// backgrounds (passes ~6.5:1 against white).
const shouldUseGoldText = [
  ["tag-opt.sel selected review-tag chip (on --gold-pale)", /\.tag-opt\.sel\{[^}]*color:var\(--gold-text\)/],
  ["auth-switch sign-in/up toggle button", /\.auth-switch button\{[^}]*color:var\(--gold-text\)/],
  ["vendor-rating-stars (on --cream vendor card footer)", /\.vendor-rating-stars\{color:var\(--gold-text\)/],
  ["review-reply-label (on a light cream reply box)", /\.review-reply-label\{[^}]*color:var\(--gold-text\)/],
  ["pricing-role eyebrow (on a white pricing card)", /\.pricing-role\{[^}]*color:var\(--gold-text\)/],
];

for (const [label, pattern] of shouldUseGoldText) {
  test(`${label} uses the readable --gold-text token, not light --gold, as text color`, () => {
    assert.match(source, pattern);
  });
}

test("the landing hero italic word keeps --gold as text color (correct: it renders on the dark hero background)", () => {
  assert.match(source, /\.land-h1 span\{[^}]*color:var\(--gold\);/);
});
