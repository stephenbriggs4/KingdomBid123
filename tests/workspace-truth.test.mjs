import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const workspaceSource = readFileSync(new URL('../src/WorkspaceScreens.jsx', import.meta.url), 'utf8');

test('compare history is labeled as a saved snapshot rather than a shortlist decision', () => {
  assert.match(workspaceSource, /Saved .*with these match signals:/s);
  assert.match(workspaceSource, /Snapshot only; current verification and project facts appear above\./);
  assert.doesNotMatch(workspaceSource, /Shortlisted .*because:/s);
  assert.doesNotMatch(workspaceSource, /Watchout noted .*:/s);
});

test('compare rows use stable render keys and activity does not keep unused compare state', () => {
  assert.doesNotMatch(workspaceSource, /Math\.random\(\)/);
  assert.match(workspaceSource, /`compare-signal-\$\{vendorIndex\}`/);
  assert.doesNotMatch(workspaceSource, /\[compareState,\s*setCompareState\]/);
});
