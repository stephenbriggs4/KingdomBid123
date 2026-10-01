import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = relative => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');

test('CI rejects any increase in the reviewed ESLint debt', () => {
  const workflow = read('.github/workflows/ci.yml');
  const checker = read('scripts/check-lint-baseline.mjs');
  const baseline = JSON.parse(read('quality/eslint-baseline.json'));
  assert.match(workflow, /node scripts\/check-lint-baseline\.mjs/);
  assert.match(checker, /counts\.errors > prior\.errors/);
  assert.match(checker, /counts\.warnings > prior\.warnings/);
  assert.match(checker, /current\.errors > baseline\.errors/);
  assert.ok(baseline.errors > 0, 'baseline must honestly preserve existing debt');
  assert.ok(Object.keys(baseline.files).length > 0);
});
