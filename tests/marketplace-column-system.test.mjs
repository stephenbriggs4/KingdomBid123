import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/marketplace-v2.css', import.meta.url), 'utf8');

test('one shared column count drives every Marketplace width', () => {
  assert.match(css, /--kb-mkt-cols:\s*4;/);
  assert.match(css, /--kb-mkt-w:\s*calc\(var\(--kb-mkt-cols\) \* var\(--kb-project-card-w, 206px\) \+ \(var\(--kb-mkt-cols\) - 1\) \* var\(--kb-project-card-gap-x, 10px\)\);/);
  assert.match(css, /@media \(min-width: 760px\) and \(max-width: 1099px\)\s*\{\s*\.mkt2-root \{ --kb-mkt-cols: 3; \}/);
  assert.match(css, /@media \(min-width: 1600px\)\s*\{\s*\.mkt2-root \{ --kb-mkt-cols: 6; \}/);
  assert.match(css, /@media \(max-width: 759px\)\s*\{\s*\.mkt2-root \{ --kb-mkt-cols: 1; \}/);
});

test('header text, categories and body share the card block edges', () => {
  assert.match(css, /\.mkt2-root \.mkt2-header__inner\s*\{[^}]*padding:[^;]*max\(24px, calc\(\(100% - var\(--kb-mkt-w\)\) \/ 2\)\)/s);
  assert.match(css, /\.mkt2-root \.mkt2-categories\s*\{[^}]*width:\s*min\(var\(--kb-mkt-w\), calc\(100% - 48px\)\)/s);
  assert.match(css, /\.kb-marketplace-projects-body\s*\{[^}]*width:\s*min\(var\(--kb-mkt-w\), calc\(100% - 48px\)\)/s);
  assert.match(css, /\.kb-marketplace-directory-body\s*\{[^}]*width:\s*min\(var\(--kb-mkt-w\), calc\(100% - 48px\)\)/s);
});

test('rails, headings and grids no longer hardcode 4-card or 5-card widths', () => {
  assert.doesNotMatch(app, /calc\([45] \* var\(--kb-project-card-w\)/);
  assert.doesNotMatch(app, /repeat\(auto-fill,\s*var\(--kb-project-card-w\)\)/);
  assert.match(app, /\.kb-marketplace-vendor-grid\{display:grid!important;grid-template-columns:repeat\(var\(--kb-mkt-cols,4\),var\(--kb-project-card-w\)\)/);
  assert.match(app, /\.kb-marketplace-project-grid\{\s*display:grid!important;\s*grid-template-columns:repeat\(var\(--kb-mkt-cols,4\),var\(--kb-project-card-w\)\)/);
});

test('featured projects pool is large enough to fill the widest rail', () => {
  assert.match(app, /return safeArray\(source\)\.slice\(0, 9\);/);
});
