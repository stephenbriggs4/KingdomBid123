import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles/marketplace-v2.css', import.meta.url), 'utf8');

test('open project cards do not expose church identity before permission', () => {
  const projectMarketplace = source.slice(
    source.indexOf('function ProjectBoard('),
    source.indexOf('function ProjectWorkspacePanel('),
  );

  assert.match(projectMarketplace, /variant="marketplace"/);
  assert.doesNotMatch(projectMarketplace, /variant="marketplace"[\s\S]{0,420}avatarText=\{getInitialsSafe\([^)]*church/i);
  assert.ok((projectMarketplace.match(/avatarText="FB"/g) || []).length >= 3);
});

test('vendor cards only display ratings backed by review evidence', () => {
  const vendorCards = source.slice(
    source.indexOf('function MarketplaceVendorDirectoryCard'),
    source.indexOf('function AllVendorsLanding'),
  );

  assert.doesNotMatch(vendorCards, /vendor\.rating|reviewLabel|ratingLabel/);
});

test('verification and relationship states remain distinct on vendor cards', () => {
  const vendorCards = source.slice(
    source.indexOf('function getMarketplaceAvailabilityPresentation'),
    source.indexOf('function AllVendorsLanding'),
  );

  assert.match(vendorCards, /vendor\?\.verified === true/);
  assert.match(vendorCards, /> Faith Verified</);
  assert.match(vendorCards, /label:'In conversation'/);
  assert.match(vendorCards, /label:'Availability not confirmed'/);
  assert.doesNotMatch(vendorCards, />Verified</);
});

test('the redesigned card is scoped to marketplace pages', () => {
  assert.match(styles, /\.mkt2-root \.faithbid-card-11a--marketplace/);
  assert.match(styles, /background:\s*var\(--mkt2-surface\)/);
  assert.match(styles, /focus-visible/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
});
