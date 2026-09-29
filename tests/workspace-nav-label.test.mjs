import assert from "node:assert/strict";
import fs from "node:fs";

// R-65 (2026-09-29): this test used to assert the topnav "Workspace"
// dropdown trigger's label/CSS geometry. That dropdown was deliberately
// retired -- see the comment at its old call site: "1008: Workspace
// dropdown retired; its destinations now live contextually." -- so
// asserting the old markup exists is testing for a regression that was
// actually an intentional redesign. Rewritten to confirm the retirement
// holds instead of chasing the old, no-longer-true contract.
const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

assert.doesNotMatch(
  app,
  /className="kb-topnav-trigger-label">Workspace<\/span>/,
  "the Workspace dropdown trigger was intentionally retired (see the 1008 comment) -- if this now matches, either it was reintroduced or the retirement comment should be checked",
);
assert.match(
  app,
  /Workspace dropdown retired; its destinations now live contextually/,
  "expected the retirement comment marking where the Workspace trigger used to live",
);

console.log("B4c workspace label: confirmed the Workspace dropdown trigger stays retired, as intended.");
