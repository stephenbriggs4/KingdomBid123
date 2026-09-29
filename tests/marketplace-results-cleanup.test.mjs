import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/marketplace-v2.css', import.meta.url), 'utf8');

test('empty project inventory renders one intentional empty state without redundant controls', () => {
  assert.match(app, /liveAllProjects\.length > 0 \? <div className="kbm-mp-toolbar"/);
  assert.match(app, /mkt2-project-results\$\{liveAllProjects\.length === 0 \? ' is-empty'/);
  assert.match(css, /mkt2-project-results\.is-empty \.kb-live-all-head\s*\{[^}]*display:\s*none/s);
});

// R-65 (2026-09-29): category-filter matching was simplified from a
// canonical-category-set comparison (selectedCanonicalCats) to a direct
// catFilter/p.category string match; __kbDeriveProjectCategories is still
// used, just for search-term matching (termCanonicalCats) rather than the
// category filter itself. Same guarantee (no sample-data fallback, real
// open-project query), different implementation shape.
test('category filters use canonical project taxonomy and never a sample-data fallback', () => {
  assert.match(app, /catFilter === 'All' \|\| String\(p\.category \|\| ''\) === catFilter/);
  assert.match(app, /__kbDeriveProjectCategories\(project\)/);
  assert.match(app, /const filtered = Array\.isArray\(filteredProjects\) \? filteredProjects : \[\];/);
  assert.doesNotMatch(app, /const sources = hasBrowseRefinements\s*\? \[filtered\]\s*:\s*\[filtered\.length \? filtered : open\]/s);
  assert.match(app, /\.from\("projects"\)[\s\S]*?\.eq\("status", "open"\)/);
  assert.match(app, /No projects match this view/);
});

test('empty vendor inventory removes controls that cannot affect any records', () => {
  assert.match(app, /vendors\.length > 0 \|\| activeFilterCount > 0/);
  assert.match(app, /title="Approved vendors will appear here"/);
  assert.match(app, /className="kb-marketplace-primary-empty mkt2-vendor-empty"/);
});

test('empty states use one card rather than a decorated outer card around an inner card', () => {
  assert.match(css, /\.mkt2-root \.kb-marketplace-primary-empty\s*\{[^}]*border:\s*0 !important;[^}]*background:\s*transparent !important;[^}]*box-shadow:\s*none !important;/s);
  assert.match(css, /\.mkt2-root \.kb-marketplace-primary-empty > div/);
});

test('populated result controls collapse into a compact utility row', () => {
  assert.match(css, /html body #root \.mkt2-root \.kb-vendor-toolbar,[\s\S]*width:\s*auto !important;/);
  assert.match(css, /\.mkt2-root \.kbm-mp-filter-row\s*\{[^}]*display:\s*flex !important;/s);
});

test('populated project results expose one truthful heading and one responsive card grid', () => {
  assert.match(app, /className="mkt2-results-heading mkt2-project-results-heading"/);
  assert.match(app, /Every card represents a real, published brief/);
  assert.match(css, /\.mkt2-root \.kb-live-handpicked-hero,[\s\S]*\.kb-live-featured-detached\s*\{[^}]*display:\s*none !important;/s);
  assert.match(css, /\.mkt2-root \.kb-live-all-grid\s*\{[^}]*repeat\(3, minmax\(0, 1fr\)\)/s);
});
