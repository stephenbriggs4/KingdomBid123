import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourceUrl = new URL('../src/App.jsx', import.meta.url);

test('numeric marketplace ratings require underlying review evidence', async () => {
  const source = await readFile(sourceUrl, 'utf8');

  assert.match(source, /function getEvidenceBackedRating\(rating, reviewCount\)/);
  assert.match(source, /count > 0 && value >= 1 && value <= 5 \? value : null/);
  assert.doesNotMatch(source, /rating:\s*v\.rating\s*\|\|\s*5\.0/);
  assert.doesNotMatch(source, /rating:\s*["']5\.0["']/);
  assert.doesNotMatch(source, /reviews\.length\s*>\s*0[\s\S]{0,180}:\s*["']5\.0["']/);
  assert.match(source, /stats\.reviewCount > 0 && stats\.rating/);
  assert.match(source, /value:\s*safeReviews\.length \? avgRatingNum\.toFixed\(1\) : ["']—["']/);
});

test('public vendor intake exposes both Dallas pilot service categories', async () => {
  const source = await readFile(sourceUrl, 'utf8');

  assert.match(source, /marketplaceLabel:["']Cleaning \/ Janitorial["']/);
  assert.match(source, /marketplaceLabel:["']Landscaping \/ Grounds["']/);
  assert.match(source, /LOCAL_FIRST_CATEGORIES = new Set\(\[[\s\S]*["']Cleaning \/ Janitorial["'][\s\S]*["']Landscaping \/ Grounds["']/);
});
