import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const no = (re, msg) => assert.ok(!re.test(app), msg);

no(/within a few hours/, 'no unsupported "first bid within a few hours" claim');
no(/average 6\+ bids/, 'no invented average-bids statistic');
no(/appear higher in search results, receive more bids/, 'no unsupported verification ranking claim');
no(/affect your ranking/, 'no unsupported review-ranking claim');
no(/reviews all disputes within 48 hours/, 'no unsupported dispute turnaround promise');
console.log('faq-truthfulness: ok');
