import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const sources = [
  readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8'),
  readFileSync(new URL('../src/ProjectsScreen.jsx', import.meta.url), 'utf8'),
];

function loadBudgetHelpers(source) {
  const start = source.indexOf('  const parseBudgetBounds =');
  const end = source.indexOf('  const normalizedProjects =', start);
  assert.ok(start >= 0 && end > start, 'budget helpers must remain available to the project screen');
  const context = {
    formatMoney: value => `$${Number(value).toLocaleString('en-US')}`,
  };
  vm.runInNewContext(
    `${source.slice(start, end)}\nthis.budgetApi = { parseBudgetBounds, formatBudgetDisplay, formatBudgetAggregate };`,
    context,
  );
  return context.budgetApi;
}

for (const [index, source] of sources.entries()) {
  test(`budget ranges remain truthful in project screen source ${index + 1}`, () => {
    const { parseBudgetBounds, formatBudgetDisplay, formatBudgetAggregate } = loadBudgetHelpers(source);

    const commaRange = parseBudgetBounds('$1,000-$2,500');
    assert.equal(commaRange.min, 1000);
    assert.equal(commaRange.max, 2500);
    assert.equal(formatBudgetDisplay({ budget:'$1,000-$2,500' }, commaRange), '$1,000-$2,500');

    const abbreviatedRange = parseBudgetBounds('$10k–$25k');
    assert.equal(abbreviatedRange.min, 10000);
    assert.equal(abbreviatedRange.max, 25000);

    const explicitBounds = parseBudgetBounds('$1,000-$2,500', 1200, 2400);
    assert.equal(explicitBounds.min, 1200);
    assert.equal(explicitBounds.max, 2400);

    assert.equal(
      formatBudgetAggregate([
        { budgetBounds:{ min:1000, max:2500 } },
        { budgetBounds:{ min:500, max:500 } },
      ]),
      '$1,500–$3,000',
    );

    assert.match(source, /budgetSortValue: budgetBounds\.max \|\| budgetBounds\.min \|\| 0/);
    assert.match(source, /value=\{project\.budgetDisplay\}/);
    assert.doesNotMatch(source, /parseBudgetValue/);
  });
}
