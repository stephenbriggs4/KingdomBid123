import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const profile = readFileSync(new URL("../src/ProfileScreen.jsx", import.meta.url), "utf8");

test("owners cannot edit completed or archived projects from the detail page", () => {
  assert.match(app, /const ownerCanEditDetail = viewerCanManageProject && !project\?\.completed && !project\?\.archived;/);
  assert.match(app, /\]\.filter\(Boolean\);\s*\n\s*return \(\s*\n\s*<div className="kb-project-preview-page/);
});

test("vendors edit their faith statement only on Public profile", () => {
  assert.match(profile, /\{role !== "vendor" && \(\s*\n\s*<div style=\{\{\.\.\.psx\.field,marginBottom:0\}\}>\s*\n\s*<label style=\{psx\.label\} htmlFor="ob-faith">/);
  assert.match(profile, /<textarea id="vf-faith"/);
});
