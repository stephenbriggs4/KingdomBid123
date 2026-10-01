import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../src/', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');

test('the application exposes exactly one main landmark', () => {
  const files = fs.readdirSync(root).filter(name => /\.(?:jsx|js)$/.test(name));
  const sources = files.map(name => [name, read(name)]);
  const openings = sources.flatMap(([name, source]) => [...source.matchAll(/^\s*<main\b/gm)].map(match => `${name}:${match.index + match[0].indexOf('<main')}`));
  const closings = sources.flatMap(([name, source]) => [...source.matchAll(/^\s*<\/main>/gm)].map(match => `${name}:${match.index + match[0].indexOf('</main>')}`));
  assert.deepEqual(openings, [`App.jsx:${read('App.jsx').indexOf('<main id="kb-main-content" role="main">')}`]);
  assert.equal(closings.length, 1);
});

test('the shared focus trap re-evaluates visible enabled controls on every Tab press', () => {
  const source = read('App.jsx');
  const start = source.indexOf('function useFocusTrap(active)');
  const end = source.indexOf('// ─────────────────────────────────────────────────────────────────────────────\n// KEYBOARD ACTIVATION HELPER', start);
  const hook = source.slice(start, end);
  assert.match(hook, /const getFocusable = \(\) => Array\.from/);
  assert.match(hook, /textarea:not\(\[disabled\]\)/);
  assert.match(hook, /getComputedStyle\(node\)/);
  assert.match(hook, /node\.getClientRects\(\)\.length > 0/);
  assert.match(hook, /function onKey\(e\)[\s\S]*const focusable = getFocusable\(\)/);
});

test('acquisition inputs have durable visible-label associations', () => {
  const waitlist = read('WaitlistScreen.jsx');
  for (const id of ['full-name', 'org-name', 'email', 'city', 'state', 'first-project', 'category', 'past-client']) {
    assert.match(waitlist, new RegExp(`htmlFor="kb-wl-${id}"`));
    assert.match(waitlist, new RegExp(`id="kb-wl-${id}"`));
  }
  assert.match(waitlist, /role="group" aria-label="How you deliver"/);
  assert.match(waitlist, /aria-pressed=\{active\}/);
  assert.match(waitlist, /aria-hidden="true"[\s\S]*id="kb-wl-secondary-detail"[\s\S]*tabIndex=\{-1\}/);
});

test('password reset form is gated by a real recovery session and link marker', () => {
  const account = read('AccountScreens.jsx');
  assert.match(account, /const \[recoveryState, setRecoveryState\] = useState\("checking"\)/);
  assert.match(account, /supabase\.auth\.getSession\(\)/);
  assert.match(account, /event === "PASSWORD_RECOVERY"/);
  assert.match(account, /hasRecoveryMarker && data\?\.session \? "valid" : "invalid"/);
  assert.match(account, /!done && recoveryState === "valid"/);
  assert.match(account, /This reset link is invalid or expired\./);
});
