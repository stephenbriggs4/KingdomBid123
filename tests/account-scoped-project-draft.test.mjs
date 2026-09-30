import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("project drafts are scoped to the authenticated account and anonymous browser session", () => {
  assert.match(source, /postProjectDraftPrefix: "kb:postProjectDraft:v2:"/);
  assert.match(source, /currentUser\?\.id \|\| "anonymous-session"/);
  assert.match(source, /currentUser\?\.id \? window\.localStorage : window\.sessionStorage/);
  assert.match(source, /window\.localStorage\.removeItem\("kb:postProjectDraft:v1"\)/);
});

test("sign-out cleanup removes every account-scoped project draft on the browser", () => {
  assert.match(source, /key\?\.startsWith\(KB_STORAGE_KEYS\.postProjectDraftPrefix\)/);
});
