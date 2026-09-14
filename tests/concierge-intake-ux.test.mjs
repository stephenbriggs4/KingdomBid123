import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('concierge intake separates need basics from budget and logistics without dropping gates', () => {
  assert.match(appSource, /Step \{step\} of 4/);
  assert.match(appSource, /step === 3 \? "Need basics" : "Budget & logistics"/);
  assert.match(appSource, /\[1,2,3,4\]\.map/);
  assert.match(appSource, /if \(step < 4\)/);
  assert.match(appSource, /\{step === 4 && <>[\s\S]*Church budget status[\s\S]*Delivery requirement[\s\S]*Faith alignment[\s\S]*Next action date/);
  assert.match(appSource, /if \(step === 4\) \{[\s\S]*church-declared budget band requires Confirmed or Working Range/);
  assert.match(appSource, /The Need stays in Intake with risk Unclassified until the review gate is completed/);
});

test('concierge examples and money are visually distinguishable from entered data', () => {
  assert.match(appSource, /\.fb-concierge-field input::placeholder,.fb-concierge-field textarea::placeholder\{color:#969c91;font-style:italic;font-weight:400;opacity:1\}/);
  assert.match(appSource, /const monetary = typeof value === "string" && value\.trim\(\)\.startsWith\("\$"\)/);
  assert.match(appSource, /\.fb-concierge-metric-value\.money\{font-family:(?:DM Sans|var\(--font-sans\)),sans-serif;font-variant-numeric:tabular-nums/);
});
