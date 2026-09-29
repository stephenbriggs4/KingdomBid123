import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("the public footer exposes every required destination and contact", () => {
  for (const label of ["About", "How It Works", "Pricing", "FAQ", "Get Plugged In", "Partner", "Privacy", "Terms"]) {
    assert.match(source, new RegExp(`>${label}<`));
  }
  assert.match(source, /mailto:\$\{cfg\.contactEmail\}/);
  assert.match(source, /© \{currentYear\} \{cfg\.owner\}\. All rights reserved\./);
});

test("privacy and terms resolve to honest public under-review screens", () => {
  assert.match(source, /screen==="privacy"\s*&& <PublicPolicyUnderReviewScreen/);
  assert.match(source, /screen==="terms"\s*&& <PublicPolicyUnderReviewScreen/);
  assert.match(source, /Privacy policy under review\./);
  assert.match(source, /Terms of service under review\./);
});

test("footer navigation reuses real routes and landing section targets", () => {
  assert.match(source, /goToLandingSection\("how-faithbid-works"\)/);
  assert.match(source, /goToLandingSection\("pricing-section"\)/);
  assert.match(source, /goToLandingSection\("landing-faq-section"\)/);
  assert.match(source, /nav\??\.?\("get-plugged-in"\)/);
  assert.match(source, /nav\?\.\("partner"\)/);
});
