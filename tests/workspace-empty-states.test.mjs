import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const reviews = fs.readFileSync(new URL("../src/ReviewsScreen.jsx", import.meta.url), "utf8");
const component = fs.readFileSync(new URL("../src/KBWorkspaceEmptyState.jsx", import.meta.url), "utf8");

assert.match(component, /export default function KBWorkspaceEmptyState/);
assert.match(component, /data-kb-empty-state="workspace"/);
assert.match(component, /minHeight = "clamp\(340px, 52vh, 480px\)"/);
assert.match(component, /display: "grid"/);
assert.match(component, /placeItems: "center"/);

for (const surfaceClass of [
  "kb-marketplace-primary-empty",
  "fb-concierge-primary-empty",
]) {
  assert.match(app, new RegExp(`className="${surfaceClass}"`), `${surfaceClass} must use the shared primary empty state`);
}
assert.match(app, /normalizedProjects\.length === 0[\s\S]{0,220}<KBWorkspaceEmptyState/);
assert.match(reviews, /reviews\.length === 0[\s\S]{0,120}<KBWorkspaceEmptyState/);
assert.match(reviews, /className="kb-reviews-primary-empty"/);

assert.doesNotMatch(app, /className="fb-concierge-cold-start"/);
assert.doesNotMatch(reviews, /padding:"68px 42px"/);

console.log("B4b empty-state contract passed: Marketplace, Concierge, Reviews, and My Projects share one vertically balanced zero-data state.");
