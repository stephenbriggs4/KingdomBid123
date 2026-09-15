import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('marketplace role defaults point each account at its primary job', () => {
  assert.match(source, /defaultMarketplaceProjectTab = \(role === "church" \|\| role === "individual"\) \? "vendors" : "browse"/);
  assert.match(source, /marketplaceDefaultSubTab = \(role === "church" \|\| role === "individual"\) \? "vendors" : "browse"/);
});

test('explicit vendor and project routes restore the selected marketplace view', () => {
  assert.match(source, /if \(route === "projects"\) return "browse"/);
  assert.match(source, /"vendors": "vendors"/);
  assert.match(source, /window\.location\.hash = getProjectSubTabRoute\(normalizedSubTab\)/);
  assert.match(source, /setNavSubTab\(target === "projects" \? targetSubTab : null\)/);
});

test('vendors may intentionally cross to the directory without changing role or access', () => {
  assert.match(source, /const projectTab = normalizedProjectTab/);
  assert.match(source, /const safeTab = requestedTab/);
  assert.doesNotMatch(source, /role === "vendor" && normalizedProjectTab === "vendors" \? "browse"/);
  assert.doesNotMatch(source, /role !== "vendor" \|\| navSubTab !== "vendors"/);
});

test('toggle selection is always passed to the restorable route owner', () => {
  assert.match(source, /if \(onSubTabChange\) onSubTabChange\(safeTab\)/);
  assert.doesNotMatch(source, /onSubTabChange\(safeTab === defaultMarketplaceProjectTab \? null : safeTab\)/);
});
