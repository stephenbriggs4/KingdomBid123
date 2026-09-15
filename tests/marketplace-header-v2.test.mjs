import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles/marketplace-v2.css', import.meta.url), 'utf8');
const image = new URL('../public/images/faithbid-marketplace-church-v2.png', import.meta.url);

test('marketplace uses its own photographic header asset', () => {
  assert.equal(existsSync(image), true);
  assert.match(styles, /url\('\/images\/faithbid-marketplace-church-v2\.png'\)/);
  assert.doesNotMatch(styles, /faithbid-landing-church\.png/);
});

test('header search and category controls own existing live filter state', () => {
  assert.match(source, /search=\{search\}[\s\S]*onSearchChange=\{setSearch\}/);
  assert.match(source, /activeCategory=\{catFilter\}[\s\S]*onCategoryChange=\{setCatFilter\}/);
  assert.match(source, /activeCategory=\{category\}[\s\S]*onCategoryChange=\{setCategory\}/);
  assert.match(source, /onChange=\{\(event\) => onSearchChange\?\.\(event\.target\.value\)\}/);
  assert.match(source, /onClick=\{\(\) => onCategoryChange\?\.\(category\)\}/);
});

test('old duplicate search and category controls are suppressed in the scoped marketplace only', () => {
  assert.match(styles, /\.mkt2-root \.kb-vendor-toolbar \.kb-vendor-search/);
  assert.match(styles, /\.mkt2-root \.kbm-mp-toolbar \.kbm-mp-search/);
  assert.match(styles, /display:\s*none !important/);
});

test('new header remains responsive and keyboard-visible', () => {
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /\.mkt2-root \.mkt2-header__search:focus-within/);
  assert.match(source, /aria-label=\{isProjects \? 'Project categories' : 'Vendor categories'\}/);
});
