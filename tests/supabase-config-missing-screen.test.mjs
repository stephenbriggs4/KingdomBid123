import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const clientSource = fs.readFileSync(new URL("../src/supabaseClient.js", import.meta.url), "utf8");
const mainSource = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("supabaseClient no longer falls back to a hardcoded production URL/key", () => {
  assert.doesNotMatch(clientSource, /fallbackSupabaseUrl/);
  assert.doesNotMatch(clientSource, /fallbackSupabaseAnonKey/);
  assert.doesNotMatch(clientSource, /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/, "no hardcoded JWT should remain in source");
});

test("supabaseConfigured/supabaseConfigError reflect real env presence, declared exactly once", () => {
  const configuredMatches = clientSource.match(/export const supabaseConfigured/g) || [];
  assert.equal(configuredMatches.length, 1, "supabaseConfigured must be declared exactly once, not duplicated");
  assert.match(clientSource, /export const supabaseConfigError/);
});

test("main.jsx renders a configuration-missing screen instead of mounting App when unconfigured", () => {
  assert.match(mainSource, /supabaseConfigured/);
  assert.match(mainSource, /ConfigurationMissingScreen/);
  assert.match(mainSource, /supabaseConfigured \? <App \/> : <ConfigurationMissingScreen \/>/);
});
