import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
assert.ok(!/\.kb1005-quote b\{[^}]*max-width:9em/.test(src), 'quote headline is not squeezed to 9em');
assert.ok(/\.kb1005-quote b\{[^}]*white-space:nowrap/.test(src), 'quote headline stays on one line');
console.log('my-projects-heading: ok');
