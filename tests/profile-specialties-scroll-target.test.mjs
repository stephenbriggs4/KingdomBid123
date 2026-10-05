import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const profile = readFileSync(new URL("../src/ProfileScreen.jsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("a pending specialties scroll target opens the vendor tab even when initialTab is passed", () => {
  // App always passes initialTab="overview" for the profile route, so the scroll target must win.
  assert.match(profile, /const \[tab, setTab\] = useState\(profileScrollTarget \? "vendor" : \(initialTab \|\| "profile"\)\);/);
  assert.doesNotMatch(profile, /useState\(initialTab \|\| \(profileScrollTarget/);
});

test("the My Work Manage specialties button still sets the scroll target the Profile screen consumes", () => {
  assert.match(app, /sessionStorage\.setItem\('kb_profile_scroll_to','profile-specialties-panel'\)/);
  assert.match(profile, /getItem\("kb_profile_scroll_to"\)/);
  assert.match(profile, /id="profile-specialties-panel"/);
});
