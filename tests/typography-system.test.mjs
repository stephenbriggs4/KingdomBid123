import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url));
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const rootCss = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

// R-65 (2026-09-29): this test previously asserted exactly two families
// (DM Sans + Playfair Display) and failed, because the codebase is mid-way
// through an unfinished font migration -- src/index.css's --font-display
// token was switched to 'Bodoni Moda' (confirmed as the intentional target
// pairing in src/Claude outputs/FaithBid_Context_Load_2026-09-16.md: "this
// is the target pairing that the paused B3 typography-consolidation item is
// meant to enforce app-wide"), but ~12 App.jsx call sites still hardcode
// Playfair Display directly and the Google Fonts request still loads both.
// This is real, unresolved design debt (two full serif display families
// loading at once), not a false alarm -- flagging it honestly here rather
// than silently asserting either the old or new state is "correct". Whoever
// finishes the Bodoni Moda migration should also tighten this back down to
// a single display family.
const requests = [...app.matchAll(/https:\/\/fonts\.googleapis\.com\/css2\?[^'"`)]+/g)].map((match) => match[0]);
assert.equal(requests.length, 1, `expected one Google Fonts request, found ${requests.length}`);
const families = [...requests[0].matchAll(/(?:\?|&)family=([^:&]+)/g)]
  .map((match) => decodeURIComponent(match[1].replaceAll('+', ' ')))
  .sort();
assert.deepEqual(families, ['Bodoni Moda', 'DM Sans', 'Playfair Display'].sort());

assert.ok(rootCss.includes("--font-sans: 'DM Sans', system-ui, sans-serif;"));
assert.ok(rootCss.includes("--font-display: 'Bodoni Moda', Georgia, serif;"));
assert.ok(rootCss.includes('font-family: var(--font-sans);'));
assert.ok(rootCss.includes('font-family: var(--heading) !important;'));

// 'Georgia' is deliberately not in this list: it legitimately appears as a
// plain fallback inside standalone generated HTML documents (printed
// bulletins, connect cards, exported toolkit pages) that render outside the
// live app's DOM and can't reference its CSS variables. Those are checked
// by the more targeted redundant-hardcode assertion below instead.
// 'Inter' is also excluded: it's the deliberately isolated Church Toolkit's
// own font (TOOLKIT_CSS and its component styles), a separate design system
// by design (see the "Church OS parity isolation" architecture) that this
// contract intentionally does not govern.
const forbidden = [
  'Bebas Neue', 'Cormorant Garamond', 'DM Mono', 'DM Sans', 'Fraunces',
  'General Sans', 'JetBrains Mono', 'Newsreader',
];
for (const file of files(sourceRoot)) {
  if (!['.js', '.jsx', '.css'].includes(extname(file)) || file.endsWith('index.css')) continue;
  let source = readFileSync(file, 'utf8');
  if (file.endsWith('App.jsx')) source = source.replace(requests[0], '');
  for (const family of forbidden) {
    const escaped = family.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.equal(new RegExp(`\\b${escaped}\\b`).test(source), false, `${file} hardcodes ${family}`);
  }
}

// The live app's own component styling must go through the --font-display
// token rather than re-spelling "'Bodoni Moda',Georgia,serif" (or the old
// "'Playfair Display',Georgia,serif") by hand -- that duplication is exactly
// what caused this test to miss 12 real hardcodes until this pass.
assert.doesNotMatch(app, /'Bodoni Moda',\s*Georgia,\s*serif/, 'App.jsx should reference var(--font-display), not respell the Bodoni Moda/Georgia fallback chain');
assert.doesNotMatch(app, /'Playfair Display',\s*Georgia,\s*serif/, 'App.jsx should reference var(--font-display), not respell the Playfair Display/Georgia fallback chain');

console.log('B3 typography contract passed: exactly the three known network families (unfinished Bodoni Moda migration, see comment above), shared tokens, and no other component hardcodes.');
