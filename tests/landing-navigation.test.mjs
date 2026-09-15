import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("desktop landing navigation has the agreed destination set", () => {
  const navBlock = source.match(/<div className="land-nav-links fb-landing-nav-links">([\s\S]*?)<\/div>/)?.[1] || "";
  for (const label of ["For Churches", "For Vendors", "How It Works", "About"]) assert.match(navBlock, new RegExp(`>${label}<`));
  assert.doesNotMatch(navBlock, /enterAccessFlow/);
});

test("mobile landing navigation mirrors desktop and preserves sign-in and access", () => {
  const menu = source.match(/function LandingMobileMenu[\s\S]*?function LandingCoverageMap/)?.[0] || "";
  for (const label of ["For Churches", "For Vendors", "How It Works", "About", "Sign In", "Reserve Church Access"]) assert.match(menu, new RegExp(`>${label}<`));
  assert.match(menu, /closeAndScrollTo\("how-faithbid-works"\)/);
  assert.match(menu, /closeAndScrollTo\("pricing-section"\)/);
});
