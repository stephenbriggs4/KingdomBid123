import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/marketplace-v2.css', import.meta.url), 'utf8');

test('empty project inventory renders one intentional empty state without redundant controls', () => {
  assert.match(app, /marketplaceIntelligenceStats\.open > 0 \|\| hasBrowseRefinements/);
  assert.match(app, /mkt2-project-results\$\{liveAllProjects\.length === 0 \? ' is-empty'/);
  assert.match(css, /mkt2-project-results\.is-empty \.kb-live-all-head\s*\{[^}]*display:\s*none/s);
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
