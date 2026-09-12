import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const reviewsSource = readFileSync(new URL('../src/ReviewsScreen.jsx', import.meta.url), 'utf8');

test('review summary metrics render once instead of repeating in hero cards and sidebar', () => {
  assert.match(appSource, /heroStrip:\s*\[/);
  assert.doesNotMatch(appSource, /heroCards:\s*\[/);
  assert.doesNotMatch(appSource, /sidebarSummary:\s*\[/);
  assert.doesNotMatch(reviewsSource, /reviewStats\.heroCards/);
  assert.doesNotMatch(reviewsSource, /stats\?\.sidebarSummary/);
});

test('the unique overall rating remains visible alongside the review ledger', () => {
  assert.match(reviewsSource, />Overall rating</);
  assert.match(reviewsSource, />Rating breakdown</);
  assert.match(reviewsSource, />Common themes</);
});
