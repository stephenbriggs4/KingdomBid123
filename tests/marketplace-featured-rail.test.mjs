import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
assert.match(src, /const showFeaturedProjectRail = featuredProjectRows\.length >= 3;/, 'Featured rail hides when it would only repeat one or two projects');
console.log('marketplace-featured-rail: ok');
