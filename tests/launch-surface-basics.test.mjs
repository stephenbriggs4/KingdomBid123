import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('cold post-project links preserve their create-project intent', () => {
  assert.match(app, /if \(route === "post-project"\) return "projects"/);
  assert.match(app, /useState\(\(\) => isPostProjectHash\(window\.location\.hash\)\)/);
  assert.match(app, /autoPost:targetAutoPost/);
});

test('marketplace heading and location respect the signed-in role and profile', () => {
  assert.match(app, /isVendor \? 'Find work that fits your trade\.' : 'See what churches are building\.'/);
  assert.match(app, /userProfile\?\.city/);
  assert.match(app, /\{viewerLocation\}<\/span>/);
  assert.doesNotMatch(app, /mkt2-header__location[\s\S]{0,320}Dallas, TX<\/span>/);
});

test('zero unread messages do not render as an ambiguous count', () => {
  assert.match(app, /tab\.key !== 'messages' \|\| tab\.count > 0/);
  assert.match(app, /unread messages/);
});

test('workspace routes have distinct titles and reset scroll position', () => {
  assert.match(app, /navSubTab === 'mine'[\s\S]*?'My Projects — FaithBid'/);
  assert.match(app, /navSubTab === 'work'[\s\S]*?'My Work — FaithBid'/);
  assert.match(app, /window\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\)/);
  assert.match(app, /\[screen, navSubTab\]/);
});

test('cold unknown routes reach the 404 surface', () => {
  assert.match(app, /APP_HASH_ROUTE_SET\.has\(route\) \? route : "not-found"/);
  assert.match(app, /'not-found': 'Page Not Found — FaithBid'/);
  assert.match(app, />404<\/div>/);
  assert.match(app, />Page not found<\/div>/);
});

test('budget ranges use a visible en dash', () => {
  assert.match(app, /function formatBudgetRangeTypography/);
  assert.match(app, /'\$1–\$2'/);
  assert.match(app, /if \(entered\) return formatBudgetRangeTypography\(entered\)/);
});

test('document shell includes launch metadata', () => {
  assert.match(html, /rel="canonical" href="https:\/\/faithbid\.com\/"/);
  assert.match(html, /rel="manifest" href="\/site\.webmanifest"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /name="description"/);
});
