import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourceUrl = new URL('../src/App.jsx', import.meta.url);
const reviewsScreenUrl = new URL('../src/ReviewsScreen.jsx', import.meta.url);

test('numeric marketplace ratings require underlying review evidence', async () => {
  const source = await readFile(sourceUrl, 'utf8');
  // R-65 (2026-09-29): the rating-display logic this last assertion checked
  // moved to the split ReviewsScreen.jsx file (same evidence-based
  // guarantee -- never renders a numeric rating without a real review
  // count -- just relocated when Reviews became its own lazy-loaded module).
  const reviewsScreen = await readFile(reviewsScreenUrl, 'utf8');

  assert.match(source, /function getEvidenceBackedRating\(rating, reviewCount\)/);
  assert.match(source, /count > 0 && value >= 1 && value <= 5 \? value : null/);
  assert.doesNotMatch(source, /rating:\s*v\.rating\s*\|\|\s*5\.0/);
  assert.doesNotMatch(source, /rating:\s*["']5\.0["']/);
  assert.doesNotMatch(source, /reviews\.length\s*>\s*0[\s\S]{0,180}:\s*["']5\.0["']/);
  assert.match(source, /stats\.reviewCount > 0 && stats\.rating/);
  assert.match(reviewsScreen, /reviews\.length \? reviewStats\.avgRatingNum\.toFixed\(1\) : ["']—["']/);
});

test('public vendor intake exposes both Dallas pilot service categories', async () => {
  const source = await readFile(sourceUrl, 'utf8');

  assert.match(source, /marketplaceLabel:["']Cleaning \/ Janitorial["']/);
  assert.match(source, /marketplaceLabel:["']Landscaping \/ Grounds["']/);
  assert.match(source, /LOCAL_FIRST_CATEGORIES = new Set\(\[[\s\S]*["']Cleaning \/ Janitorial["'][\s\S]*["']Landscaping \/ Grounds["']/);
});
