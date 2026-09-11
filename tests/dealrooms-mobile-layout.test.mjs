import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/MessagesScreen.jsx', import.meta.url), 'utf8');

test('Needs Me remains in the Deal Rooms control row on mobile', () => {
  assert.match(source, /aria-label=\{`Show Deal Rooms needing my action \(\$\{needsMeCount\}\)`\}/);
  assert.match(source, /\.kbdr2-hub-controls\{display:grid;grid-template-columns:minmax\(0,1fr\) auto;align-items:center/);
  assert.match(source, /\.kbdr2-hub-tabs\{width:auto;min-width:0;overflow-x:auto\}/);
  assert.match(source, /@media\(max-width:430px\)[\s\S]*\.kbdr2-hub-needs-me>span:nth-child\(2\)\{display:none\}/);
  assert.doesNotMatch(source, /\.kbdr2-hub-controls\{align-items:stretch;flex-direction:column/);
});
