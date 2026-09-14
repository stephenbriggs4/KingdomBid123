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

const requests = [...app.matchAll(/https:\/\/fonts\.googleapis\.com\/css2\?[^'"`)]+/g)].map((match) => match[0]);
assert.equal(requests.length, 1, `expected one Google Fonts request, found ${requests.length}`);
const families = [...requests[0].matchAll(/(?:\?|&)family=([^:&]+)/g)]
  .map((match) => decodeURIComponent(match[1].replaceAll('+', ' ')))
  .sort();
assert.deepEqual(families, ['DM Sans', 'Playfair Display'].sort());

assert.ok(rootCss.includes("--font-sans: 'DM Sans', system-ui, sans-serif;"));
assert.ok(rootCss.includes("--font-display: 'Playfair Display', Georgia, serif;"));
assert.ok(rootCss.includes('font-family: var(--font-sans);'));
assert.ok(rootCss.includes('font-family: var(--heading) !important;'));

const forbidden = [
  'Bebas Neue', 'Cormorant Garamond', 'DM Mono', 'DM Sans', 'Fraunces',
  'General Sans', 'Georgia', 'Inter', 'JetBrains Mono', 'Newsreader', 'Playfair Display',
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

console.log('B3 typography contract passed: exactly two network families, shared tokens, and no component hardcodes.');
