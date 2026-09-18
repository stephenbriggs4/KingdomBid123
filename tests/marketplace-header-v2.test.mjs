import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles/marketplace-v2.css', import.meta.url), 'utf8');
const image = new URL('../public/images/faithbid-marketplace-church-v2.png', import.meta.url);
const wordmark = new URL('../public/logos/faithbid-wordmark-black-v2.png', import.meta.url);

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

test('desktop header scales as one composition instead of collapsing into narrow monitor caps', () => {
  assert.match(styles, /\.mkt2-root \.mkt2-header__inner\s*\{[^}]*padding:[^;]*clamp\(80px, 9vw, 180px\)/s);
  assert.match(styles, /\.mkt2-root \.mkt2-header__topline\s*\{[^}]*width:\s*100%/s);
  assert.match(styles, /\.mkt2-root \.mkt2-header__search\s*\{[^}]*width:\s*min\(100%, 64vw, 1500px\)/s);
  assert.match(styles, /\.mkt2-root \.mkt2-categories\s*\{[^}]*width:\s*calc\(100% - clamp\(160px, 18vw, 360px\)\)[^}]*grid-template-columns:\s*repeat\(8, minmax\(110px, 1fr\)\)/s);
  assert.doesNotMatch(styles, /padding:\s*30px max\(32px, calc\(\(100vw - 1180px\) \/ 2\)\)/);
});

test('both marketplace hero headlines override the legacy left-aligned heading rule', () => {
  assert.match(styles, /\.mkt2-root \.mkt2-header__title\s*\{[^}]*text-align:\s*center !important;/s);
  assert.match(styles, /\.mkt2-root \.mkt2-header__support\s*\{[^}]*text-align:\s*center !important;/s);
});

test('authenticated navigation and sign-in use the approved wordmark-only asset', () => {
  assert.equal(existsSync(wordmark), true);
  assert.match(source, /FAITHBID_LOGO_WORDMARK = "\/logos\/faithbid-wordmark-black-v2\.png"/);
  assert.match(source, /<CrossLogo size=\{\d+\} variant="wordmark" \/>/);
  assert.match(source, /className="fb-auth-brand"[\s\S]*?<CrossLogo size=\{34\} variant="wordmark" \/>/);
});
